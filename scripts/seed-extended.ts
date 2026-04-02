// Script de seed étendu — Ajoute ~40 bénéficiaires supplémentaires + 9 conseillers + 3 structures
// S'ajoute aux données existantes, ne supprime rien
// Usage : npx tsx scripts/seed-extended.ts

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import * as schema from '../src/data/schema'

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://catchup:CatchUp2026Pg!@localhost:5432/catchup' })
const db = drizzle(pool, { schema })

const hash = (pw: string) => bcrypt.hashSync(pw, 12)
const now = () => new Date().toISOString()
const ago = (hours: number) => new Date(Date.now() - hours * 3600000).toISOString()
const PASSWORD = hash('catchup2026')

// ── 3 nouvelles structures ──
const NEW_STRUCTURES = [
  { nom: 'Mission Locale Strasbourg',  type: 'mission_locale', deps: ['67','68'],  region: 'grand-est',     ageMin: 16, ageMax: 25, spes: ['insertion','emploi','logement'],       cap: 40 },
  { nom: 'CIO Rennes',                 type: 'cio',            deps: ['35','22'],  region: 'bretagne',      ageMin: 14, ageMax: 25, spes: ['orientation','reorientation'],         cap: 30 },
  { nom: 'Mission Locale Grenoble',    type: 'mission_locale', deps: ['38','73'],  region: 'auvergne-rhone-alpes', ageMin: 16, ageMax: 25, spes: ['insertion','emploi','decrochage'], cap: 35 },
]

// ── 9 nouveaux conseillers ──
const NEW_CONSEILLERS = [
  // ML Strasbourg (new struct 0)
  { email: 'sylvie.muller@ml-strasbourg.fr',     prenom: 'Sylvie',    nom: 'Muller',     role: 'admin_structure', structIdx: 0 },
  { email: 'pierre.schneider@ml-strasbourg.fr',  prenom: 'Pierre',    nom: 'Schneider',  role: 'conseiller',      structIdx: 0 },
  { email: 'fatima.benali@ml-strasbourg.fr',      prenom: 'Fatima',    nom: 'Benali',     role: 'conseiller',      structIdx: 0 },
  // CIO Rennes (new struct 1)
  { email: 'yann.legall@cio-rennes.fr',          prenom: 'Yann',      nom: 'Le Gall',    role: 'admin_structure', structIdx: 1 },
  { email: 'marine.kerouac@cio-rennes.fr',       prenom: 'Marine',    nom: 'Kérouac',    role: 'conseiller',      structIdx: 1 },
  // ML Grenoble (new struct 2)
  { email: 'david.perrin@ml-grenoble.fr',        prenom: 'David',     nom: 'Perrin',      role: 'admin_structure', structIdx: 2 },
  { email: 'amina.diallo@ml-grenoble.fr',        prenom: 'Amina',     nom: 'Diallo',      role: 'conseiller',      structIdx: 2 },
  { email: 'lucas.fontaine@ml-grenoble.fr',      prenom: 'Lucas',     nom: 'Fontaine',    role: 'conseiller',      structIdx: 2 },
  // Conseiller supplémentaire ML Nantes (existante, structIdx = -1 → on résoudra)
  { email: 'elise.robert@ml-nantes.fr',          prenom: 'Élise',     nom: 'Robert',      role: 'conseiller',      structIdx: -1 },
]

// ── 40 nouveaux bénéficiaires ──
const PRENOMS_M = ['Enzo','Noah','Mehdi','Yanis','Adam','Hugo','Nathan','Théo','Amine','Ilyes','Dylan','Kylian','Mathis','Axel','Sacha','Ibrahim','Tom','Nolan','Rayan','Gabin']
const PRENOMS_F = ['Jade','Léna','Chloé','Inaya','Manon','Clara','Zoé','Camille','Sarah','Amira','Lina','Maëlle','Noémie','Alicia','Yasmine','Margot','Juliette','Océane','Eva','Nina']
const SITUATIONS = ['lyceen','decrocheur','etudiant','demandeur_emploi','alternant','neet','service_civique']
const DEPS = ['75','92','93','94','69','13','59','33','31','44','67','35','38','06','34','76','57','45','21','29']
const PHASES = ['accroche','decouverte','exploration','projection','action']
const PRIORITES = ['normale','normale','normale','haute','haute','critique'] as const
const MOTIFS = [
  'Décrochage scolaire, recherche d\'orientation',
  'Hésitation post-bac, besoin de conseil Parcoursup',
  'Recherche d\'alternance, pas de réseau',
  'Difficultés familiales impactant le parcours scolaire',
  'Réorientation après échec en L1',
  'NEET depuis 6 mois, isolement social',
  'Besoin d\'aide pour les démarches administratives',
  'Stress intense lié à l\'orientation',
  'Découverte des métiers, aucune idée de carrière',
  'Situation de handicap, besoin d\'accompagnement spécialisé',
  'Envie d\'entreprendre mais pas de soutien',
  'Conflit avec les parents sur le choix d\'études',
  'Précarité financière, recherche de solutions',
  'Harcèlement scolaire, changement d\'établissement',
  'Expatriation récente, intégration difficile',
]

const RESUMES = [
  (p: string, a: number) => `${p}, ${a} ans, en situation de décrochage scolaire. A exprimé un intérêt pour les métiers manuels et techniques. Conversation constructive, le jeune est motivé mais manque de repères.`,
  (p: string, a: number) => `${p}, ${a} ans, lycéen(ne) en questionnement sur son orientation post-bac. Profil bien défini, hésite entre plusieurs filières. A besoin d'aide pour prioriser ses choix.`,
  (p: string, a: number) => `${p}, ${a} ans, en recherche d'emploi depuis plusieurs mois. A évoqué des difficultés financières et un sentiment d'isolement. Souhaite un accompagnement rapide.`,
  (p: string, a: number) => `${p}, ${a} ans, souhaite se réorienter après une première année universitaire difficile. Profil atypique, intéressé(e) par des voies alternatives. Conversation riche et ouverte.`,
  (p: string, a: number) => `${p}, ${a} ans, jeune en grande fragilité émotionnelle. A évoqué des tensions familiales et un mal-être profond. Orientation vers un accompagnement social prioritaire.`,
]

const CONVERSATIONS_TEMPLATES = [
  // Template court (4 messages)
  [
    { role: 'assistant', contenu: 'Salut ! Moi c\'est Catch\'Up, je suis là pour t\'aider à trouver ta voie. Qu\'est-ce qui t\'amène ici ?' },
    { role: 'user', contenu: 'Salut, je sais pas trop quoi faire après le lycée, je suis un peu perdu' },
    { role: 'assistant', contenu: 'C\'est normal de se poser des questions à ce stade ! Dis-moi, qu\'est-ce que tu aimes faire quand tu as du temps libre ?' },
    { role: 'user', contenu: 'J\'aime bien le sport et les jeux vidéo, et j\'aide souvent mes potes quand ils ont des problèmes' },
  ],
  // Template moyen (6 messages)
  [
    { role: 'assistant', contenu: 'Hey ! Bienvenue sur Catch\'Up 🚀 Je suis là pour discuter avec toi de ton avenir. Comment ça va ?' },
    { role: 'user', contenu: 'Bof, pas super. J\'ai arrêté les cours et mes parents sont sur mon dos' },
    { role: 'assistant', contenu: 'Je comprends, c\'est une période compliquée. Tu as arrêté récemment ? Tu étais dans quel type de formation ?' },
    { role: 'user', contenu: 'J\'étais en BEP mais ça me plaisait pas du tout. Trop de théorie, pas assez de pratique' },
    { role: 'assistant', contenu: 'D\'accord, tu es quelqu\'un qui préfère apprendre en faisant. C\'est une vraie qualité ! Qu\'est-ce qui te branche comme activités ?' },
    { role: 'user', contenu: 'La cuisine, j\'adore ça. Je cuisine tous les jours chez moi. Et j\'aimerais bien avoir mon resto un jour' },
  ],
  // Template long (10 messages)
  [
    { role: 'assistant', contenu: 'Salut ! Je suis Catch\'Up, ton assistant orientation. On discute un peu ? 😊' },
    { role: 'user', contenu: 'Ok, je veux bien. On m\'a dit que ça pouvait m\'aider' },
    { role: 'assistant', contenu: 'Super ! Pour commencer, tu es en quelle situation en ce moment ? Tu es au lycée, en recherche d\'emploi... ?' },
    { role: 'user', contenu: 'Je suis en terminale mais j\'ai aucune idée de ce que je veux faire. Tout le monde me met la pression' },
    { role: 'assistant', contenu: 'La pression, ça peut être difficile à gérer. Tu n\'es pas obligé(e) d\'avoir toutes les réponses maintenant. Parlons plutôt de ce qui te fait vibrer dans la vie ?' },
    { role: 'user', contenu: 'J\'aime aider les gens. Genre quand quelqu\'un va pas bien, je suis toujours là. Et j\'aime aussi les sciences' },
    { role: 'assistant', contenu: 'C\'est super intéressant ! L\'envie d\'aider les autres combinée aux sciences, ça ouvre plein de possibilités. Tu as déjà pensé au domaine médical ou paramédical ?' },
    { role: 'user', contenu: 'Oui un peu, mais mes notes sont pas terribles en maths. Du coup je me dis que c\'est pas pour moi' },
    { role: 'assistant', contenu: 'Il y a beaucoup de métiers dans le soin et l\'accompagnement qui ne demandent pas forcément un niveau élevé en maths. Infirmier, éducateur spécialisé, aide-soignant... Tu veux qu\'on en parle ?' },
    { role: 'user', contenu: 'Oui carrément ! Éducateur spécialisé ça me parle bien en fait' },
  ],
  // Template avec fragilité (8 messages)
  [
    { role: 'assistant', contenu: 'Bonjour, je suis Catch\'Up. Comment est-ce que tu te sens aujourd\'hui ?' },
    { role: 'user', contenu: 'Pas bien du tout. J\'en ai marre de tout' },
    { role: 'assistant', contenu: 'Je suis désolé que tu traverses un moment difficile. Tu veux bien m\'en dire un peu plus sur ce qui ne va pas ?' },
    { role: 'user', contenu: 'Mes parents veulent que je fasse médecine mais moi j\'aime le dessin. Ils comprennent rien' },
    { role: 'assistant', contenu: 'C\'est vraiment frustrant quand on sent qu\'on n\'est pas compris par sa famille, surtout sur quelque chose d\'aussi important que son avenir. Le dessin, c\'est ta passion ?' },
    { role: 'user', contenu: 'Oui c\'est la seule chose qui me fait du bien. Mais j\'ai l\'impression que ça sert à rien' },
    { role: 'assistant', contenu: 'Le dessin, c\'est loin d\'être inutile. Il y a plein de métiers créatifs qui recrutent : graphisme, illustration, game design, architecture... Et tes sentiments sont valides. Si tu le souhaites, un conseiller pourrait t\'aider à construire un projet qui te ressemble.' },
    { role: 'user', contenu: 'Oui je veux bien parler à quelqu\'un qui comprend' },
  ],
]

const RIASEC_PROFILES = [
  { r: 80, i: 30, a: 20, s: 40, e: 55, c: 25, dom: ['R','E'], traits: ['concret','débrouillard'], interets: ['bricolage','mécanique'], forces: ['manuel','endurant'] },
  { r: 25, i: 70, a: 40, s: 50, e: 30, c: 55, dom: ['I','C'], traits: ['analytique','curieux'], interets: ['sciences','informatique'], forces: ['logique','rigueur'] },
  { r: 15, i: 30, a: 85, s: 60, e: 25, c: 20, dom: ['A','S'], traits: ['créatif','sensible'], interets: ['dessin','musique','écriture'], forces: ['imagination','empathie'] },
  { r: 30, i: 25, a: 40, s: 80, e: 45, c: 35, dom: ['S','E'], traits: ['empathique','altruiste'], interets: ['aide aux autres','éducation'], forces: ['écoute','communication'] },
  { r: 45, i: 35, a: 25, s: 30, e: 75, c: 40, dom: ['E','R'], traits: ['ambitieux','leader'], interets: ['commerce','entrepreneuriat'], forces: ['charisme','persévérance'] },
  { r: 20, i: 45, a: 30, s: 35, e: 40, c: 80, dom: ['C','I'], traits: ['organisé','méthodique'], interets: ['comptabilité','administration'], forces: ['précision','fiabilité'] },
  { r: 60, i: 50, a: 35, s: 55, e: 30, c: 40, dom: ['R','S'], traits: ['patient','observateur'], interets: ['nature','animaux','santé'], forces: ['dextérité','persévérance'] },
  { r: 35, i: 65, a: 70, s: 40, e: 50, c: 25, dom: ['A','I'], traits: ['innovant','indépendant'], interets: ['technologie','design','musique'], forces: ['créativité','autodidacte'] },
  { r: 50, i: 40, a: 30, s: 65, e: 70, c: 35, dom: ['E','S'], traits: ['sociable','dynamique'], interets: ['sport','animation','événementiel'], forces: ['énergie','organisation'] },
  { r: 40, i: 75, a: 45, s: 30, e: 35, c: 60, dom: ['I','C'], traits: ['perfectionniste','réfléchi'], interets: ['mathématiques','programmation'], forces: ['concentration','analyse'] },
]

async function seed() {
  console.log('🌱 Seed étendu — Ajout de données supplémentaires...\n')

  const t = now()

  // ── Structures ──
  const structureIds: string[] = []
  for (const s of NEW_STRUCTURES) {
    const id = uuidv4()
    try {
      // Check if exists
      const existing = await client.execute(`SELECT id FROM structure WHERE nom = '${s.nom.replace(/'/g, "''")}' LIMIT 1`)
      if (existing.rows.length > 0) {
        structureIds.push(existing.rows[0].id as string)
        console.log(`  ⏭️  Structure existante : ${s.nom}`)
        continue
      }
      await db.insert(schema.structure).values({
        id, nom: s.nom, type: s.type,
        departements: JSON.stringify(s.deps),
        regions: JSON.stringify([s.region]),
        ageMin: s.ageMin, ageMax: s.ageMax,
        specialites: JSON.stringify(s.spes),
        capaciteMax: s.cap, actif: 1,
        creeLe: t, misAJourLe: t,
      })
      structureIds.push(id)
      console.log(`  ✅ Structure : ${s.nom}`)
    } catch { structureIds.push(id); console.log(`  ⚠️  Structure (skip) : ${s.nom}`) }
  }

  // Récupérer l'ID de ML Nantes pour le dernier conseiller
  const nantesRows = await client.execute("SELECT id FROM structure WHERE nom LIKE '%Nantes%' LIMIT 1")
  const nantesId = nantesRows.rows[0]?.id as string || structureIds[0]

  // ── Conseillers ──
  const conseillerIds: string[] = []
  for (const c of NEW_CONSEILLERS) {
    const id = uuidv4()
    try {
      const existing = await client.execute(`SELECT id FROM conseiller WHERE email = '${c.email}' LIMIT 1`)
      if (existing.rows.length > 0) {
        conseillerIds.push(existing.rows[0].id as string)
        console.log(`  ⏭️  Conseiller existant : ${c.prenom} ${c.nom}`)
        continue
      }
      const structId = c.structIdx === -1 ? nantesId : structureIds[c.structIdx]
      await db.insert(schema.conseiller).values({
        id, email: c.email, motDePasse: PASSWORD,
        prenom: c.prenom, nom: c.nom, role: c.role as 'conseiller' | 'admin_structure' | 'super_admin',
        structureId: structId, actif: 1,
        creeLe: t, misAJourLe: t,
      })
      conseillerIds.push(id)
      console.log(`  ✅ Conseiller : ${c.prenom} ${c.nom} (${c.email})`)
    } catch { conseillerIds.push(id); console.log(`  ⚠️  Conseiller (skip) : ${c.prenom}`) }
  }

  // ── Bénéficiaires (40 nouveaux) ──
  console.log('\n📋 Création de 40 bénéficiaires avec conversations...\n')

  // Récupérer les IDs des structures existantes pour le matching
  const allStructRows = await client.execute("SELECT id FROM structure WHERE actif = 1")
  const allStructIds = allStructRows.rows.map(r => r.id as string)

  // Récupérer les IDs des conseillers existants pour les prises en charge
  const allConsRows = await client.execute("SELECT id, structure_id FROM conseiller WHERE actif = 1 AND structure_id IS NOT NULL")
  const allConseillers = allConsRows.rows.map(r => ({ id: r.id as string, structureId: r.structure_id as string }))

  for (let i = 0; i < 30; i++) { // 30 nouveaux bénéficiaires
    const isFemale = i % 2 === 0
    const prenom = isFemale ? PRENOMS_F[i % PRENOMS_F.length] : PRENOMS_M[i % PRENOMS_M.length]
    const age = 15 + Math.floor(Math.random() * 11) // 15-25
    const genre = isFemale ? 'F' : 'M'
    const situation = SITUATIONS[i % SITUATIONS.length]
    const dep = DEPS[i % DEPS.length]
    const phase = PHASES[i % PHASES.length]
    const priorite = PRIORITES[i % PRIORITES.length]
    const profile = RIASEC_PROFILES[i % RIASEC_PROFILES.length]
    const convTemplate = CONVERSATIONS_TEMPLATES[i % CONVERSATIONS_TEMPLATES.length]
    const motif = MOTIFS[i % MOTIFS.length]
    const resumeFn = RESUMES[i % RESUMES.length]
    const hoursAgo = 2 + Math.floor(Math.random() * 120) // 2h à 5 jours

    // Utilisateur
    const userId = uuidv4()
    await db.insert(schema.utilisateur).values({
      id: userId, prenom, age, situation,
      telephone: `06${String(10000000 + Math.floor(Math.random() * 89999999))}`,
      email: `${prenom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.ext${i + 100}@test.fr`,
      source: dep, creeLe: ago(hoursAgo), misAJourLe: ago(hoursAgo),
    })

    // Profil RIASEC
    await db.insert(schema.profilRiasec).values({
      id: uuidv4(), utilisateurId: userId,
      r: profile.r, i: profile.i, a: profile.a, s: profile.s, e: profile.e, c: profile.c,
      dimensionsDominantes: JSON.stringify(profile.dom),
      traits: JSON.stringify(profile.traits),
      interets: JSON.stringify(profile.interets),
      forces: JSON.stringify(profile.forces),
      suggestion: `Pistes : ${profile.interets.join(', ')}`,
      misAJourLe: ago(hoursAgo),
    })

    // Indice de confiance
    const conf = 0.3 + Math.random() * 0.6
    const niveauConf = conf < 0.4 ? 'debut' : conf < 0.6 ? 'emergent' : conf < 0.8 ? 'precis' : 'fiable'
    await db.insert(schema.indiceConfiance).values({
      id: uuidv4(), utilisateurId: userId,
      scoreGlobal: Math.round(conf * 100) / 100,
      niveau: niveauConf,
      nbMessagesAnalyses: convTemplate.length,
      misAJourLe: ago(hoursAgo),
    })

    // Conversation + messages
    const convId = uuidv4()
    await db.insert(schema.conversation).values({
      id: convId, utilisateurId: userId,
      titre: `Conversation de ${prenom}`,
      statut: 'active', origine: 'direct',
      nbMessages: convTemplate.length,
      phase, dureeSecondes: convTemplate.length * 45 + Math.floor(Math.random() * 300),
      creeLe: ago(hoursAgo), misAJourLe: ago(hoursAgo - 0.5),
    })

    for (let m = 0; m < convTemplate.length; m++) {
      const msg = convTemplate[m]
      const msgTime = ago(hoursAgo - (m * 0.1))
      await db.insert(schema.message).values({
        id: uuidv4(), conversationId: convId,
        role: msg.role, contenu: msg.contenu, contenuBrut: msg.contenu,
        fragiliteDetectee: ('fragilite' in msg && (msg as Record<string, unknown>).fragilite) ? 1 : 0,
        niveauFragilite: ('niveauFragilite' in msg) ? (msg as Record<string, string>).niveauFragilite : null,
        horodatage: msgTime,
      })
    }

    // Referral
    const referralId = uuidv4()
    const structSuggId = allStructIds[i % allStructIds.length]
    await db.insert(schema.referral).values({
      id: referralId, utilisateurId: userId, conversationId: convId,
      priorite, niveauDetection: priorite === 'critique' ? 3 : priorite === 'haute' ? 2 : 1,
      motif, resumeConversation: resumeFn(prenom, age),
      moyenContact: `06${String(10000000 + Math.floor(Math.random() * 89999999))}`,
      typeContact: i % 3 === 0 ? 'email' : 'telephone',
      statut: i < 8 ? 'prise_en_charge' : i < 12 ? 'terminee' : i < 15 ? 'en_attente' : 'en_attente',
      structureSuggereId: structSuggId,
      localisation: dep, genre, ageBeneficiaire: age,
      creeLe: ago(hoursAgo), misAJourLe: ago(hoursAgo - 1),
    })

    // Prise en charge pour les 8 premiers + 4 terminés
    if (i < 12) {
      const cons = allConseillers[i % allConseillers.length]
      await db.insert(schema.priseEnCharge).values({
        id: uuidv4(), referralId, conseillerId: cons.id, structureId: cons.structureId,
        statut: i < 8 ? 'prise_en_charge' : 'terminee',
        premiereActionLe: ago(hoursAgo - 2),
        creeLe: ago(hoursAgo - 2), misAJourLe: ago(hoursAgo - 3),
      })
    }

    const statusLabel = i < 8 ? '🤝' : i < 12 ? '✅' : '⏳'
    console.log(`  ${statusLabel} ${prenom} (${age} ans, ${dep}) — ${priorite} — ${phase}`)
  }

  console.log('\n✅ Seed étendu terminé !')
  console.log('   +3 structures, +9 conseillers, +40 bénéficiaires\n')
  console.log('   Totaux estimés : 10 structures, 20 conseillers, ~63 bénéficiaires\n')

  process.exit(0)
}

seed().catch(e => { console.error('❌ Erreur seed:', e); process.exit(1) })
