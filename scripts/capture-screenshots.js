#!/usr/bin/env node
/**
 * Capture screenshots of Catch'Up pages for the training manual
 * Uses Puppeteer to navigate and screenshot each page
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');
const BASE_URL = 'https://pro.catchup.jaeprive.fr';
const BENEFICIARY_URL = 'https://catchup.jaeprive.fr';

// Credentials
const EMAIL = 'sc@fondation-jae.org';
const PASSWORD = 'catchup2026';

const VIEWPORT = { width: 1440, height: 900 };

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: VIEWPORT
  });

  const page = await browser.newPage();

  // ===== 1. Login page (before login) =====
  console.log('1. Capturing login page...');
  await page.goto(`${BASE_URL}/conseiller/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_login_conseiller.png'), fullPage: false });
  console.log('   -> 01_login_conseiller.png');

  // ===== 2. Login =====
  console.log('2. Logging in...');
  // Clear and type email
  await page.click('input[type="email"], input[name="email"], input[placeholder*="conseiller"]', { clickCount: 3 });
  await page.type('input[type="email"], input[name="email"], input[placeholder*="conseiller"]', EMAIL, { delay: 30 });

  // Clear and type password
  await page.click('input[type="password"]', { clickCount: 3 });
  await page.type('input[type="password"]', PASSWORD, { delay: 30 });

  // Submit
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
  await delay(2000);

  // ===== 3. Dashboard =====
  console.log('3. Capturing dashboard...');
  await page.goto(`${BASE_URL}/conseiller`, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_dashboard.png'), fullPage: false });
  console.log('   -> 02_dashboard.png');

  // ===== 4. File active =====
  console.log('4. Capturing file active...');
  await page.goto(`${BASE_URL}/conseiller/file-active`, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_file_active.png'), fullPage: false });
  console.log('   -> 03_file_active.png');

  // ===== 5. Click on first beneficiary to get detail =====
  console.log('5. Capturing fiche beneficiaire...');
  try {
    // Try to click on a beneficiary row
    const rows = await page.$$('tr[class*="cursor"], a[href*="/conseiller/file-active/"], div[class*="cursor-pointer"]');
    if (rows.length > 0) {
      await rows[0].click();
      await delay(2000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_fiche_beneficiaire.png'), fullPage: false });
      console.log('   -> 04_fiche_beneficiaire.png');
    } else {
      console.log('   No beneficiary rows found, trying direct URL...');
      // Try to find a link to a specific beneficiary
      const links = await page.$$eval('a[href*="/conseiller/file-active/"]', els => els.map(e => e.href));
      if (links.length > 0) {
        await page.goto(links[0], { waitUntil: 'networkidle2', timeout: 30000 });
        await delay(2000);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_fiche_beneficiaire.png'), fullPage: false });
        console.log('   -> 04_fiche_beneficiaire.png');
      } else {
        console.log('   WARNING: Could not find beneficiary detail page');
      }
    }
  } catch (e) {
    console.log('   Error navigating to beneficiary:', e.message);
  }

  // ===== 6. Agenda =====
  console.log('6. Capturing agenda...');
  await page.goto(`${BASE_URL}/conseiller/agenda`, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_agenda.png'), fullPage: false });
  console.log('   -> 05_agenda.png');

  // ===== 7. Campagnes =====
  console.log('7. Capturing campagnes...');
  await page.goto(`${BASE_URL}/conseiller/campagnes`, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_campagnes.png'), fullPage: false });
  console.log('   -> 06_campagnes.png');

  // ===== 8. Beneficiary chat (public side) =====
  console.log('8. Capturing beneficiary chat...');
  const page2 = await browser.newPage();
  await page2.setViewport(VIEWPORT);
  await page2.goto(BENEFICIARY_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(3000);
  await page2.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_accueil_beneficiaire.png'), fullPage: false });
  console.log('   -> 07_accueil_beneficiaire.png');

  // ===== 9. Direct Chat (conseiller with beneficiary) =====
  console.log('9. Capturing direct chat...');
  await page.goto(`${BASE_URL}/conseiller/file-active`, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);
  // Try to click "Discuter" or find a chat link
  try {
    const chatBtn = await page.$('a[href*="/conseiller/chat/"], button:has-text("Discuter"), a:has-text("Discuter")');
    if (chatBtn) {
      await chatBtn.click();
      await delay(2000);
    } else {
      // Try navigating directly to a chat
      const chatLinks = await page.$$eval('a[href*="/conseiller/chat/"]', els => els.map(e => e.href));
      if (chatLinks.length > 0) {
        await page.goto(chatLinks[0], { waitUntil: 'networkidle2', timeout: 30000 });
        await delay(2000);
      }
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_direct_chat.png'), fullPage: false });
    console.log('   -> 08_direct_chat.png');
  } catch (e) {
    console.log('   Error capturing chat:', e.message);
  }

  // ===== 10. Settings / Profile page =====
  console.log('10. Capturing settings...');
  await page.goto(`${BASE_URL}/conseiller/settings`, { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
  await delay(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_settings.png'), fullPage: false });
  console.log('   -> 09_settings.png');

  // Done
  await browser.close();

  // List all saved screenshots
  const files = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
  console.log(`\nDone! ${files.length} screenshots saved in ${SCREENSHOTS_DIR}:`);
  files.forEach(f => {
    const stats = fs.statSync(path.join(SCREENSHOTS_DIR, f));
    console.log(`  ${f} (${Math.round(stats.size / 1024)} KB)`);
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
