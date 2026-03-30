# ─────────────────────────────────────────────────────────────
# setup.ps1 — Initialisation Catch'Up sur une nouvelle machine (Windows)
# Usage : .\setup.ps1
# ─────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔══════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Catch'Up — Setup machine       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── 1. Prérequis ──────────────────────────────────────────────
Write-Host "1. Vérification des prérequis..." -ForegroundColor White

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "✗ Node.js non trouvé. Installe-le via https://nodejs.org (v20+)" -ForegroundColor Red
    exit 1
}
$nodeVersion = node -v
Write-Host "✓ Node.js $nodeVersion" -ForegroundColor Green

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "✗ Git non trouvé." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Git OK" -ForegroundColor Green

# ── 2. Dépendances npm ────────────────────────────────────────
Write-Host ""
Write-Host "2. Installation des dépendances npm..." -ForegroundColor White
npm install
Write-Host "✓ node_modules installés" -ForegroundColor Green

# ── 3. Fichier .env.local ─────────────────────────────────────
Write-Host ""
Write-Host "3. Configuration de l'environnement..." -ForegroundColor White

if (Test-Path ".env.local") {
    Write-Host "⚠ .env.local existe déjà — conservé tel quel" -ForegroundColor Yellow
} else {
    $envContent = @"
# Clé OpenAI (obligatoire)
OPENAI_API_KEY=sk-proj-REMPLACE_MOI

# Base de données distante (laisser vide = DB locale SQLite)
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# Email Office 365 (optionnel en dev)
O365_TENANT_ID=
O365_CLIENT_ID=
O365_CLIENT_SECRET=
O365_FROM_EMAIL=

# URL publique de l'app (optionnel en dev)
NEXT_PUBLIC_APP_URL=http://localhost:3000
"@
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "✓ .env.local créé" -ForegroundColor Green
    Write-Host "  → Renseigne ta clé OPENAI_API_KEY dans .env.local avant de lancer !" -ForegroundColor Yellow
}

# ── 4. Base de données locale ─────────────────────────────────
Write-Host ""
Write-Host "4. Initialisation de la base de données locale..." -ForegroundColor White

if (Test-Path "local.db") {
    Write-Host "⚠ local.db existe déjà" -ForegroundColor Yellow
    $resetDb = Read-Host "  Réinitialiser la DB ? (seed complet) [o/N]"
    if ($resetDb -match "^[Oo]$") {
        Remove-Item "local.db" -Force
        Write-Host "  DB supprimée." -ForegroundColor Gray
        npm run db:push -- --force
        Write-Host "✓ Schéma appliqué" -ForegroundColor Green
        Write-Host ""
        Write-Host "  Quel jeu de données ?" -ForegroundColor White
        Write-Host "  1) Seed standard  (10 structures, 10 conseillers, 20 bénéficiaires)"
        Write-Host "  2) Seed étendu    (données enrichies)"
        Write-Host "  3) Seed massif    (volume de test)"
        Write-Host "  4) Aucun          (DB vide)"
        $seedChoice = Read-Host "  Choix [1]"
        if (-not $seedChoice) { $seedChoice = "1" }
        switch ($seedChoice) {
            "2" { npm run seed:extended }
            "3" { npm run seed:massive }
            "4" { Write-Host "  DB vide conservée." }
            default { npm run seed }
        }
        Write-Host "✓ Données insérées" -ForegroundColor Green
    }
} else {
    npm run db:push -- --force
    Write-Host "✓ Schéma appliqué" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Quel jeu de données ?" -ForegroundColor White
    Write-Host "  1) Seed standard  (10 structures, 10 conseillers, 20 bénéficiaires)"
    Write-Host "  2) Seed étendu    (données enrichies)"
    Write-Host "  3) Seed massif    (volume de test)"
    Write-Host "  4) Aucun          (DB vide)"
    $seedChoice = Read-Host "  Choix [1]"
    if (-not $seedChoice) { $seedChoice = "1" }
    switch ($seedChoice) {
        "2" { npm run seed:extended }
        "3" { npm run seed:massive }
        "4" { Write-Host "  DB vide." }
        default { npm run seed }
    }
    Write-Host "✓ Données insérées" -ForegroundColor Green
}

# ── 5. Résumé & lancement ─────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   Setup terminé ! Lance l'app :      ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Terminal 1 (serveur visio) :  npm run dev:visio"
Write-Host "  Terminal 2 (app Next.js)   :  npm run dev"
Write-Host ""
Write-Host "  Bénéficiaire  → http://localhost:3000"
Write-Host "  Conseiller    → http://localhost:3000/conseiller"
Write-Host ""
Write-Host "  Comptes de test (mot de passe : password123) :"
Write-Host "    admin@fondation-jae.org         (super admin)"
Write-Host "    marie.dupont@ml-paris15.fr      (conseiller)"
Write-Host ""
