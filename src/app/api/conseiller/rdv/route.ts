// GET  /api/conseiller/rdv — Liste des RDV du conseiller connecté
// POST /api/conseiller/rdv — Créer un nouveau RDV

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logAudit } from '@/lib/auth'
import { db } from '@/data/db'
import { rendezVous, priseEnCharge, referral, utilisateur, messageDirect, calendarConnection } from '@/data/schema'
import { eq, and, gte, lte, asc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { logJournal } from '@/lib/journal'
import {
  ensureValidToken,
  createGoogleCalendarEvent,
  createOutlookCalendarEvent,
  type CalendarEvent,
} from '@/lib/calendar-oauth'

export async function GET(request: Request) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!ctx.id) return jsonError('Non autorisé', 401)

    const url = new URL(request.url)
    const now = new Date()

    // Filtres
    const from = url.searchParams.get('from') || now.toISOString()
    const to = url.searchParams.get('to') || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const statut = url.searchParams.get('statut')

    // Récupérer toutes les prises en charge du conseiller
    const mesPEC = await db
      .select({ id: priseEnCharge.id, referralId: priseEnCharge.referralId })
      .from(priseEnCharge)
      .where(eq(priseEnCharge.conseillerId, ctx.id))

    if (mesPEC.length === 0) {
      return jsonSuccess({ rdvs: [] })
    }

    const pecIds = mesPEC.map(p => p.id)

    // Récupérer les RDV pour ces prises en charge
    const allRdvs = []

    for (const pecId of pecIds) {
      const conditions = [
        eq(rendezVous.priseEnChargeId, pecId),
        gte(rendezVous.dateHeure, from),
        lte(rendezVous.dateHeure, to),
      ]
      if (statut) {
        conditions.push(eq(rendezVous.statut, statut))
      }

      const rdvs = await db
        .select()
        .from(rendezVous)
        .where(and(...conditions))
        .orderBy(asc(rendezVous.dateHeure))

      allRdvs.push(...rdvs.map(r => ({ ...r, _pecId: pecId })))
    }

    // Trier globalement par dateHeure
    allRdvs.sort((a, b) => a.dateHeure.localeCompare(b.dateHeure))

    // Enrichir avec les infos du bénéficiaire
    const enriched = await Promise.all(
      allRdvs.map(async (rdv) => {
        const pec = mesPEC.find(p => p.id === rdv.priseEnChargeId)
        let beneficiaire: { prenom: string | null; age: number | null } = { prenom: null, age: null }

        if (pec) {
          const refs = await db
            .select({ utilisateurId: referral.utilisateurId, ageBeneficiaire: referral.ageBeneficiaire })
            .from(referral)
            .where(eq(referral.id, pec.referralId))

          if (refs.length > 0) {
            const users = await db
              .select({ prenom: utilisateur.prenom })
              .from(utilisateur)
              .where(eq(utilisateur.id, refs[0].utilisateurId))

            beneficiaire = {
              prenom: users[0]?.prenom || null,
              age: refs[0].ageBeneficiaire,
            }
          }
        }

        return {
          id: rdv.id,
          titre: rdv.titre,
          dateHeure: rdv.dateHeure,
          dureeMinutes: rdv.dureeMinutes,
          lieu: rdv.lieu,
          lienVisio: rdv.lienVisio,
          statut: rdv.statut,
          beneficiaire,
          priseEnChargeId: rdv.priseEnChargeId,
          referralId: pec?.referralId || null,
          participants: rdv.participants ? JSON.parse(rdv.participants) : [],
        }
      })
    )

    return jsonSuccess({ rdvs: enriched })
  } catch (error) {
    console.error('[RDV GET]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!ctx.id) return jsonError('Non autorisé', 401)

    const body = await request.json()
    const { titre, dateHeure, priseEnChargeId, description, dureeMinutes, lieu, lienVisio } = body

    if (!titre || !dateHeure || !priseEnChargeId) {
      return jsonError('titre, dateHeure et priseEnChargeId sont requis', 400)
    }

    // Vérifier que la prise en charge existe et appartient au conseiller
    const pecs = await db
      .select()
      .from(priseEnCharge)
      .where(and(eq(priseEnCharge.id, priseEnChargeId), eq(priseEnCharge.conseillerId, ctx.id)))

    if (pecs.length === 0) {
      return jsonError('Prise en charge introuvable ou non autorisée', 404)
    }

    const referralId = pecs[0].referralId

    const finalLienVisio = lienVisio || null

    const now = new Date().toISOString()
    const rdvId = uuidv4()

    const newRdv = {
      id: rdvId,
      priseEnChargeId,
      titre,
      description: description || null,
      dateHeure,
      dureeMinutes: dureeMinutes || 30,
      lieu: lieu || null,
      lienVisio: finalLienVisio,
      statut: 'planifie',
      organisateurType: 'conseiller' as const,
      organisateurId: ctx.id,
      participants: null,
      rappelEnvoye: 0,
      creeLe: now,
      misAJourLe: now,
    }

    await db.insert(rendezVous).values(newRdv)

    // Envoyer un message structuré de type rdv dans la messagerie
    await db.insert(messageDirect).values({
      id: uuidv4(),
      priseEnChargeId,
      expediteurType: 'conseiller',
      expediteurId: ctx.id,
      contenu: JSON.stringify({
        type: 'rdv',
        id: rdvId,
        rdvId,
        titre,
        dateDebut: dateHeure,
        dateFin: new Date(new Date(dateHeure).getTime() + (dureeMinutes || 30) * 60000).toISOString(),
        lieu: lieu || null,
        description: description || null,
        lienVisio: finalLienVisio,
        statut: 'propose',
        proposePar: ctx.id,
        googleUrl: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titre)}&dates=${new Date(dateHeure).toISOString().replace(/[-:]/g, '').replace('.000', '')}/${new Date(new Date(dateHeure).getTime() + (dureeMinutes || 30) * 60000).toISOString().replace(/[-:]/g, '').replace('.000', '')}&details=${encodeURIComponent(description || 'Rendez-vous Catch\'Up')}&location=${encodeURIComponent(lieu || '')}`,
        icsUrl: `/api/conseiller/file-active/${referralId}/rdv/${rdvId}/ics`,
      }),
      conversationType: 'direct',
      lu: 0,
      horodatage: now,
    })

    // Tracer dans le journal
    await logJournal(
      priseEnChargeId,
      'rdv_planifie',
      'conseiller',
      ctx.id,
      `RDV planifié : ${titre} le ${new Date(dateHeure).toLocaleDateString('fr-FR')}`,
      {
        cibleType: 'rendez_vous',
        cibleId: rdvId,
        details: { titre, dateHeure, lieu: lieu || null, dureeMinutes: dureeMinutes || 30 },
      }
    )

    // Audit
    await logAudit(ctx.id, 'rdv_cree', 'rendez_vous', rdvId, { titre, dateHeure, priseEnChargeId })

    // ── Auto-sync to connected calendars (non-blocking) ──
    try {
      const connections = await db
        .select()
        .from(calendarConnection)
        .where(and(
          eq(calendarConnection.userId, ctx.id),
          eq(calendarConnection.type, 'conseiller'),
        ))

      const endTime = new Date(new Date(dateHeure).getTime() + (dureeMinutes || 30) * 60000).toISOString()
      const calEvent: CalendarEvent = {
        title: titre,
        description: description || "Rendez-vous Catch'Up",
        startTime: dateHeure,
        endTime,
        location: lieu || undefined,
      }

      for (const conn of connections) {
        try {
          const refreshed = await ensureValidToken(
            conn.provider as 'google' | 'outlook',
            conn.accessToken,
            conn.refreshToken,
            conn.expiresAt,
          )

          if (!refreshed) {
            console.warn(`[Calendar Sync] Token expired and could not refresh for ${conn.provider}`)
            continue
          }

          // Update tokens in DB if refreshed
          if (refreshed.accessToken !== conn.accessToken) {
            await db
              .update(calendarConnection)
              .set({
                accessToken: refreshed.accessToken,
                refreshToken: refreshed.refreshToken || conn.refreshToken,
                expiresAt: refreshed.expiresAt,
                misAJourLe: new Date().toISOString(),
              })
              .where(eq(calendarConnection.id, conn.id))
          }

          let externalEventId: string | null = null

          if (conn.provider === 'google') {
            externalEventId = await createGoogleCalendarEvent(refreshed.accessToken, calEvent)
            if (externalEventId) {
              await db.update(rendezVous)
                .set({ googleEventId: externalEventId, misAJourLe: new Date().toISOString() })
                .where(eq(rendezVous.id, rdvId))
            }
          } else if (conn.provider === 'outlook') {
            externalEventId = await createOutlookCalendarEvent(refreshed.accessToken, calEvent)
            if (externalEventId) {
              await db.update(rendezVous)
                .set({ outlookEventId: externalEventId, misAJourLe: new Date().toISOString() })
                .where(eq(rendezVous.id, rdvId))
            }
          }

          console.log(`[Calendar Sync] Event created on ${conn.provider}: ${externalEventId}`)
        } catch (syncErr) {
          // Don't block RDV creation if calendar sync fails
          console.error(`[Calendar Sync] Failed for ${conn.provider}:`, syncErr)
        }
      }
    } catch (calErr) {
      console.error('[Calendar Sync] Global error:', calErr)
    }

    return jsonSuccess({ rdv: newRdv }, 201)
  } catch (error) {
    console.error('[RDV POST]', error)
    return jsonError('Erreur serveur', 500)
  }
}
