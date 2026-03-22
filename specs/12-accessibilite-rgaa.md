# 12 — Accessibilité (RGAA)

## Principe directeur
**L'orientation est un droit, pas un privilège.** Un jeune dyslexique, malvoyant, sourd, ou en situation de handicap moteur doit pouvoir utiliser Catch'Up aussi facilement que n'importe qui. L'accessibilité n'est pas une couche qu'on ajoute à la fin — c'est une contrainte de conception dès le départ.

**Cadre légal :** Le RGAA (Référentiel Général d'Amélioration de l'Accessibilité) est obligatoire pour les services publics français. Catch'Up, porté par une fondation reconnue d'utilité publique, doit viser la **conformité RGAA niveau AA** (équivalent WCAG 2.1 AA).

---

## Adaptation linguistique intelligente

### FALC (Facile à Lire et à Comprendre)

Catch'Up détecte automatiquement les difficultés d'expression du jeune (fautes nombreuses, écriture phonétique, phrases très courtes ou confuses) et bascule en **mode FALC** :

| Principe FALC | Application dans Catch'Up |
|---|---|
| Phrases courtes | Sujet + verbe + complément, max 10 mots |
| Mots simples | Pas de jargon, pas de métaphores complexes |
| Une idée par phrase | Jamais deux informations dans une phrase |
| Questions fermées | Choix A/B/C plutôt que questions ouvertes |
| Emojis illustratifs | Plus d'emojis pour accompagner les mots |
| Reformulation proactive | Si le jeune semble ne pas comprendre, reformuler autrement |

**Exemple en mode FALC :**
> "Tu aimes quoi ? 🤔
> A) Travailler avec tes mains 🔧
> B) Travailler sur un ordinateur 💻
> C) Travailler avec des gens 🤝"

La bascule est automatique et progressive — pas de message "je détecte que tu as des difficultés" (stigmatisant).

### Adaptation multilingue

Si le jeune écrit dans une autre langue que le français, Catch'Up **répond dans sa langue** :
- Détection automatique de la langue
- Bascule avec le même ton bienveillant
- Les blocs techniques (PROFILE, SUGGESTIONS) restent en français
- Support du mélange de langues (franglais, arabe-français, etc.)

---

## Public concerné

Les jeunes 16-25 ans accompagnés par Catch'Up incluent :

| Handicap | Prévalence estimée | Impact sur l'usage |
|----------|-------------------|-------------------|
| Dyslexie / troubles DYS | 8-10% des jeunes | Difficulté de lecture, fatigue visuelle |
| Troubles de l'attention (TDAH) | 5-7% | Difficulté de concentration, besoin de messages courts |
| Malvoyance / basse vision | 2% | Besoin de contrastes forts, zoom, lecteur d'écran |
| Cécité | 0.1% | Navigation 100% clavier + lecteur d'écran |
| Surdité / malentendance | 1% | Pas d'accès au TTS, besoin de sous-titres |
| Handicap moteur | 1% | Navigation clavier, commande vocale |
| Handicap cognitif | 3% | Besoin de simplicité, langage clair |

**Au total : 15-20% du public cible est concerné par au moins un besoin d'accessibilité.** Ce n'est pas une niche.

---

## Les 4 piliers de l'accessibilité

### 1. Perceptible — Le contenu est visible et lisible par tous

#### Contrastes
- **Ratio minimum :** 4.5:1 pour le texte normal, 3:1 pour le texte large (> 18px)
- **Vérification :** chaque composant est testé avec l'outil de contraste de Chrome DevTools

| Élément | Couleur texte | Couleur fond | Ratio | Conforme ? |
|---------|-------------|-------------|-------|-----------|
| Texte principal | #1A1A2E (quasi noir) | #FFFFFF (blanc) | 16.5:1 | ✅ AA |
| Bulle assistant | #1A1A2E | #F3F4F6 (gris clair) | 14.2:1 | ✅ AA |
| Bulle utilisateur | #FFFFFF | #7C3AED (violet) | 5.8:1 | ✅ AA |
| Texte secondaire | #6B7280 (gris) | #FFFFFF | 4.6:1 | ✅ AA |
| Lien / accent | #7C3AED (violet) | #FFFFFF | 5.4:1 | ✅ AA |
| Barres RIASEC | Chaque couleur testée | #FFFFFF | > 3:1 | ✅ AA |

#### Taille du texte
- **Taille minimum :** 16px pour le texte de chat (pas de texte < 14px nulle part)
- **Unité :** `rem` partout (jamais `px` pour le texte) → respecte le zoom navigateur
- **Zoom :** l'interface reste utilisable à 200% de zoom sans perte de contenu

#### Images et icônes
- Chaque emoji décoratif a `aria-hidden="true"`
- Chaque emoji porteur de sens a un `aria-label` descriptif :
  ```html
  <span role="img" aria-label="Artiste">🎨</span>
  ```
- Les icônes SVG ont un `<title>` et un `aria-label`
- Pas d'information transmise uniquement par la couleur (toujours un texte ou icône en complément)

#### Mode sombre
- Mode sombre automatique (`prefers-color-scheme: dark`)
- Ou sélection manuelle dans les paramètres
- Les contrastes sont vérifiés dans les deux modes
- Les barres RIASEC restent lisibles en mode sombre (couleurs ajustées)

---

### 2. Utilisable — L'interface est navigable sans souris

#### Navigation clavier complète

Chaque élément interactif est accessible au clavier :

| Action | Touche | Élément |
|--------|--------|---------|
| Naviguer entre les éléments | `Tab` / `Shift+Tab` | Tous les éléments interactifs |
| Activer un bouton/lien | `Entrée` | Boutons, liens, chips de suggestion |
| Envoyer un message | `Entrée` | Zone de saisie |
| Nouvelle ligne | `Shift+Entrée` | Zone de saisie |
| Fermer un panneau/modal | `Échap` | Panel profil, modal, emoji picker |
| Naviguer dans le quiz | `Flèche gauche/droite` | Choix du quiz (alternative au swipe) |
| Valider un choix de quiz | `Entrée` | Carte sélectionnée |

#### Indicateur de focus
- **Visible sur tous les éléments focusables** : outline violet 2px avec offset 2px
- **Jamais masqué** par `outline: none` (erreur classique)
- Style : `outline: 2px solid #7C3AED; outline-offset: 2px;`
- En mode sombre : outline blanc

```css
/* Focus visible uniquement au clavier (pas au clic) */
:focus-visible {
  outline: 2px solid #7C3AED;
  outline-offset: 2px;
}

/* Supprime le outline natif au clic souris */
:focus:not(:focus-visible) {
  outline: none;
}
```

#### Ordre de tabulation logique
1. En-tête (boutons TTS, RGAA, profil)
2. Zone de chat (messages, pas focusables individuellement)
3. Suggestions (chips)
4. Zone de saisie (auto-focus au chargement)
5. Boutons de la zone de saisie (emoji, pièce jointe, micro, envoyer)

#### Pas de piège clavier
- Aucun élément ne capture le focus indéfiniment
- Les modales (panel profil, emoji picker, interstitiel) se ferment avec `Échap`
- Le focus revient à l'élément qui a ouvert la modale à la fermeture

---

### 3. Compréhensible — Le contenu est clair et prévisible

#### Langage clair
Catch'Up utilise déjà un langage simple (c'est dans le ton de la spec 04). Pour l'accessibilité :
- Phrases courtes (< 20 mots)
- Pas de jargon (jamais "RIASEC" devant le jeune)
- Mots courants (pas de "nonobstant" ou "présentiel")
- Abréviations expliquées au premier usage

#### Labels et instructions
- Chaque champ de formulaire a un `<label>` associé (ou `aria-label`)
- Les messages d'erreur sont clairs : "L'email n'est pas valide" (pas "Erreur 422")
- Les boutons ont un texte explicite : "Envoyer le message" (pas juste une icône ➤)

```html
<!-- Exemple : zone de saisie accessible -->
<label for="message-input" class="sr-only">Écris ton message</label>
<textarea
  id="message-input"
  aria-label="Écris ton message"
  aria-describedby="aide-saisie"
  placeholder="Écris ton message..."
></textarea>
<span id="aide-saisie" class="sr-only">
  Appuie sur Entrée pour envoyer, Shift+Entrée pour aller à la ligne
</span>
```

#### Annonces dynamiques (aria-live)
Le chat est dynamique — les messages arrivent en continu. Les lecteurs d'écran doivent être informés :

```html
<!-- Zone de chat : annonce les nouveaux messages -->
<div
  role="log"
  aria-live="polite"
  aria-label="Conversation avec Catch'Up"
>
  <!-- Messages ici -->
</div>

<!-- Indicateur de chargement -->
<div aria-live="polite" class="sr-only">
  <!-- Quand l'IA réfléchit : -->
  <span>Catch'Up est en train de répondre...</span>
</div>
```

- `aria-live="polite"` : le lecteur d'écran attend la fin de la phrase en cours avant d'annoncer le nouveau message
- `role="log"` : indique que c'est une zone de conversation (les anciens messages restent)

---

### 4. Robuste — Compatible avec les technologies d'assistance

#### Sémantique HTML
- Utilisation des balises sémantiques : `<header>`, `<main>`, `<nav>`, `<aside>`, `<footer>`
- Les listes sont des `<ul>/<li>` (pas des `<div>` stylisés)
- Les boutons sont des `<button>` (pas des `<div onclick>`)
- Les liens sont des `<a>` (pas des `<span>` cliquables)

#### Rôles ARIA

| Composant | Rôle ARIA | Pourquoi |
|-----------|-----------|----------|
| Zone de chat | `role="log"` | Zone de conversation dynamique |
| Panel profil | `role="complementary"` | Contenu complémentaire |
| Modal (emoji, création groupe) | `role="dialog"` | Fenêtre modale |
| Chips de suggestion | `role="listbox"` + `role="option"` | Liste de choix |
| Barres RIASEC | `role="progressbar"` + `aria-valuenow` | Jauge de progression |
| Quiz (choix) | `role="radiogroup"` + `role="radio"` | Choix exclusif |
| Bannière d'installation | `role="banner"` | Information promotionnelle |

#### Exemple : barre RIASEC accessible

```html
<div
  role="progressbar"
  aria-label="Score Artiste"
  aria-valuenow="70"
  aria-valuemin="0"
  aria-valuemax="100"
  style="width: 70%"
>
  <span aria-hidden="true">🎨</span>
  <span>Artiste</span>
  <span>70</span>
</div>
```

Un lecteur d'écran dira : "Score Artiste, 70 sur 100".

---

## Mode RGAA (accessibilité renforcée)

### Activation
Bouton ♿ dans l'en-tête du chat. Active un mode d'accessibilité renforcée.

### Ce que le mode RGAA change

| Fonctionnalité | Mode normal | Mode RGAA |
|----------------|------------|-----------|
| Taille du texte | 16px | 20px |
| Espacement des lignes | 1.5 | 1.8 |
| Police de caractères | System font | OpenDyslexic (police dyslexie) |
| Animations | Activées | Désactivées |
| Emojis dans le chat | Affichés | Remplacés par du texte |
| TTS automatique | Désactivé | Activé (chaque réponse est lue) |
| Contrastes | AA (4.5:1) | AAA (7:1) |
| Suggestions | Chips compacts | Boutons larges (48px minimum) |
| Zone de saisie | Hauteur normale | Hauteur doublée |

### Police OpenDyslexic
- Police libre de droits, conçue pour les personnes dyslexiques
- Lettres pondérées en bas pour éviter la rotation mentale
- Chargée en lazy-load (pas de surcharge pour les autres utilisateurs)
- Fallback : `system-ui, sans-serif`

```css
.rgaa-mode {
  font-family: 'OpenDyslexic', system-ui, sans-serif;
  font-size: 1.25rem;
  line-height: 1.8;
  letter-spacing: 0.05em;
  word-spacing: 0.1em;
}
```

### Respect de `prefers-reduced-motion`

Si le système du jeune est configuré pour réduire les animations :

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Éléments concernés :**
- Confettis du quiz → désactivés
- Pulse des boutons → désactivé
- Transition des barres RIASEC → instantanée
- Slide du panel profil → instantané
- Animation de frappe de l'IA → désactivée

---

## Synthèse vocale (TTS)

### Fonctionnement
Chaque réponse de Catch'Up peut être lue à voix haute. Deux modes :

**Mode manuel :** Bouton 🔊 au survol (ou focus) de chaque bulle IA → lit cette bulle uniquement.

**Mode automatique (RGAA) :** Chaque nouvelle réponse est lue automatiquement dès qu'elle apparaît.

### Voix
- **Voix masculine française** (cohérent avec le personnage Catch'Up "grand frère")
- Sélection par priorité : Paul → Henri → Claude → Thomas → première voix FR disponible
- Hauteur : 0.85 (grave)
- Débit : 0.95 (légèrement plus lent que la normale)
- Découpage par phrases pour fluidité (pas tout le message d'un coup)

### Accessibilité du TTS
- Bouton TTS dans l'en-tête : `aria-label="Activer la lecture vocale"`
- Bouton sur chaque bulle : `aria-label="Lire ce message à voix haute"`
- Quand la lecture est en cours : `aria-label="Arrêter la lecture"`
- Compatible avec les lecteurs d'écran (le TTS Catch'Up se met en pause si un lecteur d'écran est actif)

---

## Reconnaissance vocale (STT)

### Fonctionnement
Le jeune peut dicter ses messages au lieu de taper. Bouton micro 🎤 dans la zone de saisie.

### Accessibilité
- `aria-label="Dicter un message"` sur le bouton micro
- Quand l'enregistrement est actif : `aria-label="Arrêter la dictée"` + indicateur visuel (pulsation rouge)
- Le texte reconnu apparaît dans la zone de saisie (le jeune peut le modifier avant d'envoyer)
- Durée max : 30 secondes (auto-stop avec message "La dictée s'est arrêtée, appuie sur envoyer ou dicte à nouveau")

---

## Quiz accessible

Le mini-quiz (spec 05) utilise le swipe comme interaction principale. Il doit rester utilisable sans écran tactile :

### Navigation clavier du quiz

| Action | Touche |
|--------|--------|
| Sélectionner le choix gauche | `Flèche gauche` ou `1` |
| Sélectionner le choix droite | `Flèche droite` ou `2` |
| Valider le choix | `Entrée` |
| Recommencer (écran résultat) | `R` |

### Structure ARIA du quiz

```html
<div role="radiogroup" aria-label="Question 1 sur 3 : Le week-end, tu préfères...">

  <div role="radio" aria-checked="false" tabindex="0"
       aria-label="Construire ou réparer un truc">
    <span aria-hidden="true">🔧</span>
    <span>Construire / réparer un truc</span>
  </div>

  <div role="radio" aria-checked="false" tabindex="0"
       aria-label="Créer quelque chose">
    <span aria-hidden="true">🎨</span>
    <span>Créer quelque chose</span>
  </div>

</div>
```

---

## Formulaires accessibles

### Magic link (spec 01)

```html
<form aria-label="Connexion par email">
  <label for="email-reconnexion">Ton email pour reprendre</label>
  <input
    type="email"
    id="email-reconnexion"
    aria-describedby="email-aide"
    autocomplete="email"
    required
  />
  <span id="email-aide" class="sr-only">
    Tu recevras un lien de connexion par email, valable 15 minutes
  </span>
  <button type="submit">Recevoir le lien →</button>
</form>
```

### Inscription prescripteur (spec 10)

- Chaque champ a un `<label>` visible
- Les champs obligatoires sont marqués par `*` ET `aria-required="true"`
- Les erreurs de validation sont annoncées via `aria-live="assertive"`
- L'autocomplete est activé (`autocomplete="given-name"`, `autocomplete="email"`, etc.)

---

## Tests d'accessibilité

### Outils automatisés

| Outil | Usage | Fréquence |
|-------|-------|-----------|
| axe-core (intégré à Playwright) | Tests automatisés dans la CI | À chaque déploiement |
| Lighthouse (onglet accessibilité) | Score global | Hebdomadaire |
| WAVE (extension navigateur) | Vérification manuelle | À chaque nouvelle page |

### Tests manuels

| Test | Méthode | Critère de succès |
|------|---------|-------------------|
| Navigation clavier | Tabulation complète de chaque page | Tous les éléments atteignables et activables |
| Lecteur d'écran | VoiceOver (iOS/Mac) + NVDA (Windows) | Toutes les infos sont lues correctement |
| Zoom 200% | Zoom navigateur | Aucune perte de contenu, pas de scroll horizontal |
| Mode contrastes élevés | Windows : mode contraste élevé | Interface reste utilisable |
| Mode RGAA | Activer le bouton ♿ | Police, taille, espacement changent correctement |

### Objectif de score Lighthouse

| Catégorie | Score minimum |
|-----------|--------------|
| Accessibilité | > 95 |
| Performances | > 80 |
| Bonnes pratiques | > 90 |
| SEO | > 90 |

---

## Déclaration d'accessibilité

**Obligatoire légalement** pour un service porté par un organisme d'intérêt public.

Page `/accessibilite` contenant :
- État de conformité : "Catch'Up est en conformité partielle avec le RGAA 4.1"
- Liste des non-conformités connues (honnêteté)
- Date de la dernière évaluation
- Contact pour signaler un problème d'accessibilité : `accessibilite@fondation-jae.org`
- Lien vers le Défenseur des droits (voie de recours)

---

## Métriques

| Métrique | Description | Objectif |
|----------|-------------|----------|
| Score Lighthouse accessibilité | Score automatisé | > 95 |
| Taux d'activation mode RGAA | % d'utilisateurs qui activent le mode | Indicateur (pas d'objectif — c'est une option) |
| Taux d'utilisation TTS | % de sessions avec au moins 1 lecture vocale | Indicateur |
| Taux d'utilisation STT | % de sessions avec au moins 1 dictée | Indicateur |
| Signalements accessibilité | Nombre de problèmes signalés par les utilisateurs | < 2/mois |
| Conformité RGAA | Nombre de critères conformes / total | > 75% (MVP), > 90% (v2) |
