import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const DEMO_SLUG = 'demo';
const SCREENSHOTS_DIR = path.join(import.meta.dirname, 'screenshots');
const OUTPUT_DIR = import.meta.dirname;

async function hideNextDevIndicator(page) {
  await page.addStyleTag({ content: `
    [data-nextjs-dialog-overlay],
    [data-nextjs-toast],
    nextjs-portal,
    #__next-build-watcher,
    body > [style*="position: fixed"][style*="z-index"] {
      display: none !important;
    }
    /* Hide the "N" dev indicator */
    body > div:last-child[style*="fixed"] { display: none !important; }
  `});
  // Also try to remove the Next.js dev overlay via evaluate
  await page.evaluate(() => {
    document.querySelectorAll('nextjs-portal').forEach(el => el.remove());
    // Remove any fixed-position elements that look like dev indicators
    document.querySelectorAll('body > div').forEach(el => {
      const style = window.getComputedStyle(el);
      if (style.position === 'fixed' && style.zIndex > 9000) {
        el.remove();
      }
    });
  }).catch(() => {});
}

async function captureFormScreenshot(browser) {
  console.log('📸 Capturing form screenshot...');
  // iPhone 14 Pro dimensions
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/${DEMO_SLUG}/form`, { waitUntil: 'networkidle' });

  // Hide Next.js dev indicator
  await hideNextDevIndicator(page);

  // Step 1: Driver Info
  await page.fill('input[type="email"]', 'marketing@demo.com');
  await page.locator('input[type="email"]').blur();
  await page.waitForTimeout(2000);
  await page.fill('input[placeholder="John"]', 'Marco');
  await page.fill('input[placeholder="Speed"]', 'Rossi');

  await page.locator('select').nth(0).selectOption({ label: 'Practice 1' });
  await page.locator('select').nth(1).selectOption({ label: 'Orlando' });

  await page.waitForTimeout(500);
  const layoutButton = page.locator('[class*="cursor-pointer"]').filter({ hasText: /layout/i }).first();
  if (await layoutButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await layoutButton.click();
  }

  await page.locator('select').nth(2).selectOption({ label: 'Florida Winter Tour' });
  await page.locator('select').nth(3).selectOption({ label: 'KA100 Sr' });

  await page.locator('button', { hasText: /next/i }).click();
  await page.waitForTimeout(500);

  // Step 2: Engine Setup
  const step2Inputs = page.locator('input[type="text"], input[type="number"]');
  if (await step2Inputs.count() > 0) {
    await step2Inputs.first().fill('1234');
  }
  const step2Selects = page.locator('select');
  for (let i = 0; i < await step2Selects.count(); i++) {
    const options = await step2Selects.nth(i).locator('option').allTextContents();
    if (options.length > 1) await step2Selects.nth(i).selectOption({ index: 1 });
  }

  await page.locator('button', { hasText: /next/i }).click();
  await page.waitForTimeout(500);

  // Step 3: Tyres Data
  const step3Selects = page.locator('select');
  for (let i = 0; i < await step3Selects.count(); i++) {
    const options = await step3Selects.nth(i).locator('option').allTextContents();
    if (options.length > 1) await step3Selects.nth(i).selectOption({ index: 1 });
  }
  const step3Inputs = page.locator('input[type="text"], input[type="number"]');
  for (let i = 0; i < await step3Inputs.count(); i++) {
    const val = await step3Inputs.nth(i).inputValue();
    if (!val) await step3Inputs.nth(i).fill('12');
  }

  await page.locator('button', { hasText: /next/i }).click();
  await page.waitForTimeout(500);

  // Step 4: Kart Setup
  const kartInputs = page.locator('input[type="text"], input[type="number"], input[type="decimal"]');
  const kartValues = ['BirelArt RY30', 'M', '90mm', '28', '62.5'];
  for (let i = 0; i < await kartInputs.count() && i < kartValues.length; i++) {
    await kartInputs.nth(i).fill(kartValues[i]);
  }
  const kartSelects = page.locator('select');
  for (let i = 0; i < await kartSelects.count(); i++) {
    const options = await kartSelects.nth(i).locator('option').allTextContents();
    if (options.length > 1) await kartSelects.nth(i).selectOption({ index: 1 });
  }

  await page.waitForTimeout(300);
  await hideNextDevIndicator(page);

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'form.png'),
    fullPage: false,
  });

  console.log('✅ Form screenshot captured');
  await context.close();
}

async function captureDashboardScreenshot(browser) {
  console.log('📸 Capturing dashboard screenshot...');
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/${DEMO_SLUG}/manager/login`, { waitUntil: 'networkidle' });

  await page.waitForTimeout(1000);
  await page.locator('button[type="submit"]').click();

  await page.waitForURL(`**/${DEMO_SLUG}/manager/dashboard`, { timeout: 10000 });
  await page.waitForSelector('table', { timeout: 10000 });
  await page.waitForTimeout(1000);

  await hideNextDevIndicator(page);

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'dashboard.png'),
    fullPage: false,
  });

  console.log('✅ Dashboard screenshot captured');
  await context.close();
}

function toBase64(filePath) {
  const data = fs.readFileSync(filePath);
  const ext = path.extname(filePath).slice(1);
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${data.toString('base64')}`;
}

function buildHTML(formScreenshotPath, dashboardScreenshotPath, logoPath) {
  const logoB64 = toBase64(logoPath);
  const formB64 = toBase64(formScreenshotPath);
  const dashB64 = toBase64(dashboardScreenshotPath);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 210mm; height: 297mm;
      background: #0a0a0a;
      font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
      color: white;
      display: flex; flex-direction: column;
      overflow: hidden;
    }

    /* Racing stripe */
    .racing-stripe {
      height: 1.5mm;
      background: linear-gradient(to right, #dc2626, white, #dc2626);
    }

    /* Header */
    .header {
      text-align: center;
      padding: 12mm 20mm 5mm;
    }
    .header img.logo {
      height: 28mm;
      margin-bottom: 4mm;
    }
    .header h1 {
      font-size: 14mm;
      font-weight: 900;
      letter-spacing: 8mm;
      text-transform: uppercase;
      color: white;
      margin-bottom: 3mm;
    }
    .header .tagline {
      font-size: 4.5mm;
      color: #a0a0a0;
      letter-spacing: 1mm;
      text-transform: uppercase;
    }

    /* Devices section */
    .devices {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4mm 14mm 0;
      gap: 14mm;
    }

    /* ---- iPhone 15 Pro mockup ---- */
    .iphone-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-shrink: 0;
    }
    .iphone {
      width: 48mm;
      height: 98mm;
      background: #1c1c1e;
      border-radius: 7mm;
      border: 0.5mm solid #48484a;
      padding: 1.8mm;
      position: relative;
      box-shadow:
        0 2mm 8mm rgba(0,0,0,0.9),
        0 0 15mm rgba(220, 38, 38, 0.08),
        inset 0 0 0.3mm rgba(255,255,255,0.08);
    }
    /* Titanium edge highlights */
    .iphone::before {
      content: '';
      position: absolute;
      inset: -0.5mm;
      border-radius: 7.5mm;
      border: 0.3mm solid rgba(255,255,255,0.06);
      pointer-events: none;
    }
    /* Side button (power) */
    .iphone .side-btn-power {
      position: absolute;
      right: -1mm;
      top: 22mm;
      width: 0.6mm;
      height: 8mm;
      background: linear-gradient(to bottom, #555, #3a3a3a);
      border-radius: 0 0.3mm 0.3mm 0;
    }
    /* Volume buttons */
    .iphone .side-btn-vol-up {
      position: absolute;
      left: -1mm;
      top: 20mm;
      width: 0.6mm;
      height: 5mm;
      background: linear-gradient(to bottom, #555, #3a3a3a);
      border-radius: 0.3mm 0 0 0.3mm;
    }
    .iphone .side-btn-vol-down {
      position: absolute;
      left: -1mm;
      top: 27mm;
      width: 0.6mm;
      height: 5mm;
      background: linear-gradient(to bottom, #555, #3a3a3a);
      border-radius: 0.3mm 0 0 0.3mm;
    }
    /* Dynamic Island */
    .iphone .dynamic-island {
      position: absolute;
      top: 2.5mm;
      left: 50%;
      transform: translateX(-50%);
      width: 12mm;
      height: 2.2mm;
      background: #000;
      border-radius: 1.5mm;
      z-index: 3;
    }
    /* Status bar dots */
    .iphone .status-bar {
      position: absolute;
      top: 2mm;
      left: 3mm;
      right: 3mm;
      height: 3mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 2;
      font-size: 1.6mm;
      color: white;
      font-weight: 600;
    }
    .iphone .status-bar .time { margin-left: 1mm; }
    .iphone .status-bar .icons { margin-right: 1mm; font-size: 1.4mm; }
    .iphone .screen {
      width: 100%;
      height: 100%;
      border-radius: 5.5mm;
      overflow: hidden;
      background: #000;
    }
    .iphone .screen img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top;
    }
    .iphone .home-bar {
      position: absolute;
      bottom: 1.2mm;
      left: 50%;
      transform: translateX(-50%);
      width: 14mm;
      height: 0.5mm;
      background: rgba(255,255,255,0.3);
      border-radius: 0.5mm;
      z-index: 4;
    }

    .device-caption {
      margin-top: 3mm;
      font-size: 3mm;
      color: #a0a0a0;
      letter-spacing: 0.5mm;
      text-transform: uppercase;
      text-align: center;
    }

    /* ---- MacBook Pro mockup ---- */
    .macbook-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      min-width: 0;
    }
    .macbook {
      width: 100%;
      max-width: 110mm;
      position: relative;
    }
    /* Lid / display assembly */
    .macbook .lid {
      background: #1c1c1e;
      border-radius: 2.5mm 2.5mm 0 0;
      padding: 1.8mm 1.8mm 1.5mm;
      border: 0.4mm solid #48484a;
      border-bottom: none;
      position: relative;
      box-shadow:
        0 2mm 10mm rgba(0,0,0,0.8),
        0 0 12mm rgba(220, 38, 38, 0.06);
    }
    /* Outer edge highlight */
    .macbook .lid::before {
      content: '';
      position: absolute;
      inset: -0.4mm;
      border-radius: 3mm 3mm 0 0;
      border: 0.2mm solid rgba(255,255,255,0.05);
      border-bottom: none;
      pointer-events: none;
    }
    .macbook .camera {
      width: 1mm;
      height: 1mm;
      background: #1a1a1a;
      border-radius: 50%;
      margin: 0.3mm auto 0.8mm;
      border: 0.15mm solid #555;
      box-shadow: inset 0 0 0.2mm #000;
    }
    .macbook .screen {
      width: 100%;
      border-radius: 0.5mm;
      overflow: hidden;
      background: #000;
      aspect-ratio: 16/10;
    }
    .macbook .screen img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top left;
    }
    /* Display chin / hinge */
    .macbook .hinge {
      height: 1.2mm;
      background: linear-gradient(to bottom, #48484a, #2c2c2e, #1c1c1e);
      border-left: 0.4mm solid #48484a;
      border-right: 0.4mm solid #48484a;
    }
    /* Bottom case / keyboard deck */
    .macbook .base {
      background: linear-gradient(to bottom, #2c2c2e, #1c1c1e);
      height: 5mm;
      margin: 0 1mm;
      border-radius: 0 0 1mm 1mm;
      border: 0.4mm solid #48484a;
      border-top: none;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    /* Trackpad */
    .macbook .base .trackpad {
      width: 22mm;
      height: 3mm;
      background: #1c1c1e;
      border-radius: 0.5mm;
      border: 0.2mm solid #48484a;
    }
    /* Feet / bottom edge */
    .macbook .base::after {
      content: '';
      position: absolute;
      bottom: -0.5mm;
      left: 8mm;
      right: 8mm;
      height: 0.5mm;
      background: #111;
      border-radius: 0 0 1mm 1mm;
    }
    /* Notch at top of screen */
    .macbook .lid .notch {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 12mm;
      height: 2.5mm;
      background: #1c1c1e;
      border-radius: 0 0 1.5mm 1.5mm;
      z-index: 2;
    }

    /* URL section */
    .url-section {
      text-align: center;
      padding: 3mm 20mm 1mm;
    }
    .url-section a {
      font-size: 4.5mm;
      color: #dc2626;
      text-decoration: none;
      letter-spacing: 0.8mm;
      font-weight: 600;
    }

    /* Benefits */
    .benefits {
      display: flex;
      justify-content: center;
      gap: 10mm;
      padding: 4mm 15mm;
    }
    .benefit {
      text-align: center;
      flex: 1;
    }
    .benefit .icon {
      font-size: 6mm;
      margin-bottom: 2mm;
    }
    .benefit .text {
      font-size: 3mm;
      color: #c0c0c0;
      line-height: 1.4;
    }

    /* CTA Footer */
    .cta {
      text-align: center;
      padding: 3mm 20mm 8mm;
      border-top: 0.3mm solid rgba(220, 38, 38, 0.3);
    }
    .cta .title {
      font-size: 5mm;
      font-weight: 700;
      color: white;
      text-transform: uppercase;
      letter-spacing: 2mm;
      margin-bottom: 2mm;
    }
    .cta .email {
      font-size: 4mm;
      color: #dc2626;
      letter-spacing: 0.5mm;
    }
  </style>
</head>
<body>
  <div class="racing-stripe"></div>

  <div class="header">
    <img class="logo" src="${logoB64}" alt="Overcut Academy">
    <h1>Setups</h1>
    <p class="tagline">Race weekends are short. Stay organized.</p>
    <p class="tagline" style="margin-top: 2mm; font-size: 3.5mm; letter-spacing: 0.5mm;">All your setups, right on the palm of your hands.</p>
  </div>

  <div class="devices">
    <div class="iphone-wrap">
      <div class="iphone">
        <div class="side-btn-power"></div>
        <div class="side-btn-vol-up"></div>
        <div class="side-btn-vol-down"></div>
        <div class="dynamic-island"></div>
        <div class="screen">
          <img src="${formB64}" alt="Driver Setup Form">
        </div>
        <div class="home-bar"></div>
      </div>
      <p class="device-caption">Drivers submit setups<br>in seconds</p>
    </div>

    <div class="macbook-wrap">
      <div class="macbook">
        <div class="lid">
          <div class="camera"></div>
          <div class="screen">
            <img src="${dashB64}" alt="Manager Dashboard">
          </div>
        </div>
        <div class="hinge"></div>
        <div class="base">
          <div class="trackpad"></div>
        </div>
      </div>
      <p class="device-caption">Managers are notified and<br>see everything, instantly</p>
    </div>
  </div>

  <div class="url-section">
    <a href="https://setups.overcutacademy.com">setups.overcutacademy.com</a>
  </div>

  <div class="benefits">
    <div class="benefit">
      <div class="icon">⚡</div>
      <div class="text">Pre-filled data saves<br>90% of entry time</div>
    </div>
    <div class="benefit">
      <div class="icon">📊</div>
      <div class="text">Search, filter &amp;<br>export any session</div>
    </div>
    <div class="benefit">
      <div class="icon">🌍</div>
      <div class="text">Multi-language<br>support</div>
    </div>
  </div>

  <div class="cta">
    <p class="title">Get your team set up</p>
    <p class="email">lucas@overcutacademy.com</p>
  </div>
</body>
</html>`;
}

async function generatePDF(htmlContent, browser) {
  console.log('📄 Generating PDF...');
  const page = await browser.newPage();

  await page.setContent(htmlContent, { waitUntil: 'networkidle' });

  await page.pdf({
    path: path.join(OUTPUT_DIR, 'setups-marketing.pdf'),
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });

  await page.close();
}

async function main() {
  console.log('🏁 Generating marketing PDF...');
  const skipScreenshots = process.argv.includes('--skip-screenshots');
  const browser = await chromium.launch();
  try {
    if (!skipScreenshots) {
      await captureFormScreenshot(browser);
      await captureDashboardScreenshot(browser);
    } else {
      console.log('⏭️ Skipping screenshots (using existing)');
    }

    const logoPath = path.join(import.meta.dirname, '..', 'frontend', 'public', 'overcut-academy-logo.png');
    const html = buildHTML(
      path.join(SCREENSHOTS_DIR, 'form.png'),
      path.join(SCREENSHOTS_DIR, 'dashboard.png'),
      logoPath
    );

    fs.writeFileSync(path.join(OUTPUT_DIR, 'setups-marketing.html'), html);
    console.log('✅ HTML saved');

    await generatePDF(html, browser);
    console.log('✅ PDF saved to marketing/setups-marketing.pdf');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
