const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType, Header, Footer, PageNumber, PageBreak, LevelFormat } = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const cm = { top: 80, bottom: 80, left: 120, right: 120 };
const TW = 9506;

function hc(text, w) {
  return new TableCell({ borders, width: { size: w, type: WidthType.DXA }, shading: { fill: "003399", type: ShadingType.CLEAR }, margins: cm,
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", font: "Arial", size: 20 })] })] });
}
function tc(text, w, opts) {
  const shade = opts && opts.shade ? { shading: { fill: opts.shade, type: ShadingType.CLEAR } } : {};
  return new TableCell({ borders, width: { size: w, type: WidthType.DXA }, margins: cm, ...shade,
    children: [new Paragraph({ alignment: opts && opts.align, children: [new TextRun({ text, font: "Arial", size: 20, bold: opts && opts.bold })] })] });
}

const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const p = (t) => new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: t, font: "Arial", size: 22 })] });
const pb = (label, text) => new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: label, font: "Arial", size: 22, bold: true }), new TextRun({ text, font: "Arial", size: 22 })] });
const bl = (t) => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t, font: "Arial", size: 22 })] });
const nl = (t) => new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text: t, font: "Arial", size: 22 })] });
const br = () => new Paragraph({ children: [new PageBreak()] });

const doc = new Document({
  numbering: { config: [
    { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ]},
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: "Arial", color: "003399" }, paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "003399", space: 4 } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Arial", color: "336699" }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
    ]
  },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1200, right: 1100, bottom: 1100, left: 1100 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Fondation JAE - Candidature FSE+ 2026-2027 - Catch'Up", font: "Arial", size: 16, color: "999999", italics: true })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", font: "Arial", size: 16, color: "999999" }), new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: "999999" })] })] }) },
    children: [
      // COUVERTURE
      new Paragraph({ spacing: { before: 1800 }, children: [] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "DOSSIER DE CANDIDATURE", font: "Arial", size: 40, bold: true, color: "003399" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "FSE+ 2026-2027", font: "Arial", size: 48, bold: true, color: "FFCC00" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 3, color: "003399", space: 12 }, bottom: { style: BorderStyle.SINGLE, size: 3, color: "003399", space: 12 } }, spacing: { before: 200, after: 200 }, children: [new TextRun({ text: "Catch'Up - Orientation par IA au service de l'insertion", font: "Arial", size: 28, color: "003399" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "PLIE du Pays de Caen et PLIE du Cotentin", font: "Arial", size: 24, color: "444444" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "Appel \u00e0 projets AGIBN hors ACI 2026-2027", font: "Arial", size: 20, color: "666666", italics: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "Organisme porteur : Fondation JAE", font: "Arial", size: 24, bold: true, color: "333333" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Fondation reconnue d'utilit\u00e9 publique - Depuis 1991", font: "Arial", size: 20, color: "666666" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300 }, children: [new TextRun({ text: "Avril 2026", font: "Arial", size: 22, color: "666666" })] }),
      br(),

      // 1. IDENTIFICATION
      h1("1. Identification du porteur de projet"),
      pb("Raison sociale : ", "Fondation JAE (Java \u00e0 Emploi)"),
      pb("Statut juridique : ", "Fondation reconnue d'utilit\u00e9 publique"),
      pb("SIRET : ", "(\u00e0 compl\u00e9ter)"),
      pb("Adresse : ", "(\u00e0 compl\u00e9ter)"),
      pb("Repr\u00e9sentant l\u00e9gal : ", "(\u00e0 compl\u00e9ter)"),
      pb("Contact technique : ", "Serge Chvetzoff - sc@fondation-jae.org"),
      pb("Contact projet : ", "Fr\u00e9d\u00e9ric Lamprecht - fl@fondation-jae.org"),
      pb("Site web : ", "https://catchup.jaeprive.fr"),
      pb("Domaine d'activit\u00e9 : ", "Orientation professionnelle, insertion, accompagnement des jeunes"),
      p(""),
      p("Depuis 1991, la Fondation JAE accompagne chaque ann\u00e9e des centaines de milliers de jeunes dans leur orientation via ses outils num\u00e9riques (Parcoureo, Inforizon). Catch'Up est sa derni\u00e8re innovation int\u00e9grant l'intelligence artificielle conversationnelle au service de l'orientation et de l'insertion professionnelle."),
      br(),

      // 2. PR\u00c9SENTATION
      h1("2. Pr\u00e9sentation du projet"),
      pb("Titre : ", "Catch'Up - Orientation par IA au service de l'insertion des jeunes dans les PLIE normands"),
      pb("Dur\u00e9e : ", "24 mois (janvier 2026 - d\u00e9cembre 2027)"),
      pb("PLIE cibl\u00e9s : ", "PLIE du Pays de Caen (CALMEC) et PLIE du Cotentin (MEF)"),
      p(""),
      h2("Objectif g\u00e9n\u00e9ral"),
      p("D\u00e9ployer Catch'Up, une plateforme d'orientation professionnelle par intelligence artificielle, comme outil compl\u00e9mentaire d'accompagnement des jeunes inscrits dans les parcours PLIE, afin d'acc\u00e9l\u00e9rer leur insertion professionnelle."),
      h2("Objectifs op\u00e9rationnels"),
      nl("Proposer aux jeunes un premier niveau d'accompagnement accessible 24h/24, sans rendez-vous, via un chatbot IA bienveillant qui construit progressivement leur profil de personnalit\u00e9 professionnelle (mod\u00e8le RIASEC)"),
      nl("Transmettre aux conseillers PLIE un dossier exploitable imm\u00e9diatement (profil RIASEC, r\u00e9sum\u00e9 IA, niveau de fragilit\u00e9 d\u00e9tect\u00e9) pour optimiser le temps d'accompagnement humain"),
      nl("D\u00e9tecter pr\u00e9cocement les situations de fragilit\u00e9 psychologique et orienter automatiquement vers les dispositifs d'urgence (3114, conseillers)"),
      nl("Mesurer l'impact du dispositif via des indicateurs compatibles avec le cadre FSE+ (Ma D\u00e9marche FSE+)"),
      br(),

      // 3. PUBLIC CIBLE
      h1("3. Public cible"),
      bl("Jeunes de 16 \u00e0 25 ans inscrits dans les parcours PLIE du Pays de Caen et du Cotentin"),
      bl("Jeunes en d\u00e9crochage scolaire, sans dipl\u00f4me, en recherche d'emploi ou en reconversion"),
      bl("Publics fragiles, isol\u00e9s, \u00e9loign\u00e9s des structures d'accompagnement classiques"),
      bl("Publics allophones (interface multilingue : 11 langues dont arabe, turc, roumain, chinois)"),
      bl("Personnes en situation de handicap (accessibilit\u00e9 RGAA 100%, mode FALC, synth\u00e8se vocale)"),
      p(""),
      pb("Nombre de participants vis\u00e9s : ", "300 jeunes sur 24 mois (150 par PLIE)"),
      br(),

      // 4. ACTIONS
      h1("4. Description d\u00e9taill\u00e9e des actions"),
      h2("Action 1 - D\u00e9ploiement technique et personnalisation (Mois 1-3)"),
      bl("Configuration de Catch'Up pour chaque PLIE (QR codes, campagnes personnalis\u00e9es, prompts adapt\u00e9s)"),
      bl("Cr\u00e9ation des comptes conseillers et rattachement aux structures"),
      bl("Formation des \u00e9quipes PLIE \u00e0 l'utilisation de l'espace conseiller"),
      h2("Action 2 - Accompagnement des jeunes par l'IA (Mois 3-24)"),
      bl("Distribution des QR codes et liens dans les structures d'accueil (affiches, flyers, SMS)"),
      bl("Conversations IA avec les jeunes (d\u00e9couverte de soi, profil RIASEC, exploration des m\u00e9tiers)"),
      bl("Proposition automatique de mise en relation avec un conseiller humain quand le profil est stabilis\u00e9 ou quand une fragilit\u00e9 est d\u00e9tect\u00e9e"),
      h2("Action 3 - Accompagnement humain renforc\u00e9 (Mois 3-24)"),
      bl("Prise en charge des jeunes orient\u00e9s par Catch'Up dans les parcours PLIE"),
      bl("Messagerie directe conseiller-b\u00e9n\u00e9ficiaire + visioconf\u00e9rence int\u00e9gr\u00e9e (WebRTC)"),
      bl("Planification de rendez-vous avec synchronisation calendrier (Google/Outlook)"),
      bl("Suivi d'activit\u00e9s hebdomadaire et objectifs personnalis\u00e9s"),
      h2("Action 4 - D\u00e9veloppements sp\u00e9cifiques FSE+ (Mois 1-6)"),
      bl("Export des donn\u00e9es participants au format Ma D\u00e9marche FSE+"),
      bl("Indicateurs de sortie : situation du participant \u00e0 J+30 apr\u00e8s fin d'accompagnement"),
      bl("Module PLIE : rattachement des b\u00e9n\u00e9ficiaires aux parcours PLIE (contrat d'engagement, dates)"),
      bl("Rapport d'activit\u00e9 FSE automatique (ventilation H/F, \u00e2ge, situation, r\u00e9sultats)"),
      h2("Action 5 - \u00c9valuation et essaimage (Mois 22-24)"),
      bl("\u00c9valuation quantitative (indicateurs FSE+) et qualitative (satisfaction, NPS)"),
      bl("Rapport final d'impact"),
      bl("Pr\u00e9paration de l'essaimage vers d'autres PLIE et structures d'insertion"),
      br(),

      // 5. MOYENS
      h1("5. Moyens mobilis\u00e9s"),
      h2("Ressources humaines"),
      bl("1 chef de projet technique (0,5 ETP) - d\u00e9veloppement, maintenance, support"),
      bl("1 responsable d\u00e9ploiement (0,3 ETP) - formation, animation, suivi"),
      bl("Conseillers PLIE existants (pas de co\u00fbt suppl\u00e9mentaire)"),
      h2("Ressources techniques"),
      bl("Plateforme Catch'Up (h\u00e9bergement Hetzner, base PostgreSQL, API OpenAI)"),
      bl("Application web + espace conseiller + application Android (APK)"),
      bl("Infrastructure s\u00e9curis\u00e9e (HTTPS, RGPD, donn\u00e9es h\u00e9berg\u00e9es en Europe)"),
      br(),

      // 6. INDICATEURS
      h1("6. Indicateurs de r\u00e9sultat"),
      new Table({ width: { size: TW, type: WidthType.DXA }, columnWidths: [3800, 1600, 1600, 2506],
        rows: [
          new TableRow({ children: [hc("Indicateur", 3800), hc("Cible An 1", 1600), hc("Cible An 2", 1600), hc("Source", 2506)] }),
          new TableRow({ children: [tc("Jeunes ayant utilis\u00e9 Catch'Up", 3800), tc("150", 1600, {align: AlignmentType.CENTER}), tc("300", 1600, {align: AlignmentType.CENTER}), tc("BDD Catch'Up", 2506)] }),
          new TableRow({ children: [tc("Conversations IA compl\u00e8tes (8+ msg)", 3800), tc("120", 1600, {align: AlignmentType.CENTER}), tc("250", 1600, {align: AlignmentType.CENTER}), tc("BDD Catch'Up", 2506)] }),
          new TableRow({ children: [tc("Profils RIASEC fiables (> 75%)", 3800), tc("80", 1600, {align: AlignmentType.CENTER}), tc("180", 1600, {align: AlignmentType.CENTER}), tc("Indice confiance", 2506)] }),
          new TableRow({ children: [tc("Mises en relation conseiller", 3800), tc("60", 1600, {align: AlignmentType.CENTER}), tc("140", 1600, {align: AlignmentType.CENTER}), tc("Table referral", 2506)] }),
          new TableRow({ children: [tc("Prises en charge effectives", 3800), tc("45", 1600, {align: AlignmentType.CENTER}), tc("110", 1600, {align: AlignmentType.CENTER}), tc("Table PEC", 2506)] }),
          new TableRow({ children: [tc("Sorties positives (emploi, formation)", 3800), tc("20", 1600, {align: AlignmentType.CENTER}), tc("60", 1600, {align: AlignmentType.CENTER}), tc("Suivi J+30", 2506)] }),
          new TableRow({ children: [tc("Taux satisfaction b\u00e9n\u00e9ficiaire", 3800), tc("> 80%", 1600, {align: AlignmentType.CENTER}), tc("> 85%", 1600, {align: AlignmentType.CENTER}), tc("Enqu\u00eate NPS", 2506)] }),
          new TableRow({ children: [tc("Fragilit\u00e9s d\u00e9tect\u00e9es et orient\u00e9es", 3800), tc("100%", 1600, {align: AlignmentType.CENTER}), tc("100%", 1600, {align: AlignmentType.CENTER}), tc("D\u00e9tecteur auto", 2506)] }),
        ]
      }),
      br(),

      // 7. BUDGET
      h1("7. Budget pr\u00e9visionnel"),
      h2("D\u00e9penses"),
      new Table({ width: { size: TW, type: WidthType.DXA }, columnWidths: [4500, 1600, 1600, 1806],
        rows: [
          new TableRow({ children: [hc("Poste de d\u00e9pense", 4500), hc("Ann\u00e9e 1", 1600), hc("Ann\u00e9e 2", 1600), hc("Total", 1806)] }),
          new TableRow({ children: [tc("D\u00e9penses directes de personnel (0,8 ETP)", 4500), tc("40 000 \u20ac", 1600, {align: AlignmentType.RIGHT}), tc("40 000 \u20ac", 1600, {align: AlignmentType.RIGHT}), tc("80 000 \u20ac", 1806, {align: AlignmentType.RIGHT})] }),
          new TableRow({ children: [tc("Co\u00fbts restants (forfait 40%)", 4500), tc("16 000 \u20ac", 1600, {align: AlignmentType.RIGHT}), tc("16 000 \u20ac", 1600, {align: AlignmentType.RIGHT}), tc("32 000 \u20ac", 1806, {align: AlignmentType.RIGHT})] }),
          new TableRow({ children: [tc("TOTAL D\u00c9PENSES", 4500, {bold: true, shade: "E8E8E8"}), tc("56 000 \u20ac", 1600, {align: AlignmentType.RIGHT, bold: true, shade: "E8E8E8"}), tc("56 000 \u20ac", 1600, {align: AlignmentType.RIGHT, bold: true, shade: "E8E8E8"}), tc("112 000 \u20ac", 1806, {align: AlignmentType.RIGHT, bold: true, shade: "E8E8E8"})] }),
        ]
      }),
      p(""),
      h2("Ressources"),
      new Table({ width: { size: TW, type: WidthType.DXA }, columnWidths: [4500, 1600, 1600, 1806],
        rows: [
          new TableRow({ children: [hc("Ressource", 4500), hc("Ann\u00e9e 1", 1600), hc("Ann\u00e9e 2", 1600), hc("Total", 1806)] }),
          new TableRow({ children: [tc("Subvention FSE+ demand\u00e9e (80%)", 4500), tc("44 800 \u20ac", 1600, {align: AlignmentType.RIGHT}), tc("44 800 \u20ac", 1600, {align: AlignmentType.RIGHT}), tc("89 600 \u20ac", 1806, {align: AlignmentType.RIGHT})] }),
          new TableRow({ children: [tc("Autofinancement Fondation JAE (20%)", 4500), tc("11 200 \u20ac", 1600, {align: AlignmentType.RIGHT}), tc("11 200 \u20ac", 1600, {align: AlignmentType.RIGHT}), tc("22 400 \u20ac", 1806, {align: AlignmentType.RIGHT})] }),
          new TableRow({ children: [tc("TOTAL RESSOURCES", 4500, {bold: true, shade: "E8E8E8"}), tc("56 000 \u20ac", 1600, {align: AlignmentType.RIGHT, bold: true, shade: "E8E8E8"}), tc("56 000 \u20ac", 1600, {align: AlignmentType.RIGHT, bold: true, shade: "E8E8E8"}), tc("112 000 \u20ac", 1806, {align: AlignmentType.RIGHT, bold: true, shade: "E8E8E8"})] }),
        ]
      }),
      br(),

      // 8. PRINCIPES HORIZONTAUX
      h1("8. Respect des principes horizontaux"),
      h2("\u00c9galit\u00e9 femmes-hommes"),
      bl("Catch'Up ne discrimine pas par genre dans ses conversations"),
      bl("Le genre est collect\u00e9 pour les statistiques FSE+ (ventilation H/F obligatoire)"),
      bl("Les suggestions de m\u00e9tiers incluent syst\u00e9matiquement des m\u00e9tiers non genr\u00e9s"),
      bl("L'IA est programm\u00e9e pour ne jamais orienter selon des st\u00e9r\u00e9otypes de genre"),
      h2("Accessibilit\u00e9 aux personnes en situation de handicap"),
      bl("Conformit\u00e9 RGAA 100% (WCAG 2.1 AA)"),
      bl("Mode FALC (Facile \u00e0 Lire et \u00e0 Comprendre) automatique"),
      bl("Synth\u00e8se vocale (TTS) + reconnaissance vocale (STT)"),
      bl("Navigation clavier compl\u00e8te, compatible lecteurs d'\u00e9cran (NVDA, VoiceOver)"),
      h2("Non-discrimination"),
      bl("Acc\u00e8s anonyme sans inscription, gratuit pour les b\u00e9n\u00e9ficiaires"),
      bl("Interface multilingue (11 langues) pour les publics allophones"),
      bl("Aucune collecte de donn\u00e9es discriminantes (origine ethnique, religion, etc.)"),
      h2("D\u00e9veloppement durable"),
      bl("Solution 100% num\u00e9rique (z\u00e9ro d\u00e9placement, z\u00e9ro papier)"),
      bl("H\u00e9bergement en Europe (Hetzner, Allemagne) aliment\u00e9 en \u00e9nergie renouvelable"),
      bl("Routage intelligent IA : r\u00e9duction de 45% de la consommation \u00e9nerg\u00e9tique"),
      br(),

      // 9. PUBLICIT\u00c9
      h1("9. Publicit\u00e9 et communication"),
      bl("Mention \u00ab Cofinanc\u00e9 par l'Union europ\u00e9enne \u00bb + embl\u00e8me UE sur toutes les pages Catch'Up"),
      bl("Affichage A3 dans les locaux PLIE avec embl\u00e8me UE"),
      bl("Mention sur le site web et les r\u00e9seaux sociaux"),
      bl("Rapport final incluant la mention FSE+"),
      br(),

      // 10. CONTACT
      h1("10. Contact"),
      pb("Organisme : ", "Fondation JAE"),
      pb("Contact technique : ", "Serge Chvetzoff - sc@fondation-jae.org"),
      pb("Contact projet : ", "Fr\u00e9d\u00e9ric Lamprecht - fl@fondation-jae.org"),
      pb("URL b\u00e9n\u00e9ficiaire : ", "https://catchup.jaeprive.fr"),
      pb("URL conseiller : ", "https://pro.catchup.jaeprive.fr"),
    ]
  }]
});

const outPath = process.argv[2] || "Candidature-FSE-CatchUp-PLIE-2026.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outPath, buffer);
  console.log("Document cr\u00e9\u00e9 : " + outPath + " (" + Math.round(buffer.length/1024) + " KB)");
});
