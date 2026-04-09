const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType, Header, Footer, PageNumber, PageBreak } = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function headerCell(text, width) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: { fill: "2E4057", type: ShadingType.CLEAR }, margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", font: "Arial", size: 20 })] })]
  });
}
function cell(text, width) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA }, margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, font: "Arial", size: 20 })] })]
  });
}
function codeCell(text, width) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: { fill: "F5F5F5", type: ShadingType.CLEAR }, margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, font: "Consolas", size: 18 })] })]
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "2E4057" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "4A6FA5" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
    ]
  },
  sections: [{
    properties: {
      page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1200, bottom: 1200, left: 1200 } }
    },
    headers: { default: new Header({ children: [
      new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Fondation JAE \u2014 Confidentiel", font: "Arial", size: 16, color: "999999", italics: true })] })
    ]})},
    footers: { default: new Footer({ children: [
      new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "Int\u00e9gration SSO Catch\u2019Up \u2194 Parcoureo \u2014 Page ", font: "Arial", size: 16, color: "999999" }),
        new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: "999999" })
      ]})
    ]})},
    children: [
      // TITLE
      new Paragraph({ spacing: { before: 2400 }, children: [] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "Int\u00e9gration SSO", font: "Arial", size: 48, bold: true, color: "2E4057" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "Catch\u2019Up \u2194 Parcoureo", font: "Arial", size: 44, bold: true, color: "6C63FF" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "Sp\u00e9cifications techniques", font: "Arial", size: 28, color: "666666" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 2, color: "6C63FF", space: 12 } }, spacing: { before: 200, after: 100 }, children: [new TextRun({ text: "Document \u00e0 destination de l\u2019\u00e9quipe technique Parcoureo", font: "Arial", size: 22, color: "444444" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Fondation JAE \u2014 Avril 2026", font: "Arial", size: 22, color: "666666" })] }),
      new Paragraph({ children: [new PageBreak()] }),

      // SECTION 1
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Contexte")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("Catch\u2019Up est une plateforme d\u2019orientation professionnelle par IA d\u00e9velopp\u00e9e par la Fondation JAE. L\u2019objectif est de permettre aux conseillers Parcoureo d\u2019acc\u00e9der \u00e0 Catch\u2019Up directement depuis leur interface Parcoureo, sans double authentification.")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("Le conseiller Parcoureo et le conseiller Catch\u2019Up doivent \u00eatre "), new TextRun({ text: "le m\u00eame utilisateur", bold: true }), new TextRun(" : un seul login, un seul profil, une seule structure.")] }),

      // SECTION 2
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. Flux d\u2019authentification SSO")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "\u00c9tape 1 : ", bold: true }), new TextRun("Le conseiller est connect\u00e9 sur Parcoureo")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "\u00c9tape 2 : ", bold: true }), new TextRun("Il clique sur \u00ab Catch\u2019Up \u00bb dans le menu Parcoureo")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "\u00c9tape 3 : ", bold: true }), new TextRun("Parcoureo g\u00e9n\u00e8re un JWT sign\u00e9 contenant les informations du conseiller")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "\u00c9tape 4 : ", bold: true }), new TextRun("Parcoureo redirige vers l\u2019URL ci-dessous :")] }),
      new Paragraph({ spacing: { after: 100, before: 100 }, shading: { fill: "F0F0F0", type: ShadingType.CLEAR }, children: [new TextRun({ text: "https://pro.catchup.jaeprive.fr/api/conseiller/auth/parcoureo/callback?token=JWT_SIGNE", font: "Consolas", size: 18 })] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "\u00c9tape 5 : ", bold: true }), new TextRun("Catch\u2019Up valide le token, cr\u00e9e le compte si n\u00e9cessaire, et connecte le conseiller")] }),

      // SECTION 3
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. Format du JWT attendu")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("Le JWT sign\u00e9 par Parcoureo doit contenir les champs suivants :")] }),
      new Table({
        width: { size: 9506, type: WidthType.DXA }, columnWidths: [1600, 1000, 1200, 5706],
        rows: [
          new TableRow({ children: [headerCell("Champ", 1600), headerCell("Type", 1000), headerCell("Requis", 1200), headerCell("Description", 5706)] }),
          new TableRow({ children: [codeCell("email", 1600), cell("string", 1000), cell("Oui", 1200), cell("Adresse email professionnelle du conseiller", 5706)] }),
          new TableRow({ children: [codeCell("prenom", 1600), cell("string", 1000), cell("Oui", 1200), cell("Pr\u00e9nom du conseiller", 5706)] }),
          new TableRow({ children: [codeCell("nom", 1600), cell("string", 1000), cell("Oui", 1200), cell("Nom de famille", 5706)] }),
          new TableRow({ children: [codeCell("role", 1600), cell("string", 1000), cell("Oui", 1200), cell("conseiller ou admin_structure", 5706)] }),
          new TableRow({ children: [codeCell("structureId", 1600), cell("string", 1000), cell("Oui", 1200), cell("Identifiant unique de la structure dans Parcoureo", 5706)] }),
          new TableRow({ children: [codeCell("structureNom", 1600), cell("string", 1000), cell("Oui", 1200), cell("Nom de la structure (ex: Mission Locale Orleans)", 5706)] }),
          new TableRow({ children: [codeCell("iat", 1600), cell("number", 1000), cell("Oui", 1200), cell("Timestamp Unix d\u2019emission", 5706)] }),
          new TableRow({ children: [codeCell("exp", 1600), cell("number", 1000), cell("Oui", 1200), cell("Timestamp Unix d\u2019expiration (max 5 min)", 5706)] }),
        ]
      }),

      // SECTION 4
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400 }, children: [new TextRun("4. Endpoints Catch\u2019Up")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Endpoint callback SSO")] }),
      new Paragraph({ children: [new TextRun({ text: "URL : ", bold: true }), new TextRun({ text: "https://pro.catchup.jaeprive.fr/api/conseiller/auth/parcoureo/callback", font: "Consolas", size: 18 })] }),
      new Paragraph({ children: [new TextRun({ text: "M\u00e9thode : ", bold: true }), new TextRun("GET")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Param\u00e8tre : ", bold: true }), new TextRun("token (JWT sign\u00e9 dans l\u2019URL)")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Endpoint de statut")] }),
      new Paragraph({ children: [new TextRun({ text: "URL : ", bold: true }), new TextRun({ text: "https://pro.catchup.jaeprive.fr/api/conseiller/auth/parcoureo/status", font: "Consolas", size: 18 })] }),
      new Paragraph({ children: [new TextRun({ text: "M\u00e9thode : ", bold: true }), new TextRun("GET")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Retourne : ", bold: true }), new TextRun({ text: "{ configured: true/false, url: \"...\" }", font: "Consolas", size: 18 })] }),

      // SECTION 5
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. Ce dont Catch\u2019Up a besoin de Parcoureo")] }),
      new Table({
        width: { size: 9506, type: WidthType.DXA }, columnWidths: [3200, 3800, 2506],
        rows: [
          new TableRow({ children: [headerCell("Element", 3200), headerCell("Description", 3800), headerCell("Exemple", 2506)] }),
          new TableRow({ children: [codeCell("PARCOUREO_API_URL", 3200), cell("URL de base de l\u2019API Parcoureo", 3800), codeCell("https://api.parcoureo.fr", 2506)] }),
          new TableRow({ children: [codeCell("PARCOUREO_API_KEY", 3200), cell("Cle API pour authentifier Catch\u2019Up", 3800), codeCell("pk_live_xxx...", 2506)] }),
          new TableRow({ children: [cell("Secret JWT ou cle publique", 3200), cell("Pour verifier la signature des tokens SSO", 3800), cell("Cle RSA ou secret HMAC", 2506)] }),
        ]
      }),

      // SECTION 6
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400 }, children: [new TextRun("6. Comportement automatique")] }),
      new Paragraph({ spacing: { after: 150 }, children: [new TextRun({ text: "1. Creation automatique : ", bold: true }), new TextRun("si l\u2019email du JWT n\u2019existe pas dans Catch\u2019Up, le compte est cree automatiquement.")] }),
      new Paragraph({ spacing: { after: 150 }, children: [new TextRun({ text: "2. Rattachement structure : ", bold: true }), new TextRun("la structure Parcoureo est mappee via parcoureoId.")] }),
      new Paragraph({ spacing: { after: 150 }, children: [new TextRun({ text: "3. Session JWT : ", bold: true }), new TextRun("apres validation, Catch\u2019Up emet son propre JWT (8h, cookie httpOnly).")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "4. Sync RIASEC (optionnel) : ", bold: true }), new TextRun("le profil RIASEC peut etre envoye vers Parcoureo via API push.")] }),

      // SECTION 7
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("7. Integration iframe (optionnel)")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun("Catch\u2019Up peut etre embarque dans un iframe au sein de Parcoureo :")] }),
      new Paragraph({ spacing: { after: 200 }, shading: { fill: "F0F0F0", type: ShadingType.CLEAR }, children: [new TextRun({ text: "https://pro.catchup.jaeprive.fr/conseiller?sso_token=JWT", font: "Consolas", size: 18 })] }),

      // SECTION 8
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("8. API bidirectionnelle (phase 2)")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Push (Catch\u2019Up \u2192 Parcoureo)")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun("Donnees envoyees : profil RIASEC (6 scores), resume IA, fragilite, prenom/age/departement.")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Pull (Parcoureo \u2192 Catch\u2019Up)")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("Import d\u2019un profil Parcoureo existant comme point de depart pour le chat.")] }),

      // SECTION 9
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("9. Contact")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "Projet : ", bold: true }), new TextRun("Catch\u2019Up \u2014 Fondation JAE")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "Contact technique : ", bold: true }), new TextRun("Serge Chvetzoff (sc@fondation-jae.org)")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "URL beneficiaire : ", bold: true }), new TextRun({ text: "https://catchup.jaeprive.fr", font: "Consolas", size: 18 })] }),
      new Paragraph({ children: [new TextRun({ text: "URL conseiller : ", bold: true }), new TextRun({ text: "https://pro.catchup.jaeprive.fr", font: "Consolas", size: 18 })] }),
    ]
  }]
});

const outPath = process.argv[2] || "Integration-SSO-CatchUp-Parcoureo.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outPath, buffer);
  console.log("Document cree : " + outPath + " (" + Math.round(buffer.length/1024) + " KB)");
});
