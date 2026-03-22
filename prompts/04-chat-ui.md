# 04 — Interface Chat (WhatsApp-like, mobile-first)

> Contexte : voir `00-architecture.md`. Prérequis : `01`, `02`, `03` exécutés.
> C'est le prompt le plus dense — il crée toute l'interface utilisateur.

## Objectif
Créer une interface chat style WhatsApp, mobile-first, avec bulles de messages, champ de saisie riche (emoji, fichier, vocal), suggestions cliquables, et indicateur de frappe.

## Design system

### Palette
- Primaire : `#6C63FF` (violet Catch'Up)
- Accent : `#FF6584` (rose), `#00D2FF` (cyan)
- Fond chat : `#efeae2` avec motif SVG subtil (style WhatsApp)
- Bulles user : `bg-catchup-primary text-white`, coins arrondis sauf bas-droite
- Bulles IA : `bg-white text-gray-800`, coins arrondis sauf bas-gauche

### Responsive
- Mobile : pleine largeur, bulles max 82%
- Desktop : bulles max 65%, centré

### Animations
- `msg-appear` : fade-in + translateY(8px) en 0.25s
- `chip-hover` : translateY(-2px) + shadow au hover
- `slide-in-right` : pour le panel profil
- `typing-dot` : 3 dots animés en décalé
- `pulse-ring` : pulsation rouge pendant l'enregistrement vocal

## Composants à créer

### src/components/ChatApp.tsx (orchestrateur principal)
- State : `sessionId` (uuid), `profile` (UserProfile), `showProfile`, `rgaaMode`, `ttsEnabled`, `speakingMsgId`
- Hook `useChat()` avec api `/api/chat`, body `{ profile, messageCount }`
- `onFinish` : extraire le profil (`extractProfileFromMessage`), TTS auto si activé, refocus input
- Auto-scroll vers le bas à chaque nouveau message
- Auto-focus textarea au mount et après chaque réponse IA
- Layout : header + zone messages + suggestions + input
- Si `showProfile` → afficher `ProfilePanel` en overlay à droite

### src/components/ChatHeader.tsx
- Gradient `from-catchup-primary to-indigo-600`
- Avatar 🚀 dans un cercle `bg-white/20`
- Titre "Catch'Up" en bold + sous-titre "Ton guide orientation"
- Si profil avec name → afficher "{name} · Ton guide orientation"
- 3 boutons : TTS (toggle), RGAA (toggle), Profil (ouvre le panel)
- Pastille verte sur le bouton profil si le profil a des scores > 0

### src/components/MessageBubble.tsx
- Props : `message (Message), isSpeaking, onSpeak, rgaaMode`
- User : bulle violette à droite + avatar rose 👤
- IA : bulle blanche à gauche + avatar gradient 🚀
- Horodatage en bas de la bulle (text-[10px])
- User : double check ✓✓ (SVG) à côté de l'heure
- Bouton écouter (🔊) sur les messages IA : invisible par défaut, visible au hover du message, toujours visible si en cours de lecture
- Mode RGAA : bordure 2px noire, texte plus grand

### src/components/ChatInput.tsx
- Barre en bas, fond blanc, bordure-top grise
- Disposition : [emoji] [fichier] [textarea] [micro] [envoyer]
- **Textarea** :
  - Placeholder "Écris ton message..."
  - Auto-resize (max 120px)
  - Auto-focus au mount (attribut `autoFocus`)
  - Enter = envoyer, Shift+Enter = retour à la ligne
  - Rounded-2xl, border grise, focus ring violet
  - **Le curseur doit TOUJOURS être dans ce champ par défaut**
- **Bouton envoi** : cercle violet avec icône flèche, disabled si vide ou loading
- Le textarea reçoit un `ref` passé depuis ChatApp pour le focus programmatique

### src/components/SuggestionChips.tsx
- Props : `onSelect (callback), messageCount, compact?`
- Affiche les suggestions de `getSuggestions(messageCount)` depuis le core
- Chaque chip est un **bouton** qui appelle `onSelect(texte)` directement
- Le `onSelect` dans ChatApp utilise `append()` pour envoyer le message → PAS juste remplir l'input
- Style : pilules blanches, bordure violet/20, texte violet, emoji + texte
- Mode compact (après les messages) : plus petites, alignées à gauche
- Mode initial (écran vide) : plus grandes, centrées
- Animation hover : translateY(-2px) + ombre violette

### src/components/TypingIndicator.tsx
- 3 dots gris (w-2 h-2) avec animation décalée
- Même layout qu'un message IA (avatar 🚀 à gauche)
- Affiché quand `isLoading === true`

### src/components/EmojiPicker.tsx
- Wrapper autour de `emoji-picker-react` (import dynamique avec `next/dynamic`, ssr: false)
- Bouton smiley 😊 qui ouvre/ferme le picker
- Picker positionné au-dessus du bouton (absolute, bottom-12)
- Click outside → ferme
- Au clic sur un emoji → l'insère à la position du curseur dans le textarea

### src/components/VoiceRecorder.tsx
- Utilise `WebSTTAdapter` de `@/platform/web/web-stt`
- Bouton micro : gris par défaut, rouge pulsant quand actif
- Animation `pulse-ring` autour du bouton pendant l'enregistrement
- Auto-stop après 30 secondes
- Quand résultat → appelle `onAppend({ role: 'user', content: texte })` directement (envoie le message)
- Si STT non disponible dans le navigateur → ne pas afficher le bouton

### src/components/FileAttachment.tsx
- Bouton trombone 📎
- Input file caché (accept: `image/*,.pdf,.doc,.docx`)
- Si image → preview miniature (20x20) pendant 3s au-dessus du bouton
- Envoie un message `"📎 [Image: nom.jpg]"` ou `"📎 [Fichier: doc.pdf]"`
- Reset l'input après chaque upload

## État vide (pas encore de messages)
Écran centré avec :
- Grand avatar 🚀 dans un cercle gradient + shadow-xl
- "Hey ! Moi c'est Catch'Up 👋" en h2 bold
- "Je suis là pour t'aider à trouver ta voie. Dis-moi ce qui te passionne !" en petit gris
- Suggestions initiales (mode non-compact, centrées)

## Styles CSS (globals.css)
- `.chat-bg` : fond WhatsApp avec motif SVG
- `.msg-appear` : animation apparition message
- `.chip-hover` : animation hover chips
- `.chat-scroll` : scrollbar fine (4px)
- `.pulse-ring` : animation pulsation enregistrement
- `.slide-in-right` : animation panel profil
- `@keyframes typing-dot` : animation dots
- `.rgaa-mode` : font-size 118%, line-height 1.6, bordures forcées
- `:focus-visible` : outline 3px violet
- `.safe-area-top/bottom` : padding safe area mobile

## Page principale (src/app/page.tsx)
```tsx
'use client'
import ChatApp from '@/components/ChatApp'
export default function Home() {
  return <ChatApp />
}
```

## Vérification
- [ ] Le chat s'affiche correctement sur mobile (375px) et desktop
- [ ] Le curseur est dans le textarea au chargement
- [ ] Les suggestions envoient directement le message au clic
- [ ] L'IA répond en streaming (token par token)
- [ ] L'emoji picker s'ouvre et insère l'emoji dans le textarea
- [ ] Le bouton micro enregistre et envoie le texte dicté
- [ ] Le bouton fichier ouvre le sélecteur et envoie le message
- [ ] L'indicateur de frappe s'affiche pendant le streaming
- [ ] Les messages s'auto-scroll vers le bas
- [ ] Enter envoie, Shift+Enter fait un retour à la ligne
