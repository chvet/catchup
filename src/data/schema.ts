// Schema Drizzle complet — Catch'Up (PostgreSQL)
// Tables bénéficiaire + Espace Conseiller

import { pgTable, text, integer, real } from 'drizzle-orm/pg-core'

// === TABLES BÉNÉFICIAIRE ===

export const utilisateur = pgTable('utilisateur', {
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

export const conversation = pgTable('conversation', {
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

export const message = pgTable('message', {
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

export const profilRiasec = pgTable('profil_riasec', {
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

export const instantaneProfil = pgTable('instantane_profil', {
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

export const indiceConfiance = pgTable('indice_confiance', {
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

export const referral = pgTable('referral', {
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
  preferenceStructure: text('preference_structure'), // 'privee' | 'publique' | 'indifferent'
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
  recontacteLe: text('recontacte_le'),
})

export const evenementQuiz = pgTable('evenement_quiz', {
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

export const sourceCaptation = pgTable('source_captation', {
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

export const sessionMagicLink = pgTable('session_magic_link', {
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

export const structure = pgTable('structure', {
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
  statut: text('statut').default('public'), // 'public' | 'prive_non_lucratif' | 'lucratif'
  tauxTva: real('taux_tva').default(20.0), // Taux TVA en % (20, 10, 5.5, 0) — utilisé pour structures lucratives
  actif: integer('actif').default(1),
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

export const conseiller = pgTable('conseiller', {
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

export const priseEnCharge = pgTable('prise_en_charge', {
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

export const sessionConseiller = pgTable('session_conseiller', {
  id: text('id').primaryKey(),
  conseillerId: text('conseiller_id').notNull().references(() => conseiller.id),
  jeton: text('jeton').notNull().unique(),
  expireLe: text('expire_le').notNull(),
  revoque: integer('revoque').default(0),
  creeLe: text('cree_le').notNull(),
})

export const evenementAudit = pgTable('evenement_audit', {
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

export const messageDirect = pgTable('message_direct', {
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
export const tiersIntervenant = pgTable('tiers_intervenant', {
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
export const participantConversation = pgTable('participant_conversation', {
  id: text('id').primaryKey(),
  priseEnChargeId: text('prise_en_charge_id').notNull().references(() => priseEnCharge.id),
  participantType: text('participant_type').notNull(), // 'conseiller' | 'beneficiaire' | 'tiers'
  participantId: text('participant_id').notNull(),
  actif: integer('actif').default(1),
  rejoindLe: text('rejoint_le').notNull(),
  quitteLe: text('quitte_le'),
})

// Demande de consentement — double approbation pour ajouter un tiers
export const demandeConsentement = pgTable('demande_consentement', {
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
export const evenementJournal = pgTable('evenement_journal', {
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
export const rendezVous = pgTable('rendez_vous', {
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
export const brisDeGlace = pgTable('bris_de_glace', {
  id: text('id').primaryKey(),
  conseillerId: text('conseiller_id').notNull().references(() => conseiller.id),
  priseEnChargeId: text('prise_en_charge_id').notNull().references(() => priseEnCharge.id),
  tiersId: text('tiers_id').notNull().references(() => tiersIntervenant.id),
  justification: text('justification').notNull(),
  ip: text('ip'),
  horodatage: text('horodatage').notNull(),
})

// === PUSH NOTIFICATIONS ===

export const pushSubscription = pgTable('push_subscription', {
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

export const enqueteSatisfaction = pgTable('enquete_satisfaction', {
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

export const rappel = pgTable('rappel', {
  id: text('id').primaryKey(),
  priseEnChargeId: text('prise_en_charge_id').notNull().references(() => priseEnCharge.id),
  type: text('type').notNull(), // 'beneficiaire_inactif' | 'conseiller_alerte'
  statut: text('statut').default('en_attente'), // en_attente | envoye | annule
  dateEnvoi: text('date_envoi').notNull(),
  contenu: text('contenu'),
  creeLe: text('cree_le').notNull(),
})

// === CAMPAGNES (objectifs par structure) ===

export const campagne = pgTable('campagne', {
  id: text('id').primaryKey(),
  structureId: text('structure_id').notNull().references(() => structure.id),
  slug: text('slug'), // slug permanent pour QR code (unique par structure)
  designation: text('designation').notNull(),
  quantiteObjectif: integer('quantite_objectif').notNull(),
  uniteOeuvre: text('unite_oeuvre').notNull(), // 'Bénéficiaire(s)', 'Lead(s)', 'CA', custom...
  dateDebut: text('date_debut').notNull(),
  dateFin: text('date_fin').notNull(),
  statut: text('statut').default('active'), // active | terminee | archivee
  nbVisites: integer('nb_visites').default(0), // scans QR code (incrémenté au resolve)
  nbConversations: integer('nb_conversations').default(0), // chats ouverts via cette campagne
  remplaceeParId: text('remplacee_par_id'), // FK vers la campagne qui l'a remplacée
  archiveeLe: text('archivee_le'),
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

export const campagneAssignation = pgTable('campagne_assignation', {
  id: text('id').primaryKey(),
  campagneId: text('campagne_id').notNull().references(() => campagne.id),
  conseillerId: text('conseiller_id').notNull().references(() => conseiller.id),
  creeLe: text('cree_le').notNull(),
})

// === CONNEXIONS CALENDRIER (Google / Outlook OAuth2) ===

export const calendarConnection = pgTable('calendar_connection', {
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

export const codeVerification = pgTable('code_verification', {
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

// === JOURNAL DE NOTIFICATIONS (delivery tracking) ===

export const notificationLog = pgTable('notification_log', {
  id: text('id').primaryKey(),
  referralId: text('referral_id').references(() => referral.id),
  priseEnChargeId: text('prise_en_charge_id'),
  destinataire: text('destinataire').notNull(),
  destinataireType: text('destinataire_type').notNull(), // 'beneficiaire' | 'tiers'
  canal: text('canal').notNull(), // 'sms' | 'email' | 'console'
  fournisseur: text('fournisseur').notNull(), // 'vonage' | 'ovh' | 'smtp' | 'o365' | 'brevo' | 'console'
  externalMessageId: text('external_message_id'), // ID retourné par le fournisseur pour le suivi
  statut: text('statut').default('envoye'), // 'envoye' | 'delivre' | 'echoue' | 'rebond' | 'spam' | 'ouvert'
  erreur: text('erreur'),
  type: text('type').notNull(), // 'pin_code' | 'rdv_rappel' | 'relance' | 'tiers_invitation'
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

// === SUIVI D'ACTIVITÉS (CEJ) ===

export const categorieActivite = pgTable('categorie_activite', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  label: text('label').notNull(),
  icone: text('icone'),
  couleur: text('couleur'),
  ordre: integer('ordre').default(0),
  actif: integer('actif').default(1),
})

export const declarationActivite = pgTable('declaration_activite', {
  id: text('id').primaryKey(),
  priseEnChargeId: text('prise_en_charge_id').notNull().references(() => priseEnCharge.id),
  utilisateurId: text('utilisateur_id').notNull().references(() => utilisateur.id),
  categorieCode: text('categorie_code').notNull(),
  description: text('description'),
  dureeMinutes: integer('duree_minutes').notNull(),
  dateSemaine: text('date_semaine').notNull(), // lundi ISO de la semaine
  dateActivite: text('date_activite').notNull(),
  source: text('source').default('manuel'), // 'manuel' | 'chat_auto'
  messageDirectId: text('message_direct_id'),
  statut: text('statut').default('en_attente'), // 'en_attente' | 'validee' | 'refusee'
  valideePar: text('validee_par'),
  valideLe: text('valide_le'),
  commentaireConseiller: text('commentaire_conseiller'),
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

export const objectifHebdomadaire = pgTable('objectif_hebdomadaire', {
  id: text('id').primaryKey(),
  priseEnChargeId: text('prise_en_charge_id').notNull().references(() => priseEnCharge.id),
  semaine: text('semaine').notNull(), // lundi ISO
  cibleHeures: real('cible_heures').notNull(),
  cibleRecommandeeIA: real('cible_recommandee_ia'),
  ajusteParConseiller: integer('ajuste_par_conseiller').default(0),
  commentaire: text('commentaire'),
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

export const alerteDecrochage = pgTable('alerte_decrochage', {
  id: text('id').primaryKey(),
  priseEnChargeId: text('prise_en_charge_id').notNull().references(() => priseEnCharge.id),
  conseillerId: text('conseiller_id').notNull().references(() => conseiller.id),
  type: text('type').notNull(), // 'activite_baisse' | 'silence_prolonge' | 'ton_negatif' | 'objectif_non_atteint'
  severite: text('severite').notNull(), // 'info' | 'attention' | 'critique'
  signaux: text('signaux'), // JSON array
  resumeIA: text('resume_ia'),
  lue: integer('lue').default(0),
  traitee: integer('traitee').default(0),
  actionPrise: text('action_prise'),
  creeLe: text('cree_le').notNull(),
  traiteeLe: text('traitee_le'),
})

// === TARIFICATION & PAIEMENT (structures privées) ===

export const tarification = pgTable('tarification', {
  id: text('id').primaryKey(),
  structureId: text('structure_id').notNull().references(() => structure.id),
  libelle: text('libelle').notNull(),
  description: text('description'),
  montantHtCentimes: integer('montant_ht_centimes').notNull(), // Prix HT en centimes
  montantTtcCentimes: integer('montant_ttc_centimes').notNull(), // Prix TTC en centimes (calculé via tauxTva)
  montantCentimes: integer('montant_centimes').notNull(), // Alias TTC pour compatibilité
  devise: text('devise').default('EUR'),
  dureeJours: integer('duree_jours'),
  actif: integer('actif').default(1),
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

export const conditionsCommerciales = pgTable('conditions_commerciales', {
  id: text('id').primaryKey(),
  structureId: text('structure_id').notNull().references(() => structure.id),
  nom: text('nom').notNull(),
  fichierNom: text('fichier_nom').notNull(),
  fichierUrl: text('fichier_url').notNull(),
  typeMime: text('type_mime'),
  tailleFichier: integer('taille_fichier'),
  version: integer('version').default(1),
  actif: integer('actif').default(1),
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

export const acceptationTarif = pgTable('acceptation_tarif', {
  id: text('id').primaryKey(),
  referralId: text('referral_id').notNull().references(() => referral.id),
  utilisateurId: text('utilisateur_id').notNull().references(() => utilisateur.id),
  structureId: text('structure_id').notNull().references(() => structure.id),
  tarificationId: text('tarification_id').notNull().references(() => tarification.id),
  conditionsId: text('conditions_id').references(() => conditionsCommerciales.id),
  montantHtCentimes: integer('montant_ht_centimes').notNull(),
  montantTtcCentimes: integer('montant_ttc_centimes').notNull(),
  montantCentimes: integer('montant_centimes').notNull(), // Alias TTC pour compatibilité
  statut: text('statut').default('en_attente'), // 'en_attente' | 'acceptee' | 'refusee' | 'expiree'
  accepteeLe: text('acceptee_le'),
  refuseeLe: text('refusee_le'),
  ipAcceptation: text('ip_acceptation'),
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

export const paiement = pgTable('paiement', {
  id: text('id').primaryKey(),
  acceptationTarifId: text('acceptation_tarif_id').notNull().references(() => acceptationTarif.id),
  priseEnChargeId: text('prise_en_charge_id').references(() => priseEnCharge.id),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeCheckoutSessionId: text('stripe_checkout_session_id'),
  montantCentimes: integer('montant_centimes').notNull(),
  devise: text('devise').default('EUR'),
  statut: text('statut').default('en_attente'), // 'en_attente' | 'en_cours' | 'reussi' | 'echoue' | 'rembourse'
  methode: text('methode'),
  recuUrl: text('recu_url'),
  erreur: text('erreur'),
  paieLe: text('paie_le'),
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

export const stripeCompteStructure = pgTable('stripe_compte_structure', {
  id: text('id').primaryKey(),
  structureId: text('structure_id').notNull().references(() => structure.id),
  stripeAccountId: text('stripe_account_id').notNull(),
  statut: text('statut').default('en_cours'), // 'en_cours' | 'actif' | 'suspendu'
  chargesActives: integer('charges_actives').default(0),
  detailsComplets: integer('details_complets').default(0),
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

// === MODÈLE ÉCONOMIQUE : ABONNEMENTS, CONVENTIONS, USAGE ===

export const conventionTerritoriale = pgTable('convention_territoriale', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'departement' | 'region'
  nom: text('nom').notNull(),
  departements: text('departements'), // JSON array
  regions: text('regions'), // JSON array
  montantAnnuelHtCentimes: integer('montant_annuel_ht_centimes').notNull(),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripeCustomerId: text('stripe_customer_id'),
  limiteStructures: integer('limite_structures').notNull(),
  limiteBeneficiaires: integer('limite_beneficiaires').notNull(),
  limiteConversations: integer('limite_conversations').notNull(),
  limiteSms: integer('limite_sms').notNull(),
  contactNom: text('contact_nom'),
  contactEmail: text('contact_email'),
  contactTelephone: text('contact_telephone'),
  dateDebut: text('date_debut').notNull(),
  dateFin: text('date_fin').notNull(),
  statut: text('statut').default('active'), // 'active' | 'suspendue' | 'resiliee'
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

export const conventionStructure = pgTable('convention_structure', {
  id: text('id').primaryKey(),
  conventionId: text('convention_id').notNull().references(() => conventionTerritoriale.id),
  structureId: text('structure_id').notNull().references(() => structure.id),
  dateAjout: text('date_ajout').notNull(),
  statut: text('statut').default('active'), // 'active' | 'retiree'
  creeLe: text('cree_le').notNull(),
})

export const abonnement = pgTable('abonnement', {
  id: text('id').primaryKey(),
  structureId: text('structure_id').notNull().references(() => structure.id),
  plan: text('plan').notNull(), // 'starter' | 'pro' | 'premium' | 'pay_per_outcome'
  conventionId: text('convention_id').references(() => conventionTerritoriale.id),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripeCustomerId: text('stripe_customer_id'),
  stripePriceId: text('stripe_price_id'),
  montantMensuelHtCentimes: integer('montant_mensuel_ht_centimes').notNull(),
  // Limites du plan (denormalisees pour lookup rapide)
  limiteConseillers: integer('limite_conseillers'), // NULL = illimite
  limiteBeneficiaires: integer('limite_beneficiaires').notNull(),
  limiteConversations: integer('limite_conversations').notNull(),
  limiteSms: integer('limite_sms').notNull(),
  // Pay-per-outcome
  socleInclus: integer('socle_inclus').default(0),
  // Prix depassement en centimes
  prixDepassementConversation: integer('prix_depassement_conversation').default(2), // 0.02 EUR
  prixDepassementSms: integer('prix_depassement_sms').default(8), // 0.08 EUR
  // Dates
  dateDebut: text('date_debut').notNull(),
  dateFin: text('date_fin'),
  periodeEssai: integer('periode_essai').default(0),
  statut: text('statut').default('active'), // 'active' | 'suspendue' | 'resiliee' | 'essai'
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

export const usageStructure = pgTable('usage_structure', {
  id: text('id').primaryKey(),
  structureId: text('structure_id').notNull().references(() => structure.id),
  mois: text('mois').notNull(), // 'YYYY-MM'
  conversationsIa: integer('conversations_ia').default(0),
  smsEnvoyes: integer('sms_envoyes').default(0),
  beneficiairesActifs: integer('beneficiaires_actifs').default(0),
  conseillersActifs: integer('conseillers_actifs').default(0),
  conseillersSurplus: integer('conseillers_surplus').default(0),
  conversationsDepassement: integer('conversations_depassement').default(0),
  smsDepassement: integer('sms_depassement').default(0),
  montantDepassementCentimes: integer('montant_depassement_centimes').default(0),
  stripeUsageRecordId: text('stripe_usage_record_id'),
  rapporteLe: text('rapporte_le'),
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

export const evenementFacturable = pgTable('evenement_facturable', {
  id: text('id').primaryKey(),
  structureId: text('structure_id').notNull().references(() => structure.id),
  abonnementId: text('abonnement_id').notNull().references(() => abonnement.id),
  type: text('type').notNull(), // 'orientation_reussie' | 'accompagnement_termine' | 'profil_riasec_fiable' | 'satisfaction_elevee'
  montantCentimes: integer('montant_centimes').notNull(), // 500, 1500, 200, 100
  referenceId: text('reference_id').notNull(),
  referenceType: text('reference_type').notNull(), // 'prise_en_charge' | 'indice_confiance' | 'enquete_satisfaction'
  mois: text('mois').notNull(), // 'YYYY-MM'
  facture: integer('facture').default(0), // 0=pending, 1=billed
  stripeInvoiceItemId: text('stripe_invoice_item_id'),
  details: text('details'), // JSON
  creeLe: text('cree_le').notNull(),
})

// === CLÉS API (accès externe) ===

export const apiKey = pgTable('api_key', {
  id: text('id').primaryKey(),
  nom: text('nom').notNull(),
  cle: text('cle').notNull().unique(),
  prefixe: text('prefixe').notNull(),
  structureId: text('structure_id').references(() => structure.id),
  permissions: text('permissions').notNull(),
  rateLimitParMinute: integer('rate_limit_par_minute').default(60),
  actif: integer('actif').default(1),
  derniereUtilisation: text('derniere_utilisation'),
  nbAppels: integer('nb_appels').default(0),
  expireLe: text('expire_le'),
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

// === CONFIGURATION FOURNISSEURS TIERS ===

export const providerConfig = pgTable('provider_config', {
  id: text('id').primaryKey(),
  providerType: text('provider_type').notNull(),           // 'llm' | 'sms' | 'email' | 'tts' | 'stt'
  providerName: text('provider_name').notNull(),           // 'openai' | 'anthropic' | 'mistral' | 'vonage' | 'ovh' | 'smtp' | 'o365' | 'brevo' | 'google_tts'
  actif: integer('actif').default(1),
  priorite: integer('priorite').default(0),                // 0 = premier essayé
  dernierSucces: text('dernier_succes'),
  dernierEchec: text('dernier_echec'),
  dernierMessageErreur: text('dernier_message_erreur'),
  reglages: text('reglages'),                              // JSON: model overrides, sender overrides, etc.
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})
