# 20 — Mise en relation bénéficiaire ↔ conseiller

> Version : 1.0.0
> Date : 2026-03-23

---

## Contexte

Le bénéficiaire interagit avec l'IA Catch'Up via le chat. À tout moment, il peut demander à être mis en relation avec un conseiller humain.

Deux déclencheurs :
1. **Automatique** : l'IA détecte une fragilité et propose la mise en relation
2. **Manuel** : le bénéficiaire clique sur le bouton permanent "Parler à un conseiller"

---

## Bouton permanent de mise en relation

### Position
- Affiché **en bas du chat**, entre la zone de messages et la barre de saisie
- Visible **dès le premier message** échangé avec l'IA
- Masqué si une demande est déjà en cours (`referralId` existe)

### Apparence
- Bouton pleine largeur, bordure violette légère, fond blanc
- Icône 🤝 + texte "Parler à un conseiller"
- Style discret pour ne pas interrompre la conversation avec l'IA
- Au tap : ouvre la `ReferralModal` en mode `gentle` (ton rassurant)

### Comportement
1. Le bénéficiaire remplit : prénom, moyen de contact, département, âge
2. La demande est envoyée via `POST /api/referrals`
3. Le bouton disparaît, remplacé par le tag de statut

---

## Tag de statut de la demande

### Position
- **Tag flottant fixe** en haut du chat (centré, sous la barre de navigation)
- **Tag inline** dans la bannière de statut en bas du chat

### États visuels

| Statut | Icône | Couleur | Label | Animation |
|--------|-------|---------|-------|-----------|
| `en_attente` | ⏳ | Ambre | "En attente" | Pulse (clignotement doux) |
| `nouvelle` | 📨 | Bleu | "Envoyée" | Pulse |
| `prise_en_charge` | ✅ | Vert | "Pris en charge" | Aucune |
| `terminee` | ✔️ | Gris | "Terminé" | Aucune |
| `abandonnee` | ❌ | Rouge | "Annulé" | Aucune |

### Polling
- Le statut est vérifié toutes les **30 secondes** via `GET /api/referrals/[id]/status`
- Quand le statut passe à `prise_en_charge` : la bannière verte d'accompagnement s'affiche avec le prénom du conseiller et un lien vers `/accompagnement`

---

## Flux complet

```
Bénéficiaire                         Serveur                         Conseiller
     |                                   |                                |
     |-- [Bouton "Parler à un conseiller"]                               |
     |     ou [IA détecte fragilité]      |                                |
     |                                   |                                |
     |-- POST /api/referrals ----------->|                                |
     |                                   |-- Crée referral en DB          |
     |                                   |-- Calcule matching structures  |
     |                                   |-- Génère résumé IA             |
     |                                   |                                |
     |<-- { referralId, priorite } ------|                                |
     |                                   |                                |
     |-- [Tag "⏳ En attente" s'affiche] |                                |
     |                                   |                                |
     |-- GET /referrals/[id]/status ---->|   (polling 30s)                |
     |                                   |                                |
     |                                   |<-- [Conseiller voit la file active]
     |                                   |<-- [Clique "Prendre en charge"]|
     |                                   |                                |
     |<-- { statut: prise_en_charge } ---|                                |
     |                                   |                                |
     |-- [Tag "✅ Pris en charge"]       |                                |
     |-- [Bannière verte + lien /accompagnement]                         |
```

---

## Annulation de la demande

Le bénéficiaire peut annuler sa demande **tant qu'elle n'est pas encore prise en charge** par un conseiller.

### Déclencheur
- Bouton ✕ dans la carte profil (à côté du tag de statut)
- Lien "Annuler" dans la bannière bleue de statut

### Modale de confirmation
- Titre : "Annuler ta demande ?"
- Message : "Tu pourras toujours refaire une demande plus tard si tu changes d'avis."
- Boutons : "Non, garder" / "Oui, annuler"

### Comportement
1. `POST /api/referrals/[id]/cancel` → passe le statut à `annulee`
2. L'API refuse si le statut est déjà `prise_en_charge` (erreur 409)
3. Côté client : réinitialise tout l'état referral (referralId, status, infos, structures)
4. Le bouton "Parler à un conseiller" réapparaît
5. Le bénéficiaire peut refaire une demande à tout moment

### Règle métier
- Annulable uniquement si statut = `en_attente` ou `nouvelle`
- Si déjà `prise_en_charge`, `terminee` ou `abandonnee` → bouton masqué

---

## Personnalisation de l'IA avec le prénom

Dès que le bénéficiaire renseigne son prénom dans le formulaire de mise en relation :
- Le prénom est **injecté dans `profile.name`** côté client (localStorage)
- Le **system prompt** de l'IA intègre automatiquement le prénom : `Prénom : {name}`
- L'IA utilise le prénom dans ses réponses, rendant l'échange plus personnel
- Les infos sont persistées dans `localStorage('catchup_beneficiaire_info')`

---

## Carte profil bénéficiaire

Après la soumission du formulaire, une **carte profil** apparaît dans le chat :
- Avatar (initiale du prénom) + prénom + âge + département
- Tag de statut de la demande (en attente, pris en charge, etc.)
- Visible tant que le referral est actif

---

## Structures suggérées

### Affichage côté bénéficiaire

Après la demande de mise en relation, le bénéficiaire voit les **3 structures les plus appropriées** :
- Nom de la structure
- Score de matching (% de compatibilité)
- Raisons du matching (badges : département couvert, tranche d'âge, spécialité, etc.)
- Message rassurant : "Un conseiller de la structure la plus adaptée te contactera bientôt"
- Panneau masquable par le bénéficiaire

### Critères de matching (algorithme)

Les structures sont classées par score de compatibilité pondéré :

| Critère | Poids | Détail |
|---------|-------|--------|
| Géolocalisation | 40% | Même département ou même région |
| Tranche d'âge | 25% | L'âge du bénéficiaire est dans la fourchette de la structure |
| Spécialité | 20% | La situation du bénéficiaire correspond aux spécialités |
| Capacité | 10% | La structure a de la disponibilité |
| Genre | 5% | Préférence de genre de la structure (si applicable) |

### API

`POST /api/referrals` retourne désormais :
```json
{
  "referralId": "uuid",
  "priorite": "normale|haute|critique",
  "structureSuggeree": { "nom": "...", "score": 85 },
  "structuresSuggerees": [
    { "nom": "ML Paris 15", "score": 94, "raisons": ["département couvert", "tranche d'âge", "spécialité decrocheur"] },
    { "nom": "CIO Marseille", "score": 72, "raisons": ["tranche d'âge", "bonne disponibilité"] },
    { "nom": "E2C Lille", "score": 58, "raisons": ["spécialité decrocheur"] }
  ]
}
```

---

## Composants

| Composant | Fichier | Rôle |
|-----------|---------|------|
| `ReferralStatusTag` | `src/components/ReferralStatusTag.tsx` | Tag visuel du statut |
| `ReferralModal` | `src/components/ReferralModal.tsx` | Formulaire de demande |
| `ChatApp` | `src/components/ChatApp.tsx` | Intégration bouton + tag + carte profil + structures + polling |
