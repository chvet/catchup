const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');
const BASE_URL = 'https://pro.catchup.jaeprive.fr';
const EMAIL = 'sc@fondation-jae.org';
const PASSWORD = 'catchup2026';
const VIEWPORT = { width: 1440, height: 900 };

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: VIEWPORT,
    protocolTimeout: 60000
  });

  const page = await browser.newPage();

  // Login
  console.log('Logging in...');
  await page.goto(`${BASE_URL}/conseiller/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(1000);
  await page.click('input[type="email"]', { clickCount: 3 });
  await page.type('input[type="email"]', EMAIL, { delay: 30 });
  await page.click('input[type="password"]', { clickCount: 3 });
  await page.type('input[type="password"]', PASSWORD, { delay: 30 });
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
  await delay(3000);

  // Direct chat - find a beneficiary link from file-active
  console.log('Finding a chat link...');
  await page.goto(`${BASE_URL}/conseiller/file-active`, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);

  // Get all links on the page
  const links = await page.$$eval('a', els => els.map(e => ({ href: e.href, text: e.textContent?.trim() })));
  console.log('Links found:', links.filter(l => l.href.includes('chat') || l.href.includes('file-active/')).map(l => l.href));

  // Try to find and click on a beneficiary
  const benefLink = links.find(l => l.href.includes('/conseiller/file-active/') && !l.href.endsWith('/file-active/'));
  if (benefLink) {
    await page.goto(benefLink.href, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2000);

    // Look for a "Discuter" button or chat link
    const chatLinks = await page.$$eval('a', els => els.map(e => ({ href: e.href, text: e.textContent?.trim() })));
    const chatLink = chatLinks.find(l => l.text?.includes('Discuter') || l.href.includes('/chat/'));
    if (chatLink) {
      console.log('Navigating to chat:', chatLink.href);
      await page.goto(chatLink.href, { waitUntil: 'networkidle2', timeout: 30000 });
      await delay(3000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_direct_chat.png'), fullPage: false });
      console.log('   -> 08_direct_chat.png');
    } else {
      console.log('No chat link found on beneficiary page. Available links:');
      chatLinks.filter(l => l.text).forEach(l => console.log(`  ${l.text} -> ${l.href}`));
    }
  }

  // Also capture the beneficiary experience after accepting CGU
  console.log('Capturing beneficiary chat experience...');
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 430, height: 932 }); // Mobile viewport
  await page2.goto('https://catchup.jaeprive.fr', { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);

  // Try clicking "J'accepte" button
  try {
    const acceptBtn = await page2.$('button');
    if (acceptBtn) {
      const btnText = await page2.evaluate(el => el.textContent, acceptBtn);
      console.log('Found button:', btnText);
      // Find the accept button
      const buttons = await page2.$$('button');
      for (const btn of buttons) {
        const text = await page2.evaluate(el => el.textContent, btn);
        if (text && text.includes('accepte')) {
          await btn.click();
          await delay(2000);
          break;
        }
      }
    }
  } catch (e) {
    console.log('Could not click accept:', e.message);
  }

  await page2.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_chat_beneficiaire_mobile.png'), fullPage: false });
  console.log('   -> 10_chat_beneficiaire_mobile.png');

  await browser.close();

  // List all
  const files = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
  console.log(`\nTotal: ${files.length} screenshots:`);
  files.forEach(f => {
    const stats = fs.statSync(path.join(SCREENSHOTS_DIR, f));
    console.log(`  ${f} (${Math.round(stats.size / 1024)} KB)`);
  });
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
