// Schema Drizzle complet — Catch'Up
// Tables bénéficiaire + Espace Conseiller

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// === TABLES BÉNÉFICIAIRE ===

export const utilisateur = sqliteTable('utilisateur', {
  id: text('id').primaryKey(),
  prenom: text('prenom'),
  email: text('email').unique(),
  emailVerifie: integer('email_verifie').default(0),
  telephone: text('telephone'),
  age: integer('age'),
  situation: text('situation'),
  codeParrainage: text('code_parrainage').unique(),
  parrainePar: text('parraine_par'),
  source: text('source'),
  sourceDetail: text('source_detail'),
  plateforme: text('plateforme').default('web'),
  preferences: text('preferences'),
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
  motDePasse: text('mot_de_passe'),
  sessionToken: text('session_token').unique(),
  sessionTokenExpireLe: text('session_token_expire_le'),
  derniereVisite: text('derniere_visite'),
  supprimeLe: text('supprime_le'),
})

export const conversation = sqliteTable('conversation', {
  id: text('id').primaryKey(),
  utilisateurId: text('utilisateur_id').notNull().references(() => utilisateur.id),
  titre: text('titre'),
  statut: text('statut').default('active'),
  origine: text('origine').default('direct'),
  nbMessages: integer('nb_messages').default(0),
  phase: text('phase').default('accroche'),
  dureeSecondes: integer('duree_secondes').default(0),
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

export const message = sqliteTable('message', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull().references(() => conversation.id),
  role: text('role').notNull(),
  contenu: text('contenu').notNull(),
  contenuBrut: text('contenu_brut'),
  urlAudio: text('url_audio'),
  fragiliteDetectee: integer('fragilite_detectee').default(0),
  niveauFragilite: text('niveau_fragilite'),
  profilExtrait: integer('profil_extrait').default(0),
  horodatage: text('horodatage').notNull(),
})

export const profilRiasec = sqliteTable('profil_riasec', {
  id: text('id').primaryKey(),
  utilisateurId: text('utilisateur_id').notNull().unique().references(() => utilisateur.id),
  r: integer('r').default(0),
  i: integer('i').default(0),
  a: integer('a').default(0),
  s: integer('s').default(0),
  e: integer('e').default(0),
  c: integer('c').default(0),
  dimensionsDominantes: text('dimensions_dominantes'),
  traits: text('traits'),
  interets: text('interets'),
  forces: text('forces'),
  suggestion: text('suggestion'),
  source: text('source').default('conversation'),
  estStable: integer('est_stable').default(0),
  coherenceSignaux: text('coherence_signaux').default('mixte'),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

export const instantaneProfil = sqliteTable('instantane_profil', {
  id: text('id').primaryKey(),
  utilisateurId: text('utilisateur_id').notNull().references(() => utilisateur.id),
  conversationId: text('conversation_id').notNull().references(() => conversation.id),
  indexMessage: integer('index_message').notNull(),
  r: integer('r').default(0),
  i: integer('i').default(0),
  a: integer('a').default(0),
  s: integer('s').default(0),
  e: integer('e').default(0),
  c: integer('c').default(0),
  coherenceSignaux: text('coherence_signaux'),
  horodatage: text('horodatage').notNull(),
})

export const indiceConfiance = sqliteTable('indice_confiance', {
  id: text('id').primaryKey(),
  utilisateurId: text('utilisateur_id').notNull().unique().references(() => utilisateur.id),
  scoreGlobal: real('score_global').default(0),
  niveau: text('niveau').default('debut'),
  volume: real('volume').default(0),
  stabilite: real('stabilite').default(0),
  differenciation: real('differenciation').default(0),
  coherence: real('coherence').default(0),
  nbMessages: integer('nb_messages').default(0),
  nbInstantanes: integer('nb_instantanes').default(0),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

export const referral = sqliteTable('referral', {
  id: text('id').primaryKey(),
  utilisateurId: text('utilisateur_id').notNull().references(() => utilisateur.id),
  conversationId: text('conversation_id').notNull().references(() => conversation.id),
  priorite: text('priorite').notNull(),
  niveauDetection: integer('niveau_detection').notNull(),
  motif: text('motif'),
  resumeConversation: text('resume_conversation'),
  moyenContact: text('moyen_contact'),
  typeContact: text('type_contact'),
  statut: text('statut').default('en_attente'),
  source: text('source').default('generique'), // 'sourcee' | 'generique'
  campagneId: text('campagne_id'),
  webhookEnvoye: integer('webhook_envoye').default(0),
  webhookReponse: text('webhook_reponse'),
  relanceEnvoyee: integer('relance_envoyee').default(0),
  // Colonnes ajoutées pour le matching conseiller
  structureSuggereId: text('structure_suggeree_id'),
  localisation: text('localisation'),
  genre: text('genre'),
  ageBeneficiaire: integer('age_beneficiaire'),
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
  recontacteLe: text('recontacte_le'),
})

export const evenementQuiz = sqliteTable('evenement_quiz', {
  id: text('id').primaryKey(),
  utilisateurId: text('utilisateur_id').references(() => utilisateur.id),
  reponses: text('reponses').notNull(),
  resultat: text('resultat').notNull(),
  dureeMs: integer('duree_ms'),
  codeParrainage: text('code_parrainage'),
  sourcePrescripteur: text('source_prescripteur'),
  aPartage: integer('a_partage').default(0),
  aContinueChat: integer('a_continue_chat').default(0),
  horodatage: text('horodatage').notNull(),
})

export const sourceCaptation = sqliteTable('source_captation', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  type: text('type').notNull(),
  nom: text('nom'),
  nbVisites: integer('nb_visites').default(0),
  nbQuizCompletes: integer('nb_quiz_completes').default(0),
  nbChatsOuverts: integer('nb_chats_ouverts').default(0),
  nbEmailsCollectes: integer('nb_emails_collectes').default(0),
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

export const sessionMagicLink = sqliteTable('session_magic_link', {
  id: text('id').primaryKey(),
  utilisateurId: text('utilisateur_id').notNull().references(() => utilisateur.id),
  email: text('email').notNull(),
  jeton: text('jeton').notNull().unique(),
  utilise: integer('utilise').default(0),
  expireLe: text('expire_le').notNull(),
  creeLe: text('cree_le').notNull(),
  utiliseLe: text('utilise_le'),
})

// === TABLES ESPACE CONSEILLER ===

export const structure = sqliteTable('structure', {
  id: text('id').primaryKey(),
  nom: text('nom').notNull(),
  slug: text('slug').unique(),
  type: text('type').notNull(),
  departements: text('departements').notNull(),
  regions: text('regions'),
  ageMin: integer('age_min').default(16),
  ageMax: integer('age_max').default(25),
  specialites: text('specialites'),
  genrePreference: text('genre_preference'),
  capaciteMax: integer('capacite_max').default(50),
  adresse: text('adresse'),
  codePostal: text('code_postal'),
  ville: text('ville'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  webhookUrl: text('webhook_url'),
  parcoureoId: text('parcoureo_id'),
  promptPersonnalise: text('prompt_personnalise'), // Custom AI behavior prompt set by admin_structure
  logoUrl: text('logo_url'), // Structure logo (relative path to uploaded image)
  actif: integer('actif').default(1),
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

export const conseiller = sqliteTable('conseiller', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  motDePasse: text('mot_de_passe'),
  prenom: text('prenom').notNull(),
  nom: text('nom').notNull(),
  role: text('role').default('conseiller'),
  structureId: text('structure_id').references(() => structure.id),
  parcoureoId: text('parcoureo_id'),
  actif: integer('actif').default(1),
  derniereConnexion: text('derniere_connexion'),
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

export const priseEnCharge = sqliteTable('prise_en_charge', {
  id: text('id').primaryKey(),
  referralId: text('referral_id').notNull().references(() => referral.id),
  conseillerId: text('conseiller_id').notNull().references(() => conseiller.id),
  structureId: text('structure_id').notNull().references(() => structure.id),
  statut: text('statut').default('nouvelle'),
  notes: text('notes'),
  scoreMatching: real('score_matching'),
  raisonMatching: text('raison_matching'),
  assigneeManuellement: integer('assignee_manuellement').default(0),
  premiereActionLe: text('premiere_action_le'),
  termineeLe: text('terminee_le'),
  notificationEnvoyee: integer('notification_envoyee').default(0),
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

export const sessionConseiller = sqliteTable('session_conseiller', {
  id: text('id').primaryKey(),
  conseillerId: text('conseiller_id').notNull().references(() => conseiller.id),
  jeton: text('jeton').notNull().unique(),
  expireLe: text('expire_le').notNull(),
  revoque: integer('revoque').default(0),
  creeLe: text('cree_le').notNull(),
})

export const evenementAudit = sqliteTable('evenement_audit', {
  id: text('id').primaryKey(),
  conseillerId: text('conseiller_id'),
  action: text('action').notNull(),
  cibleType: text('cible_type'),
  cibleId: text('cible_id'),
  details: text('details'),
  ip: text('ip'),
  horodatage: text('horodatage').notNull(),
})

// === TABLES MESSAGERIE DIRECTE ===

export const messageDirect = sqliteTable('message_direct', {
  id: text('id').primaryKey(),
  priseEnChargeId: text('prise_en_charge_id').notNull().references(() => priseEnCharge.id),
  expediteurType: text('expediteur_type').notNull(), // 'beneficiaire' | 'conseiller' | 'tiers'
  expediteurId: text('expediteur_id').notNull(),
  contenu: text('contenu').notNull(),
  conversationType: text('conversation_type').default('direct'), // 'direct' | 'groupe' | 'tiers_beneficiaire'
  lu: integer('lu').default(0),
  horodatage: text('horodatage').notNull(),
})

// === TABLES ACCOMPAGNEMENT GROUPE (tiers, consentement, journal, bris de glace) ===

// Tiers intervenant — profil d'une personne externe invitée par le conseiller
export const tiersIntervenant = sqliteTable('tiers_intervenant', {
  id: text('id').primaryKey(),
  priseEnChargeId: text('prise_en_charge_id').notNull().references(() => priseEnCharge.id),
  nom: text('nom').notNull(),
  prenom: text('prenom').notNull(),
  telephone: text('telephone').notNull(),
  role: text('role').notNull(), // 'employeur' | 'educateur' | 'formateur' | 'assistant_social' | 'autre'
  inviteParId: text('invite_par_id').notNull().references(() => conseiller.id),
  statut: text('statut').default('en_attente'), // 'en_attente' | 'approuve' | 'refuse' | 'revoque'
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

// Participant conversation — qui est présent dans un accompagnement
export const participantConversation = sqliteTable('participant_conversation', {
  id: text('id').primaryKey(),
  priseEnChargeId: text('prise_en_charge_id').notNull().references(() => priseEnCharge.id),
  participantType: text('participant_type').notNull(), // 'conseiller' | 'beneficiaire' | 'tiers'
  participantId: text('participant_id').notNull(),
  actif: integer('actif').default(1),
  rejoindLe: text('rejoint_le').notNull(),
  quitteLe: text('quitte_le'),
})

// Demande de consentement — double approbation pour ajouter un tiers
export const demandeConsentement = sqliteTable('demande_consentement', {
  id: text('id').primaryKey(),
  priseEnChargeId: text('prise_en_charge_id').notNull().references(() => priseEnCharge.id),
  tiersId: text('tiers_id').notNull().references(() => tiersIntervenant.id),
  demandeurId: text('demandeur_id').notNull(), // conseiller qui a initié
  statut: text('statut').default('en_attente'), // 'en_attente' | 'approuvee' | 'refusee' | 'expiree'
  conseillerApprouve: integer('conseiller_approuve').default(0),
  conseillerApproveLe: text('conseiller_approuve_le'),
  beneficiaireApprouve: integer('beneficiaire_approuve').default(0),
  beneficiaireApproveLe: text('beneficiaire_approuve_le'),
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

// Journal des événements — traçabilité complète pour le conseiller référent
export const evenementJournal = sqliteTable('evenement_journal', {
  id: text('id').primaryKey(),
  priseEnChargeId: text('prise_en_charge_id').notNull().references(() => priseEnCharge.id),
  type: text('type').notNull(), // 'message_envoye' | 'participant_rejoint' | 'participant_quitte' | 'consentement_demande' | 'consentement_accepte' | 'consentement_refuse' | 'video_proposee' | 'video_acceptee' | 'video_refusee' | 'rdv_planifie' | 'bris_de_glace' | 'tiers_invite' | 'tiers_revoque'
  acteurType: text('acteur_type').notNull(), // 'conseiller' | 'beneficiaire' | 'tiers' | 'systeme'
  acteurId: text('acteur_id').notNull(),
  cibleType: text('cible_type'), // entité ciblée (optionnel)
  cibleId: text('cible_id'),
  resume: text('resume'), // résumé lisible en 1 ligne
  details: text('details'), // JSON avec métadonnées supplémentaires
  horodatage: text('horodatage').notNull(),
})

// Rendez-vous — planification de RDV entre conseiller/tiers et bénéficiaire
export const rendezVous = sqliteTable('rendez_vous', {
  id: text('id').primaryKey(),
  priseEnChargeId: text('prise_en_charge_id').notNull().references(() => priseEnCharge.id),
  titre: text('titre').notNull(),
  description: text('description'),
  dateHeure: text('date_heure').notNull(), // ISO 8601
  dureeMinutes: integer('duree_minutes').default(30),
  lieu: text('lieu'), // 'visio' | adresse physique | null
  lienVisio: text('lien_visio'), // URL Jitsi si visio
  statut: text('statut').default('planifie'), // planifie | confirme | annule | termine
  organisateurType: text('organisateur_type').notNull(), // 'conseiller' | 'tiers'
  organisateurId: text('organisateur_id').notNull(),
  // Participants invités (JSON array of { type, id, nom, statut })
  participants: text('participants'), // JSON
  rappelEnvoye: integer('rappel_envoye').default(0),
  googleEventId: text('google_event_id'),
  outlookEventId: text('outlook_event_id'),
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

// Bris de glace — accès d'urgence du conseiller aux échanges tiers ↔ bénéficiaire
export const brisDeGlace = sqliteTable('bris_de_glace', {
  id: text('id').primaryKey(),
  conseillerId: text('conseiller_id').notNull().references(() => conseiller.id),
  priseEnChargeId: text('prise_en_charge_id').notNull().references(() => priseEnCharge.id),
  tiersId: text('tiers_id').notNull().references(() => tiersIntervenant.id),
  justification: text('justification').notNull(),
  ip: text('ip'),
  horodatage: text('horodatage').notNull(),
})

// === PUSH NOTIFICATIONS ===

export const pushSubscription = sqliteTable('push_subscription', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'conseiller' | 'beneficiaire'
  userId: text('user_id').notNull(), // conseillerId or utilisateurId
  endpoint: text('endpoint').notNull(),
  keysP256dh: text('keys_p256dh').notNull(),
  keysAuth: text('keys_auth').notNull(),
  creeLe: text('cree_le').notNull(),
})

// === VÉRIFICATION / AUTHENTIFICATION ===

// === ENQUÊTE DE SATISFACTION ===

export const enqueteSatisfaction = sqliteTable('enquete_satisfaction', {
  id: text('id').primaryKey(),
  priseEnChargeId: text('prise_en_charge_id').notNull().references(() => priseEnCharge.id),
  utilisateurId: text('utilisateur_id').notNull(),
  // Scores 1-5
  noteGlobale: integer('note_globale'),
  noteEcoute: integer('note_ecoute'),
  noteUtilite: integer('note_utilite'),
  noteConseiller: integer('note_conseiller'),
  noteRecommandation: integer('note_recommandation'), // NPS 0-10
  // Open text
  commentaire: text('commentaire'),
  pointsForts: text('points_forts'),
  ameliorations: text('ameliorations'),
  // Meta
  completee: integer('completee').default(0),
  creeLe: text('cree_le').notNull(),
})

// === RAPPELS AUTOMATIQUES ===

export const rappel = sqliteTable('rappel', {
  id: text('id').primaryKey(),
  priseEnChargeId: text('prise_en_charge_id').notNull().references(() => priseEnCharge.id),
  type: text('type').notNull(), // 'beneficiaire_inactif' | 'conseiller_alerte'
  statut: text('statut').default('en_attente'), // en_attente | envoye | annule
  dateEnvoi: text('date_envoi').notNull(),
  contenu: text('contenu'),
  creeLe: text('cree_le').notNull(),
})

// === CAMPAGNES (objectifs par structure) ===

export const campagne = sqliteTable('campagne', {
  id: text('id').primaryKey(),
  structureId: text('structure_id').notNull().references(() => structure.id),
  slug: text('slug'), // slug permanent pour QR code (unique par structure)
  designation: text('designation').notNull(),
  quantiteObjectif: integer('quantite_objectif').notNull(),
  uniteOeuvre: text('unite_oeuvre').notNull(), // 'Bénéficiaire(s)', 'Lead(s)', 'CA', custom...
  dateDebut: text('date_debut').notNull(),
  dateFin: text('date_fin').notNull(),
  statut: text('statut').default('active'), // active | terminee | archivee
  remplaceeParId: text('remplacee_par_id'), // FK vers la campagne qui l'a remplacée
  archiveeLe: text('archivee_le'),
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

export const campagneAssignation = sqliteTable('campagne_assignation', {
  id: text('id').primaryKey(),
  campagneId: text('campagne_id').notNull().references(() => campagne.id),
  conseillerId: text('conseiller_id').notNull().references(() => conseiller.id),
  creeLe: text('cree_le').notNull(),
})

// === CONNEXIONS CALENDRIER (Google / Outlook OAuth2) ===

export const calendarConnection = sqliteTable('calendar_connection', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'conseiller' | 'beneficiaire'
  userId: text('user_id').notNull(),
  provider: text('provider').notNull(), // 'google' | 'outlook'
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  expiresAt: text('expires_at'),
  email: text('email'), // calendar account email
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

// === VÉRIFICATION / AUTHENTIFICATION ===

export const codeVerification = sqliteTable('code_verification', {
  id: text('id').primaryKey(),
  referralId: text('referral_id').notNull().references(() => referral.id),
  utilisateurId: text('utilisateur_id').notNull(),
  code: text('code').notNull(),
  token: text('token').unique(),
  verifie: integer('verifie').default(0),
  tentatives: integer('tentatives').default(0),
  expireLe: text('expire_le').notNull(),
  creeLe: text('cree_le').notNull(),
})
