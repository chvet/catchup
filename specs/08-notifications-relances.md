# 08 — Notifications & Relances

## Principe directeur
**Relancer sans harceler.** Le jeune reçoit des messages utiles, espacés, bienveillants. Chaque notification doit donner envie de revenir — jamais culpabiliser de ne pas être revenu. Si le jeune ne revient pas après 2 relances, on arrête. Le silence est un choix qu'on respecte.

**Ton :** toujours celui de Catch'Up (grand frère/grande sœur), jamais corporate, jamais robot.

---

## Canaux de notification

### Récapitulatif

| Canal | Disponibilité | Portée | Coût | Priorité MVP |
|-------|--------------|--------|------|-------------|
| Notification push (app) | App native installée | Très forte (95% de lecture) | Gratuit | Non (pas d'app native en MVP) |
| Notification push (PWA) | PWA installée sur Android | Moyenne (70% de lecture) | Gratuit | Oui |
| Email | Email collecté (phase 2) | Faible (20-30% d'ouverture) | Quasi gratuit (Resend, Brevo...) | Oui |
| SMS | Téléphone collecté | Très forte (98% de lecture) | ~0.05€/SMS | Non (v2, coût) |
| Message in-app | Quand le jeune revient sur le site | 100% (par définition) | Gratuit | Oui |

### Priorité MVP
1. **Message in-app** (zéro coût, zéro friction)
2. **Email** (si email collecté)
3. **Push PWA** (si PWA installée, Android uniquement)

---

## Les 7 types de relance

### 1. Relance post-première visite (J+1)

**Déclencheur :** Le jeune a eu 4+ messages dans sa première conversation, puis est parti sans revenir depuis 24h.

**Objectif :** Le faire revenir pour approfondir son profil.

**Canal :** Email (si dispo) ou message in-app (au retour).

**Email :**
> **Objet :** Hey {prénom}, j'ai réfléchi à un truc pour toi 💡
>
> Salut {prénom} !
>
> On a commencé à discuter hier et j'ai trouvé ça super intéressant. J'ai quelques idées en plus pour toi.
>
> Reviens quand tu veux, je suis là 😊
>
> **[Reprendre la discussion →]**
>
> _Catch'Up — Ton compagnon d'orientation_
> _Tu ne veux plus recevoir ces emails ? [Me désinscrire]_

**Message in-app (quand le jeune revient) :**
> "Re {prénom} ! Content de te revoir 😊 La dernière fois on avait commencé à parler de {sujet}. On continue ?"

**Règle :** 1 seule relance J+1. Si le jeune ne revient pas → pas de relance J+2.

---

### 2. Relance profil incomplet (J+3)

**Déclencheur :** Le jeune a un profil RIASEC avec un indice de confiance < 50% et n'est pas revenu depuis 3 jours.

**Objectif :** L'encourager à compléter son profil.

**Canal :** Email (si dispo).

**Email :**
> **Objet :** Ton profil est à moitié fait, {prénom} — on le finit ? 🎯
>
> Tu as commencé à découvrir ton profil orientation, et c'est déjà intéressant :
>
> 🎨 Artiste — 65/100
> 🤝 Social — 45/100
>
> Mais je peux être beaucoup plus précis si on continue à discuter. 5 minutes de plus et je pourrai te proposer des pistes métiers vraiment adaptées.
>
> **[Continuer →]**

**Règle :** 1 seule relance profil incomplet. Pas d'insistance.

---

### 3. Relance post-mise en relation (J+1 après acceptation)

**Déclencheur :** Le jeune a accepté une mise en relation conseiller (spec 02) il y a 24h.

**Objectif :** Confirmer que le conseiller l'a recontacté, sinon proposer de relancer.

**Canal :** Email ou message in-app.

**Message in-app :**
> "Hey {prénom} ! Le conseiller t'a recontacté ? 😊
> Si pas encore, je peux relancer pour toi. Ou si tu préfères, on continue à discuter ensemble 💬"
>
> [Oui, il m'a contacté ✅]
> [Relance pour moi 🔄]
> [On continue ensemble 💬]

**Si "Relance" :** Nouveau webhook envoyé avec le drapeau `relance = true` (spec 02).

**Si pas de nouvelles après 72h :**
> "Salut {prénom} ! Ton conseiller est prêt à te parler. Et moi je suis toujours là si tu veux discuter 😊"

**Règle :** 1 relance à J+1, 1 dernière à J+3. Pas plus.

---

### 4. Rappel de sauvegarde (in-app uniquement)

**Déclencheur :** Le profil a un indice de confiance > 50% ET le jeune n'a pas encore donné son email ET la proposition n'a pas été faite 2 fois déjà.

**Objectif :** Collecter l'email pour la persistance et les relances futures.

**Canal :** Dans la conversation (message de Catch'Up).

**Message de Catch'Up :**
> "Au fait, tu veux que je retienne tout ça pour la prochaine fois ? Il me faut juste ton email 😊"

**Règles :**
- Maximum 2 propositions par session
- Si refusé 2 fois → ne plus proposer pendant cette session
- Repropotion possible à la session suivante (1 seule fois)

---

### 5. Relance d'inactivité longue (J+14)

**Déclencheur :** Le jeune n'est pas revenu depuis 14 jours, a un email, et avait un profil avec indice > 30%.

**Objectif :** Rappeler que Catch'Up existe, sans pression.

**Canal :** Email uniquement.

**Email :**
> **Objet :** Ça fait un moment, {prénom} — tout va bien ? 😊
>
> On a discuté il y a quelques semaines et tu avais un profil plutôt {Artiste-Social}.
>
> Si tu as avancé dans ta réflexion, reviens me raconter ! Et si tu bloques, je suis toujours là pour t'aider.
>
> **[Reprendre →]**
>
> _Pas envie de recevoir ces messages ? [Me désinscrire] — sans rancune 😊_

**Règle :** 1 seule relance d'inactivité longue. Si pas de retour → silence définitif.

---

### 6. Contenu récurrent (hebdomadaire)

**Déclencheur :** Le jeune a un email ET a coché "recevoir les actus" (opt-in explicite, pas par défaut).

**Objectif :** Maintenir le lien avec du contenu utile.

**Canal :** Email.

**Contenu possible :**
- **Métier de la semaine** : "Cette semaine, découvre le métier de game designer 🎮"
- **Témoignage** : "Lucas, 19 ans, a trouvé sa voie grâce à Catch'Up"
- **Astuce orientation** : "3 questions à te poser avant de choisir ta formation"

**Fréquence :** 1 email/semaine maximum.

**Règle :** Opt-in explicite obligatoire. Lien de désinscription dans chaque email. Si le jeune se désinscrit, suppression immédiate de la liste.

---

### 7. Notification push PWA

**Déclencheur :** Le jeune a installé la PWA et a accepté les notifications.

**Objectif :** Rappeler l'existence de Catch'Up sur l'écran d'accueil.

**Types de push :**

| Type | Texte | Fréquence max |
|------|-------|---------------|
| Retour | "{prénom}, ça fait 3 jours qu'on s'est pas parlé. Envie de continuer ? 😊" | 1 fois / semaine |
| Métier du jour | "Métier du jour : développeur de jeux vidéo 🎮 Ça te parle ?" | 1 fois / semaine |
| Comparaison amis | "{ami} a fait le quiz ! Compare vos profils 👀" | À l'événement |
| Conseiller | "Ton conseiller t'a répondu ! Ouvre Catch'Up 📩" | À l'événement |

**Règles :**
- Maximum **2 notifications push par semaine** (toutes catégories confondues)
- Jamais entre 21h et 8h
- Le jeune peut désactiver par catégorie dans les paramètres
- Si le jeune ignore 3 push consécutives → réduire à 1/semaine
- Si le jeune ignore 5 push consécutives → arrêter complètement (pas de réactivation automatique)

---

## Règles absolues (tous canaux)

### Ce qu'on fait TOUJOURS
- Lien de désinscription dans chaque email
- Ton Catch'Up (tutoiement, emojis dosés, bienveillant)
- Le prénom du jeune dans l'objet et le corps
- Un seul CTA (bouton d'action) par message — pas de surcharge
- Horodater chaque envoi pour ne pas re-envoyer
- Respecter les préférences de notification du jeune

### Ce qu'on ne fait JAMAIS
- Envoyer plus de 2 relances sur le même sujet
- Envoyer une notification entre 21h et 8h
- Envoyer un email sans lien de désinscription
- Utiliser un ton culpabilisant ("tu n'es pas revenu", "tu as abandonné")
- Mentionner des données sensibles dans l'objet de l'email (pas de score RIASEC dans l'objet)
- Partager l'email avec des tiers (jamais de newsletter tierce, jamais de pub)
- Envoyer des notifications si le jeune s'est désinscrit
- Relancer un jeune qui a demandé la suppression de ses données

---

## Calendrier de relance type

Scénario : un jeune fait le quiz, discute 10 messages, donne son email, puis disparaît.

```
J+0  — Quiz + Chat (10 messages, profil A-S, indice 45%)
       └── Pas de relance (le jeune vient de partir)

J+1  — Relance post-première visite
       └── Email : "Hey Lucas, j'ai réfléchi à un truc pour toi 💡"

J+3  — Relance profil incomplet
       └── Email : "Ton profil est à moitié fait — on le finit ? 🎯"

J+7  — (rien, on respecte le silence)

J+14 — Relance d'inactivité longue
       └── Email : "Ça fait un moment — tout va bien ? 😊"

J+21 — (rien)

J+30 — Silence définitif. Plus aucune relance automatique.
        Le jeune ne sera recontacté que s'il revient de lui-même.
```

**Total : 3 emails en 30 jours.** Pas plus.

---

## Modèle de données (complément spec 07)

### Table `notification`

```sql
CREATE TABLE notification (
  id                TEXT PRIMARY KEY,          -- UUID v4
  utilisateur_id    TEXT NOT NULL,             -- FK → utilisateur.id
  type              TEXT NOT NULL,             -- 'relance_j1', 'profil_incomplet', 'post_referral',
                                               -- 'sauvegarde', 'inactivite', 'contenu', 'push'
  canal             TEXT NOT NULL,             -- 'email', 'push_pwa', 'push_app', 'in_app'
  statut            TEXT DEFAULT 'planifiee',  -- 'planifiee', 'envoyee', 'ouverte', 'cliquee', 'echouee'
  objet             TEXT,                      -- objet de l'email (NULL pour push/in-app)
  contenu           TEXT NOT NULL,             -- corps du message
  planifiee_le      TEXT NOT NULL,             -- date/heure d'envoi prévue (ISO 8601)
  envoyee_le        TEXT,                      -- date/heure d'envoi effective
  ouverte_le        TEXT,                      -- date/heure d'ouverture (tracking pixel email)
  cliquee_le        TEXT,                      -- date/heure du clic sur le CTA
  erreur            TEXT,                      -- message d'erreur si envoi échoué

  FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id)
);
```

### Table `preferences_notification`

```sql
CREATE TABLE preferences_notification (
  utilisateur_id    TEXT PRIMARY KEY,          -- FK → utilisateur.id
  email_relances    INTEGER DEFAULT 1,         -- 0 = désinscrit des relances
  email_contenu     INTEGER DEFAULT 0,         -- 0 = pas d'actus (opt-in explicite)
  push_relances     INTEGER DEFAULT 1,         -- 0 = pas de push relances
  push_contenu      INTEGER DEFAULT 1,         -- 0 = pas de push contenu
  push_consecutives_ignorees INTEGER DEFAULT 0, -- compteur de push ignorées
  desinscrip_le     TEXT,                      -- date de désinscription email (si applicable)
  mis_a_jour_le     TEXT NOT NULL,

  FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id)
);
```

---

## Implémentation technique

### Envoi d'emails

**Service recommandé (MVP) :** Resend (gratuit jusqu'à 3 000 emails/mois, API simple, bon rendu).

**Alternative :** Brevo (ex-Sendinblue), Mailgun, ou SMTP direct.

```typescript
// src/services/email.ts

interface EmailParams {
  destinataire: string        // adresse email
  objet: string
  contenu_html: string
  contenu_texte: string       // version texte brut (accessibilité)
}

async function envoyerEmail(params: EmailParams): Promise<boolean> {
  // POST vers l'API Resend (ou autre)
  // Retourne true si envoyé, false si erreur
  // Log l'événement dans la table notification
}
```

**Variables d'environnement :**
```
EMAIL_SERVICE=resend
EMAIL_API_KEY=re_xxx
EMAIL_FROM=catchup@jaeprive.fr
EMAIL_REPLY_TO=contact@fondation-jae.org
```

### Planification des relances

**MVP :** Tâche cron côté serveur (toutes les heures) qui :
1. Cherche les utilisateurs éligibles à une relance
2. Vérifie qu'ils n'ont pas déjà reçu cette relance
3. Vérifie les préférences de notification
4. Vérifie l'heure (pas entre 21h et 8h)
5. Envoie et log

```typescript
// src/services/planificateur-relances.ts

async function verifierRelances(): Promise<void> {
  const maintenant = new Date()
  const heure = maintenant.getHours()

  // Pas d'envoi entre 21h et 8h
  if (heure >= 21 || heure < 8) return

  await verifierRelancesJ1(maintenant)
  await verifierRelancesProfilIncomplet(maintenant)
  await verifierRelancesPostReferral(maintenant)
  await verifierRelancesInactivite(maintenant)
}
```

**Futur :** File d'attente dédiée (BullMQ, Inngest, ou Trigger.dev) pour plus de fiabilité et de granularité.

### Notifications push (PWA)

**Prérequis :**
- Service Worker enregistré (cf. spec PWA)
- L'utilisateur a accepté `Notification.requestPermission()`
- Endpoint push stocké côté serveur

**API :** Web Push (standard W3C, gratuit, sans dépendance à Google/Apple).

```typescript
// src/services/push.ts

import webpush from 'web-push'

// Configuré une fois au démarrage
webpush.setVapidDetails(
  'mailto:contact@fondation-jae.org',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

async function envoyerPush(
  souscription: PushSubscription,
  titre: string,
  corps: string,
  url: string
): Promise<boolean> {
  // Envoie la notification push
  // Le service worker la reçoit et l'affiche
}
```

**Variables d'environnement :**
```
VAPID_PUBLIC_KEY=BNx...
VAPID_PRIVATE_KEY=xxx...
```

---

## Templates d'emails

### Structure commune

Tous les emails suivent le même gabarit :

```html
<!-- Fond gris clair, carte blanche centrée, mobile-first -->
<div style="max-width: 480px; margin: 0 auto; font-family: -apple-system, sans-serif;">

  <!-- En-tête : logo Catch'Up + dégradé violet -->
  <div style="background: linear-gradient(135deg, #7C3AED, #EC4899); padding: 24px; text-align: center;">
    <span style="color: white; font-size: 24px; font-weight: bold;">Catch'Up</span>
  </div>

  <!-- Corps -->
  <div style="padding: 24px; background: white;">
    <p>Salut {prénom} !</p>
    <p>{contenu personnalisé}</p>

    <!-- Bouton CTA unique -->
    <a href="{lien}" style="display: block; background: #7C3AED; color: white; text-align: center;
       padding: 14px; border-radius: 12px; text-decoration: none; font-weight: bold; margin: 24px 0;">
      {texte du bouton} →
    </a>
  </div>

  <!-- Pied de page -->
  <div style="padding: 16px; text-align: center; color: #999; font-size: 12px;">
    <p>Catch'Up — Ton compagnon d'orientation</p>
    <p>Un projet de la Fondation JAE</p>
    <p><a href="{lien_desinscription}" style="color: #999;">Me désinscrire</a></p>
  </div>

</div>
```

### Règles des templates
- **Mobile-first** : max-width 480px, gros boutons (44px minimum), texte lisible (16px)
- **Un seul CTA** par email (pas de choix multiples, pas de distraction)
- **Texte court** : 3-5 phrases max dans le corps
- **Version texte brut** toujours fournie (accessibilité, filtres anti-spam)
- **Lien de désinscription** toujours visible en pied de page
- **Pas de pièce jointe** (filtres anti-spam)
- **Pas d'image lourde** dans le corps (juste le dégradé en-tête en CSS)

---

## Métriques

| Métrique | Description | Objectif |
|----------|-------------|----------|
| Taux d'ouverture emails | % d'emails ouverts (tracking pixel) | > 25% |
| Taux de clic emails | % de clics sur le CTA | > 8% |
| Taux de retour post-relance | % de jeunes qui reviennent après une relance | > 15% |
| Taux de désinscription | % qui se désinscrivent après un email | < 5% |
| Notifications push acceptées | % de jeunes PWA qui acceptent les push | > 40% |
| Push ignorées consécutives | Moyenne de push ignorées avant arrêt | < 4 |
| Délai moyen de retour | Temps entre relance et retour effectif | < 48h |
| Coût par retour | Coût d'envoi / nombre de retours effectifs | < 0.10€ |

---

## Anti-spam et délivrabilité

### Bonnes pratiques
- **Domaine vérifié** : SPF + DKIM + DMARC configurés sur jaeprive.fr
- **Adresse d'expédition cohérente** : toujours `catchup@jaeprive.fr`
- **Volume progressif** : commencer par 50 emails/jour, monter graduellement (warm-up)
- **Lien de désinscription** en un clic (List-Unsubscribe header + lien visible)
- **Pas de mots spam** dans l'objet : éviter "gratuit", "offre", "cliquez ici"
- **Ratio texte/HTML** équilibré : pas d'email 100% image
- **Taux de rebond** surveillé : supprimer les emails invalides après 2 rebonds

### Conformité
- **RGPD** : consentement éclairé pour les emails de contenu (opt-in). Les relances transactionnelles (post-conversation) sont considérées comme un intérêt légitime.
- **ePrivacy** : pas de tracking de localisation, pas de cookie tiers dans les emails
- **Mineurs** : pas d'email marketing aux < 15 ans sans consentement parental (les relances transactionnelles restent autorisées si l'email a été fourni volontairement)
