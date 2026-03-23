# Marketing PDF Generation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a single-page A4 marketing PDF for "Setups - Overcut Academy" with real app screenshots, ready to send to karting teams via email/WhatsApp.

**Architecture:** A standalone Node.js script using Playwright to: (1) capture real screenshots from the running app, (2) build a self-contained HTML page with base64-embedded images, (3) convert the HTML to PDF. The script lives in `marketing/` and is independent of the frontend/backend codebases.

**Tech Stack:** Playwright (globally installed v1.58.2), Node.js, inline HTML/CSS

---

## File Structure

| File | Purpose |
|------|---------|
| `marketing/generate-marketing-pdf.mjs` | Main script — captures screenshots, builds HTML, generates PDF |
| `marketing/screenshots/form.png` | Captured screenshot of form Step 4 |
| `marketing/screenshots/dashboard.png` | Captured screenshot of manager dashboard |
| `marketing/setups-marketing.html` | Generated HTML source (for debugging/iteration) |
| `marketing/setups-marketing.pdf` | Final output PDF |

Single `.mjs` file (ES modules, no build step needed). Uses `playwright` which is globally installed.

---

## Prerequisites

Before running the script, ensure:
1. Backend is running on `http://localhost:3001`
2. Frontend is running on `http://localhost:3000`
3. Demo team is seeded (run `npx tsx backend/src/scripts/create-demo-team.ts` if needed)
4. Playwright browsers are installed (`npx playwright install chromium`)

---

### Task 1: Create directory structure and script skeleton

**Files:**
- Create: `marketing/generate-marketing-pdf.mjs`
- Create: `marketing/screenshots/` (directory)

- [ ] **Step 1: Create directories**

```bash
mkdir -p marketing/screenshots
```

- [ ] **Step 2: Create script skeleton**

Create `marketing/generate-marketing-pdf.mjs` with this structure:

```javascript
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const DEMO_SLUG = 'demo';
const SCREENSHOTS_DIR = path.join(import.meta.dirname, 'screenshots');
const OUTPUT_DIR = import.meta.dirname;

async function captureFormScreenshot(browser) {
  // TODO: Task 2
}

async function captureDashboardScreenshot(browser) {
  // TODO: Task 3
}

function buildHTML(formScreenshotPath, dashboardScreenshotPath, logoPath) {
  // TODO: Task 4
}

async function generatePDF(htmlContent, browser) {
  // TODO: Task 5
}

async function main() {
  console.log('🏁 Generating marketing PDF...');
  const browser = await chromium.launch();
  try {
    await captureFormScreenshot(browser);
    await captureDashboardScreenshot(browser);

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
```

- [ ] **Step 3: Verify script runs without errors (functions are stubs)**

```bash
cd "c:/Users/lucas/OneDrive/Desktop/Cursor Projects/Setup app" && node marketing/generate-marketing-pdf.mjs
```

Expected: Script runs, prints "Generating marketing PDF...", stubs don't crash (they're empty).

- [ ] **Step 4: Commit**

```bash
git add marketing/generate-marketing-pdf.mjs
git commit -m "feat(marketing): add PDF generation script skeleton"
```

---

### Task 2: Implement form screenshot capture

**Files:**
- Modify: `marketing/generate-marketing-pdf.mjs` — implement `captureFormScreenshot()`

The form is a multi-step wizard. We need to:
1. Navigate to `/demo/form`
2. Fill Step 1 fields to pass validation (email, first name, last name, session type, track, championship, division)
3. Click "Next" to advance through Steps 2, 3
4. Fill minimum required fields on each step
5. Capture Step 4 (Kart Setup) at 768px tablet width

- [ ] **Step 1: Implement captureFormScreenshot**

```javascript
async function captureFormScreenshot(browser) {
  console.log('📸 Capturing form screenshot...');
  const context = await browser.newContext({
    viewport: { width: 768, height: 1024 },
    deviceScaleFactor: 2,  // Retina-quality screenshots
  });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/${DEMO_SLUG}/form`, { waitUntil: 'networkidle' });

  // Step 1: Driver Info
  // IMPORTANT: Use a fresh email that does NOT exist in the database.
  // Using an existing email (e.g. driver@demo.com) triggers the
  // "Has your setup changed?" dialog which hides the form fields.
  await page.fill('input[type="email"]', 'marketing@demo.com');
  await page.locator('input[type="email"]').blur();
  await page.waitForTimeout(2000); // Wait for email lookup API response
  await page.fill('input[placeholder="John"]', 'Marco');
  await page.fill('input[placeholder="Speed"]', 'Rossi');

  // Select Session Type, Track, Championship, Division
  // These are <select> elements — use selectOption with visible label
  await page.locator('select').nth(0).selectOption({ label: 'Practice 1' });
  await page.locator('select').nth(1).selectOption({ label: 'Orlando' });

  // Track layout may appear — wait and select first layout if present
  await page.waitForTimeout(500);
  const layoutButton = page.locator('[class*="cursor-pointer"]').filter({ hasText: /layout/i }).first();
  if (await layoutButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await layoutButton.click();
  }

  await page.locator('select').nth(2).selectOption({ label: 'Florida Winter Tour' });
  await page.locator('select').nth(3).selectOption({ label: 'KA100 Sr' });

  // Click Next to go to Step 2
  await page.locator('button', { hasText: /next/i }).click();
  await page.waitForTimeout(500);

  // Step 2: Engine Setup — fill required fields
  const step2Inputs = page.locator('input[type="text"], input[type="number"]');
  if (await step2Inputs.count() > 0) {
    await step2Inputs.first().fill('1234'); // Engine Number
  }
  // Fill other visible inputs minimally
  const step2Selects = page.locator('select');
  for (let i = 0; i < await step2Selects.count(); i++) {
    const options = await step2Selects.nth(i).locator('option').allTextContents();
    if (options.length > 1) {
      await step2Selects.nth(i).selectOption({ index: 1 });
    }
  }

  await page.locator('button', { hasText: /next/i }).click();
  await page.waitForTimeout(500);

  // Step 3: Tyres Data — fill required fields
  const step3Selects = page.locator('select');
  for (let i = 0; i < await step3Selects.count(); i++) {
    const options = await step3Selects.nth(i).locator('option').allTextContents();
    if (options.length > 1) {
      await step3Selects.nth(i).selectOption({ index: 1 });
    }
  }
  const step3Inputs = page.locator('input[type="text"], input[type="number"]');
  for (let i = 0; i < await step3Inputs.count(); i++) {
    const val = await step3Inputs.nth(i).inputValue();
    if (!val) await step3Inputs.nth(i).fill('12');
  }

  await page.locator('button', { hasText: /next/i }).click();
  await page.waitForTimeout(500);

  // Step 4: Kart Setup — fill fields to make the screenshot look realistic
  // Fill text/number inputs with realistic values
  const kartInputs = page.locator('input[type="text"], input[type="number"], input[type="decimal"]');
  const kartValues = ['BirelArt RY30', 'M', '1040', '139', '90mm', '90mm', '28', '-4', '62.5', '15'];
  for (let i = 0; i < await kartInputs.count() && i < kartValues.length; i++) {
    await kartInputs.nth(i).fill(kartValues[i]);
  }
  // Select dropdowns
  const kartSelects = page.locator('select');
  for (let i = 0; i < await kartSelects.count(); i++) {
    const options = await kartSelects.nth(i).locator('option').allTextContents();
    if (options.length > 1) {
      await kartSelects.nth(i).selectOption({ index: 1 });
    }
  }

  await page.waitForTimeout(300);

  // Capture screenshot — clip to the form content area only
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'form.png'),
    fullPage: false,
  });

  console.log('✅ Form screenshot captured');
  await context.close();
}
```

- [ ] **Step 2: Run to test form capture**

```bash
cd "c:/Users/lucas/OneDrive/Desktop/Cursor Projects/Setup app" && node marketing/generate-marketing-pdf.mjs
```

Expected: `marketing/screenshots/form.png` is created, shows Step 4 of the form with filled fields.

- [ ] **Step 3: Visually inspect the screenshot and adjust selectors if needed**

Open `marketing/screenshots/form.png` and verify it looks right. Adjust selectors, viewport, or field values if the capture missed elements or captured the wrong step.

- [ ] **Step 4: Commit**

```bash
git add marketing/generate-marketing-pdf.mjs marketing/screenshots/form.png
git commit -m "feat(marketing): implement form screenshot capture"
```

---

### Task 3: Implement dashboard screenshot capture

**Files:**
- Modify: `marketing/generate-marketing-pdf.mjs` — implement `captureDashboardScreenshot()`

The dashboard requires login. Flow: navigate to login page → submit credentials → wait for redirect → capture the submissions table.

- [ ] **Step 1: Implement captureDashboardScreenshot**

```javascript
async function captureDashboardScreenshot(browser) {
  console.log('📸 Capturing dashboard screenshot...');
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,  // Retina-quality screenshots
  });
  const page = await context.newPage();

  // Login first
  await page.goto(`${BASE_URL}/${DEMO_SLUG}/manager/login`, { waitUntil: 'networkidle' });

  // Demo team auto-fills credentials, just click login
  await page.waitForTimeout(1000);
  await page.locator('button[type="submit"]').click();

  // Wait for redirect to dashboard and table to load
  await page.waitForURL(`**/${DEMO_SLUG}/manager/dashboard`, { timeout: 10000 });
  await page.waitForSelector('table', { timeout: 10000 });
  await page.waitForTimeout(1000); // Let animations settle

  // Capture screenshot
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'dashboard.png'),
    fullPage: false,
  });

  console.log('✅ Dashboard screenshot captured');
  await context.close();
}
```

- [ ] **Step 2: Run to test dashboard capture**

```bash
cd "c:/Users/lucas/OneDrive/Desktop/Cursor Projects/Setup app" && node marketing/generate-marketing-pdf.mjs
```

Expected: Both screenshots exist in `marketing/screenshots/`. Dashboard shows table with 3 demo submissions.

- [ ] **Step 3: Visually inspect and adjust if needed**

Open `marketing/screenshots/dashboard.png`. Verify: table visible, 3 rows with data, filters visible, action buttons visible.

- [ ] **Step 4: Commit**

```bash
git add marketing/generate-marketing-pdf.mjs marketing/screenshots/dashboard.png
git commit -m "feat(marketing): implement dashboard screenshot capture"
```

---

### Task 4: Build the HTML marketing page

**Files:**
- Modify: `marketing/generate-marketing-pdf.mjs` — implement `buildHTML()`

The HTML page is a self-contained file with all CSS inline and images as base64 data URIs. Layout: header (logo + title + tagline), two screenshots side by side, benefits strip, CTA footer.

- [ ] **Step 1: Implement buildHTML**

```javascript
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

    /* Header */
    .header {
      text-align: center;
      padding: 28mm 20mm 8mm;
    }
    .header img.logo {
      height: 18mm;
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

    /* Screenshots */
    .screenshots {
      flex: 1;
      display: flex;
      gap: 8mm;
      padding: 6mm 12mm;
      align-items: center;
      justify-content: center;
    }
    .screenshot-card {
      flex: 1;
      text-align: center;
    }
    .screenshot-card img {
      width: 100%;
      border-radius: 3mm;
      box-shadow:
        0 4mm 12mm rgba(0,0,0,0.6),
        0 0 8mm rgba(220, 38, 38, 0.15);
      border: 0.3mm solid rgba(220, 38, 38, 0.3);
    }
    .screenshot-card .caption {
      margin-top: 3mm;
      font-size: 3.5mm;
      color: #a0a0a0;
      letter-spacing: 0.5mm;
      text-transform: uppercase;
    }

    /* Benefits */
    .benefits {
      display: flex;
      justify-content: center;
      gap: 10mm;
      padding: 6mm 15mm;
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
      padding: 5mm 20mm 10mm;
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

    /* Decorative racing stripe at top */
    .racing-stripe {
      height: 1.5mm;
      background: linear-gradient(to right, #dc2626, white, #dc2626);
    }
  </style>
</head>
<body>
  <div class="racing-stripe"></div>

  <div class="header">
    <img class="logo" src="${logoB64}" alt="Overcut Academy">
    <h1>Setups</h1>
    <p class="tagline">Race weekends are short. Stay organized.</p>
  </div>

  <div class="screenshots">
    <div class="screenshot-card">
      <img src="${formB64}" alt="Driver Setup Form">
      <p class="caption">Drivers submit setups in seconds</p>
    </div>
    <div class="screenshot-card">
      <img src="${dashB64}" alt="Manager Dashboard">
      <p class="caption">Managers see everything, instantly</p>
    </div>
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
```

- [ ] **Step 2: Run script and open the HTML file in a browser to preview**

```bash
cd "c:/Users/lucas/OneDrive/Desktop/Cursor Projects/Setup app" && node marketing/generate-marketing-pdf.mjs
```

Then open `marketing/setups-marketing.html` in a browser to visually inspect the layout.

- [ ] **Step 3: Iterate on sizing/spacing if needed**

Adjust mm values in the CSS if elements are too large/small or the page overflows. The layout must fit exactly one A4 page (210mm × 297mm).

- [ ] **Step 4: Commit**

```bash
git add marketing/generate-marketing-pdf.mjs
git commit -m "feat(marketing): build HTML marketing page with base64 images"
```

---

### Task 5: Generate PDF from HTML

**Files:**
- Modify: `marketing/generate-marketing-pdf.mjs` — implement `generatePDF()`

- [ ] **Step 1: Implement generatePDF**

```javascript
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
```

Note: Reuses the same browser instance from `main()` — no need for a separate launch.

- [ ] **Step 2: Run the complete script end-to-end**

```bash
cd "c:/Users/lucas/OneDrive/Desktop/Cursor Projects/Setup app" && node marketing/generate-marketing-pdf.mjs
```

Expected output:
```
🏁 Generating marketing PDF...
📸 Capturing form screenshot...
✅ Form screenshot captured
📸 Capturing dashboard screenshot...
✅ Dashboard screenshot captured
✅ HTML saved
📄 Generating PDF...
✅ PDF saved to marketing/setups-marketing.pdf
```

- [ ] **Step 3: Open the PDF and visually verify**

Open `marketing/setups-marketing.pdf`. Verify:
- Single page, A4 portrait
- Dark background renders (not white)
- Overcut Academy logo visible at top
- "SETUPS" title and tagline visible
- Both screenshots visible with red glow borders
- Captions below screenshots
- Benefits strip with 3 items
- CTA footer with email

- [ ] **Step 4: Commit**

```bash
git add marketing/
git commit -m "feat(marketing): generate final PDF with Playwright"
```

---

### Task 6: Final polish and iteration

- [ ] **Step 1: Review the PDF with the user**

Share the PDF for review. Common adjustments:
- Screenshot sizing (too big/small)
- Font sizes
- Spacing between sections
- Screenshot quality (try `deviceScaleFactor: 2` in viewport for retina screenshots)

- [ ] **Step 2: Add `.gitignore` entry for generated files (optional)**

If the user doesn't want generated screenshots/PDFs in git, add to `.gitignore`:
```
marketing/screenshots/
marketing/setups-marketing.pdf
marketing/setups-marketing.html
```

- [ ] **Step 3: Final commit**

```bash
git add marketing/
git commit -m "feat(marketing): finalize marketing PDF for distribution"
```
