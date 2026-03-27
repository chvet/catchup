// SSO Parcoureo — Callback
// GET : Parcoureo redirige ici après l'authentification avec un token en query param.
// On valide le token, crée la session, et redirige vers /conseiller.

import { NextRequest, NextResponse } from 'next/server'
import { validateParcoureoToken, isParcoureoConfigured } from '@/lib/parcoureo'
import { createJWT, setAuthCookie, logAudit } from '@/lib/auth'
import { db } from '@/data/db'
import { conseiller, structure } from '@/data/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin

  if (!isParcoureoConfigured()) {
    return NextResponse.redirect(new URL('/conseiller/login?error=parcoureo_not_configured', origin))
  }

  // Extraire le token des query params
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/conseiller/login?error=missing_token', origin))
  }

  try {
    // 1. Valider le token
    const parcoureoUser = await validateParcoureoToken(token)

    if (!parcoureoUser) {
      return NextResponse.redirect(new URL('/conseiller/login?error=invalid_token', origin))
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
      // Créer le conseiller (SSO)
      const newId = uuidv4()

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
        motDePasse: null,
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

      conseillers = await db
        .select()
        .from(conseiller)
        .where(eq(conseiller.id, newId))
      c = conseillers[0]
    } else {
      // Mettre à jour
      const updateData: Record<string, unknown> = {
        derniereConnexion: now,
        misAJourLe: now,
      }
      if (parcoureoUser.parcoureoId) updateData.parcoureoId = parcoureoUser.parcoureoId
      if (parcoureoUser.prenom) updateData.prenom = parcoureoUser.prenom
      if (parcoureoUser.nom) updateData.nom = parcoureoUser.nom

      await db
        .update(conseiller)
        .set(updateData)
        .where(eq(conseiller.id, c.id))
    }

    if (!c.actif) {
      return NextResponse.redirect(new URL('/conseiller/login?error=account_disabled', origin))
    }

    // 3. Créer le JWT + cookie
    const { token: jwt } = await createJWT({
      sub: c.id,
      email: c.email,
      role: c.role as 'conseiller' | 'admin_structure' | 'super_admin',
      structureId: c.structureId,
    })

    await setAuthCookie(jwt)

    // 4. Audit
    await logAudit(c.id, 'login_parcoureo_callback', 'conseiller', c.id, {
      email: c.email,
      parcoureoId: parcoureoUser.parcoureoId,
    })

    // 5. Rediriger vers l'espace conseiller
    let redirectUrl = '/conseiller'
    if (c.structureId) {
      const structs = await db
        .select({ slug: structure.slug })
        .from(structure)
        .where(eq(structure.id, c.structureId))
      if (structs.length > 0 && structs[0].slug) {
        redirectUrl = `/conseiller?s=${structs[0].slug}`
      }
    }

    return NextResponse.redirect(new URL(redirectUrl, origin))
  } catch (error) {
    console.error('[Parcoureo Callback]', error)
    return NextResponse.redirect(new URL('/conseiller/login?error=server_error', origin))
  }
}
