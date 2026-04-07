const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageBreak, PageNumber, ExternalHyperlink, LevelFormat,
  TabStopType, TabStopPosition
} = require("docx");

// ─── COULEURS ───
const BLUE_DARK = "1B3A5C";
const BLUE_MED = "2E75B6";
const BLUE_LIGHT = "D5E8F0";
const BLUE_LIGHTER = "EAF3F8";
const GREEN = "2E7D32";
const GREEN_LIGHT = "E8F5E9";
const ORANGE = "E65100";
const ORANGE_LIGHT = "FFF3E0";
const GRAY = "F5F5F5";
const GRAY_MED = "666666";
const WHITE = "FFFFFF";

// ─── HELPERS ───
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorders = {
  top: { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left: { style: BorderStyle.NONE, size: 0 },
  right: { style: BorderStyle.NONE, size: 0 },
};
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };
const PAGE_WIDTH = 9360; // A4 with 1" margins

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, children: [new TextRun(text)], spacing: { before: 300, after: 200 } });
}

function para(text, opts = {}) {
  const runs = [];
  // Support simple bold markers **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  for (const part of parts) {
    if (part.startsWith("**") && part.endsWith("**")) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, font: "Arial", size: 21, ...opts }));
    } else {
      runs.push(new TextRun({ text: part, font: "Arial", size: 21, ...opts }));
    }
  }
  return new Paragraph({ children: runs, spacing: { after: 120 }, alignment: opts.align || AlignmentType.JUSTIFIED });
}

function bullet(text, ref = "bullets") {
  const runs = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  for (const part of parts) {
    if (part.startsWith("**") && part.endsWith("**")) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, font: "Arial", size: 21 }));
    } else {
      runs.push(new TextRun({ text: part, font: "Arial", size: 21 }));
    }
  }
  return new Paragraph({ numbering: { reference: ref, level: 0 }, children: runs, spacing: { after: 60 } });
}

function numberedItem(text, ref = "numbers") {
  const runs = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  for (const part of parts) {
    if (part.startsWith("**") && part.endsWith("**")) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, font: "Arial", size: 21 }));
    } else {
      runs.push(new TextRun({ text: part, font: "Arial", size: 21 }));
    }
  }
  return new Paragraph({ numbering: { reference: ref, level: 0 }, children: runs, spacing: { after: 60 } });
}

function spacer(pts = 200) {
  return new Paragraph({ spacing: { before: pts }, children: [] });
}

function cell(text, opts = {}) {
  const runs = [];
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  for (const part of parts) {
    if (part.startsWith("**") && part.endsWith("**")) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, font: "Arial", size: 18, color: opts.color || "000000" }));
    } else {
      runs.push(new TextRun({ text: part, font: "Arial", size: 18, bold: opts.bold || false, color: opts.color || "000000" }));
    }
  }
  return new TableCell({
    borders,
    width: { size: opts.width || 2340, type: WidthType.DXA },
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
    margins: cellMargins,
    verticalAlign: "center",
    children: [new Paragraph({ children: runs, alignment: opts.align || AlignmentType.LEFT })],
  });
}

function tableRow(cells) {
  return new TableRow({ children: cells });
}

function makeTable(headers, rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const headerRow = tableRow(
    headers.map((h, i) => cell(h, { bold: true, width: colWidths[i], shading: BLUE_DARK, color: WHITE }))
  );
  const dataRows = rows.map((row, ri) =>
    tableRow(row.map((c, ci) => cell(c, { width: colWidths[ci], shading: ri % 2 === 0 ? BLUE_LIGHTER : WHITE })))
  );
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  });
}

// Highlight box
function highlightBox(title, text, fillColor = ORANGE_LIGHT) {
  return new Table({
    width: { size: PAGE_WIDTH, type: WidthType.DXA },
    columnWidths: [PAGE_WIDTH],
    rows: [
      tableRow([
        new TableCell({
          borders: { top: { style: BorderStyle.SINGLE, size: 6, color: ORANGE }, bottom: border, left: border, right: border },
          width: { size: PAGE_WIDTH, type: WidthType.DXA },
          shading: { fill: fillColor, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 200, right: 200 },
          children: [
            new Paragraph({ children: [new TextRun({ text: title, bold: true, font: "Arial", size: 22, color: ORANGE })], spacing: { after: 80 } }),
            new Paragraph({ children: [new TextRun({ text, font: "Arial", size: 20 })], alignment: AlignmentType.JUSTIFIED }),
          ],
        }),
      ]),
    ],
  });
}

function greenBox(title, text) {
  return new Table({
    width: { size: PAGE_WIDTH, type: WidthType.DXA },
    columnWidths: [PAGE_WIDTH],
    rows: [
      tableRow([
        new TableCell({
          borders: { top: { style: BorderStyle.SINGLE, size: 6, color: GREEN }, bottom: border, left: border, right: border },
          width: { size: PAGE_WIDTH, type: WidthType.DXA },
          shading: { fill: GREEN_LIGHT, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 200, right: 200 },
          children: [
            new Paragraph({ children: [new TextRun({ text: title, bold: true, font: "Arial", size: 22, color: GREEN })], spacing: { after: 80 } }),
            new Paragraph({ children: [new TextRun({ text, font: "Arial", size: 20 })], alignment: AlignmentType.JUSTIFIED }),
          ],
        }),
      ]),
    ],
  });
}

// ─── DOCUMENT ───
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: BLUE_DARK },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: BLUE_MED },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: BLUE_MED },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers2", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers3", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers4", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [
    // ════════════════════════════════════════════
    // PAGE DE GARDE
    // ════════════════════════════════════════════
    {
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
      },
      children: [
        spacer(2400),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [
          new TextRun({ text: "CATCH'UP", font: "Arial", size: 72, bold: true, color: BLUE_DARK }),
        ] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [
          new TextRun({ text: "Ton guide orientation", font: "Arial", size: 32, italics: true, color: BLUE_MED }),
        ] }),
        spacer(400),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "\u2500".repeat(40), color: BLUE_MED, size: 24 }),
        ] }),
        spacer(400),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [
          new TextRun({ text: "MOD\u00c8LE \u00c9CONOMIQUE", font: "Arial", size: 48, bold: true, color: BLUE_DARK }),
        ] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [
          new TextRun({ text: "Analyse des co\u00fbts, tarification & retour sur investissement", font: "Arial", size: 24, color: GRAY_MED }),
        ] }),
        spacer(800),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [
          new TextRun({ text: "Fondation JAE", font: "Arial", size: 26, bold: true, color: BLUE_DARK }),
        ] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [
          new TextRun({ text: "Version 1.0 \u2014 Avril 2026", font: "Arial", size: 22, color: GRAY_MED }),
        ] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "Document confidentiel \u2014 Usage interne", font: "Arial", size: 20, italics: true, color: GRAY_MED }),
        ] }),
      ],
    },
    // ════════════════════════════════════════════
    // TABLE DES MATIERES + CONTENU
    // ════════════════════════════════════════════
    {
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [
              new TextRun({ text: "Catch'Up \u2014 Mod\u00e8le \u00c9conomique", font: "Arial", size: 16, color: GRAY_MED, italics: true }),
            ],
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE_MED, space: 4 } },
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Fondation JAE \u2014 Confidentiel \u2014 Page ", font: "Arial", size: 16, color: GRAY_MED }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: GRAY_MED }),
            ],
          })],
        }),
      },
      children: [
        // ──── TABLE DES MATIERES ────
        heading("Table des mati\u00e8res"),
        para("1.  Synth\u00e8se ex\u00e9cutive"),
        para("2.  Principes fondateurs du mod\u00e8le"),
        para("3.  Analyse d\u00e9taill\u00e9e des co\u00fbts"),
        para("    3.1  Co\u00fbts d\u2019h\u00e9bergement et infrastructure"),
        para("    3.2  Co\u00fbts d\u2019intelligence artificielle (OpenAI)"),
        para("    3.3  Co\u00fbts de communication (SMS, email, push)"),
        para("    3.4  Co\u00fbts de d\u00e9veloppement et maintenance"),
        para("    3.5  Co\u00fbt complet par b\u00e9n\u00e9ficiaire"),
        para("4.  Grille tarifaire"),
        para("    4.1  Offre A \u2014 Licence par structure"),
        para("    4.2  Offre B \u2014 Convention territoriale"),
        para("    4.3  Offre C \u2014 Pay-per-Outcome (innovant)"),
        para("5.  Analyse d\u2019impact"),
        para("    5.1  Impact sur les b\u00e9n\u00e9ficiaires"),
        para("    5.2  Impact sur les conseillers"),
        para("    5.3  Impact sur les structures"),
        para("    5.4  Impact territorial (d\u00e9partement/r\u00e9gion)"),
        para("6.  Retour sur investissement (ROI)"),
        para("    6.1  ROI pour une structure d\u2019accompagnement"),
        para("    6.2  ROI pour un d\u00e9partement"),
        para("    6.3  ROI pour une r\u00e9gion"),
        para("7.  Projections financi\u00e8res \u00e0 3 ans"),
        para("8.  Leviers de revenus compl\u00e9mentaires"),
        para("9.  Strat\u00e9gie de p\u00e9n\u00e9tration commerciale"),
        para("10. Annexes"),

        new Paragraph({ children: [new PageBreak()] }),

        // ════════════════════════════════════════
        // 1. SYNTHESE EXECUTIVE
        // ════════════════════════════════════════
        heading("1. Synth\u00e8se ex\u00e9cutive"),
        para("Catch\u2019Up est une plateforme num\u00e9rique d\u2019orientation professionnelle d\u00e9velopp\u00e9e par la Fondation JAE, combinant intelligence artificielle conversationnelle (GPT-4o) et accompagnement humain pour les jeunes de 16 \u00e0 25 ans."),
        para("Le pr\u00e9sent document d\u00e9taille le mod\u00e8le \u00e9conomique de Catch\u2019Up, fond\u00e9 sur un principe intangible : **la gratuit\u00e9 totale pour le b\u00e9n\u00e9ficiaire**. La mon\u00e9tisation repose sur les structures d\u2019accompagnement (Missions Locales, E2C, CIO, CIDJ) et les collectivit\u00e9s territoriales (d\u00e9partements et r\u00e9gions)."),
        spacer(100),
        highlightBox(
          "Chiffres cl\u00e9s",
          "Co\u00fbt complet par b\u00e9n\u00e9ficiaire actif : 1,90 \u20ac \u00e0 5,73 \u20ac/mois selon le volume \u2022 Seuil de rentabilit\u00e9 : 25 structures clientes \u2022 ROI pour une Mission Locale (plan Pro) : 347% d\u00e8s la premi\u00e8re ann\u00e9e \u2022 ROI pour un d\u00e9partement (15 structures) : 520% \u2022 \u00c9quivalent capacit\u00e9 ajout\u00e9e : +30 \u00e0 50% par conseiller"
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // ════════════════════════════════════════
        // 2. PRINCIPES FONDATEURS
        // ════════════════════════════════════════
        heading("2. Principes fondateurs du mod\u00e8le"),
        para("Le mod\u00e8le \u00e9conomique de Catch\u2019Up repose sur quatre principes fondamentaux :"),
        spacer(60),
        numberedItem("**Gratuit\u00e9 pour le b\u00e9n\u00e9ficiaire** \u2014 Le jeune ne paye jamais. L\u2019acc\u00e8s au chat IA, au profil RIASEC, aux fiches m\u00e9tiers et \u00e0 la messagerie avec le conseiller est enti\u00e8rement gratuit, sans publicit\u00e9 ni collecte de donn\u00e9es commerciales."),
        numberedItem("**Valeur pour la structure** \u2014 La structure d\u2019accompagnement est le client payeur. Elle b\u00e9n\u00e9ficie d\u2019un outil de pilotage complet (dashboard, file active, campagnes, exports) qui augmente la capacit\u00e9 de ses conseillers."),
        numberedItem("**Mutualisation territoriale** \u2014 Les d\u00e9partements et r\u00e9gions peuvent acheter un pack territorial couvrant toutes leurs structures, avec un co\u00fbt unitaire nettement inf\u00e9rieur et une vision consolid\u00e9e des indicateurs."),
        numberedItem("**Alignement sur les r\u00e9sultats** \u2014 L\u2019offre innovante Pay-per-Outcome aligne les int\u00e9r\u00eats de JAE et des structures : si la plateforme ne produit pas de r\u00e9sultats, le co\u00fbt est minimal."),

        new Paragraph({ children: [new PageBreak()] }),

        // ════════════════════════════════════════
        // 3. ANALYSE DETAILLEE DES COUTS
        // ════════════════════════════════════════
        heading("3. Analyse d\u00e9taill\u00e9e des co\u00fbts"),
        para("Cette section d\u00e9compose l\u2019ensemble des co\u00fbts support\u00e9s par la Fondation JAE pour op\u00e9rer Catch\u2019Up. Les tarifs sont ceux en vigueur en avril 2026, apr\u00e8s la hausse Hetzner du 1er avril 2026."),

        // 3.1 HEBERGEMENT
        heading("3.1 Co\u00fbts d\u2019h\u00e9bergement et infrastructure", HeadingLevel.HEADING_2),
        para("Catch\u2019Up est h\u00e9berg\u00e9 sur un serveur d\u00e9di\u00e9 Hetzner Cloud en France (datacenter Falkenstein/Nuremberg), avec une architecture Docker (Next.js + PostgreSQL 16). Les tarifs ont \u00e9t\u00e9 mis \u00e0 jour au 1er avril 2026 avec une hausse de 25 \u00e0 33%."),
        spacer(80),

        // Table hebergement
        makeTable(
          ["Composante", "Sp\u00e9cification", "Co\u00fbt mensuel HT", "Co\u00fbt annuel HT"],
          [
            ["VPS Principal (app)", "CX32 : 4 vCPU, 8 Go RAM, 80 Go SSD", "8,84 \u20ac", "106,08 \u20ac"],
            ["VPS BDD (si s\u00e9par\u00e9)", "CX22 : 2 vCPU, 4 Go RAM, 40 Go SSD", "4,92 \u20ac", "59,04 \u20ac"],
            ["Volume Stockage 1 To", "Documents, uploads, backups PG", "57,00 \u20ac", "684,00 \u20ac"],
            ["Volume Stockage suppl. (opt.)", "Par 100 Go suppl\u00e9mentaires", "5,70 \u20ac", "68,40 \u20ac"],
            ["Adresse IPv4 flottante", "IP publique d\u00e9di\u00e9e", "3,29 \u20ac", "39,48 \u20ac"],
            ["Snapshots / Backups", "20% du co\u00fbt serveur (auto)", "2,75 \u20ac", "33,00 \u20ac"],
            ["Trafic sortant", "20 To inclus (largement suffisant)", "0,00 \u20ac", "0,00 \u20ac"],
            ["Domaine + DNS", "catchup.jaeprive.fr", "1,50 \u20ac", "18,00 \u20ac"],
            ["SSL Let\u2019s Encrypt", "Certificat auto-renouvellement", "0,00 \u20ac", "0,00 \u20ac"],
          ],
          [2800, 2800, 1880, 1880]
        ),
        spacer(100),

        highlightBox(
          "Total h\u00e9bergement",
          "Configuration actuelle (1 VPS + volume 1 To) : 78,30 \u20ac/mois soit 939,60 \u20ac/an HT. Configuration haute disponibilit\u00e9 (2 VPS + volume 1 To + snapshots) : 83,00 \u20ac/mois soit 996,00 \u20ac/an HT."
        ),
        spacer(80),

        para("**Sc\u00e9narios de mont\u00e9e en charge :**"),
        makeTable(
          ["Sc\u00e9nario", "B\u00e9n\u00e9ficiaires actifs", "Infrastructure requise", "Co\u00fbt mensuel"],
          [
            ["D\u00e9marrage", "< 500", "1x CX32 + 1 To volume", "78 \u20ac"],
            ["Croissance", "500 \u2013 2 000", "1x CX42 (8 vCPU, 16 Go) + 1 To", "95 \u20ac"],
            ["\u00c0 l\u2019\u00e9chelle", "2 000 \u2013 10 000", "1x CCX13 d\u00e9di\u00e9 + 2 To + r\u00e9plica PG", "165 \u20ac"],
            ["Volume national", "> 10 000", "2x CCX23 + load balancer + 5 To", "420 \u20ac"],
          ],
          [2000, 2200, 3160, 2000]
        ),
        spacer(80),
        para("Point cl\u00e9 : m\u00eame au sc\u00e9nario le plus ambitieux (10 000+ b\u00e9n\u00e9ficiaires), le co\u00fbt d\u2019h\u00e9bergement reste inf\u00e9rieur \u00e0 0,05 \u20ac par b\u00e9n\u00e9ficiaire par mois. **L\u2019h\u00e9bergement n\u2019est pas le poste de co\u00fbt critique** \u2014 c\u2019est l\u2019IA qui l\u2019est."),

        new Paragraph({ children: [new PageBreak()] }),

        // 3.2 COUTS IA
        heading("3.2 Co\u00fbts d\u2019intelligence artificielle (OpenAI)", HeadingLevel.HEADING_2),
        para("L\u2019IA est le poste de co\u00fbt variable le plus important. Catch\u2019Up utilise GPT-4o pour le chat b\u00e9n\u00e9ficiaire et l\u2019assistant conseiller, et Whisper pour la transcription vocale."),
        spacer(80),

        makeTable(
          ["Service", "Tarif (avril 2026)", "Usage moyen/b\u00e9n\u00e9f./mois", "Co\u00fbt/b\u00e9n\u00e9f./mois"],
          [
            ["GPT-4o (input tokens)", "2,50 $/M tokens", "~30 msg x 8 500 tok = 255 000 tok", "0,64 \u20ac"],
            ["GPT-4o (output tokens)", "10,00 $/M tokens", "~30 msg x 500 tok = 15 000 tok", "0,15 \u20ac"],
            ["GPT-4o-mini (assistant conseiller)", "0,15 $/M in + 0,60 $/M out", "~10 req x 3 000 tok", "< 0,01 \u20ac"],
            ["Whisper (transcription vocale)", "0,006 $/minute", "~2 msg vocaux x 30s", "< 0,01 \u20ac"],
            ["Cached input (prompt syst\u00e8me)", "1,25 $/M tokens (50% r\u00e9duction)", "Prompt syst\u00e8me r\u00e9current", "-0,10 \u20ac d\u2019\u00e9conomie"],
          ],
          [2400, 2200, 2880, 1880]
        ),
        spacer(100),

        greenBox(
          "Co\u00fbt IA total par b\u00e9n\u00e9ficiaire actif",
          "Estimation : 0,70 \u20ac/mois (usage mod\u00e9r\u00e9 : 30 messages). Fourchette : 0,25 \u20ac (utilisateur peu actif, 10 msg) \u00e0 1,80 \u20ac (utilisateur tr\u00e8s actif, 80 msg). Le token-guard int\u00e9gr\u00e9 limite automatiquement la consommation."
        ),
        spacer(80),

        para("**Leviers d\u2019optimisation des co\u00fbts IA :**"),
        bullet("**Cached inputs** : le prompt syst\u00e8me (identique d\u2019un message \u00e0 l\u2019autre) b\u00e9n\u00e9ficie du tarif r\u00e9duit \u00e0 1,25 $/M (\u00e9conomie de 50%)"),
        bullet("**Troncature intelligente** : le token-guard limite le contexte \u00e0 8 000 tokens, \u00e9vitant l\u2019explosion des co\u00fbts sur les longues conversations"),
        bullet("**Bascule GPT-4o-mini** : pour les requ\u00eates simples (FAQ m\u00e9tiers, reformulation), utiliser le mod\u00e8le mini (17x moins cher)"),
        bullet("**Batch API** : pour les analyses diff\u00e9r\u00e9es (rapports RIASEC nocturnes, d\u00e9tection fragilit\u00e9), le tarif batch offre 50% de r\u00e9duction"),
        bullet("**Max output tokens = 500** : chaque r\u00e9ponse IA est limit\u00e9e, emp\u00eachant les r\u00e9ponses trop longues et co\u00fbteuses"),

        new Paragraph({ children: [new PageBreak()] }),

        // 3.3 COUTS COMMUNICATION
        heading("3.3 Co\u00fbts de communication (SMS, email, push)", HeadingLevel.HEADING_2),
        para("Catch\u2019Up utilise trois canaux de notification : SMS (Vonage), email (Office 365 / Brevo) et push notifications (Web Push API)."),
        spacer(80),

        makeTable(
          ["Canal", "Fournisseur", "Co\u00fbt unitaire", "Usage/b\u00e9n\u00e9f./mois", "Co\u00fbt/b\u00e9n\u00e9f./mois"],
          [
            ["SMS sortant France", "Vonage", "0,0726 \u20ac/SMS", "~4 (PIN + rappels RDV)", "0,29 \u20ac"],
            ["SMS entrant France", "Vonage", "0,0057 \u20ac/SMS", "~1 (r\u00e9ponse RDV)", "< 0,01 \u20ac"],
            ["Email transactionnel", "Office 365 Graph", "Inclus (licence M365)", "~8 (notifications)", "0,00 \u20ac"],
            ["Email fallback", "Brevo", "Gratuit < 300/jour", "En compl\u00e9ment", "0,00 \u20ac"],
            ["Push notification", "Web Push (VAPID)", "Gratuit (protocole ouvert)", "~10", "0,00 \u20ac"],
          ],
          [1800, 1600, 1800, 2160, 2000]
        ),
        spacer(80),

        para("**Co\u00fbt communication total :** environ **0,30 \u20ac/b\u00e9n\u00e9ficiaire/mois**. Le SMS est le seul poste payant, principalement pour l\u2019envoi des codes PIN et des rappels de rendez-vous. Le passage progressif aux push notifications r\u00e9duira ce co\u00fbt."),
        spacer(60),
        para("**Licence Office 365 :** la Fondation JAE dispose d\u00e9j\u00e0 d\u2019un abonnement Microsoft 365 (~12,50 \u20ac/mois/utilisateur). Le co\u00fbt d\u2019envoi d\u2019emails via Graph API est donc nul en marginal."),

        new Paragraph({ children: [new PageBreak()] }),

        // 3.4 COUTS DEV
        heading("3.4 Co\u00fbts de d\u00e9veloppement et maintenance", HeadingLevel.HEADING_2),
        para("Ces co\u00fbts repr\u00e9sentent le travail humain n\u00e9cessaire pour maintenir et faire \u00e9voluer la plateforme."),
        spacer(80),

        makeTable(
          ["Poste", "D\u00e9tail", "Co\u00fbt annuel estim\u00e9", "% du total"],
          [
            ["Maintenance corrective", "Bugs, compatibilit\u00e9, mises \u00e0 jour de d\u00e9pendances", "15 000 \u20ac", "27%"],
            ["\u00c9volutions fonctionnelles", "Nouvelles features, am\u00e9liorations UX", "25 000 \u20ac", "46%"],
            ["DevOps / monitoring", "CI/CD, alerting, sauvegardes, s\u00e9curit\u00e9", "5 000 \u20ac", "9%"],
            ["Support technique N2", "Incidents, aide structures, escalade", "10 000 \u20ac", "18%"],
          ],
          [2300, 3260, 2000, 1800]
        ),
        spacer(80),

        para("**Total d\u00e9veloppement et maintenance : 55 000 \u20ac/an.** Ce montant suppose que le d\u00e9veloppement initial est amorti et que l\u2019\u00e9quipe technique est mutualis\u00e9e avec d\u2019autres projets de la Fondation JAE. En phase de croissance (ann\u00e9es 2-3), pr\u00e9voir 80 000 \u00e0 120 000 \u20ac/an pour acc\u00e9l\u00e9rer les d\u00e9veloppements."),

        new Paragraph({ children: [new PageBreak()] }),

        // 3.5 COUT COMPLET
        heading("3.5 Co\u00fbt complet par b\u00e9n\u00e9ficiaire", HeadingLevel.HEADING_2),
        para("Synth\u00e8se de tous les postes de co\u00fbt, ramen\u00e9s au b\u00e9n\u00e9ficiaire actif par mois, selon diff\u00e9rents volumes."),
        spacer(80),

        makeTable(
          ["Poste de co\u00fbt", "100 b\u00e9n\u00e9f.", "500 b\u00e9n\u00e9f.", "1 000 b\u00e9n\u00e9f.", "5 000 b\u00e9n\u00e9f.", "10 000 b\u00e9n\u00e9f."],
          [
            ["IA (OpenAI)", "0,70 \u20ac", "0,70 \u20ac", "0,70 \u20ac", "0,70 \u20ac", "0,70 \u20ac"],
            ["SMS (Vonage)", "0,30 \u20ac", "0,30 \u20ac", "0,30 \u20ac", "0,30 \u20ac", "0,30 \u20ac"],
            ["H\u00e9bergement", "0,78 \u20ac", "0,16 \u20ac", "0,08 \u20ac", "0,03 \u20ac", "0,04 \u20ac"],
            ["Dev / maintenance", "45,83 \u20ac", "9,17 \u20ac", "4,58 \u20ac", "0,92 \u20ac", "0,46 \u20ac"],
            ["**TOTAL**", "**47,61 \u20ac**", "**10,33 \u20ac**", "**5,66 \u20ac**", "**1,95 \u20ac**", "**1,50 \u20ac**"],
          ],
          [2000, 1472, 1472, 1472, 1472, 1472]
        ),
        spacer(100),

        highlightBox(
          "Enseignement cl\u00e9",
          "Les co\u00fbts variables (IA + SMS) ne repr\u00e9sentent qu\u20191,00 \u20ac/b\u00e9n\u00e9ficiaire/mois. C\u2019est le co\u00fbt de d\u00e9veloppement/maintenance qui domine \u00e0 faible volume. Le mod\u00e8le devient tr\u00e8s rentable d\u00e8s 500 b\u00e9n\u00e9ficiaires actifs, avec un co\u00fbt marginal par b\u00e9n\u00e9ficiaire suppl\u00e9mentaire de seulement 1,00 \u20ac. L\u2019h\u00e9bergement est n\u00e9gligeable (<1% du co\u00fbt total \u00e0 partir de 500 b\u00e9n\u00e9ficiaires)."
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // ════════════════════════════════════════
        // 4. GRILLE TARIFAIRE
        // ════════════════════════════════════════
        heading("4. Grille tarifaire"),
        para("Trois offres compl\u00e9mentaires pour couvrir l\u2019ensemble du march\u00e9, du local au territorial."),

        // 4.1 OFFRE A
        heading("4.1 Offre A \u2014 Licence par structure", HeadingLevel.HEADING_2),
        para("Destin\u00e9e aux structures individuelles (Missions Locales, E2C, CIO, CIDJ, organismes de formation)."),
        spacer(80),

        makeTable(
          ["Caract\u00e9ristique", "Starter", "Pro", "Premium"],
          [
            ["Conseillers inclus", "3", "10", "Illimit\u00e9"],
            ["B\u00e9n\u00e9ficiaires actifs/mois", "100", "500", "2 000"],
            ["Conversations IA/mois", "500", "3 000", "15 000"],
            ["SMS inclus/mois", "200", "1 500", "8 000"],
            ["Personnalisation", "Logo", "Logo + prompt IA", "Tout (webhook, API)"],
            ["Support", "Email J+2", "Email J+1", "D\u00e9di\u00e9 + visio"],
            ["Formation", "1h visio", "3h + replay", "Sur site + e-learning"],
            ["Dashboard avanc\u00e9", "Basique", "Complet", "Complet + export API"],
            ["Tarif mensuel HT", "**290 \u20ac**", "**690 \u20ac**", "**1 490 \u20ac**"],
            ["Tarif annuel HT (-15%)", "**2 958 \u20ac**", "**7 038 \u20ac**", "**15 198 \u20ac**"],
          ],
          [2500, 2287, 2287, 2286]
        ),
        spacer(80),
        para("**D\u00e9passement hors forfait :** 0,02 \u20ac/conversation IA + 0,08 \u20ac/SMS au-del\u00e0 du forfait inclus."),
        para("**Conseiller suppl\u00e9mentaire :** +49 \u20ac/mois par compte conseiller au-del\u00e0 du forfait."),

        new Paragraph({ children: [new PageBreak()] }),

        // 4.2 OFFRE B
        heading("4.2 Offre B \u2014 Convention territoriale", HeadingLevel.HEADING_2),
        para("Offre destin\u00e9e aux collectivit\u00e9s (d\u00e9partements, r\u00e9gions) souhaitant d\u00e9ployer Catch\u2019Up sur l\u2019ensemble de leur territoire pour toutes leurs structures d\u2019accompagnement."),
        spacer(80),

        makeTable(
          ["Caract\u00e9ristique", "D\u00e9partement", "R\u00e9gion"],
          [
            ["Structures incluses", "Jusqu\u2019\u00e0 15", "Jusqu\u2019\u00e0 60"],
            ["B\u00e9n\u00e9ficiaires actifs/mois", "2 000", "10 000"],
            ["Conversations IA/mois", "12 000", "60 000"],
            ["SMS inclus/mois", "8 000", "40 000"],
            ["Dashboard territorial", "KPI agr\u00e9g\u00e9s + carte du d\u00e9partement", "KPI r\u00e9gionaux + carte interactive"],
            ["Prompt IA personnalis\u00e9", "Adapt\u00e9 au bassin d\u2019emploi local", "Personnalis\u00e9 + fili\u00e8res r\u00e9gionales"],
            ["Pilotage politique", "Rapport trimestriel + comit\u00e9", "Rapport mensuel + comit\u00e9 strat\u00e9gique"],
            ["Formation", "Sur site 1 jour + e-learning", "Programme complet multi-sites"],
            ["Int\u00e9gration SI (I-Milo, etc.)", "Optionnel (+3 000 \u20ac)", "Inclus"],
            ["Support", "R\u00e9f\u00e9rent d\u00e9di\u00e9", "R\u00e9f\u00e9rent d\u00e9di\u00e9 + hotline"],
            ["**Tarif annuel HT**", "**18 000 \u20ac**", "**65 000 \u20ac**"],
            ["Co\u00fbt par structure/an", "~1 200 \u20ac", "~1 083 \u20ac"],
            ["Co\u00fbt par b\u00e9n\u00e9ficiaire/an", "~9,00 \u20ac", "~6,50 \u20ac"],
          ],
          [2800, 3280, 3280]
        ),
        spacer(100),

        greenBox(
          "Argument cl\u00e9 pour les d\u00e9cideurs publics",
          "Un conseiller en Mission Locale co\u00fbte en moyenne 42 000 \u00e0 52 000 \u20ac/an charg\u00e9 (salaire brut moyen de 2 559 \u20ac x coefficient employeur 1,4 = ~43 000 \u20ac + frais de fonctionnement). Pour un d\u00e9partement de 15 structures totalisant 60 conseillers, Catch\u2019Up augmente la capacit\u00e9 de chacun de 30 \u00e0 50%, soit l\u2019\u00e9quivalent de 18 \u00e0 30 ETP suppl\u00e9mentaires pour 18 000 \u20ac/an au lieu de 750 000 \u00e0 1 300 000 \u20ac."
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // 4.3 OFFRE C
        heading("4.3 Offre C \u2014 Pay-per-Outcome (innovant)", HeadingLevel.HEADING_2),
        para("Mod\u00e8le innovant fond\u00e9 sur les r\u00e9sultats mesurables. La structure paye un socle minimal compl\u00e9t\u00e9 par un bonus \u00e0 la performance. Ce mod\u00e8le est particuli\u00e8rement adapt\u00e9 aux structures h\u00e9sitantes ou en phase de test."),
        spacer(80),

        makeTable(
          ["Composante", "D\u00e9clencheur", "Montant", "Fr\u00e9quence"],
          [
            ["Socle plateforme", "Acc\u00e8s plateforme, 3 conseillers", "150 \u20ac/mois", "Mensuel"],
            ["Orientation r\u00e9ussie", "RDV pris ET honor\u00e9 par le b\u00e9n\u00e9ficiaire", "+5 \u20ac", "Par \u00e9v\u00e9nement"],
            ["Accompagnement termin\u00e9", "Statut \u00ab cl\u00f4tur\u00e9 positif \u00bb valid\u00e9", "+15 \u20ac", "Par \u00e9v\u00e9nement"],
            ["Profil RIASEC fiable", "Indice de confiance > 70%", "+2 \u20ac", "Par b\u00e9n\u00e9ficiaire"],
            ["Satisfaction \u00e9lev\u00e9e", "NPS > 8/10 donn\u00e9 par le b\u00e9n\u00e9ficiaire", "+1 \u20ac", "Par b\u00e9n\u00e9ficiaire"],
          ],
          [2200, 2860, 2000, 2300]
        ),
        spacer(80),

        para("**Simulation pour une Mission Locale type (200 b\u00e9n\u00e9ficiaires/mois) :**"),
        bullet("Socle : 150 \u20ac/mois"),
        bullet("120 RDV honor\u00e9s x 5 \u20ac = 600 \u20ac"),
        bullet("40 accompagnements cl\u00f4tur\u00e9s x 15 \u20ac = 600 \u20ac"),
        bullet("150 profils RIASEC fiables x 2 \u20ac = 300 \u20ac"),
        bullet("100 NPS > 8 x 1 \u20ac = 100 \u20ac"),
        para("**Total mensuel estim\u00e9 : 1 750 \u20ac/mois**, soit davantage qu\u2019un plan Pro mais parfaitement align\u00e9 sur la valeur d\u00e9livr\u00e9e. Si les r\u00e9sultats sont faibles, la facture descend \u00e0 ~400 \u20ac/mois."),

        new Paragraph({ children: [new PageBreak()] }),

        // ════════════════════════════════════════
        // 5. ANALYSE D'IMPACT
        // ════════════════════════════════════════
        heading("5. Analyse d\u2019impact"),
        para("Cette section mesure l\u2019impact de Catch\u2019Up sur chaque partie prenante : b\u00e9n\u00e9ficiaires, conseillers, structures et territoires."),

        // 5.1
        heading("5.1 Impact sur les b\u00e9n\u00e9ficiaires", HeadingLevel.HEADING_2),
        spacer(60),
        makeTable(
          ["Indicateur d\u2019impact", "Sans Catch\u2019Up", "Avec Catch\u2019Up", "Am\u00e9lioration"],
          [
            ["Acc\u00e8s \u00e0 l\u2019orientation", "Horaires bureau uniquement", "24h/24, 7j/7", "+100% de disponibilit\u00e9"],
            ["D\u00e9lai premier contact", "7 \u00e0 15 jours (attente RDV)", "Imm\u00e9diat (chat IA)", "-95% de d\u00e9lai"],
            ["Barri\u00e8re linguistique", "Fran\u00e7ais uniquement", "10 langues instantan\u00e9es", "Public allophone inclus"],
            ["Connaissance de soi", "1 \u00e0 3 entretiens n\u00e9cessaires", "Profil RIASEC d\u00e8s 3 questions", "Acc\u00e9l\u00e9ration x3"],
            ["Taux de no-show RDV", "25 \u00e0 40%", "10 \u00e0 15% (rappels auto)", "-60% d\u2019absences"],
            ["Engagement dans le parcours", "D\u00e9crochage fr\u00e9quent", "Gamification + alertes fragilit\u00e9", "+40% de r\u00e9tention estim\u00e9e"],
            ["Sentiment d\u2019\u00e9coute", "Limit\u00e9 au temps d\u2019entretien", "IA disponible en permanence", "Continuit\u00e9 relationnelle"],
          ],
          [2200, 2200, 2560, 2400]
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // 5.2
        heading("5.2 Impact sur les conseillers", HeadingLevel.HEADING_2),
        spacer(60),
        makeTable(
          ["Indicateur", "Sans Catch\u2019Up", "Avec Catch\u2019Up", "Gain"],
          [
            ["Pr\u00e9paration d\u2019entretien", "30 min (recherche dossier)", "5 min (fiche pr\u00e9-remplie + RIASEC)", "-83% de temps"],
            ["Suivi entre RDV", "T\u00e9l\u00e9phone/email manuel", "Messagerie int\u00e9gr\u00e9e + push auto", "Continuit\u00e9 sans effort"],
            ["D\u00e9tection d\u00e9crochage", "R\u00e9troactif (RDV manqu\u00e9)", "Proactif (alertes IA fragilit\u00e9 niv. 0-3)", "D\u00e9tection pr\u00e9coce"],
            ["Capacit\u00e9 de suivi", "~80 b\u00e9n\u00e9ficiaires/conseiller", "~110 \u00e0 130 b\u00e9n\u00e9ficiaires/conseiller", "+30 \u00e0 50%"],
            ["T\u00e2ches administratives", "~40% du temps de travail", "~20% (exports, dashboard auto)", "-50% de charge admin"],
            ["Reporting", "Manuel (Excel, CR papier)", "Dashboard temps r\u00e9el + exports", "Gain de 2h/semaine"],
            ["Aide \u00e0 la d\u00e9cision", "Exp\u00e9rience individuelle", "IA conseiller (suggestions, m\u00e9tiers)", "Intelligence augment\u00e9e"],
          ],
          [2200, 2200, 2560, 2400]
        ),
        spacer(100),

        greenBox(
          "Impact phare",
          "Le gain de capacit\u00e9 de +30 \u00e0 50% par conseiller est l\u2019argument d\u2019impact le plus puissant. Concr\u00e8tement, une \u00e9quipe de 10 conseillers suivant 800 jeunes peut en accompagner 1 100 \u00e0 1 300 avec Catch\u2019Up, sans recrutement suppl\u00e9mentaire et sans d\u00e9gradation de la qualit\u00e9."
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // 5.3
        heading("5.3 Impact sur les structures", HeadingLevel.HEADING_2),
        spacer(60),
        makeTable(
          ["Dimension", "Impact mesur\u00e9", "Indicateur de mesure"],
          [
            ["Capacit\u00e9 d\u2019accueil", "+30 \u00e0 50% de jeunes accompagn\u00e9s", "Nb b\u00e9n\u00e9ficiaires/conseiller/an"],
            ["Taux de no-show", "R\u00e9duction de 60% des absences RDV", "% RDV honor\u00e9s vs planifi\u00e9s"],
            ["D\u00e9lai de prise en charge", "De 7-15 jours \u00e0 < 24h (1er contact IA)", "D\u00e9lai m\u00e9dian 1er contact"],
            ["Couverture horaire", "Passage de 35h/sem \u00e0 24h/24 7j/7", "% interactions hors horaires"],
            ["Publics allophones", "Accessibilit\u00e9 en 10 langues", "% b\u00e9n\u00e9ficiaires non-francophones"],
            ["Qualit\u00e9 du reporting", "Temps r\u00e9el, automatique, exportable", "Temps pass\u00e9 en reporting/semaine"],
            ["Satisfaction b\u00e9n\u00e9ficiaire", "NPS mesurable automatiquement", "Score NPS moyen"],
            ["D\u00e9tection fragilit\u00e9", "Alertes proactives IA (niveaux 0-3)", "Nb alertes trait\u00e9es/mois"],
            ["Image / Innovation", "Structure identifi\u00e9e comme innovante", "R\u00e9f\u00e9rencement dans appels \u00e0 projets"],
          ],
          [2600, 3560, 3200]
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // 5.4
        heading("5.4 Impact territorial (d\u00e9partement / r\u00e9gion)", HeadingLevel.HEADING_2),
        para("L\u2019impact territorial est l\u2019\u00e9chelle o\u00f9 Catch\u2019Up prend toute sa dimension strat\u00e9gique."),
        spacer(60),

        makeTable(
          ["Dimension", "Impact pour le d\u00e9partement / la r\u00e9gion"],
          [
            ["Vision consolid\u00e9e", "Dashboard territorial agr\u00e9geant les donn\u00e9es de toutes les structures : flux de jeunes, profils RIASEC dominants, taux de prise en charge, zones blanches"],
            ["Pilotage des politiques jeunesse", "Donn\u00e9es en temps r\u00e9el pour orienter les investissements : quelles fili\u00e8res attirent, quels territoires d\u00e9crochent, o\u00f9 manquent les conseillers"],
            ["R\u00e9duction des in\u00e9galit\u00e9s", "Acc\u00e8s \u00e9gal \u00e0 l\u2019orientation pour les zones rurales et p\u00e9riurbaines (24h/24, multilingue, mobile-first)"],
            ["\u00c9quivalent ETP", "18 \u00e0 30 conseillers \u00ab virtuels \u00bb pour un d\u00e9partement (60 conseillers x +30-50% de capacit\u00e9)"],
            ["Pr\u00e9vention NEET", "D\u00e9tection pr\u00e9coce des signaux de d\u00e9crochage via l\u2019IA, permettant une intervention avant la rupture"],
            ["Ad\u00e9quation formation/emploi", "Croisement des profils RIASEC avec les besoins du bassin d\u2019emploi local pour orienter l\u2019offre de formation"],
            ["Reporting politique", "Rapports trimestriels/mensuels automatiques pour les \u00e9lus et financeurs (PIC, CPO, FSE)"],
            ["Effet r\u00e9seau", "Plus le nombre de structures connect\u00e9es augmente, plus les donn\u00e9es territoriales sont fiables et utiles"],
          ],
          [2800, 6560]
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // ════════════════════════════════════════
        // 6. ROI
        // ════════════════════════════════════════
        heading("6. Retour sur investissement (ROI)"),
        para("Le ROI est calcul\u00e9 en comparant le co\u00fbt de Catch\u2019Up aux \u00e9conomies g\u00e9n\u00e9r\u00e9es et \u00e0 la valeur cr\u00e9\u00e9e, pour chaque \u00e9chelle."),

        // 6.1 ROI STRUCTURE
        heading("6.1 ROI pour une structure d\u2019accompagnement", HeadingLevel.HEADING_2),
        para("**Hypoth\u00e8se :** Mission Locale avec 10 conseillers, plan Pro \u00e0 690 \u20ac/mois."),
        spacer(80),

        makeTable(
          ["Poste", "Calcul", "Valeur annuelle"],
          [
            ["INVESTISSEMENT", "", ""],
            ["Abonnement Catch\u2019Up Pro", "690 \u20ac x 12 mois", "8 280 \u20ac"],
            ["Formation initiale", "Incluse dans le plan", "0 \u20ac"],
            ["Temps d\u2019adaptation (1 mois)", "10 conseillers x 5h x 25 \u20ac/h", "1 250 \u20ac"],
            ["**Total investissement**", "", "**9 530 \u20ac**"],
            ["", "", ""],
            ["GAINS", "", ""],
            ["Capacit\u00e9 suppl\u00e9mentaire", "10 conseillers x +30 b\u00e9n\u00e9f. x 43 000 \u20ac / 80 b\u00e9n\u00e9f.", "16 125 \u20ac"],
            ["R\u00e9duction no-show", "500 RDV/an \u00e9conomis\u00e9s x 30 min x 25 \u20ac/h", "6 250 \u20ac"],
            ["Gain reporting/admin", "10 conseillers x 2h/sem x 46 sem x 25 \u20ac/h", "23 000 \u20ac"],
            ["R\u00e9duction d\u00e9lai prise en charge", "Satisfaction financeur, CPO renouvel\u00e9e", "Non chiffr\u00e9"],
            ["Image innovation", "Avantage dans appels \u00e0 projets (PIC, FSE)", "Non chiffr\u00e9"],
            ["**Total gains chiffrables**", "", "**45 375 \u20ac**"],
          ],
          [3200, 3560, 2600]
        ),
        spacer(100),

        highlightBox(
          "ROI pour une Mission Locale (plan Pro)",
          "Investissement : 9 530 \u20ac/an. Gains chiffrables : 45 375 \u20ac/an. ROI = (45 375 - 9 530) / 9 530 = 376%. Temps de retour : moins de 3 mois. Et cela sans compter les gains non chiffrables (satisfaction, image, pr\u00e9vention NEET)."
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // 6.2 ROI DEPARTEMENT
        heading("6.2 ROI pour un d\u00e9partement", HeadingLevel.HEADING_2),
        para("**Hypoth\u00e8se :** D\u00e9partement avec 15 structures, 60 conseillers, convention territoriale \u00e0 18 000 \u20ac/an."),
        spacer(80),

        makeTable(
          ["Poste", "Calcul", "Valeur annuelle"],
          [
            ["INVESTISSEMENT", "", ""],
            ["Convention Catch\u2019Up D\u00e9partement", "Forfait annuel", "18 000 \u20ac"],
            ["Pilotage / comit\u00e9s (temps agents)", "4 comit\u00e9s x 4h x 3 agents x 35 \u20ac/h", "1 680 \u20ac"],
            ["**Total investissement**", "", "**19 680 \u20ac**"],
            ["", "", ""],
            ["GAINS", "", ""],
            ["\u00c9quivalent ETP \u00e9conomis\u00e9s", "20 ETP virtuels x 43 000 \u20ac/ETP", "860 000 \u20ac"],
            ["(ajust\u00e9 : gain capacit\u00e9 r\u00e9el 30%)", "60 conseillers x 30% x 43 000 \u20ac / 100%", "774 000 \u20ac"],
            ["R\u00e9duction no-show global", "3 000 RDV/an \u00e9conomis\u00e9s x 0,5h x 25 \u20ac", "37 500 \u20ac"],
            ["Gain admin/reporting", "60 conseillers x 2h/sem x 46 sem x 25 \u20ac/h", "138 000 \u20ac"],
            ["Pilotage politique temps r\u00e9el", "Remplacement de 2 \u00e9tudes terrain/an", "30 000 \u20ac"],
            ["Pr\u00e9vention NEET (\u00e9conomie sociale)", "50 jeunes \u00ab sauv\u00e9s \u00bb x 15 000 \u20ac/an*", "750 000 \u20ac"],
            ["**Total gains conservateurs**", "(hors pr\u00e9vention NEET)", "**205 500 \u20ac**"],
            ["**Total gains \u00e9largis**", "(incluant pr\u00e9vention NEET)", "**955 500 \u20ac**"],
          ],
          [2800, 3560, 3000]
        ),
        spacer(60),
        para("* Le co\u00fbt social annuel d\u2019un jeune NEET est estim\u00e9 entre 12 000 et 22 000 \u20ac par an (co\u00fbts RSA, sant\u00e9, perte de production). Source : France Strat\u00e9gie / Eurofound.", { size: 18, color: GRAY_MED }),
        spacer(80),

        highlightBox(
          "ROI pour un d\u00e9partement (convention territoriale)",
          "Investissement : 19 680 \u20ac/an. Gains conservateurs (hors impact social) : 205 500 \u20ac. ROI conservateur = 944%. Gains \u00e9largis (avec pr\u00e9vention NEET) : 955 500 \u20ac. ROI \u00e9largi = 4 756%. Temps de retour : moins d\u20191 mois."
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // 6.3 ROI REGION
        heading("6.3 ROI pour une r\u00e9gion", HeadingLevel.HEADING_2),
        para("**Hypoth\u00e8se :** R\u00e9gion avec 60 structures, 250 conseillers, convention r\u00e9gionale \u00e0 65 000 \u20ac/an, 10 000 b\u00e9n\u00e9ficiaires actifs/mois."),
        spacer(80),

        makeTable(
          ["Poste", "Calcul", "Valeur annuelle"],
          [
            ["INVESTISSEMENT", "", ""],
            ["Convention Catch\u2019Up R\u00e9gion", "Forfait annuel", "65 000 \u20ac"],
            ["Pilotage / coordination", "1 chef de projet 0,2 ETP x 60 000 \u20ac", "12 000 \u20ac"],
            ["**Total investissement**", "", "**77 000 \u20ac**"],
            ["", "", ""],
            ["GAINS", "", ""],
            ["Gain capacit\u00e9 conseillers", "250 x 30% x 43 000 \u20ac", "3 225 000 \u20ac"],
            ["R\u00e9duction no-show r\u00e9gional", "12 000 RDV/an x 0,5h x 25 \u20ac", "150 000 \u20ac"],
            ["Gain admin/reporting", "250 conseillers x 2h/sem x 46 sem x 25 \u20ac", "575 000 \u20ac"],
            ["Pilotage r\u00e9gional", "Remplacement de 4 \u00e9tudes + observatoire", "80 000 \u20ac"],
            ["Pr\u00e9vention NEET", "200 jeunes x 15 000 \u20ac", "3 000 000 \u20ac"],
            ["Ad\u00e9quation formation/emploi", "Meilleur fléchage des fonds formation", "Non chiffr\u00e9"],
            ["**Total gains conservateurs**", "(hors pr\u00e9vention NEET)", "**805 000 \u20ac**"],
            ["**Total gains \u00e9largis**", "(incluant pr\u00e9vention NEET)", "**3 805 000 \u20ac**"],
          ],
          [2800, 3560, 3000]
        ),
        spacer(100),

        greenBox(
          "ROI pour une r\u00e9gion (convention r\u00e9gionale)",
          "Investissement : 77 000 \u20ac/an. Gains conservateurs : 805 000 \u20ac. ROI conservateur = 945%. Gains \u00e9largis : 3 805 000 \u20ac. ROI \u00e9largi = 4 842%. Pour chaque euro investi, la r\u00e9gion g\u00e9n\u00e8re entre 10 et 49 euros de valeur."
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // ════════════════════════════════════════
        // 7. PROJECTIONS FINANCIERES
        // ════════════════════════════════════════
        heading("7. Projections financi\u00e8res \u00e0 3 ans"),
        para("Hypoth\u00e8ses conservatrices bas\u00e9es sur la taille du march\u00e9 adressable : 440+ Missions Locales, 130 E2C, 100 d\u00e9partements, 13 r\u00e9gions m\u00e9tropolitaines."),
        spacer(80),

        makeTable(
          ["Indicateur", "Ann\u00e9e 1", "Ann\u00e9e 2", "Ann\u00e9e 3"],
          [
            ["Structures clientes (licences)", "10", "35", "80"],
            ["Conventions d\u00e9partementales", "1", "3", "6"],
            ["Conventions r\u00e9gionales", "0", "1", "2"],
            ["B\u00e9n\u00e9ficiaires actifs/mois", "800", "5 500", "18 000"],
            ["", "", "", ""],
            ["CA Licences structures", "58 000 \u20ac", "243 000 \u20ac", "556 000 \u20ac"],
            ["CA Conventions territoriales", "18 000 \u20ac", "119 000 \u20ac", "238 000 \u20ac"],
            ["CA Revenus compl\u00e9mentaires", "5 000 \u20ac", "30 000 \u20ac", "95 000 \u20ac"],
            ["**CA Total**", "**81 000 \u20ac**", "**392 000 \u20ac**", "**889 000 \u20ac**"],
            ["", "", "", ""],
            ["Co\u00fbts variables (IA+SMS)", "10 560 \u20ac", "72 600 \u20ac", "237 600 \u20ac"],
            ["Co\u00fbts h\u00e9bergement", "996 \u20ac", "1 980 \u20ac", "5 040 \u20ac"],
            ["Co\u00fbts dev/maintenance", "55 000 \u20ac", "80 000 \u20ac", "120 000 \u20ac"],
            ["Co\u00fbts commerciaux", "20 000 \u20ac", "50 000 \u20ac", "80 000 \u20ac"],
            ["Co\u00fbts support/formation", "5 000 \u20ac", "20 000 \u20ac", "45 000 \u20ac"],
            ["**Total co\u00fbts**", "**91 556 \u20ac**", "**224 580 \u20ac**", "**487 640 \u20ac**"],
            ["", "", "", ""],
            ["**R\u00e9sultat net**", "**-10 556 \u20ac**", "**+167 420 \u20ac**", "**+401 360 \u20ac**"],
            ["Marge nette", "-13%", "43%", "45%"],
          ],
          [2800, 2187, 2187, 2186]
        ),
        spacer(100),

        highlightBox(
          "Seuil de rentabilit\u00e9",
          "Le point mort est atteint \u00e0 environ 14 mois d\u2019exploitation, soit avec ~20 structures clientes et 1 convention d\u00e9partementale. La marge se stabilise autour de 45% en r\u00e9gime de croissance, gr\u00e2ce \u00e0 la structure de co\u00fbts tr\u00e8s favorable (co\u00fbt marginal de 1,00 \u20ac/b\u00e9n\u00e9ficiaire)."
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // ════════════════════════════════════════
        // 8. LEVIERS COMPLEMENTAIRES
        // ════════════════════════════════════════
        heading("8. Leviers de revenus compl\u00e9mentaires"),
        spacer(60),

        makeTable(
          ["Levier", "Mod\u00e8le", "Cible", "Revenu estim\u00e9/an"],
          [
            ["Donn\u00e9es anonymis\u00e9es (RIASEC territorial)", "Rapport annuel vendu", "OPCO, branches pro, observatoires", "5 000 \u2013 15 000 \u20ac"],
            ["Marketplace formations", "Commission 2 \u00e0 5% sur les mises en relation", "Organismes de formation", "10 000 \u2013 50 000 \u20ac"],
            ["API Parcours (connecteur SI)", "Abonnement mensuel", "SI m\u00e9tier (I-Milo, SIAE)", "200 \u20ac/mois/connecteur"],
            ["White-label / marque blanche", "Licence annuelle", "France Travail, APEC, r\u00e9seaux nationaux", "50 000 \u2013 150 000 \u20ac"],
            ["Label \u00ab Structure Catch\u2019Up \u00bb", "Inclus (fid\u00e9lisation)", "Communication des structures", "Valeur indirecte"],
            ["Co-financement europ\u00e9en", "R\u00e9ponse \u00e0 appels \u00e0 projets", "PIC, FSE+, FEDER, Erasmus+", "Variable"],
          ],
          [2200, 2560, 2500, 2100]
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // ════════════════════════════════════════
        // 9. STRATEGIE COMMERCIALE
        // ════════════════════════════════════════
        heading("9. Strat\u00e9gie de p\u00e9n\u00e9tration commerciale"),
        spacer(60),

        heading("Phase 1 \u2014 Amorce (mois 1-6)", HeadingLevel.HEADING_3),
        bullet("**5 structures pilotes gratuites** pendant 6 mois contre des t\u00e9moignages, donn\u00e9es d\u2019usage et une \u00e9tude d\u2019impact co-sign\u00e9e"),
        bullet("S\u00e9lection de structures vari\u00e9es : 2 Missions Locales, 1 E2C, 1 CIO, 1 structure priv\u00e9e"),
        bullet("Objectif : **prouver le ROI mesurable** avec des chiffres r\u00e9els"),
        spacer(60),

        heading("Phase 2 \u2014 Approche descendante (mois 4-12)", HeadingLevel.HEADING_3),
        bullet("Cibler d\u2019abord les **d\u00e9partements et r\u00e9gions** (1 contrat = 15 \u00e0 60 structures)"),
        bullet("Le co\u00fbt commercial d\u2019acquisition est identique \u00e0 une structure unique, mais le revenu est 10 \u00e0 40 fois sup\u00e9rieur"),
        bullet("S\u2019appuyer sur les r\u00e9sultats des pilotes pour construire un dossier de pr\u00e9sentation aux \u00e9lus"),
        bullet("Cibler les CPO (Conventions Pluriannuelles d\u2019Objectifs) et les appels \u00e0 projets PIC"),
        spacer(60),

        heading("Phase 3 \u2014 Croissance organique (mois 6-24)", HeadingLevel.HEADING_3),
        bullet("**Effet r\u00e9seau territorial** : chaque structure connect\u00e9e enrichit les donn\u00e9es du territoire, renfor\u00e7ant la valeur pour les structures voisines"),
        bullet("Pr\u00e9sentations dans les r\u00e9seaux professionnels : UNML, CNML, f\u00e9d\u00e9ration E2C"),
        bullet("T\u00e9moignages vid\u00e9o de conseillers et b\u00e9n\u00e9ficiaires pour le site web"),
        bullet("R\u00e9f\u00e9rencement dans les catalogues d\u2019outils num\u00e9riques pour l\u2019insertion"),
        spacer(60),

        heading("Phase 4 \u2014 Consolidation nationale (mois 18-36)", HeadingLevel.HEADING_3),
        bullet("Couvrir 6+ d\u00e9partements et 2+ r\u00e9gions"),
        bullet("Lancer l\u2019offre white-label pour les grands r\u00e9seaux nationaux"),
        bullet("D\u00e9velopper les int\u00e9grations SI m\u00e9tier (I-Milo, SIAE, Parcours 3)"),
        bullet("Candidater aux appels \u00e0 projets europ\u00e9ens (FSE+, FEDER innovation sociale)"),

        new Paragraph({ children: [new PageBreak()] }),

        // ════════════════════════════════════════
        // 10. ANNEXES
        // ════════════════════════════════════════
        heading("10. Annexes"),

        heading("Annexe A \u2014 Hypoth\u00e8ses de calcul", HeadingLevel.HEADING_2),
        spacer(60),
        makeTable(
          ["Param\u00e8tre", "Valeur utilis\u00e9e", "Source"],
          [
            ["Salaire brut moyen conseiller ML", "2 559 \u20ac/mois", "Indeed / Jooble, avril 2026"],
            ["Coefficient charges patronales", "x 1,40", "PayFit / Expert-Comptable, 2026"],
            ["Co\u00fbt charg\u00e9 annuel conseiller", "~43 000 \u20ac", "2 559 x 1,40 x 12"],
            ["Capacit\u00e9 moyenne conseiller", "80 b\u00e9n\u00e9ficiaires actifs", "Benchmark Missions Locales"],
            ["Taux de no-show moyen (sans Catch\u2019Up)", "30%", "Donn\u00e9es terrain ML"],
            ["Taux de no-show (avec Catch\u2019Up)", "12%", "Estimation (rappels auto)"],
            ["Co\u00fbt social annuel NEET", "15 000 \u20ac", "France Strat\u00e9gie / Eurofound"],
            ["GPT-4o input pricing", "2,50 $/M tokens", "OpenAI, avril 2026"],
            ["GPT-4o output pricing", "10,00 $/M tokens", "OpenAI, avril 2026"],
            ["Hetzner CX32", "8,84 \u20ac/mois", "Hetzner, post 1er avril 2026"],
            ["Hetzner volume", "0,057 \u20ac/Go/mois", "Hetzner, post 1er avril 2026"],
            ["Vonage SMS France", "0,0726 \u20ac/SMS", "Vonage pricing, 2026"],
            ["Messages moyens/b\u00e9n\u00e9ficiaire/mois", "30", "Estimation (usage mod\u00e9r\u00e9)"],
            ["Taux de change EUR/USD", "1,00 (parit\u00e9)", "Approximation simplificatrice"],
          ],
          [3200, 2560, 3600]
        ),

        spacer(200),

        heading("Annexe B \u2014 Glossaire", HeadingLevel.HEADING_2),
        spacer(60),
        makeTable(
          ["Terme", "D\u00e9finition"],
          [
            ["RIASEC", "Mod\u00e8le de Holland : 6 dimensions de personnalit\u00e9 professionnelle (R\u00e9aliste, Investigateur, Artistique, Social, Entreprenant, Conventionnel)"],
            ["NEET", "Not in Education, Employment or Training \u2014 jeune ni en emploi, ni en formation, ni en \u00e9tude"],
            ["CPO", "Convention Pluriannuelle d\u2019Objectifs \u2014 contrat entre l\u2019\u00c9tat et les Missions Locales"],
            ["PIC", "Plan d\u2019Investissement dans les Comp\u00e9tences \u2014 programme national de formation"],
            ["ETP", "\u00c9quivalent Temps Plein \u2014 unit\u00e9 de mesure de la charge de travail"],
            ["NPS", "Net Promoter Score \u2014 indicateur de satisfaction client (-100 \u00e0 +100)"],
            ["Token", "Unit\u00e9 de mesure de l\u2019IA g\u00e9n\u00e9rative (~4 caract\u00e8res en fran\u00e7ais = 1 token)"],
            ["SaaS", "Software as a Service \u2014 logiciel h\u00e9berg\u00e9 et accessible en ligne"],
          ],
          [2000, 7360]
        ),

        spacer(400),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "\u2500".repeat(30), color: BLUE_MED }),
        ] }),
        spacer(100),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "Fondation JAE \u2014 Catch\u2019Up", font: "Arial", size: 22, bold: true, color: BLUE_DARK }),
        ] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "Document confidentiel \u2014 Avril 2026", font: "Arial", size: 20, color: GRAY_MED }),
        ] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [
          new TextRun({ text: "Contact : support@fondation-jae.org", font: "Arial", size: 20, color: GRAY_MED }),
        ] }),
      ],
    },
  ],
});

// ─── GENERATE ───
Packer.toBuffer(doc).then((buffer) => {
  const outPath = "Modele_Economique_CatchUp_V1.0.docx";
  fs.writeFileSync(outPath, buffer);
  console.log(`Document genere: ${outPath} (${(buffer.length / 1024).toFixed(0)} Ko)`);
});
