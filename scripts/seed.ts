// Script de seed — Jeu d'essai complet Catch'Up
// 10 structures, 10 conseillers, 20 bénéficiaires avec conversations réalistes
// Usage : npx tsx scripts/seed.ts

import { Pool } from 'pg'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

// Adapter : imite l'API libsql pour minimiser les changements dans le seed
function createPgClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://catchup:CatchUp2026Pg!@localhost:5432/catchup',
  })
  return {
    async execute(input: string | { sql: string; args?: unknown[] }) {
      if (typeof input === 'string') {
        await pool.query(input)
        return { rows: [] }
      }
      // Remplacer les ? par $1, $2, ...
      let idx = 0
      const pgSql = input.sql.replace(/\?/g, () => `$${++idx}`)
      const result = await pool.query(pgSql, input.args || [])
      return { rows: result.rows }
    },
    async end() { await pool.end() },
  }
}

// ── Données réalistes ───────────────────────────────────────────────

const STRUCTURES_DATA = [
  { nom: 'Mission Locale Paris 15',     slug: 'ml-paris15',      type: 'mission_locale', deps: ['75','92'],  regions: ['ile-de-france'],              ageMin: 16, ageMax: 25, spes: ['insertion','decrochage','emploi'],             genre: null,  cap: 50 },
  { nom: 'CIO Lyon 3',                  slug: 'cio-lyon',        type: 'cio',            deps: ['69'],       regions: ['auvergne-rhone-alpes'],       ageMin: 14, ageMax: 25, spes: ['orientation','reorientation','lyceen'],        genre: null,  cap: 40 },
  { nom: 'E2C Lille Métropole',          slug: 'e2c-lille',       type: 'e2c',            deps: ['59','62'],  regions: ['hauts-de-france'],            ageMin: 16, ageMax: 25, spes: ['decrochage','insertion','remobilisation'],     genre: null,  cap: 30 },
  { nom: 'Mission Locale Marseille',     slug: 'ml-marseille',    type: 'mission_locale', deps: ['13','84'],  regions: ['provence-alpes-cote-d-azur'], ageMin: 16, ageMax: 25, spes: ['insertion','emploi','entrepreneuriat'],        genre: null,  cap: 45 },
  { nom: 'PAIO Toulouse',               slug: 'paio-toulouse',   type: 'paio',           deps: ['31','32'],  regions: ['occitanie'],                  ageMin: 16, ageMax: 25, spes: ['accueil','orientation','insertion'],           genre: null,  cap: 35 },
  { nom: 'Mission Locale Bordeaux',      slug: 'ml-bordeaux',     type: 'mission_locale', deps: ['33','40'],  regions: ['nouvelle-aquitaine'],         ageMin: 16, ageMax: 25, spes: ['insertion','emploi','logement'],               genre: null,  cap: 50 },
  { nom: 'CIO Nantes',                  slug: 'cio-nantes',      type: 'cio',            deps: ['44','85'],  regions: ['pays-de-la-loire'],           ageMin: 14, ageMax: 25, spes: ['orientation','reorientation','lyceen'],        genre: null,  cap: 35 },
  { nom: 'E2C Strasbourg',              slug: 'e2c-strasbourg',  type: 'e2c',            deps: ['67','68'],  regions: ['grand-est'],                  ageMin: 16, ageMax: 25, spes: ['decrochage','insertion','remobilisation'],     genre: null,  cap: 25 },
  { nom: 'Mission Locale Nice',          slug: 'ml-nice',         type: 'mission_locale', deps: ['06'],       regions: ['provence-alpes-cote-d-azur'], ageMin: 16, ageMax: 25, spes: ['insertion','emploi','tourisme'],               genre: null,  cap: 40 },
  { nom: 'Fondation JAE',               slug: 'fondation-jae',   type: 'fondation',      deps: ['69','75','13','59','31','33','44','67','06'], regions: ['nationale'], ageMin: 14, ageMax: 30, spes: ['orientation','innovation','numerique'], genre: null, cap: 100 },
]

// structIdx maps to STRUCTURES_DATA index
const CONSEILLERS_DATA = [
  { email: 'marie.dupont@ml-paris15.fr',       prenom: 'Marie',   nom: 'Dupont',    role: 'conseiller',      structIdx: 0 },
  { email: 'jean.martin@cio-lyon.fr',          prenom: 'Jean',    nom: 'Martin',    role: 'conseiller',      structIdx: 1 },
  { email: 'nadia.belkacem@ml-paris15.fr',     prenom: 'Nadia',   nom: 'Belkacem',  role: 'admin_structure', structIdx: 0 },
  { email: 'admin@fondation-jae.org',          prenom: 'Admin',   nom: 'JAE',       role: 'super_admin',     structIdx: 9 },
  { email: 'sophie.laurent@e2c-lille.fr',      prenom: 'Sophie',  nom: 'Laurent',   role: 'conseiller',      structIdx: 2 },
  { email: 'karim.benzema@ml-marseille.fr',    prenom: 'Karim',   nom: 'Benzema',   role: 'conseiller',      structIdx: 3 },
  { email: 'claire.petit@paio-toulouse.fr',    prenom: 'Claire',  nom: 'Petit',     role: 'admin_structure', structIdx: 4 },
  { email: 'romain.garcia@ml-bordeaux.fr',     prenom: 'Romain',  nom: 'Garcia',    role: 'conseiller',      structIdx: 5 },
  { email: 'amina.diallo@cio-nantes.fr',       prenom: 'Amina',   nom: 'Diallo',    role: 'conseiller',      structIdx: 6 },
  { email: 'thomas.muller@e2c-strasbourg.fr',  prenom: 'Thomas',  nom: 'Muller',    role: 'conseiller',      structIdx: 7 },
]

// 20 bénéficiaires — chaque consIdx correspond au conseiller qui prendra en charge (si applicable)
const BENEFICIAIRES_DATA = [
  {
    prenom: 'Lucas', age: 19, situation: 'decrocheur', genre: 'M', dep: '75',
    riasec: { r: 72, i: 35, a: 28, s: 45, e: 60, c: 20 },
    traits: ['pragmatique','débrouillard','impatient'], interets: ['mécanique','sport','jeux vidéo'], forces: ['manuel','endurant'],
    suggestion: 'mécanicien auto, technicien maintenance',
    confiance: 0.68, niveau: 'emergent',
    priorite: 'haute' as const, phase: 'exploration',
    motif: 'Décrochage scolaire en Terminale pro. Recherche une voie concrète.',
    resume: 'Lucas, 19 ans, a quitté le lycée pro en Terminale. Profil très Réaliste, attiré par la mécanique et le travail manuel. A évoqué des difficultés familiales. Souhaite un accompagnement rapide vers un apprentissage.',
    consIdx: 0, // Marie Dupont, ML Paris 15
    messages: [
      { role: 'assistant', contenu: 'Salut ! Je suis là pour t\'aider à y voir plus clair sur ton avenir. Comment tu te sens en ce moment ?' },
      { role: 'user', contenu: 'Bof, j\'ai arrêté le lycée il y a 3 mois, je sais pas trop quoi faire' },
      { role: 'assistant', contenu: 'Je comprends, c\'est une période pas facile. Tu as arrêté en cours d\'année, c\'est ça ? Tu étais dans quelle filière ?' },
      { role: 'user', contenu: 'Oui en terminale bac pro maintenance des véhicules. C\'était pas mal mais y avait trop de théorie' },
      { role: 'assistant', contenu: 'D\'accord, donc la mécanique t\'intéresse mais c\'est le cadre scolaire qui te convenait moins. Et si on parlait de ce que tu aimes vraiment faire au quotidien ?' },
      { role: 'user', contenu: 'J\'adore réparer des trucs, mon scooter, les vélos de mes potes. Et je joue beaucoup aux jeux vidéo aussi' },
      { role: 'assistant', contenu: 'Tu es quelqu\'un de concret, tu aimes résoudre des problèmes avec tes mains. C\'est une vraie force ! Est-ce que tu as déjà pensé à l\'apprentissage ?' },
      { role: 'user', contenu: 'Ouais mais je sais pas comment faire, mes parents sont pas trop là pour m\'aider' },
    ],
  },
  {
    prenom: 'Emma', age: 17, situation: 'lyceen', genre: 'F', dep: '69',
    riasec: { r: 20, i: 55, a: 70, s: 65, e: 30, c: 25 },
    traits: ['créative','empathique','rêveuse'], interets: ['dessin','musique','psychologie'], forces: ['imagination','écoute'],
    suggestion: 'art-thérapie, graphisme, éducation artistique',
    confiance: 0.82, niveau: 'precis',
    priorite: 'normale' as const, phase: 'projection',
    motif: 'Hésitation entre filière artistique et sociale, besoin de conseil sur les formations.',
    resume: 'Emma, 17 ans, en Première L. Profil Artiste-Social très marqué. Hésite entre art-thérapie, graphisme et psychologie. Conversation riche, profil bien défini.',
    consIdx: 1, // Jean Martin, CIO Lyon
    messages: [
      { role: 'assistant', contenu: 'Bonjour ! Bienvenue sur Catch\'Up. Alors, qu\'est-ce qui t\'amène ici aujourd\'hui ?' },
      { role: 'user', contenu: 'Coucou ! En fait je suis en Première et je commence à stresser pour Parcoursup' },
      { role: 'assistant', contenu: 'C\'est normal de se sentir un peu stressée à cette période. Tu as déjà une idée de ce qui te plaît ou c\'est le flou total ?' },
      { role: 'user', contenu: 'J\'adore dessiner et la musique, mais j\'aime aussi beaucoup aider les gens. Ma mère est infirmière et ça m\'inspire' },
      { role: 'assistant', contenu: 'C\'est super intéressant ! Tu combines créativité et envie d\'aider. As-tu déjà entendu parler de l\'art-thérapie ? C\'est un métier qui mêle les deux.' },
      { role: 'user', contenu: 'Oui !! J\'ai regardé des vidéos dessus, ça me parle trop ! Mais je sais pas si c\'est réaliste comme métier' },
    ],
  },
  {
    prenom: 'Karim', age: 22, situation: 'en_recherche', genre: 'M', dep: '13',
    riasec: { r: 40, i: 30, a: 15, s: 50, e: 78, c: 55 },
    traits: ['ambitieux','sociable','persévérant'], interets: ['commerce','entrepreneuriat','réseaux sociaux'], forces: ['négociation','leadership'],
    suggestion: 'commercial terrain, créateur d\'entreprise, community manager',
    confiance: 0.75, niveau: 'precis',
    priorite: 'normale' as const, phase: 'action',
    motif: 'BTS MUC obtenu, recherche d\'emploi depuis 6 mois. Envisage la création d\'entreprise.',
    resume: 'Karim, 22 ans, diplômé BTS MUC. Profil très Entreprenant. 6 mois de recherche d\'emploi infructueuse. Hésite entre poste commercial et création d\'entreprise dans le e-commerce.',
    consIdx: 5, // Karim Benzema, ML Marseille
    messages: [
      { role: 'assistant', contenu: 'Hey ! Comment ça va ? Je suis Catch\'Up, je suis là pour t\'aider dans ton parcours pro. Qu\'est-ce qui t\'amène ?' },
      { role: 'user', contenu: 'Salam ! Ça va tranquille. En fait j\'ai eu mon BTS MUC y a 6 mois et depuis je galère à trouver du taf' },
      { role: 'assistant', contenu: 'Félicitations pour ton BTS déjà ! 6 mois de recherche ça peut être décourageant. Tu cherches quel type de poste ?' },
      { role: 'user', contenu: 'Commercial, dans le digital idéalement. Mais en vrai j\'ai un projet de boutique en ligne de streetwear' },
      { role: 'assistant', contenu: 'Ah c\'est ambitieux ! L\'entrepreneuriat c\'est un beau projet. Tu as déjà avancé dessus ? Business plan, étude de marché ?' },
      { role: 'user', contenu: 'J\'ai des idées mais j\'ai besoin d\'aide pour structurer le projet. Et en attendant faut que je gagne ma vie' },
      { role: 'assistant', contenu: 'C\'est très lucide comme approche. Un conseiller pourrait t\'aider à la fois sur la recherche d\'emploi immédiate et à structurer ton projet. Ça t\'intéresse ?' },
      { role: 'user', contenu: 'Grave ! Si y a quelqu\'un qui connaît le milieu de la création d\'entreprise ça serait parfait' },
    ],
  },
  {
    prenom: 'Chloé', age: 20, situation: 'etudiant', genre: 'F', dep: '92',
    riasec: { r: 15, i: 80, a: 25, s: 30, e: 20, c: 70 },
    traits: ['analytique','rigoureuse','introvertie'], interets: ['sciences','données','programmation'], forces: ['logique','précision'],
    suggestion: 'data analyst, biostatisticienne, ingénieure qualité',
    confiance: 0.91, niveau: 'fiable',
    priorite: 'normale' as const, phase: 'projection',
    motif: 'Réorientation de médecine vers data science, besoin de conseil sur les passerelles.',
    resume: 'Chloé, 20 ans, en réorientation après un échec en PASS médecine. Profil Investigateur-Conventionnel marqué. S\'intéresse à la data science et biostatistique.',
    consIdx: 0, // Marie Dupont, ML Paris 15
    messages: [
      { role: 'assistant', contenu: 'Bonjour ! Je suis là pour t\'accompagner. Qu\'est-ce que je peux faire pour toi aujourd\'hui ?' },
      { role: 'user', contenu: 'Bonjour. J\'ai raté ma première année de médecine et je suis un peu perdue' },
      { role: 'assistant', contenu: 'Je suis désolé pour cette déception. C\'est une épreuve difficile, mais ça ne définit pas du tout tes capacités. Qu\'est-ce qui t\'avait attirée vers la médecine ?' },
      { role: 'user', contenu: 'Le côté scientifique et comprendre comment le corps fonctionne. Mais j\'ai réalisé que c\'est pas le métier de médecin qui m\'attire' },
      { role: 'assistant', contenu: 'Intéressant ! Tu aimes la science et l\'analyse mais pas forcément le contact patient. Tu as peut-être envisagé la data science ou l\'analyse de données de santé ?' },
      { role: 'user', contenu: 'Oui exactement ! J\'ai commencé à apprendre Python toute seule et j\'adore manipuler les données.' },
    ],
  },
  {
    prenom: 'Sofiane', age: 18, situation: 'decrocheur', genre: 'M', dep: '59',
    riasec: { r: 60, i: 20, a: 45, s: 35, e: 50, c: 15 },
    traits: ['hyperactif','généreux','impulsif'], interets: ['cuisine','street art','sport'], forces: ['énergie','créativité manuelle'],
    suggestion: 'cuisinier, pâtissier, animateur sportif',
    confiance: 0.55, niveau: 'emergent',
    priorite: 'critique' as const, phase: 'decouverte',
    motif: 'Déscolarisé depuis 1 an, situations familiales difficiles, urgence d\'insertion.',
    resume: 'Sofiane, 18 ans, sans activité depuis 1 an. Fragilité détectée (contexte familial difficile). Profil Réaliste-Entreprenant. Intérêt pour la cuisine et le sport.',
    consIdx: 4, // Sophie Laurent, E2C Lille
    messages: [
      { role: 'assistant', contenu: 'Salut ! Bienvenue. Comment tu vas aujourd\'hui ?' },
      { role: 'user', contenu: 'Bof' },
      { role: 'assistant', contenu: 'Je comprends. C\'est courageux d\'être là. Tu veux me dire un peu ce qui se passe en ce moment ?' },
      { role: 'user', contenu: 'J ai arrêté l école y a un an, j habite chez un pote là, c est compliqué à la maison' },
      { role: 'assistant', contenu: 'Merci de me faire confiance. C\'est une situation difficile. Tu as quelqu\'un autour de toi qui te soutient ?' },
      { role: 'user', contenu: 'Mon pote et sa mère, ils sont cools. Mais faut que je trouve un truc à faire, je peux pas rester comme ça' },
      { role: 'assistant', contenu: 'Tu as raison, et le fait que tu cherches à avancer c\'est très positif. Qu\'est-ce que tu aimes faire ?' },
      { role: 'user', contenu: 'La cuisine, je cuisine tout le temps chez mon pote. Et le foot aussi' },
    ],
  },
  {
    prenom: 'Amina', age: 16, situation: 'lyceen', genre: 'F', dep: '69',
    riasec: { r: 10, i: 40, a: 30, s: 85, e: 45, c: 35 },
    traits: ['empathique','organisée','patiente'], interets: ['petite enfance','santé','bénévolat'], forces: ['écoute','douceur'],
    suggestion: 'auxiliaire de puériculture, éducatrice jeunes enfants, infirmière',
    confiance: 0.72, niveau: 'precis',
    priorite: 'normale' as const, phase: 'exploration',
    motif: 'En Seconde générale, hésite entre sanitaire et social.',
    resume: 'Amina, 16 ans, en Seconde. Profil très Social. Hésite entre petite enfance, santé et éducation spécialisée. Très motivée et mature pour son âge.',
    consIdx: 1, // Jean Martin, CIO Lyon
    messages: [
      { role: 'assistant', contenu: 'Coucou ! Tu cherches des idées pour ton orientation ?' },
      { role: 'user', contenu: 'Oui ! Je suis en Seconde et on nous demande déjà de choisir nos spécialités' },
      { role: 'assistant', contenu: 'Ah oui, c\'est un choix important. Tu as des matières ou des domaines qui t\'attirent plus que d\'autres ?' },
      { role: 'user', contenu: 'J\'aime beaucoup la SVT et j\'ai fait du baby-sitting, j\'adore m\'occuper des enfants. Et je fais du bénévolat à la Croix-Rouge' },
      { role: 'assistant', contenu: 'Waouh, tu es très engagée ! Le sanitaire et le social semblent vraiment te correspondre. Tu voudrais en discuter avec un professionnel ?' },
      { role: 'user', contenu: 'Oui, surtout pour savoir si je dois prendre la filière ST2S ou rester en général' },
    ],
  },
  {
    prenom: 'Maxime', age: 23, situation: 'en_recherche', genre: 'M', dep: '33',
    riasec: { r: 30, i: 25, a: 80, s: 20, e: 40, c: 10 },
    traits: ['créatif','perfectionniste','solitaire'], interets: ['photographie','cinéma','écriture'], forces: ['vision artistique','persévérance'],
    suggestion: 'photographe, monteur vidéo, directeur artistique',
    confiance: 0.65, niveau: 'emergent',
    priorite: 'haute' as const, phase: 'exploration',
    motif: 'Diplômé d\'une école de photo, pas de réseau professionnel. Isolé.',
    resume: 'Maxime, 23 ans, diplômé en photographie. Profil très Artiste. Difficultés à s\'insérer professionnellement, manque de réseau.',
    consIdx: 7, // Romain Garcia, ML Bordeaux
    messages: [
      { role: 'assistant', contenu: 'Bonjour ! Bienvenue sur Catch\'Up. Qu\'est-ce qui t\'amène ?' },
      { role: 'user', contenu: 'Salut. J\'ai fini mon école de photo il y a un an et je trouve rien' },
      { role: 'assistant', contenu: 'La photographie c\'est un milieu où le réseau est important. Tu as pu faire des stages ou des contacts pendant ta formation ?' },
      { role: 'user', contenu: 'Pas trop non, j\'suis plutôt quelqu\'un de solitaire. Et mes parents comprennent pas mon choix de carrière' },
      { role: 'assistant', contenu: 'Je comprends, c\'est pas facile d\'être incompris par sa famille. Comment tu occupes ton temps en ce moment ?' },
      { role: 'user', contenu: 'Je fais des photos perso, j\'ai un bon portfolio. Mais je sais pas comment démarcher' },
      { role: 'assistant', contenu: 'Un portfolio c\'est la base ! Il te manque la partie réseau et commerciale. Un conseiller pourrait t\'aider. Ça te dit ?' },
      { role: 'user', contenu: 'Ouais pourquoi pas, si c\'est quelqu\'un qui comprend les métiers créatifs' },
    ],
  },
  {
    prenom: 'Yasmine', age: 21, situation: 'etudiant', genre: 'F', dep: '75',
    riasec: { r: 25, i: 65, a: 35, s: 50, e: 70, c: 45 },
    traits: ['ambitieuse','communicative','multi-tâches'], interets: ['marketing digital','psychologie','voyages'], forces: ['communication','adaptabilité'],
    suggestion: 'cheffe de projet digital, UX researcher, consultante marketing',
    confiance: 0.78, niveau: 'precis',
    priorite: 'normale' as const, phase: 'projection',
    motif: 'Stage de fin d\'études à trouver, hésite entre agence et startup.',
    resume: 'Yasmine, 21 ans, en Master 1 Marketing digital. Profil Entreprenant-Investigateur. Cherche un stage de fin d\'études.',
    consIdx: 0, // Marie Dupont, ML Paris 15
    messages: [
      { role: 'assistant', contenu: 'Hello ! Qu\'est-ce que je peux faire pour toi ?' },
      { role: 'user', contenu: 'Hello ! Je cherche un stage de M1 en marketing digital et j\'arrive pas à me décider entre les grandes agences et les startups' },
      { role: 'assistant', contenu: 'Les deux ont des avantages ! En agence tu verras plein de clients différents, en startup tu auras plus de responsabilités. Qu\'est-ce qui te motive le plus ?' },
      { role: 'user', contenu: 'Les responsabilités et l\'autonomie. Mais j\'ai peur qu\'en startup ça soit trop instable' },
      { role: 'assistant', contenu: 'C\'est une réflexion pertinente. Un conseiller pourrait t\'aider à cibler les bonnes structures. Ça t\'intéresse ?' },
      { role: 'user', contenu: 'Oui, et aussi des conseils pour mon CV et mes lettres de motivation' },
    ],
  },
  {
    prenom: 'Nathan', age: 16, situation: 'lyceen', genre: 'M', dep: '44',
    riasec: { r: 55, i: 70, a: 20, s: 30, e: 25, c: 40 },
    traits: ['curieux','logique','timide'], interets: ['robotique','jeux vidéo','mathématiques'], forces: ['résolution de problèmes','concentration'],
    suggestion: 'ingénieur robotique, développeur, technicien en électronique',
    confiance: 0.60, niveau: 'emergent',
    priorite: 'normale' as const, phase: 'decouverte',
    motif: 'Choix d\'orientation 3ème, attiré par le numérique mais timide.',
    resume: 'Nathan, 16 ans, en 3ème. Profil Investigateur-Réaliste. Passionné de robotique et de jeux vidéo. Très bon en maths.',
    consIdx: 8, // Amina Diallo, CIO Nantes
    messages: [
      { role: 'assistant', contenu: 'Salut ! Tu es en 3ème c\'est ça ? C\'est le moment des grands choix. Comment tu te sens ?' },
      { role: 'user', contenu: 'Salut. Oui, je sais pas trop quoi faire après la 3ème' },
      { role: 'assistant', contenu: 'C\'est normal ! Tu as des matières que tu préfères à l\'école ?' },
      { role: 'user', contenu: 'Les maths et la techno. Je fais de la robotique au club du collège aussi' },
      { role: 'assistant', contenu: 'La robotique c\'est super ! Tu construis quoi en ce moment ?' },
      { role: 'user', contenu: 'Un petit robot qui suit une ligne. C est avec Arduino' },
    ],
  },
  {
    prenom: 'Inès', age: 24, situation: 'en_recherche', genre: 'F', dep: '31',
    riasec: { r: 15, i: 30, a: 20, s: 75, e: 55, c: 60 },
    traits: ['organisée','bienveillante','perfectionniste'], interets: ['RH','gestion','formation'], forces: ['organisation','médiation'],
    suggestion: 'chargée de recrutement, formatrice, gestionnaire RH',
    confiance: 0.85, niveau: 'fiable',
    priorite: 'normale' as const, phase: 'action',
    motif: 'Licence RH obtenue, recherche premier emploi depuis 4 mois.',
    resume: 'Inès, 24 ans, licence RH. Profil Social-Conventionnel. Recherche premier emploi dans les RH depuis 4 mois.',
    consIdx: 6, // Claire Petit, PAIO Toulouse
    messages: [
      { role: 'assistant', contenu: 'Bonjour Inès ! Comment puis-je t\'aider aujourd\'hui ?' },
      { role: 'user', contenu: 'Bonjour, j\'ai ma licence RH mais depuis 4 mois je n\'ai que des refus. C\'est décourageant' },
      { role: 'assistant', contenu: 'Je comprends ta frustration. 4 mois de recherche c\'est éprouvant. Tu candidates sur quel type de postes ?' },
      { role: 'user', contenu: 'Assistante RH ou chargée de recrutement, dans des PME surtout. J\'envoie au moins 5 candidatures par semaine' },
      { role: 'assistant', contenu: 'C\'est un bon rythme. Est-ce que tu as des retours sur tes candidatures ?' },
      { role: 'user', contenu: 'J\'ai eu 2 entretiens mais ça n\'a pas abouti. On me dit que j\'ai pas assez d\'expérience' },
      { role: 'assistant', contenu: 'Le cercle vicieux du premier emploi... Un conseiller pourrait t\'aider à valoriser tes stages et préparer les entretiens. Tu veux essayer ?' },
      { role: 'user', contenu: 'Oui, et aussi savoir si je devrais pas faire un master plutôt' },
    ],
  },
  {
    prenom: 'Enzo', age: 17, situation: 'lyceen', genre: 'M', dep: '13',
    riasec: { r: 65, i: 30, a: 40, s: 50, e: 35, c: 20 },
    traits: ['sportif','compétiteur','franc'], interets: ['sport','nature','animaux'], forces: ['physique','esprit d\'équipe'],
    suggestion: 'moniteur sportif, garde forestier, éducateur sportif',
    confiance: 0.58, niveau: 'emergent',
    priorite: 'normale' as const, phase: 'exploration',
    motif: 'Veut quitter le lycée pour un métier en plein air, parents réticents.',
    resume: 'Enzo, 17 ans, en Première STMG. Profil Réaliste-Social. Ne se retrouve pas dans sa filière.',
    consIdx: 5, // Karim Benzema, ML Marseille
    messages: [
      { role: 'assistant', contenu: 'Salut ! Comment ça va ? Qu\'est-ce qui t\'amène sur Catch\'Up ?' },
      { role: 'user', contenu: 'Salut. En fait je suis en STMG et ça me plaît pas du tout, je veux faire un truc dehors, dans la nature' },
      { role: 'assistant', contenu: 'Ah d\'accord ! Les métiers de plein air c\'est large. Tu as des idées plus précises ?' },
      { role: 'user', contenu: 'Éducateur sportif ou un truc en rapport avec la forêt, les animaux. Mais mes parents veulent que j\'aille en fac de commerce' },
      { role: 'assistant', contenu: 'C\'est pas toujours facile quand les parents ont un autre projet pour toi. Un conseiller pourrait te recevoir avec tes parents pour en discuter. Ça t\'aiderait ?' },
      { role: 'user', contenu: 'Ouais, parce que moi tout seul j arrive pas à leur expliquer' },
    ],
  },
  {
    prenom: 'Léa', age: 19, situation: 'decrocheur', genre: 'F', dep: '62',
    riasec: { r: 20, i: 15, a: 75, s: 45, e: 55, c: 30 },
    traits: ['passionnée','indépendante','impulsive'], interets: ['mode','couture','réseaux sociaux'], forces: ['créativité','sens esthétique'],
    suggestion: 'styliste, couturière, visual merchandiser',
    confiance: 0.52, niveau: 'emergent',
    priorite: 'haute' as const, phase: 'decouverte',
    motif: 'A quitté un BTS en cours d\'année. Veut se lancer dans la mode.',
    resume: 'Léa, 19 ans, a quitté un BTS Commerce en octobre. Profil très Artiste. Passionnée de mode et couture, vend sur Vinted.',
    consIdx: 4, // Sophie Laurent, E2C Lille
    messages: [
      { role: 'assistant', contenu: 'Salut Léa ! Comment tu vas ? Qu\'est-ce qui t\'amène ?' },
      { role: 'user', contenu: 'J\'ai quitté mon BTS parce que ça me correspondait pas du tout. Je veux bosser dans la mode' },
      { role: 'assistant', contenu: 'Tu as fait un choix courageux. La mode c\'est un milieu exigeant mais passionnant. Tu fais de la couture ?' },
      { role: 'user', contenu: 'Oui ! J\'ai appris toute seule sur YouTube et je customise des fringues que je vends sur Vinted.' },
      { role: 'assistant', contenu: 'C\'est génial ça ! Tu as déjà une activité commerciale. C\'est un vrai atout. Tu connais les formations en stylisme ?' },
      { role: 'user', contenu: 'Non pas trop, et mes parents me disent que c\'est pas un vrai métier...' },
      { role: 'assistant', contenu: 'La mode est une vraie industrie ! Un conseiller pourrait t\'aider à formaliser ton parcours. Ça te tente ?' },
      { role: 'user', contenu: 'Oui ! Si possible quelqu\'un qui connaît le secteur créatif' },
    ],
  },
  {
    prenom: 'Mehdi', age: 20, situation: 'etudiant', genre: 'M', dep: '92',
    riasec: { r: 35, i: 50, a: 25, s: 30, e: 65, c: 55 },
    traits: ['stratège','déterminé','compétitif'], interets: ['finance','immobilier','tech'], forces: ['analyse','persuasion'],
    suggestion: 'conseiller financier, agent immobilier, business developer',
    confiance: 0.70, niveau: 'precis',
    priorite: 'normale' as const, phase: 'projection',
    motif: 'En alternance mais hésite à changer de voie vers l\'immobilier.',
    resume: 'Mehdi, 20 ans, en alternance BTS comptabilité. Profil Entreprenant-Conventionnel. S\'ennuie en compta, attiré par l\'immobilier.',
    consIdx: 0, // Marie Dupont, ML Paris 15
    messages: [
      { role: 'assistant', contenu: 'Bonjour Mehdi ! Qu\'est-ce qui t\'amène ici ?' },
      { role: 'user', contenu: 'Je suis en alternance compta et je m\'ennuie grave. J\'ai envie de faire de l\'immobilier' },
      { role: 'assistant', contenu: 'L\'immobilier et la compta sont assez différents ! Qu\'est-ce qui t\'attire dans l\'immo ?' },
      { role: 'user', contenu: 'Le terrain, rencontrer des gens, négocier. Et l\'argent qu\'on peut gagner aussi' },
      { role: 'assistant', contenu: 'Tu as un profil commercial. Ta formation en compta sera un atout dans l\'immobilier. Un conseiller pourrait t\'aider. Intéressé ?' },
      { role: 'user', contenu: 'Oui, mais faut que je finisse mon BTS d\'abord non ?' },
    ],
  },
  {
    prenom: 'Jade', age: 22, situation: 'en_recherche', genre: 'F', dep: '67',
    riasec: { r: 40, i: 35, a: 30, s: 60, e: 25, c: 50 },
    traits: ['discrète','fiable','méthodique'], interets: ['administratif','social','nature'], forces: ['régularité','discrétion'],
    suggestion: 'assistante sociale, secrétaire médicale, aide à domicile',
    confiance: 0.63, niveau: 'emergent',
    priorite: 'haute' as const, phase: 'exploration',
    motif: 'En situation de handicap (dyspraxie), difficultés d\'insertion, découragement.',
    resume: 'Jade, 22 ans, RQTH pour dyspraxie. Profil Social-Conventionnel. Bac pro ASSP obtenu avec aménagements. Recherche d\'emploi difficile.',
    consIdx: 9, // Thomas Muller, E2C Strasbourg
    messages: [
      { role: 'assistant', contenu: 'Bonjour ! Je suis Catch\'Up. Comment tu te sens aujourd\'hui ?' },
      { role: 'user', contenu: 'Pas super. Je cherche du travail depuis longtemps et avec mon handicap c\'est compliqué' },
      { role: 'assistant', contenu: 'Je comprends que ça soit difficile. Tu as un handicap reconnu ? Il existe des dispositifs d\'aide spécifiques.' },
      { role: 'user', contenu: 'Oui j\'ai la RQTH, j\'ai une dyspraxie. J\'ai eu mon bac pro ASSP avec des aménagements' },
      { role: 'assistant', contenu: 'Félicitations pour ton bac ! Il y a des structures spécialisées qui accompagnent les personnes en situation de handicap. Tu connais ?' },
      { role: 'user', contenu: 'Non, je savais pas. Ça serait bien d\'avoir quelqu\'un qui comprend ma situation' },
    ],
  },
  {
    prenom: 'Théo', age: 16, situation: 'lyceen', genre: 'M', dep: '59',
    riasec: { r: 45, i: 55, a: 50, s: 40, e: 30, c: 25 },
    traits: ['polyvalent','rêveur','gentil'], interets: ['jeux vidéo','manga','sciences'], forces: ['imagination','curiosité'],
    suggestion: 'game designer, animateur 3D, développeur jeux vidéo',
    confiance: 0.48, niveau: 'debut',
    priorite: 'normale' as const, phase: 'accroche',
    motif: 'Aucune idée de métier, se laisse porter. Parents inquiets.',
    resume: 'Théo, 16 ans, en Seconde générale. Profil très équilibré (pas de dimension dominante claire). Passionné de jeux vidéo et manga.',
    consIdx: 4, // Sophie Laurent, E2C Lille
    messages: [
      { role: 'assistant', contenu: 'Salut ! Comment tu vas ? Tu cherches des idées pour ton avenir ?' },
      { role: 'user', contenu: 'Salut, ouais mes parents m\'ont dit de venir ici parce que j\'ai aucune idée de ce que je veux faire' },
      { role: 'assistant', contenu: 'C\'est pas grave du tout de ne pas savoir à 16 ans ! Dis-moi, qu\'est-ce que tu fais quand t\'as du temps libre ?' },
      { role: 'user', contenu: 'Je joue aux jeux vidéo et je lis des mangas' },
    ],
  },
  {
    prenom: 'Sarah', age: 18, situation: 'lyceen', genre: 'F', dep: '33',
    riasec: { r: 10, i: 70, a: 45, s: 55, e: 30, c: 60 },
    traits: ['studieuse','anxieuse','perfectionniste'], interets: ['médecine','biologie','lecture'], forces: ['rigueur','mémoire'],
    suggestion: 'pharmacienne, biologiste, vétérinaire',
    confiance: 0.80, niveau: 'precis',
    priorite: 'normale' as const, phase: 'projection',
    motif: 'Terminale S, stress de Parcoursup, anxiété de performance.',
    resume: 'Sarah, 18 ans, Terminale S mentions TB. Profil Investigateur-Conventionnel. Stress extrême lié à Parcoursup.',
    consIdx: 7, // Romain Garcia, ML Bordeaux
    messages: [
      { role: 'assistant', contenu: 'Bonjour Sarah ! Comment tu te sens en cette période ?' },
      { role: 'user', contenu: 'Stressée !! Parcoursup c\'est dans 2 mois et je sais toujours pas si je mets médecine ou pharmacie en premier' },
      { role: 'assistant', contenu: 'Je sens que tu te mets beaucoup de pression. Respire, tu as encore le temps. Qu\'est-ce qui te fait hésiter ?' },
      { role: 'user', contenu: 'J\'ai peur de rater médecine et de me retrouver sans rien. Et pharmacie c\'est plus sûr mais c\'est pas mon premier choix' },
      { role: 'assistant', contenu: 'Avec les nouvelles réformes, il y a des passerelles entre les filières santé. Tu pourrais mettre les deux et ajuster.' },
      { role: 'user', contenu: 'Oui mais j\'ai tellement peur d\'échouer...' },
      { role: 'assistant', contenu: 'L\'anxiété de performance est fréquente chez les bons élèves. Un conseiller d\'orientation pourrait t\'aider à rationaliser tes choix. Tu veux essayer ?' },
      { role: 'user', contenu: 'Oui je veux bien, ça me ferait du bien de parler à quelqu\'un' },
    ],
  },
  {
    prenom: 'Kylian', age: 21, situation: 'en_recherche', genre: 'M', dep: '75',
    riasec: { r: 70, i: 40, a: 20, s: 35, e: 50, c: 55 },
    traits: ['ponctuel','fiable','discret'], interets: ['logistique','conduite','organisation'], forces: ['fiabilité','endurance'],
    suggestion: 'logisticien, chauffeur-livreur, magasinier',
    confiance: 0.73, niveau: 'precis',
    priorite: 'normale' as const, phase: 'action',
    motif: 'Intérimaire en logistique, veut se stabiliser avec un CDI.',
    resume: 'Kylian, 21 ans, intérimaire logistique. Profil Réaliste-Conventionnel. Enchaine les missions mais veut un CDI.',
    consIdx: 0, // Marie Dupont, ML Paris 15
    messages: [
      { role: 'assistant', contenu: 'Salut ! Qu\'est-ce qui t\'amène sur Catch\'Up ?' },
      { role: 'user', contenu: 'Je suis intérimaire en logistique depuis 1 an, j\'en ai marre des missions de 2 semaines. Je veux un CDI' },
      { role: 'assistant', contenu: 'C\'est compréhensible ! L\'intérim c\'est instable. Tu as des certifications, des permis ?' },
      { role: 'user', contenu: 'Oui permis B et CACES 1-3-5. Je suis sérieux, jamais absent' },
      { role: 'assistant', contenu: 'Tu as un bon profil ! Un conseiller pourrait t\'aider à cibler les bonnes entreprises. Tu veux ?' },
      { role: 'user', contenu: 'Oui surtout si c\'est quelqu\'un qui connaît le secteur logistique' },
    ],
  },
  {
    prenom: 'Lina', age: 19, situation: 'decrocheur', genre: 'F', dep: '44',
    riasec: { r: 25, i: 20, a: 60, s: 70, e: 40, c: 15 },
    traits: ['sensible','généreuse','désorganisée'], interets: ['musique','bénévolat','animaux'], forces: ['empathie','créativité'],
    suggestion: 'éducatrice spécialisée, musicothérapeute, soigneuse animalière',
    confiance: 0.45, niveau: 'debut',
    priorite: 'critique' as const, phase: 'decouverte',
    motif: 'Décrochage + isolement social + difficultés financières. Urgence.',
    resume: 'Lina, 19 ans, sans activité depuis 6 mois après un échec en L1 psycho. Profil Social-Artiste. Isolement croissant, difficultés financières.',
    consIdx: 8, // Amina Diallo, CIO Nantes
    messages: [
      { role: 'assistant', contenu: 'Bonjour, comment tu vas ?' },
      { role: 'user', contenu: 'Honnêtement pas bien' },
      { role: 'assistant', contenu: 'Merci de ta franchise. Je suis là pour t\'écouter. Tu veux me dire ce qui ne va pas ?' },
      { role: 'user', contenu: 'J\'ai raté ma fac, j\'ai plus de bourse, je sais plus quoi faire de ma vie' },
      { role: 'assistant', contenu: 'C\'est une situation vraiment difficile. Tu n\'es pas seule. Est-ce que tu as des proches autour de toi ?' },
      { role: 'user', contenu: 'Pas trop. Ma famille est loin et j\'ai perdu contact avec mes amis de fac' },
      { role: 'assistant', contenu: 'Il y a des structures qui peuvent t\'aider pour la situation financière et pour retrouver un projet. Un conseiller pourrait te recevoir rapidement. Tu veux ?' },
      { role: 'user', contenu: 'Oui svp. J\'ai besoin d\'aide' },
    ],
  },
  {
    prenom: 'Raphaël', age: 23, situation: 'en_recherche', genre: 'M', dep: '31',
    riasec: { r: 50, i: 60, a: 15, s: 25, e: 45, c: 70 },
    traits: ['méthodique','calme','patient'], interets: ['informatique','électronique','domotique'], forces: ['technique','résolution'],
    suggestion: 'technicien informatique, administrateur systèmes, technicien fibre',
    confiance: 0.77, niveau: 'precis',
    priorite: 'normale' as const, phase: 'action',
    motif: 'DUT Réseaux obtenu, en recherche dans le 31. Veut rester à Toulouse.',
    resume: 'Raphaël, 23 ans, DUT Réseaux et Télécoms. Profil Conventionnel-Investigateur. Recherche un poste tech à Toulouse.',
    consIdx: 6, // Claire Petit, PAIO Toulouse
    messages: [
      { role: 'assistant', contenu: 'Bonjour ! Qu\'est-ce que je peux faire pour toi ?' },
      { role: 'user', contenu: 'Bonjour. Je cherche un poste en informatique sur Toulouse. J\'ai mon DUT Réseaux et Télécoms' },
      { role: 'assistant', contenu: 'Toulouse c\'est un super bassin d\'emploi pour le numérique ! Tu candidates sur quel type de postes ?' },
      { role: 'user', contenu: 'Admin systèmes ou technicien réseau. Mais je rate toujours les entretiens, je suis trop stressé' },
      { role: 'assistant', contenu: 'Le stress en entretien c\'est très courant. Un conseiller pourrait te faire des simulations d\'entretien. Ça t\'aiderait ?' },
      { role: 'user', contenu: 'Oui, c\'est vraiment ce qu\'il me faut. Des entraînements pratiques' },
    ],
  },
  {
    prenom: 'Océane', age: 17, situation: 'lyceen', genre: 'F', dep: '06',
    riasec: { r: 30, i: 25, a: 55, s: 65, e: 50, c: 40 },
    traits: ['dynamique','sociable','optimiste'], interets: ['événementiel','tourisme','communication'], forces: ['organisation','contact humain'],
    suggestion: 'organisatrice d\'événements, agent de tourisme, attachée de presse',
    confiance: 0.66, niveau: 'emergent',
    priorite: 'normale' as const, phase: 'exploration',
    motif: 'Première STMG, veut travailler dans l\'événementiel mais ne connaît pas les formations.',
    resume: 'Océane, 17 ans, Première STMG. Profil Social-Artiste-Entreprenant. Passionnée d\'événementiel, a organisé le bal du lycée.',
    consIdx: 8, // Amina Diallo, CIO Nantes (but dep 06 -> ML Nice territory)
    messages: [
      { role: 'assistant', contenu: 'Coucou ! Bienvenue sur Catch\'Up ! Qu\'est-ce qui t\'amène ?' },
      { role: 'user', contenu: 'Coucou ! Je veux faire de l\'événementiel plus tard mais je sais pas du tout comment y arriver' },
      { role: 'assistant', contenu: 'L\'événementiel c\'est un super secteur ! Tu as déjà organisé des choses ?' },
      { role: 'user', contenu: 'Oui !! J\'ai organisé le bal de fin d\'année du lycée et la journée portes ouvertes. J\'adore ça' },
      { role: 'assistant', contenu: 'Tu as déjà de l\'expérience concrète ! Il y a des BTS et des bachelors en événementiel. Un conseiller pourrait te présenter les options. Ça t\'intéresse ?' },
      { role: 'user', contenu: 'Trop ! Et je voudrais savoir aussi s\'il y a des stages possibles cet été' },
    ],
  },
]

// ── Helpers ──────────────────────────────────────────────────────────

function randomDate(hoursAgo: number): string {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()
}

function msgTimestamps(baseHoursAgo: number, count: number): string[] {
  const startMs = Date.now() - baseHoursAgo * 60 * 60 * 1000
  const durationMs = Math.min(count * 2 * 60 * 1000, 30 * 60 * 1000)
  return Array.from({ length: count }, (_, i) => {
    const offset = (durationMs / count) * i + Math.random() * 30000
    return new Date(startMs + offset).toISOString()
  })
}

// ── Seed principal ──────────────────────────────────────────────────

async function seed() {
  const client = createPgClient()

  console.log('=== Seed complet Catch\'Up ===\n')

  // === VIDER LES TABLES (schema créé par drizzle-kit push) ===
  console.log('[1/6] Vidage des tables existantes...')
  const tablesToTruncate = [
    'alerte_decrochage', 'objectif_hebdomadaire', 'declaration_activite', 'categorie_activite',
    'push_subscription',
    'bris_de_glace', 'rendez_vous', 'evenement_journal',
    'demande_consentement', 'participant_conversation', 'tiers_intervenant',
    'message_direct', 'enquete_satisfaction', 'rappel',
    'campagne_assignation', 'campagne',
    'prise_en_charge', 'session_conseiller', 'evenement_audit',
    'code_verification', 'calendar_connection',
    'referral', 'indice_confiance', 'profil_riasec',
    'instantane_profil', 'message', 'conversation', 'evenement_quiz',
    'source_captation', 'session_magic_link', 'conseiller', 'structure', 'utilisateur',
  ]
  for (const t of tablesToTruncate) {
    try { await client.execute(`TRUNCATE TABLE "${t}" CASCADE`) } catch { /* table might not exist yet */ }
  }

  console.log('[2/6] Tables prêtes')

  const now = new Date().toISOString()

  // === STRUCTURES (10) ===
  console.log('[3/6] Insertion de 10 structures...')
  const structureIds: string[] = []

  for (const s of STRUCTURES_DATA) {
    const id = uuidv4()
    structureIds.push(id)
    await client.execute({
      sql: `INSERT INTO structure (id, nom, slug, type, departements, regions, age_min, age_max, specialites, genre_preference, capacite_max, actif, cree_le, mis_a_jour_le)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      args: [id, s.nom, s.slug, s.type, JSON.stringify(s.deps), JSON.stringify(s.regions), s.ageMin, s.ageMax, JSON.stringify(s.spes), s.genre, s.cap, now, now],
    })
  }

  // === CONSEILLERS (10) ===
  console.log('[4/6] Insertion de 10 conseillers (mot de passe: catchup2026)...')
  const mdp = await bcrypt.hash('catchup2026', 12)
  const conseillerIds: string[] = []

  for (const c of CONSEILLERS_DATA) {
    const id = uuidv4()
    conseillerIds.push(id)
    await client.execute({
      sql: `INSERT INTO conseiller (id, email, mot_de_passe, prenom, nom, role, structure_id, actif, cree_le, mis_a_jour_le)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      args: [id, c.email, mdp, c.prenom, c.nom, c.role, structureIds[c.structIdx], now, now],
    })
  }

  // === BENEFICIAIRES (20) + conversations + messages + referrals ===
  console.log('[5/6] Insertion de 20 beneficiaires avec conversations completes...')

  // Distribution des statuts : 8 en_attente, 8 prise_en_charge, 4 terminee
  const statuts: Array<'en_attente' | 'prise_en_charge' | 'terminee'> = [
    'prise_en_charge', // 0  Lucas
    'prise_en_charge', // 1  Emma
    'en_attente',      // 2  Karim
    'prise_en_charge', // 3  Chloe
    'prise_en_charge', // 4  Sofiane
    'en_attente',      // 5  Amina
    'prise_en_charge', // 6  Maxime
    'en_attente',      // 7  Yasmine
    'en_attente',      // 8  Nathan
    'terminee',        // 9  Ines
    'en_attente',      // 10 Enzo
    'prise_en_charge', // 11 Lea
    'en_attente',      // 12 Mehdi
    'prise_en_charge', // 13 Jade
    'en_attente',      // 14 Theo
    'en_attente',      // 15 Sarah
    'terminee',        // 16 Kylian
    'prise_en_charge', // 17 Lina
    'terminee',        // 18 Raphael
    'en_attente',      // 19 Oceane
  ]

  let totalMessages = 0
  let totalDirectMessages = 0

  for (let idx = 0; idx < BENEFICIAIRES_DATA.length; idx++) {
    const b = BENEFICIAIRES_DATA[idx]
    const userId = uuidv4()
    const convId = uuidv4()
    const refId = uuidv4()
    const statut = statuts[idx]

    const heuresPassees = Math.floor(Math.random() * 120) + 2
    const creeLe = randomDate(heuresPassees)
    const prenomLower = b.prenom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    // Utilisateur
    const contactType = Math.random() > 0.3 ? 'email' : 'telephone'
    const contact = contactType === 'email'
      ? `${prenomLower}@email.com`
      : `06${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`

    await client.execute({
      sql: `INSERT INTO utilisateur (id, prenom, email, age, situation, plateforme, source, cree_le, mis_a_jour_le)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [userId, b.prenom, `${prenomLower}@email.com`, b.age, b.situation,
        ['web', 'web', 'web', 'pwa'][Math.floor(Math.random() * 4)],
        ['direct', 'parcoureo', 'prescripteur', 'qrcode'][Math.floor(Math.random() * 4)],
        creeLe, now],
    })

    // Conversation
    const dureeSecondes = b.messages.length * 120 + Math.floor(Math.random() * 300)
    await client.execute({
      sql: `INSERT INTO conversation (id, utilisateur_id, titre, nb_messages, phase, duree_secondes, cree_le, mis_a_jour_le)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [convId, userId, `Conversation de ${b.prenom}`, b.messages.length, b.phase, dureeSecondes, creeLe, now],
    })

    // Messages
    const timestamps = msgTimestamps(heuresPassees, b.messages.length)
    for (let mi = 0; mi < b.messages.length; mi++) {
      const msg = b.messages[mi]
      await client.execute({
        sql: `INSERT INTO message (id, conversation_id, role, contenu, contenu_brut, fragilite_detectee, niveau_fragilite, horodatage)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [uuidv4(), convId, msg.role, msg.contenu, msg.contenu, 0, null, timestamps[mi]],
      })
      totalMessages++
    }

    // Profil RIASEC
    const riasec = b.riasec
    const scores = [
      { k: 'R', v: riasec.r }, { k: 'I', v: riasec.i }, { k: 'A', v: riasec.a },
      { k: 'S', v: riasec.s }, { k: 'E', v: riasec.e }, { k: 'C', v: riasec.c },
    ].sort((x, y) => y.v - x.v)

    await client.execute({
      sql: `INSERT INTO profil_riasec (id, utilisateur_id, r, i, a, s, e, c, dimensions_dominantes, traits, interets, forces, suggestion, est_stable, mis_a_jour_le)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [uuidv4(), userId, riasec.r, riasec.i, riasec.a, riasec.s, riasec.e, riasec.c,
        JSON.stringify(scores.slice(0, 2).map(x => x.k)),
        JSON.stringify(b.traits), JSON.stringify(b.interets), JSON.stringify(b.forces),
        b.suggestion, b.confiance > 0.7 ? 1 : 0, now],
    })

    // Indice de confiance
    await client.execute({
      sql: `INSERT INTO indice_confiance (id, utilisateur_id, score_global, niveau, volume, stabilite, differenciation, coherence, nb_messages, nb_instantanes, mis_a_jour_le)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [uuidv4(), userId, b.confiance, b.niveau,
        +(Math.random() * 0.5 + 0.3).toFixed(2), +(Math.random() * 0.5 + 0.3).toFixed(2),
        +(Math.random() * 0.5 + 0.3).toFixed(2), +(Math.random() * 0.5 + 0.3).toFixed(2),
        b.messages.length, Math.floor(b.messages.length / 3), now],
    })

    // Referral — source: ~60% sourcee (indices 0,1,2,3,5,6,8,9,11,13,16,17), ~40% generique (reste)
    const niveauDetection = b.priorite === 'critique' ? 3 : b.priorite === 'haute' ? 2 : 1
    const sourceeIndices = [0, 1, 2, 3, 5, 6, 8, 9, 11, 13, 16, 17]
    const referralSource = sourceeIndices.includes(idx) ? 'sourcee' : 'generique'
    // Pour les sourcee, on attribue la structure du conseiller associé
    const structSuggereId = referralSource === 'sourcee' ? structureIds[CONSEILLERS_DATA[b.consIdx].structIdx] : null
    await client.execute({
      sql: `INSERT INTO referral (id, utilisateur_id, conversation_id, priorite, niveau_detection, motif, resume_conversation, moyen_contact, type_contact, statut, source, structure_suggeree_id, localisation, genre, age_beneficiaire, cree_le, mis_a_jour_le)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [refId, userId, convId, b.priorite, niveauDetection, b.motif, b.resume,
        contact, contactType, statut, referralSource, structSuggereId, b.dep, b.genre, b.age, creeLe, now],
    })

    // Prise en charge + messages directs for prise_en_charge and terminee
    if (statut === 'prise_en_charge' || statut === 'terminee') {
      const pecId = uuidv4()
      const consIdx = b.consIdx
      const consId = conseillerIds[consIdx]
      const consData = CONSEILLERS_DATA[consIdx]
      const structIdx = consData.structIdx
      const scoreMatching = +(0.6 + Math.random() * 0.35).toFixed(2)

      await client.execute({
        sql: `INSERT INTO prise_en_charge (id, referral_id, conseiller_id, structure_id, statut, score_matching, raison_matching, premiere_action_le, terminee_le, notification_envoyee, cree_le, mis_a_jour_le)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        args: [pecId, refId, consId, structureIds[structIdx],
          statut === 'terminee' ? 'terminee' : 'prise_en_charge',
          scoreMatching,
          `Matching automatique: departement ${b.dep}, profil ${scores.slice(0, 2).map(x => x.k).join('-')}`,
          randomDate(heuresPassees - 1),
          statut === 'terminee' ? randomDate(Math.floor(heuresPassees / 3)) : null,
          randomDate(heuresPassees - 1), now],
      })

      // Direct messages (2–5 messages)
      const directMsgs: Array<{ type: string; id: string; contenu: string }> = []

      if (statut === 'prise_en_charge') {
        directMsgs.push(
          { type: 'conseiller', id: consId, contenu: `Bonjour ${b.prenom} ! Je suis ${consData.prenom} ${consData.nom}, votre conseiller(e) referent(e). J'ai pris connaissance de votre profil et je suis la pour vous accompagner.` },
          { type: 'beneficiaire', id: userId, contenu: `Bonjour ${consData.prenom} ! Merci beaucoup de me prendre en charge. J'ai vraiment besoin d'aide pour mon orientation.` },
          { type: 'conseiller', id: consId, contenu: `Bien sur ! J'ai lu le resume de votre echange avec l'IA. Votre profil est interessant. Quand seriez-vous disponible pour un premier rendez-vous ?` },
          { type: 'beneficiaire', id: userId, contenu: `Je suis disponible en semaine apres 16h. Est-ce que mardi prochain ca vous irait ?` },
          { type: 'conseiller', id: consId, contenu: `Mardi a 16h30 c'est parfait. Je vous enverrai un lien de visioconference. D'ici la, n'hesitez pas si vous avez des questions.` },
        )
      } else {
        // terminee — shorter exchange
        directMsgs.push(
          { type: 'conseiller', id: consId, contenu: `Bonjour ${b.prenom} ! Je suis ${consData.prenom} ${consData.nom}. J'ai pris connaissance de votre dossier.` },
          { type: 'beneficiaire', id: userId, contenu: `Bonjour ! Merci de m'accompagner.` },
          { type: 'conseiller', id: consId, contenu: `Nous avons fait du bon travail ensemble. Je cloture votre accompagnement. N'hesitez pas a revenir si besoin !` },
        )
      }

      const dmTimestamps = msgTimestamps(heuresPassees - 2, directMsgs.length)
      for (let di = 0; di < directMsgs.length; di++) {
        await client.execute({
          sql: `INSERT INTO message_direct (id, prise_en_charge_id, expediteur_type, expediteur_id, contenu, conversation_type, lu, horodatage)
                VALUES (?, ?, ?, ?, ?, 'direct', ?, ?)`,
          args: [uuidv4(), pecId, directMsgs[di].type, directMsgs[di].id, directMsgs[di].contenu,
            statut === 'terminee' ? 1 : (di < directMsgs.length - 1 ? 1 : 0),
            dmTimestamps[di]],
        })
        totalDirectMessages++
      }

      // Code de verification (pour tester le login beneficiaire)
      const pinCode = String(100000 + idx)
      await client.execute({
        sql: `INSERT INTO code_verification (id, referral_id, utilisateur_id, code, token, verifie, tentatives, expire_le, cree_le)
              VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?)`,
        args: [uuidv4(), refId, userId, pinCode, `test-token-${prenomLower}`,
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), now],
      })
    }

    console.log(`  + ${b.prenom} (${b.age} ans, ${b.situation}, dep ${b.dep}) -- ${b.messages.length} messages -- ${statut}`)
  }

  // === SUMMARY ===
  console.log('\n[6/6] Resume\n')
  console.log('='.repeat(60))
  console.log('  Structures :   10')
  console.log('  Conseillers :  10')
  console.log('  Beneficiaires: 20')
  console.log(`  Messages IA :  ${totalMessages}`)
  console.log(`  Messages dir : ${totalDirectMessages}`)
  console.log('='.repeat(60))

  console.log('\nComptes de test (mot de passe : catchup2026) :')
  console.log('-'.repeat(70))
  for (const c of CONSEILLERS_DATA) {
    const struct = STRUCTURES_DATA[c.structIdx].nom
    console.log(`  ${c.role.padEnd(16)} ${c.email.padEnd(42)} ${struct}`)
  }
  console.log('-'.repeat(70))

  console.log('\nStatuts des referrals :')
  const enAttente = statuts.filter(s => s === 'en_attente').length
  const priseEnCharge = statuts.filter(s => s === 'prise_en_charge').length
  const terminee = statuts.filter(s => s === 'terminee').length
  console.log(`  en_attente:      ${enAttente}`)
  console.log(`  prise_en_charge: ${priseEnCharge}`)
  console.log(`  terminee:        ${terminee}`)

  console.log('\nTokens de test pour l\'accompagnement beneficiaire :')
  console.log('  test-token-{prenom} (ex: test-token-lucas, test-token-emma)')
  console.log('  Page : /accompagnement\n')

  await client.end()
  process.exit(0)
}

seed().catch(err => {
  console.error('ERREUR seed:', err)
  process.exit(1)
})
