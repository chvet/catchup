# 03 — API Chat (streaming OpenAI)

> Contexte : voir `00-architecture.md`. Prérequis : `01` et `02` exécutés.

## Objectif
Créer la route API `/api/chat` qui reçoit les messages, construit le system prompt dynamique, appelle GPT-4o en streaming, et retourne la réponse streamée.

## Fichier à créer

### src/app/api/chat/route.ts

**Endpoint** : `POST /api/chat`

**Body attendu** (envoyé par useChat du Vercel AI SDK) :
```typescript
{
  messages: { role: 'user' | 'assistant', content: string }[],
  // Champs custom envoyés via body option de useChat :
  profile?: UserProfile,     // profil RIASEC actuel
  messageCount?: number      // nombre de messages pour déterminer le stage
}
```

**Logique** :
1. Parser le body JSON
2. Importer `buildSystemPrompt` depuis `@/core/system-prompt`
3. Appeler `buildSystemPrompt(profile, messageCount)` pour construire le prompt adapté au stage et au profil
4. Appeler `streamText()` du Vercel AI SDK :
   - model : `openai('gpt-4o')`
   - system : le prompt construit
   - messages : les messages reçus
   - maxTokens : 500
   - temperature : 0.7
5. Retourner `result.toDataStreamResponse()`

**Gestion d'erreur** :
- Try/catch autour de tout
- Si erreur, retourner `Response` avec status 500 et JSON `{ error: message }`
- Log l'erreur avec `console.error('[Chat API Error]', error)`

**Config** :
- `export const maxDuration = 30` (timeout Vercel)

## Import côté client

Le composant `ChatApp` utilisera :
```typescript
const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
  api: '/api/chat',
  id: sessionId,
  body: { profile, messageCount },
  onFinish: (message) => {
    // Extraire le profil RIASEC de la réponse
    // Activer TTS si activé
    // Refocus input
  }
})
```

Le champ `body` est automatiquement fusionné avec les messages par useChat.

## Vérification
- Envoyer un message depuis le chat → réponse streamée visible token par token
- Le system prompt s'adapte au nombre de messages
- Si pas de clé OpenAI → erreur 500 propre, pas de crash
