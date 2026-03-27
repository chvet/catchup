// GET /api/conseiller/export
// Export de rapports d'activite, listes beneficiaires, listes structures
// Formats: PDF (jspdf) et Excel (exceljs)

import { NextRequest } from 'next/server'
import { getConseillerFromHeaders, hasRole, jsonError } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { referral, priseEnCharge, structure, conseiller, utilisateur } from '@/data/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'

// === Helpers ===

function formatNumberFr(n: number): string {
  return n.toLocaleString('fr-FR')
}

function formatDateFr(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return '-'
  }
}

function formatPeriod(from: string, to: string): string {
  return `Du ${formatDateFr(from)} au ${formatDateFr(to)}`
}

// === Data fetchers ===

interface ExportContext {
  role: string
  structureId: string | null
  from: string
  to: string
  filterStructureId?: string | null
}

async function fetchActivityData(ctx: ExportContext) {
  const conditions = [
    gte(referral.creeLe, ctx.from),
    lte(referral.creeLe, ctx.to),
  ]

  // Structure filtering
  const effectiveStructureId = ctx.role === 'super_admin' && ctx.filterStructureId
    ? ctx.filterStructureId
    : ctx.role === 'admin_structure'
      ? ctx.structureId
      : null

  // All referrals in period
  const allReferrals = await db
    .select({
      id: referral.id,
      prenom: utilisateur.prenom,
      age: referral.ageBeneficiaire,
      genre: referral.genre,
      localisation: referral.localisation,
      priorite: referral.priorite,
      statut: referral.statut,
      creeLe: referral.creeLe,
      structureSuggereId: referral.structureSuggereId,
    })
    .from(referral)
    .leftJoin(utilisateur, eq(referral.utilisateurId, utilisateur.id))
    .where(and(...conditions))

  // All prises en charge for these referrals
  const allPec = await db
    .select({
      id: priseEnCharge.id,
      referralId: priseEnCharge.referralId,
      conseillerId: priseEnCharge.conseillerId,
      structureId: priseEnCharge.structureId,
      statut: priseEnCharge.statut,
      scoreMatching: priseEnCharge.scoreMatching,
      premiereActionLe: priseEnCharge.premiereActionLe,
      termineeLe: priseEnCharge.termineeLe,
      creeLe: priseEnCharge.creeLe,
    })
    .from(priseEnCharge)

  // All structures
  const allStructures = await db
    .select({
      id: structure.id,
      nom: structure.nom,
      slug: structure.slug,
      type: structure.type,
      departements: structure.departements,
      specialites: structure.specialites,
      capaciteMax: structure.capaciteMax,
    })
    .from(structure)
    .where(eq(structure.actif, 1))

  // All conseillers
  const allConseillers = await db
    .select({
      id: conseiller.id,
      prenom: conseiller.prenom,
      nom: conseiller.nom,
      structureId: conseiller.structureId,
    })
    .from(conseiller)
    .where(eq(conseiller.actif, 1))

  // Build PEC map
  const pecByReferral = new Map<string, typeof allPec[0]>()
  for (const p of allPec) {
    pecByReferral.set(p.referralId, p)
  }

  // Build conseiller map
  const conseillerMap = new Map<string, typeof allConseillers[0]>()
  for (const c of allConseillers) {
    conseillerMap.set(c.id, c)
  }

  // Build structure map
  const structureMap = new Map<string, typeof allStructures[0]>()
  for (const s of allStructures) {
    structureMap.set(s.id, s)
  }

  // Filter by structure if needed
  let filteredReferrals = allReferrals
  if (effectiveStructureId) {
    const pecForStructure = new Set(
      allPec.filter(p => p.structureId === effectiveStructureId).map(p => p.referralId)
    )
    filteredReferrals = allReferrals.filter(r =>
      r.structureSuggereId === effectiveStructureId || pecForStructure.has(r.id)
    )
  }

  // KPIs
  const totalDemandes = filteredReferrals.length
  const enAttente = filteredReferrals.filter(r => r.statut === 'en_attente' || r.statut === 'nouvelle').length
  const pecReferralIds = new Set(filteredReferrals.map(r => r.id))
  const relevantPec = allPec.filter(p => pecReferralIds.has(p.referralId))
  const prisesEnCharge = relevantPec.filter(p =>
    ['prise_en_charge', 'nouvelle', 'en_attente'].includes(p.statut || '')
  ).length
  const terminees = relevantPec.filter(p => p.statut === 'terminee').length
  const ruptures = relevantPec.filter(p => p.statut === 'abandonnee').length
  const tauxPEC = totalDemandes > 0 ? Math.round((relevantPec.length / totalDemandes) * 100) : 0

  // Temps moyen attente
  let totalAttente = 0
  let nbAttente = 0
  for (const p of relevantPec) {
    if (p.premiereActionLe) {
      const ref = filteredReferrals.find(r => r.id === p.referralId)
      if (ref) {
        const diff = new Date(p.premiereActionLe).getTime() - new Date(ref.creeLe).getTime()
        totalAttente += diff / (1000 * 60 * 60) // hours
        nbAttente++
      }
    }
  }
  const tempsMoyenAttente = nbAttente > 0 ? Math.round(totalAttente / nbAttente) : 0

  // Repartition par statut
  const statutCounts: Record<string, number> = {}
  for (const r of filteredReferrals) {
    const s = r.statut || 'inconnu'
    statutCounts[s] = (statutCounts[s] || 0) + 1
  }

  // Repartition par urgence
  const urgenceCounts: Record<string, number> = {}
  for (const r of filteredReferrals) {
    const u = r.priorite || 'normale'
    urgenceCounts[u] = (urgenceCounts[u] || 0) + 1
  }

  // Par structure stats
  const structureStats: {
    nom: string
    nbDemandes: number
    nbPEC: number
    nbTerminees: number
    taux: number
    tempsMoyen: number
  }[] = []

  for (const s of allStructures) {
    if (effectiveStructureId && s.id !== effectiveStructureId) continue
    const structPec = allPec.filter(p => p.structureId === s.id)
    const structRefIds = new Set(structPec.map(p => p.referralId))
    const structDemandes = filteredReferrals.filter(r => structRefIds.has(r.id) || r.structureSuggereId === s.id)
    const nbDemandes = structDemandes.length
    const nbPEC = structPec.filter(p => ['prise_en_charge', 'nouvelle', 'en_attente'].includes(p.statut || '')).length
    const nbTerminees = structPec.filter(p => p.statut === 'terminee').length
    const taux = nbDemandes > 0 ? Math.round((structPec.length / nbDemandes) * 100) : 0

    let sMoyenAttente = 0
    let sNbAttente = 0
    for (const p of structPec) {
      if (p.premiereActionLe) {
        const ref = filteredReferrals.find(r => r.id === p.referralId)
        if (ref) {
          const diff = new Date(p.premiereActionLe).getTime() - new Date(ref.creeLe).getTime()
          sMoyenAttente += diff / (1000 * 60 * 60)
          sNbAttente++
        }
      }
    }

    structureStats.push({
      nom: s.nom,
      nbDemandes,
      nbPEC,
      nbTerminees,
      taux,
      tempsMoyen: sNbAttente > 0 ? Math.round(sMoyenAttente / sNbAttente) : 0,
    })
  }

  // Detail beneficiaires rows
  const detailRows = filteredReferrals.map(r => {
    const pec = pecByReferral.get(r.id)
    const conseillerInfo = pec ? conseillerMap.get(pec.conseillerId) : null
    const structureInfo = pec ? structureMap.get(pec.structureId) : (r.structureSuggereId ? structureMap.get(r.structureSuggereId) : null)
    let dureeAttente = '-'
    if (pec?.premiereActionLe) {
      const diff = new Date(pec.premiereActionLe).getTime() - new Date(r.creeLe).getTime()
      const h = Math.round(diff / (1000 * 60 * 60))
      dureeAttente = `${h}h`
    }
    return {
      prenom: r.prenom || 'Anonyme',
      age: r.age ?? '-',
      genre: r.genre || '-',
      localisation: r.localisation || '-',
      dateDemande: formatDateFr(r.creeLe),
      statut: r.statut || '-',
      priorite: r.priorite || '-',
      structure: structureInfo?.nom || '-',
      conseiller: conseillerInfo ? `${conseillerInfo.prenom} ${conseillerInfo.nom}` : '-',
      dureeAttente,
      scoreMatching: pec?.scoreMatching ?? '-',
    }
  })

  // Top 5 structures
  const top5 = [...structureStats]
    .sort((a, b) => b.nbDemandes - a.nbDemandes)
    .slice(0, 5)

  return {
    kpis: { totalDemandes, enAttente, prisesEnCharge, terminees, ruptures, tauxPEC, tempsMoyenAttente },
    statutCounts,
    urgenceCounts,
    structureStats,
    top5,
    detailRows,
  }
}

async function fetchBeneficiairesData(ctx: ExportContext) {
  const effectiveStructureId = ctx.role === 'super_admin' && ctx.filterStructureId
    ? ctx.filterStructureId
    : ctx.role === 'admin_structure'
      ? ctx.structureId
      : null

  const conditions = [
    gte(referral.creeLe, ctx.from),
    lte(referral.creeLe, ctx.to),
  ]

  const refs = await db
    .select({
      id: referral.id,
      prenom: utilisateur.prenom,
      age: referral.ageBeneficiaire,
      genre: referral.genre,
      localisation: referral.localisation,
      situation: utilisateur.situation,
      priorite: referral.priorite,
      statut: referral.statut,
      structureSuggereId: referral.structureSuggereId,
      creeLe: referral.creeLe,
    })
    .from(referral)
    .leftJoin(utilisateur, eq(referral.utilisateurId, utilisateur.id))
    .where(and(...conditions))

  const allPec = await db
    .select({
      referralId: priseEnCharge.referralId,
      conseillerId: priseEnCharge.conseillerId,
      structureId: priseEnCharge.structureId,
      scoreMatching: priseEnCharge.scoreMatching,
    })
    .from(priseEnCharge)

  const allConseillers = await db
    .select({ id: conseiller.id, prenom: conseiller.prenom, nom: conseiller.nom })
    .from(conseiller)

  const allStructures = await db
    .select({ id: structure.id, nom: structure.nom })
    .from(structure)

  const pecMap = new Map(allPec.map(p => [p.referralId, p]))
  const consMap = new Map(allConseillers.map(c => [c.id, c]))
  const strMap = new Map(allStructures.map(s => [s.id, s]))

  let filtered = refs
  if (effectiveStructureId) {
    const pecForStruct = new Set(allPec.filter(p => p.structureId === effectiveStructureId).map(p => p.referralId))
    filtered = refs.filter(r => r.structureSuggereId === effectiveStructureId || pecForStruct.has(r.id))
  }

  return filtered.map(r => {
    const pec = pecMap.get(r.id)
    const cons = pec ? consMap.get(pec.conseillerId) : null
    const str = pec ? strMap.get(pec.structureId) : (r.structureSuggereId ? strMap.get(r.structureSuggereId) : null)
    return {
      prenom: r.prenom || 'Anonyme',
      age: r.age ?? '-',
      genre: r.genre || '-',
      localisation: r.localisation || '-',
      situation: r.situation || '-',
      dateDemande: formatDateFr(r.creeLe),
      statut: r.statut || '-',
      priorite: r.priorite || '-',
      structureSuggeree: str?.nom || '-',
      conseillerAssigne: cons ? `${cons.prenom} ${cons.nom}` : '-',
      scoreMatching: pec?.scoreMatching ?? '-',
    }
  })
}

async function fetchStructuresData(ctx: ExportContext) {
  const effectiveStructureId = ctx.role === 'super_admin' && ctx.filterStructureId
    ? ctx.filterStructureId
    : ctx.role === 'admin_structure'
      ? ctx.structureId
      : null

  const allStructures = await db
    .select()
    .from(structure)
    .where(eq(structure.actif, 1))

  const allConseillers = await db
    .select({ id: conseiller.id, structureId: conseiller.structureId })
    .from(conseiller)
    .where(eq(conseiller.actif, 1))

  const allPec = await db
    .select({ structureId: priseEnCharge.structureId, statut: priseEnCharge.statut })
    .from(priseEnCharge)

  let filtered = allStructures
  if (effectiveStructureId) {
    filtered = allStructures.filter(s => s.id === effectiveStructureId)
  }

  return filtered.map(s => {
    const nbConseillers = allConseillers.filter(c => c.structureId === s.id).length
    const structPec = allPec.filter(p => p.structureId === s.id)
    const nbActifs = structPec.filter(p => ['prise_en_charge', 'nouvelle', 'en_attente'].includes(p.statut || '')).length
    const cap = s.capaciteMax || 50
    const tauxRemplissage = Math.round((nbActifs / cap) * 100)

    let deps: string[] = []
    try { deps = JSON.parse(s.departements || '[]') } catch { deps = [s.departements || ''] }

    let specs: string[] = []
    try { specs = JSON.parse(s.specialites || '[]') } catch { specs = s.specialites ? [s.specialites] : [] }

    return {
      nom: s.nom,
      type: s.type,
      slug: s.slug || '-',
      departements: deps.join(', '),
      specialites: specs.join(', '),
      nbConseillers,
      nbCasActifs: nbActifs,
      capaciteMax: cap,
      tauxRemplissage: `${tauxRemplissage}%`,
    }
  })
}

// === PDF generation ===

async function generateActivityPDF(ctx: ExportContext, structureName: string) {
  const { jsPDF } = await import('jspdf')
  const data = await fetchActivityData(ctx)

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let y = 20

  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(`Rapport d'activite - ${structureName}`, 14, y)
  y += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(formatPeriod(ctx.from, ctx.to), 14, y)
  y += 12

  // Section 1: KPIs
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('1. Indicateurs cles', 14, y)
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const kpiLines = [
    `Total demandes : ${formatNumberFr(data.kpis.totalDemandes)}`,
    `Prises en charge : ${formatNumberFr(data.kpis.prisesEnCharge)}`,
    `Terminees : ${formatNumberFr(data.kpis.terminees)}`,
    `Ruptures : ${formatNumberFr(data.kpis.ruptures)}`,
    `Taux de prise en charge : ${data.kpis.tauxPEC}%`,
    `Temps moyen d'attente : ${data.kpis.tempsMoyenAttente}h`,
  ]
  for (const line of kpiLines) {
    doc.text(line, 20, y)
    y += 6
  }
  y += 6

  // Section 2: Repartition par statut
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('2. Repartition par statut', 14, y)
  y += 8

  const statutLabels: Record<string, string> = {
    nouvelle: 'Nouvelle',
    en_attente: 'En attente',
    prise_en_charge: 'Prise en charge',
    recontacte: 'Recontacte',
    terminee: 'Terminee',
    echoue: 'Echouee',
    refuse: 'Refusee',
    abandonnee: 'Abandonnee',
  }

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Statut', 20, y)
  doc.text('Nombre', 100, y)
  y += 1
  doc.line(20, y, 140, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  for (const [statut, count] of Object.entries(data.statutCounts)) {
    doc.text(statutLabels[statut] || statut, 20, y)
    doc.text(formatNumberFr(count), 100, y)
    y += 6
  }
  y += 6

  // Section 3: Repartition par urgence
  if (y > pageHeight - 40) { doc.addPage(); y = 20 }
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('3. Repartition par urgence', 14, y)
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Urgence', 20, y)
  doc.text('Nombre', 100, y)
  y += 1
  doc.line(20, y, 140, y)
  y += 5

  const urgenceLabels: Record<string, string> = {
    normale: 'Normale',
    haute: 'Haute',
    critique: 'Critique',
  }

  doc.setFont('helvetica', 'normal')
  for (const [urgence, count] of Object.entries(data.urgenceCounts)) {
    doc.text(urgenceLabels[urgence] || urgence, 20, y)
    doc.text(formatNumberFr(count), 100, y)
    y += 6
  }
  y += 6

  // Section 4: Top 5 structures (super_admin only)
  if (ctx.role === 'super_admin' && !ctx.filterStructureId) {
    if (y > pageHeight - 60) { doc.addPage(); y = 20 }
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('4. Top 5 structures', 14, y)
    y += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Structure', 20, y)
    doc.text('Demandes', 120, y)
    doc.text('PEC', 155, y)
    doc.text('Terminees', 180, y)
    doc.text('Taux', 215, y)
    y += 1
    doc.line(20, y, 240, y)
    y += 5

    doc.setFont('helvetica', 'normal')
    for (const s of data.top5) {
      doc.text(s.nom.substring(0, 40), 20, y)
      doc.text(formatNumberFr(s.nbDemandes), 120, y)
      doc.text(formatNumberFr(s.nbPEC), 155, y)
      doc.text(formatNumberFr(s.nbTerminees), 180, y)
      doc.text(`${s.taux}%`, 215, y)
      y += 6
    }
    y += 6
  }

  // Section 5: Evolution text
  if (y > pageHeight - 40) { doc.addPage(); y = 20 }
  const sectionNum = ctx.role === 'super_admin' && !ctx.filterStructureId ? '5' : '4'
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`${sectionNum}. Evolution sur la periode`, 14, y)
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const evolutionText = `Sur la periode, ${formatNumberFr(data.kpis.totalDemandes)} demande(s) ont ete enregistree(s). ` +
    `${formatNumberFr(data.kpis.prisesEnCharge)} sont actuellement prises en charge, ` +
    `${formatNumberFr(data.kpis.terminees)} ont ete menees a terme et ${formatNumberFr(data.kpis.ruptures)} ont connu une rupture. ` +
    `Le taux global de prise en charge est de ${data.kpis.tauxPEC}% avec un temps moyen d'attente de ${data.kpis.tempsMoyenAttente}h.`

  const lines = doc.splitTextToSize(evolutionText, pageWidth - 28)
  doc.text(lines, 20, y)

  // Footer
  const footerText = `Genere par Catch'Up - ${formatDateFr(new Date().toISOString())}`
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' })
  doc.setTextColor(0)

  return Buffer.from(doc.output('arraybuffer'))
}

// === Excel generation ===

async function generateActivityExcel(ctx: ExportContext, structureName: string) {
  const ExcelJS = (await import('exceljs')).default
  const data = await fetchActivityData(ctx)

  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Catch'Up"
  workbook.created = new Date()

  // Sheet 1: Synthese
  const ws1 = workbook.addWorksheet('Synthese')
  ws1.columns = [
    { header: 'Indicateur', key: 'label', width: 35 },
    { header: 'Valeur', key: 'value', width: 20 },
  ]
  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF6C63FF' } },
  }
  ws1.getRow(1).eachCell(cell => {
    cell.font = headerStyle.font
    cell.fill = headerStyle.fill
  })

  ws1.addRow({ label: `Rapport d'activite - ${structureName}`, value: '' })
  ws1.addRow({ label: 'Periode', value: formatPeriod(ctx.from, ctx.to) })
  ws1.addRow({ label: '', value: '' })
  ws1.addRow({ label: 'Total demandes', value: data.kpis.totalDemandes })
  ws1.addRow({ label: 'En attente', value: data.kpis.enAttente })
  ws1.addRow({ label: 'Prises en charge', value: data.kpis.prisesEnCharge })
  ws1.addRow({ label: 'Terminees', value: data.kpis.terminees })
  ws1.addRow({ label: 'Ruptures', value: data.kpis.ruptures })
  ws1.addRow({ label: 'Taux prise en charge', value: `${data.kpis.tauxPEC}%` })
  ws1.addRow({ label: "Temps moyen d'attente", value: `${data.kpis.tempsMoyenAttente}h` })

  // Sheet 2: Detail beneficiaires
  const ws2 = workbook.addWorksheet('Detail beneficiaires')
  ws2.columns = [
    { header: 'Prenom', key: 'prenom', width: 18 },
    { header: 'Age', key: 'age', width: 8 },
    { header: 'Departement', key: 'localisation', width: 18 },
    { header: 'Date demande', key: 'dateDemande', width: 14 },
    { header: 'Statut', key: 'statut', width: 16 },
    { header: 'Structure', key: 'structure', width: 25 },
    { header: 'Conseiller', key: 'conseiller', width: 22 },
    { header: "Duree attente", key: 'dureeAttente', width: 14 },
  ]
  ws2.getRow(1).eachCell(cell => {
    cell.font = headerStyle.font
    cell.fill = headerStyle.fill
  })
  for (const row of data.detailRows) {
    ws2.addRow(row)
  }

  // Sheet 3: Par structure
  const ws3 = workbook.addWorksheet('Par structure')
  ws3.columns = [
    { header: 'Structure', key: 'nom', width: 30 },
    { header: 'Nb demandes', key: 'nbDemandes', width: 14 },
    { header: 'Nb PEC', key: 'nbPEC', width: 12 },
    { header: 'Nb terminees', key: 'nbTerminees', width: 14 },
    { header: 'Taux PEC', key: 'taux', width: 12 },
    { header: 'Temps moyen', key: 'tempsMoyen', width: 14 },
  ]
  ws3.getRow(1).eachCell(cell => {
    cell.font = headerStyle.font
    cell.fill = headerStyle.fill
  })
  for (const s of data.structureStats) {
    ws3.addRow({
      nom: s.nom,
      nbDemandes: s.nbDemandes,
      nbPEC: s.nbPEC,
      nbTerminees: s.nbTerminees,
      taux: `${s.taux}%`,
      tempsMoyen: `${s.tempsMoyen}h`,
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

async function generateBeneficiairesExcel(ctx: ExportContext) {
  const ExcelJS = (await import('exceljs')).default
  const data = await fetchBeneficiairesData(ctx)

  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Catch'Up"
  workbook.created = new Date()

  const ws = workbook.addWorksheet('Beneficiaires')
  ws.columns = [
    { header: 'Prenom', key: 'prenom', width: 18 },
    { header: 'Age', key: 'age', width: 8 },
    { header: 'Genre', key: 'genre', width: 12 },
    { header: 'Localisation', key: 'localisation', width: 18 },
    { header: 'Situation', key: 'situation', width: 18 },
    { header: 'Date demande', key: 'dateDemande', width: 14 },
    { header: 'Statut', key: 'statut', width: 16 },
    { header: 'Priorite', key: 'priorite', width: 12 },
    { header: 'Structure suggeree', key: 'structureSuggeree', width: 25 },
    { header: 'Conseiller assigne', key: 'conseillerAssigne', width: 22 },
    { header: 'Score matching', key: 'scoreMatching', width: 16 },
  ]

  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF6C63FF' } },
  }
  ws.getRow(1).eachCell(cell => {
    cell.font = headerStyle.font
    cell.fill = headerStyle.fill
  })

  for (const row of data) {
    ws.addRow(row)
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

async function generateStructuresExcel(ctx: ExportContext) {
  const ExcelJS = (await import('exceljs')).default
  const data = await fetchStructuresData(ctx)

  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Catch'Up"
  workbook.created = new Date()

  const ws = workbook.addWorksheet('Structures')
  ws.columns = [
    { header: 'Nom', key: 'nom', width: 30 },
    { header: 'Type', key: 'type', width: 18 },
    { header: 'Slug', key: 'slug', width: 20 },
    { header: 'Departements', key: 'departements', width: 25 },
    { header: 'Specialites', key: 'specialites', width: 30 },
    { header: 'Nb conseillers', key: 'nbConseillers', width: 16 },
    { header: 'Cas actifs', key: 'nbCasActifs', width: 14 },
    { header: 'Capacite max', key: 'capaciteMax', width: 14 },
    { header: 'Taux remplissage', key: 'tauxRemplissage', width: 18 },
  ]

  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF6C63FF' } },
  }
  ws.getRow(1).eachCell(cell => {
    cell.font = headerStyle.font
    cell.fill = headerStyle.fill
  })

  for (const row of data) {
    ws.addRow(row)
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// === Main handler ===

export async function GET(request: NextRequest) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!ctx.id) {
      return jsonError('Non authentifie', 401)
    }

    // Only admin_structure and super_admin can export
    if (!hasRole(ctx, 'admin_structure')) {
      return jsonError('Acces refuse', 403)
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'pdf'
    const type = searchParams.get('type') || 'activite'
    const from = searchParams.get('from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0]
    const structureIdFilter = searchParams.get('structureId') || null

    const exportCtx: ExportContext = {
      role: ctx.role,
      structureId: ctx.structureId,
      from: new Date(from).toISOString(),
      to: new Date(to + 'T23:59:59').toISOString(),
      filterStructureId: structureIdFilter,
    }

    // Determine structure name for reports
    let structureName = 'Toutes les structures'
    const effectiveStructureId = ctx.role === 'super_admin' && structureIdFilter
      ? structureIdFilter
      : ctx.role === 'admin_structure'
        ? ctx.structureId
        : null

    if (effectiveStructureId) {
      const s = await db
        .select({ nom: structure.nom })
        .from(structure)
        .where(eq(structure.id, effectiveStructureId))
      if (s.length > 0) {
        structureName = s[0].nom
      }
    }

    const now = new Date().toISOString().split('T')[0]

    if (type === 'activite') {
      if (format === 'pdf') {
        const buffer = await generateActivityPDF(exportCtx, structureName)
        return new Response(buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="rapport-activite-${now}.pdf"`,
          },
        })
      } else {
        const buffer = await generateActivityExcel(exportCtx, structureName)
        return new Response(buffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="rapport-activite-${now}.xlsx"`,
          },
        })
      }
    } else if (type === 'beneficiaires') {
      const buffer = await generateBeneficiairesExcel(exportCtx)
      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="beneficiaires-${now}.xlsx"`,
        },
      })
    } else if (type === 'structures') {
      const buffer = await generateStructuresExcel(exportCtx)
      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="structures-${now}.xlsx"`,
        },
      })
    }

    return jsonError('Type d\'export invalide', 400)
  } catch (err) {
    console.error('Erreur export:', err)
    return jsonError('Erreur lors de la generation de l\'export', 500)
  }
}
