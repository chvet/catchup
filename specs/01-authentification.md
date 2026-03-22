# 01 — Identification / Authentification

## Principe directeur
**Zéro friction au premier contact.** Le jeune arrive, il parle. Pas de formulaire, pas de mot de passe, pas de mur d'inscription. L'authentification est progressive : on ne la demande que quand elle a de la valeur pour le jeune.

---

## Parcours utilisateur

### Phase 1 — Anonyme (premier contact)

```
Jeune arrive sur catchup.jaeprive.fr
  │
  ▼
ID anonyme généré automatiquement
(UUID stocké en localStorage + cookie httpOnly)
  │
  ▼
Le jeune parle directement avec Catch'Up
Ses messages, son profil RIASEC, ses préférences
sont rattachés à cet ID anonyme
```

**Règles :**
- Aucun écran d'inscription, aucun formulaire
- Un identifiant unique (UUID v4) est généré côté client au premier chargement
- Cet ID est stocké en `localStorage` (persistance navigateur) ET envoyé en cookie `httpOnly` (persistance côté serveur)
- Toutes les données (conversations, profil RIASEC, settings) sont rattachées à cet ID
- Le jeune peut utiliser Catch'Up indéfiniment en mode anonyme

**Limites acceptées :**
- S'il vide son cache ou change de navigateur → il perd ses données
- Pas de synchronisation entre devices
- Pas d'accès depuis un autre appareil

---

### Phase 2 — Sauvegarde progressive (quand le profil a de la valeur)

```
Après 4-6 échanges, le profil RIASEC se dessine
  │
  ▼
Catch'Up propose naturellement dans la conversation :
"Tu veux que je retienne tout ça pour la prochaine fois ?
Il me faut juste ton email 😊"
  │
  ├── Le jeune dit oui → afficher un champ email inline
  │   │
  │   ▼
  │   Magic link envoyé (pas de mot de passe)
  │   Le jeune clique → session authentifiée
  │   L'ID anonyme est rattaché à l'email
  │
  └── Le jeune dit non / ignore → on continue en anonyme
      Catch'Up repropose plus tard (pas plus de 2 fois)
```

**Règles :**
- La proposition de sauvegarde est déclenchée par l'IA dans le flux de conversation (pas un popup, pas une bannière)
- Déclencheur : le profil RIASEC a au moins 2 dimensions > 30 ET le jeune a donné son prénom
- Maximum 2 propositions par session (pas de harcèlement)
- Si refusé 2 fois → ne plus proposer pendant cette session
- L'authentification se fait par **magic link** (email uniquement, zéro mot de passe)

**Pourquoi magic link :**
- Pas de mot de passe à retenir (public jeune, souvent en difficulté)
- Un seul champ (email) → friction minimale
- Sécurisé (lien unique, expiré après 15 minutes, usage unique)
- Le jeune a forcément un email (requis pour s'inscrire à Parcoursup, Pôle Emploi, etc.)

---

### Phase 3 — Retour authentifié

```
Le jeune revient sur catchup.jaeprive.fr
  │
  ├── Cookie/localStorage encore valide → session restaurée automatiquement
  │   (le jeune retrouve sa conversation et son profil)
  │
  ├── Cookie expiré mais email enregistré →
  │   Écran léger : "Re ! Ton email pour reprendre ?"
  │   Magic link → clic → session restaurée
  │
  └── Rien (nouveau navigateur, pas d'email) →
      Retour en Phase 1 (nouvel ID anonyme)
      Si le jeune donne son email plus tard, on peut
      tenter de fusionner avec l'ancien profil
```

**Règles :**
- La session anonyme (cookie/localStorage) dure **90 jours**
- Le magic link de reconnexion expire après **15 minutes**
- Si un email est associé, proposer la reconnexion par email (écran minimal, un seul champ)
- Fusion de profils : si un jeune crée un nouvel ID anonyme puis s'authentifie avec un email déjà connu → fusionner les données (garder les scores RIASEC les plus récents)

---

## Différences Web vs App native

| Aspect | Web (PWA) | App native |
|--------|-----------|------------|
| Premier accès | ID anonyme auto | ID anonyme auto |
| Persistance | localStorage + cookie (fragile) | Keychain/Keystore (solide) |
| Reconnexion | Magic link si cookie perdu | Biométrie (empreinte/Face ID) |
| Session | 90 jours (cookie) | Illimitée (token en keychain) |
| Multi-device | Via email (magic link) | Via email (magic link) |
| Irritant | Quasi nul (phase 1 = 0 friction) | Zéro |

---

## Cas particuliers

### Jeune mineur (< 18 ans)
- Pas de collecte d'email obligatoire (RGPD + protection des mineurs)
- Le mode anonyme doit être pleinement fonctionnel sans limite
- Si email fourni : pas de vérification d'âge (on n'est pas un réseau social), mais mention dans les CGU que les données peuvent être supprimées sur demande du représentant légal

### Jeune sans email
- Catch'Up fonctionne intégralement en anonyme
- Alternative future : connexion par SMS (magic link par SMS au lieu d'email)
- Alternative future : QR code de session (généré sur un device, scanné sur un autre)

### Conseiller/accompagnant qui suit le jeune
- Cas d'usage futur : le conseiller accède au profil RIASEC du jeune
- Nécessite le consentement explicite du jeune ("Tu veux partager ton profil avec ton conseiller ?")
- Flux : le jeune génère un code de partage temporaire → le conseiller le saisit → accès en lecture seule au profil
- Pas dans le MVP

---

## Données stockées par phase

### Phase 1 (anonyme)
- `anonymous_id` : UUID v4
- Conversations et messages
- Profil RIASEC (scores, traits, intérêts, forces, suggestions)
- Préférences (TTS, RGAA, langue)

### Phase 2 (email associé)
- Tout ce qui précède +
- `email` : adresse email du jeune
- `email_verified` : booléen (true après clic magic link)
- `authenticated_at` : date de première authentification

### Phase 3 (retour)
- Token de session (JWT ou cookie signé)
- `last_seen_at` : date de dernière visite

---

## Sécurité

- Les magic links sont **à usage unique** et expirent après **15 minutes**
- Les tokens de session expirent après **90 jours** (web) / **1 an** (app native)
- Les données anonymes non rattachées à un email sont purgées après **6 mois** d'inactivité
- Pas de mot de passe = pas de risque de fuite de mots de passe
- HTTPS obligatoire (Let's Encrypt déjà en place)
- Cookie `httpOnly + secure + sameSite=strict`
- Rate limiting sur l'envoi de magic links (max 3 par email par heure)
