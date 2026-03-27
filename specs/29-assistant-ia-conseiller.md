# Spec 29 — Assistant IA pour les conseillers

**Statut** : En cours
**Priorite** : P1
**Sprint** : S7

---

## Objectif

Fournir aux conseillers un assistant IA prive, accessible depuis le chat direct avec un beneficiaire.
L'assistant aide a formuler des messages, suggerer des formations, detecter des signaux de fragilite
et adopter des approches pedagogiques adaptees au profil du beneficiaire.

## Interface utilisateur

### Panneau lateral (AiAssistantPanel)

- **Position** : slide-in depuis la droite
  - Desktop : 350px de large, en flex a cote du chat
  - Mobile : pleine largeur avec overlay sombre
- **Header** :
  - Titre : "Assistant IA" avec icone robot
  - Sous-titre : "Aide pour accompagner {prenom}"
  - Bouton fermer (X)
  - Bouton effacer (poubelle) — vide toute la conversation IA
- **Zone de messages** : scrollable, style chat
  - Messages utilisateur (conseiller) : bulles indigo alignees a droite
  - Messages assistant : bulles grises alignees a gauche
  - Chaque reponse IA a un bouton "Copier" qui copie le texte et affiche "Copie !" pendant 2s
- **Raccourcis rapides** (chips au-dessus de l'input) :
  - "Comment aborder ce profil ?"
  - "Quelles formations suggerer ?"
  - "Redige un message d'encouragement"
  - "Signaux de fragilite ?"
- **Zone de saisie** : input texte + bouton envoyer

### Integration dans DirectChat

- Bouton "IA" dans l'en-tete du chat direct (a cote du bouton "Rompre")
- Toggle le panneau lateral
- Quand le panneau est ouvert sur desktop, le chat prend l'espace restant (flex layout)

## API

### POST /api/conseiller/ai-assistant

**Authentification** : JWT conseiller (via `getConseillerFromHeaders()`)

**Body** :
```json
{
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "context": {
    "prenom": "Lucas",
    "age": 19,
    "resumeConversation": "..."
  }
}
```

**Reponse** : Stream (AI SDK data stream format)

**Modele** : gpt-4o, temperature 0.7, maxTokens 500

**System prompt** : contexte du beneficiaire (prenom, age, resume de conversation IA) + consignes
de role (pedagogie, formations, messages bienveillants, signaux de fragilite, reponses en francais).

## Stockage

- Les messages de l'assistant IA sont stockes **uniquement en state React** (pas de persistence en base).
- La fermeture du panneau conserve les messages (dans le state du composant parent).
- Le bouton "Effacer" vide tous les messages.
- Un rechargement de page reinitialise la conversation IA.

## Fichiers

| Fichier | Role |
|---------|------|
| `src/components/conseiller/AiAssistantPanel.tsx` | Composant panneau lateral |
| `src/app/api/conseiller/ai-assistant/route.ts` | Route API streaming |
| `src/components/conseiller/DirectChat.tsx` | Integration du panneau dans le chat |

## Securite

- Seuls les conseillers authentifies peuvent appeler l'endpoint
- Le contexte du beneficiaire est transmis dans le system prompt (non visible par le beneficiaire)
- Pas de donnees sensibles stockees — tout est ephemere
