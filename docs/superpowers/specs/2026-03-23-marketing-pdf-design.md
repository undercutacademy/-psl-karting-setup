# Marketing PDF — Setups by Overcut Academy

## Overview

A single-page A4 portrait PDF to market the "Setups" application to karting teams. Designed for distribution via email and WhatsApp. Visual-first with real app screenshots and a racing-inspired dark aesthetic.

## Design Decisions

- **Language:** English only
- **Style:** Dark background, red accents, racing/energetic — matching the app's existing aesthetic
- **Tone:** Visual showcase with minimal text. Core message: organization matters when track time is limited
- **Contact:** lucas@overcutacademy.com

## Page Layout (A4 Portrait)

### Top Section — Brand Header (~15% of page)
- Overcut Academy logo, centered
- "SETUPS" in large bold type below the logo
- Tagline: "Race weekends are short. Stay organized."

### Middle Section — Screenshots (~60% of page)
Two screenshots side by side with subtle perspective/shadow for depth:

- **Left:** Driver form view (mobile/tablet) showing setup fields a driver fills at the track
  - Caption: "Drivers submit setups in seconds"
- **Right:** Manager dashboard showing submissions table with entries, filters, and actions
  - Caption: "Managers see everything, instantly"

Both screenshots framed with rounded borders and a soft red glow matching the app's racing aesthetic.

### Bottom Section — Benefits + CTA (~25% of page)
A thin strip with 3 benefit phrases in a horizontal row:
1. "Pre-filled data saves 90% of entry time"
2. "Search, filter & export any session"
3. "Multi-language support"

Footer CTA bar:
- "Get your team set up"
- lucas@overcutacademy.com

## Technical Approach

1. **Capture real screenshots** using Playwright from the running app:
   - Form page: `/demo/form` — capture a filled-in form step
   - Manager dashboard: `/demo/manager/dashboard` — capture submissions table with data
2. **Build a standalone HTML file** with inline CSS (dark theme, red accents, racing aesthetic)
3. **Generate PDF** from the HTML using Playwright's `page.pdf()` method

## Screenshots to Capture

| Screenshot | URL | What to show |
|---|---|---|
| Driver form | `/demo/form` | A form step with setup fields visible (Step 4 — Kart Setup is the most visually rich) |
| Manager dashboard | `/demo/manager/dashboard` | Table of submissions with multiple rows, showing filters and action buttons |

## Output

- File: `marketing/setups-marketing.pdf`
- Also keep the HTML source: `marketing/setups-marketing.html`
- Screenshots saved to: `marketing/screenshots/`
