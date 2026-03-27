// SSO Parcoureo — Login et redirection
// POST : Valide un token Parcoureo, crée/retrouve le conseiller, crée la session JWT
// GET  : Redirige vers la page de login Parcoureo

import { NextRequest, NextResponse } from 'next/server'
import { validateParcoureoToken, getParcoureoLoginUrl, isParcoureoConfigured } from '@/lib/parcoureo'
import { createJWT, setAuthCookie, logAudit } from '@/lib/auth'
import { db } from '@/data/db'
import { conseiller, structure } from '@/data/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

// ── GET : Redirection vers Parcoureo ──

export async function GET(request: NextRequest) {
  if (!isParcoureoConfigured()) {
    return NextResponse.json(
      { error: 'Integration Parcoureo non configuree' },
      { status: 503 }
    )
  }

  const origin = request.nextUrl.origin
  const redirectUri = `${origin}/api/conseiller/auth/parcoureo/callback`
  const loginUrl = getParcoureoLoginUrl(redirectUri)

  return NextResponse.redirect(loginUrl)
}

// ── POST : Validation du token + création de session ──

export async function POST(request: NextRequest) {
  try {
    if (!isParcoureoConfigured()) {
      return NextResponse.json(
        { error: 'Integration Parcoureo non configuree' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token Parcoureo requis' },
        { status: 400 }
      )
    }

    // 1. Valider le token auprès de Parcoureo
    const parcoureoUser = await validateParcoureoToken(token)

    if (!parcoureoUser) {
      return NextResponse.json(
        { error: 'Token Parcoureo invalide ou expire' },
        { status: 401 }
      )
    }

    // 2. Trouver ou créer le conseiller
    const now = new Date().toISOString()
    const emailLower = parcoureoUser.email.toLowerCase().trim()

    let conseillers = await db
      .select()
      .from(conseiller)
      .where(eq(conseiller.email, emailLower))

    let c = conseillers[0]

    if (!c) {
      // Créer le conseiller (SSO uniquement, pas de mot de passe)
      const newId = uuidv4()

      // Trouver la structure par parcoureoId si renseigné
      let structureId: string | null = null
      if (parcoureoUser.structureExterne) {
        const structures = await db
          .select({ id: structure.id })
          .from(structure)
          .where(eq(structure.parcoureoId, parcoureoUser.structureExterne))

        if (structures.length > 0) {
          structureId = structures[0].id
        }
      }

      const role = parcoureoUser.role === 'admin' ? 'admin_structure' : 'conseiller'

      await db.insert(conseiller).values({
        id: newId,
        email: emailLower,
        motDePasse: null, // SSO uniquement
        prenom: parcoureoUser.prenom,
        nom: parcoureoUser.nom,
        role,
        structureId,
        parcoureoId: parcoureoUser.parcoureoId || null,
        actif: 1,
        derniereConnexion: now,
        creeLe: now,
        misAJourLe: now,
      })

      // Re-fetch pour obtenir l'objet complet
      conseillers = await db
        .select()
        .from(conseiller)
        .where(eq(conseiller.id, newId))
      c = conseillers[0]
    } else {
      // Mettre à jour les infos depuis Parcoureo + parcoureoId
      const updateData: Record<string, unknown> = {
        derniereConnexion: now,
        misAJourLe: now,
      }
      if (parcoureoUser.parcoureoId) {
        updateData.parcoureoId = parcoureoUser.parcoureoId
      }
      // Mettre à jour le nom/prénom si changé côté Parcoureo
      if (parcoureoUser.prenom) updateData.prenom = parcoureoUser.prenom
      if (parcoureoUser.nom) updateData.nom = parcoureoUser.nom

      await db
        .update(conseiller)
        .set(updateData)
        .where(eq(conseiller.id, c.id))
    }

    if (!c.actif) {
      return NextResponse.json(
        { error: 'Compte desactive' },
        { status: 403 }
      )
    }

    // 3. Créer le JWT
    const { token: jwt } = await createJWT({
      sub: c.id,
      email: c.email,
      role: c.role as 'conseiller' | 'admin_structure' | 'super_admin',
      structureId: c.structureId,
    })

    // 4. Cookie
    await setAuthCookie(jwt)

    // 5. Audit
    await logAudit(c.id, 'login_parcoureo', 'conseiller', c.id, {
      email: c.email,
      parcoureoId: parcoureoUser.parcoureoId,
    })

    // 6. Récupérer le slug de la structure pour la redirection
    let conseillerSlug: string | null = null
    if (c.structureId) {
      const structs = await db
        .select({ slug: structure.slug })
        .from(structure)
        .where(eq(structure.id, c.structureId))
      if (structs.length > 0) conseillerSlug = structs[0].slug
    }

    return NextResponse.json({
      success: true,
      slug: conseillerSlug,
    })
  } catch (error) {
    console.error('[Parcoureo SSO]', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
