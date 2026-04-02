#!/usr/bin/env tsx
/**
 * Seed 230 bénéficiaires en attente de prise en charge
 * Garde les structures et conseillers existants
 * Usage: DATABASE_URL=postgres://... npx tsx scripts/seed-beneficiaires-230.ts
 */

import { Pool } from 'pg'
import { v4 as uuidv4 } from 'uuid'

const pgUrl = process.env.DATABASE_URL
if (!pgUrl) { console.error('DATABASE_URL required'); process.exit(1) }

const pool = new Pool({ connectionString: pgUrl })

// Helper : query simplifiée
async function q(sql: string, params: unknown[] = []) {
  const res = await pool.query(sql, params)
  return res.rows
}

// --- Données réalistes ---

const PRENOMS_F = ['Emma','Chloé','Jade','Léa','Amina','Yasmine','Sarah','Inès','Lina','Océane','Sofia','Nour','Mélissa','Clara','Alice','Manon','Camille','Zoé','Lucie','Julie','Nina','Eva','Anaïs','Maëlys','Romane','Margot','Laura','Pauline','Charlotte','Marie']
const PRENOMS_M = ['Lucas','Karim','Sofiane','Maxime','Nathan','Mehdi','Théo','Kylian','Raphaël','Enzo','Hugo','Adam','Noah','Louis','Ethan','Rayan','Yanis','Tom','Gabriel','Sacha','Jules','Léo','Arthur','Mathis','Paul','Antoine','Victor','Axel','Wassim','Ibrahim']
const SITUATIONS = ['lyceen','etudiant','decrocheur','en_recherche','en_formation','neet','service_civique','alternance']
const DEPARTEMENTS = ['75','92','93','94','69','13','31','33','59','44','67','06','34','35','38','42','54','57','62','76','29','56','49','37','21','25','14','17','86','87','45','18','36','03','63','15','43','07','26','30','11','66','64','40','47','24','19','23','16','79','85','72','53','61','50','27','28','41','10','51','08','02','60','80','71','58','89','52','55','88','70','39','90','68','01','73','74','05','04','83','84','2A','2B']
const GENRES = ['M','F','NB']
const SOURCES = ['direct','prescripteur','qrcode','parcoureo']

// Conversations réalistes (messages user/assistant)
const CONV_TEMPLATES = [
  [
    { role: 'assistant', contenu: "Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?" },
    { role: 'user', contenu: "Salut, ouais je sais pas trop quoi faire après le bac" },
    { role: 'assistant', contenu: "Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?" },
    { role: 'user', contenu: "J'aime bien aider les gens je pense, et aussi un peu créer des choses" },
    { role: 'assistant', contenu: "Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?" },
    { role: 'user', contenu: "Les arts plastiques et la SVT surtout" },
  ],
  [
    { role: 'assistant', contenu: "Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?" },
    { role: 'user', contenu: "Bof, je suis un peu perdu en ce moment" },
    { role: 'assistant', contenu: "Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?" },
    { role: 'user', contenu: "Rien, j'ai lâché ma formation il y a 3 mois" },
    { role: 'assistant', contenu: "OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?" },
    { role: 'user', contenu: "C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens" },
    { role: 'assistant', contenu: "Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?" },
    { role: 'user', contenu: "Ouais, j'aimerais bien trouver un truc qui me plaît" },
  ],
  [
    { role: 'assistant', contenu: "Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?" },
    { role: 'user', contenu: "Oui ! Je veux changer de filière" },
    { role: 'assistant', contenu: "Tu es dans quelle filière actuellement ?" },
    { role: 'user', contenu: "BTS comptabilité mais c'est vraiment pas fait pour moi" },
    { role: 'assistant', contenu: "OK ! Et qu'est-ce qui te plairait davantage ?" },
    { role: 'user', contenu: "Le numérique, le développement web, ce genre de trucs" },
  ],
  [
    { role: 'assistant', contenu: "Bienvenue ! Je suis ton assistant orientation. On commence ?" },
    { role: 'user', contenu: "Je cherche un apprentissage pour la rentrée" },
    { role: 'assistant', contenu: "Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?" },
    { role: 'user', contenu: "La cuisine ou la pâtisserie" },
    { role: 'assistant', contenu: "Génial ! Tu as déjà de l'expérience en cuisine ?" },
    { role: 'user', contenu: "Un peu, j'ai fait un stage de 2 semaines dans un restaurant" },
    { role: 'assistant', contenu: "Super ! Et ça t'a plu ?" },
    { role: 'user', contenu: "Grave, c'était intense mais j'ai adoré" },
    { role: 'assistant', contenu: "Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !" },
  ],
  [
    { role: 'assistant', contenu: "Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?" },
    { role: 'user', contenu: "Mes parents veulent que je fasse médecine mais moi non" },
    { role: 'assistant', contenu: "C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?" },
    { role: 'user', contenu: "Le journalisme ou la communication" },
  ],
]

const FRAGILITY_LEVELS = ['none','none','none','none','none','low','low','low','medium','high']
const PRIORITES = ['normale','normale','normale','normale','haute','haute','critique']
const MOTIFS_MAP: Record<string, string> = {
  critique: 'Détresse détectée — orientation urgente',
  haute: 'Fragilité modérée — accompagnement recommandé',
  normale: 'Demande d\'accompagnement',
}
const RESUMES = [
  "Lycéen(ne) en terminale, hésitant(e) sur l'orientation post-bac. Intérêt pour les métiers créatifs et le social.",
  "Décrocheur/se depuis 3 mois, en perte de motivation. Besoin d'un accompagnement pour se remobiliser.",
  "Étudiant(e) en réorientation, insatisfait(e) de sa filière actuelle. Attiré(e) par le numérique.",
  "Jeune en recherche d'apprentissage dans les métiers de bouche. Motivé(e) et avec une première expérience de stage.",
  "Conflit familial sur le choix d'orientation. Besoin d'un espace neutre pour construire son projet.",
  "NEET depuis 6 mois, isolement social. Intérêt pour le sport et l'animation.",
  "En service civique, cherche une suite. Profil social et engagé.",
  "Sortie de formation sans diplôme, besoin de remobilisation et de confiance en soi.",
  "Lycéen(ne) en seconde, premier contact avec l'orientation. Curieux/se mais indécis(e).",
  "Jeune parent, cherche une formation courte compatible avec ses contraintes.",
  "Passionné(e) de gaming/tech, cherche à transformer sa passion en métier.",
  "En alternance mais souhaite changer de voie. Besoin de conseil.",
]

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min }

function randomDate(hoursAgo: number): string {
  return new Date(Date.now() - hoursAgo * 3600 * 1000 + Math.random() * 3600000).toISOString()
}

async function main() {
  console.log('🧹 Nettoyage des bénéficiaires existants...')

  // Supprimer dans l'ordre des FK (enfants d'abord)
  const tables = [
    'alerte_decrochage', 'objectif_hebdomadaire', 'declaration_activite', 'categorie_activite',
    'bris_de_glace', 'rendez_vous', 'evenement_journal',
    'demande_consentement', 'participant_conversation', 'tiers_intervenant',
    'message_direct', 'enquete_satisfaction', 'rappel',
    'code_verification', 'prise_en_charge',
    'referral',
    'indice_confiance', 'profil_riasec', 'instantane_profil',
    'message', 'conversation',
    'session_magic_link', 'evenement_quiz',
    'push_subscription',
    'utilisateur',
  ]
  for (const t of tables) {
    try {
      await q(`TRUNCATE TABLE "${t}" CASCADE`)
      console.log(`  - ${t} vidée`)
    } catch { /* table might not exist */ }
  }

  // Charger les structures existantes
  const structures = await q('SELECT id, nom, departements FROM structure WHERE actif = 1')
  console.log(`\n📦 ${structures.length} structures actives conservées`)

  const now = new Date().toISOString()
  const NB = 230
  let sourcees = 0
  let generiques = 0

  console.log(`\n🌱 Création de ${NB} bénéficiaires...`)

  for (let i = 0; i < NB; i++) {
    const isFemale = Math.random() > 0.5
    const prenom = isFemale ? rand(PRENOMS_F) : rand(PRENOMS_M)
    const genre = isFemale ? 'F' : (Math.random() > 0.9 ? 'NB' : 'M')
    const age = randInt(15, 25)
    const situation = rand(SITUATIONS)
    const dept = rand(DEPARTEMENTS)
    const source = rand(SOURCES)
    const prenomSlug = prenom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    // Contact
    const hasEmail = Math.random() > 0.3
    const email = hasEmail ? `${prenomSlug}${randInt(1, 999)}@email.com` : null
    const telephone = !hasEmail ? `06${String(randInt(10000000, 99999999))}` : null
    const typeContact = hasEmail ? 'email' : 'telephone'
    const moyenContact = email || telephone

    // Dates
    const heuresPassees = randInt(2, 480) // entre 2h et 20 jours
    const creeLe = randomDate(heuresPassees)

    // Utilisateur
    const userId = uuidv4()
    await q(
      `INSERT INTO utilisateur (id, prenom, email, telephone, age, situation, source, plateforme, cree_le, mis_a_jour_le) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [userId, prenom, email, telephone, age, situation, source, rand(['web','web','web','pwa']), creeLe, now]
    )

    // Conversation + messages
    const convId = uuidv4()
    const template = rand(CONV_TEMPLATES)
    await q(
      `INSERT INTO conversation (id, utilisateur_id, titre, statut, origine, nb_messages, phase, duree_secondes, cree_le, mis_a_jour_le) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [convId, userId, `Conversation de ${prenom}`, 'active', 'direct', template.length, rand(['accroche','exploration','projection']), template.length * 120 + randInt(30, 300), creeLe, now]
    )

    for (let mi = 0; mi < template.length; mi++) {
      const msgTime = new Date(new Date(creeLe).getTime() + mi * 60000 + Math.random() * 30000).toISOString()
      await q(
        `INSERT INTO message (id, conversation_id, role, contenu, fragilite_detectee, horodatage) VALUES ($1,$2,$3,$4,$5,$6)`,
        [uuidv4(), convId, template[mi].role, template[mi].contenu, 0, msgTime]
      )
    }

    // Profil RIASEC
    const riasec = { r: randInt(0, 10), i: randInt(0, 10), a: randInt(0, 10), s: randInt(0, 10), e: randInt(0, 10), c: randInt(0, 10) }
    const dims = Object.entries(riasec).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0].toUpperCase())
    await q(
      `INSERT INTO profil_riasec (id, utilisateur_id, r, i, a, s, e, c, dimensions_dominantes, source, est_stable, mis_a_jour_le) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [uuidv4(), userId, riasec.r, riasec.i, riasec.a, riasec.s, riasec.e, riasec.c, JSON.stringify(dims), 'conversation', randInt(0, 1), now]
    )

    // Indice de confiance
    const score = +(Math.random() * 0.8 + 0.1).toFixed(2)
    await q(
      `INSERT INTO indice_confiance (id, utilisateur_id, score_global, niveau, volume, stabilite, differenciation, coherence, nb_messages, nb_instantanes, mis_a_jour_le) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [uuidv4(), userId, score, score > 0.7 ? 'confirme' : score > 0.4 ? 'en_cours' : 'debut',
       +(Math.random() * 0.8 + 0.1).toFixed(2), +(Math.random() * 0.8 + 0.1).toFixed(2),
       +(Math.random() * 0.8 + 0.1).toFixed(2), +(Math.random() * 0.8 + 0.1).toFixed(2),
       template.length, Math.floor(template.length / 3), now]
    )

    // Referral — 70% sourcée (attribuée à une structure), 30% générique (hors structure)
    const isSourcee = Math.random() < 0.7 && structures.length > 0
    const priorite = rand(PRIORITES)
    const niveauDetection = priorite === 'critique' ? 3 : priorite === 'haute' ? 2 : 1
    const targetStructure = isSourcee ? rand(structures) : null

    const referralId = uuidv4()
    await q(
      `INSERT INTO referral (id, utilisateur_id, conversation_id, priorite, niveau_detection, motif, resume_conversation, moyen_contact, type_contact, statut, source, campagne_id, structure_suggeree_id, localisation, genre, age_beneficiaire, cree_le, mis_a_jour_le)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      [referralId, userId, convId, priorite, niveauDetection,
       MOTIFS_MAP[priorite] || 'Demande d\'accompagnement',
       rand(RESUMES),
       moyenContact, typeContact,
       'en_attente',
       isSourcee ? 'sourcee' : 'generique',
       null,
       targetStructure?.id || null,
       dept, genre, age, creeLe, now]
    )

    if (isSourcee) sourcees++; else generiques++

    if ((i + 1) % 50 === 0) console.log(`  ... ${i + 1}/${NB}`)
  }

  console.log(`\n✅ ${NB} bénéficiaires créés`)
  console.log(`  - ${sourcees} sourcées (attribuées à une structure)`)
  console.log(`  - ${generiques} génériques (hors structure)`)

  await pool.end()
  process.exit(0)
}

main().catch(err => { console.error('💥', err); process.exit(1) })
