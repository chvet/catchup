const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  Header, Footer, AlignmentType, LevelFormat, ExternalHyperlink,
  HeadingLevel, BorderStyle, WidthType, ShadingType, PageBreak, PageNumber,
  TabStopType, TabStopPosition
} = require('docx');

const logoPath = path.join(__dirname, '..', 'public', 'logo-catchup.png');
const logoBuffer = fs.readFileSync(logoPath);

// Colors
const PRIMARY = '6C63FF';
const DARK = '2D2B55';
const ACCENT = '4CAF50';
const ORANGE = 'FF9800';
const RED = 'E53E3E';
const LIGHT_BG = 'F5F3FF';
const WHITE = 'FFFFFF';
const GRAY = '666666';
const LIGHT_GRAY = 'F8F8F8';

// Page dimensions (A4)
const PAGE_WIDTH = 11906;
const PAGE_HEIGHT = 16838;
const MARGIN = 1440;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN; // 9026

const noBorder = { style: BorderStyle.NONE, size: 0, color: WHITE };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' };
const thinBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, size: 36, font: 'Arial', color: DARK })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, size: 28, font: 'Arial', color: PRIMARY })],
  });
}

function heading3(text) {
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 24, font: 'Arial', color: DARK })],
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
    children: [new TextRun({ text, size: 22, font: 'Arial', color: opts.color || '333333', ...opts })],
  });
}

function bulletItem(text, bold_prefix) {
  const children = [];
  if (bold_prefix) {
    children.push(new TextRun({ text: bold_prefix + ' ', bold: true, size: 22, font: 'Arial', color: DARK }));
  }
  children.push(new TextRun({ text, size: 22, font: 'Arial', color: '444444' }));
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { after: 80 },
    children,
  });
}

function spacer(height = 200) {
  return new Paragraph({ spacing: { before: height } });
}

function keyValueRow(key, value, shade = false) {
  const bg = shade ? LIGHT_BG : WHITE;
  return new TableRow({
    children: [
      new TableCell({
        borders: thinBorders,
        width: { size: 3200, type: WidthType.DXA },
        shading: { fill: bg, type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: key, bold: true, size: 20, font: 'Arial', color: DARK })] })],
      }),
      new TableCell({
        borders: thinBorders,
        width: { size: 5826, type: WidthType.DXA },
        shading: { fill: bg, type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: value, size: 20, font: 'Arial', color: '444444' })] })],
      }),
    ],
  });
}

function featureTable(rows) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [3200, 5826],
    rows: rows.map((r, i) => keyValueRow(r[0], r[1], i % 2 === 0)),
  });
}

// Build document
const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'Arial', color: DARK },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: PRIMARY },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: 'numbers',
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  sections: [
    // ============================================================
    // PAGE DE COUVERTURE
    // ============================================================
    {
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: [
        spacer(1200),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              type: 'png',
              data: logoBuffer,
              transformation: { width: 180, height: 180 },
              altText: { title: 'Logo Catch\'Up', description: 'Logo de la plateforme Catch\'Up', name: 'logo' },
            }),
          ],
        }),
        spacer(300),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: 'Catch\u2019Up', bold: true, size: 64, font: 'Arial', color: PRIMARY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: 'Ton guide orientation', size: 32, font: 'Arial', color: GRAY, italics: true })],
        }),
        spacer(400),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: PRIMARY, space: 8 }, bottom: { style: BorderStyle.SINGLE, size: 2, color: PRIMARY, space: 8 } },
          spacing: { before: 100, after: 100 },
          children: [new TextRun({ text: 'MANUEL COMMERCIAL', bold: true, size: 40, font: 'Arial', color: DARK })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: 'Version 2.0 Beta 007 \u2014 Avril 2026', size: 24, font: 'Arial', color: GRAY })],
        }),
        spacer(800),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: 'Fondation JAE', bold: true, size: 24, font: 'Arial', color: DARK })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: 'Plateforme d\u2019orientation et d\u2019accompagnement professionnel', size: 20, font: 'Arial', color: GRAY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'Document confidentiel \u2014 Usage interne', size: 18, font: 'Arial', color: RED, italics: true })],
        }),
      ],
    },

    // ============================================================
    // TABLE DES MATIERES + CONTENU PRINCIPAL
    // ============================================================
    {
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: PRIMARY, space: 4 } },
            children: [
              new TextRun({ text: 'Catch\u2019Up \u2014 Manuel Commercial', size: 16, font: 'Arial', color: GRAY, italics: true }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD', space: 4 } },
            children: [
              new TextRun({ text: 'Fondation JAE \u2014 Confidentiel \u2014 Page ', size: 16, font: 'Arial', color: GRAY }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, font: 'Arial', color: GRAY }),
            ],
          })],
        }),
      },
      children: [
        // TABLE DES MATIERES
        heading1('Table des mati\u00e8res'),
        spacer(100),
        para('1.  Pr\u00e9sentation g\u00e9n\u00e9rale'),
        para('2.  Le probl\u00e8me adress\u00e9'),
        para('3.  La solution Catch\u2019Up'),
        para('4.  Fonctionnalit\u00e9s cl\u00e9s \u2014 Espace B\u00e9n\u00e9ficiaire'),
        para('5.  Fonctionnalit\u00e9s cl\u00e9s \u2014 Espace Conseiller'),
        para('6.  Intelligence Artificielle'),
        para('7.  Accessibilit\u00e9 & Conformit\u00e9 RGAA'),
        para('8.  S\u00e9curit\u00e9 & Protection des donn\u00e9es'),
        para('9.  Architecture technique'),
        para('10. Publics cibles & March\u00e9'),
        para('11. Avantages concurrentiels'),
        para('12. Tarification & D\u00e9ploiement'),
        para('13. Contacts & Ressources'),
        new Paragraph({ children: [new PageBreak()] }),

        // ============================================================
        // 1. PRESENTATION GENERALE
        // ============================================================
        heading1('1. Pr\u00e9sentation g\u00e9n\u00e9rale'),
        para('Catch\u2019Up est une plateforme num\u00e9rique d\u2019orientation et d\u2019accompagnement professionnel d\u00e9velopp\u00e9e par la Fondation JAE. Elle combine intelligence artificielle conversationnelle et accompagnement humain pour aider les jeunes de 16 \u00e0 25 ans \u00e0 d\u00e9couvrir leur voie professionnelle.'),
        spacer(100),
        featureTable([
          ['Nom', 'Catch\u2019Up'],
          ['\u00c9diteur', 'Fondation JAE'],
          ['Version', 'V2.0 Beta 007 (Avril 2026)'],
          ['Technologie', 'Application web progressive (PWA) + App native Android'],
          ['H\u00e9bergement', 'Serveur d\u00e9di\u00e9 s\u00e9curis\u00e9 (France)'],
          ['IA', 'GPT-4o (OpenAI) via Vercel AI SDK'],
          ['Langues', '10 langues (FR, EN, AR, PT, TR, IT, ES, DE, RO, ZH)'],
          ['Accessibilit\u00e9', '71% de conformit\u00e9 RGAA 4.1'],
          ['URL Production', 'catchup.jaeprive.fr'],
        ]),
        new Paragraph({ children: [new PageBreak()] }),

        // ============================================================
        // 2. LE PROBLEME ADRESSE
        // ============================================================
        heading1('2. Le probl\u00e8me adress\u00e9'),
        para('Les structures d\u2019insertion et d\u2019orientation (Missions Locales, CIO, E2C, CIDJ\u2026) font face \u00e0 plusieurs d\u00e9fis majeurs :'),
        spacer(80),
        heading3('Pour les jeunes b\u00e9n\u00e9ficiaires'),
        bulletItem('Difficult\u00e9 \u00e0 identifier ses comp\u00e9tences et int\u00e9r\u00eats professionnels'),
        bulletItem('Manque d\u2019acc\u00e8s \u00e0 une information m\u00e9tier structur\u00e9e et personnalis\u00e9e'),
        bulletItem('Barri\u00e8res linguistiques pour les publics allophones'),
        bulletItem('D\u00e9crochage et perte de motivation dans les parcours d\u2019accompagnement'),
        bulletItem('Horaires inadapt\u00e9s : besoin d\u2019un acc\u00e8s 24h/24'),
        spacer(80),
        heading3('Pour les conseillers'),
        bulletItem('Volume croissant de demandes avec des moyens constants'),
        bulletItem('Difficult\u00e9 \u00e0 maintenir le lien avec les b\u00e9n\u00e9ficiaires entre les rendez-vous'),
        bulletItem('Manque d\u2019outils pour d\u00e9tecter les signaux faibles de d\u00e9crochage'),
        bulletItem('Suivi administratif chronophage r\u00e9duisant le temps d\u2019accompagnement'),
        bulletItem('Pas de vision consolid\u00e9e des indicateurs d\u2019activit\u00e9'),
        new Paragraph({ children: [new PageBreak()] }),

        // ============================================================
        // 3. LA SOLUTION
        // ============================================================
        heading1('3. La solution Catch\u2019Up'),
        para('Catch\u2019Up r\u00e9pond \u00e0 ces d\u00e9fis en proposant une plateforme int\u00e9gr\u00e9e qui combine :'),
        spacer(80),

        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [4513, 4513],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: noBorders,
                  width: { size: 4513, type: WidthType.DXA },
                  shading: { fill: LIGHT_BG, type: ShadingType.CLEAR },
                  margins: { top: 120, bottom: 120, left: 200, right: 200 },
                  children: [
                    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '\ud83e\udd16 IA Conversationnelle', bold: true, size: 24, font: 'Arial', color: PRIMARY })] }),
                    para('Un assistant IA disponible 24h/24, capable de guider le jeune dans sa r\u00e9flexion d\u2019orientation via un chat naturel et engageant.'),
                  ],
                }),
                new TableCell({
                  borders: noBorders,
                  width: { size: 4513, type: WidthType.DXA },
                  shading: { fill: LIGHT_BG, type: ShadingType.CLEAR },
                  margins: { top: 120, bottom: 120, left: 200, right: 200 },
                  children: [
                    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '\ud83d\udc65 Accompagnement humain', bold: true, size: 24, font: 'Arial', color: PRIMARY })] }),
                    para('Un conseiller humain prend le relais pour un accompagnement personnalis\u00e9 avec outils de suivi, agenda, et messagerie directe.'),
                  ],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: noBorders,
                  width: { size: 4513, type: WidthType.DXA },
                  shading: { fill: WHITE, type: ShadingType.CLEAR },
                  margins: { top: 120, bottom: 120, left: 200, right: 200 },
                  children: [
                    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '\ud83c\udfaf Profil RIASEC', bold: true, size: 24, font: 'Arial', color: PRIMARY })] }),
                    para('Un syst\u00e8me de profilage dynamique (mod\u00e8le Holland) qui s\u2019affine message apr\u00e8s message pour des recommandations de plus en plus pr\u00e9cises.'),
                  ],
                }),
                new TableCell({
                  borders: noBorders,
                  width: { size: 4513, type: WidthType.DXA },
                  shading: { fill: WHITE, type: ShadingType.CLEAR },
                  margins: { top: 120, bottom: 120, left: 200, right: 200 },
                  children: [
                    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '\ud83d\udcca Pilotage complet', bold: true, size: 24, font: 'Arial', color: PRIMARY })] }),
                    para('Dashboard, file active, campagnes, exports\u2026 Les structures disposent d\u2019un outil de gestion et de reporting complet.'),
                  ],
                }),
              ],
            }),
          ],
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // ============================================================
        // 4. ESPACE BENEFICIAIRE
        // ============================================================
        heading1('4. Fonctionnalit\u00e9s cl\u00e9s \u2014 Espace B\u00e9n\u00e9ficiaire'),
        para('L\u2019espace b\u00e9n\u00e9ficiaire est con\u00e7u pour \u00eatre intuitif, engageant et accessible. Il s\u2019adapte \u00e0 tous les \u00e9crans (smartphone, tablette, desktop).'),
        spacer(100),

        heading2('4.1 Chat IA intelligent'),
        bulletItem('Conversation naturelle avec un assistant IA (GPT-4o) disponible 24h/24'),
        bulletItem('R\u00e9ponses personnalis\u00e9es en fonction du profil RIASEC et du contexte'),
        bulletItem('D\u00e9tection automatique des signaux de fragilit\u00e9 psychologique'),
        bulletItem('Suggestions de m\u00e9tiers et de formations adapt\u00e9es'),
        bulletItem('Support multilingue : 10 langues avec changement instantan\u00e9'),
        spacer(80),

        heading2('4.2 Profil RIASEC dynamique'),
        bulletItem('Quiz d\u2019orientation initial en 3 questions (mod\u00e8le Holland)'),
        bulletItem('Profil qui s\u2019affine automatiquement \u00e0 chaque message \u00e9chang\u00e9'),
        bulletItem('Indice de confiance \u00e9volutif (d\u00e9but \u2192 \u00e9mergent \u2192 pr\u00e9cis \u2192 fiable)'),
        bulletItem('Visualisation radar interactive des 6 dimensions RIASEC'),
        bulletItem('Gamification : badges, streaks, progression'),
        spacer(80),

        heading2('4.3 Messagerie avec le conseiller'),
        bulletItem('Acc\u00e8s s\u00e9curis\u00e9 par code PIN (SMS ou email)'),
        bulletItem('Chat en temps r\u00e9el avec son conseiller r\u00e9f\u00e9rent'),
        bulletItem('Partage de documents et fiches m\u00e9tiers'),
        bulletItem('Visioconf\u00e9rence int\u00e9gr\u00e9e (WebRTC)'),
        bulletItem('Notifications push pour les nouveaux messages'),
        spacer(80),

        heading2('4.4 Fonctionnalit\u00e9s multim\u00e9dia'),
        bulletItem('Enregistrement vocal avec transcription automatique (Whisper)'),
        bulletItem('Synth\u00e8se vocale (TTS) sur chaque message pour l\u2019accessibilit\u00e9'),
        bulletItem('Appels vid\u00e9o pair-\u00e0-pair avec le conseiller'),
        spacer(80),

        heading2('4.5 Gestion des rendez-vous'),
        bulletItem('Visualisation des rendez-vous planifi\u00e9s'),
        bulletItem('D\u00e9tails : date, heure, lieu, lien vid\u00e9o si applicable'),
        bulletItem('Rappels automatiques par SMS/email et notifications push'),
        new Paragraph({ children: [new PageBreak()] }),

        // ============================================================
        // 5. ESPACE CONSEILLER
        // ============================================================
        heading1('5. Fonctionnalit\u00e9s cl\u00e9s \u2014 Espace Conseiller'),
        para('L\u2019espace conseiller est un v\u00e9ritable outil de pilotage qui couvre l\u2019ensemble du parcours d\u2019accompagnement.'),
        spacer(100),

        heading2('5.1 Dashboard analytique'),
        bulletItem('KPI en temps r\u00e9el : demandes en attente, accompagnements actifs, taux de prise en charge'),
        bulletItem('Graphiques d\u2019\u00e9volution sur 30 jours'),
        bulletItem('Distribution des statuts et des urgences'),
        bulletItem('R\u00e9partition des profils RIASEC'),
        bulletItem('Score NPS (satisfaction b\u00e9n\u00e9ficiaire)'),
        bulletItem('Alertes critiques (d\u00e9crochage, surcharge, inactivit\u00e9)'),
        spacer(80),

        heading2('5.2 File active'),
        bulletItem('Liste compl\u00e8te des dossiers assign\u00e9s avec filtrage avanc\u00e9'),
        bulletItem('Filtres : statut, urgence, campagne, recherche textuelle'),
        bulletItem('Tri par nom, priorit\u00e9, \u00e2ge, profil RIASEC, moyen de contact'),
        bulletItem('Vue tableau ou vue cartes d\u00e9taill\u00e9es'),
        bulletItem('Fiche d\u00e9taill\u00e9e du b\u00e9n\u00e9ficiaire avec tout l\u2019historique'),
        bulletItem('Messagerie directe int\u00e9gr\u00e9e dans chaque fiche'),
        spacer(80),

        heading2('5.3 Agenda & Rendez-vous'),
        bulletItem('Vue jour/semaine/liste'),
        bulletItem('Cr\u00e9ation, modification et annulation de rendez-vous'),
        bulletItem('Synchronisation Google Calendar et Outlook'),
        bulletItem('Export ICS pour tout agenda'),
        bulletItem('Rappels automatiques au b\u00e9n\u00e9ficiaire (SMS/email/push)'),
        spacer(80),

        heading2('5.4 Assistant IA pour le conseiller'),
        bulletItem('Bulle flottante accessible sur toutes les pages de l\u2019espace conseiller'),
        bulletItem('Sugg\u00e8re des approches p\u00e9dagogiques adapt\u00e9es au profil'),
        bulletItem('Recommande des formations et m\u00e9tiers en lien avec le RIASEC'),
        bulletItem('Aide \u00e0 la r\u00e9daction de messages d\u2019accompagnement'),
        bulletItem('D\u00e9tecte et signale les signaux de vuln\u00e9rabilit\u00e9'),
        spacer(80),

        heading2('5.5 Gestion des tiers'),
        bulletItem('Invitation de tiers intervenants (employeurs, formateurs, \u00e9ducateurs)'),
        bulletItem('Workflow de consentement : approbation conseiller + accord b\u00e9n\u00e9ficiaire'),
        bulletItem('Messagerie d\u00e9di\u00e9e avec les tiers'),
        spacer(80),

        heading2('5.6 Campagnes & Objectifs'),
        bulletItem('Cr\u00e9ation et suivi de campagnes avec objectifs chiffr\u00e9s'),
        bulletItem('Unit\u00e9s : b\u00e9n\u00e9ficiaires, leads, prises en charge, RDV, cl\u00f4tures'),
        bulletItem('Jauges de progression visuelles'),
        bulletItem('Alertes de d\u00e9lai'),
        spacer(80),

        heading2('5.7 Administration (admin_structure / super_admin)'),
        bulletItem('Gestion des structures (types, d\u00e9partements, capacit\u00e9, logos)'),
        bulletItem('Gestion des comptes conseillers (r\u00f4les, affectations)'),
        bulletItem('Statistiques inter-structures'),
        bulletItem('Export de donn\u00e9es (Excel)'),
        bulletItem('Carte de France interactive avec r\u00e9partition g\u00e9ographique'),
        new Paragraph({ children: [new PageBreak()] }),

        // ============================================================
        // 6. INTELLIGENCE ARTIFICIELLE
        // ============================================================
        heading1('6. Intelligence Artificielle'),
        para('L\u2019IA est au c\u0153ur de Catch\u2019Up. Elle intervient \u00e0 plusieurs niveaux pour enrichir l\u2019exp\u00e9rience et am\u00e9liorer l\u2019efficacit\u00e9 de l\u2019accompagnement.'),
        spacer(100),

        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [2500, 6526],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: thinBorders,
                  width: { size: 2500, type: WidthType.DXA },
                  shading: { fill: DARK, type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Composant', bold: true, size: 20, font: 'Arial', color: WHITE })] })],
                }),
                new TableCell({
                  borders: thinBorders,
                  width: { size: 6526, type: WidthType.DXA },
                  shading: { fill: DARK, type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Description', bold: true, size: 20, font: 'Arial', color: WHITE })] })],
                }),
              ],
            }),
            ...[
              ['Chat conversationnel', 'GPT-4o en streaming. R\u00e9ponses personnalis\u00e9es selon le profil RIASEC, l\u2019historique, la langue, et le niveau de fragilit\u00e9 d\u00e9tect\u00e9.'],
              ['Profilage dynamique', 'Extraction automatique des dimensions RIASEC \u00e0 chaque message. Indice de confiance croissant au fil de la conversation.'],
              ['D\u00e9tection fragilit\u00e9', 'Analyse des signaux de vuln\u00e9rabilit\u00e9 psychologique (niveaux 0 \u00e0 3). Alerte automatique au conseiller en cas de niveau critique.'],
              ['Assistant conseiller', 'IA d\u00e9di\u00e9e au conseiller pour sugg\u00e9rer des approches, recommander des m\u00e9tiers, et aider \u00e0 la r\u00e9daction.'],
              ['Transcription vocale', 'Whisper (OpenAI) pour convertir les messages vocaux en texte. Support multi-format audio.'],
              ['Synth\u00e8se vocale', 'TTS int\u00e9gr\u00e9 sur chaque message pour les publics en difficult\u00e9 de lecture.'],
            ].map(([k, v], i) => new TableRow({
              children: [
                new TableCell({
                  borders: thinBorders,
                  width: { size: 2500, type: WidthType.DXA },
                  shading: { fill: i % 2 === 0 ? LIGHT_BG : WHITE, type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 20, font: 'Arial', color: DARK })] })],
                }),
                new TableCell({
                  borders: thinBorders,
                  width: { size: 6526, type: WidthType.DXA },
                  shading: { fill: i % 2 === 0 ? LIGHT_BG : WHITE, type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text: v, size: 20, font: 'Arial', color: '444444' })] })],
                }),
              ],
            })),
          ],
        }),

        spacer(200),
        new Paragraph({
          spacing: { after: 120 },
          shading: { fill: 'FFF3E0', type: ShadingType.CLEAR },
          border: { left: { style: BorderStyle.SINGLE, size: 6, color: ORANGE, space: 8 } },
          indent: { left: 200 },
          children: [
            new TextRun({ text: '\u26a0\ufe0f Important : ', bold: true, size: 20, font: 'Arial', color: ORANGE }),
            new TextRun({ text: 'L\u2019IA ne se substitue jamais au conseiller humain. Elle ne fournit ni diagnostic ni conseil professionnel d\u00e9finitif. Le conseiller reste le r\u00e9f\u00e9rent principal du parcours d\u2019accompagnement.', size: 20, font: 'Arial', color: '444444' }),
          ],
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // ============================================================
        // 7. ACCESSIBILITE & RGAA
        // ============================================================
        heading1('7. Accessibilit\u00e9 & Conformit\u00e9 RGAA'),
        para('Catch\u2019Up int\u00e8gre l\u2019accessibilit\u00e9 comme principe fondamental de conception, visant la conformit\u00e9 avec le r\u00e9f\u00e9rentiel RGAA 4.1 (R\u00e9f\u00e9rentiel G\u00e9n\u00e9ral d\u2019Am\u00e9lioration de l\u2019Accessibilit\u00e9).'),
        spacer(100),

        heading2('Score actuel : 71% de conformit\u00e9'),
        spacer(80),

        heading3('Crit\u00e8res conformes (11/14)'),
        bulletItem('Navigation au clavier compl\u00e8te'),
        bulletItem('Labels ARIA et HTML s\u00e9mantique'),
        bulletItem('Contraste des couleurs niveau AA'),
        bulletItem('Taille de police ajustable (3 niveaux)'),
        bulletItem('Espacement des lignes configurable'),
        bulletItem('Mode contraste \u00e9lev\u00e9'),
        bulletItem('R\u00e9duction des animations'),
        bulletItem('Synth\u00e8se vocale (TTS) sur chaque message'),
        bulletItem('Support multilingue (10 langues)'),
        bulletItem('Formulaires accessibles'),
        bulletItem('Textes alternatifs sur les images'),
        spacer(80),

        heading3('En cours d\u2019am\u00e9lioration (2/14)'),
        bulletItem('Tests lecteur d\u2019\u00e9cran en cours'),
        bulletItem('Textes alternatifs des avatars \u00e0 compl\u00e9ter'),
        spacer(80),

        heading3('Pr\u00e9vu (1/14)'),
        bulletItem('Sous-titres et transcriptions pour le contenu multim\u00e9dia'),
        spacer(80),

        heading2('10 langues support\u00e9es'),
        para('Fran\u00e7ais, anglais, arabe, portugais, turc, italien, espagnol, allemand, roumain et chinois. Le changement de langue est instantan\u00e9, y compris en pleine conversation.'),
        new Paragraph({ children: [new PageBreak()] }),

        // ============================================================
        // 8. SECURITE & RGPD
        // ============================================================
        heading1('8. S\u00e9curit\u00e9 & Protection des donn\u00e9es'),
        spacer(100),

        heading2('Protection des donn\u00e9es personnelles'),
        bulletItem('Donn\u00e9es stock\u00e9es localement sur l\u2019appareil du b\u00e9n\u00e9ficiaire (localStorage)'),
        bulletItem('Aucun cookie publicitaire'),
        bulletItem('Consentement explicite avant tout partage de donn\u00e9es (CGU bloquant)'),
        bulletItem('Contact DPO : dpo@fondation-jae.org'),
        spacer(80),

        heading2('Authentification & Acc\u00e8s'),
        bulletItem('Code PIN \u00e0 usage unique pour les b\u00e9n\u00e9ficiaires (envoy\u00e9 par SMS ou email)'),
        bulletItem('Authentification conseiller par email/mot de passe avec token JWT'),
        bulletItem('Gestion des r\u00f4les : conseiller, admin_structure, super_admin'),
        bulletItem('Workflow de consentement pour l\u2019implication de tiers'),
        spacer(80),

        heading2('Infrastructure'),
        bulletItem('Serveur d\u00e9di\u00e9 h\u00e9berg\u00e9 en France'),
        bulletItem('HTTPS obligatoire avec en-t\u00eates de s\u00e9curit\u00e9 (CSP, X-Frame-Options, etc.)'),
        bulletItem('Base de donn\u00e9es PostgreSQL s\u00e9curis\u00e9e'),
        bulletItem('Mises \u00e0 jour automatiques avec d\u00e9tection de version'),
        spacer(80),

        heading2('Suivi de d\u00e9livrance'),
        bulletItem('Suivi en temps r\u00e9el de la d\u00e9livrance des SMS (Vonage DLR)'),
        bulletItem('Suivi de la d\u00e9livrance des emails (webhooks Brevo)'),
        bulletItem('Journalisation compl\u00e8te de toutes les notifications envoy\u00e9es'),
        new Paragraph({ children: [new PageBreak()] }),

        // ============================================================
        // 9. ARCHITECTURE TECHNIQUE
        // ============================================================
        heading1('9. Architecture technique'),
        spacer(100),

        featureTable([
          ['Framework', 'Next.js 14 (TypeScript, App Router)'],
          ['Frontend', 'React 18 + Tailwind CSS'],
          ['Base de donn\u00e9es', 'PostgreSQL + Drizzle ORM'],
          ['IA', 'OpenAI GPT-4o via Vercel AI SDK'],
          ['Transcription', 'OpenAI Whisper'],
          ['SMS', 'Vonage (principal) + OVH (fallback)'],
          ['Email', 'SMTP + Office 365 Graph + Brevo'],
          ['Push', 'Web Push API (VAPID)'],
          ['Visio', 'WebRTC P2P'],
          ['PWA', 'Service Worker v3 + manifest'],
          ['App native', 'Capacitor (Android)'],
          ['D\u00e9ploiement', 'Docker + CI/CD'],
          ['Calendrier', 'Google Calendar + Outlook (OAuth 2.0)'],
        ]),
        new Paragraph({ children: [new PageBreak()] }),

        // ============================================================
        // 10. PUBLICS CIBLES & MARCHE
        // ============================================================
        heading1('10. Publics cibles & March\u00e9'),
        spacer(100),

        heading2('Structures vis\u00e9es'),

        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [3000, 6026],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: thinBorders, width: { size: 3000, type: WidthType.DXA },
                  shading: { fill: DARK, type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Type de structure', bold: true, size: 20, font: 'Arial', color: WHITE })] })],
                }),
                new TableCell({
                  borders: thinBorders, width: { size: 6026, type: WidthType.DXA },
                  shading: { fill: DARK, type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Description', bold: true, size: 20, font: 'Arial', color: WHITE })] })],
                }),
              ],
            }),
            ...[
              ['Missions Locales', 'Accompagnement des 16-25 ans dans l\u2019insertion professionnelle. Plus de 440 structures en France.'],
              ['CIO', 'Centres d\u2019Information et d\u2019Orientation de l\u2019\u00c9ducation nationale.'],
              ['E2C', '\u00c9coles de la Deuxi\u00e8me Chance pour les jeunes d\u00e9crocheurs.'],
              ['CIDJ', 'Centres d\u2019Information et de Documentation Jeunesse.'],
              ['Structures priv\u00e9es', 'Cabinets de conseil en orientation, organismes de formation.'],
              ['Collectivit\u00e9s', 'Services jeunesse des communes et d\u00e9partements.'],
            ].map(([k, v], i) => new TableRow({
              children: [
                new TableCell({
                  borders: thinBorders, width: { size: 3000, type: WidthType.DXA },
                  shading: { fill: i % 2 === 0 ? LIGHT_BG : WHITE, type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 20, font: 'Arial', color: DARK })] })],
                }),
                new TableCell({
                  borders: thinBorders, width: { size: 6026, type: WidthType.DXA },
                  shading: { fill: i % 2 === 0 ? LIGHT_BG : WHITE, type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text: v, size: 20, font: 'Arial', color: '444444' })] })],
                }),
              ],
            })),
          ],
        }),

        spacer(200),
        heading2('B\u00e9n\u00e9ficiaires finaux'),
        bulletItem('Jeunes de 16 \u00e0 25 ans en recherche d\u2019orientation'),
        bulletItem('Publics allophones (10 langues support\u00e9es)'),
        bulletItem('Publics en situation de handicap (accessibilit\u00e9 renforc\u00e9e)'),
        bulletItem('Jeunes en d\u00e9crochage scolaire ou professionnel'),
        new Paragraph({ children: [new PageBreak()] }),

        // ============================================================
        // 11. AVANTAGES CONCURRENTIELS
        // ============================================================
        heading1('11. Avantages concurrentiels'),
        spacer(100),

        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [4513, 4513],
          rows: [
            ...[
              ['\u2705 IA de pointe', 'GPT-4o en streaming avec profilage RIASEC dynamique et d\u00e9tection de fragilit\u00e9. Aucun concurrent ne propose ce niveau d\u2019intelligence contextuelle.'],
              ['\u2705 Accessibilit\u00e9 exemplaire', '71% RGAA, 10 langues, TTS sur chaque message, mode contraste, navigation clavier. Peu de plateformes d\u2019orientation atteignent ce niveau.'],
              ['\u2705 Solution tout-en-un', 'Chat IA + accompagnement humain + visio + agenda + campagnes + admin dans une seule plateforme.'],
              ['\u2705 Multi-canal', 'SMS, email, push, visio\u2026 tous les canaux de communication int\u00e9gr\u00e9s avec suivi de d\u00e9livrance.'],
              ['\u2705 Mobile-first', 'PWA + app native Android. Fonctionne hors-ligne. Responsive jusqu\u2019aux \u00e9crans pliables.'],
              ['\u2705 Souverainet\u00e9', 'H\u00e9bergement France, pas de cookie publicitaire, RGPD-compliant, donn\u00e9es b\u00e9n\u00e9ficiaire en local.'],
            ].map(([k, v], i) => new TableRow({
              children: [
                new TableCell({
                  borders: thinBorders, width: { size: 4513, type: WidthType.DXA },
                  shading: { fill: i % 2 === 0 ? LIGHT_BG : WHITE, type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 150, right: 150 },
                  children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 22, font: 'Arial', color: DARK })] })],
                }),
                new TableCell({
                  borders: thinBorders, width: { size: 4513, type: WidthType.DXA },
                  shading: { fill: i % 2 === 0 ? LIGHT_BG : WHITE, type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 150, right: 150 },
                  children: [new Paragraph({ children: [new TextRun({ text: v, size: 20, font: 'Arial', color: '444444' })] })],
                }),
              ],
            })),
          ],
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // ============================================================
        // 12. TARIFICATION & DEPLOIEMENT
        // ============================================================
        heading1('12. Tarification & D\u00e9ploiement'),
        spacer(100),

        heading2('Mod\u00e8le de d\u00e9ploiement'),
        bulletItem('D\u00e9ploiement SaaS avec URL d\u00e9di\u00e9e par structure'),
        bulletItem('Personnalisation : logo, couleurs, prompt IA, d\u00e9partements couverts'),
        bulletItem('Mise en service en moins de 48h'),
        bulletItem('Formation des conseillers incluse'),
        bulletItem('Support technique par email : support@fondation-jae.org'),
        spacer(100),

        heading2('Options de personnalisation'),

        featureTable([
          ['Logo & marque', 'Logo structure affich\u00e9 dans la sidebar et les en-t\u00eates'],
          ['Prompt IA', 'Personnalisation du comportement de l\u2019assistant IA'],
          ['D\u00e9partements', 'Configuration des d\u00e9partements g\u00e9ographiques couverts'],
          ['Capacit\u00e9', 'Limite de b\u00e9n\u00e9ficiaires configurable par structure'],
          ['Tranche d\u2019\u00e2ge', 'Personnalisation de la tranche d\u2019\u00e2ge cibl\u00e9e'],
          ['Sp\u00e9cialit\u00e9s', 'Tags de sp\u00e9cialisation (insertion, orientation, formation\u2026)'],
        ]),
        spacer(200),

        new Paragraph({
          spacing: { after: 120 },
          shading: { fill: 'E8F5E9', type: ShadingType.CLEAR },
          border: { left: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 8 } },
          indent: { left: 200 },
          children: [
            new TextRun({ text: '\ud83d\udcac Contactez-nous ', bold: true, size: 22, font: 'Arial', color: ACCENT }),
            new TextRun({ text: 'pour obtenir un devis adapt\u00e9 \u00e0 votre structure et vos besoins. Les tarifs d\u00e9pendent du nombre de conseillers, du volume de b\u00e9n\u00e9ficiaires et des options de personnalisation.', size: 20, font: 'Arial', color: '444444' }),
          ],
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // ============================================================
        // 13. CONTACTS & RESSOURCES
        // ============================================================
        heading1('13. Contacts & Ressources'),
        spacer(100),

        featureTable([
          ['Site web', 'catchup.jaeprive.fr'],
          ['Support technique', 'support@fondation-jae.org'],
          ['DPO (donn\u00e9es personnelles)', 'dpo@fondation-jae.org'],
          ['\u00c9diteur', 'Fondation JAE'],
          ['Version actuelle', 'V2.0 Beta 007 \u2014 Avril 2026'],
        ]),

        spacer(400),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [
            new ImageRun({
              type: 'png',
              data: logoBuffer,
              transformation: { width: 80, height: 80 },
              altText: { title: 'Logo Catch\'Up', description: 'Logo', name: 'logo-footer' },
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: 'Catch\u2019Up \u2014 Ton guide orientation', bold: true, size: 24, font: 'Arial', color: PRIMARY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: 'Fondation JAE \u2014 Au service de l\u2019orientation professionnelle des jeunes', size: 18, font: 'Arial', color: GRAY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'Document confidentiel \u2014 V2.0 Beta 007 \u2014 Avril 2026', size: 16, font: 'Arial', color: 'AAAAAA', italics: true })],
        }),
      ],
    },
  ],
});

// Generate
const outputPath = path.join(__dirname, '..', 'Manuel_Commercial_CatchUp_V2.0.docx');
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Manuel généré : ${outputPath}`);
  console.log(`   Taille : ${(buffer.length / 1024).toFixed(1)} Ko`);
});
