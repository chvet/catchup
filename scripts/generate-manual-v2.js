const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  Header, Footer, AlignmentType, LevelFormat, ExternalHyperlink,
  HeadingLevel, BorderStyle, WidthType, ShadingType, PageBreak, PageNumber,
  TabStopType, TabStopPosition, TableOfContents, Bookmark, InternalHyperlink,
} = require('docx');

// ─── Assets ───────────────────────────────────────────────────────────────
const logoPath = path.join(__dirname, '..', 'public', 'logo-catchup.png');
const logoBuffer = fs.readFileSync(logoPath);

// Load screenshots from screenshots/ directory
const ssDir = path.join(__dirname, '..', 'screenshots');
function loadSS(filename) {
  const fp = path.join(ssDir, filename);
  if (fs.existsSync(fp)) return { buffer: fs.readFileSync(fp), ext: 'png' };
  console.warn(`Screenshot not found: ${filename}`);
  return null;
}

const ssLogin = loadSS('01_login_conseiller.png');
const ssDashboard = loadSS('02_dashboard.png');
const ssFileActive = loadSS('03_file_active.png');
const ssFicheBenef = loadSS('04_fiche_beneficiaire.png');
const ssAgenda = loadSS('05_agenda.png');
const ssCampagnes = loadSS('06_campagnes.png');
const ssAccueil = loadSS('07_accueil_beneficiaire.png');
const ssFicheMessages = loadSS('08_fiche_avec_messages.png');
const ssChatMobile = loadSS('10_chat_beneficiaire_mobile.png');
const ssStructures = loadSS('11_structures.png');
const ssConseillers = loadSS('12_conseillers.png');
const ssAdmin = loadSS('13_admin.png');
const ssParametres = loadSS('14_parametres.png');

// ─── Colors ───────────────────────────────────────────────────────────────
const PRIMARY = '6C63FF';
const PRIMARY_DARK = '5A52E0';
const DARK = '2D2B55';
const ACCENT = '4CAF50';
const ORANGE = 'FF9800';
const RED = 'E53E3E';
const LIGHT_BG = 'F5F3FF';
const WHITE = 'FFFFFF';
const GRAY = '666666';
const LIGHT_GRAY = 'F8F8F8';
const MID_GRAY = '999999';

// ─── Page dimensions (A4) ─────────────────────────────────────────────────
const PAGE_WIDTH = 11906;
const PAGE_HEIGHT = 16838;
const MARGIN = 1440;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN; // 9026

// ─── Borders ──────────────────────────────────────────────────────────────
const noBorder = { style: BorderStyle.NONE, size: 0, color: WHITE };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' };
const thinBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const primaryBorder = { style: BorderStyle.SINGLE, size: 2, color: PRIMARY };

// ─── Helpers ──────────────────────────────────────────────────────────────

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 240 },
    children: [new TextRun({ text, bold: true, size: 36, font: 'Arial', color: DARK })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 180 },
    children: [new TextRun({ text, bold: true, size: 28, font: 'Arial', color: PRIMARY })],
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, font: 'Arial', color: DARK })],
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 276 },
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, size: 22, font: 'Arial', color: opts.color || '333333', bold: opts.bold, italics: opts.italics })],
  });
}

function richPara(runs, opts = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 276 },
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    children: runs.map(r => {
      if (typeof r === 'string') return new TextRun({ text: r, size: 22, font: 'Arial', color: '333333' });
      return new TextRun({ size: 22, font: 'Arial', color: '333333', ...r });
    }),
  });
}

function bulletItem(text, boldPrefix) {
  const children = [];
  if (boldPrefix) {
    children.push(new TextRun({ text: boldPrefix + ' ', bold: true, size: 22, font: 'Arial', color: DARK }));
  }
  children.push(new TextRun({ text, size: 22, font: 'Arial', color: '444444' }));
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { after: 80, line: 276 },
    children,
  });
}

function bulletL2(text, boldPrefix) {
  const children = [];
  if (boldPrefix) {
    children.push(new TextRun({ text: boldPrefix + ' ', bold: true, size: 21, font: 'Arial', color: DARK }));
  }
  children.push(new TextRun({ text, size: 21, font: 'Arial', color: '555555' }));
  return new Paragraph({
    numbering: { reference: 'bullets2', level: 0 },
    spacing: { after: 60, line: 260 },
    children,
  });
}

function numberedItem(text, ref = 'numbers') {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 80, line: 276 },
    children: [new TextRun({ text, size: 22, font: 'Arial', color: '444444' })],
  });
}

function spacer(height = 200) {
  return new Paragraph({ spacing: { before: height } });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function infoBox(title, text) {
  // Colored left-border "callout" box using a table
  const leftBorder = { style: BorderStyle.SINGLE, size: 12, color: PRIMARY };
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: { left: leftBorder, top: noBorder, bottom: noBorder, right: noBorder },
            shading: { fill: LIGHT_BG, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 200, right: 200 },
            width: { size: CONTENT_WIDTH, type: WidthType.DXA },
            children: [
              new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: title, bold: true, size: 22, font: 'Arial', color: PRIMARY })] }),
              new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text, size: 20, font: 'Arial', color: '555555' })] }),
            ],
          }),
        ],
      }),
    ],
  });
}

function warningBox(title, text) {
  const leftBorder = { style: BorderStyle.SINGLE, size: 12, color: ORANGE };
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: { left: leftBorder, top: noBorder, bottom: noBorder, right: noBorder },
            shading: { fill: 'FFF8E1', type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 200, right: 200 },
            width: { size: CONTENT_WIDTH, type: WidthType.DXA },
            children: [
              new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: title, bold: true, size: 22, font: 'Arial', color: ORANGE })] }),
              new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text, size: 20, font: 'Arial', color: '555555' })] }),
            ],
          }),
        ],
      }),
    ],
  });
}

function screenshotPlaceholder(description) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: { top: { style: BorderStyle.DASHED, size: 1, color: MID_GRAY }, bottom: { style: BorderStyle.DASHED, size: 1, color: MID_GRAY }, left: { style: BorderStyle.DASHED, size: 1, color: MID_GRAY }, right: { style: BorderStyle.DASHED, size: 1, color: MID_GRAY } },
            shading: { fill: LIGHT_GRAY, type: ShadingType.CLEAR },
            margins: { top: 200, bottom: 200, left: 200, right: 200 },
            width: { size: CONTENT_WIDTH, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `[Capture d\u2019\u00e9cran : ${description}]`, italics: true, size: 20, font: 'Arial', color: MID_GRAY })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function imageOrPlaceholder(imgData, description, width = 500, height = 300) {
  if (imgData) {
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
      children: [
        new ImageRun({
          type: imgData.ext || 'png',
          data: imgData.buffer,
          transformation: { width, height },
          altText: { title: description, description, name: description },
        }),
      ],
    });
  }
  return screenshotPlaceholder(description);
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
        width: { size: CONTENT_WIDTH - 3200, type: WidthType.DXA },
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
    columnWidths: [3200, CONTENT_WIDTH - 3200],
    rows: rows.map((r, i) => keyValueRow(r[0], r[1], i % 2 === 0)),
  });
}

function headerRow(cols, widths) {
  return new TableRow({
    children: cols.map((c, i) =>
      new TableCell({
        borders: thinBorders,
        width: { size: widths[i], type: WidthType.DXA },
        shading: { fill: PRIMARY, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: c, bold: true, size: 20, font: 'Arial', color: WHITE })] })],
      })
    ),
  });
}

function dataRow(cols, widths, shade = false) {
  return new TableRow({
    children: cols.map((c, i) =>
      new TableCell({
        borders: thinBorders,
        width: { size: widths[i], type: WidthType.DXA },
        shading: { fill: shade ? LIGHT_BG : WHITE, type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: c, size: 20, font: 'Arial', color: '444444' })] })],
      })
    ),
  });
}

function fullTable(headers, data, widths) {
  if (!widths) {
    const w = Math.floor(CONTENT_WIDTH / headers.length);
    widths = headers.map(() => w);
    widths[widths.length - 1] = CONTENT_WIDTH - w * (headers.length - 1);
  }
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      headerRow(headers, widths),
      ...data.map((row, i) => dataRow(row, widths, i % 2 === 0)),
    ],
  });
}

function divider() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'DDDDDD', space: 4 } },
  });
}

// ─── Common section properties ────────────────────────────────────────────
function sectionProps() {
  return {
    properties: {
      page: {
        size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: PRIMARY, space: 4 } },
            children: [
              new TextRun({ text: 'Manuel de Formation \u2014 Catch\u2019Up V2.0', size: 16, font: 'Arial', color: MID_GRAY, italics: true }),
            ],
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD', space: 4 } },
            children: [
              new TextRun({ text: 'Fondation JAE \u2014 Catch\u2019Up V2.0 \u2014 Page ', size: 16, font: 'Arial', color: MID_GRAY }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, font: 'Arial', color: PRIMARY }),
            ],
          }),
        ],
      }),
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT CONTENT
// ═══════════════════════════════════════════════════════════════════════════

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'Arial', color: DARK },
        paragraph: { spacing: { before: 480, after: 240 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: PRIMARY },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 1 },
      },
      {
        id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Arial', color: DARK },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 },
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
        reference: 'bullets2',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '\u2013', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1080, hanging: 360 } } },
        }],
      },
      {
        reference: 'numbers',
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: 'numbersA',
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: 'numbersB',
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: 'numbersC',
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  sections: [
    // ================================================================
    // PAGE DE COUVERTURE
    // ================================================================
    {
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: [
        spacer(1400),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              type: 'png',
              data: logoBuffer,
              transformation: { width: 160, height: 160 },
              altText: { title: 'Logo Catch\u2019Up', description: 'Logo de la plateforme Catch\u2019Up', name: 'logo' },
            }),
          ],
        }),
        spacer(400),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: 'Manuel de Formation', bold: true, size: 52, font: 'Arial', color: DARK })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: 'Catch\u2019Up V2.0', bold: true, size: 56, font: 'Arial', color: PRIMARY })],
        }),
        spacer(100),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: PRIMARY, space: 12 }, bottom: { style: BorderStyle.SINGLE, size: 2, color: PRIMARY, space: 12 } },
          spacing: { before: 100, after: 100 },
          children: [new TextRun({ text: 'Guide complet d\u2019utilisation', size: 30, font: 'Arial', color: GRAY, italics: true })],
        }),
        spacer(600),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: 'Fondation JAE', bold: true, size: 28, font: 'Arial', color: DARK })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: 'Avril 2026', size: 24, font: 'Arial', color: GRAY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'Version 2.0 Beta 009', size: 20, font: 'Arial', color: MID_GRAY })],
        }),
      ],
    },

    // ================================================================
    // TABLE DES MATIERES
    // ================================================================
    {
      ...sectionProps(),
      children: [
        heading1('Table des mati\u00e8res'),
        spacer(100),
        new TableOfContents('Table des mati\u00e8res', { hyperlink: true, headingStyleRange: '1-3' }),
        spacer(200),
        infoBox('Note', 'Pour mettre \u00e0 jour la table des mati\u00e8res, ouvrez ce document dans Microsoft Word, puis faites un clic droit sur la table ci-dessus et choisissez \u00ab Mettre \u00e0 jour les champs \u00bb.'),
      ],
    },

    // ================================================================
    // 1. PRESENTATION GENERALE
    // ================================================================
    {
      ...sectionProps(),
      children: [
        heading1('1. Pr\u00e9sentation g\u00e9n\u00e9rale'),

        // 1.1
        heading2('1.1 Qu\u2019est-ce que Catch\u2019Up ?'),
        para('Catch\u2019Up est une plateforme num\u00e9rique innovante d\u00e9velopp\u00e9e par la Fondation JAE, sp\u00e9cialement con\u00e7ue pour accompagner les jeunes et les adultes dans leur parcours d\u2019orientation professionnelle. Gr\u00e2ce \u00e0 une intelligence artificielle conversationnelle, Catch\u2019Up permet \u00e0 chaque b\u00e9n\u00e9ficiaire d\u2019explorer ses int\u00e9r\u00eats, ses comp\u00e9tences et ses aspirations \u00e0 travers un dialogue naturel et bienveillant.'),
        para('L\u2019application s\u2019appuie sur le mod\u00e8le RIASEC (R\u00e9aliste, Investigateur, Artistique, Social, Entreprenant, Conventionnel) pour construire progressivement un profil d\u2019orientation personnalis\u00e9. Ce profil se pr\u00e9cise au fil des \u00e9changes, offrant une vision de plus en plus fiable des pr\u00e9f\u00e9rences et aptitudes de la personne accompagn\u00e9e.'),
        para('Catch\u2019Up V2.0 introduit un espace conseiller complet, permettant aux professionnels de l\u2019orientation de suivre et d\u2019accompagner les b\u00e9n\u00e9ficiaires en temps r\u00e9el. La plateforme int\u00e8gre \u00e9galement un syst\u00e8me de campagnes, un agenda, une messagerie directe et des outils d\u2019administration avanc\u00e9s.'),

        // 1.2
        heading2('1.2 Les deux espaces de l\u2019application'),
        para('Catch\u2019Up est organis\u00e9e autour de deux espaces distincts mais compl\u00e9mentaires, chacun adapt\u00e9 aux besoins sp\u00e9cifiques de ses utilisateurs :'),
        bulletItem('Un chatbot IA qui guide la conversation, propose des suggestions et construit un profil RIASEC. L\u2019interface est simple, accessible et ne n\u00e9cessite aucune inscription pr\u00e9alable.', 'Espace B\u00e9n\u00e9ficiaire :'),
        bulletItem('Un tableau de bord complet avec gestion des demandes d\u2019accompagnement, fiches b\u00e9n\u00e9ficiaires d\u00e9taill\u00e9es, messagerie directe, agenda et outils d\u2019administration.', 'Espace Conseiller :'),
        para('Cette architecture permet un parcours fluide : le b\u00e9n\u00e9ficiaire peut d\u00e9buter son exploration de mani\u00e8re autonome avec l\u2019IA, puis solliciter l\u2019aide d\u2019un conseiller humain lorsqu\u2019il le souhaite. Le conseiller dispose alors de toutes les informations contextuelles (profil RIASEC, historique de conversation, indice de confiance) pour offrir un accompagnement cibl\u00e9.'),

        // 1.3
        heading2('1.3 Technologies utilis\u00e9es'),
        para('Catch\u2019Up V2.0 s\u2019appuie sur un socle technologique moderne et performant :'),
        fullTable(
          ['Composant', 'Technologie', 'Description'],
          [
            ['Frontend', 'Next.js 14 / React 18', 'Interface r\u00e9active et performante avec rendu serveur'],
            ['IA conversationnelle', 'OpenAI GPT-4o', 'Mod\u00e8le de langage pour le dialogue naturel'],
            ['Base de donn\u00e9es', 'PostgreSQL + Drizzle ORM', 'Stockage fiable des donn\u00e9es utilisateurs'],
            ['Authentification', 'JWT (jose)', 'Jetons s\u00e9curis\u00e9s pour l\u2019espace conseiller'],
            ['SMS', 'Vonage', 'Envoi de codes PIN pour l\u2019accompagnement'],
            ['Notifications', 'Web Push', 'Notifications en temps r\u00e9el (navigateur / mobile)'],
            ['Temps r\u00e9el', 'WebSocket', 'Messagerie instantan\u00e9e conseiller \u2194 b\u00e9n\u00e9ficiaire'],
            ['PWA', 'Service Worker', 'Installation en tant qu\u2019application, mode hors-ligne'],
            ['Mobile', 'Capacitor', 'Application Android native via WebView'],
            ['Accessibilit\u00e9', 'RGAA 4.1', 'Conformit\u00e9 100% aux normes d\u2019accessibilit\u00e9'],
          ],
          [2200, 3200, 3626],
        ),
        spacer(100),

        // 1.4
        heading2('1.4 Configuration requise'),
        para('Catch\u2019Up est une application web progressive (PWA) accessible depuis n\u2019importe quel navigateur moderne. Voici les configurations minimales recommand\u00e9es :'),
        richPara([
          { text: 'Navigateurs support\u00e9s : ', bold: true },
          'Google Chrome (v90+), Mozilla Firefox (v88+), Microsoft Edge (v90+), Safari (v14+).',
        ]),
        richPara([
          { text: 'Syst\u00e8mes d\u2019exploitation : ', bold: true },
          'Windows 10+, macOS 11+, Android 8+, iOS 14+.',
        ]),
        richPara([
          { text: 'Connexion Internet : ', bold: true },
          'Une connexion haut d\u00e9bit est recommand\u00e9e pour les fonctionnalit\u00e9s de chat IA et de messagerie en temps r\u00e9el. Le mode hors-ligne permet de consulter l\u2019historique des conversations sans connexion.',
        ]),
        richPara([
          { text: 'R\u00e9solution d\u2019\u00e9cran : ', bold: true },
          'L\u2019interface est enti\u00e8rement responsive et s\u2019adapte aux \u00e9crans de 320px (smartphone) \u00e0 2560px (grand \u00e9cran). L\u2019exp\u00e9rience optimale est obtenue avec une r\u00e9solution de 1280\u00d7720 pixels ou sup\u00e9rieure.',
        ]),
        infoBox('Astuce', 'Pour une exp\u00e9rience optimale sur mobile, installez Catch\u2019Up en tant qu\u2019application via le menu \u00ab Ajouter \u00e0 l\u2019\u00e9cran d\u2019accueil \u00bb de votre navigateur. L\u2019application se comportera alors comme une app native.'),
      ],
    },

    // ================================================================
    // 2. ESPACE BENEFICIAIRE
    // ================================================================
    {
      ...sectionProps(),
      children: [
        heading1('2. Espace B\u00e9n\u00e9ficiaire'),
        para('L\u2019espace b\u00e9n\u00e9ficiaire constitue le c\u0153ur de l\u2019exp\u00e9rience Catch\u2019Up. Il offre un environnement conversationnel chaleureux et intuitif o\u00f9 chaque personne peut explorer son orientation professionnelle \u00e0 son propre rythme, sans jugement ni pression.'),

        // 2.1
        heading2('2.1 Acc\u00e9der \u00e0 Catch\u2019Up'),
        para('L\u2019acc\u00e8s \u00e0 l\u2019espace b\u00e9n\u00e9ficiaire se fait simplement en ouvrant l\u2019URL de la plateforme dans un navigateur web. Aucune inscription ni cr\u00e9ation de compte n\u2019est n\u00e9cessaire : Catch\u2019Up est con\u00e7u pour \u00eatre imm\u00e9diatement accessible.'),
        para('Lors de la premi\u00e8re visite, l\u2019application demande uniquement le pr\u00e9nom du b\u00e9n\u00e9ficiaire. Cette information permet \u00e0 l\u2019assistant IA de personnaliser la conversation. Les donn\u00e9es de session sont stock\u00e9es localement dans le navigateur (localStorage), garantissant la confidentialit\u00e9 des \u00e9changes.'),
        para('Si le b\u00e9n\u00e9ficiaire acc\u00e8de \u00e0 Catch\u2019Up via un lien personnalis\u00e9 (campagne), la structure et la campagne associ\u00e9es sont automatiquement d\u00e9tect\u00e9es et enregistr\u00e9es. Cela permet au conseiller de retrouver facilement le b\u00e9n\u00e9ficiaire dans sa file active.'),
        infoBox('Lien de campagne', 'Un lien de campagne prend la forme : https://catchup.fondation-jae.org/chat?s=nom-structure&c=identifiant-campagne. Le b\u00e9n\u00e9ficiaire n\u2019a qu\u2019\u00e0 cliquer sur ce lien pour acc\u00e9der directement \u00e0 Catch\u2019Up avec le contexte pr\u00e9-configur\u00e9.'),

        // 2.2
        heading2('2.2 L\u2019\u00e9cran d\u2019accueil'),
        para('L\u2019\u00e9cran d\u2019accueil pr\u00e9sente une interface de chat \u00e9pur\u00e9e, centr\u00e9e sur la conversation. En haut de l\u2019\u00e9cran, un message de bienvenue personnalis\u00e9 accueille le b\u00e9n\u00e9ficiaire par son pr\u00e9nom et lui explique bri\u00e8vement le fonctionnement de l\u2019assistant.'),
        imageOrPlaceholder(ssAccueil, 'Page d\u2019accueil b\u00e9n\u00e9ficiaire \u2014 \u00e9cran de bienvenue du chat', 500, 380),
        imageOrPlaceholder(ssChatMobile, 'Interface chat b\u00e9n\u00e9ficiaire sur mobile', 220, 440),
        para('L\u2019interface comprend les \u00e9l\u00e9ments suivants :'),
        bulletItem('Le logo Catch\u2019Up et le nom de la structure (si applicable), avec un indicateur de score RGAA accessible.', 'En-t\u00eate :'),
        bulletItem('La zone de conversation, avec les messages de l\u2019IA affich\u00e9s \u00e0 gauche et ceux du b\u00e9n\u00e9ficiaire \u00e0 droite. Chaque message dispose d\u2019un bouton de lecture vocale.', 'Zone centrale :'),
        bulletItem('Des pastilles de suggestions contextuelles apparaissent sous le dernier message de l\u2019IA pour faciliter la r\u00e9ponse.', 'Suggestions :'),
        bulletItem('Un champ de saisie texte avec possibilit\u00e9 d\u2019envoyer un message vocal (microphone) ou une pi\u00e8ce jointe.', 'Barre de saisie :'),
        bulletItem('Acc\u00e8s au profil RIASEC, au panneau d\u2019accessibilit\u00e9 et aux r\u00e9glages.', 'Actions :'),

        // 2.3
        heading2('2.3 Discuter avec l\u2019assistant IA'),
        para('L\u2019assistant IA de Catch\u2019Up est con\u00e7u pour mener une conversation naturelle et bienveillante autour de l\u2019orientation professionnelle. Il adapte ses questions au contexte de la conversation et au profil d\u00e9j\u00e0 construit du b\u00e9n\u00e9ficiaire.'),
        para('Le dialogue suit une logique progressive :'),
        numberedItem('L\u2019IA commence par se pr\u00e9senter et poser des questions ouvertes sur les centres d\u2019int\u00e9r\u00eat et les exp\u00e9riences du b\u00e9n\u00e9ficiaire.', 'numbersA'),
        numberedItem('Au fil des \u00e9changes, l\u2019IA affine sa compr\u00e9hension et propose des pistes d\u2019orientation de plus en plus cibl\u00e9es.', 'numbersA'),
        numberedItem('Le profil RIASEC se construit automatiquement en arri\u00e8re-plan, visible \u00e0 tout moment dans le panneau de profil.', 'numbersA'),
        numberedItem('L\u2019IA peut sugg\u00e9rer des fiches m\u00e9tier de la base JAE en rapport avec le profil \u00e9mergent.', 'numbersA'),
        para('L\u2019assistant d\u00e9tecte \u00e9galement les situations de fragilit\u00e9 (d\u00e9crochage scolaire, difficult\u00e9s sociales, etc.) et adapte son ton en cons\u00e9quence. Si n\u00e9cessaire, il peut orienter la conversation vers une demande d\u2019accompagnement humain.'),
        warningBox('Important', 'L\u2019IA ne se substitue jamais \u00e0 un conseiller humain. Elle constitue un outil d\u2019exploration compl\u00e9mentaire qui facilite le travail d\u2019orientation.'),

        // 2.4
        heading2('2.4 Les suggestions intelligentes'),
        para('Apr\u00e8s chaque r\u00e9ponse de l\u2019assistant, des pastilles de suggestions apparaissent sous le message. Ces suggestions sont g\u00e9n\u00e9r\u00e9es dynamiquement par l\u2019IA en fonction du contexte de la conversation et permettent au b\u00e9n\u00e9ficiaire de r\u00e9pondre en un clic.'),
        para('Les suggestions servent plusieurs objectifs :'),
        bulletItem('Elles facilitent l\u2019expression des b\u00e9n\u00e9ficiaires qui ont des difficult\u00e9s \u00e0 formuler leurs pens\u00e9es par \u00e9crit.'),
        bulletItem('Elles acc\u00e9l\u00e8rent le rythme de la conversation tout en maintenant sa qualit\u00e9.'),
        bulletItem('Elles guident le b\u00e9n\u00e9ficiaire vers des th\u00e9matiques pertinentes pour construire son profil RIASEC.'),
        para('Le b\u00e9n\u00e9ficiaire reste libre de taper sa propre r\u00e9ponse plut\u00f4t que d\u2019utiliser une suggestion. Les suggestions sont un outil d\u2019aide, jamais une contrainte.'),

        // 2.5
        heading2('2.5 Le profil RIASEC'),
        para('Le mod\u00e8le RIASEC (Holland) est au c\u0153ur du syst\u00e8me d\u2019orientation de Catch\u2019Up. Il d\u00e9crit six types de personnalit\u00e9 professionnelle :'),
        fullTable(
          ['Type', 'Description', 'Exemples de m\u00e9tiers'],
          [
            ['R\u00e9aliste', 'Aime travailler avec ses mains, les outils et machines', 'M\u00e9canicien, \u00e9lectricien, cuisinier'],
            ['Investigateur', 'Curieux, analytique, aime comprendre et r\u00e9soudre des probl\u00e8mes', 'Chercheur, ing\u00e9nieur, m\u00e9decin'],
            ['Artistique', 'Cr\u00e9atif, expressif, aime l\u2019esth\u00e9tique et l\u2019originalit\u00e9', 'Designer, musicien, architecte'],
            ['Social', 'Aime aider, enseigner, accompagner les autres', 'Enseignant, infirmier, \u00e9ducateur'],
            ['Entreprenant', 'Dynamique, persuasif, aime diriger et d\u00e9cider', 'Commercial, entrepreneur, avocat'],
            ['Conventionnel', 'Organis\u00e9, m\u00e9thodique, aime la pr\u00e9cision et les r\u00e8gles', 'Comptable, secr\u00e9taire, logisticien'],
          ],
          [1800, 4000, 3226],
        ),
        spacer(100),
        para('Le profil RIASEC est accessible \u00e0 tout moment via le bouton de profil dans l\u2019en-t\u00eate. Il pr\u00e9sente un graphique radar montrant les scores dans chacune des six dimensions, accompagn\u00e9 d\u2019un indice de confiance qui refl\u00e8te la fiabilit\u00e9 du profil en fonction du nombre d\u2019\u00e9changes r\u00e9alis\u00e9s.'),
        para('L\u2019indice de confiance passe par quatre niveaux : D\u00e9but, \u00c9mergent, Pr\u00e9cis et Fiable. Un profil est consid\u00e9r\u00e9 comme fiable apr\u00e8s une vingtaine de messages significatifs.'),

        // 2.6
        heading2('2.6 Messages vocaux et transcription'),
        para('Catch\u2019Up offre une prise en charge compl\u00e8te de l\u2019audio, tant en entr\u00e9e qu\u2019en sortie :'),
        richPara([{ text: 'Envoi de messages vocaux : ', bold: true }, 'Le b\u00e9n\u00e9ficiaire peut appuyer sur l\u2019ic\u00f4ne microphone pour enregistrer un message audio. L\u2019enregistrement est automatiquement transcrit en texte gr\u00e2ce \u00e0 l\u2019API Whisper d\u2019OpenAI, puis envoy\u00e9 \u00e0 l\u2019assistant IA. Le message vocal original est \u00e9galement conserv\u00e9 et peut \u00eatre r\u00e9\u00e9cout\u00e9.']),
        richPara([{ text: 'Lecture vocale (TTS) : ', bold: true }, 'Chaque message de l\u2019assistant dispose d\u2019un bouton de lecture vocale qui permet de l\u2019\u00e9couter via la synth\u00e8se vocale du navigateur. Cette fonctionnalit\u00e9 est particuli\u00e8rement utile pour les personnes ayant des difficult\u00e9s de lecture.']),
        richPara([{ text: 'Sous-titres et transcription : ', bold: true }, 'Conform\u00e9ment aux exigences d\u2019accessibilit\u00e9 RGAA, tous les contenus audio disposent d\u2019une transcription textuelle visible.']),
        infoBox('Langues support\u00e9es', 'La transcription audio Whisper prend en charge les 10 langues de Catch\u2019Up : fran\u00e7ais, anglais, arabe, portugais, turc, italien, espagnol, allemand, roumain et chinois.'),

        // 2.7
        heading2('2.7 Demander un accompagnement conseiller'),
        para('Lorsque le b\u00e9n\u00e9ficiaire souhaite \u00eatre accompagn\u00e9 par un conseiller humain, il peut initier une demande d\u2019accompagnement directement depuis l\u2019interface de chat. Ce processus se d\u00e9roule en plusieurs \u00e9tapes :'),
        numberedItem('Le b\u00e9n\u00e9ficiaire clique sur le bouton \u00ab Demander un accompagnement \u00bb ou exprime cette intention dans la conversation.', 'numbersB'),
        numberedItem('Un formulaire appara\u00eet, demandant des informations de contact (nom, pr\u00e9nom, t\u00e9l\u00e9phone) pour permettre au conseiller de le recontacter.', 'numbersB'),
        numberedItem('Un code PIN \u00e0 6 chiffres est envoy\u00e9 par SMS au num\u00e9ro fourni pour v\u00e9rifier l\u2019identit\u00e9.', 'numbersB'),
        numberedItem('Une fois valid\u00e9, la demande appara\u00eet dans la file active du conseiller, accompagn\u00e9e du profil RIASEC et de l\u2019historique de conversation.', 'numbersB'),
        para('Le b\u00e9n\u00e9ficiaire peut suivre l\u2019\u00e9tat de sa demande (en attente, accept\u00e9e, refus\u00e9e) directement dans l\u2019interface de chat gr\u00e2ce \u00e0 un badge de statut visible.'),

        // 2.8
        heading2('2.8 Saisie du code PIN (SMS)'),
        para('Le code PIN est un \u00e9l\u00e9ment cl\u00e9 du processus de mise en relation entre le b\u00e9n\u00e9ficiaire et le conseiller. Il garantit que le num\u00e9ro de t\u00e9l\u00e9phone fourni est bien celui du b\u00e9n\u00e9ficiaire.'),
        para('Le processus technique est le suivant :'),
        bulletItem('Un code PIN \u00e0 6 chiffres est g\u00e9n\u00e9r\u00e9 c\u00f4t\u00e9 serveur et envoy\u00e9 par SMS via l\u2019API Vonage.'),
        bulletItem('Le champ de saisie est optimis\u00e9 pour le mobile : type unique pour d\u00e9clencher l\u2019auto-remplissage depuis le SMS sur Android et iOS.'),
        bulletItem('Le code expire apr\u00e8s 10 minutes pour des raisons de s\u00e9curit\u00e9.'),
        bulletItem('En cas d\u2019erreur, le b\u00e9n\u00e9ficiaire peut demander le renvoi d\u2019un nouveau code.'),
        warningBox('S\u00e9curit\u00e9', 'Les codes PIN sont hach\u00e9s (bcrypt) en base de donn\u00e9es. Ils ne peuvent \u00eatre ni lus ni r\u00e9cup\u00e9r\u00e9s une fois g\u00e9n\u00e9r\u00e9s.'),

        // 2.9
        heading2('2.9 Le quiz d\u2019orientation'),
        para('En compl\u00e9ment du dialogue libre avec l\u2019IA, Catch\u2019Up propose un quiz d\u2019orientation structur\u00e9 qui permet de pr\u00e9ciser rapidement le profil RIASEC du b\u00e9n\u00e9ficiaire. Ce quiz est propos\u00e9 de mani\u00e8re contextuelle par l\u2019assistant apr\u00e8s quelques \u00e9changes.'),
        para('Le quiz se compose de s\u00e9ries de questions \u00e0 choix multiples portant sur des activit\u00e9s, des environnements de travail et des pr\u00e9f\u00e9rences professionnelles. Chaque r\u00e9ponse contribue \u00e0 affiner les scores RIASEC du b\u00e9n\u00e9ficiaire.'),
        para('Les r\u00e9sultats du quiz sont int\u00e9gr\u00e9s au profil existant (construit par la conversation) plut\u00f4t que de le remplacer. Cette fusion permet d\u2019obtenir un profil plus complet et plus fiable que chaque m\u00e9thode prise s\u00e9par\u00e9ment.'),

        // 2.10
        heading2('2.10 Accessibilit\u00e9 (RGAA 100%)'),
        para('L\u2019espace b\u00e9n\u00e9ficiaire de Catch\u2019Up a \u00e9t\u00e9 con\u00e7u d\u00e8s l\u2019origine avec une attention particuli\u00e8re \u00e0 l\u2019accessibilit\u00e9 num\u00e9rique. L\u2019application atteint un score de conformit\u00e9 RGAA 4.1 de 100%, ce qui signifie que tous les crit\u00e8res applicables sont respect\u00e9s.'),
        para('Les am\u00e9nagements d\u2019accessibilit\u00e9 incluent :'),
        bulletItem('Navigation compl\u00e8te au clavier avec indicateurs de focus visibles.'),
        bulletItem('Attributs ARIA sur tous les composants interactifs (r\u00f4les, labels, descriptions).'),
        bulletItem('Contraste des textes conforme au niveau AA du WCAG.'),
        bulletItem('Taille de texte ajustable sur trois niveaux (Normal, Grand, Tr\u00e8s grand).'),
        bulletItem('Mode contraste renforc\u00e9 activable depuis le panneau d\u2019accessibilit\u00e9.'),
        bulletItem('R\u00e9duction des animations pour les personnes sensibles aux mouvements.'),
        bulletItem('Lecture vocale (TTS) disponible sur chaque message.'),
        bulletItem('Compatibilit\u00e9 totale avec les lecteurs d\u2019\u00e9cran NVDA et VoiceOver.'),
        bulletItem('Textes alternatifs sur toutes les images et ic\u00f4nes.'),
        bulletItem('Sous-titres et transcriptions pour tous les contenus audio.'),
        para('Le badge RGAA 100% est affich\u00e9 dans l\u2019en-t\u00eate de l\u2019application, symbolisant l\u2019engagement de Catch\u2019Up envers l\u2019inclusion num\u00e9rique.'),
      ],
    },

    // ================================================================
    // 3. ESPACE CONSEILLER
    // ================================================================
    {
      ...sectionProps(),
      children: [
        heading1('3. Espace Conseiller'),
        para('L\u2019espace conseiller est un tableau de bord professionnel complet permettant aux conseillers en orientation de g\u00e9rer leurs b\u00e9n\u00e9ficiaires, de suivre les demandes d\u2019accompagnement et de communiquer directement avec les personnes accompagn\u00e9es.'),

        // 3.1
        heading2('3.1 Se connecter'),
        para('L\u2019acc\u00e8s \u00e0 l\u2019espace conseiller est s\u00e9curis\u00e9 par un syst\u00e8me d\u2019authentification par identifiant et mot de passe. La page de connexion est accessible \u00e0 l\u2019adresse /conseiller/login.'),
        imageOrPlaceholder(ssLogin, 'Page de connexion de l\u2019espace conseiller', 500, 310),
        para('Le processus de connexion se d\u00e9roule comme suit :'),
        numberedItem('Le conseiller saisit son adresse e-mail et son mot de passe.', 'numbersC'),
        numberedItem('Le serveur v\u00e9rifie les identifiants (le mot de passe est hach\u00e9 avec bcrypt en base de donn\u00e9es).', 'numbersC'),
        numberedItem('Un jeton JWT (JSON Web Token) est g\u00e9n\u00e9r\u00e9 et stock\u00e9 dans un cookie s\u00e9curis\u00e9 (httpOnly, SameSite).', 'numbersC'),
        numberedItem('Le conseiller est redirig\u00e9 vers le tableau de bord.', 'numbersC'),
        para('La session reste active pendant 24 heures. Apr\u00e8s expiration, le conseiller est automatiquement redirig\u00e9 vers la page de connexion. Chaque requ\u00eate \u00e0 l\u2019API v\u00e9rifie la validit\u00e9 du jeton JWT.'),
        warningBox('S\u00e9curit\u00e9', 'Apr\u00e8s 5 tentatives de connexion \u00e9chou\u00e9es, le compte est temporairement verrouill\u00e9 pendant 15 minutes. Contactez votre administrateur si vous avez oubli\u00e9 votre mot de passe.'),

        // 3.2
        heading2('3.2 Le dashboard'),
        para('Le tableau de bord est la page d\u2019accueil de l\u2019espace conseiller. Il offre une vue d\u2019ensemble synth\u00e9tique de l\u2019activit\u00e9 :'),
        imageOrPlaceholder(ssDashboard, 'Dashboard conseiller \u2014 vue d\u2019ensemble', 500, 310),
        bulletItem('Le nombre de nouvelles demandes d\u2019accompagnement en attente.', 'Demandes en attente :'),
        bulletItem('Le nombre total de b\u00e9n\u00e9ficiaires actuellement suivis.', 'B\u00e9n\u00e9ficiaires actifs :'),
        bulletItem('Les rendez-vous et \u00e9v\u00e9nements du jour ou de la semaine.', 'Agenda du jour :'),
        bulletItem('Les messages non lus et les nouvelles alertes.', 'Notifications :'),
        para('Le dashboard affiche \u00e9galement des statistiques cl\u00e9s sous forme de graphiques : \u00e9volution du nombre de demandes, r\u00e9partition par structure, taux de conversion des accompagnements, etc.'),
        para('La navigation de l\u2019espace conseiller est organis\u00e9e via un menu lat\u00e9ral (sidebar) donnant acc\u00e8s \u00e0 toutes les sections : File active, Agenda, Structures, Campagnes, Conseillers et Administration.'),

        // 3.3
        heading2('3.3 La file active (demandes d\u2019accompagnement)'),
        para('La file active constitue l\u2019outil principal du conseiller. Elle regroupe toutes les demandes d\u2019accompagnement re\u00e7ues, class\u00e9es par statut et par date.'),
        imageOrPlaceholder(ssFileActive, 'File active \u2014 liste des demandes d\u2019accompagnement', 500, 310),
        para('Chaque demande affiche :'),
        bulletItem('Le pr\u00e9nom et le nom du b\u00e9n\u00e9ficiaire, ainsi que son num\u00e9ro de t\u00e9l\u00e9phone v\u00e9rifi\u00e9.'),
        bulletItem('Le statut de la demande : en attente, accept\u00e9e, en cours, termin\u00e9e ou refus\u00e9e.'),
        bulletItem('La date et l\u2019heure de la demande.'),
        bulletItem('La structure et la campagne d\u2019origine (si applicable).'),
        bulletItem('Un aper\u00e7u du profil RIASEC et de l\u2019indice de confiance.'),
        para('Le conseiller peut filtrer la liste par statut, par structure ou par date. Un clic sur une demande ouvre la fiche b\u00e9n\u00e9ficiaire d\u00e9taill\u00e9e.'),
        para('Le syst\u00e8me de statuts permet un suivi rigoureux des parcours :'),
        fullTable(
          ['Statut', 'Description', 'Action du conseiller'],
          [
            ['En attente', 'Nouvelle demande non trait\u00e9e', 'Accepter ou refuser'],
            ['Accept\u00e9e', 'Conseiller a accept\u00e9 la demande', 'Planifier un premier contact'],
            ['En cours', 'Accompagnement en cours', 'Suivre, \u00e9changer, planifier'],
            ['Termin\u00e9e', 'Accompagnement cl\u00f4tur\u00e9', 'Archiver le dossier'],
            ['Refus\u00e9e', 'Demande d\u00e9clin\u00e9e', 'Motif obligatoire'],
          ],
          [2000, 4000, 3026],
        ),

        // 3.4
        heading2('3.4 Fiche b\u00e9n\u00e9ficiaire d\u00e9taill\u00e9e'),
        para('La fiche b\u00e9n\u00e9ficiaire offre une vue compl\u00e8te de la personne accompagn\u00e9e. Elle est divis\u00e9e en plusieurs sections :'),
        imageOrPlaceholder(ssFicheBenef, 'Fiche b\u00e9n\u00e9ficiaire \u2014 vue d\u2019ensemble du profil', 500, 310),
        imageOrPlaceholder(ssFicheMessages, 'Fiche b\u00e9n\u00e9ficiaire \u2014 vue avec r\u00e9sum\u00e9 IA et conversations', 500, 310),,
        richPara([{ text: 'Informations personnelles : ', bold: true }, 'Pr\u00e9nom, nom, t\u00e9l\u00e9phone, date de cr\u00e9ation du profil, structure et campagne d\u2019origine.']),
        richPara([{ text: 'Profil RIASEC : ', bold: true }, 'Graphique radar interactif montrant les six dimensions, accompagn\u00e9 de l\u2019indice de confiance et d\u2019un r\u00e9sum\u00e9 textuel des pr\u00e9f\u00e9rences dominantes.']),
        richPara([{ text: 'Historique de conversation : ', bold: true }, 'L\u2019int\u00e9gralit\u00e9 des \u00e9changes entre le b\u00e9n\u00e9ficiaire et l\u2019assistant IA est consultable par le conseiller, offrant un contexte pr\u00e9cieux pour l\u2019accompagnement.']),
        richPara([{ text: 'Notes du conseiller : ', bold: true }, 'Le conseiller peut ajouter des notes internes visibles uniquement par les autres conseillers de la structure.']),
        richPara([{ text: 'Niveau de fragilit\u00e9 : ', bold: true }, 'Un indicateur automatique (bas\u00e9 sur l\u2019analyse IA des \u00e9changes) signale les situations n\u00e9cessitant une attention particuli\u00e8re.']),

        // 3.5
        heading2('3.5 Messagerie directe conseiller \u2194 b\u00e9n\u00e9ficiaire'),
        para('Catch\u2019Up V2.0 int\u00e8gre un syst\u00e8me de messagerie instantan\u00e9e permettant au conseiller et au b\u00e9n\u00e9ficiaire de communiquer directement, en compl\u00e9ment des \u00e9changes avec l\u2019IA.'),
        para('La messagerie fonctionne en temps r\u00e9el gr\u00e2ce \u00e0 la technologie WebSocket. Les messages sont envoy\u00e9s et re\u00e7us instantan\u00e9ment, avec des indicateurs de lecture (lu / non lu). Les deux parties sont notifi\u00e9es par push lorsqu\u2019un nouveau message arrive.'),
        para('Les fonctionnalit\u00e9s de la messagerie incluent :'),
        bulletItem('Envoi de messages texte en temps r\u00e9el.'),
        bulletItem('Indicateurs de statut (envoy\u00e9, re\u00e7u, lu).'),
        bulletItem('Notifications push sur navigateur et mobile.'),
        bulletItem('Historique complet des \u00e9changes consultable \u00e0 tout moment.'),
        bulletItem('Assistant IA d\u00e9di\u00e9 au conseiller pour l\u2019aider \u00e0 formuler ses r\u00e9ponses.'),
        infoBox('Temps r\u00e9el', 'La messagerie utilise le protocole WebSocket pour garantir une latence minimale. Si la connexion est interrompue, le syst\u00e8me tente automatiquement de se reconnecter.'),

        // 3.6
        heading2('3.6 L\u2019agenda'),
        para('L\u2019espace conseiller int\u00e8gre un agenda professionnel permettant de planifier et de g\u00e9rer les rendez-vous avec les b\u00e9n\u00e9ficiaires. L\u2019agenda offre une vue hebdomadaire et mensuelle des \u00e9v\u00e9nements.'),
        imageOrPlaceholder(ssAgenda, 'Agenda conseiller \u2014 vue mensuelle', 500, 310),
        para('Les fonctionnalit\u00e9s de l\u2019agenda comprennent :'),
        bulletItem('Cr\u00e9ation de rendez-vous avec un b\u00e9n\u00e9ficiaire sp\u00e9cifique (li\u00e9 \u00e0 la fiche).'),
        bulletItem('D\u00e9finition du type de rendez-vous : entretien t\u00e9l\u00e9phonique, visioconf\u00e9rence, pr\u00e9sentiel.'),
        bulletItem('Ajout de notes et d\u2019objectifs pour chaque rendez-vous.'),
        bulletItem('Rappels automatiques par notification push.'),
        bulletItem('Vue synth\u00e9tique des disponibilit\u00e9s.'),
        para('Chaque rendez-vous cr\u00e9\u00e9 dans l\u2019agenda est automatiquement li\u00e9 \u00e0 la fiche du b\u00e9n\u00e9ficiaire concern\u00e9, cr\u00e9ant ainsi un historique complet du suivi.'),

        // 3.7
        heading2('3.7 Gestion des structures'),
        para('Les structures sont les entit\u00e9s organisationnelles auxquelles sont rattach\u00e9s les conseillers et les b\u00e9n\u00e9ficiaires. Une structure peut \u00eatre une Mission Locale, un CIO, un P\u00f4le emploi, un \u00e9tablissement scolaire ou toute autre organisation utilisant Catch\u2019Up.'),
        imageOrPlaceholder(ssStructures, 'Page de gestion des structures', 500, 310),
        para('La gestion des structures permet de :'),
        bulletItem('Cr\u00e9er et configurer de nouvelles structures avec leur nom, logo et slug (identifiant URL unique).'),
        bulletItem('Rattacher des conseillers \u00e0 une ou plusieurs structures.'),
        bulletItem('Personnaliser l\u2019apparence de l\u2019interface b\u00e9n\u00e9ficiaire par structure (branding).'),
        bulletItem('Visualiser les statistiques d\u2019utilisation par structure.'),
        bulletItem('G\u00e9rer les campagnes li\u00e9es \u00e0 chaque structure.'),
        para('Chaque structure poss\u00e8de un identifiant unique (slug) qui permet de g\u00e9n\u00e9rer des liens d\u2019acc\u00e8s personnalis\u00e9s pour les b\u00e9n\u00e9ficiaires.'),

        // 3.8
        heading2('3.8 Gestion des campagnes'),
        para('Les campagnes sont un outil puissant pour organiser et suivre les actions d\u2019orientation \u00e0 grande \u00e9chelle. Une campagne est associ\u00e9e \u00e0 une structure et permet de regrouper les b\u00e9n\u00e9ficiaires ayant acc\u00e9d\u00e9 \u00e0 Catch\u2019Up dans un contexte particulier.'),
        imageOrPlaceholder(ssCampagnes, 'Campagnes \u2014 liste et QR codes', 500, 310),
        para('Exemples de campagnes :'),
        bulletItem('Forum de l\u2019orientation d\u2019un lyc\u00e9e (QR code distribu\u00e9 sur place).'),
        bulletItem('Action d\u2019insertion pour un groupe de jeunes en mission locale.'),
        bulletItem('Programme de r\u00e9orientation pour des salari\u00e9s en reconversion.'),
        para('Chaque campagne g\u00e9n\u00e8re un lien unique et un QR code imprimable. Les b\u00e9n\u00e9ficiaires qui acc\u00e8dent \u00e0 Catch\u2019Up via ce lien sont automatiquement rattach\u00e9s \u00e0 la campagne, ce qui permet au conseiller de les identifier et de les suivre facilement.'),
        para('Les statistiques par campagne incluent : nombre de b\u00e9n\u00e9ficiaires, nombre de conversations initi\u00e9es, nombre de demandes d\u2019accompagnement, et taux de conversion.'),

        // 3.9
        heading2('3.9 Administration'),
        para('La section Administration de l\u2019espace conseiller offre des fonctionnalit\u00e9s r\u00e9serv\u00e9es aux utilisateurs disposant du r\u00f4le d\u2019administrateur. Elle permet de g\u00e9rer l\u2019ensemble de la plateforme :'),
        imageOrPlaceholder(ssAdmin, 'Page d\u2019administration', 500, 310),
        bulletItem('Cr\u00e9ation et gestion des comptes conseillers.'),
        bulletItem('Attribution des r\u00f4les (conseiller, administrateur, super-administrateur).'),
        bulletItem('Configuration des param\u00e8tres globaux de la plateforme.'),
        bulletItem('Acc\u00e8s aux journaux d\u2019audit (logs de connexion, actions sensibles).'),
        bulletItem('Export de donn\u00e9es au format Excel pour le reporting.'),
        para('L\u2019administration centralise \u00e9galement la gestion des structures et des campagnes, offrant une vue transversale de l\u2019activit\u00e9 sur l\u2019ensemble de la plateforme.'),

        // 3.10
        heading2('3.10 Notifications et alertes'),
        para('Le syst\u00e8me de notifications de Catch\u2019Up permet aux conseillers de rester inform\u00e9s en temps r\u00e9el des \u00e9v\u00e9nements importants, m\u00eame lorsqu\u2019ils ne sont pas connect\u00e9s \u00e0 la plateforme.'),
        para('Les types de notifications incluent :'),
        bulletItem('Nouvelle demande d\u2019accompagnement re\u00e7ue dans la file active.'),
        bulletItem('Nouveau message d\u2019un b\u00e9n\u00e9ficiaire dans la messagerie directe.'),
        bulletItem('Rappel de rendez-vous (30 minutes avant).'),
        bulletItem('Alerte de fragilit\u00e9 d\u00e9tect\u00e9e chez un b\u00e9n\u00e9ficiaire.'),
        bulletItem('Mise \u00e0 jour de statut d\u2019une demande.'),
        para('Les notifications sont d\u00e9livr\u00e9es par le protocole Web Push, ce qui signifie qu\u2019elles apparaissent directement sur le bureau de l\u2019ordinateur ou sur l\u2019\u00e9cran du t\u00e9l\u00e9phone, m\u00eame si le navigateur est ferm\u00e9 (sous r\u00e9serve d\u2019avoir accept\u00e9 les notifications).'),
      ],
    },

    // ================================================================
    // 4. FONCTIONNALITES TRANSVERSALES
    // ================================================================
    {
      ...sectionProps(),
      children: [
        heading1('4. Fonctionnalit\u00e9s transversales'),
        para('Cette section d\u00e9crit les fonctionnalit\u00e9s communes aux deux espaces (b\u00e9n\u00e9ficiaire et conseiller) qui enrichissent l\u2019exp\u00e9rience globale de Catch\u2019Up.'),

        // 4.1
        heading2('4.1 Notifications push'),
        para('Catch\u2019Up utilise la technologie Web Push pour envoyer des notifications en temps r\u00e9el aux utilisateurs, tant dans l\u2019espace b\u00e9n\u00e9ficiaire que dans l\u2019espace conseiller.'),
        para('Pour activer les notifications, l\u2019utilisateur doit autoriser les notifications dans son navigateur lors de la premi\u00e8re visite. Cette autorisation peut \u00eatre r\u00e9voqu\u00e9e \u00e0 tout moment dans les param\u00e8tres du navigateur.'),
        para('Les notifications sont g\u00e9r\u00e9es par un Service Worker qui fonctionne en arri\u00e8re-plan, m\u00eame lorsque l\u2019application n\u2019est pas ouverte. Cela garantit que les messages importants (nouvelles demandes, messages directs) sont toujours re\u00e7us sans d\u00e9lai.'),
        para('C\u00f4t\u00e9 b\u00e9n\u00e9ficiaire, les notifications concernent principalement les r\u00e9ponses du conseiller et les mises \u00e0 jour de statut de la demande d\u2019accompagnement. C\u00f4t\u00e9 conseiller, elles couvrent les nouvelles demandes, les messages et les rappels d\u2019agenda.'),

        // 4.2
        heading2('4.2 Mode hors-ligne (PWA)'),
        para('Catch\u2019Up est une Progressive Web App (PWA), ce qui signifie qu\u2019elle peut \u00eatre install\u00e9e sur l\u2019appareil de l\u2019utilisateur et fonctionner partiellement sans connexion Internet.'),
        para('En mode hors-ligne, les fonctionnalit\u00e9s suivantes restent accessibles :'),
        bulletItem('Consultation de l\u2019historique des conversations (messages d\u00e9j\u00e0 charg\u00e9s).'),
        bulletItem('Acc\u00e8s au profil RIASEC enregistr\u00e9 localement.'),
        bulletItem('Navigation dans l\u2019interface (pages d\u00e9j\u00e0 mises en cache).'),
        para('Les fonctionnalit\u00e9s n\u00e9cessitant une connexion (envoi de messages \u00e0 l\u2019IA, messagerie directe, notifications) sont mises en file d\u2019attente et ex\u00e9cut\u00e9es automatiquement au retour de la connexion. L\u2019utilisateur est inform\u00e9 par un bandeau qu\u2019il travaille en mode hors-ligne.'),
        infoBox('Installation PWA', 'Pour installer Catch\u2019Up en tant qu\u2019application : dans Chrome, cliquez sur l\u2019ic\u00f4ne d\u2019installation dans la barre d\u2019adresse. Sur mobile, utilisez \u00ab Ajouter \u00e0 l\u2019\u00e9cran d\u2019accueil \u00bb dans le menu du navigateur.'),

        // 4.3
        heading2('4.3 Accessibilit\u00e9 RGAA 4.1'),
        para('L\u2019accessibilit\u00e9 num\u00e9rique est un pilier fondamental de Catch\u2019Up. L\u2019application respecte int\u00e9gralement le R\u00e9f\u00e9rentiel G\u00e9n\u00e9ral d\u2019Am\u00e9lioration de l\u2019Accessibilit\u00e9 (RGAA) version 4.1, qui est la d\u00e9clinaison fran\u00e7aise des normes WCAG 2.1 niveau AA.'),
        para('Voici le d\u00e9tail des 14 crit\u00e8res v\u00e9rifi\u00e9s et leur statut de conformit\u00e9 :'),
        fullTable(
          ['Crit\u00e8re RGAA', 'Statut'],
          [
            ['Navigation au clavier', 'Conforme'],
            ['Attributs ARIA (r\u00f4les, labels)', 'Conforme'],
            ['Contraste des textes (AA)', 'Conforme'],
            ['Taille de texte ajustable', 'Conforme'],
            ['Interligne ajustable', 'Conforme'],
            ['Mode contraste renforc\u00e9', 'Conforme'],
            ['Animations r\u00e9ductibles', 'Conforme'],
            ['Lecture vocale (TTS) sur chaque message', 'Conforme'],
            ['Support multilingue (10 langues)', 'Conforme'],
            ['Formulaires accessibles', 'Conforme'],
            ['Textes alternatifs images et ic\u00f4nes', 'Conforme'],
            ['Sous-titres / transcriptions audio (Whisper)', 'Conforme'],
            ['Compatible lecteurs d\u2019\u00e9cran (NVDA/VoiceOver)', 'Conforme'],
            ['Documentation accessibilit\u00e9 (RGAA 4.1)', 'Conforme'],
          ],
          [6500, 2526],
        ),
        spacer(100),
        para('La page de d\u00e9claration d\u2019accessibilit\u00e9 est accessible publiquement \u00e0 l\u2019adresse /accessibilite et d\u00e9taille l\u2019ensemble des am\u00e9nagements r\u00e9alis\u00e9s ainsi que les voies de recours en cas de difficult\u00e9.'),

        // 4.4
        heading2('4.4 Support multilingue (10 langues)'),
        para('Catch\u2019Up prend en charge 10 langues pour r\u00e9pondre aux besoins d\u2019un public diversifi\u00e9. L\u2019utilisateur peut changer de langue \u00e0 tout moment pendant la conversation, et l\u2019assistant IA s\u2019adapte imm\u00e9diatement.'),
        fullTable(
          ['Langue', 'Code', 'Disponibilit\u00e9'],
          [
            ['Fran\u00e7ais', 'fr', 'Langue par d\u00e9faut'],
            ['Anglais', 'en', 'Complet'],
            ['Arabe', 'ar', 'Complet (RTL support\u00e9)'],
            ['Portugais', 'pt', 'Complet'],
            ['Turc', 'tr', 'Complet'],
            ['Italien', 'it', 'Complet'],
            ['Espagnol', 'es', 'Complet'],
            ['Allemand', 'de', 'Complet'],
            ['Roumain', 'ro', 'Complet'],
            ['Chinois', 'zh', 'Complet'],
          ],
          [3500, 1500, 4026],
        ),
        spacer(100),
        para('Le changement de langue affecte non seulement l\u2019interface de chat, mais aussi les suggestions, les messages syst\u00e8me et la transcription vocale. L\u2019IA est capable de maintenir une conversation fluide dans chacune de ces langues.'),

        // 4.5
        heading2('4.5 Lecture vocale (TTS)'),
        para('La fonctionnalit\u00e9 de lecture vocale (Text-to-Speech) permet \u00e0 tout utilisateur d\u2019\u00e9couter les messages de l\u2019assistant IA plut\u00f4t que de les lire. Cette fonctionnalit\u00e9 est particuli\u00e8rement utile pour :'),
        bulletItem('Les personnes en situation de handicap visuel.'),
        bulletItem('Les personnes ayant des difficult\u00e9s de lecture (dyslexie, illettrisme).'),
        bulletItem('Les utilisateurs pr\u00e9f\u00e9rant l\u2019\u00e9coute \u00e0 la lecture (mobilit\u00e9, multit\u00e2che).'),
        para('La lecture vocale utilise l\u2019API Web Speech du navigateur, ce qui garantit une synth\u00e8se vocale naturelle dans la langue s\u00e9lectionn\u00e9e. Le bouton de lecture est pr\u00e9sent sur chaque message, et un mode de lecture automatique peut \u00eatre activ\u00e9 depuis le panneau d\u2019accessibilit\u00e9.'),
        para('La voix et la vitesse de lecture s\u2019adaptent automatiquement \u00e0 la langue de la conversation. L\u2019utilisateur peut interrompre la lecture \u00e0 tout moment en cliquant de nouveau sur le bouton.'),

        // 4.6
        heading2('4.6 Panneau d\u2019accessibilit\u00e9'),
        para('Le panneau d\u2019accessibilit\u00e9 est un composant d\u00e9di\u00e9 permettant \u00e0 chaque utilisateur de personnaliser l\u2019affichage de l\u2019application selon ses besoins. Il est accessible via un bouton dans l\u2019en-t\u00eate de la page.'),
        para('Les r\u00e9glages disponibles sont :'),
        fullTable(
          ['R\u00e9glage', 'Options', 'Description'],
          [
            ['Taille de texte', 'Normal / Grand / Tr\u00e8s grand', 'Augmente la taille de tous les textes de l\u2019interface'],
            ['Contraste renforc\u00e9', 'Activ\u00e9 / D\u00e9sactiv\u00e9', 'Augmente le contraste des couleurs pour une meilleure lisibilit\u00e9'],
            ['R\u00e9duction des animations', 'Activ\u00e9 / D\u00e9sactiv\u00e9', 'D\u00e9sactive toutes les animations et transitions'],
            ['Interligne augment\u00e9', 'Activ\u00e9 / D\u00e9sactiv\u00e9', 'Augmente l\u2019espacement entre les lignes de texte'],
            ['Lecture vocale', 'Activ\u00e9 / D\u00e9sactiv\u00e9', 'Active la synth\u00e8se vocale automatique des messages'],
          ],
          [2500, 2800, 3726],
        ),
        spacer(100),
        para('Tous les r\u00e9glages sont sauvegard\u00e9s automatiquement dans le navigateur (localStorage) et restaur\u00e9s \u00e0 chaque visite. Ils sont appliqu\u00e9s instantan\u00e9ment sans rechargement de la page.'),
      ],
    },

    // ================================================================
    // 5. GUIDE D'ADMINISTRATION
    // ================================================================
    {
      ...sectionProps(),
      children: [
        heading1('5. Guide d\u2019administration'),
        para('Ce chapitre s\u2019adresse aux administrateurs de la plateforme Catch\u2019Up. Il d\u00e9crit les fonctionnalit\u00e9s de gestion avanc\u00e9es r\u00e9serv\u00e9es aux utilisateurs disposant des droits d\u2019administration.'),

        // 5.1
        heading2('5.1 R\u00f4les et permissions'),
        para('Catch\u2019Up d\u00e9finit trois niveaux de r\u00f4les avec des permissions croissantes :'),
        fullTable(
          ['R\u00f4le', 'Permissions', 'Acc\u00e8s'],
          [
            ['Conseiller', 'File active, messagerie, agenda, fiches b\u00e9n\u00e9ficiaires', 'Donn\u00e9es de sa structure uniquement'],
            ['Administrateur', 'Tout ce que le conseiller + gestion des conseillers, structures, campagnes', 'Donn\u00e9es de ses structures'],
            ['Super-administrateur', 'Acc\u00e8s complet \u00e0 toutes les fonctionnalit\u00e9s', 'Toutes les structures et donn\u00e9es'],
          ],
          [2500, 3800, 2726],
        ),
        spacer(100),
        para('Le r\u00f4le est attribu\u00e9 lors de la cr\u00e9ation du compte et peut \u00eatre modifi\u00e9 ult\u00e9rieurement par un administrateur ou super-administrateur. Un conseiller ne peut pas s\u2019attribuer un r\u00f4le sup\u00e9rieur.'),
        para('Le syst\u00e8me de permissions est v\u00e9rifi\u00e9 \u00e0 la fois c\u00f4t\u00e9 client (masquage des menus et boutons non autoris\u00e9s) et c\u00f4t\u00e9 serveur (validation des droits \u00e0 chaque appel API), garantissant une s\u00e9curit\u00e9 robuste.'),

        // 5.2
        heading2('5.2 Cr\u00e9er un compte conseiller'),
        para('La cr\u00e9ation d\u2019un compte conseiller est r\u00e9serv\u00e9e aux administrateurs. Voici la proc\u00e9dure \u00e0 suivre :'),
        imageOrPlaceholder(ssConseillers, 'Page de gestion des conseillers', 500, 310),
        numberedItem('Acc\u00e9dez \u00e0 la section \u00ab Conseillers \u00bb depuis le menu lat\u00e9ral.'),
        numberedItem('Cliquez sur le bouton \u00ab Ajouter un conseiller \u00bb.'),
        numberedItem('Remplissez le formulaire : pr\u00e9nom, nom, adresse e-mail, r\u00f4le souhait\u00e9.'),
        numberedItem('D\u00e9finissez un mot de passe temporaire (le conseiller devra le changer \u00e0 sa premi\u00e8re connexion).'),
        numberedItem('S\u00e9lectionnez la ou les structures auxquelles le conseiller sera rattach\u00e9.'),
        numberedItem('Validez la cr\u00e9ation. Un e-mail d\u2019invitation est envoy\u00e9 au conseiller.'),
        para('Le mot de passe est imm\u00e9diatement hach\u00e9 (bcrypt) et n\u2019est jamais stock\u00e9 en clair. L\u2019administrateur ne peut pas consulter les mots de passe des conseillers, mais peut en g\u00e9n\u00e9rer de nouveaux en cas d\u2019oubli.'),
        warningBox('Bonnes pratiques', 'Exigez des mots de passe d\u2019au moins 12 caract\u00e8res combinant majuscules, minuscules, chiffres et caract\u00e8res sp\u00e9ciaux. Changez le mot de passe temporaire d\u00e8s la premi\u00e8re connexion.'),

        // 5.3
        heading2('5.3 G\u00e9rer les structures'),
        para('La gestion des structures est un \u00e9l\u00e9ment central de l\u2019administration de Catch\u2019Up. Chaque structure repr\u00e9sente une entit\u00e9 physique ou organisationnelle qui utilise la plateforme.'),
        para('Pour cr\u00e9er une nouvelle structure :'),
        numberedItem('Acc\u00e9dez \u00e0 la section \u00ab Structures \u00bb depuis le menu lat\u00e9ral.'),
        numberedItem('Cliquez sur \u00ab Ajouter une structure \u00bb.'),
        numberedItem('Renseignez le nom de la structure, sa description et son slug (identifiant URL unique).'),
        numberedItem('Uploadez le logo de la structure (optionnel, utilis\u00e9 dans l\u2019en-t\u00eate b\u00e9n\u00e9ficiaire).'),
        numberedItem('D\u00e9finissez le message de bienvenue personnalis\u00e9 (optionnel).'),
        numberedItem('Validez la cr\u00e9ation.'),
        para('Le slug de la structure est utilis\u00e9 dans les URLs de campagne et d\u2019acc\u00e8s direct. Par exemple, une structure avec le slug \u00ab mission-locale-lyon \u00bb permettra de g\u00e9n\u00e9rer des liens de type https://catchup.fondation-jae.org/chat?s=mission-locale-lyon.'),
        para('La page de gestion d\u2019une structure affiche \u00e9galement des statistiques d\u2019utilisation : nombre de b\u00e9n\u00e9ficiaires, de conversations, de demandes d\u2019accompagnement et de campagnes actives.'),

        // 5.4
        heading2('5.4 Configurer les campagnes'),
        para('Les campagnes permettent de tracer et de mesurer l\u2019impact des actions d\u2019orientation men\u00e9es par une structure. La cr\u00e9ation d\u2019une campagne suit les \u00e9tapes suivantes :'),
        numberedItem('Depuis la section \u00ab Campagnes \u00bb, cliquez sur \u00ab Nouvelle campagne \u00bb.'),
        numberedItem('Choisissez la structure \u00e0 laquelle rattacher la campagne.'),
        numberedItem('Donnez un nom \u00e0 la campagne (par exemple : \u00ab Forum orientation Mars 2026 \u00bb).'),
        numberedItem('D\u00e9finissez les dates de d\u00e9but et de fin (optionnel).'),
        numberedItem('Ajoutez une description et des objectifs.'),
        numberedItem('Le syst\u00e8me g\u00e9n\u00e8re automatiquement un lien d\u2019acc\u00e8s et un QR code.'),
        para('Le QR code peut \u00eatre t\u00e9l\u00e9charg\u00e9 au format image et imprim\u00e9 sur des supports physiques (affiches, flyers, cartes de visite). Il redirige directement vers Catch\u2019Up avec le contexte de la campagne pr\u00e9-configur\u00e9.'),
        para('Les statistiques de campagne sont mises \u00e0 jour en temps r\u00e9el et incluent des indicateurs cl\u00e9s comme le nombre de scans du QR code, le taux de conversion et le nombre de profils RIASEC compl\u00e9t\u00e9s.'),

        // 5.5
        heading2('5.5 Tableau de bord administrateur'),
        para('Le tableau de bord administrateur offre une vue globale et transversale de l\u2019activit\u00e9 de la plateforme. Il compl\u00e8te le dashboard conseiller avec des indicateurs strat\u00e9giques :'),
        bulletItem('Nombre total de b\u00e9n\u00e9ficiaires, de conversations et de demandes sur une p\u00e9riode donn\u00e9e.', 'Vue d\u2019ensemble :'),
        bulletItem('\u00c9volution du nombre de b\u00e9n\u00e9ficiaires et de demandes dans le temps.', 'Tendances :'),
        bulletItem('Indicateurs de performance par structure et par campagne.', 'Comparaison :'),
        bulletItem('Possibilit\u00e9 d\u2019exporter les donn\u00e9es au format Excel (xlsx) pour des analyses personnalis\u00e9es.', 'Export :'),
        para('Les graphiques sont g\u00e9n\u00e9r\u00e9s avec la biblioth\u00e8que Recharts, offrant des visualisations interactives et esth\u00e9tiques. L\u2019administrateur peut filtrer les donn\u00e9es par p\u00e9riode, par structure et par campagne.'),
      ],
    },

    // ================================================================
    // 6. BONNES PRATIQUES
    // ================================================================
    {
      ...sectionProps(),
      children: [
        heading1('6. Bonnes pratiques'),
        para('Ce chapitre rassemble des recommandations concr\u00e8tes pour tirer le meilleur parti de Catch\u2019Up dans la pratique quotidienne de l\u2019orientation.'),

        // 6.1
        heading2('6.1 Accompagner un b\u00e9n\u00e9ficiaire'),
        para('L\u2019accompagnement d\u2019un b\u00e9n\u00e9ficiaire via Catch\u2019Up suit une m\u00e9thodologie \u00e9prouv\u00e9e qui combine l\u2019expertise humaine du conseiller et les capacit\u00e9s analytiques de l\u2019IA :'),
        richPara([{ text: '1. Prendre connaissance du profil : ', bold: true }, 'Avant le premier contact, consultez la fiche b\u00e9n\u00e9ficiaire et lisez attentivement l\u2019historique de conversation avec l\u2019IA. Cela vous donnera un contexte pr\u00e9cieux et \u00e9vitera de poser des questions d\u00e9j\u00e0 abord\u00e9es.']),
        richPara([{ text: '2. Analyser le profil RIASEC : ', bold: true }, 'V\u00e9rifiez l\u2019indice de confiance. Si le profil est encore \u00ab \u00c9mergent \u00bb, encouragez le b\u00e9n\u00e9ficiaire \u00e0 poursuivre la conversation avec l\u2019IA ou \u00e0 passer le quiz d\u2019orientation.']),
        richPara([{ text: '3. Personnaliser l\u2019\u00e9change : ', bold: true }, 'Utilisez la messagerie directe pour entamer un dialogue personnalis\u00e9. R\u00e9f\u00e9rez-vous aux \u00e9l\u00e9ments concrets \u00e9voqu\u00e9s dans la conversation IA pour montrer que vous avez pris le temps de comprendre la situation.']),
        richPara([{ text: '4. Proposer un plan d\u2019action : ', bold: true }, 'Sur la base du profil RIASEC et de vos \u00e9changes, \u00e9tablissez un plan d\u2019orientation concret avec des \u00e9tapes claires.']),
        richPara([{ text: '5. Planifier le suivi : ', bold: true }, 'Utilisez l\u2019agenda pour fixer des points de suivi r\u00e9guliers. L\u2019accompagnement ne se limite pas \u00e0 un seul \u00e9change.']),

        // 6.2
        heading2('6.2 Traiter les demandes urgentes'),
        para('Certaines demandes n\u00e9cessitent une attention prioritaire. Catch\u2019Up int\u00e8gre un syst\u00e8me de d\u00e9tection de fragilit\u00e9 qui signale automatiquement les b\u00e9n\u00e9ficiaires en situation de vuln\u00e9rabilit\u00e9.'),
        para('Les indicateurs de fragilit\u00e9 incluent :'),
        bulletItem('Mentions de difficult\u00e9s sociales ou financi\u00e8res dans la conversation IA.'),
        bulletItem('Signes de d\u00e9crochage scolaire ou professionnel.'),
        bulletItem('Expressions de d\u00e9tresse ou de d\u00e9couragement.'),
        bulletItem('Isolement social mentionn\u00e9 dans les \u00e9changes.'),
        para('Lorsqu\u2019un niveau de fragilit\u00e9 \u00e9lev\u00e9 est d\u00e9tect\u00e9, le conseiller re\u00e7oit une notification d\u2019alerte et la demande est signal\u00e9e visuellement dans la file active. Il est recommand\u00e9 de traiter ces demandes en priorit\u00e9 et d\u2019\u00e9tablir un contact dans les 24 heures.'),
        warningBox('Rappel', 'La d\u00e9tection de fragilit\u00e9 est un outil d\u2019aide, pas un diagnostic. Le jugement humain du conseiller reste primordial pour \u00e9valuer la situation r\u00e9elle du b\u00e9n\u00e9ficiaire.'),

        // 6.3
        heading2('6.3 Utiliser l\u2019assistant IA du conseiller'),
        para('L\u2019espace conseiller dispose de son propre assistant IA, distinct de celui du b\u00e9n\u00e9ficiaire. Cet assistant aide le conseiller dans ses t\u00e2ches quotidiennes :'),
        bulletItem('R\u00e9daction de messages personnalis\u00e9s pour les b\u00e9n\u00e9ficiaires.'),
        bulletItem('Synth\u00e8se de l\u2019historique de conversation d\u2019un b\u00e9n\u00e9ficiaire.'),
        bulletItem('Suggestions de pistes d\u2019orientation bas\u00e9es sur le profil RIASEC.'),
        bulletItem('Aide \u00e0 la r\u00e9daction de notes et de comptes-rendus.'),
        para('L\u2019assistant IA du conseiller est un outil de productivit\u00e9 qui ne remplace pas le jugement professionnel. Les suggestions de l\u2019IA doivent toujours \u00eatre valid\u00e9es par le conseiller avant d\u2019\u00eatre communiqu\u00e9es au b\u00e9n\u00e9ficiaire.'),
        para('Pour obtenir les meilleurs r\u00e9sultats, formulez vos demandes de mani\u00e8re pr\u00e9cise et contextuelle. Par exemple, plut\u00f4t que \u00ab R\u00e9sume le profil \u00bb, demandez \u00ab Quels sont les 3 points cl\u00e9s du profil RIASEC de ce b\u00e9n\u00e9ficiaire et quelles pistes d\u2019orientation en d\u00e9coulent ? \u00bb.'),

        // 6.4
        heading2('6.4 S\u00e9curit\u00e9 et confidentialit\u00e9'),
        para('La s\u00e9curit\u00e9 des donn\u00e9es est une priorit\u00e9 absolue de Catch\u2019Up. Voici les mesures mises en place et les bonnes pratiques \u00e0 adopter :'),
        richPara([{ text: 'Donn\u00e9es b\u00e9n\u00e9ficiaires : ', bold: true }, 'Les conversations sont stock\u00e9es c\u00f4t\u00e9 client (localStorage) et ne sont pas accessibles au serveur sauf lors d\u2019une demande d\u2019accompagnement, o\u00f9 l\u2019historique est transmis de mani\u00e8re chiffr\u00e9e.']),
        richPara([{ text: 'Mots de passe : ', bold: true }, 'Tous les mots de passe sont hach\u00e9s avec bcrypt (co\u00fbt 12). Aucun mot de passe n\u2019est stock\u00e9 en clair.']),
        richPara([{ text: 'Sessions : ', bold: true }, 'Les jetons JWT sont sign\u00e9s cryptographiquement et stock\u00e9s dans des cookies httpOnly, inaccessibles au JavaScript c\u00f4t\u00e9 client.']),
        richPara([{ text: 'Communications : ', bold: true }, 'Toutes les communications sont chiffr\u00e9es via HTTPS/WSS (TLS 1.3).']),
        para('Bonnes pratiques pour les conseillers :'),
        bulletItem('Ne partagez jamais vos identifiants de connexion.'),
        bulletItem('Verrouillez votre session lorsque vous quittez votre poste.'),
        bulletItem('Ne communiquez pas d\u2019informations personnelles de b\u00e9n\u00e9ficiaires en dehors de la plateforme.'),
        bulletItem('Signalez imm\u00e9diatement toute activit\u00e9 suspecte \u00e0 votre administrateur.'),
        bulletItem('Utilisez un mot de passe unique et robuste pour votre compte Catch\u2019Up.'),
      ],
    },

    // ================================================================
    // ANNEXES
    // ================================================================
    {
      ...sectionProps(),
      children: [
        heading1('Annexes'),

        // A. Glossaire
        heading2('A. Glossaire'),
        para('Ce glossaire d\u00e9finit les termes cl\u00e9s utilis\u00e9s dans Catch\u2019Up et dans ce manuel.'),
        fullTable(
          ['Terme', 'D\u00e9finition'],
          [
            ['B\u00e9n\u00e9ficiaire', 'Personne utilisant Catch\u2019Up pour explorer son orientation professionnelle.'],
            ['Campagne', 'Action d\u2019orientation organis\u00e9e avec un lien et un QR code d\u2019acc\u00e8s d\u00e9di\u00e9s.'],
            ['Conseiller', 'Professionnel de l\u2019orientation accompagnant les b\u00e9n\u00e9ficiaires via la plateforme.'],
            ['File active', 'Liste des demandes d\u2019accompagnement en cours de traitement.'],
            ['Indice de confiance', 'Mesure de la fiabilit\u00e9 du profil RIASEC (D\u00e9but, \u00c9mergent, Pr\u00e9cis, Fiable).'],
            ['JWT', 'JSON Web Token \u2014 jeton d\u2019authentification s\u00e9curis\u00e9 utilis\u00e9 pour les sessions conseiller.'],
            ['PWA', 'Progressive Web App \u2014 application web installable fonctionnant comme une app native.'],
            ['RGAA', 'R\u00e9f\u00e9rentiel G\u00e9n\u00e9ral d\u2019Am\u00e9lioration de l\u2019Accessibilit\u00e9 \u2014 norme fran\u00e7aise d\u2019accessibilit\u00e9.'],
            ['RIASEC', 'Mod\u00e8le de Holland d\u00e9crivant 6 types de personnalit\u00e9 professionnelle.'],
            ['Slug', 'Identifiant URL unique d\u2019une structure (ex : \u00ab mission-locale-lyon \u00bb).'],
            ['Structure', 'Organisation utilisant Catch\u2019Up (Mission Locale, CIO, \u00e9cole, etc.).'],
            ['TTS', 'Text-to-Speech \u2014 synth\u00e8se vocale pour la lecture \u00e0 voix haute.'],
            ['WebSocket', 'Protocole de communication bidirectionnelle en temps r\u00e9el.'],
            ['Whisper', 'Mod\u00e8le IA d\u2019OpenAI pour la transcription audio en texte.'],
          ],
          [2500, 6526],
        ),
        spacer(100),

        pageBreak(),

        // B. Raccourcis clavier
        heading2('B. Raccourcis clavier'),
        para('Catch\u2019Up supporte la navigation compl\u00e8te au clavier. Voici les raccourcis disponibles :'),
        fullTable(
          ['Raccourci', 'Action', 'Contexte'],
          [
            ['Tab', 'Naviguer vers l\u2019\u00e9l\u00e9ment suivant', 'Toutes les pages'],
            ['Maj + Tab', 'Naviguer vers l\u2019\u00e9l\u00e9ment pr\u00e9c\u00e9dent', 'Toutes les pages'],
            ['Entr\u00e9e', 'Envoyer un message / Activer un bouton', 'Zone de chat / Boutons'],
            ['Maj + Entr\u00e9e', 'Retour \u00e0 la ligne dans le champ de saisie', 'Zone de saisie'],
            ['\u00c9chap', 'Fermer un panneau / une modale', 'Panneaux, modales'],
            ['Espace', 'Activer un bouton / une case \u00e0 cocher', 'Boutons, cases'],
            ['Fl\u00e8ches', 'Naviguer dans les suggestions', 'Suggestions'],
            ['Ctrl + L', 'Vider la conversation', 'Zone de chat'],
          ],
          [2200, 4200, 2626],
        ),
        spacer(100),
        para('Tous les \u00e9l\u00e9ments interactifs disposent d\u2019un indicateur de focus visible (contour) conforme aux exigences RGAA. L\u2019ordre de tabulation suit une logique naturelle de lecture (de haut en bas, de gauche \u00e0 droite).'),

        pageBreak(),

        // C. FAQ
        heading2('C. Foire aux questions (FAQ)'),
        spacer(50),

        heading3('Q : Le b\u00e9n\u00e9ficiaire doit-il cr\u00e9er un compte ?'),
        para('Non. L\u2019espace b\u00e9n\u00e9ficiaire est accessible sans inscription. Les donn\u00e9es sont stock\u00e9es localement dans le navigateur. Seule la demande d\u2019accompagnement n\u00e9cessite de fournir des informations de contact.'),
        spacer(50),

        heading3('Q : Que se passe-t-il si le b\u00e9n\u00e9ficiaire efface les donn\u00e9es de son navigateur ?'),
        para('L\u2019historique de conversation et le profil RIASEC seront perdus. Cependant, si une demande d\u2019accompagnement a \u00e9t\u00e9 envoy\u00e9e, les donn\u00e9es sont \u00e9galement enregistr\u00e9es c\u00f4t\u00e9 serveur et restent accessibles au conseiller.'),
        spacer(50),

        heading3('Q : Combien de temps les donn\u00e9es sont-elles conserv\u00e9es ?'),
        para('Les donn\u00e9es c\u00f4t\u00e9 client (navigateur) persistent tant que le cache n\u2019est pas vid\u00e9. Les donn\u00e9es c\u00f4t\u00e9 serveur (demandes, fiches b\u00e9n\u00e9ficiaires) sont conserv\u00e9es conform\u00e9ment \u00e0 la politique de conservation de la Fondation JAE et aux exigences du RGPD.'),
        spacer(50),

        heading3('Q : L\u2019IA peut-elle acc\u00e9der aux donn\u00e9es personnelles ?'),
        para('L\u2019assistant IA n\u2019a acc\u00e8s qu\u2019au contenu de la conversation en cours. Il ne conserve aucune donn\u00e9e entre les sessions et ne peut pas consulter les donn\u00e9es d\u2019autres b\u00e9n\u00e9ficiaires. Les \u00e9changes avec l\u2019IA sont trait\u00e9s via l\u2019API OpenAI, soumise \u00e0 des conditions strictes de confidentialit\u00e9.'),
        spacer(50),

        heading3('Q : Comment r\u00e9initialiser le mot de passe d\u2019un conseiller ?'),
        para('Un administrateur peut r\u00e9initialiser le mot de passe depuis la section \u00ab Conseillers \u00bb de l\u2019espace d\u2019administration. Le conseiller recevra un nouveau mot de passe temporaire par e-mail.'),
        spacer(50),

        heading3('Q : Catch\u2019Up est-il compatible avec les lecteurs d\u2019\u00e9cran ?'),
        para('Oui. Catch\u2019Up est enti\u00e8rement compatible avec les lecteurs d\u2019\u00e9cran NVDA (Windows) et VoiceOver (macOS/iOS). Tous les composants interactifs disposent d\u2019attributs ARIA d\u00e9crivant leur r\u00f4le et leur \u00e9tat.'),
        spacer(50),

        heading3('Q : Peut-on utiliser Catch\u2019Up sur un smartphone ?'),
        para('Oui. L\u2019interface est enti\u00e8rement responsive et optimis\u00e9e pour les \u00e9crans mobiles. Pour une exp\u00e9rience optimale, installez l\u2019application en tant que PWA depuis le menu de votre navigateur. Une application Android native est \u00e9galement disponible via Capacitor.'),
        spacer(50),

        heading3('Q : Comment signaler un bug ou une am\u00e9lioration ?'),
        para('Contactez l\u2019\u00e9quipe technique de la Fondation JAE par e-mail ou via le formulaire de support int\u00e9gr\u00e9 \u00e0 l\u2019espace conseiller (section Param\u00e8tres > Support).'),
        spacer(50),

        heading3('Q : Les conversations avec l\u2019IA sont-elles enregistr\u00e9es ?'),
        para('Les conversations sont stock\u00e9es uniquement dans le navigateur du b\u00e9n\u00e9ficiaire (localStorage). Elles ne sont envoy\u00e9es au serveur que si le b\u00e9n\u00e9ficiaire demande un accompagnement. L\u2019IA traite les messages en temps r\u00e9el sans les conserver.'),

        spacer(400),
        divider(),
        spacer(100),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [
            new ImageRun({
              type: 'png',
              data: logoBuffer,
              transformation: { width: 60, height: 60 },
              altText: { title: 'Logo Catch\u2019Up', description: 'Logo Catch\u2019Up', name: 'logo-footer' },
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: 'Catch\u2019Up V2.0 \u2014 Fondation JAE', bold: true, size: 20, font: 'Arial', color: PRIMARY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: 'Document g\u00e9n\u00e9r\u00e9 le ' + new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }), size: 18, font: 'Arial', color: MID_GRAY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: '\u00a9 2026 Fondation JAE \u2014 Tous droits r\u00e9serv\u00e9s', size: 18, font: 'Arial', color: MID_GRAY })],
        }),
      ],
    },
  ],
});

// ─── Generate ─────────────────────────────────────────────────────────────
const outputPath = path.join(__dirname, '..', 'Manuel_Formation_CatchUp_V2.0_illustre.docx');

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`Document genere avec succes : ${outputPath}`);
  console.log(`Taille : ${(buffer.length / 1024).toFixed(1)} Ko`);

  // Basic validation
  const ZIP_MAGIC = buffer.slice(0, 4).toString('hex');
  if (ZIP_MAGIC === '504b0304') {
    console.log('Validation : OK (format ZIP/DOCX valide)');
  } else {
    console.error('ERREUR : Le fichier genere n\'est pas un ZIP valide !');
    process.exit(1);
  }
}).catch(err => {
  console.error('Erreur lors de la generation :', err);
  process.exit(1);
});
