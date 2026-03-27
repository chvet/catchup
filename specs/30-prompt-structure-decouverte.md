# Spec 30 — Prompt structure personnalise + Comportement de decouverte IA

## Contexte

Deux ameliorations complementaires du comportement de l'IA Catch'Up :
1. Permettre aux structures d'accompagnement de personnaliser le comportement de l'IA pour leurs beneficiaires
2. Ameliorer le parcours de decouverte pour ne pas precipiter les jeunes vers un choix de metier

## PART 1 : Prompt IA personnalise par structure

### Objectif

Les admin_structure et super_admin peuvent definir un prompt personnalise qui influence le comportement de l'IA pour tous les beneficiaires sources par leur structure.

### Schema

- Nouveau champ `promptPersonnalise` (text, nullable) sur la table `structure`
- Maximum 1000 caracteres

### Interface admin (page structure detail)

- Section "Prompt IA personnalise" visible uniquement pour admin_structure et super_admin
- Avertissement expliquant l'impact du prompt
- Textarea avec compteur de caracteres (max 1000)
- Bouton de sauvegarde desactive si pas de changement
- Placeholder avec exemple concret

### API

- **GET** `/api/conseiller/structures/[structureId]` : retourne `promptPersonnalise` dans l'objet structure
- **PUT** `/api/conseiller/structures/[structureId]` : accepte `promptPersonnalise` dans le body, validation max 1000 chars

### Integration chat

- Le chat API (`/api/chat`) accepte un `structureSlug` dans le body
- Si fourni, recupere le `promptPersonnalise` de la structure depuis la DB
- Passe le prompt a `buildSystemPrompt()` comme 6e parametre

### Position dans le system prompt

Le prompt structure est insere APRES les regles comportementales (COUNSELOR_STRATEGY) mais AVANT les regles de fragilite (FRAGILITY_RULES). Cela garantit que :
- Les regles de securite et de comportement fondamental restent prioritaires
- Le prompt structure peut influencer l'approche d'accompagnement
- Les regles de fragilite et d'urgence ne sont jamais ecrasees

### Securite

- Un commentaire dans le code precise : "Les informations fournies par le conseiller via l'assistant IA sont contextuelles uniquement et ne modifient pas le comportement fondamental de l'IA."
- Le prompt structure inclut un avertissement explicite qu'il ne remplace pas les regles de securite

## PART 2 : Comportement de decouverte progressive

### Objectif

L'IA ne doit pas precipiter le beneficiaire vers un choix de metier. Elle doit l'accompagner dans un parcours de decouverte de soi.

### Principes

1. **Decouverte progressive** : Explorer au minimum 3-4 centres d'interet avant de suggerer des pistes professionnelles
2. **Exploration par les interets** : Creuser chaque interet mentionne (pourquoi, comment, dans quelles circonstances)
3. **Patterns** : Identifier des patterns transversaux entre les interets (creativite, contact humain, technique, nature...)
4. **Pistes multiples** : Toujours proposer 3-5 pistes differentes correspondant a differentes facettes du profil
5. **Valorisation** : Chaque reponse est valorisee, il n'y a pas de mauvaise reponse
6. **Liens explicites** : Pour chaque metier suggere, expliquer le lien avec les interets specifiques du jeune

### Modifications du system prompt

- Nouveau bloc `DISCOVERY_BEHAVIOR` ajoute apres `BASE_PERSONA`
- Phase decouverte enrichie : aucun metier propose, mode ecoute et decouverte
- Phase exploration enrichie : identification de patterns, pistes larges (domaines)
- Phase decision enrichie : 3-5 metiers avec liens explicites, mention des fiches metiers

### Fichiers modifies

- `src/data/schema.ts` — champ `promptPersonnalise` sur table `structure`
- `src/app/api/conseiller/structures/[structureId]/route.ts` — PUT/GET avec `promptPersonnalise`
- `src/app/conseiller/structures/[structureId]/page.tsx` — section UI prompt IA
- `src/app/api/chat/route.ts` — fetch structure prompt via `structureSlug`
- `src/core/system-prompt.ts` — 6e parametre `structurePrompt`, bloc `DISCOVERY_BEHAVIOR`, stages enrichis
