import { NextRequest, NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'

const JAE_API_BASE = 'https://agents.jaeprive.fr'

// A4 dimensions in mm
const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 20
const CONTENT_W = PAGE_W - MARGIN * 2
const FOOTER_Y = PAGE_H - 12

// Colors
const PURPLE = [108, 99, 255] as const  // #6C63FF
const DARK = [51, 51, 51] as const       // #333
const GRAY = [102, 102, 102] as const    // #666
const LIGHT_GRAY = [200, 200, 200] as const

interface FicheData {
  code_rome: string
  nom_epicene: string
  description?: string
  description_courte?: string
  missions_principales?: string[] | string
  competences?: string[] | string
  competences_transversales?: string[] | string
  formations?: string[] | string
  certifications?: string[] | string
  salaires?: string
  perspectives?: string
  conditions_travail?: string
  conditions_travail_detaillees?: string
  profil_riasec?: string
  traits_personnalite?: string[] | string
  aptitudes?: string[] | string
  savoirs?: string[] | string
  autres_appellations?: string[] | string
  secteurs_activite?: string[] | string
  environnements?: string[] | string
}

function toArray(data: string[] | string | undefined): string[] {
  if (!data) return []
  if (Array.isArray(data)) return data.filter(Boolean)
  return data.split('\n').map(s => s.trim()).filter(Boolean)
}

function buildPdf(fiche: FicheData): Uint8Array {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  let y = MARGIN
  let pageNum = 1

  function addFooter() {
    doc.setFontSize(8)
    doc.setTextColor(...GRAY)
    doc.text(
      'Source : Fondation JAE \u2014 Parcoureo | G\u00e9n\u00e9r\u00e9 par Catch\'Up',
      MARGIN,
      FOOTER_Y
    )
    doc.text(
      `Page ${pageNum}`,
      PAGE_W - MARGIN,
      FOOTER_Y,
      { align: 'right' }
    )
  }

  function checkPageBreak(needed: number) {
    if (y + needed > FOOTER_Y - 5) {
      addFooter()
      doc.addPage()
      pageNum++
      y = MARGIN
    }
  }

  function addWrappedText(text: string, fontSize: number, color: readonly [number, number, number], indent = 0): void {
    doc.setFontSize(fontSize)
    doc.setTextColor(...color)
    doc.setFont('helvetica', 'normal')
    const maxW = CONTENT_W - indent
    const lines = doc.splitTextToSize(text, maxW) as string[]
    const lineH = fontSize * 0.45

    for (const line of lines) {
      checkPageBreak(lineH + 1)
      doc.text(line, MARGIN + indent, y)
      y += lineH
    }
    y += 2
  }

  function addSectionTitle(title: string) {
    checkPageBreak(14)
    y += 4

    // Purple section header
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...PURPLE)
    doc.text(title, MARGIN, y)
    y += 2

    // Thin purple line under section title
    doc.setDrawColor(...PURPLE)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, y, MARGIN + CONTENT_W, y)
    y += 5
  }

  function addBulletList(items: string[], indent = 4) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK)

    for (const item of items) {
      const maxW = CONTENT_W - indent - 4
      const lines = doc.splitTextToSize(item, maxW) as string[]
      const blockH = lines.length * 5

      checkPageBreak(blockH + 2)

      // Bullet
      doc.setTextColor(...PURPLE)
      doc.text('\u2022', MARGIN + indent, y)
      doc.setTextColor(...DARK)

      for (let i = 0; i < lines.length; i++) {
        doc.text(lines[i], MARGIN + indent + 4, y)
        y += 5
      }
      y += 1
    }
    y += 2
  }

  // ========= HEADER =========
  // Logo text
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...PURPLE)
  doc.text("Catch'Up \u00d7 Fondation JAE", MARGIN, y)

  // Code ROME badge (right)
  const badgeText = fiche.code_rome || ''
  const badgeW = doc.getTextWidth(badgeText) + 8
  doc.setFillColor(...PURPLE)
  doc.roundedRect(PAGE_W - MARGIN - badgeW, y - 5, badgeW, 7, 2, 2, 'F')
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.text(badgeText, PAGE_W - MARGIN - badgeW + 4, y - 0.5)

  y += 10

  // Title
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK)
  const titleLines = doc.splitTextToSize(fiche.nom_epicene || '', CONTENT_W) as string[]
  for (const line of titleLines) {
    checkPageBreak(12)
    doc.text(line, MARGIN, y)
    y += 10
  }

  // Subtitle
  if (fiche.description_courte) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...GRAY)
    const subLines = doc.splitTextToSize(fiche.description_courte, CONTENT_W) as string[]
    for (const line of subLines) {
      checkPageBreak(6)
      doc.text(line, MARGIN, y)
      y += 5
    }
    y += 2
  }

  // Purple separator line
  doc.setDrawColor(...PURPLE)
  doc.setLineWidth(0.8)
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y)
  y += 8

  // ========= SECTION 1: Description =========
  const description = fiche.description || fiche.description_courte
  if (description) {
    addSectionTitle('Description')
    addWrappedText(description, 11, DARK)
  }

  // ========= SECTION 2: Missions principales =========
  const missions = toArray(fiche.missions_principales)
  if (missions.length > 0) {
    addSectionTitle('Missions principales')
    addBulletList(missions)
  }

  // ========= SECTION 3: Comp\u00e9tences =========
  const competences = toArray(fiche.competences)
  const compTransversales = toArray(fiche.competences_transversales)
  if (competences.length > 0 || compTransversales.length > 0) {
    addSectionTitle('Comp\u00e9tences')

    if (competences.length > 0) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...DARK)
      checkPageBreak(8)
      doc.text('Comp\u00e9tences cl\u00e9s', MARGIN, y)
      y += 5
      addBulletList(competences)
    }

    if (compTransversales.length > 0) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...DARK)
      checkPageBreak(8)
      doc.text('Comp\u00e9tences transversales', MARGIN, y)
      y += 5
      addBulletList(compTransversales)
    }
  }

  // ========= SECTION 4: Formations & acc\u00e8s =========
  const formations = toArray(fiche.formations)
  const certifications = toArray(fiche.certifications)
  if (formations.length > 0 || certifications.length > 0) {
    addSectionTitle('Formations & acc\u00e8s')

    if (formations.length > 0) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...DARK)
      checkPageBreak(8)
      doc.text('Formations', MARGIN, y)
      y += 5
      addBulletList(formations)
    }

    if (certifications.length > 0) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...DARK)
      checkPageBreak(8)
      doc.text('Certifications', MARGIN, y)
      y += 5
      addBulletList(certifications)
    }
  }

  // ========= SECTION 5: Salaires =========
  if (fiche.salaires) {
    addSectionTitle('Salaires')
    addWrappedText(fiche.salaires, 11, DARK)
  }

  // ========= SECTION 6: Conditions de travail =========
  const conditionsTravail = fiche.conditions_travail || fiche.conditions_travail_detaillees
  if (conditionsTravail) {
    addSectionTitle('Conditions de travail')
    addWrappedText(conditionsTravail, 11, DARK)
  }

  // ========= SECTION 7: Perspectives d'\u00e9volution =========
  if (fiche.perspectives) {
    addSectionTitle("Perspectives d'\u00e9volution")
    addWrappedText(fiche.perspectives, 11, DARK)
  }

  // ========= SECTION 8: Profil RIASEC =========
  if (fiche.profil_riasec) {
    addSectionTitle('Profil RIASEC')

    const riasecLabels: Record<string, string> = {
      R: 'R\u00e9aliste',
      I: 'Investigateur',
      A: 'Artiste',
      S: 'Social',
      E: 'Entreprenant',
      C: 'Conventionnel',
    }

    const chars = fiche.profil_riasec.toUpperCase().split('').filter(c => riasecLabels[c])
    if (chars.length > 0) {
      const riasecItems = chars.map(c => `${c} : ${riasecLabels[c]}`)
      addBulletList(riasecItems)
    }
  }

  // ========= Optional extras =========
  const traits = toArray(fiche.traits_personnalite)
  if (traits.length > 0) {
    addSectionTitle('Traits de personnalit\u00e9')
    addBulletList(traits)
  }

  const aptitudes = toArray(fiche.aptitudes)
  if (aptitudes.length > 0) {
    addSectionTitle('Aptitudes')
    addBulletList(aptitudes)
  }

  const savoirs = toArray(fiche.savoirs)
  if (savoirs.length > 0) {
    addSectionTitle('Savoirs')
    addBulletList(savoirs)
  }

  const appellations = toArray(fiche.autres_appellations)
  if (appellations.length > 0) {
    addSectionTitle('Autres appellations')
    addBulletList(appellations)
  }

  const secteurs = toArray(fiche.secteurs_activite)
  if (secteurs.length > 0) {
    addSectionTitle("Secteurs d'activit\u00e9")
    addBulletList(secteurs)
  }

  // Add footer on last page
  addFooter()

  // Return as Uint8Array (compatible with NextResponse body)
  const arrayBuffer = doc.output('arraybuffer')
  return new Uint8Array(arrayBuffer)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params

    if (!code) {
      return NextResponse.json(
        { error: 'Le code ROME est requis' },
        { status: 400 }
      )
    }

    // Fetch fiche data from JAE API
    const url = `${JAE_API_BASE}/api/fiches/${encodeURIComponent(code)}`
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 86400 },
    })

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json(
          { error: 'Fiche m\u00e9tier non trouv\u00e9e' },
          { status: 404 }
        )
      }
      console.error(`[fiches/${code}/pdf] JAE API error: ${res.status}`)
      return NextResponse.json(
        { error: 'Erreur lors de la r\u00e9cup\u00e9ration de la fiche m\u00e9tier' },
        { status: 502 }
      )
    }

    const fiche: FicheData = await res.json()

    // Generate PDF
    const pdfBuffer = buildPdf(fiche)

    // Sanitize filename
    const safeName = (fiche.nom_epicene || code)
      .replace(/[^a-zA-Z0-9\u00C0-\u024F\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 80)

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Fiche_${safeName}_${code}.pdf"`,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error('[fiches/pdf] Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la g\u00e9n\u00e9ration du PDF' },
      { status: 500 }
    )
  }
}
