# 19 — Token Guard — Protection des coûts IA

> **Statut :** Implémenté  
> **Version :** 1.0.0  
> **Date :** 2026-03-23  
> **Dernière mise à jour spec :** 2026-04-07  
> **Fichier clé :** `src/app/api/chat/route.ts`

---

## Problème

Chaque message du bénéficiaire génère un appel à l'API OpenAI (gpt-4o). Sans contrôle :
- Un utilisateur abusif peut envoyer des centaines de messages
- Le system prompt (~3000 tokens) est renvoyé à chaque message
- L'historique grandit linéairement (tokens cumulés)
- Risque de facture imprévue

## Solution : Token Guard (triple protection)

### 1. Quotas par conversation

| Paramètre | Valeur par défaut | Env var |
|-----------|-------------------|---------|
| Max messages / conversation | 50 | `MAX_MESSAGES_PER_CONV` |
| Max tokens en sortie / message | 500 | `MAX_OUTPUT_TOKENS` |
| Max coût / conversation | $0.50 | `MAX_COST_PER_CONV` |
| Max tokens contexte envoyé | 4000 | `MAX_CONTEXT_TOKENS` |

Quand la limite est atteinte → le chat propose la mise en relation avec un conseiller (transition douce, pas une erreur).

### 2. Quotas quotidiens globaux

| Paramètre | Valeur par défaut | Env var |
|-----------|-------------------|---------|
| Budget quotidien global | $10.00 | `DAILY_BUDGET_USD` |
| Max conversations / IP / jour | 5 | `MAX_CONV_PER_IP` |

### 3. Troncature intelligente du contexte

Quand l'historique dépasse `MAX_CONTEXT_TOKENS` :
- Les messages les plus anciens sont tronqués
- Les messages récents sont conservés (contexte immédiat)
- Le system prompt est toujours envoyé intégralement

## Tarifs utilisés (mars 2026)

| Modèle | Input | Output | Usage |
|--------|-------|--------|-------|
| gpt-4o | $2.50/M tokens | $10.00/M tokens | Chat principal |
| gpt-4o-mini | $0.15/M tokens | $0.60/M tokens | Résumés referral |

## Estimation de coût par conversation type

| Scénario | Messages | Coût estimé |
|----------|----------|-------------|
| Conversation courte (10 msg) | 10 | ~$0.05 |
| Conversation moyenne (25 msg) | 25 | ~$0.15 |
| Conversation longue (50 msg) | 50 | ~$0.40 |
| Résumé referral (1 appel mini) | 1 | ~$0.001 |

**Budget $10/jour ≈ 65 conversations moyennes**

## Dashboard admin

Endpoint : `GET /api/conseiller/dashboard/usage`
- Accessible aux `admin_structure` et `super_admin`
- Retourne : tokens in/out, coût du jour, % budget utilisé, niveau d'alerte

## Comportement quand limite atteinte

1. **Conversation** : réponse 429 avec `suggestReferral: true` → le frontend propose automatiquement la mise en relation
2. **Budget quotidien** : toutes les conversations reçoivent un message d'excuse + proposition de conseiller
3. **IP** : bloqué pour nouvelles conversations, existantes continuent

## Variables d'environnement (docker-compose.yml)

```yaml
environment:
  DAILY_BUDGET_USD: "10.00"
  MAX_MESSAGES_PER_CONV: "50"
  MAX_OUTPUT_TOKENS: "500"
  MAX_COST_PER_CONV: "0.50"
  MAX_CONV_PER_IP: "5"
  MAX_CONTEXT_TOKENS: "4000"
```

Toutes les valeurs sont ajustables sans rebuild — un simple restart du container suffit.
