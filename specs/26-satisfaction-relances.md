# Spec 26 — Enquête de satisfaction et relances automatiques

> **Statut :** Implémenté  
> **Dernière mise à jour spec :** 2026-04-07  
> **Fichiers clés :** `src/components/SatisfactionSurvey.tsx`, `src/app/api/accompagnement/satisfaction/route.ts`, `src/app/api/conseiller/satisfaction/route.ts`, `src/app/api/cron/reminders/route.ts`, `src/data/schema.ts` (enqueteSatisfaction, rappel)

## Vue d'ensemble

Deux fonctionnalites complementaires pour ameliorer le suivi des accompagnements :

1. **Enquete de satisfaction** : recueillir l'avis du beneficiaire quand son accompagnement est termine
2. **Relances automatiques** : detecter les beneficiaires inactifs et alerter conseillers/beneficiaires

---

## Feature 1 : Enquete de satisfaction

### Schema

Table `enquete_satisfaction` :
- Notes 1-5 (globale, ecoute, utilite IA, conseiller)
- Score NPS 0-10 (recommandation)
- Champs texte libres (points forts, ameliorations)
- Flag `completee` pour savoir si l'enquete a ete remplie

### API beneficiaire

`/api/accompagnement/satisfaction` (auth Bearer token) :
- **GET** : verifie si une enquete existe pour cette prise en charge
- **POST** : soumet ou met a jour les reponses

### API conseiller

`/api/conseiller/satisfaction` :
- **GET** : liste les resultats de satisfaction avec moyennes et NPS
- Filtres : `?from=`, `?to=`, `?structureId=` (super_admin)
- Retourne les moyennes par critere + score NPS calcule

### Composant SatisfactionSurvey

- Modal mobile-first avec card style
- 4 questions avec etoiles (1-5, grandes et tactiles)
- 1 echelle NPS (0-10, boutons horizontaux avec code couleur)
- 2 questions ouvertes (textarea)
- Ecran de remerciement apres soumission

### Integration

- **AccompagnementChat** : banniere en haut du chat quand statut = `terminee` et enquete pas encore remplie
- **Admin dashboard** : section Satisfaction avec NPS score, moyennes etoiles, nombre de reponses

---

## Feature 2 : Relances automatiques

### Schema

Table `rappel` :
- Type : `beneficiaire_inactif` (48h sans message) ou `conseiller_alerte` (7 jours)
- Statut : `en_attente`, `envoye`, `annule`
- Anti-doublon : pas de rappel du meme type si un existe deja dans la periode

### API cron

`/api/cron/reminders` :
- Parcourt toutes les prises en charge actives
- Verifie le dernier message du beneficiaire
- 48h sans message -> rappel beneficiaire + notification push
- 7 jours sans message -> alerte conseiller + notification push
- Protection anti-doublon

### Integration alerts

Le polling existant des alertes (`/api/conseiller/alerts`, toutes les 30s) declenche en arriere-plan la verification des rappels via fetch non-bloquant vers `/api/cron/reminders`.

### Bandeau inactivite (DirectChat)

- Banniere jaune quand beneficiaire inactif depuis >= 3 jours
- Affiche le nombre de jours d'inactivite
- Bouton "Envoyer une relance" qui envoie un message preecrit bienveillant

---

## Fichiers crees/modifies

### Nouveaux fichiers
- `src/data/schema.ts` (tables ajoutees)
- `src/components/SatisfactionSurvey.tsx`
- `src/app/api/accompagnement/satisfaction/route.ts`
- `src/app/api/conseiller/satisfaction/route.ts`
- `src/app/api/cron/reminders/route.ts`

### Fichiers modifies
- `src/components/AccompagnementChat.tsx` (import survey + banniere + modal)
- `src/components/conseiller/DirectChat.tsx` (calcul inactivite + banniere relance)
- `src/app/conseiller/admin/page.tsx` (section satisfaction dashboard)
- `src/app/api/conseiller/alerts/route.ts` (piggyback cron reminders)

---

## Notes techniques

- Toutes les notifications push utilisent les fonctions existantes de `src/lib/push-triggers.ts`
- Le cron est simule en piggybackant sur le polling des alertes (toutes les 30s)
- L'enquete est liee a la `prise_en_charge`, pas au `referral`
- Le NPS score est calcule : % promoteurs (9-10) - % detracteurs (0-6)
