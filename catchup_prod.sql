--
-- PostgreSQL database dump
--

\restrict OJizJbQc3QiaBPdTFHIBXiVZJ4i85jGBW42XMURsbZ0MDEMn4VLGR6Kq2HFRm6b

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alerte_decrochage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alerte_decrochage (
    id text NOT NULL,
    prise_en_charge_id text NOT NULL,
    conseiller_id text NOT NULL,
    type text NOT NULL,
    severite text NOT NULL,
    signaux text,
    resume_ia text,
    lue integer DEFAULT 0,
    traitee integer DEFAULT 0,
    action_prise text,
    cree_le text NOT NULL,
    traitee_le text
);


--
-- Name: bris_de_glace; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bris_de_glace (
    id text NOT NULL,
    conseiller_id text NOT NULL,
    prise_en_charge_id text NOT NULL,
    tiers_id text NOT NULL,
    justification text NOT NULL,
    ip text,
    horodatage text NOT NULL
);


--
-- Name: calendar_connection; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendar_connection (
    id text NOT NULL,
    type text NOT NULL,
    user_id text NOT NULL,
    provider text NOT NULL,
    access_token text NOT NULL,
    refresh_token text,
    expires_at text,
    email text,
    cree_le text NOT NULL,
    mis_a_jour_le text NOT NULL
);


--
-- Name: campagne; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campagne (
    id text NOT NULL,
    structure_id text NOT NULL,
    slug text,
    designation text NOT NULL,
    quantite_objectif integer NOT NULL,
    unite_oeuvre text NOT NULL,
    date_debut text NOT NULL,
    date_fin text NOT NULL,
    statut text DEFAULT 'active'::text,
    remplacee_par_id text,
    archivee_le text,
    cree_le text NOT NULL,
    mis_a_jour_le text NOT NULL
);


--
-- Name: campagne_assignation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campagne_assignation (
    id text NOT NULL,
    campagne_id text NOT NULL,
    conseiller_id text NOT NULL,
    cree_le text NOT NULL
);


--
-- Name: categorie_activite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorie_activite (
    id text NOT NULL,
    code text NOT NULL,
    label text NOT NULL,
    icone text,
    couleur text,
    ordre integer DEFAULT 0,
    actif integer DEFAULT 1
);


--
-- Name: code_verification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.code_verification (
    id text NOT NULL,
    referral_id text NOT NULL,
    utilisateur_id text NOT NULL,
    code text NOT NULL,
    token text,
    verifie integer DEFAULT 0,
    tentatives integer DEFAULT 0,
    expire_le text NOT NULL,
    cree_le text NOT NULL
);


--
-- Name: conseiller; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conseiller (
    id text NOT NULL,
    email text NOT NULL,
    mot_de_passe text,
    prenom text NOT NULL,
    nom text NOT NULL,
    role text DEFAULT 'conseiller'::text,
    structure_id text,
    parcoureo_id text,
    actif integer DEFAULT 1,
    derniere_connexion text,
    cree_le text NOT NULL,
    mis_a_jour_le text NOT NULL
);


--
-- Name: conversation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation (
    id text NOT NULL,
    utilisateur_id text NOT NULL,
    titre text,
    statut text DEFAULT 'active'::text,
    origine text DEFAULT 'direct'::text,
    nb_messages integer DEFAULT 0,
    phase text DEFAULT 'accroche'::text,
    duree_secondes integer DEFAULT 0,
    cree_le text NOT NULL,
    mis_a_jour_le text NOT NULL
);


--
-- Name: declaration_activite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.declaration_activite (
    id text NOT NULL,
    prise_en_charge_id text NOT NULL,
    utilisateur_id text NOT NULL,
    categorie_code text NOT NULL,
    description text,
    duree_minutes integer NOT NULL,
    date_semaine text NOT NULL,
    date_activite text NOT NULL,
    source text DEFAULT 'manuel'::text,
    message_direct_id text,
    statut text DEFAULT 'en_attente'::text,
    validee_par text,
    valide_le text,
    commentaire_conseiller text,
    cree_le text NOT NULL,
    mis_a_jour_le text NOT NULL
);


--
-- Name: demande_consentement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.demande_consentement (
    id text NOT NULL,
    prise_en_charge_id text NOT NULL,
    tiers_id text NOT NULL,
    demandeur_id text NOT NULL,
    statut text DEFAULT 'en_attente'::text,
    conseiller_approuve integer DEFAULT 0,
    conseiller_approuve_le text,
    beneficiaire_approuve integer DEFAULT 0,
    beneficiaire_approuve_le text,
    cree_le text NOT NULL,
    mis_a_jour_le text NOT NULL
);


--
-- Name: enquete_satisfaction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enquete_satisfaction (
    id text NOT NULL,
    prise_en_charge_id text NOT NULL,
    utilisateur_id text NOT NULL,
    note_globale integer,
    note_ecoute integer,
    note_utilite integer,
    note_conseiller integer,
    note_recommandation integer,
    commentaire text,
    points_forts text,
    ameliorations text,
    completee integer DEFAULT 0,
    cree_le text NOT NULL
);


--
-- Name: evenement_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evenement_audit (
    id text NOT NULL,
    conseiller_id text,
    action text NOT NULL,
    cible_type text,
    cible_id text,
    details text,
    ip text,
    horodatage text NOT NULL
);


--
-- Name: evenement_journal; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evenement_journal (
    id text NOT NULL,
    prise_en_charge_id text NOT NULL,
    type text NOT NULL,
    acteur_type text NOT NULL,
    acteur_id text NOT NULL,
    cible_type text,
    cible_id text,
    resume text,
    details text,
    horodatage text NOT NULL
);


--
-- Name: evenement_quiz; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evenement_quiz (
    id text NOT NULL,
    utilisateur_id text,
    reponses text NOT NULL,
    resultat text NOT NULL,
    duree_ms integer,
    code_parrainage text,
    source_prescripteur text,
    a_partage integer DEFAULT 0,
    a_continue_chat integer DEFAULT 0,
    horodatage text NOT NULL
);


--
-- Name: indice_confiance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.indice_confiance (
    id text NOT NULL,
    utilisateur_id text NOT NULL,
    score_global real DEFAULT 0,
    niveau text DEFAULT 'debut'::text,
    volume real DEFAULT 0,
    stabilite real DEFAULT 0,
    differenciation real DEFAULT 0,
    coherence real DEFAULT 0,
    nb_messages integer DEFAULT 0,
    nb_instantanes integer DEFAULT 0,
    mis_a_jour_le text NOT NULL
);


--
-- Name: instantane_profil; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instantane_profil (
    id text NOT NULL,
    utilisateur_id text NOT NULL,
    conversation_id text NOT NULL,
    index_message integer NOT NULL,
    r integer DEFAULT 0,
    i integer DEFAULT 0,
    a integer DEFAULT 0,
    s integer DEFAULT 0,
    e integer DEFAULT 0,
    c integer DEFAULT 0,
    coherence_signaux text,
    horodatage text NOT NULL
);


--
-- Name: message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message (
    id text NOT NULL,
    conversation_id text NOT NULL,
    role text NOT NULL,
    contenu text NOT NULL,
    contenu_brut text,
    url_audio text,
    fragilite_detectee integer DEFAULT 0,
    niveau_fragilite text,
    profil_extrait integer DEFAULT 0,
    horodatage text NOT NULL
);


--
-- Name: message_direct; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_direct (
    id text NOT NULL,
    prise_en_charge_id text NOT NULL,
    expediteur_type text NOT NULL,
    expediteur_id text NOT NULL,
    contenu text NOT NULL,
    conversation_type text DEFAULT 'direct'::text,
    lu integer DEFAULT 0,
    horodatage text NOT NULL
);


--
-- Name: objectif_hebdomadaire; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.objectif_hebdomadaire (
    id text NOT NULL,
    prise_en_charge_id text NOT NULL,
    semaine text NOT NULL,
    cible_heures real NOT NULL,
    cible_recommandee_ia real,
    ajuste_par_conseiller integer DEFAULT 0,
    commentaire text,
    cree_le text NOT NULL,
    mis_a_jour_le text NOT NULL
);


--
-- Name: participant_conversation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.participant_conversation (
    id text NOT NULL,
    prise_en_charge_id text NOT NULL,
    participant_type text NOT NULL,
    participant_id text NOT NULL,
    actif integer DEFAULT 1,
    rejoint_le text NOT NULL,
    quitte_le text
);


--
-- Name: prise_en_charge; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prise_en_charge (
    id text NOT NULL,
    referral_id text NOT NULL,
    conseiller_id text NOT NULL,
    structure_id text NOT NULL,
    statut text DEFAULT 'nouvelle'::text,
    notes text,
    score_matching real,
    raison_matching text,
    assignee_manuellement integer DEFAULT 0,
    premiere_action_le text,
    terminee_le text,
    notification_envoyee integer DEFAULT 0,
    cree_le text NOT NULL,
    mis_a_jour_le text NOT NULL
);


--
-- Name: profil_riasec; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profil_riasec (
    id text NOT NULL,
    utilisateur_id text NOT NULL,
    r integer DEFAULT 0,
    i integer DEFAULT 0,
    a integer DEFAULT 0,
    s integer DEFAULT 0,
    e integer DEFAULT 0,
    c integer DEFAULT 0,
    dimensions_dominantes text,
    traits text,
    interets text,
    forces text,
    suggestion text,
    source text DEFAULT 'conversation'::text,
    est_stable integer DEFAULT 0,
    coherence_signaux text DEFAULT 'mixte'::text,
    mis_a_jour_le text NOT NULL
);


--
-- Name: push_subscription; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_subscription (
    id text NOT NULL,
    type text NOT NULL,
    user_id text NOT NULL,
    endpoint text NOT NULL,
    keys_p256dh text NOT NULL,
    keys_auth text NOT NULL,
    cree_le text NOT NULL
);


--
-- Name: rappel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rappel (
    id text NOT NULL,
    prise_en_charge_id text NOT NULL,
    type text NOT NULL,
    statut text DEFAULT 'en_attente'::text,
    date_envoi text NOT NULL,
    contenu text,
    cree_le text NOT NULL
);


--
-- Name: referral; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referral (
    id text NOT NULL,
    utilisateur_id text NOT NULL,
    conversation_id text NOT NULL,
    priorite text NOT NULL,
    niveau_detection integer NOT NULL,
    motif text,
    resume_conversation text,
    moyen_contact text,
    type_contact text,
    statut text DEFAULT 'en_attente'::text,
    source text DEFAULT 'generique'::text,
    campagne_id text,
    webhook_envoye integer DEFAULT 0,
    webhook_reponse text,
    relance_envoyee integer DEFAULT 0,
    structure_suggeree_id text,
    localisation text,
    genre text,
    age_beneficiaire integer,
    cree_le text NOT NULL,
    mis_a_jour_le text NOT NULL,
    recontacte_le text
);


--
-- Name: rendez_vous; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rendez_vous (
    id text NOT NULL,
    prise_en_charge_id text NOT NULL,
    titre text NOT NULL,
    description text,
    date_heure text NOT NULL,
    duree_minutes integer DEFAULT 30,
    lieu text,
    lien_visio text,
    statut text DEFAULT 'planifie'::text,
    organisateur_type text NOT NULL,
    organisateur_id text NOT NULL,
    participants text,
    rappel_envoye integer DEFAULT 0,
    google_event_id text,
    outlook_event_id text,
    cree_le text NOT NULL,
    mis_a_jour_le text NOT NULL
);


--
-- Name: session_conseiller; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_conseiller (
    id text NOT NULL,
    conseiller_id text NOT NULL,
    jeton text NOT NULL,
    expire_le text NOT NULL,
    revoque integer DEFAULT 0,
    cree_le text NOT NULL
);


--
-- Name: session_magic_link; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_magic_link (
    id text NOT NULL,
    utilisateur_id text NOT NULL,
    email text NOT NULL,
    jeton text NOT NULL,
    utilise integer DEFAULT 0,
    expire_le text NOT NULL,
    cree_le text NOT NULL,
    utilise_le text
);


--
-- Name: source_captation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.source_captation (
    id text NOT NULL,
    code text NOT NULL,
    type text NOT NULL,
    nom text,
    nb_visites integer DEFAULT 0,
    nb_quiz_completes integer DEFAULT 0,
    nb_chats_ouverts integer DEFAULT 0,
    nb_emails_collectes integer DEFAULT 0,
    cree_le text NOT NULL,
    mis_a_jour_le text NOT NULL
);


--
-- Name: structure; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.structure (
    id text NOT NULL,
    nom text NOT NULL,
    slug text,
    type text NOT NULL,
    departements text NOT NULL,
    regions text,
    age_min integer DEFAULT 16,
    age_max integer DEFAULT 25,
    specialites text,
    genre_preference text,
    capacite_max integer DEFAULT 50,
    adresse text,
    code_postal text,
    ville text,
    latitude real,
    longitude real,
    webhook_url text,
    parcoureo_id text,
    prompt_personnalise text,
    logo_url text,
    actif integer DEFAULT 1,
    cree_le text NOT NULL,
    mis_a_jour_le text NOT NULL
);


--
-- Name: tiers_intervenant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tiers_intervenant (
    id text NOT NULL,
    prise_en_charge_id text NOT NULL,
    nom text NOT NULL,
    prenom text NOT NULL,
    telephone text NOT NULL,
    role text NOT NULL,
    invite_par_id text NOT NULL,
    statut text DEFAULT 'en_attente'::text,
    cree_le text NOT NULL,
    mis_a_jour_le text NOT NULL
);


--
-- Name: utilisateur; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utilisateur (
    id text NOT NULL,
    prenom text,
    email text,
    email_verifie integer DEFAULT 0,
    telephone text,
    age integer,
    situation text,
    code_parrainage text,
    parraine_par text,
    source text,
    source_detail text,
    plateforme text DEFAULT 'web'::text,
    preferences text,
    cree_le text NOT NULL,
    mis_a_jour_le text NOT NULL,
    mot_de_passe text,
    session_token text,
    session_token_expire_le text,
    derniere_visite text,
    supprime_le text
);


--
-- Data for Name: alerte_decrochage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.alerte_decrochage (id, prise_en_charge_id, conseiller_id, type, severite, signaux, resume_ia, lue, traitee, action_prise, cree_le, traitee_le) FROM stdin;
\.


--
-- Data for Name: bris_de_glace; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bris_de_glace (id, conseiller_id, prise_en_charge_id, tiers_id, justification, ip, horodatage) FROM stdin;
\.


--
-- Data for Name: calendar_connection; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.calendar_connection (id, type, user_id, provider, access_token, refresh_token, expires_at, email, cree_le, mis_a_jour_le) FROM stdin;
\.


--
-- Data for Name: campagne; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.campagne (id, structure_id, slug, designation, quantite_objectif, unite_oeuvre, date_debut, date_fin, statut, remplacee_par_id, archivee_le, cree_le, mis_a_jour_le) FROM stdin;
53e8668f-b98c-400d-825d-1c31e58e8e98	d2f39531-15c3-472e-b0cb-f70ce8e5f7ac	\N	O2R T3 2026	50	Prise(s) en charge	2026-03-31	2026-08-31	active	\N	\N	2026-03-31T15:45:41.951Z	2026-04-02T21:36:46.956Z
f6e666fa-1df8-4f1c-a1a2-2384c9ae5c66	d2f39531-15c3-472e-b0cb-f70ce8e5f7ac	\N	Objectif T3 2026	40	Prise(s) en charge	2026-04-02	2026-07-31	active	\N	\N	2026-04-02T22:59:37.892Z	2026-04-02T22:59:37.892Z
d98a2b82-9f69-4204-a469-b84b69cf73f0	d2f39531-15c3-472e-b0cb-f70ce8e5f7ac	null__archived__d98a2b82	Finacement garantie Jeunes	40	Prise(s) en charge	2026-04-01	2026-06-30	archivee	f6e666fa-1df8-4f1c-a1a2-2384c9ae5c66	2026-04-02T22:59:37.892Z	2026-04-01T14:32:16.837Z	2026-04-02T22:59:37.892Z
62e8ae7f-1594-4ad9-8bd1-96c55c80324d	31395dae-b34b-4d39-8b80-23f2671c1b02	o2r-e2c	o2r E2C	26	Beneficiaire(s)	2026-04-03	2026-04-03	active	\N	\N	2026-04-03T09:14:30.971Z	2026-04-03T09:14:30.971Z
265a987b-47e3-47f5-83bf-a9a274596f2b	8a44f6df-a375-4c91-ad53-68e873206d3a	o2r-depuis-conseiller	o2r depuis conseiller	11	Beneficiaire(s)	2026-04-03	2026-04-06	active	\N	\N	2026-04-03T09:31:40.840Z	2026-04-03T09:31:40.840Z
\.


--
-- Data for Name: campagne_assignation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.campagne_assignation (id, campagne_id, conseiller_id, cree_le) FROM stdin;
a2276600-6a38-4bba-b288-fbd1ccf6a60f	d98a2b82-9f69-4204-a469-b84b69cf73f0	287c9b3a-c93e-4d89-ade3-e56b1059212e	2026-04-01T14:32:16.837Z
8e9777c7-1752-4760-a51e-0acc9d5a2f6b	d98a2b82-9f69-4204-a469-b84b69cf73f0	10c7c580-87ee-4cfa-b47a-283c1e4f7fff	2026-04-01T14:32:16.837Z
3496a2de-b085-47e7-ae55-ac240ddfdade	d98a2b82-9f69-4204-a469-b84b69cf73f0	deda4af6-2974-43e8-84b6-653b04a96d18	2026-04-01T14:32:16.837Z
bf19e76f-6a97-448e-ae1e-8de7bad76c5f	d98a2b82-9f69-4204-a469-b84b69cf73f0	1a0c96ab-5678-4c64-bf58-336405393d13	2026-04-01T14:32:16.837Z
cc1aba8c-1a35-409f-9634-0a7c3cd0e988	d98a2b82-9f69-4204-a469-b84b69cf73f0	dc414da6-8c60-429b-b0f2-3bc3e3781930	2026-04-01T14:32:16.837Z
c5ff233a-96d5-4c0e-b197-bb95e0fa5f3b	53e8668f-b98c-400d-825d-1c31e58e8e98	287c9b3a-c93e-4d89-ade3-e56b1059212e	2026-04-02T21:36:46.956Z
e2e52f51-994a-4aa0-88ea-69e5b39da359	53e8668f-b98c-400d-825d-1c31e58e8e98	10c7c580-87ee-4cfa-b47a-283c1e4f7fff	2026-04-02T21:36:46.956Z
f8208f27-0d08-4fab-af4b-321e88369bb9	53e8668f-b98c-400d-825d-1c31e58e8e98	deda4af6-2974-43e8-84b6-653b04a96d18	2026-04-02T21:36:46.956Z
cd4f02cb-292d-419c-b1fa-8f545bb6b9e5	53e8668f-b98c-400d-825d-1c31e58e8e98	1a0c96ab-5678-4c64-bf58-336405393d13	2026-04-02T21:36:46.956Z
1ac6cbaf-49df-4ba3-9398-da7d16260c83	53e8668f-b98c-400d-825d-1c31e58e8e98	dc414da6-8c60-429b-b0f2-3bc3e3781930	2026-04-02T21:36:46.956Z
c2553784-e2c2-4425-b688-19f302fce091	f6e666fa-1df8-4f1c-a1a2-2384c9ae5c66	287c9b3a-c93e-4d89-ade3-e56b1059212e	2026-04-02T22:59:37.892Z
8b9f62d5-a959-4585-a748-31bfd094ff9a	f6e666fa-1df8-4f1c-a1a2-2384c9ae5c66	10c7c580-87ee-4cfa-b47a-283c1e4f7fff	2026-04-02T22:59:37.892Z
d120de89-5e03-4dc6-a631-80edc2b78cc6	f6e666fa-1df8-4f1c-a1a2-2384c9ae5c66	deda4af6-2974-43e8-84b6-653b04a96d18	2026-04-02T22:59:37.892Z
4573b95d-90ab-43c1-a3f5-a94aa073699a	f6e666fa-1df8-4f1c-a1a2-2384c9ae5c66	1a0c96ab-5678-4c64-bf58-336405393d13	2026-04-02T22:59:37.892Z
c592a0a9-4b6e-41b0-89bf-d81e6edd3d0e	62e8ae7f-1594-4ad9-8bd1-96c55c80324d	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	2026-04-03T09:14:30.971Z
b0769b52-04b4-4fad-ac4e-cdb53e9567d3	265a987b-47e3-47f5-83bf-a9a274596f2b	96870ab2-e11c-4069-b8e4-e175f258eea7	2026-04-03T09:31:40.840Z
da4d2042-413b-4236-931f-bc82c31c1780	265a987b-47e3-47f5-83bf-a9a274596f2b	ee65ceba-fc1e-4a83-870c-89a954591359	2026-04-03T09:31:40.840Z
35dd4b81-4eb5-4834-92d6-f5ae3243dd83	265a987b-47e3-47f5-83bf-a9a274596f2b	ac1cb3cb-8668-4c2f-9599-320da7b43e15	2026-04-03T09:31:40.840Z
7e8e51ed-dc10-4295-9312-8b725ab1a6bc	265a987b-47e3-47f5-83bf-a9a274596f2b	13ba90b3-aeb5-418e-a143-db4ecfbc07b9	2026-04-03T09:31:40.840Z
d1a6e862-ef43-4ef0-93d8-5aec41c2227c	265a987b-47e3-47f5-83bf-a9a274596f2b	92cac234-afe0-4925-93aa-bde9db7874c9	2026-04-03T09:31:40.840Z
59cf6bb6-a327-4934-a429-bf1b46312c98	265a987b-47e3-47f5-83bf-a9a274596f2b	38631b01-9d23-47dc-be1f-f82126c2a72c	2026-04-03T09:31:40.840Z
\.


--
-- Data for Name: categorie_activite; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categorie_activite (id, code, label, icone, couleur, ordre, actif) FROM stdin;
\.


--
-- Data for Name: code_verification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.code_verification (id, referral_id, utilisateur_id, code, token, verifie, tentatives, expire_le, cree_le) FROM stdin;
e9f01ca8-5e12-4cd9-97a1-80adc2039487	cf697de9-219f-4fc0-9a58-e328eac6bfc9	917ad1d9-37af-4223-aa84-4c1ee508f564	499536	936c2cb0-0b09-4abb-b719-a331ee5bb3d0	0	0	2026-04-03T08:21:56.023Z	2026-04-03T08:20:58.280Z
191be921-c301-4a54-9f10-4a150491244d	cf697de9-219f-4fc0-9a58-e328eac6bfc9	917ad1d9-37af-4223-aa84-4c1ee508f564	534813	223deaa4-c4ef-48f9-b0fd-219871603278	1	0	2026-04-10T08:21:56.029Z	2026-04-03T08:21:56.023Z
f79b903d-483c-4bba-9df8-3d2ebe397f9e	87b94169-d25d-452d-bf50-cad4f248d51d	e036af1d-83c0-46e3-9d60-77313f52b261	511894	bddc36e0-034d-4aac-be50-28d1eec99563	1	0	2026-04-10T09:17:27.187Z	2026-04-03T09:17:27.161Z
e8c3513d-d086-43a8-b5e6-98cb95817dad	562a0822-c7da-43fb-8e1a-bd583620960e	e036af1d-83c0-46e3-9d60-77313f52b261	768182	994dbdf6-5fc9-4214-bafd-f8f99ecb60a4	1	0	2026-04-10T09:25:15.150Z	2026-04-03T09:25:15.131Z
e07ef282-c15b-42eb-a91c-89ba66260172	81c191a3-9b46-4135-93d5-cc43146ad2ec	917ad1d9-37af-4223-aa84-4c1ee508f564	361285	4e9d40ab-7de1-46cd-bdd4-1dbc1decc3cf	1	0	2026-04-10T09:29:50.014Z	2026-04-03T09:29:49.993Z
1cb1356c-ebbe-47d8-8f49-602e27ef0304	314e392d-bf0c-4117-a28a-2109c9a97c8f	e036af1d-83c0-46e3-9d60-77313f52b261	174349	02acaf0e-87c5-4702-a902-1d84c3969447	0	0	2026-04-03T09:37:41.611Z	2026-04-03T09:34:50.610Z
b2ea914f-1728-4306-8882-60b5ecdf53e2	314e392d-bf0c-4117-a28a-2109c9a97c8f	e036af1d-83c0-46e3-9d60-77313f52b261	575426	8b791288-481b-4f6d-9ca8-b43aa9473ab7	1	0	2026-04-10T09:37:41.621Z	2026-04-03T09:37:41.611Z
7d2fc33a-eec5-4c05-9f21-c3a8bd5eea02	750d5b42-8c54-439d-8daa-2e92b17dbc6d	e036af1d-83c0-46e3-9d60-77313f52b261	399034	81c2ae40-828c-4128-b3e7-1a8756cd1038	1	0	2026-04-10T09:47:01.311Z	2026-04-03T09:47:01.300Z
e4f21f7d-6b1b-4431-b1cd-906b959793b6	750d5b42-8c54-439d-8daa-2e92b17dbc6d	e036af1d-83c0-46e3-9d60-77313f52b261	574986	8aa34b88-5eb1-487e-93a7-9a0fc3244529	1	0	2026-04-10T09:57:02.667Z	2026-04-03T09:57:02.664Z
bcd26ebc-19e4-464e-ba67-bc3d3f619bd3	2a4d122c-8eae-4a9c-b7d7-954f39f2d262	917ad1d9-37af-4223-aa84-4c1ee508f564	487191	5c293da0-80c5-4a1d-bafd-798a7105030f	1	0	2026-04-10T14:49:04.369Z	2026-04-03T14:49:04.355Z
\.


--
-- Data for Name: conseiller; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.conseiller (id, email, mot_de_passe, prenom, nom, role, structure_id, parcoureo_id, actif, derniere_connexion, cree_le, mis_a_jour_le) FROM stdin;
seed-cons-000101	abdel.gauthier@ml-paris.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Abdel	Gauthier	admin_structure	seed-str-000001	\N	1	2026-03-22T14:33:42.504Z	2026-02-13T15:23:01.810Z	2026-03-27T16:50:11.224Z
seed-cons-000102	jean.roux@ml-paris.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jean	Roux	conseiller	seed-str-000001	\N	1	\N	2026-01-27T01:39:39.535Z	2026-03-27T16:50:11.224Z
seed-cons-000103	sebastien.rousseau@ml-paris.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sébastien	Rousseau	conseiller	seed-str-000001	\N	1	\N	2025-05-03T23:14:13.704Z	2026-03-27T16:50:11.224Z
seed-cons-000104	emilie.laurent@ml-paris.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Émilie	Laurent	conseiller	seed-str-000001	\N	1	2026-03-24T18:22:12.200Z	2025-06-10T06:07:07.313Z	2026-03-27T16:50:11.224Z
seed-cons-000105	francois.guerin@ml-paris.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	François	Guérin	conseiller	seed-str-000001	\N	1	\N	2025-08-02T15:00:22.216Z	2026-03-27T16:50:11.224Z
seed-cons-000106	abdel.traore@ml-marseille.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Abdel	Traoré	admin_structure	seed-str-000002	\N	1	2026-03-17T07:19:02.822Z	2025-09-22T08:08:34.783Z	2026-03-27T16:50:11.224Z
seed-cons-000107	alain.perrin@ml-marseille.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Alain	Perrin	conseiller	seed-str-000002	\N	1	2026-03-17T22:02:52.012Z	2025-12-10T06:30:38.071Z	2026-03-27T16:50:11.224Z
seed-cons-000108	christine.chevalier@ml-marseille.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christine	Chevalier	conseiller	seed-str-000002	\N	1	\N	2025-06-01T22:47:20.664Z	2026-03-27T16:50:11.224Z
seed-cons-000109	marc.rousseau@ml-marseille.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marc	Rousseau	conseiller	seed-str-000002	\N	1	2026-03-23T12:56:43.493Z	2025-05-13T12:02:30.722Z	2026-03-27T16:50:11.224Z
seed-cons-000110	abdel.bouvier@ml-marseille.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Abdel	Bouvier	conseiller	seed-str-000002	\N	1	2026-03-25T07:57:14.872Z	2025-09-06T23:41:27.609Z	2026-03-27T16:50:11.224Z
seed-cons-000111	delphine.blanc@ml-marseille.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Delphine	Blanc	conseiller	seed-str-000002	\N	1	2026-03-24T22:48:09.970Z	2025-12-10T18:37:51.360Z	2026-03-27T16:50:11.224Z
seed-cons-000112	yannick.michel@ml-marseille.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Yannick	Michel	conseiller	seed-str-000002	\N	1	\N	2025-09-15T01:54:53.094Z	2026-03-27T16:50:11.224Z
seed-cons-000113	anne.bouvier@ml-marseille.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Anne	Bouvier	conseiller	seed-str-000002	\N	1	2026-03-19T09:58:08.882Z	2025-07-30T02:32:53.719Z	2026-03-27T16:50:11.224Z
seed-cons-000114	thomas.legrand@ml-marseille.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Thomas	Legrand	conseiller	seed-str-000002	\N	1	2026-03-17T08:44:35.621Z	2025-09-13T01:47:02.223Z	2026-03-27T16:50:11.224Z
seed-cons-000115	abdel.dubois@ml-lyon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Abdel	Dubois	admin_structure	seed-str-000003	\N	1	\N	2026-01-19T08:42:02.301Z	2026-03-27T16:50:11.224Z
seed-cons-000116	christophe.garcia@ml-lyon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christophe	Garcia	conseiller	seed-str-000003	\N	1	2026-03-16T08:47:23.124Z	2026-01-03T22:42:20.767Z	2026-03-27T16:50:11.224Z
seed-cons-000117	michel.dubois@ml-lyon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Michel	Dubois	conseiller	seed-str-000003	\N	1	2026-03-20T15:43:38.009Z	2025-09-26T01:01:03.565Z	2026-03-27T16:50:11.224Z
seed-cons-000118	sylvie.henry@ml-lyon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sylvie	Henry	super_admin	seed-str-000003	\N	1	2026-03-19T14:07:49.841Z	2025-08-15T22:51:30.796Z	2026-03-27T16:50:11.224Z
seed-cons-000119	sebastien.clement@ml-lyon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sébastien	Clément	conseiller	seed-str-000003	\N	1	2026-03-27T11:40:31.105Z	2025-08-22T20:29:11.270Z	2026-03-27T16:50:11.224Z
seed-cons-000120	jean.dubois@ml-lyon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jean	Dubois	conseiller	seed-str-000003	\N	1	\N	2025-09-25T11:12:56.180Z	2026-03-27T16:50:11.224Z
seed-cons-000121	emilie.bamba@ml-lyon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Émilie	Bamba	conseiller	seed-str-000003	\N	1	\N	2025-07-29T05:26:06.200Z	2026-03-27T16:50:11.224Z
seed-cons-000122	pierre.robert@ml-lyon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Pierre	Robert	conseiller	seed-str-000003	\N	1	2026-03-24T10:27:48.805Z	2026-02-12T19:16:44.596Z	2026-03-27T16:50:11.224Z
seed-cons-000123	amina.traore@ml-toulouse.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Amina	Traoré	admin_structure	seed-str-000004	\N	1	\N	2025-09-24T15:56:13.562Z	2026-03-27T16:50:11.224Z
seed-cons-000124	sylvie.robin@ml-toulouse.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sylvie	Robin	conseiller	seed-str-000004	\N	1	2026-03-19T21:28:42.273Z	2025-12-01T04:18:52.922Z	2026-03-27T16:50:11.224Z
seed-cons-000125	emilie.bouvier@ml-toulouse.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Émilie	Bouvier	conseiller	seed-str-000004	\N	1	2026-03-25T03:08:07.212Z	2025-04-16T06:25:30.799Z	2026-03-27T16:50:11.224Z
seed-cons-000126	stephane.chevalier@ml-toulouse.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Stéphane	Chevalier	conseiller	seed-str-000004	\N	1	\N	2025-11-19T08:59:50.531Z	2026-03-27T16:50:11.224Z
seed-cons-000127	abdel.kone@ml-toulouse.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Abdel	Kone	conseiller	seed-str-000004	\N	1	2026-03-18T19:09:22.338Z	2025-06-13T09:47:31.058Z	2026-03-27T16:50:11.224Z
seed-cons-000128	philippe.bernard@ml-toulouse.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Philippe	Bernard	conseiller	seed-str-000004	\N	1	2026-03-13T06:17:49.643Z	2025-05-14T00:09:20.572Z	2026-03-27T16:50:11.224Z
seed-cons-000129	fabien.cisse@ml-toulouse.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fabien	Cissé	conseiller	seed-str-000004	\N	1	2026-03-14T05:44:39.690Z	2026-01-17T03:35:04.485Z	2026-03-27T16:50:11.224Z
seed-cons-000130	fatima.francois@ml-toulouse.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	François	conseiller	seed-str-000004	\N	1	\N	2025-07-02T20:10:49.166Z	2026-03-27T16:50:11.224Z
seed-cons-000131	laure.diallo@ml-toulouse.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Laure	Diallo	conseiller	seed-str-000004	\N	1	\N	2025-11-21T01:46:00.646Z	2026-03-27T16:50:11.224Z
seed-cons-000132	jacques.morel@ml-nice.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jacques	Morel	admin_structure	seed-str-000005	\N	1	2026-03-25T17:20:50.661Z	2026-02-07T03:08:37.509Z	2026-03-27T16:50:11.224Z
seed-cons-000133	michel.nguyen@ml-nice.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Michel	Nguyen	conseiller	seed-str-000005	\N	1	2026-03-26T12:03:16.957Z	2026-01-29T00:44:11.822Z	2026-03-27T16:50:11.224Z
seed-cons-000134	fatima.robin@ml-nice.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	Robin	conseiller	seed-str-000005	\N	1	\N	2025-11-20T17:38:09.333Z	2026-03-27T16:50:11.224Z
seed-cons-000135	valerie.belkacem@ml-nice.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Valérie	Belkacem	conseiller	seed-str-000005	\N	1	2026-03-22T05:18:52.147Z	2025-08-07T13:57:06.139Z	2026-03-27T16:50:11.224Z
seed-cons-000136	celine.boyer@ml-nice.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Céline	Boyer	conseiller	seed-str-000005	\N	1	2026-03-23T06:05:28.027Z	2025-09-27T13:08:12.094Z	2026-03-27T16:50:11.224Z
seed-cons-000137	virginie.michel@ml-nice.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Virginie	Michel	conseiller	seed-str-000005	\N	1	2026-03-21T05:59:20.124Z	2025-09-14T17:35:15.781Z	2026-03-27T16:50:11.224Z
seed-cons-000138	pierre.chevalier@ml-nantes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Pierre	Chevalier	admin_structure	seed-str-000006	\N	1	2026-03-24T07:05:02.106Z	2025-06-17T04:46:58.033Z	2026-03-27T16:50:11.224Z
seed-cons-000139	caroline.blanc@ml-nantes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Caroline	Blanc	conseiller	seed-str-000006	\N	1	2026-03-24T19:56:20.576Z	2025-04-19T23:14:20.005Z	2026-03-27T16:50:11.224Z
seed-cons-000140	celine.laurent@ml-nantes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Céline	Laurent	super_admin	seed-str-000006	\N	1	\N	2026-01-07T07:45:23.468Z	2026-03-27T16:50:11.224Z
seed-cons-000141	fatima.guerin@ml-nantes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	Guérin	conseiller	seed-str-000006	\N	1	2026-03-18T15:42:24.236Z	2025-08-29T09:44:07.975Z	2026-03-27T16:50:11.224Z
seed-cons-000142	patrick.diallo@ml-nantes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Patrick	Diallo	conseiller	seed-str-000006	\N	1	\N	2026-01-01T22:12:20.994Z	2026-03-27T16:50:11.224Z
seed-cons-000143	delphine.henry@ml-nantes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Delphine	Henry	conseiller	seed-str-000006	\N	1	2026-03-15T21:00:57.983Z	2025-08-24T00:25:51.637Z	2026-03-27T16:50:11.224Z
seed-cons-000144	fabien.cisse@ml-strasbourg.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fabien	Cissé	admin_structure	seed-str-000007	\N	1	2026-03-27T08:33:28.656Z	2025-11-07T18:53:28.750Z	2026-03-27T16:50:11.224Z
seed-cons-000145	emilie.benali@ml-strasbourg.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Émilie	Benali	conseiller	seed-str-000007	\N	1	\N	2025-05-12T12:24:53.738Z	2026-03-27T16:50:11.224Z
seed-cons-000146	michel.haddad@ml-strasbourg.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Michel	Haddad	conseiller	seed-str-000007	\N	1	2026-03-14T22:31:48.573Z	2025-11-18T00:09:43.852Z	2026-03-27T16:50:11.224Z
seed-cons-000147	fabien.bouvier@ml-strasbourg.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fabien	Bouvier	conseiller	seed-str-000007	\N	1	2026-03-13T01:29:14.105Z	2025-08-13T21:30:38.471Z	2026-03-27T16:50:11.224Z
seed-cons-000148	christine.boyer@ml-strasbourg.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christine	Boyer	conseiller	seed-str-000007	\N	1	\N	2025-11-13T11:30:05.863Z	2026-03-27T16:50:11.224Z
seed-cons-000149	catherine.gauthier@ml-strasbourg.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Catherine	Gauthier	conseiller	seed-str-000007	\N	1	2026-03-18T00:13:02.864Z	2025-11-11T14:18:00.375Z	2026-03-27T16:50:11.224Z
seed-cons-000150	christophe.haddad@ml-strasbourg.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christophe	Haddad	conseiller	seed-str-000007	\N	1	2026-03-25T04:49:07.847Z	2025-07-20T04:16:21.166Z	2026-03-27T16:50:11.224Z
seed-cons-000151	caroline.andre@ml-montpellier.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Caroline	André	admin_structure	seed-str-000008	\N	1	2026-03-23T22:05:44.509Z	2025-12-20T15:39:22.477Z	2026-03-27T16:50:11.224Z
seed-cons-000152	stephane.girard@ml-montpellier.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Stéphane	Girard	conseiller	seed-str-000008	\N	1	2026-03-13T17:22:51.991Z	2025-04-26T12:08:08.794Z	2026-03-27T16:50:11.224Z
seed-cons-000153	abdel.fournier@ml-montpellier.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Abdel	Fournier	conseiller	seed-str-000008	\N	1	2026-03-23T14:46:39.182Z	2025-07-02T05:55:24.074Z	2026-03-27T16:50:11.224Z
seed-cons-000154	isabelle.robert@ml-montpellier.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Isabelle	Robert	conseiller	seed-str-000008	\N	1	2026-03-15T19:21:58.122Z	2025-05-10T03:18:17.280Z	2026-03-27T16:50:11.224Z
seed-cons-000155	nicolas.morin@ml-montpellier.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nicolas	Morin	conseiller	seed-str-000008	\N	1	\N	2025-07-28T03:51:17.651Z	2026-03-27T16:50:11.224Z
seed-cons-000156	thomas.bertrand@ml-montpellier.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Thomas	Bertrand	conseiller	seed-str-000008	\N	1	2026-03-20T21:40:50.159Z	2025-11-01T21:08:05.029Z	2026-03-27T16:50:11.224Z
seed-cons-000157	fabien.dubois@ml-montpellier.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fabien	Dubois	super_admin	seed-str-000008	\N	1	2026-03-19T10:44:26.828Z	2025-04-06T17:14:05.340Z	2026-03-27T16:50:11.224Z
seed-cons-000158	julien.leroy@ml-montpellier.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Julien	Leroy	conseiller	seed-str-000008	\N	1	\N	2026-02-21T23:19:37.940Z	2026-03-27T16:50:11.224Z
seed-cons-000159	marie.legrand@ml-montpellier.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marie	Legrand	conseiller	seed-str-000008	\N	1	2026-03-14T13:03:20.952Z	2026-02-08T15:29:17.790Z	2026-03-27T16:50:11.224Z
seed-cons-000160	fabien.guerin@ml-bordeaux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fabien	Guérin	admin_structure	seed-str-000009	\N	1	2026-03-21T19:39:05.389Z	2026-02-24T07:25:44.817Z	2026-03-27T16:50:11.224Z
seed-cons-000161	delphine.martin@ml-bordeaux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Delphine	Martin	conseiller	seed-str-000009	\N	1	2026-03-18T06:49:28.338Z	2025-07-27T13:30:20.060Z	2026-03-27T16:50:11.224Z
seed-cons-000162	sebastien.guerin@ml-bordeaux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sébastien	Guérin	conseiller	seed-str-000009	\N	1	2026-03-15T00:41:08.312Z	2025-04-03T00:21:48.069Z	2026-03-27T16:50:11.224Z
seed-cons-000163	claire.rousseau@ml-bordeaux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Claire	Rousseau	conseiller	seed-str-000009	\N	1	\N	2025-05-06T14:48:24.218Z	2026-03-27T16:50:11.224Z
seed-cons-000164	virginie.garcia@ml-bordeaux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Virginie	Garcia	conseiller	seed-str-000009	\N	1	2026-03-20T16:51:07.085Z	2025-12-25T12:32:26.355Z	2026-03-27T16:50:11.224Z
seed-cons-000165	thomas.belkacem@ml-bordeaux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Thomas	Belkacem	conseiller	seed-str-000009	\N	1	2026-03-13T21:29:07.548Z	2025-07-04T06:30:28.185Z	2026-03-27T16:50:11.224Z
seed-cons-000166	christine.michel@ml-bordeaux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christine	Michel	conseiller	seed-str-000009	\N	1	2026-03-15T01:48:21.386Z	2025-12-09T10:47:44.075Z	2026-03-27T16:50:11.224Z
seed-cons-000167	fatima.petit@ml-bordeaux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	Petit	conseiller	seed-str-000009	\N	1	\N	2025-11-09T21:58:56.997Z	2026-03-27T16:50:11.224Z
seed-cons-000168	sophie.diallo@ml-bordeaux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sophie	Diallo	conseiller	seed-str-000009	\N	1	2026-03-25T08:11:00.825Z	2025-09-05T11:10:43.400Z	2026-03-27T16:50:11.224Z
seed-cons-000169	marie.belkacem@ml-bordeaux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marie	Belkacem	conseiller	seed-str-000009	\N	1	\N	2025-10-14T00:54:16.320Z	2026-03-27T16:50:11.224Z
seed-cons-000170	sylvie.fournier@ml-lille.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sylvie	Fournier	admin_structure	seed-str-000010	\N	1	2026-03-20T18:48:15.593Z	2025-11-27T13:03:22.179Z	2026-03-27T16:50:11.224Z
seed-cons-000171	claire.legrand@ml-lille.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Claire	Legrand	conseiller	seed-str-000010	\N	1	\N	2025-05-23T22:04:02.293Z	2026-03-27T16:50:11.224Z
seed-cons-000172	caroline.francois@ml-lille.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Caroline	François	conseiller	seed-str-000010	\N	1	\N	2026-01-29T10:39:58.897Z	2026-03-27T16:50:11.224Z
seed-cons-000173	nathalie.haddad@ml-lille.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nathalie	Haddad	conseiller	seed-str-000010	\N	1	2026-03-21T21:59:33.775Z	2025-09-09T17:04:22.646Z	2026-03-27T16:50:11.224Z
seed-cons-000174	marc.diallo@ml-lille.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marc	Diallo	conseiller	seed-str-000010	\N	1	2026-03-21T15:58:01.893Z	2025-11-27T09:21:41.022Z	2026-03-27T16:50:11.224Z
seed-cons-000175	karim.david@ml-rennes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Karim	David	admin_structure	seed-str-000011	\N	1	2026-03-19T15:41:37.371Z	2025-06-30T05:03:15.291Z	2026-03-27T16:50:11.224Z
seed-cons-000176	virginie.guerin@ml-rennes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Virginie	Guérin	conseiller	seed-str-000011	\N	1	2026-03-26T02:49:33.771Z	2025-04-19T21:21:37.438Z	2026-03-27T16:50:11.224Z
seed-cons-000177	jean.bertrand@ml-rennes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jean	Bertrand	conseiller	seed-str-000011	\N	1	2026-03-21T20:46:39.736Z	2025-06-14T18:39:26.252Z	2026-03-27T16:50:11.224Z
seed-cons-000178	patrick.laurent@ml-rennes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Patrick	Laurent	conseiller	seed-str-000011	\N	1	2026-03-18T09:52:26.928Z	2025-11-12T08:11:31.166Z	2026-03-27T16:50:11.224Z
seed-cons-000179	christine.garnier@ml-rennes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christine	Garnier	conseiller	seed-str-000011	\N	1	2026-03-16T08:03:29.062Z	2025-09-27T17:39:57.336Z	2026-03-27T16:50:11.224Z
seed-cons-000180	emilie.mathieu@ml-rennes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Émilie	Mathieu	conseiller	seed-str-000011	\N	1	\N	2026-01-19T13:05:47.208Z	2026-03-27T16:50:11.224Z
seed-cons-000181	stephane.durand@ml-rennes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Stéphane	Durand	conseiller	seed-str-000011	\N	1	2026-03-23T13:31:48.572Z	2025-11-24T06:59:56.626Z	2026-03-27T16:50:11.224Z
seed-cons-000182	marc.richard@ml-reims.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marc	Richard	admin_structure	seed-str-000012	\N	1	2026-03-23T09:15:26.904Z	2025-06-16T17:30:21.512Z	2026-03-27T16:50:11.224Z
seed-cons-000183	claire.haddad@ml-reims.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Claire	Haddad	conseiller	seed-str-000012	\N	1	2026-03-23T13:12:45.531Z	2026-01-26T01:18:37.926Z	2026-03-27T16:50:11.224Z
seed-cons-000184	fatima.mathieu@ml-reims.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	Mathieu	conseiller	seed-str-000012	\N	1	\N	2025-05-31T21:44:24.711Z	2026-03-27T16:50:11.224Z
seed-cons-000185	isabelle.robin@ml-reims.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Isabelle	Robin	conseiller	seed-str-000012	\N	1	2026-03-18T08:38:25.401Z	2025-07-30T07:53:08.058Z	2026-03-27T16:50:11.224Z
seed-cons-000186	caroline.henry@ml-reims.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Caroline	Henry	conseiller	seed-str-000012	\N	1	2026-03-24T07:30:23.732Z	2026-01-03T07:27:39.228Z	2026-03-27T16:50:11.224Z
seed-cons-000187	virginie.garcia@ml-sainttienne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Virginie	Garcia	admin_structure	seed-str-000013	\N	1	2026-03-25T12:45:02.755Z	2025-11-05T00:01:39.963Z	2026-03-27T16:50:11.224Z
seed-cons-000188	pierre.guerin@ml-sainttienne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Pierre	Guérin	conseiller	seed-str-000013	\N	1	\N	2025-06-15T09:08:05.764Z	2026-03-27T16:50:11.224Z
seed-cons-000189	valerie.nicolas@ml-sainttienne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Valérie	Nicolas	conseiller	seed-str-000013	\N	1	2026-03-19T19:49:53.802Z	2026-02-02T09:37:26.535Z	2026-03-27T16:50:11.224Z
seed-cons-000190	aurelie.durand@ml-sainttienne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Aurélie	Durand	conseiller	seed-str-000013	\N	1	\N	2025-07-30T15:35:21.707Z	2026-03-27T16:50:11.224Z
seed-cons-000191	francois.gauthier@ml-sainttienne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	François	Gauthier	conseiller	seed-str-000013	\N	1	2026-03-21T10:09:24.206Z	2025-10-01T22:22:10.102Z	2026-03-27T16:50:11.224Z
seed-cons-000192	delphine.robert@ml-lehavre.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Delphine	Robert	admin_structure	seed-str-000014	\N	1	2026-03-14T18:32:40.568Z	2026-01-26T05:54:04.791Z	2026-03-27T16:50:11.224Z
seed-cons-000193	sandrine.morel@ml-lehavre.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sandrine	Morel	super_admin	seed-str-000014	\N	1	2026-03-26T15:55:15.627Z	2025-07-30T08:34:44.104Z	2026-03-27T16:50:11.224Z
seed-cons-000194	marie.diallo@ml-lehavre.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marie	Diallo	conseiller	seed-str-000014	\N	1	2026-03-15T10:05:18.645Z	2026-02-06T22:18:10.156Z	2026-03-27T16:50:11.224Z
seed-cons-000195	julien.bernard@ml-lehavre.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Julien	Bernard	conseiller	seed-str-000014	\N	1	2026-03-16T13:33:33.293Z	2025-08-10T19:49:27.884Z	2026-03-27T16:50:11.224Z
seed-cons-000196	sylvie.lefebvre@ml-lehavre.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sylvie	Lefebvre	conseiller	seed-str-000014	\N	1	2026-03-13T04:45:19.899Z	2025-06-25T17:34:53.881Z	2026-03-27T16:50:11.224Z
seed-cons-000197	amina.morel@ml-lehavre.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Amina	Morel	conseiller	seed-str-000014	\N	1	2026-03-13T03:51:22.803Z	2025-08-27T01:00:28.775Z	2026-03-27T16:50:11.224Z
seed-cons-000198	marc.diallo@ml-lehavre.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marc	Diallo	super_admin	seed-str-000014	\N	1	2026-03-14T06:02:47.183Z	2025-06-25T18:56:09.610Z	2026-03-27T16:50:11.224Z
seed-cons-000199	aurelie.fournier@ml-toulon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Aurélie	Fournier	admin_structure	seed-str-000015	\N	1	\N	2025-11-16T16:47:37.869Z	2026-03-27T16:50:11.224Z
seed-cons-000200	julien.petit@ml-toulon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Julien	Petit	conseiller	seed-str-000015	\N	1	2026-03-27T01:49:03.168Z	2026-02-22T23:44:44.872Z	2026-03-27T16:50:11.224Z
seed-cons-000201	stephane.leroy@ml-toulon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Stéphane	Leroy	conseiller	seed-str-000015	\N	1	2026-03-16T05:16:11.140Z	2025-08-12T03:50:52.115Z	2026-03-27T16:50:11.224Z
seed-cons-000202	celine.david@ml-toulon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Céline	David	conseiller	seed-str-000015	\N	1	2026-03-22T07:54:45.166Z	2025-11-18T04:10:01.557Z	2026-03-27T16:50:11.224Z
seed-cons-000203	christophe.nguyen@ml-toulon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christophe	Nguyen	conseiller	seed-str-000015	\N	1	2026-03-14T06:16:03.480Z	2026-02-09T22:59:02.908Z	2026-03-27T16:50:11.224Z
seed-cons-000204	marie.andre@ml-toulon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marie	André	conseiller	seed-str-000015	\N	1	\N	2025-05-02T23:23:57.714Z	2026-03-27T16:50:11.224Z
seed-cons-000205	sophie.leroy@ml-toulon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sophie	Leroy	conseiller	seed-str-000015	\N	1	\N	2025-08-23T22:32:55.173Z	2026-03-27T16:50:11.224Z
seed-cons-000206	marc.blanc@ml-toulon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marc	Blanc	conseiller	seed-str-000015	\N	1	\N	2026-01-13T16:25:49.155Z	2026-03-27T16:50:11.224Z
seed-cons-000207	nathalie.martin@ml-toulon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nathalie	Martin	conseiller	seed-str-000015	\N	1	2026-03-14T21:05:37.721Z	2025-04-29T18:37:04.550Z	2026-03-27T16:50:11.224Z
seed-cons-000208	emilie.morin@ml-grenoble.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Émilie	Morin	admin_structure	seed-str-000016	\N	1	2026-03-23T17:25:48.184Z	2025-12-31T21:52:42.834Z	2026-03-27T16:50:11.224Z
seed-cons-000209	celine.david@ml-grenoble.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Céline	David	conseiller	seed-str-000016	\N	1	2026-03-23T15:49:51.852Z	2025-05-07T12:48:30.485Z	2026-03-27T16:50:11.224Z
seed-cons-000210	marc.robin@ml-grenoble.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marc	Robin	conseiller	seed-str-000016	\N	1	\N	2025-05-11T00:17:55.988Z	2026-03-27T16:50:11.224Z
seed-cons-000211	emilie.gauthier@ml-grenoble.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Émilie	Gauthier	conseiller	seed-str-000016	\N	1	2026-03-16T00:27:51.339Z	2025-05-01T16:38:57.714Z	2026-03-27T16:50:11.224Z
seed-cons-000212	sebastien.kone@ml-grenoble.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sébastien	Kone	conseiller	seed-str-000016	\N	1	2026-03-14T21:16:43.346Z	2025-04-23T09:02:36.499Z	2026-03-27T16:50:11.224Z
seed-cons-000213	philippe.clement@ml-grenoble.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Philippe	Clément	conseiller	seed-str-000016	\N	1	\N	2025-07-16T00:20:16.476Z	2026-03-27T16:50:11.224Z
seed-cons-000214	celine.robert@ml-grenoble.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Céline	Robert	conseiller	seed-str-000016	\N	1	\N	2025-08-14T22:52:42.706Z	2026-03-27T16:50:11.224Z
seed-cons-000215	jacques.lefebvre@ml-grenoble.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jacques	Lefebvre	conseiller	seed-str-000016	\N	1	\N	2025-05-06T18:41:26.786Z	2026-03-27T16:50:11.224Z
seed-cons-000216	nicolas.nicolas@ml-grenoble.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nicolas	Nicolas	conseiller	seed-str-000016	\N	1	2026-03-27T08:46:35.020Z	2025-06-16T01:07:19.535Z	2026-03-27T16:50:11.224Z
seed-cons-000217	sylvie.bouvier@ml-grenoble.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sylvie	Bouvier	super_admin	seed-str-000016	\N	1	2026-03-19T03:17:37.114Z	2025-12-17T10:20:51.332Z	2026-03-27T16:50:11.224Z
seed-cons-000218	philippe.francois@ml-dijon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Philippe	François	admin_structure	seed-str-000017	\N	1	2026-03-19T06:08:11.207Z	2025-08-04T18:10:21.288Z	2026-03-27T16:50:11.224Z
seed-cons-000219	delphine.kone@ml-dijon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Delphine	Kone	conseiller	seed-str-000017	\N	1	\N	2025-08-24T16:12:19.808Z	2026-03-27T16:50:11.224Z
seed-cons-000220	marc.mercier@ml-dijon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marc	Mercier	conseiller	seed-str-000017	\N	1	2026-03-24T12:45:06.675Z	2025-05-19T03:22:31.132Z	2026-03-27T16:50:11.224Z
seed-cons-000221	sandrine.girard@ml-dijon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sandrine	Girard	conseiller	seed-str-000017	\N	1	2026-03-16T22:37:45.754Z	2025-08-26T19:22:17.061Z	2026-03-27T16:50:11.224Z
seed-cons-000222	emilie.robert@ml-dijon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Émilie	Robert	conseiller	seed-str-000017	\N	1	2026-03-16T07:10:29.747Z	2025-12-01T01:39:00.370Z	2026-03-27T16:50:11.224Z
seed-cons-000223	julien.bertrand@ml-dijon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Julien	Bertrand	conseiller	seed-str-000017	\N	1	2026-03-23T02:09:45.689Z	2026-02-22T08:37:26.396Z	2026-03-27T16:50:11.224Z
seed-cons-000224	christophe.gauthier@ml-angers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christophe	Gauthier	admin_structure	seed-str-000018	\N	1	2026-03-13T07:48:04.875Z	2025-11-20T08:38:34.963Z	2026-03-27T16:50:11.224Z
seed-cons-000225	david.laurent@ml-angers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	David	Laurent	conseiller	seed-str-000018	\N	1	2026-03-27T07:51:57.989Z	2025-06-02T06:07:36.491Z	2026-03-27T16:50:11.224Z
seed-cons-000226	amina.perrin@ml-angers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Amina	Perrin	conseiller	seed-str-000018	\N	1	\N	2025-06-06T19:05:01.567Z	2026-03-27T16:50:11.224Z
seed-cons-000227	isabelle.roux@ml-angers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Isabelle	Roux	conseiller	seed-str-000018	\N	1	\N	2025-06-12T19:31:53.199Z	2026-03-27T16:50:11.224Z
seed-cons-000228	fatima.belkacem@ml-angers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	Belkacem	conseiller	seed-str-000018	\N	1	2026-03-12T17:01:42.110Z	2025-12-21T01:19:26.843Z	2026-03-27T16:50:11.224Z
seed-cons-000229	anne.garcia@ml-angers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Anne	Garcia	conseiller	seed-str-000018	\N	1	2026-03-24T05:49:20.753Z	2025-12-06T20:45:27.934Z	2026-03-27T16:50:11.224Z
seed-cons-000230	sylvie.robert@ml-angers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sylvie	Robert	conseiller	seed-str-000018	\N	1	2026-03-22T15:03:42.619Z	2025-11-16T09:15:27.539Z	2026-03-27T16:50:11.224Z
seed-cons-000231	fabien.bertrand@ml-angers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fabien	Bertrand	conseiller	seed-str-000018	\N	1	\N	2026-02-15T06:44:03.500Z	2026-03-27T16:50:11.224Z
seed-cons-000232	isabelle.moreau@ml-angers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Isabelle	Moreau	conseiller	seed-str-000018	\N	1	2026-03-24T12:45:49.261Z	2025-12-11T12:33:40.925Z	2026-03-27T16:50:11.224Z
seed-cons-000233	delphine.moreau@ml-nmes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Delphine	Moreau	admin_structure	seed-str-000019	\N	1	2026-03-15T22:08:10.737Z	2025-11-21T18:13:09.692Z	2026-03-27T16:50:11.224Z
seed-cons-000234	caroline.dubois@ml-nmes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Caroline	Dubois	conseiller	seed-str-000019	\N	1	\N	2025-06-26T08:17:29.081Z	2026-03-27T16:50:11.224Z
seed-cons-000235	nicolas.nguyen@ml-nmes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nicolas	Nguyen	conseiller	seed-str-000019	\N	1	2026-03-26T00:03:37.758Z	2026-02-15T21:24:35.220Z	2026-03-27T16:50:11.224Z
seed-cons-000236	sylvie.vincent@ml-nmes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sylvie	Vincent	conseiller	seed-str-000019	\N	1	2026-03-20T13:04:46.593Z	2025-12-13T09:42:27.981Z	2026-03-27T16:50:11.224Z
seed-cons-000237	fatima.andre@ml-nmes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	André	conseiller	seed-str-000019	\N	1	\N	2025-08-04T15:14:32.527Z	2026-03-27T16:50:11.224Z
seed-cons-000238	pierre.garnier@ml-nmes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Pierre	Garnier	conseiller	seed-str-000019	\N	1	2026-03-24T11:50:57.910Z	2026-01-04T14:43:28.230Z	2026-03-27T16:50:11.224Z
seed-cons-000239	fabien.henry@ml-nmes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fabien	Henry	conseiller	seed-str-000019	\N	1	2026-03-19T06:39:05.964Z	2025-09-13T12:24:06.576Z	2026-03-27T16:50:11.224Z
seed-cons-000240	nathalie.traore@ml-nmes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nathalie	Traoré	super_admin	seed-str-000019	\N	1	2026-03-18T20:31:31.634Z	2025-05-31T09:03:31.478Z	2026-03-27T16:50:11.224Z
seed-cons-000241	marie.mercier@ml-nmes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marie	Mercier	conseiller	seed-str-000019	\N	1	2026-03-14T06:50:41.999Z	2025-06-14T10:43:05.244Z	2026-03-27T16:50:11.224Z
seed-cons-000242	catherine.morin@ml-clermontferrand.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Catherine	Morin	admin_structure	seed-str-000020	\N	1	\N	2026-01-04T00:48:51.350Z	2026-03-27T16:50:11.224Z
seed-cons-000243	francois.richard@ml-clermontferrand.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	François	Richard	conseiller	seed-str-000020	\N	1	\N	2025-10-03T17:07:08.851Z	2026-03-27T16:50:11.224Z
seed-cons-000244	christophe.garnier@ml-clermontferrand.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christophe	Garnier	conseiller	seed-str-000020	\N	1	2026-03-27T08:48:54.614Z	2025-10-31T15:05:18.937Z	2026-03-27T16:50:11.224Z
seed-cons-000245	valerie.kone@ml-clermontferrand.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Valérie	Kone	conseiller	seed-str-000020	\N	1	2026-03-15T06:02:32.033Z	2026-01-27T10:54:16.216Z	2026-03-27T16:50:11.224Z
seed-cons-000246	karim.thomas@ml-clermontferrand.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Karim	Thomas	conseiller	seed-str-000020	\N	1	2026-03-18T05:52:46.917Z	2025-05-29T10:02:53.678Z	2026-03-27T16:50:11.224Z
seed-cons-000247	marc.vincent@ml-clermontferrand.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marc	Vincent	conseiller	seed-str-000020	\N	1	2026-03-13T14:55:19.670Z	2025-10-20T18:16:13.574Z	2026-03-27T16:50:11.224Z
seed-cons-000248	julien.girard@ml-clermontferrand.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Julien	Girard	conseiller	seed-str-000020	\N	1	2026-03-18T22:42:51.150Z	2025-10-08T18:25:44.041Z	2026-03-27T16:50:11.224Z
seed-cons-000249	celine.thomas@ml-clermontferrand.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Céline	Thomas	conseiller	seed-str-000020	\N	1	2026-03-25T00:16:30.238Z	2025-09-04T19:36:46.500Z	2026-03-27T16:50:11.224Z
seed-cons-000250	francois.roux@ml-aixenprovence.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	François	Roux	admin_structure	seed-str-000021	\N	1	2026-03-17T22:08:05.452Z	2025-10-07T04:47:33.630Z	2026-03-27T16:50:11.224Z
seed-cons-000251	celine.kone@ml-aixenprovence.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Céline	Kone	conseiller	seed-str-000021	\N	1	\N	2026-01-27T05:25:29.402Z	2026-03-27T16:50:11.224Z
seed-cons-000252	laure.thomas@ml-aixenprovence.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Laure	Thomas	conseiller	seed-str-000021	\N	1	2026-03-25T19:51:42.402Z	2025-10-07T22:37:19.459Z	2026-03-27T16:50:11.224Z
seed-cons-000253	anne.rousseau@ml-aixenprovence.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Anne	Rousseau	conseiller	seed-str-000021	\N	1	2026-03-16T10:20:00.229Z	2025-11-28T04:23:44.983Z	2026-03-27T16:50:11.224Z
seed-cons-000254	sebastien.henry@ml-aixenprovence.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sébastien	Henry	conseiller	seed-str-000021	\N	1	2026-03-23T07:09:57.940Z	2025-06-07T09:42:31.486Z	2026-03-27T16:50:11.224Z
seed-cons-000255	yannick.clement@ml-aixenprovence.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Yannick	Clément	conseiller	seed-str-000021	\N	1	\N	2025-10-17T17:02:23.570Z	2026-03-27T16:50:11.224Z
seed-cons-000256	valerie.boyer@ml-aixenprovence.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Valérie	Boyer	conseiller	seed-str-000021	\N	1	\N	2025-04-24T17:49:59.303Z	2026-03-27T16:50:11.224Z
seed-cons-000257	francois.gauthier@ml-aixenprovence.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	François	Gauthier	conseiller	seed-str-000021	\N	1	2026-03-25T16:27:13.387Z	2026-01-12T09:57:27.799Z	2026-03-27T16:50:11.224Z
seed-cons-000258	david.lefebvre@ml-aixenprovence.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	David	Lefebvre	super_admin	seed-str-000021	\N	1	\N	2025-07-29T22:02:47.692Z	2026-03-27T16:50:11.224Z
seed-cons-000259	sebastien.durand@ml-brest.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sébastien	Durand	admin_structure	seed-str-000022	\N	1	2026-03-22T06:46:08.218Z	2025-11-04T18:27:51.622Z	2026-03-27T16:50:11.224Z
seed-cons-000260	abdel.david@ml-brest.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Abdel	David	conseiller	seed-str-000022	\N	1	2026-03-13T06:04:12.145Z	2025-11-10T14:11:46.103Z	2026-03-27T16:50:11.224Z
seed-cons-000261	sandrine.garnier@ml-brest.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sandrine	Garnier	conseiller	seed-str-000022	\N	1	\N	2025-05-08T09:59:55.574Z	2026-03-27T16:50:11.224Z
seed-cons-000262	patrick.boyer@ml-brest.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Patrick	Boyer	conseiller	seed-str-000022	\N	1	2026-03-13T06:12:48.626Z	2025-08-15T20:23:36.230Z	2026-03-27T16:50:11.224Z
seed-cons-000263	david.blanc@ml-brest.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	David	Blanc	conseiller	seed-str-000022	\N	1	\N	2025-03-30T15:24:45.112Z	2026-03-27T16:50:11.224Z
seed-cons-000264	alain.michel@ml-tours.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Alain	Michel	admin_structure	seed-str-000023	\N	1	2026-03-17T00:56:50.411Z	2025-05-18T20:05:03.728Z	2026-03-27T16:50:11.224Z
seed-cons-000265	valerie.david@ml-tours.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Valérie	David	conseiller	seed-str-000023	\N	1	2026-03-22T21:23:52.451Z	2025-05-17T18:27:02.902Z	2026-03-27T16:50:11.224Z
seed-cons-000266	thomas.francois@ml-tours.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Thomas	François	conseiller	seed-str-000023	\N	1	2026-03-26T02:06:22.546Z	2025-07-09T03:52:57.978Z	2026-03-27T16:50:11.224Z
seed-cons-000267	aurelie.lefebvre@ml-tours.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Aurélie	Lefebvre	conseiller	seed-str-000023	\N	1	\N	2025-05-14T07:12:56.608Z	2026-03-27T16:50:11.224Z
seed-cons-000268	fabien.lefebvre@ml-tours.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fabien	Lefebvre	conseiller	seed-str-000023	\N	1	2026-03-14T19:48:21.656Z	2025-09-24T18:38:45.382Z	2026-03-27T16:50:11.224Z
seed-cons-000269	nathalie.petit@ml-tours.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nathalie	Petit	conseiller	seed-str-000023	\N	1	2026-03-18T16:30:32.539Z	2026-01-04T10:15:17.775Z	2026-03-27T16:50:11.224Z
seed-cons-000270	aurelie.bamba@ml-tours.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Aurélie	Bamba	conseiller	seed-str-000023	\N	1	2026-03-23T23:29:01.409Z	2026-02-07T03:57:07.153Z	2026-03-27T16:50:11.224Z
seed-cons-000271	delphine.bouvier@ml-tours.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Delphine	Bouvier	conseiller	seed-str-000023	\N	1	\N	2025-06-22T21:24:16.505Z	2026-03-27T16:50:11.224Z
seed-cons-000272	christophe.garcia@ml-tours.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christophe	Garcia	conseiller	seed-str-000023	\N	1	\N	2025-10-27T07:26:41.092Z	2026-03-27T16:50:11.224Z
seed-cons-000273	julien.girard@ml-amiens.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Julien	Girard	admin_structure	seed-str-000024	\N	1	2026-03-13T21:01:41.951Z	2025-04-14T09:02:20.429Z	2026-03-27T16:50:11.224Z
seed-cons-000274	nicolas.vincent@ml-amiens.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nicolas	Vincent	conseiller	seed-str-000024	\N	1	\N	2026-01-30T04:56:08.945Z	2026-03-27T16:50:11.224Z
seed-cons-000275	fabien.perrin@ml-amiens.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fabien	Perrin	conseiller	seed-str-000024	\N	1	\N	2025-03-30T10:38:47.224Z	2026-03-27T16:50:11.224Z
seed-cons-000276	amina.mathieu@ml-amiens.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Amina	Mathieu	conseiller	seed-str-000024	\N	1	\N	2026-01-02T23:43:23.654Z	2026-03-27T16:50:11.224Z
seed-cons-000277	laure.boyer@ml-amiens.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Laure	Boyer	conseiller	seed-str-000024	\N	1	2026-03-23T02:06:17.271Z	2025-06-20T04:30:45.182Z	2026-03-27T16:50:11.224Z
seed-cons-000278	caroline.garnier@ml-amiens.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Caroline	Garnier	conseiller	seed-str-000024	\N	1	2026-03-21T08:21:27.170Z	2026-02-04T13:11:40.649Z	2026-03-27T16:50:11.224Z
seed-cons-000279	caroline.haddad@ml-amiens.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Caroline	Haddad	super_admin	seed-str-000024	\N	1	2026-03-18T07:20:15.741Z	2025-05-04T22:42:48.861Z	2026-03-27T16:50:11.224Z
seed-cons-000280	julien.henry@ml-amiens.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Julien	Henry	conseiller	seed-str-000024	\N	1	2026-03-15T21:50:54.591Z	2026-02-23T05:15:02.086Z	2026-03-27T16:50:11.224Z
seed-cons-000281	emilie.thomas@ml-amiens.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Émilie	Thomas	conseiller	seed-str-000024	\N	1	2026-03-25T12:18:29.433Z	2025-06-24T19:14:59.415Z	2026-03-27T16:50:11.224Z
seed-cons-000282	claire.mercier@ml-amiens.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Claire	Mercier	conseiller	seed-str-000024	\N	1	\N	2025-07-03T12:23:17.427Z	2026-03-27T16:50:11.224Z
seed-cons-000283	jean.bernard@ml-limoges.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jean	Bernard	admin_structure	seed-str-000025	\N	1	2026-03-14T18:06:38.101Z	2025-09-21T21:54:57.468Z	2026-03-27T16:50:11.224Z
seed-cons-000284	valerie.legrand@ml-limoges.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Valérie	Legrand	conseiller	seed-str-000025	\N	1	\N	2025-03-31T12:23:02.931Z	2026-03-27T16:50:11.224Z
seed-cons-000285	francois.vincent@ml-limoges.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	François	Vincent	super_admin	seed-str-000025	\N	1	2026-03-16T05:33:19.716Z	2025-10-07T15:19:55.903Z	2026-03-27T16:50:11.224Z
seed-cons-000286	emilie.haddad@ml-limoges.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Émilie	Haddad	conseiller	seed-str-000025	\N	1	\N	2025-08-23T20:27:36.614Z	2026-03-27T16:50:11.224Z
seed-cons-000287	jean.traore@ml-limoges.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jean	Traoré	conseiller	seed-str-000025	\N	1	2026-03-21T09:27:08.868Z	2025-11-21T00:37:11.889Z	2026-03-27T16:50:11.224Z
seed-cons-000288	david.bouvier@ml-limoges.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	David	Bouvier	conseiller	seed-str-000025	\N	1	2026-03-20T16:01:53.032Z	2026-01-18T19:42:30.152Z	2026-03-27T16:50:11.224Z
seed-cons-000289	nathalie.nguyen@ml-limoges.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nathalie	Nguyen	conseiller	seed-str-000025	\N	1	\N	2025-11-09T22:56:20.337Z	2026-03-27T16:50:11.224Z
seed-cons-000290	michel.perrin@ml-limoges.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Michel	Perrin	conseiller	seed-str-000025	\N	1	2026-03-19T15:55:24.472Z	2025-09-14T10:42:08.068Z	2026-03-27T16:50:11.224Z
seed-cons-000291	yannick.dubois@ml-limoges.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Yannick	Dubois	conseiller	seed-str-000025	\N	1	\N	2025-10-29T00:53:43.626Z	2026-03-27T16:50:11.224Z
seed-cons-000292	sebastien.robin@ml-villeurbanne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sébastien	Robin	admin_structure	seed-str-000026	\N	1	2026-03-18T21:48:52.837Z	2025-05-09T03:35:15.042Z	2026-03-27T16:50:11.224Z
seed-cons-000293	christine.dubois@ml-villeurbanne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christine	Dubois	conseiller	seed-str-000026	\N	1	2026-03-18T06:27:08.564Z	2025-09-01T22:26:44.357Z	2026-03-27T16:50:11.224Z
seed-cons-000294	caroline.robert@ml-villeurbanne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Caroline	Robert	conseiller	seed-str-000026	\N	1	\N	2026-02-15T16:30:24.705Z	2026-03-27T16:50:11.224Z
seed-cons-000295	sandrine.thomas@ml-villeurbanne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sandrine	Thomas	conseiller	seed-str-000026	\N	1	2026-03-21T09:10:42.324Z	2025-04-05T19:03:26.627Z	2026-03-27T16:50:11.224Z
seed-cons-000296	anne.clement@ml-villeurbanne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Anne	Clément	conseiller	seed-str-000026	\N	1	\N	2026-01-12T04:57:18.670Z	2026-03-27T16:50:11.224Z
seed-cons-000297	sylvie.morin@ml-villeurbanne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sylvie	Morin	conseiller	seed-str-000026	\N	1	2026-03-14T01:39:12.765Z	2025-08-13T16:44:02.591Z	2026-03-27T16:50:11.224Z
seed-cons-000298	marc.benali@ml-villeurbanne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marc	Benali	conseiller	seed-str-000026	\N	1	2026-03-17T20:32:06.502Z	2025-10-17T16:12:09.819Z	2026-03-27T16:50:11.224Z
seed-cons-000299	anne.bertrand@ml-villeurbanne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Anne	Bertrand	conseiller	seed-str-000026	\N	1	2026-03-13T18:06:18.819Z	2025-10-11T13:16:22.131Z	2026-03-27T16:50:11.224Z
seed-cons-000300	karim.richard@ml-villeurbanne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Karim	Richard	super_admin	seed-str-000026	\N	1	\N	2025-07-20T12:58:00.248Z	2026-03-27T16:50:11.224Z
seed-cons-000301	sebastien.simon@ml-metz.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sébastien	Simon	admin_structure	seed-str-000027	\N	1	2026-03-25T15:47:33.113Z	2025-06-19T05:29:03.083Z	2026-03-27T16:50:11.224Z
seed-cons-000302	sandrine.vincent@ml-metz.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sandrine	Vincent	conseiller	seed-str-000027	\N	1	2026-03-23T19:03:19.942Z	2025-05-06T20:16:07.006Z	2026-03-27T16:50:11.224Z
seed-cons-000303	valerie.richard@ml-metz.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Valérie	Richard	conseiller	seed-str-000027	\N	1	\N	2025-12-09T07:29:18.400Z	2026-03-27T16:50:11.224Z
seed-cons-000304	marc.garcia@ml-metz.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marc	Garcia	conseiller	seed-str-000027	\N	1	\N	2025-12-29T17:53:04.499Z	2026-03-27T16:50:11.224Z
seed-cons-000305	sophie.morel@ml-metz.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sophie	Morel	conseiller	seed-str-000027	\N	1	2026-03-16T23:24:56.201Z	2025-11-23T01:47:57.240Z	2026-03-27T16:50:11.224Z
seed-cons-000306	patrick.nicolas@ml-metz.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Patrick	Nicolas	conseiller	seed-str-000027	\N	1	2026-03-24T14:42:47.408Z	2026-02-24T02:17:21.140Z	2026-03-27T16:50:11.224Z
seed-cons-000307	sandrine.traore@ml-metz.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sandrine	Traoré	conseiller	seed-str-000027	\N	1	2026-03-25T09:13:53.785Z	2025-04-20T10:55:12.435Z	2026-03-27T16:50:11.224Z
seed-cons-000308	thomas.leroy@ml-besanon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Thomas	Leroy	admin_structure	seed-str-000028	\N	1	2026-03-26T01:03:01.877Z	2025-10-22T20:35:15.903Z	2026-03-27T16:50:11.224Z
seed-cons-000309	jacques.cisse@ml-besanon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jacques	Cissé	conseiller	seed-str-000028	\N	1	2026-03-21T03:17:45.527Z	2025-04-23T08:49:23.640Z	2026-03-27T16:50:11.224Z
seed-cons-000310	jacques.mercier@ml-besanon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jacques	Mercier	conseiller	seed-str-000028	\N	1	2026-03-14T02:23:45.063Z	2025-04-19T09:27:24.590Z	2026-03-27T16:50:11.224Z
seed-cons-000311	claire.petit@ml-besanon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Claire	Petit	conseiller	seed-str-000028	\N	1	\N	2025-08-22T06:52:24.961Z	2026-03-27T16:50:11.224Z
seed-cons-000312	amina.bamba@ml-besanon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Amina	Bamba	conseiller	seed-str-000028	\N	1	2026-03-24T14:42:40.363Z	2025-05-06T08:07:05.888Z	2026-03-27T16:50:11.224Z
seed-cons-000313	celine.fournier@ml-perpignan.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Céline	Fournier	admin_structure	seed-str-000029	\N	1	2026-03-24T21:09:50.975Z	2025-12-03T22:25:27.157Z	2026-03-27T16:50:11.224Z
seed-cons-000314	philippe.robert@ml-perpignan.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Philippe	Robert	conseiller	seed-str-000029	\N	1	\N	2025-12-28T06:26:40.476Z	2026-03-27T16:50:11.224Z
seed-cons-000315	marie.blanc@ml-perpignan.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marie	Blanc	conseiller	seed-str-000029	\N	1	2026-03-17T20:25:54.858Z	2025-06-25T23:48:40.612Z	2026-03-27T16:50:11.224Z
seed-cons-000316	celine.clement@ml-perpignan.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Céline	Clément	conseiller	seed-str-000029	\N	1	2026-03-19T20:14:14.774Z	2025-08-14T06:58:56.576Z	2026-03-27T16:50:11.224Z
seed-cons-000317	nathalie.morin@ml-perpignan.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nathalie	Morin	conseiller	seed-str-000029	\N	1	2026-03-20T04:47:58.498Z	2025-04-08T14:31:58.845Z	2026-03-27T16:50:11.224Z
seed-cons-000318	marie.clement@ml-perpignan.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marie	Clément	super_admin	seed-str-000029	\N	1	2026-03-20T23:01:35.263Z	2025-09-07T07:47:02.772Z	2026-03-27T16:50:11.224Z
seed-cons-000319	christophe.morin@ml-orlans.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christophe	Morin	admin_structure	seed-str-000030	\N	1	2026-03-16T14:09:02.600Z	2025-11-01T01:08:38.543Z	2026-03-27T16:50:11.224Z
seed-cons-000320	julien.robert@ml-orlans.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Julien	Robert	conseiller	seed-str-000030	\N	1	\N	2026-01-09T14:34:56.554Z	2026-03-27T16:50:11.224Z
seed-cons-000321	abdel.rousseau@ml-orlans.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Abdel	Rousseau	conseiller	seed-str-000030	\N	1	\N	2025-05-05T11:29:12.042Z	2026-03-27T16:50:11.224Z
seed-cons-000322	laure.morin@ml-orlans.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Laure	Morin	conseiller	seed-str-000030	\N	1	\N	2025-04-09T00:15:59.733Z	2026-03-27T16:50:11.224Z
seed-cons-000323	celine.garcia@ml-orlans.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Céline	Garcia	conseiller	seed-str-000030	\N	1	2026-03-12T23:32:41.199Z	2026-01-30T17:22:11.866Z	2026-03-27T16:50:11.224Z
seed-cons-000324	anne.clement@ml-orlans.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Anne	Clément	conseiller	seed-str-000030	\N	1	2026-03-22T13:01:12.528Z	2025-05-11T12:19:35.805Z	2026-03-27T16:50:11.224Z
seed-cons-000325	sophie.robert@ml-orlans.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sophie	Robert	conseiller	seed-str-000030	\N	1	\N	2025-11-04T00:41:33.739Z	2026-03-27T16:50:11.224Z
seed-cons-000326	karim.diallo@ml-caen.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Karim	Diallo	admin_structure	seed-str-000031	\N	1	2026-03-23T09:42:49.837Z	2025-05-10T04:47:42.975Z	2026-03-27T16:50:11.224Z
seed-cons-000327	aurelie.rousseau@ml-caen.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Aurélie	Rousseau	conseiller	seed-str-000031	\N	1	2026-03-16T00:05:48.877Z	2025-07-21T09:01:05.744Z	2026-03-27T16:50:11.224Z
seed-cons-000328	patrick.moreau@ml-caen.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Patrick	Moreau	conseiller	seed-str-000031	\N	1	2026-03-24T19:48:00.221Z	2025-05-29T18:15:31.536Z	2026-03-27T16:50:11.224Z
seed-cons-000329	caroline.laurent@ml-caen.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Caroline	Laurent	conseiller	seed-str-000031	\N	1	2026-03-14T18:26:47.683Z	2025-08-31T17:35:18.055Z	2026-03-27T16:50:11.224Z
seed-cons-000330	valerie.morel@ml-caen.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Valérie	Morel	conseiller	seed-str-000031	\N	1	2026-03-23T07:07:52.136Z	2025-09-27T14:18:32.236Z	2026-03-27T16:50:11.224Z
seed-cons-000331	valerie.rousseau@ml-caen.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Valérie	Rousseau	conseiller	seed-str-000031	\N	1	\N	2025-11-28T20:25:13.607Z	2026-03-27T16:50:11.224Z
seed-cons-000332	catherine.fournier@ml-caen.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Catherine	Fournier	conseiller	seed-str-000031	\N	1	\N	2025-12-06T07:16:38.601Z	2026-03-27T16:50:11.224Z
seed-cons-000333	jean.benali@ml-caen.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jean	Benali	conseiller	seed-str-000031	\N	1	2026-03-12T22:51:39.186Z	2025-12-12T14:37:47.933Z	2026-03-27T16:50:11.224Z
seed-cons-000334	anne.nicolas@ml-mulhouse.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Anne	Nicolas	admin_structure	seed-str-000032	\N	1	2026-03-25T12:09:55.109Z	2025-10-14T22:07:39.219Z	2026-03-27T16:50:11.224Z
seed-cons-000335	celine.thomas@ml-mulhouse.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Céline	Thomas	conseiller	seed-str-000032	\N	1	2026-03-20T22:59:05.374Z	2025-05-13T10:07:15.224Z	2026-03-27T16:50:11.224Z
seed-cons-000336	fatima.leroy@ml-mulhouse.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	Leroy	conseiller	seed-str-000032	\N	1	\N	2025-06-30T21:52:01.604Z	2026-03-27T16:50:11.224Z
seed-cons-000337	marie.garnier@ml-mulhouse.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marie	Garnier	conseiller	seed-str-000032	\N	1	\N	2026-01-26T00:41:12.272Z	2026-03-27T16:50:11.224Z
seed-cons-000338	virginie.nicolas@ml-mulhouse.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Virginie	Nicolas	conseiller	seed-str-000032	\N	1	2026-03-21T07:34:43.853Z	2025-04-26T18:10:45.823Z	2026-03-27T16:50:11.224Z
seed-cons-000339	isabelle.chevalier@ml-mulhouse.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Isabelle	Chevalier	conseiller	seed-str-000032	\N	1	\N	2026-01-13T20:29:21.183Z	2026-03-27T16:50:11.224Z
seed-cons-000340	marc.cisse@ml-rouen.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marc	Cissé	admin_structure	seed-str-000033	\N	1	2026-03-16T15:17:10.334Z	2025-11-09T06:42:57.221Z	2026-03-27T16:50:11.224Z
seed-cons-000341	catherine.rousseau@ml-rouen.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Catherine	Rousseau	conseiller	seed-str-000033	\N	1	2026-03-15T11:18:02.433Z	2025-03-30T15:13:54.629Z	2026-03-27T16:50:11.224Z
seed-cons-000342	celine.david@ml-rouen.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Céline	David	conseiller	seed-str-000033	\N	1	2026-03-16T03:44:43.713Z	2025-11-08T16:06:31.010Z	2026-03-27T16:50:11.224Z
seed-cons-000343	fatima.petit@ml-rouen.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	Petit	conseiller	seed-str-000033	\N	1	2026-03-22T22:23:13.791Z	2025-06-21T08:28:40.471Z	2026-03-27T16:50:11.224Z
seed-cons-000344	alain.traore@ml-rouen.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Alain	Traoré	conseiller	seed-str-000033	\N	1	2026-03-14T17:39:17.749Z	2025-06-12T11:06:15.637Z	2026-03-27T16:50:11.224Z
seed-cons-000345	julien.vincent@ml-rouen.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Julien	Vincent	conseiller	seed-str-000033	\N	1	\N	2025-07-06T09:26:31.056Z	2026-03-27T16:50:11.224Z
seed-cons-000346	amina.michel@ml-rouen.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Amina	Michel	conseiller	seed-str-000033	\N	1	2026-03-25T07:30:30.750Z	2025-10-16T05:49:43.921Z	2026-03-27T16:50:11.224Z
seed-cons-000347	marie.mercier@ml-nancy.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marie	Mercier	admin_structure	seed-str-000034	\N	1	\N	2025-08-13T16:48:40.556Z	2026-03-27T16:50:11.224Z
seed-cons-000348	nicolas.mercier@ml-nancy.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nicolas	Mercier	conseiller	seed-str-000034	\N	1	\N	2025-06-03T23:26:46.262Z	2026-03-27T16:50:11.224Z
seed-cons-000349	anne.belkacem@ml-nancy.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Anne	Belkacem	conseiller	seed-str-000034	\N	1	2026-03-27T15:57:21.992Z	2025-04-01T17:58:39.661Z	2026-03-27T16:50:11.224Z
seed-cons-000350	fatima.garcia@ml-nancy.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	Garcia	conseiller	seed-str-000034	\N	1	\N	2025-12-24T03:57:18.898Z	2026-03-27T16:50:11.224Z
seed-cons-000351	fatima.david@ml-nancy.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	David	conseiller	seed-str-000034	\N	1	2026-03-14T07:19:20.305Z	2026-01-26T17:12:07.704Z	2026-03-27T16:50:11.224Z
seed-cons-000352	virginie.perrin@ml-nancy.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Virginie	Perrin	conseiller	seed-str-000034	\N	1	\N	2025-05-24T13:59:58.788Z	2026-03-27T16:50:11.224Z
seed-cons-000353	yannick.girard@ml-nancy.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Yannick	Girard	conseiller	seed-str-000034	\N	1	2026-03-19T09:51:17.142Z	2025-12-29T15:01:14.609Z	2026-03-27T16:50:11.224Z
seed-cons-000354	david.leroy@ml-nancy.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	David	Leroy	conseiller	seed-str-000034	\N	1	2026-03-22T13:30:23.001Z	2025-11-02T02:54:22.431Z	2026-03-27T16:50:11.224Z
seed-cons-000355	valerie.petit@ml-nancy.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Valérie	Petit	conseiller	seed-str-000034	\N	1	\N	2025-04-10T15:35:53.455Z	2026-03-27T16:50:11.224Z
seed-cons-000356	emilie.david@ml-nancy.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Émilie	David	conseiller	seed-str-000034	\N	1	2026-03-25T13:09:01.466Z	2026-01-21T09:04:29.241Z	2026-03-27T16:50:11.224Z
seed-cons-000357	david.martin@ml-argenteuil.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	David	Martin	admin_structure	seed-str-000035	\N	1	2026-03-20T14:36:41.226Z	2026-02-20T08:45:24.391Z	2026-03-27T16:50:11.224Z
seed-cons-000358	fatima.kone@ml-argenteuil.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	Kone	conseiller	seed-str-000035	\N	1	2026-03-16T04:41:34.798Z	2026-01-22T18:50:10.773Z	2026-03-27T16:50:11.224Z
seed-cons-000359	jacques.belkacem@ml-argenteuil.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jacques	Belkacem	conseiller	seed-str-000035	\N	1	\N	2025-09-05T06:04:23.632Z	2026-03-27T16:50:11.224Z
seed-cons-000360	stephane.diallo@ml-argenteuil.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Stéphane	Diallo	conseiller	seed-str-000035	\N	1	\N	2025-04-11T03:48:30.215Z	2026-03-27T16:50:11.224Z
seed-cons-000361	amina.cisse@ml-argenteuil.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Amina	Cissé	conseiller	seed-str-000035	\N	1	2026-03-23T08:12:58.931Z	2025-08-09T19:39:05.013Z	2026-03-27T16:50:11.224Z
seed-cons-000362	celine.rousseau@ml-argenteuil.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Céline	Rousseau	conseiller	seed-str-000035	\N	1	2026-03-27T06:37:10.172Z	2025-07-06T19:42:30.639Z	2026-03-27T16:50:11.224Z
seed-cons-000363	francois.andre@ml-saintdenis.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	François	André	admin_structure	seed-str-000036	\N	1	2026-03-19T01:23:05.650Z	2025-10-08T04:51:16.231Z	2026-03-27T16:50:11.224Z
seed-cons-000364	abdel.blanc@ml-saintdenis.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Abdel	Blanc	conseiller	seed-str-000036	\N	1	2026-03-25T18:16:19.020Z	2026-01-01T23:23:01.793Z	2026-03-27T16:50:11.224Z
seed-cons-000365	david.rousseau@ml-saintdenis.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	David	Rousseau	conseiller	seed-str-000036	\N	1	\N	2025-09-12T10:29:47.406Z	2026-03-27T16:50:11.224Z
seed-cons-000366	sebastien.diallo@ml-saintdenis.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sébastien	Diallo	conseiller	seed-str-000036	\N	1	\N	2025-06-05T13:33:23.732Z	2026-03-27T16:50:11.224Z
seed-cons-000367	karim.blanc@ml-saintdenis.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Karim	Blanc	conseiller	seed-str-000036	\N	1	2026-03-24T01:16:32.678Z	2026-01-24T00:22:35.361Z	2026-03-27T16:50:11.224Z
seed-cons-000368	sebastien.nicolas@ml-saintdenis.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sébastien	Nicolas	conseiller	seed-str-000036	\N	1	\N	2025-07-10T03:02:35.345Z	2026-03-27T16:50:11.224Z
seed-cons-000369	marc.morin@ml-saintdenis.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marc	Morin	conseiller	seed-str-000036	\N	1	2026-03-24T04:38:44.961Z	2025-09-07T02:16:53.509Z	2026-03-27T16:50:11.224Z
seed-cons-000370	delphine.bertrand@ml-saintdenis.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Delphine	Bertrand	conseiller	seed-str-000036	\N	1	\N	2025-04-28T22:37:35.655Z	2026-03-27T16:50:11.224Z
seed-cons-000371	jean.haddad@ml-saintdenis.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jean	Haddad	conseiller	seed-str-000036	\N	1	2026-03-25T04:11:59.720Z	2025-03-27T23:49:26.937Z	2026-03-27T16:50:11.224Z
seed-cons-000372	virginie.leroy@ml-saintdenis.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Virginie	Leroy	conseiller	seed-str-000036	\N	1	\N	2025-12-21T10:54:16.521Z	2026-03-27T16:50:11.224Z
seed-cons-000373	julien.francois@ml-montreuil.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Julien	François	admin_structure	seed-str-000037	\N	1	2026-03-27T01:10:33.593Z	2025-06-29T07:33:56.975Z	2026-03-27T16:50:11.224Z
seed-cons-000374	pierre.durand@ml-montreuil.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Pierre	Durand	conseiller	seed-str-000037	\N	1	\N	2025-07-24T04:27:50.143Z	2026-03-27T16:50:11.224Z
seed-cons-000375	jean.simon@ml-montreuil.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jean	Simon	conseiller	seed-str-000037	\N	1	\N	2025-04-20T07:31:42.287Z	2026-03-27T16:50:11.224Z
seed-cons-000376	michel.laurent@ml-montreuil.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Michel	Laurent	conseiller	seed-str-000037	\N	1	2026-03-20T03:35:16.907Z	2025-07-21T20:03:04.937Z	2026-03-27T16:50:11.224Z
seed-cons-000377	valerie.simon@ml-montreuil.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Valérie	Simon	conseiller	seed-str-000037	\N	1	2026-03-27T02:24:08.842Z	2025-12-09T09:48:12.384Z	2026-03-27T16:50:11.224Z
seed-cons-000378	jacques.diallo@ml-tourcoing.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jacques	Diallo	admin_structure	seed-str-000038	\N	1	\N	2025-10-26T08:37:00.804Z	2026-03-27T16:50:11.224Z
seed-cons-000379	sylvie.robin@ml-tourcoing.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sylvie	Robin	conseiller	seed-str-000038	\N	1	2026-03-15T09:39:13.821Z	2026-01-17T14:06:21.097Z	2026-03-27T16:50:11.224Z
seed-cons-000380	catherine.diallo@ml-tourcoing.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Catherine	Diallo	conseiller	seed-str-000038	\N	1	2026-03-24T19:39:38.393Z	2025-06-12T04:55:38.029Z	2026-03-27T16:50:11.224Z
seed-cons-000381	aurelie.guerin@ml-tourcoing.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Aurélie	Guérin	conseiller	seed-str-000038	\N	1	2026-03-27T08:09:20.937Z	2026-01-07T00:03:04.076Z	2026-03-27T16:50:11.224Z
seed-cons-000382	abdel.cisse@ml-tourcoing.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Abdel	Cissé	conseiller	seed-str-000038	\N	1	2026-03-15T10:46:34.035Z	2025-11-19T22:30:56.296Z	2026-03-27T16:50:11.224Z
seed-cons-000383	anne.diallo@ml-tourcoing.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Anne	Diallo	conseiller	seed-str-000038	\N	1	2026-03-24T15:17:48.106Z	2026-01-28T13:18:37.590Z	2026-03-27T16:50:11.224Z
seed-cons-000384	julien.leroy@ml-tourcoing.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Julien	Leroy	conseiller	seed-str-000038	\N	1	2026-03-15T00:19:28.132Z	2026-02-25T04:57:20.024Z	2026-03-27T16:50:11.224Z
seed-cons-000385	caroline.legrand@ml-tourcoing.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Caroline	Legrand	conseiller	seed-str-000038	\N	1	\N	2025-11-07T06:39:11.624Z	2026-03-27T16:50:11.224Z
seed-cons-000386	christophe.gauthier@ml-tourcoing.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christophe	Gauthier	conseiller	seed-str-000038	\N	1	\N	2025-06-26T23:04:42.026Z	2026-03-27T16:50:11.224Z
seed-cons-000387	julien.diallo@ml-tourcoing.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Julien	Diallo	conseiller	seed-str-000038	\N	1	2026-03-24T08:27:39.067Z	2025-09-27T05:36:37.896Z	2026-03-27T16:50:11.224Z
seed-cons-000388	claire.girard@ml-avignon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Claire	Girard	admin_structure	seed-str-000039	\N	1	2026-03-16T04:15:00.913Z	2025-04-04T21:41:57.179Z	2026-03-27T16:50:11.224Z
seed-cons-000389	fatima.cisse@ml-avignon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	Cissé	conseiller	seed-str-000039	\N	1	2026-03-19T08:13:33.993Z	2025-12-16T22:54:44.626Z	2026-03-27T16:50:11.224Z
seed-cons-000390	nathalie.lefebvre@ml-avignon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nathalie	Lefebvre	conseiller	seed-str-000039	\N	1	\N	2025-05-24T01:28:23.448Z	2026-03-27T16:50:11.224Z
seed-cons-000391	michel.haddad@ml-avignon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Michel	Haddad	conseiller	seed-str-000039	\N	1	2026-03-27T10:56:58.302Z	2025-10-07T12:31:25.152Z	2026-03-27T16:50:11.224Z
seed-cons-000392	alain.martin@ml-avignon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Alain	Martin	conseiller	seed-str-000039	\N	1	\N	2025-07-19T00:41:31.174Z	2026-03-27T16:50:11.224Z
seed-cons-000393	michel.nguyen@ml-avignon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Michel	Nguyen	conseiller	seed-str-000039	\N	1	2026-03-26T18:06:47.564Z	2025-12-01T08:02:19.236Z	2026-03-27T16:50:11.224Z
seed-cons-000394	anne.chevalier@ml-avignon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Anne	Chevalier	conseiller	seed-str-000039	\N	1	2026-03-20T21:37:51.080Z	2025-05-21T12:29:03.669Z	2026-03-27T16:50:11.224Z
seed-cons-000395	julien.moreau@ml-avignon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Julien	Moreau	conseiller	seed-str-000039	\N	1	2026-03-26T07:19:34.356Z	2025-11-23T16:18:57.620Z	2026-03-27T16:50:11.224Z
seed-cons-000396	stephane.bamba@ml-dunkerque.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Stéphane	Bamba	admin_structure	seed-str-000040	\N	1	\N	2025-07-05T18:04:10.874Z	2026-03-27T16:50:11.224Z
seed-cons-000397	marc.henry@ml-dunkerque.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marc	Henry	conseiller	seed-str-000040	\N	1	2026-03-26T12:16:28.362Z	2025-04-13T08:12:44.363Z	2026-03-27T16:50:11.224Z
seed-cons-000398	isabelle.andre@ml-dunkerque.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Isabelle	André	conseiller	seed-str-000040	\N	1	\N	2025-08-26T00:22:22.447Z	2026-03-27T16:50:11.224Z
seed-cons-000399	nicolas.haddad@ml-dunkerque.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nicolas	Haddad	conseiller	seed-str-000040	\N	1	2026-03-19T11:41:19.098Z	2025-05-05T15:16:10.690Z	2026-03-27T16:50:11.224Z
seed-cons-000400	francois.nicolas@ml-dunkerque.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	François	Nicolas	conseiller	seed-str-000040	\N	1	\N	2025-04-24T22:10:41.769Z	2026-03-27T16:50:11.224Z
seed-cons-000401	laure.perrin@ml-dunkerque.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Laure	Perrin	conseiller	seed-str-000040	\N	1	2026-03-19T06:57:57.821Z	2026-02-20T23:04:25.750Z	2026-03-27T16:50:11.224Z
seed-cons-000402	karim.garcia@ml-dunkerque.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Karim	Garcia	conseiller	seed-str-000040	\N	1	2026-03-20T09:03:35.865Z	2026-01-28T04:31:22.877Z	2026-03-27T16:50:11.224Z
seed-cons-000403	catherine.petit@ml-dunkerque.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Catherine	Petit	conseiller	seed-str-000040	\N	1	2026-03-26T15:30:01.574Z	2025-12-16T01:29:49.717Z	2026-03-27T16:50:11.224Z
seed-cons-000404	claire.vincent@ml-dunkerque.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Claire	Vincent	conseiller	seed-str-000040	\N	1	2026-03-18T08:28:08.478Z	2026-01-20T04:19:18.310Z	2026-03-27T16:50:11.224Z
seed-cons-000405	marc.nicolas@ml-dunkerque.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marc	Nicolas	conseiller	seed-str-000040	\N	1	\N	2025-04-28T11:29:38.727Z	2026-03-27T16:50:11.224Z
seed-cons-000406	isabelle.garnier@cio-poitiers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Isabelle	Garnier	admin_structure	seed-str-000041	\N	1	2026-03-25T12:19:47.034Z	2025-04-09T23:01:39.183Z	2026-03-27T16:50:11.224Z
seed-cons-000407	catherine.david@cio-poitiers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Catherine	David	conseiller	seed-str-000041	\N	1	\N	2025-10-17T04:45:01.756Z	2026-03-27T16:50:11.224Z
seed-cons-000408	nathalie.diallo@cio-poitiers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nathalie	Diallo	conseiller	seed-str-000041	\N	1	\N	2025-07-01T07:53:22.916Z	2026-03-27T16:50:11.224Z
seed-cons-000409	thomas.morin@cio-poitiers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Thomas	Morin	conseiller	seed-str-000041	\N	1	\N	2025-05-19T07:10:28.829Z	2026-03-27T16:50:11.224Z
seed-cons-000410	marie.petit@cio-poitiers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marie	Petit	conseiller	seed-str-000041	\N	1	2026-03-17T11:53:50.573Z	2026-02-14T16:52:50.109Z	2026-03-27T16:50:11.224Z
seed-cons-000411	yannick.martin@cio-poitiers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Yannick	Martin	conseiller	seed-str-000041	\N	1	\N	2025-07-27T06:22:25.912Z	2026-03-27T16:50:11.224Z
seed-cons-000412	stephane.richard@cio-poitiers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Stéphane	Richard	conseiller	seed-str-000041	\N	1	\N	2025-06-24T17:50:59.366Z	2026-03-27T16:50:11.224Z
seed-cons-000413	amina.kone@cio-poitiers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Amina	Kone	conseiller	seed-str-000041	\N	1	\N	2025-11-19T09:26:47.189Z	2026-03-27T16:50:11.224Z
seed-cons-000414	karim.diallo@cio-poitiers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Karim	Diallo	conseiller	seed-str-000041	\N	1	\N	2025-10-19T22:24:35.260Z	2026-03-27T16:50:11.224Z
seed-cons-000415	fatima.francois@cio-poitiers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	François	conseiller	seed-str-000041	\N	1	\N	2025-06-01T01:49:56.366Z	2026-03-27T16:50:11.224Z
seed-cons-000416	nathalie.haddad@cio-pau.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nathalie	Haddad	admin_structure	seed-str-000042	\N	1	\N	2026-02-16T12:30:46.036Z	2026-03-27T16:50:11.224Z
seed-cons-000417	christine.garnier@cio-pau.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christine	Garnier	conseiller	seed-str-000042	\N	1	2026-03-27T04:42:31.846Z	2025-04-28T12:04:44.624Z	2026-03-27T16:50:11.224Z
seed-cons-000418	pierre.richard@cio-pau.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Pierre	Richard	conseiller	seed-str-000042	\N	1	2026-03-16T23:21:45.380Z	2026-01-23T12:00:03.399Z	2026-03-27T16:50:11.224Z
seed-cons-000419	catherine.legrand@cio-pau.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Catherine	Legrand	conseiller	seed-str-000042	\N	1	\N	2025-09-07T06:10:43.626Z	2026-03-27T16:50:11.224Z
seed-cons-000420	anne.perrin@cio-pau.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Anne	Perrin	conseiller	seed-str-000042	\N	1	2026-03-17T23:24:08.464Z	2025-12-18T04:03:54.231Z	2026-03-27T16:50:11.224Z
seed-cons-000421	caroline.chevalier@cio-pau.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Caroline	Chevalier	conseiller	seed-str-000042	\N	1	\N	2026-02-06T08:15:37.210Z	2026-03-27T16:50:11.224Z
seed-cons-000422	jacques.traore@cio-pau.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jacques	Traoré	conseiller	seed-str-000042	\N	1	2026-03-24T13:00:42.929Z	2025-11-05T08:39:56.481Z	2026-03-27T16:50:11.224Z
seed-cons-000423	delphine.cisse@cio-pau.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Delphine	Cissé	conseiller	seed-str-000042	\N	1	\N	2026-02-06T16:25:10.647Z	2026-03-27T16:50:11.224Z
seed-cons-000424	alain.bouvier@cio-pau.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Alain	Bouvier	conseiller	seed-str-000042	\N	1	2026-03-18T10:55:48.978Z	2025-07-04T02:56:09.906Z	2026-03-27T16:50:11.224Z
seed-cons-000425	sandrine.girard@cio-pau.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sandrine	Girard	conseiller	seed-str-000042	\N	1	2026-03-24T01:39:30.472Z	2026-02-23T00:18:29.075Z	2026-03-27T16:50:11.224Z
seed-cons-000426	christophe.gauthier@cio-calais.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christophe	Gauthier	admin_structure	seed-str-000043	\N	1	2026-03-20T09:00:20.195Z	2025-06-28T20:46:33.589Z	2026-03-27T16:50:11.224Z
seed-cons-000427	claire.bernard@cio-calais.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Claire	Bernard	conseiller	seed-str-000043	\N	1	2026-03-24T18:40:06.721Z	2025-05-16T18:51:07.857Z	2026-03-27T16:50:11.224Z
seed-cons-000428	nicolas.michel@cio-calais.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nicolas	Michel	conseiller	seed-str-000043	\N	1	2026-03-21T17:25:08.103Z	2025-12-08T08:03:22.841Z	2026-03-27T16:50:11.224Z
seed-cons-000429	yannick.richard@cio-calais.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Yannick	Richard	conseiller	seed-str-000043	\N	1	2026-03-21T03:39:52.596Z	2025-09-14T15:11:12.651Z	2026-03-27T16:50:11.224Z
seed-cons-000430	jacques.perrin@cio-calais.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jacques	Perrin	conseiller	seed-str-000043	\N	1	2026-03-21T05:09:27.299Z	2025-07-03T06:02:19.381Z	2026-03-27T16:50:11.224Z
seed-cons-000431	aurelie.henry@cio-calais.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Aurélie	Henry	conseiller	seed-str-000043	\N	1	2026-03-15T15:16:14.090Z	2026-02-24T21:16:49.508Z	2026-03-27T16:50:11.224Z
seed-cons-000432	nicolas.rousseau@cio-calais.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nicolas	Rousseau	conseiller	seed-str-000043	\N	1	\N	2025-09-03T11:15:14.878Z	2026-03-27T16:50:11.224Z
seed-cons-000433	fatima.richard@cio-calais.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	Richard	conseiller	seed-str-000043	\N	1	2026-03-27T04:02:20.238Z	2025-12-06T14:00:47.912Z	2026-03-27T16:50:11.224Z
seed-cons-000434	laure.rousseau@cio-calais.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Laure	Rousseau	conseiller	seed-str-000043	\N	1	2026-03-27T16:17:02.315Z	2025-12-06T15:03:56.633Z	2026-03-27T16:50:11.224Z
seed-cons-000435	valerie.dubois@cio-larochelle.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Valérie	Dubois	admin_structure	seed-str-000044	\N	1	2026-03-19T11:08:45.961Z	2025-11-21T03:12:43.632Z	2026-03-27T16:50:11.224Z
seed-cons-000436	aurelie.dubois@cio-larochelle.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Aurélie	Dubois	conseiller	seed-str-000044	\N	1	2026-03-24T04:36:36.206Z	2025-07-24T21:03:59.731Z	2026-03-27T16:50:11.224Z
seed-cons-000437	francois.haddad@cio-larochelle.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	François	Haddad	conseiller	seed-str-000044	\N	1	\N	2025-10-18T17:24:18.028Z	2026-03-27T16:50:11.224Z
seed-cons-000438	michel.legrand@cio-larochelle.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Michel	Legrand	conseiller	seed-str-000044	\N	1	2026-03-22T21:53:51.678Z	2025-08-15T06:15:21.437Z	2026-03-27T16:50:11.224Z
seed-cons-000439	philippe.chevalier@cio-larochelle.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Philippe	Chevalier	conseiller	seed-str-000044	\N	1	\N	2025-09-20T22:09:01.153Z	2026-03-27T16:50:11.224Z
seed-cons-000440	marie.robin@cio-larochelle.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marie	Robin	conseiller	seed-str-000044	\N	1	\N	2025-08-10T05:21:45.049Z	2026-03-27T16:50:11.224Z
seed-cons-000441	emilie.bertrand@cio-larochelle.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Émilie	Bertrand	conseiller	seed-str-000044	\N	1	\N	2025-11-10T11:18:22.991Z	2026-03-27T16:50:11.224Z
seed-cons-000442	david.david@cio-larochelle.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	David	David	conseiller	seed-str-000044	\N	1	\N	2025-05-20T19:10:16.890Z	2026-03-27T16:50:11.224Z
seed-cons-000443	michel.leroy@cio-larochelle.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Michel	Leroy	conseiller	seed-str-000044	\N	1	\N	2025-05-02T11:45:08.311Z	2026-03-27T16:50:11.224Z
seed-cons-000444	isabelle.haddad@cio-colmar.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Isabelle	Haddad	admin_structure	seed-str-000045	\N	1	2026-03-20T02:39:08.161Z	2025-04-28T16:18:11.660Z	2026-03-27T16:50:11.224Z
seed-cons-000445	christophe.bernard@cio-colmar.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christophe	Bernard	conseiller	seed-str-000045	\N	1	2026-03-14T07:49:09.416Z	2025-03-27T23:07:31.732Z	2026-03-27T16:50:11.224Z
seed-cons-000446	laure.traore@cio-colmar.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Laure	Traoré	conseiller	seed-str-000045	\N	1	2026-03-15T23:47:16.839Z	2026-02-21T00:06:46.384Z	2026-03-27T16:50:11.224Z
seed-cons-000447	julien.belkacem@cio-colmar.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Julien	Belkacem	conseiller	seed-str-000045	\N	1	2026-03-18T15:36:44.654Z	2025-09-08T16:45:22.048Z	2026-03-27T16:50:11.224Z
seed-cons-000448	patrick.benali@cio-colmar.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Patrick	Benali	conseiller	seed-str-000045	\N	1	\N	2025-12-22T17:23:34.476Z	2026-03-27T16:50:11.224Z
seed-cons-000449	sophie.robert@cio-colmar.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sophie	Robert	conseiller	seed-str-000045	\N	1	2026-03-17T00:53:08.871Z	2025-07-19T19:40:48.259Z	2026-03-27T16:50:11.224Z
seed-cons-000450	celine.robert@cio-colmar.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Céline	Robert	conseiller	seed-str-000045	\N	1	2026-03-26T08:11:42.764Z	2025-04-17T20:27:10.102Z	2026-03-27T16:50:11.224Z
seed-cons-000451	caroline.petit@cio-ajaccio.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Caroline	Petit	admin_structure	seed-str-000046	\N	1	2026-03-16T04:29:45.635Z	2025-11-15T15:11:55.381Z	2026-03-27T16:50:11.224Z
seed-cons-000452	sophie.henry@cio-ajaccio.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sophie	Henry	conseiller	seed-str-000046	\N	1	2026-03-21T22:02:02.717Z	2025-04-29T13:51:27.736Z	2026-03-27T16:50:11.224Z
seed-cons-000453	christophe.morel@cio-ajaccio.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christophe	Morel	conseiller	seed-str-000046	\N	1	2026-03-21T16:50:04.404Z	2025-12-19T11:13:59.744Z	2026-03-27T16:50:11.224Z
seed-cons-000454	caroline.thomas@cio-ajaccio.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Caroline	Thomas	conseiller	seed-str-000046	\N	1	\N	2025-08-03T08:34:34.405Z	2026-03-27T16:50:11.224Z
seed-cons-000455	francois.michel@cio-ajaccio.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	François	Michel	conseiller	seed-str-000046	\N	1	2026-03-17T22:05:20.457Z	2025-11-08T07:32:24.403Z	2026-03-27T16:50:11.224Z
seed-cons-000456	karim.mercier@cio-ajaccio.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Karim	Mercier	conseiller	seed-str-000046	\N	1	\N	2025-07-12T18:57:52.614Z	2026-03-27T16:50:11.224Z
seed-cons-000457	patrick.robin@cio-bastia.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Patrick	Robin	admin_structure	seed-str-000047	\N	1	\N	2025-10-07T11:38:19.049Z	2026-03-27T16:50:11.224Z
seed-cons-000458	aurelie.benali@cio-bastia.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Aurélie	Benali	conseiller	seed-str-000047	\N	1	2026-03-18T19:00:53.454Z	2025-05-01T13:59:29.305Z	2026-03-27T16:50:11.224Z
seed-cons-000459	isabelle.richard@cio-bastia.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Isabelle	Richard	conseiller	seed-str-000047	\N	1	\N	2025-06-21T16:34:13.307Z	2026-03-27T16:50:11.224Z
seed-cons-000460	anne.perrin@cio-bastia.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Anne	Perrin	conseiller	seed-str-000047	\N	1	2026-03-17T06:35:21.639Z	2025-11-13T16:58:07.974Z	2026-03-27T16:50:11.224Z
seed-cons-000461	fabien.traore@cio-bastia.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fabien	Traoré	conseiller	seed-str-000047	\N	1	2026-03-25T03:51:27.133Z	2026-02-04T21:29:13.152Z	2026-03-27T16:50:11.224Z
seed-cons-000462	alain.perrin@cio-bastia.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Alain	Perrin	conseiller	seed-str-000047	\N	1	\N	2025-12-18T06:28:35.126Z	2026-03-27T16:50:11.224Z
seed-cons-000463	isabelle.fournier@cio-bastia.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Isabelle	Fournier	conseiller	seed-str-000047	\N	1	\N	2025-05-15T13:30:27.982Z	2026-03-27T16:50:11.224Z
seed-cons-000464	laure.henry@cio-bastia.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Laure	Henry	conseiller	seed-str-000047	\N	1	2026-03-25T14:02:31.006Z	2025-03-27T04:45:44.979Z	2026-03-27T16:50:11.224Z
seed-cons-000465	laure.thomas@cio-bastia.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Laure	Thomas	conseiller	seed-str-000047	\N	1	2026-03-20T07:57:42.146Z	2025-12-21T08:11:08.468Z	2026-03-27T16:50:11.224Z
seed-cons-000466	sylvie.blanc@cio-bziers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sylvie	Blanc	admin_structure	seed-str-000048	\N	1	2026-03-13T20:46:54.473Z	2025-09-05T00:47:15.357Z	2026-03-27T16:50:11.224Z
seed-cons-000467	nathalie.robin@cio-bziers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nathalie	Robin	conseiller	seed-str-000048	\N	1	\N	2025-05-24T21:47:19.700Z	2026-03-27T16:50:11.224Z
seed-cons-000468	nicolas.francois@cio-bziers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nicolas	François	conseiller	seed-str-000048	\N	1	2026-03-15T07:22:51.736Z	2025-08-14T11:17:05.528Z	2026-03-27T16:50:11.224Z
seed-cons-000469	virginie.legrand@cio-bziers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Virginie	Legrand	conseiller	seed-str-000048	\N	1	2026-03-15T12:18:59.805Z	2025-05-10T14:09:33.445Z	2026-03-27T16:50:11.224Z
seed-cons-000470	patrick.roux@cio-bziers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Patrick	Roux	conseiller	seed-str-000048	\N	1	2026-03-19T19:38:44.120Z	2025-11-29T05:46:27.743Z	2026-03-27T16:50:11.224Z
seed-cons-000471	fatima.morin@cio-bziers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	Morin	conseiller	seed-str-000048	\N	1	\N	2025-06-25T18:17:27.261Z	2026-03-27T16:50:11.224Z
seed-cons-000472	caroline.girard@cio-bziers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Caroline	Girard	conseiller	seed-str-000048	\N	1	\N	2026-02-08T04:24:50.530Z	2026-03-27T16:50:11.224Z
seed-cons-000473	anne.garnier@cio-bziers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Anne	Garnier	conseiller	seed-str-000048	\N	1	2026-03-14T22:07:05.586Z	2025-05-03T18:49:08.153Z	2026-03-27T16:50:11.224Z
seed-cons-000474	caroline.david@cio-bziers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Caroline	David	conseiller	seed-str-000048	\N	1	\N	2025-12-17T05:25:35.062Z	2026-03-27T16:50:11.224Z
seed-cons-000475	sandrine.dubois@cio-bziers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sandrine	Dubois	conseiller	seed-str-000048	\N	1	2026-03-19T22:50:05.358Z	2025-10-10T05:33:56.292Z	2026-03-27T16:50:11.224Z
seed-cons-000476	patrick.traore@cio-bourges.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Patrick	Traoré	admin_structure	seed-str-000049	\N	1	2026-03-16T06:52:33.558Z	2025-06-22T21:39:26.409Z	2026-03-27T16:50:11.224Z
seed-cons-000477	catherine.blanc@cio-bourges.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Catherine	Blanc	conseiller	seed-str-000049	\N	1	2026-03-15T20:19:33.351Z	2025-04-01T02:05:34.026Z	2026-03-27T16:50:11.224Z
seed-cons-000478	christine.moreau@cio-bourges.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christine	Moreau	conseiller	seed-str-000049	\N	1	\N	2025-05-18T05:38:22.225Z	2026-03-27T16:50:11.224Z
seed-cons-000479	fabien.richard@cio-bourges.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fabien	Richard	conseiller	seed-str-000049	\N	1	2026-03-15T09:39:16.310Z	2025-07-27T14:32:28.098Z	2026-03-27T16:50:11.224Z
seed-cons-000480	virginie.martin@cio-bourges.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Virginie	Martin	conseiller	seed-str-000049	\N	1	\N	2025-05-25T16:11:43.173Z	2026-03-27T16:50:11.224Z
seed-cons-000481	abdel.benali@cio-bourges.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Abdel	Benali	conseiller	seed-str-000049	\N	1	\N	2025-05-13T11:53:49.950Z	2026-03-27T16:50:11.224Z
seed-cons-000482	patrick.morin@cio-bourges.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Patrick	Morin	conseiller	seed-str-000049	\N	1	\N	2025-07-08T17:01:04.534Z	2026-03-27T16:50:11.224Z
seed-cons-000483	abdel.traore@cio-bourges.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Abdel	Traoré	conseiller	seed-str-000049	\N	1	2026-03-17T10:39:31.331Z	2026-01-05T10:29:57.450Z	2026-03-27T16:50:11.224Z
seed-cons-000484	christine.gauthier@cio-chambry.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christine	Gauthier	admin_structure	seed-str-000050	\N	1	\N	2025-07-07T03:25:25.543Z	2026-03-27T16:50:11.224Z
seed-cons-000485	marie.francois@cio-chambry.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marie	François	conseiller	seed-str-000050	\N	1	2026-03-23T22:32:39.837Z	2025-06-16T06:57:40.079Z	2026-03-27T16:50:11.224Z
seed-cons-000486	stephane.henry@cio-chambry.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Stéphane	Henry	conseiller	seed-str-000050	\N	1	\N	2025-11-18T14:36:42.989Z	2026-03-27T16:50:11.224Z
seed-cons-000487	emilie.dubois@cio-chambry.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Émilie	Dubois	conseiller	seed-str-000050	\N	1	2026-03-21T19:02:32.545Z	2025-08-05T12:05:38.864Z	2026-03-27T16:50:11.224Z
seed-cons-000488	fabien.lefebvre@cio-chambry.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fabien	Lefebvre	conseiller	seed-str-000050	\N	1	\N	2025-05-15T05:52:38.173Z	2026-03-27T16:50:11.224Z
seed-cons-000489	marie.kone@cio-chambry.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marie	Kone	conseiller	seed-str-000050	\N	1	\N	2025-11-12T19:48:03.089Z	2026-03-27T16:50:11.224Z
seed-cons-000490	abdel.kone@cio-chambry.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Abdel	Kone	conseiller	seed-str-000050	\N	1	\N	2025-12-22T16:13:00.182Z	2026-03-27T16:50:11.224Z
seed-cons-000491	jacques.robert@cio-chambry.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jacques	Robert	conseiller	seed-str-000050	\N	1	2026-03-15T12:39:33.817Z	2026-01-14T09:15:23.385Z	2026-03-27T16:50:11.224Z
seed-cons-000492	jean.blanc@cio-chambry.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jean	Blanc	super_admin	seed-str-000050	\N	1	\N	2025-09-01T09:37:52.145Z	2026-03-27T16:50:11.224Z
seed-cons-000493	laure.mercier@cio-chartres.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Laure	Mercier	admin_structure	seed-str-000051	\N	1	2026-03-17T23:33:24.152Z	2026-02-19T17:37:03.001Z	2026-03-27T16:50:11.224Z
seed-cons-000494	alain.mathieu@cio-chartres.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Alain	Mathieu	conseiller	seed-str-000051	\N	1	2026-03-14T14:12:37.562Z	2025-05-03T04:32:02.237Z	2026-03-27T16:50:11.224Z
seed-cons-000495	sebastien.richard@cio-chartres.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sébastien	Richard	conseiller	seed-str-000051	\N	1	\N	2025-10-01T13:29:52.617Z	2026-03-27T16:50:11.224Z
seed-cons-000496	aurelie.richard@cio-chartres.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Aurélie	Richard	conseiller	seed-str-000051	\N	1	\N	2026-01-19T13:06:29.709Z	2026-03-27T16:50:11.224Z
seed-cons-000497	marc.bouvier@cio-chartres.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marc	Bouvier	conseiller	seed-str-000051	\N	1	2026-03-17T07:03:19.549Z	2025-08-15T03:11:35.650Z	2026-03-27T16:50:11.224Z
seed-cons-000498	anne.dubois@cio-cherbourg.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Anne	Dubois	admin_structure	seed-str-000052	\N	1	2026-03-16T18:20:33.887Z	2025-12-05T16:57:23.730Z	2026-03-27T16:50:11.224Z
seed-cons-000499	laure.guerin@cio-cherbourg.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Laure	Guérin	super_admin	seed-str-000052	\N	1	2026-03-25T21:00:57.822Z	2025-10-20T22:52:51.097Z	2026-03-27T16:50:11.224Z
seed-cons-000500	david.nguyen@cio-cherbourg.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	David	Nguyen	conseiller	seed-str-000052	\N	1	\N	2025-05-31T06:23:00.065Z	2026-03-27T16:50:11.224Z
seed-cons-000501	abdel.bouvier@cio-cherbourg.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Abdel	Bouvier	conseiller	seed-str-000052	\N	1	\N	2025-07-25T06:50:55.607Z	2026-03-27T16:50:11.224Z
seed-cons-000502	pierre.blanc@cio-cherbourg.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Pierre	Blanc	conseiller	seed-str-000052	\N	1	\N	2025-05-09T11:20:25.224Z	2026-03-27T16:50:11.224Z
seed-cons-000503	david.blanc@cio-cherbourg.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	David	Blanc	conseiller	seed-str-000052	\N	1	2026-03-20T23:41:41.524Z	2025-04-26T04:45:39.804Z	2026-03-27T16:50:11.224Z
seed-cons-000504	anne.durand@cio-cholet.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Anne	Durand	admin_structure	seed-str-000053	\N	1	2026-03-16T04:01:30.677Z	2025-04-12T12:02:14.558Z	2026-03-27T16:50:11.224Z
seed-cons-000505	marc.nicolas@cio-cholet.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marc	Nicolas	conseiller	seed-str-000053	\N	1	\N	2025-06-11T06:15:18.589Z	2026-03-27T16:50:11.224Z
seed-cons-000506	thomas.vincent@cio-cholet.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Thomas	Vincent	conseiller	seed-str-000053	\N	1	2026-03-27T03:00:43.493Z	2025-08-26T15:29:12.511Z	2026-03-27T16:50:11.224Z
seed-cons-000507	aurelie.rousseau@cio-cholet.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Aurélie	Rousseau	conseiller	seed-str-000053	\N	1	\N	2025-06-20T04:35:42.485Z	2026-03-27T16:50:11.224Z
seed-cons-000508	michel.chevalier@cio-cholet.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Michel	Chevalier	conseiller	seed-str-000053	\N	1	\N	2025-06-23T09:53:57.983Z	2026-03-27T16:50:11.224Z
seed-cons-000509	christophe.rousseau@cio-cholet.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christophe	Rousseau	conseiller	seed-str-000053	\N	1	2026-03-17T09:25:57.050Z	2025-12-30T19:20:19.671Z	2026-03-27T16:50:11.224Z
seed-cons-000510	isabelle.rousseau@cio-pinal.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Isabelle	Rousseau	admin_structure	seed-str-000054	\N	1	\N	2025-08-23T01:31:20.670Z	2026-03-27T16:50:11.224Z
seed-cons-000511	michel.richard@cio-pinal.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Michel	Richard	conseiller	seed-str-000054	\N	1	2026-03-25T22:33:17.734Z	2025-12-11T05:41:11.762Z	2026-03-27T16:50:11.224Z
seed-cons-000512	nicolas.andre@cio-pinal.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nicolas	André	super_admin	seed-str-000054	\N	1	2026-03-13T21:41:55.551Z	2025-08-30T08:48:13.311Z	2026-03-27T16:50:11.224Z
seed-cons-000513	nathalie.andre@cio-pinal.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nathalie	André	conseiller	seed-str-000054	\N	1	\N	2025-07-27T02:59:57.309Z	2026-03-27T16:50:11.224Z
seed-cons-000514	sylvie.mercier@cio-pinal.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sylvie	Mercier	conseiller	seed-str-000054	\N	1	2026-03-19T19:33:47.729Z	2026-02-07T21:28:41.995Z	2026-03-27T16:50:11.224Z
seed-cons-000515	christophe.francois@cio-pinal.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christophe	François	conseiller	seed-str-000054	\N	1	2026-03-22T15:02:32.944Z	2025-10-11T02:34:06.954Z	2026-03-27T16:50:11.224Z
seed-cons-000516	karim.bouvier@cio-pinal.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Karim	Bouvier	conseiller	seed-str-000054	\N	1	2026-03-13T19:03:54.781Z	2025-10-23T06:08:09.872Z	2026-03-27T16:50:11.224Z
seed-cons-000517	isabelle.diallo@cio-vreux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Isabelle	Diallo	admin_structure	seed-str-000055	\N	1	2026-03-21T13:15:08.465Z	2025-06-10T17:35:07.877Z	2026-03-27T16:50:11.224Z
seed-cons-000518	david.robin@cio-vreux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	David	Robin	conseiller	seed-str-000055	\N	1	\N	2026-01-04T03:30:57.801Z	2026-03-27T16:50:11.224Z
seed-cons-000519	delphine.bouvier@cio-vreux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Delphine	Bouvier	conseiller	seed-str-000055	\N	1	\N	2026-02-21T19:25:25.095Z	2026-03-27T16:50:11.224Z
seed-cons-000520	david.guerin@cio-vreux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	David	Guérin	conseiller	seed-str-000055	\N	1	2026-03-20T11:55:22.468Z	2025-11-14T07:10:01.525Z	2026-03-27T16:50:11.224Z
seed-cons-000521	claire.moreau@cio-vreux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Claire	Moreau	conseiller	seed-str-000055	\N	1	2026-03-21T08:35:32.292Z	2025-12-22T21:26:32.148Z	2026-03-27T16:50:11.224Z
seed-cons-000522	emilie.simon@cio-vreux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Émilie	Simon	conseiller	seed-str-000055	\N	1	2026-03-17T03:30:12.799Z	2025-07-27T05:40:58.655Z	2026-03-27T16:50:11.224Z
seed-cons-000523	michel.garcia@cio-gap.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Michel	Garcia	admin_structure	seed-str-000056	\N	1	\N	2025-07-28T05:46:05.516Z	2026-03-27T16:50:11.224Z
seed-cons-000524	nicolas.robin@cio-gap.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nicolas	Robin	conseiller	seed-str-000056	\N	1	2026-03-17T07:58:18.181Z	2025-07-05T03:17:58.044Z	2026-03-27T16:50:11.224Z
seed-cons-000525	fatima.nguyen@cio-gap.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	Nguyen	conseiller	seed-str-000056	\N	1	2026-03-18T11:50:26.552Z	2026-02-10T10:55:56.261Z	2026-03-27T16:50:11.224Z
seed-cons-000526	caroline.thomas@cio-gap.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Caroline	Thomas	conseiller	seed-str-000056	\N	1	2026-03-12T20:55:36.529Z	2026-01-19T07:43:40.150Z	2026-03-27T16:50:11.224Z
seed-cons-000527	yannick.laurent@cio-gap.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Yannick	Laurent	conseiller	seed-str-000056	\N	1	2026-03-20T15:52:54.664Z	2025-09-20T19:56:43.679Z	2026-03-27T16:50:11.224Z
seed-cons-000528	marie.andre@cio-gap.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marie	André	conseiller	seed-str-000056	\N	1	2026-03-19T20:18:22.771Z	2026-01-22T18:48:03.233Z	2026-03-27T16:50:11.224Z
seed-cons-000529	yannick.laurent@cio-laval.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Yannick	Laurent	admin_structure	seed-str-000057	\N	1	\N	2025-04-24T17:20:41.846Z	2026-03-27T16:50:11.224Z
seed-cons-000530	aurelie.chevalier@cio-laval.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Aurélie	Chevalier	conseiller	seed-str-000057	\N	1	2026-03-26T07:51:50.163Z	2025-05-25T05:11:39.513Z	2026-03-27T16:50:11.224Z
seed-cons-000531	jean.mathieu@cio-laval.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jean	Mathieu	conseiller	seed-str-000057	\N	1	2026-03-16T23:01:42.418Z	2025-05-12T21:22:44.931Z	2026-03-27T16:50:11.224Z
seed-cons-000532	amina.lefebvre@cio-laval.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Amina	Lefebvre	conseiller	seed-str-000057	\N	1	2026-03-16T19:04:03.594Z	2025-06-30T19:38:07.965Z	2026-03-27T16:50:11.224Z
seed-cons-000533	fabien.diallo@cio-laval.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fabien	Diallo	conseiller	seed-str-000057	\N	1	2026-03-21T01:05:55.220Z	2025-06-02T01:44:03.348Z	2026-03-27T16:50:11.224Z
seed-cons-000534	emilie.boyer@cio-lemans.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Émilie	Boyer	admin_structure	seed-str-000058	\N	1	2026-03-19T06:36:28.359Z	2026-01-13T16:29:14.316Z	2026-03-27T16:50:11.224Z
seed-cons-000535	michel.robin@cio-lemans.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Michel	Robin	conseiller	seed-str-000058	\N	1	2026-03-20T03:26:15.643Z	2025-06-20T04:37:08.784Z	2026-03-27T16:50:11.224Z
seed-cons-000536	valerie.cisse@cio-lemans.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Valérie	Cissé	conseiller	seed-str-000058	\N	1	2026-03-22T20:30:57.151Z	2026-01-13T07:30:22.940Z	2026-03-27T16:50:11.224Z
seed-cons-000537	sylvie.moreau@cio-lemans.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sylvie	Moreau	super_admin	seed-str-000058	\N	1	\N	2025-04-22T15:38:55.147Z	2026-03-27T16:50:11.224Z
seed-cons-000538	stephane.fournier@cio-lemans.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Stéphane	Fournier	conseiller	seed-str-000058	\N	1	\N	2025-06-30T15:08:05.608Z	2026-03-27T16:50:11.224Z
seed-cons-000539	alain.mathieu@cio-lemans.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Alain	Mathieu	conseiller	seed-str-000058	\N	1	\N	2025-03-30T20:13:20.796Z	2026-03-27T16:50:11.224Z
seed-cons-000540	alain.diallo@cio-lemans.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Alain	Diallo	conseiller	seed-str-000058	\N	1	2026-03-24T22:55:15.314Z	2026-02-20T02:31:42.665Z	2026-03-27T16:50:11.224Z
seed-cons-000541	sandrine.moreau@cio-lemans.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sandrine	Moreau	conseiller	seed-str-000058	\N	1	2026-03-18T21:23:55.560Z	2025-09-07T06:23:12.758Z	2026-03-27T16:50:11.224Z
seed-cons-000542	yannick.traore@cio-lorient.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Yannick	Traoré	admin_structure	seed-str-000059	\N	1	2026-03-27T13:11:31.253Z	2025-06-03T06:18:21.910Z	2026-03-27T16:50:11.224Z
seed-cons-000543	philippe.david@cio-lorient.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Philippe	David	conseiller	seed-str-000059	\N	1	2026-03-19T15:31:49.809Z	2025-07-23T05:55:13.126Z	2026-03-27T16:50:11.224Z
seed-cons-000544	nicolas.morin@cio-lorient.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nicolas	Morin	conseiller	seed-str-000059	\N	1	2026-03-26T01:17:21.531Z	2025-04-23T16:04:11.900Z	2026-03-27T16:50:11.224Z
seed-cons-000545	julien.perrin@cio-lorient.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Julien	Perrin	conseiller	seed-str-000059	\N	1	2026-03-21T05:58:02.896Z	2025-06-26T02:14:26.073Z	2026-03-27T16:50:11.224Z
seed-cons-000546	stephane.bamba@cio-lorient.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Stéphane	Bamba	conseiller	seed-str-000059	\N	1	2026-03-15T11:24:21.839Z	2025-07-29T07:54:50.435Z	2026-03-27T16:50:11.224Z
seed-cons-000547	jacques.vincent@cio-lorient.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jacques	Vincent	conseiller	seed-str-000059	\N	1	2026-03-25T23:22:24.103Z	2025-08-31T09:31:49.202Z	2026-03-27T16:50:11.224Z
seed-cons-000548	jacques.garnier@cio-mcon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jacques	Garnier	admin_structure	seed-str-000060	\N	1	\N	2026-02-12T17:15:02.573Z	2026-03-27T16:50:11.224Z
seed-cons-000549	patrick.bernard@cio-mcon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Patrick	Bernard	conseiller	seed-str-000060	\N	1	\N	2025-06-20T20:50:23.085Z	2026-03-27T16:50:11.224Z
seed-cons-000550	karim.robert@cio-mcon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Karim	Robert	conseiller	seed-str-000060	\N	1	2026-03-18T03:18:38.512Z	2025-12-16T14:04:04.670Z	2026-03-27T16:50:11.224Z
seed-cons-000551	delphine.laurent@cio-mcon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Delphine	Laurent	conseiller	seed-str-000060	\N	1	2026-03-13T19:42:50.679Z	2026-02-14T23:27:23.683Z	2026-03-27T16:50:11.224Z
seed-cons-000552	karim.mathieu@cio-mcon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Karim	Mathieu	conseiller	seed-str-000060	\N	1	2026-03-21T17:31:30.855Z	2025-04-06T15:31:15.227Z	2026-03-27T16:50:11.224Z
seed-cons-000553	claire.roux@cio-mcon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Claire	Roux	conseiller	seed-str-000060	\N	1	\N	2025-12-01T21:38:43.707Z	2026-03-27T16:50:11.224Z
seed-cons-000554	valerie.durand@cio-mcon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Valérie	Durand	conseiller	seed-str-000060	\N	1	2026-03-13T04:09:48.290Z	2025-10-21T09:21:47.441Z	2026-03-27T16:50:11.224Z
seed-cons-000555	alain.benali@cio-mcon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Alain	Benali	conseiller	seed-str-000060	\N	1	\N	2025-07-07T12:03:04.357Z	2026-03-27T16:50:11.224Z
seed-cons-000556	amina.boyer@cio-mcon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Amina	Boyer	super_admin	seed-str-000060	\N	1	2026-03-18T04:27:42.608Z	2026-01-29T20:36:36.890Z	2026-03-27T16:50:11.224Z
seed-cons-000557	isabelle.thomas@cio-mcon.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Isabelle	Thomas	conseiller	seed-str-000060	\N	1	\N	2025-08-23T14:16:12.066Z	2026-03-27T16:50:11.224Z
seed-cons-000558	yannick.bertrand@e2c-montauban.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Yannick	Bertrand	admin_structure	seed-str-000061	\N	1	2026-03-15T14:09:22.687Z	2025-12-03T20:36:24.160Z	2026-03-27T16:50:11.224Z
seed-cons-000559	anne.boyer@e2c-montauban.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Anne	Boyer	conseiller	seed-str-000061	\N	1	\N	2025-11-14T08:38:10.954Z	2026-03-27T16:50:11.224Z
seed-cons-000560	david.gauthier@e2c-montauban.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	David	Gauthier	conseiller	seed-str-000061	\N	1	\N	2025-11-05T18:51:34.413Z	2026-03-27T16:50:11.224Z
seed-cons-000561	philippe.morin@e2c-montauban.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Philippe	Morin	conseiller	seed-str-000061	\N	1	2026-03-25T02:50:16.976Z	2025-04-19T01:56:35.147Z	2026-03-27T16:50:11.224Z
seed-cons-000562	pierre.durand@e2c-montauban.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Pierre	Durand	conseiller	seed-str-000061	\N	1	2026-03-16T12:48:23.390Z	2025-12-30T04:11:26.588Z	2026-03-27T16:50:11.224Z
seed-cons-000563	sophie.garnier@e2c-montauban.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sophie	Garnier	conseiller	seed-str-000061	\N	1	\N	2026-02-18T10:41:30.499Z	2026-03-27T16:50:11.224Z
seed-cons-000564	aurelie.michel@e2c-montauban.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Aurélie	Michel	conseiller	seed-str-000061	\N	1	\N	2025-08-08T01:07:21.129Z	2026-03-27T16:50:11.224Z
seed-cons-000565	alain.bertrand@e2c-montauban.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Alain	Bertrand	conseiller	seed-str-000061	\N	1	\N	2025-12-15T02:24:03.345Z	2026-03-27T16:50:11.224Z
seed-cons-000566	emilie.girard@e2c-montauban.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Émilie	Girard	conseiller	seed-str-000061	\N	1	\N	2025-03-27T19:12:18.517Z	2026-03-27T16:50:11.224Z
seed-cons-000567	delphine.richard@e2c-montauban.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Delphine	Richard	conseiller	seed-str-000061	\N	1	2026-03-24T08:25:03.896Z	2025-12-12T20:02:53.573Z	2026-03-27T16:50:11.224Z
seed-cons-000568	anne.morel@e2c-montdemarsan.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Anne	Morel	admin_structure	seed-str-000062	\N	1	2026-03-15T04:57:52.948Z	2025-11-11T13:52:00.904Z	2026-03-27T16:50:11.224Z
seed-cons-000569	virginie.david@e2c-montdemarsan.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Virginie	David	conseiller	seed-str-000062	\N	1	2026-03-14T06:44:01.508Z	2025-04-30T23:11:10.764Z	2026-03-27T16:50:11.224Z
seed-cons-000570	philippe.henry@e2c-montdemarsan.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Philippe	Henry	conseiller	seed-str-000062	\N	1	\N	2025-04-29T14:44:09.746Z	2026-03-27T16:50:11.224Z
seed-cons-000571	sylvie.henry@e2c-montdemarsan.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sylvie	Henry	conseiller	seed-str-000062	\N	1	\N	2025-10-11T07:59:45.343Z	2026-03-27T16:50:11.224Z
seed-cons-000572	catherine.traore@e2c-montdemarsan.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Catherine	Traoré	conseiller	seed-str-000062	\N	1	2026-03-19T02:51:13.354Z	2025-11-16T05:59:42.768Z	2026-03-27T16:50:11.224Z
seed-cons-000573	michel.vincent@e2c-montdemarsan.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Michel	Vincent	conseiller	seed-str-000062	\N	1	2026-03-22T22:58:47.973Z	2026-01-02T18:48:16.774Z	2026-03-27T16:50:11.224Z
seed-cons-000574	michel.robin@e2c-montdemarsan.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Michel	Robin	conseiller	seed-str-000062	\N	1	2026-03-27T04:13:30.282Z	2026-02-14T15:53:09.435Z	2026-03-27T16:50:11.224Z
seed-cons-000575	amina.belkacem@e2c-montdemarsan.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Amina	Belkacem	conseiller	seed-str-000062	\N	1	2026-03-18T03:52:37.613Z	2025-05-25T22:59:05.634Z	2026-03-27T16:50:11.224Z
seed-cons-000576	emilie.girard@e2c-niort.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Émilie	Girard	admin_structure	seed-str-000063	\N	1	\N	2025-07-05T16:51:03.196Z	2026-03-27T16:50:11.224Z
seed-cons-000577	abdel.simon@e2c-niort.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Abdel	Simon	conseiller	seed-str-000063	\N	1	2026-03-16T07:20:45.331Z	2025-06-26T23:15:10.888Z	2026-03-27T16:50:11.224Z
seed-cons-000578	david.traore@e2c-niort.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	David	Traoré	conseiller	seed-str-000063	\N	1	2026-03-26T02:14:03.518Z	2025-07-14T09:03:28.292Z	2026-03-27T16:50:11.224Z
seed-cons-000579	anne.belkacem@e2c-niort.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Anne	Belkacem	conseiller	seed-str-000063	\N	1	2026-03-22T13:26:20.480Z	2025-09-11T13:46:29.414Z	2026-03-27T16:50:11.224Z
seed-cons-000580	jean.belkacem@e2c-niort.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jean	Belkacem	conseiller	seed-str-000063	\N	1	2026-03-18T02:31:06.033Z	2025-10-04T03:10:31.274Z	2026-03-27T16:50:11.224Z
seed-cons-000581	philippe.kone@e2c-niort.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Philippe	Kone	conseiller	seed-str-000063	\N	1	2026-03-18T19:41:14.231Z	2025-05-15T08:44:46.198Z	2026-03-27T16:50:11.224Z
seed-cons-000582	aurelie.boyer@e2c-niort.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Aurélie	Boyer	conseiller	seed-str-000063	\N	1	2026-03-13T01:08:57.996Z	2025-12-03T08:23:35.044Z	2026-03-27T16:50:11.224Z
seed-cons-000583	francois.vincent@e2c-niort.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	François	Vincent	conseiller	seed-str-000063	\N	1	2026-03-26T22:17:20.539Z	2025-08-28T23:16:18.524Z	2026-03-27T16:50:11.224Z
seed-cons-000584	caroline.bertrand@e2c-niort.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Caroline	Bertrand	conseiller	seed-str-000063	\N	1	2026-03-24T14:06:21.808Z	2025-04-19T21:44:58.477Z	2026-03-27T16:50:11.224Z
seed-cons-000585	anne.moreau@e2c-prigueux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Anne	Moreau	admin_structure	seed-str-000064	\N	1	\N	2025-08-21T06:57:21.406Z	2026-03-27T16:50:11.224Z
seed-cons-000586	fabien.morel@e2c-prigueux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fabien	Morel	conseiller	seed-str-000064	\N	1	2026-03-20T00:07:05.346Z	2025-11-27T03:36:59.804Z	2026-03-27T16:50:11.224Z
seed-cons-000587	celine.fournier@e2c-prigueux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Céline	Fournier	conseiller	seed-str-000064	\N	1	2026-03-23T19:49:29.619Z	2025-09-07T07:07:11.913Z	2026-03-27T16:50:11.224Z
seed-cons-000588	michel.henry@e2c-prigueux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Michel	Henry	conseiller	seed-str-000064	\N	1	2026-03-26T14:40:36.624Z	2026-02-17T20:20:00.234Z	2026-03-27T16:50:11.224Z
seed-cons-000589	thomas.david@e2c-prigueux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Thomas	David	conseiller	seed-str-000064	\N	1	2026-03-17T10:33:08.115Z	2026-02-23T15:41:59.128Z	2026-03-27T16:50:11.224Z
seed-cons-000590	jacques.diallo@e2c-prigueux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jacques	Diallo	super_admin	seed-str-000064	\N	1	\N	2025-12-19T10:53:33.881Z	2026-03-27T16:50:11.224Z
seed-cons-000591	stephane.martin@e2c-prigueux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Stéphane	Martin	conseiller	seed-str-000064	\N	1	2026-03-12T21:56:07.799Z	2025-05-07T21:54:10.600Z	2026-03-27T16:50:11.224Z
seed-cons-000592	caroline.bertrand@e2c-prigueux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Caroline	Bertrand	conseiller	seed-str-000064	\N	1	2026-03-13T18:50:26.606Z	2025-09-01T18:27:58.163Z	2026-03-27T16:50:11.224Z
seed-cons-000593	virginie.martin@e2c-prigueux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Virginie	Martin	conseiller	seed-str-000064	\N	1	2026-03-21T16:04:29.310Z	2025-04-14T03:40:29.165Z	2026-03-27T16:50:11.224Z
seed-cons-000594	yannick.moreau@e2c-quimper.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Yannick	Moreau	admin_structure	seed-str-000065	\N	1	2026-03-21T22:51:18.129Z	2026-02-20T17:21:49.984Z	2026-03-27T16:50:11.224Z
seed-cons-000595	yannick.clement@e2c-quimper.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Yannick	Clément	super_admin	seed-str-000065	\N	1	2026-03-19T00:30:30.920Z	2025-06-01T00:31:37.798Z	2026-03-27T16:50:11.224Z
seed-cons-000596	amina.perrin@e2c-quimper.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Amina	Perrin	conseiller	seed-str-000065	\N	1	2026-03-25T19:59:43.368Z	2025-10-27T00:50:28.608Z	2026-03-27T16:50:11.224Z
seed-cons-000597	pierre.blanc@e2c-quimper.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Pierre	Blanc	conseiller	seed-str-000065	\N	1	2026-03-20T23:03:46.155Z	2025-12-01T07:41:09.447Z	2026-03-27T16:50:11.224Z
seed-cons-000598	stephane.morel@e2c-quimper.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Stéphane	Morel	conseiller	seed-str-000065	\N	1	2026-03-19T05:11:01.388Z	2025-04-08T06:57:29.066Z	2026-03-27T16:50:11.224Z
seed-cons-000599	laure.henry@e2c-quimper.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Laure	Henry	conseiller	seed-str-000065	\N	1	\N	2026-01-21T23:46:35.956Z	2026-03-27T16:50:11.224Z
seed-cons-000600	laure.garcia@e2c-rodez.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Laure	Garcia	admin_structure	seed-str-000066	\N	1	2026-03-23T16:04:58.499Z	2025-09-02T07:38:59.647Z	2026-03-27T16:50:11.224Z
seed-cons-000601	jacques.nguyen@e2c-rodez.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jacques	Nguyen	conseiller	seed-str-000066	\N	1	2026-03-13T20:41:07.679Z	2025-12-17T15:30:49.020Z	2026-03-27T16:50:11.224Z
seed-cons-000602	fatima.gauthier@e2c-rodez.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	Gauthier	conseiller	seed-str-000066	\N	1	2026-03-21T05:06:53.737Z	2025-07-17T17:53:33.830Z	2026-03-27T16:50:11.224Z
seed-cons-000603	sophie.guerin@e2c-rodez.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sophie	Guérin	conseiller	seed-str-000066	\N	1	\N	2026-02-24T02:10:17.265Z	2026-03-27T16:50:11.224Z
seed-cons-000604	amina.nguyen@e2c-rodez.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Amina	Nguyen	conseiller	seed-str-000066	\N	1	2026-03-26T04:29:02.314Z	2025-07-22T17:38:13.361Z	2026-03-27T16:50:11.224Z
seed-cons-000605	aurelie.leroy@e2c-rodez.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Aurélie	Leroy	conseiller	seed-str-000066	\N	1	\N	2025-04-04T22:03:59.147Z	2026-03-27T16:50:11.224Z
seed-cons-000606	christophe.david@e2c-rodez.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christophe	David	conseiller	seed-str-000066	\N	1	2026-03-17T01:29:37.133Z	2025-08-07T07:23:10.764Z	2026-03-27T16:50:11.224Z
seed-cons-000607	sophie.kone@e2c-rodez.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sophie	Kone	conseiller	seed-str-000066	\N	1	2026-03-26T00:53:00.778Z	2025-05-21T06:03:57.457Z	2026-03-27T16:50:11.224Z
seed-cons-000608	karim.morel@e2c-saintbrieuc.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Karim	Morel	admin_structure	seed-str-000067	\N	1	\N	2025-07-22T20:55:41.531Z	2026-03-27T16:50:11.224Z
seed-cons-000609	virginie.mathieu@e2c-saintbrieuc.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Virginie	Mathieu	conseiller	seed-str-000067	\N	1	2026-03-18T18:44:07.412Z	2025-06-04T12:06:42.237Z	2026-03-27T16:50:11.224Z
seed-cons-000610	laure.francois@e2c-saintbrieuc.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Laure	François	conseiller	seed-str-000067	\N	1	\N	2025-11-02T20:12:58.323Z	2026-03-27T16:50:11.224Z
seed-cons-000611	thomas.perrin@e2c-saintbrieuc.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Thomas	Perrin	conseiller	seed-str-000067	\N	1	2026-03-21T21:12:23.451Z	2025-12-14T07:27:05.758Z	2026-03-27T16:50:11.224Z
seed-cons-000612	emilie.roux@e2c-saintbrieuc.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Émilie	Roux	conseiller	seed-str-000067	\N	1	2026-03-15T02:56:31.106Z	2025-10-28T06:12:38.683Z	2026-03-27T16:50:11.224Z
seed-cons-000613	francois.laurent@e2c-saintbrieuc.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	François	Laurent	conseiller	seed-str-000067	\N	1	2026-03-24T10:44:35.406Z	2025-12-30T22:15:17.329Z	2026-03-27T16:50:11.224Z
seed-cons-000614	alain.laurent@e2c-saintbrieuc.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Alain	Laurent	conseiller	seed-str-000067	\N	1	\N	2025-09-24T14:38:31.300Z	2026-03-27T16:50:11.224Z
seed-cons-000615	celine.gauthier@e2c-saintmalo.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Céline	Gauthier	admin_structure	seed-str-000068	\N	1	2026-03-15T20:44:08.844Z	2025-11-01T21:23:16.526Z	2026-03-27T16:50:11.224Z
seed-cons-000616	marc.martin@e2c-saintmalo.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marc	Martin	conseiller	seed-str-000068	\N	1	2026-03-16T15:21:55.468Z	2025-12-31T22:10:04.477Z	2026-03-27T16:50:11.224Z
seed-cons-000617	valerie.rousseau@e2c-saintmalo.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Valérie	Rousseau	conseiller	seed-str-000068	\N	1	\N	2025-11-13T03:04:42.663Z	2026-03-27T16:50:11.224Z
seed-cons-000618	jean.martin@e2c-saintmalo.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jean	Martin	conseiller	seed-str-000068	\N	1	2026-03-19T22:55:20.382Z	2025-11-03T19:04:28.215Z	2026-03-27T16:50:11.224Z
seed-cons-000619	abdel.durand@e2c-saintmalo.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Abdel	Durand	conseiller	seed-str-000068	\N	1	2026-03-19T09:47:11.277Z	2025-10-09T08:59:22.594Z	2026-03-27T16:50:11.224Z
seed-cons-000620	philippe.benali@e2c-saintmalo.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Philippe	Benali	conseiller	seed-str-000068	\N	1	2026-03-24T14:55:50.939Z	2025-11-25T01:26:07.347Z	2026-03-27T16:50:11.224Z
seed-cons-000621	delphine.blanc@e2c-saintmalo.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Delphine	Blanc	conseiller	seed-str-000068	\N	1	\N	2025-12-10T14:32:03.648Z	2026-03-27T16:50:11.224Z
seed-cons-000622	jean.gauthier@e2c-saintmalo.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jean	Gauthier	conseiller	seed-str-000068	\N	1	\N	2025-06-13T01:34:52.253Z	2026-03-27T16:50:11.224Z
seed-cons-000623	anne.dubois@e2c-saintmalo.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Anne	Dubois	conseiller	seed-str-000068	\N	1	2026-03-15T16:49:03.943Z	2025-09-30T17:31:41.102Z	2026-03-27T16:50:11.224Z
seed-cons-000624	laure.nguyen@e2c-saintmalo.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Laure	Nguyen	conseiller	seed-str-000068	\N	1	2026-03-23T17:08:22.236Z	2025-12-07T05:41:33.936Z	2026-03-27T16:50:11.224Z
seed-cons-000625	jacques.petit@e2c-saintnazaire.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jacques	Petit	admin_structure	seed-str-000069	\N	1	2026-03-15T13:49:20.319Z	2026-02-01T03:42:26.913Z	2026-03-27T16:50:11.224Z
seed-cons-000626	amina.boyer@e2c-saintnazaire.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Amina	Boyer	conseiller	seed-str-000069	\N	1	2026-03-21T17:06:27.418Z	2025-11-24T19:08:42.309Z	2026-03-27T16:50:11.224Z
seed-cons-000627	catherine.girard@e2c-saintnazaire.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Catherine	Girard	conseiller	seed-str-000069	\N	1	2026-03-24T21:11:57.590Z	2025-12-24T21:49:16.291Z	2026-03-27T16:50:11.224Z
seed-cons-000628	abdel.diallo@e2c-saintnazaire.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Abdel	Diallo	conseiller	seed-str-000069	\N	1	\N	2025-06-19T23:24:47.157Z	2026-03-27T16:50:11.224Z
seed-cons-000629	marie.robin@e2c-saintnazaire.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marie	Robin	conseiller	seed-str-000069	\N	1	\N	2025-04-25T14:51:55.650Z	2026-03-27T16:50:11.224Z
seed-cons-000630	christophe.kone@e2c-saintnazaire.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christophe	Kone	conseiller	seed-str-000069	\N	1	2026-03-26T14:29:01.780Z	2026-01-13T12:33:17.188Z	2026-03-27T16:50:11.224Z
seed-cons-000631	alain.legrand@e2c-saintnazaire.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Alain	Legrand	conseiller	seed-str-000069	\N	1	2026-03-14T09:39:34.170Z	2025-11-26T10:09:44.549Z	2026-03-27T16:50:11.224Z
seed-cons-000632	stephane.nguyen@e2c-saintnazaire.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Stéphane	Nguyen	conseiller	seed-str-000069	\N	1	2026-03-23T13:58:07.865Z	2025-11-03T21:01:42.291Z	2026-03-27T16:50:11.224Z
seed-cons-000633	yannick.chevalier@e2c-tarbes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Yannick	Chevalier	admin_structure	seed-str-000070	\N	1	\N	2025-05-21T15:06:25.475Z	2026-03-27T16:50:11.224Z
seed-cons-000634	nicolas.robert@e2c-tarbes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nicolas	Robert	conseiller	seed-str-000070	\N	1	2026-03-18T03:18:57.823Z	2025-11-01T00:02:26.939Z	2026-03-27T16:50:11.224Z
seed-cons-000635	sandrine.nicolas@e2c-tarbes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sandrine	Nicolas	conseiller	seed-str-000070	\N	1	2026-03-24T19:00:30.276Z	2026-01-14T15:54:43.680Z	2026-03-27T16:50:11.224Z
seed-cons-000636	patrick.durand@e2c-tarbes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Patrick	Durand	conseiller	seed-str-000070	\N	1	2026-03-25T18:30:17.461Z	2025-10-23T11:48:10.310Z	2026-03-27T16:50:11.224Z
seed-cons-000637	stephane.nicolas@e2c-tarbes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Stéphane	Nicolas	conseiller	seed-str-000070	\N	1	\N	2025-07-16T06:42:35.214Z	2026-03-27T16:50:11.224Z
seed-cons-000638	anne.bertrand@e2c-tarbes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Anne	Bertrand	conseiller	seed-str-000070	\N	1	2026-03-15T19:33:14.579Z	2025-07-08T04:47:56.913Z	2026-03-27T16:50:11.224Z
seed-cons-000639	christine.bernard@e2c-tarbes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christine	Bernard	conseiller	seed-str-000070	\N	1	2026-03-17T08:44:34.244Z	2026-01-21T04:10:09.593Z	2026-03-27T16:50:11.224Z
seed-cons-000640	laure.clement@e2c-tarbes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Laure	Clément	conseiller	seed-str-000070	\N	1	2026-03-24T13:17:51.554Z	2026-02-05T20:47:49.587Z	2026-03-27T16:50:11.224Z
seed-cons-000641	christine.dubois@e2c-tarbes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christine	Dubois	conseiller	seed-str-000070	\N	1	2026-03-25T01:14:39.870Z	2025-10-14T19:32:27.559Z	2026-03-27T16:50:11.224Z
seed-cons-000642	yannick.blanc@e2c-troyes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Yannick	Blanc	admin_structure	seed-str-000071	\N	1	\N	2025-08-23T06:08:39.256Z	2026-03-27T16:50:11.224Z
seed-cons-000643	julien.garcia@e2c-troyes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Julien	Garcia	conseiller	seed-str-000071	\N	1	2026-03-24T06:19:34.323Z	2025-04-15T06:17:55.562Z	2026-03-27T16:50:11.224Z
seed-cons-000644	fatima.bertrand@e2c-troyes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	Bertrand	conseiller	seed-str-000071	\N	1	2026-03-16T20:29:47.885Z	2025-07-17T10:22:39.229Z	2026-03-27T16:50:11.224Z
seed-cons-000645	valerie.lefebvre@e2c-troyes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Valérie	Lefebvre	conseiller	seed-str-000071	\N	1	2026-03-12T19:19:48.717Z	2025-04-28T02:04:58.465Z	2026-03-27T16:50:11.224Z
seed-cons-000646	yannick.garcia@e2c-troyes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Yannick	Garcia	conseiller	seed-str-000071	\N	1	\N	2025-09-13T00:25:44.545Z	2026-03-27T16:50:11.224Z
seed-cons-000647	marc.perrin@e2c-troyes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marc	Perrin	conseiller	seed-str-000071	\N	1	\N	2025-10-07T19:24:28.599Z	2026-03-27T16:50:11.224Z
seed-cons-000648	francois.boyer@e2c-troyes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	François	Boyer	conseiller	seed-str-000071	\N	1	\N	2025-12-21T12:05:37.259Z	2026-03-27T16:50:11.224Z
seed-cons-000649	nathalie.bouvier@e2c-troyes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nathalie	Bouvier	conseiller	seed-str-000071	\N	1	2026-03-23T07:07:29.417Z	2025-08-22T00:55:50.631Z	2026-03-27T16:50:11.224Z
seed-cons-000650	aurelie.belkacem@e2c-troyes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Aurélie	Belkacem	conseiller	seed-str-000071	\N	1	\N	2025-06-04T09:01:23.783Z	2026-03-27T16:50:11.224Z
seed-cons-000651	marie.garnier@e2c-troyes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marie	Garnier	conseiller	seed-str-000071	\N	1	\N	2026-02-15T03:32:57.650Z	2026-03-27T16:50:11.224Z
seed-cons-000652	jacques.benali@e2c-valence.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jacques	Benali	admin_structure	seed-str-000072	\N	1	2026-03-13T11:10:08.961Z	2026-02-25T16:29:36.738Z	2026-03-27T16:50:11.224Z
seed-cons-000653	valerie.traore@e2c-valence.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Valérie	Traoré	conseiller	seed-str-000072	\N	1	2026-03-16T01:25:20.560Z	2025-05-28T02:07:18.271Z	2026-03-27T16:50:11.224Z
seed-cons-000654	valerie.robin@e2c-valence.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Valérie	Robin	conseiller	seed-str-000072	\N	1	\N	2025-05-10T03:31:49.522Z	2026-03-27T16:50:11.224Z
seed-cons-000655	abdel.laurent@e2c-valence.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Abdel	Laurent	conseiller	seed-str-000072	\N	1	\N	2025-05-13T18:38:40.259Z	2026-03-27T16:50:11.224Z
seed-cons-000656	emilie.rousseau@e2c-valence.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Émilie	Rousseau	super_admin	seed-str-000072	\N	1	2026-03-21T10:56:24.475Z	2025-05-29T19:22:19.924Z	2026-03-27T16:50:11.224Z
seed-cons-000657	sylvie.moreau@e2c-valence.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sylvie	Moreau	conseiller	seed-str-000072	\N	1	2026-03-19T02:46:45.593Z	2025-09-07T13:43:23.580Z	2026-03-27T16:50:11.224Z
seed-cons-000658	thomas.richard@e2c-valence.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Thomas	Richard	conseiller	seed-str-000072	\N	1	\N	2025-04-08T08:07:59.027Z	2026-03-27T16:50:11.224Z
seed-cons-000659	alain.robert@e2c-valence.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Alain	Robert	conseiller	seed-str-000072	\N	1	2026-03-24T13:59:13.600Z	2025-06-26T05:15:05.852Z	2026-03-27T16:50:11.224Z
seed-cons-000660	sebastien.lefebvre@e2c-valence.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sébastien	Lefebvre	conseiller	seed-str-000072	\N	1	2026-03-24T10:15:41.044Z	2025-08-12T18:05:40.762Z	2026-03-27T16:50:11.224Z
seed-cons-000661	anne.morel@e2c-vannes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Anne	Morel	admin_structure	seed-str-000073	\N	1	2026-03-27T11:52:50.971Z	2025-07-31T23:26:12.919Z	2026-03-27T16:50:11.224Z
seed-cons-000662	patrick.laurent@e2c-vannes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Patrick	Laurent	conseiller	seed-str-000073	\N	1	\N	2025-07-07T09:02:01.487Z	2026-03-27T16:50:11.224Z
seed-cons-000663	valerie.bouvier@e2c-vannes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Valérie	Bouvier	conseiller	seed-str-000073	\N	1	2026-03-26T19:08:48.935Z	2025-05-28T12:42:17.076Z	2026-03-27T16:50:11.224Z
seed-cons-000664	sylvie.legrand@e2c-vannes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sylvie	Legrand	conseiller	seed-str-000073	\N	1	2026-03-16T15:20:58.242Z	2025-05-21T12:16:04.606Z	2026-03-27T16:50:11.224Z
seed-cons-000665	marie.bouvier@e2c-vannes.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marie	Bouvier	conseiller	seed-str-000073	\N	1	2026-03-19T02:00:04.090Z	2025-08-25T06:47:35.220Z	2026-03-27T16:50:11.224Z
seed-cons-000666	delphine.bamba@e2c-vichy.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Delphine	Bamba	admin_structure	seed-str-000074	\N	1	2026-03-25T23:09:17.391Z	2026-02-12T18:43:51.530Z	2026-03-27T16:50:11.224Z
seed-cons-000667	emilie.boyer@e2c-vichy.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Émilie	Boyer	conseiller	seed-str-000074	\N	1	2026-03-13T20:35:40.111Z	2025-09-16T17:18:10.070Z	2026-03-27T16:50:11.224Z
seed-cons-000668	sandrine.blanc@e2c-vichy.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sandrine	Blanc	conseiller	seed-str-000074	\N	1	2026-03-20T06:18:30.272Z	2026-01-26T11:14:23.992Z	2026-03-27T16:50:11.224Z
seed-cons-000669	caroline.cisse@e2c-vichy.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Caroline	Cissé	conseiller	seed-str-000074	\N	1	2026-03-13T02:17:29.904Z	2025-10-18T13:27:57.420Z	2026-03-27T16:50:11.224Z
seed-cons-000670	pierre.bernard@e2c-vichy.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Pierre	Bernard	conseiller	seed-str-000074	\N	1	2026-03-25T07:55:20.961Z	2026-01-05T05:28:10.217Z	2026-03-27T16:50:11.224Z
seed-cons-000671	philippe.girard@e2c-angoulme.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Philippe	Girard	admin_structure	seed-str-000075	\N	1	\N	2025-07-21T12:14:18.142Z	2026-03-27T16:50:11.224Z
seed-cons-000672	marie.gauthier@e2c-angoulme.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marie	Gauthier	conseiller	seed-str-000075	\N	1	2026-03-22T18:13:18.182Z	2025-10-05T07:52:32.462Z	2026-03-27T16:50:11.224Z
seed-cons-000673	isabelle.simon@e2c-angoulme.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Isabelle	Simon	conseiller	seed-str-000075	\N	1	\N	2025-08-31T14:03:14.466Z	2026-03-27T16:50:11.224Z
seed-cons-000674	julien.robin@e2c-angoulme.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Julien	Robin	conseiller	seed-str-000075	\N	1	2026-03-22T17:35:11.203Z	2025-12-31T23:03:41.774Z	2026-03-27T16:50:11.224Z
seed-cons-000675	philippe.robert@e2c-angoulme.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Philippe	Robert	super_admin	seed-str-000075	\N	1	2026-03-15T00:23:55.379Z	2025-04-02T04:14:45.314Z	2026-03-27T16:50:11.224Z
seed-cons-000676	pierre.roux@paio-albi.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Pierre	Roux	admin_structure	seed-str-000076	\N	1	\N	2025-08-06T04:47:37.860Z	2026-03-27T16:50:11.224Z
seed-cons-000677	valerie.david@paio-albi.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Valérie	David	conseiller	seed-str-000076	\N	1	2026-03-25T09:30:57.272Z	2025-11-01T09:57:07.352Z	2026-03-27T16:50:11.224Z
seed-cons-000678	sebastien.kone@paio-albi.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sébastien	Kone	conseiller	seed-str-000076	\N	1	\N	2025-05-25T09:05:07.058Z	2026-03-27T16:50:11.224Z
seed-cons-000679	julien.laurent@paio-albi.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Julien	Laurent	conseiller	seed-str-000076	\N	1	\N	2025-12-12T02:37:52.055Z	2026-03-27T16:50:11.224Z
seed-cons-000680	philippe.haddad@paio-albi.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Philippe	Haddad	conseiller	seed-str-000076	\N	1	2026-03-22T16:32:07.677Z	2025-11-17T15:10:19.721Z	2026-03-27T16:50:11.224Z
seed-cons-000681	nicolas.rousseau@paio-agen.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nicolas	Rousseau	admin_structure	seed-str-000077	\N	1	2026-03-16T13:58:21.050Z	2026-01-01T07:20:14.305Z	2026-03-27T16:50:11.224Z
seed-cons-000682	marie.vincent@paio-agen.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marie	Vincent	conseiller	seed-str-000077	\N	1	2026-03-13T17:10:47.056Z	2026-01-14T04:47:15.526Z	2026-03-27T16:50:11.224Z
seed-cons-000683	laure.rousseau@paio-agen.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Laure	Rousseau	conseiller	seed-str-000077	\N	1	2026-03-25T01:00:06.354Z	2025-09-11T21:23:16.098Z	2026-03-27T16:50:11.224Z
seed-cons-000684	david.simon@paio-agen.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	David	Simon	conseiller	seed-str-000077	\N	1	2026-03-24T21:28:29.695Z	2026-01-13T18:53:43.503Z	2026-03-27T16:50:11.224Z
seed-cons-000685	nicolas.chevalier@paio-agen.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nicolas	Chevalier	conseiller	seed-str-000077	\N	1	2026-03-24T04:21:31.413Z	2025-11-28T04:30:15.034Z	2026-03-27T16:50:11.224Z
seed-cons-000686	isabelle.lefebvre@paio-aurillac.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Isabelle	Lefebvre	admin_structure	seed-str-000078	\N	1	2026-03-20T15:34:31.890Z	2025-09-04T10:15:46.859Z	2026-03-27T16:50:11.224Z
seed-cons-000687	david.laurent@paio-aurillac.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	David	Laurent	conseiller	seed-str-000078	\N	1	2026-03-14T00:11:06.652Z	2025-07-09T15:37:27.918Z	2026-03-27T16:50:11.224Z
seed-cons-000688	christophe.francois@paio-aurillac.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christophe	François	conseiller	seed-str-000078	\N	1	2026-03-26T05:34:06.347Z	2025-09-18T00:19:59.726Z	2026-03-27T16:50:11.224Z
seed-cons-000689	marc.andre@paio-aurillac.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marc	André	conseiller	seed-str-000078	\N	1	2026-03-22T12:50:19.483Z	2025-10-07T18:44:20.102Z	2026-03-27T16:50:11.224Z
seed-cons-000690	karim.roux@paio-aurillac.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Karim	Roux	conseiller	seed-str-000078	\N	1	2026-03-25T11:07:01.008Z	2025-06-03T12:51:16.161Z	2026-03-27T16:50:11.224Z
seed-cons-000691	sebastien.michel@paio-aurillac.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sébastien	Michel	conseiller	seed-str-000078	\N	1	\N	2025-03-30T02:48:09.447Z	2026-03-27T16:50:11.224Z
seed-cons-000692	valerie.moreau@paio-aurillac.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Valérie	Moreau	conseiller	seed-str-000078	\N	1	\N	2025-11-12T02:11:48.846Z	2026-03-27T16:50:11.224Z
seed-cons-000693	laure.robert@paio-aurillac.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Laure	Robert	conseiller	seed-str-000078	\N	1	2026-03-24T01:04:10.436Z	2025-05-26T20:19:25.098Z	2026-03-27T16:50:11.224Z
seed-cons-000694	marc.roux@paio-auxerre.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marc	Roux	admin_structure	seed-str-000079	\N	1	2026-03-23T05:24:45.397Z	2025-12-30T19:58:33.338Z	2026-03-27T16:50:11.224Z
seed-cons-000695	christine.vincent@paio-auxerre.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christine	Vincent	conseiller	seed-str-000079	\N	1	\N	2026-01-27T16:40:51.155Z	2026-03-27T16:50:11.224Z
seed-cons-000696	sebastien.robert@paio-auxerre.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sébastien	Robert	conseiller	seed-str-000079	\N	1	2026-03-17T13:35:44.567Z	2025-04-27T02:36:05.464Z	2026-03-27T16:50:11.224Z
seed-cons-000697	emilie.moreau@paio-auxerre.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Émilie	Moreau	conseiller	seed-str-000079	\N	1	2026-03-18T11:56:07.619Z	2025-06-06T00:14:23.959Z	2026-03-27T16:50:11.224Z
seed-cons-000698	sophie.gauthier@paio-auxerre.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sophie	Gauthier	conseiller	seed-str-000079	\N	1	\N	2025-08-06T09:51:37.757Z	2026-03-27T16:50:11.224Z
seed-cons-000699	fatima.mercier@paio-auxerre.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	Mercier	conseiller	seed-str-000079	\N	1	2026-03-15T18:44:54.156Z	2025-10-18T22:02:23.772Z	2026-03-27T16:50:11.224Z
seed-cons-000700	philippe.robert@paio-auxerre.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Philippe	Robert	conseiller	seed-str-000079	\N	1	2026-03-26T05:00:54.155Z	2025-10-18T12:22:15.414Z	2026-03-27T16:50:11.224Z
seed-cons-000701	valerie.bamba@paio-auxerre.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Valérie	Bamba	conseiller	seed-str-000079	\N	1	\N	2026-02-22T10:06:29.073Z	2026-03-27T16:50:11.224Z
seed-cons-000702	jean.michel@paio-auxerre.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jean	Michel	conseiller	seed-str-000079	\N	1	\N	2025-09-03T10:10:51.031Z	2026-03-27T16:50:11.224Z
seed-cons-000703	julien.francois@paio-bayonne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Julien	François	admin_structure	seed-str-000080	\N	1	\N	2025-11-09T21:58:55.152Z	2026-03-27T16:50:11.224Z
seed-cons-000704	caroline.petit@paio-bayonne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Caroline	Petit	conseiller	seed-str-000080	\N	1	2026-03-24T08:50:51.285Z	2025-04-16T15:44:45.412Z	2026-03-27T16:50:11.224Z
seed-cons-000705	claire.bouvier@paio-bayonne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Claire	Bouvier	conseiller	seed-str-000080	\N	1	2026-03-14T07:06:06.803Z	2025-09-11T13:02:08.464Z	2026-03-27T16:50:11.224Z
seed-cons-000706	emilie.kone@paio-bayonne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Émilie	Kone	conseiller	seed-str-000080	\N	1	2026-03-22T17:06:05.264Z	2025-11-14T10:25:25.132Z	2026-03-27T16:50:11.224Z
seed-cons-000707	celine.fournier@paio-bayonne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Céline	Fournier	conseiller	seed-str-000080	\N	1	\N	2025-08-16T03:39:41.990Z	2026-03-27T16:50:11.224Z
seed-cons-000708	sylvie.petit@paio-bayonne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sylvie	Petit	conseiller	seed-str-000080	\N	1	2026-03-15T03:12:48.693Z	2025-04-01T03:06:32.185Z	2026-03-27T16:50:11.224Z
seed-cons-000709	virginie.mathieu@paio-belfort.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Virginie	Mathieu	admin_structure	seed-str-000081	\N	1	\N	2025-11-14T00:16:12.352Z	2026-03-27T16:50:11.224Z
seed-cons-000710	sandrine.nicolas@paio-belfort.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sandrine	Nicolas	conseiller	seed-str-000081	\N	1	\N	2025-05-31T20:27:17.025Z	2026-03-27T16:50:11.224Z
seed-cons-000711	fatima.haddad@paio-belfort.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	Haddad	conseiller	seed-str-000081	\N	1	2026-03-21T04:58:15.842Z	2026-01-30T11:39:10.879Z	2026-03-27T16:50:11.224Z
seed-cons-000712	fabien.legrand@paio-belfort.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fabien	Legrand	conseiller	seed-str-000081	\N	1	2026-03-19T15:16:56.444Z	2025-04-26T18:06:18.731Z	2026-03-27T16:50:11.224Z
seed-cons-000713	christophe.bamba@paio-belfort.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christophe	Bamba	conseiller	seed-str-000081	\N	1	\N	2026-01-19T13:29:14.891Z	2026-03-27T16:50:11.224Z
seed-cons-000714	david.nicolas@paio-belfort.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	David	Nicolas	conseiller	seed-str-000081	\N	1	2026-03-13T09:43:38.439Z	2025-05-31T03:02:39.577Z	2026-03-27T16:50:11.224Z
seed-cons-000715	caroline.fournier@paio-belfort.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Caroline	Fournier	conseiller	seed-str-000081	\N	1	\N	2026-01-08T01:50:27.256Z	2026-03-27T16:50:11.224Z
seed-cons-000716	patrick.bernard@paio-belfort.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Patrick	Bernard	conseiller	seed-str-000081	\N	1	2026-03-19T17:43:10.864Z	2025-11-30T15:26:07.536Z	2026-03-27T16:50:11.224Z
seed-cons-000717	david.thomas@paio-belfort.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	David	Thomas	conseiller	seed-str-000081	\N	1	\N	2025-12-11T17:59:35.958Z	2026-03-27T16:50:11.224Z
seed-cons-000718	laure.thomas@paio-blois.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Laure	Thomas	admin_structure	seed-str-000082	\N	1	2026-03-25T04:25:26.044Z	2025-10-11T16:30:12.934Z	2026-03-27T16:50:11.224Z
seed-cons-000719	christine.moreau@paio-blois.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christine	Moreau	conseiller	seed-str-000082	\N	1	2026-03-25T04:06:20.107Z	2025-05-08T20:06:18.046Z	2026-03-27T16:50:11.224Z
seed-cons-000720	laure.bernard@paio-blois.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Laure	Bernard	conseiller	seed-str-000082	\N	1	2026-03-21T14:02:29.280Z	2025-10-25T07:30:36.725Z	2026-03-27T16:50:11.224Z
seed-cons-000721	francois.traore@paio-blois.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	François	Traoré	conseiller	seed-str-000082	\N	1	2026-03-27T16:41:39.994Z	2026-02-19T05:59:40.208Z	2026-03-27T16:50:11.224Z
seed-cons-000722	laure.petit@paio-blois.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Laure	Petit	conseiller	seed-str-000082	\N	1	\N	2025-08-14T04:08:59.028Z	2026-03-27T16:50:11.224Z
seed-cons-000723	karim.leroy@paio-bourgenbresse.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Karim	Leroy	admin_structure	seed-str-000083	\N	1	2026-03-12T23:00:58.951Z	2025-06-10T01:58:08.466Z	2026-03-27T16:50:11.224Z
seed-cons-000724	anne.henry@paio-bourgenbresse.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Anne	Henry	conseiller	seed-str-000083	\N	1	\N	2026-02-24T07:18:20.002Z	2026-03-27T16:50:11.224Z
seed-cons-000725	claire.leroy@paio-bourgenbresse.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Claire	Leroy	conseiller	seed-str-000083	\N	1	2026-03-12T19:05:20.446Z	2026-02-14T19:41:52.178Z	2026-03-27T16:50:11.224Z
seed-cons-000726	emilie.lefebvre@paio-bourgenbresse.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Émilie	Lefebvre	conseiller	seed-str-000083	\N	1	2026-03-18T10:00:04.623Z	2025-10-03T08:49:56.580Z	2026-03-27T16:50:11.224Z
seed-cons-000727	celine.diallo@paio-bourgenbresse.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Céline	Diallo	conseiller	seed-str-000083	\N	1	\N	2025-06-28T12:52:02.445Z	2026-03-27T16:50:11.224Z
seed-cons-000728	amina.robin@paio-bourgenbresse.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Amina	Robin	conseiller	seed-str-000083	\N	1	2026-03-12T19:29:34.518Z	2025-07-02T19:33:54.797Z	2026-03-27T16:50:11.224Z
seed-cons-000729	patrick.diallo@paio-bourgenbresse.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Patrick	Diallo	conseiller	seed-str-000083	\N	1	2026-03-24T06:00:18.903Z	2025-06-16T02:49:01.060Z	2026-03-27T16:50:11.224Z
seed-cons-000730	anne.leroy@paio-bourgenbresse.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Anne	Leroy	conseiller	seed-str-000083	\N	1	2026-03-17T19:31:59.906Z	2025-12-22T18:53:15.715Z	2026-03-27T16:50:11.224Z
seed-cons-000731	celine.belkacem@paio-bourgenbresse.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Céline	Belkacem	conseiller	seed-str-000083	\N	1	\N	2026-01-30T01:52:16.542Z	2026-03-27T16:50:11.224Z
seed-cons-000732	amina.richard@paio-carcassonne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Amina	Richard	admin_structure	seed-str-000084	\N	1	2026-03-22T21:06:53.545Z	2025-05-18T03:32:32.809Z	2026-03-27T16:50:11.224Z
seed-cons-000733	sebastien.belkacem@paio-carcassonne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sébastien	Belkacem	conseiller	seed-str-000084	\N	1	2026-03-26T01:07:51.721Z	2025-08-09T14:27:01.752Z	2026-03-27T16:50:11.224Z
seed-cons-000734	jacques.michel@paio-carcassonne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jacques	Michel	conseiller	seed-str-000084	\N	1	2026-03-21T11:40:26.983Z	2025-12-27T02:05:15.702Z	2026-03-27T16:50:11.224Z
seed-cons-000735	yannick.morin@paio-carcassonne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Yannick	Morin	conseiller	seed-str-000084	\N	1	2026-03-18T15:59:57.574Z	2025-12-10T04:27:56.577Z	2026-03-27T16:50:11.224Z
seed-cons-000736	michel.vincent@paio-carcassonne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Michel	Vincent	conseiller	seed-str-000084	\N	1	2026-03-14T15:59:17.684Z	2025-05-28T20:59:53.905Z	2026-03-27T16:50:11.224Z
seed-cons-000737	amina.mathieu@paio-carcassonne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Amina	Mathieu	conseiller	seed-str-000084	\N	1	\N	2025-07-24T20:52:54.021Z	2026-03-27T16:50:11.224Z
seed-cons-000738	jacques.martin@paio-carcassonne.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jacques	Martin	conseiller	seed-str-000084	\N	1	\N	2026-02-10T20:01:59.834Z	2026-03-27T16:50:11.224Z
seed-cons-000739	delphine.guerin@paio-chteauroux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Delphine	Guérin	admin_structure	seed-str-000085	\N	1	2026-03-14T11:50:00.870Z	2025-11-02T00:09:46.195Z	2026-03-27T16:50:11.224Z
seed-cons-000740	delphine.garcia@paio-chteauroux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Delphine	Garcia	super_admin	seed-str-000085	\N	1	\N	2026-01-17T23:46:57.086Z	2026-03-27T16:50:11.224Z
seed-cons-000741	marie.benali@paio-chteauroux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marie	Benali	conseiller	seed-str-000085	\N	1	\N	2025-10-07T19:49:25.554Z	2026-03-27T16:50:11.224Z
seed-cons-000742	sophie.david@paio-chteauroux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sophie	David	conseiller	seed-str-000085	\N	1	2026-03-18T10:36:48.133Z	2025-06-20T13:10:36.508Z	2026-03-27T16:50:11.224Z
seed-cons-000743	sophie.durand@paio-chteauroux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sophie	Durand	conseiller	seed-str-000085	\N	1	\N	2025-10-27T20:38:11.369Z	2026-03-27T16:50:11.224Z
seed-cons-000744	abdel.blanc@paio-chteauroux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Abdel	Blanc	conseiller	seed-str-000085	\N	1	2026-03-24T03:29:05.558Z	2026-01-02T15:44:36.506Z	2026-03-27T16:50:11.224Z
seed-cons-000745	yannick.guerin@paio-chteauroux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Yannick	Guérin	conseiller	seed-str-000085	\N	1	\N	2026-01-05T06:17:35.814Z	2026-03-27T16:50:11.224Z
seed-cons-000746	amina.bernard@paio-chteauroux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Amina	Bernard	conseiller	seed-str-000085	\N	1	2026-03-19T12:48:33.255Z	2025-05-25T16:25:41.977Z	2026-03-27T16:50:11.224Z
seed-cons-000747	christine.gauthier@paio-chteauroux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christine	Gauthier	conseiller	seed-str-000085	\N	1	2026-03-21T12:02:57.438Z	2025-09-15T16:48:11.592Z	2026-03-27T16:50:11.224Z
seed-cons-000748	claire.roux@paio-chteauroux.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Claire	Roux	conseiller	seed-str-000085	\N	1	2026-03-13T15:37:19.952Z	2026-01-27T23:01:26.907Z	2026-03-27T16:50:11.224Z
seed-cons-000749	christine.blanc@fdn-dignelesbains.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christine	Blanc	admin_structure	seed-str-000086	\N	1	\N	2026-01-22T15:59:20.578Z	2026-03-27T16:50:11.224Z
seed-cons-000750	patrick.petit@fdn-dignelesbains.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Patrick	Petit	conseiller	seed-str-000086	\N	1	2026-03-15T01:27:41.043Z	2025-10-03T10:27:34.201Z	2026-03-27T16:50:11.224Z
seed-cons-000751	jacques.bouvier@fdn-dignelesbains.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jacques	Bouvier	conseiller	seed-str-000086	\N	1	2026-03-23T04:06:00.990Z	2025-07-23T09:23:12.698Z	2026-03-27T16:50:11.224Z
seed-cons-000752	sebastien.nguyen@fdn-dignelesbains.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sébastien	Nguyen	conseiller	seed-str-000086	\N	1	\N	2025-09-09T07:48:51.248Z	2026-03-27T16:50:11.224Z
seed-cons-000753	sylvie.legrand@fdn-dignelesbains.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sylvie	Legrand	conseiller	seed-str-000086	\N	1	\N	2025-11-19T20:40:08.744Z	2026-03-27T16:50:11.224Z
seed-cons-000754	celine.robin@fdn-foix.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Céline	Robin	admin_structure	seed-str-000087	\N	1	2026-03-25T12:58:49.780Z	2025-12-13T03:45:17.253Z	2026-03-27T16:50:11.224Z
seed-cons-000755	christine.fournier@fdn-foix.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christine	Fournier	conseiller	seed-str-000087	\N	1	\N	2025-07-07T09:45:52.689Z	2026-03-27T16:50:11.224Z
seed-cons-000756	christophe.chevalier@fdn-foix.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christophe	Chevalier	conseiller	seed-str-000087	\N	1	2026-03-14T07:54:23.124Z	2025-12-02T18:16:43.347Z	2026-03-27T16:50:11.224Z
seed-cons-000757	virginie.kone@fdn-foix.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Virginie	Kone	conseiller	seed-str-000087	\N	1	2026-03-14T03:35:03.226Z	2026-02-14T02:45:29.181Z	2026-03-27T16:50:11.224Z
seed-cons-000758	patrick.roux@fdn-foix.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Patrick	Roux	conseiller	seed-str-000087	\N	1	\N	2025-07-21T02:23:26.557Z	2026-03-27T16:50:11.224Z
seed-cons-000759	virginie.gauthier@fdn-foix.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Virginie	Gauthier	conseiller	seed-str-000087	\N	1	2026-03-20T03:35:34.929Z	2026-02-03T14:42:23.268Z	2026-03-27T16:50:11.224Z
seed-cons-000760	karim.leroy@fdn-guret.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Karim	Leroy	admin_structure	seed-str-000088	\N	1	2026-03-21T10:17:05.705Z	2025-06-20T02:45:27.002Z	2026-03-27T16:50:11.224Z
seed-cons-000761	thomas.bouvier@fdn-guret.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Thomas	Bouvier	conseiller	seed-str-000088	\N	1	2026-03-12T20:14:38.487Z	2025-04-14T14:12:03.111Z	2026-03-27T16:50:11.224Z
seed-cons-000762	nicolas.diallo@fdn-guret.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nicolas	Diallo	conseiller	seed-str-000088	\N	1	2026-03-13T17:58:17.134Z	2025-07-27T02:43:22.645Z	2026-03-27T16:50:11.224Z
seed-cons-000763	christophe.mercier@fdn-guret.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christophe	Mercier	conseiller	seed-str-000088	\N	1	\N	2025-06-23T19:48:21.534Z	2026-03-27T16:50:11.224Z
seed-cons-000764	aurelie.belkacem@fdn-guret.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Aurélie	Belkacem	conseiller	seed-str-000088	\N	1	2026-03-24T22:33:55.767Z	2025-11-18T11:21:57.785Z	2026-03-27T16:50:11.224Z
seed-cons-000765	caroline.david@fdn-guret.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Caroline	David	conseiller	seed-str-000088	\N	1	2026-03-19T04:37:47.382Z	2025-10-13T07:57:57.074Z	2026-03-27T16:50:11.224Z
seed-cons-000766	laure.rousseau@fdn-guret.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Laure	Rousseau	super_admin	seed-str-000088	\N	1	2026-03-20T09:18:37.533Z	2025-12-24T00:18:31.622Z	2026-03-27T16:50:11.224Z
seed-cons-000767	jacques.chevalier@fdn-guret.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jacques	Chevalier	conseiller	seed-str-000088	\N	1	2026-03-27T04:58:28.815Z	2025-12-01T22:22:23.945Z	2026-03-27T16:50:11.224Z
seed-cons-000768	delphine.durand@fdn-guret.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Delphine	Durand	conseiller	seed-str-000088	\N	1	2026-03-21T15:18:54.696Z	2026-02-11T20:55:20.931Z	2026-03-27T16:50:11.224Z
seed-cons-000769	marc.bouvier@fdn-lonslesaunier.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marc	Bouvier	admin_structure	seed-str-000089	\N	1	2026-03-24T01:33:47.019Z	2025-04-19T01:39:06.476Z	2026-03-27T16:50:11.224Z
seed-cons-000770	marie.roux@fdn-lonslesaunier.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marie	Roux	conseiller	seed-str-000089	\N	1	2026-03-23T11:21:43.059Z	2025-09-20T17:03:37.618Z	2026-03-27T16:50:11.224Z
seed-cons-000771	david.bertrand@fdn-lonslesaunier.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	David	Bertrand	conseiller	seed-str-000089	\N	1	\N	2025-07-21T02:57:49.233Z	2026-03-27T16:50:11.224Z
seed-cons-000772	jacques.cisse@fdn-lonslesaunier.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jacques	Cissé	conseiller	seed-str-000089	\N	1	\N	2025-07-28T00:56:41.629Z	2026-03-27T16:50:11.224Z
seed-cons-000773	abdel.bamba@fdn-lonslesaunier.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Abdel	Bamba	conseiller	seed-str-000089	\N	1	2026-03-16T23:12:17.519Z	2025-10-28T06:03:07.646Z	2026-03-27T16:50:11.224Z
seed-cons-000774	francois.gauthier@fdn-lonslesaunier.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	François	Gauthier	conseiller	seed-str-000089	\N	1	2026-03-25T01:41:13.363Z	2026-01-21T08:32:10.440Z	2026-03-27T16:50:11.224Z
seed-cons-000775	sebastien.diallo@fdn-lonslesaunier.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sébastien	Diallo	conseiller	seed-str-000089	\N	1	2026-03-26T08:22:01.701Z	2025-09-06T12:48:19.441Z	2026-03-27T16:50:11.224Z
seed-cons-000776	claire.kone@fdn-lonslesaunier.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Claire	Kone	conseiller	seed-str-000089	\N	1	\N	2026-02-21T15:15:27.022Z	2026-03-27T16:50:11.224Z
seed-cons-000777	amina.boyer@fdn-lonslesaunier.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Amina	Boyer	conseiller	seed-str-000089	\N	1	2026-03-20T14:29:12.758Z	2025-04-12T05:43:03.123Z	2026-03-27T16:50:11.224Z
seed-cons-000778	marie.robin@fdn-mende.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marie	Robin	admin_structure	seed-str-000090	\N	1	\N	2025-11-16T23:21:07.739Z	2026-03-27T16:50:11.224Z
seed-cons-000779	julien.clement@fdn-mende.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Julien	Clément	conseiller	seed-str-000090	\N	1	2026-03-20T17:25:34.751Z	2025-12-31T21:42:08.069Z	2026-03-27T16:50:11.224Z
seed-cons-000780	patrick.leroy@fdn-mende.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Patrick	Leroy	conseiller	seed-str-000090	\N	1	2026-03-25T03:50:38.543Z	2026-02-20T18:38:23.101Z	2026-03-27T16:50:11.224Z
seed-cons-000781	michel.robin@fdn-mende.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Michel	Robin	conseiller	seed-str-000090	\N	1	\N	2026-02-01T17:58:28.986Z	2026-03-27T16:50:11.224Z
seed-cons-000782	sandrine.bamba@fdn-mende.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sandrine	Bamba	conseiller	seed-str-000090	\N	1	\N	2025-09-26T12:53:43.050Z	2026-03-27T16:50:11.224Z
seed-cons-000783	isabelle.nicolas@fdn-mende.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Isabelle	Nicolas	conseiller	seed-str-000090	\N	1	2026-03-27T02:16:21.410Z	2025-05-14T17:26:04.467Z	2026-03-27T16:50:11.224Z
seed-cons-000784	patrick.david@asso-moulins.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Patrick	David	admin_structure	seed-str-000091	\N	1	2026-03-21T20:26:47.003Z	2025-08-08T15:54:37.868Z	2026-03-27T16:50:11.224Z
seed-cons-000785	michel.robin@asso-moulins.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Michel	Robin	conseiller	seed-str-000091	\N	1	2026-03-23T00:15:47.261Z	2025-10-22T06:48:47.511Z	2026-03-27T16:50:11.224Z
seed-cons-000786	amina.nicolas@asso-moulins.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Amina	Nicolas	conseiller	seed-str-000091	\N	1	2026-03-16T01:14:27.842Z	2026-01-30T15:43:23.337Z	2026-03-27T16:50:11.224Z
seed-cons-000787	nicolas.perrin@asso-moulins.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nicolas	Perrin	conseiller	seed-str-000091	\N	1	2026-03-18T05:23:00.561Z	2025-08-20T08:36:30.845Z	2026-03-27T16:50:11.224Z
seed-cons-000788	sebastien.traore@asso-moulins.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sébastien	Traoré	conseiller	seed-str-000091	\N	1	2026-03-25T19:05:30.596Z	2025-05-05T22:36:06.039Z	2026-03-27T16:50:11.224Z
seed-cons-000789	sophie.nguyen@asso-moulins.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sophie	Nguyen	conseiller	seed-str-000091	\N	1	\N	2025-10-22T22:04:54.819Z	2026-03-27T16:50:11.224Z
seed-cons-000790	emilie.nicolas@asso-moulins.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Émilie	Nicolas	conseiller	seed-str-000091	\N	1	\N	2025-10-21T09:49:17.949Z	2026-03-27T16:50:11.224Z
seed-cons-000791	thomas.bamba@asso-moulins.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Thomas	Bamba	conseiller	seed-str-000091	\N	1	2026-03-16T14:31:20.439Z	2025-04-30T04:09:51.834Z	2026-03-27T16:50:11.224Z
seed-cons-000792	sophie.fournier@asso-moulins.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sophie	Fournier	conseiller	seed-str-000091	\N	1	2026-03-16T18:06:20.784Z	2025-08-21T08:54:12.913Z	2026-03-27T16:50:11.224Z
seed-cons-000793	nathalie.bouvier@asso-moulins.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nathalie	Bouvier	conseiller	seed-str-000091	\N	1	2026-03-15T11:22:26.295Z	2025-11-22T05:20:10.561Z	2026-03-27T16:50:11.224Z
seed-cons-000794	delphine.fournier@asso-nevers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Delphine	Fournier	admin_structure	seed-str-000092	\N	1	2026-03-25T13:24:02.631Z	2025-08-16T13:58:57.746Z	2026-03-27T16:50:11.224Z
seed-cons-000795	catherine.nicolas@asso-nevers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Catherine	Nicolas	conseiller	seed-str-000092	\N	1	2026-03-18T01:17:48.545Z	2025-10-13T10:51:35.669Z	2026-03-27T16:50:11.224Z
seed-cons-000796	celine.mercier@asso-nevers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Céline	Mercier	conseiller	seed-str-000092	\N	1	2026-03-20T15:22:36.370Z	2025-08-28T06:22:07.727Z	2026-03-27T16:50:11.224Z
seed-cons-000797	fatima.david@asso-nevers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	David	conseiller	seed-str-000092	\N	1	\N	2026-02-18T02:17:54.743Z	2026-03-27T16:50:11.224Z
seed-cons-000798	yannick.garnier@asso-nevers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Yannick	Garnier	conseiller	seed-str-000092	\N	1	\N	2025-06-13T17:58:17.127Z	2026-03-27T16:50:11.224Z
seed-cons-000799	abdel.martin@asso-nevers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Abdel	Martin	conseiller	seed-str-000092	\N	1	2026-03-25T13:16:17.857Z	2025-04-07T07:42:22.674Z	2026-03-27T16:50:11.224Z
seed-cons-000800	valerie.perrin@asso-nevers.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Valérie	Perrin	conseiller	seed-str-000092	\N	1	2026-03-16T06:38:58.656Z	2026-02-12T12:37:15.203Z	2026-03-27T16:50:11.224Z
seed-cons-000801	fatima.guerin@asso-privas.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	Guérin	admin_structure	seed-str-000093	\N	1	\N	2026-01-27T23:08:28.593Z	2026-03-27T16:50:11.224Z
seed-cons-000802	christine.moreau@asso-privas.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Christine	Moreau	conseiller	seed-str-000093	\N	1	2026-03-14T03:51:47.345Z	2025-06-25T09:06:20.976Z	2026-03-27T16:50:11.224Z
seed-cons-000803	michel.cisse@asso-privas.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Michel	Cissé	conseiller	seed-str-000093	\N	1	2026-03-12T17:00:43.229Z	2025-09-20T00:16:17.441Z	2026-03-27T16:50:11.224Z
seed-cons-000804	thomas.lefebvre@asso-privas.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Thomas	Lefebvre	conseiller	seed-str-000093	\N	1	\N	2025-05-10T00:02:52.961Z	2026-03-27T16:50:11.224Z
seed-cons-000805	celine.legrand@asso-privas.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Céline	Legrand	conseiller	seed-str-000093	\N	1	\N	2025-07-28T11:41:13.080Z	2026-03-27T16:50:11.224Z
seed-cons-000806	jean.andre@asso-saintl.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jean	André	admin_structure	seed-str-000094	\N	1	2026-03-13T04:22:30.631Z	2025-04-18T03:48:22.999Z	2026-03-27T16:50:11.224Z
seed-cons-000807	claire.benali@asso-saintl.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Claire	Benali	conseiller	seed-str-000094	\N	1	\N	2025-08-21T14:22:07.558Z	2026-03-27T16:50:11.224Z
seed-cons-000808	anne.durand@asso-saintl.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Anne	Durand	conseiller	seed-str-000094	\N	1	2026-03-20T14:51:01.362Z	2025-10-03T13:10:54.672Z	2026-03-27T16:50:11.224Z
seed-cons-000809	marc.petit@asso-saintl.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marc	Petit	conseiller	seed-str-000094	\N	1	\N	2025-04-10T08:45:17.514Z	2026-03-27T16:50:11.224Z
seed-cons-000810	fatima.garnier@asso-saintl.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	Garnier	conseiller	seed-str-000094	\N	1	2026-03-20T00:19:22.805Z	2025-09-19T17:24:41.204Z	2026-03-27T16:50:11.224Z
seed-cons-000811	fabien.perrin@asso-tulle.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fabien	Perrin	admin_structure	seed-str-000095	\N	1	2026-03-27T11:02:56.689Z	2026-01-08T09:15:38.996Z	2026-03-27T16:50:11.224Z
seed-cons-000812	nathalie.michel@asso-tulle.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nathalie	Michel	conseiller	seed-str-000095	\N	1	2026-03-16T10:24:38.081Z	2026-01-29T13:15:14.172Z	2026-03-27T16:50:11.224Z
seed-cons-000813	delphine.lefebvre@asso-tulle.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Delphine	Lefebvre	conseiller	seed-str-000095	\N	1	\N	2025-07-05T03:54:10.181Z	2026-03-27T16:50:11.224Z
seed-cons-000814	sophie.legrand@asso-tulle.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sophie	Legrand	conseiller	seed-str-000095	\N	1	2026-03-18T10:24:11.909Z	2026-01-04T09:13:04.474Z	2026-03-27T16:50:11.224Z
seed-cons-000815	marc.belkacem@asso-tulle.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Marc	Belkacem	conseiller	seed-str-000095	\N	1	2026-03-19T19:52:38.666Z	2025-05-27T23:51:32.102Z	2026-03-27T16:50:11.224Z
seed-cons-000816	valerie.bouvier@asso-tulle.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Valérie	Bouvier	conseiller	seed-str-000095	\N	1	2026-03-21T09:42:16.404Z	2025-10-06T20:48:21.819Z	2026-03-27T16:50:11.224Z
seed-cons-000817	abdel.kone@asso-tulle.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Abdel	Kone	conseiller	seed-str-000095	\N	1	2026-03-25T23:36:00.248Z	2025-04-07T19:20:21.106Z	2026-03-27T16:50:11.224Z
seed-cons-000818	claire.morin@asso-tulle.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Claire	Morin	super_admin	seed-str-000095	\N	1	2026-03-21T17:51:27.365Z	2025-06-13T17:51:45.452Z	2026-03-27T16:50:11.224Z
seed-cons-000819	fatima.lefebvre@asso-vesoul.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	Lefebvre	admin_structure	seed-str-000096	\N	1	\N	2026-02-21T09:56:32.292Z	2026-03-27T16:50:11.224Z
seed-cons-000820	abdel.rousseau@asso-vesoul.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Abdel	Rousseau	conseiller	seed-str-000096	\N	1	2026-03-13T01:56:25.793Z	2025-06-07T00:27:56.107Z	2026-03-27T16:50:11.224Z
seed-cons-000821	yannick.bertrand@asso-vesoul.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Yannick	Bertrand	conseiller	seed-str-000096	\N	1	\N	2025-08-30T05:28:18.151Z	2026-03-27T16:50:11.224Z
seed-cons-000822	abdel.gauthier@asso-vesoul.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Abdel	Gauthier	conseiller	seed-str-000096	\N	1	2026-03-13T16:46:49.362Z	2026-01-20T17:29:51.802Z	2026-03-27T16:50:11.224Z
seed-cons-000823	julien.haddad@asso-vesoul.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Julien	Haddad	conseiller	seed-str-000096	\N	1	2026-03-17T15:26:28.597Z	2025-04-27T01:55:29.411Z	2026-03-27T16:50:11.224Z
seed-cons-000824	catherine.thomas@asso-vesoul.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Catherine	Thomas	conseiller	seed-str-000096	\N	1	\N	2026-02-22T16:16:01.348Z	2026-03-27T16:50:11.224Z
seed-cons-000825	delphine.leroy@asso-vesoul.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Delphine	Leroy	conseiller	seed-str-000096	\N	1	2026-03-16T20:11:21.165Z	2025-04-08T20:18:00.934Z	2026-03-27T16:50:11.224Z
seed-cons-000826	claire.perrin@asso-vesoul.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Claire	Perrin	conseiller	seed-str-000096	\N	1	2026-03-19T11:45:15.432Z	2025-07-05T13:30:30.966Z	2026-03-27T16:50:11.224Z
seed-cons-000827	david.bernard@asso-vesoul.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	David	Bernard	conseiller	seed-str-000096	\N	1	2026-03-20T23:19:24.822Z	2025-04-02T20:21:06.315Z	2026-03-27T16:50:11.224Z
seed-cons-000828	isabelle.guerin@asso-vesoul.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Isabelle	Guérin	conseiller	seed-str-000096	\N	1	\N	2025-12-14T06:10:21.030Z	2026-03-27T16:50:11.224Z
seed-cons-000829	amina.robert@asso-cergy.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Amina	Robert	admin_structure	seed-str-000097	\N	1	2026-03-26T04:17:31.371Z	2025-06-15T13:46:25.261Z	2026-03-27T16:50:11.224Z
seed-cons-000830	claire.clement@asso-cergy.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Claire	Clément	conseiller	seed-str-000097	\N	1	2026-03-24T12:48:41.111Z	2025-06-06T13:41:10.955Z	2026-03-27T16:50:11.224Z
seed-cons-000831	karim.andre@asso-cergy.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Karim	André	conseiller	seed-str-000097	\N	1	2026-03-13T23:10:25.995Z	2025-11-29T19:50:01.601Z	2026-03-27T16:50:11.224Z
seed-cons-000832	fatima.francois@asso-cergy.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	François	conseiller	seed-str-000097	\N	1	2026-03-25T01:09:51.667Z	2025-06-11T13:19:38.550Z	2026-03-27T16:50:11.224Z
seed-cons-000833	pierre.thomas@asso-cergy.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Pierre	Thomas	conseiller	seed-str-000097	\N	1	2026-03-14T18:05:55.685Z	2025-09-15T21:50:04.638Z	2026-03-27T16:50:11.224Z
seed-cons-000834	nicolas.blanc@asso-cergy.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nicolas	Blanc	conseiller	seed-str-000097	\N	1	2026-03-25T20:25:47.429Z	2025-05-22T23:03:04.453Z	2026-03-27T16:50:11.224Z
seed-cons-000835	karim.perrin@asso-cergy.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Karim	Perrin	conseiller	seed-str-000097	\N	1	\N	2025-05-08T19:43:42.590Z	2026-03-27T16:50:11.224Z
seed-cons-000836	valerie.bertrand@asso-cergy.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Valérie	Bertrand	conseiller	seed-str-000097	\N	1	2026-03-17T16:10:38.990Z	2026-02-19T07:12:35.549Z	2026-03-27T16:50:11.224Z
seed-cons-000837	karim.henry@asso-vry.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Karim	Henry	admin_structure	seed-str-000098	\N	1	2026-03-19T21:33:46.376Z	2026-01-15T09:26:21.916Z	2026-03-27T16:50:11.224Z
seed-cons-000838	david.gauthier@asso-vry.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	David	Gauthier	conseiller	seed-str-000098	\N	1	2026-03-26T09:39:02.660Z	2025-06-10T22:10:07.191Z	2026-03-27T16:50:11.224Z
seed-cons-000839	stephane.bamba@asso-vry.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Stéphane	Bamba	conseiller	seed-str-000098	\N	1	2026-03-17T21:19:01.120Z	2025-05-10T22:34:18.098Z	2026-03-27T16:50:11.224Z
seed-cons-000840	yannick.simon@asso-vry.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Yannick	Simon	conseiller	seed-str-000098	\N	1	2026-03-21T04:10:20.803Z	2025-12-08T05:36:26.824Z	2026-03-27T16:50:11.224Z
seed-cons-000841	nathalie.morel@asso-vry.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nathalie	Morel	conseiller	seed-str-000098	\N	1	2026-03-20T20:32:37.821Z	2025-05-09T02:02:24.045Z	2026-03-27T16:50:11.224Z
seed-cons-000842	julien.belkacem@asso-crteil.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Julien	Belkacem	admin_structure	seed-str-000099	\N	1	2026-03-21T03:36:46.184Z	2025-06-03T22:05:27.304Z	2026-03-27T16:50:11.224Z
seed-cons-000843	jacques.robin@asso-crteil.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Jacques	Robin	conseiller	seed-str-000099	\N	1	2026-03-22T04:41:30.675Z	2025-11-20T08:40:09.019Z	2026-03-27T16:50:11.224Z
seed-cons-000844	celine.david@asso-crteil.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Céline	David	conseiller	seed-str-000099	\N	1	\N	2025-12-23T07:03:27.577Z	2026-03-27T16:50:11.224Z
seed-cons-000845	abdel.andre@asso-crteil.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Abdel	André	conseiller	seed-str-000099	\N	1	\N	2025-12-21T11:46:58.674Z	2026-03-27T16:50:11.224Z
seed-cons-000846	virginie.haddad@asso-crteil.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Virginie	Haddad	conseiller	seed-str-000099	\N	1	\N	2025-05-17T10:02:51.814Z	2026-03-27T16:50:11.224Z
seed-cons-000847	aurelie.belkacem@asso-crteil.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Aurélie	Belkacem	conseiller	seed-str-000099	\N	1	\N	2025-12-28T00:32:16.762Z	2026-03-27T16:50:11.224Z
seed-cons-000848	sylvie.laurent@asso-crteil.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sylvie	Laurent	conseiller	seed-str-000099	\N	1	2026-03-19T12:48:55.453Z	2025-05-02T18:40:13.547Z	2026-03-27T16:50:11.224Z
seed-cons-000849	fabien.rousseau@asso-crteil.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fabien	Rousseau	conseiller	seed-str-000099	\N	1	\N	2025-12-28T06:52:01.395Z	2026-03-27T16:50:11.224Z
seed-cons-000850	fatima.leroy@asso-crteil.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	Leroy	conseiller	seed-str-000099	\N	1	2026-03-20T16:07:41.714Z	2025-08-20T06:16:11.860Z	2026-03-27T16:50:11.224Z
seed-cons-000851	sebastien.fournier@asso-crteil.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Sébastien	Fournier	conseiller	seed-str-000099	\N	1	2026-03-16T03:30:14.779Z	2026-01-15T21:58:43.161Z	2026-03-27T16:50:11.224Z
seed-cons-000852	thomas.durand@asso-nanterre.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Thomas	Durand	admin_structure	seed-str-000100	\N	1	2026-03-15T11:56:06.173Z	2026-02-10T02:32:09.614Z	2026-03-27T16:50:11.224Z
seed-cons-000853	nathalie.richard@asso-nanterre.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Nathalie	Richard	conseiller	seed-str-000100	\N	1	2026-03-22T01:57:00.961Z	2026-02-05T21:42:09.164Z	2026-03-27T16:50:11.224Z
seed-cons-000854	claire.lefebvre@asso-nanterre.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Claire	Lefebvre	conseiller	seed-str-000100	\N	1	\N	2025-11-11T02:45:01.319Z	2026-03-27T16:50:11.224Z
seed-cons-000855	thomas.michel@asso-nanterre.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Thomas	Michel	conseiller	seed-str-000100	\N	1	2026-03-22T12:50:18.225Z	2025-08-21T09:52:10.019Z	2026-03-27T16:50:11.224Z
seed-cons-000856	aurelie.fournier@asso-nanterre.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Aurélie	Fournier	conseiller	seed-str-000100	\N	1	2026-03-26T02:44:45.167Z	2025-09-13T13:45:09.933Z	2026-03-27T16:50:11.224Z
seed-cons-000857	aurelie.bamba@asso-nanterre.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Aurélie	Bamba	conseiller	seed-str-000100	\N	1	\N	2025-08-03T03:15:13.462Z	2026-03-27T16:50:11.224Z
seed-cons-000858	fatima.fournier@asso-nanterre.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Fatima	Fournier	conseiller	seed-str-000100	\N	1	\N	2025-05-05T02:34:04.243Z	2026-03-27T16:50:11.224Z
seed-cons-000859	caroline.perrin@asso-nanterre.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Caroline	Perrin	conseiller	seed-str-000100	\N	1	2026-03-13T17:19:34.793Z	2025-10-29T22:27:12.966Z	2026-03-27T16:50:11.224Z
seed-cons-000860	valerie.laurent@asso-nanterre.fr	$2b$12$r1.l0dPJ2UdMJjQDpi2F1e42DyR1bcAhlNXL/FTC9JZUSH/6CTt9u	Valérie	Laurent	conseiller	seed-str-000100	\N	1	2026-03-23T10:02:45.368Z	2025-04-05T03:01:31.840Z	2026-03-27T16:50:11.224Z
19c7e6ce-cd6b-4df6-a6f1-09bd94bb1d21	marie.dupont@ml-paris15.fr	$2b$12$OZ5kdCYltHVvhs0bU0xD1u4QuOMUBGmGjzxFShKy2j6nO6xtLG5Dy	Marie	Dupont	conseiller	5a7e5324-468d-4d70-ab5f-6517f518c473	\N	1	\N	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
e0d19945-7ea9-4c05-9def-2e7621de0e64	jean.martin@cio-lyon.fr	$2b$12$OZ5kdCYltHVvhs0bU0xD1u4QuOMUBGmGjzxFShKy2j6nO6xtLG5Dy	Jean	Martin	conseiller	a20a3fa9-f9f2-4cb6-8c2f-68c2dac80c9e	\N	1	2026-04-02T17:17:16.261Z	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
fba8c822-beff-4dfd-8e1f-9d31f046ee46	nadia.belkacem@ml-paris15.fr	$2b$12$OZ5kdCYltHVvhs0bU0xD1u4QuOMUBGmGjzxFShKy2j6nO6xtLG5Dy	Nadia	Belkacem	admin_structure	5a7e5324-468d-4d70-ab5f-6517f518c473	\N	1	2026-03-31T10:20:07.608Z	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
2dadd93d-2091-44d4-aa7e-d84c38eeb9e3	sophie.laurent@e2c-lille.fr	$2b$12$OZ5kdCYltHVvhs0bU0xD1u4QuOMUBGmGjzxFShKy2j6nO6xtLG5Dy	Sophie	Laurent	conseiller	48f36ad0-047d-403b-a392-f9d921b3b877	\N	1	\N	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
2a2cede4-5ace-4157-81f7-9e1fa6aa1274	karim.benzema@ml-marseille.fr	$2b$12$OZ5kdCYltHVvhs0bU0xD1u4QuOMUBGmGjzxFShKy2j6nO6xtLG5Dy	Karim	Benzema	conseiller	seed-str-000002	\N	1	\N	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
14f30e79-dabc-4753-be60-bd3167f66e2c	claire.petit@paio-toulouse.fr	$2b$12$OZ5kdCYltHVvhs0bU0xD1u4QuOMUBGmGjzxFShKy2j6nO6xtLG5Dy	Claire	Petit	admin_structure	ad9dfc8f-abd7-456c-9ea8-f70025af08f8	\N	1	\N	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
65036100-316a-4541-b4ff-64bf8ad49761	romain.garcia@ml-bordeaux.fr	$2b$12$OZ5kdCYltHVvhs0bU0xD1u4QuOMUBGmGjzxFShKy2j6nO6xtLG5Dy	Romain	Garcia	conseiller	seed-str-000009	\N	1	\N	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
096ac51f-e80b-4432-b3ee-fd51aa1c8e36	amina.diallo@cio-nantes.fr	$2b$12$OZ5kdCYltHVvhs0bU0xD1u4QuOMUBGmGjzxFShKy2j6nO6xtLG5Dy	Amina	Diallo	conseiller	1a78559d-8632-4638-9f2f-9ae15954ce90	\N	1	\N	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
f9866a4b-30aa-4359-9dc5-d00eaec88cef	thomas.muller@e2c-strasbourg.fr	$2b$12$OZ5kdCYltHVvhs0bU0xD1u4QuOMUBGmGjzxFShKy2j6nO6xtLG5Dy	Thomas	Muller	conseiller	480a2d13-aa06-4d26-91d9-7a6f243e27e5	\N	1	\N	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
877c3cf4-a0bc-41f0-80e3-c1f9d217ae72	sylvie.muller@ml-strasbourg.fr	$2b$12$OZ5kdCYltHVvhs0bU0xD1u4QuOMUBGmGjzxFShKy2j6nO6xtLG5Dy	Sylvie	Muller	admin_structure	seed-str-000007	\N	1	\N	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
3b265004-4aa4-4f6f-8fa8-37e315ca8122	pierre.schneider@ml-strasbourg.fr	$2b$12$OZ5kdCYltHVvhs0bU0xD1u4QuOMUBGmGjzxFShKy2j6nO6xtLG5Dy	Pierre	Schneider	conseiller	seed-str-000007	\N	1	\N	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
ae0a3490-43f2-4c40-bc5f-e558d6e64ccc	fatima.benali@ml-strasbourg.fr	$2b$12$OZ5kdCYltHVvhs0bU0xD1u4QuOMUBGmGjzxFShKy2j6nO6xtLG5Dy	Fatima	Benali	conseiller	seed-str-000007	\N	1	\N	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
b5d8ca2d-b8ed-405d-9c54-02ccb666c242	yann.legall@cio-rennes.fr	$2b$12$OZ5kdCYltHVvhs0bU0xD1u4QuOMUBGmGjzxFShKy2j6nO6xtLG5Dy	Yann	Le Gall	admin_structure	aaefcf2b-54db-4aa2-a4c6-a9c88834d717	\N	1	\N	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
aad4f9d1-3ad5-4c66-b47a-2de0fc357e09	marine.kerouac@cio-rennes.fr	$2b$12$OZ5kdCYltHVvhs0bU0xD1u4QuOMUBGmGjzxFShKy2j6nO6xtLG5Dy	Marine	Kérouac	conseiller	aaefcf2b-54db-4aa2-a4c6-a9c88834d717	\N	1	\N	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
937ff9fe-801e-42a6-8a53-354aa5aee9a1	david.perrin@ml-grenoble.fr	$2b$12$OZ5kdCYltHVvhs0bU0xD1u4QuOMUBGmGjzxFShKy2j6nO6xtLG5Dy	David	Perrin	admin_structure	seed-str-000016	\N	1	\N	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
d637324f-4412-45b0-b13d-f4ee0e538f7f	amina.diallo@ml-grenoble.fr	$2b$12$OZ5kdCYltHVvhs0bU0xD1u4QuOMUBGmGjzxFShKy2j6nO6xtLG5Dy	Amina	Diallo	conseiller	seed-str-000016	\N	1	\N	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
0e3fb00b-ffa5-421c-9612-6a48c7715d8b	lucas.fontaine@ml-grenoble.fr	$2b$12$OZ5kdCYltHVvhs0bU0xD1u4QuOMUBGmGjzxFShKy2j6nO6xtLG5Dy	Lucas	Fontaine	conseiller	seed-str-000016	\N	1	\N	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
3ab97fff-e809-497d-80cc-d55db6f3743d	elise.robert@ml-nantes.fr	$2b$12$OZ5kdCYltHVvhs0bU0xD1u4QuOMUBGmGjzxFShKy2j6nO6xtLG5Dy	Élise	Robert	conseiller	1a78559d-8632-4638-9f2f-9ae15954ce90	\N	1	\N	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
96870ab2-e11c-4069-b8e4-e175f258eea7	aurelie.moreau@ml-bords-de-marne.fr	$2b$10$k.4.Hcg9P.8bLhmZctC.ZeTn.0WZ0wOMfxFJgM9THHmW90eSjoi5W	Aurélie	Moreau	conseiller	8a44f6df-a375-4c91-ad53-68e873206d3a	\N	1	\N	2026-03-31T10:23:30.270Z	2026-03-31T10:23:30.270Z
ee65ceba-fc1e-4a83-870c-89a954591359	thomas.petit@ml-bords-de-marne.fr	$2b$10$k.4.Hcg9P.8bLhmZctC.ZeTn.0WZ0wOMfxFJgM9THHmW90eSjoi5W	Thomas	Petit	conseiller	8a44f6df-a375-4c91-ad53-68e873206d3a	\N	1	\N	2026-03-31T10:23:30.270Z	2026-03-31T10:23:30.270Z
ac1cb3cb-8668-4c2f-9599-320da7b43e15	fatima.bensaid@ml-bords-de-marne.fr	$2b$10$k.4.Hcg9P.8bLhmZctC.ZeTn.0WZ0wOMfxFJgM9THHmW90eSjoi5W	Fatima	Bensaid	conseiller	8a44f6df-a375-4c91-ad53-68e873206d3a	\N	1	\N	2026-03-31T10:23:30.270Z	2026-03-31T10:23:30.270Z
13ba90b3-aeb5-418e-a143-db4ecfbc07b9	julien.robert@ml-bords-de-marne.fr	$2b$10$k.4.Hcg9P.8bLhmZctC.ZeTn.0WZ0wOMfxFJgM9THHmW90eSjoi5W	Julien	Robert	conseiller	8a44f6df-a375-4c91-ad53-68e873206d3a	\N	1	\N	2026-03-31T10:23:30.270Z	2026-03-31T10:23:30.270Z
92cac234-afe0-4925-93aa-bde9db7874c9	camille.durand@ml-bords-de-marne.fr	$2b$10$k.4.Hcg9P.8bLhmZctC.ZeTn.0WZ0wOMfxFJgM9THHmW90eSjoi5W	Camille	Durand	conseiller	8a44f6df-a375-4c91-ad53-68e873206d3a	\N	1	\N	2026-03-31T10:23:30.270Z	2026-03-31T10:23:30.270Z
10c7c580-87ee-4cfa-b47a-283c1e4f7fff	claire.martin@ml-orleans.fr	$2b$10$34ozxkAkUZvppGNsWo8h7.AqgnfGXzY2WZFuZ0otfItDwIesxpTP.	Claire	Martin	conseiller	d2f39531-15c3-472e-b0cb-f70ce8e5f7ac	\N	1	\N	2026-03-31T12:15:00.981Z	2026-03-31T12:15:00.981Z
deda4af6-2974-43e8-84b6-653b04a96d18	romain.garcia@ml-orleans.fr	$2b$10$34ozxkAkUZvppGNsWo8h7.AqgnfGXzY2WZFuZ0otfItDwIesxpTP.	Romain	Garcia	conseiller	d2f39531-15c3-472e-b0cb-f70ce8e5f7ac	\N	1	\N	2026-03-31T12:15:00.981Z	2026-03-31T12:15:00.981Z
1a0c96ab-5678-4c64-bf58-336405393d13	sarah.benali@ml-orleans.fr	$2b$10$34ozxkAkUZvppGNsWo8h7.AqgnfGXzY2WZFuZ0otfItDwIesxpTP.	Sarah	Benali	conseiller	d2f39531-15c3-472e-b0cb-f70ce8e5f7ac	\N	1	\N	2026-03-31T12:15:00.981Z	2026-03-31T12:15:00.981Z
dc414da6-8c60-429b-b0f2-3bc3e3781930	lucas.dupont@ml-orleans.fr	$2b$10$34ozxkAkUZvppGNsWo8h7.AqgnfGXzY2WZFuZ0otfItDwIesxpTP.	Lucas	Dupont	conseiller	d2f39531-15c3-472e-b0cb-f70ce8e5f7ac	\N	1	\N	2026-03-31T12:15:00.981Z	2026-03-31T12:15:00.981Z
38631b01-9d23-47dc-be1f-f82126c2a72c	fl@fondation-jae.org	$2b$10$k.4.Hcg9P.8bLhmZctC.ZeTn.0WZ0wOMfxFJgM9THHmW90eSjoi5W	Frédéric	Leroy	admin_structure	8a44f6df-a375-4c91-ad53-68e873206d3a	\N	1	2026-04-03T09:31:11.830Z	2026-03-31T10:23:30.270Z	2026-03-31T10:23:30.270Z
287c9b3a-c93e-4d89-ade3-e56b1059212e	sc@fondation-jae.org	$2b$10$34ozxkAkUZvppGNsWo8h7.AqgnfGXzY2WZFuZ0otfItDwIesxpTP.	Serge	Chvetzoff	admin_structure	d2f39531-15c3-472e-b0cb-f70ce8e5f7ac	\N	1	2026-04-05T06:57:49.056Z	2026-03-31T12:15:00.981Z	2026-03-31T12:15:00.981Z
f1da8fa7-4ce1-49da-89f1-3888a2ace76e	admin@fondation-jae.org	$2b$12$OZ5kdCYltHVvhs0bU0xD1u4QuOMUBGmGjzxFShKy2j6nO6xtLG5Dy	Admin	JAE	super_admin	31395dae-b34b-4d39-8b80-23f2671c1b02	\N	1	2026-04-03T12:36:03.740Z	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
\.


--
-- Data for Name: conversation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.conversation (id, utilisateur_id, titre, statut, origine, nb_messages, phase, duree_secondes, cree_le, mis_a_jour_le) FROM stdin;
c559ae83-4e02-4007-8014-89cc520193c3	764d8257-1e32-4045-998f-185c24fe3875	Conversation de Jade	active	direct	6	accroche	832	2026-03-19T09:07:34.201Z	2026-04-02T23:12:33.540Z
c48e6099-ffba-48ed-8a3e-c6ac28d39e5f	972234d9-d1ac-4e99-9ef4-dd2da9d447f3	Conversation de Amina	active	direct	6	exploration	858	2026-03-16T02:57:53.449Z	2026-04-02T23:12:33.540Z
1bc321ff-01de-43ae-9349-4c4334a7b918	cb903f71-6b96-4706-97be-bb2018cebe38	Conversation de Rayan	active	direct	9	accroche	1304	2026-03-18T03:13:35.534Z	2026-04-02T23:12:33.540Z
4651d2fd-29a6-458d-b8b5-8988d6952302	7266cb6a-9155-4626-99ed-cab1b8577f19	Conversation de Wassim	active	direct	9	accroche	1220	2026-03-23T10:19:53.693Z	2026-04-02T23:12:33.540Z
953fc9f2-aadb-4764-842c-0c8fc5eb8a97	2f9d92c8-7a48-4279-bae9-41de1912655c	Conversation de Romane	active	direct	6	projection	911	2026-03-26T03:29:33.589Z	2026-04-02T23:12:33.540Z
91d3ac98-5137-44f2-8852-031fbd16a96b	7278ccaf-7b99-43cc-bb98-381ec56db7f7	Conversation de Pauline	active	direct	4	exploration	637	2026-03-17T05:56:55.991Z	2026-04-02T23:12:33.540Z
816d6174-ea74-4eea-ae9d-7974cebd1f3a	ba4fe67d-0997-4cfb-adfa-ff0a82994dc2	Conversation de Alice	active	direct	8	projection	1194	2026-03-25T05:37:51.336Z	2026-04-02T23:12:33.540Z
50bba20c-ed93-4040-aa0d-41917d175d27	23e431f7-de11-4c59-85a7-43fd04cc3d5c	Conversation de Victor	active	direct	8	exploration	1221	2026-03-19T19:24:50.596Z	2026-04-02T23:12:33.540Z
cd4ee462-127d-4dc7-8c28-1dce077d8ab1	ca7ebcaa-57d6-4622-bd06-706e8e5883aa	Conversation de Louis	active	direct	6	projection	776	2026-03-14T06:43:58.852Z	2026-04-02T23:12:33.540Z
7babd6e6-482d-4699-928c-143f5a764e10	b9c29de8-174e-42b3-a365-d0898e968f0e	Conversation de Maxime	active	direct	4	exploration	744	2026-03-23T12:07:39.189Z	2026-04-02T23:12:33.540Z
6202684c-c271-4df2-a118-111b0fe9e129	61a285fa-0c7e-4da4-966c-6a3848a2ed02	Conversation de Clara	active	direct	6	exploration	826	2026-03-24T14:02:25.235Z	2026-04-02T23:12:33.540Z
faf847ef-49cb-45dd-b947-9bb6fd3a2ee6	0cb1645c-8fec-4b18-b5b9-547e72d31227	Conversation de Ethan	active	direct	6	projection	933	2026-04-02T17:44:10.735Z	2026-04-02T23:12:33.540Z
7e2bb3c0-6e44-4452-90df-f3dde0997039	9f6b28a1-d107-4fb1-b90a-cad220cd1f6e	Conversation de Margot	active	direct	9	accroche	1209	2026-03-16T05:33:58.902Z	2026-04-02T23:12:33.540Z
bd3bc73e-d248-436a-99f4-d42b197dcf10	c3a6591b-04c7-445c-966b-2aed6292f2b4	Conversation de Mélissa	active	direct	6	projection	759	2026-03-19T08:40:27.229Z	2026-04-02T23:12:33.540Z
e8e08121-4ef0-4780-a45c-32f837a74aba	68538956-a26d-4273-b38a-c3d3ce0c3908	Conversation de Chloé	active	direct	6	projection	905	2026-03-18T07:50:52.826Z	2026-04-02T23:12:33.540Z
d7aeb707-de9f-4a98-9331-8a1983a64ec6	c2e8c6bb-2929-4f5f-9265-c2ca2fedd072	Conversation de Paul	active	direct	6	accroche	984	2026-03-26T20:47:14.231Z	2026-04-02T23:12:33.540Z
49bb3f73-f489-429d-ba5f-7b732012c800	e26d46f1-0339-4e3e-8efe-a938c49b3d56	Conversation de Lucie	active	direct	6	projection	789	2026-03-28T11:44:16.485Z	2026-04-02T23:12:33.540Z
ef596988-1d77-436c-a0b9-d5f5788ed3e6	033e1119-beb8-43ed-8605-4dd0532dba07	Conversation de Charlotte	active	direct	8	accroche	1223	2026-03-18T08:07:02.008Z	2026-04-02T23:12:33.540Z
62c8daa3-8746-493c-aff3-bfbf41fc304e	9704c08b-0b24-4788-80cd-d0be5da1fd99	Conversation de Chloé	active	direct	6	accroche	814	2026-03-31T02:44:41.363Z	2026-04-02T23:12:33.540Z
59d6d2e6-bedc-404a-9413-cecb90787506	3f3181a4-8aaa-47d0-af07-bb3a9ed3d613	Conversation de Lina	active	direct	4	exploration	698	2026-03-25T00:03:09.588Z	2026-04-02T23:12:33.540Z
cf3c6564-6489-4b06-a458-1602504fbd29	d1e3307b-406a-42c6-818b-cf1adb2cfa6b	Conversation de Théo	active	direct	9	exploration	1352	2026-03-28T09:10:53.824Z	2026-04-02T23:12:33.540Z
97e03edc-31a4-4cc2-8da7-096c3b1fe006	59ab8d32-27ca-476f-a994-f5e0063dae24	Conversation de Amina	active	direct	9	accroche	1138	2026-04-01T07:07:56.948Z	2026-04-02T23:12:33.540Z
84d5d519-eb6c-4e0e-af5c-ce154e0085ad	a7f8d90a-2e64-4184-b7d1-a706970f9628	Conversation de Gabriel	active	direct	8	exploration	1009	2026-04-02T06:52:42.325Z	2026-04-02T23:12:33.540Z
1841458a-0eff-453c-8171-7d444eab05a9	59e3d40f-12de-49c4-b565-020bd233b1a8	Conversation de Karim	active	direct	8	exploration	1058	2026-03-22T04:59:05.896Z	2026-04-02T23:12:33.540Z
9a29c307-388d-4c74-8799-034eb9baee0b	ef2fa34b-1555-4961-89c8-5af4b1ed7eed	Conversation de Mehdi	active	direct	4	accroche	710	2026-03-27T10:26:22.607Z	2026-04-02T23:12:33.540Z
8340d3da-c1b1-4fc7-84a0-daa1f777ab9a	6318fc54-b834-406f-a11f-ca365a386424	Conversation de Anaïs	active	direct	9	accroche	1269	2026-03-16T04:15:15.242Z	2026-04-02T23:12:33.540Z
47c376e7-5ef2-4df2-810d-1513360b90d1	c739076c-0035-4abd-8ae9-da6ae3d17485	Conversation de Axel	active	direct	6	accroche	830	2026-03-24T22:04:11.505Z	2026-04-02T23:12:33.540Z
45ebe672-80ff-4084-a87f-40d6968e2de1	d4b3c044-ebbd-4c2f-b30b-7845fa36d281	Conversation de Ethan	active	direct	4	projection	736	2026-03-20T17:24:01.697Z	2026-04-02T23:12:33.540Z
c58397cf-8e8d-4f46-b2c7-f49a406dd7ea	0420c1db-a7eb-4f20-a244-f242e87f679b	Conversation de Alice	active	direct	8	exploration	1177	2026-03-19T00:43:20.173Z	2026-04-02T23:12:33.540Z
a4e2de8b-347a-46ec-993c-cf7ec269087b	3f13ff28-8fac-4e5f-9142-a9c3412fa4f5	Conversation de Victor	active	direct	9	accroche	1162	2026-03-29T04:35:37.920Z	2026-04-02T23:12:33.540Z
4b18a730-e932-455d-a8d7-004303d61beb	97ad5524-3180-468f-bbb1-bfab8cc9f54a	Conversation de Arthur	active	direct	6	exploration	754	2026-04-02T13:22:48.536Z	2026-04-02T23:12:33.540Z
f773dc9f-db41-42ca-820d-92d3d70ec193	863c92b1-6896-4bfd-a5bd-bb6c5ae2480b	Conversation de Noah	active	direct	6	projection	987	2026-03-23T12:59:11.186Z	2026-04-02T23:12:33.540Z
dcd1a20b-d90f-48eb-ba94-2db3210f4170	e0142f18-d265-4280-8aff-f90d771130f5	Conversation de Romane	active	direct	4	projection	771	2026-03-20T02:11:34.460Z	2026-04-02T23:12:33.540Z
b168e865-1774-4151-8df9-0a39e0e8afc3	5050641e-a789-4676-b22a-a7c807dfeafe	Conversation de Léo	active	direct	4	projection	573	2026-03-26T19:40:44.511Z	2026-04-02T23:12:33.540Z
9303921c-f989-4752-a383-42e7e5acb424	769ebb73-7f9d-4f98-8a10-ab5149b85dfb	Conversation de Zoé	active	direct	6	exploration	828	2026-03-30T07:48:46.692Z	2026-04-02T23:12:33.540Z
4ccd48d5-3579-4ee3-bcc8-68a668039ec2	f20c171e-e75e-4c5f-98dd-b82593009008	Conversation de Lina	active	direct	6	exploration	786	2026-03-23T11:33:06.591Z	2026-04-02T23:12:33.540Z
50b86a5d-a33d-43ea-9ed0-319561f19084	db073130-2085-4b0d-94f5-0d32fa385953	Conversation de Sarah	active	direct	4	exploration	707	2026-03-21T16:57:16.214Z	2026-04-02T23:12:33.540Z
31308a5f-110e-499e-bb60-bee5000e4eb0	b711deab-6ff4-46ed-a24f-1110c1356214	Conversation de Yanis	active	direct	6	projection	762	2026-03-17T22:42:37.475Z	2026-04-02T23:12:33.540Z
67cc111a-a998-4d87-ac46-1fef4fbccdc8	fe350604-7636-4e7a-bdd8-1d0c6a6a57ef	Conversation de Yasmine	active	direct	8	projection	1225	2026-03-15T02:46:27.572Z	2026-04-02T23:12:33.540Z
92fd429a-8295-414a-8329-656c3c8f956e	d40c1da4-481c-487b-948e-fc6e25bb6b7f	Conversation de Léo	active	direct	9	exploration	1258	2026-03-14T21:57:27.135Z	2026-04-02T23:12:33.540Z
72cc3b70-93fc-40fc-a2d0-57fc8e392bc7	efde489a-d530-4ecf-aeb9-0f04c194bcfa	Conversation de Margot	active	direct	9	accroche	1259	2026-03-14T06:16:48.742Z	2026-04-02T23:12:33.540Z
5ef5f366-ee53-4aec-8b2b-a9dfffe61926	d7a6d492-3ec7-49a2-b646-1bbf450fd0ae	Conversation de Kylian	active	direct	4	accroche	599	2026-03-19T21:39:17.656Z	2026-04-02T23:12:33.540Z
6bdc200c-dc56-429b-9d38-3bcf1a98be97	e8b0ae99-38b3-41cd-99ac-fec8c013112b	Conversation de Enzo	active	direct	8	accroche	1201	2026-04-02T19:57:22.648Z	2026-04-02T23:12:33.540Z
d1d9cb59-383d-4dab-beb9-6fcac624adca	824e1e50-207b-4f86-847d-249323ef280d	Conversation de Romane	active	direct	8	accroche	1147	2026-04-01T00:38:43.762Z	2026-04-02T23:12:33.540Z
df374ad4-44db-46fb-9ade-202adaeed2c8	96c3f06b-0783-4b28-921c-13f007d3b57f	Conversation de Laura	active	direct	6	exploration	882	2026-03-22T18:12:13.972Z	2026-04-02T23:12:33.540Z
fae22fe0-fa9b-4124-b1a9-7bc169b844d7	32061828-987b-442c-843e-557392375abc	Conversation de Léo	active	direct	6	accroche	982	2026-03-24T02:51:40.714Z	2026-04-02T23:12:33.540Z
a5ac1744-7fcd-4c00-b8bb-88b08d6ea057	a41d007f-59cb-418e-a9f3-0a804c111893	Conversation de Julie	active	direct	6	accroche	946	2026-03-31T23:12:04.898Z	2026-04-02T23:12:33.540Z
a95b396e-10bf-4195-a543-576922d8473e	fe7157fd-18c6-41fa-aba6-4981b60d2721	Conversation de Enzo	active	direct	6	exploration	966	2026-03-15T21:59:39.782Z	2026-04-02T23:12:33.540Z
08a3d13d-92fe-46d6-83b3-150d60c49a99	830bc3e5-d2e7-45b6-96a8-736fd706a8b2	Conversation de Lucie	active	direct	9	accroche	1284	2026-03-30T01:54:18.774Z	2026-04-02T23:12:33.540Z
3623602e-7741-45ff-8581-34cbf8e0f067	41e2cec6-b7e3-435c-ba0a-e2373bbf4adb	Conversation de Nour	active	direct	6	accroche	798	2026-03-20T02:38:55.824Z	2026-04-02T23:12:33.540Z
925aaf7b-150e-4ea8-a900-0c38e1e58955	2c7ba8e3-c80a-45ef-ac3f-635148674432	Conversation de Rayan	active	direct	8	projection	990	2026-03-21T20:18:59.998Z	2026-04-02T23:12:33.540Z
d18b219c-2448-406c-9c24-957ce9ab9e80	cfe6a6c0-ad96-442c-9804-e1048cc855cb	Conversation de Jules	active	direct	4	exploration	712	2026-03-28T15:25:34.206Z	2026-04-02T23:12:33.540Z
3c234fcd-b64c-4d00-83a2-a76dbb52a612	56d07aed-9bc9-4b99-9f6b-22eb71db1720	Conversation de Mélissa	active	direct	6	accroche	1020	2026-03-30T03:09:37.319Z	2026-04-02T23:12:33.540Z
b23b3443-c5b9-4b46-95de-adcd74f83c44	5f529811-2674-42ef-8dba-66cc01dda263	Conversation de Marie	active	direct	8	accroche	1142	2026-03-24T10:10:52.183Z	2026-04-02T23:12:33.540Z
08114740-fe86-4783-a608-40ef53a36055	ec5d2b4a-75a0-49f3-bfb3-39dbb0cdddf0	Conversation de Wassim	active	direct	6	projection	806	2026-03-30T05:20:01.947Z	2026-04-02T23:12:33.540Z
125f5d30-959f-455e-9d6f-7e96367358e3	5dcfa146-fe4b-45c7-8668-fca724591905	Conversation de Ethan	active	direct	6	accroche	932	2026-03-27T19:32:44.551Z	2026-04-02T23:12:33.540Z
05248ddf-76f6-45c8-9b8d-11243b6ab6fd	a7d7571c-7589-4cd5-9910-d7b95d25732f	Conversation de Ibrahim	active	direct	6	accroche	976	2026-03-18T22:54:39.286Z	2026-04-02T23:12:33.540Z
05d721f8-03b7-4af6-af08-91beaca5691c	7b8ccdf8-5524-4f1b-b35c-8bc337dc685f	Conversation de Maxime	active	direct	9	projection	1173	2026-03-23T13:50:52.636Z	2026-04-02T23:12:33.540Z
2507569e-f737-4aa3-a220-cd8a1bd9f335	aefcd229-ae2e-443f-9a4a-1464dbcd4ab1	Conversation de Victor	active	direct	9	exploration	1298	2026-03-24T07:42:15.564Z	2026-04-02T23:12:33.540Z
d4703d7e-108e-4db9-b871-7e28dba9787d	52baa462-4e8f-47de-b651-02b49215c6f4	Conversation de Amina	active	direct	4	projection	727	2026-03-29T17:44:42.835Z	2026-04-02T23:12:33.540Z
30a59498-e093-4270-a752-ca53c76f5070	27ef7d2f-62ef-4934-9f80-95e490e00000	Conversation de Nina	active	direct	6	exploration	823	2026-03-30T11:36:09.840Z	2026-04-02T23:12:33.540Z
dc9fed84-e8d2-49bf-b17c-61ef5a13d9df	a6b61108-5b88-49fa-af98-24424716fa35	Conversation de Sacha	active	direct	6	projection	935	2026-03-21T00:33:40.075Z	2026-04-02T23:12:33.540Z
cf77dc1e-1740-4168-96a9-5d32d1dec59d	6ac697a3-4998-4ced-a765-7f2891cd6e3a	Conversation de Jules	active	direct	8	accroche	1174	2026-03-29T21:31:07.101Z	2026-04-02T23:12:33.540Z
86faac26-c538-43d8-b377-e2ad0db5466d	25643329-c5b1-4f2e-a95c-6b40dbffea4d	Conversation de Raphaël	active	direct	9	projection	1243	2026-03-19T19:59:08.948Z	2026-04-02T23:12:33.540Z
52bf0381-b86b-4eba-b670-8e093ee4b16d	5654e9f9-7355-4fd7-8f5f-3e50da717be7	Conversation de Léa	active	direct	6	projection	852	2026-03-19T09:27:07.072Z	2026-04-02T23:12:33.540Z
9b843254-9be3-44a6-a1c1-6ff57e46d9f3	df613825-3a7a-4445-8c19-cc386f7b8290	Conversation de Yasmine	active	direct	6	projection	852	2026-03-14T19:02:29.944Z	2026-04-02T23:12:33.540Z
ad0b7d3b-acec-4393-98a6-4398dd5eb695	83f10d16-4f0d-4012-9163-21b1605ae47a	Conversation de Rayan	active	direct	9	projection	1149	2026-03-28T19:27:50.838Z	2026-04-02T23:12:33.540Z
5e9d4afc-0fe0-4325-ae40-4f323d6daf27	0e6a72df-0093-46ae-a343-10e6f4f209c0	Conversation de Théo	active	direct	8	projection	1048	2026-03-19T00:00:56.444Z	2026-04-02T23:12:33.540Z
9c0039bc-ce29-4f34-bcad-082bd6ca1e76	4b042b4b-896a-4463-ab08-33ff459f1c73	Conversation de Inès	active	direct	6	projection	970	2026-03-31T08:46:58.352Z	2026-04-02T23:12:33.540Z
9af10d00-df7d-4d4d-a08f-1b09cad6ace8	649cb386-6ef2-44e0-9dba-1e78dd440243	Conversation de Clara	active	direct	9	projection	1287	2026-04-01T18:27:50.059Z	2026-04-02T23:12:33.540Z
cd11b20f-0afb-4306-9409-cbb366a1b0b2	3e840809-f9b1-47f3-93be-3398b400fe8e	Conversation de Sarah	active	direct	4	exploration	633	2026-03-24T20:51:41.112Z	2026-04-02T23:12:33.540Z
d6b414e1-2399-4a5b-b9c3-ebb1a631f1aa	9142af93-5443-4882-9578-1dddbdaa388a	Conversation de Lucie	active	direct	9	exploration	1359	2026-03-26T14:17:52.268Z	2026-04-02T23:12:33.540Z
b101d0fb-7a8a-44bd-b204-c38825bf0213	86dacd72-5e1e-4495-9068-9779ffefa10c	Conversation de Sofia	active	direct	8	exploration	1160	2026-03-14T18:42:48.780Z	2026-04-02T23:12:33.540Z
d0e92ed7-9ebd-4922-9f8b-97d084d05067	3bad7b59-de8a-4b2c-8a06-56483c74b4fa	Conversation de Karim	active	direct	9	projection	1114	2026-03-29T15:10:44.969Z	2026-04-02T23:12:33.540Z
f4ff3cce-455e-4450-80a3-693f7602b1ae	9d5363de-631a-4f79-9fca-94651b0f8352	Conversation de Anaïs	active	direct	9	exploration	1312	2026-03-18T07:20:08.622Z	2026-04-02T23:12:33.540Z
9c57442c-b898-40e5-ad25-c6770ad015f7	49868a7f-1025-45bf-b4d7-e6ede2711cda	Conversation de Wassim	active	direct	8	projection	1220	2026-03-29T23:19:18.462Z	2026-04-02T23:12:33.540Z
84502ac1-28ba-4380-96fd-843d3255797a	5b73a99f-d7fa-4edf-84a8-96823a3b3d84	Conversation de Inès	active	direct	6	accroche	955	2026-03-25T05:35:47.647Z	2026-04-02T23:12:33.540Z
450017e5-cbbe-4c4b-9496-b64a1f13cbb9	b2085c2d-d12d-47a5-bea3-c265176ab076	Conversation de Nour	active	direct	4	accroche	644	2026-03-17T08:12:32.373Z	2026-04-02T23:12:33.540Z
8cd85f06-611f-4712-8f7b-8f824c3798f1	fc2eb61c-9799-4dcb-9ef7-bf8cdbb94956	Conversation de Laura	active	direct	8	exploration	1249	2026-03-26T19:23:42.909Z	2026-04-02T23:12:33.540Z
bedd0c0a-0ff7-4d99-a525-92bc1e5d0e91	916e2ed3-1aad-46a0-9aac-05a2518dd456	Conversation de Laura	active	direct	9	accroche	1295	2026-03-17T22:38:54.144Z	2026-04-02T23:12:33.540Z
658d5532-3e36-47f6-97c7-6c700183927c	247d8768-1e5b-4ab5-b294-cdeb91ae9b93	Conversation de Kylian	active	direct	6	projection	1013	2026-03-21T19:37:23.964Z	2026-04-02T23:12:33.540Z
180fdb3f-ed02-480f-b347-79a48ce1f446	650df64d-603e-4912-9cfe-50543d8239b5	Conversation de Nathan	active	direct	6	exploration	822	2026-03-30T03:12:45.697Z	2026-04-02T23:12:33.540Z
c760aa4a-62fb-498e-b9dc-6c47cd10b9b9	509e7d9a-3349-4453-bc18-6a81b2bf4a17	Conversation de Adam	active	direct	6	exploration	756	2026-03-20T18:37:14.475Z	2026-04-02T23:12:33.540Z
bc94bc5a-4353-4ed2-b4b8-cc68f9651e54	03f3859c-31bd-4e4d-81a1-573aaf309145	Conversation de Gabriel	active	direct	4	exploration	515	2026-03-16T17:52:20.714Z	2026-04-02T23:12:33.540Z
6fb86f84-92ba-4985-9b71-5c446e992c84	3ad6a440-6e8d-4307-9b10-9dacf9670bfb	Conversation de Léo	active	direct	6	exploration	925	2026-03-29T00:04:24.502Z	2026-04-02T23:12:33.540Z
c4efd75f-14ea-4fc7-9fa0-eda211401af4	9ba1501b-34fe-4484-a5c8-f144280a6ee2	Conversation de Nina	active	direct	8	projection	1255	2026-03-13T23:39:16.974Z	2026-04-02T23:12:33.540Z
22f31233-0696-4cbf-9997-64c84072bd09	796f63fc-3464-45ce-9608-d1010076bd86	Conversation de Margot	active	direct	6	accroche	936	2026-03-17T23:26:28.536Z	2026-04-02T23:12:33.540Z
ab9800f8-87cf-4b27-a71a-edf29ac78b4d	b98ee361-a65a-470b-9948-bc5936c2e793	Conversation de Inès	active	direct	4	projection	778	2026-03-17T01:36:53.004Z	2026-04-02T23:12:33.540Z
918a1bc0-8eac-4bec-8b7e-1a8363b7a507	ba58cedd-611e-4410-b70e-6c30fec6308f	Conversation de Pauline	active	direct	6	accroche	953	2026-03-29T03:31:30.819Z	2026-04-02T23:12:33.540Z
2a180879-d2fc-4c06-a2d8-0118839e1b72	180d85fe-0bec-4109-9475-8aef5155137f	Conversation de Lucas	active	direct	6	exploration	797	2026-03-17T14:08:17.840Z	2026-04-02T23:12:33.540Z
61d9df83-b9c1-4793-a495-25458108dbce	0f3ede6e-8e7b-4670-aa0e-ad99f7b84295	Conversation de Karim	active	direct	9	projection	1129	2026-03-19T11:47:43.551Z	2026-04-02T23:12:33.540Z
a4cdae49-228d-4e93-95be-dab18342787f	df919098-a633-4505-91f8-47c7da95378e	Conversation de Anaïs	active	direct	8	projection	1109	2026-03-31T16:46:33.132Z	2026-04-02T23:12:33.540Z
da9efbee-78f0-4640-9f33-0108ef4c1184	de9aea9c-3d5d-452d-aacc-3e50d9f47ab7	Conversation de Sacha	active	direct	4	projection	646	2026-03-28T21:36:10.918Z	2026-04-02T23:12:33.540Z
908ef078-80a1-46ba-8da8-1ea0ee0a1aa4	67106ae0-b3c9-497d-a08b-26d91ca3e638	Conversation de Enzo	active	direct	8	projection	1061	2026-03-27T21:03:59.810Z	2026-04-02T23:12:33.540Z
c72ad348-1d41-417d-8264-ee6c1e6d43dd	eecfc43e-20f5-47d4-a502-2c6cdaa71b97	Conversation de Karim	active	direct	4	accroche	755	2026-03-16T17:21:40.152Z	2026-04-02T23:12:33.540Z
49b62510-6e52-47e8-b265-a5bc640bbbde	4cb6df89-f816-4b76-9df1-67b8e8b45b23	Conversation de Anaïs	active	direct	9	exploration	1286	2026-03-30T14:19:28.043Z	2026-04-02T23:12:33.540Z
ebbfdae9-f34a-4ba2-8618-5af36d641ceb	ad2e1c6d-486b-479b-976c-d9fde079fb35	Conversation de Ibrahim	active	direct	9	accroche	1153	2026-03-31T20:57:32.285Z	2026-04-02T23:12:33.540Z
cc2298cb-904f-4093-8739-2224d5a7c709	fed82a4a-ec58-431e-8e17-46a2fce18027	Conversation de Océane	active	direct	6	projection	878	2026-03-27T00:55:02.490Z	2026-04-02T23:12:33.540Z
25ed7b6c-0b36-41d6-9798-a69aac1100a8	331b09e1-a578-4c26-a278-b8059cb0c30a	Conversation de Sacha	active	direct	6	projection	834	2026-03-27T13:30:18.412Z	2026-04-02T23:12:33.540Z
391f7dfd-e70f-44af-8e66-e547bed18a6d	421b4fba-05d3-4ee3-bf03-7b7a7828484b	Conversation de Wassim	active	direct	8	projection	1080	2026-03-29T17:36:01.218Z	2026-04-02T23:12:33.540Z
d42e8347-ce4d-41b1-ae74-cdadbe982705	a78f72af-ce1d-452e-a464-59f6a52f5808	Conversation de Amina	active	direct	9	projection	1287	2026-03-27T04:59:57.448Z	2026-04-02T23:12:33.540Z
cab36901-6985-4be0-8a0f-7392b5a1be6b	1e24e7f8-3feb-42d9-bb17-4a8437730563	Conversation de Ibrahim	active	direct	4	exploration	635	2026-03-23T17:16:07.958Z	2026-04-02T23:12:33.540Z
90fda104-5f0d-45ae-bb97-c0af29eb1e16	99239065-37df-43aa-89e3-7fd7e263083d	Conversation de Yasmine	active	direct	4	accroche	526	2026-03-30T22:31:40.224Z	2026-04-02T23:12:33.540Z
b0cb61f2-d4ac-4985-8b88-6d0d3490453b	1a80741e-7156-4314-a1f5-7b85958beea2	Conversation de Ibrahim	active	direct	8	accroche	1068	2026-03-20T07:44:08.322Z	2026-04-02T23:12:33.540Z
e991abc4-9e36-4c45-a0fe-39f1f52e28d6	1b10bdb7-9ab0-44b5-b281-f295ebb7b6c4	Conversation de Tom	active	direct	4	accroche	668	2026-04-01T17:02:15.631Z	2026-04-02T23:12:33.540Z
f0bd977e-3927-429c-a971-834976f640bb	1daeb1b4-5ce2-44af-a5bb-4fc40fc64e42	Conversation de Arthur	active	direct	4	exploration	597	2026-03-19T05:22:16.098Z	2026-04-02T23:12:33.540Z
d4358fc0-b61a-4ca3-bf5b-cba0d2477bbd	cd532497-bd2b-46e6-91ab-2654551a3dc1	Conversation de Zoé	active	direct	4	accroche	577	2026-03-14T05:06:22.932Z	2026-04-02T23:12:33.540Z
b55262a6-e7a6-4bfa-8dd6-ad551e52be8c	0da6f58a-d769-4bbb-991a-0b8540ed722b	Conversation de Enzo	active	direct	4	exploration	667	2026-04-02T03:58:58.868Z	2026-04-02T23:12:33.540Z
cd6b5195-06a0-4c75-9bf0-4dd313e2369e	e01af09a-d399-441c-9758-3f799dfed44d	Conversation de Théo	active	direct	6	accroche	888	2026-03-23T06:15:24.330Z	2026-04-02T23:12:33.540Z
bffa5b63-1a48-4585-9bd3-5d060888d83a	b32b7963-c6af-4e56-aa61-7b7fc7f16dc7	Conversation de Alice	active	direct	9	exploration	1191	2026-03-18T18:53:27.724Z	2026-04-02T23:12:33.540Z
44d664c1-b280-4a2e-a106-2059baa168ec	0afb833e-932e-4f87-8c99-d643cb0ab0aa	Conversation de Lucie	active	direct	4	accroche	574	2026-04-01T02:42:44.296Z	2026-04-02T23:12:33.540Z
64da2e25-a67f-4c9f-859c-3b263cec38da	ca90b20a-bcf7-4b09-a945-4f464e98e104	Conversation de Lucie	active	direct	6	exploration	1019	2026-03-28T01:57:18.016Z	2026-04-02T23:12:33.540Z
a77ec760-26ee-4d6f-a38e-0f4579790dff	e430ab53-087d-4998-bf48-22d39cab3501	Conversation de Yanis	active	direct	8	projection	1225	2026-03-26T00:45:39.720Z	2026-04-02T23:12:33.540Z
e1caf759-3f4e-427b-b8f8-d8888dbe39c7	3318e30a-1226-4c57-859b-10ec31dfa510	Conversation de Lina	active	direct	6	exploration	987	2026-03-17T23:35:47.160Z	2026-04-02T23:12:33.540Z
c086a8d2-25b0-4461-b1da-a9b20f60e429	28fca49e-e608-4f46-a3a2-c1ebe8200190	Conversation de Antoine	active	direct	6	exploration	811	2026-03-23T06:51:33.471Z	2026-04-02T23:12:33.540Z
aacb831e-45b7-46ac-9980-e00a1c3d0b32	fd6541c7-1303-4453-8bab-458ff6cf8282	Conversation de Camille	active	direct	4	accroche	771	2026-03-24T02:56:50.010Z	2026-04-02T23:12:33.540Z
e583c1a0-7078-4c1a-b229-5bcab58dfd82	069db21a-84fa-4b6d-b28f-a4173b11f710	Conversation de Yasmine	active	direct	4	projection	654	2026-03-24T20:21:04.716Z	2026-04-02T23:12:33.540Z
749e2030-3014-400d-ba38-b8fcaf62009a	508239d2-9f0e-4471-b893-7b50c0631e64	Conversation de Manon	active	direct	9	projection	1326	2026-03-26T10:59:05.531Z	2026-04-02T23:12:33.540Z
76e823a8-c734-4572-ad18-97f26e4daa0b	4841b942-e1f1-4b82-8b04-a11b9bfb1fd9	Conversation de Laura	active	direct	8	accroche	1097	2026-03-31T01:24:29.141Z	2026-04-02T23:12:33.540Z
a3475298-9731-4984-9a44-44f1be112042	8dfa724f-a9d8-463f-bfca-38e3dca8ae6a	Conversation de Enzo	active	direct	9	accroche	1141	2026-03-31T05:40:35.717Z	2026-04-02T23:12:33.540Z
e48942fd-20a3-4045-91ba-fd4b1dc020bc	5dff5942-25af-4fff-8011-cd012c664484	Conversation de Rayan	active	direct	9	exploration	1351	2026-03-27T00:25:41.283Z	2026-04-02T23:12:33.540Z
26c43531-867c-470d-8c5a-ea3e9fbbd73f	8525858f-4edb-4479-bc5d-443829d2c466	Conversation de Noah	active	direct	4	projection	515	2026-03-28T04:25:53.625Z	2026-04-02T23:12:33.540Z
4a8f5045-b396-4c27-88ae-0776aaf3d3ae	45394e25-24e5-4d02-84a5-46713af6d193	Conversation de Adam	active	direct	4	exploration	734	2026-03-29T21:46:48.484Z	2026-04-02T23:12:33.540Z
2d3a5423-751a-4744-8010-7849f3e49384	4c210ad7-014b-48a6-8286-a8ddf5264d3e	Conversation de Karim	active	direct	8	accroche	1114	2026-03-22T06:31:31.615Z	2026-04-02T23:12:33.540Z
1f773910-72d8-4281-a4ca-fdbf1c231940	42981fb0-76a8-4cc1-af47-7ced202835cd	Conversation de Louis	active	direct	8	exploration	1196	2026-03-24T19:24:47.753Z	2026-04-02T23:12:33.540Z
d26fd424-c425-449a-94fc-b2eab26b01ac	179113ab-61e5-4a0e-bd42-93c4b2b1f5c2	Conversation de Clara	active	direct	6	exploration	911	2026-03-27T17:47:24.423Z	2026-04-02T23:12:33.540Z
1d517de3-cf84-4a67-a9bf-a5587801600f	406e7405-ed52-4710-a0c7-32d69f0839c0	Conversation de Karim	active	direct	6	exploration	841	2026-03-23T21:58:25.147Z	2026-04-02T23:12:33.540Z
88663f85-a284-4060-8b32-8b128f931d7f	95db2322-9525-4a7e-b10b-9b21fa6e1f1f	Conversation de Margot	active	direct	4	projection	705	2026-03-21T19:32:05.525Z	2026-04-02T23:12:33.540Z
3560db67-c1cb-4f5f-829a-1359f3d758d3	49d0e9b0-1e04-48d7-9695-6224265064b4	Conversation de Manon	active	direct	9	projection	1147	2026-03-26T04:39:14.175Z	2026-04-02T23:12:33.540Z
93257088-cda1-41e4-87f9-2910aa150692	18413dff-7869-45f7-a745-8349f57d89f3	Conversation de Wassim	active	direct	8	projection	1225	2026-04-01T16:45:30.933Z	2026-04-02T23:12:33.540Z
6bfddad6-0960-40a3-810e-e7d538441e49	3c765e0f-7583-4179-a98f-295c1c624ab9	Conversation de Zoé	active	direct	6	exploration	784	2026-03-22T22:53:13.727Z	2026-04-02T23:12:33.540Z
5743f9b3-d7e7-43a5-8b6c-f7401fba6903	41a1bf37-54d8-4a0f-af19-4b84f13bf4c9	Conversation de Kylian	active	direct	6	exploration	845	2026-03-23T21:39:57.871Z	2026-04-02T23:12:33.540Z
27cd5a2a-f83c-4e0b-af30-4e3039d76147	757d5cb8-94bc-41ae-b53a-f8e5b9435d65	Conversation de Romane	active	direct	4	exploration	571	2026-03-28T00:52:11.313Z	2026-04-02T23:12:33.540Z
edef5287-7143-476a-8146-d575fcc3ec35	64d8a371-0774-48ed-8508-28532898c01e	Conversation de Yasmine	active	direct	6	accroche	910	2026-03-18T07:11:47.575Z	2026-04-02T23:12:33.540Z
4fdf947d-4924-40d1-8595-2a62d6617c0d	d4b22522-6c2f-4eb8-8299-ed7e1b3bb4fa	Conversation de Raphaël	active	direct	4	accroche	671	2026-03-27T16:37:09.034Z	2026-04-02T23:12:33.540Z
4a49fa3a-6ef6-4823-8fe9-7db3d29dbf02	b60a337a-1515-477b-9ae0-58009984cbe6	Conversation de Léa	active	direct	6	projection	911	2026-03-27T15:30:33.498Z	2026-04-02T23:12:33.540Z
f365e924-b5a2-47ad-a349-4885732f8c5c	33eac1eb-4c71-4ec8-a2c5-9da733f8a8b6	Conversation de Théo	active	direct	9	projection	1279	2026-03-21T06:52:26.065Z	2026-04-02T23:12:33.540Z
0e00414b-6e0f-4480-808a-9579042308b8	4f63c8f6-9a67-42f2-b658-730b8db0b1e6	Conversation de Mélissa	active	direct	6	exploration	779	2026-03-27T05:16:59.604Z	2026-04-02T23:12:33.540Z
d235a9e2-10ec-4a5e-bf46-9e7def0539de	63ba0dc7-2836-4cab-9c81-997ef1beb339	Conversation de Hugo	active	direct	6	accroche	754	2026-03-21T05:48:29.898Z	2026-04-02T23:12:33.540Z
93844875-db44-4e04-889a-f224f3307d81	b3da3233-e79e-460c-bcff-d90f75a87d11	Conversation de Océane	active	direct	8	accroche	994	2026-03-16T02:26:48.396Z	2026-04-02T23:12:33.540Z
81f25ef0-3b81-4945-b549-2816b0610ab1	fbc8ceaf-70f0-4d2e-85ad-08d3fa343f9c	Conversation de Léa	active	direct	6	accroche	821	2026-03-25T01:18:52.059Z	2026-04-02T23:12:33.540Z
72f9dbbb-0dfa-499e-bfa1-0a6139a55826	c6d6de52-9dd5-4e5a-99bd-ff4b3c017a43	Conversation de Enzo	active	direct	6	exploration	1007	2026-03-27T20:45:05.077Z	2026-04-02T23:12:33.540Z
5a662f2f-48c8-46a4-8fd7-cf50fac0db40	39e2b1bf-6616-4559-8d4b-6315d337fc50	Conversation de Manon	active	direct	4	accroche	615	2026-03-27T14:30:28.775Z	2026-04-02T23:12:33.540Z
7900cc57-a417-499f-bae8-57f2ca3f6ec7	b0499347-d62f-4784-9531-114b06900600	Conversation de Manon	active	direct	4	exploration	776	2026-03-24T06:04:21.863Z	2026-04-02T23:12:33.540Z
25266907-3596-4c73-ba5a-0e6d286e46ab	dc9090c7-5234-496f-8bee-56d4ac07d8b9	Conversation de Emma	active	direct	6	exploration	816	2026-03-29T12:58:30.365Z	2026-04-02T23:12:33.540Z
96550c59-b8e3-4bb5-b5a5-fcbbf8b5db44	e4e3ab10-0b41-4a5d-a7f0-9a9f2f5eacc7	Conversation de Paul	active	direct	4	projection	558	2026-03-17T06:25:00.238Z	2026-04-02T23:12:33.540Z
e31bc404-8d03-4021-a0dd-6209903f85e2	8b556cf5-1bf7-453d-8405-8b39a2e5dc43	Conversation de Camille	active	direct	4	accroche	673	2026-03-14T15:38:50.386Z	2026-04-02T23:12:33.540Z
09735141-df25-4947-a932-e5348b591738	f66c8ffc-3566-48c8-a4b0-d1d8d04de22b	Conversation de Léa	active	direct	6	projection	975	2026-03-14T07:53:15.508Z	2026-04-02T23:12:33.540Z
6901ee86-17aa-4877-b1c5-561391202b33	703959fe-92ee-442c-8838-96e13e37d92d	Conversation de Arthur	active	direct	8	projection	1185	2026-03-28T04:15:05.003Z	2026-04-02T23:12:33.540Z
1eb5a6d3-b705-43fc-bed3-d5a935871d55	ce736c1c-ced1-4a2c-b257-4df5434563b0	Conversation de Louis	active	direct	6	accroche	760	2026-03-18T05:31:09.073Z	2026-04-02T23:12:33.540Z
981dcfb1-4a06-4073-9992-485306c2e51b	59ba42d1-24e6-469b-8c35-621b4cedc99e	Conversation de Lina	active	direct	8	accroche	1238	2026-03-19T02:02:49.941Z	2026-04-02T23:12:33.540Z
f8c28efc-adc2-4491-aea1-4b111e09aa89	b5eb3c91-d2b5-429e-acfa-e0d0f5abe612	Conversation de Kylian	active	direct	8	exploration	1121	2026-03-31T05:39:16.457Z	2026-04-02T23:12:33.540Z
aff182af-61d1-41af-99e1-6c07f77be74d	ab1c30f5-5061-452a-abc7-8930c2983061	Conversation de Yasmine	active	direct	6	accroche	1000	2026-03-29T05:59:03.581Z	2026-04-02T23:12:33.540Z
168b259d-f4a9-4b3b-9f6b-ebef2ae3dbb6	cf3b02c7-3cd7-4d22-8ee0-22a7b75a2a99	Conversation de Nina	active	direct	4	exploration	774	2026-03-29T02:35:50.012Z	2026-04-02T23:12:33.540Z
b5675b21-0cd4-4263-b8d1-827ee2a616b7	06dc14ad-2dc8-4f03-82bf-549c1750b258	Conversation de Mathis	active	direct	4	exploration	740	2026-03-27T23:35:38.571Z	2026-04-02T23:12:33.540Z
d54f3f48-d9be-452f-89c1-5bf4e5bdaf28	7317326a-e743-4a69-a01a-a74ac4c17341	Conversation de Yanis	active	direct	9	projection	1115	2026-03-17T00:21:50.009Z	2026-04-02T23:12:33.540Z
7ff89a91-9c5f-470b-bb28-566f6204ff59	4242128d-1bcd-4377-9db5-48263b1b9067	Conversation de Charlotte	active	direct	4	accroche	624	2026-03-23T04:20:40.704Z	2026-04-02T23:12:33.540Z
87e1287c-b476-4d99-81a0-2988adae6c22	10c3f1d7-35b1-4ee7-bf4a-2fae5da5a5ec	Conversation de Théo	active	direct	9	exploration	1286	2026-03-28T15:05:41.676Z	2026-04-02T23:12:33.540Z
0d98ad70-86a4-4f7c-abea-398451e58a3c	314dd029-8784-47c7-800a-b65a89c5bfa0	Conversation de Léa	active	direct	4	accroche	600	2026-03-27T00:06:14.816Z	2026-04-02T23:12:33.540Z
cb1b1ba9-706b-466b-bcf0-f854b4dfe676	01743b7a-b33f-4689-bcb3-667f0b615490	Conversation de Charlotte	active	direct	8	projection	1119	2026-03-27T07:13:59.963Z	2026-04-02T23:12:33.540Z
f67f6e80-be04-4cd1-a108-b095092ce0c4	180e76c3-8b14-4dba-86e8-f2461866cf9a	Conversation de Ibrahim	active	direct	8	exploration	1008	2026-03-22T11:39:36.483Z	2026-04-02T23:12:33.540Z
53517658-95d0-4ad9-9cc6-7c3093d0af9e	9b19d083-772c-4b3a-8a3b-2d05a8c0f8a1	Conversation de Camille	active	direct	4	exploration	689	2026-03-20T17:16:43.166Z	2026-04-02T23:12:33.540Z
c5120210-b7fb-48b3-9f4a-ebc8b6f52c35	6ee23bc6-35b7-4e55-aa1b-c9c5ea4f4368	Conversation de Ibrahim	active	direct	6	projection	930	2026-03-23T21:51:14.662Z	2026-04-02T23:12:33.540Z
06bfc72e-e842-4fe5-81bc-c5d1f8ea4d91	94d23641-2374-4822-8efe-835096bc964b	Conversation de Nour	active	direct	6	projection	969	2026-03-24T14:46:51.683Z	2026-04-02T23:12:33.540Z
70ff4cfd-e045-432b-8126-6147398abf3f	1af91dc4-f78c-4baa-84dc-bd94b6628937	Conversation de Inès	active	direct	4	accroche	544	2026-03-24T12:59:40.218Z	2026-04-02T23:12:33.540Z
11c21a9a-3f2d-40b6-b8b9-c09cc7ce0958	61ed4304-60d0-4278-b3fc-b8035ae89610	Conversation de Léa	active	direct	9	exploration	1198	2026-03-14T02:18:54.422Z	2026-04-02T23:12:33.540Z
39e351c4-8963-455e-ae28-f3b6c62080da	40581249-3949-40cb-8e46-664bb4236c2b	Conversation de Ethan	active	direct	9	exploration	1146	2026-03-18T10:06:31.871Z	2026-04-02T23:12:33.540Z
71591e8d-914c-42ac-a2f7-18b9b4669469	f2a0c531-e0e2-41f9-88c5-03abf0c62f6e	Conversation de Anaïs	active	direct	4	exploration	709	2026-03-17T00:54:10.108Z	2026-04-02T23:12:33.540Z
4ace2d6d-e177-4cfa-b89f-00f0fcc13c28	a8cbf0f9-e99e-41c7-a7d3-bdf02893f377	Conversation de Tom	active	direct	6	accroche	914	2026-03-26T13:00:39.455Z	2026-04-02T23:12:33.540Z
2fa0e68a-8314-4eb3-9321-62e74f8ea0f5	92d6f485-dd75-4f15-8689-d655442f3066	Conversation de Eva	active	direct	8	exploration	1197	2026-03-29T04:47:10.395Z	2026-04-02T23:12:33.540Z
46ee4ea0-9831-4b41-9942-37f79479d88d	96af85b9-db3c-4253-b1f6-c502d423748b	Conversation de Mehdi	active	direct	8	accroche	1060	2026-03-19T06:37:21.195Z	2026-04-02T23:12:33.540Z
d031ee6c-00a4-4d7b-a365-285713812af6	f6510755-469c-4285-a02f-39a27508dcd6	Conversation de Théo	active	direct	4	projection	744	2026-03-22T07:21:27.481Z	2026-04-02T23:12:33.540Z
be573900-a2dd-4ce7-9172-10550a255d4d	7423daf1-d204-432e-b6cd-65f3e0cee53c	Conversation de Adam	active	direct	6	exploration	952	2026-04-01T02:16:38.334Z	2026-04-02T23:12:33.540Z
e752be8c-4dc3-49e9-8316-ba4d1805f672	12c1c264-4559-4bb3-8f7f-85942e02ff22	Conversation de Chloé	active	direct	9	projection	1215	2026-03-14T04:36:17.632Z	2026-04-02T23:12:33.540Z
9f206e28-6695-469b-9269-b76f7e147af2	a4210ec5-7e1e-4524-8b93-caa4097c04c7	Conversation de Théo	active	direct	6	accroche	759	2026-03-25T22:39:45.638Z	2026-04-02T23:12:33.540Z
bd13fb42-9e16-4800-bfab-9cce3e6cf079	a55fdb49-098b-4d52-a6fe-a428a23d2c47	Conversation de Sofia	active	direct	9	projection	1243	2026-03-20T10:27:20.572Z	2026-04-02T23:12:33.540Z
50ee2d5c-6574-4ce7-b9b6-78c4dcf9b6b4	d3d0c553-73a6-474f-8ad0-7de504a44ca9	Conversation de Emma	active	direct	8	projection	1001	2026-04-02T08:18:05.644Z	2026-04-02T23:12:33.540Z
4f93d7fc-54b2-4081-8abe-7790c10a258a	a2885063-17c1-4381-b9a2-546941ea319e	Conversation de Gabriel	active	direct	9	exploration	1322	2026-03-14T20:30:36.918Z	2026-04-02T23:12:33.540Z
103bc744-76c6-4948-ab03-f9ecd80602ae	c1212cee-3b85-4b0d-a15c-4dffaf32e669	Conversation de Ethan	active	direct	6	exploration	896	2026-03-29T04:02:28.583Z	2026-04-02T23:12:33.540Z
bd6e86ec-a4d8-4291-8dc9-4fff7b980c2b	60a0f991-af45-4ee5-9667-e9028db6cc48	Conversation de Maëlys	active	direct	8	accroche	1231	2026-03-17T18:28:42.148Z	2026-04-02T23:12:33.540Z
dd58a0d9-3bdc-47bf-9651-27ee0cbf9da6	fd99e0ca-adff-4441-8930-d33d751f338d	Conversation de Nina	active	direct	8	projection	1050	2026-03-29T10:22:31.942Z	2026-04-02T23:12:33.540Z
53319125-7904-4b24-a599-984aad6a5cc5	dd7958bf-ee38-49c8-a415-9b3bedc2f0d6	Conversation de Lina	active	direct	6	projection	837	2026-03-21T08:30:47.882Z	2026-04-02T23:12:33.540Z
727c4946-830e-42cd-a54e-9f477ee9f881	7d1d750a-4ef8-47ce-a931-1b9fe6b9f49e	Conversation de Amina	active	direct	9	exploration	1228	2026-03-18T16:49:00.349Z	2026-04-02T23:12:33.540Z
c0533d5e-e3a2-4716-bdc6-f99cc6c3d853	0bd68b2d-f655-4144-b7bc-771feec336c3	Conversation de Zoé	active	direct	6	accroche	926	2026-03-24T15:40:51.815Z	2026-04-02T23:12:33.540Z
eb43ffa2-3b63-43a7-a3c3-66d9f7fc76dd	2f8dec79-7738-4d51-a41d-1ee3f70b9988	Conversation de Noah	active	direct	6	projection	779	2026-03-18T09:28:35.661Z	2026-04-02T23:12:33.540Z
888ef8e4-fba5-4e1a-8e26-5fb49551221e	20b623fe-413c-4f8f-8b2c-d4500aa96a84	Conversation de Tom	active	direct	6	projection	950	2026-03-16T16:20:15.477Z	2026-04-02T23:12:33.540Z
cb815a38-a090-44b2-a527-aee425f2be02	a3f1e578-9e48-415b-b33c-34f0b86cb66e	Conversation de Louis	active	direct	6	accroche	938	2026-03-18T12:23:25.645Z	2026-04-02T23:12:33.540Z
3c23c3d2-8de1-45f2-b152-e5d3fd38e586	3a93c177-0629-4841-93c4-1c4af6731579	Conversation de Sofia	active	direct	6	exploration	979	2026-03-14T08:49:03.510Z	2026-04-02T23:12:33.540Z
6c9ed46c-a6ac-46b9-8e8e-e4313732dc79	e162347e-9ffa-412f-8ccc-886afb575db6	Conversation de Ibrahim	active	direct	4	exploration	727	2026-03-30T05:11:39.470Z	2026-04-02T23:12:33.540Z
8e08ae69-9232-49f9-b567-3f950b8754c6	2cd16062-6978-410a-b9d3-e3446b2dbe8f	Conversation de Lucas	active	direct	4	projection	776	2026-03-28T04:36:54.141Z	2026-04-02T23:12:33.540Z
a871e9ae-8b83-4992-9b0a-ecd4585422b9	3de8b387-ff4b-4bbd-a263-97e331321225	Conversation de Mélissa	active	direct	9	accroche	1233	2026-03-29T05:50:30.921Z	2026-04-02T23:12:33.540Z
d629c11b-f646-47d0-ae00-9901cd21a7ae	8fe5d659-c661-4b97-91e0-a067c5f22cb8	Conversation de Louis	active	direct	6	exploration	1004	2026-03-28T04:29:32.430Z	2026-04-02T23:12:33.540Z
23f3760a-929a-45d5-8a89-d7d478f5ad2b	b726a0b9-9690-4c50-8e30-dbd283520fe4	Conversation de Chloé	active	direct	8	projection	1181	2026-03-30T04:13:37.546Z	2026-04-02T23:12:33.540Z
4e3763a4-8f71-475e-b858-06ae68217094	5fb5a284-5c15-4fd2-98a9-09c9825602a3	Conversation de Chloé	active	direct	6	accroche	981	2026-03-30T06:47:59.109Z	2026-04-02T23:12:33.540Z
50235829-966e-415b-8d9d-25bce37aecde	ef753a23-d9dd-465c-85a1-77b0eb8e478a	Conversation de Sofiane	active	direct	8	projection	1166	2026-03-18T21:43:49.352Z	2026-04-02T23:12:33.540Z
cdcf64a1-5491-4729-afdf-e157bda3192a	9e0f0abb-d9b0-43c6-86c9-0cdf1cef8421	Conversation de Victor	active	direct	4	accroche	604	2026-03-27T10:34:08.359Z	2026-04-02T23:12:33.540Z
0af32f8c-c1ac-48bd-8199-436a0c8f1ec0	4524bddb-31ac-401d-91b2-9a093914aa72	Conversation de Chloé	active	direct	4	accroche	629	2026-03-27T03:25:33.683Z	2026-04-02T23:12:33.540Z
6b65dd78-d5b4-4bd7-aaea-b4197aa59ac2	c4c24e69-e45d-4397-b516-01a93f56fddc	Conversation de Nina	active	direct	8	accroche	1159	2026-03-17T18:02:33.888Z	2026-04-02T23:12:33.540Z
3c0a1772-314b-4e16-8039-b557eaa7bbb9	fbc357d6-24d3-4a23-bc4e-568cc698cdc1	Conversation de Alice	active	direct	6	exploration	894	2026-03-29T09:22:39.081Z	2026-04-02T23:12:33.540Z
40f2591d-143e-42db-8b1d-f892400d04d2	06c75081-3902-4d97-a9e1-9950a9f72211	Conversation de Manon	active	direct	9	projection	1370	2026-03-25T08:30:00.852Z	2026-04-02T23:12:33.540Z
4633445b-cc10-498c-ae30-1e14a20e53d8	25a4b725-3b30-49ae-bde4-32a109d0aaf5	Conversation de Gabriel	active	direct	6	accroche	917	2026-03-24T02:16:01.859Z	2026-04-02T23:12:33.540Z
9de4a578-929e-4ef7-a16a-dc5a61851945	c18b9565-e55f-47bf-8ad8-5ede1971326e	Conversation de Mehdi	active	direct	4	accroche	707	2026-03-27T14:27:03.205Z	2026-04-02T23:12:33.540Z
7462885f-6a30-4efd-865e-2e6536d01889	0782a562-8562-421f-bb77-a980f9b17414	Conversation de Ibrahim	active	direct	6	projection	939	2026-04-01T11:06:47.721Z	2026-04-02T23:12:33.540Z
3fd65067-7c0d-4d29-931e-f39d9394f150	a5e754fd-de58-4c94-978e-d934e2eb8d30	Conversation de Lucie	active	direct	9	exploration	1291	2026-03-23T21:11:04.971Z	2026-04-02T23:12:33.540Z
694f5d31-f35d-42ee-ab2e-776ad2d39fda	54397c3f-fc8a-4bbc-9491-58c4f2326513	Conversation de Sofiane	active	direct	6	accroche	910	2026-03-28T13:03:08.329Z	2026-04-02T23:12:33.540Z
62921c67-0e51-47a8-b5e6-6c43c62109cf	7e805fa7-7ce9-4113-b0e7-f133d3ed5e64	Conversation de Nour	active	direct	9	projection	1178	2026-03-28T16:57:45.108Z	2026-04-02T23:12:33.540Z
f591c3e3-6e85-46c6-8436-d89d04f84c1a	c9120feb-d40f-4030-a9a5-095f5e02d608	Conversation de Karim	active	direct	6	projection	787	2026-03-15T01:37:33.814Z	2026-04-02T23:12:33.540Z
58326523-143d-416b-b72e-84c4d9a02cb2	f60e2beb-acd7-4e87-8f56-b13fc1a4ac22	Conversation de Sofiane	active	direct	6	exploration	800	2026-03-14T01:18:56.150Z	2026-04-02T23:12:33.540Z
72958414-8eb1-42d7-8e83-a363e9af878b	39be7f82-99f3-491e-842d-417fa7df4700	Conversation de Enzo	active	direct	8	projection	1127	2026-03-24T03:20:22.306Z	2026-04-02T23:12:33.540Z
d10a55e6-65eb-41d1-b6bf-87fd07a50ec7	654cc014-09ce-427d-a696-1d19d6d0adff	Conversation de Victor	active	direct	6	exploration	900	2026-03-20T23:40:28.615Z	2026-04-02T23:12:33.540Z
ee07ee49-4ef6-4c6e-bce2-c927582cda67	b6f5c8b4-eb4b-4689-a5f2-d8fdd2d5149d	Conversation de Clara	active	direct	6	accroche	896	2026-03-30T02:34:46.850Z	2026-04-02T23:12:33.540Z
ce03eaf3-05b1-4d5e-bb14-b27df50a6ff0	43ebe8bb-f6a6-4c7c-85a2-d28024521201	Conversation de Mehdi	active	direct	6	exploration	880	2026-03-14T00:46:42.274Z	2026-04-02T23:12:33.540Z
a79038f2-4b50-446d-ab53-f76af7da2be4	03a8a89e-37cb-4428-9425-013c69ddd2c6	Conversation de Chloé	active	direct	6	exploration	996	2026-03-20T07:42:05.621Z	2026-04-02T23:12:33.540Z
72a49eb1-b5c5-4460-955a-7b1ef977f09d	c122a8c9-5581-4f93-88a7-b5a45b0e710d	Conversation de Victor	active	direct	6	accroche	827	2026-03-26T09:18:28.972Z	2026-04-02T23:12:33.540Z
179d3ae0-168d-4511-8c62-7497943606fb	eff36237-540d-4a35-a070-f7b2b911bc95	Conversation de Jules	active	direct	9	exploration	1208	2026-04-01T12:50:01.819Z	2026-04-02T23:12:33.540Z
85821ede-ea77-4dc2-aef2-bb629961e26f	76270bf6-f037-4ea5-8079-146a184cafc0	Conversation de Léo	active	direct	6	exploration	968	2026-04-01T01:43:00.735Z	2026-04-02T23:12:33.540Z
b5e46e9e-60ec-4e42-be30-c33a86275cc4	cdaca7ab-094c-442b-8d2b-9f3dee56c635	Conversation de Arthur	active	direct	4	projection	523	2026-03-22T18:32:09.821Z	2026-04-02T23:12:33.540Z
e960f936-d5c2-47dc-9eae-67b3289a28d8	c1bd6a0c-0f61-4894-a866-5ac89cd05f82	Conversation de Mathis	active	direct	4	exploration	759	2026-03-24T07:36:48.949Z	2026-04-02T23:12:33.540Z
160ec62a-9640-44ab-a242-65255df02f57	92598bcd-69c4-4b3b-bde0-f1c05569d886	Conversation de Léo	active	direct	6	exploration	846	2026-03-17T23:43:29.812Z	2026-04-02T23:12:33.540Z
8adba9d6-94eb-47e4-8558-21de671e30ea	c81f9f95-e102-4558-bcb5-cc45ce7d018c	Conversation de Maëlys	active	direct	4	accroche	536	2026-03-27T17:29:33.116Z	2026-04-02T23:12:33.540Z
1b965620-067e-40ac-87dc-1f695eb7a2c1	05d49191-ef46-4e50-aa03-fde945c96896	Conversation de Yanis	active	direct	8	exploration	1172	2026-03-27T08:04:01.268Z	2026-04-02T23:12:33.540Z
e15e5dac-52f9-4a4f-897a-260c0806d18b	b4158d6b-da5a-4f8b-8be4-5488ebf13b32	Conversation de Camille	active	direct	8	accroche	1057	2026-03-15T20:21:55.715Z	2026-04-02T23:12:33.540Z
cf15fa01-3781-4a3d-82a6-306a2731e2cf	6c9e4172-b593-4ae3-9c12-7aeb73fb3361	Conversation de Nour	active	direct	9	exploration	1143	2026-04-01T15:11:04.143Z	2026-04-02T23:12:33.540Z
9e96900b-39c8-43d2-acc0-44303d39ebfe	da216f27-4c36-403d-9041-9295c4577b6b	Conversation de Manon	active	direct	4	exploration	774	2026-03-26T16:27:01.778Z	2026-04-02T23:12:33.540Z
cc29c414-f616-4085-9702-d89dd1d3db5d	478a7def-c724-4d1e-838c-24d4a7e8aa3b	Conversation de Léa	active	direct	9	projection	1154	2026-03-17T09:46:32.081Z	2026-04-02T23:12:33.540Z
8a343115-6c20-404a-9ffc-994afd25f41a	381f924c-fe52-4a9f-8568-11369e14c544	Conversation de Paul	active	direct	8	projection	1237	2026-03-29T10:11:11.003Z	2026-04-02T23:12:33.540Z
795d4bdc-d12f-4aa2-b262-c0a1375e71e4	25c7b2b0-4759-4100-953d-c732e7d51cfc	Conversation de Amina	active	direct	9	exploration	1159	2026-03-18T01:56:47.385Z	2026-04-02T23:12:33.540Z
bcbd1f7c-d658-4f5b-a11f-5635c025457e	0a58652a-8b68-4074-a9a0-ed0f609205e8	Conversation de Lucas	active	direct	9	projection	1141	2026-03-17T18:12:54.154Z	2026-04-02T23:12:33.540Z
253c13f2-2611-4f41-ba54-1510d63b2c14	2e1216a4-098c-46ef-9bdb-54d64d2d128c	Conversation de Amina	active	direct	4	accroche	644	2026-03-24T10:25:36.146Z	2026-04-02T23:12:33.540Z
954ef068-e3ad-44c9-8098-1522ce07eeff	7aec43d7-b9f4-4626-8f31-33acab3c3945	Conversation de Chloé	active	direct	4	projection	754	2026-03-24T07:25:15.226Z	2026-04-02T23:12:33.540Z
20a73d4a-c8a6-4514-af08-66df296e0030	e036af1d-83c0-46e3-9d60-77313f52b261	Conversation Catch'Up	active	direct	1	accroche	0	2026-04-03T09:33:42.861Z	2026-04-03T09:34:34.921Z
2353f7d5-5b75-4dbc-bf1c-a6982e6e97d2	e036af1d-83c0-46e3-9d60-77313f52b261	Conversation Lola ÉBONNE	active	direct	0	accroche	0	2026-04-03T09:46:45.146Z	2026-04-03T09:46:45.146Z
e1af0c15-a53e-4ee2-8a2e-a0cf342d929e	79c862a2-01c4-4d3c-aaf2-a238f29e53de	Conversation Catch'Up	active	direct	4	accroche	0	2026-04-02T23:37:09.012Z	2026-04-02T23:42:18.364Z
1dbcf9ec-5d28-4707-8b63-7bc02754e923	917ad1d9-37af-4223-aa84-4c1ee508f564	Conversation Catch'Up	active	direct	1	accroche	0	2026-04-03T14:47:48.603Z	2026-04-03T14:48:14.069Z
6fa639e0-53de-4e71-b271-8ca620a7646e	0e157091-e6a9-44ab-b604-ea4e264c368d	Conversation Catch'Up	active	direct	5	accroche	0	2026-04-03T10:58:05.286Z	2026-04-03T11:05:09.497Z
ffc0ee7c-c643-485e-bc07-a5ce5e0d8365	63bab27c-ed1a-4706-b14d-f208c0737351	Conversation Catch'Up	active	direct	4	accroche	0	2026-04-03T11:15:08.408Z	2026-04-03T11:21:04.220Z
865097d6-8bc9-4a8d-a809-f335a6330c6c	917ad1d9-37af-4223-aa84-4c1ee508f564	Conversation Pascale	active	direct	3	accroche	0	2026-04-03T09:29:25.896Z	2026-04-03T11:23:04.986Z
f0fe4fd5-3bdb-41d8-957c-d3f2770001d6	917ad1d9-37af-4223-aa84-4c1ee508f564	Conversation Catch'Up	active	direct	17	accroche	0	2026-04-03T05:32:51.461Z	2026-04-03T08:08:16.973Z
a7fe57c7-060b-46a8-8901-01ac3e79b938	aa5f68fc-0b6b-4042-8585-1a09c8d2dbcd	Conversation Catch'Up	active	direct	2	accroche	0	2026-04-03T08:31:16.722Z	2026-04-03T08:31:24.047Z
e23e66c1-01c6-457e-9419-dfff398705ff	e036af1d-83c0-46e3-9d60-77313f52b261	Conversation Gérard Menvuça	active	direct	1	accroche	0	2026-04-03T09:16:49.199Z	2026-04-03T09:19:58.681Z
fde6aa6c-4710-4849-b448-132646ddda96	e036af1d-83c0-46e3-9d60-77313f52b261	Conversation Annie Versaire	active	direct	0	accroche	0	2026-04-03T09:22:29.692Z	2026-04-03T09:22:29.692Z
a3ed3b06-2fc2-4a2e-9e52-61d49bbb251c	7bbd877e-e467-41e5-8980-5e8561e43fa0	Conversation Catch'Up	active	direct	5	accroche	0	2026-04-03T09:56:20.651Z	2026-04-03T11:26:42.427Z
0c583a69-bb10-48ef-a7c3-c6cb2a12335e	0499d3a9-307d-45a7-9f8f-4eb871174341	Conversation Catch'Up	active	direct	3	accroche	0	2026-04-03T12:11:44.905Z	2026-04-03T12:12:00.812Z
\.


--
-- Data for Name: declaration_activite; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.declaration_activite (id, prise_en_charge_id, utilisateur_id, categorie_code, description, duree_minutes, date_semaine, date_activite, source, message_direct_id, statut, validee_par, valide_le, commentaire_conseiller, cree_le, mis_a_jour_le) FROM stdin;
\.


--
-- Data for Name: demande_consentement; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.demande_consentement (id, prise_en_charge_id, tiers_id, demandeur_id, statut, conseiller_approuve, conseiller_approuve_le, beneficiaire_approuve, beneficiaire_approuve_le, cree_le, mis_a_jour_le) FROM stdin;
\.


--
-- Data for Name: enquete_satisfaction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.enquete_satisfaction (id, prise_en_charge_id, utilisateur_id, note_globale, note_ecoute, note_utilite, note_conseiller, note_recommandation, commentaire, points_forts, ameliorations, completee, cree_le) FROM stdin;
\.


--
-- Data for Name: evenement_audit; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evenement_audit (id, conseiller_id, action, cible_type, cible_id, details, ip, horodatage) FROM stdin;
a3229441-2525-4a17-b492-58d20915bbb1	\N	login	conseiller	\N	{"email":"nadia.belkacem@ml-paris15.fr","slug":"ml-paris15"}	\N	2026-03-27T20:50:40.495Z
dc8f5e3a-6b6b-4fc6-b08c-759ed9a43d25	\N	login	conseiller	\N	{"email":"nadia.belkacem@ml-paris15.fr","slug":"ml-paris15"}	\N	2026-03-27T20:51:03.331Z
d4f504b2-08a4-403b-ab39-056e977efa17	\N	login	conseiller	\N	{"email":"admin@fondation-jae.org","slug":"fondation-jae"}	\N	2026-03-30T15:17:19.123Z
2ee2ecc8-6b5d-4c26-b345-feb8235b63c0	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	view_profile	referral	39a8901f-b234-46de-b01c-59eea1d3a371	\N	\N	2026-03-30T15:17:36.627Z
13de6a9a-315a-4a8f-bea5-4990d8af44d4	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	view_conversation	referral	39a8901f-b234-46de-b01c-59eea1d3a371	\N	\N	2026-03-30T15:17:40.162Z
858e21d3-eb20-482d-bdc0-cf89114e69a3	\N	login	conseiller	\N	{"email":"nadia.belkacem@ml-paris15.fr","slug":"ml-paris15"}	\N	2026-03-31T10:20:07.641Z
2e84f1d6-50a2-431d-82f1-dcf5f45e032f	fba8c822-beff-4dfd-8e1f-9d31f046ee46	logout	\N	\N	\N	\N	2026-03-31T10:20:14.940Z
644703fb-4fff-410a-9b8e-b96648597ed6	\N	login	conseiller	\N	{"email":"fl@fondation-jae.org","slug":"ml-bords-de-marne"}	\N	2026-03-31T10:24:08.436Z
c865afdb-1ecc-41db-9f3d-eba42f2c90fd	38631b01-9d23-47dc-be1f-f82126c2a72c	view_profile	referral	354330f9-c1d4-409a-9833-c5d523823c99	\N	\N	2026-03-31T10:25:20.240Z
14dc5f04-5108-467b-926d-40e8258e174b	38631b01-9d23-47dc-be1f-f82126c2a72c	claim_case	referral	354330f9-c1d4-409a-9833-c5d523823c99	\N	\N	2026-03-31T10:25:28.511Z
87029b88-e42c-452b-a976-58b658bb727c	38631b01-9d23-47dc-be1f-f82126c2a72c	view_profile	referral	354330f9-c1d4-409a-9833-c5d523823c99	\N	\N	2026-03-31T10:25:28.641Z
6be89998-62b8-4132-beb5-534efde63b65	38631b01-9d23-47dc-be1f-f82126c2a72c	resend_code	referral	354330f9-c1d4-409a-9833-c5d523823c99	\N	\N	2026-03-31T10:28:17.091Z
f805d0b5-d9c7-4a7c-a478-8c4d73e8a7c3	38631b01-9d23-47dc-be1f-f82126c2a72c	send_direct_message	message_direct	77215d26-a725-4fb9-b587-e7fa15a5b7d2	{"priseEnChargeId":"0c1cdc20-3a98-4e30-8b1b-624f50991cdf","referralId":"354330f9-c1d4-409a-9833-c5d523823c99","codeGenere":true}	\N	2026-03-31T10:31:08.581Z
cccabf6e-ef8a-464c-ab7b-461ad7b6197c	38631b01-9d23-47dc-be1f-f82126c2a72c	view_profile	referral	354330f9-c1d4-409a-9833-c5d523823c99	\N	\N	2026-03-31T10:49:29.814Z
8f9edcac-5a3f-4573-b2e3-3485a24872a0	38631b01-9d23-47dc-be1f-f82126c2a72c	view_profile	referral	354330f9-c1d4-409a-9833-c5d523823c99	\N	\N	2026-03-31T10:49:47.844Z
3166a19a-45bc-49f8-ac12-1d8553a0ae10	38631b01-9d23-47dc-be1f-f82126c2a72c	view_profile	referral	354330f9-c1d4-409a-9833-c5d523823c99	\N	\N	2026-03-31T12:10:16.909Z
ea3ad0ee-94fa-4d7c-8b47-03704289e30e	38631b01-9d23-47dc-be1f-f82126c2a72c	logout	\N	\N	\N	\N	2026-03-31T12:17:07.337Z
52713ea1-7fda-4acc-87f0-1dcd46673ddd	\N	login	conseiller	\N	{"email":"sc@fondation-jae.org","slug":"ml-orleans"}	\N	2026-03-31T12:17:21.648Z
10d34faf-c751-431e-8519-95388e924ed2	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	872c3c95-0e2a-4fde-82a5-f4a8ab6777c8	\N	\N	2026-03-31T12:23:02.894Z
dbb97e92-5837-4d28-bbbe-8c1951abfc7c	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	872c3c95-0e2a-4fde-82a5-f4a8ab6777c8	\N	\N	2026-03-31T12:23:08.575Z
25530103-e3b3-4127-8c0c-faae15620af9	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	872c3c95-0e2a-4fde-82a5-f4a8ab6777c8	\N	\N	2026-03-31T12:23:08.698Z
f2458fb9-8d09-4897-9337-a28192643b76	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	872c3c95-0e2a-4fde-82a5-f4a8ab6777c8	\N	\N	2026-03-31T12:40:54.170Z
2f4ec7a7-1f2c-4ba0-917b-6c93e5a45309	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	64eca020-8911-4e1d-bdeb-cb4bdf1d6b7b	\N	\N	2026-03-31T12:42:38.551Z
cf104712-909a-4473-8faf-b2fccb44b8c7	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	64eca020-8911-4e1d-bdeb-cb4bdf1d6b7b	\N	\N	2026-03-31T12:42:40.783Z
f446aae3-ca98-4478-8c9d-49db33bfd6ea	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	64eca020-8911-4e1d-bdeb-cb4bdf1d6b7b	\N	\N	2026-03-31T12:42:40.902Z
5982638a-f030-408b-8d74-e5aa81a5e0a6	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	a3f5f8c9-4395-40ff-922d-d1a84d4e6e47	{"priseEnChargeId":"9448ae6e-35f0-4e78-97de-60d40edc64c3","referralId":"64eca020-8911-4e1d-bdeb-cb4bdf1d6b7b","codeGenere":true}	\N	2026-03-31T12:42:50.899Z
513c79d2-259e-4c28-a23b-a51c426eae2a	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	64eca020-8911-4e1d-bdeb-cb4bdf1d6b7b	\N	\N	2026-03-31T12:47:26.977Z
eb407098-f822-4c27-8b52-ae0357ab413e	\N	login	conseiller	\N	{"email":"sc@fondation-jae.org","slug":"ml-orleans"}	\N	2026-03-31T12:48:55.878Z
3c4284f6-a92c-40b5-b184-c587f9c510e9	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	64eca020-8911-4e1d-bdeb-cb4bdf1d6b7b	\N	\N	2026-03-31T12:49:09.810Z
4d4e9a27-13dd-4398-9d8d-dfe07d8589ff	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_conversation	referral	64eca020-8911-4e1d-bdeb-cb4bdf1d6b7b	\N	\N	2026-03-31T12:49:27.212Z
629595bc-4068-40d5-9303-a3490727720d	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	872c3c95-0e2a-4fde-82a5-f4a8ab6777c8	\N	\N	2026-03-31T12:49:44.039Z
c6801d87-c189-4e74-b9f3-893c67edf007	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	872c3c95-0e2a-4fde-82a5-f4a8ab6777c8	\N	\N	2026-03-31T13:23:39.496Z
fc248ab0-a1c1-4d75-9270-1f67872490fe	\N	login	conseiller	\N	{"email":"sc@fondation-jae.org","slug":"ml-orleans"}	\N	2026-03-31T15:41:59.419Z
5e52fa38-d018-4332-a93b-bc2add5519c4	\N	login	conseiller	\N	{"email":"sc@fondation-jae.org","slug":"ml-orleans"}	\N	2026-04-01T07:30:13.532Z
3bef6fd9-5d8f-4a72-809b-ba20527ed7d2	\N	login	conseiller	\N	{"email":"fl@fondation-jae.org","slug":"ml-bords-de-marne"}	\N	2026-04-01T07:31:01.802Z
90fc4d56-7585-417f-b8b3-e91bb7feb257	38631b01-9d23-47dc-be1f-f82126c2a72c	view_profile	referral	seed-ref-010457	\N	\N	2026-04-01T07:31:41.130Z
3b63bd86-1c51-4135-b16b-044a044c00a8	38631b01-9d23-47dc-be1f-f82126c2a72c	view_conversation	referral	seed-ref-010457	\N	\N	2026-04-01T07:31:51.870Z
0566d37a-65f2-4989-b234-5fe9d8b27de9	38631b01-9d23-47dc-be1f-f82126c2a72c	view_profile	referral	seed-ref-010457	\N	\N	2026-04-01T07:32:34.228Z
b21b2162-04d0-4c1c-bf8e-b19d9efdd24e	38631b01-9d23-47dc-be1f-f82126c2a72c	view_profile	referral	seed-ref-010457	\N	\N	2026-04-01T07:45:15.184Z
c111e552-5e37-446c-af5e-5b2192bf16a5	\N	login	conseiller	\N	{"email":"sc@fondation-jae.org","slug":"ml-orleans"}	\N	2026-04-01T09:05:44.913Z
ace7b259-bdf8-4e03-a338-699ff1e3657a	38631b01-9d23-47dc-be1f-f82126c2a72c	view_profile	referral	7717cba9-07ef-4274-a1e6-bf547af97718	\N	\N	2026-04-01T09:06:53.416Z
f33ac7d4-2071-4cbd-96f0-d8d353615bfd	38631b01-9d23-47dc-be1f-f82126c2a72c	claim_case	referral	7717cba9-07ef-4274-a1e6-bf547af97718	\N	\N	2026-04-01T09:06:55.482Z
6cbb683e-f015-430c-b988-c157dfe78fcc	38631b01-9d23-47dc-be1f-f82126c2a72c	view_profile	referral	7717cba9-07ef-4274-a1e6-bf547af97718	\N	\N	2026-04-01T09:06:55.570Z
2f6a0930-25cf-419a-ba02-10955999d594	38631b01-9d23-47dc-be1f-f82126c2a72c	resend_code	referral	7717cba9-07ef-4274-a1e6-bf547af97718	\N	\N	2026-04-01T09:08:20.822Z
569a37c1-a6bd-4bb8-8998-231b98c6d237	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	6d65e50d-94a8-49a5-b761-53c0222f0350	\N	\N	2026-04-01T09:13:25.421Z
9c49e778-db04-4cf3-a4a4-1ff5a18a464a	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_conversation	referral	6d65e50d-94a8-49a5-b761-53c0222f0350	\N	\N	2026-04-01T09:15:13.215Z
a754798b-a705-4712-a217-283e8a043baa	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	6d65e50d-94a8-49a5-b761-53c0222f0350	\N	\N	2026-04-01T09:17:52.235Z
076ac262-70aa-424b-b484-36c79bbbdacd	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	6d65e50d-94a8-49a5-b761-53c0222f0350	\N	\N	2026-04-01T09:18:15.755Z
b1fa886f-d6b0-458a-aa7d-45415ede14e3	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	6d65e50d-94a8-49a5-b761-53c0222f0350	\N	\N	2026-04-01T09:18:15.848Z
87f2c213-439d-4b12-8245-fba6eb897fca	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	bd0c66f6-356d-4b09-9ef0-ef1a4576c0b9	{"priseEnChargeId":"12020dba-463c-4fa1-a6ea-90930711238e","referralId":"6d65e50d-94a8-49a5-b761-53c0222f0350","codeGenere":true}	\N	2026-04-01T09:18:54.250Z
86fb69f3-7344-4eb0-ad82-96c4e703c034	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	6fcf8814-d77d-4815-9a93-d3226e938b5e	\N	\N	2026-04-01T09:26:47.424Z
f5cd02f4-413c-445d-a9e1-06af7a45aecc	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_conversation	referral	6fcf8814-d77d-4815-9a93-d3226e938b5e	\N	\N	2026-04-01T09:27:06.563Z
163551f5-3fb8-4d09-a96e-cb45d5895c09	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	6fcf8814-d77d-4815-9a93-d3226e938b5e	\N	\N	2026-04-01T09:27:11.724Z
df5a60da-6dd1-4be3-b239-e46d59c47b3c	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	6fcf8814-d77d-4815-9a93-d3226e938b5e	\N	\N	2026-04-01T09:27:11.826Z
59ef232a-a39f-4e34-ad90-a7038ebbf0e3	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	6fcf8814-d77d-4815-9a93-d3226e938b5e	\N	\N	2026-04-01T09:27:15.325Z
12ca1d52-756e-4c2d-92b1-c7e31e852523	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	65e6626d-a505-43a4-b67d-2ff5ae6e6552	{"priseEnChargeId":"c2e03b77-2254-4059-ac0c-5e3a2c9fb145","referralId":"6fcf8814-d77d-4815-9a93-d3226e938b5e","codeGenere":true}	\N	2026-04-01T09:34:52.685Z
bbd27f3f-904a-41df-9a41-21f0a7f593fe	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	f130cad7-7bf6-4d25-9e65-aa908498aeca	{"priseEnChargeId":"c2e03b77-2254-4059-ac0c-5e3a2c9fb145","referralId":"6fcf8814-d77d-4815-9a93-d3226e938b5e"}	\N	2026-04-01T09:35:19.887Z
2647fafa-88d4-4dfc-92eb-85d38eda0b04	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	9c1cebd5-82e6-4ca5-ad40-f28293c9b3dd	{"priseEnChargeId":"c2e03b77-2254-4059-ac0c-5e3a2c9fb145","referralId":"6fcf8814-d77d-4815-9a93-d3226e938b5e"}	\N	2026-04-01T09:36:14.808Z
5a4e2891-315b-459c-9f9a-32c392cdee72	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	6fcf8814-d77d-4815-9a93-d3226e938b5e	\N	\N	2026-04-01T09:42:31.193Z
21add925-2dc9-42c9-9243-9f8ed7c679c9	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	213b33be-660d-426c-aef4-769c3c9b383a	\N	\N	2026-04-01T10:56:57.844Z
97bbe625-e078-4008-aff4-25db19f94b87	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	213b33be-660d-426c-aef4-769c3c9b383a	\N	\N	2026-04-01T10:57:16.910Z
bc2056a1-b09a-4a9e-8fbd-fdf052b649a5	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	213b33be-660d-426c-aef4-769c3c9b383a	\N	\N	2026-04-01T10:57:17.002Z
a36fe0e3-266e-443e-bebd-b73680f5a491	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	213b33be-660d-426c-aef4-769c3c9b383a	\N	\N	2026-04-01T10:58:47.217Z
eaf87f92-988d-4619-b1b2-794568fb0cc9	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	3151ce0f-f033-43c6-bfb4-26d281e0d137	{"priseEnChargeId":"5ce33ce9-4eb5-4f35-9197-89433712ecde","referralId":"213b33be-660d-426c-aef4-769c3c9b383a","codeGenere":true}	\N	2026-04-01T10:59:15.183Z
4c068f97-1518-4491-804c-91fa40ca9cbc	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	e5df07b2-7182-4c1a-94d2-a9db7a50f006	{"priseEnChargeId":"5ce33ce9-4eb5-4f35-9197-89433712ecde","referralId":"213b33be-660d-426c-aef4-769c3c9b383a"}	\N	2026-04-01T11:01:31.370Z
c96401d1-39df-414c-925c-dcf97c806538	\N	login	conseiller	\N	{"email":"sc@fondation-jae.org","slug":"ml-orleans"}	\N	2026-04-01T11:20:57.657Z
cbb16db2-c971-43bb-8d72-3a458c1b5a87	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	86dade87-588a-4236-8e4a-49ac95a2e946	\N	\N	2026-04-01T11:21:07.546Z
898494e0-8039-4d57-a1a9-12abe86b560f	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	86dade87-588a-4236-8e4a-49ac95a2e946	\N	\N	2026-04-01T11:21:11.934Z
6da7bc63-1da3-44d5-9249-494a8b50c679	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	86dade87-588a-4236-8e4a-49ac95a2e946	\N	\N	2026-04-01T11:21:12.022Z
58529992-0d44-4143-a942-064cd2879858	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	86dade87-588a-4236-8e4a-49ac95a2e946	\N	\N	2026-04-01T11:21:54.045Z
0a5b8529-1137-4cd4-846c-1d77107abbc6	\N	login	conseiller	\N	{"email":"sc@fondation-jae.org","slug":"ml-orleans"}	\N	2026-04-01T14:23:27.391Z
cbd9e361-ae0f-4c21-8ba3-09a4497e91c8	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	097adf5e-c288-476f-91e6-8bda05b44436	\N	\N	2026-04-01T14:25:14.073Z
0a8a11c6-1238-4e05-b610-72acbfad94a9	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_conversation	referral	097adf5e-c288-476f-91e6-8bda05b44436	\N	\N	2026-04-01T14:25:22.667Z
53086516-e520-4ae1-946f-31acfc6945e4	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	097adf5e-c288-476f-91e6-8bda05b44436	\N	\N	2026-04-01T14:25:38.942Z
3594383d-0094-42c0-b274-3a0b05228a0f	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	097adf5e-c288-476f-91e6-8bda05b44436	\N	\N	2026-04-01T14:25:39.037Z
6bc0f72b-deb2-43ac-bb3f-5b40ca89ec1b	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	d3d02cf7-43ff-493a-9e94-c518d76a7c81	\N	\N	2026-04-01T14:26:32.402Z
25097615-f0fb-4223-bbe1-348740414753	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	d3d02cf7-43ff-493a-9e94-c518d76a7c81	\N	\N	2026-04-01T14:26:37.662Z
18c10ed6-6057-4637-8ba8-8b42c8f99f09	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	d3d02cf7-43ff-493a-9e94-c518d76a7c81	\N	\N	2026-04-01T14:26:37.762Z
362f5e7c-ee6c-4456-ae39-37c1c14f5016	\N	login	conseiller	\N	{"email":"sc@fondation-jae.org","slug":"ml-orleans"}	\N	2026-04-01T14:27:30.485Z
f26cb7b9-2c22-4389-87d9-fb18457163b9	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	4e7b591a-3639-47ad-9907-faa6d20c57f2	\N	\N	2026-04-01T14:27:41.818Z
5d39996d-3dda-42c3-abd1-2ad5c2f441f6	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	4e7b591a-3639-47ad-9907-faa6d20c57f2	\N	\N	2026-04-01T14:27:47.904Z
c0852815-bf7a-4e07-8dcb-4ae8b8de300e	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	4e7b591a-3639-47ad-9907-faa6d20c57f2	\N	\N	2026-04-01T14:27:47.997Z
4624e5f3-91eb-46a6-a228-9a0ff863ecae	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	4e7b591a-3639-47ad-9907-faa6d20c57f2	\N	\N	2026-04-01T14:28:13.870Z
2ebf83fe-01e9-46b6-a949-a49a4b5b220b	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	d91229c3-7645-4b45-a929-3701e37fdc0f	{"priseEnChargeId":"eef3c353-2e04-4b85-8814-d8c6037cbd8d","referralId":"4e7b591a-3639-47ad-9907-faa6d20c57f2","codeGenere":true}	\N	2026-04-01T14:28:53.393Z
4ce636df-45f4-4513-a387-5c042ad956ba	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	4e7b591a-3639-47ad-9907-faa6d20c57f2	\N	\N	2026-04-01T14:35:08.680Z
bc156741-5ada-4efd-8e93-9085b684d4e2	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	213b33be-660d-426c-aef4-769c3c9b383a	\N	\N	2026-04-01T14:46:25.143Z
63621ddb-4a97-4e05-b6e5-1a43a7057617	\N	login	conseiller	\N	{"email":"sc@fondation-jae.org","slug":"ml-orleans"}	\N	2026-04-01T23:13:15.879Z
c95f6a3c-f0bc-4cb7-8b80-9e1c7b398a36	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	6c3e30a5-0288-4923-821f-41f5ef8e80bf	\N	\N	2026-04-01T23:13:51.658Z
ae1b334f-2e44-46d4-86cf-0c7d15bbe4ee	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	6c3e30a5-0288-4923-821f-41f5ef8e80bf	\N	\N	2026-04-01T23:13:58.607Z
ea92795b-e853-4953-9654-dd216f572a09	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	6c3e30a5-0288-4923-821f-41f5ef8e80bf	\N	\N	2026-04-01T23:13:58.708Z
0928b288-6da3-44d8-9d5e-08061b9ef8bc	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	85286510-1682-408b-8a1c-69e8b0720e30	\N	\N	2026-04-01T23:43:46.770Z
feac1950-c430-41e6-91d6-71d43b2f9299	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	85286510-1682-408b-8a1c-69e8b0720e30	\N	\N	2026-04-01T23:43:51.254Z
f569b2a9-9780-4630-a99d-835a94a10a74	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	85286510-1682-408b-8a1c-69e8b0720e30	\N	\N	2026-04-01T23:43:51.352Z
da0af2f2-cec8-499f-9b8f-24e6e07b3542	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	seed-ref-006248	\N	\N	2026-04-01T23:49:30.659Z
736771be-be19-4fde-b467-cc2e86ebfc13	\N	login	conseiller	\N	{"email":"admin@fondation-jae.org","slug":"fondation-jae"}	\N	2026-04-02T09:17:33.061Z
9829d290-1b55-47bb-83b3-354620942974	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	view_profile	referral	8ad0441a-c00a-46e1-86f8-b74ab83ca88f	\N	\N	2026-04-02T09:22:52.547Z
fc841e46-5fcd-494d-acca-331af1100e37	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	claim_case	referral	8ad0441a-c00a-46e1-86f8-b74ab83ca88f	\N	\N	2026-04-02T09:22:57.555Z
44c6486b-c71a-48a6-852d-9935ab6f8e86	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	view_profile	referral	8ad0441a-c00a-46e1-86f8-b74ab83ca88f	\N	\N	2026-04-02T09:22:57.661Z
4523ef8d-06c5-4147-b7ed-9bd7d40c0114	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	view_conversation	referral	8ad0441a-c00a-46e1-86f8-b74ab83ca88f	\N	\N	2026-04-02T09:23:31.160Z
5db1a545-b3bd-4ac2-82d2-2cbfebe4bcfb	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	resend_code	referral	8ad0441a-c00a-46e1-86f8-b74ab83ca88f	\N	\N	2026-04-02T09:23:35.687Z
53e54d66-d928-490c-b4c9-8f259709da57	\N	login	conseiller	\N	{"email":"sc@fondation-jae.org","slug":"ml-orleans"}	\N	2026-04-02T11:24:32.851Z
fdac5109-8662-42a3-9eaa-35ff24c6b479	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	326ce51a-1284-47ec-b599-74034ea4f67b	\N	\N	2026-04-02T11:24:45.571Z
7da622da-04a6-4cd8-aec5-bcbb6e53e07b	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	326ce51a-1284-47ec-b599-74034ea4f67b	\N	\N	2026-04-02T11:24:52.123Z
1e1f7b68-f2ab-4eec-98da-95fe55e61e44	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	326ce51a-1284-47ec-b599-74034ea4f67b	\N	\N	2026-04-02T11:24:52.227Z
19ca6bad-e095-490b-9811-d08ee3716048	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	326ce51a-1284-47ec-b599-74034ea4f67b	\N	\N	2026-04-02T12:06:30.772Z
9fbfb1c8-9ceb-4746-9a57-edd54e50486f	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	326ce51a-1284-47ec-b599-74034ea4f67b	\N	\N	2026-04-02T12:18:50.087Z
2f99a23b-0df9-438a-a628-d91ffc4d08d8	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	326ce51a-1284-47ec-b599-74034ea4f67b	\N	\N	2026-04-02T12:20:55.015Z
6c2e0b56-f31b-4ad0-8991-d3bbc47abc0b	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	326ce51a-1284-47ec-b599-74034ea4f67b	\N	\N	2026-04-02T12:21:29.856Z
74838925-3437-4ff6-8f9c-9a5441de10dd	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	21cedb2f-45a0-4514-8504-e5704fadbc5a	\N	\N	2026-04-02T12:24:47.397Z
1ec12c9f-9d04-427f-b768-5b4877d5d795	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	21cedb2f-45a0-4514-8504-e5704fadbc5a	\N	\N	2026-04-02T12:24:49.472Z
69bb652d-c59e-43fc-abb8-64c87e2402b0	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	21cedb2f-45a0-4514-8504-e5704fadbc5a	\N	\N	2026-04-02T12:24:49.564Z
4d007c58-dd28-4401-9e6d-731f0c764ed7	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	21cedb2f-45a0-4514-8504-e5704fadbc5a	\N	\N	2026-04-02T12:25:12.613Z
7c5466c5-586a-4bfd-8096-b179d34090ef	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	21cedb2f-45a0-4514-8504-e5704fadbc5a	\N	\N	2026-04-02T12:26:56.703Z
0e486c42-5718-49ef-93b3-058449719985	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	39a8901f-b234-46de-b01c-59eea1d3a371	\N	\N	2026-04-02T12:34:12.617Z
7653e694-1565-49e7-94d1-400ba0bea6f6	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	39a8901f-b234-46de-b01c-59eea1d3a371	\N	\N	2026-04-02T12:34:12.797Z
22b9b44b-a249-4948-925a-d9b8ac01d111	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	d4596300-b15c-424a-8afd-85cca2c6c24b	\N	\N	2026-04-02T12:34:44.956Z
9f86989f-a679-4aa4-b07c-27551ab8a42e	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	d4596300-b15c-424a-8afd-85cca2c6c24b	\N	\N	2026-04-02T12:34:46.713Z
491951e1-60ab-475f-b715-a161f7741b76	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	d4596300-b15c-424a-8afd-85cca2c6c24b	\N	\N	2026-04-02T12:34:46.804Z
6171b303-8b1b-4258-99df-7a53e6e2dede	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	5a2b72be-d4ba-425a-bf81-61a01aa8deaf	\N	\N	2026-04-02T12:52:05.938Z
68239556-cd5f-4034-a6d9-f4c914c50eda	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	5a2b72be-d4ba-425a-bf81-61a01aa8deaf	\N	\N	2026-04-02T12:52:17.604Z
399017a8-9824-45c0-aa01-7a9288c6d1e9	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	5a2b72be-d4ba-425a-bf81-61a01aa8deaf	\N	\N	2026-04-02T12:52:17.711Z
9697ddbb-4adf-4ac1-89cc-15d1c37bac4b	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	72718fe4-d3c3-49bd-b266-3e5f4465676b	\N	\N	2026-04-02T13:01:26.302Z
57bed4ea-2bd0-4cd0-bea1-7178de1aee66	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	72718fe4-d3c3-49bd-b266-3e5f4465676b	\N	\N	2026-04-02T13:01:30.294Z
f9adec34-b2fa-4ce6-88b2-70fbc8e77370	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	72718fe4-d3c3-49bd-b266-3e5f4465676b	\N	\N	2026-04-02T13:01:30.396Z
45c835a8-ec5f-4af4-b51d-ccc28ab1ac5c	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	45f06f6a-5cb8-4619-ad85-21bb67cc1ea0	\N	\N	2026-04-02T13:03:27.401Z
e2a43b0b-4fca-474c-96aa-061278124a7d	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	45f06f6a-5cb8-4619-ad85-21bb67cc1ea0	\N	\N	2026-04-02T13:03:29.355Z
e86aa670-5d8f-47b1-b911-fabe93b1797a	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	45f06f6a-5cb8-4619-ad85-21bb67cc1ea0	\N	\N	2026-04-02T13:03:29.443Z
b1bec5d5-d755-4b16-9550-114e8b30a99d	\N	login	conseiller	\N	{"email":"fl@fondation-jae.org","slug":"ml-bords-de-marne"}	\N	2026-04-02T15:08:25.049Z
d025e16b-1bc6-460e-931d-6dace195c4c7	38631b01-9d23-47dc-be1f-f82126c2a72c	claim_case	referral	9b4e6226-44b6-4779-b91b-6902be4d8172	\N	\N	2026-04-02T15:08:45.892Z
b31754dd-902e-4f40-b53e-ada866491d06	38631b01-9d23-47dc-be1f-f82126c2a72c	view_profile	referral	9b4e6226-44b6-4779-b91b-6902be4d8172	\N	\N	2026-04-02T15:08:46.188Z
040a4ae8-0339-48ce-94e1-67e300ac8915	38631b01-9d23-47dc-be1f-f82126c2a72c	view_conversation	referral	9b4e6226-44b6-4779-b91b-6902be4d8172	\N	\N	2026-04-02T15:08:48.358Z
b57b0a9b-341c-41c7-9098-319c46024f4d	38631b01-9d23-47dc-be1f-f82126c2a72c	view_profile	referral	9b4e6226-44b6-4779-b91b-6902be4d8172	\N	\N	2026-04-02T15:09:11.842Z
7126d36a-d56a-4084-b15f-a55355067925	38631b01-9d23-47dc-be1f-f82126c2a72c	view_conversation	referral	9b4e6226-44b6-4779-b91b-6902be4d8172	\N	\N	2026-04-02T15:09:13.467Z
9dd83552-c595-4d4d-948e-ee9267169874	38631b01-9d23-47dc-be1f-f82126c2a72c	logout	\N	\N	\N	\N	2026-04-02T15:09:44.642Z
7826c472-fd6e-4c13-8b41-f314e856586d	\N	login	conseiller	\N	{"email":"admin@fondation-jae.org","slug":"fondation-jae"}	\N	2026-04-02T15:10:15.347Z
677ee402-12f5-44f5-9520-c1ffb217254d	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	logout	\N	\N	\N	\N	2026-04-02T15:11:10.086Z
194c1d87-e696-4989-bd7d-d3ad3f2731f3	\N	login	conseiller	\N	{"email":"fl@fondation-jae.org","slug":"ml-bords-de-marne"}	\N	2026-04-02T15:11:19.183Z
e394ce8b-a77c-4da2-b4d7-28be830bf4d6	38631b01-9d23-47dc-be1f-f82126c2a72c	view_profile	referral	9b4e6226-44b6-4779-b91b-6902be4d8172	\N	\N	2026-04-02T15:11:38.150Z
01e20d58-3407-46b0-b225-39bc22a5cdcd	38631b01-9d23-47dc-be1f-f82126c2a72c	update_status	prise_en_charge	3f151f07-b493-4f9a-bcf5-ca7868ce95e2	{"ancien":"prise_en_charge","nouveau":"terminee"}	\N	2026-04-02T15:11:45.468Z
ed65b241-2bbd-4ec7-ad09-73eff4e1e6aa	38631b01-9d23-47dc-be1f-f82126c2a72c	view_profile	referral	9b4e6226-44b6-4779-b91b-6902be4d8172	\N	\N	2026-04-02T15:11:45.561Z
c8f5e675-870c-4bd3-b62e-c538c2ab3367	38631b01-9d23-47dc-be1f-f82126c2a72c	view_conversation	referral	9b4e6226-44b6-4779-b91b-6902be4d8172	\N	\N	2026-04-02T15:12:58.607Z
b2b7cd4f-3392-495d-8c83-5e695bb0980e	38631b01-9d23-47dc-be1f-f82126c2a72c	logout	\N	\N	\N	\N	2026-04-02T15:20:36.759Z
19d89409-abda-4fc5-a01c-e1164b3f6c33	\N	login	conseiller	\N	{"email":"admin@fondation-jae.org","slug":"fondation-jae"}	\N	2026-04-02T15:23:52.403Z
d8119ad3-46f1-4b7d-8c69-ef6398bc8a28	\N	login	conseiller	\N	{"email":"sc@fondation-jae.org","slug":"ml-orleans"}	\N	2026-04-02T15:40:13.049Z
cdadbafe-da6a-4747-bc8e-27464392247e	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	6382c9d3-7b67-42f4-859f-efd097228cb3	\N	\N	2026-04-02T15:40:24.371Z
1aa563b5-7464-47e3-bea6-a94d75495e66	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	6382c9d3-7b67-42f4-859f-efd097228cb3	\N	\N	2026-04-02T15:40:26.743Z
b623ffad-2148-43b0-a136-e10671c99bca	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	6382c9d3-7b67-42f4-859f-efd097228cb3	\N	\N	2026-04-02T15:40:26.868Z
4d1b4dc2-2dbf-4e5a-a267-9e2bb5a43be0	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	caa87b7c-ed4b-43fa-8589-2890bdbc2894	{"priseEnChargeId":"1058ee58-274e-41bb-bb03-3610175ff094","referralId":"6382c9d3-7b67-42f4-859f-efd097228cb3","codeGenere":true}	\N	2026-04-02T15:40:31.760Z
fcd9c8c5-e03c-4061-9e57-4115b98e6af7	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	35c9e894-0744-455e-9f33-b882726a6fad	{"priseEnChargeId":"1058ee58-274e-41bb-bb03-3610175ff094","referralId":"6382c9d3-7b67-42f4-859f-efd097228cb3"}	\N	2026-04-02T15:40:55.268Z
a4670c60-4961-45e2-8530-813cb6c388e3	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_conversation	referral	6382c9d3-7b67-42f4-859f-efd097228cb3	\N	\N	2026-04-02T15:40:57.632Z
92a575e7-cc83-46b8-a85b-4ab45a5e4d14	\N	login	conseiller	\N	{"email":"jean.martin@cio-lyon.fr","slug":"cio-lyon"}	\N	2026-04-02T17:17:16.284Z
d2f9cc1b-66ff-4ae5-b074-9830920aafd0	e0d19945-7ea9-4c05-9def-2e7621de0e64	view_profile	referral	seed-ref-002669	\N	\N	2026-04-02T17:17:25.146Z
0d5f7b3a-93bc-4dfa-b4f9-0b4b71c012b6	e0d19945-7ea9-4c05-9def-2e7621de0e64	claim_case	referral	seed-ref-002669	\N	\N	2026-04-02T17:17:30.800Z
e189b623-31b1-44f8-957c-cadbbd2d8f42	e0d19945-7ea9-4c05-9def-2e7621de0e64	view_profile	referral	seed-ref-002669	\N	\N	2026-04-02T17:17:30.899Z
fb46ab62-0225-4127-9ea0-7db20f58a599	\N	login	conseiller	\N	{"email":"sc@fondation-jae.org","slug":"ml-orleans"}	\N	2026-04-02T19:08:11.455Z
95848329-ee21-416b-99b5-d8941d571aad	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	15ea24be-c4e5-48be-a932-e46812656786	\N	\N	2026-04-02T19:15:37.607Z
ba26b340-acac-4964-a314-b62ad889bb46	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	15ea24be-c4e5-48be-a932-e46812656786	\N	\N	2026-04-02T19:15:41.018Z
3d6f2421-d1d0-4121-8ea0-0d31bbee7f9a	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	15ea24be-c4e5-48be-a932-e46812656786	\N	\N	2026-04-02T19:15:41.140Z
86361a3c-72d8-4fa4-aa41-bbb4807fa914	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	15ea24be-c4e5-48be-a932-e46812656786	\N	\N	2026-04-02T19:18:45.640Z
2b9af945-b21a-45a9-8a23-41c0bdb14eda	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	66a2f302-1c4b-4eb6-a24d-5132bce5e269	{"priseEnChargeId":"b7d8d0da-9dbe-435b-b8f2-f682a8d51e67","referralId":"15ea24be-c4e5-48be-a932-e46812656786","codeGenere":true}	\N	2026-04-02T19:22:12.518Z
e79d21c6-4b20-47ac-a41e-74f9f540fa3b	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	3d6e6961-1d6c-46dd-bdf1-273034b09efb	{"priseEnChargeId":"b7d8d0da-9dbe-435b-b8f2-f682a8d51e67","referralId":"15ea24be-c4e5-48be-a932-e46812656786","codeGenere":true}	\N	2026-04-02T19:24:56.930Z
e79dde66-9118-4b25-be8f-5bf11880e092	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	15ea24be-c4e5-48be-a932-e46812656786	\N	\N	2026-04-02T19:25:05.331Z
74993f9c-a3e9-44b7-aa04-3b8dc97bc60a	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	2f1b9238-a83a-405c-8110-9934931f96e8	{"priseEnChargeId":"b7d8d0da-9dbe-435b-b8f2-f682a8d51e67","referralId":"15ea24be-c4e5-48be-a932-e46812656786","codeGenere":true}	\N	2026-04-02T19:27:02.253Z
b62f7bce-fa04-4f38-8d2d-c73268e79567	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	15ea24be-c4e5-48be-a932-e46812656786	\N	\N	2026-04-02T19:27:18.215Z
b329cd73-ebe3-41f9-be9e-9a260b282f4b	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	15ea24be-c4e5-48be-a932-e46812656786	\N	\N	2026-04-02T19:39:47.452Z
7ffa98a1-48a1-49e9-bb4c-dba45d602262	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	15ea24be-c4e5-48be-a932-e46812656786	\N	\N	2026-04-02T19:39:54.993Z
22248772-3d11-4ea3-a150-7205ac498c02	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	9f9a391e-d3bf-4853-99e4-1e3a07f00e6a	{"priseEnChargeId":"b7d8d0da-9dbe-435b-b8f2-f682a8d51e67","referralId":"15ea24be-c4e5-48be-a932-e46812656786","codeGenere":true}	\N	2026-04-02T19:40:05.211Z
da17f565-adbf-476e-95e6-b43ab21e21e5	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	e3b75f0a-36af-4d7f-b5b7-9ed01332db3b	{"priseEnChargeId":"b7d8d0da-9dbe-435b-b8f2-f682a8d51e67","referralId":"15ea24be-c4e5-48be-a932-e46812656786","codeGenere":true}	\N	2026-04-02T19:41:22.369Z
5338064c-0af3-4c70-8493-7518a7265a14	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	15ea24be-c4e5-48be-a932-e46812656786	\N	\N	2026-04-02T19:41:31.135Z
d92b383a-303e-4966-9924-3d4694c98d5b	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	7899d241-37c7-43a4-99ac-0e02b86dc61d	{"priseEnChargeId":"b7d8d0da-9dbe-435b-b8f2-f682a8d51e67","referralId":"15ea24be-c4e5-48be-a932-e46812656786","codeGenere":true}	\N	2026-04-02T19:46:45.802Z
a31646a9-8e1c-410e-9405-693d96b1ba0d	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	15ea24be-c4e5-48be-a932-e46812656786	\N	\N	2026-04-02T19:46:55.229Z
c7cc787b-163c-4c90-8f66-b941b3133dec	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	15ea24be-c4e5-48be-a932-e46812656786	\N	\N	2026-04-02T19:56:41.267Z
40b66a6b-6576-404e-855f-0bf2173731cc	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	15ea24be-c4e5-48be-a932-e46812656786	\N	\N	2026-04-02T19:58:11.085Z
1e5e86ff-860c-4c93-a8c7-f2718409e97d	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	15ea24be-c4e5-48be-a932-e46812656786	\N	\N	2026-04-02T19:59:53.583Z
bc92f1fc-c7d6-409e-97a2-ada4d7e1cfa4	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	15ea24be-c4e5-48be-a932-e46812656786	\N	\N	2026-04-02T20:01:28.412Z
9ae5e7ab-334d-4b04-a757-7a102a291f9b	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	15ea24be-c4e5-48be-a932-e46812656786	\N	\N	2026-04-02T20:02:52.438Z
b1349c25-842d-4abd-b6c0-d3fbe7b434c3	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	15ea24be-c4e5-48be-a932-e46812656786	\N	\N	2026-04-02T20:04:24.943Z
c9a44e36-74a6-47c6-b5cf-be4683b87beb	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	15ea24be-c4e5-48be-a932-e46812656786	\N	\N	2026-04-02T20:05:43.761Z
18520ba9-3f96-4b24-ad96-da28ff8ee1bb	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	22ddedea-113c-4921-8d45-5b9989772559	\N	\N	2026-04-02T20:06:22.939Z
197ad6d0-0268-4ba4-b319-a5d0e3129a2e	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	22ddedea-113c-4921-8d45-5b9989772559	\N	\N	2026-04-02T20:06:28.463Z
b4dc141f-c5f4-4b16-99f0-1d6114d382b9	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	22ddedea-113c-4921-8d45-5b9989772559	\N	\N	2026-04-02T20:06:28.573Z
d990363d-5576-4eb1-a844-4803ff1fa75b	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	22ddedea-113c-4921-8d45-5b9989772559	\N	\N	2026-04-02T20:06:41.090Z
46855db3-3f16-4faf-b0df-87d3a81f363a	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	48847d30-94d8-4144-94d5-41941414636d	{"priseEnChargeId":"64590ec9-0e45-4176-af6b-4b8f0925ab65","referralId":"22ddedea-113c-4921-8d45-5b9989772559","codeGenere":true}	\N	2026-04-02T20:08:13.605Z
effe5607-7bc3-48b4-a5cb-8349b22e1eac	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	1d27f9e9-4417-4d0b-8146-45a30984e4af	{"priseEnChargeId":"64590ec9-0e45-4176-af6b-4b8f0925ab65","referralId":"22ddedea-113c-4921-8d45-5b9989772559"}	\N	2026-04-02T20:08:35.816Z
22e235a8-a9d7-4621-9779-fd9b18bb9940	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	22ddedea-113c-4921-8d45-5b9989772559	\N	\N	2026-04-02T20:15:31.927Z
a2febc78-f7dd-4079-b848-8317412e96ae	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	71bb5821-46b7-499e-afca-767d8348d6af	\N	\N	2026-04-02T20:19:06.786Z
c53db06f-6034-450a-ad88-88d404e32dac	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	71bb5821-46b7-499e-afca-767d8348d6af	\N	\N	2026-04-02T20:19:08.512Z
36642b80-ac2b-4397-8632-a290c2642eb3	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	71bb5821-46b7-499e-afca-767d8348d6af	\N	\N	2026-04-02T20:19:08.598Z
91198774-9d8b-43e7-a930-9ae8f9be2130	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	71bb5821-46b7-499e-afca-767d8348d6af	\N	\N	2026-04-02T20:19:10.631Z
755e21f0-09b4-405f-ab71-e49d29cd9aef	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	cc04a708-b4de-43e8-ad80-08122c776e4a	{"priseEnChargeId":"19819b81-9d56-4f72-be31-d00ec314769b","referralId":"71bb5821-46b7-499e-afca-767d8348d6af","codeGenere":true}	\N	2026-04-02T20:22:07.127Z
16f95857-b9b9-4b60-bdd9-83c07c42691c	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	71bb5821-46b7-499e-afca-767d8348d6af	\N	\N	2026-04-02T20:22:14.459Z
ca00ba7f-ade8-4d69-a5cf-70abf2649aea	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	698e7fee-e1f2-44be-9442-1e667655881f	{"priseEnChargeId":"19819b81-9d56-4f72-be31-d00ec314769b","referralId":"71bb5821-46b7-499e-afca-767d8348d6af"}	\N	2026-04-02T20:23:32.474Z
5b1993a2-dfaf-45d7-955e-56a8c3eaae60	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	59fc521a-79e5-45c4-877e-de8011474c61	{"priseEnChargeId":"19819b81-9d56-4f72-be31-d00ec314769b","referralId":"71bb5821-46b7-499e-afca-767d8348d6af"}	\N	2026-04-02T20:34:25.978Z
96fd8f77-490c-44c2-b92c-5f7d99908625	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	9cb182f5-df73-4d5e-8f41-c5140bde4393	{"priseEnChargeId":"19819b81-9d56-4f72-be31-d00ec314769b","referralId":"71bb5821-46b7-499e-afca-767d8348d6af"}	\N	2026-04-02T20:35:18.424Z
69f173bf-4813-4de3-a40b-ce307b00676d	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	7d8c53c1-d540-4dab-93f7-5fe8b12ecf58	{"priseEnChargeId":"19819b81-9d56-4f72-be31-d00ec314769b","referralId":"71bb5821-46b7-499e-afca-767d8348d6af"}	\N	2026-04-02T20:35:27.908Z
3e4a7902-5ac5-42a8-b0dd-8752ad0460c1	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	243ee027-ef61-404b-804d-392a356e6076	\N	\N	2026-04-02T20:36:08.516Z
cad240d3-ea6e-4101-ab43-0e8e721b166a	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	243ee027-ef61-404b-804d-392a356e6076	\N	\N	2026-04-02T20:36:10.663Z
204a4b1a-3354-4fa3-b7f7-dbb93b36ef1c	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	243ee027-ef61-404b-804d-392a356e6076	\N	\N	2026-04-02T20:36:10.794Z
27d009e4-f35b-45ac-8842-24838aa3c9c9	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	d75b659a-251e-48b4-b86a-bdb203360fe5	{"priseEnChargeId":"694b4b72-2e31-4bd6-8f52-1f3c60c9be80","referralId":"243ee027-ef61-404b-804d-392a356e6076","codeGenere":true}	\N	2026-04-02T20:36:16.185Z
053a83fb-4fb8-43f4-9455-e6f589778696	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	cf697de9-219f-4fc0-9a58-e328eac6bfc9	\N	\N	2026-04-03T08:20:58.291Z
e93bb7eb-2531-4b1b-bc2a-cbf3f80bacad	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	914816a5-1925-45ab-b75e-28c9528d6e81	{"priseEnChargeId":"694b4b72-2e31-4bd6-8f52-1f3c60c9be80","referralId":"243ee027-ef61-404b-804d-392a356e6076"}	\N	2026-04-02T20:36:55.176Z
be75962b-6f3c-496c-969f-5589b6faa96e	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	31eeab7f-b082-4f92-8a1a-1a3aa1cbe407	{"priseEnChargeId":"694b4b72-2e31-4bd6-8f52-1f3c60c9be80","referralId":"243ee027-ef61-404b-804d-392a356e6076"}	\N	2026-04-02T20:49:24.774Z
67135a51-f94f-4c09-992f-58c7d78c4136	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	b92df656-0055-448d-8b14-0689d648e7b1	{"priseEnChargeId":"694b4b72-2e31-4bd6-8f52-1f3c60c9be80","referralId":"243ee027-ef61-404b-804d-392a356e6076"}	\N	2026-04-02T20:49:52.230Z
4d0b8fef-97d5-4094-975f-95ca6ea8fe3b	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	243ee027-ef61-404b-804d-392a356e6076	\N	\N	2026-04-02T20:54:06.484Z
4c7bdb18-b7f4-4d64-9f5a-410b9525420d	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	ced0a251-7ae7-4887-a877-5ff93b09c1db	{"priseEnChargeId":"694b4b72-2e31-4bd6-8f52-1f3c60c9be80","referralId":"243ee027-ef61-404b-804d-392a356e6076"}	\N	2026-04-02T20:55:02.613Z
540489a4-f677-4982-a6bc-30a33b0b312e	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	8bd6c7d5-fbc9-4855-b0c3-0772e74c8e8b	\N	\N	2026-04-02T21:06:11.804Z
4b62fd6e-170a-4c7c-8838-7f39b399a72e	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	8bd6c7d5-fbc9-4855-b0c3-0772e74c8e8b	\N	\N	2026-04-02T21:06:16.220Z
19df91b6-4f74-4851-b4ab-b29328b4708c	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	8bd6c7d5-fbc9-4855-b0c3-0772e74c8e8b	\N	\N	2026-04-02T21:06:16.315Z
47ebb7a9-2ee7-4f5d-9bb7-d5e9b4e15f4c	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	8bd6c7d5-fbc9-4855-b0c3-0772e74c8e8b	\N	\N	2026-04-02T21:06:25.669Z
772580a5-e381-4d94-9b5d-a4af548fb983	287c9b3a-c93e-4d89-ade3-e56b1059212e	update_status	prise_en_charge	24d3fbab-ac60-4ca9-b07c-215ee38b0d33	{"ancien":"prise_en_charge","nouveau":"abandonnee"}	\N	2026-04-02T21:12:22.002Z
b56c9583-e0b4-4bf7-9578-4b634f42c319	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	8bd6c7d5-fbc9-4855-b0c3-0772e74c8e8b	\N	\N	2026-04-02T21:12:22.121Z
879ad656-7992-443c-90c3-7ccb082f0664	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	243ee027-ef61-404b-804d-392a356e6076	\N	\N	2026-04-02T21:13:30.810Z
143f3f4c-8c4c-4d17-9940-ddda81ff4f4e	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	c331bb16-a4db-45e8-a869-3331f8e1be0e	\N	\N	2026-04-02T21:27:37.689Z
029ac8b7-0217-4d81-952d-70ffe4f0c6f5	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	c331bb16-a4db-45e8-a869-3331f8e1be0e	\N	\N	2026-04-02T21:27:40.265Z
65b90ebc-0504-4b75-ba8a-42d289e2b760	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	c331bb16-a4db-45e8-a869-3331f8e1be0e	\N	\N	2026-04-02T21:27:40.360Z
d8c18220-3b46-4286-ad42-52760c155387	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	ad90f0f9-ab6a-4dfc-8eec-5cb995e43580	{"priseEnChargeId":"fdc6306d-b12c-4041-8333-001a9becf710","referralId":"c331bb16-a4db-45e8-a869-3331f8e1be0e","codeGenere":true}	\N	2026-04-02T21:27:48.671Z
0abf5335-0840-490b-b12f-a1086eca9c2f	\N	login	conseiller	\N	{"email":"sc@fondation-jae.org","slug":"ml-orleans"}	\N	2026-04-02T22:07:19.886Z
8c19bfc3-fda1-45c6-ac12-21323478ce26	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	c85402d1-4434-4f8b-8470-116943769b80	\N	\N	2026-04-02T22:09:09.873Z
0a450576-dd47-43ff-b223-0f8f73fc2ddf	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	c85402d1-4434-4f8b-8470-116943769b80	\N	\N	2026-04-02T22:09:18.791Z
d580de1a-9f0d-47e1-97ff-83e8a151b2f3	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	c85402d1-4434-4f8b-8470-116943769b80	\N	\N	2026-04-02T22:09:19.255Z
804e1285-fb43-4d31-9311-9180340698b8	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	fff6b3d1-4cfa-43f6-ade4-8f8de9faff8a	\N	\N	2026-04-02T22:11:29.224Z
ef87c2b2-02ab-49d4-ab11-15bf7562dc67	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	fff6b3d1-4cfa-43f6-ade4-8f8de9faff8a	\N	\N	2026-04-02T22:11:32.593Z
185bad19-a30e-44c4-9030-f1a569d5ed9f	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	fff6b3d1-4cfa-43f6-ade4-8f8de9faff8a	\N	\N	2026-04-02T22:11:33.034Z
b9365e5b-aeb6-44e7-908c-8dea2113a7f9	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	fff6b3d1-4cfa-43f6-ade4-8f8de9faff8a	\N	\N	2026-04-02T22:12:06.280Z
7666b1e5-8d79-4d6d-844e-cd3fe389bcb3	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	b6429b00-c4dc-4e64-80a5-eee9bb0de783	{"priseEnChargeId":"7de793e7-dfa4-4b06-8edb-3fb88bec9eee","referralId":"fff6b3d1-4cfa-43f6-ade4-8f8de9faff8a"}	\N	2026-04-02T22:12:51.372Z
ea57e913-108a-4186-8b9f-c7d2c228de8b	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	fff6b3d1-4cfa-43f6-ade4-8f8de9faff8a	\N	\N	2026-04-02T22:13:15.949Z
0a55df97-d612-4e24-98d4-9c9ed7be9dac	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	517368f7-f403-474b-8b34-3cd2241b82f0	{"priseEnChargeId":"7de793e7-dfa4-4b06-8edb-3fb88bec9eee","referralId":"fff6b3d1-4cfa-43f6-ade4-8f8de9faff8a"}	\N	2026-04-02T22:13:26.562Z
a412f5d0-d372-4084-ba86-a774ff143988	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	22a79990-542c-4010-8f63-383b18de59fd	{"priseEnChargeId":"7de793e7-dfa4-4b06-8edb-3fb88bec9eee","referralId":"fff6b3d1-4cfa-43f6-ade4-8f8de9faff8a"}	\N	2026-04-02T22:16:37.116Z
a817667c-81a8-4a51-8d48-8d529a98bf07	\N	login	conseiller	\N	{"email":"sc@fondation-jae.org","slug":"ml-orleans"}	\N	2026-04-02T22:46:51.215Z
250a4fea-addc-43f9-9ece-e1d1b155de13	\N	login	conseiller	\N	{"email":"sc@fondation-jae.org","slug":"ml-orleans"}	\N	2026-04-02T22:57:12.846Z
411f4f2a-2dd0-4698-a1e6-8deffb6f9b47	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	c85402d1-4434-4f8b-8470-116943769b80	\N	\N	2026-04-02T23:12:07.829Z
b627f9b7-fe1a-4e4b-bd69-4e45088922c3	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	fff6b3d1-4cfa-43f6-ade4-8f8de9faff8a	\N	\N	2026-04-02T23:12:21.771Z
bcc74d6e-ed15-4617-a34b-34cdceccb59d	\N	login	conseiller	\N	{"email":"sc@fondation-jae.org","slug":"ml-orleans"}	\N	2026-04-02T23:22:20.649Z
65266e75-065f-47d0-a662-82da54864d53	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	d7b9f9f6-5e77-42bf-a6f1-9ff39c755329	\N	\N	2026-04-02T23:26:53.631Z
66f14193-80d7-4bdf-8e88-c8186f33c012	\N	login	conseiller	\N	{"email":"sc@fondation-jae.org","slug":"ml-orleans"}	\N	2026-04-03T05:08:05.805Z
350f7720-ed7f-4e8a-87eb-630bbb5681ad	\N	login	conseiller	\N	{"email":"sc@fondation-jae.org","slug":"ml-orleans"}	\N	2026-04-03T08:19:10.291Z
d625e0a9-211d-4a82-97e7-d2dd178ddc87	\N	login	conseiller	\N	{"email":"sc@fondation-jae.org","slug":"ml-orleans"}	\N	2026-04-03T08:20:13.818Z
4c818265-b6d0-4443-93c0-8cfd6adaa697	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	cf697de9-219f-4fc0-9a58-e328eac6bfc9	\N	\N	2026-04-03T08:20:44.945Z
3c922643-5fe7-404e-95ec-17705ebb517a	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	cf697de9-219f-4fc0-9a58-e328eac6bfc9	\N	\N	2026-04-03T08:20:59.574Z
6e7ce7de-e5c9-48ff-8bef-2f9d9623bf5c	287c9b3a-c93e-4d89-ade3-e56b1059212e	resend_code	referral	cf697de9-219f-4fc0-9a58-e328eac6bfc9	\N	\N	2026-04-03T08:21:56.182Z
7953f832-0343-44f2-b6b0-5bcaceecbb7c	\N	login	conseiller	\N	{"email":"admin@fondation-jae.org","slug":"fondation-jae"}	\N	2026-04-03T09:13:50.298Z
54eea1bd-faaa-48f3-9728-91b05883ee8d	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	view_profile	referral	87b94169-d25d-452d-bf50-cad4f248d51d	\N	\N	2026-04-03T09:17:14.770Z
0eaa9867-88a8-43cf-8354-2d0291447119	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	claim_case	referral	87b94169-d25d-452d-bf50-cad4f248d51d	\N	\N	2026-04-03T09:17:27.181Z
523f6762-3b80-4a60-9472-c639656e06d8	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	view_profile	referral	87b94169-d25d-452d-bf50-cad4f248d51d	\N	\N	2026-04-03T09:17:28.204Z
db3413fa-a12a-42c9-b0d9-4b29e9f39923	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	send_direct_message	message_direct	a9c545de-6821-49ad-9a1f-09311f234946	{"priseEnChargeId":"74d907fd-b30e-48b3-92e2-70f8a8eb6aa7","referralId":"87b94169-d25d-452d-bf50-cad4f248d51d"}	\N	2026-04-03T09:18:31.261Z
c840d253-6806-4f77-82e3-0fa344a8c72e	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	send_direct_message	message_direct	7673a698-a62e-43cf-9345-0c99e1dcf27e	{"priseEnChargeId":"74d907fd-b30e-48b3-92e2-70f8a8eb6aa7","referralId":"87b94169-d25d-452d-bf50-cad4f248d51d"}	\N	2026-04-03T09:18:42.972Z
69275f22-f5ea-4fce-9fa2-b8bbbd19e61b	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	cf697de9-219f-4fc0-9a58-e328eac6bfc9	\N	\N	2026-04-03T09:22:43.860Z
acfeb486-008c-4871-9a2e-aeb4dccbabe9	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	view_profile	referral	562a0822-c7da-43fb-8e1a-bd583620960e	\N	\N	2026-04-03T09:25:05.535Z
02766c0f-2c7d-498c-b04b-b7f0e9d3c8ff	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	claim_case	referral	562a0822-c7da-43fb-8e1a-bd583620960e	\N	\N	2026-04-03T09:25:15.146Z
42cc749a-c6f6-4211-8574-7a2a1ad11a2f	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	view_profile	referral	562a0822-c7da-43fb-8e1a-bd583620960e	\N	\N	2026-04-03T09:25:15.563Z
8c29835d-ae39-467a-92f9-0b88d36cd45e	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	send_direct_message	message_direct	49d6dcde-4e39-434c-b1cf-7960d793bc7a	{"priseEnChargeId":"35f01748-4212-49a2-bf03-4cf05f87efdf","referralId":"562a0822-c7da-43fb-8e1a-bd583620960e"}	\N	2026-04-03T09:26:30.189Z
b445fd42-248b-489f-8c11-b418d5626531	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	81c191a3-9b46-4135-93d5-cc43146ad2ec	\N	\N	2026-04-03T09:29:48.101Z
731112d7-29f6-4c3e-a06c-1fcc64f3229d	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	81c191a3-9b46-4135-93d5-cc43146ad2ec	\N	\N	2026-04-03T09:29:50.004Z
1f6b923f-22ca-4037-9aa3-623beb097368	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	81c191a3-9b46-4135-93d5-cc43146ad2ec	\N	\N	2026-04-03T09:29:51.957Z
199352b9-f4f7-4b9a-b9d8-15f157ef04ed	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	logout	\N	\N	\N	\N	2026-04-03T09:30:02.399Z
5e8812c5-0099-4699-be53-eb32467db216	\N	login	conseiller	\N	{"email":"admin@fondation-jae.org","slug":"fondation-jae"}	\N	2026-04-03T09:30:04.949Z
1f132ad7-5e50-4f33-9f09-105cdb98a61c	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	logout	\N	\N	\N	\N	2026-04-03T09:31:06.344Z
2ffa954e-8682-4b18-9459-94fe64c4a0ef	\N	login	conseiller	\N	{"email":"fl@fondation-jae.org","slug":"ml-bords-de-marne"}	\N	2026-04-03T09:31:11.836Z
15fa7626-2951-4af6-a369-9b41bc5d7e90	38631b01-9d23-47dc-be1f-f82126c2a72c	claim_case	referral	314e392d-bf0c-4117-a28a-2109c9a97c8f	\N	\N	2026-04-03T09:34:50.618Z
601314fc-40ac-46d0-919c-d07d804dfa76	38631b01-9d23-47dc-be1f-f82126c2a72c	view_profile	referral	314e392d-bf0c-4117-a28a-2109c9a97c8f	\N	\N	2026-04-03T09:34:51.772Z
2c35038f-03b8-4a6b-9174-434fcfa59d05	38631b01-9d23-47dc-be1f-f82126c2a72c	resend_code	referral	314e392d-bf0c-4117-a28a-2109c9a97c8f	\N	\N	2026-04-03T09:37:42.153Z
bc5b8083-776f-4c8a-b6ad-e6a5faf75440	38631b01-9d23-47dc-be1f-f82126c2a72c	logout	\N	\N	\N	\N	2026-04-03T09:44:50.665Z
27844cf6-1514-49b2-be18-b729ce17985a	\N	login	conseiller	\N	{"email":"admin@fondation-jae.org","slug":"fondation-jae"}	\N	2026-04-03T09:44:53.558Z
25d9c257-f27e-44b2-a842-2ab2ebca3181	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	view_profile	referral	750d5b42-8c54-439d-8daa-2e92b17dbc6d	\N	\N	2026-04-03T09:46:58.946Z
4abe8382-3204-4c7e-a65a-409766bd98b5	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	claim_case	referral	750d5b42-8c54-439d-8daa-2e92b17dbc6d	\N	\N	2026-04-03T09:47:01.307Z
b60d6d17-235a-449b-a0d3-42da37cbe048	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	view_profile	referral	750d5b42-8c54-439d-8daa-2e92b17dbc6d	\N	\N	2026-04-03T09:47:01.775Z
7373b6a1-cc4e-4afd-8e9c-f2f296ccafb8	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	view_profile	referral	750d5b42-8c54-439d-8daa-2e92b17dbc6d	\N	\N	2026-04-03T09:47:46.886Z
54881671-dc50-4c28-b3b3-05991d41a394	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	view_conversation	referral	750d5b42-8c54-439d-8daa-2e92b17dbc6d	\N	\N	2026-04-03T09:47:48.845Z
da3d2f98-ee36-47f9-8fcd-03a825a6b395	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	send_direct_message	message_direct	b267f406-9855-413b-9bb0-437fef8f40d2	{"priseEnChargeId":"228dab26-1f7d-4d7e-b9e6-0794b5a50b9b","referralId":"750d5b42-8c54-439d-8daa-2e92b17dbc6d"}	\N	2026-04-03T09:47:53.008Z
6e6abf51-c81c-4fb8-bccf-f6807db98d8d	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	view_profile	referral	750d5b42-8c54-439d-8daa-2e92b17dbc6d	\N	\N	2026-04-03T09:56:59.346Z
f7ad8d93-73b6-4df7-870f-2543be491b16	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	resend_code	referral	750d5b42-8c54-439d-8daa-2e92b17dbc6d	\N	\N	2026-04-03T09:57:03.286Z
470290de-8f9b-40a8-b0d8-78837431ff55	\N	login	conseiller	\N	{"email":"admin@fondation-jae.org","slug":"fondation-jae"}	\N	2026-04-03T12:36:03.748Z
0b142210-cfd8-4874-9809-f79b0211d0af	\N	login	conseiller	\N	{"email":"sc@fondation-jae.org","slug":"ml-orleans"}	\N	2026-04-03T14:13:04.090Z
65cb7d5e-98d6-4e43-8347-7685571b2379	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	2a4d122c-8eae-4a9c-b7d7-954f39f2d262	\N	\N	2026-04-03T14:48:57.914Z
96b1d668-2858-4412-a448-a5ba5fe0401d	287c9b3a-c93e-4d89-ade3-e56b1059212e	claim_case	referral	2a4d122c-8eae-4a9c-b7d7-954f39f2d262	\N	\N	2026-04-03T14:49:04.364Z
e6a60621-5143-43bd-8fb8-e66955da6a88	287c9b3a-c93e-4d89-ade3-e56b1059212e	view_profile	referral	2a4d122c-8eae-4a9c-b7d7-954f39f2d262	\N	\N	2026-04-03T14:49:04.905Z
1a2936a0-b385-42b2-8a86-dfd06eaecf23	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	80c58cee-a10f-4f1f-828c-0846d3b2d935	{"priseEnChargeId":"fbea240b-ffa9-4f9e-aa63-e358fd1c59b0","referralId":"2a4d122c-8eae-4a9c-b7d7-954f39f2d262"}	\N	2026-04-03T14:49:11.490Z
3c4d1a84-133a-4e22-ad27-8a34e9cf8cdf	287c9b3a-c93e-4d89-ade3-e56b1059212e	send_direct_message	message_direct	3adb4582-0fa4-4f9c-a739-80d9ecf0c1af	{"priseEnChargeId":"fbea240b-ffa9-4f9e-aa63-e358fd1c59b0","referralId":"2a4d122c-8eae-4a9c-b7d7-954f39f2d262"}	\N	2026-04-03T14:51:02.680Z
80183cef-2d62-4cd7-b3cf-96fbf2ab8ca9	\N	login	conseiller	\N	{"email":"sc@fondation-jae.org","slug":"ml-orleans"}	\N	2026-04-05T06:57:49.063Z
\.


--
-- Data for Name: evenement_journal; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evenement_journal (id, prise_en_charge_id, type, acteur_type, acteur_id, cible_type, cible_id, resume, details, horodatage) FROM stdin;
3a950d3e-5e38-44e3-8c79-deee35e40b71	1cc69ba0-3fa5-4807-ba14-ea578ba0a7bb	rupture_beneficiaire	systeme	917ad1d9-37af-4223-aa84-4c1ee508f564	\N	\N	Le bénéficiaire a choisi de repartir à zéro. L'accompagnement est clôturé.	{"initiePar":"beneficiaire","action":"reset_conversation"}	2026-04-03T08:39:06.295Z
23858914-f417-4357-9631-3ed59de3acee	74d907fd-b30e-48b3-92e2-70f8a8eb6aa7	rupture_beneficiaire	systeme	e036af1d-83c0-46e3-9d60-77313f52b261	\N	\N	Le bénéficiaire a initié une nouvelle demande. L'accompagnement précédent est clôturé.	{"nouvelleConversationId":"fde6aa6c-4710-4849-b448-132646ddda96"}	2026-04-03T09:22:29.802Z
5e863736-20f1-43ab-982c-dfd03d1e4678	35f01748-4212-49a2-bf03-4cf05f87efdf	rupture_beneficiaire	systeme	e036af1d-83c0-46e3-9d60-77313f52b261	\N	\N	Le bénéficiaire a initié une nouvelle demande. L'accompagnement précédent est clôturé.	{"nouvelleConversationId":"20a73d4a-c8a6-4514-af08-66df296e0030"}	2026-04-03T09:34:37.484Z
59ddadff-59ef-4042-a5c6-317ee4782c46	8e4bb66c-7e37-4db3-a9b8-ba9d6fb37f73	rupture_beneficiaire	systeme	e036af1d-83c0-46e3-9d60-77313f52b261	\N	\N	Le bénéficiaire a initié une nouvelle demande. L'accompagnement précédent est clôturé.	{"nouvelleConversationId":"2353f7d5-5b75-4dbc-bf1c-a6982e6e97d2"}	2026-04-03T09:46:45.361Z
a2aaa50a-5f68-43cf-b27f-442c394aea7f	228dab26-1f7d-4d7e-b9e6-0794b5a50b9b	rupture_beneficiaire	systeme	e036af1d-83c0-46e3-9d60-77313f52b261	\N	\N	Le bénéficiaire a annulé son accompagnement.	{"initiePar":"beneficiaire","action":"annulation"}	2026-04-03T09:57:46.668Z
c658bcb6-7d6e-4731-9f37-931484839913	12872d72-13d9-4fce-878f-f9715ad09116	rupture_beneficiaire	systeme	917ad1d9-37af-4223-aa84-4c1ee508f564	\N	\N	Le bénéficiaire a annulé son accompagnement.	{"initiePar":"beneficiaire","action":"annulation"}	2026-04-03T11:22:55.301Z
\.


--
-- Data for Name: evenement_quiz; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evenement_quiz (id, utilisateur_id, reponses, resultat, duree_ms, code_parrainage, source_prescripteur, a_partage, a_continue_chat, horodatage) FROM stdin;
\.


--
-- Data for Name: indice_confiance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.indice_confiance (id, utilisateur_id, score_global, niveau, volume, stabilite, differenciation, coherence, nb_messages, nb_instantanes, mis_a_jour_le) FROM stdin;
4062f2eb-d5a0-44ee-a3ef-5a310c9c9800	764d8257-1e32-4045-998f-185c24fe3875	0.17	debut	0.83	0.65	0.24	0.66	6	2	2026-04-02T23:12:33.540Z
bda8e803-9eb5-4a3d-8188-0be9844050ad	972234d9-d1ac-4e99-9ef4-dd2da9d447f3	0.87	confirme	0.31	0.86	0.42	0.55	6	2	2026-04-02T23:12:33.540Z
3c3b6bc5-2eea-4967-80c8-656c25ddf38a	cb903f71-6b96-4706-97be-bb2018cebe38	0.77	confirme	0.33	0.33	0.37	0.14	9	3	2026-04-02T23:12:33.540Z
c9cd814b-c429-46f6-9151-c5e69c6806e5	7266cb6a-9155-4626-99ed-cab1b8577f19	0.83	confirme	0.9	0.59	0.84	0.64	9	3	2026-04-02T23:12:33.540Z
366d291f-e326-41f8-a7be-8d372363531d	2f9d92c8-7a48-4279-bae9-41de1912655c	0.36	debut	0.32	0.56	0.22	0.38	6	2	2026-04-02T23:12:33.540Z
a7a032d7-3f93-42b3-b2f2-7b3df7e295a2	7278ccaf-7b99-43cc-bb98-381ec56db7f7	0.66	en_cours	0.53	0.68	0.5	0.25	4	1	2026-04-02T23:12:33.540Z
15808b5f-d6c7-41f5-9bc3-441c61c5bd59	ba4fe67d-0997-4cfb-adfa-ff0a82994dc2	0.37	debut	0.68	0.54	0.54	0.11	8	2	2026-04-02T23:12:33.540Z
f6b2abb8-cec7-4e70-a899-6f9337b887be	23e431f7-de11-4c59-85a7-43fd04cc3d5c	0.45	en_cours	0.33	0.74	0.45	0.56	8	2	2026-04-02T23:12:33.540Z
f951d5da-5891-4145-afe3-7525c82e14df	ca7ebcaa-57d6-4622-bd06-706e8e5883aa	0.4	debut	0.24	0.61	0.81	0.36	6	2	2026-04-02T23:12:33.540Z
cdbb3700-8e05-4a9c-96d4-a501ace29e16	b9c29de8-174e-42b3-a365-d0898e968f0e	0.29	debut	0.23	0.58	0.78	0.65	4	1	2026-04-02T23:12:33.540Z
b5b2cc6d-3669-40d3-8ad8-75425e3fe05c	61a285fa-0c7e-4da4-966c-6a3848a2ed02	0.44	en_cours	0.59	0.71	0.44	0.66	6	2	2026-04-02T23:12:33.540Z
6438275c-aac5-4696-bc2c-b763cfa3e116	0cb1645c-8fec-4b18-b5b9-547e72d31227	0.22	debut	0.67	0.4	0.4	0.16	6	2	2026-04-02T23:12:33.540Z
6cf9566c-b24f-4cea-9140-1c9b08f93dd8	9f6b28a1-d107-4fb1-b90a-cad220cd1f6e	0.14	debut	0.48	0.26	0.4	0.12	9	3	2026-04-02T23:12:33.540Z
e17c1ac4-15c5-4312-acbe-e51422e33e4a	c3a6591b-04c7-445c-966b-2aed6292f2b4	0.8	confirme	0.16	0.33	0.2	0.54	6	2	2026-04-02T23:12:33.540Z
a0f25f52-f579-4c45-9d59-2a55d7646a29	68538956-a26d-4273-b38a-c3d3ce0c3908	0.52	en_cours	0.28	0.57	0.6	0.81	6	2	2026-04-02T23:12:33.540Z
742ae76c-79a2-4bcc-aaff-0a6a0ef87ddc	c2e8c6bb-2929-4f5f-9265-c2ca2fedd072	0.59	en_cours	0.3	0.4	0.53	0.14	6	2	2026-04-02T23:12:33.540Z
1a91469c-7ac5-461a-b6e4-f6fb2dd6a38e	e26d46f1-0339-4e3e-8efe-a938c49b3d56	0.25	debut	0.4	0.52	0.54	0.11	6	2	2026-04-02T23:12:33.540Z
93f046fd-658d-44ad-a5c2-0fb2a87a4688	033e1119-beb8-43ed-8605-4dd0532dba07	0.25	debut	0.15	0.76	0.18	0.21	8	2	2026-04-02T23:12:33.540Z
f9b62021-ae70-461d-af94-04304ae718f9	9704c08b-0b24-4788-80cd-d0be5da1fd99	0.14	debut	0.29	0.11	0.55	0.71	6	2	2026-04-02T23:12:33.540Z
a50d81f3-3ff5-45bd-859e-09c2ecc03c58	3f3181a4-8aaa-47d0-af07-bb3a9ed3d613	0.25	debut	0.2	0.26	0.1	0.39	4	1	2026-04-02T23:12:33.540Z
8ef5976d-a523-4455-b2fc-8c0f34e5f9ad	d1e3307b-406a-42c6-818b-cf1adb2cfa6b	0.35	debut	0.56	0.57	0.51	0.39	9	3	2026-04-02T23:12:33.540Z
b5785fa4-1d27-46fc-bfd0-1dbb445305ae	59ab8d32-27ca-476f-a994-f5e0063dae24	0.5	en_cours	0.42	0.59	0.63	0.27	9	3	2026-04-02T23:12:33.540Z
13229bed-1f7e-4d18-83c9-51abb2965ccc	a7f8d90a-2e64-4184-b7d1-a706970f9628	0.51	en_cours	0.2	0.68	0.74	0.22	8	2	2026-04-02T23:12:33.540Z
b2f638e5-51bf-4a05-a42c-f29251776d9a	59e3d40f-12de-49c4-b565-020bd233b1a8	0.84	confirme	0.52	0.71	0.7	0.84	8	2	2026-04-02T23:12:33.540Z
bc24a404-61a4-46d8-bda4-283025fc265d	ef2fa34b-1555-4961-89c8-5af4b1ed7eed	0.59	en_cours	0.72	0.69	0.61	0.21	4	1	2026-04-02T23:12:33.540Z
4e6e1fc0-6b4b-4416-8f01-c132b6f1fcda	6318fc54-b834-406f-a11f-ca365a386424	0.54	en_cours	0.29	0.41	0.88	0.52	9	3	2026-04-02T23:12:33.540Z
a96b3bb4-298e-4235-8b45-448b1f2bc24c	c739076c-0035-4abd-8ae9-da6ae3d17485	0.71	confirme	0.24	0.75	0.74	0.85	6	2	2026-04-02T23:12:33.540Z
fd184426-55d8-4745-b6c3-73bebc7405a1	d4b3c044-ebbd-4c2f-b30b-7845fa36d281	0.82	confirme	0.47	0.18	0.45	0.52	4	1	2026-04-02T23:12:33.540Z
0dad4203-dad4-40aa-890b-d0b01c68c1dd	0420c1db-a7eb-4f20-a244-f242e87f679b	0.62	en_cours	0.54	0.84	0.19	0.84	8	2	2026-04-02T23:12:33.540Z
8be0416a-a062-4dac-90c2-5d6377350ab9	3f13ff28-8fac-4e5f-9142-a9c3412fa4f5	0.89	confirme	0.44	0.19	0.57	0.78	9	3	2026-04-02T23:12:33.540Z
925476ff-f2be-400b-a7eb-afe6075293a1	97ad5524-3180-468f-bbb1-bfab8cc9f54a	0.21	debut	0.55	0.86	0.46	0.72	6	2	2026-04-02T23:12:33.540Z
3e1459eb-5707-4486-9005-9fba994f8944	863c92b1-6896-4bfd-a5bd-bb6c5ae2480b	0.19	debut	0.16	0.5	0.23	0.79	6	2	2026-04-02T23:12:33.540Z
2a937b3d-1b2d-471e-ba4d-7beacef3e5eb	e0142f18-d265-4280-8aff-f90d771130f5	0.89	confirme	0.51	0.71	0.86	0.14	4	1	2026-04-02T23:12:33.540Z
65ad25b1-484c-40ba-acf6-3d934ef02ae3	5050641e-a789-4676-b22a-a7c807dfeafe	0.25	debut	0.66	0.16	0.41	0.82	4	1	2026-04-02T23:12:33.540Z
0dfcf33b-d0af-46dc-bc4d-abd649619122	769ebb73-7f9d-4f98-8a10-ab5149b85dfb	0.87	confirme	0.47	0.3	0.38	0.82	6	2	2026-04-02T23:12:33.540Z
10553110-7ad8-4d16-aa37-78d2d0981e10	f20c171e-e75e-4c5f-98dd-b82593009008	0.11	debut	0.18	0.21	0.88	0.54	6	2	2026-04-02T23:12:33.540Z
6b359d3d-3524-4a75-b7e8-c9d2a1f773a6	db073130-2085-4b0d-94f5-0d32fa385953	0.17	debut	0.89	0.35	0.3	0.63	4	1	2026-04-02T23:12:33.540Z
ea6a6588-e01d-4993-9797-c3d70e317636	b711deab-6ff4-46ed-a24f-1110c1356214	0.32	debut	0.26	0.65	0.63	0.61	6	2	2026-04-02T23:12:33.540Z
aa869eb7-8d46-44b5-8605-f6312ba0495c	fe350604-7636-4e7a-bdd8-1d0c6a6a57ef	0.76	confirme	0.2	0.57	0.31	0.35	8	2	2026-04-02T23:12:33.540Z
0e58cdcd-9ab3-41b5-8e4c-da3fe8282dfb	d40c1da4-481c-487b-948e-fc6e25bb6b7f	0.35	debut	0.27	0.8	0.89	0.55	9	3	2026-04-02T23:12:33.540Z
90916951-3ceb-4af1-a7eb-dc7a87d5f306	efde489a-d530-4ecf-aeb9-0f04c194bcfa	0.36	debut	0.87	0.48	0.58	0.57	9	3	2026-04-02T23:12:33.540Z
d3755f31-e703-4f5c-8db0-088eae34d2cd	d7a6d492-3ec7-49a2-b646-1bbf450fd0ae	0.19	debut	0.4	0.85	0.38	0.42	4	1	2026-04-02T23:12:33.540Z
faf20662-df5e-4779-9661-c7fcbf496100	e8b0ae99-38b3-41cd-99ac-fec8c013112b	0.25	debut	0.47	0.86	0.41	0.67	8	2	2026-04-02T23:12:33.540Z
d6bdb5d0-176b-43e9-8aa6-94b6b67b931a	824e1e50-207b-4f86-847d-249323ef280d	0.55	en_cours	0.66	0.69	0.67	0.79	8	2	2026-04-02T23:12:33.540Z
ffd73e62-e547-440c-bff7-1058ad49b7f0	96c3f06b-0783-4b28-921c-13f007d3b57f	0.59	en_cours	0.7	0.87	0.56	0.44	6	2	2026-04-02T23:12:33.540Z
717c2c4b-c1aa-4b54-a237-d3afebf2afa6	32061828-987b-442c-843e-557392375abc	0.72	confirme	0.13	0.71	0.85	0.73	6	2	2026-04-02T23:12:33.540Z
58cbcbfc-d330-483b-a092-94d5f87caa0e	a41d007f-59cb-418e-a9f3-0a804c111893	0.39	debut	0.17	0.85	0.77	0.49	6	2	2026-04-02T23:12:33.540Z
7a07e50a-5236-4a3c-add8-1ef550d2cee3	fe7157fd-18c6-41fa-aba6-4981b60d2721	0.36	debut	0.21	0.46	0.33	0.56	6	2	2026-04-02T23:12:33.540Z
d0b7c468-ff96-4977-8cbf-e4ce4386f193	830bc3e5-d2e7-45b6-96a8-736fd706a8b2	0.64	en_cours	0.31	0.68	0.25	0.64	9	3	2026-04-02T23:12:33.540Z
44d1cf93-7001-4c2d-9f46-a62e294ad54b	41e2cec6-b7e3-435c-ba0a-e2373bbf4adb	0.49	en_cours	0.5	0.42	0.26	0.37	6	2	2026-04-02T23:12:33.540Z
359821be-67c4-4f21-adc9-285b509fcbe5	2c7ba8e3-c80a-45ef-ac3f-635148674432	0.11	debut	0.7	0.11	0.6	0.57	8	2	2026-04-02T23:12:33.540Z
0f981e46-8eb8-451c-aa79-a12e023fb3cd	cfe6a6c0-ad96-442c-9804-e1048cc855cb	0.43	en_cours	0.68	0.35	0.64	0.26	4	1	2026-04-02T23:12:33.540Z
c456cfe5-f5aa-494e-a5ff-00831fcda0fa	56d07aed-9bc9-4b99-9f6b-22eb71db1720	0.35	debut	0.88	0.85	0.72	0.27	6	2	2026-04-02T23:12:33.540Z
69abbabf-0df4-4bf4-9094-e9743ed8cbfd	5f529811-2674-42ef-8dba-66cc01dda263	0.33	debut	0.13	0.25	0.58	0.22	8	2	2026-04-02T23:12:33.540Z
8f5e6097-c431-4581-905a-023bffd88e56	ec5d2b4a-75a0-49f3-bfb3-39dbb0cdddf0	0.58	en_cours	0.68	0.17	0.72	0.22	6	2	2026-04-02T23:12:33.540Z
901a2af0-a4f5-4aca-a69d-22e47c9619f9	5dcfa146-fe4b-45c7-8668-fca724591905	0.14	debut	0.61	0.25	0.39	0.67	6	2	2026-04-02T23:12:33.540Z
286671f4-a63c-4bb6-946c-93c683a5c859	a7d7571c-7589-4cd5-9910-d7b95d25732f	0.39	debut	0.69	0.65	0.33	0.52	6	2	2026-04-02T23:12:33.540Z
d3d9d9c4-f960-4ac5-b2fe-fd98535d211c	7b8ccdf8-5524-4f1b-b35c-8bc337dc685f	0.64	en_cours	0.53	0.42	0.55	0.5	9	3	2026-04-02T23:12:33.540Z
835ded3c-7d03-4053-9a0e-43191a311239	aefcd229-ae2e-443f-9a4a-1464dbcd4ab1	0.76	confirme	0.13	0.54	0.25	0.4	9	3	2026-04-02T23:12:33.540Z
68baa395-b481-4227-a4f7-32b472d1a1ab	52baa462-4e8f-47de-b651-02b49215c6f4	0.28	debut	0.73	0.73	0.56	0.72	4	1	2026-04-02T23:12:33.540Z
7e06301f-b1da-477b-ae9d-00d58764b4c9	27ef7d2f-62ef-4934-9f80-95e490e00000	0.62	en_cours	0.57	0.33	0.68	0.59	6	2	2026-04-02T23:12:33.540Z
ebe4b910-8503-4f0d-9b49-366e94e887f5	a6b61108-5b88-49fa-af98-24424716fa35	0.25	debut	0.76	0.65	0.28	0.87	6	2	2026-04-02T23:12:33.540Z
db85349f-98c0-40a2-9fd8-d31c4b672854	6ac697a3-4998-4ced-a765-7f2891cd6e3a	0.26	debut	0.61	0.7	0.86	0.89	8	2	2026-04-02T23:12:33.540Z
f3b713fb-f8c8-498f-9fdb-8be350068a56	25643329-c5b1-4f2e-a95c-6b40dbffea4d	0.83	confirme	0.59	0.78	0.8	0.35	9	3	2026-04-02T23:12:33.540Z
2ec93be2-b5e8-4181-8028-1ed78c8c7c24	5654e9f9-7355-4fd7-8f5f-3e50da717be7	0.28	debut	0.29	0.35	0.49	0.82	6	2	2026-04-02T23:12:33.540Z
b051bae6-a922-46ff-a489-1d33235419f2	df613825-3a7a-4445-8c19-cc386f7b8290	0.72	confirme	0.82	0.89	0.22	0.38	6	2	2026-04-02T23:12:33.540Z
e0f9a293-9dc5-4e27-bd2d-d0a664fab00c	83f10d16-4f0d-4012-9163-21b1605ae47a	0.5	en_cours	0.48	0.6	0.7	0.68	9	3	2026-04-02T23:12:33.540Z
e6702c3c-52fa-4ab5-8730-e0376a012182	0e6a72df-0093-46ae-a343-10e6f4f209c0	0.63	en_cours	0.38	0.76	0.27	0.27	8	2	2026-04-02T23:12:33.540Z
1d11deaa-6c6d-4a28-b43d-23c23b6b9397	4b042b4b-896a-4463-ab08-33ff459f1c73	0.18	debut	0.89	0.47	0.13	0.75	6	2	2026-04-02T23:12:33.540Z
3bc79982-ef49-4c7f-9631-b7e9a3503b9e	649cb386-6ef2-44e0-9dba-1e78dd440243	0.28	debut	0.37	0.37	0.54	0.81	9	3	2026-04-02T23:12:33.540Z
15863d7d-68ee-45d2-a1da-f3d5f89d5ba3	3e840809-f9b1-47f3-93be-3398b400fe8e	0.67	en_cours	0.89	0.28	0.24	0.2	4	1	2026-04-02T23:12:33.540Z
f4e85e2f-1b4f-4b2e-9531-adb872c1aa8b	9142af93-5443-4882-9578-1dddbdaa388a	0.72	confirme	0.82	0.76	0.11	0.18	9	3	2026-04-02T23:12:33.540Z
bce35c25-de3b-43d3-b9d7-3191e2eed96f	86dacd72-5e1e-4495-9068-9779ffefa10c	0.12	debut	0.85	0.65	0.26	0.66	8	2	2026-04-02T23:12:33.540Z
dc97baaf-27bc-4f09-9396-b82c65feda21	3bad7b59-de8a-4b2c-8a06-56483c74b4fa	0.65	en_cours	0.31	0.56	0.5	0.67	9	3	2026-04-02T23:12:33.540Z
cb793606-9eb0-48d3-9c00-a8e74e754872	9d5363de-631a-4f79-9fca-94651b0f8352	0.47	en_cours	0.63	0.28	0.78	0.63	9	3	2026-04-02T23:12:33.540Z
dec2a3d7-0b13-45c6-baaf-b6e4a30843c4	49868a7f-1025-45bf-b4d7-e6ede2711cda	0.23	debut	0.25	0.73	0.16	0.85	8	2	2026-04-02T23:12:33.540Z
eda11d4f-b950-480a-bc8a-e4ef56fc84dd	5b73a99f-d7fa-4edf-84a8-96823a3b3d84	0.69	en_cours	0.48	0.47	0.53	0.28	6	2	2026-04-02T23:12:33.540Z
a0ca2d6d-65fe-4890-93f9-bfd65e14de3b	b2085c2d-d12d-47a5-bea3-c265176ab076	0.29	debut	0.54	0.63	0.3	0.13	4	1	2026-04-02T23:12:33.540Z
0410fe9e-188b-44d6-a887-044d5983c596	fc2eb61c-9799-4dcb-9ef7-bf8cdbb94956	0.45	en_cours	0.11	0.8	0.85	0.33	8	2	2026-04-02T23:12:33.540Z
4f52a7df-bd34-49a9-8f89-b0b2db20c04e	916e2ed3-1aad-46a0-9aac-05a2518dd456	0.16	debut	0.88	0.39	0.42	0.88	9	3	2026-04-02T23:12:33.540Z
f2f1f214-60c8-485e-8c2f-207d39a8ba1d	247d8768-1e5b-4ab5-b294-cdeb91ae9b93	0.6	en_cours	0.87	0.46	0.33	0.14	6	2	2026-04-02T23:12:33.540Z
01711455-84a2-45b8-9bff-6455729e1ca5	650df64d-603e-4912-9cfe-50543d8239b5	0.57	en_cours	0.67	0.31	0.32	0.11	6	2	2026-04-02T23:12:33.540Z
f5b741c4-c77e-4b98-a774-e0ce2dc54e15	509e7d9a-3349-4453-bc18-6a81b2bf4a17	0.82	confirme	0.65	0.8	0.48	0.32	6	2	2026-04-02T23:12:33.540Z
e2100f99-e60f-43fc-91c9-b6bf8b2291f5	03f3859c-31bd-4e4d-81a1-573aaf309145	0.35	debut	0.34	0.84	0.58	0.85	4	1	2026-04-02T23:12:33.540Z
60e59e2a-58e8-4aec-ad59-a6166b2d397e	3ad6a440-6e8d-4307-9b10-9dacf9670bfb	0.7	en_cours	0.5	0.42	0.47	0.57	6	2	2026-04-02T23:12:33.540Z
d703f970-08be-4cc0-9bef-a9cb1f67d407	9ba1501b-34fe-4484-a5c8-f144280a6ee2	0.63	en_cours	0.69	0.34	0.26	0.51	8	2	2026-04-02T23:12:33.540Z
02a2a2e1-cc7f-4a7c-bb1a-e5c7c0f7ec35	796f63fc-3464-45ce-9608-d1010076bd86	0.15	debut	0.45	0.9	0.16	0.63	6	2	2026-04-02T23:12:33.540Z
ce348b32-abf7-4e81-9b67-6d5124079003	b98ee361-a65a-470b-9948-bc5936c2e793	0.71	confirme	0.17	0.34	0.18	0.31	4	1	2026-04-02T23:12:33.540Z
d4ad1b1f-233d-4491-acde-ee1e6c1e97b3	ba58cedd-611e-4410-b70e-6c30fec6308f	0.67	en_cours	0.37	0.81	0.86	0.63	6	2	2026-04-02T23:12:33.540Z
898f9fa3-92e4-4169-bae2-b0cde8b2231a	180d85fe-0bec-4109-9475-8aef5155137f	0.41	en_cours	0.39	0.33	0.6	0.18	6	2	2026-04-02T23:12:33.540Z
213c30cc-9520-4f01-a97f-2f46edf1c070	0f3ede6e-8e7b-4670-aa0e-ad99f7b84295	0.83	confirme	0.46	0.69	0.65	0.48	9	3	2026-04-02T23:12:33.540Z
8c20e9d5-4616-40bf-9128-40666b6dcffd	df919098-a633-4505-91f8-47c7da95378e	0.34	debut	0.37	0.57	0.76	0.81	8	2	2026-04-02T23:12:33.540Z
b85c91aa-3ca6-4ace-983b-464c32a7fb47	de9aea9c-3d5d-452d-aacc-3e50d9f47ab7	0.84	confirme	0.42	0.3	0.69	0.51	4	1	2026-04-02T23:12:33.540Z
d29a846b-689a-4bdc-bedf-27a36636b92a	67106ae0-b3c9-497d-a08b-26d91ca3e638	0.31	debut	0.77	0.73	0.2	0.47	8	2	2026-04-02T23:12:33.540Z
513130bc-73ea-452c-93cf-f4172fcad76b	eecfc43e-20f5-47d4-a502-2c6cdaa71b97	0.45	en_cours	0.29	0.85	0.22	0.64	4	1	2026-04-02T23:12:33.540Z
bfafe324-78c9-4b05-a30e-0aea875b7b23	4cb6df89-f816-4b76-9df1-67b8e8b45b23	0.41	en_cours	0.81	0.16	0.14	0.45	9	3	2026-04-02T23:12:33.540Z
78fd9fbf-5d94-4809-9c5c-bbcde0f7a91b	ad2e1c6d-486b-479b-976c-d9fde079fb35	0.23	debut	0.74	0.31	0.45	0.63	9	3	2026-04-02T23:12:33.540Z
157e65b4-35d8-4072-8b15-941798c15e81	fed82a4a-ec58-431e-8e17-46a2fce18027	0.31	debut	0.52	0.81	0.49	0.17	6	2	2026-04-02T23:12:33.540Z
3511f5b8-1737-4d83-acf6-c24643db7c4b	331b09e1-a578-4c26-a278-b8059cb0c30a	0.35	debut	0.61	0.13	0.21	0.71	6	2	2026-04-02T23:12:33.540Z
938a262e-9fc5-48c1-9a29-08c77fb08790	421b4fba-05d3-4ee3-bf03-7b7a7828484b	0.41	en_cours	0.7	0.37	0.88	0.16	8	2	2026-04-02T23:12:33.540Z
7687adff-2b12-482f-9690-edd02052f50c	a78f72af-ce1d-452e-a464-59f6a52f5808	0.36	debut	0.3	0.44	0.15	0.88	9	3	2026-04-02T23:12:33.540Z
d90441fa-4b02-4529-a325-db759702ea4a	1e24e7f8-3feb-42d9-bb17-4a8437730563	0.43	en_cours	0.75	0.64	0.68	0.34	4	1	2026-04-02T23:12:33.540Z
ca090ca8-6568-4211-8e3d-881064d80833	99239065-37df-43aa-89e3-7fd7e263083d	0.22	debut	0.46	0.65	0.86	0.77	4	1	2026-04-02T23:12:33.540Z
5b550b7f-8497-4386-8d26-652a8f8cae1e	1a80741e-7156-4314-a1f5-7b85958beea2	0.87	confirme	0.47	0.74	0.87	0.13	8	2	2026-04-02T23:12:33.540Z
db03adb4-ecaf-4e9f-9103-6385b5a934f5	1b10bdb7-9ab0-44b5-b281-f295ebb7b6c4	0.6	en_cours	0.69	0.31	0.23	0.11	4	1	2026-04-02T23:12:33.540Z
dcc55282-dbdf-4447-832e-7c89b418c4fb	1daeb1b4-5ce2-44af-a5bb-4fc40fc64e42	0.75	confirme	0.25	0.52	0.36	0.72	4	1	2026-04-02T23:12:33.540Z
fd999cd5-2434-43aa-9272-e69865e66fa5	cd532497-bd2b-46e6-91ab-2654551a3dc1	0.82	confirme	0.48	0.89	0.27	0.66	4	1	2026-04-02T23:12:33.540Z
9e102484-e1ab-4d9f-9338-cdef844f1a9b	0da6f58a-d769-4bbb-991a-0b8540ed722b	0.43	en_cours	0.34	0.56	0.79	0.67	4	1	2026-04-02T23:12:33.540Z
88ec129e-7738-4f5f-bbb7-d0356e9f2dd0	e01af09a-d399-441c-9758-3f799dfed44d	0.83	confirme	0.29	0.58	0.11	0.48	6	2	2026-04-02T23:12:33.540Z
48cd4e49-47bf-4b38-a93f-01d503328d4c	b32b7963-c6af-4e56-aa61-7b7fc7f16dc7	0.24	debut	0.8	0.6	0.33	0.26	9	3	2026-04-02T23:12:33.540Z
fd6ca364-1237-4b77-aac7-63d504efeb22	0afb833e-932e-4f87-8c99-d643cb0ab0aa	0.71	confirme	0.25	0.31	0.14	0.9	4	1	2026-04-02T23:12:33.540Z
494d762b-a858-48dd-af6f-bdb2a723967d	ca90b20a-bcf7-4b09-a945-4f464e98e104	0.83	confirme	0.64	0.74	0.37	0.59	6	2	2026-04-02T23:12:33.540Z
c00b30d3-9ebf-4869-a77d-bcf97d816d1c	e430ab53-087d-4998-bf48-22d39cab3501	0.53	en_cours	0.17	0.11	0.58	0.39	8	2	2026-04-02T23:12:33.540Z
c07b1b5c-fa67-4724-bc74-28aa0d5c0469	3318e30a-1226-4c57-859b-10ec31dfa510	0.17	debut	0.29	0.43	0.2	0.24	6	2	2026-04-02T23:12:33.540Z
d14fb5d2-a937-4037-8189-ff6599a408a4	28fca49e-e608-4f46-a3a2-c1ebe8200190	0.86	confirme	0.8	0.7	0.23	0.38	6	2	2026-04-02T23:12:33.540Z
aba1abc2-325f-4e21-ab40-130dbb07b587	fd6541c7-1303-4453-8bab-458ff6cf8282	0.67	en_cours	0.14	0.36	0.49	0.23	4	1	2026-04-02T23:12:33.540Z
be5de406-6933-4667-842d-4144c1f3536a	069db21a-84fa-4b6d-b28f-a4173b11f710	0.47	en_cours	0.11	0.47	0.49	0.26	4	1	2026-04-02T23:12:33.540Z
448c8585-83e8-48ef-a105-b0a4488aed3b	508239d2-9f0e-4471-b893-7b50c0631e64	0.33	debut	0.89	0.3	0.49	0.83	9	3	2026-04-02T23:12:33.540Z
524a9cc8-88e9-4551-abc5-44acb80f1f1a	4841b942-e1f1-4b82-8b04-a11b9bfb1fd9	0.84	confirme	0.58	0.58	0.86	0.67	8	2	2026-04-02T23:12:33.540Z
6c7f2402-85d0-41b8-90cb-197d77a895a2	8dfa724f-a9d8-463f-bfca-38e3dca8ae6a	0.48	en_cours	0.28	0.57	0.38	0.74	9	3	2026-04-02T23:12:33.540Z
7482977b-38f6-425b-842d-7b8471bea158	5dff5942-25af-4fff-8011-cd012c664484	0.71	confirme	0.78	0.61	0.89	0.55	9	3	2026-04-02T23:12:33.540Z
8d8a19c2-f8e3-4547-bc25-a6b4a01ecb74	8525858f-4edb-4479-bc5d-443829d2c466	0.48	en_cours	0.42	0.63	0.22	0.76	4	1	2026-04-02T23:12:33.540Z
2fb591e7-11c4-4496-a28a-99604a86c446	45394e25-24e5-4d02-84a5-46713af6d193	0.81	confirme	0.55	0.3	0.22	0.61	4	1	2026-04-02T23:12:33.540Z
594a7cfa-1079-49c4-b242-70f13faf6728	4c210ad7-014b-48a6-8286-a8ddf5264d3e	0.33	debut	0.34	0.21	0.18	0.81	8	2	2026-04-02T23:12:33.540Z
26d1f6f3-4ea3-4079-b4ab-38d8624ee790	42981fb0-76a8-4cc1-af47-7ced202835cd	0.66	en_cours	0.76	0.83	0.51	0.25	8	2	2026-04-02T23:12:33.540Z
73acd1bf-3c4e-4eda-b054-de14e40ca061	179113ab-61e5-4a0e-bd42-93c4b2b1f5c2	0.81	confirme	0.73	0.31	0.21	0.22	6	2	2026-04-02T23:12:33.540Z
8141b818-5972-43a4-8e8a-1bb13cfe54d3	406e7405-ed52-4710-a0c7-32d69f0839c0	0.43	en_cours	0.83	0.57	0.5	0.51	6	2	2026-04-02T23:12:33.540Z
21cac161-2b57-44ce-83bc-4d5384cde27d	95db2322-9525-4a7e-b10b-9b21fa6e1f1f	0.49	en_cours	0.2	0.17	0.15	0.68	4	1	2026-04-02T23:12:33.540Z
971974fd-77db-4305-91f4-fe7df7a69300	49d0e9b0-1e04-48d7-9695-6224265064b4	0.34	debut	0.72	0.31	0.82	0.84	9	3	2026-04-02T23:12:33.540Z
ba213965-52a9-4e29-b258-51810b9fa783	18413dff-7869-45f7-a745-8349f57d89f3	0.65	en_cours	0.35	0.13	0.35	0.82	8	2	2026-04-02T23:12:33.540Z
683e1c73-7eef-4259-981a-631515c11288	3c765e0f-7583-4179-a98f-295c1c624ab9	0.67	en_cours	0.77	0.28	0.6	0.57	6	2	2026-04-02T23:12:33.540Z
c90f262d-6bd2-4bbe-b508-ca355c08eb86	41a1bf37-54d8-4a0f-af19-4b84f13bf4c9	0.66	en_cours	0.78	0.9	0.26	0.21	6	2	2026-04-02T23:12:33.540Z
6cf40969-0eb6-47b2-bf15-293a164c3586	757d5cb8-94bc-41ae-b53a-f8e5b9435d65	0.71	confirme	0.43	0.14	0.47	0.31	4	1	2026-04-02T23:12:33.540Z
8ccb0643-d437-41aa-9b0c-a82e904d5ce0	64d8a371-0774-48ed-8508-28532898c01e	0.85	confirme	0.42	0.54	0.57	0.27	6	2	2026-04-02T23:12:33.540Z
06d347ff-8946-458c-93ee-70c3e771d2aa	d4b22522-6c2f-4eb8-8299-ed7e1b3bb4fa	0.72	confirme	0.78	0.27	0.46	0.26	4	1	2026-04-02T23:12:33.540Z
2fbb0872-8dfb-4004-b8ed-ee431e7c09b4	b60a337a-1515-477b-9ae0-58009984cbe6	0.27	debut	0.36	0.58	0.87	0.27	6	2	2026-04-02T23:12:33.540Z
ee7f92dd-c0e0-4277-b854-f0c191de2ddc	33eac1eb-4c71-4ec8-a2c5-9da733f8a8b6	0.12	debut	0.22	0.65	0.56	0.52	9	3	2026-04-02T23:12:33.540Z
2806400b-1b3c-4d6c-872b-679e3d9a5162	4f63c8f6-9a67-42f2-b658-730b8db0b1e6	0.73	confirme	0.64	0.88	0.24	0.65	6	2	2026-04-02T23:12:33.540Z
f0be0f6c-0374-4c72-a0b8-17cd52192e9d	63ba0dc7-2836-4cab-9c81-997ef1beb339	0.31	debut	0.5	0.54	0.1	0.68	6	2	2026-04-02T23:12:33.540Z
0c413c8a-4a8e-47fa-a7d6-9b86629175f1	b3da3233-e79e-460c-bcff-d90f75a87d11	0.74	confirme	0.71	0.23	0.69	0.81	8	2	2026-04-02T23:12:33.540Z
0623ee0f-0a67-4a45-beec-b8d4e1b7bb5d	fbc8ceaf-70f0-4d2e-85ad-08d3fa343f9c	0.88	confirme	0.7	0.47	0.52	0.12	6	2	2026-04-02T23:12:33.540Z
42bba032-e6ed-495b-93ff-7379f62360f7	c6d6de52-9dd5-4e5a-99bd-ff4b3c017a43	0.33	debut	0.8	0.76	0.79	0.48	6	2	2026-04-02T23:12:33.540Z
b6bb99e7-5ab6-4f64-bf5e-5b62276c9a03	39e2b1bf-6616-4559-8d4b-6315d337fc50	0.16	debut	0.9	0.42	0.32	0.85	4	1	2026-04-02T23:12:33.540Z
21177fb1-8652-4900-a976-38cf9380b4f9	b0499347-d62f-4784-9531-114b06900600	0.66	en_cours	0.89	0.75	0.51	0.61	4	1	2026-04-02T23:12:33.540Z
0a77a895-92df-46d7-a83d-c467dcac0abf	dc9090c7-5234-496f-8bee-56d4ac07d8b9	0.39	debut	0.8	0.87	0.7	0.73	6	2	2026-04-02T23:12:33.540Z
0ea0d612-546b-4159-bfb9-d21c8c203bd9	e4e3ab10-0b41-4a5d-a7f0-9a9f2f5eacc7	0.89	confirme	0.34	0.43	0.85	0.86	4	1	2026-04-02T23:12:33.540Z
784fccac-ce15-40dc-9a08-7fba35e42a5d	8b556cf5-1bf7-453d-8405-8b39a2e5dc43	0.61	en_cours	0.18	0.8	0.71	0.13	4	1	2026-04-02T23:12:33.540Z
36f487d2-b008-40a6-ad33-224faca75b46	f66c8ffc-3566-48c8-a4b0-d1d8d04de22b	0.21	debut	0.49	0.72	0.83	0.54	6	2	2026-04-02T23:12:33.540Z
84a4b348-1b8a-47a6-b11f-fb0ce4ba278c	703959fe-92ee-442c-8838-96e13e37d92d	0.28	debut	0.76	0.64	0.17	0.66	8	2	2026-04-02T23:12:33.540Z
d703f9f8-c520-489f-b75b-8d80213497a0	ce736c1c-ced1-4a2c-b257-4df5434563b0	0.1	debut	0.3	0.27	0.89	0.86	6	2	2026-04-02T23:12:33.540Z
94f8c2cc-2e65-47c2-851a-7b95bc23c420	59ba42d1-24e6-469b-8c35-621b4cedc99e	0.69	en_cours	0.9	0.3	0.46	0.61	8	2	2026-04-02T23:12:33.540Z
fa09927b-495f-4f46-99eb-14129400fb4a	b5eb3c91-d2b5-429e-acfa-e0d0f5abe612	0.58	en_cours	0.36	0.61	0.85	0.41	8	2	2026-04-02T23:12:33.540Z
f7aab98f-e3ca-47b7-a24f-6a5b99ef044c	ab1c30f5-5061-452a-abc7-8930c2983061	0.44	en_cours	0.81	0.76	0.52	0.47	6	2	2026-04-02T23:12:33.540Z
7c83d742-eff5-479c-8519-cf56909d2ff6	cf3b02c7-3cd7-4d22-8ee0-22a7b75a2a99	0.75	confirme	0.44	0.62	0.79	0.19	4	1	2026-04-02T23:12:33.540Z
e308a6a0-9085-44f4-ae19-5a0729657d3f	06dc14ad-2dc8-4f03-82bf-549c1750b258	0.74	confirme	0.29	0.74	0.19	0.16	4	1	2026-04-02T23:12:33.540Z
0dfc50ab-ae1b-4dfc-84a6-9ec104816d7e	7317326a-e743-4a69-a01a-a74ac4c17341	0.7	en_cours	0.18	0.57	0.71	0.28	9	3	2026-04-02T23:12:33.540Z
a90cc5b8-98ae-4669-ab61-d303b571733a	4242128d-1bcd-4377-9db5-48263b1b9067	0.63	en_cours	0.58	0.12	0.51	0.44	4	1	2026-04-02T23:12:33.540Z
9b5de457-380d-4750-8305-717564d4d670	10c3f1d7-35b1-4ee7-bf4a-2fae5da5a5ec	0.42	en_cours	0.3	0.59	0.27	0.53	9	3	2026-04-02T23:12:33.540Z
9133f043-3d30-4487-aa48-8986bb0de648	314dd029-8784-47c7-800a-b65a89c5bfa0	0.51	en_cours	0.14	0.59	0.66	0.9	4	1	2026-04-02T23:12:33.540Z
bf14090c-2935-4ec4-b1dc-3ac8b32ecdad	01743b7a-b33f-4689-bcb3-667f0b615490	0.5	en_cours	0.13	0.89	0.5	0.27	8	2	2026-04-02T23:12:33.540Z
42281068-181f-46b0-9512-f227001b7810	180e76c3-8b14-4dba-86e8-f2461866cf9a	0.42	en_cours	0.75	0.5	0.88	0.39	8	2	2026-04-02T23:12:33.540Z
1b0b18bc-0094-4f32-bf2b-2effdaf11045	9b19d083-772c-4b3a-8a3b-2d05a8c0f8a1	0.4	debut	0.76	0.56	0.24	0.14	4	1	2026-04-02T23:12:33.540Z
9a33a6f1-7613-4d9f-9127-b3a6855cc8dd	6ee23bc6-35b7-4e55-aa1b-c9c5ea4f4368	0.31	debut	0.46	0.2	0.19	0.89	6	2	2026-04-02T23:12:33.540Z
4388fc3f-23e3-4e92-91a1-64bb9d6fb24b	94d23641-2374-4822-8efe-835096bc964b	0.38	debut	0.78	0.46	0.27	0.68	6	2	2026-04-02T23:12:33.540Z
24bd1b9f-1c65-4d1c-bfcc-7660f870c8f2	1af91dc4-f78c-4baa-84dc-bd94b6628937	0.73	confirme	0.51	0.32	0.82	0.29	4	1	2026-04-02T23:12:33.540Z
3e4cdbf9-28f9-429b-a503-28d166b1e12a	61ed4304-60d0-4278-b3fc-b8035ae89610	0.35	debut	0.84	0.2	0.74	0.28	9	3	2026-04-02T23:12:33.540Z
23d3e639-98ad-47d7-adb7-e5ddd682d0a3	40581249-3949-40cb-8e46-664bb4236c2b	0.11	debut	0.19	0.54	0.44	0.69	9	3	2026-04-02T23:12:33.540Z
c9b77bb8-3bc7-4796-a315-ddfd81ba1d19	f2a0c531-e0e2-41f9-88c5-03abf0c62f6e	0.59	en_cours	0.41	0.55	0.27	0.15	4	1	2026-04-02T23:12:33.540Z
1d2618d9-6952-4b7b-b1d4-317b956386e1	a8cbf0f9-e99e-41c7-a7d3-bdf02893f377	0.75	confirme	0.31	0.87	0.13	0.24	6	2	2026-04-02T23:12:33.540Z
38fb1714-148b-45cc-a840-44b55dad6f14	92d6f485-dd75-4f15-8689-d655442f3066	0.19	debut	0.59	0.31	0.64	0.77	8	2	2026-04-02T23:12:33.540Z
b9cd7b03-04f0-4872-9a20-61204b201cce	96af85b9-db3c-4253-b1f6-c502d423748b	0.7	en_cours	0.64	0.14	0.9	0.78	8	2	2026-04-02T23:12:33.540Z
77163718-7836-4c2d-a325-8b5775b4fe88	f6510755-469c-4285-a02f-39a27508dcd6	0.78	confirme	0.87	0.65	0.29	0.88	4	1	2026-04-02T23:12:33.540Z
48b70c98-ae56-442c-bd44-2e6712933e65	7423daf1-d204-432e-b6cd-65f3e0cee53c	0.71	confirme	0.54	0.86	0.84	0.14	6	2	2026-04-02T23:12:33.540Z
df7dfb25-d634-431a-b26f-3b17f9cbacc7	12c1c264-4559-4bb3-8f7f-85942e02ff22	0.83	confirme	0.48	0.36	0.67	0.17	9	3	2026-04-02T23:12:33.540Z
e581c4db-5d6c-4160-a3bc-f318daec4302	a4210ec5-7e1e-4524-8b93-caa4097c04c7	0.39	debut	0.12	0.77	0.27	0.45	6	2	2026-04-02T23:12:33.540Z
825d4ebe-c106-4c11-bd96-346a859f9a03	a55fdb49-098b-4d52-a6fe-a428a23d2c47	0.11	debut	0.23	0.61	0.3	0.86	9	3	2026-04-02T23:12:33.540Z
d31be5c4-f00b-4993-bb61-05d830bec526	d3d0c553-73a6-474f-8ad0-7de504a44ca9	0.53	en_cours	0.62	0.28	0.82	0.26	8	2	2026-04-02T23:12:33.540Z
54c5312d-2cfd-43c5-aab7-ff030706f406	a2885063-17c1-4381-b9a2-546941ea319e	0.11	debut	0.76	0.57	0.19	0.89	9	3	2026-04-02T23:12:33.540Z
ab1a99f5-725a-44e1-a1b5-81be57617d2b	c1212cee-3b85-4b0d-a15c-4dffaf32e669	0.39	debut	0.16	0.63	0.56	0.68	6	2	2026-04-02T23:12:33.540Z
a0518551-def4-4286-b0c4-25468036273b	60a0f991-af45-4ee5-9667-e9028db6cc48	0.21	debut	0.2	0.19	0.46	0.32	8	2	2026-04-02T23:12:33.540Z
4119f284-b383-4f42-b5de-120832d90f38	fd99e0ca-adff-4441-8930-d33d751f338d	0.8	confirme	0.18	0.62	0.89	0.75	8	2	2026-04-02T23:12:33.540Z
c2ff7f2f-a27d-4d58-8707-1657ea57e15d	dd7958bf-ee38-49c8-a415-9b3bedc2f0d6	0.57	en_cours	0.48	0.86	0.6	0.66	6	2	2026-04-02T23:12:33.540Z
8dfdcf13-b095-45b7-a1f9-c4ae3336dd4a	7d1d750a-4ef8-47ce-a931-1b9fe6b9f49e	0.1	debut	0.21	0.68	0.49	0.8	9	3	2026-04-02T23:12:33.540Z
388893ee-ea0a-45f7-839a-05d80848fe0b	0bd68b2d-f655-4144-b7bc-771feec336c3	0.41	en_cours	0.29	0.42	0.53	0.27	6	2	2026-04-02T23:12:33.540Z
6c9fd883-6c99-4c55-9dd8-5298985b964e	2f8dec79-7738-4d51-a41d-1ee3f70b9988	0.12	debut	0.25	0.66	0.78	0.74	6	2	2026-04-02T23:12:33.540Z
ca3ade26-63c7-4f76-a2b7-6b0dc14114ec	20b623fe-413c-4f8f-8b2c-d4500aa96a84	0.19	debut	0.12	0.28	0.44	0.39	6	2	2026-04-02T23:12:33.540Z
85854f63-4d62-4710-b2c5-42e4b5ad76f8	a3f1e578-9e48-415b-b33c-34f0b86cb66e	0.27	debut	0.61	0.84	0.61	0.47	6	2	2026-04-02T23:12:33.540Z
b69c67f0-821d-426d-b1b7-3227a7915f00	3a93c177-0629-4841-93c4-1c4af6731579	0.53	en_cours	0.3	0.21	0.55	0.68	6	2	2026-04-02T23:12:33.540Z
405b2cca-0109-4303-a043-bce3bd18f621	e162347e-9ffa-412f-8ccc-886afb575db6	0.19	debut	0.45	0.6	0.59	0.2	4	1	2026-04-02T23:12:33.540Z
979053e2-75da-4fb4-93d2-27f6cdda2de5	2cd16062-6978-410a-b9d3-e3446b2dbe8f	0.55	en_cours	0.38	0.16	0.58	0.65	4	1	2026-04-02T23:12:33.540Z
0f09efb3-8341-486e-b16a-9da746314312	3de8b387-ff4b-4bbd-a263-97e331321225	0.33	debut	0.15	0.59	0.31	0.42	9	3	2026-04-02T23:12:33.540Z
5957e87e-c79d-4524-b2c1-7f0c0b86687f	8fe5d659-c661-4b97-91e0-a067c5f22cb8	0.25	debut	0.3	0.82	0.45	0.69	6	2	2026-04-02T23:12:33.540Z
8e6d2b63-7ff0-4078-bc83-49f1c7d0ef38	b726a0b9-9690-4c50-8e30-dbd283520fe4	0.12	debut	0.78	0.48	0.17	0.42	8	2	2026-04-02T23:12:33.540Z
f8357bd5-8c8e-4698-afca-5c7ec96f4dd2	5fb5a284-5c15-4fd2-98a9-09c9825602a3	0.32	debut	0.6	0.71	0.9	0.23	6	2	2026-04-02T23:12:33.540Z
0aa6f048-3d39-4ed5-9f15-31139cbbff5e	ef753a23-d9dd-465c-85a1-77b0eb8e478a	0.26	debut	0.45	0.44	0.5	0.41	8	2	2026-04-02T23:12:33.540Z
baf0f99d-0de1-42b5-8306-a48c59dc52d2	9e0f0abb-d9b0-43c6-86c9-0cdf1cef8421	0.19	debut	0.85	0.81	0.11	0.21	4	1	2026-04-02T23:12:33.540Z
65e7f337-f58f-4163-ae63-e754ad0112bc	4524bddb-31ac-401d-91b2-9a093914aa72	0.6	en_cours	0.5	0.74	0.73	0.14	4	1	2026-04-02T23:12:33.540Z
bb1deeae-55ee-49b0-9167-87f22d343ec7	c4c24e69-e45d-4397-b516-01a93f56fddc	0.69	en_cours	0.74	0.27	0.88	0.65	8	2	2026-04-02T23:12:33.540Z
19c9f0af-4a38-4d2a-a76c-cdd2b93d738f	fbc357d6-24d3-4a23-bc4e-568cc698cdc1	0.17	debut	0.84	0.35	0.65	0.72	6	2	2026-04-02T23:12:33.540Z
fb79809d-b678-4ab1-9ac4-df13ffcbc686	06c75081-3902-4d97-a9e1-9950a9f72211	0.14	debut	0.55	0.25	0.87	0.84	9	3	2026-04-02T23:12:33.540Z
2f68ec4f-27fa-4785-b684-ddeaf3c08086	25a4b725-3b30-49ae-bde4-32a109d0aaf5	0.28	debut	0.89	0.89	0.41	0.84	6	2	2026-04-02T23:12:33.540Z
96510ebb-6b6f-4bba-841f-0bb769eb83ea	c18b9565-e55f-47bf-8ad8-5ede1971326e	0.24	debut	0.27	0.24	0.19	0.8	4	1	2026-04-02T23:12:33.540Z
95d9ae8d-8196-47b0-827e-e3546d353765	0782a562-8562-421f-bb77-a980f9b17414	0.45	en_cours	0.15	0.42	0.2	0.72	6	2	2026-04-02T23:12:33.540Z
ed7b75dd-953e-4475-97e5-2b29a00cec2f	a5e754fd-de58-4c94-978e-d934e2eb8d30	0.68	en_cours	0.63	0.49	0.17	0.88	9	3	2026-04-02T23:12:33.540Z
ef8dd4dc-fdd6-480b-9fac-a50685ec620b	54397c3f-fc8a-4bbc-9491-58c4f2326513	0.76	confirme	0.3	0.18	0.14	0.6	6	2	2026-04-02T23:12:33.540Z
35eb292c-092e-411c-9c7a-41dd3a8a90eb	7e805fa7-7ce9-4113-b0e7-f133d3ed5e64	0.8	confirme	0.8	0.72	0.72	0.19	9	3	2026-04-02T23:12:33.540Z
f15fda79-2357-409a-8930-b41095ffc0c6	c9120feb-d40f-4030-a9a5-095f5e02d608	0.77	confirme	0.29	0.64	0.75	0.34	6	2	2026-04-02T23:12:33.540Z
9077bd5f-ca4d-46ba-a283-19210f020d01	f60e2beb-acd7-4e87-8f56-b13fc1a4ac22	0.82	confirme	0.15	0.12	0.75	0.86	6	2	2026-04-02T23:12:33.540Z
d0e4628c-c16e-4744-abdf-14d9c7ccda2a	39be7f82-99f3-491e-842d-417fa7df4700	0.73	confirme	0.44	0.66	0.77	0.57	8	2	2026-04-02T23:12:33.540Z
6ecce646-22b6-4614-aa4b-65a93e2b7563	654cc014-09ce-427d-a696-1d19d6d0adff	0.16	debut	0.63	0.31	0.41	0.22	6	2	2026-04-02T23:12:33.540Z
75dcf663-341b-4a32-944e-0c6e3744f959	b6f5c8b4-eb4b-4689-a5f2-d8fdd2d5149d	0.66	en_cours	0.64	0.13	0.11	0.28	6	2	2026-04-02T23:12:33.540Z
b5dcfa3d-3157-4e35-870a-7a4479cc4957	43ebe8bb-f6a6-4c7c-85a2-d28024521201	0.87	confirme	0.35	0.36	0.55	0.66	6	2	2026-04-02T23:12:33.540Z
309b8a98-ddef-48f3-95cb-1e7648778b80	03a8a89e-37cb-4428-9425-013c69ddd2c6	0.61	en_cours	0.51	0.14	0.41	0.88	6	2	2026-04-02T23:12:33.540Z
cda25f03-cfd3-4829-9df7-ea3f1cece2a8	c122a8c9-5581-4f93-88a7-b5a45b0e710d	0.19	debut	0.87	0.76	0.33	0.17	6	2	2026-04-02T23:12:33.540Z
00a88cfc-e6de-4fd7-87c5-0732b76fd59e	eff36237-540d-4a35-a070-f7b2b911bc95	0.35	debut	0.72	0.78	0.59	0.29	9	3	2026-04-02T23:12:33.540Z
b84dee8b-e61d-453c-90a3-de4bc7e56e0c	76270bf6-f037-4ea5-8079-146a184cafc0	0.48	en_cours	0.11	0.24	0.51	0.12	6	2	2026-04-02T23:12:33.540Z
96250f36-f7fc-45ad-b126-7e66ee76fe84	cdaca7ab-094c-442b-8d2b-9f3dee56c635	0.56	en_cours	0.28	0.22	0.48	0.21	4	1	2026-04-02T23:12:33.540Z
14f56a09-0012-4da0-804d-565028050dd7	c1bd6a0c-0f61-4894-a866-5ac89cd05f82	0.53	en_cours	0.19	0.12	0.44	0.14	4	1	2026-04-02T23:12:33.540Z
fbf808c9-139e-4faa-af5c-3c865a0723de	92598bcd-69c4-4b3b-bde0-f1c05569d886	0.49	en_cours	0.8	0.35	0.13	0.29	6	2	2026-04-02T23:12:33.540Z
ad1f847b-a366-43e9-b966-c77f7e6d2140	c81f9f95-e102-4558-bcb5-cc45ce7d018c	0.3	debut	0.63	0.73	0.65	0.72	4	1	2026-04-02T23:12:33.540Z
6c6e9fa5-d67b-41d5-ab0a-b6447499758a	05d49191-ef46-4e50-aa03-fde945c96896	0.51	en_cours	0.12	0.7	0.61	0.55	8	2	2026-04-02T23:12:33.540Z
03c33f02-be08-4a8f-9b00-4f09b286901d	b4158d6b-da5a-4f8b-8be4-5488ebf13b32	0.26	debut	0.74	0.82	0.42	0.34	8	2	2026-04-02T23:12:33.540Z
a6a6d311-e0f6-4b8d-8109-fdff46e43714	6c9e4172-b593-4ae3-9c12-7aeb73fb3361	0.35	debut	0.31	0.45	0.57	0.14	9	3	2026-04-02T23:12:33.540Z
0cdfd223-780a-47f7-b00a-09e67c258408	da216f27-4c36-403d-9041-9295c4577b6b	0.81	confirme	0.36	0.29	0.3	0.52	4	1	2026-04-02T23:12:33.540Z
58e45919-721d-48b6-97a7-41f3740b747e	478a7def-c724-4d1e-838c-24d4a7e8aa3b	0.83	confirme	0.14	0.42	0.9	0.38	9	3	2026-04-02T23:12:33.540Z
5ac08a62-af14-4651-9338-31e5e3f43353	381f924c-fe52-4a9f-8568-11369e14c544	0.29	debut	0.51	0.63	0.53	0.65	8	2	2026-04-02T23:12:33.540Z
0359ec96-295b-4feb-8e96-45d37df775d9	25c7b2b0-4759-4100-953d-c732e7d51cfc	0.24	debut	0.84	0.75	0.74	0.21	9	3	2026-04-02T23:12:33.540Z
cfb2d344-cd28-42ef-abc2-48e72da45320	0a58652a-8b68-4074-a9a0-ed0f609205e8	0.26	debut	0.31	0.8	0.62	0.19	9	3	2026-04-02T23:12:33.540Z
48e6b4f3-f836-4fc8-92ab-d71d502b4f99	2e1216a4-098c-46ef-9bdb-54d64d2d128c	0.29	debut	0.24	0.57	0.43	0.78	4	1	2026-04-02T23:12:33.540Z
27247347-4e85-4bfb-8753-f9ea8c915565	7aec43d7-b9f4-4626-8f31-33acab3c3945	0.24	debut	0.18	0.11	0.4	0.77	4	1	2026-04-02T23:12:33.540Z
\.


--
-- Data for Name: instantane_profil; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.instantane_profil (id, utilisateur_id, conversation_id, index_message, r, i, a, s, e, c, coherence_signaux, horodatage) FROM stdin;
\.


--
-- Data for Name: message; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.message (id, conversation_id, role, contenu, contenu_brut, url_audio, fragilite_detectee, niveau_fragilite, profil_extrait, horodatage) FROM stdin;
2803910f-6495-4eac-9518-d37ef921b550	c559ae83-4e02-4007-8014-89cc520193c3	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-19T09:07:50.496Z
ad4e973a-2666-4045-b24a-cdce923e1b7a	c559ae83-4e02-4007-8014-89cc520193c3	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-19T09:08:49.244Z
43669223-db3d-4b08-bdfa-dc9e89daa8e6	c559ae83-4e02-4007-8014-89cc520193c3	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-19T09:09:53.999Z
58e2dd22-df53-4a7f-b6e6-6b60605fc504	c559ae83-4e02-4007-8014-89cc520193c3	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-19T09:10:53.855Z
81aaea0a-9cba-4413-bba4-0e957fb7750f	c559ae83-4e02-4007-8014-89cc520193c3	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-19T09:11:42.637Z
fedebb3e-b3d0-4df2-a31b-501b56bcbe3a	c559ae83-4e02-4007-8014-89cc520193c3	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-19T09:13:01.749Z
5aedfbae-f7dd-4227-8b3a-9c33a4c8a551	c48e6099-ffba-48ed-8a3e-c6ac28d39e5f	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-16T02:58:02.528Z
afde3958-c530-4e6b-9762-be6be6105707	c48e6099-ffba-48ed-8a3e-c6ac28d39e5f	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-16T02:59:10.308Z
4f6de813-594d-4060-b95d-385a52f367ea	c48e6099-ffba-48ed-8a3e-c6ac28d39e5f	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-16T03:00:01.385Z
5197cefe-43f8-47c4-8759-61a84244138f	c48e6099-ffba-48ed-8a3e-c6ac28d39e5f	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-16T03:01:22.873Z
649fafa5-578c-4b30-a346-d6ec7babcfd9	c48e6099-ffba-48ed-8a3e-c6ac28d39e5f	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-16T03:02:19.883Z
977666fc-e081-4010-b95b-aa86a9b60e03	c48e6099-ffba-48ed-8a3e-c6ac28d39e5f	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-16T03:03:08.515Z
f5229e16-1913-476d-a557-21d037d30c6a	1bc321ff-01de-43ae-9349-4c4334a7b918	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-18T03:13:38.311Z
6537eb6f-d854-40dc-b742-d569f233d92a	1bc321ff-01de-43ae-9349-4c4334a7b918	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-18T03:14:39.206Z
7566f02c-eed7-45f5-afa5-03dca6bebea7	1bc321ff-01de-43ae-9349-4c4334a7b918	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-18T03:15:56.636Z
ff194657-003f-44d3-aecd-fa8b5bbe5a9c	1bc321ff-01de-43ae-9349-4c4334a7b918	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-18T03:16:54.169Z
1b6d7384-adaa-4360-8ae0-3147c4516d8a	1bc321ff-01de-43ae-9349-4c4334a7b918	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-18T03:17:36.887Z
206f9aa2-160a-4f47-8e35-8fe39b03a9eb	1bc321ff-01de-43ae-9349-4c4334a7b918	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-18T03:18:54.781Z
5e0d6f4e-4684-4abc-a674-4dec71df5a9d	1bc321ff-01de-43ae-9349-4c4334a7b918	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-18T03:19:37.414Z
65646eee-874c-4d5e-91ad-ffd66495def7	1bc321ff-01de-43ae-9349-4c4334a7b918	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-18T03:21:03.891Z
a1c6e555-4c3b-41e8-827a-a84f17921a12	1bc321ff-01de-43ae-9349-4c4334a7b918	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-18T03:21:58.853Z
66e18945-bc6e-4a9a-bd66-1691059107eb	4651d2fd-29a6-458d-b8b5-8988d6952302	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-23T10:20:16.419Z
fc05cb85-25f8-4206-95f0-e6672b57b0fb	4651d2fd-29a6-458d-b8b5-8988d6952302	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-23T10:20:55.478Z
7ff8a7c1-607d-4799-bb2f-8cebe70c8ec8	4651d2fd-29a6-458d-b8b5-8988d6952302	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-23T10:21:53.900Z
7c439dfe-f976-446e-b185-2033071be336	4651d2fd-29a6-458d-b8b5-8988d6952302	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-23T10:22:54.316Z
b59d26f7-4a0a-4ebc-8318-efde6528bd1d	4651d2fd-29a6-458d-b8b5-8988d6952302	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-23T10:24:15.166Z
4b4f9bf3-f93b-4c83-8f19-372f1634b02f	4651d2fd-29a6-458d-b8b5-8988d6952302	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-23T10:24:55.587Z
8746ac65-2897-4439-9882-6e46f1dca567	4651d2fd-29a6-458d-b8b5-8988d6952302	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-23T10:26:19.711Z
733e527c-0dac-4757-b426-d5fc886966ac	4651d2fd-29a6-458d-b8b5-8988d6952302	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-23T10:27:14.012Z
a43ce313-3f34-4e5c-b06f-f8422be3bd12	4651d2fd-29a6-458d-b8b5-8988d6952302	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-23T10:28:03.659Z
db95bc4c-d02a-4986-a3f9-40f92b1e0c94	953fc9f2-aadb-4764-842c-0c8fc5eb8a97	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-26T03:29:47.766Z
6a81ed80-bef4-4f61-88d6-31e87f3ab692	953fc9f2-aadb-4764-842c-0c8fc5eb8a97	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-26T03:30:43.386Z
08c7ea2f-6db4-4957-b81c-a5a9d292ebd5	953fc9f2-aadb-4764-842c-0c8fc5eb8a97	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-26T03:31:53.065Z
774b4e65-ac99-4e00-87b5-34ba3dd73d3a	953fc9f2-aadb-4764-842c-0c8fc5eb8a97	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-26T03:33:01.346Z
8acbba1a-728f-4e2c-80f0-649a7d8f979d	953fc9f2-aadb-4764-842c-0c8fc5eb8a97	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-26T03:33:50.022Z
cc6f5f63-6e9f-44e7-b4d6-9c94ffb759bb	953fc9f2-aadb-4764-842c-0c8fc5eb8a97	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-26T03:35:03.352Z
c17be2d2-6b62-40c1-9722-0539893da09f	91d3ac98-5137-44f2-8852-031fbd16a96b	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-17T05:57:22.282Z
7e099c9e-ad7f-4922-a384-afe7afa36372	91d3ac98-5137-44f2-8852-031fbd16a96b	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-17T05:58:24.088Z
669e0903-c1d2-474c-a534-06f83daad082	91d3ac98-5137-44f2-8852-031fbd16a96b	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-17T05:59:20.640Z
db8660f6-9103-42a2-b8d2-f551781bc179	91d3ac98-5137-44f2-8852-031fbd16a96b	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-17T05:59:55.996Z
41d409b1-022b-423f-a14e-97a805b6249c	816d6174-ea74-4eea-ae9d-7974cebd1f3a	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-25T05:38:07.800Z
35e83682-8395-49de-a8e0-5b35b5729e02	816d6174-ea74-4eea-ae9d-7974cebd1f3a	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-25T05:39:12.281Z
3a41d1e6-a7c8-4172-b823-5a84ce64764c	816d6174-ea74-4eea-ae9d-7974cebd1f3a	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-25T05:39:52.017Z
1aa2beb0-79cd-4c86-b0d2-545ae933ce3c	816d6174-ea74-4eea-ae9d-7974cebd1f3a	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-25T05:41:20.798Z
fc029e7c-2173-4d4a-bbcb-2cc2293d3aa5	816d6174-ea74-4eea-ae9d-7974cebd1f3a	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-25T05:42:21.238Z
e61c6ec4-3820-4f0b-92e8-a33c067d9f8e	816d6174-ea74-4eea-ae9d-7974cebd1f3a	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-25T05:42:52.762Z
87a7b255-851f-4b7c-8cf8-8d1efeb5b5ae	816d6174-ea74-4eea-ae9d-7974cebd1f3a	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-25T05:44:07.405Z
c81c7f1e-314e-4ebd-8cf5-95db5c34fde4	816d6174-ea74-4eea-ae9d-7974cebd1f3a	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-25T05:45:04.118Z
7ac983c3-9994-4cf4-8df5-561e79620b56	50bba20c-ed93-4040-aa0d-41917d175d27	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-19T19:25:14.520Z
dba44eba-e727-4d01-8d45-51c8aa7dee5f	50bba20c-ed93-4040-aa0d-41917d175d27	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-19T19:26:13.653Z
d77737f4-39f9-4e3f-a62a-15044392550a	50bba20c-ed93-4040-aa0d-41917d175d27	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-19T19:27:05.240Z
3fca5369-0234-4708-afb5-77ed754fe37b	50bba20c-ed93-4040-aa0d-41917d175d27	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-19T19:28:10.334Z
67bb5b9c-186a-4366-bb3e-6f5cd6bed6e8	50bba20c-ed93-4040-aa0d-41917d175d27	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-19T19:28:53.938Z
a86e1190-ca04-4a54-b2b5-415dc2140d48	50bba20c-ed93-4040-aa0d-41917d175d27	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-19T19:29:55.434Z
aea388ee-2b6c-4d18-8ac0-c5536cb63241	50bba20c-ed93-4040-aa0d-41917d175d27	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-19T19:31:16.367Z
80499171-3f74-402b-a79c-77b9ad5b1b97	50bba20c-ed93-4040-aa0d-41917d175d27	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-19T19:32:06.215Z
25bdff52-3fcd-4704-a1fc-aad80f39e022	cd4ee462-127d-4dc7-8c28-1dce077d8ab1	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-14T06:44:02.281Z
ceb6c5b5-4e86-4cb9-9712-7aac261cd3bc	cd4ee462-127d-4dc7-8c28-1dce077d8ab1	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-14T06:45:01.806Z
b6121258-b928-4588-abce-974e2b4f8e14	cd4ee462-127d-4dc7-8c28-1dce077d8ab1	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-14T06:46:03.270Z
e71a80a5-d3d3-4fe0-b49c-4cc4f8c0018f	cd4ee462-127d-4dc7-8c28-1dce077d8ab1	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-14T06:47:13.331Z
3fccc0e7-59c1-40f1-83c8-bf8f76c76d44	cd4ee462-127d-4dc7-8c28-1dce077d8ab1	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-14T06:47:58.978Z
ae2e6cd8-287f-4850-be04-e40ba33880f7	cd4ee462-127d-4dc7-8c28-1dce077d8ab1	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-14T06:49:23.676Z
c17b86e5-e0d0-444a-96f9-5a1ec66f020b	7babd6e6-482d-4699-928c-143f5a764e10	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-23T12:08:03.736Z
d0830dfd-67cc-4509-97c8-e33bc84fa7ba	7babd6e6-482d-4699-928c-143f5a764e10	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-23T12:08:58.142Z
2b04cb73-1a5c-4d45-ad96-e991333712da	7babd6e6-482d-4699-928c-143f5a764e10	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-23T12:09:51.874Z
c0b50f61-1278-49af-9764-a70bea1c70c9	7babd6e6-482d-4699-928c-143f5a764e10	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-23T12:11:03.356Z
ebcd7d5c-88f2-4891-8b56-494f0c5e3b63	6202684c-c271-4df2-a118-111b0fe9e129	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-24T14:02:26.159Z
e2e8521d-a489-49dd-85ff-8a6ed074278b	6202684c-c271-4df2-a118-111b0fe9e129	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-24T14:03:26.018Z
ccc30c6b-d99b-4e31-8fe6-0cbe2e4f79f6	6202684c-c271-4df2-a118-111b0fe9e129	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-24T14:04:32.856Z
196550bf-8167-49a7-add9-3bef97fb4039	6202684c-c271-4df2-a118-111b0fe9e129	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-24T14:05:46.450Z
7eeae868-650b-4bc0-a89c-a575544dceda	6202684c-c271-4df2-a118-111b0fe9e129	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-24T14:06:52.081Z
2d588283-a78f-4888-b6b5-0437e455bad7	6202684c-c271-4df2-a118-111b0fe9e129	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-24T14:07:43.960Z
7c1dea04-bfd0-49d7-9a94-08fd05f223be	faf847ef-49cb-45dd-b947-9bb6fd3a2ee6	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-04-02T17:44:16.534Z
85d10b38-24f3-46b0-ba0f-7f14a7fbc406	faf847ef-49cb-45dd-b947-9bb6fd3a2ee6	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-04-02T17:45:28.330Z
e3d923d3-cd61-414f-8828-fbb74cadb60a	faf847ef-49cb-45dd-b947-9bb6fd3a2ee6	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-04-02T17:46:27.393Z
672fdb1d-ced2-4abe-ada2-4c7a1f054cde	faf847ef-49cb-45dd-b947-9bb6fd3a2ee6	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-04-02T17:47:17.679Z
66850444-6ca8-425c-9be5-fe905e72dfb8	faf847ef-49cb-45dd-b947-9bb6fd3a2ee6	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-04-02T17:48:32.903Z
c0c6ff3d-8c11-42d4-aa34-8af4bd9588d1	faf847ef-49cb-45dd-b947-9bb6fd3a2ee6	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-04-02T17:49:28.222Z
10824239-db5a-4245-adb8-00ad69737220	7e2bb3c0-6e44-4452-90df-f3dde0997039	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-16T05:33:59.876Z
b88ab1d2-13c1-4fd0-ac87-150a0f923a72	7e2bb3c0-6e44-4452-90df-f3dde0997039	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-16T05:35:25.206Z
bbe4e86f-fd2b-4871-a187-60f829b0dd98	7e2bb3c0-6e44-4452-90df-f3dde0997039	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-16T05:36:10.876Z
1e159459-d29e-4182-80c4-7518c21b10c1	7e2bb3c0-6e44-4452-90df-f3dde0997039	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-16T05:37:10.509Z
aac27ec9-dd07-4f1b-a225-3a3934114ba7	7e2bb3c0-6e44-4452-90df-f3dde0997039	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-16T05:38:05.370Z
5d2d5815-5db6-4e38-af75-075d25b40a54	7e2bb3c0-6e44-4452-90df-f3dde0997039	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-16T05:39:01.241Z
c841351f-5caa-4fef-bb29-0af73710f875	7e2bb3c0-6e44-4452-90df-f3dde0997039	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-16T05:40:16.219Z
618cf28a-2b11-4289-bc8f-5d844f7daf8b	7e2bb3c0-6e44-4452-90df-f3dde0997039	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-16T05:41:14.543Z
78cd02bd-80d6-447f-a17b-2c1d6d4e53c0	7e2bb3c0-6e44-4452-90df-f3dde0997039	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-16T05:42:25.653Z
d10c4b56-728d-4b94-8201-bc4c803f1285	bd3bc73e-d248-436a-99f4-d42b197dcf10	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-19T08:40:41.067Z
f5bb3e5f-fdf9-4b2e-8a6f-bc5e73af0644	bd3bc73e-d248-436a-99f4-d42b197dcf10	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-19T08:41:35.214Z
9da6497d-4eda-464b-b536-decb7e087cf3	bd3bc73e-d248-436a-99f4-d42b197dcf10	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-19T08:42:30.646Z
d459db1a-7e64-42e1-b984-8b1aebc7c7b3	bd3bc73e-d248-436a-99f4-d42b197dcf10	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-19T08:43:49.785Z
637965d3-64cb-4c19-9238-35acab261d0d	bd3bc73e-d248-436a-99f4-d42b197dcf10	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-19T08:44:35.475Z
e66e72c9-600a-4801-8d23-a3fd03a8a7af	bd3bc73e-d248-436a-99f4-d42b197dcf10	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-19T08:45:33.747Z
94392217-b32a-4db2-9d0f-247c671b80a7	e8e08121-4ef0-4780-a45c-32f837a74aba	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-18T07:51:10.716Z
a947a1eb-10ef-4606-818e-c37c7d650bf8	e8e08121-4ef0-4780-a45c-32f837a74aba	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-18T07:52:15.757Z
c397b6a4-2ea8-4341-8194-e7ef057c9cbc	e8e08121-4ef0-4780-a45c-32f837a74aba	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-18T07:52:58.920Z
4fc26977-c47c-4cf0-b95c-b2c49b96e3a4	e8e08121-4ef0-4780-a45c-32f837a74aba	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-18T07:53:55.607Z
8667f9f4-e436-47f3-a934-bea14590cb09	e8e08121-4ef0-4780-a45c-32f837a74aba	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-18T07:55:12.228Z
19fffe92-1e0a-416d-9bfc-0e0e91fb9a6c	e8e08121-4ef0-4780-a45c-32f837a74aba	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-18T07:55:54.995Z
f2b6dcd2-fc72-4eb1-96fc-07b632e03d87	d7aeb707-de9f-4a98-9331-8a1983a64ec6	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-26T20:47:38.210Z
91cf0479-3abd-4cc4-b758-3943ccb76c2e	d7aeb707-de9f-4a98-9331-8a1983a64ec6	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-26T20:48:43.761Z
21e898f7-5745-44f9-b336-caa7894d9782	d7aeb707-de9f-4a98-9331-8a1983a64ec6	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-26T20:49:18.866Z
e2918a21-35ce-4742-afae-bfad377bc945	d7aeb707-de9f-4a98-9331-8a1983a64ec6	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-26T20:50:18.041Z
44fe7695-e96b-423f-9118-e2074f58f32e	d7aeb707-de9f-4a98-9331-8a1983a64ec6	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-26T20:51:34.810Z
82d9c367-9281-4ec8-9638-0245d420752e	d7aeb707-de9f-4a98-9331-8a1983a64ec6	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-26T20:52:37.699Z
b7e948a7-0ba6-4db4-b019-626255603777	49bb3f73-f489-429d-ba5f-7b732012c800	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-28T11:44:22.660Z
49e0ca89-448a-48e1-af0f-bad63653d609	49bb3f73-f489-429d-ba5f-7b732012c800	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-28T11:45:32.358Z
a76d1cc5-a33b-4ffe-a8af-617163da2c5c	49bb3f73-f489-429d-ba5f-7b732012c800	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-28T11:46:18.431Z
73719789-6026-4909-ad59-db916e4798c7	49bb3f73-f489-429d-ba5f-7b732012c800	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-28T11:47:24.403Z
da6a72fd-5cf3-4761-b90d-fd0a3300535b	49bb3f73-f489-429d-ba5f-7b732012c800	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-28T11:48:31.996Z
4fd21b1c-5abc-4332-8c32-7fb19cde882a	49bb3f73-f489-429d-ba5f-7b732012c800	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-28T11:49:26.331Z
91792af5-2237-438a-90fa-1ce3b0a47837	ef596988-1d77-436c-a0b9-d5f5788ed3e6	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-18T08:07:09.361Z
cab668ee-b0e9-469d-906e-3d35a9ececa3	ef596988-1d77-436c-a0b9-d5f5788ed3e6	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-18T08:08:15.630Z
80be85f5-a0eb-4f42-8146-b64325d94efd	ef596988-1d77-436c-a0b9-d5f5788ed3e6	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-18T08:09:15.804Z
93a8b2f6-0c94-4f46-a749-c0bd78297d70	ef596988-1d77-436c-a0b9-d5f5788ed3e6	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-18T08:10:04.811Z
c27e6c73-cd64-42ba-b591-27aed4e0fb74	ef596988-1d77-436c-a0b9-d5f5788ed3e6	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-18T08:11:19.682Z
ce05d87e-7340-4b50-b0c6-54c7b60677ae	ef596988-1d77-436c-a0b9-d5f5788ed3e6	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-18T08:12:04.216Z
365a7ea2-f3cd-45ef-b3e0-d50d48eb7689	ef596988-1d77-436c-a0b9-d5f5788ed3e6	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-18T08:13:25.855Z
01c6d714-2e32-43b0-b3b9-060865703c4e	ef596988-1d77-436c-a0b9-d5f5788ed3e6	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-18T08:14:29.070Z
14fe5a52-fd7c-46bc-965a-17f619559e27	62c8daa3-8746-493c-aff3-bfbf41fc304e	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-31T02:44:51.566Z
94c60fdc-8549-48d0-becc-74fd1648d361	62c8daa3-8746-493c-aff3-bfbf41fc304e	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-31T02:46:08.103Z
6464864d-71a8-4546-977c-2217c8de2bd6	62c8daa3-8746-493c-aff3-bfbf41fc304e	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-31T02:46:49.135Z
e6b08171-3937-4ef2-bb17-b0068bdee303	62c8daa3-8746-493c-aff3-bfbf41fc304e	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-31T02:47:53.380Z
c8f41a29-9be2-4250-9be2-d1ec0477d25c	62c8daa3-8746-493c-aff3-bfbf41fc304e	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-31T02:48:57.934Z
e690688d-d5e4-4608-bbf8-ccce9f9279eb	62c8daa3-8746-493c-aff3-bfbf41fc304e	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-31T02:49:46.894Z
9d970342-3b35-4371-baba-9a18067969f5	59d6d2e6-bedc-404a-9413-cecb90787506	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-25T00:03:19.576Z
6dafc5d4-37be-4958-b312-ac092a7d518f	59d6d2e6-bedc-404a-9413-cecb90787506	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-25T00:04:12.362Z
09b0734e-232d-464d-a3cd-d845619de3d6	59d6d2e6-bedc-404a-9413-cecb90787506	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-25T00:05:38.157Z
e34e1e9d-560d-4a5e-bdd1-05379a4a1c6e	59d6d2e6-bedc-404a-9413-cecb90787506	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-25T00:06:11.847Z
1a9bfc7f-2e91-4154-b8bb-5944dfdd3004	cf3c6564-6489-4b06-a458-1602504fbd29	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-28T09:11:14.151Z
3623fa2f-4a3a-4e7a-87cf-90e333549f18	cf3c6564-6489-4b06-a458-1602504fbd29	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-28T09:11:59.020Z
93135fac-0581-48d6-beef-ab89fcea5501	cf3c6564-6489-4b06-a458-1602504fbd29	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-28T09:13:17.215Z
4a633c3a-9953-4c52-a128-78beea48ad15	cf3c6564-6489-4b06-a458-1602504fbd29	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-28T09:13:56.358Z
3a0d7087-7d21-49e3-851c-14d1c5788f61	cf3c6564-6489-4b06-a458-1602504fbd29	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-28T09:14:57.091Z
fd4653a9-da92-483e-91b5-91c5b84d8bf7	cf3c6564-6489-4b06-a458-1602504fbd29	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-28T09:15:59.888Z
970a9ddc-afb2-49be-ba72-224cacc270fb	cf3c6564-6489-4b06-a458-1602504fbd29	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-28T09:17:16.576Z
53be66e4-f3c3-4381-b224-8d3ad3143956	cf3c6564-6489-4b06-a458-1602504fbd29	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-28T09:18:22.749Z
7ac160a0-ac0f-48c5-99e3-9191953ff8cc	cf3c6564-6489-4b06-a458-1602504fbd29	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-28T09:18:54.025Z
76f63efe-0b59-4135-9a9b-d3fd1e9f37ad	97e03edc-31a4-4cc2-8da7-096c3b1fe006	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-04-01T07:07:58.238Z
06c433ea-edf4-42b6-9554-43136ffe1338	97e03edc-31a4-4cc2-8da7-096c3b1fe006	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-04-01T07:09:13.100Z
cdfaca64-f261-40ab-8032-c538f65ce2e6	97e03edc-31a4-4cc2-8da7-096c3b1fe006	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-04-01T07:10:02.714Z
629bd520-52f3-4ceb-a298-d2dcc4c90370	97e03edc-31a4-4cc2-8da7-096c3b1fe006	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-04-01T07:11:16.535Z
cfb7822a-3201-465f-af3c-1c7da1d3539a	97e03edc-31a4-4cc2-8da7-096c3b1fe006	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-04-01T07:12:25.428Z
9d356346-dd2f-4097-b887-1907d85b99b2	97e03edc-31a4-4cc2-8da7-096c3b1fe006	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-04-01T07:13:24.482Z
e36e23c1-d189-4575-be1e-8f0956fc6e30	97e03edc-31a4-4cc2-8da7-096c3b1fe006	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-04-01T07:14:14.278Z
a8f049f1-8519-4fa0-8bb2-bc9e4c2b36aa	97e03edc-31a4-4cc2-8da7-096c3b1fe006	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-04-01T07:15:06.146Z
fdc62e83-3b1d-4ac9-a37d-1d6198509151	97e03edc-31a4-4cc2-8da7-096c3b1fe006	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-04-01T07:16:25.033Z
4a20dca5-d068-431b-bf1c-956ec41183ad	84d5d519-eb6c-4e0e-af5c-ce154e0085ad	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-04-02T06:53:06.208Z
b5bb05f3-0748-4c46-8145-0a44c967eacf	84d5d519-eb6c-4e0e-af5c-ce154e0085ad	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-04-02T06:53:45.901Z
420b37ff-ce21-4741-9627-7e429a1ed629	84d5d519-eb6c-4e0e-af5c-ce154e0085ad	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-04-02T06:54:43.358Z
95faa446-8c3d-49ed-899b-fafe5bc1eec8	84d5d519-eb6c-4e0e-af5c-ce154e0085ad	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-04-02T06:56:01.579Z
acf968cf-b66f-4282-9f46-49e9604993c1	84d5d519-eb6c-4e0e-af5c-ce154e0085ad	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-04-02T06:56:54.660Z
ef834e27-4213-4872-a93c-60e05cdb7274	84d5d519-eb6c-4e0e-af5c-ce154e0085ad	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-04-02T06:57:54.843Z
9c29cb8d-f41d-4085-bb20-17a646ebddc9	84d5d519-eb6c-4e0e-af5c-ce154e0085ad	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-04-02T06:58:53.954Z
567ab810-8949-465b-a48d-13a430f1bacd	84d5d519-eb6c-4e0e-af5c-ce154e0085ad	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-04-02T06:59:57.117Z
a6ac3489-fcad-4667-9196-1be05bb76fd0	1841458a-0eff-453c-8171-7d444eab05a9	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-22T04:59:29.269Z
4ae8d87a-1f2f-4884-9265-f7664fce3209	1841458a-0eff-453c-8171-7d444eab05a9	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-22T05:00:22.035Z
7de674e7-f817-426f-990e-38ccb64410af	1841458a-0eff-453c-8171-7d444eab05a9	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-22T05:01:09.552Z
4615a93c-a04b-4471-bb21-1ea1b0873195	1841458a-0eff-453c-8171-7d444eab05a9	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-22T05:02:27.731Z
ea2ad8cc-0c3b-4daa-a336-2a428d13569d	1841458a-0eff-453c-8171-7d444eab05a9	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-22T05:03:27.319Z
e79ff322-67a4-480f-94b6-4515abc4b57e	1841458a-0eff-453c-8171-7d444eab05a9	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-22T05:04:10.590Z
cc6293cb-4e3a-4009-a538-f026580fa0bf	1841458a-0eff-453c-8171-7d444eab05a9	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-22T05:05:32.425Z
641b35c2-d318-4626-83a2-9818ed2b53c4	1841458a-0eff-453c-8171-7d444eab05a9	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-22T05:06:26.316Z
2fed36a9-e973-43a1-bb5f-37499ef9ab5f	9a29c307-388d-4c74-8799-034eb9baee0b	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-27T10:26:25.182Z
bd9158fc-61ab-4bdd-b63c-836c679b3686	9a29c307-388d-4c74-8799-034eb9baee0b	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-27T10:27:26.640Z
23b30ec7-0c08-4a1a-b8bc-ff983c7b0dbf	9a29c307-388d-4c74-8799-034eb9baee0b	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-27T10:28:36.322Z
898b6f1b-3640-450f-b212-06e851bff5ac	9a29c307-388d-4c74-8799-034eb9baee0b	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-27T10:29:30.226Z
91c3276a-515e-4b43-ad1c-081cebff0794	8340d3da-c1b1-4fc7-84a0-daa1f777ab9a	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-16T04:15:15.360Z
51a5f8c6-47ba-4b2e-aff9-0acb0872a6d7	8340d3da-c1b1-4fc7-84a0-daa1f777ab9a	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-16T04:16:24.695Z
a144d8d2-1299-43e0-9106-75a7cf7c5c4c	8340d3da-c1b1-4fc7-84a0-daa1f777ab9a	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-16T04:17:26.665Z
d9f50216-16da-40c8-9bb5-2d0ce3f2a8a6	8340d3da-c1b1-4fc7-84a0-daa1f777ab9a	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-16T04:18:24.725Z
39607452-b8c2-45fc-92e4-81562cc7de99	8340d3da-c1b1-4fc7-84a0-daa1f777ab9a	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-16T04:19:39.667Z
752022bb-7cad-4992-955e-6ce98d38be7d	8340d3da-c1b1-4fc7-84a0-daa1f777ab9a	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-16T04:20:42.520Z
45f6cc25-5676-4d85-a53a-3ed03c808b1b	8340d3da-c1b1-4fc7-84a0-daa1f777ab9a	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-16T04:21:21.219Z
5b788f12-0a40-41cc-8bfa-f52d39f44f35	8340d3da-c1b1-4fc7-84a0-daa1f777ab9a	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-16T04:22:16.681Z
4fd07c8b-187c-4c8b-b0bb-617f5b2e9e2a	8340d3da-c1b1-4fc7-84a0-daa1f777ab9a	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-16T04:23:32.078Z
8d3d8c0d-c331-421c-8fd8-3f925f820fd3	47c376e7-5ef2-4df2-810d-1513360b90d1	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-24T22:04:36.651Z
a1c4ae61-4901-4a14-a157-f08432e00c50	47c376e7-5ef2-4df2-810d-1513360b90d1	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-24T22:05:17.006Z
de823f93-ac2a-4a8f-ab83-1c933d43b4dc	47c376e7-5ef2-4df2-810d-1513360b90d1	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-24T22:06:18.255Z
dd70317e-8e74-4c31-9d51-3439b98d6e82	47c376e7-5ef2-4df2-810d-1513360b90d1	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-24T22:07:32.505Z
af44506b-59bf-4e33-89f0-ece828424ca0	47c376e7-5ef2-4df2-810d-1513360b90d1	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-24T22:08:39.592Z
d31dfd07-8c5d-4e0a-96a5-22e5e9e92704	47c376e7-5ef2-4df2-810d-1513360b90d1	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-24T22:09:27.540Z
794e0e05-11e3-40ba-b126-48f880870688	45ebe672-80ff-4084-a87f-40d6968e2de1	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-20T17:24:02.239Z
7badca7b-9478-4566-8c6d-a1dcde0eb742	45ebe672-80ff-4084-a87f-40d6968e2de1	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-20T17:25:31.300Z
373212ca-4292-40b7-9534-ac88fcaf970a	45ebe672-80ff-4084-a87f-40d6968e2de1	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-20T17:26:03.065Z
89e115a1-99fb-456a-a262-eb1b2c0a30ba	45ebe672-80ff-4084-a87f-40d6968e2de1	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-20T17:27:12.463Z
f24fdd7a-271b-4120-8ca2-5401c54cff68	c58397cf-8e8d-4f46-b2c7-f49a406dd7ea	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-19T00:43:23.231Z
7518497d-8502-4ee8-b14c-4adf7ce6febb	c58397cf-8e8d-4f46-b2c7-f49a406dd7ea	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-19T00:44:26.212Z
2743c697-8e31-4384-b470-f13be62df811	c58397cf-8e8d-4f46-b2c7-f49a406dd7ea	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-19T00:45:29.283Z
6ad699fa-d8ee-4437-8eb4-57393e0ba1f8	c58397cf-8e8d-4f46-b2c7-f49a406dd7ea	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-19T00:46:29.545Z
d47047aa-9c85-4f67-b123-a8f1cebcf1b4	c58397cf-8e8d-4f46-b2c7-f49a406dd7ea	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-19T00:47:20.212Z
9a99113e-b245-4f6f-822f-97380703652b	c58397cf-8e8d-4f46-b2c7-f49a406dd7ea	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-19T00:48:40.439Z
09a88237-09e8-4b13-b19d-255f6bb5339d	c58397cf-8e8d-4f46-b2c7-f49a406dd7ea	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-19T00:49:22.311Z
f775a3e7-f728-48d2-a6f2-d0790c8ba94b	c58397cf-8e8d-4f46-b2c7-f49a406dd7ea	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-19T00:50:34.929Z
c3bb81ce-f1a2-4cee-81f7-2cc1530bf2e3	a4e2de8b-347a-46ec-993c-cf7ec269087b	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-29T04:35:59.664Z
195e9024-434d-4d96-a374-448ed679be26	a4e2de8b-347a-46ec-993c-cf7ec269087b	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-29T04:36:41.398Z
b527ecd3-f4c3-49fd-8c67-f53d17a3382f	a4e2de8b-347a-46ec-993c-cf7ec269087b	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-29T04:38:07.369Z
1bd5539c-1f5a-4911-a6d1-78cff6b28648	a4e2de8b-347a-46ec-993c-cf7ec269087b	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-29T04:38:52.590Z
f19ce89e-5806-446e-b6ae-8e6fc10693db	a4e2de8b-347a-46ec-993c-cf7ec269087b	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-29T04:39:44.971Z
07a14e68-4790-4c70-98dd-d8b278d51e81	a4e2de8b-347a-46ec-993c-cf7ec269087b	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-29T04:40:49.175Z
60049b96-acba-402c-b1fc-2e840d2fc8c7	a4e2de8b-347a-46ec-993c-cf7ec269087b	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-29T04:41:47.641Z
da8d62ea-526b-4b31-ab9a-a1b7c460d049	a4e2de8b-347a-46ec-993c-cf7ec269087b	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-29T04:42:57.197Z
964c4192-d90f-427f-946e-e4719ac140c1	a4e2de8b-347a-46ec-993c-cf7ec269087b	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-29T04:44:01.389Z
3634b69a-3099-486c-baa1-95e530d89656	4b18a730-e932-455d-a8d7-004303d61beb	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-04-02T13:23:16.137Z
21301d8c-b5ef-4f7a-9e50-4bd592452d99	4b18a730-e932-455d-a8d7-004303d61beb	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-04-02T13:24:02.860Z
26e336ea-96ed-4d86-b2e2-985c9bf158c0	4b18a730-e932-455d-a8d7-004303d61beb	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-04-02T13:25:13.553Z
b392f313-10f1-442a-9d58-d6805d64175f	4b18a730-e932-455d-a8d7-004303d61beb	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-04-02T13:26:17.208Z
703fba8a-d74c-474f-9761-f085b75f98b0	4b18a730-e932-455d-a8d7-004303d61beb	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-04-02T13:26:59.892Z
0e34c5d6-4e76-49fc-9825-a77346278cc1	4b18a730-e932-455d-a8d7-004303d61beb	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-04-02T13:28:13.893Z
a7d6aef4-91db-4198-8993-f1197dce6910	f773dc9f-db41-42ca-820d-92d3d70ec193	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-23T12:59:16.479Z
cc8384a9-a0ac-45d8-9e03-fe2305adf0b7	f773dc9f-db41-42ca-820d-92d3d70ec193	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-23T13:00:28.799Z
6db116c4-8f93-4bbe-abee-c0a7a4d23e57	f773dc9f-db41-42ca-820d-92d3d70ec193	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-23T13:01:22.165Z
79850a7e-cba2-4b93-b31b-75e53b2a6aea	f773dc9f-db41-42ca-820d-92d3d70ec193	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-23T13:02:17.006Z
3569c605-ae86-4307-b936-8139eb6151b8	f773dc9f-db41-42ca-820d-92d3d70ec193	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-23T13:03:20.537Z
ff535042-faa2-4eee-9a84-4868502088c4	f773dc9f-db41-42ca-820d-92d3d70ec193	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-23T13:04:21.919Z
305de9a9-8477-41b6-b4d3-418d56e1c380	dcd1a20b-d90f-48eb-ba94-2db3210f4170	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-20T02:11:41.466Z
383a5ec9-fd17-4ee7-bd02-ebfd0d8700de	dcd1a20b-d90f-48eb-ba94-2db3210f4170	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-20T02:12:46.130Z
9987d6c9-e6d4-4bfe-a324-d38e34075ad3	dcd1a20b-d90f-48eb-ba94-2db3210f4170	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-20T02:13:43.232Z
b9e3432d-0f20-4e10-9f7f-2e01355dae1e	dcd1a20b-d90f-48eb-ba94-2db3210f4170	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-20T02:14:37.799Z
6a70b2e8-0d33-4b48-b187-888c111e13cc	b168e865-1774-4151-8df9-0a39e0e8afc3	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-26T19:41:02.190Z
4152193d-e482-4588-ba99-af52cf1bb23f	b168e865-1774-4151-8df9-0a39e0e8afc3	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-26T19:41:59.590Z
3e992c55-e671-43b2-95d6-6da3cd333571	b168e865-1774-4151-8df9-0a39e0e8afc3	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-26T19:42:50.618Z
a5d78838-4dab-4701-a897-be3c2826f2f2	b168e865-1774-4151-8df9-0a39e0e8afc3	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-26T19:44:10.005Z
36a2d51d-fe2d-4a6f-ada0-580a080b30b4	9303921c-f989-4752-a383-42e7e5acb424	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-30T07:49:12.016Z
fb9124ad-5f6e-42a4-8e14-de1c58d0f6d4	9303921c-f989-4752-a383-42e7e5acb424	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-30T07:50:14.293Z
7d59704f-55ac-4ffa-b73c-c0d1b7c8f86c	9303921c-f989-4752-a383-42e7e5acb424	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-30T07:51:06.376Z
d921d867-532f-420a-9e9a-a3ad31d148f9	9303921c-f989-4752-a383-42e7e5acb424	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-30T07:51:54.906Z
5d6518f4-e186-4e2b-b80a-fb4020f1dc4f	9303921c-f989-4752-a383-42e7e5acb424	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-30T07:53:00.784Z
3e065acc-a45d-4962-b936-7fad79d7c628	9303921c-f989-4752-a383-42e7e5acb424	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-30T07:54:00.180Z
cf78379a-2929-4596-980b-810a8f155106	4ccd48d5-3579-4ee3-bcc8-68a668039ec2	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-23T11:33:34.084Z
b1cf5f45-0417-485c-a551-e494c70c9679	4ccd48d5-3579-4ee3-bcc8-68a668039ec2	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-23T11:34:18.957Z
afd59ab3-9c02-4498-a990-ee6044e22571	4ccd48d5-3579-4ee3-bcc8-68a668039ec2	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-23T11:35:23.810Z
d7414bf3-68a3-4ebd-a44b-4c3a8e8f06e7	4ccd48d5-3579-4ee3-bcc8-68a668039ec2	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-23T11:36:12.078Z
f54fe555-17cc-4c99-8a46-aef674dc242f	4ccd48d5-3579-4ee3-bcc8-68a668039ec2	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-23T11:37:10.235Z
44b4893a-b7e0-44c8-b0d4-36dfdbcff491	4ccd48d5-3579-4ee3-bcc8-68a668039ec2	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-23T11:38:24.036Z
a5afc567-38ad-41c3-aafe-500034550ba2	50b86a5d-a33d-43ea-9ed0-319561f19084	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-21T16:57:26.590Z
855c995f-7142-4b84-9b0f-c8ae690d34db	50b86a5d-a33d-43ea-9ed0-319561f19084	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-21T16:58:24.709Z
6113b9f3-4e6d-45b6-b8ba-3d9a2f4adb66	50b86a5d-a33d-43ea-9ed0-319561f19084	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-21T16:59:16.908Z
9cfe7157-b842-4003-9285-9e3be73a8aee	50b86a5d-a33d-43ea-9ed0-319561f19084	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-21T17:00:19.765Z
f736ecda-c2f9-4ceb-bc6b-edb8cf674b64	31308a5f-110e-499e-bb60-bee5000e4eb0	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-17T22:42:37.671Z
f8085f87-b24e-49a4-9000-e9a75df95f2d	31308a5f-110e-499e-bb60-bee5000e4eb0	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-17T22:43:54.187Z
a55725fb-1466-4448-b03e-859925b7080a	31308a5f-110e-499e-bb60-bee5000e4eb0	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-17T22:45:03.363Z
a3fed306-513c-4b77-81c1-6ef775dcb247	31308a5f-110e-499e-bb60-bee5000e4eb0	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-17T22:45:46.445Z
14bf35c2-3930-4e57-93ca-b72bb722d918	31308a5f-110e-499e-bb60-bee5000e4eb0	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-17T22:46:41.234Z
4c90cd35-f207-41ee-901e-1efc63490c85	31308a5f-110e-499e-bb60-bee5000e4eb0	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-17T22:47:40.435Z
c4f2016d-135c-4f4b-815f-2a4adc5e6b40	67cc111a-a998-4d87-ac46-1fef4fbccdc8	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-15T02:46:43.619Z
2d1ec7e9-6790-4b37-b489-28ad83186b58	67cc111a-a998-4d87-ac46-1fef4fbccdc8	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-15T02:47:50.649Z
2ed9b9c7-edc7-4e83-8232-aee44e44ac33	67cc111a-a998-4d87-ac46-1fef4fbccdc8	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-15T02:48:40.426Z
6c99577f-9c9b-4cb3-a66d-1a041c73f670	67cc111a-a998-4d87-ac46-1fef4fbccdc8	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-15T02:49:35.420Z
2e2012a6-b909-4e60-ab32-903bf5c201e3	67cc111a-a998-4d87-ac46-1fef4fbccdc8	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-15T02:50:50.866Z
35b780c5-6863-4c63-8293-634bafb1b2cf	67cc111a-a998-4d87-ac46-1fef4fbccdc8	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-15T02:51:54.777Z
7654b666-3b5a-4fbd-8663-9a09dd6a9483	67cc111a-a998-4d87-ac46-1fef4fbccdc8	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-15T02:52:39.421Z
69806544-da23-4edd-8d75-fff3b58b9f7a	67cc111a-a998-4d87-ac46-1fef4fbccdc8	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-15T02:53:51.695Z
27176a94-6ec8-4822-bd32-986b71033f85	92fd429a-8295-414a-8329-656c3c8f956e	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-14T21:57:41.017Z
04603e3b-d83c-46ea-9899-bccb70374014	92fd429a-8295-414a-8329-656c3c8f956e	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-14T21:58:38.378Z
7752a5fe-2111-41bc-933d-4cb940f201a9	92fd429a-8295-414a-8329-656c3c8f956e	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-14T21:59:53.258Z
2fd162d2-083c-4436-b8c5-d5725799c58b	92fd429a-8295-414a-8329-656c3c8f956e	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-14T22:00:30.515Z
b70cda51-b95a-4f4e-b744-99bb1e690703	92fd429a-8295-414a-8329-656c3c8f956e	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-14T22:01:50.134Z
60bb9def-aa07-4b53-a353-b083de81caf1	92fd429a-8295-414a-8329-656c3c8f956e	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-14T22:02:33.858Z
13b697ec-b3fa-4542-a414-02ca3200c620	92fd429a-8295-414a-8329-656c3c8f956e	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-14T22:03:35.463Z
4712cc80-cb53-497e-96f3-2a4908f5ae95	92fd429a-8295-414a-8329-656c3c8f956e	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-14T22:04:27.901Z
334cf0a6-8696-4903-9d72-c52ada2f04d8	92fd429a-8295-414a-8329-656c3c8f956e	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-14T22:05:29.127Z
bd27cb05-be91-4a23-afaf-ac6839fa956d	72cc3b70-93fc-40fc-a2d0-57fc8e392bc7	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-14T06:17:07.589Z
2f00a469-c587-46cb-849c-8541bc8fd0bb	72cc3b70-93fc-40fc-a2d0-57fc8e392bc7	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-14T06:18:05.511Z
b7f137da-088e-4660-b2b4-2213d5c409b4	72cc3b70-93fc-40fc-a2d0-57fc8e392bc7	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-14T06:19:16.971Z
103cda95-4c0f-4c14-ad05-a96e1622a1d8	72cc3b70-93fc-40fc-a2d0-57fc8e392bc7	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-14T06:20:18.543Z
1eb601c0-0017-4b87-80f7-defe3cb71059	72cc3b70-93fc-40fc-a2d0-57fc8e392bc7	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-14T06:21:15.331Z
3d842890-6b82-4dfa-870c-7302ec3a3d4e	72cc3b70-93fc-40fc-a2d0-57fc8e392bc7	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-14T06:22:11.025Z
2a9f61bf-110c-456e-8436-025f8fc1a26d	72cc3b70-93fc-40fc-a2d0-57fc8e392bc7	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-14T06:23:13.022Z
590dec9d-6ee8-4fdc-ae1e-dc0df6cc8429	72cc3b70-93fc-40fc-a2d0-57fc8e392bc7	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-14T06:24:15.921Z
45d51807-fdda-497f-8ebe-a7578f1012c5	72cc3b70-93fc-40fc-a2d0-57fc8e392bc7	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-14T06:24:58.963Z
87dccd97-d027-4f8a-8db6-a7b89754f342	5ef5f366-ee53-4aec-8b2b-a9dfffe61926	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-19T21:39:40.363Z
e536ef3a-ab68-4802-a355-dee3bdadb8d8	5ef5f366-ee53-4aec-8b2b-a9dfffe61926	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-19T21:40:42.992Z
2e08bc19-0919-4956-a5f1-46590b335c2c	5ef5f366-ee53-4aec-8b2b-a9dfffe61926	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-19T21:41:29.863Z
a0c90372-d4cc-4eb7-865a-392b70b6a3a4	5ef5f366-ee53-4aec-8b2b-a9dfffe61926	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-19T21:42:21.015Z
d6368d50-1abc-48df-8bc8-87c5de1c1bd6	6bdc200c-dc56-429b-9d38-3bcf1a98be97	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-04-02T19:57:28.859Z
d031462a-0bef-4cba-b868-e97f5c299c3a	6bdc200c-dc56-429b-9d38-3bcf1a98be97	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-04-02T19:58:49.262Z
512e4787-f841-47b6-b33d-9d97f16fba99	6bdc200c-dc56-429b-9d38-3bcf1a98be97	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-04-02T19:59:34.020Z
e54037ee-76f5-4a5f-8339-fcc7c83c8ff9	6bdc200c-dc56-429b-9d38-3bcf1a98be97	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-04-02T20:00:25.361Z
7364da74-030c-41a2-b710-4f7203244184	6bdc200c-dc56-429b-9d38-3bcf1a98be97	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-04-02T20:01:38.022Z
9ef94a2d-bd11-45da-8539-9c3473a96aa5	6bdc200c-dc56-429b-9d38-3bcf1a98be97	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-04-02T20:02:52.354Z
dee5249b-40b8-490c-bcc9-8c5f77d9c498	6bdc200c-dc56-429b-9d38-3bcf1a98be97	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-04-02T20:03:43.550Z
2840b318-6c03-4d44-ae04-b587f42fd9d0	6bdc200c-dc56-429b-9d38-3bcf1a98be97	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-04-02T20:04:25.968Z
0e1e4d4e-e65e-4397-942d-165c16872ed1	d1d9cb59-383d-4dab-beb9-6fcac624adca	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-04-01T00:38:45.091Z
6dc68031-025b-4992-880a-b1fe9474a56a	d1d9cb59-383d-4dab-beb9-6fcac624adca	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-04-01T00:39:57.289Z
da6b8850-a2f8-41d5-860c-ae47ab0f1723	d1d9cb59-383d-4dab-beb9-6fcac624adca	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-04-01T00:41:06.842Z
62262dc4-46d8-499e-8bda-98685ef801cf	d1d9cb59-383d-4dab-beb9-6fcac624adca	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-04-01T00:42:04.996Z
7a316cef-62cb-4854-a9cb-4c96ef23b502	d1d9cb59-383d-4dab-beb9-6fcac624adca	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-04-01T00:43:11.820Z
bd2d7b38-1e0d-4f5b-8c2c-3bb66200f99f	d1d9cb59-383d-4dab-beb9-6fcac624adca	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-04-01T00:43:54.148Z
feacc143-0bbc-4e27-b611-b0060a11d238	d1d9cb59-383d-4dab-beb9-6fcac624adca	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-04-01T00:44:44.520Z
ca326440-76d9-4f24-9428-a05d9b7855c4	d1d9cb59-383d-4dab-beb9-6fcac624adca	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-04-01T00:45:49.378Z
7c1fb508-3556-4169-8e7b-18b9529cf70f	df374ad4-44db-46fb-9ade-202adaeed2c8	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-22T18:12:42.574Z
6e8a2aea-5f37-4091-9354-3e5217d1625b	df374ad4-44db-46fb-9ade-202adaeed2c8	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-22T18:13:34.614Z
3990e668-405e-4c14-80bd-932f267b5b54	df374ad4-44db-46fb-9ade-202adaeed2c8	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-22T18:14:22.099Z
0f1d12ed-2253-4fa9-8d39-d204cbcefe83	df374ad4-44db-46fb-9ade-202adaeed2c8	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-22T18:15:33.192Z
f8e90157-064b-4df2-8d23-4337102d3ecf	df374ad4-44db-46fb-9ade-202adaeed2c8	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-22T18:16:42.984Z
b210ff08-e876-41eb-9cf3-9d0e3bcaa715	df374ad4-44db-46fb-9ade-202adaeed2c8	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-22T18:17:34.498Z
c66afd95-066b-427d-9205-15adc521c9c8	fae22fe0-fa9b-4124-b1a9-7bc169b844d7	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-24T02:52:05.769Z
245fad6f-67e2-42c9-8768-5d65e8ae5e3c	fae22fe0-fa9b-4124-b1a9-7bc169b844d7	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-24T02:53:07.618Z
58bb1e77-36c8-4a33-8f5d-6e71e4deb6c2	fae22fe0-fa9b-4124-b1a9-7bc169b844d7	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-24T02:53:53.522Z
e787b877-04c9-4f89-b81a-1fd843c995ab	fae22fe0-fa9b-4124-b1a9-7bc169b844d7	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-24T02:54:53.199Z
403cc21d-c387-4503-8a70-e729d2b03ab1	fae22fe0-fa9b-4124-b1a9-7bc169b844d7	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-24T02:55:56.806Z
32712fe1-dc3a-4b4f-840f-ac911edec0af	fae22fe0-fa9b-4124-b1a9-7bc169b844d7	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-24T02:57:08.794Z
d5cef083-7619-4360-a409-86813affaf47	a5ac1744-7fcd-4c00-b8bb-88b08d6ea057	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-31T23:12:34.040Z
0d9c79b7-6f97-4ca0-8909-12195d635489	a5ac1744-7fcd-4c00-b8bb-88b08d6ea057	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-31T23:13:22.222Z
0b3a109e-faa0-4915-8bd7-06891033037e	a5ac1744-7fcd-4c00-b8bb-88b08d6ea057	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-31T23:14:14.816Z
cdf69c78-abbf-49f1-a93e-bac3f5c77266	a5ac1744-7fcd-4c00-b8bb-88b08d6ea057	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-31T23:15:05.744Z
643eec86-7bf4-4768-ac50-360ef595cee3	a5ac1744-7fcd-4c00-b8bb-88b08d6ea057	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-31T23:16:34.354Z
60c469d7-3a28-47fb-a03c-8dc187296e51	a5ac1744-7fcd-4c00-b8bb-88b08d6ea057	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-31T23:17:06.091Z
692f5920-6282-43d7-b74d-dfc0a15fad45	a95b396e-10bf-4195-a543-576922d8473e	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-15T22:00:00.596Z
4e297113-37fd-4555-a430-f27fc4106354	a95b396e-10bf-4195-a543-576922d8473e	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-15T22:01:07.023Z
588d3fee-9d0b-4961-b7a6-02a19887aa1e	a95b396e-10bf-4195-a543-576922d8473e	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-15T22:02:06.003Z
bdf1e9b8-dfaf-4f2e-bd3b-b2e2807e5a23	a95b396e-10bf-4195-a543-576922d8473e	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-15T22:03:00.884Z
c42a456a-562f-4ac2-b97e-a6c4a085a487	a95b396e-10bf-4195-a543-576922d8473e	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-15T22:04:01.558Z
66391ab5-6277-497d-847f-22c855079490	a95b396e-10bf-4195-a543-576922d8473e	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-15T22:04:43.489Z
aa11bdec-b4e6-4ea7-8efa-984fe095f9e1	08a3d13d-92fe-46d6-83b3-150d60c49a99	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-30T01:54:47.623Z
0269f63f-626e-4049-8f1f-7f75f4aa0536	08a3d13d-92fe-46d6-83b3-150d60c49a99	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-30T01:55:27.800Z
91a16c57-68f1-4347-81c4-ca81e2df7d7d	08a3d13d-92fe-46d6-83b3-150d60c49a99	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-30T01:56:33.397Z
3d27c281-2c15-4bf0-9835-4f4f2b9fb5f8	08a3d13d-92fe-46d6-83b3-150d60c49a99	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-30T01:57:22.999Z
7be7e4ba-db3b-4d7f-b0ec-ca21fbdd8c32	08a3d13d-92fe-46d6-83b3-150d60c49a99	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-30T01:58:21.248Z
b060e3a4-b891-4ec7-b727-c1cbca200a1e	08a3d13d-92fe-46d6-83b3-150d60c49a99	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-30T01:59:48.210Z
dffd3c84-805b-4775-8b50-5c55866fbe67	08a3d13d-92fe-46d6-83b3-150d60c49a99	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-30T02:00:38.380Z
eca390fb-13bd-45b7-b4a6-bd882a81c0a0	08a3d13d-92fe-46d6-83b3-150d60c49a99	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-30T02:01:46.252Z
ce317cb3-0774-4ef4-b2cc-6590de9d73eb	08a3d13d-92fe-46d6-83b3-150d60c49a99	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-30T02:02:25.680Z
75fa06cf-9030-49e1-b7b5-e188d7962527	3623602e-7741-45ff-8581-34cbf8e0f067	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-20T02:39:03.159Z
6fb25ca7-a85a-4037-a46d-5d21c64bbc82	3623602e-7741-45ff-8581-34cbf8e0f067	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-20T02:40:20.708Z
c3a74de4-230e-421d-b132-05899faae6bf	3623602e-7741-45ff-8581-34cbf8e0f067	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-20T02:41:11.036Z
d6871766-ef90-4df0-bc59-0bf6110426c6	3623602e-7741-45ff-8581-34cbf8e0f067	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-20T02:42:04.404Z
e34be2e8-2146-46dc-9075-fe6ecee00948	3623602e-7741-45ff-8581-34cbf8e0f067	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-20T02:43:20.203Z
d59f638a-020a-45ac-8d02-544f31a4937b	3623602e-7741-45ff-8581-34cbf8e0f067	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-20T02:44:12.096Z
78967acb-1065-4650-9ef1-7b3c0e008d94	925aaf7b-150e-4ea8-a900-0c38e1e58955	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-21T20:19:18.549Z
f1c64b82-34b1-4e16-85d0-fd000449f4af	925aaf7b-150e-4ea8-a900-0c38e1e58955	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-21T20:20:26.757Z
d25db873-328e-4b67-8ae8-0d094bc176d0	925aaf7b-150e-4ea8-a900-0c38e1e58955	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-21T20:21:10.991Z
835ab5fa-e0b3-4ee3-ab89-edb589f364f3	925aaf7b-150e-4ea8-a900-0c38e1e58955	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-21T20:22:00.487Z
7b3a97e8-0c9d-4d7f-a472-85e232f501c7	925aaf7b-150e-4ea8-a900-0c38e1e58955	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-21T20:23:01.174Z
743573de-dddd-432e-bf99-13dde5459f22	925aaf7b-150e-4ea8-a900-0c38e1e58955	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-21T20:24:11.588Z
6e214952-2adb-4c09-8e9e-0943f4a1dad7	925aaf7b-150e-4ea8-a900-0c38e1e58955	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-21T20:25:00.387Z
1632a3f0-57c3-4131-9d0f-6b0ce18c977e	925aaf7b-150e-4ea8-a900-0c38e1e58955	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-21T20:26:19.454Z
35672892-c4a0-4ff9-aef7-182264bc62bb	d18b219c-2448-406c-9c24-957ce9ab9e80	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-28T15:25:38.785Z
a793ead3-c11f-44b9-ab60-56fa736bf233	d18b219c-2448-406c-9c24-957ce9ab9e80	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-28T15:26:46.968Z
992c262b-5366-44d0-9085-43d2e5c0fdcd	d18b219c-2448-406c-9c24-957ce9ab9e80	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-28T15:27:54.908Z
4aeeb5ef-5041-4b71-ae79-fb9cf696a48b	d18b219c-2448-406c-9c24-957ce9ab9e80	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-28T15:29:00.772Z
5a89b4bf-8363-4c07-a1a4-7d26b8a0867b	3c234fcd-b64c-4d00-83a2-a76dbb52a612	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-30T03:10:05.945Z
5cd6cbe0-66f7-4f03-a97a-b913f422112d	3c234fcd-b64c-4d00-83a2-a76dbb52a612	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-30T03:10:39.546Z
377422cc-3aa7-4fba-87ee-913824f3e626	3c234fcd-b64c-4d00-83a2-a76dbb52a612	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-30T03:11:44.564Z
729c6e89-6d6f-4cb0-902f-76bef5359823	3c234fcd-b64c-4d00-83a2-a76dbb52a612	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-30T03:12:48.176Z
c8683e78-220a-4984-bf70-8ccbc419192e	3c234fcd-b64c-4d00-83a2-a76dbb52a612	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-30T03:13:51.390Z
b302d868-78dc-42ca-8b07-ea7967a7883d	3c234fcd-b64c-4d00-83a2-a76dbb52a612	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-30T03:14:59.061Z
42567ed6-e69d-4963-966a-ae5c3dda3bb7	b23b3443-c5b9-4b46-95de-adcd74f83c44	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-24T10:10:55.357Z
4ff97f13-9422-4c3c-a2d5-c0a1e21e96e6	b23b3443-c5b9-4b46-95de-adcd74f83c44	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-24T10:12:05.552Z
19686ccc-5cd6-409c-85b0-61d357587021	b23b3443-c5b9-4b46-95de-adcd74f83c44	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-24T10:13:11.590Z
711d3267-80f8-484b-a31b-d2bcd0e660a5	b23b3443-c5b9-4b46-95de-adcd74f83c44	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-24T10:14:11.779Z
71f49b87-a164-4445-bce7-98ef799bf3b7	b23b3443-c5b9-4b46-95de-adcd74f83c44	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-24T10:14:57.913Z
d4dbfdac-2b3b-4198-a697-adc6b3083f7b	b23b3443-c5b9-4b46-95de-adcd74f83c44	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-24T10:15:57.955Z
8efe0f14-2165-434f-b318-a261cc501771	b23b3443-c5b9-4b46-95de-adcd74f83c44	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-24T10:17:17.944Z
81019c2f-e484-4a87-96e2-3c6ea33b5fbc	b23b3443-c5b9-4b46-95de-adcd74f83c44	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-24T10:18:05.311Z
b8abf748-9c90-4907-9dfe-5b7b893e6b84	08114740-fe86-4783-a608-40ef53a36055	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-30T05:20:09.444Z
0499c43e-addf-44f0-80c9-e926a06b401c	08114740-fe86-4783-a608-40ef53a36055	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-30T05:21:14.270Z
9d5365e1-87f1-4c63-88ab-99602bf23a41	08114740-fe86-4783-a608-40ef53a36055	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-30T05:22:15.304Z
1179529b-7fc4-4a23-a143-d75842e9eee4	08114740-fe86-4783-a608-40ef53a36055	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-30T05:23:13.175Z
96e93f89-bc00-478c-bfcd-d7dc81240b4e	08114740-fe86-4783-a608-40ef53a36055	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-30T05:24:13.356Z
dda7e669-b0a7-4fd3-ab48-12cdc83fee1b	08114740-fe86-4783-a608-40ef53a36055	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-30T05:25:24.114Z
29dd7d4e-afa9-4f4a-a9d5-a7eebbcc785d	125f5d30-959f-455e-9d6f-7e96367358e3	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-27T19:32:55.774Z
70b14b52-f0c6-49a7-8e4a-7ce96f3e1b12	125f5d30-959f-455e-9d6f-7e96367358e3	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-27T19:33:49.182Z
c2a7fcb2-55f9-4410-b8cb-22e888915bbb	125f5d30-959f-455e-9d6f-7e96367358e3	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-27T19:35:10.655Z
1e840722-79cb-4d3f-803c-a171c156b1e4	125f5d30-959f-455e-9d6f-7e96367358e3	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-27T19:36:04.373Z
50d1f0b4-e0d4-43fa-894d-ed4be98493ba	125f5d30-959f-455e-9d6f-7e96367358e3	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-27T19:37:07.696Z
02a0ebd6-925d-428c-bcdb-b2c1c716c61e	125f5d30-959f-455e-9d6f-7e96367358e3	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-27T19:37:52.180Z
3d3e71b2-f3e9-4172-a916-cf85b57d1c4f	05248ddf-76f6-45c8-9b8d-11243b6ab6fd	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-18T22:55:02.051Z
3f519053-e54c-40c3-9529-8d78b6093de0	05248ddf-76f6-45c8-9b8d-11243b6ab6fd	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-18T22:56:06.611Z
aeb37656-2f31-471d-9e66-b8499c50f1aa	05248ddf-76f6-45c8-9b8d-11243b6ab6fd	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-18T22:56:48.983Z
2acd0a8a-771f-4449-b0a0-e94b3fe1c558	05248ddf-76f6-45c8-9b8d-11243b6ab6fd	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-18T22:57:47.512Z
f600c8be-5345-435e-90d6-358b5ba36b3f	05248ddf-76f6-45c8-9b8d-11243b6ab6fd	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-18T22:58:40.047Z
4578a2ac-80e7-4449-aec7-f6f9740536ee	05248ddf-76f6-45c8-9b8d-11243b6ab6fd	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-18T22:59:43.575Z
a0e3bf43-4951-46c3-933b-d482427dc803	05d721f8-03b7-4af6-af08-91beaca5691c	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-23T13:51:02.387Z
1c3b3f05-c36f-4f69-b4c6-954dbba42ad8	05d721f8-03b7-4af6-af08-91beaca5691c	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-23T13:52:04.025Z
bf1c3bc4-cad7-436d-88bd-e079442b1c51	05d721f8-03b7-4af6-af08-91beaca5691c	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-23T13:53:04.392Z
96fd5f09-660d-4bf1-8128-bb7207dda992	05d721f8-03b7-4af6-af08-91beaca5691c	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-23T13:54:10.021Z
63f360ad-522f-4b4b-8305-5e568eee0f28	05d721f8-03b7-4af6-af08-91beaca5691c	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-23T13:54:57.973Z
163398f5-be3d-4c58-a004-431c269549c9	05d721f8-03b7-4af6-af08-91beaca5691c	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-23T13:56:07.238Z
99c44af3-a6de-4f0d-ba28-764127974750	05d721f8-03b7-4af6-af08-91beaca5691c	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-23T13:56:59.286Z
2c552f56-8ff7-4af4-b4e2-6847136761bd	05d721f8-03b7-4af6-af08-91beaca5691c	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-23T13:58:10.869Z
7ab66003-0971-4751-9fe1-97b14329ea9e	05d721f8-03b7-4af6-af08-91beaca5691c	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-23T13:58:56.258Z
c8b94200-fff1-4175-9863-94050bd513fa	2507569e-f737-4aa3-a220-cd8a1bd9f335	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-24T07:42:19.484Z
489316c4-7de1-4e94-ba8c-f0f681edc497	2507569e-f737-4aa3-a220-cd8a1bd9f335	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-24T07:43:20.930Z
32714932-e8bf-4b52-bcab-c26244108771	2507569e-f737-4aa3-a220-cd8a1bd9f335	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-24T07:44:20.333Z
f667172b-0b3c-4198-8606-61bbe3d131e7	2507569e-f737-4aa3-a220-cd8a1bd9f335	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-24T07:45:35.215Z
f1492947-1cb2-4f26-8ae5-f83cebb661da	2507569e-f737-4aa3-a220-cd8a1bd9f335	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-24T07:46:37.226Z
c73850f8-9c83-4bd4-863b-a89e3eaf4b37	2507569e-f737-4aa3-a220-cd8a1bd9f335	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-24T07:47:36.408Z
2173fe1f-871a-4afd-a55e-d4d47b23bf86	2507569e-f737-4aa3-a220-cd8a1bd9f335	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-24T07:48:25.085Z
32346d05-32ac-46bb-9ab7-71d63a7dc03d	2507569e-f737-4aa3-a220-cd8a1bd9f335	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-24T07:49:17.734Z
e8072cda-af4d-4190-8f37-aace77b07e44	2507569e-f737-4aa3-a220-cd8a1bd9f335	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-24T07:50:28.607Z
77dd225b-ee53-4762-b2c6-1a87fb924f68	d4703d7e-108e-4db9-b871-7e28dba9787d	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-29T17:44:48.621Z
561149d3-498e-4073-b1c1-2403391a699c	d4703d7e-108e-4db9-b871-7e28dba9787d	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-29T17:45:48.699Z
9e4e2e32-0b90-4eb9-9a2d-9beb2c79e89b	d4703d7e-108e-4db9-b871-7e28dba9787d	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-29T17:46:58.718Z
02da277a-f05e-45de-b259-6cba47f2ea72	d4703d7e-108e-4db9-b871-7e28dba9787d	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-29T17:47:55.409Z
69c6d78c-9efb-4615-8355-3e866022b61b	30a59498-e093-4270-a752-ca53c76f5070	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-30T11:36:15.373Z
2113c804-24d0-4a31-97b5-ab249b695345	30a59498-e093-4270-a752-ca53c76f5070	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-30T11:37:12.002Z
fec6a42c-df0d-4567-9fb9-b635e19cf7a9	30a59498-e093-4270-a752-ca53c76f5070	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-30T11:38:37.201Z
f4ce56dd-a88c-4402-aa60-4ff22e8ad748	30a59498-e093-4270-a752-ca53c76f5070	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-30T11:39:13.659Z
6036f2f9-8bfd-4ed9-b7f0-d4220edbdb78	30a59498-e093-4270-a752-ca53c76f5070	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-30T11:40:33.390Z
3db8a4ce-93ea-4999-a802-4e7227945cf5	30a59498-e093-4270-a752-ca53c76f5070	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-30T11:41:19.457Z
e7ebc23d-9502-4e94-8d46-1154e122e637	dc9fed84-e8d2-49bf-b17c-61ef5a13d9df	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-21T00:34:03.259Z
de083eb0-db8b-4a38-9946-8ae626338665	dc9fed84-e8d2-49bf-b17c-61ef5a13d9df	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-21T00:34:48.976Z
7d223a5a-21d8-4742-b6ab-eb73d2d74eb0	dc9fed84-e8d2-49bf-b17c-61ef5a13d9df	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-21T00:35:56.649Z
bd5ec765-e1c8-4e0e-8a98-3139beff5b7f	dc9fed84-e8d2-49bf-b17c-61ef5a13d9df	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-21T00:36:49.085Z
16bde361-8e82-4356-95d6-77fb7423c484	dc9fed84-e8d2-49bf-b17c-61ef5a13d9df	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-21T00:38:03.724Z
c0cbd053-acde-4b49-aaf5-c0ac7cf9f167	dc9fed84-e8d2-49bf-b17c-61ef5a13d9df	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-21T00:39:01.414Z
91fb9cd5-c9bf-4e9b-a987-aeff50b7116f	cf77dc1e-1740-4168-96a9-5d32d1dec59d	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-29T21:31:12.394Z
4f503ebb-b873-47fd-94c4-42edb67ab668	cf77dc1e-1740-4168-96a9-5d32d1dec59d	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-29T21:32:33.238Z
7d514e6d-2309-449a-8343-08a7bfbc05b0	cf77dc1e-1740-4168-96a9-5d32d1dec59d	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-29T21:33:24.714Z
d47251a1-21b2-4e0f-9514-4d3de6011164	cf77dc1e-1740-4168-96a9-5d32d1dec59d	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-29T21:34:33.043Z
d8d245b5-e73b-485e-b650-5d244cf57ed2	cf77dc1e-1740-4168-96a9-5d32d1dec59d	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-29T21:35:20.877Z
4d018b31-3728-4e1a-9f29-ee26f3f5e746	cf77dc1e-1740-4168-96a9-5d32d1dec59d	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-29T21:36:20.483Z
e5b37c13-cd88-430b-81a4-d5b2173ae2ca	cf77dc1e-1740-4168-96a9-5d32d1dec59d	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-29T21:37:15.639Z
a512e73e-379c-4e91-acfa-c7094d6e5cb4	cf77dc1e-1740-4168-96a9-5d32d1dec59d	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-29T21:38:29.915Z
d6369f40-6b51-43dc-9d84-a8d14901891a	86faac26-c538-43d8-b377-e2ad0db5466d	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-19T19:59:17.989Z
4d5b27d6-f4cc-4efc-93dd-b8002379ef17	86faac26-c538-43d8-b377-e2ad0db5466d	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-19T20:00:36.427Z
309e4a3e-2f48-4994-8c91-e7514434cdcb	86faac26-c538-43d8-b377-e2ad0db5466d	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-19T20:01:11.987Z
419ed234-717f-4787-ba57-ad670902e38a	86faac26-c538-43d8-b377-e2ad0db5466d	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-19T20:02:20.776Z
f46797c2-c6fb-481f-8d2b-cab0d6ca7826	86faac26-c538-43d8-b377-e2ad0db5466d	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-19T20:03:27.649Z
fd5093dd-488b-4be3-ab2b-7a54b1e00218	86faac26-c538-43d8-b377-e2ad0db5466d	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-19T20:04:13.559Z
e6a493b2-c576-4742-87a2-6250fc06dcd3	86faac26-c538-43d8-b377-e2ad0db5466d	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-19T20:05:29.645Z
faf8ba8b-3d66-4583-9627-91d08f08b896	86faac26-c538-43d8-b377-e2ad0db5466d	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-19T20:06:30.260Z
0ecfe966-c36b-4142-8c8f-888beebcf52e	86faac26-c538-43d8-b377-e2ad0db5466d	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-19T20:07:14.058Z
f04fb9af-7e65-48a6-a936-435f1a204b3e	52bf0381-b86b-4eba-b670-8e093ee4b16d	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-19T09:27:23.438Z
4dcdc241-6032-4b19-9378-0069181af4e7	52bf0381-b86b-4eba-b670-8e093ee4b16d	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-19T09:28:33.403Z
3fa4c273-ebaa-4150-818c-157376283083	52bf0381-b86b-4eba-b670-8e093ee4b16d	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-19T09:29:11.256Z
6eb7c4db-d953-4d44-94a4-34986b05bfc8	52bf0381-b86b-4eba-b670-8e093ee4b16d	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-19T09:30:19.968Z
c5699f62-c7ac-48be-bed0-3ec4d8f28571	52bf0381-b86b-4eba-b670-8e093ee4b16d	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-19T09:31:10.968Z
bc0ff6cb-306e-4200-a0d9-ba937fceed61	52bf0381-b86b-4eba-b670-8e093ee4b16d	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-19T09:32:15.874Z
e9bd425f-d170-4034-90ef-cd08890a18ac	9b843254-9be3-44a6-a1c1-6ff57e46d9f3	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-14T19:02:34.485Z
9003891b-12a7-4b9f-ba96-c3cd1a97cf63	9b843254-9be3-44a6-a1c1-6ff57e46d9f3	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-14T19:03:40.953Z
05ac2720-c984-41d1-bea1-92984d3b7a10	9b843254-9be3-44a6-a1c1-6ff57e46d9f3	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-14T19:04:42.178Z
acc2b5cf-96d1-465e-8d64-70bc60fb224b	9b843254-9be3-44a6-a1c1-6ff57e46d9f3	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-14T19:05:39.085Z
9a5972ec-6ce1-43f4-bcd7-005d73cec02c	9b843254-9be3-44a6-a1c1-6ff57e46d9f3	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-14T19:06:56.732Z
627e56d5-25c4-4971-b2a4-03a59d47e7d5	9b843254-9be3-44a6-a1c1-6ff57e46d9f3	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-14T19:07:48.533Z
37e7f8d5-415b-4856-a509-ae9d838d361f	ad0b7d3b-acec-4393-98a6-4398dd5eb695	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-28T19:27:59.692Z
268317e8-68d8-4ec1-8632-0d1bb83732e4	ad0b7d3b-acec-4393-98a6-4398dd5eb695	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-28T19:29:15.632Z
b1df3b6e-9da9-446e-b991-ada80f6f57b6	ad0b7d3b-acec-4393-98a6-4398dd5eb695	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-28T19:29:51.194Z
ae0775c7-2400-43ef-ac14-8d26b2c008ae	ad0b7d3b-acec-4393-98a6-4398dd5eb695	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-28T19:31:13.182Z
04a72809-561b-4ced-8c67-2bef112ec1d2	ad0b7d3b-acec-4393-98a6-4398dd5eb695	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-28T19:31:57.756Z
bec1b5d2-9302-4f41-b178-89aa07f4bc71	ad0b7d3b-acec-4393-98a6-4398dd5eb695	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-28T19:32:55.556Z
3d763fc1-ffc3-4caf-83ad-9ad62a77d0df	ad0b7d3b-acec-4393-98a6-4398dd5eb695	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-28T19:33:53.473Z
1e84fcf2-e6d3-4e9e-b08c-04f9da6727af	ad0b7d3b-acec-4393-98a6-4398dd5eb695	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-28T19:35:14.560Z
f45f78cd-3608-40ef-b0ec-386f7a0804ee	ad0b7d3b-acec-4393-98a6-4398dd5eb695	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-28T19:36:01.626Z
1cc929cd-07ed-4cf1-853a-013482b986f8	5e9d4afc-0fe0-4325-ae40-4f323d6daf27	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-19T00:01:06.968Z
bcb53acc-5385-4d64-91f5-688af5e7b7e1	5e9d4afc-0fe0-4325-ae40-4f323d6daf27	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-19T00:02:20.762Z
3a7a10de-408e-4f94-809f-3d5a1bf7d15d	5e9d4afc-0fe0-4325-ae40-4f323d6daf27	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-19T00:03:16.308Z
31b57847-3778-4c69-aed2-552cb996ffc2	5e9d4afc-0fe0-4325-ae40-4f323d6daf27	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-19T00:04:24.979Z
b1c2159c-35ef-48d5-bcfb-850cb3f6bfd3	5e9d4afc-0fe0-4325-ae40-4f323d6daf27	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-19T00:05:24.029Z
349b1523-aaa6-4c3c-b6a5-a987b3cbea4f	5e9d4afc-0fe0-4325-ae40-4f323d6daf27	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-19T00:06:07.441Z
f08bcf7a-debc-44a2-bab6-16b196d12337	5e9d4afc-0fe0-4325-ae40-4f323d6daf27	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-19T00:07:14.318Z
82adfdf9-3fca-42fd-9441-8ad96f245e72	5e9d4afc-0fe0-4325-ae40-4f323d6daf27	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-19T00:08:08.928Z
165b98d2-6ad9-4f00-8a39-96d1f6b233a8	9c0039bc-ce29-4f34-bcad-082bd6ca1e76	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-31T08:47:23.231Z
3878ade9-2a55-4079-a412-081b29a1fb14	9c0039bc-ce29-4f34-bcad-082bd6ca1e76	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-31T08:48:06.679Z
3bf24eca-7feb-472f-8a83-1458aa46a5f8	9c0039bc-ce29-4f34-bcad-082bd6ca1e76	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-31T08:49:03.674Z
d7e1aa1e-7941-4183-abef-bb5408c686ec	9c0039bc-ce29-4f34-bcad-082bd6ca1e76	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-31T08:50:10.675Z
cfa19279-8c0e-4628-826e-bec491b597f2	9c0039bc-ce29-4f34-bcad-082bd6ca1e76	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-31T08:51:03.972Z
49ed8450-1982-46cd-9e81-0960648edf15	9c0039bc-ce29-4f34-bcad-082bd6ca1e76	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-31T08:51:59.698Z
546ac577-764a-4bc1-b793-73db2930d8d3	9af10d00-df7d-4d4d-a08f-1b09cad6ace8	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-04-01T18:27:52.185Z
d59904fe-0dda-448e-ac0a-8b8f2efaf354	9af10d00-df7d-4d4d-a08f-1b09cad6ace8	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-04-01T18:28:54.599Z
6499c837-12e7-459a-a549-d0f714a1ace1	9af10d00-df7d-4d4d-a08f-1b09cad6ace8	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-04-01T18:29:56.920Z
cae67552-205f-4ee1-a75d-5a1da6d70f2a	9af10d00-df7d-4d4d-a08f-1b09cad6ace8	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-04-01T18:30:52.698Z
8908bca3-d5ed-460c-a451-5cdf2c843971	9af10d00-df7d-4d4d-a08f-1b09cad6ace8	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-04-01T18:32:00.931Z
b212e6db-22f8-4aeb-b08f-23c78b239c8e	9af10d00-df7d-4d4d-a08f-1b09cad6ace8	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-04-01T18:32:50.783Z
9a5a4e5d-f1b3-46bd-80af-365a6948e3c9	9af10d00-df7d-4d4d-a08f-1b09cad6ace8	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-04-01T18:33:51.483Z
177938db-d89b-4c71-9c18-06262099802f	9af10d00-df7d-4d4d-a08f-1b09cad6ace8	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-04-01T18:35:01.891Z
567ecb67-98b7-4d07-9b12-0bf503555249	9af10d00-df7d-4d4d-a08f-1b09cad6ace8	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-04-01T18:36:10.751Z
bc411daa-046c-4791-ab13-06e6920e948b	cd11b20f-0afb-4306-9409-cbb366a1b0b2	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-24T20:51:43.954Z
a05b0357-82f6-4322-b455-3549674fd504	cd11b20f-0afb-4306-9409-cbb366a1b0b2	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-24T20:52:57.004Z
2e740be4-33be-4a86-9491-863a3207c8ea	cd11b20f-0afb-4306-9409-cbb366a1b0b2	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-24T20:53:50.165Z
d8e5ae5a-cb2a-4d7f-928e-3e29abcbd474	cd11b20f-0afb-4306-9409-cbb366a1b0b2	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-24T20:54:43.996Z
048b0a42-83e1-418f-baf8-94de57e53fdd	d6b414e1-2399-4a5b-b9c3-ebb1a631f1aa	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-26T14:18:09.778Z
10e16909-3cba-41e6-afb5-bf5a351e9757	d6b414e1-2399-4a5b-b9c3-ebb1a631f1aa	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-26T14:19:20.407Z
e40e5c6e-efc2-436e-878e-d180709c4bf3	d6b414e1-2399-4a5b-b9c3-ebb1a631f1aa	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-26T14:19:59.202Z
3c170bb2-907e-45c3-afeb-22ae5d20d6cb	d6b414e1-2399-4a5b-b9c3-ebb1a631f1aa	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-26T14:20:58.224Z
75c023b4-e070-4324-8265-ebf5217bdba5	d6b414e1-2399-4a5b-b9c3-ebb1a631f1aa	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-26T14:21:56.141Z
4ea93a76-9f68-4717-95aa-c427967ab1f1	d6b414e1-2399-4a5b-b9c3-ebb1a631f1aa	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-26T14:23:18.194Z
2402c1cf-98de-4415-8176-0ac09110dcb9	d6b414e1-2399-4a5b-b9c3-ebb1a631f1aa	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-26T14:23:54.948Z
10727944-374c-44d2-8ab5-cfd7cab57b86	d6b414e1-2399-4a5b-b9c3-ebb1a631f1aa	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-26T14:24:56.062Z
9b77fd1b-a010-4d84-888b-14c335d3300f	d6b414e1-2399-4a5b-b9c3-ebb1a631f1aa	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-26T14:26:07.370Z
57f74f1b-c549-468c-b536-be7372815b3b	b101d0fb-7a8a-44bd-b204-c38825bf0213	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-14T18:42:52.168Z
ac2daab8-3f54-4eb7-b786-69f4df4a957f	b101d0fb-7a8a-44bd-b204-c38825bf0213	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-14T18:44:08.016Z
5995f231-6182-4611-9c8f-3ee214cb0f11	b101d0fb-7a8a-44bd-b204-c38825bf0213	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-14T18:45:14.598Z
e4b3b4f0-22d5-4756-863e-07b4c3ce58a0	b101d0fb-7a8a-44bd-b204-c38825bf0213	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-14T18:46:12.600Z
d735c584-9658-40c2-acb0-6dbbb28ae2f8	b101d0fb-7a8a-44bd-b204-c38825bf0213	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-14T18:47:15.150Z
1ba9b026-a716-46a7-82eb-e718d0df3799	b101d0fb-7a8a-44bd-b204-c38825bf0213	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-14T18:47:55.747Z
67fc117c-4d6c-4964-93d6-75f63b7a319f	b101d0fb-7a8a-44bd-b204-c38825bf0213	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-14T18:48:51.202Z
231bc3cd-a23c-4ca9-9de3-c423656f57a0	b101d0fb-7a8a-44bd-b204-c38825bf0213	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-14T18:49:59.416Z
56a53908-e53e-4faa-96bd-c96fa9bc4f4a	d0e92ed7-9ebd-4922-9f8b-97d084d05067	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-29T15:11:08.515Z
45d4c07b-1cf8-45c2-bb93-3ec5ea0091ff	d0e92ed7-9ebd-4922-9f8b-97d084d05067	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-29T15:12:00.804Z
8be862dc-5098-47a1-a2be-d2098b980c53	d0e92ed7-9ebd-4922-9f8b-97d084d05067	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-29T15:12:46.385Z
a30966d2-245f-4c81-8ecd-32eaed0ee464	d0e92ed7-9ebd-4922-9f8b-97d084d05067	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-29T15:13:53.768Z
9fd11108-3c93-4d36-bfa6-ad7ac29861df	d0e92ed7-9ebd-4922-9f8b-97d084d05067	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-29T15:14:57.579Z
95cd389d-ded8-46ac-b467-781a3c229096	d0e92ed7-9ebd-4922-9f8b-97d084d05067	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-29T15:15:58.817Z
6c916a62-53d6-4641-bc0d-73dd37183edf	d0e92ed7-9ebd-4922-9f8b-97d084d05067	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-29T15:16:46.329Z
2e2a5cc5-c3a9-4216-bba7-a5bbf2919d3f	d0e92ed7-9ebd-4922-9f8b-97d084d05067	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-29T15:18:12.138Z
aff90401-8b9a-484c-90f4-f025bf45ddcc	d0e92ed7-9ebd-4922-9f8b-97d084d05067	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-29T15:19:09.165Z
f53f767f-df00-43e5-938d-7cdf2cc9f9db	f4ff3cce-455e-4450-80a3-693f7602b1ae	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-18T07:20:18.974Z
0629e67d-509c-4128-a8dc-a7e607c7f057	f4ff3cce-455e-4450-80a3-693f7602b1ae	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-18T07:21:17.074Z
bd76d75f-3cf5-4da1-8841-8a9f9a070e5f	f4ff3cce-455e-4450-80a3-693f7602b1ae	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-18T07:22:14.269Z
1edec0bd-fd4b-4438-a952-80efb2845009	f4ff3cce-455e-4450-80a3-693f7602b1ae	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-18T07:23:17.487Z
ce12dcda-ddf9-40f8-b0ed-3e7ff3ffafb6	f4ff3cce-455e-4450-80a3-693f7602b1ae	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-18T07:24:33.724Z
dbcead64-5cd1-45f7-b34c-4e81247f6b63	f4ff3cce-455e-4450-80a3-693f7602b1ae	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-18T07:25:29.148Z
5a27cecb-6d42-4683-b0e6-88f1048e4be7	f4ff3cce-455e-4450-80a3-693f7602b1ae	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-18T07:26:23.044Z
8d024f62-ce87-4a25-9344-f9c6d0872cc1	f4ff3cce-455e-4450-80a3-693f7602b1ae	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-18T07:27:09.811Z
fe5408dd-7a8b-4cc6-9939-548cee8ce100	f4ff3cce-455e-4450-80a3-693f7602b1ae	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-18T07:28:25.097Z
d302a62c-9c66-4f1b-801e-9b51da456c15	9c57442c-b898-40e5-ad25-c6770ad015f7	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-29T23:19:26.878Z
325c2756-fc38-4f37-9204-7f13424eda5f	9c57442c-b898-40e5-ad25-c6770ad015f7	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-29T23:20:46.431Z
80ea321f-d02a-4f3b-acf8-821323e659e6	9c57442c-b898-40e5-ad25-c6770ad015f7	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-29T23:21:29.643Z
53eb74d1-4422-4a0e-9a56-eafbfa0e7027	9c57442c-b898-40e5-ad25-c6770ad015f7	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-29T23:22:43.819Z
d57efc43-7b39-44a1-ab8d-2e94bd3ef4fb	9c57442c-b898-40e5-ad25-c6770ad015f7	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-29T23:23:31.817Z
7f794d4d-4d4d-468c-94da-4c9e9ce8cbe6	9c57442c-b898-40e5-ad25-c6770ad015f7	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-29T23:24:26.598Z
fe42f1a9-0b2f-4e8b-b808-c2e80a906a27	9c57442c-b898-40e5-ad25-c6770ad015f7	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-29T23:25:46.923Z
b3848ca1-3ca0-4d9b-bbef-9a7b461631d0	9c57442c-b898-40e5-ad25-c6770ad015f7	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-29T23:26:41.634Z
8da307a6-3c08-4196-b4f4-87f6a35a552c	84502ac1-28ba-4380-96fd-843d3255797a	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-25T05:36:12.968Z
7f1419fc-6b04-4cb1-81e1-65d907040b39	84502ac1-28ba-4380-96fd-843d3255797a	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-25T05:37:07.684Z
ca89b618-794d-4d17-8ca5-a7a3adc3576b	84502ac1-28ba-4380-96fd-843d3255797a	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-25T05:38:14.636Z
093f6434-53b5-4fdc-b986-d9d1bc86c162	84502ac1-28ba-4380-96fd-843d3255797a	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-25T05:38:58.168Z
901107d2-26b0-4294-9b2c-d5b560658243	84502ac1-28ba-4380-96fd-843d3255797a	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-25T05:40:09.114Z
50ec0b7c-a108-424b-ba1d-11a6027915c4	84502ac1-28ba-4380-96fd-843d3255797a	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-25T05:40:49.193Z
4844b32a-3eab-4386-b301-5c1c12944ab6	450017e5-cbbe-4c4b-9496-b64a1f13cbb9	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-17T08:12:42.032Z
07eeabd2-1424-46c7-8bee-5508d59a3329	450017e5-cbbe-4c4b-9496-b64a1f13cbb9	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-17T08:13:54.534Z
26f977dc-8df5-43a4-922e-96b02f81b7fe	450017e5-cbbe-4c4b-9496-b64a1f13cbb9	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-17T08:14:33.643Z
4b7f7314-8cf1-472b-aee1-12ab439fb1fd	450017e5-cbbe-4c4b-9496-b64a1f13cbb9	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-17T08:15:41.033Z
fc18bec6-f62b-4075-95cd-1e3436971346	8cd85f06-611f-4712-8f7b-8f824c3798f1	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-26T19:24:03.466Z
de2832c4-65f0-44cb-bf37-b1f94ed71d48	8cd85f06-611f-4712-8f7b-8f824c3798f1	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-26T19:24:59.717Z
1945fe27-acbb-444e-922a-829dc3a218c9	8cd85f06-611f-4712-8f7b-8f824c3798f1	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-26T19:25:43.004Z
34c31a38-442d-4b5f-8640-2edf40735ed7	8cd85f06-611f-4712-8f7b-8f824c3798f1	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-26T19:27:02.087Z
59419b26-3cf2-4690-b070-e498e3550f66	8cd85f06-611f-4712-8f7b-8f824c3798f1	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-26T19:27:52.688Z
198f1cf7-4fa1-439e-9a0d-4d357879fce7	8cd85f06-611f-4712-8f7b-8f824c3798f1	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-26T19:28:52.127Z
62e5ebf5-276c-46b5-a62e-6f6b6489d4ad	8cd85f06-611f-4712-8f7b-8f824c3798f1	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-26T19:30:08.203Z
b5d133ca-8cb7-42ec-b8b0-c661af47831d	8cd85f06-611f-4712-8f7b-8f824c3798f1	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-26T19:30:46.192Z
e6c3ba9c-30fa-4aab-8406-536c1dd3bcb7	bedd0c0a-0ff7-4d99-a525-92bc1e5d0e91	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-17T22:39:06.623Z
26347101-0801-47ee-b5da-88d735db258d	bedd0c0a-0ff7-4d99-a525-92bc1e5d0e91	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-17T22:40:05.012Z
b76a29ce-7693-429b-ad35-c3318e7d0356	bedd0c0a-0ff7-4d99-a525-92bc1e5d0e91	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-17T22:41:18.992Z
2e6d42e4-8dc6-4c46-910a-aa7608ee0cc7	bedd0c0a-0ff7-4d99-a525-92bc1e5d0e91	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-17T22:42:21.494Z
31b6ba4f-f979-4b9f-ba82-6abc568615ef	bedd0c0a-0ff7-4d99-a525-92bc1e5d0e91	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-17T22:43:08.263Z
41752ae0-abd0-42aa-9ceb-62aedb5034eb	bedd0c0a-0ff7-4d99-a525-92bc1e5d0e91	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-17T22:44:21.759Z
2960c482-46f7-48f4-8330-ccbee970d9ab	bedd0c0a-0ff7-4d99-a525-92bc1e5d0e91	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-17T22:45:09.876Z
661f80ab-c90c-45db-a7c5-3d0c61e2b764	bedd0c0a-0ff7-4d99-a525-92bc1e5d0e91	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-17T22:46:08.499Z
bc89e551-ac8a-4f2d-8340-739cf9ff8386	bedd0c0a-0ff7-4d99-a525-92bc1e5d0e91	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-17T22:46:55.616Z
92d5aa07-3885-455a-953a-13e3f4c619ff	658d5532-3e36-47f6-97c7-6c700183927c	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-21T19:37:49.421Z
a66ebe87-b245-4fd6-8be1-730863ed75d7	658d5532-3e36-47f6-97c7-6c700183927c	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-21T19:38:28.379Z
fe6fc9c4-8468-4e03-b62b-23f3a9d62ddf	658d5532-3e36-47f6-97c7-6c700183927c	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-21T19:39:51.382Z
c63d3747-a59c-4973-a147-885e5a6b7df2	658d5532-3e36-47f6-97c7-6c700183927c	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-21T19:40:24.930Z
7dec2842-a0cc-4a1d-8a84-3b79669a55fa	658d5532-3e36-47f6-97c7-6c700183927c	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-21T19:41:49.139Z
9ea2a804-0257-4144-b6b1-fb497f3dd2b5	658d5532-3e36-47f6-97c7-6c700183927c	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-21T19:42:27.171Z
725070a0-93e0-4c89-849f-fb6b07ff0691	180fdb3f-ed02-480f-b347-79a48ce1f446	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-30T03:13:01.959Z
eff70b76-b75d-4c0f-ad37-0a5c6e8601a6	180fdb3f-ed02-480f-b347-79a48ce1f446	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-30T03:14:04.335Z
41cb38ef-b50b-4b25-b681-6cc8f55138c9	180fdb3f-ed02-480f-b347-79a48ce1f446	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-30T03:14:46.531Z
4060bb15-0082-4423-b63d-03e10331fdb7	180fdb3f-ed02-480f-b347-79a48ce1f446	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-30T03:16:02.173Z
87e532c8-53bb-4fdb-a51a-38ee3b956425	180fdb3f-ed02-480f-b347-79a48ce1f446	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-30T03:17:10.814Z
2c3e5ca7-02f1-4f30-83aa-dbb6a76c1651	180fdb3f-ed02-480f-b347-79a48ce1f446	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-30T03:17:59.135Z
300d2363-3b01-48dd-9f0f-b3432252cd77	c760aa4a-62fb-498e-b9dc-6c47cd10b9b9	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-20T18:37:40.550Z
a79b143d-289c-47e9-9381-fc46bacb11e2	c760aa4a-62fb-498e-b9dc-6c47cd10b9b9	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-20T18:38:32.211Z
88defe03-130d-4ad7-a646-50c0337e4c10	c760aa4a-62fb-498e-b9dc-6c47cd10b9b9	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-20T18:39:25.705Z
abd8e7d7-ec18-4d88-bedf-d35fca880ef3	c760aa4a-62fb-498e-b9dc-6c47cd10b9b9	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-20T18:40:18.281Z
6a18e978-a902-4aaa-b19a-74521f1ddba4	c760aa4a-62fb-498e-b9dc-6c47cd10b9b9	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-20T18:41:35.952Z
8b70ff8b-8d5f-459c-bb78-1ee180eebf3c	c760aa4a-62fb-498e-b9dc-6c47cd10b9b9	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-20T18:42:34.696Z
1f3e29bd-e550-48af-955e-4b32443a524d	bc94bc5a-4353-4ed2-b4b8-cc68f9651e54	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-16T17:52:48.189Z
45430a83-d19c-4af8-84e2-28418e610c92	bc94bc5a-4353-4ed2-b4b8-cc68f9651e54	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-16T17:53:27.492Z
78f0b6aa-5688-4566-9d44-900aec622574	bc94bc5a-4353-4ed2-b4b8-cc68f9651e54	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-16T17:54:46.001Z
bbbbf428-870f-4f2c-80f8-e0461d6b7f99	bc94bc5a-4353-4ed2-b4b8-cc68f9651e54	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-16T17:55:48.855Z
f70b6b5d-f247-4455-a1ff-1f71d5a9a5af	6fb86f84-92ba-4985-9b71-5c446e992c84	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-29T00:04:28.134Z
b1ef9ca6-35e9-4dbb-a75e-884dbc976e4b	6fb86f84-92ba-4985-9b71-5c446e992c84	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-29T00:05:50.566Z
bff9885c-b10e-46d4-9697-b696ec549fab	6fb86f84-92ba-4985-9b71-5c446e992c84	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-29T00:06:30.815Z
94d723b2-3f6b-43cc-92c6-e2d7b4c864ab	6fb86f84-92ba-4985-9b71-5c446e992c84	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-29T00:07:36.567Z
1a420256-e3be-4c1d-915f-4fa431e0fcd3	6fb86f84-92ba-4985-9b71-5c446e992c84	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-29T00:08:28.474Z
5a5923d7-2a2d-49d3-b83c-fb64c28e73c7	6fb86f84-92ba-4985-9b71-5c446e992c84	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-29T00:09:52.256Z
cae755f4-f45a-4ff9-badb-4512cc293198	c4efd75f-14ea-4fc7-9fa0-eda211401af4	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-13T23:39:31.369Z
6c95bcd5-54c5-422b-812c-8b9a92f42c30	c4efd75f-14ea-4fc7-9fa0-eda211401af4	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-13T23:40:25.039Z
873bea0d-4852-43e6-a698-ca2f03fb904e	c4efd75f-14ea-4fc7-9fa0-eda211401af4	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-13T23:41:33.071Z
51343168-03c4-4656-aacf-7c828df9e89a	c4efd75f-14ea-4fc7-9fa0-eda211401af4	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-13T23:42:26.217Z
8d06b803-354b-415a-8374-3d5baeb3a745	c4efd75f-14ea-4fc7-9fa0-eda211401af4	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-13T23:43:44.428Z
5a3b45c3-3185-41a2-9f79-b7b78a8513a8	c4efd75f-14ea-4fc7-9fa0-eda211401af4	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-13T23:44:28.419Z
e1b26bf5-7d2e-449b-ad69-c93755bbff86	c4efd75f-14ea-4fc7-9fa0-eda211401af4	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-13T23:45:19.333Z
37b6c57c-0806-4f68-b8ed-6c3b77ee6813	c4efd75f-14ea-4fc7-9fa0-eda211401af4	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-13T23:46:38.207Z
0ed41c80-bbca-46b6-823c-2f0328e88d3d	22f31233-0696-4cbf-9997-64c84072bd09	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-17T23:26:42.986Z
8f51487d-068e-4063-b1e7-e487d55cd2ac	22f31233-0696-4cbf-9997-64c84072bd09	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-17T23:27:58.239Z
740e3aa4-e800-47b9-9408-c461d21996d3	22f31233-0696-4cbf-9997-64c84072bd09	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-17T23:28:38.546Z
0e712c87-a5d2-4281-92c9-abca1f1728ac	22f31233-0696-4cbf-9997-64c84072bd09	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-17T23:29:54.340Z
ade0f457-00ee-4b32-9ee7-787690ee9dee	22f31233-0696-4cbf-9997-64c84072bd09	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-17T23:30:52.986Z
12c30ed7-c625-43a6-9035-6e6c5b72ea18	22f31233-0696-4cbf-9997-64c84072bd09	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-17T23:31:55.334Z
b041bcd2-bb94-4bc5-813d-bd212ef95b88	ab9800f8-87cf-4b27-a71a-edf29ac78b4d	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-17T01:36:59.335Z
84b3b5ba-40e1-48f3-8f12-88b630822105	ab9800f8-87cf-4b27-a71a-edf29ac78b4d	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-17T01:38:05.758Z
74565d0b-ed6a-47ca-82e8-b92bf4f960f4	ab9800f8-87cf-4b27-a71a-edf29ac78b4d	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-17T01:39:06.327Z
987c4872-6e48-4b46-ac49-f0e30df7a7c5	ab9800f8-87cf-4b27-a71a-edf29ac78b4d	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-17T01:39:54.591Z
965e1922-89fb-4ecb-9e95-7f9f6187ae15	918a1bc0-8eac-4bec-8b7e-1a8363b7a507	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-29T03:31:39.713Z
529e441a-5c9d-48f1-b85f-3f97f473a4a6	918a1bc0-8eac-4bec-8b7e-1a8363b7a507	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-29T03:32:41.540Z
10bfec99-2b44-44a3-b0d6-c78a59682a6e	918a1bc0-8eac-4bec-8b7e-1a8363b7a507	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-29T03:33:47.749Z
3416027f-3e9d-49a8-a939-78d5dfa8a705	918a1bc0-8eac-4bec-8b7e-1a8363b7a507	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-29T03:34:45.385Z
cbced196-4281-4d85-ae5d-e80063d22ed1	918a1bc0-8eac-4bec-8b7e-1a8363b7a507	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-29T03:35:38.675Z
66c5a9cf-56de-46c8-ac92-9aff93f74ff1	918a1bc0-8eac-4bec-8b7e-1a8363b7a507	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-29T03:36:48.170Z
80739513-105c-4521-97cf-43a4206552d8	2a180879-d2fc-4c06-a2d8-0118839e1b72	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-17T14:08:37.378Z
f47696b4-9a3c-493e-a5f8-59b06ccba6a0	2a180879-d2fc-4c06-a2d8-0118839e1b72	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-17T14:09:33.715Z
566534f0-c4f6-44db-afd5-1588dbb909e4	2a180879-d2fc-4c06-a2d8-0118839e1b72	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-17T14:10:38.904Z
ee79eb85-c63a-4027-9bba-4b7ea6cdced4	2a180879-d2fc-4c06-a2d8-0118839e1b72	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-17T14:11:26.687Z
def115b1-5e93-496d-856d-1b00c3c2d118	2a180879-d2fc-4c06-a2d8-0118839e1b72	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-17T14:12:34.764Z
6b605b95-c914-4cff-be17-76bf363f9940	2a180879-d2fc-4c06-a2d8-0118839e1b72	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-17T14:13:45.156Z
af3c2c9a-f5a4-47b7-a4e4-f419c48073ab	61d9df83-b9c1-4793-a495-25458108dbce	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-19T11:48:00.653Z
ae2f633b-70f5-47f2-ac0d-0f313c98de1a	61d9df83-b9c1-4793-a495-25458108dbce	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-19T11:49:03.417Z
534a41c9-1295-40d5-a94b-5f49675759fc	61d9df83-b9c1-4793-a495-25458108dbce	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-19T11:50:04.341Z
b1054014-d4e7-4b92-93cb-828eb95b7c12	61d9df83-b9c1-4793-a495-25458108dbce	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-19T11:50:52.734Z
b1202728-466d-4635-abca-2f9e7e7f8126	61d9df83-b9c1-4793-a495-25458108dbce	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-19T11:51:49.333Z
f9e70cf6-65d6-4211-926d-5333151b7786	61d9df83-b9c1-4793-a495-25458108dbce	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-19T11:52:44.708Z
c84852e2-77ef-4aca-a197-34c3ec60c480	61d9df83-b9c1-4793-a495-25458108dbce	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-19T11:53:51.193Z
ef89195c-c8d6-4246-aed9-7682e24f6c7b	61d9df83-b9c1-4793-a495-25458108dbce	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-19T11:54:56.037Z
bbd018f0-7c04-46c0-adf5-985d9bd765da	61d9df83-b9c1-4793-a495-25458108dbce	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-19T11:56:09.171Z
4b74d41d-f9ef-4eff-917a-c581d56d191b	a4cdae49-228d-4e93-95be-dab18342787f	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-31T16:46:36.733Z
26292c4a-bfe5-4609-90f1-96e07be9f4ab	a4cdae49-228d-4e93-95be-dab18342787f	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-31T16:47:47.451Z
8c8fdd18-bc4c-48c4-a0e4-cd338c17c5a6	a4cdae49-228d-4e93-95be-dab18342787f	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-31T16:49:02.286Z
f6be157a-1888-4b22-b610-829e7f08aee7	a4cdae49-228d-4e93-95be-dab18342787f	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-31T16:49:44.373Z
4e758896-a628-4209-aa03-1e3b5fe2c328	a4cdae49-228d-4e93-95be-dab18342787f	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-31T16:50:51.049Z
c0cb1bbe-3ea0-4657-9866-fa31e137fdcc	a4cdae49-228d-4e93-95be-dab18342787f	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-31T16:52:01.807Z
997a1ed3-568a-45da-9dbb-2826f80d64c8	a4cdae49-228d-4e93-95be-dab18342787f	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-31T16:52:38.484Z
37846279-5374-4255-848f-03df272d3e65	a4cdae49-228d-4e93-95be-dab18342787f	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-31T16:53:42.459Z
33867afe-5560-4aff-8c30-bdb6627f5c8c	da9efbee-78f0-4640-9f33-0108ef4c1184	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-28T21:36:39.626Z
6e7eb86a-98a6-4dc3-a211-b0a1faea5b02	da9efbee-78f0-4640-9f33-0108ef4c1184	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-28T21:37:22.684Z
acc30b84-4965-4495-b9d9-da1cd0324d19	da9efbee-78f0-4640-9f33-0108ef4c1184	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-28T21:38:22.968Z
168778e5-ed71-49c9-ae0b-43029a268620	da9efbee-78f0-4640-9f33-0108ef4c1184	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-28T21:39:13.397Z
3773a08e-fcf6-4793-bb01-addf83fe8b04	908ef078-80a1-46ba-8da8-1ea0ee0a1aa4	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-27T21:04:14.236Z
06194e31-fe9b-4a40-8018-b3734db05717	908ef078-80a1-46ba-8da8-1ea0ee0a1aa4	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-27T21:05:27.341Z
5f7e7434-33f6-4c02-b219-6a214e4373b5	908ef078-80a1-46ba-8da8-1ea0ee0a1aa4	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-27T21:06:08.841Z
0b5bf6a9-c968-4d21-ac76-dd7f4d5a7e3c	908ef078-80a1-46ba-8da8-1ea0ee0a1aa4	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-27T21:07:11.266Z
a58493e0-0400-428f-aa3a-e21e70715642	908ef078-80a1-46ba-8da8-1ea0ee0a1aa4	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-27T21:08:15.964Z
d7dd9f87-4992-496f-8255-6407fcd32357	908ef078-80a1-46ba-8da8-1ea0ee0a1aa4	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-27T21:09:11.610Z
a8ad972d-c6b7-4ed8-b137-0603f5c4d982	908ef078-80a1-46ba-8da8-1ea0ee0a1aa4	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-27T21:10:14.391Z
83b43838-4765-4330-ab50-e85b864e2250	908ef078-80a1-46ba-8da8-1ea0ee0a1aa4	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-27T21:11:07.179Z
21c860a5-14a0-41aa-9086-cd418ca1fc79	c72ad348-1d41-417d-8264-ee6c1e6d43dd	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-16T17:21:51.808Z
bf20918b-de4f-417f-b3f7-e033638088fe	c72ad348-1d41-417d-8264-ee6c1e6d43dd	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-16T17:22:45.631Z
285fcc4b-74c0-4f42-bf59-1ffe2514f7cf	c72ad348-1d41-417d-8264-ee6c1e6d43dd	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-16T17:24:08.516Z
d65594bd-cb60-4f5a-81e2-7aedec658a45	c72ad348-1d41-417d-8264-ee6c1e6d43dd	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-16T17:24:46.269Z
c902fbb4-b7ca-4bba-aee0-372bff973f0c	49b62510-6e52-47e8-b265-a5bc640bbbde	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-30T14:19:42.374Z
aac675e5-7799-4ea7-bca3-4da58c112909	49b62510-6e52-47e8-b265-a5bc640bbbde	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-30T14:20:30.505Z
27a70f8b-904c-426c-a54f-254036b5bab4	49b62510-6e52-47e8-b265-a5bc640bbbde	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-30T14:21:38.822Z
d60f539f-77b1-459e-8fe5-a8c53c2d33c2	49b62510-6e52-47e8-b265-a5bc640bbbde	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-30T14:22:30.316Z
560022ab-714b-42b7-8e27-fdfd7b69e7ec	49b62510-6e52-47e8-b265-a5bc640bbbde	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-30T14:23:52.163Z
0e4131fd-6174-44bf-9fd7-0862449eda4c	49b62510-6e52-47e8-b265-a5bc640bbbde	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-30T14:24:44.800Z
70a893cd-fa87-4f3b-9326-6d80996ab7de	49b62510-6e52-47e8-b265-a5bc640bbbde	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-30T14:25:50.924Z
d430ed7e-d030-4359-86ad-3a61e6a83dc8	49b62510-6e52-47e8-b265-a5bc640bbbde	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-30T14:26:56.267Z
664b529b-5902-4667-a828-94b17a915915	49b62510-6e52-47e8-b265-a5bc640bbbde	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-30T14:27:43.534Z
7cce7b4c-0a16-428c-8c32-20f7221015a0	ebbfdae9-f34a-4ba2-8618-5af36d641ceb	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-31T20:57:39.580Z
1c62cc91-58c8-42e5-b60b-b97d50722868	ebbfdae9-f34a-4ba2-8618-5af36d641ceb	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-31T20:58:39.362Z
92b86b37-b0b8-4038-8ca1-2bb5151f3edc	ebbfdae9-f34a-4ba2-8618-5af36d641ceb	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-31T20:59:38.373Z
dc256d5d-ab23-4129-bbbb-3f927b13a568	ebbfdae9-f34a-4ba2-8618-5af36d641ceb	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-31T21:00:33.144Z
355b0bc2-fa01-4b39-8a3b-46fe6d2033ef	ebbfdae9-f34a-4ba2-8618-5af36d641ceb	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-31T21:01:56.939Z
9e5e4f4c-cca4-4424-9f21-5657cf0ad7d1	ebbfdae9-f34a-4ba2-8618-5af36d641ceb	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-31T21:02:46.856Z
ada5bacc-857f-495d-8b2a-fa0480b4a5d3	ebbfdae9-f34a-4ba2-8618-5af36d641ceb	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-31T21:03:35.855Z
05a48818-8739-4eaf-ad0d-7b13664c495d	ebbfdae9-f34a-4ba2-8618-5af36d641ceb	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-31T21:04:53.409Z
403d87f0-dd16-4277-b192-2700a2de5686	ebbfdae9-f34a-4ba2-8618-5af36d641ceb	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-31T21:05:42.850Z
2ba877c5-bbb6-4cd0-b195-a3a616213dab	cc2298cb-904f-4093-8739-2224d5a7c709	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-27T00:55:03.606Z
dc6fc2de-ff14-481c-865d-08883280f164	cc2298cb-904f-4093-8739-2224d5a7c709	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-27T00:56:05.371Z
eb3dc12e-6b56-4a1d-8a1a-a9e2c1e4711f	cc2298cb-904f-4093-8739-2224d5a7c709	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-27T00:57:25.434Z
f7975134-1fd3-4f17-bb36-57a769cc4011	cc2298cb-904f-4093-8739-2224d5a7c709	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-27T00:58:16.406Z
0c84c288-a9fa-448f-9153-cdf3a56c32e6	cc2298cb-904f-4093-8739-2224d5a7c709	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-27T00:59:13.338Z
6d0efa5c-6c88-463b-916c-c035698ec32d	cc2298cb-904f-4093-8739-2224d5a7c709	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-27T01:00:18.617Z
42da0ed3-510c-4262-a12b-b60b3a798c11	25ed7b6c-0b36-41d6-9798-a69aac1100a8	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-27T13:30:36.339Z
cf69e3f6-4f3a-48cc-909e-ad7b6d1c092b	25ed7b6c-0b36-41d6-9798-a69aac1100a8	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-27T13:31:27.891Z
fde8f912-9d6b-4235-bd1b-431d66809ed9	25ed7b6c-0b36-41d6-9798-a69aac1100a8	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-27T13:32:41.740Z
b5fb1e5d-fc24-4613-bca0-348b8b1c651d	25ed7b6c-0b36-41d6-9798-a69aac1100a8	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-27T13:33:21.850Z
78640212-cf5c-48ed-b3b6-26ac0f138df6	25ed7b6c-0b36-41d6-9798-a69aac1100a8	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-27T13:34:48.299Z
90ae54ac-115f-47f9-9860-101f539de9bf	25ed7b6c-0b36-41d6-9798-a69aac1100a8	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-27T13:35:38.800Z
16ec8c74-6ca3-414d-a867-311b72a45d4d	391f7dfd-e70f-44af-8e66-e547bed18a6d	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-29T17:36:26.155Z
6d062628-75b4-46f2-b7bc-58910c4a9226	391f7dfd-e70f-44af-8e66-e547bed18a6d	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-29T17:37:17.671Z
fcd9817b-2c40-43f5-a948-e299615dc164	391f7dfd-e70f-44af-8e66-e547bed18a6d	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-29T17:38:07.278Z
59c47280-84bf-463f-9279-a26457ac2423	391f7dfd-e70f-44af-8e66-e547bed18a6d	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-29T17:39:07.780Z
09687b3b-2e0e-4781-938e-ef34f10980b4	391f7dfd-e70f-44af-8e66-e547bed18a6d	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-29T17:40:31.127Z
b5c3f2eb-47f2-4e66-a002-4378317f5721	391f7dfd-e70f-44af-8e66-e547bed18a6d	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-29T17:41:22.015Z
1e51fd1d-e5fc-4e2e-9ce6-54b7f7311e76	391f7dfd-e70f-44af-8e66-e547bed18a6d	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-29T17:42:22.558Z
f7855a44-6083-4a9f-9801-726061996eb0	391f7dfd-e70f-44af-8e66-e547bed18a6d	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-29T17:43:16.098Z
3d763aa9-2398-498a-8f31-7a2cfaee6abc	d42e8347-ce4d-41b1-ae74-cdadbe982705	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-27T05:00:26.317Z
c35be3e7-245e-44de-8533-2d9256e9e9df	d42e8347-ce4d-41b1-ae74-cdadbe982705	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-27T05:01:09.387Z
03555237-57cd-4ac7-8d05-c729ecb9c602	d42e8347-ce4d-41b1-ae74-cdadbe982705	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-27T05:02:17.826Z
b8b84a1c-5ca0-4933-b210-57fc047fbe7f	d42e8347-ce4d-41b1-ae74-cdadbe982705	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-27T05:03:02.331Z
535d2046-026e-47e4-b499-6f75333cd951	d42e8347-ce4d-41b1-ae74-cdadbe982705	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-27T05:04:13.221Z
171d1224-3877-4016-814f-180e84dd3a46	d42e8347-ce4d-41b1-ae74-cdadbe982705	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-27T05:04:58.045Z
a9e56593-1375-48cb-ba7d-2fd63fe404d9	d42e8347-ce4d-41b1-ae74-cdadbe982705	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-27T05:06:25.644Z
2d3bd729-5bd3-4b8c-aa0f-13acf8ea9031	d42e8347-ce4d-41b1-ae74-cdadbe982705	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-27T05:07:24.650Z
8edb307d-627f-48f1-98c6-ea9943f8a973	d42e8347-ce4d-41b1-ae74-cdadbe982705	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-27T05:08:14.436Z
f315937c-7d39-44e6-80c2-ccacf1f3f5e1	cab36901-6985-4be0-8a0f-7392b5a1be6b	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-23T17:16:24.069Z
f2cdce0c-c512-47e5-82c9-aaee6e7b924b	cab36901-6985-4be0-8a0f-7392b5a1be6b	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-23T17:17:12.712Z
2b82862c-2dfa-475b-95cc-c0d1fc5b66d3	cab36901-6985-4be0-8a0f-7392b5a1be6b	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-23T17:18:26.334Z
ae5814f2-5f2b-491e-aa52-0a5aeb80f4e2	cab36901-6985-4be0-8a0f-7392b5a1be6b	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-23T17:19:34.707Z
da0eaf1c-c6ad-4ed0-8e47-91b5a9dca69d	90fda104-5f0d-45ae-bb97-c0af29eb1e16	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-30T22:32:09.427Z
8feb9fcd-9817-4719-8273-ad653e3ad609	90fda104-5f0d-45ae-bb97-c0af29eb1e16	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-30T22:32:45.334Z
c4c6c2a2-b171-4b23-995c-3eadea30e63a	90fda104-5f0d-45ae-bb97-c0af29eb1e16	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-30T22:33:46.407Z
5e06137f-44db-4ddb-946a-d94b824ca618	90fda104-5f0d-45ae-bb97-c0af29eb1e16	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-30T22:34:43.114Z
12e06617-b172-4789-a8fd-2d6a569529b4	b0cb61f2-d4ac-4985-8b88-6d0d3490453b	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-20T07:44:32.450Z
197c6d95-a64a-43cd-80be-090e892e02bf	b0cb61f2-d4ac-4985-8b88-6d0d3490453b	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-20T07:45:21.057Z
3d7829b9-46cc-4a9a-9d4c-ef505bfac5e2	b0cb61f2-d4ac-4985-8b88-6d0d3490453b	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-20T07:46:20.823Z
59908b2b-15af-4ede-8d8c-ee86892785a2	b0cb61f2-d4ac-4985-8b88-6d0d3490453b	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-20T07:47:36.359Z
8caeece1-4c6f-43ef-b139-f68c13704440	b0cb61f2-d4ac-4985-8b88-6d0d3490453b	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-20T07:48:32.581Z
fe2aac19-37de-4101-992d-20dada687149	b0cb61f2-d4ac-4985-8b88-6d0d3490453b	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-20T07:49:29.186Z
49c390a9-f272-4aef-8309-98d117b63aff	b0cb61f2-d4ac-4985-8b88-6d0d3490453b	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-20T07:50:27.558Z
19cee119-45b0-492b-b5aa-039126583c32	b0cb61f2-d4ac-4985-8b88-6d0d3490453b	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-20T07:51:13.627Z
40978d72-ebc7-488c-aaa2-f15c3ca7b566	e991abc4-9e36-4c45-a0fe-39f1f52e28d6	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-04-01T17:02:18.308Z
d9bf945c-50e5-4ea2-8502-e0527f7137e8	e991abc4-9e36-4c45-a0fe-39f1f52e28d6	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-04-01T17:03:17.500Z
cd2ac266-a19c-4a98-b76c-69909246bf62	e991abc4-9e36-4c45-a0fe-39f1f52e28d6	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-04-01T17:04:37.264Z
e65f245a-41c2-4e9b-a026-76e55d29c426	e991abc4-9e36-4c45-a0fe-39f1f52e28d6	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-04-01T17:05:33.664Z
fb65a02a-377d-4ed9-b6ab-e6067c68ced3	f0bd977e-3927-429c-a971-834976f640bb	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-19T05:22:41.458Z
7454c4a1-9673-4ac0-a297-d1c81ddb395f	f0bd977e-3927-429c-a971-834976f640bb	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-19T05:23:36.616Z
276530f8-7207-404b-99f4-419671babc33	f0bd977e-3927-429c-a971-834976f640bb	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-19T05:24:29.761Z
d2c13a7d-a48f-4482-8ff0-9296181d78be	f0bd977e-3927-429c-a971-834976f640bb	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-19T05:25:33.661Z
c74b8ff5-34f2-4e79-a0ee-07f85cb2cc4a	d4358fc0-b61a-4ca3-bf5b-cba0d2477bbd	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-14T05:06:37.024Z
607b80ef-3b0a-42c0-909e-431706ab9c3a	d4358fc0-b61a-4ca3-bf5b-cba0d2477bbd	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-14T05:07:51.585Z
cc70a0b1-5e30-46d6-9b08-98cf59a40957	d4358fc0-b61a-4ca3-bf5b-cba0d2477bbd	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-14T05:08:27.789Z
2a0c1128-daa3-4ec0-8790-89eabaa864b3	d4358fc0-b61a-4ca3-bf5b-cba0d2477bbd	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-14T05:09:40.716Z
cc71005a-3168-4d9d-9995-729ee37e54ba	b55262a6-e7a6-4bfa-8dd6-ad551e52be8c	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-04-02T03:59:08.872Z
e71c12da-4a76-4714-9229-722c2decaa8c	b55262a6-e7a6-4bfa-8dd6-ad551e52be8c	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-04-02T04:00:10.517Z
63d9f98c-4513-42b6-a396-9990c171f743	b55262a6-e7a6-4bfa-8dd6-ad551e52be8c	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-04-02T04:01:27.544Z
b11c0ea8-e0fc-4c6c-b7ee-7ec1b5087ae0	b55262a6-e7a6-4bfa-8dd6-ad551e52be8c	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-04-02T04:02:18.361Z
f244cd9c-8428-4c21-9a9d-7047db9367eb	cd6b5195-06a0-4c75-9bf0-4dd313e2369e	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-23T06:15:50.271Z
26319bef-b473-4594-8988-0c3eb3750ce3	cd6b5195-06a0-4c75-9bf0-4dd313e2369e	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-23T06:16:24.914Z
5aa7b7b2-1b1a-4faf-ae70-ed9e6889f8bf	cd6b5195-06a0-4c75-9bf0-4dd313e2369e	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-23T06:17:46.989Z
b816548b-5ede-4772-be14-bd0fec66bd44	cd6b5195-06a0-4c75-9bf0-4dd313e2369e	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-23T06:18:36.789Z
5845357d-c696-447c-aa2a-3c37fba8f296	cd6b5195-06a0-4c75-9bf0-4dd313e2369e	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-23T06:19:49.420Z
765402df-7cbe-45a4-9f07-dd252607593b	cd6b5195-06a0-4c75-9bf0-4dd313e2369e	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-23T06:20:40.180Z
28c67bae-9095-422e-9ffd-2048dcd60095	bffa5b63-1a48-4585-9bd3-5d060888d83a	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-18T18:53:33.466Z
7bfac021-b5dc-4cec-9d74-6dd80b99d079	bffa5b63-1a48-4585-9bd3-5d060888d83a	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-18T18:54:32.879Z
0e8e31dd-577a-4a94-b155-043e6323eb62	bffa5b63-1a48-4585-9bd3-5d060888d83a	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-18T18:55:50.174Z
186ae9a1-c809-4136-becb-33566f54151c	bffa5b63-1a48-4585-9bd3-5d060888d83a	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-18T18:56:34.549Z
f42f3dbf-fd83-40d9-b9be-c6295fdf5699	bffa5b63-1a48-4585-9bd3-5d060888d83a	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-18T18:57:28.872Z
ca605654-c648-4073-99c2-09ae092bd04b	bffa5b63-1a48-4585-9bd3-5d060888d83a	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-18T18:58:30.448Z
d66f6ddb-204b-46b5-a7f5-4d6a1705cf82	bffa5b63-1a48-4585-9bd3-5d060888d83a	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-18T18:59:37.414Z
f67f84b5-803d-4a45-b0ef-c48e382cf41a	bffa5b63-1a48-4585-9bd3-5d060888d83a	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-18T19:00:41.315Z
e1a77d65-3702-4034-8e9e-052874314792	bffa5b63-1a48-4585-9bd3-5d060888d83a	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-18T19:01:35.921Z
d8b1a97f-460e-4722-9938-cab43718c24a	44d664c1-b280-4a2e-a106-2059baa168ec	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-04-01T02:43:13.831Z
79f67100-b1ea-4a58-95f8-48f5d4e77a7c	44d664c1-b280-4a2e-a106-2059baa168ec	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-04-01T02:44:07.665Z
3d0bfb17-88f2-4d79-9524-23c5547d17a8	44d664c1-b280-4a2e-a106-2059baa168ec	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-04-01T02:45:07.761Z
20c7d994-46fd-400e-92e2-5d88d49efc81	44d664c1-b280-4a2e-a106-2059baa168ec	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-04-01T02:45:59.489Z
b14df322-5e62-495a-9fa2-0157a7e22c12	64da2e25-a67f-4c9f-859c-3b263cec38da	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-28T01:57:18.481Z
29b4bdc7-bb72-4bb6-a8bd-5219db7f8499	64da2e25-a67f-4c9f-859c-3b263cec38da	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-28T01:58:47.315Z
cfdbfed4-7f1e-49b3-a9e9-3fd8fbd4c4e9	64da2e25-a67f-4c9f-859c-3b263cec38da	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-28T01:59:33.814Z
27c21d7c-fd32-4ff1-ad1e-e2a02ea64939	64da2e25-a67f-4c9f-859c-3b263cec38da	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-28T02:00:41.149Z
6bfecaff-267f-4267-80d4-66a86584036d	64da2e25-a67f-4c9f-859c-3b263cec38da	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-28T02:01:22.806Z
03f1389f-7d67-4adc-b044-f9d0e4d67c5b	64da2e25-a67f-4c9f-859c-3b263cec38da	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-28T02:02:28.860Z
3b8aef1c-557d-48d3-8832-f7e055107303	a77ec760-26ee-4d6f-a38e-0f4579790dff	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-26T00:45:52.798Z
16b3482d-c53c-49ac-9fdd-536e1fb8be86	a77ec760-26ee-4d6f-a38e-0f4579790dff	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-26T00:47:03.243Z
e3b7ba87-9b91-4d07-bbf4-74df349ba60c	a77ec760-26ee-4d6f-a38e-0f4579790dff	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-26T00:48:06.670Z
1e7053e3-1614-413c-beb2-7014920261a5	a77ec760-26ee-4d6f-a38e-0f4579790dff	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-26T00:48:50.509Z
1fea82d1-9911-406c-a316-58aba72a9ef7	a77ec760-26ee-4d6f-a38e-0f4579790dff	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-26T00:49:56.607Z
fe945ee8-8d03-43e3-bcb0-a0622f183b4b	a77ec760-26ee-4d6f-a38e-0f4579790dff	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-26T00:50:55.193Z
0d5965e0-782e-4291-8c64-d852201dbad7	a77ec760-26ee-4d6f-a38e-0f4579790dff	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-26T00:51:50.561Z
1086d5c4-681c-4e3d-be58-30c97621ef7f	a77ec760-26ee-4d6f-a38e-0f4579790dff	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-26T00:53:05.661Z
5315a2ab-1b8e-4f71-8f1a-5506424c7716	e1caf759-3f4e-427b-b8f8-d8888dbe39c7	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-17T23:36:05.825Z
0ca01199-a509-4eb3-9405-5fdeaf2831a0	e1caf759-3f4e-427b-b8f8-d8888dbe39c7	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-17T23:37:00.341Z
fab0ca01-b423-453a-a07a-f7c3e903363c	e1caf759-3f4e-427b-b8f8-d8888dbe39c7	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-17T23:38:08.268Z
935b3822-d280-4dc9-8aff-692e45c9f266	e1caf759-3f4e-427b-b8f8-d8888dbe39c7	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-17T23:38:54.524Z
5b62187d-acd4-4db0-ab7e-59340fad3a3f	e1caf759-3f4e-427b-b8f8-d8888dbe39c7	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-17T23:39:59.660Z
6af2b035-31f1-484d-bcde-6fc6c3b31755	e1caf759-3f4e-427b-b8f8-d8888dbe39c7	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-17T23:41:03.545Z
a4e39088-a3aa-4ef2-b536-1f925f5974ba	c086a8d2-25b0-4461-b1da-a9b20f60e429	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-23T06:51:55.872Z
88fadc71-765e-4eeb-b84d-87bc96014b77	c086a8d2-25b0-4461-b1da-a9b20f60e429	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-23T06:52:58.200Z
86f5e80a-b730-4c87-b745-88b33b72c16a	c086a8d2-25b0-4461-b1da-a9b20f60e429	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-23T06:53:59.123Z
f23893f9-fed4-4070-b012-94992b5c5c29	c086a8d2-25b0-4461-b1da-a9b20f60e429	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-23T06:54:58.742Z
9ac66768-6592-4a1a-bdfe-dfe2ae351cb6	c086a8d2-25b0-4461-b1da-a9b20f60e429	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-23T06:55:36.182Z
8c2f6731-c858-4c02-b739-d87da70afc27	c086a8d2-25b0-4461-b1da-a9b20f60e429	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-23T06:56:35.511Z
65975735-d8ec-47fc-a9b0-5a231363cfd3	aacb831e-45b7-46ac-9980-e00a1c3d0b32	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-24T02:56:53.459Z
1b803946-7101-43b8-84fe-33253fb05179	aacb831e-45b7-46ac-9980-e00a1c3d0b32	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-24T02:58:09.160Z
5258c8c1-dc8d-4d7e-93b6-2b169ba65e38	aacb831e-45b7-46ac-9980-e00a1c3d0b32	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-24T02:58:54.503Z
e0c21ca5-e5be-4e8b-bda4-253ddd6fb33a	aacb831e-45b7-46ac-9980-e00a1c3d0b32	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-24T03:00:17.631Z
36129e5f-afb9-4a39-aa4d-20bb327a46b2	e583c1a0-7078-4c1a-b229-5bcab58dfd82	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-24T20:21:11.876Z
1eabb888-933c-43bb-ae18-76c8a97e7132	e583c1a0-7078-4c1a-b229-5bcab58dfd82	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-24T20:22:06.995Z
b5fbad8d-a2f3-4491-8ef4-dde6328d8d03	e583c1a0-7078-4c1a-b229-5bcab58dfd82	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-24T20:23:13.242Z
0d588c8d-663f-48c8-aab2-d38fddd0afed	e583c1a0-7078-4c1a-b229-5bcab58dfd82	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-24T20:24:17.567Z
e01282ef-ebde-4a7c-963b-1a26c45d128a	749e2030-3014-400d-ba38-b8fcaf62009a	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-26T10:59:20.174Z
f76d452d-4556-4eb5-8ee1-3721ebf153d0	749e2030-3014-400d-ba38-b8fcaf62009a	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-26T11:00:24.905Z
bd5ef25f-afb6-4e43-86a8-6532c4315953	749e2030-3014-400d-ba38-b8fcaf62009a	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-26T11:01:28.445Z
2de8c652-24a8-4c00-a1ef-e8ae3e99a7b5	749e2030-3014-400d-ba38-b8fcaf62009a	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-26T11:02:08.214Z
3474f97b-6c8f-46d5-b5ee-759fd06d1eee	749e2030-3014-400d-ba38-b8fcaf62009a	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-26T11:03:16.535Z
ec41bdda-f4f0-4c50-89b7-7631feecc1f6	749e2030-3014-400d-ba38-b8fcaf62009a	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-26T11:04:23.319Z
943ecb3a-6063-4c70-970d-076554a6f494	749e2030-3014-400d-ba38-b8fcaf62009a	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-26T11:05:21.638Z
2a455d92-e75d-4f77-9349-d64eedff647c	749e2030-3014-400d-ba38-b8fcaf62009a	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-26T11:06:34.836Z
57b58f8f-d82f-4af2-824d-d88d6f859041	749e2030-3014-400d-ba38-b8fcaf62009a	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-26T11:07:24.849Z
cccdc683-7daf-4f0c-b7df-1b41391aeea1	76e823a8-c734-4572-ad18-97f26e4daa0b	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-31T01:24:48.196Z
ca6e678d-02d8-4691-8025-cffe70e8df9f	76e823a8-c734-4572-ad18-97f26e4daa0b	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-31T01:25:34.501Z
2a4a0a53-b58c-4a3e-a22a-834d35ac038d	76e823a8-c734-4572-ad18-97f26e4daa0b	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-31T01:26:41.241Z
86120d23-fd34-4a9e-9e00-b2515770a9b0	76e823a8-c734-4572-ad18-97f26e4daa0b	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-31T01:27:40.378Z
09bee54b-093f-4066-a5bd-ee34fd3a1af9	76e823a8-c734-4572-ad18-97f26e4daa0b	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-31T01:28:43.869Z
0f061233-c7e2-424f-8754-6d9a1549e359	76e823a8-c734-4572-ad18-97f26e4daa0b	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-31T01:29:31.895Z
7b73ba35-4b31-4c95-b87d-d30ab5dd5182	76e823a8-c734-4572-ad18-97f26e4daa0b	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-31T01:30:31.966Z
8e977fa6-3083-4c25-974a-772e008810b5	76e823a8-c734-4572-ad18-97f26e4daa0b	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-31T01:31:29.779Z
d7c6a154-4ac8-434a-a8af-5c04bebd1d96	a3475298-9731-4984-9a44-44f1be112042	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-31T05:40:42.425Z
20a98130-8493-4bab-adcd-ef47bf08cde2	a3475298-9731-4984-9a44-44f1be112042	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-31T05:41:37.414Z
c1e5c7fd-9101-49f4-9b02-6a5217799b91	a3475298-9731-4984-9a44-44f1be112042	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-31T05:42:58.384Z
3191c1be-fa52-401a-9c75-e35c2921d372	a3475298-9731-4984-9a44-44f1be112042	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-31T05:43:56.311Z
d12e9aaf-05ce-4b37-8fb7-a313dbf3619f	a3475298-9731-4984-9a44-44f1be112042	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-31T05:44:51.584Z
87a083f7-e538-453b-a853-3b437e5454aa	a3475298-9731-4984-9a44-44f1be112042	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-31T05:45:50.238Z
a19b12a9-01db-4d16-8ffc-4969ebccbab2	a3475298-9731-4984-9a44-44f1be112042	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-31T05:46:37.934Z
519bc6a7-459e-4573-b88e-ed1c81d0db8b	a3475298-9731-4984-9a44-44f1be112042	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-31T05:47:48.437Z
caac736e-d8df-4277-8243-1b28d6d49ad5	a3475298-9731-4984-9a44-44f1be112042	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-31T05:48:39.803Z
47576e4b-fe62-4937-ad6b-1958a25c66c0	e48942fd-20a3-4045-91ba-fd4b1dc020bc	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-27T00:26:08.003Z
3bdfa517-6e2d-4736-aa3d-6924e488ebb7	e48942fd-20a3-4045-91ba-fd4b1dc020bc	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-27T00:27:02.588Z
594acf3a-29a7-48a8-9468-c4c06eba31e0	e48942fd-20a3-4045-91ba-fd4b1dc020bc	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-27T00:27:52.603Z
523a9e17-4e7b-408a-91ac-6cd48f30fb3d	e48942fd-20a3-4045-91ba-fd4b1dc020bc	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-27T00:29:04.756Z
f3298ae3-f73e-44b6-a0ac-2a4f204fb49f	e48942fd-20a3-4045-91ba-fd4b1dc020bc	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-27T00:30:04.148Z
415c7fe5-79eb-424d-a0ab-d6c7befd2c94	e48942fd-20a3-4045-91ba-fd4b1dc020bc	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-27T00:31:06.303Z
ce4085b9-a0db-438c-8941-56f73a39e350	e48942fd-20a3-4045-91ba-fd4b1dc020bc	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-27T00:31:47.367Z
92c465ff-d0c8-45a1-a24b-fd92db299d23	e48942fd-20a3-4045-91ba-fd4b1dc020bc	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-27T00:32:45.804Z
afcd6ae2-d7b8-4e1c-8373-04fafb83bb09	e48942fd-20a3-4045-91ba-fd4b1dc020bc	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-27T00:33:46.949Z
71eff70b-065b-47f1-8f97-95399716f9da	26c43531-867c-470d-8c5a-ea3e9fbbd73f	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-28T04:26:22.425Z
d880df0c-94f0-47f0-a59c-5273b45c8ccf	26c43531-867c-470d-8c5a-ea3e9fbbd73f	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-28T04:27:12.472Z
256db5d9-30e3-431f-b4bb-1434b7f82ebb	26c43531-867c-470d-8c5a-ea3e9fbbd73f	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-28T04:28:04.265Z
cf15889a-836f-49e4-9d94-6e926a15235c	26c43531-867c-470d-8c5a-ea3e9fbbd73f	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-28T04:28:59.541Z
8607a178-2694-4156-aa0f-fc8e5a2fedee	4a8f5045-b396-4c27-88ae-0776aaf3d3ae	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-29T21:46:59.460Z
9df85ee7-a6f9-4d00-843f-4fe577d88aa6	4a8f5045-b396-4c27-88ae-0776aaf3d3ae	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-29T21:47:52.193Z
7562dc2d-34ad-4344-a275-9992b2a70e6c	4a8f5045-b396-4c27-88ae-0776aaf3d3ae	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-29T21:48:55.884Z
450eedc1-adb1-4947-97a9-14ed84cc6be3	4a8f5045-b396-4c27-88ae-0776aaf3d3ae	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-29T21:49:59.088Z
75e69bfd-aaa9-40c6-9efb-12e08c5120e7	2d3a5423-751a-4744-8010-7849f3e49384	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-22T06:31:46.062Z
3cec25af-4b8a-4bea-8da5-11cddce456e0	2d3a5423-751a-4744-8010-7849f3e49384	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-22T06:32:56.581Z
5b6f0c30-0513-43f7-8b0a-9ab48f8d7e56	2d3a5423-751a-4744-8010-7849f3e49384	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-22T06:33:52.978Z
a135617b-f57d-48db-a3a5-efb440edb1b4	2d3a5423-751a-4744-8010-7849f3e49384	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-22T06:34:52.867Z
41bd42c4-11ea-43b2-b4ca-94faec0ec57b	2d3a5423-751a-4744-8010-7849f3e49384	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-22T06:35:50.878Z
bc526192-f3ab-4e57-b5bf-d4b68acafd5c	2d3a5423-751a-4744-8010-7849f3e49384	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-22T06:36:39.879Z
7d657cb6-4d95-4f32-bff5-a5dfc753360f	2d3a5423-751a-4744-8010-7849f3e49384	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-22T06:37:54.436Z
34e1ef30-3c68-4eab-8e0c-b4b18ef4c127	2d3a5423-751a-4744-8010-7849f3e49384	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-22T06:38:59.850Z
ce4e1285-e93f-479d-ab60-806e7365e094	1f773910-72d8-4281-a4ca-fdbf1c231940	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-24T19:24:50.452Z
9e32b1c9-8861-4804-a4fe-ed99cd623ce6	1f773910-72d8-4281-a4ca-fdbf1c231940	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-24T19:26:13.290Z
35445bc8-18aa-4618-968d-78169b98133a	1f773910-72d8-4281-a4ca-fdbf1c231940	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-24T19:27:03.549Z
7f0f0a20-deda-48ac-9571-6cbe34aac55b	1f773910-72d8-4281-a4ca-fdbf1c231940	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-24T19:27:53.326Z
46579f77-8570-47e0-89c5-d74a5a025618	1f773910-72d8-4281-a4ca-fdbf1c231940	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-24T19:29:12.160Z
d75240b8-1373-4b79-aa3e-7a66cc547635	1f773910-72d8-4281-a4ca-fdbf1c231940	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-24T19:30:10.565Z
14f911f3-1f2f-40fe-8d57-16689f69c87e	1f773910-72d8-4281-a4ca-fdbf1c231940	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-24T19:31:01.723Z
385324d7-68f6-4beb-bed2-8e69e0d11145	1f773910-72d8-4281-a4ca-fdbf1c231940	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-24T19:31:59.610Z
684645d6-b4f0-4af5-a135-962ace3dc66e	d26fd424-c425-449a-94fc-b2eab26b01ac	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-27T17:47:38.893Z
1a4df9cd-d70f-403d-b1e5-baf574415102	d26fd424-c425-449a-94fc-b2eab26b01ac	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-27T17:48:29.925Z
ed1c8510-259d-46d6-80f8-9cbf7417d40c	d26fd424-c425-449a-94fc-b2eab26b01ac	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-27T17:49:34.679Z
19921c98-9a08-413f-b7ef-fe596475af1a	d26fd424-c425-449a-94fc-b2eab26b01ac	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-27T17:50:41.529Z
52a279f0-538a-4d92-8120-0f4dda082ec7	d26fd424-c425-449a-94fc-b2eab26b01ac	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-27T17:51:50.078Z
11703cf3-0a7a-4760-8946-180327290230	d26fd424-c425-449a-94fc-b2eab26b01ac	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-27T17:52:53.293Z
5ab0cc98-6c21-43e7-a5a1-9801d54560ad	1d517de3-cf84-4a67-a9bf-a5587801600f	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-23T21:58:30.951Z
317fc281-cfad-44d6-823c-08d20252dbad	1d517de3-cf84-4a67-a9bf-a5587801600f	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-23T21:59:52.809Z
18c2bfb8-0c49-475d-8119-6482fb891311	1d517de3-cf84-4a67-a9bf-a5587801600f	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-23T22:00:34.768Z
b63c7d37-0273-4d13-a4aa-42f364b9e045	1d517de3-cf84-4a67-a9bf-a5587801600f	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-23T22:01:48.943Z
66f21d27-5603-45a1-a4e8-67870ffc7653	1d517de3-cf84-4a67-a9bf-a5587801600f	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-23T22:02:49.304Z
a2835fa6-c6a4-40e0-86d2-de74bddfbc40	1d517de3-cf84-4a67-a9bf-a5587801600f	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-23T22:03:50.271Z
80eb3589-5e31-45ba-a9f8-4406af6d5670	88663f85-a284-4060-8b32-8b128f931d7f	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-21T19:32:10.755Z
cc297aa7-11c6-4ee3-a7fd-6b8bd782465e	88663f85-a284-4060-8b32-8b128f931d7f	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-21T19:33:28.471Z
d62aed0b-5a1a-4ded-b0a9-d562d6eda810	88663f85-a284-4060-8b32-8b128f931d7f	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-21T19:34:15.627Z
99f764a6-315e-4d83-9d47-a1082ea45408	88663f85-a284-4060-8b32-8b128f931d7f	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-21T19:35:15.713Z
4264d5f8-6322-4211-91d1-50a93698df62	3560db67-c1cb-4f5f-829a-1359f3d758d3	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-26T04:39:35.460Z
19162b43-4b08-48be-8b95-5e83a4f25301	3560db67-c1cb-4f5f-829a-1359f3d758d3	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-26T04:40:38.558Z
fdb341d8-cf94-4b6c-9166-e9f8c70acf4f	3560db67-c1cb-4f5f-829a-1359f3d758d3	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-26T04:41:21.498Z
e06f6e92-95af-4ed1-b63f-3755bccf1540	3560db67-c1cb-4f5f-829a-1359f3d758d3	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-26T04:42:40.982Z
5d73277d-5251-443b-83d0-c74a228af35f	3560db67-c1cb-4f5f-829a-1359f3d758d3	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-26T04:43:42.508Z
3d561c3b-57e2-4f4e-8b43-a1432e8220f5	3560db67-c1cb-4f5f-829a-1359f3d758d3	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-26T04:44:28.744Z
282d423d-9906-45ba-95fa-5666c3e842e4	3560db67-c1cb-4f5f-829a-1359f3d758d3	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-26T04:45:20.200Z
cbc98f98-fdcc-49c6-8630-36e7bf579102	3560db67-c1cb-4f5f-829a-1359f3d758d3	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-26T04:46:22.960Z
77bfcb6c-9864-463a-80fc-15111e7f86c9	3560db67-c1cb-4f5f-829a-1359f3d758d3	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-26T04:47:37.959Z
b9f1242b-4f90-428e-9097-55ca65c711f2	93257088-cda1-41e4-87f9-2910aa150692	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-04-01T16:45:40.084Z
9a3ae892-934b-4713-bcfc-2aefccf604b5	93257088-cda1-41e4-87f9-2910aa150692	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-04-01T16:46:40.507Z
737d43b3-cbee-4284-8eba-44fbe5a761e3	93257088-cda1-41e4-87f9-2910aa150692	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-04-01T16:47:44.503Z
6d7caf4f-7ea6-49e5-95ab-3a8568743d95	93257088-cda1-41e4-87f9-2910aa150692	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-04-01T16:48:43.220Z
dc755e05-8722-4b80-b052-f2360d199ac5	93257088-cda1-41e4-87f9-2910aa150692	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-04-01T16:49:51.501Z
ef3516c1-2434-47f2-bc0e-986dd5696dd1	93257088-cda1-41e4-87f9-2910aa150692	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-04-01T16:50:45.341Z
cace329a-bd72-490b-8456-e60337bd8c0c	93257088-cda1-41e4-87f9-2910aa150692	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-04-01T16:51:50.386Z
e0140cc3-e356-4af7-a84b-b922779ce6e7	93257088-cda1-41e4-87f9-2910aa150692	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-04-01T16:52:34.814Z
a656f0c2-d53c-4628-bb54-8a27617732ea	6bfddad6-0960-40a3-810e-e7d538441e49	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-22T22:53:30.372Z
868ef7ec-38fc-4caa-b21c-a6000a5ba656	6bfddad6-0960-40a3-810e-e7d538441e49	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-22T22:54:22.222Z
1e0f303a-d3fd-4cd0-8ccb-288fad75f538	6bfddad6-0960-40a3-810e-e7d538441e49	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-22T22:55:28.693Z
82a50b6c-2ce8-48b7-a179-a8cdfa49d1d0	6bfddad6-0960-40a3-810e-e7d538441e49	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-22T22:56:16.060Z
8ae69d39-6d57-48be-8cec-745cff96c1a2	6bfddad6-0960-40a3-810e-e7d538441e49	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-22T22:57:42.672Z
b6fefcd3-a5e0-48e9-90a2-2200f94f7eea	6bfddad6-0960-40a3-810e-e7d538441e49	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-22T22:58:32.000Z
53ad7b47-0568-428b-a20b-ccd00d8ac161	5743f9b3-d7e7-43a5-8b6c-f7401fba6903	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-23T21:40:04.890Z
be6e6fac-e07a-49f4-9487-fc955e936f0c	5743f9b3-d7e7-43a5-8b6c-f7401fba6903	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-23T21:41:18.885Z
4903dcc1-47e4-4734-aeb0-43e4b5c51255	5743f9b3-d7e7-43a5-8b6c-f7401fba6903	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-23T21:42:00.042Z
d0ffe8c2-2798-4c5e-a021-aed17847171c	5743f9b3-d7e7-43a5-8b6c-f7401fba6903	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-23T21:43:05.207Z
418834dd-f4a4-4cfc-82a6-eee29fbf075c	5743f9b3-d7e7-43a5-8b6c-f7401fba6903	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-23T21:44:26.106Z
fae3c0fc-5d2c-414a-9a0c-cd3d970b15f1	5743f9b3-d7e7-43a5-8b6c-f7401fba6903	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-23T21:45:04.196Z
753bc2bf-ceea-495d-8385-a53cd094a1ef	27cd5a2a-f83c-4e0b-af30-4e3039d76147	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-28T00:52:25.995Z
78479b38-adcb-48cd-b972-db5b460c40e4	27cd5a2a-f83c-4e0b-af30-4e3039d76147	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-28T00:53:32.297Z
8ef27f4d-f215-494a-b5f9-866c86937b0a	27cd5a2a-f83c-4e0b-af30-4e3039d76147	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-28T00:54:37.228Z
ed9ae1ea-769d-49a4-b497-43f5240df9c1	27cd5a2a-f83c-4e0b-af30-4e3039d76147	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-28T00:55:40.310Z
20d62f3f-159b-4cb5-9a0d-93bc221fe583	edef5287-7143-476a-8146-d575fcc3ec35	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-18T07:11:48.868Z
fd62b412-c447-4ea6-9788-6703f4d4b912	edef5287-7143-476a-8146-d575fcc3ec35	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-18T07:12:54.599Z
2006c693-e462-401e-9bb2-25a1d34546c1	edef5287-7143-476a-8146-d575fcc3ec35	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-18T07:14:14.640Z
643cd8ba-3f8a-4f36-af04-7772d1014a76	edef5287-7143-476a-8146-d575fcc3ec35	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-18T07:15:09.450Z
f504fab2-5b3f-4d52-963b-27766d05b13c	edef5287-7143-476a-8146-d575fcc3ec35	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-18T07:16:03.321Z
3f94a61c-a0b8-4270-b3ec-31cd27f75ae7	edef5287-7143-476a-8146-d575fcc3ec35	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-18T07:17:03.857Z
aeb256d4-fe8e-4b92-ab97-576dd69f7c17	4fdf947d-4924-40d1-8595-2a62d6617c0d	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-27T16:37:15.012Z
be90f238-99f8-4f12-8c66-128b9e49f2fd	4fdf947d-4924-40d1-8595-2a62d6617c0d	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-27T16:38:13.656Z
b003a6e6-b1e7-4613-b238-c4765d710563	4fdf947d-4924-40d1-8595-2a62d6617c0d	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-27T16:39:26.611Z
2c886fe6-5bb4-4ed8-b286-98766a7812cf	4fdf947d-4924-40d1-8595-2a62d6617c0d	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-27T16:40:26.171Z
9224ebed-d31b-452a-8579-b64ec730125e	4a49fa3a-6ef6-4823-8fe9-7db3d29dbf02	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-27T15:30:36.929Z
659acb40-1075-4290-912e-9239799ca902	4a49fa3a-6ef6-4823-8fe9-7db3d29dbf02	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-27T15:31:42.023Z
79c11f95-0c70-4d65-aaa3-5a025ce00496	4a49fa3a-6ef6-4823-8fe9-7db3d29dbf02	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-27T15:33:01.414Z
a58bbaa7-a2ec-4b93-aa24-894c759f0b39	4a49fa3a-6ef6-4823-8fe9-7db3d29dbf02	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-27T15:34:02.038Z
4681034b-fb96-477f-adb6-3a06a0217ebf	4a49fa3a-6ef6-4823-8fe9-7db3d29dbf02	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-27T15:34:45.539Z
334f354f-8d1a-4da7-a575-124257f5f2ee	4a49fa3a-6ef6-4823-8fe9-7db3d29dbf02	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-27T15:35:54.981Z
97e1eb62-2fd1-4009-8d4d-f40ebd853367	f365e924-b5a2-47ad-a349-4885732f8c5c	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-21T06:52:39.315Z
c3159c8c-cb8a-4f7d-932c-208e4e6024cc	f365e924-b5a2-47ad-a349-4885732f8c5c	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-21T06:53:50.862Z
0cd34f51-98d9-46b3-8fa3-aaf2fce097bd	f365e924-b5a2-47ad-a349-4885732f8c5c	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-21T06:54:46.275Z
86521178-cb52-4dc2-abfb-f0c468fb54ac	f365e924-b5a2-47ad-a349-4885732f8c5c	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-21T06:55:47.499Z
15cc37fc-01bf-4ff1-b0ec-486eeb41533b	f365e924-b5a2-47ad-a349-4885732f8c5c	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-21T06:56:31.330Z
e497ca61-62b4-466d-a4c6-652b52108e6f	f365e924-b5a2-47ad-a349-4885732f8c5c	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-21T06:57:48.183Z
438a7188-bdb0-425f-8b14-7a249f2b7379	f365e924-b5a2-47ad-a349-4885732f8c5c	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-21T06:58:38.322Z
829ffd7a-8076-42c8-97c4-0ab2d61601b2	f365e924-b5a2-47ad-a349-4885732f8c5c	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-21T06:59:53.967Z
c3643194-952d-4974-866b-cb721e744052	f365e924-b5a2-47ad-a349-4885732f8c5c	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-21T07:00:27.825Z
f0139480-4c3c-4320-8c20-430e190588d2	0e00414b-6e0f-4480-808a-9579042308b8	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-27T05:17:27.343Z
2271988d-e57a-4dcd-a6a7-e2eecddcb99d	0e00414b-6e0f-4480-808a-9579042308b8	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-27T05:18:02.108Z
a9ef9612-3685-4a12-9b9f-4740c5d39809	0e00414b-6e0f-4480-808a-9579042308b8	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-27T05:19:13.868Z
87b8a1c6-0709-4415-aec4-c276e6477aab	0e00414b-6e0f-4480-808a-9579042308b8	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-27T05:20:00.353Z
55986d98-272e-4153-a368-988d9ec7ffd7	0e00414b-6e0f-4480-808a-9579042308b8	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-27T05:21:26.023Z
cdee6930-c77a-48b4-96b5-7ec2da3a7611	0e00414b-6e0f-4480-808a-9579042308b8	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-27T05:22:01.534Z
8768db21-5cca-4b55-962e-89c6e457431b	d235a9e2-10ec-4a5e-bf46-9e7def0539de	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-21T05:48:59.384Z
168c35e3-1c7c-4964-a28b-02a6bdd34b95	d235a9e2-10ec-4a5e-bf46-9e7def0539de	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-21T05:49:41.131Z
54662c81-2442-47cb-8804-7c1ff2e8333b	d235a9e2-10ec-4a5e-bf46-9e7def0539de	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-21T05:50:42.572Z
4dff841d-fcdf-473c-a218-4855a05b7539	d235a9e2-10ec-4a5e-bf46-9e7def0539de	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-21T05:51:59.364Z
3f5704a6-e9e1-4e03-9c54-1e5bb057b70a	d235a9e2-10ec-4a5e-bf46-9e7def0539de	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-21T05:52:56.266Z
3335d49f-1971-47e1-9ae8-a83ab86bdbe7	d235a9e2-10ec-4a5e-bf46-9e7def0539de	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-21T05:53:42.291Z
d0d15bdf-64b6-4030-aa0d-26583a9d6516	93844875-db44-4e04-889a-f224f3307d81	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-16T02:27:06.537Z
a6b3fd34-1b58-4065-9b30-0a9eef7ecc13	93844875-db44-4e04-889a-f224f3307d81	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-16T02:27:49.366Z
bb0444e7-e35f-48e4-a9c4-f09496717c1a	93844875-db44-4e04-889a-f224f3307d81	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-16T02:29:11.871Z
15c0d58b-c4f3-4987-9bcd-82a68c5bddbe	93844875-db44-4e04-889a-f224f3307d81	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-16T02:29:50.349Z
65e04eb1-dc66-426f-b5fc-21ece880acbc	93844875-db44-4e04-889a-f224f3307d81	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-16T02:31:06.746Z
0a2b225b-91f4-4fc9-a640-ad1f3a68a1ad	93844875-db44-4e04-889a-f224f3307d81	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-16T02:31:59.576Z
5b43b230-26ce-46d1-b8b3-41659ef965e7	93844875-db44-4e04-889a-f224f3307d81	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-16T02:32:58.148Z
dde6a484-13e3-48c6-b214-a01a438d9348	93844875-db44-4e04-889a-f224f3307d81	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-16T02:34:09.765Z
0119e27c-e124-4b41-ba89-de927bf21c44	81f25ef0-3b81-4945-b549-2816b0610ab1	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-25T01:19:03.249Z
3a3a876c-ff20-4700-958e-b1a84af2fdce	81f25ef0-3b81-4945-b549-2816b0610ab1	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-25T01:19:59.175Z
b2aee937-540c-4e49-9c4d-d31766cb273c	81f25ef0-3b81-4945-b549-2816b0610ab1	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-25T01:21:04.192Z
88c0c39c-d151-4270-8668-3d5df5c3219a	81f25ef0-3b81-4945-b549-2816b0610ab1	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-25T01:22:18.627Z
af5d501a-c17b-47b1-b5c3-e36b5b3932d5	81f25ef0-3b81-4945-b549-2816b0610ab1	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-25T01:23:19.521Z
496bc880-1810-4f93-bc56-8b3ce4c26721	81f25ef0-3b81-4945-b549-2816b0610ab1	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-25T01:24:03.322Z
7ed54fec-d6c1-4d65-9dcd-051da875f5a1	72f9dbbb-0dfa-499e-bfa1-0a6139a55826	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-27T20:45:24.025Z
8cd41b79-4392-40ff-b6bb-20c9c8664acd	72f9dbbb-0dfa-499e-bfa1-0a6139a55826	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-27T20:46:19.911Z
088240e3-7432-4a7a-8dd3-5d7751173649	72f9dbbb-0dfa-499e-bfa1-0a6139a55826	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-27T20:47:10.154Z
a85a8d5c-60d2-4421-8256-396b3a3068e8	72f9dbbb-0dfa-499e-bfa1-0a6139a55826	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-27T20:48:29.399Z
23409bad-accc-4428-b477-a77ac916277c	72f9dbbb-0dfa-499e-bfa1-0a6139a55826	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-27T20:49:06.642Z
5b41c228-6bae-4fd5-b90d-b57d5b704057	72f9dbbb-0dfa-499e-bfa1-0a6139a55826	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-27T20:50:23.117Z
c2a3b4c8-eb7a-4c6d-8d37-37d54e68b7c7	5a662f2f-48c8-46a4-8fd7-cf50fac0db40	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-27T14:30:39.426Z
000d8ad3-4938-486a-b6c3-61bc40a0a972	5a662f2f-48c8-46a4-8fd7-cf50fac0db40	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-27T14:31:39.590Z
3f083b21-bab5-4dfd-86f3-cfc41e52a187	5a662f2f-48c8-46a4-8fd7-cf50fac0db40	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-27T14:32:36.920Z
08264b3d-75e9-48b8-b3eb-6000151d3537	5a662f2f-48c8-46a4-8fd7-cf50fac0db40	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-27T14:33:35.355Z
8e7366b8-d416-4111-9e5e-a81c3f713d93	7900cc57-a417-499f-bae8-57f2ca3f6ec7	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-24T06:04:45.196Z
04990602-e46b-460f-8662-b615eea4e756	7900cc57-a417-499f-bae8-57f2ca3f6ec7	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-24T06:05:24.098Z
03729468-2c14-4cbc-a656-189e48e4a7a4	7900cc57-a417-499f-bae8-57f2ca3f6ec7	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-24T06:06:22.862Z
b10cede3-4044-4c09-8130-ffca95142acd	7900cc57-a417-499f-bae8-57f2ca3f6ec7	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-24T06:07:39.221Z
3e539f04-60ec-498d-bec2-25665a39430b	25266907-3596-4c73-ba5a-0e6d286e46ab	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-29T12:58:48.405Z
141c66e7-87de-498a-a81e-4969cacf8727	25266907-3596-4c73-ba5a-0e6d286e46ab	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-29T12:59:49.748Z
cf3e437b-7898-48d8-b282-3accd67b9eec	25266907-3596-4c73-ba5a-0e6d286e46ab	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-29T13:00:49.824Z
aa6e3abd-62b2-4e64-9ae9-cec2cafa7a4a	25266907-3596-4c73-ba5a-0e6d286e46ab	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-29T13:01:42.297Z
eeb583a2-bb55-4b0d-ab03-c719faf701ae	25266907-3596-4c73-ba5a-0e6d286e46ab	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-29T13:02:55.446Z
1ed81477-5325-43b0-ae48-ebd3c718943a	25266907-3596-4c73-ba5a-0e6d286e46ab	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-29T13:03:46.811Z
da580f43-1771-4ee0-a677-30a84c6d8dc7	96550c59-b8e3-4bb5-b5a5-fcbbf8b5db44	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-17T06:25:02.663Z
df49d51b-b9c4-43a8-9074-08aba685cf1e	96550c59-b8e3-4bb5-b5a5-fcbbf8b5db44	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-17T06:26:24.706Z
7b5b329d-89a1-44f4-a33f-1f225200fdeb	96550c59-b8e3-4bb5-b5a5-fcbbf8b5db44	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-17T06:27:05.999Z
09ad49b6-8234-48a1-b3db-69a2230f06d5	96550c59-b8e3-4bb5-b5a5-fcbbf8b5db44	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-17T06:28:11.381Z
0c95910f-bbef-4e56-81b1-1b55daa7d2f2	e31bc404-8d03-4021-a0dd-6209903f85e2	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-14T15:38:51.336Z
27d9cb7d-cbca-440c-8cd4-6ff9eeb65121	e31bc404-8d03-4021-a0dd-6209903f85e2	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-14T15:39:55.178Z
050b03a1-ec4b-4764-a3e9-fff0cb7eb253	e31bc404-8d03-4021-a0dd-6209903f85e2	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-14T15:41:07.638Z
4c3bc040-4ee4-42dc-9177-1748b738c302	e31bc404-8d03-4021-a0dd-6209903f85e2	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-14T15:42:15.605Z
7a704010-c49a-4304-bc0a-2c3ffa83b66a	09735141-df25-4947-a932-e5348b591738	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-14T07:53:41.963Z
4e9f1d52-4563-4669-b567-f523b2c7de10	09735141-df25-4947-a932-e5348b591738	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-14T07:54:25.725Z
9ade337e-5a2b-4669-a6f3-17a6d29793ba	09735141-df25-4947-a932-e5348b591738	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-14T07:55:26.793Z
86b7db44-f74f-4d05-b6ec-347e8cb27254	09735141-df25-4947-a932-e5348b591738	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-14T07:56:39.233Z
64f47d34-e62a-4512-8b90-1ce493d2053f	09735141-df25-4947-a932-e5348b591738	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-14T07:57:33.337Z
cbab1932-5e24-4f22-86cc-728002de769b	09735141-df25-4947-a932-e5348b591738	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-14T07:58:42.056Z
ff7dc620-a521-4b58-9ef9-a82503d04ef2	6901ee86-17aa-4877-b1c5-561391202b33	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-28T04:15:10.801Z
a841fb43-f6bc-451a-9c0d-740dad455096	6901ee86-17aa-4877-b1c5-561391202b33	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-28T04:16:10.691Z
5557106d-d696-4e46-9919-d98fd791c34f	6901ee86-17aa-4877-b1c5-561391202b33	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-28T04:17:29.205Z
e649bee2-e464-47f4-b0bf-3778c56f6608	6901ee86-17aa-4877-b1c5-561391202b33	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-28T04:18:26.208Z
5bbd5d0d-320c-4237-ac8d-654ffb633ab2	6901ee86-17aa-4877-b1c5-561391202b33	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-28T04:19:11.195Z
7ff38c85-4554-4baa-90f6-061a9fa32bb8	6901ee86-17aa-4877-b1c5-561391202b33	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-28T04:20:34.882Z
a408dde9-e3da-47f3-a4ee-6e9c82026303	6901ee86-17aa-4877-b1c5-561391202b33	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-28T04:21:18.624Z
7828bfa4-dc73-40db-b64b-0ab8d154c1bd	6901ee86-17aa-4877-b1c5-561391202b33	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-28T04:22:27.335Z
734f63e1-7d4a-4a85-b678-e9a3e47460d1	1eb5a6d3-b705-43fc-bed3-d5a935871d55	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-18T05:31:24.606Z
d0acb928-c11f-43b6-82b7-6a88e610b278	1eb5a6d3-b705-43fc-bed3-d5a935871d55	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-18T05:32:36.797Z
bf4d6d1e-ac38-4afa-a026-57706036ccf4	1eb5a6d3-b705-43fc-bed3-d5a935871d55	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-18T05:33:25.091Z
a1a41e3f-6877-4f32-8f3d-71122fe1af07	1eb5a6d3-b705-43fc-bed3-d5a935871d55	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-18T05:34:21.624Z
9f589c6d-124c-4004-86b7-18ee5a65640d	1eb5a6d3-b705-43fc-bed3-d5a935871d55	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-18T05:35:36.520Z
7ef91d3e-2a0d-4e7f-8518-cb5719caf0c9	1eb5a6d3-b705-43fc-bed3-d5a935871d55	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-18T05:36:21.691Z
adbf1347-5514-46d1-8b8d-6701cc40c934	981dcfb1-4a06-4073-9992-485306c2e51b	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-19T02:03:13.968Z
fda0f453-76df-498f-ac59-4b45d72fffb0	981dcfb1-4a06-4073-9992-485306c2e51b	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-19T02:04:00.618Z
f22bee71-3c0e-4263-b047-c766d376b209	981dcfb1-4a06-4073-9992-485306c2e51b	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-19T02:05:03.950Z
e444d4c6-e255-415a-bb6d-89a44accd75f	981dcfb1-4a06-4073-9992-485306c2e51b	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-19T02:06:12.864Z
4bc02df4-a17c-49a0-ac96-9274a10d96c0	981dcfb1-4a06-4073-9992-485306c2e51b	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-19T02:07:18.638Z
927d9dd6-3ffd-438c-bae0-82b643f347a7	981dcfb1-4a06-4073-9992-485306c2e51b	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-19T02:07:57.544Z
caa69dcb-6444-4ece-b9b9-23dcc4d36128	981dcfb1-4a06-4073-9992-485306c2e51b	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-19T02:08:56.538Z
da14cc0d-6507-482f-b7f9-7d682a991c9b	981dcfb1-4a06-4073-9992-485306c2e51b	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-19T02:10:08.900Z
74c6d891-7234-4396-946a-4a96c1f21772	f8c28efc-adc2-4491-aea1-4b111e09aa89	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-31T05:39:29.350Z
89ac7dfa-817c-46ef-b6f4-b83d0b5d7311	f8c28efc-adc2-4491-aea1-4b111e09aa89	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-31T05:40:36.709Z
b6c9ce64-71dc-4a78-a7d2-add5c73b47d1	f8c28efc-adc2-4491-aea1-4b111e09aa89	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-31T05:41:43.193Z
1cacb818-918b-49b6-9a5d-f2e4b2a19540	f8c28efc-adc2-4491-aea1-4b111e09aa89	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-31T05:42:32.291Z
5cf88e43-4acd-47a4-b9e3-d34334981edc	f8c28efc-adc2-4491-aea1-4b111e09aa89	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-31T05:43:32.935Z
ddac7938-7b23-47da-adcc-f2b50e30cdb6	f8c28efc-adc2-4491-aea1-4b111e09aa89	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-31T05:44:24.477Z
ff4f29a9-2154-44bb-b6cc-1f9d8670815c	f8c28efc-adc2-4491-aea1-4b111e09aa89	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-31T05:45:45.495Z
e266afef-b9dc-4611-a3e4-3c2776fc87b4	f8c28efc-adc2-4491-aea1-4b111e09aa89	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-31T05:46:40.181Z
e6cfe5eb-3595-44e9-9451-236fb41e0e7c	aff182af-61d1-41af-99e1-6c07f77be74d	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-29T05:59:14.692Z
ec8379a6-aa47-4a9b-a652-a4397ad1e172	aff182af-61d1-41af-99e1-6c07f77be74d	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-29T06:00:19.685Z
893c459d-ca67-498f-b339-a6f64ae64692	aff182af-61d1-41af-99e1-6c07f77be74d	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-29T06:01:30.643Z
79632686-0c1a-48ac-a4a0-d909ffa82971	aff182af-61d1-41af-99e1-6c07f77be74d	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-29T06:02:11.726Z
dcedffab-3b34-485e-84a4-5bb5341a5d67	aff182af-61d1-41af-99e1-6c07f77be74d	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-29T06:03:05.373Z
167d1588-dce0-4ef6-9da0-a1a8ffdc01a8	aff182af-61d1-41af-99e1-6c07f77be74d	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-29T06:04:20.646Z
0f2b3f96-545b-4240-968e-2077fa59ecc7	168b259d-f4a9-4b3b-9f6b-ebef2ae3dbb6	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-29T02:36:12.545Z
bef34207-d885-4260-9a2d-cc25ade3d387	168b259d-f4a9-4b3b-9f6b-ebef2ae3dbb6	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-29T02:36:56.438Z
18c2a6ac-98e7-4d3f-b343-76239345e154	168b259d-f4a9-4b3b-9f6b-ebef2ae3dbb6	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-29T02:37:50.761Z
677dc142-6d60-451f-937b-44561fd57d30	168b259d-f4a9-4b3b-9f6b-ebef2ae3dbb6	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-29T02:39:09.177Z
baff79f0-4a03-40dc-92a5-eb37a9fa708c	b5675b21-0cd4-4263-b8d1-827ee2a616b7	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-27T23:35:40.266Z
cff94960-fb4f-4faf-b3a0-dfa5e6f157bf	b5675b21-0cd4-4263-b8d1-827ee2a616b7	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-27T23:36:49.015Z
09df7f10-2e22-4692-bbaf-df98d3a3f032	b5675b21-0cd4-4263-b8d1-827ee2a616b7	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-27T23:38:01.413Z
48705d47-02ed-48cc-b30f-9ca81e1cfe08	b5675b21-0cd4-4263-b8d1-827ee2a616b7	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-27T23:38:38.634Z
19282068-a347-4eaf-9972-3af7659cca8d	d54f3f48-d9be-452f-89c1-5bf4e5bdaf28	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-17T00:22:15.884Z
0609cbc9-befa-4622-bce6-e9a2102aab34	d54f3f48-d9be-452f-89c1-5bf4e5bdaf28	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-17T00:23:08.594Z
6a8acdd5-7a71-4ec0-9735-ff416c50e595	d54f3f48-d9be-452f-89c1-5bf4e5bdaf28	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-17T00:24:19.361Z
bcd78440-e565-49ed-a828-23cd69cca3e1	d54f3f48-d9be-452f-89c1-5bf4e5bdaf28	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-17T00:24:54.806Z
36b43607-4eca-4474-bea8-5e6f38b2c1ba	d54f3f48-d9be-452f-89c1-5bf4e5bdaf28	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-17T00:26:18.646Z
977eba1d-7e9b-4e49-bbec-755b2c26b681	d54f3f48-d9be-452f-89c1-5bf4e5bdaf28	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-17T00:27:05.210Z
c21dab92-4fee-47f2-8847-09a3b53ee433	d54f3f48-d9be-452f-89c1-5bf4e5bdaf28	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-17T00:28:12.082Z
b6c375a0-9638-40ba-88f9-63e02e66987b	d54f3f48-d9be-452f-89c1-5bf4e5bdaf28	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-17T00:29:17.279Z
a23b067c-b696-474f-a16a-41855828c683	d54f3f48-d9be-452f-89c1-5bf4e5bdaf28	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-17T00:30:19.705Z
8b33b929-1654-48fd-b110-0e627f206f33	7ff89a91-9c5f-470b-bb28-566f6204ff59	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-23T04:20:47.095Z
f4392758-4d34-4219-8ed7-691dc3514c25	7ff89a91-9c5f-470b-bb28-566f6204ff59	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-23T04:21:57.075Z
14d78d2b-f6bb-4676-91c2-e0c26bf9ae0c	7ff89a91-9c5f-470b-bb28-566f6204ff59	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-23T04:22:58.093Z
1b367b5c-6b4e-4204-9fbd-dc9397ba5e0d	7ff89a91-9c5f-470b-bb28-566f6204ff59	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-23T04:24:06.274Z
0032ab31-f7e0-4228-b7c4-69b4c403d1f7	87e1287c-b476-4d99-81a0-2988adae6c22	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-28T15:05:43.807Z
d5a0133c-9bbd-4269-b6c6-86ccb86ccac3	87e1287c-b476-4d99-81a0-2988adae6c22	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-28T15:07:06.560Z
202daf4e-31cb-4c19-9343-1792897c4416	87e1287c-b476-4d99-81a0-2988adae6c22	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-28T15:07:58.678Z
d811ad23-dfcf-48cb-a501-a3b57a217b46	87e1287c-b476-4d99-81a0-2988adae6c22	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-28T15:09:11.503Z
0e0c458d-d10b-4b7d-9bbd-981b09961ad3	87e1287c-b476-4d99-81a0-2988adae6c22	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-28T15:09:42.943Z
995666e0-9309-43ec-b7f9-fc726f1c7c8a	87e1287c-b476-4d99-81a0-2988adae6c22	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-28T15:10:57.943Z
2fcde86c-3f3c-4f45-9164-d7fca6a30dfc	87e1287c-b476-4d99-81a0-2988adae6c22	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-28T15:11:44.699Z
31d24ecc-e443-48b0-827b-324eb3e05532	87e1287c-b476-4d99-81a0-2988adae6c22	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-28T15:12:43.551Z
06ae600d-f0d1-4075-bc4a-8b6d2466b62a	87e1287c-b476-4d99-81a0-2988adae6c22	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-28T15:13:55.684Z
be4fb3ea-87cb-429d-ba1f-65d179226c3a	0d98ad70-86a4-4f7c-abea-398451e58a3c	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-27T00:06:35.052Z
b991ed01-d674-4aec-a892-89606dd169b2	0d98ad70-86a4-4f7c-abea-398451e58a3c	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-27T00:07:24.772Z
518c6577-e1fe-4bea-bc38-2fb46b5df479	0d98ad70-86a4-4f7c-abea-398451e58a3c	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-27T00:08:39.047Z
05a0e6be-987a-40f4-97ed-eaa484660ddb	0d98ad70-86a4-4f7c-abea-398451e58a3c	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-27T00:09:18.207Z
eb840ebe-0fc9-4f8c-8098-f9f95054b15c	cb1b1ba9-706b-466b-bcf0-f854b4dfe676	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-27T07:14:13.353Z
4dfec40a-90cf-4bdf-a59b-e31c4a634a93	cb1b1ba9-706b-466b-bcf0-f854b4dfe676	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-27T07:15:08.805Z
65185a1b-37e3-4b65-b718-6b74e928e517	cb1b1ba9-706b-466b-bcf0-f854b4dfe676	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-27T07:16:25.418Z
694ef003-12e7-4d02-940e-494a319dc982	cb1b1ba9-706b-466b-bcf0-f854b4dfe676	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-27T07:17:14.107Z
eec8cfe4-17eb-4805-b128-08ca16ba1fb3	cb1b1ba9-706b-466b-bcf0-f854b4dfe676	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-27T07:18:12.076Z
ba6f255d-684f-4436-9c62-33143427a6e3	cb1b1ba9-706b-466b-bcf0-f854b4dfe676	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-27T07:19:22.786Z
14638320-2c2a-4fa2-a62a-1f1239748c47	cb1b1ba9-706b-466b-bcf0-f854b4dfe676	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-27T07:20:06.704Z
1f2d04fe-58bb-4be3-bee8-e6c630e830a0	cb1b1ba9-706b-466b-bcf0-f854b4dfe676	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-27T07:21:19.587Z
26d702f3-1fab-4467-bd14-cc4e0751223a	f67f6e80-be04-4cd1-a108-b095092ce0c4	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-22T11:39:52.115Z
8044d3a5-c52b-47a3-b156-eb2b40bb324c	f67f6e80-be04-4cd1-a108-b095092ce0c4	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-22T11:41:03.965Z
b0e81dac-80ce-4af5-8d50-1d559947e71b	f67f6e80-be04-4cd1-a108-b095092ce0c4	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-22T11:41:40.295Z
567d8f64-f9fd-46f3-ad14-197c51e67eb3	f67f6e80-be04-4cd1-a108-b095092ce0c4	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-22T11:42:53.850Z
7d09be45-8ccc-44db-a055-931e7ca7fe0e	f67f6e80-be04-4cd1-a108-b095092ce0c4	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-22T11:43:52.840Z
062cd1d0-bc1c-477f-898f-49ec00b97574	f67f6e80-be04-4cd1-a108-b095092ce0c4	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-22T11:45:03.999Z
72f0889b-d7bc-4f73-928b-fe6c0e32ead8	f67f6e80-be04-4cd1-a108-b095092ce0c4	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-22T11:45:46.848Z
c3d85371-595e-4e03-8037-413fa2f1e7ca	f67f6e80-be04-4cd1-a108-b095092ce0c4	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-22T11:46:45.625Z
34f0413d-0fd3-4b62-b6ee-a9fe3f3dfd50	53517658-95d0-4ad9-9cc6-7c3093d0af9e	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-20T17:16:53.636Z
e30669c5-22ab-45b6-8fc6-29d8d200e5f1	53517658-95d0-4ad9-9cc6-7c3093d0af9e	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-20T17:17:54.750Z
262dd2bc-37fe-44bb-82ac-dc2ec9b2fd2a	53517658-95d0-4ad9-9cc6-7c3093d0af9e	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-20T17:19:05.654Z
42c8538f-2742-4b18-8f68-9816c3c8cd30	53517658-95d0-4ad9-9cc6-7c3093d0af9e	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-20T17:19:44.572Z
75917abd-4656-4733-976a-97c8acae1883	c5120210-b7fb-48b3-9f4a-ebc8b6f52c35	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-23T21:51:26.136Z
3e29eb6d-82f8-4f19-b9e9-3a742ce15286	c5120210-b7fb-48b3-9f4a-ebc8b6f52c35	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-23T21:52:35.792Z
2bb87032-f66e-405b-91f5-1b6921fb88df	c5120210-b7fb-48b3-9f4a-ebc8b6f52c35	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-23T21:53:29.118Z
3d5b3349-6068-439a-85bb-bb1fdaa38b92	c5120210-b7fb-48b3-9f4a-ebc8b6f52c35	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-23T21:54:29.206Z
b32683ba-2c99-48aa-afd2-5c7068f8c6f5	c5120210-b7fb-48b3-9f4a-ebc8b6f52c35	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-23T21:55:23.175Z
90285ca1-9db2-4f0d-b5f3-228d144db3cd	c5120210-b7fb-48b3-9f4a-ebc8b6f52c35	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-23T21:56:35.848Z
462e2625-96f1-4bbd-bfc2-e5fdb31efc74	06bfc72e-e842-4fe5-81bc-c5d1f8ea4d91	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-24T14:46:57.344Z
00f10b63-9983-4179-9713-5b78b630481c	06bfc72e-e842-4fe5-81bc-c5d1f8ea4d91	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-24T14:48:18.346Z
55ce15f5-96e2-41f1-acbc-0ab63e06da74	06bfc72e-e842-4fe5-81bc-c5d1f8ea4d91	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-24T14:49:00.784Z
c16c28af-c6d9-4a8d-8429-1221850c31cb	06bfc72e-e842-4fe5-81bc-c5d1f8ea4d91	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-24T14:50:00.372Z
7ef24eb2-5d4f-44e8-bfa3-41ad6f7c635a	06bfc72e-e842-4fe5-81bc-c5d1f8ea4d91	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-24T14:51:07.157Z
5a810d25-690d-40a3-b551-3b57277f7b33	06bfc72e-e842-4fe5-81bc-c5d1f8ea4d91	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-24T14:51:57.761Z
e3db4247-76e4-4128-bee5-cde1ddca2934	70ff4cfd-e045-432b-8126-6147398abf3f	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-24T12:59:54.439Z
247619be-27c3-44f3-8009-d51b7673b6fa	70ff4cfd-e045-432b-8126-6147398abf3f	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-24T13:00:51.752Z
f1c71f84-4b58-42b0-9135-dfabfb39cbef	70ff4cfd-e045-432b-8126-6147398abf3f	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-24T13:01:50.636Z
ffae782e-2221-4abc-a848-327ded74c164	70ff4cfd-e045-432b-8126-6147398abf3f	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-24T13:02:46.797Z
a49b8d83-4ece-49bb-9278-d1c9e3fc48b4	11c21a9a-3f2d-40b6-b8b9-c09cc7ce0958	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-14T02:19:19.578Z
5e0b340b-32ea-48c2-9244-3be12ec67bb9	11c21a9a-3f2d-40b6-b8b9-c09cc7ce0958	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-14T02:20:22.385Z
0793248b-d1df-4df0-a114-083f4bf5357f	11c21a9a-3f2d-40b6-b8b9-c09cc7ce0958	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-14T02:20:55.983Z
23e80aad-fd97-4e95-b519-c724fb2589ec	11c21a9a-3f2d-40b6-b8b9-c09cc7ce0958	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-14T02:22:15.614Z
97f67b4b-fd7f-4994-b3f6-d8b517efad3b	11c21a9a-3f2d-40b6-b8b9-c09cc7ce0958	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-14T02:23:12.506Z
17335c34-cae3-4e43-9822-341a1b8c7948	11c21a9a-3f2d-40b6-b8b9-c09cc7ce0958	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-14T02:24:02.020Z
dd9aa996-a16a-4c81-adb5-b5f34bfd15f5	11c21a9a-3f2d-40b6-b8b9-c09cc7ce0958	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-14T02:24:58.258Z
d0bfafc1-8499-489e-8810-a751b26bfdf8	11c21a9a-3f2d-40b6-b8b9-c09cc7ce0958	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-14T02:26:20.595Z
8a7d6589-be62-45b1-bf73-fa3ed2bbe98c	11c21a9a-3f2d-40b6-b8b9-c09cc7ce0958	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-14T02:26:55.873Z
0158f822-0cdf-4fba-8376-4528cc296b3f	39e351c4-8963-455e-ae28-f3b6c62080da	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-18T10:06:39.987Z
bc7b8e82-5e75-4fa5-b8a2-150a16aff665	39e351c4-8963-455e-ae28-f3b6c62080da	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-18T10:07:32.072Z
dd1074df-96b3-4568-8b90-a475b8b197c9	39e351c4-8963-455e-ae28-f3b6c62080da	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-18T10:08:51.148Z
ef57ed37-8b60-4dc4-8a4f-24d8ef16ccca	39e351c4-8963-455e-ae28-f3b6c62080da	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-18T10:09:57.274Z
0d8a1739-4d3b-42a5-ade3-ea959b13ed7d	39e351c4-8963-455e-ae28-f3b6c62080da	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-18T10:10:41.061Z
6186ea00-13e2-48dd-bfb8-670585843fec	39e351c4-8963-455e-ae28-f3b6c62080da	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-18T10:11:46.204Z
1ec0dd20-3e54-4427-860b-7452356d6628	39e351c4-8963-455e-ae28-f3b6c62080da	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-18T10:12:37.928Z
d7fa5c43-b15e-4e06-bd2a-e18bf83cfbf5	39e351c4-8963-455e-ae28-f3b6c62080da	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-18T10:13:33.594Z
91fb44cf-34e6-48cc-8f0d-bd95bdb2282d	39e351c4-8963-455e-ae28-f3b6c62080da	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-18T10:14:33.566Z
9a931807-c7eb-45c2-95c6-83419f0e2218	71591e8d-914c-42ac-a2f7-18b9b4669469	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-17T00:54:27.597Z
42fa3c13-6664-4a86-8bea-c059bbe43d84	71591e8d-914c-42ac-a2f7-18b9b4669469	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-17T00:55:21.871Z
8187621f-9045-4d9c-8f2d-acbe10eecddd	71591e8d-914c-42ac-a2f7-18b9b4669469	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-17T00:56:23.261Z
d157308e-4d9c-46d7-9a90-8223d80de3da	71591e8d-914c-42ac-a2f7-18b9b4669469	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-17T00:57:13.771Z
9dc65042-a0e1-47e7-95c6-0a424d4123dc	4ace2d6d-e177-4cfa-b89f-00f0fcc13c28	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-26T13:00:45.008Z
5622123b-8aa2-4594-a671-002615d85b68	4ace2d6d-e177-4cfa-b89f-00f0fcc13c28	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-26T13:01:51.553Z
640f0b85-da80-4dc9-97ec-c6297ce47e07	4ace2d6d-e177-4cfa-b89f-00f0fcc13c28	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-26T13:02:45.569Z
83bdaa01-181c-4f77-9c7f-8e8302a822f3	4ace2d6d-e177-4cfa-b89f-00f0fcc13c28	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-26T13:03:43.489Z
415b5722-24fd-4a39-b853-707667b4552e	4ace2d6d-e177-4cfa-b89f-00f0fcc13c28	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-26T13:04:47.268Z
a79d81f5-cae7-4050-9d5d-6925e55f511f	4ace2d6d-e177-4cfa-b89f-00f0fcc13c28	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-26T13:05:48.136Z
7f92bc1f-2a43-4b7f-8d2c-4ca5948a6dcc	2fa0e68a-8314-4eb3-9321-62e74f8ea0f5	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-29T04:47:30.588Z
80668088-947a-4aea-b2ae-7c60f1c835ef	2fa0e68a-8314-4eb3-9321-62e74f8ea0f5	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-29T04:48:16.891Z
69d4cda5-24a1-454c-b8a6-8c2d54098e25	2fa0e68a-8314-4eb3-9321-62e74f8ea0f5	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-29T04:49:38.532Z
5bed590f-8fd0-4a50-9039-c9945d3af374	2fa0e68a-8314-4eb3-9321-62e74f8ea0f5	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-29T04:50:15.795Z
16b6d222-08af-4b9b-945c-2bdea0be3224	2fa0e68a-8314-4eb3-9321-62e74f8ea0f5	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-29T04:51:10.770Z
e7291e95-4e29-4dc0-88fa-d56d3320bab4	2fa0e68a-8314-4eb3-9321-62e74f8ea0f5	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-29T04:52:22.971Z
40332388-da6c-4da2-825c-812c5937b7f0	2fa0e68a-8314-4eb3-9321-62e74f8ea0f5	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-29T04:53:37.167Z
1d00ec72-79c5-43bb-beeb-bd7fda4508f9	2fa0e68a-8314-4eb3-9321-62e74f8ea0f5	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-29T04:54:26.151Z
27393c4a-4c61-40c0-b9df-df199a0a52d9	46ee4ea0-9831-4b41-9942-37f79479d88d	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-19T06:37:39.234Z
47e51894-b1b0-4e43-bc4c-811f3811f90e	46ee4ea0-9831-4b41-9942-37f79479d88d	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-19T06:38:37.278Z
6ce0211a-3f51-4d89-a2e6-40349d44b781	46ee4ea0-9831-4b41-9942-37f79479d88d	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-19T06:39:23.748Z
e9601186-199a-48cb-90b4-6f526deed0d5	46ee4ea0-9831-4b41-9942-37f79479d88d	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-19T06:40:36.898Z
58421df1-82dc-4486-a7ac-01f4b89c7a37	46ee4ea0-9831-4b41-9942-37f79479d88d	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-19T06:41:30.484Z
dde5c27a-a8b7-4e3e-b491-cdaf200bb39c	46ee4ea0-9831-4b41-9942-37f79479d88d	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-19T06:42:34.871Z
517ea021-ffe9-4025-b64c-d31d9d057c2d	46ee4ea0-9831-4b41-9942-37f79479d88d	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-19T06:43:33.231Z
bf2d96b0-37bd-428e-a3e1-47c35f802304	46ee4ea0-9831-4b41-9942-37f79479d88d	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-19T06:44:50.182Z
e96d22df-cad8-45cb-868a-f55fd78b25f8	d031ee6c-00a4-4d7b-a365-285713812af6	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-22T07:21:33.452Z
cb56b39b-1282-4c4c-8acf-78e999cd5e17	d031ee6c-00a4-4d7b-a365-285713812af6	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-22T07:22:47.461Z
08a4fbd8-30e5-45d8-af1b-6c813fae36f2	d031ee6c-00a4-4d7b-a365-285713812af6	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-22T07:23:50.057Z
56d10232-c84a-4acf-85c1-45460e444c4e	d031ee6c-00a4-4d7b-a365-285713812af6	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-22T07:24:39.815Z
3273b708-bc4a-451e-8351-60c4d3bb9fd2	be573900-a2dd-4ce7-9172-10550a255d4d	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-04-01T02:16:57.284Z
ad4c35d8-6ebe-40ce-9057-e267544b6058	be573900-a2dd-4ce7-9172-10550a255d4d	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-04-01T02:17:44.348Z
0ab38cca-f6fb-48df-afba-05569e340164	be573900-a2dd-4ce7-9172-10550a255d4d	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-04-01T02:19:04.069Z
fc4632df-6f15-4fe1-b5ba-fbdae0e827b4	be573900-a2dd-4ce7-9172-10550a255d4d	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-04-01T02:19:58.434Z
2b102b15-3db8-4bda-8db0-8a4a17c82992	be573900-a2dd-4ce7-9172-10550a255d4d	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-04-01T02:21:06.460Z
aa9f8af6-f05a-4189-aa4e-49926092f2b9	be573900-a2dd-4ce7-9172-10550a255d4d	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-04-01T02:22:04.581Z
da10d29a-a847-497c-8db2-e26a32c994e3	e752be8c-4dc3-49e9-8316-ba4d1805f672	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-14T04:36:37.938Z
3c352be8-4335-4411-8535-ad5a538f61e6	e752be8c-4dc3-49e9-8316-ba4d1805f672	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-14T04:37:26.832Z
6d7a2a45-4adc-4415-a953-5126e4df0150	e752be8c-4dc3-49e9-8316-ba4d1805f672	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-14T04:38:28.881Z
26cc4638-7362-4ceb-8070-6452419d1e02	e752be8c-4dc3-49e9-8316-ba4d1805f672	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-14T04:39:24.312Z
421a72fb-20d7-4d51-a59e-5f35b0a3cea0	e752be8c-4dc3-49e9-8316-ba4d1805f672	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-14T04:40:42.042Z
44a556ae-5f3f-44c9-a8e4-ded4415910fb	e752be8c-4dc3-49e9-8316-ba4d1805f672	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-14T04:41:32.460Z
96f7610a-994e-4174-98d0-4e7e52552726	e752be8c-4dc3-49e9-8316-ba4d1805f672	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-14T04:42:29.281Z
a1da303b-e14e-4aa1-b2e0-ef5eabf23bfc	e752be8c-4dc3-49e9-8316-ba4d1805f672	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-14T04:43:44.451Z
caceb93e-8484-478a-93a4-2666208ba7e1	e752be8c-4dc3-49e9-8316-ba4d1805f672	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-14T04:44:47.427Z
3f7d1574-8c36-48fc-96b2-ebe8919f9db9	9f206e28-6695-469b-9269-b76f7e147af2	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-25T22:40:02.553Z
e5dc3864-bd4f-45bd-98a6-e897f306cdb6	9f206e28-6695-469b-9269-b76f7e147af2	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-25T22:40:55.914Z
f4a2ec4e-a829-4415-a67f-7240df0210c1	9f206e28-6695-469b-9269-b76f7e147af2	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-25T22:41:54.388Z
8570005f-4d32-4f41-a794-1c35514f7d55	9f206e28-6695-469b-9269-b76f7e147af2	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-25T22:43:15.185Z
ccb5bfc7-3c4a-4e04-95a1-2b4d41e590e8	9f206e28-6695-469b-9269-b76f7e147af2	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-25T22:43:50.496Z
4920b775-fa65-4df7-b29a-0e1948ca0f5f	9f206e28-6695-469b-9269-b76f7e147af2	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-25T22:44:56.696Z
c6c334fe-dc01-4c29-a8bb-682576e55bba	bd13fb42-9e16-4800-bfab-9cce3e6cf079	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-20T10:27:28.875Z
f2c17747-f0ae-419a-92c0-51d74ce50cd6	bd13fb42-9e16-4800-bfab-9cce3e6cf079	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-20T10:28:39.416Z
d29f9768-23ff-4636-8c35-498f2da25a32	bd13fb42-9e16-4800-bfab-9cce3e6cf079	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-20T10:29:39.291Z
5615c3fc-f606-47d8-b453-d99511c763f0	bd13fb42-9e16-4800-bfab-9cce3e6cf079	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-20T10:30:25.383Z
457f972f-e0e8-4a26-86c2-a91bc1bf6982	bd13fb42-9e16-4800-bfab-9cce3e6cf079	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-20T10:31:37.057Z
f64dd81e-9cad-4dca-88cb-ac2f39e9fa56	bd13fb42-9e16-4800-bfab-9cce3e6cf079	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-20T10:32:23.652Z
825dd633-5574-4bd4-8e4a-566b7e7b176d	bd13fb42-9e16-4800-bfab-9cce3e6cf079	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-20T10:33:26.157Z
985ca246-b368-45fc-a871-075343f057bc	bd13fb42-9e16-4800-bfab-9cce3e6cf079	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-20T10:34:24.931Z
ddd93b5e-2dd4-4084-b5a6-cb4e4e6613aa	bd13fb42-9e16-4800-bfab-9cce3e6cf079	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-20T10:35:47.198Z
dd24a406-7e1c-4e21-8f74-7fcc6b116817	50ee2d5c-6574-4ce7-b9b6-78c4dcf9b6b4	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-04-02T08:18:29.939Z
cd768ebf-3349-4c80-a96c-b007d7f5e236	50ee2d5c-6574-4ce7-b9b6-78c4dcf9b6b4	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-04-02T08:19:15.744Z
93ae7897-0c7e-476c-9ed7-c8a164a90294	50ee2d5c-6574-4ce7-b9b6-78c4dcf9b6b4	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-04-02T08:20:32.839Z
d697a06c-feff-43ee-ab4e-25fb374d94a0	50ee2d5c-6574-4ce7-b9b6-78c4dcf9b6b4	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-04-02T08:21:21.302Z
10621857-f6b8-4a67-9752-a25e29766c9b	50ee2d5c-6574-4ce7-b9b6-78c4dcf9b6b4	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-04-02T08:22:26.068Z
572327bf-f5dd-4f39-bc99-3595071fe99c	50ee2d5c-6574-4ce7-b9b6-78c4dcf9b6b4	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-04-02T08:23:20.166Z
0c753c82-045d-4b0e-a924-8a5bb1a8a0b6	50ee2d5c-6574-4ce7-b9b6-78c4dcf9b6b4	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-04-02T08:24:32.743Z
5e5f29fa-a4ae-415d-8905-6750a157ab0e	50ee2d5c-6574-4ce7-b9b6-78c4dcf9b6b4	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-04-02T08:25:28.885Z
51cf68e5-daa5-4f45-918c-5b39d4a44e05	4f93d7fc-54b2-4081-8abe-7790c10a258a	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-14T20:30:48.396Z
c571d1d6-d6a8-4c00-abbf-1ba36d968ead	4f93d7fc-54b2-4081-8abe-7790c10a258a	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-14T20:31:51.075Z
155ca42c-89b9-4635-9bb7-840f3a946a53	4f93d7fc-54b2-4081-8abe-7790c10a258a	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-14T20:32:56.511Z
a61b4cbc-1fb6-4373-b4ee-eb4af8c0259e	4f93d7fc-54b2-4081-8abe-7790c10a258a	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-14T20:33:53.846Z
84adb11a-a934-46b1-ba40-299f5755c699	4f93d7fc-54b2-4081-8abe-7790c10a258a	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-14T20:34:49.343Z
aff97f65-81b8-4edd-8542-d6251981d0d0	4f93d7fc-54b2-4081-8abe-7790c10a258a	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-14T20:36:04.646Z
fdfc2de1-f398-4b0d-b304-454c320a2095	4f93d7fc-54b2-4081-8abe-7790c10a258a	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-14T20:36:54.721Z
353d4267-4f3e-4f9f-bf41-48a5cf7dab4f	4f93d7fc-54b2-4081-8abe-7790c10a258a	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-14T20:38:06.671Z
b5d33e11-acd5-4881-8d67-5ac2987ec260	4f93d7fc-54b2-4081-8abe-7790c10a258a	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-14T20:38:55.990Z
1384f74a-5d58-403a-a649-8305b0c85436	103bc744-76c6-4948-ab03-f9ecd80602ae	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-29T04:02:37.373Z
3b0456ff-e082-40c8-8769-65cb1aaa2c5f	103bc744-76c6-4948-ab03-f9ecd80602ae	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-29T04:03:46.644Z
60875784-e9a3-4662-9a06-134046f81abe	103bc744-76c6-4948-ab03-f9ecd80602ae	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-29T04:04:34.031Z
5afc2068-e451-40ea-89a3-98235a05f32d	103bc744-76c6-4948-ab03-f9ecd80602ae	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-29T04:05:30.601Z
747a20c3-a108-447b-a51c-c22c6e903521	103bc744-76c6-4948-ab03-f9ecd80602ae	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-29T04:06:49.821Z
73d18f5b-e28d-4f2b-a02c-c17b0676cb37	103bc744-76c6-4948-ab03-f9ecd80602ae	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-29T04:07:32.598Z
cadaf883-cce7-4a79-bedb-54df688d785a	bd6e86ec-a4d8-4291-8dc9-4fff7b980c2b	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-17T18:28:57.274Z
6caf9e50-6dcc-48b6-af24-e102aad42754	bd6e86ec-a4d8-4291-8dc9-4fff7b980c2b	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-17T18:29:53.644Z
4bc0ca58-e989-4317-940a-c953e27cf566	bd6e86ec-a4d8-4291-8dc9-4fff7b980c2b	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-17T18:31:03.199Z
34ebaa14-55fa-4c1d-9c4e-e6022acce17f	bd6e86ec-a4d8-4291-8dc9-4fff7b980c2b	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-17T18:31:54.211Z
5896af0a-68c7-49f3-b454-d7e267253572	bd6e86ec-a4d8-4291-8dc9-4fff7b980c2b	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-17T18:32:52.306Z
5fe29c8f-b915-488a-9f2d-3ff4cfc37696	bd6e86ec-a4d8-4291-8dc9-4fff7b980c2b	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-17T18:33:55.344Z
3d3f3fd8-072d-4ed1-b9a6-f4bef025dfb4	bd6e86ec-a4d8-4291-8dc9-4fff7b980c2b	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-17T18:35:08.650Z
df9ab1e9-912b-4629-a183-8f6d865eff96	bd6e86ec-a4d8-4291-8dc9-4fff7b980c2b	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-17T18:35:58.046Z
f8cb3c8c-5a96-4366-9e24-17b4a74f8f4a	dd58a0d9-3bdc-47bf-9651-27ee0cbf9da6	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-29T10:22:39.560Z
4d665b14-ef9d-4888-a7f8-3390fcf65fb2	dd58a0d9-3bdc-47bf-9651-27ee0cbf9da6	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-29T10:23:35.964Z
96747888-d8ef-438e-923e-c1983fb4c308	dd58a0d9-3bdc-47bf-9651-27ee0cbf9da6	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-29T10:24:39.872Z
69e5d0d4-3032-4cad-a640-63b48f28fe64	dd58a0d9-3bdc-47bf-9651-27ee0cbf9da6	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-29T10:25:53.509Z
a73b8ec7-45dc-4e31-ad51-0bd573ce4822	dd58a0d9-3bdc-47bf-9651-27ee0cbf9da6	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-29T10:26:52.560Z
90547c6e-1160-4f4c-bb3e-1bc0b7ae1c96	dd58a0d9-3bdc-47bf-9651-27ee0cbf9da6	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-29T10:27:33.886Z
e1beee13-712c-4524-a5ef-19c4b0cd0942	dd58a0d9-3bdc-47bf-9651-27ee0cbf9da6	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-29T10:29:00.011Z
bd5611ea-ed90-4da3-8645-8180753ff680	dd58a0d9-3bdc-47bf-9651-27ee0cbf9da6	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-29T10:29:58.675Z
795ddab0-aa82-46be-b1c1-be2d5df5ab06	53319125-7904-4b24-a599-984aad6a5cc5	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-21T08:31:05.452Z
b8d6c4dc-4fcd-46c6-be40-b2a23fd66c06	53319125-7904-4b24-a599-984aad6a5cc5	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-21T08:32:10.923Z
5ae6b368-48c3-42f0-9b01-1521e2b05650	53319125-7904-4b24-a599-984aad6a5cc5	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-21T08:32:50.310Z
a5a3dacc-46d7-48e2-a7b4-de9be78466e0	53319125-7904-4b24-a599-984aad6a5cc5	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-21T08:34:01.319Z
2b2ba8c8-424c-4181-8b9a-e5f8f479de7d	53319125-7904-4b24-a599-984aad6a5cc5	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-21T08:35:16.051Z
f74bab05-1ef2-43e6-ac5e-13c343e40795	53319125-7904-4b24-a599-984aad6a5cc5	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-21T08:36:13.605Z
a858a116-dd61-4c5a-a925-e2a66e57c5ae	727c4946-830e-42cd-a54e-9f477ee9f881	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-18T16:49:07.484Z
861824da-e342-4cda-b93b-35415a5a55dc	727c4946-830e-42cd-a54e-9f477ee9f881	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-18T16:50:15.887Z
ac5d3b69-74e9-4a9b-a9f7-dfc63923cbb2	727c4946-830e-42cd-a54e-9f477ee9f881	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-18T16:51:25.189Z
eac49d67-f4b5-4429-8b1a-f72cdf3af8b8	727c4946-830e-42cd-a54e-9f477ee9f881	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-18T16:52:19.346Z
f0069f6f-09eb-4938-aca8-4a8555952186	727c4946-830e-42cd-a54e-9f477ee9f881	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-18T16:53:21.644Z
167d06ed-2739-48ed-9aca-a4336e0d80e3	727c4946-830e-42cd-a54e-9f477ee9f881	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-18T16:54:21.342Z
2a5fe33d-2bfe-4721-8d4a-f19e59ef8838	727c4946-830e-42cd-a54e-9f477ee9f881	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-18T16:55:18.536Z
45b1b1e8-78a6-479a-993f-a9946290abf5	727c4946-830e-42cd-a54e-9f477ee9f881	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-18T16:56:21.237Z
b4d844d3-1941-4e2f-957c-0d2fd739f9fe	727c4946-830e-42cd-a54e-9f477ee9f881	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-18T16:57:22.108Z
7bd5c45e-96e2-496d-a900-7dfbe78401f1	c0533d5e-e3a2-4716-bdc6-f99cc6c3d853	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-24T15:41:12.612Z
c214e4ff-3d25-4b59-8d0f-1b384e12fc40	c0533d5e-e3a2-4716-bdc6-f99cc6c3d853	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-24T15:42:19.672Z
39d14bcf-56cf-47c4-9c26-250cd1745a52	c0533d5e-e3a2-4716-bdc6-f99cc6c3d853	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-24T15:43:04.750Z
4c8b9e06-faca-4803-8214-c8443eae0578	c0533d5e-e3a2-4716-bdc6-f99cc6c3d853	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-24T15:43:53.206Z
b708128f-5097-4d1d-b736-1a0507007739	c0533d5e-e3a2-4716-bdc6-f99cc6c3d853	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-24T15:45:07.051Z
5702d89d-45c2-443e-bb4b-30e5126f40b0	c0533d5e-e3a2-4716-bdc6-f99cc6c3d853	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-24T15:46:08.020Z
066bf832-ef13-4ea4-8a2f-4ad583e85d6c	eb43ffa2-3b63-43a7-a3c3-66d9f7fc76dd	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-18T09:29:04.612Z
93c64b14-72ff-48a9-a721-341eef01e5ee	eb43ffa2-3b63-43a7-a3c3-66d9f7fc76dd	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-18T09:29:45.803Z
2bc69b99-91aa-4c2e-be3f-2b35a61340ea	eb43ffa2-3b63-43a7-a3c3-66d9f7fc76dd	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-18T09:30:39.151Z
fefffa34-6549-4348-91d9-423b6a7622e2	eb43ffa2-3b63-43a7-a3c3-66d9f7fc76dd	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-18T09:31:57.089Z
dcdb6bf3-ced9-4848-b692-4167322155c3	eb43ffa2-3b63-43a7-a3c3-66d9f7fc76dd	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-18T09:33:01.091Z
b1cbf3b4-2e21-45ea-a88b-3ef9da5a738b	eb43ffa2-3b63-43a7-a3c3-66d9f7fc76dd	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-18T09:33:43.183Z
f090d4cd-e237-4e29-84b0-3f04e5365783	888ef8e4-fba5-4e1a-8e26-5fb49551221e	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-16T16:20:22.755Z
b1728ae4-6b27-4af8-99da-89b6175ef968	888ef8e4-fba5-4e1a-8e26-5fb49551221e	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-16T16:21:20.330Z
b6408537-2366-429c-87d5-a631771fa3e7	888ef8e4-fba5-4e1a-8e26-5fb49551221e	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-16T16:22:38.768Z
266f19bd-4af2-4380-943b-f708bf4d2e70	888ef8e4-fba5-4e1a-8e26-5fb49551221e	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-16T16:23:41.087Z
90089c03-e93d-4246-9fe5-88a2605ddf43	888ef8e4-fba5-4e1a-8e26-5fb49551221e	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-16T16:24:42.671Z
21af99c8-f5fe-43b5-aacc-cca7f999a352	888ef8e4-fba5-4e1a-8e26-5fb49551221e	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-16T16:25:18.161Z
b6a3a6d1-a7c0-484d-a658-3fbe59e20896	cb815a38-a090-44b2-a527-aee425f2be02	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-18T12:23:43.673Z
74f0ca0c-cd72-46fe-a88c-33ed3a6ed68e	cb815a38-a090-44b2-a527-aee425f2be02	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-18T12:24:54.118Z
a71ddc43-e169-43fa-8908-44ed7c7a6b27	cb815a38-a090-44b2-a527-aee425f2be02	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-18T12:25:55.456Z
90cd1adb-a670-42c4-b9a3-faaed8f7ef6d	cb815a38-a090-44b2-a527-aee425f2be02	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-18T12:26:49.767Z
52a36d6f-f58b-4643-849c-04d0554203da	cb815a38-a090-44b2-a527-aee425f2be02	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-18T12:27:31.034Z
b9dea2f8-00ee-4d5b-9b08-b426814b14ff	cb815a38-a090-44b2-a527-aee425f2be02	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-18T12:28:27.827Z
bde53e63-cc60-42ed-ad6b-c2c6b79f1cc5	3c23c3d2-8de1-45f2-b152-e5d3fd38e586	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-14T08:49:22.159Z
b5af91ce-dfe5-4c01-8631-3488919e1533	3c23c3d2-8de1-45f2-b152-e5d3fd38e586	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-14T08:50:25.633Z
c47a3362-ae1a-411d-9d9f-44da4dc1d0e0	3c23c3d2-8de1-45f2-b152-e5d3fd38e586	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-14T08:51:29.250Z
2ff07f87-5a66-4f5c-9fc8-0e4d801e51f3	3c23c3d2-8de1-45f2-b152-e5d3fd38e586	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-14T08:52:20.957Z
54e68031-7571-4a72-9654-04c16008e953	3c23c3d2-8de1-45f2-b152-e5d3fd38e586	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-14T08:53:14.184Z
d96d2ae1-a3cb-4cc4-989c-a056d5cedb7a	3c23c3d2-8de1-45f2-b152-e5d3fd38e586	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-14T08:54:25.755Z
e3fff513-a550-4a38-93bd-8d14301b1732	6c9ed46c-a6ac-46b9-8e8e-e4313732dc79	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-30T05:11:52.145Z
1dd45ce5-db8a-4034-9603-09f612507d32	6c9ed46c-a6ac-46b9-8e8e-e4313732dc79	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-30T05:12:40.632Z
0415a39d-6632-4a75-8140-459c992bf5de	6c9ed46c-a6ac-46b9-8e8e-e4313732dc79	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-30T05:13:54.202Z
30bf88bc-456a-47ca-8cb2-76ec8821401c	6c9ed46c-a6ac-46b9-8e8e-e4313732dc79	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-30T05:15:04.299Z
92be1d63-6702-471b-b2df-50f746d478fa	8e08ae69-9232-49f9-b567-3f950b8754c6	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-28T04:37:11.509Z
577f1a33-a49a-4b5d-aad2-580953430641	8e08ae69-9232-49f9-b567-3f950b8754c6	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-28T04:37:57.471Z
7e04a882-5b43-4f18-ac56-ec714dfd6646	8e08ae69-9232-49f9-b567-3f950b8754c6	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-28T04:39:00.796Z
71925c6c-95c2-48b1-b4de-9747ff206bcf	8e08ae69-9232-49f9-b567-3f950b8754c6	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-28T04:40:14.725Z
9f47e70b-4391-4bef-936d-f1a5c590ab4d	a871e9ae-8b83-4992-9b0a-ecd4585422b9	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-29T05:50:32.857Z
00f61e56-b68f-43af-9e9e-ca6650c81c2d	a871e9ae-8b83-4992-9b0a-ecd4585422b9	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-29T05:51:40.161Z
20b86370-f379-48da-aa2f-468e1dee059a	a871e9ae-8b83-4992-9b0a-ecd4585422b9	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-29T05:52:32.329Z
c15f61db-ef0b-46b4-adae-668d668c35e6	a871e9ae-8b83-4992-9b0a-ecd4585422b9	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-29T05:54:00.242Z
bddaacf1-12d1-4165-bc08-c07dd22ee5ae	a871e9ae-8b83-4992-9b0a-ecd4585422b9	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-29T05:54:46.485Z
d47d549c-517a-45ba-8f45-0a407e0ca2ba	a871e9ae-8b83-4992-9b0a-ecd4585422b9	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-29T05:55:45.229Z
c673d528-d99d-4fe1-aae9-f1e50a7fc8b0	a871e9ae-8b83-4992-9b0a-ecd4585422b9	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-29T05:56:40.704Z
40d7b868-12b9-4f38-a11f-f0c5b46b5caf	a871e9ae-8b83-4992-9b0a-ecd4585422b9	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-29T05:57:52.825Z
18a785a1-3304-432c-92fb-c95073e47d8e	a871e9ae-8b83-4992-9b0a-ecd4585422b9	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-29T05:58:51.786Z
faad0ec0-145a-4bef-9a80-d0e4ff0c45b7	d629c11b-f646-47d0-ae00-9901cd21a7ae	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-28T04:29:41.373Z
178b70d5-f4db-4ade-8744-c204d5233030	d629c11b-f646-47d0-ae00-9901cd21a7ae	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-28T04:30:51.030Z
c1f64aa0-e095-4a19-93b9-5aa2762fe63b	d629c11b-f646-47d0-ae00-9901cd21a7ae	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-28T04:31:58.033Z
c05c267d-0f94-4d1b-9de2-37f367527a70	d629c11b-f646-47d0-ae00-9901cd21a7ae	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-28T04:32:54.614Z
daf519bb-9610-45a2-ae0b-884781576ade	d629c11b-f646-47d0-ae00-9901cd21a7ae	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-28T04:33:45.091Z
badad458-1264-497c-8a1f-61c0e1584c78	d629c11b-f646-47d0-ae00-9901cd21a7ae	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-28T04:35:01.735Z
06d9432b-0d3d-42b4-b826-485e2d49d126	23f3760a-929a-45d5-8a89-d7d478f5ad2b	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-30T04:14:06.140Z
a65726fb-3aa9-46f6-90f2-28fab5a42130	23f3760a-929a-45d5-8a89-d7d478f5ad2b	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-30T04:14:48.679Z
39667dc8-bf5c-46dd-aace-1d6083460c7c	23f3760a-929a-45d5-8a89-d7d478f5ad2b	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-30T04:15:58.329Z
fb298cca-1cdb-46e6-bb0f-1db9e7b612fb	23f3760a-929a-45d5-8a89-d7d478f5ad2b	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-30T04:16:52.408Z
bea97bb2-0d6c-433a-9dc4-6453a47d8290	23f3760a-929a-45d5-8a89-d7d478f5ad2b	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-30T04:18:02.342Z
d3dc7d6c-ae69-4ee3-98fb-8b4556981d02	23f3760a-929a-45d5-8a89-d7d478f5ad2b	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-30T04:18:58.890Z
3633ef9c-f58a-418a-a528-d9831f729cb9	23f3760a-929a-45d5-8a89-d7d478f5ad2b	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-30T04:19:46.367Z
a0b411d1-8d3c-44b6-b91f-1b0029d557fd	23f3760a-929a-45d5-8a89-d7d478f5ad2b	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-30T04:20:37.899Z
51223f34-301d-4553-b60b-0a598df9c60b	4e3763a4-8f71-475e-b858-06ae68217094	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-30T06:48:28.182Z
c87e7c4b-8bbf-4924-913b-6818d11c679c	4e3763a4-8f71-475e-b858-06ae68217094	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-30T06:49:00.517Z
10453219-92ce-4029-b26d-ff2fee2678d1	4e3763a4-8f71-475e-b858-06ae68217094	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-30T06:50:18.238Z
eba803f9-c1a3-40f2-abe1-818c4506ca2c	4e3763a4-8f71-475e-b858-06ae68217094	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-30T06:51:13.218Z
bf9e6605-bcb3-49f4-9d97-b83dcae84534	4e3763a4-8f71-475e-b858-06ae68217094	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-30T06:52:15.240Z
13e54a9b-d2df-4fdb-b1b9-447a178e620b	4e3763a4-8f71-475e-b858-06ae68217094	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-30T06:53:06.106Z
a93e4989-f7d1-49ce-974c-d8044641f55d	50235829-966e-415b-8d9d-25bce37aecde	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-18T21:44:11.754Z
50ad89a3-d378-47b9-840c-0b988c74673b	50235829-966e-415b-8d9d-25bce37aecde	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-18T21:44:59.147Z
3f35575a-23f6-473f-b538-e0723560553f	50235829-966e-415b-8d9d-25bce37aecde	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-18T21:46:03.636Z
f08f8379-39b5-40aa-af78-e93029126f01	50235829-966e-415b-8d9d-25bce37aecde	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-18T21:46:53.753Z
57ed088e-dc59-46cf-872d-d8492848a5ae	50235829-966e-415b-8d9d-25bce37aecde	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-18T21:48:12.428Z
2efd9cda-1239-4ac1-91c8-2a22e609cd7d	50235829-966e-415b-8d9d-25bce37aecde	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-18T21:49:01.697Z
80d10fa3-39e9-42b9-9624-cc179906cf84	50235829-966e-415b-8d9d-25bce37aecde	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-18T21:50:13.198Z
16c6963b-79ea-45f1-b07e-d98718b7c207	50235829-966e-415b-8d9d-25bce37aecde	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-18T21:51:05.609Z
6923f7e0-0254-4272-876b-bde05b9b9b4e	cdcf64a1-5491-4729-afdf-e157bda3192a	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-27T10:34:28.914Z
0736ac13-0164-4cea-958f-829d940cf3d9	cdcf64a1-5491-4729-afdf-e157bda3192a	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-27T10:35:23.122Z
9ce4eff3-902c-49e2-a02e-bf601f3883b8	cdcf64a1-5491-4729-afdf-e157bda3192a	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-27T10:36:12.330Z
4233c0e1-59cc-4071-a70c-3f5621b63183	cdcf64a1-5491-4729-afdf-e157bda3192a	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-27T10:37:24.640Z
635fd090-1eb8-4712-b44b-1174a40d545b	0af32f8c-c1ac-48bd-8199-436a0c8f1ec0	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-27T03:25:36.653Z
53a3286a-4f6e-4095-aa63-480d31cb2026	0af32f8c-c1ac-48bd-8199-436a0c8f1ec0	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-27T03:26:45.639Z
d5421eff-7f8e-4879-86e9-69f31cce3496	0af32f8c-c1ac-48bd-8199-436a0c8f1ec0	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-27T03:27:40.983Z
c608963c-6fc7-4a62-9a07-5a39d3801c3a	0af32f8c-c1ac-48bd-8199-436a0c8f1ec0	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-27T03:28:50.117Z
241ae23f-34b4-43bb-bb30-b05c58f2de7b	6b65dd78-d5b4-4bd7-aaea-b4197aa59ac2	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-17T18:02:45.641Z
f5df9180-e852-4bca-9cc0-5af7cf8129d1	6b65dd78-d5b4-4bd7-aaea-b4197aa59ac2	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-17T18:03:55.399Z
0e0f2743-f627-4a97-844c-65cf1706ea88	6b65dd78-d5b4-4bd7-aaea-b4197aa59ac2	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-17T18:04:41.963Z
0a9f7483-aa42-474c-aad8-2b70d54a7f8b	6b65dd78-d5b4-4bd7-aaea-b4197aa59ac2	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-17T18:05:50.560Z
a1e6df29-773c-41f6-913e-0065e846f229	6b65dd78-d5b4-4bd7-aaea-b4197aa59ac2	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-17T18:06:57.832Z
cdd3c4e8-245e-472d-b93a-004eeac5204d	6b65dd78-d5b4-4bd7-aaea-b4197aa59ac2	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-17T18:08:00.902Z
77099e5f-e0ce-424c-8c83-ec5c4dd96229	6b65dd78-d5b4-4bd7-aaea-b4197aa59ac2	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-17T18:08:46.935Z
64c8f216-173f-41bf-a058-46a184e20774	6b65dd78-d5b4-4bd7-aaea-b4197aa59ac2	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-17T18:09:36.118Z
6c16806a-aa4b-4333-99c7-eff604692ece	3c0a1772-314b-4e16-8039-b557eaa7bbb9	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-29T09:22:53.541Z
b9af486d-f2da-408f-aa38-dd1c23a3e8df	3c0a1772-314b-4e16-8039-b557eaa7bbb9	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-29T09:24:06.192Z
3a2a88aa-3ab0-47f8-9d44-b383d015abbb	3c0a1772-314b-4e16-8039-b557eaa7bbb9	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-29T09:25:00.228Z
bd35f4fc-e1dc-405a-ad08-313899b821fc	3c0a1772-314b-4e16-8039-b557eaa7bbb9	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-29T09:26:00.152Z
eb20d157-7212-499a-9275-3ca85e87ab06	3c0a1772-314b-4e16-8039-b557eaa7bbb9	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-29T09:26:46.657Z
e22966fa-b442-47dd-8daf-18d04459f721	3c0a1772-314b-4e16-8039-b557eaa7bbb9	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-29T09:27:52.279Z
933e3458-11df-4a71-b33d-1d1bffb44fda	40f2591d-143e-42db-8b1d-f892400d04d2	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-25T08:30:08.577Z
01209c88-18cf-4295-9ea2-4a0b138ccdf8	40f2591d-143e-42db-8b1d-f892400d04d2	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-25T08:31:28.817Z
aec4fdcf-7162-4cb3-86a3-c674255e7a85	40f2591d-143e-42db-8b1d-f892400d04d2	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-25T08:32:01.511Z
9f70dced-c31f-4b86-8a92-5f09dade096c	40f2591d-143e-42db-8b1d-f892400d04d2	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-25T08:33:01.654Z
a7b656fe-bf72-425e-806d-e3950aad23cb	40f2591d-143e-42db-8b1d-f892400d04d2	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-25T08:34:12.249Z
b76c89e2-7f19-4e6d-b8f5-0a4bac5470f1	40f2591d-143e-42db-8b1d-f892400d04d2	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-25T08:35:25.069Z
9e02fb41-be64-49b1-b2b0-3a1954e173a4	40f2591d-143e-42db-8b1d-f892400d04d2	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-25T08:36:29.670Z
03adbfdc-383b-4478-a367-8528d899ec76	40f2591d-143e-42db-8b1d-f892400d04d2	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-25T08:37:10.328Z
af448d47-0070-45ea-9d8d-1382d527d8ef	40f2591d-143e-42db-8b1d-f892400d04d2	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-25T08:38:15.764Z
47a045d6-cd7b-47fb-8b28-10a34119e8d6	4633445b-cc10-498c-ae30-1e14a20e53d8	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-24T02:16:18.994Z
8ae6aa4f-4576-4de1-9cf5-cc6fd7020ffd	4633445b-cc10-498c-ae30-1e14a20e53d8	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-24T02:17:02.935Z
1f306318-926d-4862-bbef-4117b94c9c11	4633445b-cc10-498c-ae30-1e14a20e53d8	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-24T02:18:28.191Z
d6858b3a-04de-4a92-8854-ad8edf2ec398	4633445b-cc10-498c-ae30-1e14a20e53d8	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-24T02:19:09.999Z
2ce17b3c-917e-4187-be0a-2bd50dd7e041	4633445b-cc10-498c-ae30-1e14a20e53d8	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-24T02:20:08.981Z
f750d899-48c7-4710-9ec7-6fc34898ba1b	4633445b-cc10-498c-ae30-1e14a20e53d8	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-24T02:21:13.160Z
b10c071a-b297-4223-8313-059cdcd62b1b	9de4a578-929e-4ef7-a16a-dc5a61851945	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-27T14:27:23.562Z
c6eed2f6-4657-45d0-9932-eaeee4a97031	9de4a578-929e-4ef7-a16a-dc5a61851945	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-27T14:28:18.660Z
fc5e6ffd-0320-4820-916d-c0eb1c64753e	9de4a578-929e-4ef7-a16a-dc5a61851945	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-27T14:29:15.215Z
3fe76e7c-623b-47b8-8749-05e58b4d7c19	9de4a578-929e-4ef7-a16a-dc5a61851945	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-27T14:30:26.992Z
77141b53-34b1-404c-90db-2fff0fa601b2	7462885f-6a30-4efd-865e-2e6536d01889	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-04-01T11:06:55.989Z
1ec3d088-78af-49c9-aee9-423b93b8d330	7462885f-6a30-4efd-865e-2e6536d01889	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-04-01T11:08:06.632Z
28a4a1a3-5645-40b2-afb1-99e6239d9de3	7462885f-6a30-4efd-865e-2e6536d01889	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-04-01T11:08:48.572Z
71f33fda-af0a-4492-9bb9-403f0879fa77	7462885f-6a30-4efd-865e-2e6536d01889	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-04-01T11:09:48.108Z
f8bc5d26-ca8f-48ae-a3de-8e9783498a7c	7462885f-6a30-4efd-865e-2e6536d01889	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-04-01T11:11:05.128Z
b03c3930-b3c5-4cd2-8521-30863cf0f798	7462885f-6a30-4efd-865e-2e6536d01889	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-04-01T11:11:56.059Z
a323388f-89cc-4f70-8693-6a128cfe9db6	3fd65067-7c0d-4d29-931e-f39d9394f150	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-23T21:11:30.851Z
a2dff51e-dec2-4ee8-bb12-e312c817457c	3fd65067-7c0d-4d29-931e-f39d9394f150	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-23T21:12:31.350Z
0be43cb2-5c64-4517-9c15-e86880ebfa83	3fd65067-7c0d-4d29-931e-f39d9394f150	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-23T21:13:13.524Z
6c561bee-bf4b-44fa-9b57-fa95f6234308	3fd65067-7c0d-4d29-931e-f39d9394f150	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-23T21:14:21.451Z
d2d210bb-06ba-486c-8a12-136f782123c0	3fd65067-7c0d-4d29-931e-f39d9394f150	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-23T21:15:13.736Z
e8c9ca08-7538-4838-a2d2-486b94819a92	3fd65067-7c0d-4d29-931e-f39d9394f150	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-23T21:16:15.594Z
cb0bcc75-2c11-46a9-879a-eae4f96e0494	3fd65067-7c0d-4d29-931e-f39d9394f150	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-23T21:17:20.773Z
f6655b62-4328-4c5a-be8c-8329875a7515	3fd65067-7c0d-4d29-931e-f39d9394f150	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-23T21:18:21.836Z
7ad23ba4-73a0-4b91-8ffa-fd3f59440be8	3fd65067-7c0d-4d29-931e-f39d9394f150	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-23T21:19:32.225Z
7d5fe07f-26fe-4502-812f-34fcadce3c6b	694f5d31-f35d-42ee-ab2e-776ad2d39fda	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-28T13:03:18.688Z
5399f466-ca2f-4b20-bcd8-72039907ecfa	694f5d31-f35d-42ee-ab2e-776ad2d39fda	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-28T13:04:35.644Z
0c65f7d9-dcf6-45a3-b1dd-c08c643cda87	694f5d31-f35d-42ee-ab2e-776ad2d39fda	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-28T13:05:16.277Z
d41440cc-58ff-48c2-bf4d-1ff247cdb0b8	694f5d31-f35d-42ee-ab2e-776ad2d39fda	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-28T13:06:18.571Z
834abd40-7438-4797-a87e-ae418cc9e28d	694f5d31-f35d-42ee-ab2e-776ad2d39fda	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-28T13:07:16.334Z
e7fd5558-bab6-4bc0-a99d-d827cac25fa1	694f5d31-f35d-42ee-ab2e-776ad2d39fda	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-28T13:08:32.487Z
c519196c-21e8-4c2e-9b1d-fd8260bca1b4	62921c67-0e51-47a8-b5e6-6c43c62109cf	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-28T16:58:12.689Z
2cec113d-5fc0-4c92-aa49-9a446fbba219	62921c67-0e51-47a8-b5e6-6c43c62109cf	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-28T16:59:14.007Z
ea93b458-f00d-4dfe-a935-f61c6c2947e0	62921c67-0e51-47a8-b5e6-6c43c62109cf	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-28T16:59:56.277Z
df7bb466-02b5-41d4-a882-1a3ad7914ac8	62921c67-0e51-47a8-b5e6-6c43c62109cf	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-28T17:00:49.328Z
7609f1ef-d9fa-40e3-afc4-3758517d8904	62921c67-0e51-47a8-b5e6-6c43c62109cf	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-28T17:02:02.710Z
5c904040-a9e5-425d-9948-898af7981d98	62921c67-0e51-47a8-b5e6-6c43c62109cf	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-28T17:03:12.735Z
b22423dc-e80f-41b0-8bea-cab05d3d6dd4	62921c67-0e51-47a8-b5e6-6c43c62109cf	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-28T17:04:04.777Z
d67d2fd2-f2b5-4982-8817-1bc4af401e9c	62921c67-0e51-47a8-b5e6-6c43c62109cf	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-28T17:05:08.166Z
b377707b-f147-485c-a2fe-5349d4abc236	62921c67-0e51-47a8-b5e6-6c43c62109cf	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-28T17:05:48.815Z
3bdf4c38-172b-4229-8297-fdb3e2f8de9b	f591c3e3-6e85-46c6-8436-d89d04f84c1a	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-15T01:37:37.805Z
dbda4e5d-9cad-4f7b-b270-413918217c31	f591c3e3-6e85-46c6-8436-d89d04f84c1a	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-15T01:38:42.942Z
1c1e7be1-8f41-4e96-a7e5-64ba2d49096f	f591c3e3-6e85-46c6-8436-d89d04f84c1a	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-15T01:39:44.753Z
12099863-23d3-4873-ba64-d5a866e8a998	f591c3e3-6e85-46c6-8436-d89d04f84c1a	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-15T01:41:01.631Z
12fef6a4-db83-4701-bb9d-304c63a6afd5	f591c3e3-6e85-46c6-8436-d89d04f84c1a	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-15T01:41:44.179Z
cd4cbd3e-f883-4ce8-9dc7-5c23a2223bdf	f591c3e3-6e85-46c6-8436-d89d04f84c1a	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-15T01:43:01.770Z
024566d2-5718-4ab2-a091-cbfb27ba36a5	58326523-143d-416b-b72e-84c4d9a02cb2	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-14T01:19:17.541Z
7b97a0ac-0530-45aa-88e1-d93c0136e8eb	58326523-143d-416b-b72e-84c4d9a02cb2	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-14T01:20:20.195Z
d3f1873d-cbda-4670-bd3d-b8c0a8d85d4d	58326523-143d-416b-b72e-84c4d9a02cb2	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-14T01:21:18.426Z
72d73d0d-63ff-4966-bf38-d9e32cd930fb	58326523-143d-416b-b72e-84c4d9a02cb2	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-14T01:22:11.298Z
96237b47-9d6d-4849-89f5-c07faf5ea32f	58326523-143d-416b-b72e-84c4d9a02cb2	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-14T01:23:05.756Z
3c108caa-9f78-45f7-80dd-3d0879e976b8	58326523-143d-416b-b72e-84c4d9a02cb2	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-14T01:24:11.137Z
abfb9da2-1a90-403c-abb1-a90281fe4b8b	72958414-8eb1-42d7-8e83-a363e9af878b	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-24T03:20:35.940Z
ebb8c3c7-af94-4cfa-bf15-06edddcd3cfc	72958414-8eb1-42d7-8e83-a363e9af878b	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-24T03:21:43.476Z
6cccc2b8-949d-49cd-9547-402d51cd1710	72958414-8eb1-42d7-8e83-a363e9af878b	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-24T03:22:48.656Z
e6f9e98b-638f-4ff8-a99c-8cd12a5c74f0	72958414-8eb1-42d7-8e83-a363e9af878b	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-24T03:23:34.977Z
55d3745c-e6e5-4a39-be37-395122220561	72958414-8eb1-42d7-8e83-a363e9af878b	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-24T03:24:32.867Z
88a1a6f1-7f32-4a89-9812-d45d80adb499	72958414-8eb1-42d7-8e83-a363e9af878b	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-24T03:25:51.923Z
e3884d24-a738-450a-8241-70193340c8d5	72958414-8eb1-42d7-8e83-a363e9af878b	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-24T03:26:47.664Z
87ceffe4-1581-44b7-83e0-d1b56af0a2ed	72958414-8eb1-42d7-8e83-a363e9af878b	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-24T03:27:42.870Z
92922359-44f3-4b06-b780-12525b051bdd	d10a55e6-65eb-41d1-b6bf-87fd07a50ec7	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-20T23:40:52.702Z
8d04101e-260f-413b-84dc-f64697da6c20	d10a55e6-65eb-41d1-b6bf-87fd07a50ec7	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-20T23:41:37.371Z
bc82eacc-db6b-4d7e-9b33-636c9b1b6d88	d10a55e6-65eb-41d1-b6bf-87fd07a50ec7	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-20T23:42:31.116Z
791bbe76-8818-4894-8aab-662723aec4aa	d10a55e6-65eb-41d1-b6bf-87fd07a50ec7	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-20T23:43:29.217Z
4ab33652-6d17-4fd8-993c-cdb93838182b	d10a55e6-65eb-41d1-b6bf-87fd07a50ec7	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-20T23:44:31.040Z
3e9a7fc7-fc71-4abe-8adf-fc4177921bc4	d10a55e6-65eb-41d1-b6bf-87fd07a50ec7	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-20T23:45:41.662Z
83e6f57a-a8bf-44a0-9829-2c565e49a5df	ee07ee49-4ef6-4c6e-bce2-c927582cda67	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-30T02:35:10.557Z
1963bf08-9028-4cfa-87da-f6aa265b618b	ee07ee49-4ef6-4c6e-bce2-c927582cda67	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-30T02:36:16.446Z
64b89299-b77c-4740-a543-515ad3c12971	ee07ee49-4ef6-4c6e-bce2-c927582cda67	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-30T02:36:48.800Z
0d0a03d0-b39d-4ccd-bd87-e81b43f59a84	ee07ee49-4ef6-4c6e-bce2-c927582cda67	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-30T02:37:53.168Z
29ff3fbb-9f16-47bc-b8e2-faae0c9a6999	ee07ee49-4ef6-4c6e-bce2-c927582cda67	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-30T02:38:52.264Z
c16e94c7-1e50-4dd7-a106-d20a77f2413d	ee07ee49-4ef6-4c6e-bce2-c927582cda67	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-30T02:39:57.113Z
9597f212-1fcc-4d55-b8f2-73a6e3a65f2d	ce03eaf3-05b1-4d5e-bb14-b27df50a6ff0	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-14T00:46:53.318Z
e7403eba-82fc-4674-9f82-48c42b65d1da	ce03eaf3-05b1-4d5e-bb14-b27df50a6ff0	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-14T00:48:11.420Z
77bf002a-7d41-4c71-b76b-d8d4de33f5e4	f0fe4fd5-3bdb-41d8-957c-d3f2770001d6	user	?	\N	\N	0	none	0	2026-04-03T05:49:27.785Z
c88245f2-8fa3-4a70-b179-a98a6194590b	ce03eaf3-05b1-4d5e-bb14-b27df50a6ff0	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-14T00:49:01.295Z
f5cf1a76-6f11-4a6d-bf79-5726c9f24099	ce03eaf3-05b1-4d5e-bb14-b27df50a6ff0	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-14T00:50:06.135Z
b003c2a7-0001-4f9f-805e-03a827ad392b	ce03eaf3-05b1-4d5e-bb14-b27df50a6ff0	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-14T00:51:01.003Z
398ce17f-7622-421f-abe9-9dfa748a59a0	ce03eaf3-05b1-4d5e-bb14-b27df50a6ff0	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-14T00:51:59.868Z
d1571241-fa82-4b1d-b023-5c5d9a171755	a79038f2-4b50-446d-ab53-f76af7da2be4	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-20T07:42:26.650Z
966408e6-645c-44f4-9650-e2265e0244c4	a79038f2-4b50-446d-ab53-f76af7da2be4	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-20T07:43:07.128Z
7622db27-4080-4f67-9562-a9c49b11b49f	a79038f2-4b50-446d-ab53-f76af7da2be4	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-20T07:44:30.128Z
935ebdc4-9754-4c31-ad8a-ada3927267fd	a79038f2-4b50-446d-ab53-f76af7da2be4	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-20T07:45:13.375Z
dd3c5567-536a-4ff8-8e5a-bfcd871fb8bb	a79038f2-4b50-446d-ab53-f76af7da2be4	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-20T07:46:33.911Z
09f737ae-b4ee-4303-a824-c99eb927361e	a79038f2-4b50-446d-ab53-f76af7da2be4	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-20T07:47:13.398Z
ac2ab297-16c1-4cbe-9af2-9c6fe0c02866	72a49eb1-b5c5-4460-955a-7b1ef977f09d	assistant	Salut ! Catch'Up est là pour toi. Prêt(e) à explorer tes options ?	\N	\N	0	\N	0	2026-03-26T09:18:40.658Z
3c2e7220-73e4-4494-8565-d9ef267d1e5a	72a49eb1-b5c5-4460-955a-7b1ef977f09d	user	Oui ! Je veux changer de filière	\N	\N	0	\N	0	2026-03-26T09:19:35.274Z
6d86e535-4a66-4527-887f-80b649f480bd	72a49eb1-b5c5-4460-955a-7b1ef977f09d	assistant	Tu es dans quelle filière actuellement ?	\N	\N	0	\N	0	2026-03-26T09:20:53.943Z
21deb816-b8a3-4e40-8df7-1947203db62f	72a49eb1-b5c5-4460-955a-7b1ef977f09d	user	BTS comptabilité mais c'est vraiment pas fait pour moi	\N	\N	0	\N	0	2026-03-26T09:21:29.172Z
95c31e09-4be0-43a2-818f-ca03f5a17400	72a49eb1-b5c5-4460-955a-7b1ef977f09d	assistant	OK ! Et qu'est-ce qui te plairait davantage ?	\N	\N	0	\N	0	2026-03-26T09:22:32.391Z
2a6bddc2-3fbe-4168-8e66-67c2cbf03434	72a49eb1-b5c5-4460-955a-7b1ef977f09d	user	Le numérique, le développement web, ce genre de trucs	\N	\N	0	\N	0	2026-03-26T09:23:32.461Z
24071b11-fe13-4120-95ce-b625ac5c612d	179d3ae0-168d-4511-8c62-7497943606fb	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-04-01T12:50:04.353Z
b39aa0a0-58a0-4a3c-8b92-5c93c7e7985c	179d3ae0-168d-4511-8c62-7497943606fb	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-04-01T12:51:31.014Z
8290cf0a-81ac-4c5e-b754-a6653a7a3d9c	179d3ae0-168d-4511-8c62-7497943606fb	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-04-01T12:52:02.812Z
1b124482-354c-44db-8da4-97505f0dd067	179d3ae0-168d-4511-8c62-7497943606fb	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-04-01T12:53:16.342Z
14300833-0a1f-456d-9a58-cc132e4a68df	179d3ae0-168d-4511-8c62-7497943606fb	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-04-01T12:54:24.505Z
da98bb42-3ee6-4286-8b7b-27d1befa55e0	179d3ae0-168d-4511-8c62-7497943606fb	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-04-01T12:55:05.391Z
420977d6-f4a1-4efb-9bc5-841d9a0ffb3c	179d3ae0-168d-4511-8c62-7497943606fb	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-04-01T12:56:28.938Z
cad121db-1774-4e03-a001-81983c8c9e39	179d3ae0-168d-4511-8c62-7497943606fb	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-04-01T12:57:24.947Z
8a126f1b-a92f-441e-8617-5f190ee35e02	179d3ae0-168d-4511-8c62-7497943606fb	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-04-01T12:58:31.045Z
dcb699f5-583f-407b-820e-65885ed0202a	85821ede-ea77-4dc2-aef2-bb629961e26f	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-04-01T01:43:04.853Z
4f048e9f-e9fb-4831-a63b-5d5fb526cc91	85821ede-ea77-4dc2-aef2-bb629961e26f	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-04-01T01:44:24.348Z
58cffffe-1845-467f-9ce3-76728ba90c47	85821ede-ea77-4dc2-aef2-bb629961e26f	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-04-01T01:45:03.829Z
a5982e7d-62d0-4b0c-88b7-c85014e8937c	85821ede-ea77-4dc2-aef2-bb629961e26f	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-04-01T01:46:12.662Z
7dd1892f-a0a5-4ae2-b20a-11f575ea2be6	85821ede-ea77-4dc2-aef2-bb629961e26f	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-04-01T01:47:19.447Z
52137aba-4e78-4d46-9ed1-01ee95c845d1	85821ede-ea77-4dc2-aef2-bb629961e26f	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-04-01T01:48:11.264Z
2595f590-3a43-4610-8d6d-144e14810cfb	b5e46e9e-60ec-4e42-be30-c33a86275cc4	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-22T18:32:35.563Z
9e6328fa-cb78-49de-b4f6-d02e00b62984	b5e46e9e-60ec-4e42-be30-c33a86275cc4	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-22T18:33:34.333Z
a75e7d45-dc5e-4396-883d-f108366e8c50	b5e46e9e-60ec-4e42-be30-c33a86275cc4	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-22T18:34:23.696Z
4aca52ee-924d-4a4c-b347-846148ab1d7e	b5e46e9e-60ec-4e42-be30-c33a86275cc4	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-22T18:35:11.245Z
f99dc368-523a-4389-abca-b2954f9708d9	e960f936-d5c2-47dc-9eae-67b3289a28d8	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-24T07:36:59.270Z
a21375fd-c6bb-4c58-9255-11b20fe6d3ff	e960f936-d5c2-47dc-9eae-67b3289a28d8	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-24T07:37:53.456Z
e5b12c72-1642-447f-9041-9642b796d57d	e960f936-d5c2-47dc-9eae-67b3289a28d8	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-24T07:38:57.728Z
7ce2855a-adcc-411b-9078-61848b7f725b	e960f936-d5c2-47dc-9eae-67b3289a28d8	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-24T07:39:53.035Z
ab747a55-48dd-42e7-8b38-44a9cb799b22	160ec62a-9640-44ab-a242-65255df02f57	assistant	Salut ! Je suis Catch'Up, ton guide orientation. Tu veux qu'on discute de ton avenir ?	\N	\N	0	\N	0	2026-03-17T23:43:40.746Z
c5de6e47-c5b5-41c5-b92b-c3880f6b0dad	160ec62a-9640-44ab-a242-65255df02f57	user	Salut, ouais je sais pas trop quoi faire après le bac	\N	\N	0	\N	0	2026-03-17T23:44:36.521Z
cf9f6eeb-ba2b-492f-8956-d8c6950c49da	160ec62a-9640-44ab-a242-65255df02f57	assistant	Pas de stress ! On va explorer ça ensemble. Tu es plutôt du genre à bosser avec tes mains, à créer des trucs, ou à aider les gens ?	\N	\N	0	\N	0	2026-03-17T23:45:45.889Z
ba52485a-1ff1-480e-90a8-0c582c15612c	160ec62a-9640-44ab-a242-65255df02f57	user	J'aime bien aider les gens je pense, et aussi un peu créer des choses	\N	\N	0	\N	0	2026-03-17T23:46:55.507Z
bb0a4d7e-a8b2-4e33-ae9a-042dfa689326	160ec62a-9640-44ab-a242-65255df02f57	assistant	Super ! Ça me donne déjà des pistes. Tu as des matières que tu kiffes à l'école ?	\N	\N	0	\N	0	2026-03-17T23:47:43.242Z
5325e371-8a6d-4915-90e5-c0103fce6d86	160ec62a-9640-44ab-a242-65255df02f57	user	Les arts plastiques et la SVT surtout	\N	\N	0	\N	0	2026-03-17T23:48:42.164Z
c6919cc1-2bd4-4414-bac3-0133a26cf22f	8adba9d6-94eb-47e4-8558-21de671e30ea	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-27T17:29:53.456Z
2d812d3a-676b-4636-bfcd-66ae48cd0780	8adba9d6-94eb-47e4-8558-21de671e30ea	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-27T17:30:45.216Z
066d74c5-b4db-4d5e-b593-ea42103e943b	8adba9d6-94eb-47e4-8558-21de671e30ea	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-27T17:32:01.299Z
5a26abf4-a527-4679-84df-c414420c338d	8adba9d6-94eb-47e4-8558-21de671e30ea	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-27T17:33:01.617Z
e953444f-7a99-4d0d-8baf-dedc539bfed7	1b965620-067e-40ac-87dc-1f695eb7a2c1	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-27T08:04:10.020Z
346e7504-d2ae-41bc-bd24-17e04da3eea5	1b965620-067e-40ac-87dc-1f695eb7a2c1	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-27T08:05:06.782Z
18e8d9e0-b6b8-4af4-9bcc-e137cf2956da	1b965620-067e-40ac-87dc-1f695eb7a2c1	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-27T08:06:21.823Z
a8f66fd4-b8b8-4a75-b7b8-ef69f80c9fba	1b965620-067e-40ac-87dc-1f695eb7a2c1	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-27T08:07:29.563Z
278d6a32-c098-40d0-8059-2f0e591da6da	1b965620-067e-40ac-87dc-1f695eb7a2c1	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-27T08:08:28.404Z
5c90d1cc-cc99-4bb6-ae12-3a61aca1b8dc	1b965620-067e-40ac-87dc-1f695eb7a2c1	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-27T08:09:02.425Z
85b0a6a6-4af3-4b8f-b8e6-343a6fe22ea2	1b965620-067e-40ac-87dc-1f695eb7a2c1	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-27T08:10:05.886Z
9ae964ae-79cc-4fd2-b4e0-0bc0f46c4cd6	1b965620-067e-40ac-87dc-1f695eb7a2c1	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-27T08:11:19.526Z
47756b99-09f7-4988-a860-f9be76dbc0d0	e15e5dac-52f9-4a4f-897a-260c0806d18b	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-15T20:22:22.340Z
c56f7f04-f2d0-4231-b713-b945e7c03e96	e15e5dac-52f9-4a4f-897a-260c0806d18b	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-15T20:23:01.293Z
581fa1f0-4842-44df-a1c2-f48966687e04	e15e5dac-52f9-4a4f-897a-260c0806d18b	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-15T20:24:14.605Z
d481b301-7460-4ad4-9524-36625b85a0a4	e15e5dac-52f9-4a4f-897a-260c0806d18b	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-15T20:25:24.386Z
50f530a6-9829-4f89-bd51-137a14415b47	e15e5dac-52f9-4a4f-897a-260c0806d18b	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-15T20:26:02.917Z
e5adfbf1-5d07-4f10-acb4-a55090b52675	e15e5dac-52f9-4a4f-897a-260c0806d18b	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-15T20:27:13.046Z
109adc54-2654-42d1-8f37-b65d87ffc1ef	e15e5dac-52f9-4a4f-897a-260c0806d18b	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-15T20:28:04.055Z
b0d3bc40-7c8b-4489-b748-d4d30a4e7a52	e15e5dac-52f9-4a4f-897a-260c0806d18b	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-15T20:29:22.611Z
1d9815f1-2e9f-4d8d-967b-66488f6f00bc	cf15fa01-3781-4a3d-82a6-306a2731e2cf	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-04-01T15:11:15.852Z
a59b09af-0e1d-43be-bcc4-2bf8068a08b2	cf15fa01-3781-4a3d-82a6-306a2731e2cf	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-04-01T15:12:20.243Z
db4a3a91-6932-4c27-8b52-e49c602475d9	cf15fa01-3781-4a3d-82a6-306a2731e2cf	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-04-01T15:13:27.927Z
6ffccdb0-06a5-40d4-9a1a-3dd22c8d0dcf	cf15fa01-3781-4a3d-82a6-306a2731e2cf	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-04-01T15:14:33.976Z
96c791c8-2e82-4eee-aa8f-c16e1a4d5acf	cf15fa01-3781-4a3d-82a6-306a2731e2cf	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-04-01T15:15:11.945Z
1d75ad62-7458-49bb-9f7c-79690020249a	cf15fa01-3781-4a3d-82a6-306a2731e2cf	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-04-01T15:16:27.186Z
3f92a535-67f0-4610-9b82-24b3fb2d9060	cf15fa01-3781-4a3d-82a6-306a2731e2cf	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-04-01T15:17:11.064Z
7c2cbf9b-45ff-4e31-87e4-e0c9dce7d383	cf15fa01-3781-4a3d-82a6-306a2731e2cf	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-04-01T15:18:17.668Z
a3636f01-e588-43f6-a93d-e29720d72216	cf15fa01-3781-4a3d-82a6-306a2731e2cf	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-04-01T15:19:20.689Z
7fc7546e-cc97-4aca-a1f0-6bedca4b4543	9e96900b-39c8-43d2-acc0-44303d39ebfe	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-26T16:27:14.765Z
2f19c957-9b43-4120-a938-b86959153d4e	9e96900b-39c8-43d2-acc0-44303d39ebfe	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-26T16:28:23.729Z
889bae04-8455-4aec-b9ce-7040a0691aba	9e96900b-39c8-43d2-acc0-44303d39ebfe	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-26T16:29:16.314Z
c80815a8-ff06-4d42-9f55-e218d3dbfc2f	9e96900b-39c8-43d2-acc0-44303d39ebfe	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-26T16:30:03.781Z
f6c0c2fa-6cda-4cd2-baef-f1dd8e8863f3	cc29c414-f616-4085-9702-d89dd1d3db5d	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-17T09:46:52.586Z
93fa0f58-4e91-4d46-89c2-2f398b3d5c5f	cc29c414-f616-4085-9702-d89dd1d3db5d	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-17T09:47:40.290Z
d304721e-aa7f-435f-8128-21fc69a5bba3	cc29c414-f616-4085-9702-d89dd1d3db5d	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-17T09:48:45.764Z
15fedee5-79ba-4abf-b6ec-286415804b34	cc29c414-f616-4085-9702-d89dd1d3db5d	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-17T09:49:36.782Z
9bffe28e-961e-4a7e-90b0-0b82f2e5c762	cc29c414-f616-4085-9702-d89dd1d3db5d	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-17T09:50:47.543Z
e6b973e5-ce5c-4d82-bd3d-42a9734b930c	cc29c414-f616-4085-9702-d89dd1d3db5d	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-17T09:51:52.454Z
c5e8c4f1-21f7-45a8-b2c2-3ef61a811300	cc29c414-f616-4085-9702-d89dd1d3db5d	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-17T09:52:41.625Z
f2a3b1c0-de7d-45e7-a403-d3d66e4ac335	cc29c414-f616-4085-9702-d89dd1d3db5d	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-17T09:53:42.429Z
74a421d5-55e2-45e9-85d5-3b92207e0f4a	cc29c414-f616-4085-9702-d89dd1d3db5d	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-17T09:54:58.878Z
949135ec-9feb-4709-90b5-2d16d1311674	8a343115-6c20-404a-9ffc-994afd25f41a	assistant	Hey ! Bienvenue sur Catch'Up. Je suis là pour t'aider à trouver ta voie. Comment ça va ?	\N	\N	0	\N	0	2026-03-29T10:11:37.237Z
009ab08c-b5b4-43b3-ac43-ead0ad30b4da	8a343115-6c20-404a-9ffc-994afd25f41a	user	Bof, je suis un peu perdu en ce moment	\N	\N	0	\N	0	2026-03-29T10:12:16.433Z
bea74926-5f4b-4b6d-9436-c66d374cd10c	8a343115-6c20-404a-9ffc-994afd25f41a	assistant	Je comprends, c'est normal de pas savoir exactement où aller. Tu fais quoi en ce moment ?	\N	\N	0	\N	0	2026-03-29T10:13:32.190Z
daa18fd7-4b38-4351-828a-3327ebca9ce4	8a343115-6c20-404a-9ffc-994afd25f41a	user	Rien, j'ai lâché ma formation il y a 3 mois	\N	\N	0	\N	0	2026-03-29T10:14:14.581Z
12300833-3c83-4e7c-9e06-7f01802bb721	8a343115-6c20-404a-9ffc-994afd25f41a	assistant	OK, c'est courageux d'en parler. Qu'est-ce qui s'est passé ?	\N	\N	0	\N	0	2026-03-29T10:15:36.523Z
d3f10b87-16f5-48d7-bd8e-65b542b8add3	8a343115-6c20-404a-9ffc-994afd25f41a	user	C'était pas pour moi du tout, je m'ennuyais et je voyais pas le sens	\N	\N	0	\N	0	2026-03-29T10:16:17.004Z
cbd6969b-d44d-422a-a4cf-9492e5b9364d	8a343115-6c20-404a-9ffc-994afd25f41a	assistant	Je comprends. Et si on cherchait ensemble ce qui te motive vraiment ?	\N	\N	0	\N	0	2026-03-29T10:17:35.744Z
8c872b8a-a987-4376-8a5c-eeeb4f4d24e3	8a343115-6c20-404a-9ffc-994afd25f41a	user	Ouais, j'aimerais bien trouver un truc qui me plaît	\N	\N	0	\N	0	2026-03-29T10:18:35.653Z
bc77cbd1-42b2-4ec4-bdce-a4d627f597d5	795d4bdc-d12f-4aa2-b262-c0a1375e71e4	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-18T01:57:12.626Z
701c8064-46f0-4e92-b1dd-6d331f972770	795d4bdc-d12f-4aa2-b262-c0a1375e71e4	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-18T01:57:49.347Z
5a302d2b-02a5-4baf-ac08-a47abcfbf965	795d4bdc-d12f-4aa2-b262-c0a1375e71e4	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-18T01:59:09.247Z
dd6d3e76-51b1-4b28-b4e3-9b5717c36900	795d4bdc-d12f-4aa2-b262-c0a1375e71e4	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-18T02:00:11.166Z
f4f7cd84-a75f-4293-995f-108ffb2d468b	795d4bdc-d12f-4aa2-b262-c0a1375e71e4	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-18T02:00:55.810Z
1b47f6c2-9715-40c2-96ec-33e87c20d377	795d4bdc-d12f-4aa2-b262-c0a1375e71e4	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-18T02:02:00.579Z
d332e18d-7883-478b-a051-43f79ae0e44a	795d4bdc-d12f-4aa2-b262-c0a1375e71e4	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-18T02:03:12.482Z
cb21e6d3-04da-4c6b-b932-6f0ef8f13921	795d4bdc-d12f-4aa2-b262-c0a1375e71e4	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-18T02:03:57.882Z
94c4dd7b-1dbe-4547-85f5-dcc46baf5eca	795d4bdc-d12f-4aa2-b262-c0a1375e71e4	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-18T02:05:15.367Z
4913c2b9-9665-46ae-9d64-4e5b5fa82961	bcbd1f7c-d658-4f5b-a11f-5635c025457e	assistant	Bienvenue ! Je suis ton assistant orientation. On commence ?	\N	\N	0	\N	0	2026-03-17T18:13:23.720Z
fd644d45-7e62-43ac-bbd1-1fbf504c5c2b	bcbd1f7c-d658-4f5b-a11f-5635c025457e	user	Je cherche un apprentissage pour la rentrée	\N	\N	0	\N	0	2026-03-17T18:14:05.402Z
66dfdb1e-db66-4cb8-8f21-8991995943ea	bcbd1f7c-d658-4f5b-a11f-5635c025457e	assistant	Bonne idée l'apprentissage ! Dans quel domaine tu cherches ?	\N	\N	0	\N	0	2026-03-17T18:15:03.974Z
cca29225-63f6-4386-ac1e-6af2077ae8ea	bcbd1f7c-d658-4f5b-a11f-5635c025457e	user	La cuisine ou la pâtisserie	\N	\N	0	\N	0	2026-03-17T18:16:00.285Z
c713e09d-c107-459c-bb37-6d37263831da	bcbd1f7c-d658-4f5b-a11f-5635c025457e	assistant	Génial ! Tu as déjà de l'expérience en cuisine ?	\N	\N	0	\N	0	2026-03-17T18:17:12.608Z
66755db6-042d-4748-bb52-0122723720df	bcbd1f7c-d658-4f5b-a11f-5635c025457e	user	Un peu, j'ai fait un stage de 2 semaines dans un restaurant	\N	\N	0	\N	0	2026-03-17T18:18:13.109Z
d6852f96-47a8-431f-987d-70cbf8e69b74	bcbd1f7c-d658-4f5b-a11f-5635c025457e	assistant	Super ! Et ça t'a plu ?	\N	\N	0	\N	0	2026-03-17T18:19:21.632Z
bf282990-6aa5-40b5-ad73-b6f141a8d360	bcbd1f7c-d658-4f5b-a11f-5635c025457e	user	Grave, c'était intense mais j'ai adoré	\N	\N	0	\N	0	2026-03-17T18:20:20.740Z
c6352b42-2028-4283-9451-6f89db43861c	bcbd1f7c-d658-4f5b-a11f-5635c025457e	assistant	Tu as le profil parfait pour ça. On va t'aider à trouver le bon CFA !	\N	\N	0	\N	0	2026-03-17T18:21:18.995Z
ae3767a3-4573-4726-8910-1c5216042747	6fa639e0-53de-4e71-b271-8ca620a7646e	user	Non	\N	\N	0	none	0	2026-04-03T11:01:08.778Z
e5924951-6e12-4c69-9735-b478edb98d57	253c13f2-2611-4f41-ba54-1510d63b2c14	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-24T10:25:45.449Z
b568f787-d5d1-4992-b85b-c53e2b4d16e5	253c13f2-2611-4f41-ba54-1510d63b2c14	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-24T10:26:43.612Z
19211cda-b7c7-412b-8f5c-1282c6cf6f68	253c13f2-2611-4f41-ba54-1510d63b2c14	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-24T10:28:01.806Z
e5a3eee1-56c8-4664-a7d8-06f3e59679ee	253c13f2-2611-4f41-ba54-1510d63b2c14	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-24T10:28:42.989Z
9983f5b9-dc62-4b0a-a178-1f5830c652f5	954ef068-e3ad-44c9-8098-1522ce07eeff	assistant	Hey ! On se connaît pas encore. Dis-moi un peu ce qui t'amène ici ?	\N	\N	0	\N	0	2026-03-24T07:25:34.529Z
7b31f674-f838-4e01-8551-6122292ee11d	954ef068-e3ad-44c9-8098-1522ce07eeff	user	Mes parents veulent que je fasse médecine mais moi non	\N	\N	0	\N	0	2026-03-24T07:26:33.155Z
d7bd7225-66ee-4cfe-adea-d009a3098d20	954ef068-e3ad-44c9-8098-1522ce07eeff	assistant	C'est un sujet délicat. Qu'est-ce qui te fait envie à toi ?	\N	\N	0	\N	0	2026-03-24T07:27:18.695Z
030f4560-84aa-4bda-8611-5600a5699cb9	954ef068-e3ad-44c9-8098-1522ce07eeff	user	Le journalisme ou la communication	\N	\N	0	\N	0	2026-03-24T07:28:19.320Z
d63cf1c1-9e9c-4b7e-867c-6239f03bee37	e1af0c15-a53e-4ee2-8a2e-a0cf342d929e	assistant	Salut ! Moi, c'est Catch'Up 😊 Je suis là pour t'aider à explorer tes passions, comprendre ce qui te motive et te guider vers des métiers ou des formations qui te correspondent. Dis-moi, qu'est-ce que tu aimes faire dans la vie ? Qu'est-ce qui te fait vibrer ? 🎨	Salut ! Moi, c'est Catch'Up 😊 Je suis là pour t'aider à explorer tes passions, comprendre ce qui te motive et te guider vers des métiers ou des formations qui te correspondent. Dis-moi, qu'est-ce que tu aimes faire dans la vie ? Qu'est-ce qui te fait vibrer ? 🎨\n\n<!--PROFILE:{"R":0,"I":0,"A":0,"S":0,"E":0,"C":0,"name":null,"genre":null,"traits":[],"interests":[],"strengths":[],"suggestion":null}-->\n<!--SUGGESTIONS:[{"text":"J'adore dessiner","emoji":"✏️"},{"text":"J'aime jouer aux jeux vidéo","emoji":"🎮"},{"text":"Je suis fan de sport","emoji":"🏃"}]-->	\N	0	none	0	2026-04-02T23:37:09.012Z
8ec7cdb0-bb58-49c5-a9ef-1470f3217307	e1af0c15-a53e-4ee2-8a2e-a0cf342d929e	user	No day	\N	\N	0	none	0	2026-04-02T23:40:35.826Z
956e3cd9-c009-4c21-92d0-a06145ce9c6e	e1af0c15-a53e-4ee2-8a2e-a0cf342d929e	assistant	Pas de souci 😊 Si tu préfères, tu peux me parler de ce qui t'intéresse en général, ou même de ce que tu n'aimes pas. Ça aide aussi à comprendre ce qui pourrait te convenir. Tu as une passion ou un passe-temps qui te tient à cœur ? 🎨	Pas de souci 😊 Si tu préfères, tu peux me parler de ce qui t'intéresse en général, ou même de ce que tu n'aimes pas. Ça aide aussi à comprendre ce qui pourrait te convenir. Tu as une passion ou un passe-temps qui te tient à cœur ? 🎨\n\n<!--PROFILE:{"R":0,"I":0,"A":0,"S":0,"E":0,"C":0,"name":null,"genre":null,"traits":[],"interests":[],"strengths":[],"suggestion":null}-->\n<!--SUGGESTIONS:[{"text":"J'aime la musique","emoji":"🎵"},{"text":"Pas vraiment de passion","emoji":"😅"},{"text":"Je préfère lire","emoji":"📚"}]-->	\N	0	none	0	2026-04-02T23:40:42.105Z
01df8fc7-a396-4b5d-862b-17fc5d6f143f	e1af0c15-a53e-4ee2-8a2e-a0cf342d929e	assistant	Pas de problème, c'est plus courant qu'on ne le pense ! 😊 Parfois, on découvre ses passions en essayant de nouvelles choses. Y a-t-il des activités que tu as envie de tester, ou un domaine qui t'intrigue ? Comme la cuisine, la technologie, ou même le voyage ? 🤔	Pas de problème, c'est plus courant qu'on ne le pense ! 😊 Parfois, on découvre ses passions en essayant de nouvelles choses. Y a-t-il des activités que tu as envie de tester, ou un domaine qui t'intrigue ? Comme la cuisine, la technologie, ou même le voyage ? 🤔\n\n<!--PROFILE:{"R":0,"I":0,"A":0,"S":0,"E":0,"C":0,"name":null,"genre":null,"traits":[],"interests":[],"strengths":[],"suggestion":null}-->\n<!--SUGGESTIONS:[{"text":"La cuisine me tente","emoji":"🍳"},{"text":"J'aime bien la technologie","emoji":"💻"},{"text":"Pas trop d'idées","emoji":"🤷"}]-->	\N	0	none	0	2026-04-02T23:42:18.364Z
5c215f0f-573c-41d7-8c3f-814ef44bba8a	f0fe4fd5-3bdb-41d8-957c-d3f2770001d6	assistant	Salut ! Moi c'est Catch'Up. Je suis là pour t'aider à trouver ta voie professionnelle et te donner un coup de pouce pour ton avenir. 😊 Et toi, comment je peux t'appeler ?	Salut ! Moi c'est Catch'Up. Je suis là pour t'aider à trouver ta voie professionnelle et te donner un coup de pouce pour ton avenir. 😊 Et toi, comment je peux t'appeler ?	\N	0	none	0	2026-04-03T05:32:51.461Z
b29df284-81dc-4ece-9b2c-0d3c6f61ed4b	f0fe4fd5-3bdb-41d8-957c-d3f2770001d6	user	Alan	\N	\N	0	none	0	2026-04-03T05:33:00.942Z
fa92a87f-b00b-4f27-b6ab-1b82314a7131	f0fe4fd5-3bdb-41d8-957c-d3f2770001d6	assistant	Ravi de te rencontrer, Alan ! 😊 Qu'est-ce qui te passionne dans la vie ? Il y a des activités ou des sujets que tu aimes particulièrement ?	Ravi de te rencontrer, Alan ! 😊 Qu'est-ce qui te passionne dans la vie ? Il y a des activités ou des sujets que tu aimes particulièrement ?	\N	0	none	0	2026-04-03T05:33:01.935Z
f62c4fad-00de-40e0-98ae-f8279201796b	f0fe4fd5-3bdb-41d8-957c-d3f2770001d6	user	je veux etre riche	\N	\N	0	none	0	2026-04-03T05:33:25.307Z
035b53c6-2091-46e3-85e0-0409df7372ae	0c583a69-bb10-48ef-a7c3-c6cb2a12335e	assistant	بالطبع، لا مشكلة! 😊 ما هي الأشياء التي تحب القيام بها في وقت فراغك؟ ما الذي يثير اهتمامك ويجعلك تشعر بالحماس؟	بالطبع، لا مشكلة! 😊 ما هي الأشياء التي تحب القيام بها في وقت فراغك؟ ما الذي يثير اهتمامك ويجعلك تشعر بالحماس؟	\N	0	none	0	2026-04-03T12:11:53.811Z
20d9b8a1-93e9-48fb-b57e-51b145997ab7	f0fe4fd5-3bdb-41d8-957c-d3f2770001d6	assistant	Haha, c'est une belle ambition ! 😄 Il y a plein de chemins pour atteindre cet objectif. Ça pourrait être intéressant de savoir ce qui te plaît et te motive vraiment. Tu as des idées de secteurs ou de métiers qui t'attirent pour y arriver ? 😊	Haha, c'est une belle ambition ! 😄 Il y a plein de chemins pour atteindre cet objectif. Ça pourrait être intéressant de savoir ce qui te plaît et te motive vraiment. Tu as des idées de secteurs ou de métiers qui t'attirent pour y arriver ? 😊\n\n<!--PROFILE:{"R":0,"I":0,"A":0,"S":0,"E":70,"C":0,"name":"Alan","genre":"M","traits":["ambitieux"],"interests":["devenir riche"],"strengths":[],"suggestion":""}-->\n<!--SUGGESTIONS:[{"text":"La finance m'intéresse","emoji":"💰"},{"text":"Je sais pas du tout","emoji":"😅"},{"text":"Le business ça me tente","emoji":"📈"}]-->	\N	0	none	0	2026-04-03T05:33:27.491Z
3169e1a3-f168-4eb4-acd4-398d0cfff38f	f0fe4fd5-3bdb-41d8-957c-d3f2770001d6	assistant	Ah super ! Le business offre plein d'opportunités pour réussir. 💪 Est-ce qu'il y a un domaine spécifique qui t'intéresse, comme l'entrepreneuriat, le marketing, ou même la gestion ? Ou peut-être que tu as déjà une idée de projet en tête ? 😊	Ah super ! Le business offre plein d'opportunités pour réussir. 💪 Est-ce qu'il y a un domaine spécifique qui t'intéresse, comme l'entrepreneuriat, le marketing, ou même la gestion ? Ou peut-être que tu as déjà une idée de projet en tête ? 😊\n\n<!--PROFILE:{"R":0,"I":0,"A":0,"S":0,"E":75,"C":0,"name":"Alan","genre":"M","traits":["ambitieux"],"interests":["devenir riche","business"],"strengths":[],"suggestion":""}-->\n<!--SUGGESTIONS:[{"text":"L'entrepreneuriat ça me branche","emoji":"🚀"},{"text":"Le marketing c'est cool","emoji":"📊"},{"text":"Pas encore d'idée précise","emoji":"🤔"}]-->	\N	0	none	0	2026-04-03T05:33:36.326Z
01782e67-178c-4b77-a279-c4aa76e67bc6	f0fe4fd5-3bdb-41d8-957c-d3f2770001d6	assistant	Pas de souci, Alan ! 😊 Si tu n'as pas encore d'idée précise, c'est tout à fait normal. Le monde du business est vaste et plein de possibilités. On pourrait explorer ensemble ce qui te plaît le plus dans le business, ou même discuter de tes forces pour voir où elles pourraient te mener. Qu'est-ce que tu en penses ? 😊	Pas de souci, Alan ! 😊 Si tu n'as pas encore d'idée précise, c'est tout à fait normal. Le monde du business est vaste et plein de possibilités. On pourrait explorer ensemble ce qui te plaît le plus dans le business, ou même discuter de tes forces pour voir où elles pourraient te mener. Qu'est-ce que tu en penses ? 😊\n\n<!--PROFILE:{"R":0,"I":0,"A":0,"S":0,"E":75,"C":0,"name":"Alan","genre":"M","traits":["ambitieux"],"interests":["devenir riche","business"],"strengths":[],"suggestion":""}-->\n<!--SUGGESTIONS:[{"text":"Oui, bonne idée","emoji":"👍"},{"text":"Je sais toujours pas","emoji":"😅"},{"text":"Parlons de mes forces","emoji":"💪"}]-->	\N	0	none	0	2026-04-03T05:49:29.984Z
03af34fb-5420-4efe-b313-cac8b624074e	f0fe4fd5-3bdb-41d8-957c-d3f2770001d6	user	so what	\N	\N	0	none	0	2026-04-03T05:50:18.308Z
6efe9c03-ff5e-4379-89ff-81dd89baab7d	f0fe4fd5-3bdb-41d8-957c-d3f2770001d6	assistant	Pas de souci, Alan ! On peut commencer par parler de tes forces. Est-ce que tu as remarqué des choses que tu fais bien, ou des compétences que tu aimerais développer ? 😊 Ça peut être un bon point de départ pour orienter ton parcours dans le business.	Pas de souci, Alan ! On peut commencer par parler de tes forces. Est-ce que tu as remarqué des choses que tu fais bien, ou des compétences que tu aimerais développer ? 😊 Ça peut être un bon point de départ pour orienter ton parcours dans le business.\n\n<!--PROFILE:{"R":0,"I":0,"A":0,"S":0,"E":75,"C":0,"name":"Alan","genre":"M","traits":["ambitieux"],"interests":["devenir riche","business"],"strengths":[],"suggestion":""}-->\n<!--SUGGESTIONS:[{"text":"Je suis bon en communication","emoji":"🗣️"},{"text":"Je suis organisé","emoji":"🗂️"},{"text":"Pas sûr de mes forces","emoji":"🤷"}]-->	\N	0	none	0	2026-04-03T05:50:20.621Z
41a1f34d-49b9-4403-8010-fb931a72207c	f0fe4fd5-3bdb-41d8-957c-d3f2770001d6	assistant	Perfetto, Alan ! 😊 Allora, parlando delle tue forze, c'è qualcosa in cui ti senti particolarmente bravo o che ti piacerebbe migliorare nel campo del business ? Potrebbe aiutarci a orienterci un po' mieux. 😊	Perfetto, Alan ! 😊 Allora, parlando delle tue forze, c'è qualcosa in cui ti senti particolarmente bravo o che ti piacerebbe migliorare nel campo del business ? Potrebbe aiutarci a orienterci un po' mieux. 😊\n\n<!--PROFILE:{"R":0,"I":0,"A":0,"S":0,"E":75,"C":0,"name":"Alan","genre":"M","traits":["ambitieux"],"interests":["devenir riche","business"],"strengths":[],"suggestion":""}-->\n<!--SUGGESTIONS:[{"text":"Sono bravo a comunicare","emoji":"🗣️"},{"text":"Sono organizzato","emoji":"🗂️"},{"text":"Non sono sicuro delle mie forze","emoji":"🤷"}]-->	\N	0	none	0	2026-04-03T07:16:51.215Z
a8192f14-71ea-4bd9-babb-f9eed0da4822	f0fe4fd5-3bdb-41d8-957c-d3f2770001d6	assistant	بالطبع، ألان! 😊 في مجال الأعمال، هل هناك مهارات معينة تشعر أنك بارع فيها أو ترغب في تطويرها؟ يمكن أن يساعدنا ذلك في توجيهك نحو المسار المناسب. 😊	بالطبع، ألان! 😊 في مجال الأعمال، هل هناك مهارات معينة تشعر أنك بارع فيها أو ترغب في تطويرها؟ يمكن أن يساعدنا ذلك في توجيهك نحو المسار المناسب. 😊\n\n<!--PROFILE:{"R":0,"I":0,"A":0,"S":0,"E":75,"C":0,"name":"Alan","genre":"M","traits":["ambitieux"],"interests":["devenir riche","business"],"strengths":[],"suggestion":""}-->\n<!--SUGGESTIONS:[{"text":"أنا جيد في التواصل","emoji":"🗣️"},{"text":"أنا منظم","emoji":"🗂️"},{"text":"لست متأكد من مهاراتي","emoji":"🤷"}]-->	\N	0	none	0	2026-04-03T07:17:00.463Z
7480ac1c-95e4-4397-8be3-76c84748c25f	f0fe4fd5-3bdb-41d8-957c-d3f2770001d6	assistant	No problem, Alan! 😊 So, in the business field, is there a particular skill you feel you're good at or would like to improve? This could help us find the right path for you. 😊	No problem, Alan! 😊 So, in the business field, is there a particular skill you feel you're good at or would like to improve? This could help us find the right path for you. 😊\n\n<!--PROFILE:{"R":0,"I":0,"A":0,"S":0,"E":75,"C":0,"name":"Alan","genre":"M","traits":["ambitieux"],"interests":["devenir riche","business"],"strengths":[],"suggestion":""}-->\n<!--SUGGESTIONS:[{"text":"I'm good at communication","emoji":"🗣️"},{"text":"I'm organized","emoji":"🗂️"},{"text":"Not sure about my skills","emoji":"🤷"}]-->	\N	0	none	0	2026-04-03T07:17:03.588Z
a1b442de-0161-4cd1-8ad2-edebae7b6af0	f0fe4fd5-3bdb-41d8-957c-d3f2770001d6	assistant	Bien sûr, Alan ! 😊 Dans le domaine du business, y a-t-il des compétences où tu te sens à l'aise ou que tu aimerais développer ? Cela pourrait vraiment nous aider à trouver le bon chemin pour toi. 😊	Bien sûr, Alan ! 😊 Dans le domaine du business, y a-t-il des compétences où tu te sens à l'aise ou que tu aimerais développer ? Cela pourrait vraiment nous aider à trouver le bon chemin pour toi. 😊\n\n<!--PROFILE:{"R":0,"I":0,"A":0,"S":0,"E":75,"C":0,"name":"Alan","genre":"M","traits":["ambitieux"],"interests":["devenir riche","business"],"strengths":[],"suggestion":""}-->\n<!--SUGGESTIONS:[{"text":"Je suis bon en communication","emoji":"🗣️"},{"text":"Je suis organisé","emoji":"🗂️"},{"text":"Pas sûr de mes forces","emoji":"🤷"}]-->	\N	0	none	0	2026-04-03T07:17:07.473Z
025ab0be-de2e-4fba-8e83-aeb826d3b5f4	f0fe4fd5-3bdb-41d8-957c-d3f2770001d6	assistant	Kein Problem, Alan! 😊 Gibt es bestimmte Fähigkeiten im Bereich Business, in denen du dich gut fühlst oder die du gerne verbessern würdest? Das könnte uns helfen, den richtigen Weg für dich zu finden. 😊	Kein Problem, Alan! 😊 Gibt es bestimmte Fähigkeiten im Bereich Business, in denen du dich gut fühlst oder die du gerne verbessern würdest? Das könnte uns helfen, den richtigen Weg für dich zu finden. 😊\n\n<!--PROFILE:{"R":0,"I":0,"A":0,"S":0,"E":75,"C":0,"name":"Alan","genre":"M","traits":["ambitieux"],"interests":["devenir riche","business"],"strengths":[],"suggestion":""}-->\n<!--SUGGESTIONS:[{"text":"Ich kann gut kommunizieren","emoji":"🗣️"},{"text":"Ich bin organisiert","emoji":"🗂️"},{"text":"Ich bin nicht sicher","emoji":"🤷"}]-->	\N	0	none	0	2026-04-03T08:08:05.818Z
8387f567-aca1-46fc-ab68-825b9b17460e	f0fe4fd5-3bdb-41d8-957c-d3f2770001d6	assistant	¡Por supuesto, Alan! 😊 En el campo de los negocios, ¿hay alguna habilidad en la que te sientas especialmente bueno o que te gustaría mejorar? Esto podría ayudarnos a encontrar el camino adecuado para ti. 😊	¡Por supuesto, Alan! 😊 En el campo de los negocios, ¿hay alguna habilidad en la que te sientas especialmente bueno o que te gustaría mejorar? Esto podría ayudarnos a encontrar el camino adecuado para ti. 😊\n\n<!--PROFILE:{"R":0,"I":0,"A":0,"S":0,"E":75,"C":0,"name":"Alan","genre":"M","traits":["ambitieux"],"interests":["devenir riche","business"],"strengths":[],"suggestion":""}-->\n<!--SUGGESTIONS:[{"text":"Soy bueno comunicando","emoji":"🗣️"},{"text":"Soy organizado","emoji":"🗂️"},{"text":"No estoy seguro de mis habilidades","emoji":"🤷"}]-->	\N	0	none	0	2026-04-03T08:08:11.797Z
70ff36d3-0305-4fa3-9225-1347a8c07fc2	f0fe4fd5-3bdb-41d8-957c-d3f2770001d6	assistant	Bien sûr, Alan ! 😊 Alors, dans le domaine du business, y a-t-il une compétence où tu te sens à l'aise ou que tu aimerais améliorer ? Ça nous aiderait à orienter tes choix. 😊	Bien sûr, Alan ! 😊 Alors, dans le domaine du business, y a-t-il une compétence où tu te sens à l'aise ou que tu aimerais améliorer ? Ça nous aiderait à orienter tes choix. 😊\n\n<!--PROFILE:{"R":0,"I":0,"A":0,"S":0,"E":75,"C":0,"name":"Alan","genre":"M","traits":["ambitieux"],"interests":["devenir riche","business"],"strengths":[],"suggestion":""}-->\n<!--SUGGESTIONS:[{"text":"Je suis bon en communication","emoji":"🗣️"},{"text":"Je suis organisé","emoji":"🗂️"},{"text":"Pas sûr de mes forces","emoji":"🤷"}]-->	\N	0	none	0	2026-04-03T08:08:16.973Z
5f939324-8040-40c3-875d-678b401e24e8	a7fe57c7-060b-46a8-8901-01ac3e79b938	assistant	بالطبع، أنا هنا لمساعدتك! 😊 ما الذي تود التحدث عنه اليوم؟ هل هناك شيء معين يشغل بالك أو تود استكشافه في مسارك المهني أو الدراسي؟	بالطبع، أنا هنا لمساعدتك! 😊 ما الذي تود التحدث عنه اليوم؟ هل هناك شيء معين يشغل بالك أو تود استكشافه في مسارك المهني أو الدراسي؟	\N	0	none	0	2026-04-03T08:31:16.722Z
2d483677-8c36-4cdd-b800-6969cbccf3a6	a7fe57c7-060b-46a8-8901-01ac3e79b938	assistant	Pas de souci ! 😊 Alors, dis-moi, qu'est-ce qui t'intéresse en ce moment ? Que ce soit un hobby, une passion ou un projet, je suis là pour écouter et t'aider à explorer tout ça.	Pas de souci ! 😊 Alors, dis-moi, qu'est-ce qui t'intéresse en ce moment ? Que ce soit un hobby, une passion ou un projet, je suis là pour écouter et t'aider à explorer tout ça.	\N	0	none	0	2026-04-03T08:31:24.047Z
5d83a4d4-57b6-467d-a4ba-ec0dd5ce7f60	e23e66c1-01c6-457e-9419-dfff398705ff	assistant	Klar, Gérard! 😊 Ich bin hier, um mit dir zu plaudern und herauszufinden, was dich interessiert. Gibt es etwas, das du gerne machst oder das dir besonders Spaß macht? 🤔	Klar, Gérard! 😊 Ich bin hier, um mit dir zu plaudern und herauszufinden, was dich interessiert. Gibt es etwas, das du gerne machst oder das dir besonders Spaß macht? 🤔\n\n<!--PROFILE:{"R":0,"I":0,"A":0,"S":0,"E":0,"C":0,"name":"Gérard","genre":"M","traits":[],"interests":[],"strengths":[],"suggestion":""}-->\n<!--SUGGESTIONS:[{"text":"Musik hören","emoji":"🎧"},{"text":"Sport machen","emoji":"🏃"},{"text":"Bücher lesen","emoji":"📚"}]-->	\N	0	none	0	2026-04-03T09:19:58.681Z
923df6bb-780b-4fff-bddc-e70a939f3d69	865097d6-8bc9-4a8d-a809-f335a6330c6c	assistant	Salut Pascale ! C'est génial que tu aies envie de te découvrir davantage 😊 Pour commencer, parle-moi un peu de ce que tu aimes faire dans la vie. Qu'est-ce qui te passionne ou te fait vibrer au quotidien ? 🎨	Salut Pascale ! C'est génial que tu aies envie de te découvrir davantage 😊 Pour commencer, parle-moi un peu de ce que tu aimes faire dans la vie. Qu'est-ce qui te passionne ou te fait vibrer au quotidien ? 🎨\n\n<!--PROFILE:{"R":0,"I":0,"A":0,"S":0,"E":0,"C":0,"name":"Pascale","genre":"F","traits":[],"interests":[],"strengths":[],"suggestion":""}-->\n<!--SUGGESTIONS:[{"text":"J'adore dessiner","emoji":"🎨"},{"text":"Je suis passionnée de musique","emoji":"🎶"},{"text":"J'aime bien cuisiner","emoji":"😊"}]-->	\N	0	none	0	2026-04-03T09:30:41.309Z
c5ebe477-2045-4f23-ba29-41472661dc39	20a73d4a-c8a6-4514-af08-66df296e0030	assistant	Pas de souci, c'est normal de se sentir un peu perdu au début 😊 Qu'est-ce que tu aimes faire dans ton temps libre ? Peut-être qu'on peut partir de là pour explorer ensemble.	Pas de souci, c'est normal de se sentir un peu perdu au début 😊 Qu'est-ce que tu aimes faire dans ton temps libre ? Peut-être qu'on peut partir de là pour explorer ensemble. \n\n<!--PROFILE:{"R":0,"I":0,"A":0,"S":0,"E":0,"C":0,"name":null,"genre":null,"traits":[],"interests":[],"strengths":[],"suggestion":""}-->\n<!--SUGGESTIONS:[{"text":"J'aime dessiner","emoji":"🎨"},{"text":"J'adore les jeux vidéo","emoji":"😊"},{"text":"Rien de spécial","emoji":"🤔"}]-->	\N	0	none	0	2026-04-03T09:33:42.861Z
6d860eb3-6444-4e2b-9c12-fe0cfdaa16d3	a3ed3b06-2fc2-4a2e-9e52-61d49bbb251c	assistant	Bien sûr, pas de souci ! 😊 On peut continuer en français. Qu'est-ce qui te passionne dans la vie ? Qu'est-ce que tu aimes faire ? 😊	Bien sûr, pas de souci ! 😊 On peut continuer en français. Qu'est-ce qui te passionne dans la vie ? Qu'est-ce que tu aimes faire ? 😊	\N	0	none	0	2026-04-03T09:56:20.651Z
d077cb68-e107-423f-82dc-7fa9ee568248	a3ed3b06-2fc2-4a2e-9e52-61d49bbb251c	assistant	Kein Problem! 😊 Was begeistert dich im Leben? Was machst du gerne? 😊	Kein Problem! 😊 Was begeistert dich im Leben? Was machst du gerne? 😊	\N	0	none	0	2026-04-03T09:56:24.996Z
a24ca8d8-5ba1-41ba-8811-5f918b3fbf78	a3ed3b06-2fc2-4a2e-9e52-61d49bbb251c	assistant	Bien sûr ! Alors, qu'est-ce qui te plaît le plus dans tes activités ou tes loisirs ? Parle-moi un peu de ce que tu aimes faire ! 😊	Bien sûr ! Alors, qu'est-ce qui te plaît le plus dans tes activités ou tes loisirs ? Parle-moi un peu de ce que tu aimes faire ! 😊	\N	0	none	0	2026-04-03T09:56:30.492Z
787f574e-3440-486b-a8d9-ab0255e93f7d	6fa639e0-53de-4e71-b271-8ca620a7646e	assistant	Bien sûr, avec plaisir ! 😊 De quoi aimerais-tu parler ? Tu as des passions ou des trucs qui te font vibrer en ce moment ?	Bien sûr, avec plaisir ! 😊 De quoi aimerais-tu parler ? Tu as des passions ou des trucs qui te font vibrer en ce moment ?	\N	0	none	0	2026-04-03T10:58:05.286Z
777972b0-1db9-4bf4-9591-50053ecd6355	6fa639e0-53de-4e71-b271-8ca620a7646e	assistant	Pas de souci ! 😊 Peut-être que tu as des activités ou des matières à l'école que tu trouves intéressantes ? Ou des projets que tu aimerais réaliser à l'avenir ? Parle-moi un peu de ce qui te passe par la tête ! 😄	Pas de souci ! 😊 Peut-être que tu as des activités ou des matières à l'école que tu trouves intéressantes ? Ou des projets que tu aimerais réaliser à l'avenir ? Parle-moi un peu de ce qui te passe par la tête ! 😄\n\n<!--PROFILE:{"R":0,"I":0,"A":0,"S":0,"E":0,"C":0,"name":null,"genre":null,"traits":[],"interests":[],"strengths":[],"suggestion":null}-->\n<!--SUGGESTIONS:[{"text":"J'aime bien le sport","emoji":"🏃"},{"text":"Je préfère la musique","emoji":"🎶"},{"text":"Rien de spécial","emoji":"🤔"}]-->	\N	0	none	0	2026-04-03T11:01:11.475Z
54563c23-6cba-456f-b275-e16558d6db23	6fa639e0-53de-4e71-b271-8ca620a7646e	assistant	Pas de souci, parfois ça prend un peu de temps pour trouver ce qui nous plaît vraiment. 😊 Est-ce qu'il y a des choses que tu fais régulièrement, même si ça te paraît banal ? Parfois, les petites habitudes peuvent révéler des intérêts cachés. 😄	Pas de souci, parfois ça prend un peu de temps pour trouver ce qui nous plaît vraiment. 😊 Est-ce qu'il y a des choses que tu fais régulièrement, même si ça te paraît banal ? Parfois, les petites habitudes peuvent révéler des intérêts cachés. 😄\n\n<!--PROFILE:{"R":0,"I":0,"A":0,"S":0,"E":0,"C":0,"name":null,"genre":null,"traits":[],"interests":[],"strengths":[],"suggestion":null}-->\n<!--SUGGESTIONS:[{"text":"Je joue souvent aux jeux","emoji":"🎮"},{"text":"J'aime regarder des séries","emoji":"📺"},{"text":"Je sors avec des amis","emoji":"😊"}]-->	\N	0	none	0	2026-04-03T11:05:00.034Z
5f60c9ec-5468-4ad9-a99b-5aba65ef78fb	6fa639e0-53de-4e71-b271-8ca620a7646e	assistant	C'est super de passer du temps avec ses amis ! 😊 Ça montre que tu aimes le contact humain et partager des moments avec les autres. Est-ce que tu fais des activités particulières avec eux, comme des sorties, des jeux ou autre chose ? 😄	C'est super de passer du temps avec ses amis ! 😊 Ça montre que tu aimes le contact humain et partager des moments avec les autres. Est-ce que tu fais des activités particulières avec eux, comme des sorties, des jeux ou autre chose ? 😄\n\n<!--PROFILE:{"R":0,"I":0,"A":60,"S":70,"E":0,"C":0,"name":null,"genre":null,"traits":["sociable"],"interests":["sortir avec amis"],"strengths":["contact humain"],"suggestion":null}-->\n<!--SUGGESTIONS:[{"text":"On fait du sport ensemble","emoji":"🏃"},{"text":"On va au cinéma","emoji":"🎬"},{"text":"On traîne juste","emoji":"😅"}]-->	\N	0	none	0	2026-04-03T11:05:09.497Z
0c235499-cd23-47e5-871b-aa17339c3c4d	865097d6-8bc9-4a8d-a809-f335a6330c6c	assistant	Sure thing, Pascale! 😊 So, what do you love doing in your free time? Are there any hobbies or activities that really excite you? 🎶	Sure thing, Pascale! 😊 So, what do you love doing in your free time? Are there any hobbies or activities that really excite you? 🎶\n\n<!--PROFILE:{"R":0,"I":0,"A":0,"S":0,"E":0,"C":0,"name":"Pascale","genre":"F","traits":[],"interests":[],"strengths":[],"suggestion":""}-->\n<!--SUGGESTIONS:[{"text":"I love painting","emoji":"🎨"},{"text":"I'm into photography","emoji":"📷"},{"text":"I enjoy reading books","emoji":"📚"}]-->	\N	0	none	0	2026-04-03T11:05:52.300Z
c921870a-ac63-4a0e-8100-c8baae7ee3b6	ffc0ee7c-c643-485e-bc07-a5ce5e0d8365	assistant	Salut ! Je suis là pour t'aider 😊 Tu peux commencer par me dire ce qui t'intéresse en ce moment ou ce que tu aimes faire. Je suis tout ouïe ! 🤔	Salut ! Je suis là pour t'aider 😊 Tu peux commencer par me dire ce qui t'intéresse en ce moment ou ce que tu aimes faire. Je suis tout ouïe ! 🤔	\N	0	none	0	2026-04-03T11:15:08.408Z
e303523c-6467-425e-9583-a46a3723b1c5	ffc0ee7c-c643-485e-bc07-a5ce5e0d8365	assistant	Sure thing! What are you passionate about or interested in lately? 😊 Let's dive into what makes you tick!	Sure thing! What are you passionate about or interested in lately? 😊 Let's dive into what makes you tick!	\N	0	none	0	2026-04-03T11:19:27.466Z
bedf7f6f-0a2f-4058-93dd-98a8cfc4ae17	ffc0ee7c-c643-485e-bc07-a5ce5e0d8365	assistant	¡Perfecto! Cuéntame, ¿qué es lo que más te gusta hacer o qué te interesa últimamente? 😊 Estoy aquí para ayudarte a descubrir más sobre eso.	¡Perfecto! Cuéntame, ¿qué es lo que más te gusta hacer o qué te interesa últimamente? 😊 Estoy aquí para ayudarte a descubrir más sobre eso.	\N	0	none	0	2026-04-03T11:19:36.095Z
8e5f53aa-bbaa-4039-ba99-3234867daa01	ffc0ee7c-c643-485e-bc07-a5ce5e0d8365	assistant	بالطبع! 😊 أخبرني، ما هي الأشياء التي تحب القيام بها أو ما الذي يثير اهتمامك في الوقت الحالي؟ أنا هنا لمساعدتك في اكتشاف المزيد عن ذلك. 🤔	بالطبع! 😊 أخبرني، ما هي الأشياء التي تحب القيام بها أو ما الذي يثير اهتمامك في الوقت الحالي؟ أنا هنا لمساعدتك في اكتشاف المزيد عن ذلك. 🤔	\N	0	none	0	2026-04-03T11:21:04.220Z
8f7fcd31-6d0e-4205-a1a3-fb8d12c219b7	865097d6-8bc9-4a8d-a809-f335a6330c6c	assistant	Pas de souci, Pascale ! 😊 Reprenons en français alors. Parle-moi un peu de tes passions ou de ce que tu aimes faire pendant ton temps libre. Qu'est-ce qui te fait vraiment plaisir ? 🎨	Pas de souci, Pascale ! 😊 Reprenons en français alors. Parle-moi un peu de tes passions ou de ce que tu aimes faire pendant ton temps libre. Qu'est-ce qui te fait vraiment plaisir ? 🎨\n\n<!--PROFILE:{"R":0,"I":0,"A":0,"S":0,"E":0,"C":0,"name":"Pascale","genre":"F","traits":[],"interests":[],"strengths":[],"suggestion":""}-->\n<!--SUGGESTIONS:[{"text":"J'adore lire","emoji":"📚"},{"text":"Je fais de la danse","emoji":"💃"},{"text":"Je joue de la guitare","emoji":"🎸"}]-->	\N	0	none	0	2026-04-03T11:23:04.986Z
aa3d1c43-2a08-46bb-897c-0e9a06ea76ed	a3ed3b06-2fc2-4a2e-9e52-61d49bbb251c	user	Bonjour, je suis intéressé par les métiers du numérique	\N	\N	0	none	0	2026-04-03T11:26:40.177Z
f38f814a-0e68-49b6-bb88-398111527505	a3ed3b06-2fc2-4a2e-9e52-61d49bbb251c	assistant	Salut ! C'est génial, le numérique est un domaine en pleine expansion ! 😊 Qu'est-ce qui t'attire le plus dans cet univers ? La programmation, le design, la gestion de projets, ou autre chose ? 🤔	Salut ! C'est génial, le numérique est un domaine en pleine expansion ! 😊 Qu'est-ce qui t'attire le plus dans cet univers ? La programmation, le design, la gestion de projets, ou autre chose ? 🤔\n\n<!--PROFILE:{"R":0,"I":0,"A":0,"S":0,"E":0,"C":0,"name":null,"genre":null,"traits":[],"interests":["numérique"],"strengths":[],"suggestion":""}-->\n\n<!--SUGGESTIONS:[{"text":"La programmation","emoji":"💻"},{"text":"Le design","emoji":"🎨"},{"text":"La gestion de projets","emoji":"📊"}]-->	\N	0	none	0	2026-04-03T11:26:42.427Z
4dcfcb1c-1246-4c5f-98cd-1ae2a66ec6cb	0c583a69-bb10-48ef-a7c3-c6cb2a12335e	assistant	Bien sûr, avec plaisir ! 😊 Qu'est-ce qui te passionne dans la vie ? Qu'est-ce que tu aimes faire pendant ton temps libre ?	Bien sûr, avec plaisir ! 😊 Qu'est-ce qui te passionne dans la vie ? Qu'est-ce que tu aimes faire pendant ton temps libre ?	\N	0	none	0	2026-04-03T12:11:44.905Z
7c4e9246-c99f-42b4-abc4-5e94c991fde3	0c583a69-bb10-48ef-a7c3-c6cb2a12335e	assistant	¡Perfecto! 😊 Cuéntame, ¿qué cosas te gustan hacer en tu tiempo libre? ¿Hay algo que te apasione especialmente?	¡Perfecto! 😊 Cuéntame, ¿qué cosas te gustan hacer en tu tiempo libre? ¿Hay algo que te apasione especialmente?	\N	0	none	0	2026-04-03T12:12:00.812Z
b4f20129-391d-45f1-a905-ae3c996df3d2	1dbcf9ec-5d28-4707-8b63-7bc02754e923	assistant	Pas de souci, on continue en français ! 😊 Qu'est-ce qui te passionne dans la vie ? Qu'est-ce que tu aimes faire pendant ton temps libre ?	Pas de souci, on continue en français ! 😊 Qu'est-ce qui te passionne dans la vie ? Qu'est-ce que tu aimes faire pendant ton temps libre ?	\N	0	none	0	2026-04-03T14:47:48.603Z
\.


--
-- Data for Name: message_direct; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.message_direct (id, prise_en_charge_id, expediteur_type, expediteur_id, contenu, conversation_type, lu, horodatage) FROM stdin;
361db6b6-ec64-4144-b6f9-0eb9c40b5517	1cc69ba0-3fa5-4807-ba14-ea578ba0a7bb	beneficiaire	917ad1d9-37af-4223-aa84-4c1ee508f564	Bonjour Serge !	direct	0	2026-04-03T08:22:17.330Z
8696d12f-ddc1-4e81-a617-691c93c83102	1cc69ba0-3fa5-4807-ba14-ea578ba0a7bb	conseiller	systeme	{"type":"rupture","motif":"Le bénéficiaire a choisi de repartir à zéro. L'accompagnement est terminé.","comportementInaproprie":false,"parBeneficiaire":true}	direct	0	2026-04-03T08:39:06.277Z
a9c545de-6821-49ad-9a1f-09311f234946	74d907fd-b30e-48b3-92e2-70f8a8eb6aa7	conseiller	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	bonjour	direct	0	2026-04-03T09:18:31.250Z
a11c0e75-1a9c-4a2a-b4cf-19bdb720c35f	74d907fd-b30e-48b3-92e2-70f8a8eb6aa7	beneficiaire	e036af1d-83c0-46e3-9d60-77313f52b261	Bonjour	direct	0	2026-04-03T09:18:39.304Z
7673a698-a62e-43cf-9345-0c99e1dcf27e	74d907fd-b30e-48b3-92e2-70f8a8eb6aa7	conseiller	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	{"type":"visio","sessionId":"d35f9036-0306-49c5-baee-47bae8121116","status":"ringing"}	direct	0	2026-04-03T09:18:42.961Z
3382a9c3-47e6-49a1-ab42-987d27062859	74d907fd-b30e-48b3-92e2-70f8a8eb6aa7	beneficiaire	e036af1d-83c0-46e3-9d60-77313f52b261	Bonjour	direct	0	2026-04-03T09:19:59.126Z
06edabb5-44d4-4afe-bbeb-aef95dbd7986	74d907fd-b30e-48b3-92e2-70f8a8eb6aa7	conseiller	systeme	{"type":"rupture","motif":"Le bénéficiaire a initié une nouvelle demande.","comportementInaproprie":false,"parBeneficiaire":true}	direct	0	2026-04-03T09:22:29.692Z
fdb477a2-303d-4852-8ffc-b03ce3320d95	35f01748-4212-49a2-bf03-4cf05f87efdf	beneficiaire	e036af1d-83c0-46e3-9d60-77313f52b261	Bonjour Admin !	direct	0	2026-04-03T09:25:40.559Z
0bb961c9-15d7-42f1-bce7-c5dd36d4de37	35f01748-4212-49a2-bf03-4cf05f87efdf	beneficiaire	e036af1d-83c0-46e3-9d60-77313f52b261	Hello	direct	0	2026-04-03T09:26:22.683Z
49d6dcde-4e39-434c-b1cf-7960d793bc7a	35f01748-4212-49a2-bf03-4cf05f87efdf	conseiller	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	hello	direct	0	2026-04-03T09:26:30.182Z
80f0e346-8736-4117-bcad-8ae54873a4ca	35f01748-4212-49a2-bf03-4cf05f87efdf	beneficiaire	e036af1d-83c0-46e3-9d60-77313f52b261	Tty	direct	0	2026-04-03T09:29:32.508Z
665ae866-3e0c-4065-a275-1e1557725d04	35f01748-4212-49a2-bf03-4cf05f87efdf	conseiller	systeme	{"type":"rupture","motif":"Le bénéficiaire a initié une nouvelle demande.","comportementInaproprie":false,"parBeneficiaire":true}	direct	0	2026-04-03T09:34:34.921Z
a9e13ae4-459e-4f7d-bbca-927b3034bcb4	8e4bb66c-7e37-4db3-a9b8-ba9d6fb37f73	conseiller	systeme	{"type":"rupture","motif":"Le bénéficiaire a initié une nouvelle demande.","comportementInaproprie":false,"parBeneficiaire":true}	direct	0	2026-04-03T09:46:45.146Z
53d747f2-c565-4a8f-9481-14d52a074d98	228dab26-1f7d-4d7e-b9e6-0794b5a50b9b	beneficiaire	e036af1d-83c0-46e3-9d60-77313f52b261	Bjr	direct	1	2026-04-03T09:47:34.588Z
b267f406-9855-413b-9bb0-437fef8f40d2	228dab26-1f7d-4d7e-b9e6-0794b5a50b9b	conseiller	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	bjr	direct	1	2026-04-03T09:47:53.001Z
3ae8f8d5-fdbb-4954-81fd-440ecb090ff0	228dab26-1f7d-4d7e-b9e6-0794b5a50b9b	conseiller	systeme	{"type":"rupture","motif":"Le bénéficiaire a annulé sa demande d'accompagnement.","comportementInaproprie":false,"parBeneficiaire":true}	direct	0	2026-04-03T09:57:46.656Z
a939e58f-0780-40cf-8995-31fb636ceece	12872d72-13d9-4fce-878f-f9715ad09116	beneficiaire	917ad1d9-37af-4223-aa84-4c1ee508f564	Hello	direct	0	2026-04-03T11:05:55.762Z
ea52fbd7-99bc-489b-bc09-c363b720e5c7	12872d72-13d9-4fce-878f-f9715ad09116	conseiller	systeme	{"type":"rupture","motif":"Le bénéficiaire a annulé sa demande d'accompagnement.","comportementInaproprie":false,"parBeneficiaire":true}	direct	0	2026-04-03T11:22:55.281Z
80c58cee-a10f-4f1f-828c-0846d3b2d935	fbea240b-ffa9-4f9e-aa63-e358fd1c59b0	conseiller	287c9b3a-c93e-4d89-ade3-e56b1059212e	Bonjour Alain !	direct	1	2026-04-03T14:49:11.484Z
3adb4582-0fa4-4f9c-a739-80d9ecf0c1af	fbea240b-ffa9-4f9e-aa63-e358fd1c59b0	conseiller	287c9b3a-c93e-4d89-ade3-e56b1059212e	{"type":"voice","audioUrl":"blob:https://pro.catchup.jaeprive.fr/215d70ff-0048-42ce-9d54-fb659814890f","duration":8,"transcription":"Bonjour, est-ce que tout va bien ?"}	direct	0	2026-04-03T14:51:02.673Z
\.


--
-- Data for Name: objectif_hebdomadaire; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.objectif_hebdomadaire (id, prise_en_charge_id, semaine, cible_heures, cible_recommandee_ia, ajuste_par_conseiller, commentaire, cree_le, mis_a_jour_le) FROM stdin;
\.


--
-- Data for Name: participant_conversation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.participant_conversation (id, prise_en_charge_id, participant_type, participant_id, actif, rejoint_le, quitte_le) FROM stdin;
\.


--
-- Data for Name: prise_en_charge; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.prise_en_charge (id, referral_id, conseiller_id, structure_id, statut, notes, score_matching, raison_matching, assignee_manuellement, premiere_action_le, terminee_le, notification_envoyee, cree_le, mis_a_jour_le) FROM stdin;
1cc69ba0-3fa5-4807-ba14-ea578ba0a7bb	cf697de9-219f-4fc0-9a58-e328eac6bfc9	287c9b3a-c93e-4d89-ade3-e56b1059212e	d2f39531-15c3-472e-b0cb-f70ce8e5f7ac	rupture	\N	\N	\N	0	2026-04-03T08:20:58.280Z	2026-04-03T08:39:06.277Z	1	2026-04-03T08:20:58.280Z	2026-04-03T08:39:06.277Z
74d907fd-b30e-48b3-92e2-70f8a8eb6aa7	87b94169-d25d-452d-bf50-cad4f248d51d	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	31395dae-b34b-4d39-8b80-23f2671c1b02	rupture	\N	\N	\N	0	2026-04-03T09:17:27.161Z	2026-04-03T09:22:29.692Z	1	2026-04-03T09:17:27.161Z	2026-04-03T09:22:29.692Z
35f01748-4212-49a2-bf03-4cf05f87efdf	562a0822-c7da-43fb-8e1a-bd583620960e	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	31395dae-b34b-4d39-8b80-23f2671c1b02	rupture	\N	\N	\N	0	2026-04-03T09:25:15.131Z	2026-04-03T09:34:34.921Z	1	2026-04-03T09:25:15.131Z	2026-04-03T09:34:34.921Z
8e4bb66c-7e37-4db3-a9b8-ba9d6fb37f73	314e392d-bf0c-4117-a28a-2109c9a97c8f	38631b01-9d23-47dc-be1f-f82126c2a72c	8a44f6df-a375-4c91-ad53-68e873206d3a	rupture	\N	\N	\N	0	2026-04-03T09:34:50.610Z	2026-04-03T09:46:45.146Z	1	2026-04-03T09:34:50.610Z	2026-04-03T09:46:45.146Z
228dab26-1f7d-4d7e-b9e6-0794b5a50b9b	750d5b42-8c54-439d-8daa-2e92b17dbc6d	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	31395dae-b34b-4d39-8b80-23f2671c1b02	rupture	\N	\N	\N	0	2026-04-03T09:47:01.300Z	2026-04-03T09:57:46.656Z	1	2026-04-03T09:47:01.300Z	2026-04-03T09:57:46.656Z
12872d72-13d9-4fce-878f-f9715ad09116	81c191a3-9b46-4135-93d5-cc43146ad2ec	287c9b3a-c93e-4d89-ade3-e56b1059212e	d2f39531-15c3-472e-b0cb-f70ce8e5f7ac	rupture	\N	\N	\N	0	2026-04-03T09:29:49.993Z	2026-04-03T11:22:55.281Z	1	2026-04-03T09:29:49.993Z	2026-04-03T11:22:55.281Z
fbea240b-ffa9-4f9e-aa63-e358fd1c59b0	2a4d122c-8eae-4a9c-b7d7-954f39f2d262	287c9b3a-c93e-4d89-ade3-e56b1059212e	d2f39531-15c3-472e-b0cb-f70ce8e5f7ac	prise_en_charge	\N	\N	\N	0	2026-04-03T14:49:04.355Z	\N	1	2026-04-03T14:49:04.355Z	2026-04-03T14:49:04.355Z
\.


--
-- Data for Name: profil_riasec; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profil_riasec (id, utilisateur_id, r, i, a, s, e, c, dimensions_dominantes, traits, interets, forces, suggestion, source, est_stable, coherence_signaux, mis_a_jour_le) FROM stdin;
052ede27-66c4-49da-9ee8-c7bf0d60edfb	764d8257-1e32-4045-998f-185c24fe3875	4	4	6	4	4	3	["A","R"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
b8a8241b-d214-4352-8804-dbed0eef0a90	972234d9-d1ac-4e99-9ef4-dd2da9d447f3	9	1	10	2	6	7	["A","R"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
d10ab311-93c2-4023-826b-6ce5e95ff853	cb903f71-6b96-4706-97be-bb2018cebe38	0	1	2	10	7	5	["S","E"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
d44bfd66-6b57-406a-b6b3-5e0f0fcf8905	7266cb6a-9155-4626-99ed-cab1b8577f19	5	8	9	6	1	6	["A","I"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
33da6970-889d-4358-9aa0-a194f4f3e3bc	2f9d92c8-7a48-4279-bae9-41de1912655c	5	10	2	2	7	7	["I","E"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
843a54a5-fd93-4d76-bf48-6a9b79ff3b8b	7278ccaf-7b99-43cc-bb98-381ec56db7f7	0	0	10	9	9	10	["A","C"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
67fa1fa1-c3c6-4627-92c2-0dc6725cac66	ba4fe67d-0997-4cfb-adfa-ff0a82994dc2	7	6	1	0	10	0	["E","R"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
75546003-390b-4947-bda2-daf841572cf1	23e431f7-de11-4c59-85a7-43fd04cc3d5c	4	1	2	9	9	4	["S","E"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
419a25d6-ec09-42d8-99ee-789824412a5f	ca7ebcaa-57d6-4622-bd06-706e8e5883aa	1	10	4	7	3	4	["I","S"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
4c2d4b67-4fd6-4d77-9d91-ca3a66c1ec0b	b9c29de8-174e-42b3-a365-d0898e968f0e	1	7	5	9	2	10	["C","S"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
0e741f1a-6811-4be8-a848-af3a47ba9036	61a285fa-0c7e-4da4-966c-6a3848a2ed02	3	6	0	6	0	7	["C","I"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
d9d3a35c-41fa-4399-a0fd-ab9a99ae90d3	0cb1645c-8fec-4b18-b5b9-547e72d31227	5	8	1	2	10	3	["E","I"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
0284caef-64c4-4e49-93d0-dfce9b3340c0	9f6b28a1-d107-4fb1-b90a-cad220cd1f6e	0	1	3	5	4	7	["C","S"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
819a80fd-4440-49b1-8fd4-ca9e523ef138	c3a6591b-04c7-445c-966b-2aed6292f2b4	4	3	5	8	5	3	["S","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
c153b7f2-bfc2-4842-9282-7aa42416ac92	68538956-a26d-4273-b38a-c3d3ce0c3908	0	5	7	5	7	10	["C","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
02edf745-88e2-4e25-b897-ebe2f1944295	c2e8c6bb-2929-4f5f-9265-c2ca2fedd072	0	8	8	10	5	4	["S","I"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
389fcf2d-1c10-4d0e-a264-8c45a87acd38	e26d46f1-0339-4e3e-8efe-a938c49b3d56	10	10	9	4	9	6	["R","I"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
6b5f2597-afc6-45a3-968d-ec83930cc284	033e1119-beb8-43ed-8605-4dd0532dba07	1	9	10	1	3	3	["A","I"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
d1b78de7-b558-4f91-9d2c-ec50ede56497	9704c08b-0b24-4788-80cd-d0be5da1fd99	1	3	0	10	3	6	["S","C"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
9c3598c3-f1f1-47ec-9263-4be3f31f638b	3f3181a4-8aaa-47d0-af07-bb3a9ed3d613	4	4	5	5	2	1	["A","S"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
3c8396cd-fe1d-4df0-b48f-0c20466a2028	d1e3307b-406a-42c6-818b-cf1adb2cfa6b	9	2	5	8	7	9	["R","C"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
4967ac53-4988-45ce-ba6a-6414f9007604	59ab8d32-27ca-476f-a994-f5e0063dae24	8	6	9	0	5	1	["A","R"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
f8a4bbeb-309a-4c44-88e8-e1b51622d6a1	a7f8d90a-2e64-4184-b7d1-a706970f9628	4	10	3	2	6	7	["I","C"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
c21b7aab-384d-4e90-acd1-b7a13fadcb02	59e3d40f-12de-49c4-b565-020bd233b1a8	2	4	5	5	2	5	["A","S"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
40835ce5-34a4-426c-9b11-24a80f30cc03	ef2fa34b-1555-4961-89c8-5af4b1ed7eed	8	6	8	5	0	2	["R","A"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
6988e1c3-af56-4692-8efd-87f45dee6487	6318fc54-b834-406f-a11f-ca365a386424	3	1	3	4	4	9	["C","S"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
f96e14fa-0c5a-4e0d-bdf0-67e20317fc8a	c739076c-0035-4abd-8ae9-da6ae3d17485	5	9	2	4	9	8	["I","E"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
2d1c7bff-429b-46da-8996-5be05f231796	d4b3c044-ebbd-4c2f-b30b-7845fa36d281	6	6	2	6	8	8	["E","C"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
78928291-49fa-45fc-902e-27b5561c33b4	0420c1db-a7eb-4f20-a244-f242e87f679b	1	3	10	6	10	6	["A","E"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
82d4ff21-0494-47b9-9ceb-e4cc0870aa26	3f13ff28-8fac-4e5f-9142-a9c3412fa4f5	9	10	6	2	1	2	["I","R"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
81899e96-2783-4526-a32b-7e250f35cb09	97ad5524-3180-468f-bbb1-bfab8cc9f54a	3	5	5	2	2	5	["I","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
f17d432c-8bcc-4c8a-a12b-51b69708af0a	863c92b1-6896-4bfd-a5bd-bb6c5ae2480b	6	8	7	3	0	3	["I","A"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
310a58b3-6ca2-408c-beca-a2425c4ea03c	e0142f18-d265-4280-8aff-f90d771130f5	1	6	2	3	2	2	["I","S"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
a3eea03a-6b62-49ba-974b-417948e29e29	5050641e-a789-4676-b22a-a7c807dfeafe	9	10	6	2	10	9	["I","E"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
143ae1d4-83f0-4694-a1ff-1faf1d55a08e	769ebb73-7f9d-4f98-8a10-ab5149b85dfb	2	4	0	7	9	10	["C","E"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
d2091cc5-15c8-429c-8740-e8ab7bc2ca5d	f20c171e-e75e-4c5f-98dd-b82593009008	6	9	7	5	7	4	["I","A"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
e7bd06aa-b084-4f15-bc77-7acbb8fe2342	db073130-2085-4b0d-94f5-0d32fa385953	3	7	8	3	2	6	["A","I"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
09d865b2-1cfc-4660-b657-771108d9be8a	b711deab-6ff4-46ed-a24f-1110c1356214	0	9	4	4	0	1	["I","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
2e56deae-2368-494e-a628-af938f39d695	fe350604-7636-4e7a-bdd8-1d0c6a6a57ef	1	8	4	3	4	10	["C","I"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
e2bdd631-f737-4f3f-a39e-1d8fb1ab4864	d40c1da4-481c-487b-948e-fc6e25bb6b7f	10	2	8	1	3	7	["R","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
f0d0d80c-22f9-432e-97e5-f8568a766554	efde489a-d530-4ecf-aeb9-0f04c194bcfa	3	3	7	2	1	2	["A","R"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
56e90f93-1579-4734-b576-d746557cfd25	d7a6d492-3ec7-49a2-b646-1bbf450fd0ae	1	7	8	7	9	6	["E","A"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
47f0d84f-3953-4a74-8c7c-7f8c5aeb8479	e8b0ae99-38b3-41cd-99ac-fec8c013112b	4	10	2	3	6	4	["I","E"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
c1d2d9f7-d8f4-45e6-a3ce-47491bafa725	824e1e50-207b-4f86-847d-249323ef280d	8	9	4	10	2	7	["S","I"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
9e66bb60-10af-4f65-927c-ea0bdc199811	96c3f06b-0783-4b28-921c-13f007d3b57f	6	0	0	5	1	6	["R","C"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
3314b6b8-9eb0-470e-bbfc-c3a149be130f	32061828-987b-442c-843e-557392375abc	4	0	7	9	3	4	["S","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
f6ddc299-6f12-4da1-b7f8-e8443c46ad2a	a41d007f-59cb-418e-a9f3-0a804c111893	4	9	10	8	4	8	["A","I"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
55ced2b5-505b-4e51-bfa3-3a632d541797	fe7157fd-18c6-41fa-aba6-4981b60d2721	6	10	5	6	10	2	["I","E"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
fcd50769-7aab-4042-8ee1-7dbe8bc1a6a1	830bc3e5-d2e7-45b6-96a8-736fd706a8b2	2	6	9	1	4	4	["A","I"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
9c455217-3319-4b8b-9880-3efa1c469ec7	41e2cec6-b7e3-435c-ba0a-e2373bbf4adb	1	8	10	8	10	2	["A","E"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
8d381cdd-29fa-443a-973b-2251b7b503cb	2c7ba8e3-c80a-45ef-ac3f-635148674432	6	5	4	10	8	9	["S","C"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
db8b363f-68ed-4d05-8594-65d26bd4298a	cfe6a6c0-ad96-442c-9804-e1048cc855cb	6	4	10	3	8	7	["A","E"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
64a77b20-a9ee-4d24-a419-d1947fc718c9	56d07aed-9bc9-4b99-9f6b-22eb71db1720	4	2	4	10	5	9	["S","C"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
124cfa3e-1325-4306-b8d3-93f02242aa99	5f529811-2674-42ef-8dba-66cc01dda263	4	2	3	9	6	4	["S","E"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
eaad6bfd-bbb3-4f29-9101-2b564a308df1	ec5d2b4a-75a0-49f3-bfb3-39dbb0cdddf0	4	10	6	6	7	10	["I","C"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
fb1188ee-537e-4542-a4e5-c85f63f1d490	5dcfa146-fe4b-45c7-8668-fca724591905	4	0	6	7	5	0	["S","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
fe031d0a-f0cc-443b-a45e-624e43822b05	a7d7571c-7589-4cd5-9910-d7b95d25732f	10	8	4	2	9	0	["R","E"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
992ca019-ba7d-40ad-8e84-bc2acd1f3c84	7b8ccdf8-5524-4f1b-b35c-8bc337dc685f	0	1	0	2	5	5	["E","C"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
88666f8e-64f3-409e-ac48-d6800cacc798	aefcd229-ae2e-443f-9a4a-1464dbcd4ab1	0	2	0	10	7	8	["S","C"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
e8ea8801-6b64-4cb7-886e-26f1c20be952	52baa462-4e8f-47de-b651-02b49215c6f4	1	0	9	2	6	8	["A","C"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
32ea1a10-c7a5-4bb1-b671-433a17551722	27ef7d2f-62ef-4934-9f80-95e490e00000	7	3	8	0	5	2	["A","R"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
7906ce8b-4b85-48db-b5f3-bc7b97f413b6	a6b61108-5b88-49fa-af98-24424716fa35	9	7	7	1	10	7	["E","R"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
5d9cb69a-ac59-4f39-a836-337ba01f02de	6ac697a3-4998-4ced-a765-7f2891cd6e3a	3	9	4	3	6	0	["I","E"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
8f00b2ea-a2a5-4cdb-98ff-97b9395a98c8	25643329-c5b1-4f2e-a95c-6b40dbffea4d	8	5	7	1	9	3	["E","R"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
761c0bc0-21ec-42b5-86e1-9c0cbcf9407c	5654e9f9-7355-4fd7-8f5f-3e50da717be7	0	1	0	7	9	9	["E","C"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
9017d26c-b5d1-46d3-b22d-e80e299ce790	df613825-3a7a-4445-8c19-cc386f7b8290	2	5	10	4	0	1	["A","I"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
d5975625-9fe2-413f-9fcd-f8e9cecdad71	83f10d16-4f0d-4012-9163-21b1605ae47a	6	1	9	5	0	8	["A","C"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
9c008468-1071-48b1-8901-2c1821d312bd	0e6a72df-0093-46ae-a343-10e6f4f209c0	8	8	1	4	0	4	["R","I"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
ba5ac532-bb32-4678-a6e2-514455b2e68e	4b042b4b-896a-4463-ab08-33ff459f1c73	0	8	5	1	4	5	["I","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
07a28808-dd4d-459e-8c9f-7112e58f21b3	649cb386-6ef2-44e0-9dba-1e78dd440243	5	1	5	2	8	10	["C","E"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
1fee5d7e-d461-4c8d-9abe-aef55b17d906	3e840809-f9b1-47f3-93be-3398b400fe8e	5	9	3	8	10	1	["E","I"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
094875ea-73a5-4b09-bf4f-bdfeb545142d	9142af93-5443-4882-9578-1dddbdaa388a	8	3	8	5	6	4	["R","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
7ade4844-e2dc-41b1-9b77-bbb845da0b70	86dacd72-5e1e-4495-9068-9779ffefa10c	4	9	2	3	1	8	["I","C"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
8c852c70-7148-426f-ab71-508fb7aeb19d	3bad7b59-de8a-4b2c-8a06-56483c74b4fa	3	9	0	7	0	9	["I","C"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
4b8c3810-a680-4ace-922d-f7393f786f40	9d5363de-631a-4f79-9fca-94651b0f8352	0	1	2	0	4	8	["C","E"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
40b9e030-6590-459d-a33c-d1c79d5b44d9	49868a7f-1025-45bf-b4d7-e6ede2711cda	6	1	0	2	6	0	["R","E"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
8e82ad15-5687-4a6c-91fd-903067839176	5b73a99f-d7fa-4edf-84a8-96823a3b3d84	2	5	3	4	6	3	["E","I"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
54152400-b4f9-40ff-8f73-8b6edc780d62	b2085c2d-d12d-47a5-bea3-c265176ab076	7	7	4	10	3	3	["S","R"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
ab2a0924-afa6-4b8d-9248-67426ee66d64	fc2eb61c-9799-4dcb-9ef7-bf8cdbb94956	1	5	3	8	1	3	["S","I"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
86f6e756-f4f4-453a-ab71-480b7b5be79b	916e2ed3-1aad-46a0-9aac-05a2518dd456	4	6	8	5	9	5	["E","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
b4a7a110-da2f-412b-a04a-4ef7d5e21e3c	247d8768-1e5b-4ab5-b294-cdeb91ae9b93	8	4	7	7	5	3	["R","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
77db783b-1c40-443d-a6a2-ff5226a9bc11	650df64d-603e-4912-9cfe-50543d8239b5	4	5	9	4	5	0	["A","I"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
324083b0-253b-493f-b994-831a8dbd2f8a	509e7d9a-3349-4453-bc18-6a81b2bf4a17	9	5	6	10	7	10	["S","C"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
0e8b0a51-3ed3-4606-9969-d21fc3a9b78a	03f3859c-31bd-4e4d-81a1-573aaf309145	0	4	0	3	4	9	["C","I"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
c0b79c06-1471-43d1-8671-8a10f46c5bda	3ad6a440-6e8d-4307-9b10-9dacf9670bfb	5	10	9	10	0	10	["I","S"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
7bc75cff-0504-4789-8a69-598c529f1343	9ba1501b-34fe-4484-a5c8-f144280a6ee2	6	6	9	8	5	4	["A","S"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
486e0217-f850-439e-b6e3-e921934dac97	796f63fc-3464-45ce-9608-d1010076bd86	8	8	0	3	10	8	["E","R"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
4e6676bc-40f6-4ad4-bcc7-e6a83c689ea8	b98ee361-a65a-470b-9948-bc5936c2e793	3	4	4	1	4	5	["C","I"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
7558c18f-3d9c-4554-a900-ef261994f3c2	ba58cedd-611e-4410-b70e-6c30fec6308f	8	3	6	0	2	10	["C","R"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
d473db88-3267-4b84-aa8a-ac14bca137f0	180d85fe-0bec-4109-9475-8aef5155137f	3	1	8	8	10	3	["E","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
90c2010a-0762-48e1-97a1-6a1c66007980	0f3ede6e-8e7b-4670-aa0e-ad99f7b84295	6	3	3	0	3	6	["R","C"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
9d5b86fb-bc57-4159-9f98-4fd8d141193c	df919098-a633-4505-91f8-47c7da95378e	10	3	7	1	4	4	["R","A"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
4e88ba2a-db13-40a5-aea5-5afefbc5c911	de9aea9c-3d5d-452d-aacc-3e50d9f47ab7	2	1	10	0	7	1	["A","E"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
c32918d7-1c54-4fd4-b530-64341ed12bde	67106ae0-b3c9-497d-a08b-26d91ca3e638	2	5	8	3	3	8	["A","C"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
d9f5c31e-3700-40ca-bc56-b421a3622129	eecfc43e-20f5-47d4-a502-2c6cdaa71b97	8	6	2	3	7	10	["C","R"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
642123eb-48f5-49f1-ab13-6f419d8c0f6e	4cb6df89-f816-4b76-9df1-67b8e8b45b23	4	3	10	8	6	7	["A","S"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
e3d2b8d5-2bbe-4875-9ab4-d6406e559ffb	ad2e1c6d-486b-479b-976c-d9fde079fb35	0	10	0	6	2	6	["I","S"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
8f58c1c4-4ba4-4d77-bff6-b6eafa6a3423	fed82a4a-ec58-431e-8e17-46a2fce18027	10	0	1	1	1	2	["R","C"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
486af4a7-78f5-4eaf-a269-b5625299ca96	331b09e1-a578-4c26-a278-b8059cb0c30a	4	8	3	3	5	1	["I","E"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
4fad667c-7dc5-4aa1-9f05-e6537bfb33c1	421b4fba-05d3-4ee3-bf03-7b7a7828484b	7	4	10	8	4	2	["A","S"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
6ed75b1f-cca4-40fe-af7a-51f8f317327a	a78f72af-ce1d-452e-a464-59f6a52f5808	5	1	4	2	3	2	["R","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
c1b139e5-8e96-4ac2-9360-37f22bf1be5f	1e24e7f8-3feb-42d9-bb17-4a8437730563	2	9	4	0	5	0	["I","E"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
1a30a31c-dd06-4993-ae47-15c82cb76fa3	99239065-37df-43aa-89e3-7fd7e263083d	7	7	3	5	5	4	["R","I"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
1e5142b0-9c7f-42e3-a6b2-72df05e74a55	1a80741e-7156-4314-a1f5-7b85958beea2	7	7	3	8	4	5	["S","R"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
51ed4117-33a0-47ce-808b-eba4c04ff41f	1b10bdb7-9ab0-44b5-b281-f295ebb7b6c4	6	5	5	5	9	9	["E","C"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
af6ae792-286c-474e-b109-5b2535297b1e	1daeb1b4-5ce2-44af-a5bb-4fc40fc64e42	6	1	9	2	1	10	["C","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
d524f078-1d15-40e5-ae86-e28c93bdaff2	cd532497-bd2b-46e6-91ab-2654551a3dc1	0	7	4	9	9	2	["S","E"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
f50f2a20-129a-432c-889d-573b64f7b785	0da6f58a-d769-4bbb-991a-0b8540ed722b	1	0	2	1	3	10	["C","E"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
e78d6651-d9c1-4c86-8015-7e9677adffbf	e01af09a-d399-441c-9758-3f799dfed44d	5	3	8	6	10	1	["E","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
f4bb30ed-a9fc-4e84-b3e8-0a1cd0489cb8	b32b7963-c6af-4e56-aa61-7b7fc7f16dc7	4	8	4	2	9	1	["E","I"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
337a7c72-dce5-4dac-af7f-b977d1e1721a	0afb833e-932e-4f87-8c99-d643cb0ab0aa	9	4	0	7	7	9	["R","C"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
55e0ea56-999e-406c-84df-7ae1c58edf14	ca90b20a-bcf7-4b09-a945-4f464e98e104	4	5	5	1	1	4	["I","A"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
0e043996-5248-4a67-83d9-7158f24294f0	e430ab53-087d-4998-bf48-22d39cab3501	10	9	9	7	5	8	["R","I"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
82c9b6c8-f6a0-479e-a3e4-579d51ce5a99	3318e30a-1226-4c57-859b-10ec31dfa510	4	5	8	8	6	1	["A","S"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
29e75d56-d240-4462-a8aa-35d948be3ba8	28fca49e-e608-4f46-a3a2-c1ebe8200190	6	1	8	10	7	2	["S","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
9132608d-d02e-4776-9f1e-715da99003e5	fd6541c7-1303-4453-8bab-458ff6cf8282	9	8	7	2	2	10	["C","R"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
cab9300e-3842-47d2-99cc-23d243edd94a	069db21a-84fa-4b6d-b28f-a4173b11f710	6	9	2	4	1	2	["I","R"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
2a0902f5-868f-4aa9-87e5-53c4332161a1	508239d2-9f0e-4471-b893-7b50c0631e64	10	0	8	9	4	3	["R","S"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
84921570-1c76-465e-826e-1ba5f182b778	4841b942-e1f1-4b82-8b04-a11b9bfb1fd9	2	0	0	0	2	7	["C","R"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
9915db54-8fdc-48ad-b2a4-ab48b33998f3	8dfa724f-a9d8-463f-bfca-38e3dca8ae6a	8	5	8	10	3	6	["S","R"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
8b4144f5-f223-4dc0-9622-062f406a4396	5dff5942-25af-4fff-8011-cd012c664484	7	2	6	6	4	2	["R","A"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
c65003f7-d5f2-46e9-a8d5-887479643ef8	8525858f-4edb-4479-bc5d-443829d2c466	9	0	2	6	2	10	["C","R"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
a321e48f-5347-4200-99cd-94cdb330c373	45394e25-24e5-4d02-84a5-46713af6d193	7	6	4	5	5	0	["R","I"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
ea3728e5-5146-4d12-9065-6ed9c2968c04	4c210ad7-014b-48a6-8286-a8ddf5264d3e	10	6	8	5	2	0	["R","A"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
37947333-7a34-44b9-be81-18210d648ee0	42981fb0-76a8-4cc1-af47-7ced202835cd	4	9	9	8	3	1	["I","A"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
83942a02-5dc7-4234-9e4d-023f4cfa68fe	179113ab-61e5-4a0e-bd42-93c4b2b1f5c2	8	3	8	8	2	5	["R","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
1a4bdbf5-9322-4194-b376-6ae3a77c0ed4	406e7405-ed52-4710-a0c7-32d69f0839c0	7	10	10	2	9	3	["I","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
a51c0f5c-9129-44fc-b4a2-ef15800b7a3d	95db2322-9525-4a7e-b10b-9b21fa6e1f1f	10	9	9	0	5	3	["R","I"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
8953451f-05eb-4e5d-b635-48f7dd0238b2	49d0e9b0-1e04-48d7-9695-6224265064b4	2	6	10	0	9	8	["A","E"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
833bb739-323b-4a92-8237-0af1e03cd04e	18413dff-7869-45f7-a745-8349f57d89f3	1	10	8	1	0	3	["I","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
8a1af34e-44b0-4c51-9014-d9765d352002	3c765e0f-7583-4179-a98f-295c1c624ab9	8	7	10	9	7	7	["A","S"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
d0ec2ead-ca21-4a3f-9cc6-ce43a8199686	41a1bf37-54d8-4a0f-af19-4b84f13bf4c9	4	9	6	1	10	2	["E","I"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
0ed45cc4-b37a-438d-8a0d-6dc6e6c8f9d6	757d5cb8-94bc-41ae-b53a-f8e5b9435d65	5	4	8	9	10	10	["E","C"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
04891141-4dd0-449b-807b-d048abcc87c6	64d8a371-0774-48ed-8508-28532898c01e	9	6	10	9	9	0	["A","R"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
353221ba-3a9d-4502-9cb9-4279560f8f22	d4b22522-6c2f-4eb8-8299-ed7e1b3bb4fa	7	10	1	2	2	6	["I","R"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
f141ecc2-996d-4c49-b5f7-cf5c4c888010	b60a337a-1515-477b-9ae0-58009984cbe6	10	2	9	8	3	2	["R","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
9c9fbef4-db05-446e-a7a4-f930e11ea9b9	33eac1eb-4c71-4ec8-a2c5-9da733f8a8b6	6	0	2	1	10	10	["E","C"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
d87dfa20-0b7c-4317-a58b-eb0ad064df52	4f63c8f6-9a67-42f2-b658-730b8db0b1e6	2	0	0	9	3	4	["S","C"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
280c80bf-369c-436f-be54-feffac1a5ae3	63ba0dc7-2836-4cab-9c81-997ef1beb339	1	6	6	0	0	10	["C","I"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
2e13ad50-75d6-44f8-b371-2014d7de1c2f	b3da3233-e79e-460c-bcff-d90f75a87d11	6	9	10	1	5	8	["A","I"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
44374ed5-0e55-4652-a947-72d938557b54	fbc8ceaf-70f0-4d2e-85ad-08d3fa343f9c	5	1	6	2	10	6	["E","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
56c887e5-cb8e-4b63-9907-4acc58c8dbb4	c6d6de52-9dd5-4e5a-99bd-ff4b3c017a43	10	5	9	0	6	4	["R","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
b3fe4f77-db03-41b1-9306-f893a27df31d	39e2b1bf-6616-4559-8d4b-6315d337fc50	2	2	10	9	7	8	["A","S"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
23b922a7-7ea5-4f46-8b8f-eaff5c8d74a0	b0499347-d62f-4784-9531-114b06900600	5	0	10	7	8	8	["A","E"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
34e45929-392d-483e-84ca-24926a1cc186	dc9090c7-5234-496f-8bee-56d4ac07d8b9	1	2	8	10	6	9	["S","C"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
e6a42034-971b-44ed-840d-89735625e276	e4e3ab10-0b41-4a5d-a7f0-9a9f2f5eacc7	8	4	7	8	0	2	["R","S"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
ead74321-477f-4221-98f4-e6d5c6b91447	8b556cf5-1bf7-453d-8405-8b39a2e5dc43	9	8	5	10	4	9	["S","R"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
17c15e94-bf7e-4807-93d0-4b9b4581a89a	f66c8ffc-3566-48c8-a4b0-d1d8d04de22b	6	9	6	6	5	9	["I","C"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
a8240f1e-b889-4f8c-b419-ae9844e9f185	703959fe-92ee-442c-8838-96e13e37d92d	2	1	7	10	0	0	["S","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
a2cb4b4f-956f-4035-8e88-16bbd1448578	ce736c1c-ced1-4a2c-b257-4df5434563b0	5	5	7	3	1	6	["A","C"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
6c7d1628-6192-4343-a7c3-5bf54c9b36f3	59ba42d1-24e6-469b-8c35-621b4cedc99e	7	10	0	10	6	0	["I","S"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
cfc6940d-1536-4f28-a82e-9c353d83f18b	b5eb3c91-d2b5-429e-acfa-e0d0f5abe612	9	3	3	2	8	10	["C","R"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
16f26f04-69af-4a0f-84d8-f0ebadc3a841	ab1c30f5-5061-452a-abc7-8930c2983061	6	8	7	2	3	5	["I","A"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
cf51bc13-e8db-4ad2-9d27-f4e7027088af	cf3b02c7-3cd7-4d22-8ee0-22a7b75a2a99	0	5	3	6	1	0	["S","I"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
2f815d3f-39e7-4243-b91e-5ca2331bb989	06dc14ad-2dc8-4f03-82bf-549c1750b258	5	8	3	6	3	5	["I","S"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
eb834bc1-2ad6-4941-8571-af211dddbf6f	7317326a-e743-4a69-a01a-a74ac4c17341	4	3	0	1	0	2	["R","I"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
be8762c2-61d7-4b98-a473-94c8abfdfe61	4242128d-1bcd-4377-9db5-48263b1b9067	2	7	4	2	9	9	["E","C"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
c1e20b75-cfc0-42a2-a294-be5d5aab9f94	10c3f1d7-35b1-4ee7-bf4a-2fae5da5a5ec	8	1	7	4	1	10	["C","R"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
817ec720-abfc-43b4-95d1-2975355581b8	314dd029-8784-47c7-800a-b65a89c5bfa0	10	7	6	7	4	9	["R","C"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
9909146d-4561-465c-a30f-0ae0b470fa46	01743b7a-b33f-4689-bcb3-667f0b615490	4	0	9	4	3	3	["A","R"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
4becd741-1223-4d72-bb2c-3f78cee7256f	180e76c3-8b14-4dba-86e8-f2461866cf9a	7	6	4	5	0	10	["C","R"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
c8b37fb1-25af-4ca7-8446-3ce60fcc5999	9b19d083-772c-4b3a-8a3b-2d05a8c0f8a1	6	9	3	4	9	1	["I","E"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
0a0f1513-d54d-44d4-9d18-8f975c849334	6ee23bc6-35b7-4e55-aa1b-c9c5ea4f4368	3	2	0	7	1	10	["C","S"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
fe7e80bc-b3fe-4ee5-8817-bf8bf7d83973	94d23641-2374-4822-8efe-835096bc964b	8	5	4	5	4	8	["R","C"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
895b8b40-19b2-4437-b99b-2e7ffa052254	1af91dc4-f78c-4baa-84dc-bd94b6628937	8	9	5	4	7	2	["I","R"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
4a7a3d72-cc5c-4412-b20e-ec59dbd4b095	61ed4304-60d0-4278-b3fc-b8035ae89610	4	2	9	1	3	9	["A","C"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
9629482d-f199-43fa-a16f-e15ca2e43ecd	40581249-3949-40cb-8e46-664bb4236c2b	5	1	9	9	5	2	["A","S"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
13f850e2-0422-4c6a-981a-ccde271f2919	f2a0c531-e0e2-41f9-88c5-03abf0c62f6e	2	9	0	8	6	0	["I","S"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
fc7278a4-3f7c-4580-a8aa-8cce5a2e51bb	a8cbf0f9-e99e-41c7-a7d3-bdf02893f377	2	5	4	5	6	0	["E","I"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
b5b72e34-a917-41d6-8d59-c76983d8c08b	92d6f485-dd75-4f15-8689-d655442f3066	3	2	0	4	6	7	["C","E"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
b0b33332-3262-4699-af8d-0da70f30c9a9	96af85b9-db3c-4253-b1f6-c502d423748b	5	4	10	6	5	5	["A","S"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
978e53af-c8b2-4bd8-be7e-5aa8348bec83	f6510755-469c-4285-a02f-39a27508dcd6	2	0	0	10	7	2	["S","E"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
c54473fd-1ac6-4757-a3bf-a3622a5e277d	7423daf1-d204-432e-b6cd-65f3e0cee53c	4	2	4	2	7	1	["E","R"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
9f53353d-b01b-41be-b190-631820d8eb60	12c1c264-4559-4bb3-8f7f-85942e02ff22	4	10	3	1	4	1	["I","R"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
02e19371-a62c-4e67-b35d-ac0abeb9cb01	a4210ec5-7e1e-4524-8b93-caa4097c04c7	1	5	3	9	9	2	["S","E"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
17137d6e-58e3-43d1-9b56-920572a31bdb	a55fdb49-098b-4d52-a6fe-a428a23d2c47	1	1	0	5	6	9	["C","E"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
44732c6f-8011-457b-930e-9ed5d27bb0d6	d3d0c553-73a6-474f-8ad0-7de504a44ca9	1	5	0	3	7	0	["E","I"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
9224476f-ead9-4978-8e9e-f22709deff7e	a2885063-17c1-4381-b9a2-546941ea319e	7	4	9	10	4	2	["S","A"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
1f23ccfd-c76f-47e3-a884-fb945ff5f8cd	c1212cee-3b85-4b0d-a15c-4dffaf32e669	9	9	0	5	6	6	["R","I"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
6a1c4d50-c900-4997-8a55-bbdf72f8a76d	60a0f991-af45-4ee5-9667-e9028db6cc48	1	0	7	9	0	2	["S","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
f9626a79-9a66-45eb-91b6-85ec03b7fd9d	fd99e0ca-adff-4441-8930-d33d751f338d	5	10	4	0	4	7	["I","C"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
34e7f4ee-be0d-49e4-b2e7-f06c09c50067	dd7958bf-ee38-49c8-a415-9b3bedc2f0d6	6	1	4	8	1	9	["C","S"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
c3a16c2b-acbd-440d-baf7-dabe1e7e3bf2	7d1d750a-4ef8-47ce-a931-1b9fe6b9f49e	0	4	4	9	6	9	["S","C"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
f14d1bc8-bcfe-47de-aade-5af95adacb27	0bd68b2d-f655-4144-b7bc-771feec336c3	0	7	0	0	10	1	["E","I"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
d91c2f9c-43e4-4b4e-a061-ae0bd7a4a745	2f8dec79-7738-4d51-a41d-1ee3f70b9988	4	7	3	10	2	9	["S","C"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
9d9dce4c-6a20-433d-aa43-9a300a111c96	20b623fe-413c-4f8f-8b2c-d4500aa96a84	1	7	9	10	3	0	["S","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
332e142e-6112-4fa1-ad37-bb1d4e37fa62	a3f1e578-9e48-415b-b33c-34f0b86cb66e	0	8	2	7	9	2	["E","I"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
ddd4c549-0ce8-4309-859b-05974c907025	3a93c177-0629-4841-93c4-1c4af6731579	6	0	3	8	10	6	["E","S"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
5271aac6-c790-457b-9604-628a202fa5fc	e162347e-9ffa-412f-8ccc-886afb575db6	9	3	7	8	9	3	["R","E"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
0ffffbb7-3a41-4136-a25a-cff641d01632	2cd16062-6978-410a-b9d3-e3446b2dbe8f	8	0	1	9	1	7	["S","R"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
5b5b3f48-a986-4f2d-8f77-c809fd50339d	3de8b387-ff4b-4bbd-a263-97e331321225	8	6	4	10	5	5	["S","R"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
de914b4e-2bb6-4884-a26d-6593e940967f	8fe5d659-c661-4b97-91e0-a067c5f22cb8	0	3	8	9	5	0	["S","A"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
9f017960-ae1b-47cb-91b0-9667e5b45c38	b726a0b9-9690-4c50-8e30-dbd283520fe4	8	8	10	4	6	3	["A","R"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
8e995e43-9c87-4fb5-aac3-086d00828654	5fb5a284-5c15-4fd2-98a9-09c9825602a3	5	0	7	0	9	5	["E","A"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
6cd380ef-b1d1-4ba1-b957-9da9879adb71	ef753a23-d9dd-465c-85a1-77b0eb8e478a	7	3	4	8	10	7	["E","S"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
104a0d79-53e9-43d7-b07b-3e15198e8175	9e0f0abb-d9b0-43c6-86c9-0cdf1cef8421	9	10	3	4	5	1	["I","R"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
4de68df3-c00c-4054-9a19-83035445869a	4524bddb-31ac-401d-91b2-9a093914aa72	6	1	1	7	0	6	["S","R"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
3a1e07bd-c0da-45f1-8656-71d69e3bf324	c4c24e69-e45d-4397-b516-01a93f56fddc	10	0	2	3	10	10	["R","E"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
1f341a49-35a5-4654-9932-9c4923807fbf	fbc357d6-24d3-4a23-bc4e-568cc698cdc1	5	8	3	9	7	3	["S","I"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
516467f5-0f9e-4292-bc47-f3d1ff000960	06c75081-3902-4d97-a9e1-9950a9f72211	9	7	9	5	7	5	["R","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
ba20b3e3-561b-4f81-86bd-ef3d1b61c86f	25a4b725-3b30-49ae-bde4-32a109d0aaf5	5	6	1	4	3	5	["I","R"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
6ec4fc04-bea1-42b2-b28e-72d35d78a26c	c18b9565-e55f-47bf-8ad8-5ede1971326e	6	1	9	7	1	9	["A","C"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
4d426e09-4a13-4d08-91d4-d5a93670a597	0782a562-8562-421f-bb77-a980f9b17414	10	7	9	3	8	2	["R","A"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
e4167384-6eab-44ce-8ffc-efafaf4892a0	a5e754fd-de58-4c94-978e-d934e2eb8d30	5	3	9	7	3	7	["A","S"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
6acf3074-7b9b-4061-84fe-c53310f5e9b8	54397c3f-fc8a-4bbc-9491-58c4f2326513	2	10	6	10	1	8	["I","S"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
4f778b9b-1bda-490b-8164-0b3f94a4acfe	7e805fa7-7ce9-4113-b0e7-f133d3ed5e64	7	9	7	9	10	4	["E","I"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
23e1a464-3e71-4307-895e-5f192902c8f5	c9120feb-d40f-4030-a9a5-095f5e02d608	1	2	1	9	3	10	["C","S"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
0e0fb4ed-4a20-4c64-a83f-f5d44c37403f	f60e2beb-acd7-4e87-8f56-b13fc1a4ac22	2	10	10	4	9	7	["I","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
0b4e4cc5-8413-4c2a-a257-a665883dbee4	39be7f82-99f3-491e-842d-417fa7df4700	4	5	3	7	6	8	["C","S"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
8e2f5592-3cf4-4055-be2d-1e56c08ab44e	654cc014-09ce-427d-a696-1d19d6d0adff	1	10	7	4	7	1	["I","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
3bbc7ec0-faf6-46df-ae14-f4a7e0241f54	b6f5c8b4-eb4b-4689-a5f2-d8fdd2d5149d	5	7	0	0	8	0	["E","I"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
1c1b6d84-1677-41d9-96f6-d22c898d442a	43ebe8bb-f6a6-4c7c-85a2-d28024521201	6	3	2	0	4	3	["R","E"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
079274bd-6b2f-4723-a5e9-bbc555818c74	03a8a89e-37cb-4428-9425-013c69ddd2c6	3	0	3	8	10	7	["E","S"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
d28fce72-48cd-4985-bf78-0cbc4a90b7a5	c122a8c9-5581-4f93-88a7-b5a45b0e710d	6	9	8	8	2	9	["I","C"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
e94a8076-2184-4023-b91f-67edf378f786	eff36237-540d-4a35-a070-f7b2b911bc95	3	10	7	6	9	3	["I","E"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
de702633-7017-4d23-b99e-f631ba6d321e	76270bf6-f037-4ea5-8079-146a184cafc0	9	5	9	1	5	6	["R","A"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
a1da6454-715f-4ebd-ae24-0f36b82d6ce0	cdaca7ab-094c-442b-8d2b-9f3dee56c635	1	6	6	5	9	6	["E","I"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
9e65b9d9-4320-48f4-bf4b-bb7b419b8122	c1bd6a0c-0f61-4894-a866-5ac89cd05f82	10	3	9	7	0	4	["R","A"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
0ac98e37-cf6a-4f77-9b9b-5af8c0a4ef3b	92598bcd-69c4-4b3b-bde0-f1c05569d886	10	3	1	8	2	2	["R","S"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
5ea29ebc-62c1-4196-abd1-5bffddfd58d3	c81f9f95-e102-4558-bcb5-cc45ce7d018c	7	1	4	10	5	8	["S","C"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
4d912b52-6ab1-4a68-95cb-61e5dea4faa6	05d49191-ef46-4e50-aa03-fde945c96896	2	7	8	9	7	1	["S","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
2ebf3f79-8702-4fb6-910c-ada2641902fd	b4158d6b-da5a-4f8b-8be4-5488ebf13b32	6	10	10	2	10	8	["I","A"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
4057ce01-fbe3-4555-ac52-bb6f874cc019	6c9e4172-b593-4ae3-9c12-7aeb73fb3361	3	2	1	6	8	10	["C","E"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
e984a575-c74f-4627-8236-c885cb2bd0d4	da216f27-4c36-403d-9041-9295c4577b6b	7	0	7	4	9	2	["E","R"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
86274816-12f3-48ba-8219-8b96befdc0ba	478a7def-c724-4d1e-838c-24d4a7e8aa3b	1	10	7	4	0	8	["I","C"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
33dc4388-a1a3-4ef6-bf87-5e5dccd11135	381f924c-fe52-4a9f-8568-11369e14c544	3	9	4	4	2	7	["I","C"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
e33eae01-e8a4-418b-b550-2149a257b9aa	25c7b2b0-4759-4100-953d-c732e7d51cfc	3	10	1	7	4	9	["I","C"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
8d096138-b5b3-4402-8ba0-d245583089c0	0a58652a-8b68-4074-a9a0-ed0f609205e8	5	4	3	6	3	9	["C","S"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
5dcb5607-7115-48c4-858e-41e958146dac	2e1216a4-098c-46ef-9bdb-54d64d2d128c	1	3	9	4	0	6	["A","C"]	\N	\N	\N	\N	conversation	1	mixte	2026-04-02T23:12:33.540Z
c8224e39-a293-4cf1-9535-dfa6d44cf029	7aec43d7-b9f4-4626-8f31-33acab3c3945	0	9	8	6	6	5	["I","A"]	\N	\N	\N	\N	conversation	0	mixte	2026-04-02T23:12:33.540Z
\.


--
-- Data for Name: push_subscription; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.push_subscription (id, type, user_id, endpoint, keys_p256dh, keys_auth, cree_le) FROM stdin;
\.


--
-- Data for Name: rappel; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rappel (id, prise_en_charge_id, type, statut, date_envoi, contenu, cree_le) FROM stdin;
\.


--
-- Data for Name: referral; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.referral (id, utilisateur_id, conversation_id, priorite, niveau_detection, motif, resume_conversation, moyen_contact, type_contact, statut, source, campagne_id, webhook_envoye, webhook_reponse, relance_envoyee, structure_suggeree_id, localisation, genre, age_beneficiaire, cree_le, mis_a_jour_le, recontacte_le) FROM stdin;
94a3f84e-0b65-4671-b849-245ad5341594	764d8257-1e32-4045-998f-185c24fe3875	c559ae83-4e02-4007-8014-89cc520193c3	normale	1	Demande d'accompagnement	NEET depuis 6 mois, isolement social. Intérêt pour le sport et l'animation.	jade558@email.com	email	en_attente	sourcee	\N	0	\N	0	5a7e5324-468d-4d70-ab5f-6517f518c473	18	F	24	2026-03-19T09:07:34.201Z	2026-04-02T23:12:33.540Z	\N
a901f821-ea0a-4ccd-944d-dcf92c029679	972234d9-d1ac-4e99-9ef4-dd2da9d447f3	c48e6099-ffba-48ed-8a3e-c6ac28d39e5f	normale	1	Demande d'accompagnement	Jeune en recherche d'apprentissage dans les métiers de bouche. Motivé(e) et avec une première expérience de stage.	0663368777	telephone	en_attente	sourcee	\N	0	\N	0	1a78559d-8632-4638-9f2f-9ae15954ce90	40	F	21	2026-03-16T02:57:53.449Z	2026-04-02T23:12:33.540Z	\N
7af19740-5bbd-483a-8130-a2b110014de7	cb903f71-6b96-4706-97be-bb2018cebe38	1bc321ff-01de-43ae-9349-4c4334a7b918	haute	2	Fragilité modérée — accompagnement recommandé	Décrocheur/se depuis 3 mois, en perte de motivation. Besoin d'un accompagnement pour se remobiliser.	rayan442@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000090	92	M	16	2026-03-18T03:13:35.534Z	2026-04-02T23:12:33.540Z	\N
2e5848d0-3a85-4bab-bc76-67279626343f	7266cb6a-9155-4626-99ed-cab1b8577f19	4651d2fd-29a6-458d-b8b5-8988d6952302	normale	1	Demande d'accompagnement	Lycéen(ne) en seconde, premier contact avec l'orientation. Curieux/se mais indécis(e).	wassim978@email.com	email	en_attente	generique	\N	0	\N	0	\N	29	M	24	2026-03-23T10:19:53.693Z	2026-04-02T23:12:33.540Z	\N
308822f1-7b43-45ee-a885-0d98fa62e259	2f9d92c8-7a48-4279-bae9-41de1912655c	953fc9f2-aadb-4764-842c-0c8fc5eb8a97	haute	2	Fragilité modérée — accompagnement recommandé	Lycéen(ne) en terminale, hésitant(e) sur l'orientation post-bac. Intérêt pour les métiers créatifs et le social.	romane487@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000086	35	F	24	2026-03-26T03:29:33.589Z	2026-04-02T23:12:33.540Z	\N
27c97787-07c7-4809-afc9-2d650c731bf9	7278ccaf-7b99-43cc-bb98-381ec56db7f7	91d3ac98-5137-44f2-8852-031fbd16a96b	normale	1	Demande d'accompagnement	Sortie de formation sans diplôme, besoin de remobilisation et de confiance en soi.	0659080424	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000041	86	F	20	2026-03-17T05:56:55.991Z	2026-04-02T23:12:33.540Z	\N
d71a8a3e-ab39-45c6-ba58-35c3277a1915	ba4fe67d-0997-4cfb-adfa-ff0a82994dc2	816d6174-ea74-4eea-ae9d-7974cebd1f3a	normale	1	Demande d'accompagnement	En alternance mais souhaite changer de voie. Besoin de conseil.	alice623@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000067	69	F	16	2026-03-25T05:37:51.336Z	2026-04-02T23:12:33.540Z	\N
57847503-5abf-428f-a63e-6436baee4e10	23e431f7-de11-4c59-85a7-43fd04cc3d5c	50bba20c-ed93-4040-aa0d-41917d175d27	normale	1	Demande d'accompagnement	Jeune parent, cherche une formation courte compatible avec ses contraintes.	0643425007	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000090	44	M	21	2026-03-19T19:24:50.596Z	2026-04-02T23:12:33.540Z	\N
2b116eae-092e-42f1-a824-94fa0b1f4ff5	ca7ebcaa-57d6-4622-bd06-706e8e5883aa	cd4ee462-127d-4dc7-8c28-1dce077d8ab1	normale	1	Demande d'accompagnement	Lycéen(ne) en seconde, premier contact avec l'orientation. Curieux/se mais indécis(e).	louis855@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000088	55	M	19	2026-03-14T06:43:58.852Z	2026-04-02T23:12:33.540Z	\N
4b5b0507-1bbf-479c-9dc4-b3fa5aed3fb4	b9c29de8-174e-42b3-a365-d0898e968f0e	7babd6e6-482d-4699-928c-143f5a764e10	normale	1	Demande d'accompagnement	NEET depuis 6 mois, isolement social. Intérêt pour le sport et l'animation.	maxime554@email.com	email	en_attente	generique	\N	0	\N	0	\N	21	NB	20	2026-03-23T12:07:39.189Z	2026-04-02T23:12:33.540Z	\N
c65fca7d-6d92-46a1-8ef7-eb24692104b3	61a285fa-0c7e-4da4-966c-6a3848a2ed02	6202684c-c271-4df2-a118-111b0fe9e129	normale	1	Demande d'accompagnement	Conflit familial sur le choix d'orientation. Besoin d'un espace neutre pour construire son projet.	clara227@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000009	53	F	21	2026-03-24T14:02:25.235Z	2026-04-02T23:12:33.540Z	\N
2ead1478-85bc-4c08-b6a6-8195430b0782	0cb1645c-8fec-4b18-b5b9-547e72d31227	faf847ef-49cb-45dd-b947-9bb6fd3a2ee6	normale	1	Demande d'accompagnement	Passionné(e) de gaming/tech, cherche à transformer sa passion en métier.	ethan806@email.com	email	en_attente	generique	\N	0	\N	0	\N	24	M	20	2026-04-02T17:44:10.735Z	2026-04-02T23:12:33.540Z	\N
293fe3a9-6f1a-4cef-8d2c-ee32dcf4b2cb	9f6b28a1-d107-4fb1-b90a-cad220cd1f6e	7e2bb3c0-6e44-4452-90df-f3dde0997039	normale	1	Demande d'accompagnement	Lycéen(ne) en terminale, hésitant(e) sur l'orientation post-bac. Intérêt pour les métiers créatifs et le social.	margot177@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000027	47	F	16	2026-03-16T05:33:58.902Z	2026-04-02T23:12:33.540Z	\N
91ec7dd0-b378-4ceb-812c-a5be0a81d961	c3a6591b-04c7-445c-966b-2aed6292f2b4	bd3bc73e-d248-436a-99f4-d42b197dcf10	critique	3	Détresse détectée — orientation urgente	Décrocheur/se depuis 3 mois, en perte de motivation. Besoin d'un accompagnement pour se remobiliser.	0672894968	telephone	en_attente	sourcee	\N	0	\N	0	aaefcf2b-54db-4aa2-a4c6-a9c88834d717	72	F	20	2026-03-19T08:40:27.229Z	2026-04-02T23:12:33.540Z	\N
bb9c4f6d-c42d-45bf-9c4f-3f72936061c8	68538956-a26d-4273-b38a-c3d3ce0c3908	e8e08121-4ef0-4780-a45c-32f837a74aba	critique	3	Détresse détectée — orientation urgente	Lycéen(ne) en seconde, premier contact avec l'orientation. Curieux/se mais indécis(e).	chloe294@email.com	email	en_attente	generique	\N	0	\N	0	\N	50	F	21	2026-03-18T07:50:52.826Z	2026-04-02T23:12:33.540Z	\N
a45ee302-fd78-4a19-8e8d-f696338c4e97	c2e8c6bb-2929-4f5f-9265-c2ca2fedd072	d7aeb707-de9f-4a98-9331-8a1983a64ec6	haute	2	Fragilité modérée — accompagnement recommandé	Sortie de formation sans diplôme, besoin de remobilisation et de confiance en soi.	paul380@email.com	email	en_attente	generique	\N	0	\N	0	\N	28	M	17	2026-03-26T20:47:14.231Z	2026-04-02T23:12:33.540Z	\N
125efa07-f33e-4646-8de6-5a67d02ba167	e26d46f1-0339-4e3e-8efe-a938c49b3d56	49bb3f73-f489-429d-ba5f-7b732012c800	normale	1	Demande d'accompagnement	Conflit familial sur le choix d'orientation. Besoin d'un espace neutre pour construire son projet.	lucie53@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000090	52	F	22	2026-03-28T11:44:16.485Z	2026-04-02T23:12:33.540Z	\N
4e0a9247-ef3e-447b-8bc5-ed5f16393fbb	033e1119-beb8-43ed-8605-4dd0532dba07	ef596988-1d77-436c-a0b9-d5f5788ed3e6	normale	1	Demande d'accompagnement	NEET depuis 6 mois, isolement social. Intérêt pour le sport et l'animation.	0620487408	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000009	70	F	15	2026-03-18T08:07:02.008Z	2026-04-02T23:12:33.540Z	\N
97653936-1a5c-4de4-9e2e-e3228a4ae50a	9704c08b-0b24-4788-80cd-d0be5da1fd99	62c8daa3-8746-493c-aff3-bfbf41fc304e	normale	1	Demande d'accompagnement	En alternance mais souhaite changer de voie. Besoin de conseil.	chloe460@email.com	email	en_attente	generique	\N	0	\N	0	\N	26	F	19	2026-03-31T02:44:41.363Z	2026-04-02T23:12:33.540Z	\N
289dc989-f1dc-4b7d-8d4a-9b22aafc7cf6	3f3181a4-8aaa-47d0-af07-bb3a9ed3d613	59d6d2e6-bedc-404a-9413-cecb90787506	normale	1	Demande d'accompagnement	Sortie de formation sans diplôme, besoin de remobilisation et de confiance en soi.	lina475@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000047	2B	F	20	2026-03-25T00:03:09.588Z	2026-04-02T23:12:33.540Z	\N
22f1abec-a0b1-4d54-b40f-a36d9b0d9670	d1e3307b-406a-42c6-818b-cf1adb2cfa6b	cf3c6564-6489-4b06-a458-1602504fbd29	normale	1	Demande d'accompagnement	Passionné(e) de gaming/tech, cherche à transformer sa passion en métier.	theo970@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000016	37	M	22	2026-03-28T09:10:53.824Z	2026-04-02T23:12:33.540Z	\N
320e2df6-890c-4997-a4f9-49c7beee8ab3	59ab8d32-27ca-476f-a994-f5e0063dae24	97e03edc-31a4-4cc2-8da7-096c3b1fe006	haute	2	Fragilité modérée — accompagnement recommandé	NEET depuis 6 mois, isolement social. Intérêt pour le sport et l'animation.	amina362@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000020	54	F	25	2026-04-01T07:07:56.948Z	2026-04-02T23:12:33.540Z	\N
f2d2011d-b5fc-4a5d-a69f-4022551dfe92	a7f8d90a-2e64-4184-b7d1-a706970f9628	84d5d519-eb6c-4e0e-af5c-ce154e0085ad	normale	1	Demande d'accompagnement	Conflit familial sur le choix d'orientation. Besoin d'un espace neutre pour construire son projet.	gabriel860@email.com	email	en_attente	sourcee	\N	0	\N	0	8a44f6df-a375-4c91-ad53-68e873206d3a	70	M	25	2026-04-02T06:52:42.325Z	2026-04-02T23:12:33.540Z	\N
97322aba-4093-4938-8737-c4989d453c31	59e3d40f-12de-49c4-b565-020bd233b1a8	1841458a-0eff-453c-8171-7d444eab05a9	normale	1	Demande d'accompagnement	Sortie de formation sans diplôme, besoin de remobilisation et de confiance en soi.	0651558969	telephone	en_attente	generique	\N	0	\N	0	\N	23	M	25	2026-03-22T04:59:05.896Z	2026-04-02T23:12:33.540Z	\N
95c32fd7-b0e2-444a-9aa5-249fdea5326e	ef2fa34b-1555-4961-89c8-5af4b1ed7eed	9a29c307-388d-4c74-8799-034eb9baee0b	haute	2	Fragilité modérée — accompagnement recommandé	En service civique, cherche une suite. Profil social et engagé.	mehdi916@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000018	88	NB	17	2026-03-27T10:26:22.607Z	2026-04-02T23:12:33.540Z	\N
db0b08f8-8a4a-44b2-86fa-dbc1f618001e	6318fc54-b834-406f-a11f-ca365a386424	8340d3da-c1b1-4fc7-84a0-daa1f777ab9a	critique	3	Détresse détectée — orientation urgente	NEET depuis 6 mois, isolement social. Intérêt pour le sport et l'animation.	0638789363	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000074	51	F	16	2026-03-16T04:15:15.242Z	2026-04-02T23:12:33.540Z	\N
fee7f53a-6be5-4fcf-9dbb-0c3d5bdc78fd	c739076c-0035-4abd-8ae9-da6ae3d17485	47c376e7-5ef2-4df2-810d-1513360b90d1	normale	1	Demande d'accompagnement	Conflit familial sur le choix d'orientation. Besoin d'un espace neutre pour construire son projet.	0628236486	telephone	en_attente	sourcee	\N	0	\N	0	1a78559d-8632-4638-9f2f-9ae15954ce90	38	M	19	2026-03-24T22:04:11.505Z	2026-04-02T23:12:33.540Z	\N
eca09742-a298-4b2c-9d4c-f41a593dfc11	d4b3c044-ebbd-4c2f-b30b-7845fa36d281	45ebe672-80ff-4084-a87f-40d6968e2de1	haute	2	Fragilité modérée — accompagnement recommandé	Étudiant(e) en réorientation, insatisfait(e) de sa filière actuelle. Attiré(e) par le numérique.	ethan974@email.com	email	en_attente	generique	\N	0	\N	0	\N	53	M	21	2026-03-20T17:24:01.697Z	2026-04-02T23:12:33.540Z	\N
49c57b9b-d91b-41d9-97c3-eb45ff5c6287	0420c1db-a7eb-4f20-a244-f242e87f679b	c58397cf-8e8d-4f46-b2c7-f49a406dd7ea	haute	2	Fragilité modérée — accompagnement recommandé	Conflit familial sur le choix d'orientation. Besoin d'un espace neutre pour construire son projet.	0675700844	telephone	en_attente	generique	\N	0	\N	0	\N	80	F	16	2026-03-19T00:43:20.173Z	2026-04-02T23:12:33.540Z	\N
3b72a444-57a2-4b35-ae5e-b077eba1341a	3f13ff28-8fac-4e5f-9142-a9c3412fa4f5	a4e2de8b-347a-46ec-993c-cf7ec269087b	normale	1	Demande d'accompagnement	Étudiant(e) en réorientation, insatisfait(e) de sa filière actuelle. Attiré(e) par le numérique.	0650538497	telephone	en_attente	sourcee	\N	0	\N	0	5a7e5324-468d-4d70-ab5f-6517f518c473	29	M	18	2026-03-29T04:35:37.920Z	2026-04-02T23:12:33.540Z	\N
7ec54c1c-efbc-4a8a-bf10-6c2588cf7ed5	97ad5524-3180-468f-bbb1-bfab8cc9f54a	4b18a730-e932-455d-a8d7-004303d61beb	haute	2	Fragilité modérée — accompagnement recommandé	En alternance mais souhaite changer de voie. Besoin de conseil.	0681926575	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000097	52	M	19	2026-04-02T13:22:48.536Z	2026-04-02T23:12:33.540Z	\N
b9802177-535b-4724-9849-f01785157a49	863c92b1-6896-4bfd-a5bd-bb6c5ae2480b	f773dc9f-db41-42ca-820d-92d3d70ec193	normale	1	Demande d'accompagnement	Décrocheur/se depuis 3 mois, en perte de motivation. Besoin d'un accompagnement pour se remobiliser.	noah355@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000019	66	M	24	2026-03-23T12:59:11.186Z	2026-04-02T23:12:33.540Z	\N
fa7c9dfb-2c7f-4e91-a547-5d101e0316e8	e0142f18-d265-4280-8aff-f90d771130f5	dcd1a20b-d90f-48eb-ba94-2db3210f4170	normale	1	Demande d'accompagnement	Jeune en recherche d'apprentissage dans les métiers de bouche. Motivé(e) et avec une première expérience de stage.	romane829@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000013	86	F	20	2026-03-20T02:11:34.460Z	2026-04-02T23:12:33.540Z	\N
e0b8e940-28c4-4ee6-a527-b62ebd9d5b42	5050641e-a789-4676-b22a-a7c807dfeafe	b168e865-1774-4151-8df9-0a39e0e8afc3	normale	1	Demande d'accompagnement	Étudiant(e) en réorientation, insatisfait(e) de sa filière actuelle. Attiré(e) par le numérique.	0637992020	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000008	17	M	17	2026-03-26T19:40:44.511Z	2026-04-02T23:12:33.540Z	\N
81787d39-55d5-43a3-affe-0b9f0498f532	769ebb73-7f9d-4f98-8a10-ab5149b85dfb	9303921c-f989-4752-a383-42e7e5acb424	normale	1	Demande d'accompagnement	Jeune parent, cherche une formation courte compatible avec ses contraintes.	zoe454@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000035	10	F	25	2026-03-30T07:48:46.692Z	2026-04-02T23:12:33.540Z	\N
6451d3ce-9d46-4415-b7dd-ed851e14959a	f20c171e-e75e-4c5f-98dd-b82593009008	4ccd48d5-3579-4ee3-bcc8-68a668039ec2	haute	2	Fragilité modérée — accompagnement recommandé	En alternance mais souhaite changer de voie. Besoin de conseil.	lina828@email.com	email	en_attente	generique	\N	0	\N	0	\N	92	F	24	2026-03-23T11:33:06.591Z	2026-04-02T23:12:33.540Z	\N
88d5d368-7fb8-44f9-8e0d-77b34fe5ccd6	db073130-2085-4b0d-94f5-0d32fa385953	50b86a5d-a33d-43ea-9ed0-319561f19084	normale	1	Demande d'accompagnement	Jeune en recherche d'apprentissage dans les métiers de bouche. Motivé(e) et avec une première expérience de stage.	0683880724	telephone	en_attente	generique	\N	0	\N	0	\N	41	F	15	2026-03-21T16:57:16.214Z	2026-04-02T23:12:33.540Z	\N
81b448f6-6dda-4a67-ab03-0a1ec3c6b556	b711deab-6ff4-46ed-a24f-1110c1356214	31308a5f-110e-499e-bb60-bee5000e4eb0	haute	2	Fragilité modérée — accompagnement recommandé	Sortie de formation sans diplôme, besoin de remobilisation et de confiance en soi.	yanis153@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000086	64	M	21	2026-03-17T22:42:37.475Z	2026-04-02T23:12:33.540Z	\N
b88f8003-d8d6-4779-82c7-9d23e9f865ec	fe350604-7636-4e7a-bdd8-1d0c6a6a57ef	67cc111a-a998-4d87-ac46-1fef4fbccdc8	normale	1	Demande d'accompagnement	Jeune en recherche d'apprentissage dans les métiers de bouche. Motivé(e) et avec une première expérience de stage.	yasmine249@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000042	36	F	19	2026-03-15T02:46:27.572Z	2026-04-02T23:12:33.540Z	\N
ea2c42fc-37f3-4c51-a01a-3f81f2b71410	d40c1da4-481c-487b-948e-fc6e25bb6b7f	92fd429a-8295-414a-8329-656c3c8f956e	normale	1	Demande d'accompagnement	Lycéen(ne) en terminale, hésitant(e) sur l'orientation post-bac. Intérêt pour les métiers créatifs et le social.	0623145446	telephone	en_attente	generique	\N	0	\N	0	\N	57	M	16	2026-03-14T21:57:27.135Z	2026-04-02T23:12:33.540Z	\N
3346caf1-d5eb-4f4e-83cf-e5097e06f9ea	efde489a-d530-4ecf-aeb9-0f04c194bcfa	72cc3b70-93fc-40fc-a2d0-57fc8e392bc7	haute	2	Fragilité modérée — accompagnement recommandé	Jeune parent, cherche une formation courte compatible avec ses contraintes.	0633182193	telephone	en_attente	generique	\N	0	\N	0	\N	24	F	17	2026-03-14T06:16:48.742Z	2026-04-02T23:12:33.540Z	\N
af4f826a-b522-4fc1-a684-7d792d73c14d	d7a6d492-3ec7-49a2-b646-1bbf450fd0ae	5ef5f366-ee53-4aec-8b2b-a9dfffe61926	normale	1	Demande d'accompagnement	Décrocheur/se depuis 3 mois, en perte de motivation. Besoin d'un accompagnement pour se remobiliser.	kylian623@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000001	29	M	22	2026-03-19T21:39:17.656Z	2026-04-02T23:12:33.540Z	\N
95de92e9-8f00-493b-bf6a-df1cc9065826	e8b0ae99-38b3-41cd-99ac-fec8c013112b	6bdc200c-dc56-429b-9d38-3bcf1a98be97	critique	3	Détresse détectée — orientation urgente	Sortie de formation sans diplôme, besoin de remobilisation et de confiance en soi.	enzo692@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000026	02	M	20	2026-04-02T19:57:22.648Z	2026-04-02T23:12:33.540Z	\N
e4db95d3-e55c-4e6c-b6ed-de8c5b6724e7	824e1e50-207b-4f86-847d-249323ef280d	d1d9cb59-383d-4dab-beb9-6fcac624adca	normale	1	Demande d'accompagnement	Jeune parent, cherche une formation courte compatible avec ses contraintes.	romane464@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000002	34	F	22	2026-04-01T00:38:43.762Z	2026-04-02T23:12:33.540Z	\N
4150e6e9-06b3-4145-8ad6-d3a220974d75	96c3f06b-0783-4b28-921c-13f007d3b57f	df374ad4-44db-46fb-9ade-202adaeed2c8	critique	3	Détresse détectée — orientation urgente	Passionné(e) de gaming/tech, cherche à transformer sa passion en métier.	laura384@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000014	94	F	22	2026-03-22T18:12:13.972Z	2026-04-02T23:12:33.540Z	\N
59077faa-8c82-4136-a4e3-89c658d19e85	32061828-987b-442c-843e-557392375abc	fae22fe0-fa9b-4124-b1a9-7bc169b844d7	normale	1	Demande d'accompagnement	Décrocheur/se depuis 3 mois, en perte de motivation. Besoin d'un accompagnement pour se remobiliser.	leo12@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000091	87	NB	23	2026-03-24T02:51:40.714Z	2026-04-02T23:12:33.540Z	\N
245313bd-858b-40a9-98bf-fd421fb35988	a41d007f-59cb-418e-a9f3-0a804c111893	a5ac1744-7fcd-4c00-b8bb-88b08d6ea057	critique	3	Détresse détectée — orientation urgente	Décrocheur/se depuis 3 mois, en perte de motivation. Besoin d'un accompagnement pour se remobiliser.	julie119@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000059	85	F	17	2026-03-31T23:12:04.898Z	2026-04-02T23:12:33.540Z	\N
d0b70175-f30d-4f0d-be9a-2a3b5e8d203f	fe7157fd-18c6-41fa-aba6-4981b60d2721	a95b396e-10bf-4195-a543-576922d8473e	normale	1	Demande d'accompagnement	Lycéen(ne) en terminale, hésitant(e) sur l'orientation post-bac. Intérêt pour les métiers créatifs et le social.	enzo683@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000070	79	M	15	2026-03-15T21:59:39.782Z	2026-04-02T23:12:33.540Z	\N
22247aab-e1bf-4c4f-b9b6-9da34aeb401d	830bc3e5-d2e7-45b6-96a8-736fd706a8b2	08a3d13d-92fe-46d6-83b3-150d60c49a99	haute	2	Fragilité modérée — accompagnement recommandé	Étudiant(e) en réorientation, insatisfait(e) de sa filière actuelle. Attiré(e) par le numérique.	lucie294@email.com	email	en_attente	generique	\N	0	\N	0	\N	66	F	25	2026-03-30T01:54:18.774Z	2026-04-02T23:12:33.540Z	\N
6276ba19-dd97-447c-99c5-91a001ced1aa	41e2cec6-b7e3-435c-ba0a-e2373bbf4adb	3623602e-7741-45ff-8581-34cbf8e0f067	normale	1	Demande d'accompagnement	En service civique, cherche une suite. Profil social et engagé.	nour910@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000084	88	F	24	2026-03-20T02:38:55.824Z	2026-04-02T23:12:33.540Z	\N
5024ac6b-a6a5-42a6-a4d1-1973c2c45dd6	2c7ba8e3-c80a-45ef-ac3f-635148674432	925aaf7b-150e-4ea8-a900-0c38e1e58955	critique	3	Détresse détectée — orientation urgente	Lycéen(ne) en seconde, premier contact avec l'orientation. Curieux/se mais indécis(e).	0647606269	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000047	45	M	21	2026-03-21T20:18:59.998Z	2026-04-02T23:12:33.540Z	\N
b0cbf084-ceb1-4b01-bd92-8fc0bdcd2344	cfe6a6c0-ad96-442c-9804-e1048cc855cb	d18b219c-2448-406c-9c24-957ce9ab9e80	normale	1	Demande d'accompagnement	Conflit familial sur le choix d'orientation. Besoin d'un espace neutre pour construire son projet.	jules298@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000006	76	M	25	2026-03-28T15:25:34.206Z	2026-04-02T23:12:33.540Z	\N
1d6f8f75-e757-46bc-9c19-590186b50cdd	56d07aed-9bc9-4b99-9f6b-22eb71db1720	3c234fcd-b64c-4d00-83a2-a76dbb52a612	haute	2	Fragilité modérée — accompagnement recommandé	Jeune en recherche d'apprentissage dans les métiers de bouche. Motivé(e) et avec une première expérience de stage.	melissa475@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000004	55	F	24	2026-03-30T03:09:37.319Z	2026-04-02T23:12:33.540Z	\N
14de3342-f724-4083-9057-8b4b705b0eec	5f529811-2674-42ef-8dba-66cc01dda263	b23b3443-c5b9-4b46-95de-adcd74f83c44	normale	1	Demande d'accompagnement	En service civique, cherche une suite. Profil social et engagé.	0642040857	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000054	19	F	25	2026-03-24T10:10:52.183Z	2026-04-02T23:12:33.540Z	\N
6cafc24f-8df0-4cc5-a734-bd58972f5616	ec5d2b4a-75a0-49f3-bfb3-39dbb0cdddf0	08114740-fe86-4783-a608-40ef53a36055	haute	2	Fragilité modérée — accompagnement recommandé	En service civique, cherche une suite. Profil social et engagé.	0680184922	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000057	57	NB	17	2026-03-30T05:20:01.947Z	2026-04-02T23:12:33.540Z	\N
dc1ca5e6-4f6d-40f3-85f0-7930aac34f28	5dcfa146-fe4b-45c7-8668-fca724591905	125f5d30-959f-455e-9d6f-7e96367358e3	haute	2	Fragilité modérée — accompagnement recommandé	NEET depuis 6 mois, isolement social. Intérêt pour le sport et l'animation.	ethan715@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000032	43	M	23	2026-03-27T19:32:44.551Z	2026-04-02T23:12:33.540Z	\N
1dc5be63-5461-40a2-96eb-310719022f90	a7d7571c-7589-4cd5-9910-d7b95d25732f	05248ddf-76f6-45c8-9b8d-11243b6ab6fd	normale	1	Demande d'accompagnement	Jeune en recherche d'apprentissage dans les métiers de bouche. Motivé(e) et avec une première expérience de stage.	ibrahim231@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000004	45	M	17	2026-03-18T22:54:39.286Z	2026-04-02T23:12:33.540Z	\N
64ba2663-4a58-4297-9d23-e9f6fc067b1c	7b8ccdf8-5524-4f1b-b35c-8bc337dc685f	05d721f8-03b7-4af6-af08-91beaca5691c	normale	1	Demande d'accompagnement	Étudiant(e) en réorientation, insatisfait(e) de sa filière actuelle. Attiré(e) par le numérique.	maxime941@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000064	87	M	20	2026-03-23T13:50:52.636Z	2026-04-02T23:12:33.540Z	\N
5d16c211-b546-4360-a719-6351d3e0fcf8	aefcd229-ae2e-443f-9a4a-1464dbcd4ab1	2507569e-f737-4aa3-a220-cd8a1bd9f335	normale	1	Demande d'accompagnement	Passionné(e) de gaming/tech, cherche à transformer sa passion en métier.	victor516@email.com	email	en_attente	generique	\N	0	\N	0	\N	10	M	23	2026-03-24T07:42:15.564Z	2026-04-02T23:12:33.540Z	\N
66869a0b-1229-42a8-bed7-7c327eb6cd6f	52baa462-4e8f-47de-b651-02b49215c6f4	d4703d7e-108e-4db9-b871-7e28dba9787d	normale	1	Demande d'accompagnement	Conflit familial sur le choix d'orientation. Besoin d'un espace neutre pour construire son projet.	0664719564	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000099	67	F	24	2026-03-29T17:44:42.835Z	2026-04-02T23:12:33.540Z	\N
9701d442-088b-45dd-a1b4-be9c70bfdd2d	27ef7d2f-62ef-4934-9f80-95e490e00000	30a59498-e093-4270-a752-ca53c76f5070	normale	1	Demande d'accompagnement	Lycéen(ne) en terminale, hésitant(e) sur l'orientation post-bac. Intérêt pour les métiers créatifs et le social.	0611954427	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000078	18	F	18	2026-03-30T11:36:09.840Z	2026-04-02T23:12:33.540Z	\N
94a27520-17b5-478a-acf4-3b2c1ece089a	a6b61108-5b88-49fa-af98-24424716fa35	dc9fed84-e8d2-49bf-b17c-61ef5a13d9df	normale	1	Demande d'accompagnement	Jeune en recherche d'apprentissage dans les métiers de bouche. Motivé(e) et avec une première expérience de stage.	sacha277@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000082	04	M	20	2026-03-21T00:33:40.075Z	2026-04-02T23:12:33.540Z	\N
244d1f8d-d854-40e8-8498-2df168e62944	6ac697a3-4998-4ced-a765-7f2891cd6e3a	cf77dc1e-1740-4168-96a9-5d32d1dec59d	normale	1	Demande d'accompagnement	Jeune parent, cherche une formation courte compatible avec ses contraintes.	jules615@email.com	email	en_attente	sourcee	\N	0	\N	0	5a7e5324-468d-4d70-ab5f-6517f518c473	62	M	18	2026-03-29T21:31:07.101Z	2026-04-02T23:12:33.540Z	\N
4ece8a74-f4c6-45c2-bed9-2a9f971f662f	25643329-c5b1-4f2e-a95c-6b40dbffea4d	86faac26-c538-43d8-b377-e2ad0db5466d	haute	2	Fragilité modérée — accompagnement recommandé	Décrocheur/se depuis 3 mois, en perte de motivation. Besoin d'un accompagnement pour se remobiliser.	raphael310@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000035	70	M	23	2026-03-19T19:59:08.948Z	2026-04-02T23:12:33.540Z	\N
59596ff7-b5ab-45de-985b-6bba9957b3fb	5654e9f9-7355-4fd7-8f5f-3e50da717be7	52bf0381-b86b-4eba-b670-8e093ee4b16d	haute	2	Fragilité modérée — accompagnement recommandé	En alternance mais souhaite changer de voie. Besoin de conseil.	lea582@email.com	email	en_attente	generique	\N	0	\N	0	\N	01	F	20	2026-03-19T09:27:07.072Z	2026-04-02T23:12:33.540Z	\N
19306d12-79f6-4cab-b743-aa43cb162bcf	df613825-3a7a-4445-8c19-cc386f7b8290	9b843254-9be3-44a6-a1c1-6ff57e46d9f3	normale	1	Demande d'accompagnement	Lycéen(ne) en seconde, premier contact avec l'orientation. Curieux/se mais indécis(e).	yasmine987@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000043	52	F	24	2026-03-14T19:02:29.944Z	2026-04-02T23:12:33.540Z	\N
d732919e-5e48-4e64-87fd-fb0247efb363	83f10d16-4f0d-4012-9163-21b1605ae47a	ad0b7d3b-acec-4393-98a6-4398dd5eb695	normale	1	Demande d'accompagnement	Sortie de formation sans diplôme, besoin de remobilisation et de confiance en soi.	rayan977@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000018	60	M	22	2026-03-28T19:27:50.838Z	2026-04-02T23:12:33.540Z	\N
49c61da5-aad9-44cb-9496-955e2268aadb	0e6a72df-0093-46ae-a343-10e6f4f209c0	5e9d4afc-0fe0-4325-ae40-4f323d6daf27	normale	1	Demande d'accompagnement	Passionné(e) de gaming/tech, cherche à transformer sa passion en métier.	theo648@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000017	87	M	24	2026-03-19T00:00:56.444Z	2026-04-02T23:12:33.540Z	\N
7505db69-0f63-44ed-9ca9-fe68665ca1f8	4b042b4b-896a-4463-ab08-33ff459f1c73	9c0039bc-ce29-4f34-bcad-082bd6ca1e76	normale	1	Demande d'accompagnement	Lycéen(ne) en terminale, hésitant(e) sur l'orientation post-bac. Intérêt pour les métiers créatifs et le social.	ines416@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000005	07	F	24	2026-03-31T08:46:58.352Z	2026-04-02T23:12:33.540Z	\N
c7dd0a47-1fe6-4dec-8c4e-dc48d6d1f0af	649cb386-6ef2-44e0-9dba-1e78dd440243	9af10d00-df7d-4d4d-a08f-1b09cad6ace8	normale	1	Demande d'accompagnement	Conflit familial sur le choix d'orientation. Besoin d'un espace neutre pour construire son projet.	0653197829	telephone	en_attente	generique	\N	0	\N	0	\N	86	F	23	2026-04-01T18:27:50.059Z	2026-04-02T23:12:33.540Z	\N
f1c567a2-a7a7-4a86-a1e6-b54ebfead0be	3e840809-f9b1-47f3-93be-3398b400fe8e	cd11b20f-0afb-4306-9409-cbb366a1b0b2	haute	2	Fragilité modérée — accompagnement recommandé	Conflit familial sur le choix d'orientation. Besoin d'un espace neutre pour construire son projet.	sarah752@email.com	email	en_attente	generique	\N	0	\N	0	\N	60	F	23	2026-03-24T20:51:41.112Z	2026-04-02T23:12:33.540Z	\N
edc97f9f-0428-4123-b3e6-19d7de436ce3	9142af93-5443-4882-9578-1dddbdaa388a	d6b414e1-2399-4a5b-b9c3-ebb1a631f1aa	normale	1	Demande d'accompagnement	En alternance mais souhaite changer de voie. Besoin de conseil.	lucie570@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000040	52	F	20	2026-03-26T14:17:52.268Z	2026-04-02T23:12:33.540Z	\N
de6b8092-6da0-443e-b09d-869b340d6e6c	86dacd72-5e1e-4495-9068-9779ffefa10c	b101d0fb-7a8a-44bd-b204-c38825bf0213	haute	2	Fragilité modérée — accompagnement recommandé	En service civique, cherche une suite. Profil social et engagé.	sofia489@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000009	86	F	24	2026-03-14T18:42:48.780Z	2026-04-02T23:12:33.540Z	\N
10e8dd1e-5022-4681-8b5a-bca1b5ed5a6f	3bad7b59-de8a-4b2c-8a06-56483c74b4fa	d0e92ed7-9ebd-4922-9f8b-97d084d05067	normale	1	Demande d'accompagnement	Décrocheur/se depuis 3 mois, en perte de motivation. Besoin d'un accompagnement pour se remobiliser.	0697829976	telephone	en_attente	generique	\N	0	\N	0	\N	07	M	23	2026-03-29T15:10:44.969Z	2026-04-02T23:12:33.540Z	\N
e7fe6da4-0493-481c-a579-26b78771f735	9d5363de-631a-4f79-9fca-94651b0f8352	f4ff3cce-455e-4450-80a3-693f7602b1ae	haute	2	Fragilité modérée — accompagnement recommandé	Jeune parent, cherche une formation courte compatible avec ses contraintes.	anais556@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000015	52	F	15	2026-03-18T07:20:08.622Z	2026-04-02T23:12:33.540Z	\N
1940bff9-1731-48e7-9e1c-6af53fceb3af	49868a7f-1025-45bf-b4d7-e6ede2711cda	9c57442c-b898-40e5-ad25-c6770ad015f7	haute	2	Fragilité modérée — accompagnement recommandé	Lycéen(ne) en terminale, hésitant(e) sur l'orientation post-bac. Intérêt pour les métiers créatifs et le social.	wassim364@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000007	27	M	25	2026-03-29T23:19:18.462Z	2026-04-02T23:12:33.540Z	\N
31f23e11-1223-425b-bf5d-2c0b08d9b734	5b73a99f-d7fa-4edf-84a8-96823a3b3d84	84502ac1-28ba-4380-96fd-843d3255797a	normale	1	Demande d'accompagnement	Lycéen(ne) en terminale, hésitant(e) sur l'orientation post-bac. Intérêt pour les métiers créatifs et le social.	ines189@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000085	38	F	24	2026-03-25T05:35:47.647Z	2026-04-02T23:12:33.540Z	\N
3824bc70-4b2c-4af8-b5f4-55ca3ee86989	b2085c2d-d12d-47a5-bea3-c265176ab076	450017e5-cbbe-4c4b-9496-b64a1f13cbb9	haute	2	Fragilité modérée — accompagnement recommandé	Lycéen(ne) en seconde, premier contact avec l'orientation. Curieux/se mais indécis(e).	0615689525	telephone	en_attente	generique	\N	0	\N	0	\N	62	F	20	2026-03-17T08:12:32.373Z	2026-04-02T23:12:33.540Z	\N
bb297e6d-f972-4d2a-aa08-3c29c1cda819	fc2eb61c-9799-4dcb-9ef7-bf8cdbb94956	8cd85f06-611f-4712-8f7b-8f824c3798f1	haute	2	Fragilité modérée — accompagnement recommandé	Jeune parent, cherche une formation courte compatible avec ses contraintes.	laura317@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000049	16	F	19	2026-03-26T19:23:42.909Z	2026-04-02T23:12:33.540Z	\N
7f0bbca2-2f54-4cd9-b489-37d1cb1e0ee9	916e2ed3-1aad-46a0-9aac-05a2518dd456	bedd0c0a-0ff7-4d99-a525-92bc1e5d0e91	normale	1	Demande d'accompagnement	Lycéen(ne) en seconde, premier contact avec l'orientation. Curieux/se mais indécis(e).	laura956@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000099	40	F	22	2026-03-17T22:38:54.144Z	2026-04-02T23:12:33.540Z	\N
f2511efa-202d-49b5-8b04-2fbf036380de	247d8768-1e5b-4ab5-b294-cdeb91ae9b93	658d5532-3e36-47f6-97c7-6c700183927c	normale	1	Demande d'accompagnement	Sortie de formation sans diplôme, besoin de remobilisation et de confiance en soi.	0687720662	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000017	58	M	21	2026-03-21T19:37:23.964Z	2026-04-02T23:12:33.540Z	\N
7e66ad4f-fbe0-491b-90e0-ec4f3dcdda46	650df64d-603e-4912-9cfe-50543d8239b5	180fdb3f-ed02-480f-b347-79a48ce1f446	normale	1	Demande d'accompagnement	Lycéen(ne) en terminale, hésitant(e) sur l'orientation post-bac. Intérêt pour les métiers créatifs et le social.	0626328421	telephone	en_attente	generique	\N	0	\N	0	\N	38	M	21	2026-03-30T03:12:45.697Z	2026-04-02T23:12:33.540Z	\N
8740ac96-e94d-4af4-99eb-6e5ef14d190f	509e7d9a-3349-4453-bc18-6a81b2bf4a17	c760aa4a-62fb-498e-b9dc-6c47cd10b9b9	normale	1	Demande d'accompagnement	Jeune parent, cherche une formation courte compatible avec ses contraintes.	adam794@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000019	24	M	23	2026-03-20T18:37:14.475Z	2026-04-02T23:12:33.540Z	\N
a703f39b-0e34-421b-a178-06f16c75cd39	03f3859c-31bd-4e4d-81a1-573aaf309145	bc94bc5a-4353-4ed2-b4b8-cc68f9651e54	normale	1	Demande d'accompagnement	Jeune en recherche d'apprentissage dans les métiers de bouche. Motivé(e) et avec une première expérience de stage.	gabriel993@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000051	72	M	19	2026-03-16T17:52:20.714Z	2026-04-02T23:12:33.540Z	\N
eac3b66f-2eb8-43d4-bf59-dc29f5977b3c	3ad6a440-6e8d-4307-9b10-9dacf9670bfb	6fb86f84-92ba-4985-9b71-5c446e992c84	normale	1	Demande d'accompagnement	Lycéen(ne) en seconde, premier contact avec l'orientation. Curieux/se mais indécis(e).	leo513@email.com	email	en_attente	generique	\N	0	\N	0	\N	17	M	23	2026-03-29T00:04:24.502Z	2026-04-02T23:12:33.540Z	\N
d7b9f9f6-5e77-42bf-a6f1-9ff39c755329	9ba1501b-34fe-4484-a5c8-f144280a6ee2	c4efd75f-14ea-4fc7-9fa0-eda211401af4	haute	2	Fragilité modérée — accompagnement recommandé	Étudiant(e) en réorientation, insatisfait(e) de sa filière actuelle. Attiré(e) par le numérique.	nina726@email.com	email	en_attente	generique	\N	0	\N	0	\N	64	F	19	2026-03-13T23:39:16.974Z	2026-04-02T23:12:33.540Z	\N
343055dc-811c-4b85-aa71-58b00be67dac	796f63fc-3464-45ce-9608-d1010076bd86	22f31233-0696-4cbf-9997-64c84072bd09	normale	1	Demande d'accompagnement	En alternance mais souhaite changer de voie. Besoin de conseil.	0676062815	telephone	en_attente	sourcee	\N	0	\N	0	31395dae-b34b-4d39-8b80-23f2671c1b02	07	F	21	2026-03-17T23:26:28.536Z	2026-04-02T23:12:33.540Z	\N
b8a08deb-e9e1-4e6d-a4d8-855c1fdf0d7d	b98ee361-a65a-470b-9948-bc5936c2e793	ab9800f8-87cf-4b27-a71a-edf29ac78b4d	normale	1	Demande d'accompagnement	Lycéen(ne) en terminale, hésitant(e) sur l'orientation post-bac. Intérêt pour les métiers créatifs et le social.	0666670984	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000061	16	F	19	2026-03-17T01:36:53.004Z	2026-04-02T23:12:33.540Z	\N
6229e383-f437-42f8-a9ae-571414a669b7	ba58cedd-611e-4410-b70e-6c30fec6308f	918a1bc0-8eac-4bec-8b7e-1a8363b7a507	normale	1	Demande d'accompagnement	NEET depuis 6 mois, isolement social. Intérêt pour le sport et l'animation.	pauline274@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000083	59	F	23	2026-03-29T03:31:30.819Z	2026-04-02T23:12:33.540Z	\N
96a6fde7-d6dd-4231-ae46-ccb3a014899d	180d85fe-0bec-4109-9475-8aef5155137f	2a180879-d2fc-4c06-a2d8-0118839e1b72	normale	1	Demande d'accompagnement	Lycéen(ne) en terminale, hésitant(e) sur l'orientation post-bac. Intérêt pour les métiers créatifs et le social.	lucas265@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000019	73	M	17	2026-03-17T14:08:17.840Z	2026-04-02T23:12:33.540Z	\N
cbf2c0c9-faf3-43e4-87ff-d7d840da2bf0	0f3ede6e-8e7b-4670-aa0e-ad99f7b84295	61d9df83-b9c1-4793-a495-25458108dbce	normale	1	Demande d'accompagnement	En service civique, cherche une suite. Profil social et engagé.	karim43@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000026	84	M	17	2026-03-19T11:47:43.551Z	2026-04-02T23:12:33.540Z	\N
3078418e-77c9-4cca-a46c-d2cbb0f165dc	df919098-a633-4505-91f8-47c7da95378e	a4cdae49-228d-4e93-95be-dab18342787f	normale	1	Demande d'accompagnement	Lycéen(ne) en seconde, premier contact avec l'orientation. Curieux/se mais indécis(e).	0612515356	telephone	en_attente	generique	\N	0	\N	0	\N	28	F	21	2026-03-31T16:46:33.132Z	2026-04-02T23:12:33.540Z	\N
c95f6acf-05ff-406a-b9bd-1c92bf72b145	de9aea9c-3d5d-452d-aacc-3e50d9f47ab7	da9efbee-78f0-4640-9f33-0108ef4c1184	normale	1	Demande d'accompagnement	En alternance mais souhaite changer de voie. Besoin de conseil.	sacha305@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000021	64	M	18	2026-03-28T21:36:10.918Z	2026-04-02T23:12:33.540Z	\N
6c75d3b3-371b-4632-abd7-d2dac81073e3	67106ae0-b3c9-497d-a08b-26d91ca3e638	908ef078-80a1-46ba-8da8-1ea0ee0a1aa4	normale	1	Demande d'accompagnement	Étudiant(e) en réorientation, insatisfait(e) de sa filière actuelle. Attiré(e) par le numérique.	0657791676	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000076	73	M	18	2026-03-27T21:03:59.810Z	2026-04-02T23:12:33.540Z	\N
f3c1713f-bcb3-4617-b3a0-a136cdaf17ae	eecfc43e-20f5-47d4-a502-2c6cdaa71b97	c72ad348-1d41-417d-8264-ee6c1e6d43dd	normale	1	Demande d'accompagnement	Passionné(e) de gaming/tech, cherche à transformer sa passion en métier.	karim82@email.com	email	en_attente	generique	\N	0	\N	0	\N	84	M	21	2026-03-16T17:21:40.152Z	2026-04-02T23:12:33.540Z	\N
aa453916-b9b4-4c23-b301-491e716cc224	4cb6df89-f816-4b76-9df1-67b8e8b45b23	49b62510-6e52-47e8-b265-a5bc640bbbde	haute	2	Fragilité modérée — accompagnement recommandé	Jeune en recherche d'apprentissage dans les métiers de bouche. Motivé(e) et avec une première expérience de stage.	0654939331	telephone	en_attente	generique	\N	0	\N	0	\N	68	F	24	2026-03-30T14:19:28.043Z	2026-04-02T23:12:33.540Z	\N
863389e1-afeb-4a72-848e-47609603efc4	ad2e1c6d-486b-479b-976c-d9fde079fb35	ebbfdae9-f34a-4ba2-8618-5af36d641ceb	haute	2	Fragilité modérée — accompagnement recommandé	Jeune en recherche d'apprentissage dans les métiers de bouche. Motivé(e) et avec une première expérience de stage.	ibrahim466@email.com	email	en_attente	generique	\N	0	\N	0	\N	25	M	21	2026-03-31T20:57:32.285Z	2026-04-02T23:12:33.540Z	\N
5949c7f1-88c9-4a8d-86e7-54b51d837c21	fed82a4a-ec58-431e-8e17-46a2fce18027	cc2298cb-904f-4093-8739-2224d5a7c709	normale	1	Demande d'accompagnement	Lycéen(ne) en terminale, hésitant(e) sur l'orientation post-bac. Intérêt pour les métiers créatifs et le social.	oceane976@email.com	email	en_attente	generique	\N	0	\N	0	\N	67	F	18	2026-03-27T00:55:02.490Z	2026-04-02T23:12:33.540Z	\N
5a705208-8849-418b-ad46-8f7d8748688a	331b09e1-a578-4c26-a278-b8059cb0c30a	25ed7b6c-0b36-41d6-9798-a69aac1100a8	normale	1	Demande d'accompagnement	En service civique, cherche une suite. Profil social et engagé.	sacha723@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000014	63	M	25	2026-03-27T13:30:18.412Z	2026-04-02T23:12:33.540Z	\N
c6cc3d84-287b-40f2-93e1-d28544722ff6	421b4fba-05d3-4ee3-bf03-7b7a7828484b	391f7dfd-e70f-44af-8e66-e547bed18a6d	normale	1	Demande d'accompagnement	NEET depuis 6 mois, isolement social. Intérêt pour le sport et l'animation.	0674661854	telephone	en_attente	sourcee	\N	0	\N	0	5a7e5324-468d-4d70-ab5f-6517f518c473	80	NB	23	2026-03-29T17:36:01.218Z	2026-04-02T23:12:33.540Z	\N
2b4e3a5e-4f2e-40e3-960f-744d8b1586e3	a78f72af-ce1d-452e-a464-59f6a52f5808	d42e8347-ce4d-41b1-ae74-cdadbe982705	normale	1	Demande d'accompagnement	Lycéen(ne) en terminale, hésitant(e) sur l'orientation post-bac. Intérêt pour les métiers créatifs et le social.	0694619758	telephone	en_attente	generique	\N	0	\N	0	\N	57	F	23	2026-03-27T04:59:57.448Z	2026-04-02T23:12:33.540Z	\N
9ef2e2cd-48a2-4f42-96cd-36622e82e5ff	1e24e7f8-3feb-42d9-bb17-4a8437730563	cab36901-6985-4be0-8a0f-7392b5a1be6b	normale	1	Demande d'accompagnement	Décrocheur/se depuis 3 mois, en perte de motivation. Besoin d'un accompagnement pour se remobiliser.	ibrahim864@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000053	56	M	22	2026-03-23T17:16:07.958Z	2026-04-02T23:12:33.540Z	\N
c68d4cdd-eec3-47ff-8863-a97432aa6ce5	99239065-37df-43aa-89e3-7fd7e263083d	90fda104-5f0d-45ae-bb97-c0af29eb1e16	normale	1	Demande d'accompagnement	En alternance mais souhaite changer de voie. Besoin de conseil.	yasmine455@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000018	69	F	23	2026-03-30T22:31:40.224Z	2026-04-02T23:12:33.540Z	\N
39b6d193-8903-4c3e-81f7-38dd1da67992	1a80741e-7156-4314-a1f5-7b85958beea2	b0cb61f2-d4ac-4985-8b88-6d0d3490453b	normale	1	Demande d'accompagnement	Sortie de formation sans diplôme, besoin de remobilisation et de confiance en soi.	0694651187	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000014	59	M	22	2026-03-20T07:44:08.322Z	2026-04-02T23:12:33.540Z	\N
95270abb-eab2-4e85-8457-cd201415376b	1b10bdb7-9ab0-44b5-b281-f295ebb7b6c4	e991abc4-9e36-4c45-a0fe-39f1f52e28d6	haute	2	Fragilité modérée — accompagnement recommandé	Décrocheur/se depuis 3 mois, en perte de motivation. Besoin d'un accompagnement pour se remobiliser.	0699898496	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000075	40	M	15	2026-04-01T17:02:15.631Z	2026-04-02T23:12:33.540Z	\N
3000033c-1191-47da-a677-6aafc4cda4b5	1daeb1b4-5ce2-44af-a5bb-4fc40fc64e42	f0bd977e-3927-429c-a971-834976f640bb	haute	2	Fragilité modérée — accompagnement recommandé	Passionné(e) de gaming/tech, cherche à transformer sa passion en métier.	arthur823@email.com	email	en_attente	generique	\N	0	\N	0	\N	34	M	16	2026-03-19T05:22:16.098Z	2026-04-02T23:12:33.540Z	\N
3fecd1d4-752b-492b-b470-dea6a9f90c59	cd532497-bd2b-46e6-91ab-2654551a3dc1	d4358fc0-b61a-4ca3-bf5b-cba0d2477bbd	haute	2	Fragilité modérée — accompagnement recommandé	Passionné(e) de gaming/tech, cherche à transformer sa passion en métier.	0642625813	telephone	en_attente	generique	\N	0	\N	0	\N	66	F	24	2026-03-14T05:06:22.932Z	2026-04-02T23:12:33.540Z	\N
d7d1b4ac-de5e-410e-9de9-504911d7af99	0da6f58a-d769-4bbb-991a-0b8540ed722b	b55262a6-e7a6-4bfa-8dd6-ad551e52be8c	normale	1	Demande d'accompagnement	Lycéen(ne) en seconde, premier contact avec l'orientation. Curieux/se mais indécis(e).	enzo481@email.com	email	en_attente	sourcee	\N	0	\N	0	aaefcf2b-54db-4aa2-a4c6-a9c88834d717	52	NB	17	2026-04-02T03:58:58.868Z	2026-04-02T23:12:33.540Z	\N
430d1655-9420-4855-9486-a0e5060c14af	e01af09a-d399-441c-9758-3f799dfed44d	cd6b5195-06a0-4c75-9bf0-4dd313e2369e	critique	3	Détresse détectée — orientation urgente	Sortie de formation sans diplôme, besoin de remobilisation et de confiance en soi.	0638991291	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000088	59	M	25	2026-03-23T06:15:24.330Z	2026-04-02T23:12:33.540Z	\N
87c49671-d192-451e-ab37-47cff6df3674	b32b7963-c6af-4e56-aa61-7b7fc7f16dc7	bffa5b63-1a48-4585-9bd3-5d060888d83a	normale	1	Demande d'accompagnement	Étudiant(e) en réorientation, insatisfait(e) de sa filière actuelle. Attiré(e) par le numérique.	alice778@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000018	34	F	15	2026-03-18T18:53:27.724Z	2026-04-02T23:12:33.540Z	\N
d9592991-6a92-4fac-aa67-a924f5ee21d3	0afb833e-932e-4f87-8c99-d643cb0ab0aa	44d664c1-b280-4a2e-a106-2059baa168ec	normale	1	Demande d'accompagnement	Sortie de formation sans diplôme, besoin de remobilisation et de confiance en soi.	0667458563	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000075	21	F	23	2026-04-01T02:42:44.296Z	2026-04-02T23:12:33.540Z	\N
1c51fe92-b64b-4c27-8aa1-fec679afa302	ca90b20a-bcf7-4b09-a945-4f464e98e104	64da2e25-a67f-4c9f-859c-3b263cec38da	normale	1	Demande d'accompagnement	Lycéen(ne) en terminale, hésitant(e) sur l'orientation post-bac. Intérêt pour les métiers créatifs et le social.	0691489552	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000071	11	F	19	2026-03-28T01:57:18.016Z	2026-04-02T23:12:33.540Z	\N
a413bbf4-b3a5-4926-b65e-0cbfd7aa9973	e430ab53-087d-4998-bf48-22d39cab3501	a77ec760-26ee-4d6f-a38e-0f4579790dff	critique	3	Détresse détectée — orientation urgente	Conflit familial sur le choix d'orientation. Besoin d'un espace neutre pour construire son projet.	yanis254@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000029	15	M	17	2026-03-26T00:45:39.720Z	2026-04-02T23:12:33.540Z	\N
98a4c28c-3dd2-49c4-a76b-ca6ec6fed71d	3318e30a-1226-4c57-859b-10ec31dfa510	e1caf759-3f4e-427b-b8f8-d8888dbe39c7	haute	2	Fragilité modérée — accompagnement recommandé	Étudiant(e) en réorientation, insatisfait(e) de sa filière actuelle. Attiré(e) par le numérique.	0644811639	telephone	en_attente	generique	\N	0	\N	0	\N	62	F	23	2026-03-17T23:35:47.160Z	2026-04-02T23:12:33.540Z	\N
4b067d16-b431-4440-9e2c-ad4fd0e1e162	28fca49e-e608-4f46-a3a2-c1ebe8200190	c086a8d2-25b0-4461-b1da-a9b20f60e429	haute	2	Fragilité modérée — accompagnement recommandé	Passionné(e) de gaming/tech, cherche à transformer sa passion en métier.	0697971535	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000066	40	M	25	2026-03-23T06:51:33.471Z	2026-04-02T23:12:33.540Z	\N
d782a97b-6adb-462c-ae53-f672771fb67b	fd6541c7-1303-4453-8bab-458ff6cf8282	aacb831e-45b7-46ac-9980-e00a1c3d0b32	normale	1	Demande d'accompagnement	Étudiant(e) en réorientation, insatisfait(e) de sa filière actuelle. Attiré(e) par le numérique.	camille192@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000058	41	F	17	2026-03-24T02:56:50.010Z	2026-04-02T23:12:33.540Z	\N
f781f903-6599-4487-84f0-255befce8868	069db21a-84fa-4b6d-b28f-a4173b11f710	e583c1a0-7078-4c1a-b229-5bcab58dfd82	haute	2	Fragilité modérée — accompagnement recommandé	Jeune parent, cherche une formation courte compatible avec ses contraintes.	yasmine391@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000062	35	F	21	2026-03-24T20:21:04.716Z	2026-04-02T23:12:33.540Z	\N
43359c56-657c-4c19-80d6-f966686b1bd2	508239d2-9f0e-4471-b893-7b50c0631e64	749e2030-3014-400d-ba38-b8fcaf62009a	normale	1	Demande d'accompagnement	Passionné(e) de gaming/tech, cherche à transformer sa passion en métier.	manon383@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000004	75	F	21	2026-03-26T10:59:05.531Z	2026-04-02T23:12:33.540Z	\N
abf03374-6552-4042-b9fb-93a9e39fcf76	4841b942-e1f1-4b82-8b04-a11b9bfb1fd9	76e823a8-c734-4572-ad18-97f26e4daa0b	normale	1	Demande d'accompagnement	Conflit familial sur le choix d'orientation. Besoin d'un espace neutre pour construire son projet.	0657914725	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000063	55	F	16	2026-03-31T01:24:29.141Z	2026-04-02T23:12:33.540Z	\N
e14c96bf-e6a4-45e6-a4ab-f048e6238c5c	8dfa724f-a9d8-463f-bfca-38e3dca8ae6a	a3475298-9731-4984-9a44-44f1be112042	critique	3	Détresse détectée — orientation urgente	NEET depuis 6 mois, isolement social. Intérêt pour le sport et l'animation.	enzo278@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000056	73	M	21	2026-03-31T05:40:35.717Z	2026-04-02T23:12:33.540Z	\N
94aff214-f993-4f21-8923-53bc130ad769	5dff5942-25af-4fff-8011-cd012c664484	e48942fd-20a3-4045-91ba-fd4b1dc020bc	normale	1	Demande d'accompagnement	Sortie de formation sans diplôme, besoin de remobilisation et de confiance en soi.	0627946932	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000002	35	M	22	2026-03-27T00:25:41.283Z	2026-04-02T23:12:33.540Z	\N
2e26e8e7-8ec5-447c-be1c-c0c70acf5d9f	8525858f-4edb-4479-bc5d-443829d2c466	26c43531-867c-470d-8c5a-ea3e9fbbd73f	normale	1	Demande d'accompagnement	Conflit familial sur le choix d'orientation. Besoin d'un espace neutre pour construire son projet.	noah706@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000022	30	M	20	2026-03-28T04:25:53.625Z	2026-04-02T23:12:33.540Z	\N
c83d09d6-f823-409c-a47a-1515c4bb160a	45394e25-24e5-4d02-84a5-46713af6d193	4a8f5045-b396-4c27-88ae-0776aaf3d3ae	normale	1	Demande d'accompagnement	Décrocheur/se depuis 3 mois, en perte de motivation. Besoin d'un accompagnement pour se remobiliser.	adam749@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000051	57	M	15	2026-03-29T21:46:48.484Z	2026-04-02T23:12:33.540Z	\N
6823ff6e-9e37-41ce-a209-e8d923ae4a4c	4c210ad7-014b-48a6-8286-a8ddf5264d3e	2d3a5423-751a-4744-8010-7849f3e49384	normale	1	Demande d'accompagnement	NEET depuis 6 mois, isolement social. Intérêt pour le sport et l'animation.	karim149@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000063	62	M	20	2026-03-22T06:31:31.615Z	2026-04-02T23:12:33.540Z	\N
97347720-9b01-4d00-bed4-525ba7d291db	42981fb0-76a8-4cc1-af47-7ced202835cd	1f773910-72d8-4281-a4ca-fdbf1c231940	normale	1	Demande d'accompagnement	Passionné(e) de gaming/tech, cherche à transformer sa passion en métier.	0673089562	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000037	74	M	24	2026-03-24T19:24:47.753Z	2026-04-02T23:12:33.540Z	\N
a845d9b5-feed-485d-b1fe-0924ec4913fc	179113ab-61e5-4a0e-bd42-93c4b2b1f5c2	d26fd424-c425-449a-94fc-b2eab26b01ac	haute	2	Fragilité modérée — accompagnement recommandé	Lycéen(ne) en seconde, premier contact avec l'orientation. Curieux/se mais indécis(e).	clara757@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000035	62	F	25	2026-03-27T17:47:24.423Z	2026-04-02T23:12:33.540Z	\N
cc3c2401-ba95-4512-89ef-edb8e9d52378	406e7405-ed52-4710-a0c7-32d69f0839c0	1d517de3-cf84-4a67-a9bf-a5587801600f	normale	1	Demande d'accompagnement	Lycéen(ne) en seconde, premier contact avec l'orientation. Curieux/se mais indécis(e).	karim91@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000051	41	M	24	2026-03-23T21:58:25.147Z	2026-04-02T23:12:33.540Z	\N
4e6ef7a7-1219-46e6-9f1e-67841e7dcb4f	95db2322-9525-4a7e-b10b-9b21fa6e1f1f	88663f85-a284-4060-8b32-8b128f931d7f	normale	1	Demande d'accompagnement	Jeune en recherche d'apprentissage dans les métiers de bouche. Motivé(e) et avec une première expérience de stage.	margot265@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000079	73	F	22	2026-03-21T19:32:05.525Z	2026-04-02T23:12:33.540Z	\N
c50bcc45-dbeb-4634-90b0-e142d6394920	49d0e9b0-1e04-48d7-9695-6224265064b4	3560db67-c1cb-4f5f-829a-1359f3d758d3	normale	1	Demande d'accompagnement	Sortie de formation sans diplôme, besoin de remobilisation et de confiance en soi.	0621931636	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000013	01	F	21	2026-03-26T04:39:14.175Z	2026-04-02T23:12:33.540Z	\N
43bf9fbc-d350-4b6b-8aa7-a5ab634ee459	18413dff-7869-45f7-a745-8349f57d89f3	93257088-cda1-41e4-87f9-2910aa150692	haute	2	Fragilité modérée — accompagnement recommandé	Jeune en recherche d'apprentissage dans les métiers de bouche. Motivé(e) et avec une première expérience de stage.	wassim519@email.com	email	en_attente	generique	\N	0	\N	0	\N	17	M	16	2026-04-01T16:45:30.933Z	2026-04-02T23:12:33.540Z	\N
4b47f6fa-9f50-45eb-b8ad-bdff570c0716	3c765e0f-7583-4179-a98f-295c1c624ab9	6bfddad6-0960-40a3-810e-e7d538441e49	normale	1	Demande d'accompagnement	En alternance mais souhaite changer de voie. Besoin de conseil.	zoe555@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000010	21	F	19	2026-03-22T22:53:13.727Z	2026-04-02T23:12:33.540Z	\N
c1a3e183-7123-4844-9026-f4f5b176a4d7	41a1bf37-54d8-4a0f-af19-4b84f13bf4c9	5743f9b3-d7e7-43a5-8b6c-f7401fba6903	haute	2	Fragilité modérée — accompagnement recommandé	Sortie de formation sans diplôme, besoin de remobilisation et de confiance en soi.	kylian775@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000066	73	M	23	2026-03-23T21:39:57.871Z	2026-04-02T23:12:33.540Z	\N
899a624d-7e42-4dab-aa80-16e7e92f94f2	757d5cb8-94bc-41ae-b53a-f8e5b9435d65	27cd5a2a-f83c-4e0b-af30-4e3039d76147	normale	1	Demande d'accompagnement	Passionné(e) de gaming/tech, cherche à transformer sa passion en métier.	romane346@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000037	69	F	17	2026-03-28T00:52:11.313Z	2026-04-02T23:12:33.540Z	\N
022d7a95-b2bc-42c6-8a92-a4658d7d2aab	64d8a371-0774-48ed-8508-28532898c01e	edef5287-7143-476a-8146-d575fcc3ec35	haute	2	Fragilité modérée — accompagnement recommandé	Lycéen(ne) en terminale, hésitant(e) sur l'orientation post-bac. Intérêt pour les métiers créatifs et le social.	yasmine865@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000031	89	F	20	2026-03-18T07:11:47.575Z	2026-04-02T23:12:33.540Z	\N
68ca6e71-58d7-4d01-a1c5-5481f8b6dd17	d4b22522-6c2f-4eb8-8299-ed7e1b3bb4fa	4fdf947d-4924-40d1-8595-2a62d6617c0d	critique	3	Détresse détectée — orientation urgente	En service civique, cherche une suite. Profil social et engagé.	raphael147@email.com	email	en_attente	sourcee	\N	0	\N	0	48f36ad0-047d-403b-a392-f9d921b3b877	13	M	15	2026-03-27T16:37:09.034Z	2026-04-02T23:12:33.540Z	\N
9e05f23d-2830-4f95-8af0-5460366ab996	b60a337a-1515-477b-9ae0-58009984cbe6	4a49fa3a-6ef6-4823-8fe9-7db3d29dbf02	normale	1	Demande d'accompagnement	Lycéen(ne) en terminale, hésitant(e) sur l'orientation post-bac. Intérêt pour les métiers créatifs et le social.	lea546@email.com	email	en_attente	generique	\N	0	\N	0	\N	36	F	20	2026-03-27T15:30:33.498Z	2026-04-02T23:12:33.540Z	\N
03c220de-c509-4eb0-8408-c7785c75a8c9	33eac1eb-4c71-4ec8-a2c5-9da733f8a8b6	f365e924-b5a2-47ad-a349-4885732f8c5c	normale	1	Demande d'accompagnement	Conflit familial sur le choix d'orientation. Besoin d'un espace neutre pour construire son projet.	theo972@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000078	45	M	23	2026-03-21T06:52:26.065Z	2026-04-02T23:12:33.540Z	\N
37840a14-b399-4251-85a3-84adff75c097	4f63c8f6-9a67-42f2-b658-730b8db0b1e6	0e00414b-6e0f-4480-808a-9579042308b8	normale	1	Demande d'accompagnement	Sortie de formation sans diplôme, besoin de remobilisation et de confiance en soi.	melissa696@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000091	58	F	24	2026-03-27T05:16:59.604Z	2026-04-02T23:12:33.540Z	\N
a6f2693b-a394-49ae-be89-bb4ff85a1162	63ba0dc7-2836-4cab-9c81-997ef1beb339	d235a9e2-10ec-4a5e-bf46-9e7def0539de	normale	1	Demande d'accompagnement	Jeune parent, cherche une formation courte compatible avec ses contraintes.	hugo849@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000033	19	M	16	2026-03-21T05:48:29.898Z	2026-04-02T23:12:33.540Z	\N
370063a3-ad70-4c5d-abbe-019374edfcfd	b3da3233-e79e-460c-bcff-d90f75a87d11	93844875-db44-4e04-889a-f224f3307d81	haute	2	Fragilité modérée — accompagnement recommandé	Jeune parent, cherche une formation courte compatible avec ses contraintes.	0650970109	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000016	76	F	15	2026-03-16T02:26:48.396Z	2026-04-02T23:12:33.540Z	\N
42962d53-0895-428f-a05f-38694b4ae580	fbc8ceaf-70f0-4d2e-85ad-08d3fa343f9c	81f25ef0-3b81-4945-b549-2816b0610ab1	haute	2	Fragilité modérée — accompagnement recommandé	Étudiant(e) en réorientation, insatisfait(e) de sa filière actuelle. Attiré(e) par le numérique.	lea113@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000090	31	F	20	2026-03-25T01:18:52.059Z	2026-04-02T23:12:33.540Z	\N
e05c47b3-e7ea-4012-9e43-b32c2c8fc19b	c6d6de52-9dd5-4e5a-99bd-ff4b3c017a43	72f9dbbb-0dfa-499e-bfa1-0a6139a55826	haute	2	Fragilité modérée — accompagnement recommandé	Jeune en recherche d'apprentissage dans les métiers de bouche. Motivé(e) et avec une première expérience de stage.	0624641160	telephone	en_attente	generique	\N	0	\N	0	\N	62	M	23	2026-03-27T20:45:05.077Z	2026-04-02T23:12:33.540Z	\N
d13c57bc-4ee1-4fc2-bebd-979f43182da0	39e2b1bf-6616-4559-8d4b-6315d337fc50	5a662f2f-48c8-46a4-8fd7-cf50fac0db40	normale	1	Demande d'accompagnement	Sortie de formation sans diplôme, besoin de remobilisation et de confiance en soi.	manon242@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000028	39	F	25	2026-03-27T14:30:28.775Z	2026-04-02T23:12:33.540Z	\N
d7252f15-1606-414a-8d98-ae2d86401106	b0499347-d62f-4784-9531-114b06900600	7900cc57-a417-499f-bae8-57f2ca3f6ec7	normale	1	Demande d'accompagnement	Jeune en recherche d'apprentissage dans les métiers de bouche. Motivé(e) et avec une première expérience de stage.	0669417715	telephone	en_attente	generique	\N	0	\N	0	\N	56	F	23	2026-03-24T06:04:21.863Z	2026-04-02T23:12:33.540Z	\N
bfa1f41e-836a-46dd-abb8-7915afc263aa	dc9090c7-5234-496f-8bee-56d4ac07d8b9	25266907-3596-4c73-ba5a-0e6d286e46ab	haute	2	Fragilité modérée — accompagnement recommandé	Étudiant(e) en réorientation, insatisfait(e) de sa filière actuelle. Attiré(e) par le numérique.	emma500@email.com	email	en_attente	generique	\N	0	\N	0	\N	43	F	16	2026-03-29T12:58:30.365Z	2026-04-02T23:12:33.540Z	\N
50b9f252-27fb-4313-b4a2-49c337d604d4	e4e3ab10-0b41-4a5d-a7f0-9a9f2f5eacc7	96550c59-b8e3-4bb5-b5a5-fcbbf8b5db44	normale	1	Demande d'accompagnement	Lycéen(ne) en terminale, hésitant(e) sur l'orientation post-bac. Intérêt pour les métiers créatifs et le social.	paul850@email.com	email	en_attente	generique	\N	0	\N	0	\N	07	M	23	2026-03-17T06:25:00.238Z	2026-04-02T23:12:33.540Z	\N
ecda66eb-6b78-480e-bd0f-3a3b01682f44	8b556cf5-1bf7-453d-8405-8b39a2e5dc43	e31bc404-8d03-4021-a0dd-6209903f85e2	normale	1	Demande d'accompagnement	Étudiant(e) en réorientation, insatisfait(e) de sa filière actuelle. Attiré(e) par le numérique.	camille683@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000055	85	F	18	2026-03-14T15:38:50.386Z	2026-04-02T23:12:33.540Z	\N
75c8dd6b-7fc5-4bd2-8497-d9073107dee3	f66c8ffc-3566-48c8-a4b0-d1d8d04de22b	09735141-df25-4947-a932-e5348b591738	normale	1	Demande d'accompagnement	En service civique, cherche une suite. Profil social et engagé.	lea666@email.com	email	en_attente	sourcee	\N	0	\N	0	ad9dfc8f-abd7-456c-9ea8-f70025af08f8	66	F	24	2026-03-14T07:53:15.508Z	2026-04-02T23:12:33.540Z	\N
74ae4b47-9468-48cd-918a-46e03753337c	703959fe-92ee-442c-8838-96e13e37d92d	6901ee86-17aa-4877-b1c5-561391202b33	normale	1	Demande d'accompagnement	Lycéen(ne) en seconde, premier contact avec l'orientation. Curieux/se mais indécis(e).	arthur76@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000061	80	M	15	2026-03-28T04:15:05.003Z	2026-04-02T23:12:33.540Z	\N
5c4d9117-f9bb-4ef1-9458-caa4bd21d16a	ce736c1c-ced1-4a2c-b257-4df5434563b0	1eb5a6d3-b705-43fc-bed3-d5a935871d55	normale	1	Demande d'accompagnement	Jeune parent, cherche une formation courte compatible avec ses contraintes.	louis464@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000059	59	M	19	2026-03-18T05:31:09.073Z	2026-04-02T23:12:33.540Z	\N
3cceb01d-427d-4ab9-9342-a0962a6eb06f	59ba42d1-24e6-469b-8c35-621b4cedc99e	981dcfb1-4a06-4073-9992-485306c2e51b	haute	2	Fragilité modérée — accompagnement recommandé	Lycéen(ne) en seconde, premier contact avec l'orientation. Curieux/se mais indécis(e).	lina801@email.com	email	en_attente	generique	\N	0	\N	0	\N	11	F	17	2026-03-19T02:02:49.941Z	2026-04-02T23:12:33.540Z	\N
e71e525d-fb39-4395-aa9b-43467a475a12	b5eb3c91-d2b5-429e-acfa-e0d0f5abe612	f8c28efc-adc2-4491-aea1-4b111e09aa89	haute	2	Fragilité modérée — accompagnement recommandé	Étudiant(e) en réorientation, insatisfait(e) de sa filière actuelle. Attiré(e) par le numérique.	kylian292@email.com	email	en_attente	sourcee	\N	0	\N	0	8a44f6df-a375-4c91-ad53-68e873206d3a	80	M	22	2026-03-31T05:39:16.457Z	2026-04-02T23:12:33.540Z	\N
ae4ae127-04ec-4125-b60f-0daba21b3c74	ab1c30f5-5061-452a-abc7-8930c2983061	aff182af-61d1-41af-99e1-6c07f77be74d	haute	2	Fragilité modérée — accompagnement recommandé	Lycéen(ne) en terminale, hésitant(e) sur l'orientation post-bac. Intérêt pour les métiers créatifs et le social.	yasmine343@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000067	42	F	19	2026-03-29T05:59:03.581Z	2026-04-02T23:12:33.540Z	\N
290ce05c-89df-40fa-929f-701f32d9161f	cf3b02c7-3cd7-4d22-8ee0-22a7b75a2a99	168b259d-f4a9-4b3b-9f6b-ebef2ae3dbb6	normale	1	Demande d'accompagnement	Décrocheur/se depuis 3 mois, en perte de motivation. Besoin d'un accompagnement pour se remobiliser.	nina736@email.com	email	en_attente	sourcee	\N	0	\N	0	ad9dfc8f-abd7-456c-9ea8-f70025af08f8	15	F	24	2026-03-29T02:35:50.012Z	2026-04-02T23:12:33.540Z	\N
1611a6e9-dac6-4806-a892-95ad50d73c51	06dc14ad-2dc8-4f03-82bf-549c1750b258	b5675b21-0cd4-4263-b8d1-827ee2a616b7	normale	1	Demande d'accompagnement	Jeune parent, cherche une formation courte compatible avec ses contraintes.	mathis428@email.com	email	en_attente	generique	\N	0	\N	0	\N	17	M	20	2026-03-27T23:35:38.571Z	2026-04-02T23:12:33.540Z	\N
15b39935-a503-4ab8-a538-05e092b57a7a	7317326a-e743-4a69-a01a-a74ac4c17341	d54f3f48-d9be-452f-89c1-5bf4e5bdaf28	critique	3	Détresse détectée — orientation urgente	Passionné(e) de gaming/tech, cherche à transformer sa passion en métier.	yanis994@email.com	email	en_attente	generique	\N	0	\N	0	\N	16	M	20	2026-03-17T00:21:50.009Z	2026-04-02T23:12:33.540Z	\N
0ef76907-6664-4a2f-b4c4-4af8f455ea8a	4242128d-1bcd-4377-9db5-48263b1b9067	7ff89a91-9c5f-470b-bb28-566f6204ff59	normale	1	Demande d'accompagnement	Jeune en recherche d'apprentissage dans les métiers de bouche. Motivé(e) et avec une première expérience de stage.	charlotte297@email.com	email	en_attente	sourcee	\N	0	\N	0	31395dae-b34b-4d39-8b80-23f2671c1b02	10	F	17	2026-03-23T04:20:40.704Z	2026-04-02T23:12:33.540Z	\N
24b56c70-ce60-4971-a10c-2740fff5f978	10c3f1d7-35b1-4ee7-bf4a-2fae5da5a5ec	87e1287c-b476-4d99-81a0-2988adae6c22	normale	1	Demande d'accompagnement	En service civique, cherche une suite. Profil social et engagé.	theo113@email.com	email	en_attente	generique	\N	0	\N	0	\N	66	M	18	2026-03-28T15:05:41.676Z	2026-04-02T23:12:33.540Z	\N
3a323512-340a-4629-b6f2-85e6c64312e5	314dd029-8784-47c7-800a-b65a89c5bfa0	0d98ad70-86a4-4f7c-abea-398451e58a3c	normale	1	Demande d'accompagnement	Jeune parent, cherche une formation courte compatible avec ses contraintes.	lea394@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000089	41	F	19	2026-03-27T00:06:14.816Z	2026-04-02T23:12:33.540Z	\N
656529c3-edae-465e-a88a-3d961bdabc12	01743b7a-b33f-4689-bcb3-667f0b615490	cb1b1ba9-706b-466b-bcf0-f854b4dfe676	haute	2	Fragilité modérée — accompagnement recommandé	NEET depuis 6 mois, isolement social. Intérêt pour le sport et l'animation.	charlotte225@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000088	61	F	15	2026-03-27T07:13:59.963Z	2026-04-02T23:12:33.540Z	\N
49d3db06-5957-44fc-a981-1aebeee2e592	180e76c3-8b14-4dba-86e8-f2461866cf9a	f67f6e80-be04-4cd1-a108-b095092ce0c4	critique	3	Détresse détectée — orientation urgente	Conflit familial sur le choix d'orientation. Besoin d'un espace neutre pour construire son projet.	ibrahim430@email.com	email	en_attente	sourcee	\N	0	\N	0	480a2d13-aa06-4d26-91d9-7a6f243e27e5	72	M	15	2026-03-22T11:39:36.483Z	2026-04-02T23:12:33.540Z	\N
84b7240f-dcad-4161-a71a-592b492b6d6a	9b19d083-772c-4b3a-8a3b-2d05a8c0f8a1	53517658-95d0-4ad9-9cc6-7c3093d0af9e	normale	1	Demande d'accompagnement	Lycéen(ne) en seconde, premier contact avec l'orientation. Curieux/se mais indécis(e).	camille477@email.com	email	en_attente	generique	\N	0	\N	0	\N	23	F	19	2026-03-20T17:16:43.166Z	2026-04-02T23:12:33.540Z	\N
f86e8364-ea95-4af8-b15a-eab15b28aa0e	6ee23bc6-35b7-4e55-aa1b-c9c5ea4f4368	c5120210-b7fb-48b3-9f4a-ebc8b6f52c35	normale	1	Demande d'accompagnement	Conflit familial sur le choix d'orientation. Besoin d'un espace neutre pour construire son projet.	ibrahim926@email.com	email	en_attente	generique	\N	0	\N	0	\N	29	M	16	2026-03-23T21:51:14.662Z	2026-04-02T23:12:33.540Z	\N
5646a79a-3367-4c5a-b64e-3f1b0a3ed029	94d23641-2374-4822-8efe-835096bc964b	06bfc72e-e842-4fe5-81bc-c5d1f8ea4d91	normale	1	Demande d'accompagnement	Décrocheur/se depuis 3 mois, en perte de motivation. Besoin d'un accompagnement pour se remobiliser.	nour469@email.com	email	en_attente	generique	\N	0	\N	0	\N	89	F	25	2026-03-24T14:46:51.683Z	2026-04-02T23:12:33.540Z	\N
79c729ec-3bb8-4e5b-923f-8aafac60ea43	1af91dc4-f78c-4baa-84dc-bd94b6628937	70ff4cfd-e045-432b-8126-6147398abf3f	haute	2	Fragilité modérée — accompagnement recommandé	NEET depuis 6 mois, isolement social. Intérêt pour le sport et l'animation.	0645412599	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000074	45	F	23	2026-03-24T12:59:40.218Z	2026-04-02T23:12:33.540Z	\N
9ff5c88c-17e1-4bf0-93f2-f4a3bb8800c4	61ed4304-60d0-4278-b3fc-b8035ae89610	11c21a9a-3f2d-40b6-b8b9-c09cc7ce0958	normale	1	Demande d'accompagnement	Décrocheur/se depuis 3 mois, en perte de motivation. Besoin d'un accompagnement pour se remobiliser.	lea135@email.com	email	en_attente	generique	\N	0	\N	0	\N	44	F	20	2026-03-14T02:18:54.422Z	2026-04-02T23:12:33.540Z	\N
59811d9f-561f-4841-919c-db6dfdd6f754	40581249-3949-40cb-8e46-664bb4236c2b	39e351c4-8963-455e-ae28-f3b6c62080da	normale	1	Demande d'accompagnement	Jeune parent, cherche une formation courte compatible avec ses contraintes.	ethan303@email.com	email	en_attente	generique	\N	0	\N	0	\N	49	M	15	2026-03-18T10:06:31.871Z	2026-04-02T23:12:33.540Z	\N
0f9936ef-4411-4522-828a-2fbb7bbabe77	f2a0c531-e0e2-41f9-88c5-03abf0c62f6e	71591e8d-914c-42ac-a2f7-18b9b4669469	normale	1	Demande d'accompagnement	Étudiant(e) en réorientation, insatisfait(e) de sa filière actuelle. Attiré(e) par le numérique.	anais252@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000075	51	F	19	2026-03-17T00:54:10.108Z	2026-04-02T23:12:33.540Z	\N
8b8f0c84-1df9-4ff0-8638-5c3c7d018170	a8cbf0f9-e99e-41c7-a7d3-bdf02893f377	4ace2d6d-e177-4cfa-b89f-00f0fcc13c28	critique	3	Détresse détectée — orientation urgente	Lycéen(ne) en terminale, hésitant(e) sur l'orientation post-bac. Intérêt pour les métiers créatifs et le social.	0634748722	telephone	en_attente	sourcee	\N	0	\N	0	ad9dfc8f-abd7-456c-9ea8-f70025af08f8	31	M	19	2026-03-26T13:00:39.455Z	2026-04-02T23:12:33.540Z	\N
e5823c4b-70ed-47e8-9d2d-03a1291be4b7	92d6f485-dd75-4f15-8689-d655442f3066	2fa0e68a-8314-4eb3-9321-62e74f8ea0f5	haute	2	Fragilité modérée — accompagnement recommandé	Jeune parent, cherche une formation courte compatible avec ses contraintes.	0669909901	telephone	en_attente	generique	\N	0	\N	0	\N	11	F	20	2026-03-29T04:47:10.395Z	2026-04-02T23:12:33.540Z	\N
f8c10312-38c6-40c0-9629-1c76be75a450	96af85b9-db3c-4253-b1f6-c502d423748b	46ee4ea0-9831-4b41-9942-37f79479d88d	normale	1	Demande d'accompagnement	NEET depuis 6 mois, isolement social. Intérêt pour le sport et l'animation.	mehdi922@email.com	email	en_attente	sourcee	\N	0	\N	0	aaefcf2b-54db-4aa2-a4c6-a9c88834d717	60	M	21	2026-03-19T06:37:21.195Z	2026-04-02T23:12:33.540Z	\N
0b36a8b3-6ec8-456b-8779-3451792b8ad0	f6510755-469c-4285-a02f-39a27508dcd6	d031ee6c-00a4-4d7b-a365-285713812af6	haute	2	Fragilité modérée — accompagnement recommandé	Étudiant(e) en réorientation, insatisfait(e) de sa filière actuelle. Attiré(e) par le numérique.	theo598@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000022	17	M	16	2026-03-22T07:21:27.481Z	2026-04-02T23:12:33.540Z	\N
6c8255ef-fbd6-4687-b08f-a3dd3f9e25d3	7423daf1-d204-432e-b6cd-65f3e0cee53c	be573900-a2dd-4ce7-9172-10550a255d4d	normale	1	Demande d'accompagnement	Passionné(e) de gaming/tech, cherche à transformer sa passion en métier.	0619661994	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000050	05	M	25	2026-04-01T02:16:38.334Z	2026-04-02T23:12:33.540Z	\N
8baa5f66-5934-4574-b4af-52254613a38d	12c1c264-4559-4bb3-8f7f-85942e02ff22	e752be8c-4dc3-49e9-8316-ba4d1805f672	normale	1	Demande d'accompagnement	Passionné(e) de gaming/tech, cherche à transformer sa passion en métier.	chloe214@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000043	57	F	18	2026-03-14T04:36:17.632Z	2026-04-02T23:12:33.540Z	\N
27e0abcb-4ad4-430c-bc52-fc3b5546cf5f	a4210ec5-7e1e-4524-8b93-caa4097c04c7	9f206e28-6695-469b-9269-b76f7e147af2	normale	1	Demande d'accompagnement	Conflit familial sur le choix d'orientation. Besoin d'un espace neutre pour construire son projet.	theo70@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000044	66	M	24	2026-03-25T22:39:45.638Z	2026-04-02T23:12:33.540Z	\N
b15849f4-7f30-4e0f-af13-cdb1cb4cbecb	a55fdb49-098b-4d52-a6fe-a428a23d2c47	bd13fb42-9e16-4800-bfab-9cce3e6cf079	normale	1	Demande d'accompagnement	NEET depuis 6 mois, isolement social. Intérêt pour le sport et l'animation.	sofia855@email.com	email	en_attente	generique	\N	0	\N	0	\N	42	F	21	2026-03-20T10:27:20.572Z	2026-04-02T23:12:33.540Z	\N
1b484da4-cc43-461c-a01c-2ab00b5ed999	d3d0c553-73a6-474f-8ad0-7de504a44ca9	50ee2d5c-6574-4ce7-b9b6-78c4dcf9b6b4	critique	3	Détresse détectée — orientation urgente	Conflit familial sur le choix d'orientation. Besoin d'un espace neutre pour construire son projet.	0645403286	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000022	61	F	25	2026-04-02T08:18:05.644Z	2026-04-02T23:12:33.540Z	\N
3c180b50-08e0-4c0a-92f1-0a49a91785c8	a2885063-17c1-4381-b9a2-546941ea319e	4f93d7fc-54b2-4081-8abe-7790c10a258a	haute	2	Fragilité modérée — accompagnement recommandé	Lycéen(ne) en seconde, premier contact avec l'orientation. Curieux/se mais indécis(e).	0650468627	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000100	94	M	24	2026-03-14T20:30:36.918Z	2026-04-02T23:12:33.540Z	\N
e5d116b1-4a55-43c2-8e29-7fe13fc28c2c	c1212cee-3b85-4b0d-a15c-4dffaf32e669	103bc744-76c6-4948-ab03-f9ecd80602ae	critique	3	Détresse détectée — orientation urgente	Sortie de formation sans diplôme, besoin de remobilisation et de confiance en soi.	ethan625@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000013	40	M	24	2026-03-29T04:02:28.583Z	2026-04-02T23:12:33.540Z	\N
51ff7dd0-2968-46f3-a49e-ef90d62da593	60a0f991-af45-4ee5-9667-e9028db6cc48	bd6e86ec-a4d8-4291-8dc9-4fff7b980c2b	normale	1	Demande d'accompagnement	Jeune en recherche d'apprentissage dans les métiers de bouche. Motivé(e) et avec une première expérience de stage.	maelys324@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000053	27	F	18	2026-03-17T18:28:42.148Z	2026-04-02T23:12:33.540Z	\N
6522d8f8-c89a-4114-922e-36498c52de2b	fd99e0ca-adff-4441-8930-d33d751f338d	dd58a0d9-3bdc-47bf-9651-27ee0cbf9da6	normale	1	Demande d'accompagnement	Jeune parent, cherche une formation courte compatible avec ses contraintes.	nina528@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000051	94	F	19	2026-03-29T10:22:31.942Z	2026-04-02T23:12:33.540Z	\N
396c4d19-fa33-4ca2-ab0b-80d427e6b629	dd7958bf-ee38-49c8-a415-9b3bedc2f0d6	53319125-7904-4b24-a599-984aad6a5cc5	haute	2	Fragilité modérée — accompagnement recommandé	Jeune en recherche d'apprentissage dans les métiers de bouche. Motivé(e) et avec une première expérience de stage.	lina182@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000011	51	F	18	2026-03-21T08:30:47.882Z	2026-04-02T23:12:33.540Z	\N
7649d80d-f806-4b30-a62c-cb637a181a6a	7d1d750a-4ef8-47ce-a931-1b9fe6b9f49e	727c4946-830e-42cd-a54e-9f477ee9f881	normale	1	Demande d'accompagnement	En alternance mais souhaite changer de voie. Besoin de conseil.	0669909846	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000005	41	F	17	2026-03-18T16:49:00.349Z	2026-04-02T23:12:33.540Z	\N
795be905-282e-47ee-879f-c90ebf44b22a	0bd68b2d-f655-4144-b7bc-771feec336c3	c0533d5e-e3a2-4716-bdc6-f99cc6c3d853	critique	3	Détresse détectée — orientation urgente	Décrocheur/se depuis 3 mois, en perte de motivation. Besoin d'un accompagnement pour se remobiliser.	zoe87@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000027	88	F	23	2026-03-24T15:40:51.815Z	2026-04-02T23:12:33.540Z	\N
a6e194ae-a101-4bca-a99e-ff8b84cfff21	2f8dec79-7738-4d51-a41d-1ee3f70b9988	eb43ffa2-3b63-43a7-a3c3-66d9f7fc76dd	normale	1	Demande d'accompagnement	En service civique, cherche une suite. Profil social et engagé.	0641608159	telephone	en_attente	sourcee	\N	0	\N	0	8a44f6df-a375-4c91-ad53-68e873206d3a	88	M	25	2026-03-18T09:28:35.661Z	2026-04-02T23:12:33.540Z	\N
c43eee28-8933-4573-bfa0-9690a2583c40	20b623fe-413c-4f8f-8b2c-d4500aa96a84	888ef8e4-fba5-4e1a-8e26-5fb49551221e	normale	1	Demande d'accompagnement	Lycéen(ne) en seconde, premier contact avec l'orientation. Curieux/se mais indécis(e).	tom227@email.com	email	en_attente	generique	\N	0	\N	0	\N	34	M	24	2026-03-16T16:20:15.477Z	2026-04-02T23:12:33.540Z	\N
dd5a08cc-8306-466a-8e98-26354230171a	a3f1e578-9e48-415b-b33c-34f0b86cb66e	cb815a38-a090-44b2-a527-aee425f2be02	normale	1	Demande d'accompagnement	Décrocheur/se depuis 3 mois, en perte de motivation. Besoin d'un accompagnement pour se remobiliser.	louis901@email.com	email	en_attente	sourcee	\N	0	\N	0	5a7e5324-468d-4d70-ab5f-6517f518c473	80	M	24	2026-03-18T12:23:25.645Z	2026-04-02T23:12:33.540Z	\N
01123c1b-6af7-4992-b069-6818492d5354	3a93c177-0629-4841-93c4-1c4af6731579	3c23c3d2-8de1-45f2-b152-e5d3fd38e586	normale	1	Demande d'accompagnement	Décrocheur/se depuis 3 mois, en perte de motivation. Besoin d'un accompagnement pour se remobiliser.	0644275427	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000010	60	F	18	2026-03-14T08:49:03.510Z	2026-04-02T23:12:33.540Z	\N
4c3c2dc5-8f39-4631-85a2-d4ba460a42d3	e162347e-9ffa-412f-8ccc-886afb575db6	6c9ed46c-a6ac-46b9-8e8e-e4313732dc79	normale	1	Demande d'accompagnement	Jeune parent, cherche une formation courte compatible avec ses contraintes.	ibrahim176@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000046	2B	M	18	2026-03-30T05:11:39.470Z	2026-04-02T23:12:33.540Z	\N
e9997b0f-39a7-486f-b1b1-ec290b67bd05	2cd16062-6978-410a-b9d3-e3446b2dbe8f	8e08ae69-9232-49f9-b567-3f950b8754c6	haute	2	Fragilité modérée — accompagnement recommandé	Jeune parent, cherche une formation courte compatible avec ses contraintes.	0659583290	telephone	en_attente	generique	\N	0	\N	0	\N	76	M	15	2026-03-28T04:36:54.141Z	2026-04-02T23:12:33.540Z	\N
3782cc6d-b749-4750-9e41-3210ad2a26b4	3de8b387-ff4b-4bbd-a263-97e331321225	a871e9ae-8b83-4992-9b0a-ecd4585422b9	haute	2	Fragilité modérée — accompagnement recommandé	Lycéen(ne) en terminale, hésitant(e) sur l'orientation post-bac. Intérêt pour les métiers créatifs et le social.	melissa886@email.com	email	en_attente	generique	\N	0	\N	0	\N	60	F	25	2026-03-29T05:50:30.921Z	2026-04-02T23:12:33.540Z	\N
23935948-a414-4384-b378-048ec7373ed2	8fe5d659-c661-4b97-91e0-a067c5f22cb8	d629c11b-f646-47d0-ae00-9901cd21a7ae	normale	1	Demande d'accompagnement	NEET depuis 6 mois, isolement social. Intérêt pour le sport et l'animation.	louis409@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000057	11	M	23	2026-03-28T04:29:32.430Z	2026-04-02T23:12:33.540Z	\N
59e2961b-e5bf-4d1e-8c20-18dbd80989b9	b726a0b9-9690-4c50-8e30-dbd283520fe4	23f3760a-929a-45d5-8a89-d7d478f5ad2b	critique	3	Détresse détectée — orientation urgente	Sortie de formation sans diplôme, besoin de remobilisation et de confiance en soi.	chloe598@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000045	2B	F	16	2026-03-30T04:13:37.546Z	2026-04-02T23:12:33.540Z	\N
1bcd1d04-046b-42cf-a734-91bd2e6710b9	5fb5a284-5c15-4fd2-98a9-09c9825602a3	4e3763a4-8f71-475e-b858-06ae68217094	normale	1	Demande d'accompagnement	En service civique, cherche une suite. Profil social et engagé.	chloe966@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000092	73	F	15	2026-03-30T06:47:59.109Z	2026-04-02T23:12:33.540Z	\N
7d08e96b-54c2-465a-8261-450a9481b479	ef753a23-d9dd-465c-85a1-77b0eb8e478a	50235829-966e-415b-8d9d-25bce37aecde	normale	1	Demande d'accompagnement	Lycéen(ne) en seconde, premier contact avec l'orientation. Curieux/se mais indécis(e).	sofiane760@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000091	15	M	23	2026-03-18T21:43:49.352Z	2026-04-02T23:12:33.540Z	\N
5aed62d1-ee52-4ecf-aaee-17edc878ef59	9e0f0abb-d9b0-43c6-86c9-0cdf1cef8421	cdcf64a1-5491-4729-afdf-e157bda3192a	normale	1	Demande d'accompagnement	En service civique, cherche une suite. Profil social et engagé.	victor891@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000074	01	M	16	2026-03-27T10:34:08.359Z	2026-04-02T23:12:33.540Z	\N
d8718cc7-2d04-4f90-86f2-2007ef0506a6	4524bddb-31ac-401d-91b2-9a093914aa72	0af32f8c-c1ac-48bd-8199-436a0c8f1ec0	haute	2	Fragilité modérée — accompagnement recommandé	Sortie de formation sans diplôme, besoin de remobilisation et de confiance en soi.	chloe504@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000014	87	F	20	2026-03-27T03:25:33.683Z	2026-04-02T23:12:33.540Z	\N
dd47919c-cdaa-4252-8e27-c456ac3d1701	c4c24e69-e45d-4397-b516-01a93f56fddc	6b65dd78-d5b4-4bd7-aaea-b4197aa59ac2	haute	2	Fragilité modérée — accompagnement recommandé	Conflit familial sur le choix d'orientation. Besoin d'un espace neutre pour construire son projet.	nina662@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000032	34	F	21	2026-03-17T18:02:33.888Z	2026-04-02T23:12:33.540Z	\N
b0c779a8-6551-49c3-bcf4-35c607141eee	fbc357d6-24d3-4a23-bc4e-568cc698cdc1	3c0a1772-314b-4e16-8039-b557eaa7bbb9	normale	1	Demande d'accompagnement	En service civique, cherche une suite. Profil social et engagé.	alice845@email.com	email	en_attente	sourcee	\N	0	\N	0	8a44f6df-a375-4c91-ad53-68e873206d3a	05	F	23	2026-03-29T09:22:39.081Z	2026-04-02T23:12:33.540Z	\N
9825a8b7-105e-4c49-8f54-4fc9660617c8	06c75081-3902-4d97-a9e1-9950a9f72211	40f2591d-143e-42db-8b1d-f892400d04d2	haute	2	Fragilité modérée — accompagnement recommandé	Lycéen(ne) en terminale, hésitant(e) sur l'orientation post-bac. Intérêt pour les métiers créatifs et le social.	manon518@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000016	85	F	21	2026-03-25T08:30:00.852Z	2026-04-02T23:12:33.540Z	\N
6f63a235-2132-4a29-9f5c-436fd19c5a7e	25a4b725-3b30-49ae-bde4-32a109d0aaf5	4633445b-cc10-498c-ae30-1e14a20e53d8	critique	3	Détresse détectée — orientation urgente	Conflit familial sur le choix d'orientation. Besoin d'un espace neutre pour construire son projet.	0677803883	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000020	71	M	23	2026-03-24T02:16:01.859Z	2026-04-02T23:12:33.540Z	\N
9a554227-08d0-4db1-8b1e-cbdd219951a6	c18b9565-e55f-47bf-8ad8-5ede1971326e	9de4a578-929e-4ef7-a16a-dc5a61851945	critique	3	Détresse détectée — orientation urgente	Conflit familial sur le choix d'orientation. Besoin d'un espace neutre pour construire son projet.	mehdi837@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000053	71	M	24	2026-03-27T14:27:03.205Z	2026-04-02T23:12:33.540Z	\N
00cec984-0856-431d-b209-e8d65705bf58	0782a562-8562-421f-bb77-a980f9b17414	7462885f-6a30-4efd-865e-2e6536d01889	normale	1	Demande d'accompagnement	Lycéen(ne) en terminale, hésitant(e) sur l'orientation post-bac. Intérêt pour les métiers créatifs et le social.	ibrahim703@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000032	87	M	15	2026-04-01T11:06:47.721Z	2026-04-02T23:12:33.540Z	\N
92bbcda8-6722-4aeb-9a60-084566872dbf	a5e754fd-de58-4c94-978e-d934e2eb8d30	3fd65067-7c0d-4d29-931e-f39d9394f150	normale	1	Demande d'accompagnement	Sortie de formation sans diplôme, besoin de remobilisation et de confiance en soi.	lucie802@email.com	email	en_attente	generique	\N	0	\N	0	\N	49	F	15	2026-03-23T21:11:04.971Z	2026-04-02T23:12:33.540Z	\N
a5e2794f-f85f-4a47-aa2c-fa9d64cefd29	54397c3f-fc8a-4bbc-9491-58c4f2326513	694f5d31-f35d-42ee-ab2e-776ad2d39fda	critique	3	Détresse détectée — orientation urgente	Jeune parent, cherche une formation courte compatible avec ses contraintes.	sofiane91@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000007	23	M	18	2026-03-28T13:03:08.329Z	2026-04-02T23:12:33.540Z	\N
dbab884e-dbe5-4040-96a1-abb1f0d235a4	7e805fa7-7ce9-4113-b0e7-f133d3ed5e64	62921c67-0e51-47a8-b5e6-6c43c62109cf	haute	2	Fragilité modérée — accompagnement recommandé	Conflit familial sur le choix d'orientation. Besoin d'un espace neutre pour construire son projet.	0611163818	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000083	42	F	21	2026-03-28T16:57:45.108Z	2026-04-02T23:12:33.540Z	\N
e78b6f80-02db-44f5-9e4b-b78fa824e8aa	c9120feb-d40f-4030-a9a5-095f5e02d608	f591c3e3-6e85-46c6-8436-d89d04f84c1a	haute	2	Fragilité modérée — accompagnement recommandé	Lycéen(ne) en terminale, hésitant(e) sur l'orientation post-bac. Intérêt pour les métiers créatifs et le social.	karim277@email.com	email	en_attente	generique	\N	0	\N	0	\N	75	M	17	2026-03-15T01:37:33.814Z	2026-04-02T23:12:33.540Z	\N
5c9a86ea-26ed-450a-ae58-1d3a4fabfe57	f60e2beb-acd7-4e87-8f56-b13fc1a4ac22	58326523-143d-416b-b72e-84c4d9a02cb2	haute	2	Fragilité modérée — accompagnement recommandé	Décrocheur/se depuis 3 mois, en perte de motivation. Besoin d'un accompagnement pour se remobiliser.	sofiane516@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000008	33	M	23	2026-03-14T01:18:56.150Z	2026-04-02T23:12:33.540Z	\N
f4d6bf4a-0839-4b45-9caa-8f9fb22d065c	39be7f82-99f3-491e-842d-417fa7df4700	72958414-8eb1-42d7-8e83-a363e9af878b	critique	3	Détresse détectée — orientation urgente	Lycéen(ne) en seconde, premier contact avec l'orientation. Curieux/se mais indécis(e).	enzo972@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000012	83	M	25	2026-03-24T03:20:22.306Z	2026-04-02T23:12:33.540Z	\N
18f39449-5a96-4db2-bbbe-d48b15c1d9e9	654cc014-09ce-427d-a696-1d19d6d0adff	d10a55e6-65eb-41d1-b6bf-87fd07a50ec7	haute	2	Fragilité modérée — accompagnement recommandé	Décrocheur/se depuis 3 mois, en perte de motivation. Besoin d'un accompagnement pour se remobiliser.	victor923@email.com	email	en_attente	generique	\N	0	\N	0	\N	87	M	18	2026-03-20T23:40:28.615Z	2026-04-02T23:12:33.540Z	\N
6d98e112-81b3-4e45-a85e-2c114393292c	b6f5c8b4-eb4b-4689-a5f2-d8fdd2d5149d	ee07ee49-4ef6-4c6e-bce2-c927582cda67	critique	3	Détresse détectée — orientation urgente	Décrocheur/se depuis 3 mois, en perte de motivation. Besoin d'un accompagnement pour se remobiliser.	0667291339	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000021	30	F	22	2026-03-30T02:34:46.850Z	2026-04-02T23:12:33.540Z	\N
d59a1d28-f353-49d1-854d-d8f3e9a94aa8	43ebe8bb-f6a6-4c7c-85a2-d28024521201	ce03eaf3-05b1-4d5e-bb14-b27df50a6ff0	normale	1	Demande d'accompagnement	Passionné(e) de gaming/tech, cherche à transformer sa passion en métier.	mehdi595@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000047	31	M	20	2026-03-14T00:46:42.274Z	2026-04-02T23:12:33.540Z	\N
464b8e4b-7630-4dc7-843d-c143fa34e30a	03a8a89e-37cb-4428-9425-013c69ddd2c6	a79038f2-4b50-446d-ab53-f76af7da2be4	haute	2	Fragilité modérée — accompagnement recommandé	En alternance mais souhaite changer de voie. Besoin de conseil.	0631830526	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000054	54	F	25	2026-03-20T07:42:05.621Z	2026-04-02T23:12:33.540Z	\N
124bd248-3250-45c2-b88d-7ed9d2bb5d90	c122a8c9-5581-4f93-88a7-b5a45b0e710d	72a49eb1-b5c5-4460-955a-7b1ef977f09d	haute	2	Fragilité modérée — accompagnement recommandé	En service civique, cherche une suite. Profil social et engagé.	victor561@email.com	email	en_attente	generique	\N	0	\N	0	\N	54	M	15	2026-03-26T09:18:28.972Z	2026-04-02T23:12:33.540Z	\N
e024af10-809b-43ef-b0a3-aed50b6d6ae7	eff36237-540d-4a35-a070-f7b2b911bc95	179d3ae0-168d-4511-8c62-7497943606fb	haute	2	Fragilité modérée — accompagnement recommandé	Passionné(e) de gaming/tech, cherche à transformer sa passion en métier.	jules41@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000065	10	M	16	2026-04-01T12:50:01.819Z	2026-04-02T23:12:33.540Z	\N
4389c384-7756-4a00-8a05-e789d6006b4c	76270bf6-f037-4ea5-8079-146a184cafc0	85821ede-ea77-4dc2-aef2-bb629961e26f	normale	1	Demande d'accompagnement	Passionné(e) de gaming/tech, cherche à transformer sa passion en métier.	leo354@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000052	62	M	22	2026-04-01T01:43:00.735Z	2026-04-02T23:12:33.540Z	\N
91de16e0-1e5c-497c-92ef-15c74cbbc062	cdaca7ab-094c-442b-8d2b-9f3dee56c635	b5e46e9e-60ec-4e42-be30-c33a86275cc4	critique	3	Détresse détectée — orientation urgente	NEET depuis 6 mois, isolement social. Intérêt pour le sport et l'animation.	arthur213@email.com	email	en_attente	sourcee	\N	0	\N	0	31395dae-b34b-4d39-8b80-23f2671c1b02	07	M	20	2026-03-22T18:32:09.821Z	2026-04-02T23:12:33.540Z	\N
724b9f4b-2e40-4ece-b226-4dafc27b4de2	c1bd6a0c-0f61-4894-a866-5ac89cd05f82	e960f936-d5c2-47dc-9eae-67b3289a28d8	haute	2	Fragilité modérée — accompagnement recommandé	Conflit familial sur le choix d'orientation. Besoin d'un espace neutre pour construire son projet.	mathis498@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000017	07	M	15	2026-03-24T07:36:48.949Z	2026-04-02T23:12:33.540Z	\N
55e543fb-6a63-4327-b1f9-41ba46be0959	92598bcd-69c4-4b3b-bde0-f1c05569d886	160ec62a-9640-44ab-a242-65255df02f57	haute	2	Fragilité modérée — accompagnement recommandé	Jeune parent, cherche une formation courte compatible avec ses contraintes.	leo706@email.com	email	en_attente	generique	\N	0	\N	0	\N	94	M	22	2026-03-17T23:43:29.812Z	2026-04-02T23:12:33.540Z	\N
d6a94b28-93b9-43bc-8486-4bc869186306	c81f9f95-e102-4558-bcb5-cc45ce7d018c	8adba9d6-94eb-47e4-8558-21de671e30ea	haute	2	Fragilité modérée — accompagnement recommandé	NEET depuis 6 mois, isolement social. Intérêt pour le sport et l'animation.	maelys597@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000033	66	F	21	2026-03-27T17:29:33.116Z	2026-04-02T23:12:33.540Z	\N
97b1c565-0d95-4741-a2e8-fae1e2ae4198	05d49191-ef46-4e50-aa03-fde945c96896	1b965620-067e-40ac-87dc-1f695eb7a2c1	haute	2	Fragilité modérée — accompagnement recommandé	Sortie de formation sans diplôme, besoin de remobilisation et de confiance en soi.	yanis161@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000033	69	M	23	2026-03-27T08:04:01.268Z	2026-04-02T23:12:33.540Z	\N
c733e84d-ba2a-4d63-91c3-dc1b4a84eb27	b4158d6b-da5a-4f8b-8be4-5488ebf13b32	e15e5dac-52f9-4a4f-897a-260c0806d18b	haute	2	Fragilité modérée — accompagnement recommandé	NEET depuis 6 mois, isolement social. Intérêt pour le sport et l'animation.	camille854@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000010	17	F	23	2026-03-15T20:21:55.715Z	2026-04-02T23:12:33.540Z	\N
75ca6a10-09f6-4c20-bc18-8b8b83c36495	6c9e4172-b593-4ae3-9c12-7aeb73fb3361	cf15fa01-3781-4a3d-82a6-306a2731e2cf	haute	2	Fragilité modérée — accompagnement recommandé	En alternance mais souhaite changer de voie. Besoin de conseil.	nour857@email.com	email	en_attente	generique	\N	0	\N	0	\N	67	F	15	2026-04-01T15:11:04.143Z	2026-04-02T23:12:33.540Z	\N
5025e5e5-e22a-4bf9-96d0-09f9e94f95c3	da216f27-4c36-403d-9041-9295c4577b6b	9e96900b-39c8-43d2-acc0-44303d39ebfe	normale	1	Demande d'accompagnement	Lycéen(ne) en terminale, hésitant(e) sur l'orientation post-bac. Intérêt pour les métiers créatifs et le social.	0668763779	telephone	en_attente	generique	\N	0	\N	0	\N	75	F	15	2026-03-26T16:27:01.778Z	2026-04-02T23:12:33.540Z	\N
8a2036eb-433a-46a4-9249-091dd814c826	478a7def-c724-4d1e-838c-24d4a7e8aa3b	cc29c414-f616-4085-9702-d89dd1d3db5d	haute	2	Fragilité modérée — accompagnement recommandé	Passionné(e) de gaming/tech, cherche à transformer sa passion en métier.	lea368@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000076	41	F	22	2026-03-17T09:46:32.081Z	2026-04-02T23:12:33.540Z	\N
15eb2f35-23b7-4e15-8584-732af57656b2	381f924c-fe52-4a9f-8568-11369e14c544	8a343115-6c20-404a-9ffc-994afd25f41a	normale	1	Demande d'accompagnement	Lycéen(ne) en terminale, hésitant(e) sur l'orientation post-bac. Intérêt pour les métiers créatifs et le social.	0624425006	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000003	30	M	23	2026-03-29T10:11:11.003Z	2026-04-02T23:12:33.540Z	\N
0e8fb491-70ec-4fea-8222-576d78c9044a	25c7b2b0-4759-4100-953d-c732e7d51cfc	795d4bdc-d12f-4aa2-b262-c0a1375e71e4	normale	1	Demande d'accompagnement	Passionné(e) de gaming/tech, cherche à transformer sa passion en métier.	amina259@email.com	email	en_attente	generique	\N	0	\N	0	\N	84	F	18	2026-03-18T01:56:47.385Z	2026-04-02T23:12:33.540Z	\N
94b1d37f-4a76-4e16-b085-90313c694785	0a58652a-8b68-4074-a9a0-ed0f609205e8	bcbd1f7c-d658-4f5b-a11f-5635c025457e	normale	1	Demande d'accompagnement	Décrocheur/se depuis 3 mois, en perte de motivation. Besoin d'un accompagnement pour se remobiliser.	lucas581@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000099	80	M	22	2026-03-17T18:12:54.154Z	2026-04-02T23:12:33.540Z	\N
1db2bba5-854e-43ad-89e5-74afa4e18406	2e1216a4-098c-46ef-9bdb-54d64d2d128c	253c13f2-2611-4f41-ba54-1510d63b2c14	normale	1	Demande d'accompagnement	Conflit familial sur le choix d'orientation. Besoin d'un espace neutre pour construire son projet.	0676461049	telephone	en_attente	sourcee	\N	0	\N	0	seed-str-000079	67	F	16	2026-03-24T10:25:36.146Z	2026-04-02T23:12:33.540Z	\N
f1c55399-cdf5-4ab3-b8ff-0ebed2eca877	7aec43d7-b9f4-4626-8f31-33acab3c3945	954ef068-e3ad-44c9-8098-1522ce07eeff	critique	3	Détresse détectée — orientation urgente	Décrocheur/se depuis 3 mois, en perte de motivation. Besoin d'un accompagnement pour se remobiliser.	chloe425@email.com	email	en_attente	sourcee	\N	0	\N	0	seed-str-000068	13	F	25	2026-03-24T07:25:15.226Z	2026-04-02T23:12:33.540Z	\N
314e392d-bf0c-4117-a28a-2109c9a97c8f	e036af1d-83c0-46e3-9d60-77313f52b261	20a73d4a-c8a6-4514-af08-66df296e0030	normale	0	Profil stabilisé — mise en relation	Le jeune bénéficiaire exprime un sentiment de confusion et de désorientation face à sa situation actuelle. Il cherche des conseils pour mieux comprendre ses intérêts et ses options. L'assistant, avec une approche empathique, l'encourage à réfléchir à ses passions pour l'aider à trouver une direction.	0614111800	telephone	rupture	generique	265a987b-47e3-47f5-83bf-a9a274596f2b	0	\N	0	seed-str-000099	94	\N	20	2026-04-03T09:34:34.921Z	2026-04-03T09:46:45.146Z	\N
cf697de9-219f-4fc0-9a58-e328eac6bfc9	917ad1d9-37af-4223-aa84-4c1ee508f564	f0fe4fd5-3bdb-41d8-957c-d3f2770001d6	normale	0	Profil stabilisé — mise en relation	Alan, un jeune bénéficiaire, exprime son ambition de devenir riche, mais semble un peu perdu quant aux étapes à suivre pour y parvenir. Le chatbot, Catch'Up, tente de l'orienter en lui posant des questions sur ses passions et ses compétences dans le domaine du business. Alan ne semble pas très engagé dans la conversation, ce qui pourrait refléter une certaine confusion ou un manque de motivation. L'assistant continue d'encourager Alan à explorer ses forces pour l'aider à trouver un chemin professionnel adapté à ses aspirations.	0686564883	telephone	rupture	generique	\N	0	\N	0	seed-str-000001	75	\N	22	2026-04-03T08:08:37.847Z	2026-04-03T08:39:06.277Z	\N
87b94169-d25d-452d-bf50-cad4f248d51d	e036af1d-83c0-46e3-9d60-77313f52b261	e23e66c1-01c6-457e-9419-dfff398705ff	normale	0	Profil stabilisé — mise en relation		0614111800	telephone	rupture	generique	62e8ae7f-1594-4ad9-8bd1-96c55c80324d	0	\N	0	seed-str-000099	94	\N	18	2026-04-03T09:16:49.199Z	2026-04-03T09:22:29.692Z	\N
562a0822-c7da-43fb-8e1a-bd583620960e	e036af1d-83c0-46e3-9d60-77313f52b261	fde6aa6c-4710-4849-b448-132646ddda96	normale	0	Profil stabilisé — mise en relation		0614111800	telephone	rupture	generique	62e8ae7f-1594-4ad9-8bd1-96c55c80324d	0	\N	0	seed-str-000099	94	\N	18	2026-04-03T09:22:29.692Z	2026-04-03T09:34:34.921Z	\N
750d5b42-8c54-439d-8daa-2e92b17dbc6d	e036af1d-83c0-46e3-9d60-77313f52b261	2353f7d5-5b75-4dbc-bf1c-a6982e6e97d2	normale	0	Profil stabilisé — mise en relation		0614111800	telephone	annulee	generique	62e8ae7f-1594-4ad9-8bd1-96c55c80324d	0	\N	0	seed-str-000099	94	\N	16	2026-04-03T09:46:45.146Z	2026-04-03T09:57:46.656Z	\N
81c191a3-9b46-4135-93d5-cc43146ad2ec	917ad1d9-37af-4223-aa84-4c1ee508f564	865097d6-8bc9-4a8d-a809-f335a6330c6c	normale	0	Profil stabilisé — mise en relation		0686564883	telephone	annulee	generique	\N	0	\N	0	seed-str-000079	89	\N	22	2026-04-03T09:29:25.896Z	2026-04-03T11:22:55.281Z	\N
2a4d122c-8eae-4a9c-b7d7-954f39f2d262	917ad1d9-37af-4223-aa84-4c1ee508f564	1dbcf9ec-5d28-4707-8b63-7bc02754e923	normale	0	Profil stabilisé — mise en relation	Le jeune bénéficiaire exprime ses passions et ses activités de loisirs au chatbot d'orientation. Il semble ouvert à la discussion et curieux de partager ses intérêts. Son état émotionnel est positif, et il recherche des conseils pour mieux orienter ses choix futurs en fonction de ses passions.	0686564883	telephone	prise_en_charge	generique	\N	0	\N	0	seed-str-000030	45	\N	22	2026-04-03T14:48:14.069Z	2026-04-03T14:49:04.355Z	\N
\.


--
-- Data for Name: rendez_vous; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rendez_vous (id, prise_en_charge_id, titre, description, date_heure, duree_minutes, lieu, lien_visio, statut, organisateur_type, organisateur_id, participants, rappel_envoye, google_event_id, outlook_event_id, cree_le, mis_a_jour_le) FROM stdin;
\.


--
-- Data for Name: session_conseiller; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session_conseiller (id, conseiller_id, jeton, expire_le, revoque, cree_le) FROM stdin;
c61b6210-9d5a-40ae-9a76-c5a420138485	fba8c822-beff-4dfd-8e1f-9d31f046ee46	c61b6210-9d5a-40ae-9a76-c5a420138485	2026-03-28T04:50:40.437Z	0	2026-03-27T20:50:40.437Z
37a48578-ec1e-4563-af06-d17ac39b4a84	fba8c822-beff-4dfd-8e1f-9d31f046ee46	37a48578-ec1e-4563-af06-d17ac39b4a84	2026-03-28T04:51:03.318Z	0	2026-03-27T20:51:03.318Z
8de96d11-2dd1-428f-a0b6-209868515446	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	8de96d11-2dd1-428f-a0b6-209868515446	2026-03-30T23:17:19.076Z	0	2026-03-30T15:17:19.076Z
f0fcefa9-bdea-4d80-8bec-60879b388b1c	fba8c822-beff-4dfd-8e1f-9d31f046ee46	f0fcefa9-bdea-4d80-8bec-60879b388b1c	2026-03-31T18:20:07.560Z	1	2026-03-31T10:20:07.560Z
06e0f609-ffce-4044-a578-0e36b9400d20	38631b01-9d23-47dc-be1f-f82126c2a72c	06e0f609-ffce-4044-a578-0e36b9400d20	2026-03-31T18:24:08.391Z	1	2026-03-31T10:24:08.391Z
85430d9e-f957-41c2-85a8-52961ab2d699	287c9b3a-c93e-4d89-ade3-e56b1059212e	85430d9e-f957-41c2-85a8-52961ab2d699	2026-03-31T20:17:21.601Z	0	2026-03-31T12:17:21.601Z
b5bfd644-e9e8-48d5-a4fd-9a2a8da5cd8f	287c9b3a-c93e-4d89-ade3-e56b1059212e	b5bfd644-e9e8-48d5-a4fd-9a2a8da5cd8f	2026-03-31T20:48:55.838Z	0	2026-03-31T12:48:55.838Z
f5369f80-1d1e-4f68-9562-f28d0149e9e1	287c9b3a-c93e-4d89-ade3-e56b1059212e	f5369f80-1d1e-4f68-9562-f28d0149e9e1	2026-03-31T23:41:59.361Z	0	2026-03-31T15:41:59.361Z
0268ac67-6bf2-40d7-a870-afeb30cf925c	287c9b3a-c93e-4d89-ade3-e56b1059212e	0268ac67-6bf2-40d7-a870-afeb30cf925c	2026-04-01T15:30:13.479Z	0	2026-04-01T07:30:13.479Z
ade9db2b-c8ea-444d-b7ae-e08629c5bae8	38631b01-9d23-47dc-be1f-f82126c2a72c	ade9db2b-c8ea-444d-b7ae-e08629c5bae8	2026-04-01T15:31:01.750Z	0	2026-04-01T07:31:01.750Z
87b2f6be-2d2e-4ecb-b5e1-27ecd2f6cd10	287c9b3a-c93e-4d89-ade3-e56b1059212e	87b2f6be-2d2e-4ecb-b5e1-27ecd2f6cd10	2026-04-01T17:05:44.872Z	0	2026-04-01T09:05:44.872Z
b29228fa-b6f4-42c5-8eb3-0c5cae4101e2	287c9b3a-c93e-4d89-ade3-e56b1059212e	b29228fa-b6f4-42c5-8eb3-0c5cae4101e2	2026-04-01T19:20:57.620Z	0	2026-04-01T11:20:57.620Z
a9b633ad-9ac1-4270-99cd-e1d6b6b1915d	287c9b3a-c93e-4d89-ade3-e56b1059212e	a9b633ad-9ac1-4270-99cd-e1d6b6b1915d	2026-04-01T22:23:27.347Z	0	2026-04-01T14:23:27.347Z
71fb2b32-d66c-4a6b-afd9-fae60fc4f1f2	287c9b3a-c93e-4d89-ade3-e56b1059212e	71fb2b32-d66c-4a6b-afd9-fae60fc4f1f2	2026-04-01T22:27:30.446Z	0	2026-04-01T14:27:30.446Z
1e1f6110-5523-4c66-8407-9b7feafa4c0a	287c9b3a-c93e-4d89-ade3-e56b1059212e	1e1f6110-5523-4c66-8407-9b7feafa4c0a	2026-04-02T07:13:15.835Z	0	2026-04-01T23:13:15.835Z
6ac5682a-fd8e-4272-8334-14fb0cc8c6df	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	6ac5682a-fd8e-4272-8334-14fb0cc8c6df	2026-04-02T17:17:32.942Z	0	2026-04-02T09:17:32.942Z
1fe3cd5d-1af5-417c-b3ab-e157d456e233	287c9b3a-c93e-4d89-ade3-e56b1059212e	1fe3cd5d-1af5-417c-b3ab-e157d456e233	2026-04-02T19:24:32.748Z	0	2026-04-02T11:24:32.748Z
00d041b9-4da6-4d82-809e-df83d83defa6	38631b01-9d23-47dc-be1f-f82126c2a72c	00d041b9-4da6-4d82-809e-df83d83defa6	2026-04-02T23:08:25.011Z	1	2026-04-02T15:08:25.011Z
f081663f-8291-44b4-a227-b49dee121aa0	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	f081663f-8291-44b4-a227-b49dee121aa0	2026-04-02T23:10:15.273Z	1	2026-04-02T15:10:15.273Z
b1908144-c543-426c-a7da-560fb2b63539	38631b01-9d23-47dc-be1f-f82126c2a72c	b1908144-c543-426c-a7da-560fb2b63539	2026-04-02T23:11:19.112Z	1	2026-04-02T15:11:19.112Z
8e733474-833a-4e27-af3a-7de9ea4a08c5	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	8e733474-833a-4e27-af3a-7de9ea4a08c5	2026-04-02T23:23:52.339Z	0	2026-04-02T15:23:52.339Z
cb2c1dd3-659b-435b-a0a0-067c657dfc3c	287c9b3a-c93e-4d89-ade3-e56b1059212e	cb2c1dd3-659b-435b-a0a0-067c657dfc3c	2026-04-02T23:40:12.945Z	0	2026-04-02T15:40:12.945Z
748a5748-8f1a-4641-a7aa-bed5dfd8084a	e0d19945-7ea9-4c05-9def-2e7621de0e64	748a5748-8f1a-4641-a7aa-bed5dfd8084a	2026-04-03T01:17:16.239Z	0	2026-04-02T17:17:16.239Z
5570033e-4cd9-4a3a-8b28-c86a42ff2d6b	287c9b3a-c93e-4d89-ade3-e56b1059212e	5570033e-4cd9-4a3a-8b28-c86a42ff2d6b	2026-04-03T03:08:11.386Z	0	2026-04-02T19:08:11.386Z
639d36fe-1da7-47f8-8418-02ec93bb2e0f	287c9b3a-c93e-4d89-ade3-e56b1059212e	639d36fe-1da7-47f8-8418-02ec93bb2e0f	2026-04-03T06:07:19.819Z	0	2026-04-02T22:07:19.819Z
98d34f26-9feb-461b-9ff8-0d5bceb70ecf	287c9b3a-c93e-4d89-ade3-e56b1059212e	98d34f26-9feb-461b-9ff8-0d5bceb70ecf	2026-04-03T06:46:51.198Z	0	2026-04-02T22:46:51.198Z
3585527d-92c5-445f-a166-2c6060ee9356	287c9b3a-c93e-4d89-ade3-e56b1059212e	3585527d-92c5-445f-a166-2c6060ee9356	2026-04-03T06:57:12.831Z	0	2026-04-02T22:57:12.831Z
86616916-cbfc-4eb8-83a8-c81c9c987928	287c9b3a-c93e-4d89-ade3-e56b1059212e	86616916-cbfc-4eb8-83a8-c81c9c987928	2026-04-03T07:22:20.635Z	0	2026-04-02T23:22:20.635Z
a171dc11-b2fc-4ba2-ad41-938072e65dd9	287c9b3a-c93e-4d89-ade3-e56b1059212e	a171dc11-b2fc-4ba2-ad41-938072e65dd9	2026-04-03T13:08:05.789Z	0	2026-04-03T05:08:05.789Z
b2a08e59-4577-4cd3-9139-64e1dfc138b1	287c9b3a-c93e-4d89-ade3-e56b1059212e	b2a08e59-4577-4cd3-9139-64e1dfc138b1	2026-04-03T16:19:10.273Z	0	2026-04-03T08:19:10.273Z
a1982791-26a1-4193-883d-2f9d2cf5209b	287c9b3a-c93e-4d89-ade3-e56b1059212e	a1982791-26a1-4193-883d-2f9d2cf5209b	2026-04-03T16:20:13.807Z	0	2026-04-03T08:20:13.807Z
9395d7a2-35a8-422e-902f-af0e03a501e3	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	9395d7a2-35a8-422e-902f-af0e03a501e3	2026-04-03T17:13:50.285Z	1	2026-04-03T09:13:50.285Z
449e287b-98de-4135-8bb9-2c5dc1c59691	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	449e287b-98de-4135-8bb9-2c5dc1c59691	2026-04-03T17:30:04.941Z	1	2026-04-03T09:30:04.941Z
6eb7854c-69ea-4678-b352-ebb0ef28ccb4	38631b01-9d23-47dc-be1f-f82126c2a72c	6eb7854c-69ea-4678-b352-ebb0ef28ccb4	2026-04-03T17:31:11.826Z	1	2026-04-03T09:31:11.826Z
4b471332-3f37-40b7-8ffa-91d15cc324ad	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	4b471332-3f37-40b7-8ffa-91d15cc324ad	2026-04-03T17:44:53.544Z	0	2026-04-03T09:44:53.544Z
afe4fa09-e8e8-4426-962d-4aa08d5e3561	f1da8fa7-4ce1-49da-89f1-3888a2ace76e	afe4fa09-e8e8-4426-962d-4aa08d5e3561	2026-04-03T20:36:03.734Z	0	2026-04-03T12:36:03.734Z
c55317ea-01cf-405e-bb23-89ec64258fcf	287c9b3a-c93e-4d89-ade3-e56b1059212e	c55317ea-01cf-405e-bb23-89ec64258fcf	2026-04-03T22:13:04.077Z	0	2026-04-03T14:13:04.077Z
8ebb0a6a-8eb7-4192-ac52-4965cbff2d6c	287c9b3a-c93e-4d89-ade3-e56b1059212e	8ebb0a6a-8eb7-4192-ac52-4965cbff2d6c	2026-04-05T14:57:49.048Z	0	2026-04-05T06:57:49.048Z
\.


--
-- Data for Name: session_magic_link; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session_magic_link (id, utilisateur_id, email, jeton, utilise, expire_le, cree_le, utilise_le) FROM stdin;
\.


--
-- Data for Name: source_captation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.source_captation (id, code, type, nom, nb_visites, nb_quiz_completes, nb_chats_ouverts, nb_emails_collectes, cree_le, mis_a_jour_le) FROM stdin;
\.


--
-- Data for Name: structure; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.structure (id, nom, slug, type, departements, regions, age_min, age_max, specialites, genre_preference, capacite_max, adresse, code_postal, ville, latitude, longitude, webhook_url, parcoureo_id, prompt_personnalise, logo_url, actif, cree_le, mis_a_jour_le) FROM stdin;
seed-str-000001	Mission Locale Paris	ml-paris-1	mission_locale	["75"]	["Île-de-France"]	16	25	["insertion","entrepreneuriat","emploi"]	\N	45	31 rue Voltaire	75000	Paris	48.861435	2.3498025	\N	\N	\N	\N	1	2024-06-16T03:26:01.706Z	2026-03-27T16:50:11.224Z
seed-str-000002	Mission Locale Marseille	ml-marseille-2	mission_locale	["13"]	["PACA"]	16	25	["insertion","formation","mobilite"]	\N	73	132 rue Voltaire	13000	Marseille	43.291805	5.363771	\N	\N	\N	\N	1	2024-08-23T00:17:02.861Z	2026-03-27T16:50:11.224Z
seed-str-000003	Mission Locale Lyon	ml-lyon-3	mission_locale	["69"]	["Auvergne-Rhône-Alpes"]	16	25	["insertion","numerique","emploi"]	\N	39	90 rue des Écoles	69000	Lyon	45.76676	4.829934	\N	\N	\N	\N	1	2024-04-24T00:20:22.817Z	2026-03-27T16:50:11.224Z
seed-str-000004	Mission Locale Toulouse	ml-toulouse-4	mission_locale	["31"]	["Occitanie"]	16	25	["insertion","emploi","logement"]	\N	59	11 rue de la République	31000	Toulouse	43.606678	1.4368193	\N	\N	\N	\N	1	2024-07-17T00:05:44.277Z	2026-03-27T16:50:11.224Z
seed-str-000005	Mission Locale Nice	ml-nice-5	mission_locale	["06"]	["PACA"]	16	25	["insertion","numerique","emploi"]	\N	51	85 rue Voltaire	06000	Nice	43.70981	7.271063	\N	\N	\N	\N	1	2025-05-26T15:36:11.082Z	2026-03-27T16:50:11.224Z
seed-str-000006	Mission Locale Nantes	ml-nantes-6	mission_locale	["44"]	["Pays de la Loire"]	16	25	["insertion","numerique","emploi"]	\N	44	39 place du Marché	44000	Nantes	47.219273	-1.5594618	\N	\N	\N	\N	1	2024-10-09T14:15:57.112Z	2026-03-27T16:50:11.224Z
seed-str-000007	Mission Locale Strasbourg	ml-strasbourg-7	mission_locale	["67"]	["Grand Est"]	16	25	["insertion","formation","mobilite"]	\N	45	129 rue Jean Jaurès	67000	Strasbourg	48.57684	7.7429447	\N	\N	\N	\N	1	2024-10-09T02:25:42.458Z	2026-03-27T16:50:11.224Z
seed-str-000008	Mission Locale Montpellier	ml-montpellier-8	mission_locale	["34"]	["Occitanie"]	16	25	["insertion","emploi","logement"]	\N	27	19 rue Nationale	34000	Montpellier	43.607044	3.8794384	\N	\N	\N	\N	1	2024-04-11T06:56:19.926Z	2026-03-27T16:50:11.224Z
seed-str-000009	Mission Locale Bordeaux	ml-bordeaux-9	mission_locale	["33"]	["Nouvelle-Aquitaine"]	16	25	["insertion","emploi","logement"]	\N	35	104 rue Pasteur	33000	Bordeaux	44.839245	-0.5707759	\N	\N	\N	\N	1	2024-09-16T01:50:50.087Z	2026-03-27T16:50:11.224Z
seed-str-000010	Mission Locale Lille	ml-lille-10	mission_locale	["59"]	["Hauts-de-France"]	16	25	["insertion","emploi","logement"]	\N	70	92 rue de Verdun	59000	Lille	50.637356	3.0652356	\N	\N	\N	\N	1	2025-02-15T08:03:24.946Z	2026-03-27T16:50:11.224Z
seed-str-000011	Mission Locale Rennes	ml-rennes-11	mission_locale	["35"]	["Bretagne"]	16	25	["insertion","entrepreneuriat","emploi"]	\N	78	133 avenue de la Gare	35000	Rennes	48.12388	-1.6692554	\N	\N	\N	\N	1	2024-05-09T12:13:03.432Z	2026-03-27T16:50:11.224Z
seed-str-000012	Mission Locale Reims	ml-reims-12	mission_locale	["51"]	["Grand Est"]	16	25	["insertion","decrochage","emploi"]	\N	22	117 avenue Victor Hugo	51100	Reims	49.25871	3.9663618	\N	\N	\N	\N	1	2025-03-07T23:53:48.840Z	2026-03-27T16:50:11.224Z
seed-str-000013	Mission Locale Saint-Étienne	ml-sainttienne-13	mission_locale	["42"]	["Auvergne-Rhône-Alpes"]	16	25	["insertion","decrochage","emploi"]	\N	32	149 rue Pasteur	42000	Saint-Étienne	45.44232	4.3899426	\N	\N	\N	\N	1	2025-09-10T05:17:51.382Z	2026-03-27T16:50:11.224Z
seed-str-000014	Mission Locale Le Havre	ml-lehavre-14	mission_locale	["76"]	["Normandie"]	16	25	["insertion","entrepreneuriat","emploi"]	\N	25	134 rue de la Paix	76600	Le Havre	49.493935	0.103352726	\N	\N	\N	\N	1	2025-01-19T22:55:28.854Z	2026-03-27T16:50:11.224Z
seed-str-000015	Mission Locale Toulon	ml-toulon-15	mission_locale	["83"]	["PACA"]	16	25	["insertion","formation","mobilite"]	\N	51	108 rue Pasteur	83000	Toulon	43.131252	5.9285398	\N	\N	\N	\N	1	2024-08-07T03:38:23.833Z	2026-03-27T16:50:11.224Z
seed-str-000016	Mission Locale Grenoble	ml-grenoble-16	mission_locale	["38"]	["Auvergne-Rhône-Alpes"]	16	25	["insertion","decrochage","emploi"]	\N	38	13 rue Voltaire	38000	Grenoble	45.197502	5.7187796	\N	\N	\N	\N	1	2024-11-01T15:02:04.194Z	2026-03-27T16:50:11.224Z
seed-str-000017	Mission Locale Dijon	ml-dijon-17	mission_locale	["21"]	["Bourgogne-Franche-Comté"]	16	25	["insertion","entrepreneuriat","emploi"]	\N	47	133 boulevard Gambetta	21000	Dijon	47.320362	5.0444202	\N	\N	\N	\N	1	2024-11-03T13:59:04.374Z	2026-03-27T16:50:11.224Z
seed-str-000018	Mission Locale Angers	ml-angers-18	mission_locale	["49"]	["Pays de la Loire"]	16	25	["insertion","numerique","emploi"]	\N	62	85 avenue de la Gare	49000	Angers	47.483746	-0.5535921	\N	\N	\N	\N	1	2024-12-08T21:46:58.744Z	2026-03-27T16:50:11.224Z
seed-str-000019	Mission Locale Nîmes	ml-nmes-19	mission_locale	["30"]	["Occitanie"]	16	25	["insertion","entrepreneuriat","emploi"]	\N	57	133 boulevard Gambetta	30000	Nîmes	43.836994	4.354662	\N	\N	\N	\N	1	2025-09-18T13:56:25.444Z	2026-03-27T16:50:11.224Z
seed-str-000020	Mission Locale Clermont-Ferrand	ml-clermontferrand-20	mission_locale	["63"]	["Auvergne-Rhône-Alpes"]	16	25	["insertion","emploi","logement"]	\N	20	135 boulevard Saint-Michel	63000	Clermont-Ferrand	45.778576	3.0782316	\N	\N	\N	\N	1	2024-04-09T18:40:46.666Z	2026-03-27T16:50:11.224Z
seed-str-000021	Mission Locale Aix-en-Provence	ml-aixenprovence-21	mission_locale	["13"]	["PACA"]	16	25	["insertion","formation","mobilite"]	\N	24	34 rue de la Paix	13100	Aix-en-Provence	43.535942	5.4545703	\N	\N	\N	\N	1	2025-05-21T21:27:12.664Z	2026-03-27T16:50:11.224Z
seed-str-000022	Mission Locale Brest	ml-brest-22	mission_locale	["29"]	["Bretagne"]	16	25	["insertion","decrochage","emploi"]	\N	40	78 place du Marché	29200	Brest	48.398457	-4.493573	\N	\N	\N	\N	1	2024-12-15T22:23:08.577Z	2026-03-27T16:50:11.224Z
seed-str-000023	Mission Locale Tours	ml-tours-23	mission_locale	["37"]	["Centre-Val de Loire"]	16	25	["insertion","formation","mobilite"]	\N	41	129 boulevard Gambetta	37000	Tours	47.39943	0.6760727	\N	\N	\N	\N	1	2025-01-18T14:24:38.581Z	2026-03-27T16:50:11.224Z
seed-str-000024	Mission Locale Amiens	ml-amiens-24	mission_locale	["80"]	["Hauts-de-France"]	16	25	["insertion","decrochage","emploi"]	\N	63	56 boulevard Gambetta	80000	Amiens	49.898853	2.2953813	\N	\N	\N	\N	1	2025-09-11T07:46:21.282Z	2026-03-27T16:50:11.224Z
seed-str-000025	Mission Locale Limoges	ml-limoges-25	mission_locale	["87"]	["Nouvelle-Aquitaine"]	16	25	["insertion","emploi","logement"]	\N	60	143 rue Jean Jaurès	87000	Limoges	45.834106	1.2600836	\N	\N	\N	\N	1	2024-05-28T12:34:37.162Z	2026-03-27T16:50:11.224Z
seed-str-000026	Mission Locale Villeurbanne	ml-villeurbanne-26	mission_locale	["69"]	["Auvergne-Rhône-Alpes"]	16	25	["insertion","entrepreneuriat","emploi"]	\N	68	81 rue de Verdun	69100	Villeurbanne	45.76844	4.87513	\N	\N	\N	\N	1	2024-08-28T18:55:46.679Z	2026-03-27T16:50:11.224Z
seed-str-000027	Mission Locale Metz	ml-metz-27	mission_locale	["57"]	["Grand Est"]	16	25	["insertion","formation","mobilite"]	\N	32	8 place de la Fontaine	57000	Metz	49.11031	6.1699715	\N	\N	\N	\N	1	2024-10-01T00:39:27.522Z	2026-03-27T16:50:11.224Z
seed-str-000028	Mission Locale Besançon	ml-besanon-28	mission_locale	["25"]	["Bourgogne-Franche-Comté"]	16	25	["insertion","decrochage","emploi"]	\N	71	79 rue Émile Zola	25000	Besançon	47.23004	6.025554	\N	\N	\N	\N	1	2024-09-30T22:44:44.126Z	2026-03-27T16:50:11.224Z
seed-str-000029	Mission Locale Perpignan	ml-perpignan-29	mission_locale	["66"]	["Occitanie"]	16	25	["insertion","emploi","logement"]	\N	44	122 rue Voltaire	66000	Perpignan	42.6804	2.8963823	\N	\N	\N	\N	1	2024-10-17T00:46:41.260Z	2026-03-27T16:50:11.224Z
seed-str-000030	Mission Locale Orléans	ml-orlans-30	mission_locale	["45"]	["Centre-Val de Loire"]	16	25	["insertion","decrochage","emploi"]	\N	61	4 boulevard Saint-Michel	45000	Orléans	47.900143	1.9167924	\N	\N	\N	\N	1	2024-10-26T18:57:58.254Z	2026-03-27T16:50:11.224Z
seed-str-000031	Mission Locale Caen	ml-caen-31	mission_locale	["14"]	["Normandie"]	16	25	["insertion","numerique","emploi"]	\N	67	44 boulevard de la Liberté	14000	Caen	49.17525	-0.37215212	\N	\N	\N	\N	1	2025-02-17T13:56:36.071Z	2026-03-27T16:50:11.224Z
seed-str-000032	Mission Locale Mulhouse	ml-mulhouse-32	mission_locale	["68"]	["Grand Est"]	16	25	["insertion","numerique","emploi"]	\N	74	34 rue de la Paix	68100	Mulhouse	47.75986	7.340203	\N	\N	\N	\N	1	2024-05-28T08:38:45.832Z	2026-03-27T16:50:11.224Z
seed-str-000033	Mission Locale Rouen	ml-rouen-33	mission_locale	["76"]	["Normandie"]	16	25	["insertion","emploi","logement"]	\N	42	73 avenue Victor Hugo	76000	Rouen	49.44997	1.0932833	\N	\N	\N	\N	1	2025-02-25T18:43:20.546Z	2026-03-27T16:50:11.224Z
seed-str-000034	Mission Locale Nancy	ml-nancy-34	mission_locale	["54"]	["Grand Est"]	16	25	["insertion","decrochage","emploi"]	\N	32	113 avenue Carnot	54000	Nancy	48.683636	6.178699	\N	\N	\N	\N	1	2025-05-09T14:46:46.558Z	2026-03-27T16:50:11.224Z
seed-str-000035	Mission Locale Argenteuil	ml-argenteuil-35	mission_locale	["95"]	["Île-de-France"]	16	25	["insertion","entrepreneuriat","emploi"]	\N	21	24 rue Jean Jaurès	95100	Argenteuil	48.956333	2.2398534	\N	\N	\N	\N	1	2024-08-06T11:34:41.722Z	2026-03-27T16:50:11.224Z
seed-str-000036	Mission Locale Saint-Denis	ml-saintdenis-36	mission_locale	["93"]	["Île-de-France"]	16	25	["insertion","formation","mobilite"]	\N	69	7 rue de Verdun	93200	Saint-Denis	48.933434	2.3563023	\N	\N	\N	\N	1	2024-07-31T13:34:50.426Z	2026-03-27T16:50:11.224Z
seed-str-000037	Mission Locale Montreuil	ml-montreuil-37	mission_locale	["93"]	["Île-de-France"]	16	25	["insertion","emploi","logement"]	\N	41	38 rue Voltaire	93100	Montreuil	48.855495	2.4512477	\N	\N	\N	\N	1	2025-06-29T14:38:38.806Z	2026-03-27T16:50:11.224Z
seed-str-000038	Mission Locale Tourcoing	ml-tourcoing-38	mission_locale	["59"]	["Hauts-de-France"]	16	25	["insertion","entrepreneuriat","emploi"]	\N	45	94 rue Pasteur	59200	Tourcoing	50.730526	3.1561663	\N	\N	\N	\N	1	2025-04-09T20:15:03.541Z	2026-03-27T16:50:11.224Z
seed-str-000039	Mission Locale Avignon	ml-avignon-39	mission_locale	["84"]	["PACA"]	16	25	["insertion","numerique","emploi"]	\N	35	45 rue Voltaire	84000	Avignon	43.94301	4.809921	\N	\N	\N	\N	1	2025-06-20T18:11:30.562Z	2026-03-27T16:50:11.224Z
seed-str-000040	Mission Locale Dunkerque	ml-dunkerque-40	mission_locale	["59"]	["Hauts-de-France"]	16	25	["insertion","entrepreneuriat","emploi"]	\N	44	67 avenue de la Gare	59140	Dunkerque	51.03446	2.3673291	\N	\N	\N	\N	1	2025-05-16T07:18:26.230Z	2026-03-27T16:50:11.224Z
seed-str-000041	CIO Poitiers	cio-poitiers-1	cio	["86"]	["Nouvelle-Aquitaine"]	14	25	["orientation","reorientation","lyceen"]	\N	76	80 rue de la République	86000	Poitiers	46.575993	0.33677727	\N	\N	\N	\N	1	2024-09-15T06:59:12.687Z	2026-03-27T16:50:11.224Z
seed-str-000042	CIO Pau	cio-pau-2	cio	["64"]	["Nouvelle-Aquitaine"]	14	25	["orientation","bilan","etudiant"]	\N	78	32 rue de la République	64000	Pau	43.285614	-0.37305406	\N	\N	\N	\N	1	2025-06-25T04:24:38.675Z	2026-03-27T16:50:11.224Z
seed-str-000043	CIO Calais	cio-calais-3	cio	["62"]	["Hauts-de-France"]	14	25	["orientation","bilan","etudiant"]	\N	43	98 avenue Foch	62100	Calais	50.94885	1.8548609	\N	\N	\N	\N	1	2024-05-17T09:18:18.554Z	2026-03-27T16:50:11.224Z
seed-str-000044	CIO La Rochelle	cio-larochelle-4	cio	["17"]	["Nouvelle-Aquitaine"]	14	25	["orientation","parcoursup","lyceen"]	\N	73	28 rue des Écoles	17000	La Rochelle	46.164196	-1.1568286	\N	\N	\N	\N	1	2025-05-02T06:02:19.076Z	2026-03-27T16:50:11.224Z
seed-str-000045	CIO Colmar	cio-colmar-5	cio	["68"]	["Grand Est"]	14	25	["orientation","reorientation","lyceen"]	\N	25	123 place du Marché	68000	Colmar	48.080845	7.36522	\N	\N	\N	\N	1	2025-05-16T16:16:06.093Z	2026-03-27T16:50:11.224Z
seed-str-000046	CIO Ajaccio	cio-ajaccio-6	cio	["2A"]	["Corse"]	14	25	["orientation","bilan","etudiant"]	\N	47	63 avenue Foch	20000	Ajaccio	41.923904	8.743688	\N	\N	\N	\N	1	2024-06-09T06:48:15.509Z	2026-03-27T16:50:11.224Z
seed-str-000047	CIO Bastia	cio-bastia-7	cio	["2B"]	["Corse"]	14	25	["orientation","parcoursup","lyceen"]	\N	75	37 rue des Écoles	20200	Bastia	42.691856	9.457208	\N	\N	\N	\N	1	2024-06-22T19:16:38.263Z	2026-03-27T16:50:11.224Z
seed-str-000048	CIO Béziers	cio-bziers-8	cio	["34"]	["Occitanie"]	14	25	["orientation","bilan","etudiant"]	\N	35	121 avenue de la Gare	34500	Béziers	43.33793	3.214776	\N	\N	\N	\N	1	2024-04-29T07:54:42.763Z	2026-03-27T16:50:11.224Z
seed-str-000049	CIO Bourges	cio-bourges-9	cio	["18"]	["Centre-Val de Loire"]	14	25	["orientation","bilan","etudiant"]	\N	76	31 rue de Verdun	18000	Bourges	47.0737	2.3908644	\N	\N	\N	\N	1	2025-07-14T07:11:48.617Z	2026-03-27T16:50:11.224Z
seed-str-000050	CIO Chambéry	cio-chambry-10	cio	["73"]	["Auvergne-Rhône-Alpes"]	14	25	["orientation","parcoursup","lyceen"]	\N	44	61 avenue Victor Hugo	73000	Chambéry	45.567623	5.91258	\N	\N	\N	\N	1	2025-05-08T10:19:50.635Z	2026-03-27T16:50:11.224Z
seed-str-000051	CIO Chartres	cio-chartres-11	cio	["28"]	["Centre-Val de Loire"]	14	25	["orientation","parcoursup","lyceen"]	\N	73	90 avenue de la Gare	28000	Chartres	48.46423	1.4925452	\N	\N	\N	\N	1	2024-09-11T00:55:17.939Z	2026-03-27T16:50:11.224Z
seed-str-000052	CIO Cherbourg	cio-cherbourg-12	cio	["50"]	["Normandie"]	14	25	["orientation","reorientation","lyceen"]	\N	22	148 boulevard de la Liberté	50100	Cherbourg	49.634243	-1.6298729	\N	\N	\N	\N	1	2025-04-25T20:47:17.672Z	2026-03-27T16:50:11.224Z
seed-str-000053	CIO Cholet	cio-cholet-13	cio	["49"]	["Pays de la Loire"]	14	25	["orientation","reorientation","lyceen"]	\N	33	44 rue Pasteur	49300	Cholet	47.05226	-0.8809621	\N	\N	\N	\N	1	2024-07-07T04:19:29.480Z	2026-03-27T16:50:11.224Z
seed-str-000054	CIO Épinal	cio-pinal-14	cio	["88"]	["Grand Est"]	14	25	["orientation","parcoursup","lyceen"]	\N	74	57 avenue Carnot	88000	Épinal	48.17863	6.4411364	\N	\N	\N	\N	1	2025-08-10T00:45:43.120Z	2026-03-27T16:50:11.224Z
seed-str-000055	CIO Évreux	cio-vreux-15	cio	["27"]	["Normandie"]	14	25	["orientation","reorientation","lyceen"]	\N	39	81 avenue de la Gare	27000	Évreux	49.020668	1.1487138	\N	\N	\N	\N	1	2025-01-12T23:03:08.409Z	2026-03-27T16:50:11.224Z
seed-str-000056	CIO Gap	cio-gap-16	cio	["05"]	["PACA"]	14	25	["orientation","reorientation","lyceen"]	\N	44	76 rue de Verdun	05000	Gap	44.552475	6.082981	\N	\N	\N	\N	1	2025-09-20T00:21:59.370Z	2026-03-27T16:50:11.224Z
seed-str-000057	CIO Laval	cio-laval-17	cio	["53"]	["Pays de la Loire"]	14	25	["orientation","parcoursup","lyceen"]	\N	25	61 rue de la République	53000	Laval	48.075554	-0.76238865	\N	\N	\N	\N	1	2024-07-25T17:29:05.468Z	2026-03-27T16:50:11.224Z
seed-str-000058	CIO Le Mans	cio-lemans-18	cio	["72"]	["Pays de la Loire"]	14	25	["orientation","reorientation","lyceen"]	\N	76	19 rue Jean Jaurès	72000	Le Mans	47.99909	0.19318466	\N	\N	\N	\N	1	2025-07-16T02:36:47.860Z	2026-03-27T16:50:11.224Z
seed-str-000059	CIO Lorient	cio-lorient-19	cio	["56"]	["Bretagne"]	14	25	["orientation","parcoursup","lyceen"]	\N	62	122 rue Voltaire	56100	Lorient	47.745003	-3.374735	\N	\N	\N	\N	1	2024-04-06T15:37:51.849Z	2026-03-27T16:50:11.224Z
seed-str-000060	CIO Mâcon	cio-mcon-20	cio	["71"]	["Bourgogne-Franche-Comté"]	14	25	["orientation","bilan","etudiant"]	\N	40	32 avenue Victor Hugo	71000	Mâcon	46.305637	4.825473	\N	\N	\N	\N	1	2025-09-25T19:03:03.199Z	2026-03-27T16:50:11.224Z
seed-str-000061	E2C Montauban	e2c-montauban-1	e2c	["82"]	["Occitanie"]	16	25	["decrochage","formation","insertion"]	\N	25	142 boulevard Gambetta	82000	Montauban	44.013275	1.354121	\N	\N	\N	\N	1	2024-04-10T05:35:16.180Z	2026-03-27T16:50:11.224Z
seed-str-000062	E2C Mont-de-Marsan	e2c-montdemarsan-2	e2c	["40"]	["Nouvelle-Aquitaine"]	16	25	["decrochage","formation","insertion"]	\N	65	81 place de la Fontaine	40000	Mont-de-Marsan	43.889965	-0.50462055	\N	\N	\N	\N	1	2025-09-24T14:17:57.611Z	2026-03-27T16:50:11.224Z
seed-str-000063	E2C Niort	e2c-niort-3	e2c	["79"]	["Nouvelle-Aquitaine"]	16	25	["decrochage","formation","insertion"]	\N	59	112 rue de la République	79000	Niort	46.314896	-0.4608619	\N	\N	\N	\N	1	2025-08-02T02:19:02.442Z	2026-03-27T16:50:11.224Z
seed-str-000064	E2C Périgueux	e2c-prigueux-4	e2c	["24"]	["Nouvelle-Aquitaine"]	16	25	["decrochage","formation","insertion"]	\N	48	104 rue Émile Zola	24000	Périgueux	45.194504	0.71991706	\N	\N	\N	\N	1	2024-04-10T15:13:39.652Z	2026-03-27T16:50:11.224Z
seed-str-000065	E2C Quimper	e2c-quimper-5	e2c	["29"]	["Bretagne"]	16	25	["decrochage","formation","insertion"]	\N	72	9 place de la Mairie	29000	Quimper	48.00386	-4.0988092	\N	\N	\N	\N	1	2025-09-04T21:33:07.826Z	2026-03-27T16:50:11.224Z
seed-str-000066	E2C Rodez	e2c-rodez-6	e2c	["12"]	["Occitanie"]	16	25	["decrochage","insertion","remobilisation"]	\N	53	130 place de la Mairie	12000	Rodez	44.352535	2.5757492	\N	\N	\N	\N	1	2024-05-10T17:41:56.549Z	2026-03-27T16:50:11.224Z
seed-str-000067	E2C Saint-Brieuc	e2c-saintbrieuc-7	e2c	["22"]	["Bretagne"]	16	25	["decrochage","formation","insertion"]	\N	28	108 rue de la Paix	22000	Saint-Brieuc	48.511204	-2.7663386	\N	\N	\N	\N	1	2024-08-17T06:51:29.266Z	2026-03-27T16:50:11.224Z
seed-str-000068	E2C Saint-Malo	e2c-saintmalo-8	e2c	["35"]	["Bretagne"]	16	25	["decrochage","formation","insertion"]	\N	34	60 avenue Foch	35400	Saint-Malo	48.659027	-2.0093608	\N	\N	\N	\N	1	2025-06-24T09:42:20.041Z	2026-03-27T16:50:11.224Z
seed-str-000069	E2C Saint-Nazaire	e2c-saintnazaire-9	e2c	["44"]	["Pays de la Loire"]	16	25	["decrochage","insertion","remobilisation"]	\N	70	84 rue de la Paix	44600	Saint-Nazaire	47.2633	-2.2090347	\N	\N	\N	\N	1	2024-11-30T23:16:08.874Z	2026-03-27T16:50:11.224Z
seed-str-000070	E2C Tarbes	e2c-tarbes-10	e2c	["65"]	["Occitanie"]	16	25	["decrochage","formation","insertion"]	\N	52	87 boulevard Gambetta	65000	Tarbes	43.24188	0.07237249	\N	\N	\N	\N	1	2025-07-13T06:01:52.525Z	2026-03-27T16:50:11.224Z
seed-str-000071	E2C Troyes	e2c-troyes-11	e2c	["10"]	["Grand Est"]	16	25	["decrochage","insertion","remobilisation"]	\N	39	31 place de la Fontaine	10000	Troyes	48.30075	4.064676	\N	\N	\N	\N	1	2024-10-02T19:31:53.490Z	2026-03-27T16:50:11.224Z
seed-str-000072	E2C Valence	e2c-valence-12	e2c	["26"]	["Auvergne-Rhône-Alpes"]	16	25	["decrochage","insertion","remobilisation"]	\N	21	23 rue Jean Jaurès	26000	Valence	44.934685	4.8917956	\N	\N	\N	\N	1	2025-04-06T14:24:32.113Z	2026-03-27T16:50:11.224Z
seed-str-000073	E2C Vannes	e2c-vannes-13	e2c	["56"]	["Bretagne"]	16	25	["decrochage","insertion","remobilisation"]	\N	48	30 rue de Verdun	56000	Vannes	47.657215	-2.7535584	\N	\N	\N	\N	1	2025-05-05T06:29:14.743Z	2026-03-27T16:50:11.224Z
seed-str-000074	E2C Vichy	e2c-vichy-14	e2c	["03"]	["Auvergne-Rhône-Alpes"]	16	25	["decrochage","formation","insertion"]	\N	79	81 boulevard de la Liberté	03200	Vichy	46.119556	3.4349844	\N	\N	\N	\N	1	2025-05-31T09:52:35.168Z	2026-03-27T16:50:11.224Z
seed-str-000075	E2C Angoulême	e2c-angoulme-15	e2c	["16"]	["Nouvelle-Aquitaine"]	16	25	["decrochage","insertion","remobilisation"]	\N	48	43 boulevard Gambetta	16000	Angoulême	45.645416	0.1470538	\N	\N	\N	\N	1	2025-01-20T22:13:29.110Z	2026-03-27T16:50:11.224Z
seed-str-000076	PAIO Albi	paio-albi-1	paio	["81"]	["Occitanie"]	16	25	["accueil","orientation","insertion"]	\N	26	41 rue des Écoles	81000	Albi	43.922546	2.1476698	\N	\N	\N	\N	1	2024-04-17T09:56:02.231Z	2026-03-27T16:50:11.224Z
seed-str-000077	PAIO Agen	paio-agen-2	paio	["47"]	["Nouvelle-Aquitaine"]	16	25	["accueil","orientation","insertion"]	\N	53	78 boulevard Gambetta	47000	Agen	44.201687	0.6243742	\N	\N	\N	\N	1	2024-07-26T04:56:56.120Z	2026-03-27T16:50:11.224Z
seed-str-000078	PAIO Aurillac	paio-aurillac-3	paio	["15"]	["Auvergne-Rhône-Alpes"]	16	25	["accueil","orientation","insertion"]	\N	45	82 avenue Victor Hugo	15000	Aurillac	44.92436	2.4498804	\N	\N	\N	\N	1	2024-06-16T19:52:30.293Z	2026-03-27T16:50:11.224Z
seed-str-000079	PAIO Auxerre	paio-auxerre-4	paio	["89"]	["Bourgogne-Franche-Comté"]	16	25	["accueil","formation","emploi"]	\N	65	13 rue de la Paix	89000	Auxerre	47.793053	3.5757911	\N	\N	\N	\N	1	2025-03-09T08:45:16.248Z	2026-03-27T16:50:11.224Z
seed-str-000080	PAIO Bayonne	paio-bayonne-5	paio	["64"]	["Nouvelle-Aquitaine"]	16	25	["accueil","orientation","insertion"]	\N	44	50 rue de la République	64100	Bayonne	43.497154	-1.4651587	\N	\N	\N	\N	1	2024-04-22T03:04:22.764Z	2026-03-27T16:50:11.224Z
seed-str-000081	PAIO Belfort	paio-belfort-6	paio	["90"]	["Bourgogne-Franche-Comté"]	16	25	["accueil","orientation","insertion"]	\N	65	99 place de la Fontaine	90000	Belfort	47.63259	6.861045	\N	\N	\N	\N	1	2024-04-12T03:58:24.942Z	2026-03-27T16:50:11.224Z
seed-str-000082	PAIO Blois	paio-blois-7	paio	["41"]	["Centre-Val de Loire"]	16	25	["accueil","orientation","insertion"]	\N	61	27 avenue Victor Hugo	41000	Blois	47.578224	1.3299065	\N	\N	\N	\N	1	2025-05-26T19:40:23.475Z	2026-03-27T16:50:11.224Z
seed-str-000083	PAIO Bourg-en-Bresse	paio-bourgenbresse-8	paio	["01"]	["Auvergne-Rhône-Alpes"]	16	25	["accueil","formation","emploi"]	\N	58	19 rue Jean Jaurès	01000	Bourg-en-Bresse	46.20201	5.2199287	\N	\N	\N	\N	1	2025-08-09T23:59:56.106Z	2026-03-27T16:50:11.224Z
seed-str-000084	PAIO Carcassonne	paio-carcassonne-9	paio	["11"]	["Occitanie"]	16	25	["accueil","orientation","insertion"]	\N	74	147 rue de Verdun	11000	Carcassonne	43.216904	2.3587222	\N	\N	\N	\N	1	2024-12-11T15:55:47.711Z	2026-03-27T16:50:11.224Z
seed-str-000085	PAIO Châteauroux	paio-chteauroux-10	paio	["36"]	["Centre-Val de Loire"]	16	25	["accueil","orientation","insertion"]	\N	25	27 rue Pasteur	36000	Châteauroux	46.811707	1.6943849	\N	\N	\N	\N	1	2025-09-16T19:11:56.432Z	2026-03-27T16:50:11.224Z
seed-str-000086	Fondation Digne-les-Bains	fdn-dignelesbains-1	fondation	["04"]	["PACA"]	16	30	["recherche","orientation","evaluation"]	\N	30	52 rue de la Paix	04000	Digne-les-Bains	44.10231	6.237075	\N	\N	\N	\N	1	2024-10-05T15:27:17.221Z	2026-03-27T16:50:11.224Z
seed-str-000087	Fondation Foix	fdn-foix-2	fondation	["09"]	["Occitanie"]	16	30	["orientation","innovation","numerique"]	\N	40	27 rue de la Paix	09000	Foix	42.96526	1.6053537	\N	\N	\N	\N	1	2025-01-20T13:47:46.037Z	2026-03-27T16:50:11.224Z
seed-str-000088	Fondation Guéret	fdn-guret-3	fondation	["23"]	["Nouvelle-Aquitaine"]	16	30	["orientation","innovation","numerique"]	\N	46	63 place du Marché	23000	Guéret	46.169563	1.8811489	\N	\N	\N	\N	1	2024-11-13T08:44:41.178Z	2026-03-27T16:50:11.224Z
seed-str-000089	Fondation Lons-le-Saunier	fdn-lonslesaunier-4	fondation	["39"]	["Bourgogne-Franche-Comté"]	16	30	["recherche","orientation","evaluation"]	\N	64	98 place du Marché	39000	Lons-le-Saunier	46.6682	5.5550814	\N	\N	\N	\N	1	2025-07-16T09:36:54.299Z	2026-03-27T16:50:11.224Z
seed-str-000090	Fondation Mende	fdn-mende-5	fondation	["48"]	["Occitanie"]	16	30	["orientation","innovation","numerique"]	\N	67	107 rue Voltaire	48000	Mende	44.51077	3.5062935	\N	\N	\N	\N	1	2025-09-11T06:08:59.613Z	2026-03-27T16:50:11.224Z
seed-str-000091	Association Moulins	asso-moulins-1	association	["03"]	["Auvergne-Rhône-Alpes"]	16	25	["insertion","social","accompagnement"]	\N	45	42 boulevard Gambetta	03000	Moulins	46.569088	3.3238487	\N	\N	\N	\N	1	2025-06-08T21:53:40.560Z	2026-03-27T16:50:11.224Z
seed-str-000092	Association Nevers	asso-nevers-2	association	["58"]	["Bourgogne-Franche-Comté"]	16	25	["insertion","social","accompagnement"]	\N	60	7 avenue Foch	58000	Nevers	46.997475	3.148499	\N	\N	\N	\N	1	2025-06-03T16:32:30.842Z	2026-03-27T16:50:11.224Z
seed-str-000093	Association Privas	asso-privas-3	association	["07"]	["Auvergne-Rhône-Alpes"]	16	25	["jeunesse","emploi","culture"]	\N	47	116 boulevard Saint-Michel	07000	Privas	44.728554	4.5902376	\N	\N	\N	\N	1	2024-12-07T09:11:52.751Z	2026-03-27T16:50:11.224Z
seed-str-000094	Association Saint-Lô	asso-saintl-4	association	["50"]	["Normandie"]	16	25	["insertion","handicap","formation"]	\N	45	104 rue du Commerce	50000	Saint-Lô	49.118675	-1.0867183	\N	\N	\N	\N	1	2024-12-09T20:20:31.297Z	2026-03-27T16:50:11.224Z
seed-str-000095	Association Tulle	asso-tulle-5	association	["19"]	["Nouvelle-Aquitaine"]	16	25	["insertion","handicap","formation"]	\N	21	149 place de la Mairie	19000	Tulle	45.2708	1.7695394	\N	\N	\N	\N	1	2025-01-22T18:58:28.333Z	2026-03-27T16:50:11.224Z
seed-str-000096	Association Vesoul	asso-vesoul-6	association	["70"]	["Bourgogne-Franche-Comté"]	16	25	["insertion","social","accompagnement"]	\N	51	105 boulevard Saint-Michel	70000	Vesoul	47.619865	6.144717	\N	\N	\N	\N	1	2025-08-13T15:43:19.087Z	2026-03-27T16:50:11.224Z
seed-str-000097	Association Cergy	asso-cergy-7	association	["95"]	["Île-de-France"]	16	25	["jeunesse","emploi","culture"]	\N	29	18 place de la Fontaine	95000	Cergy	49.03692	2.0776823	\N	\N	\N	\N	1	2024-07-06T05:53:13.836Z	2026-03-27T16:50:11.224Z
seed-str-000098	Association Évry	asso-vry-8	association	["91"]	["Île-de-France"]	16	25	["insertion","handicap","formation"]	\N	59	70 rue de la Paix	91000	Évry	48.640396	2.4342186	\N	\N	\N	\N	1	2025-07-10T05:19:23.290Z	2026-03-27T16:50:11.224Z
seed-str-000099	Association Créteil	asso-crteil-9	association	["94"]	["Île-de-France"]	16	25	["jeunesse","emploi","culture"]	\N	53	140 rue de la République	94000	Créteil	48.78345	2.4463496	\N	\N	\N	\N	1	2024-07-01T19:02:58.111Z	2026-03-27T16:50:11.224Z
seed-str-000100	Association Nanterre	asso-nanterre-10	association	["92"]	["Île-de-France"]	16	25	["insertion","handicap","formation"]	\N	74	53 rue de Verdun	92000	Nanterre	48.88592	2.2138915	\N	\N	\N	\N	1	2025-02-07T03:29:51.021Z	2026-03-27T16:50:11.224Z
5a7e5324-468d-4d70-ab5f-6517f518c473	Mission Locale Paris 15	ml-paris15	mission_locale	["75","92"]	["ile-de-france"]	16	25	["insertion","decrochage","emploi"]	\N	50	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
a20a3fa9-f9f2-4cb6-8c2f-68c2dac80c9e	CIO Lyon 3	cio-lyon	cio	["69"]	["auvergne-rhone-alpes"]	14	25	["orientation","reorientation","lyceen"]	\N	40	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
48f36ad0-047d-403b-a392-f9d921b3b877	E2C Lille Métropole	e2c-lille	e2c	["59","62"]	["hauts-de-france"]	16	25	["decrochage","insertion","remobilisation"]	\N	30	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
ad9dfc8f-abd7-456c-9ea8-f70025af08f8	PAIO Toulouse	paio-toulouse	paio	["31","32"]	["occitanie"]	16	25	["accueil","orientation","insertion"]	\N	35	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
1a78559d-8632-4638-9f2f-9ae15954ce90	CIO Nantes	cio-nantes	cio	["44","85"]	["pays-de-la-loire"]	14	25	["orientation","reorientation","lyceen"]	\N	35	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
480a2d13-aa06-4d26-91d9-7a6f243e27e5	E2C Strasbourg	e2c-strasbourg	e2c	["67","68"]	["grand-est"]	16	25	["decrochage","insertion","remobilisation"]	\N	25	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
31395dae-b34b-4d39-8b80-23f2671c1b02	Fondation JAE	fondation-jae	fondation	["69","75","13","59","31","33","44","67","06"]	["nationale"]	14	30	["orientation","innovation","numerique"]	\N	100	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
aaefcf2b-54db-4aa2-a4c6-a9c88834d717	CIO Rennes	cio-rennes	cio	["35","22"]	["bretagne"]	14	25	["orientation","reorientation"]	\N	30	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	2026-03-27T20:45:38.007Z	2026-03-27T20:45:38.007Z
8a44f6df-a375-4c91-ad53-68e873206d3a	Mission Locale des Bords de Marne	ml-bords-de-marne	mission_locale	["94"]	["ile-de-france"]	16	25	["insertion","emploi","orientation"]	\N	40	\N	94130	Nogent-sur-Marne	\N	\N	\N	\N	\N	\N	1	2026-03-31T10:23:30.270Z	2026-03-31T10:23:30.270Z
d2f39531-15c3-472e-b0cb-f70ce8e5f7ac	Mission Locale d Orleans	ml-orleans	mission_locale	["45"]	["centre-val-de-loire"]	16	25	["insertion","emploi","orientation"]	\N	40	\N	45000	Orleans	\N	\N	\N	\N	\N	/api/conseiller/structures/d2f39531-15c3-472e-b0cb-f70ce8e5f7ac/logo/serve	1	2026-03-31T12:15:00.981Z	2026-04-02T15:45:45.616Z
\.


--
-- Data for Name: tiers_intervenant; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tiers_intervenant (id, prise_en_charge_id, nom, prenom, telephone, role, invite_par_id, statut, cree_le, mis_a_jour_le) FROM stdin;
\.


--
-- Data for Name: utilisateur; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.utilisateur (id, prenom, email, email_verifie, telephone, age, situation, code_parrainage, parraine_par, source, source_detail, plateforme, preferences, cree_le, mis_a_jour_le, mot_de_passe, session_token, session_token_expire_le, derniere_visite, supprime_le) FROM stdin;
764d8257-1e32-4045-998f-185c24fe3875	Jade	jade558@email.com	0	\N	24	neet	\N	\N	qrcode	\N	pwa	\N	2026-03-19T09:07:34.201Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
972234d9-d1ac-4e99-9ef4-dd2da9d447f3	Amina	\N	0	0663368777	21	service_civique	\N	\N	direct	\N	web	\N	2026-03-16T02:57:53.449Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
cb903f71-6b96-4706-97be-bb2018cebe38	Rayan	rayan442@email.com	0	\N	16	en_formation	\N	\N	qrcode	\N	web	\N	2026-03-18T03:13:35.534Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
7266cb6a-9155-4626-99ed-cab1b8577f19	Wassim	wassim978@email.com	0	\N	24	decrocheur	\N	\N	qrcode	\N	web	\N	2026-03-23T10:19:53.693Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
2f9d92c8-7a48-4279-bae9-41de1912655c	Romane	romane487@email.com	0	\N	24	neet	\N	\N	qrcode	\N	web	\N	2026-03-26T03:29:33.589Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
7278ccaf-7b99-43cc-bb98-381ec56db7f7	Pauline	\N	0	0659080424	20	neet	\N	\N	qrcode	\N	pwa	\N	2026-03-17T05:56:55.991Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
ba4fe67d-0997-4cfb-adfa-ff0a82994dc2	Alice	alice623@email.com	0	\N	16	neet	\N	\N	prescripteur	\N	web	\N	2026-03-25T05:37:51.336Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
23e431f7-de11-4c59-85a7-43fd04cc3d5c	Victor	\N	0	0643425007	21	alternance	\N	\N	direct	\N	web	\N	2026-03-19T19:24:50.596Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
ca7ebcaa-57d6-4622-bd06-706e8e5883aa	Louis	louis855@email.com	0	\N	19	en_formation	\N	\N	prescripteur	\N	web	\N	2026-03-14T06:43:58.852Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
b9c29de8-174e-42b3-a365-d0898e968f0e	Maxime	maxime554@email.com	0	\N	20	en_formation	\N	\N	prescripteur	\N	web	\N	2026-03-23T12:07:39.189Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
61a285fa-0c7e-4da4-966c-6a3848a2ed02	Clara	clara227@email.com	0	\N	21	neet	\N	\N	qrcode	\N	web	\N	2026-03-24T14:02:25.235Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
0cb1645c-8fec-4b18-b5b9-547e72d31227	Ethan	ethan806@email.com	0	\N	20	etudiant	\N	\N	prescripteur	\N	web	\N	2026-04-02T17:44:10.735Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
9f6b28a1-d107-4fb1-b90a-cad220cd1f6e	Margot	margot177@email.com	0	\N	16	service_civique	\N	\N	parcoureo	\N	web	\N	2026-03-16T05:33:58.902Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
c3a6591b-04c7-445c-966b-2aed6292f2b4	Mélissa	\N	0	0672894968	20	decrocheur	\N	\N	prescripteur	\N	web	\N	2026-03-19T08:40:27.229Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
68538956-a26d-4273-b38a-c3d3ce0c3908	Chloé	chloe294@email.com	0	\N	21	en_recherche	\N	\N	direct	\N	web	\N	2026-03-18T07:50:52.826Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
c2e8c6bb-2929-4f5f-9265-c2ca2fedd072	Paul	paul380@email.com	0	\N	17	decrocheur	\N	\N	prescripteur	\N	web	\N	2026-03-26T20:47:14.231Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
e26d46f1-0339-4e3e-8efe-a938c49b3d56	Lucie	lucie53@email.com	0	\N	22	neet	\N	\N	direct	\N	web	\N	2026-03-28T11:44:16.485Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
033e1119-beb8-43ed-8605-4dd0532dba07	Charlotte	\N	0	0620487408	15	etudiant	\N	\N	direct	\N	web	\N	2026-03-18T08:07:02.008Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
9704c08b-0b24-4788-80cd-d0be5da1fd99	Chloé	chloe460@email.com	0	\N	19	en_recherche	\N	\N	prescripteur	\N	pwa	\N	2026-03-31T02:44:41.363Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
3f3181a4-8aaa-47d0-af07-bb3a9ed3d613	Lina	lina475@email.com	0	\N	20	etudiant	\N	\N	qrcode	\N	web	\N	2026-03-25T00:03:09.588Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
d1e3307b-406a-42c6-818b-cf1adb2cfa6b	Théo	theo970@email.com	0	\N	22	service_civique	\N	\N	qrcode	\N	web	\N	2026-03-28T09:10:53.824Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
59ab8d32-27ca-476f-a994-f5e0063dae24	Amina	amina362@email.com	0	\N	25	alternance	\N	\N	parcoureo	\N	web	\N	2026-04-01T07:07:56.948Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
a7f8d90a-2e64-4184-b7d1-a706970f9628	Gabriel	gabriel860@email.com	0	\N	25	neet	\N	\N	parcoureo	\N	web	\N	2026-04-02T06:52:42.325Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
59e3d40f-12de-49c4-b565-020bd233b1a8	Karim	\N	0	0651558969	25	etudiant	\N	\N	parcoureo	\N	web	\N	2026-03-22T04:59:05.896Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
ef2fa34b-1555-4961-89c8-5af4b1ed7eed	Mehdi	mehdi916@email.com	0	\N	17	en_formation	\N	\N	prescripteur	\N	pwa	\N	2026-03-27T10:26:22.607Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
6318fc54-b834-406f-a11f-ca365a386424	Anaïs	\N	0	0638789363	16	neet	\N	\N	direct	\N	web	\N	2026-03-16T04:15:15.242Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
c739076c-0035-4abd-8ae9-da6ae3d17485	Axel	\N	0	0628236486	19	en_recherche	\N	\N	qrcode	\N	web	\N	2026-03-24T22:04:11.505Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
d4b3c044-ebbd-4c2f-b30b-7845fa36d281	Ethan	ethan974@email.com	0	\N	21	en_formation	\N	\N	qrcode	\N	web	\N	2026-03-20T17:24:01.697Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
0420c1db-a7eb-4f20-a244-f242e87f679b	Alice	\N	0	0675700844	16	en_formation	\N	\N	direct	\N	web	\N	2026-03-19T00:43:20.173Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
3f13ff28-8fac-4e5f-9142-a9c3412fa4f5	Victor	\N	0	0650538497	18	decrocheur	\N	\N	parcoureo	\N	web	\N	2026-03-29T04:35:37.920Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
97ad5524-3180-468f-bbb1-bfab8cc9f54a	Arthur	\N	0	0681926575	19	decrocheur	\N	\N	direct	\N	web	\N	2026-04-02T13:22:48.536Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
863c92b1-6896-4bfd-a5bd-bb6c5ae2480b	Noah	noah355@email.com	0	\N	24	alternance	\N	\N	qrcode	\N	web	\N	2026-03-23T12:59:11.186Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
e0142f18-d265-4280-8aff-f90d771130f5	Romane	romane829@email.com	0	\N	20	en_recherche	\N	\N	parcoureo	\N	web	\N	2026-03-20T02:11:34.460Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
5050641e-a789-4676-b22a-a7c807dfeafe	Léo	\N	0	0637992020	17	etudiant	\N	\N	direct	\N	pwa	\N	2026-03-26T19:40:44.511Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
769ebb73-7f9d-4f98-8a10-ab5149b85dfb	Zoé	zoe454@email.com	0	\N	25	en_formation	\N	\N	qrcode	\N	web	\N	2026-03-30T07:48:46.692Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
f20c171e-e75e-4c5f-98dd-b82593009008	Lina	lina828@email.com	0	\N	24	lyceen	\N	\N	direct	\N	web	\N	2026-03-23T11:33:06.591Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
db073130-2085-4b0d-94f5-0d32fa385953	Sarah	\N	0	0683880724	15	etudiant	\N	\N	direct	\N	pwa	\N	2026-03-21T16:57:16.214Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
b711deab-6ff4-46ed-a24f-1110c1356214	Yanis	yanis153@email.com	0	\N	21	en_recherche	\N	\N	qrcode	\N	web	\N	2026-03-17T22:42:37.475Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
fe350604-7636-4e7a-bdd8-1d0c6a6a57ef	Yasmine	yasmine249@email.com	0	\N	19	service_civique	\N	\N	qrcode	\N	web	\N	2026-03-15T02:46:27.572Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
d40c1da4-481c-487b-948e-fc6e25bb6b7f	Léo	\N	0	0623145446	16	decrocheur	\N	\N	direct	\N	web	\N	2026-03-14T21:57:27.135Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
efde489a-d530-4ecf-aeb9-0f04c194bcfa	Margot	\N	0	0633182193	17	en_recherche	\N	\N	direct	\N	pwa	\N	2026-03-14T06:16:48.742Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
d7a6d492-3ec7-49a2-b646-1bbf450fd0ae	Kylian	kylian623@email.com	0	\N	22	decrocheur	\N	\N	direct	\N	web	\N	2026-03-19T21:39:17.656Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
e8b0ae99-38b3-41cd-99ac-fec8c013112b	Enzo	enzo692@email.com	0	\N	20	alternance	\N	\N	prescripteur	\N	web	\N	2026-04-02T19:57:22.648Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
824e1e50-207b-4f86-847d-249323ef280d	Romane	romane464@email.com	0	\N	22	etudiant	\N	\N	qrcode	\N	web	\N	2026-04-01T00:38:43.762Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
96c3f06b-0783-4b28-921c-13f007d3b57f	Laura	laura384@email.com	0	\N	22	etudiant	\N	\N	prescripteur	\N	pwa	\N	2026-03-22T18:12:13.972Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
32061828-987b-442c-843e-557392375abc	Léo	leo12@email.com	0	\N	23	neet	\N	\N	parcoureo	\N	web	\N	2026-03-24T02:51:40.714Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
a41d007f-59cb-418e-a9f3-0a804c111893	Julie	julie119@email.com	0	\N	17	neet	\N	\N	parcoureo	\N	web	\N	2026-03-31T23:12:04.898Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
fe7157fd-18c6-41fa-aba6-4981b60d2721	Enzo	enzo683@email.com	0	\N	15	service_civique	\N	\N	direct	\N	pwa	\N	2026-03-15T21:59:39.782Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
830bc3e5-d2e7-45b6-96a8-736fd706a8b2	Lucie	lucie294@email.com	0	\N	25	etudiant	\N	\N	parcoureo	\N	web	\N	2026-03-30T01:54:18.774Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
41e2cec6-b7e3-435c-ba0a-e2373bbf4adb	Nour	nour910@email.com	0	\N	24	en_recherche	\N	\N	direct	\N	web	\N	2026-03-20T02:38:55.824Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
2c7ba8e3-c80a-45ef-ac3f-635148674432	Rayan	\N	0	0647606269	21	decrocheur	\N	\N	direct	\N	web	\N	2026-03-21T20:18:59.998Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
cfe6a6c0-ad96-442c-9804-e1048cc855cb	Jules	jules298@email.com	0	\N	25	alternance	\N	\N	direct	\N	web	\N	2026-03-28T15:25:34.206Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
56d07aed-9bc9-4b99-9f6b-22eb71db1720	Mélissa	melissa475@email.com	0	\N	24	lyceen	\N	\N	prescripteur	\N	web	\N	2026-03-30T03:09:37.319Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
5f529811-2674-42ef-8dba-66cc01dda263	Marie	\N	0	0642040857	25	decrocheur	\N	\N	direct	\N	web	\N	2026-03-24T10:10:52.183Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
ec5d2b4a-75a0-49f3-bfb3-39dbb0cdddf0	Wassim	\N	0	0680184922	17	neet	\N	\N	direct	\N	pwa	\N	2026-03-30T05:20:01.947Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
5dcfa146-fe4b-45c7-8668-fca724591905	Ethan	ethan715@email.com	0	\N	23	decrocheur	\N	\N	prescripteur	\N	web	\N	2026-03-27T19:32:44.551Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
a7d7571c-7589-4cd5-9910-d7b95d25732f	Ibrahim	ibrahim231@email.com	0	\N	17	lyceen	\N	\N	parcoureo	\N	pwa	\N	2026-03-18T22:54:39.286Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
7b8ccdf8-5524-4f1b-b35c-8bc337dc685f	Maxime	maxime941@email.com	0	\N	20	service_civique	\N	\N	parcoureo	\N	pwa	\N	2026-03-23T13:50:52.636Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
aefcd229-ae2e-443f-9a4a-1464dbcd4ab1	Victor	victor516@email.com	0	\N	23	decrocheur	\N	\N	parcoureo	\N	web	\N	2026-03-24T07:42:15.564Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
52baa462-4e8f-47de-b651-02b49215c6f4	Amina	\N	0	0664719564	24	service_civique	\N	\N	qrcode	\N	web	\N	2026-03-29T17:44:42.835Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
27ef7d2f-62ef-4934-9f80-95e490e00000	Nina	\N	0	0611954427	18	lyceen	\N	\N	parcoureo	\N	pwa	\N	2026-03-30T11:36:09.840Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
a6b61108-5b88-49fa-af98-24424716fa35	Sacha	sacha277@email.com	0	\N	20	etudiant	\N	\N	prescripteur	\N	web	\N	2026-03-21T00:33:40.075Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
6ac697a3-4998-4ced-a765-7f2891cd6e3a	Jules	jules615@email.com	0	\N	18	etudiant	\N	\N	qrcode	\N	web	\N	2026-03-29T21:31:07.101Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
25643329-c5b1-4f2e-a95c-6b40dbffea4d	Raphaël	raphael310@email.com	0	\N	23	en_recherche	\N	\N	qrcode	\N	web	\N	2026-03-19T19:59:08.948Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
5654e9f9-7355-4fd7-8f5f-3e50da717be7	Léa	lea582@email.com	0	\N	20	neet	\N	\N	qrcode	\N	web	\N	2026-03-19T09:27:07.072Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
df613825-3a7a-4445-8c19-cc386f7b8290	Yasmine	yasmine987@email.com	0	\N	24	neet	\N	\N	qrcode	\N	web	\N	2026-03-14T19:02:29.944Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
83f10d16-4f0d-4012-9163-21b1605ae47a	Rayan	rayan977@email.com	0	\N	22	neet	\N	\N	prescripteur	\N	pwa	\N	2026-03-28T19:27:50.838Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
0e6a72df-0093-46ae-a343-10e6f4f209c0	Théo	theo648@email.com	0	\N	24	en_formation	\N	\N	qrcode	\N	web	\N	2026-03-19T00:00:56.444Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
4b042b4b-896a-4463-ab08-33ff459f1c73	Inès	ines416@email.com	0	\N	24	neet	\N	\N	direct	\N	web	\N	2026-03-31T08:46:58.352Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
649cb386-6ef2-44e0-9dba-1e78dd440243	Clara	\N	0	0653197829	23	service_civique	\N	\N	parcoureo	\N	web	\N	2026-04-01T18:27:50.059Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
3e840809-f9b1-47f3-93be-3398b400fe8e	Sarah	sarah752@email.com	0	\N	23	lyceen	\N	\N	parcoureo	\N	web	\N	2026-03-24T20:51:41.112Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
9142af93-5443-4882-9578-1dddbdaa388a	Lucie	lucie570@email.com	0	\N	20	neet	\N	\N	direct	\N	web	\N	2026-03-26T14:17:52.268Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
86dacd72-5e1e-4495-9068-9779ffefa10c	Sofia	sofia489@email.com	0	\N	24	alternance	\N	\N	prescripteur	\N	web	\N	2026-03-14T18:42:48.780Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
3bad7b59-de8a-4b2c-8a06-56483c74b4fa	Karim	\N	0	0697829976	23	decrocheur	\N	\N	parcoureo	\N	pwa	\N	2026-03-29T15:10:44.969Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
9d5363de-631a-4f79-9fca-94651b0f8352	Anaïs	anais556@email.com	0	\N	15	en_recherche	\N	\N	parcoureo	\N	pwa	\N	2026-03-18T07:20:08.622Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
49868a7f-1025-45bf-b4d7-e6ede2711cda	Wassim	wassim364@email.com	0	\N	25	etudiant	\N	\N	parcoureo	\N	pwa	\N	2026-03-29T23:19:18.462Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
5b73a99f-d7fa-4edf-84a8-96823a3b3d84	Inès	ines189@email.com	0	\N	24	service_civique	\N	\N	parcoureo	\N	pwa	\N	2026-03-25T05:35:47.647Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
b2085c2d-d12d-47a5-bea3-c265176ab076	Nour	\N	0	0615689525	20	service_civique	\N	\N	direct	\N	pwa	\N	2026-03-17T08:12:32.373Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
fc2eb61c-9799-4dcb-9ef7-bf8cdbb94956	Laura	laura317@email.com	0	\N	19	decrocheur	\N	\N	prescripteur	\N	web	\N	2026-03-26T19:23:42.909Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
916e2ed3-1aad-46a0-9aac-05a2518dd456	Laura	laura956@email.com	0	\N	22	neet	\N	\N	qrcode	\N	pwa	\N	2026-03-17T22:38:54.144Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
247d8768-1e5b-4ab5-b294-cdeb91ae9b93	Kylian	\N	0	0687720662	21	alternance	\N	\N	prescripteur	\N	web	\N	2026-03-21T19:37:23.964Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
650df64d-603e-4912-9cfe-50543d8239b5	Nathan	\N	0	0626328421	21	lyceen	\N	\N	direct	\N	pwa	\N	2026-03-30T03:12:45.697Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
509e7d9a-3349-4453-bc18-6a81b2bf4a17	Adam	adam794@email.com	0	\N	23	lyceen	\N	\N	direct	\N	pwa	\N	2026-03-20T18:37:14.475Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
03f3859c-31bd-4e4d-81a1-573aaf309145	Gabriel	gabriel993@email.com	0	\N	19	decrocheur	\N	\N	direct	\N	web	\N	2026-03-16T17:52:20.714Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
3ad6a440-6e8d-4307-9b10-9dacf9670bfb	Léo	leo513@email.com	0	\N	23	decrocheur	\N	\N	direct	\N	web	\N	2026-03-29T00:04:24.502Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
9ba1501b-34fe-4484-a5c8-f144280a6ee2	Nina	nina726@email.com	0	\N	19	en_formation	\N	\N	direct	\N	web	\N	2026-03-13T23:39:16.974Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
796f63fc-3464-45ce-9608-d1010076bd86	Margot	\N	0	0676062815	21	lyceen	\N	\N	prescripteur	\N	web	\N	2026-03-17T23:26:28.536Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
b98ee361-a65a-470b-9948-bc5936c2e793	Inès	\N	0	0666670984	19	neet	\N	\N	direct	\N	web	\N	2026-03-17T01:36:53.004Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
ba58cedd-611e-4410-b70e-6c30fec6308f	Pauline	pauline274@email.com	0	\N	23	neet	\N	\N	direct	\N	web	\N	2026-03-29T03:31:30.819Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
180d85fe-0bec-4109-9475-8aef5155137f	Lucas	lucas265@email.com	0	\N	17	en_recherche	\N	\N	direct	\N	web	\N	2026-03-17T14:08:17.840Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
0f3ede6e-8e7b-4670-aa0e-ad99f7b84295	Karim	karim43@email.com	0	\N	17	alternance	\N	\N	prescripteur	\N	web	\N	2026-03-19T11:47:43.551Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
df919098-a633-4505-91f8-47c7da95378e	Anaïs	\N	0	0612515356	21	etudiant	\N	\N	direct	\N	web	\N	2026-03-31T16:46:33.132Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
de9aea9c-3d5d-452d-aacc-3e50d9f47ab7	Sacha	sacha305@email.com	0	\N	18	en_formation	\N	\N	parcoureo	\N	web	\N	2026-03-28T21:36:10.918Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
67106ae0-b3c9-497d-a08b-26d91ca3e638	Enzo	\N	0	0657791676	18	en_recherche	\N	\N	parcoureo	\N	web	\N	2026-03-27T21:03:59.810Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
eecfc43e-20f5-47d4-a502-2c6cdaa71b97	Karim	karim82@email.com	0	\N	21	service_civique	\N	\N	direct	\N	web	\N	2026-03-16T17:21:40.152Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
4cb6df89-f816-4b76-9df1-67b8e8b45b23	Anaïs	\N	0	0654939331	24	etudiant	\N	\N	prescripteur	\N	web	\N	2026-03-30T14:19:28.043Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
ad2e1c6d-486b-479b-976c-d9fde079fb35	Ibrahim	ibrahim466@email.com	0	\N	21	neet	\N	\N	parcoureo	\N	web	\N	2026-03-31T20:57:32.285Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
fed82a4a-ec58-431e-8e17-46a2fce18027	Océane	oceane976@email.com	0	\N	18	neet	\N	\N	parcoureo	\N	pwa	\N	2026-03-27T00:55:02.490Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
331b09e1-a578-4c26-a278-b8059cb0c30a	Sacha	sacha723@email.com	0	\N	25	en_formation	\N	\N	qrcode	\N	web	\N	2026-03-27T13:30:18.412Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
421b4fba-05d3-4ee3-bf03-7b7a7828484b	Wassim	\N	0	0674661854	23	lyceen	\N	\N	prescripteur	\N	pwa	\N	2026-03-29T17:36:01.218Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
a78f72af-ce1d-452e-a464-59f6a52f5808	Amina	\N	0	0694619758	23	en_formation	\N	\N	qrcode	\N	web	\N	2026-03-27T04:59:57.448Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
1e24e7f8-3feb-42d9-bb17-4a8437730563	Ibrahim	ibrahim864@email.com	0	\N	22	lyceen	\N	\N	parcoureo	\N	web	\N	2026-03-23T17:16:07.958Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
99239065-37df-43aa-89e3-7fd7e263083d	Yasmine	yasmine455@email.com	0	\N	23	service_civique	\N	\N	qrcode	\N	pwa	\N	2026-03-30T22:31:40.224Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
1a80741e-7156-4314-a1f5-7b85958beea2	Ibrahim	\N	0	0694651187	22	en_formation	\N	\N	qrcode	\N	web	\N	2026-03-20T07:44:08.322Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
1b10bdb7-9ab0-44b5-b281-f295ebb7b6c4	Tom	\N	0	0699898496	15	decrocheur	\N	\N	parcoureo	\N	web	\N	2026-04-01T17:02:15.631Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
1daeb1b4-5ce2-44af-a5bb-4fc40fc64e42	Arthur	arthur823@email.com	0	\N	16	en_formation	\N	\N	prescripteur	\N	web	\N	2026-03-19T05:22:16.098Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
cd532497-bd2b-46e6-91ab-2654551a3dc1	Zoé	\N	0	0642625813	24	neet	\N	\N	prescripteur	\N	web	\N	2026-03-14T05:06:22.932Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
0da6f58a-d769-4bbb-991a-0b8540ed722b	Enzo	enzo481@email.com	0	\N	17	neet	\N	\N	prescripteur	\N	web	\N	2026-04-02T03:58:58.868Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
e01af09a-d399-441c-9758-3f799dfed44d	Théo	\N	0	0638991291	25	en_recherche	\N	\N	direct	\N	web	\N	2026-03-23T06:15:24.330Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
b32b7963-c6af-4e56-aa61-7b7fc7f16dc7	Alice	alice778@email.com	0	\N	15	neet	\N	\N	parcoureo	\N	web	\N	2026-03-18T18:53:27.724Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
0afb833e-932e-4f87-8c99-d643cb0ab0aa	Lucie	\N	0	0667458563	23	en_recherche	\N	\N	parcoureo	\N	pwa	\N	2026-04-01T02:42:44.296Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
ca90b20a-bcf7-4b09-a945-4f464e98e104	Lucie	\N	0	0691489552	19	service_civique	\N	\N	prescripteur	\N	pwa	\N	2026-03-28T01:57:18.016Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
e430ab53-087d-4998-bf48-22d39cab3501	Yanis	yanis254@email.com	0	\N	17	en_formation	\N	\N	direct	\N	web	\N	2026-03-26T00:45:39.720Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
3318e30a-1226-4c57-859b-10ec31dfa510	Lina	\N	0	0644811639	23	etudiant	\N	\N	qrcode	\N	web	\N	2026-03-17T23:35:47.160Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
28fca49e-e608-4f46-a3a2-c1ebe8200190	Antoine	\N	0	0697971535	25	decrocheur	\N	\N	qrcode	\N	pwa	\N	2026-03-23T06:51:33.471Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
fd6541c7-1303-4453-8bab-458ff6cf8282	Camille	camille192@email.com	0	\N	17	alternance	\N	\N	prescripteur	\N	web	\N	2026-03-24T02:56:50.010Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
069db21a-84fa-4b6d-b28f-a4173b11f710	Yasmine	yasmine391@email.com	0	\N	21	etudiant	\N	\N	parcoureo	\N	web	\N	2026-03-24T20:21:04.716Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
508239d2-9f0e-4471-b893-7b50c0631e64	Manon	manon383@email.com	0	\N	21	decrocheur	\N	\N	prescripteur	\N	web	\N	2026-03-26T10:59:05.531Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
4841b942-e1f1-4b82-8b04-a11b9bfb1fd9	Laura	\N	0	0657914725	16	service_civique	\N	\N	qrcode	\N	web	\N	2026-03-31T01:24:29.141Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
8dfa724f-a9d8-463f-bfca-38e3dca8ae6a	Enzo	enzo278@email.com	0	\N	21	en_recherche	\N	\N	parcoureo	\N	web	\N	2026-03-31T05:40:35.717Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
5dff5942-25af-4fff-8011-cd012c664484	Rayan	\N	0	0627946932	22	en_recherche	\N	\N	prescripteur	\N	pwa	\N	2026-03-27T00:25:41.283Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
8525858f-4edb-4479-bc5d-443829d2c466	Noah	noah706@email.com	0	\N	20	neet	\N	\N	direct	\N	web	\N	2026-03-28T04:25:53.625Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
45394e25-24e5-4d02-84a5-46713af6d193	Adam	adam749@email.com	0	\N	15	alternance	\N	\N	direct	\N	pwa	\N	2026-03-29T21:46:48.484Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
4c210ad7-014b-48a6-8286-a8ddf5264d3e	Karim	karim149@email.com	0	\N	20	neet	\N	\N	direct	\N	pwa	\N	2026-03-22T06:31:31.615Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
42981fb0-76a8-4cc1-af47-7ced202835cd	Louis	\N	0	0673089562	24	neet	\N	\N	parcoureo	\N	web	\N	2026-03-24T19:24:47.753Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
179113ab-61e5-4a0e-bd42-93c4b2b1f5c2	Clara	clara757@email.com	0	\N	25	en_formation	\N	\N	parcoureo	\N	web	\N	2026-03-27T17:47:24.423Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
406e7405-ed52-4710-a0c7-32d69f0839c0	Karim	karim91@email.com	0	\N	24	decrocheur	\N	\N	direct	\N	web	\N	2026-03-23T21:58:25.147Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
95db2322-9525-4a7e-b10b-9b21fa6e1f1f	Margot	margot265@email.com	0	\N	22	en_recherche	\N	\N	prescripteur	\N	web	\N	2026-03-21T19:32:05.525Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
49d0e9b0-1e04-48d7-9695-6224265064b4	Manon	\N	0	0621931636	21	service_civique	\N	\N	direct	\N	web	\N	2026-03-26T04:39:14.175Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
18413dff-7869-45f7-a745-8349f57d89f3	Wassim	wassim519@email.com	0	\N	16	lyceen	\N	\N	direct	\N	web	\N	2026-04-01T16:45:30.933Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
3c765e0f-7583-4179-a98f-295c1c624ab9	Zoé	zoe555@email.com	0	\N	19	etudiant	\N	\N	qrcode	\N	web	\N	2026-03-22T22:53:13.727Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
41a1bf37-54d8-4a0f-af19-4b84f13bf4c9	Kylian	kylian775@email.com	0	\N	23	en_formation	\N	\N	parcoureo	\N	web	\N	2026-03-23T21:39:57.871Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
757d5cb8-94bc-41ae-b53a-f8e5b9435d65	Romane	romane346@email.com	0	\N	17	neet	\N	\N	direct	\N	pwa	\N	2026-03-28T00:52:11.313Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
64d8a371-0774-48ed-8508-28532898c01e	Yasmine	yasmine865@email.com	0	\N	20	decrocheur	\N	\N	prescripteur	\N	web	\N	2026-03-18T07:11:47.575Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
d4b22522-6c2f-4eb8-8299-ed7e1b3bb4fa	Raphaël	raphael147@email.com	0	\N	15	en_recherche	\N	\N	qrcode	\N	pwa	\N	2026-03-27T16:37:09.034Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
b60a337a-1515-477b-9ae0-58009984cbe6	Léa	lea546@email.com	0	\N	20	lyceen	\N	\N	direct	\N	web	\N	2026-03-27T15:30:33.498Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
33eac1eb-4c71-4ec8-a2c5-9da733f8a8b6	Théo	theo972@email.com	0	\N	23	service_civique	\N	\N	qrcode	\N	web	\N	2026-03-21T06:52:26.065Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
4f63c8f6-9a67-42f2-b658-730b8db0b1e6	Mélissa	melissa696@email.com	0	\N	24	lyceen	\N	\N	parcoureo	\N	pwa	\N	2026-03-27T05:16:59.604Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
63ba0dc7-2836-4cab-9c81-997ef1beb339	Hugo	hugo849@email.com	0	\N	16	decrocheur	\N	\N	parcoureo	\N	web	\N	2026-03-21T05:48:29.898Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
b3da3233-e79e-460c-bcff-d90f75a87d11	Océane	\N	0	0650970109	15	etudiant	\N	\N	qrcode	\N	pwa	\N	2026-03-16T02:26:48.396Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
fbc8ceaf-70f0-4d2e-85ad-08d3fa343f9c	Léa	lea113@email.com	0	\N	20	lyceen	\N	\N	parcoureo	\N	web	\N	2026-03-25T01:18:52.059Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
c6d6de52-9dd5-4e5a-99bd-ff4b3c017a43	Enzo	\N	0	0624641160	23	lyceen	\N	\N	direct	\N	pwa	\N	2026-03-27T20:45:05.077Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
39e2b1bf-6616-4559-8d4b-6315d337fc50	Manon	manon242@email.com	0	\N	25	lyceen	\N	\N	prescripteur	\N	pwa	\N	2026-03-27T14:30:28.775Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
b0499347-d62f-4784-9531-114b06900600	Manon	\N	0	0669417715	23	alternance	\N	\N	qrcode	\N	web	\N	2026-03-24T06:04:21.863Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
dc9090c7-5234-496f-8bee-56d4ac07d8b9	Emma	emma500@email.com	0	\N	16	neet	\N	\N	qrcode	\N	pwa	\N	2026-03-29T12:58:30.365Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
e4e3ab10-0b41-4a5d-a7f0-9a9f2f5eacc7	Paul	paul850@email.com	0	\N	23	lyceen	\N	\N	parcoureo	\N	web	\N	2026-03-17T06:25:00.238Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
8b556cf5-1bf7-453d-8405-8b39a2e5dc43	Camille	camille683@email.com	0	\N	18	en_recherche	\N	\N	direct	\N	web	\N	2026-03-14T15:38:50.386Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
f66c8ffc-3566-48c8-a4b0-d1d8d04de22b	Léa	lea666@email.com	0	\N	24	en_recherche	\N	\N	prescripteur	\N	web	\N	2026-03-14T07:53:15.508Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
703959fe-92ee-442c-8838-96e13e37d92d	Arthur	arthur76@email.com	0	\N	15	etudiant	\N	\N	parcoureo	\N	web	\N	2026-03-28T04:15:05.003Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
ce736c1c-ced1-4a2c-b257-4df5434563b0	Louis	louis464@email.com	0	\N	19	etudiant	\N	\N	parcoureo	\N	pwa	\N	2026-03-18T05:31:09.073Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
59ba42d1-24e6-469b-8c35-621b4cedc99e	Lina	lina801@email.com	0	\N	17	neet	\N	\N	qrcode	\N	web	\N	2026-03-19T02:02:49.941Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
b5eb3c91-d2b5-429e-acfa-e0d0f5abe612	Kylian	kylian292@email.com	0	\N	22	en_formation	\N	\N	parcoureo	\N	web	\N	2026-03-31T05:39:16.457Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
ab1c30f5-5061-452a-abc7-8930c2983061	Yasmine	yasmine343@email.com	0	\N	19	etudiant	\N	\N	direct	\N	web	\N	2026-03-29T05:59:03.581Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
cf3b02c7-3cd7-4d22-8ee0-22a7b75a2a99	Nina	nina736@email.com	0	\N	24	alternance	\N	\N	qrcode	\N	pwa	\N	2026-03-29T02:35:50.012Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
06dc14ad-2dc8-4f03-82bf-549c1750b258	Mathis	mathis428@email.com	0	\N	20	neet	\N	\N	parcoureo	\N	web	\N	2026-03-27T23:35:38.571Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
7317326a-e743-4a69-a01a-a74ac4c17341	Yanis	yanis994@email.com	0	\N	20	decrocheur	\N	\N	direct	\N	web	\N	2026-03-17T00:21:50.009Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
4242128d-1bcd-4377-9db5-48263b1b9067	Charlotte	charlotte297@email.com	0	\N	17	neet	\N	\N	parcoureo	\N	web	\N	2026-03-23T04:20:40.704Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
10c3f1d7-35b1-4ee7-bf4a-2fae5da5a5ec	Théo	theo113@email.com	0	\N	18	etudiant	\N	\N	prescripteur	\N	web	\N	2026-03-28T15:05:41.676Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
314dd029-8784-47c7-800a-b65a89c5bfa0	Léa	lea394@email.com	0	\N	19	service_civique	\N	\N	direct	\N	web	\N	2026-03-27T00:06:14.816Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
01743b7a-b33f-4689-bcb3-667f0b615490	Charlotte	charlotte225@email.com	0	\N	15	neet	\N	\N	direct	\N	web	\N	2026-03-27T07:13:59.963Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
180e76c3-8b14-4dba-86e8-f2461866cf9a	Ibrahim	ibrahim430@email.com	0	\N	15	lyceen	\N	\N	direct	\N	web	\N	2026-03-22T11:39:36.483Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
9b19d083-772c-4b3a-8a3b-2d05a8c0f8a1	Camille	camille477@email.com	0	\N	19	decrocheur	\N	\N	direct	\N	web	\N	2026-03-20T17:16:43.166Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
6ee23bc6-35b7-4e55-aa1b-c9c5ea4f4368	Ibrahim	ibrahim926@email.com	0	\N	16	lyceen	\N	\N	direct	\N	web	\N	2026-03-23T21:51:14.662Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
94d23641-2374-4822-8efe-835096bc964b	Nour	nour469@email.com	0	\N	25	neet	\N	\N	parcoureo	\N	web	\N	2026-03-24T14:46:51.683Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
1af91dc4-f78c-4baa-84dc-bd94b6628937	Inès	\N	0	0645412599	23	en_recherche	\N	\N	direct	\N	web	\N	2026-03-24T12:59:40.218Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
61ed4304-60d0-4278-b3fc-b8035ae89610	Léa	lea135@email.com	0	\N	20	neet	\N	\N	qrcode	\N	web	\N	2026-03-14T02:18:54.422Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
40581249-3949-40cb-8e46-664bb4236c2b	Ethan	ethan303@email.com	0	\N	15	en_recherche	\N	\N	qrcode	\N	pwa	\N	2026-03-18T10:06:31.871Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
f2a0c531-e0e2-41f9-88c5-03abf0c62f6e	Anaïs	anais252@email.com	0	\N	19	service_civique	\N	\N	qrcode	\N	pwa	\N	2026-03-17T00:54:10.108Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
a8cbf0f9-e99e-41c7-a7d3-bdf02893f377	Tom	\N	0	0634748722	19	alternance	\N	\N	prescripteur	\N	web	\N	2026-03-26T13:00:39.455Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
92d6f485-dd75-4f15-8689-d655442f3066	Eva	\N	0	0669909901	20	en_recherche	\N	\N	qrcode	\N	web	\N	2026-03-29T04:47:10.395Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
96af85b9-db3c-4253-b1f6-c502d423748b	Mehdi	mehdi922@email.com	0	\N	21	en_recherche	\N	\N	direct	\N	pwa	\N	2026-03-19T06:37:21.195Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
f6510755-469c-4285-a02f-39a27508dcd6	Théo	theo598@email.com	0	\N	16	service_civique	\N	\N	qrcode	\N	web	\N	2026-03-22T07:21:27.481Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
7423daf1-d204-432e-b6cd-65f3e0cee53c	Adam	\N	0	0619661994	25	alternance	\N	\N	direct	\N	pwa	\N	2026-04-01T02:16:38.334Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
12c1c264-4559-4bb3-8f7f-85942e02ff22	Chloé	chloe214@email.com	0	\N	18	decrocheur	\N	\N	qrcode	\N	web	\N	2026-03-14T04:36:17.632Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
a4210ec5-7e1e-4524-8b93-caa4097c04c7	Théo	theo70@email.com	0	\N	24	etudiant	\N	\N	direct	\N	web	\N	2026-03-25T22:39:45.638Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
a55fdb49-098b-4d52-a6fe-a428a23d2c47	Sofia	sofia855@email.com	0	\N	21	neet	\N	\N	parcoureo	\N	web	\N	2026-03-20T10:27:20.572Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
d3d0c553-73a6-474f-8ad0-7de504a44ca9	Emma	\N	0	0645403286	25	service_civique	\N	\N	direct	\N	web	\N	2026-04-02T08:18:05.644Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
a2885063-17c1-4381-b9a2-546941ea319e	Gabriel	\N	0	0650468627	24	en_recherche	\N	\N	prescripteur	\N	web	\N	2026-03-14T20:30:36.918Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
c1212cee-3b85-4b0d-a15c-4dffaf32e669	Ethan	ethan625@email.com	0	\N	24	en_recherche	\N	\N	prescripteur	\N	pwa	\N	2026-03-29T04:02:28.583Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
60a0f991-af45-4ee5-9667-e9028db6cc48	Maëlys	maelys324@email.com	0	\N	18	en_formation	\N	\N	parcoureo	\N	pwa	\N	2026-03-17T18:28:42.148Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
fd99e0ca-adff-4441-8930-d33d751f338d	Nina	nina528@email.com	0	\N	19	decrocheur	\N	\N	direct	\N	web	\N	2026-03-29T10:22:31.942Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
dd7958bf-ee38-49c8-a415-9b3bedc2f0d6	Lina	lina182@email.com	0	\N	18	en_formation	\N	\N	parcoureo	\N	web	\N	2026-03-21T08:30:47.882Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
7d1d750a-4ef8-47ce-a931-1b9fe6b9f49e	Amina	\N	0	0669909846	17	decrocheur	\N	\N	parcoureo	\N	web	\N	2026-03-18T16:49:00.349Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
0bd68b2d-f655-4144-b7bc-771feec336c3	Zoé	zoe87@email.com	0	\N	23	alternance	\N	\N	parcoureo	\N	web	\N	2026-03-24T15:40:51.815Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
2f8dec79-7738-4d51-a41d-1ee3f70b9988	Noah	\N	0	0641608159	25	neet	\N	\N	direct	\N	web	\N	2026-03-18T09:28:35.661Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
20b623fe-413c-4f8f-8b2c-d4500aa96a84	Tom	tom227@email.com	0	\N	24	en_formation	\N	\N	parcoureo	\N	web	\N	2026-03-16T16:20:15.477Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
a3f1e578-9e48-415b-b33c-34f0b86cb66e	Louis	louis901@email.com	0	\N	24	en_formation	\N	\N	qrcode	\N	web	\N	2026-03-18T12:23:25.645Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
3a93c177-0629-4841-93c4-1c4af6731579	Sofia	\N	0	0644275427	18	neet	\N	\N	direct	\N	web	\N	2026-03-14T08:49:03.510Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
e162347e-9ffa-412f-8ccc-886afb575db6	Ibrahim	ibrahim176@email.com	0	\N	18	service_civique	\N	\N	prescripteur	\N	pwa	\N	2026-03-30T05:11:39.470Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
2cd16062-6978-410a-b9d3-e3446b2dbe8f	Lucas	\N	0	0659583290	15	etudiant	\N	\N	direct	\N	web	\N	2026-03-28T04:36:54.141Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
3de8b387-ff4b-4bbd-a263-97e331321225	Mélissa	melissa886@email.com	0	\N	25	alternance	\N	\N	direct	\N	web	\N	2026-03-29T05:50:30.921Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
8fe5d659-c661-4b97-91e0-a067c5f22cb8	Louis	louis409@email.com	0	\N	23	alternance	\N	\N	qrcode	\N	web	\N	2026-03-28T04:29:32.430Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
b726a0b9-9690-4c50-8e30-dbd283520fe4	Chloé	chloe598@email.com	0	\N	16	en_recherche	\N	\N	direct	\N	web	\N	2026-03-30T04:13:37.546Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
5fb5a284-5c15-4fd2-98a9-09c9825602a3	Chloé	chloe966@email.com	0	\N	15	en_formation	\N	\N	parcoureo	\N	pwa	\N	2026-03-30T06:47:59.109Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
ef753a23-d9dd-465c-85a1-77b0eb8e478a	Sofiane	sofiane760@email.com	0	\N	23	etudiant	\N	\N	prescripteur	\N	pwa	\N	2026-03-18T21:43:49.352Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
9e0f0abb-d9b0-43c6-86c9-0cdf1cef8421	Victor	victor891@email.com	0	\N	16	decrocheur	\N	\N	prescripteur	\N	web	\N	2026-03-27T10:34:08.359Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
4524bddb-31ac-401d-91b2-9a093914aa72	Chloé	chloe504@email.com	0	\N	20	lyceen	\N	\N	qrcode	\N	web	\N	2026-03-27T03:25:33.683Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
c4c24e69-e45d-4397-b516-01a93f56fddc	Nina	nina662@email.com	0	\N	21	en_formation	\N	\N	qrcode	\N	web	\N	2026-03-17T18:02:33.888Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
fbc357d6-24d3-4a23-bc4e-568cc698cdc1	Alice	alice845@email.com	0	\N	23	en_formation	\N	\N	qrcode	\N	web	\N	2026-03-29T09:22:39.081Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
06c75081-3902-4d97-a9e1-9950a9f72211	Manon	manon518@email.com	0	\N	21	en_recherche	\N	\N	qrcode	\N	web	\N	2026-03-25T08:30:00.852Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
25a4b725-3b30-49ae-bde4-32a109d0aaf5	Gabriel	\N	0	0677803883	23	service_civique	\N	\N	direct	\N	pwa	\N	2026-03-24T02:16:01.859Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
c18b9565-e55f-47bf-8ad8-5ede1971326e	Mehdi	mehdi837@email.com	0	\N	24	en_recherche	\N	\N	parcoureo	\N	web	\N	2026-03-27T14:27:03.205Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
0782a562-8562-421f-bb77-a980f9b17414	Ibrahim	ibrahim703@email.com	0	\N	15	alternance	\N	\N	prescripteur	\N	web	\N	2026-04-01T11:06:47.721Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
a5e754fd-de58-4c94-978e-d934e2eb8d30	Lucie	lucie802@email.com	0	\N	15	decrocheur	\N	\N	direct	\N	web	\N	2026-03-23T21:11:04.971Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
54397c3f-fc8a-4bbc-9491-58c4f2326513	Sofiane	sofiane91@email.com	0	\N	18	lyceen	\N	\N	prescripteur	\N	web	\N	2026-03-28T13:03:08.329Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
7e805fa7-7ce9-4113-b0e7-f133d3ed5e64	Nour	\N	0	0611163818	21	en_formation	\N	\N	parcoureo	\N	web	\N	2026-03-28T16:57:45.108Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
c9120feb-d40f-4030-a9a5-095f5e02d608	Karim	karim277@email.com	0	\N	17	decrocheur	\N	\N	parcoureo	\N	web	\N	2026-03-15T01:37:33.814Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
f60e2beb-acd7-4e87-8f56-b13fc1a4ac22	Sofiane	sofiane516@email.com	0	\N	23	alternance	\N	\N	qrcode	\N	web	\N	2026-03-14T01:18:56.150Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
39be7f82-99f3-491e-842d-417fa7df4700	Enzo	enzo972@email.com	0	\N	25	etudiant	\N	\N	parcoureo	\N	web	\N	2026-03-24T03:20:22.306Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
654cc014-09ce-427d-a696-1d19d6d0adff	Victor	victor923@email.com	0	\N	18	decrocheur	\N	\N	direct	\N	pwa	\N	2026-03-20T23:40:28.615Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
b6f5c8b4-eb4b-4689-a5f2-d8fdd2d5149d	Clara	\N	0	0667291339	22	lyceen	\N	\N	prescripteur	\N	web	\N	2026-03-30T02:34:46.850Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
43ebe8bb-f6a6-4c7c-85a2-d28024521201	Mehdi	mehdi595@email.com	0	\N	20	service_civique	\N	\N	parcoureo	\N	web	\N	2026-03-14T00:46:42.274Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
03a8a89e-37cb-4428-9425-013c69ddd2c6	Chloé	\N	0	0631830526	25	en_formation	\N	\N	qrcode	\N	web	\N	2026-03-20T07:42:05.621Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
c122a8c9-5581-4f93-88a7-b5a45b0e710d	Victor	victor561@email.com	0	\N	15	lyceen	\N	\N	qrcode	\N	pwa	\N	2026-03-26T09:18:28.972Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
eff36237-540d-4a35-a070-f7b2b911bc95	Jules	jules41@email.com	0	\N	16	lyceen	\N	\N	parcoureo	\N	web	\N	2026-04-01T12:50:01.819Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
76270bf6-f037-4ea5-8079-146a184cafc0	Léo	leo354@email.com	0	\N	22	decrocheur	\N	\N	qrcode	\N	web	\N	2026-04-01T01:43:00.735Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
cdaca7ab-094c-442b-8d2b-9f3dee56c635	Arthur	arthur213@email.com	0	\N	20	en_formation	\N	\N	prescripteur	\N	pwa	\N	2026-03-22T18:32:09.821Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
c1bd6a0c-0f61-4894-a866-5ac89cd05f82	Mathis	mathis498@email.com	0	\N	15	lyceen	\N	\N	prescripteur	\N	pwa	\N	2026-03-24T07:36:48.949Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
92598bcd-69c4-4b3b-bde0-f1c05569d886	Léo	leo706@email.com	0	\N	22	decrocheur	\N	\N	parcoureo	\N	web	\N	2026-03-17T23:43:29.812Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
c81f9f95-e102-4558-bcb5-cc45ce7d018c	Maëlys	maelys597@email.com	0	\N	21	en_formation	\N	\N	prescripteur	\N	web	\N	2026-03-27T17:29:33.116Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
05d49191-ef46-4e50-aa03-fde945c96896	Yanis	yanis161@email.com	0	\N	23	etudiant	\N	\N	prescripteur	\N	web	\N	2026-03-27T08:04:01.268Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
b4158d6b-da5a-4f8b-8be4-5488ebf13b32	Camille	camille854@email.com	0	\N	23	alternance	\N	\N	direct	\N	web	\N	2026-03-15T20:21:55.715Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
6c9e4172-b593-4ae3-9c12-7aeb73fb3361	Nour	nour857@email.com	0	\N	15	lyceen	\N	\N	prescripteur	\N	web	\N	2026-04-01T15:11:04.143Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
da216f27-4c36-403d-9041-9295c4577b6b	Manon	\N	0	0668763779	15	en_formation	\N	\N	qrcode	\N	web	\N	2026-03-26T16:27:01.778Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
478a7def-c724-4d1e-838c-24d4a7e8aa3b	Léa	lea368@email.com	0	\N	22	lyceen	\N	\N	direct	\N	web	\N	2026-03-17T09:46:32.081Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
381f924c-fe52-4a9f-8568-11369e14c544	Paul	\N	0	0624425006	23	service_civique	\N	\N	direct	\N	web	\N	2026-03-29T10:11:11.003Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
25c7b2b0-4759-4100-953d-c732e7d51cfc	Amina	amina259@email.com	0	\N	18	decrocheur	\N	\N	direct	\N	pwa	\N	2026-03-18T01:56:47.385Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
0a58652a-8b68-4074-a9a0-ed0f609205e8	Lucas	lucas581@email.com	0	\N	22	en_formation	\N	\N	prescripteur	\N	web	\N	2026-03-17T18:12:54.154Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
2e1216a4-098c-46ef-9bdb-54d64d2d128c	Amina	\N	0	0676461049	16	service_civique	\N	\N	direct	\N	web	\N	2026-03-24T10:25:36.146Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
7aec43d7-b9f4-4626-8f31-33acab3c3945	Chloé	chloe425@email.com	0	\N	25	en_formation	\N	\N	direct	\N	web	\N	2026-03-24T07:25:15.226Z	2026-04-02T23:12:33.540Z	\N	\N	\N	\N	\N
79c862a2-01c4-4d3c-aaf2-a238f29e53de	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	web	\N	2026-04-02T23:37:09.012Z	2026-04-02T23:37:09.012Z	\N	\N	\N	\N	\N
aa5f68fc-0b6b-4042-8585-1a09c8d2dbcd	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	web	\N	2026-04-03T08:31:16.722Z	2026-04-03T08:31:16.722Z	\N	\N	\N	\N	\N
e036af1d-83c0-46e3-9d60-77313f52b261	Lola ÉBONNE	\N	0	0614111800	16	94	\N	\N	94	\N	web	\N	2026-04-03T09:16:49.199Z	2026-04-03T09:46:45.146Z	\N	\N	\N	2026-04-03T09:46:45.146Z	\N
7bbd877e-e467-41e5-8980-5e8561e43fa0	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	web	\N	2026-04-03T09:56:20.651Z	2026-04-03T09:56:20.651Z	\N	\N	\N	\N	\N
0e157091-e6a9-44ab-b604-ea4e264c368d	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	web	\N	2026-04-03T10:58:05.286Z	2026-04-03T10:58:05.286Z	\N	\N	\N	\N	\N
63bab27c-ed1a-4706-b14d-f208c0737351	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	web	\N	2026-04-03T11:15:08.408Z	2026-04-03T11:15:08.408Z	\N	\N	\N	\N	\N
0499d3a9-307d-45a7-9f8f-4eb871174341	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	web	\N	2026-04-03T12:11:44.905Z	2026-04-03T12:11:44.905Z	\N	\N	\N	\N	\N
917ad1d9-37af-4223-aa84-4c1ee508f564	Alain	\N	0	0686564883	22	45	\N	\N	45	\N	web	\N	2026-04-03T05:32:51.461Z	2026-04-03T14:48:14.069Z	\N	\N	\N	2026-04-03T14:48:14.069Z	\N
\.


--
-- Name: alerte_decrochage alerte_decrochage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerte_decrochage
    ADD CONSTRAINT alerte_decrochage_pkey PRIMARY KEY (id);


--
-- Name: bris_de_glace bris_de_glace_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bris_de_glace
    ADD CONSTRAINT bris_de_glace_pkey PRIMARY KEY (id);


--
-- Name: calendar_connection calendar_connection_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_connection
    ADD CONSTRAINT calendar_connection_pkey PRIMARY KEY (id);


--
-- Name: campagne_assignation campagne_assignation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campagne_assignation
    ADD CONSTRAINT campagne_assignation_pkey PRIMARY KEY (id);


--
-- Name: campagne campagne_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campagne
    ADD CONSTRAINT campagne_pkey PRIMARY KEY (id);


--
-- Name: categorie_activite categorie_activite_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorie_activite
    ADD CONSTRAINT categorie_activite_code_unique UNIQUE (code);


--
-- Name: categorie_activite categorie_activite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorie_activite
    ADD CONSTRAINT categorie_activite_pkey PRIMARY KEY (id);


--
-- Name: code_verification code_verification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.code_verification
    ADD CONSTRAINT code_verification_pkey PRIMARY KEY (id);


--
-- Name: code_verification code_verification_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.code_verification
    ADD CONSTRAINT code_verification_token_unique UNIQUE (token);


--
-- Name: conseiller conseiller_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conseiller
    ADD CONSTRAINT conseiller_email_unique UNIQUE (email);


--
-- Name: conseiller conseiller_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conseiller
    ADD CONSTRAINT conseiller_pkey PRIMARY KEY (id);


--
-- Name: conversation conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT conversation_pkey PRIMARY KEY (id);


--
-- Name: declaration_activite declaration_activite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.declaration_activite
    ADD CONSTRAINT declaration_activite_pkey PRIMARY KEY (id);


--
-- Name: demande_consentement demande_consentement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demande_consentement
    ADD CONSTRAINT demande_consentement_pkey PRIMARY KEY (id);


--
-- Name: enquete_satisfaction enquete_satisfaction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enquete_satisfaction
    ADD CONSTRAINT enquete_satisfaction_pkey PRIMARY KEY (id);


--
-- Name: evenement_audit evenement_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evenement_audit
    ADD CONSTRAINT evenement_audit_pkey PRIMARY KEY (id);


--
-- Name: evenement_journal evenement_journal_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evenement_journal
    ADD CONSTRAINT evenement_journal_pkey PRIMARY KEY (id);


--
-- Name: evenement_quiz evenement_quiz_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evenement_quiz
    ADD CONSTRAINT evenement_quiz_pkey PRIMARY KEY (id);


--
-- Name: indice_confiance indice_confiance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.indice_confiance
    ADD CONSTRAINT indice_confiance_pkey PRIMARY KEY (id);


--
-- Name: indice_confiance indice_confiance_utilisateur_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.indice_confiance
    ADD CONSTRAINT indice_confiance_utilisateur_id_unique UNIQUE (utilisateur_id);


--
-- Name: instantane_profil instantane_profil_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instantane_profil
    ADD CONSTRAINT instantane_profil_pkey PRIMARY KEY (id);


--
-- Name: message_direct message_direct_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_direct
    ADD CONSTRAINT message_direct_pkey PRIMARY KEY (id);


--
-- Name: message message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_pkey PRIMARY KEY (id);


--
-- Name: objectif_hebdomadaire objectif_hebdomadaire_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.objectif_hebdomadaire
    ADD CONSTRAINT objectif_hebdomadaire_pkey PRIMARY KEY (id);


--
-- Name: participant_conversation participant_conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_conversation
    ADD CONSTRAINT participant_conversation_pkey PRIMARY KEY (id);


--
-- Name: prise_en_charge prise_en_charge_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prise_en_charge
    ADD CONSTRAINT prise_en_charge_pkey PRIMARY KEY (id);


--
-- Name: profil_riasec profil_riasec_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profil_riasec
    ADD CONSTRAINT profil_riasec_pkey PRIMARY KEY (id);


--
-- Name: profil_riasec profil_riasec_utilisateur_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profil_riasec
    ADD CONSTRAINT profil_riasec_utilisateur_id_unique UNIQUE (utilisateur_id);


--
-- Name: push_subscription push_subscription_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscription
    ADD CONSTRAINT push_subscription_pkey PRIMARY KEY (id);


--
-- Name: rappel rappel_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rappel
    ADD CONSTRAINT rappel_pkey PRIMARY KEY (id);


--
-- Name: referral referral_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral
    ADD CONSTRAINT referral_pkey PRIMARY KEY (id);


--
-- Name: rendez_vous rendez_vous_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rendez_vous
    ADD CONSTRAINT rendez_vous_pkey PRIMARY KEY (id);


--
-- Name: session_conseiller session_conseiller_jeton_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_conseiller
    ADD CONSTRAINT session_conseiller_jeton_unique UNIQUE (jeton);


--
-- Name: session_conseiller session_conseiller_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_conseiller
    ADD CONSTRAINT session_conseiller_pkey PRIMARY KEY (id);


--
-- Name: session_magic_link session_magic_link_jeton_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_magic_link
    ADD CONSTRAINT session_magic_link_jeton_unique UNIQUE (jeton);


--
-- Name: session_magic_link session_magic_link_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_magic_link
    ADD CONSTRAINT session_magic_link_pkey PRIMARY KEY (id);


--
-- Name: source_captation source_captation_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.source_captation
    ADD CONSTRAINT source_captation_code_unique UNIQUE (code);


--
-- Name: source_captation source_captation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.source_captation
    ADD CONSTRAINT source_captation_pkey PRIMARY KEY (id);


--
-- Name: structure structure_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.structure
    ADD CONSTRAINT structure_pkey PRIMARY KEY (id);


--
-- Name: structure structure_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.structure
    ADD CONSTRAINT structure_slug_unique UNIQUE (slug);


--
-- Name: tiers_intervenant tiers_intervenant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tiers_intervenant
    ADD CONSTRAINT tiers_intervenant_pkey PRIMARY KEY (id);


--
-- Name: utilisateur utilisateur_code_parrainage_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_code_parrainage_unique UNIQUE (code_parrainage);


--
-- Name: utilisateur utilisateur_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_email_unique UNIQUE (email);


--
-- Name: utilisateur utilisateur_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_pkey PRIMARY KEY (id);


--
-- Name: utilisateur utilisateur_session_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_session_token_unique UNIQUE (session_token);


--
-- Name: alerte_decrochage alerte_decrochage_conseiller_id_conseiller_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerte_decrochage
    ADD CONSTRAINT alerte_decrochage_conseiller_id_conseiller_id_fk FOREIGN KEY (conseiller_id) REFERENCES public.conseiller(id);


--
-- Name: alerte_decrochage alerte_decrochage_prise_en_charge_id_prise_en_charge_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerte_decrochage
    ADD CONSTRAINT alerte_decrochage_prise_en_charge_id_prise_en_charge_id_fk FOREIGN KEY (prise_en_charge_id) REFERENCES public.prise_en_charge(id);


--
-- Name: bris_de_glace bris_de_glace_conseiller_id_conseiller_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bris_de_glace
    ADD CONSTRAINT bris_de_glace_conseiller_id_conseiller_id_fk FOREIGN KEY (conseiller_id) REFERENCES public.conseiller(id);


--
-- Name: bris_de_glace bris_de_glace_prise_en_charge_id_prise_en_charge_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bris_de_glace
    ADD CONSTRAINT bris_de_glace_prise_en_charge_id_prise_en_charge_id_fk FOREIGN KEY (prise_en_charge_id) REFERENCES public.prise_en_charge(id);


--
-- Name: bris_de_glace bris_de_glace_tiers_id_tiers_intervenant_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bris_de_glace
    ADD CONSTRAINT bris_de_glace_tiers_id_tiers_intervenant_id_fk FOREIGN KEY (tiers_id) REFERENCES public.tiers_intervenant(id);


--
-- Name: campagne_assignation campagne_assignation_campagne_id_campagne_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campagne_assignation
    ADD CONSTRAINT campagne_assignation_campagne_id_campagne_id_fk FOREIGN KEY (campagne_id) REFERENCES public.campagne(id);


--
-- Name: campagne_assignation campagne_assignation_conseiller_id_conseiller_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campagne_assignation
    ADD CONSTRAINT campagne_assignation_conseiller_id_conseiller_id_fk FOREIGN KEY (conseiller_id) REFERENCES public.conseiller(id);


--
-- Name: campagne campagne_structure_id_structure_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campagne
    ADD CONSTRAINT campagne_structure_id_structure_id_fk FOREIGN KEY (structure_id) REFERENCES public.structure(id);


--
-- Name: code_verification code_verification_referral_id_referral_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.code_verification
    ADD CONSTRAINT code_verification_referral_id_referral_id_fk FOREIGN KEY (referral_id) REFERENCES public.referral(id);


--
-- Name: conseiller conseiller_structure_id_structure_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conseiller
    ADD CONSTRAINT conseiller_structure_id_structure_id_fk FOREIGN KEY (structure_id) REFERENCES public.structure(id);


--
-- Name: conversation conversation_utilisateur_id_utilisateur_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT conversation_utilisateur_id_utilisateur_id_fk FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateur(id);


--
-- Name: declaration_activite declaration_activite_prise_en_charge_id_prise_en_charge_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.declaration_activite
    ADD CONSTRAINT declaration_activite_prise_en_charge_id_prise_en_charge_id_fk FOREIGN KEY (prise_en_charge_id) REFERENCES public.prise_en_charge(id);


--
-- Name: declaration_activite declaration_activite_utilisateur_id_utilisateur_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.declaration_activite
    ADD CONSTRAINT declaration_activite_utilisateur_id_utilisateur_id_fk FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateur(id);


--
-- Name: demande_consentement demande_consentement_prise_en_charge_id_prise_en_charge_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demande_consentement
    ADD CONSTRAINT demande_consentement_prise_en_charge_id_prise_en_charge_id_fk FOREIGN KEY (prise_en_charge_id) REFERENCES public.prise_en_charge(id);


--
-- Name: demande_consentement demande_consentement_tiers_id_tiers_intervenant_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demande_consentement
    ADD CONSTRAINT demande_consentement_tiers_id_tiers_intervenant_id_fk FOREIGN KEY (tiers_id) REFERENCES public.tiers_intervenant(id);


--
-- Name: enquete_satisfaction enquete_satisfaction_prise_en_charge_id_prise_en_charge_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enquete_satisfaction
    ADD CONSTRAINT enquete_satisfaction_prise_en_charge_id_prise_en_charge_id_fk FOREIGN KEY (prise_en_charge_id) REFERENCES public.prise_en_charge(id);


--
-- Name: evenement_journal evenement_journal_prise_en_charge_id_prise_en_charge_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evenement_journal
    ADD CONSTRAINT evenement_journal_prise_en_charge_id_prise_en_charge_id_fk FOREIGN KEY (prise_en_charge_id) REFERENCES public.prise_en_charge(id);


--
-- Name: evenement_quiz evenement_quiz_utilisateur_id_utilisateur_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evenement_quiz
    ADD CONSTRAINT evenement_quiz_utilisateur_id_utilisateur_id_fk FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateur(id);


--
-- Name: indice_confiance indice_confiance_utilisateur_id_utilisateur_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.indice_confiance
    ADD CONSTRAINT indice_confiance_utilisateur_id_utilisateur_id_fk FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateur(id);


--
-- Name: instantane_profil instantane_profil_conversation_id_conversation_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instantane_profil
    ADD CONSTRAINT instantane_profil_conversation_id_conversation_id_fk FOREIGN KEY (conversation_id) REFERENCES public.conversation(id);


--
-- Name: instantane_profil instantane_profil_utilisateur_id_utilisateur_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instantane_profil
    ADD CONSTRAINT instantane_profil_utilisateur_id_utilisateur_id_fk FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateur(id);


--
-- Name: message message_conversation_id_conversation_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_conversation_id_conversation_id_fk FOREIGN KEY (conversation_id) REFERENCES public.conversation(id);


--
-- Name: message_direct message_direct_prise_en_charge_id_prise_en_charge_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_direct
    ADD CONSTRAINT message_direct_prise_en_charge_id_prise_en_charge_id_fk FOREIGN KEY (prise_en_charge_id) REFERENCES public.prise_en_charge(id);


--
-- Name: objectif_hebdomadaire objectif_hebdomadaire_prise_en_charge_id_prise_en_charge_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.objectif_hebdomadaire
    ADD CONSTRAINT objectif_hebdomadaire_prise_en_charge_id_prise_en_charge_id_fk FOREIGN KEY (prise_en_charge_id) REFERENCES public.prise_en_charge(id);


--
-- Name: participant_conversation participant_conversation_prise_en_charge_id_prise_en_charge_id_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_conversation
    ADD CONSTRAINT participant_conversation_prise_en_charge_id_prise_en_charge_id_ FOREIGN KEY (prise_en_charge_id) REFERENCES public.prise_en_charge(id);


--
-- Name: prise_en_charge prise_en_charge_conseiller_id_conseiller_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prise_en_charge
    ADD CONSTRAINT prise_en_charge_conseiller_id_conseiller_id_fk FOREIGN KEY (conseiller_id) REFERENCES public.conseiller(id);


--
-- Name: prise_en_charge prise_en_charge_referral_id_referral_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prise_en_charge
    ADD CONSTRAINT prise_en_charge_referral_id_referral_id_fk FOREIGN KEY (referral_id) REFERENCES public.referral(id);


--
-- Name: prise_en_charge prise_en_charge_structure_id_structure_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prise_en_charge
    ADD CONSTRAINT prise_en_charge_structure_id_structure_id_fk FOREIGN KEY (structure_id) REFERENCES public.structure(id);


--
-- Name: profil_riasec profil_riasec_utilisateur_id_utilisateur_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profil_riasec
    ADD CONSTRAINT profil_riasec_utilisateur_id_utilisateur_id_fk FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateur(id);


--
-- Name: rappel rappel_prise_en_charge_id_prise_en_charge_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rappel
    ADD CONSTRAINT rappel_prise_en_charge_id_prise_en_charge_id_fk FOREIGN KEY (prise_en_charge_id) REFERENCES public.prise_en_charge(id);


--
-- Name: referral referral_conversation_id_conversation_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral
    ADD CONSTRAINT referral_conversation_id_conversation_id_fk FOREIGN KEY (conversation_id) REFERENCES public.conversation(id);


--
-- Name: referral referral_utilisateur_id_utilisateur_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral
    ADD CONSTRAINT referral_utilisateur_id_utilisateur_id_fk FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateur(id);


--
-- Name: rendez_vous rendez_vous_prise_en_charge_id_prise_en_charge_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rendez_vous
    ADD CONSTRAINT rendez_vous_prise_en_charge_id_prise_en_charge_id_fk FOREIGN KEY (prise_en_charge_id) REFERENCES public.prise_en_charge(id);


--
-- Name: session_conseiller session_conseiller_conseiller_id_conseiller_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_conseiller
    ADD CONSTRAINT session_conseiller_conseiller_id_conseiller_id_fk FOREIGN KEY (conseiller_id) REFERENCES public.conseiller(id);


--
-- Name: session_magic_link session_magic_link_utilisateur_id_utilisateur_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_magic_link
    ADD CONSTRAINT session_magic_link_utilisateur_id_utilisateur_id_fk FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateur(id);


--
-- Name: tiers_intervenant tiers_intervenant_invite_par_id_conseiller_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tiers_intervenant
    ADD CONSTRAINT tiers_intervenant_invite_par_id_conseiller_id_fk FOREIGN KEY (invite_par_id) REFERENCES public.conseiller(id);


--
-- Name: tiers_intervenant tiers_intervenant_prise_en_charge_id_prise_en_charge_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tiers_intervenant
    ADD CONSTRAINT tiers_intervenant_prise_en_charge_id_prise_en_charge_id_fk FOREIGN KEY (prise_en_charge_id) REFERENCES public.prise_en_charge(id);


--
-- PostgreSQL database dump complete
--

\unrestrict OJizJbQc3QiaBPdTFHIBXiVZJ4i85jGBW42XMURsbZ0MDEMn4VLGR6Kq2HFRm6b

