# Marketing PDF — Setups by Overcut Academy

## Overview

A single-page A4 portrait PDF to market the "Setups" application to karting teams. Designed for distribution via email and WhatsApp. Visual-first with real app screenshots and a racing-inspired dark aesthetic.

## Design Decisions

- **Language:** English only
- **Style:** Dark background (#0a0a0a), red accents (#dc2626), racing/energetic — matching the app's existing aesthetic
- **Tone:** Visual showcase with minimal text. Core message: organization matters when track time is limited
- **Contact:** lucas@overcutacademy.com
- **Font:** System font stack matching the app: `'Segoe UI', Arial, Helvetica, sans-serif`

## Page Layout (A4 Portrait)

### Top Section — Brand Header (~15% of page)
- Overcut Academy logo centered (source: `frontend/public/overcut-academy-logo.png`, white on transparent — works on dark bg)
- "SETUPS" in large bold type below the logo
- Tagline: "Race weekends are short. Stay organized."

### Middle Section — Screenshots (~60% of page)
Two screenshots side by side with subtle depth treatment:
- Drop shadow (`box-shadow: 0 20px 60px rgba(0,0,0,0.6)`)
- Rounded corners (`border-radius: 12px`)
- Soft red glow border (`box-shadow` with `rgba(220, 38, 38, 0.3)`)

- **Left:** Driver form view at tablet width showing the Kart Setup step with fields filled in
  - Caption: "Drivers submit setups in seconds"
- **Right:** Manager dashboard showing submissions table with 3 demo entries, filters, and action buttons
  - Caption: "Managers see everything, instantly"

### Bottom Section — Benefits + CTA (~25% of page)
A thin strip with 3 benefit phrases in a horizontal row:
1. "Pre-filled data saves 90% of entry time"
2. "Search, filter & export any session"
3. "Multi-language support"

Footer CTA bar:
- "Get your team set up"
- lucas@overcutacademy.com

## Screenshot Capture Prerequisites

### Demo Team
The app has a pre-configured demo team (slug: `demo`) with 3 seeded submissions. The team and data are created by `backend/src/scripts/create-demo-team.ts`.

### Authentication
The manager dashboard requires login. For the demo team:
- **Email:** `demo@overcut.com`
- **Password:** `setupdemo`
- The login page at `/demo/manager/login` auto-fills these credentials for the demo slug.
- Playwright must: navigate to login page, submit the form, wait for redirect to dashboard.

### Form Navigation
The form is a multi-step wizard. To capture Step 4 (Kart Setup):
1. Navigate to `/demo/form`
2. Fill Step 1 fields (email, name, session type, track, championship, division)
3. Click "Next" to advance through Steps 2 and 3 (fill minimally)
4. Capture Step 4 which shows chassis, axle, hubs, bar, spindle, caster, seat fields

### Viewport Dimensions
- **Form screenshot:** 768px width (tablet view — form is used at the track on tablets)
- **Dashboard screenshot:** 1280px width (desktop view — managers use laptops)
- Both captures at a height sufficient to avoid scrolling the target content.

## Technical Approach

1. **App must be running** — both frontend (localhost:3000) and backend (localhost:3001) must be running before the script executes. The script does not start/stop them.
2. **Capture real screenshots** using Playwright:
   - Form: navigate through steps, fill demo data, capture Step 4
   - Dashboard: login with demo credentials, wait for table to load, capture
3. **Build a standalone HTML file** with inline CSS. All images (logo + screenshots) embedded as base64 data URIs for full portability.
4. **Generate PDF** using Playwright's `page.pdf()` with:
   - `format: 'A4'`
   - `printBackground: true` (critical — without this the dark background is lost)
   - `margin: { top: 0, right: 0, bottom: 0, left: 0 }` (full-bleed design)

## Screenshots to Capture

| Screenshot | URL | Viewport | What to show |
|---|---|---|---|
| Driver form | `/demo/form` (navigate to Step 4) | 768×1024 | Kart Setup step with fields filled: chassis, axle, hubs, bar, spindle, caster, seat position |
| Manager dashboard | `/demo/manager/dashboard` (after login) | 1280×800 | Table of 3 submissions with driver names, tracks, sessions, action buttons visible |

## Output

- PDF: `marketing/setups-marketing.pdf`
- HTML source: `marketing/setups-marketing.html`
- Screenshots: `marketing/screenshots/form.png`, `marketing/screenshots/dashboard.png`
