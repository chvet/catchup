// Logique de décision pour proposer un accompagnement conseiller
// cf. spec 16-matching.md

export interface ReferralContext {
  messageCount: number
  fragilityLevel: 'none' | 'low' | 'medium' | 'high'
  fragilityScore: number
  profileStable: boolean // from indiceConfiance.estStable or nbInstantanes > 3
  hasRefusedBefore: boolean
  messagesSinceRefusal: number
  hasExistingReferral: boolean
}

export interface ReferralDecision {
  shouldPropose: boolean
  reason: string
  urgency: 'immediate' | 'gentle' | 'none'
}

export function shouldProposeReferral(context: ReferralContext): ReferralDecision {
  // Rule 1: Never propose again if a referral already exists
  if (context.hasExistingReferral) {
    return {
      shouldPropose: false,
      reason: 'Un accompagnement est déjà en cours',
      urgency: 'none',
    }
  }

  // Rule 2: High fragility -> immediate proposal
  if (context.fragilityLevel === 'high') {
    return {
      shouldPropose: true,
      reason: 'Détresse détectée — orientation urgente recommandée',
      urgency: 'immediate',
    }
  }

  // Rule 5: If refused before and not enough messages since -> don't propose
  if (context.hasRefusedBefore && context.messagesSinceRefusal < 10) {
    return {
      shouldPropose: false,
      reason: 'Refus récent — attente de 10 messages avant nouvelle proposition',
      urgency: 'none',
    }
  }

  // Rule 3: Medium fragility -> gentle proposal
  if (context.fragilityLevel === 'medium') {
    return {
      shouldPropose: true,
      reason: 'Fragilité modérée détectée — accompagnement suggéré',
      urgency: 'gentle',
    }
  }

  // Rule 4: Enough messages and stable profile -> gentle proposal
  if (context.messageCount >= 14 && context.profileStable) {
    return {
      shouldPropose: true,
      reason: 'Profil stabilisé après échanges suffisants',
      urgency: 'gentle',
    }
  }

  // Rule 6: Low fragility with enough messages -> gentle proposal
  if (context.fragilityLevel === 'low' && context.messageCount >= 8) {
    return {
      shouldPropose: true,
      reason: 'Signaux de fragilité légers — proposition douce',
      urgency: 'gentle',
    }
  }

  // Default: no proposal
  return {
    shouldPropose: false,
    reason: 'Conditions non remplies pour proposer un accompagnement',
    urgency: 'none',
  }
}
