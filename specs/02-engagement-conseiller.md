# 02 — Engagement du jeune & mise en relation conseiller

## Principe directeur
**Le jeune reste maître de la décision.** Catch'Up détecte, propose, mais ne force jamais. La mise en relation avec un conseiller humain est présentée comme une opportunité, pas comme un aveu d'échec de l'IA.

**Objectif caché :** Catch'Up est un tremplin. L'objectif final de chaque conversation est que le jeune accepte de parler à un vrai conseiller humain. Mais cet objectif ne doit JAMAIS être perçu par le jeune. La proposition doit émerger naturellement, comme une évidence.

---

## Stratégie progressive en 4 temps

La mise en relation n'est pas un événement ponctuel mais une **progression subtile** au fil de la conversation.

### Temps 1 — Semer (messages 3-8)
**Objectif :** Normaliser l'existence du conseiller sans rien proposer.

Catch'Up plante des graines dans ses réponses :
- "Y'a des gens dont c'est le métier d'aider les jeunes comme toi à trouver leur voie — et ils sont gratuits en plus 😊"
- "Pour les démarches concrètes, un conseiller orientation ça change la vie"
- "Ce que tu me décris, un conseiller de Mission Locale pourrait te trouver un stage en 2 semaines"

**Ne PAS proposer de mise en relation.** Juste planter l'idée.

### Temps 2 — Valoriser (messages 8-14)
**Objectif :** Le conseiller = un BONUS, pas un remplacement.

Catch'Up fait des références plus directes :
- "Avec un profil comme le tien, un conseiller pourrait te trouver des opportunités locales que moi je ne connais pas 📍"
- "Moi je suis fort pour discuter, mais pour monter un dossier ou trouver un stage, un humain c'est mieux 😄"

Le jeune doit sentir que le conseiller est le **niveau suivant**.

### Temps 3 — Proposer (messages 14-20 ou profil stabilisé)
**Objectif :** Proposition concrète, dans un contexte naturel.

**Déclencheurs :**
- Le jeune pose une question à laquelle l'IA ne peut pas répondre (dates, inscriptions, aides)
- Le jeune tourne en rond (3+ messages sur le même sujet)
- Le profil RIASEC est stable et des pistes ont été évoquées
- Le jeune dit "et maintenant je fais quoi ?"

**Formulation :**
> "Tu sais quoi {prénom} ? Je pense qu'un conseiller pourrait vraiment t'aider à concrétiser tout ça. Quelqu'un qui connaît les formations près de chez toi, qui peut t'aider avec les inscriptions, les stages...
> Et le top : je peux lui envoyer notre conversation pour que t'aies pas à tout réexpliquer 😊
> Tu veux que je te mette en relation ?"

**Si refus :** "Aucun souci !" → Ne pas reproposer avant 3 échanges. Max 2 propositions par session.

### Temps 4 — Concrétiser (si acceptation)
Collecte du moyen de contact dans la conversation (pas un formulaire) puis confirmation.

### Principes de formulation

| À faire | À ne PAS faire |
|---|---|
| "Le conseiller va t'apporter un PLUS" | "Tu as besoin d'aide" |
| "Moi + un conseiller = combo gagnant" | "Moi je ne peux pas t'aider" |
| "C'est gratuit et sans engagement" | "Il faut que tu parles à quelqu'un" |
| Valoriser le jeune dans la proposition | Culpabiliser un refus |

---

## Les 3 niveaux de détection

### Niveau 1 — Passage de relais naturel
**Situation :** L'IA a fait son travail (profil RIASEC identifié, pistes évoquées) mais le jeune a besoin de concret : formation spécifique, dossier administratif, stage, problème local, question financière.

**Signaux de détection :**
- Le jeune pose des questions auxquelles l'IA ne peut pas répondre avec certitude (ex: "c'est quoi les dates d'inscription ?", "y'a des aides financières ?", "comment faire un dossier Parcoursup ?")
- Le jeune tourne en rond (3+ messages sur le même sujet sans avancer)
- Le profil RIASEC est stabilisé (scores n'évoluent plus depuis 3 messages) et des pistes concrètes ont été proposées
- Le jeune demande explicitement de parler à quelqu'un

**Réponse de Catch'Up (dans la conversation, ton naturel) :**
> "Pour aller plus loin sur [sujet concret], un conseiller orientation pourrait vraiment t'aider. Il connaît les formations et les bons plans près de chez toi 📍
>
> Je peux lui envoyer ton profil pour que tu n'aies pas à tout répéter. Il te recontactera vite.
> Tu veux ?"

**Priorité :** Normale
**Délai de recontact attendu :** 48h

---

### Niveau 2 — Accompagnement renforcé (fragilité)
**Situation :** Le jeune exprime du mal-être, du découragement, de l'isolement, une rupture de parcours. Pas en danger immédiat, mais a besoin d'un humain bienveillant.

**Signaux de détection :**
- Mots-clés de fragilité (cf. `core/fragility-detector.ts`) :
  - Découragement : "rien ne marche", "je suis nul", "j'abandonne", "à quoi bon"
  - Isolement : "tout seul", "personne me comprend", "rejeté"
  - Rupture : "viré", "décrochage", "plus d'école", "sans diplôme"
- Score de fragilité `medium` (cf. `getFragilityLevel()`)
- Le jeune exprime des émotions négatives de façon répétée (2+ messages)
- Changement de ton brutal (passait de l'enthousiasme au désengagement)

**Réponse de Catch'Up (d'abord valider, puis proposer) :**
> "Ce que tu traverses, c'est pas facile, et c'est courageux d'en parler 💪
>
> Un conseiller pourrait t'écouter et t'aider concrètement — pas juste parler orientation, mais aussi t'accompagner sur ce que tu vis en ce moment.
>
> Je peux lui transmettre notre conversation pour que tu n'aies pas à tout réexpliquer. Ça te dit ?"

**Priorité :** Haute
**Délai de recontact attendu :** 24h

---

### Niveau 3 — Urgence (détresse)
**Situation :** Le jeune exprime des idées suicidaires, de l'automutilation, ou un danger immédiat.

**Signaux de détection :**
- Mots-clés critiques : "mourir", "suicide", "me tuer", "en finir", "plus envie de vivre", "disparaître"
- Score de fragilité `high`

**Réponse de Catch'Up (immédiate, pas d'option) :**
> "Ce que tu ressens compte énormément, et tu n'es pas seul(e) ❤️
>
> Appelle le **3114** maintenant — c'est gratuit, 24h/24, et ce sont des gens formés pour écouter exactement ce que tu traverses.
>
> 📞 **3114** — Numéro national de prévention du suicide
>
> Tu peux aussi :
> - Envoyer un SMS au **114** si tu ne peux pas parler
> - Aller aux urgences les plus proches
> - Appeler le **15** (SAMU) ou le **112** (urgences européennes)
>
> Je suis toujours là si tu veux continuer à parler après."

**Après une réponse d'urgence :**
- NE PAS revenir à l'orientation comme si de rien n'était
- Rester en mode écoute bienveillante
- Si le jeune veut parler orientation, le laisser guider
- Ne JAMAIS minimiser ("c'est pas si grave", "ça va aller")

**Actions automatiques (en arrière-plan) :**
- Notification urgente envoyée aux conseillers rattachés (via webhook)
- Flag `urgence` sur le profil du jeune
- Log de l'événement (pour le suivi qualité)

**Catch'Up NE propose PAS de RDV conseiller dans ce cas** — il oriente vers le 3114 immédiatement. Le conseiller est notifié en parallèle mais le 3114 prime.

**RÈGLE ABSOLUE :** En cas de détresse, la priorité N'EST PAS l'orientation. L'humain d'abord, TOUJOURS.

**Priorité :** Critique
**Délai :** Notification immédiate

---

## Flux de mise en relation (niveaux 1 et 2)

```
Catch'Up propose la mise en relation
  │
  ├── Le jeune refuse → "OK pas de souci ! Je suis toujours là 😊"
  │   Catch'Up ne repropose pas avant 3 échanges minimum
  │   Max 2 propositions par session
  │
  └── Le jeune accepte
      │
      ▼
  Collecte du moyen de contact
  (dans la conversation, pas un formulaire)
  "Super ! Comment le conseiller peut te joindre ?
   Ton numéro ou ton email, comme tu préfères 📱"
      │
      ▼
  Catch'Up prépare le DOSSIER DE TRANSMISSION
      │
      ▼
  Envoi vers le système externe (webhook)
      │
      ▼
  Confirmation au jeune :
  "C'est envoyé ! Un conseiller te recontactera
   dans les [24h/48h]. En attendant, on peut continuer
   à discuter si tu veux 💬"
```

---

## Dossier de transmission

Quand le jeune accepte la mise en relation, Catch'Up génère un dossier structuré envoyé au système externe (Parcoureo ou app conseiller).

### Contenu du dossier

```json
{
  "id": "uuid-de-la-demande",
  "timestamp": "2026-03-20T10:30:00Z",
  "priority": "normal | high | critical",

  "jeune": {
    "prenom": "Lucas",
    "contact": "lucas.durand@email.com",
    "contact_type": "email | phone",
    "anonymous_id": "uuid-anonyme"
  },

  "profil_riasec": {
    "R": 15, "I": 25, "A": 70, "S": 55, "E": 10, "C": 5,
    "top_dimensions": ["Artiste", "Social"],
    "traits": ["créatif", "empathique", "rêveur"],
    "interests": ["musique", "dessin", "aider les autres"],
    "strengths": ["imagination", "écoute"],
    "suggestion": "métiers de la création ou du social"
  },

  "contexte": {
    "nb_messages": 12,
    "duree_conversation": "18 min",
    "fragilite_detectee": true,
    "niveau_fragilite": "medium",
    "motif_orientation": "Le jeune exprime du découragement face à son parcours scolaire. Profil RIASEC clair mais besoin d'accompagnement humain pour concrétiser.",
    "resume_conversation": "Lucas, 19 ans, en décrochage scolaire depuis 6 mois. Passionné par le dessin et la musique. Profil Artiste-Social fort. A évoqué du découragement et de l'isolement. Pistes évoquées : design graphique, animation, éducateur spécialisé. Souhaite un accompagnement pour explorer ces pistes concrètement."
  },

  "source": {
    "app": "catchup-web",
    "version": "0.1.0",
    "conversation_id": "uuid-conversation"
  }
}
```

### Résumé de conversation
Le résumé est **généré par l'IA** (appel GPT-4o séparé) à partir de la conversation complète. Prompt dédié :
> "Résume cette conversation d'orientation en 3-5 phrases à destination d'un conseiller professionnel. Inclus : prénom, âge si mentionné, situation actuelle, centres d'intérêt, profil RIASEC dominant, pistes évoquées, points d'attention (fragilité, blocages). Sois factuel et concis."

---

## Transmission vers l'extérieur

### MVP — Webhook HTTP
Catch'Up envoie le dossier en POST vers une URL configurable.

```
POST {WEBHOOK_URL}/api/referrals
Content-Type: application/json
Authorization: Bearer {WEBHOOK_TOKEN}

{ ...dossier JSON... }
```

**Variables d'environnement :**
- `REFERRAL_WEBHOOK_URL` — URL du endpoint (Parcoureo, app conseiller, ou n8n/Make pour router)
- `REFERRAL_WEBHOOK_TOKEN` — Token d'authentification

### Futur — Intégration Parcoureo
Le webhook pointera vers l'API Parcoureo qui créera automatiquement un dossier dans le système du conseiller rattaché à la structure locale du jeune (Mission Locale, CIO, E2C, CIDJ...).

### Futur — App conseiller
Le conseiller recevra une notification push dans l'app conseiller (second projet) avec le dossier complet et pourra :
- Voir le profil RIASEC
- Lire le résumé
- Contacter le jeune directement

---

## Règles de relance

### Si le conseiller ne recontacte pas dans le délai

```
Délai dépassé (24h ou 48h selon la priorité)
  │
  ▼
Catch'Up envoie un message proactif au jeune :
"Hey [prénom] ! Le conseiller n'a pas encore pu te joindre.
 Tu veux que je relance ? Ou tu préfères qu'on continue ensemble ? 💬"
  │
  ├── "Relance" → nouveau webhook avec flag "relance"
  └── "On continue" → retour au chat IA normal
```

### Si le jeune ne revient pas après la mise en relation

```
72h sans activité après acceptation de la mise en relation
  │
  ▼
Notification push (si app) ou email (si email connu) :
"Salut [prénom] ! Ton conseiller est prêt à te parler.
 Et moi je suis toujours là si tu veux discuter 😊"
  │
  (1 seule relance, pas de harcèlement)
```

---

## Structures d'accueil ciblées

Les conseillers appartiennent aux structures suivantes (non exhaustif) :
- **Mission Locale** — jeunes 16-25 ans, insertion professionnelle
- **CIDJ** (Centre d'Information et de Documentation Jeunesse) — information orientation
- **E2C** (École de la 2ème Chance) — jeunes décrocheurs sans diplôme
- **CIO** (Centre d'Information et d'Orientation) — orientation scolaire
- **Structures privées** — cabinets d'orientation, associations

Le routage vers la bonne structure (selon la localisation et le profil du jeune) sera géré par Parcoureo ou l'app conseiller, pas par Catch'Up directement.

---

## Métriques à suivre

| Métrique | Description | Objectif |
|----------|-------------|----------|
| Taux de proposition | % de conversations où Catch'Up propose un conseiller | Indicateur d'activité |
| Taux d'acceptation | % de jeunes qui acceptent la mise en relation | > 40% |
| Taux de recontact | % de jeunes effectivement recontactés dans le délai | > 80% |
| Délai moyen de recontact | Temps entre la demande et le premier contact conseiller | < 48h (N1), < 24h (N2) |
| Taux de détection urgence | % de conversations flaggées niveau 3 | Monitoring sécurité |
| Taux d'abandon post-proposition | % de jeunes qui quittent après qu'on a proposé un conseiller | < 15% (sinon la proposition est trop intrusive) |
