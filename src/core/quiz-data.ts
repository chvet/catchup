// === Donnees statiques du mini-quiz d'orientation ===

export type RIASECDimension = 'R' | 'I' | 'A' | 'S' | 'E' | 'C'

export interface QuizChoice {
  emoji: string
  label: string
  dimension: RIASECDimension
}

export interface QuizQuestion {
  id: number
  question: string
  left: QuizChoice
  right: QuizChoice
}

export interface QuizResult {
  emoji: string
  title: string
  description: string
  pistes: string[]
}

// --- Questions ---

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'Le week-end, tu preferes...',
    left:  { emoji: '\u{1F527}', label: 'Construire / reparer un truc',   dimension: 'R' },
    right: { emoji: '\u{1F3A8}', label: 'Creer quelque chose',            dimension: 'A' },
  },
  {
    id: 2,
    question: 'Avec les autres, t\u2019es plutot...',
    left:  { emoji: '\u{1F91D}', label: 'Celui qui ecoute et aide',       dimension: 'S' },
    right: { emoji: '\u{1F680}', label: 'Celui qui mene et organise',     dimension: 'E' },
  },
  {
    id: 3,
    question: 'Ce qui te fait kiffer...',
    left:  { emoji: '\u{1F52C}', label: 'Comprendre comment ca marche',   dimension: 'I' },
    right: { emoji: '\u{1F4CA}', label: 'Que tout soit bien range et carre', dimension: 'C' },
  },
]

// --- Scoring ---

export const BASE_SCORE = 20
export const CHOICE_BONUS = 35

/** Ordre de priorite pour le departage (A > S > I > E > R > C) */
export const PRIORITY_ORDER: RIASECDimension[] = ['A', 'S', 'I', 'E', 'R', 'C']

export function computeScores(answers: (0 | 1)[]): Record<RIASECDimension, number> {
  const scores: Record<RIASECDimension, number> = {
    R: BASE_SCORE,
    I: BASE_SCORE,
    A: BASE_SCORE,
    S: BASE_SCORE,
    E: BASE_SCORE,
    C: BASE_SCORE,
  }

  answers.forEach((answer, index) => {
    const question = QUIZ_QUESTIONS[index]
    if (!question) return
    const chosen = answer === 0 ? question.left : question.right
    scores[chosen.dimension] += CHOICE_BONUS
  })

  return scores
}

export function getTopTwo(scores: Record<RIASECDimension, number>): [RIASECDimension, RIASECDimension] {
  const sorted = PRIORITY_ORDER
    .map((dim) => ({ dim, score: scores[dim] }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      // En cas d'egalite, PRIORITY_ORDER fait foi (indexOf plus bas = priorite plus haute)
      return PRIORITY_ORDER.indexOf(a.dim) - PRIORITY_ORDER.indexOf(b.dim)
    })

  return [sorted[0].dim, sorted[1].dim]
}

export function getResultKey(top: [RIASECDimension, RIASECDimension]): string {
  // La cle est toujours dans l'ordre canonique defini par le tableau de resultats
  const allKeys = Object.keys(QUIZ_RESULTS)
  const forward = `${top[0]}-${top[1]}`
  const backward = `${top[1]}-${top[0]}`
  if (allKeys.includes(forward)) return forward
  if (allKeys.includes(backward)) return backward
  return forward
}

// --- 15 descriptions de resultats ---

export const QUIZ_RESULTS: Record<string, QuizResult> = {
  'R-I': {
    emoji: '\u{1F527}\u{1F52C}',
    title: 'Realiste-Investigateur',
    description:
      'T\u2019es du genre concret ET curieux. Tu veux comprendre comment ca marche, et tu sais mettre les mains dedans. Ingenierie, labo, mecatronique... les metiers techniques de pointe sont faits pour toi !',
    pistes: ['Ingenieur', 'Technicien labo', 'Mecatronicien'],
  },
  'R-A': {
    emoji: '\u{1F527}\u{1F3A8}',
    title: 'Realiste-Artiste',
    description:
      'Tu as les mains habiles et l\u2019oeil creatif. Artisanat, design produit, ebenisterie... tu pourrais creer des trucs magnifiques qui existent pour de vrai !',
    pistes: ['Artisan', 'Ebeniste', 'Designer produit'],
  },
  'R-S': {
    emoji: '\u{1F527}\u{1F91D}',
    title: 'Realiste-Social',
    description:
      'Tu aimes le concret ET les gens. Educateur technique, ergotherapeute, formateur... tu peux transmettre ton savoir-faire tout en aidant les autres.',
    pistes: ['Educateur technique', 'Ergotherapeute', 'Formateur'],
  },
  'R-E': {
    emoji: '\u{1F527}\u{1F680}',
    title: 'Realiste-Entreprenant',
    description:
      'Tu es un batisseur qui sait mener. Chef de chantier, entrepreneur BTP, responsable technique... tu construis ET tu diriges !',
    pistes: ['Chef de chantier', 'Entrepreneur BTP', 'Responsable technique'],
  },
  'R-C': {
    emoji: '\u{1F527}\u{1F4CA}',
    title: 'Realiste-Conventionnel',
    description:
      'Methodique et concret, tu aimes que les choses soient bien faites et bien rangees. Topographe, controleur qualite, logisticien... la precision, c\u2019est ton truc !',
    pistes: ['Topographe', 'Controleur qualite', 'Logisticien'],
  },
  'I-A': {
    emoji: '\u{1F52C}\u{1F3A8}',
    title: 'Investigateur-Artiste',
    description:
      'Curieux et creatif, tu melanges la reflexion et l\u2019imagination. Architecte, UX designer, chercheur en art... tu inventes le futur avec style !',
    pistes: ['Architecte', 'UX designer', 'Chercheur en art'],
  },
  'I-S': {
    emoji: '\u{1F52C}\u{1F91D}',
    title: 'Investigateur-Social',
    description:
      'Tu veux comprendre les gens autant que le monde. Medecin, psychologue, chercheur en sciences sociales... tu analyses pour mieux aider.',
    pistes: ['Medecin', 'Psychologue', 'Chercheur social'],
  },
  'I-E': {
    emoji: '\u{1F52C}\u{1F680}',
    title: 'Investigateur-Entreprenant',
    description:
      'T\u2019es du genre a comprendre comment ca marche ET a vouloir en faire quelque chose. Data, consulting, entrepreneuriat tech... les possibilites sont larges !',
    pistes: ['Data scientist', 'Consultant', 'Entrepreneur tech'],
  },
  'I-C': {
    emoji: '\u{1F52C}\u{1F4CA}',
    title: 'Investigateur-Conventionnel',
    description:
      'Rigoureux et curieux, tu aimes creuser les sujets a fond avec methode. Comptabilite experte, audit, actuariat... la precision analytique, c\u2019est ton game !',
    pistes: ['Comptable expert', 'Auditeur', 'Actuaire'],
  },
  'A-S': {
    emoji: '\u{1F3A8}\u{1F91D}',
    title: 'Artiste-Social',
    description:
      'Tu es creatif et tu aimes les gens. Tu pourrais t\u2019eclater dans le design, l\u2019animation, l\u2019education ou le social. Y\u2019a plein de metiers qui melangent les deux \u2014 viens en discuter !',
    pistes: ['Designer', 'Animateur', 'Art-therapeute', 'Educateur'],
  },
  'A-E': {
    emoji: '\u{1F3A8}\u{1F680}',
    title: 'Artiste-Entreprenant',
    description:
      'Creatif et entrepreneur, tu veux faire tes propres regles. Directeur artistique, createur de contenu, fondateur de marque... tu crees et tu entreprends !',
    pistes: ['Directeur artistique', 'Createur de contenu', 'Fondateur de marque'],
  },
  'A-C': {
    emoji: '\u{1F3A8}\u{1F4CA}',
    title: 'Artiste-Conventionnel',
    description:
      'Creatif et organise, tu allies l\u2019imagination a la rigueur. Graphiste, webdesigner, architecte d\u2019interieur... tu crees dans un cadre structure !',
    pistes: ['Graphiste', 'Webdesigner', 'Architecte d\'interieur'],
  },
  'S-E': {
    emoji: '\u{1F91D}\u{1F680}',
    title: 'Social-Entreprenant',
    description:
      'Leader et humain, tu sais entrainer les gens avec toi. Manager, RH, directeur associatif... tu fais avancer les equipes avec bienveillance !',
    pistes: ['Manager', 'RH', 'Directeur associatif'],
  },
  'S-C': {
    emoji: '\u{1F91D}\u{1F4CA}',
    title: 'Social-Conventionnel',
    description:
      'Humain et organise, tu aimes aider les gens de facon concrete et structuree. Assistant social, gestionnaire de paie, conseiller... tu mets de l\u2019ordre pour le bien de tous !',
    pistes: ['Assistant social', 'Gestionnaire de paie', 'Conseiller'],
  },
  'E-C': {
    emoji: '\u{1F680}\u{1F4CA}',
    title: 'Entreprenant-Conventionnel',
    description:
      'Leader et organise, tu sais piloter des projets avec methode. Chef de projet, gestionnaire, banquier... tu menes la barque d\u2019une main sure !',
    pistes: ['Chef de projet', 'Gestionnaire', 'Banquier'],
  },
}

// --- Labels des dimensions (pour l'affichage) ---

export const DIMENSION_LABELS: Record<RIASECDimension, string> = {
  R: 'Realiste',
  I: 'Investigateur',
  A: 'Artiste',
  S: 'Social',
  E: 'Entreprenant',
  C: 'Conventionnel',
}

export const DIMENSION_EMOJIS: Record<RIASECDimension, string> = {
  R: '\u{1F527}',
  I: '\u{1F52C}',
  A: '\u{1F3A8}',
  S: '\u{1F91D}',
  E: '\u{1F680}',
  C: '\u{1F4CA}',
}
