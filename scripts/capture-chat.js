const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');
const BASE_URL = 'https://pro.catchup.jaeprive.fr';
const VIEWPORT = { width: 1440, height: 900 };

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox'],
    defaultViewport: VIEWPORT,
    protocolTimeout: 60000
  });

  const page = await browser.newPage();

  // Login
  await page.goto(`${BASE_URL}/conseiller/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(1000);
  await page.click('input[type="email"]', { clickCount: 3 });
  await page.type('input[type="email"]', 'sc@fondation-jae.org', { delay: 30 });
  await page.click('input[type="password"]', { clickCount: 3 });
  await page.type('input[type="password"]', 'catchup2026', { delay: 30 });
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
  await delay(3000);

  // Go to the beneficiary with 17 messages (likely has conversation)
  console.log('Navigating to beneficiary with messages...');
  await page.goto(`${BASE_URL}/conseiller/file-active/cf697de9-219f-4fc0-9a58-e328eac6bfc9`, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(3000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_fiche_avec_messages.png'), fullPage: false });
  console.log('   -> 08_fiche_avec_messages.png');

  // Try to find and click "Discuter" or conversation tab
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && (text.includes('Discuter') || text.includes('Chat') || text.includes('Message'))) {
      console.log('Clicking:', text.trim());
      await btn.click();
      await delay(2000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_direct_chat.png'), fullPage: false });
      console.log('   -> 09_direct_chat.png');
      break;
    }
  }

  // Also capture structures page
  console.log('Capturing structures...');
  await page.goto(`${BASE_URL}/conseiller/structures`, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11_structures.png'), fullPage: false });
  console.log('   -> 11_structures.png');

  // Conseillers page
  console.log('Capturing conseillers...');
  await page.goto(`${BASE_URL}/conseiller/conseillers`, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12_conseillers.png'), fullPage: false });
  console.log('   -> 12_conseillers.png');

  // Admin page
  console.log('Capturing admin...');
  await page.goto(`${BASE_URL}/conseiller/admin`, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13_admin.png'), fullPage: false });
  console.log('   -> 13_admin.png');

  // Parametres page
  console.log('Capturing parametres...');
  await page.goto(`${BASE_URL}/conseiller/parametres`, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14_parametres.png'), fullPage: false });
  console.log('   -> 14_parametres.png');

  await browser.close();

  const files = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
  console.log(`\nTotal: ${files.length} screenshots`);
  files.forEach(f => {
    const stats = fs.statSync(path.join(SCREENSHOTS_DIR, f));
    console.log(`  ${f} (${Math.round(stats.size / 1024)} KB)`);
  });
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
