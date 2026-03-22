# 06 — Vocal (TTS, STT) et Accessibilité (RGAA)

> Contexte : voir `00-architecture.md`. Prérequis : `01` à `05` exécutés.

## Objectif
Implémenter la lecture vocale (TTS) avec voix masculine française, la dictée vocale (STT), et le mode accessibilité RGAA.

## 1. Text-to-Speech (TTS)

### Architecture (adapter pattern)

**src/platform/interfaces/tts.interface.ts** :
```typescript
interface ITTSAdapter {
  init(): Promise<void>
  speak(text: string, onEnd?: () => void): void
  stop(): void
  isSpeaking(): boolean
  getAvailableVoices(): string[]
}
```

**src/platform/web/web-tts.ts** : implémentation Web Speech API

### Sélection de voix
Priorité pour trouver une voix **masculine française** :
1. Voix FR avec "natural" + nom masculin (paul, thomas, claude, henri, pierre, jacques)
2. Voix FR avec nom masculin
3. Microsoft Paul (voix masculine FR courante sur Windows)
4. Microsoft Henri
5. Voix FR non-locale (souvent de meilleure qualité)
6. N'importe quelle voix FR
7. N'importe quelle voix commençant par "fr"

Logger la voix sélectionnée : `console.log('[TTS] Voix sélectionnée:', voice.name)`

Cache la voix trouvée pour ne pas re-scanner à chaque appel.

### Paramètres voix
- `rate: 0.95` (légèrement plus lent que la normale)
- `pitch: 0.85` (plus grave = masculin)
- `volume: 1`
- `lang: 'fr-FR'`

### Fluidité de la lecture
Pour éviter les coupures et améliorer la fluidité :
- **Découper le texte en phrases** (regex sur `.!?`) avant de le lire
- Lire chaque phrase séquentiellement (`utterance.onend` → phrase suivante)
- Si une phrase échoue (`onerror`), passer à la suivante
- Nettoyer le texte avant lecture : supprimer `<!--...-->`, `*`, `_`, `~`, `` ` ``, `#`

### Intégration dans le chat

**Mode TTS auto** (toggle dans le header) :
- Quand activé : chaque nouvelle réponse IA est lue automatiquement à la fin du streaming (`onFinish`)
- Quand désactivé : arrêter la lecture en cours (`tts.stop()`)
- Icône : haut-parleur avec ondes (activé) / haut-parleur barré (désactivé)
- Bouton surligné (`bg-white/25`) quand actif

**Lecture par message** (bouton sur chaque bulle IA) :
- Bouton invisible par défaut, visible au hover sur le message
- Toujours visible si c'est le message en cours de lecture
- Clic : toggle lecture (si en cours sur ce message → stop, sinon → lire)
- Icône : 🔊 (lecture) / ⏸ (pause)
- État tracké par `speakingMsgId` dans ChatApp

## 2. Speech-to-Text (STT)

### Architecture

**src/platform/interfaces/stt.interface.ts** :
```typescript
interface ISTTAdapter {
  isAvailable(): boolean
  start(onResult: (text: string) => void, onEnd?: () => void): void
  stop(): void
  isListening(): boolean
}
```

**src/platform/web/web-stt.ts** : implémentation Web Speech Recognition API

### Implémentation
- Utilise `window.SpeechRecognition` ou `window.webkitSpeechRecognition`
- `lang: 'fr-FR'`, `interimResults: true`, `continuous: false`
- Au résultat final (`.isFinal === true`) → retourne le transcript
- Auto-stop après 30 secondes

### Composant VoiceRecorder
- N'affiche le bouton QUE si `stt.isAvailable()` est true
- Bouton micro : gris au repos, rouge + animation `pulse-ring` quand actif
- Résultat → `onAppend({ role: 'user', content: texte })` → envoie directement le message

## 3. Mode accessibilité RGAA

### Toggle
- Bouton œil 👁 dans le header
- Surligné quand actif
- State `rgaaMode` dans ChatApp
- Classe CSS `rgaa-mode` ajoutée au conteneur racine

### Effets du mode RGAA
CSS (`globals.css`) :
```css
.rgaa-mode * {
  font-size: 118% !important;
  line-height: 1.6 !important;
}
.rgaa-mode .msg-bubble {
  border: 2px solid #333 !important;
}
.rgaa-mode button:focus-visible,
.rgaa-mode a:focus-visible {
  outline: 3px solid #000 !important;
  outline-offset: 3px !important;
}
```

Props `rgaaMode` passé aux composants qui en ont besoin (MessageBubble).

### Accessibilité de base (toujours active)
- `aria-label` sur tous les boutons d'action
- `title` sur tous les boutons
- `:focus-visible` avec outline violet sur tous les éléments interactifs
- `lang="fr"` sur le `<html>`
- Contraste suffisant sur tous les textes

## Vérification
- [ ] Toggle TTS → la prochaine réponse IA est lue automatiquement
- [ ] Voix masculine française sélectionnée (vérifier dans la console)
- [ ] La lecture est fluide (pas de coupure entre les phrases)
- [ ] Bouton écouter visible au hover sur les bulles IA
- [ ] Bouton micro → dictée en français → message envoyé
- [ ] Mode RGAA → texte plus grand, bordures visibles, outline au focus
- [ ] Sur mobile : tous les boutons sont assez grands (min 44px touch target)
