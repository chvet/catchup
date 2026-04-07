const http = require('http');
const fs = require('fs');
const path = require('path');

const pages = [
  { name: '01_accueil_beneficiaire', url: 'https://catchup.jaeprive.fr/' },
  { name: '02_login_conseiller', url: 'https://catchup.jaeprive.fr/conseiller/login' },
];

// Use CDP to connect to Chrome's remote debugging port
// Chrome must be started with --remote-debugging-port=9222

async function capturePages() {
  try {
    // Get list of pages from Chrome CDP
    const res = await fetch('http://localhost:9222/json');
    const tabs = await res.json();
    console.log('Found', tabs.length, 'Chrome tabs');
    
    for (const tab of tabs) {
      console.log(' -', tab.title, tab.url);
    }
  } catch(e) {
    console.log('Chrome remote debugging not available:', e.message);
    console.log('Starting screenshot capture via alternative method...');
  }
}

capturePages();
