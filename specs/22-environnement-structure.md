# 22 - Environnement Structure : Lien personnalisé & QR Code

> **Statut :** Implémenté  
> **Dernière mise à jour spec :** 2026-04-07  
> **Fichiers clés :** `src/app/api/qrcode/route.ts`, `src/app/api/structures/[slug]/route.ts`, `src/app/api/conseiller/structures/`  
> **URL pattern :** `catchup.jaeprive.fr/?s={slug}`

## Objectif

Permettre a chaque structure d'avoir un lien d'acces personnalise vers Catch'Up, utilisable dans des supports physiques (affiches, flyers, cartes de visite) et numeriques (email, site web). Le beneficiaire qui arrive via ce lien est automatiquement rattache a la structure correspondante.

## Slug de structure

- Chaque structure possede un champ `slug` unique (ex: `ml-paris-15`, `e2c-marseille`).
- Le slug est modifiable par les administrateurs depuis la page de detail de la structure.
- Format autorise : lettres minuscules, chiffres et tirets (`[a-z0-9-]`).
- Le slug est valide cote API (unicite, format) avant enregistrement.

## URL personnalisee

- Format : `https://catchup.jaeprive.fr/?s={slug}`
- Cette URL est affichee dans l'espace conseiller avec un bouton de copie rapide.
- Lorsqu'un beneficiaire arrive via cette URL, le parametre `s` est lu pour :
  - Pre-remplir la structure de rattachement.
  - Taguer automatiquement la source de la prise en charge (referral tracking).
  - Personnaliser l'experience d'accueil si la structure a des specialites definies.

## Generation de QR Code

- Le QR Code est genere cote client via l'API gratuite `api.qrserver.com`.
- Taille par defaut : 200x200 pixels (affichage), 300x300 pixels (impression).
- Le QR Code est telechargeable au format PNG.
- Aucune dependance serveur supplementaire requise.

## Affiche imprimable

- Un bouton "Imprimer l'affiche" genere une page de mise en page optimisee pour l'impression :
  - Nom de la structure en titre.
  - QR Code en grand format (300x300).
  - URL en texte sous le QR Code.
  - Mention "Scannez pour acceder a Catch'Up".
- Utilise `window.print()` pour declencher l'impression navigateur.

## Integration dans l'espace conseiller

### Page de detail de structure (`/conseiller/structures/[structureId]`)
- Section "Lien & QR Code" avec :
  - Affichage et edition du slug.
  - Champ lecture seule avec l'URL complete + bouton "Copier".
  - Apercu du QR Code + boutons "Telecharger" et "Imprimer l'affiche".

### Liste des structures (`/conseiller/structures`)
- Icone QR Code sur chaque carte de structure (visible uniquement si un slug est defini).
- Clic sur l'icone = copie du lien dans le presse-papier avec notification "Lien copie !".

## Schema de donnees

Le champ `slug` existe deja dans la table `structure` (`schema.ts`) :

```
slug: text('slug').unique()
```

Le endpoint PUT `/api/conseiller/structures/[structureId]` accepte le champ `slug` avec validation de format et d'unicite.
