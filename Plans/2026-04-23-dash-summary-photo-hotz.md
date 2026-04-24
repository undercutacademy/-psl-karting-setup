# Dash Summary Photo Capture — HOTZ Setup Form

**Date:** 2026-04-23
**Status:** Design approved, ready for implementation planning
**Scope:** HOTZ team only (initially), via per-team form configuration

---

## Context

The HOTZ team owner wants drivers to attach a photo of their dash summary
(lap times, temperatures, etc. — typically MyChron, but not every driver
runs one, so the feature stays dash-agnostic) when submitting a setup.
The photo must:

- Be captured on the last page of the setup form (step 5, "Final Details").
- Be compressed client-side so it fits comfortably in the database while
  keeping the on-screen digits legible.
- Appear in the manager dashboard when viewing a submission.
- Appear in the PDF export alongside the other submission details.

The codebase already supports per-team form configuration through
`Team.formConfig` (Prisma JSON). This feature extends that same mechanism
with a new photo field. HOTZ is the only team that enables it at launch;
any future team can opt in with a config change, no code change.

---

## Locked decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Field wiring | Configurable per-team field, enabled for HOTZ only |
| 2 | Storage | Dedicated column on `Submission`, base64 text (data URL) |
| 3 | Capture UX | Native `<input type="file" accept="image/*" capture="environment">` |
| 4 | Compression | `browser-image-compression`, 1600 px max / JPEG 0.8 / ≤ 300 KB |
| 5 | Required vs optional | Always optional |
| 6 | Display | ~600 px inline with click-to-zoom in dashboard; ~450 px inline section in PDF |
| 7 | Field name | `dashSummaryPhoto` (dash-agnostic — not all drivers run MyChron) |
| 8 | UX buttons | "Retake" + "Remove" pair; helper text kept under the label |

---

## Section 1 — End-to-end architecture

Five places in the codebase change; nothing else.

1. **Prisma schema** — add nullable `dashSummaryPhoto String?` on the
   `Submission` model.
2. **Team config** — add `"dashSummaryPhoto"` to `formConfig.enabledFields`
   in [backend/src/scripts/create-hotz-team.ts](backend/src/scripts/create-hotz-team.ts).
3. **Form step 5** — new field block in
   [frontend/app/[teamSlug]/form/page.tsx:1288-1387](frontend/app/[teamSlug]/form/page.tsx),
   rendered only when the team config enables it.
4. **Backend submission route** — accept `dashSummaryPhoto` in the POST body,
   size-guard it, persist it; exclude it from list queries via explicit
   Prisma `select`; return it on the detail and PDF endpoints.
5. **Manager dashboard + PDF** — render in
   [frontend/app/[teamSlug]/manager/submission/[id]/page.tsx](frontend/app/[teamSlug]/manager/submission/[id]/page.tsx)
   and embed in
   [backend/src/services/pdfService.ts](backend/src/services/pdfService.ts)
   using the existing `doc.image()` pattern at
   [backend/src/services/pdfService.ts:212](backend/src/services/pdfService.ts#L212).

No new infrastructure — no storage bucket, no multipart middleware, no new
env vars, no new auth layer. The photo travels in the existing submission
JSON body.

---

## Section 2 — Data model

### New column on `Submission`

File: [backend/prisma/schema.prisma](backend/prisma/schema.prisma) (lines 135–185)

```prisma
dashSummaryPhoto String? // base64 data URL (JPEG), ≤ ~400 KB; dash summary photo for HOTZ
```

- **Type:** `String?` (nullable TEXT in Postgres). Stores a full data URL
  (`data:image/jpeg;base64,...`) so the frontend can drop it straight into
  `<img src={...}>` without decoration.
- **Why String and not Bytes/bytea:** simpler end-to-end. Existing JSON
  transport stays unchanged — no multipart middleware, no bytea ↔ base64
  conversion. The ~33% size overhead of base64 vs raw binary is acceptable
  at this volume (≤ 400 KB per row, one per submission).
- **Migration:** single additive `ALTER TABLE "Submission" ADD COLUMN
  "dashSummaryPhoto" TEXT;`. Safe on a populated table — nullable, no
  backfill needed.

### Query strategy

- Submission **list** endpoint (used by manager dashboard) must
  **explicitly exclude** `dashSummaryPhoto` via Prisma `select`. Otherwise
  every row pulls hundreds of KB over the wire.
- Submission **detail** endpoint (`GET /submissions/:id`) and the **PDF**
  endpoint include the column.
- Audit any "list recent submissions" email/notification path for the same
  exclusion.

### Team config

The `formConfig.enabledFields` list gains the new string key
`"dashSummaryPhoto"`, following the exact same pattern as the existing
fields in
[backend/src/scripts/create-hotz-team.ts:13-26](backend/src/scripts/create-hotz-team.ts).
No schema change on `Team` — `formConfig` is already free-form JSON.

### Server-side size guard

`POST /submissions` rejects with HTTP 413 if `dashSummaryPhoto` exceeds
**500 KB** as a string (≈ 375 KB JPEG binary). Client compression targets
300 KB, so this leaves headroom while blocking anyone bypassing the
frontend. Express's default JSON body-parser limit is 100 KB — bump the
submission route to **1 MB** (one-line config change).

---

## Section 3 — Form UX (step 5)

### Placement

New field block after the `observation` textarea in step 5 "Final Details"
([frontend/app/[teamSlug]/form/page.tsx:1288-1387](frontend/app/[teamSlug]/form/page.tsx)).
Rendered only when `isFieldEnabled('dashSummaryPhoto')` returns true — uses
the existing per-team config mechanism, no team-slug branching.

### Copy (all 3 supported languages)

| Language | Label | Helper text |
|---|---|---|
| EN | Dash summary photo (optional) | Take a photo of your dash summary showing lap times, temperatures, etc. |
| PT | Foto do resumo do dash (opcional) | Tire uma foto do seu dash mostrando tempos, temperaturas, etc. |
| ES | Foto del resumen del dash (opcional) | Saca una foto de tu dash mostrando tiempos, temperaturas, etc. |

### Field states

| State | UI |
|---|---|
| Empty | Large tappable button: "📷 Take photo / Tirar foto / Sacar foto". Hidden `<input type="file" accept="image/*" capture="environment">` under the hood. |
| Compressing | Button replaced by spinner + "Compressing..." label. Submit disabled during this window. Usually < 2s on mid-range phones. |
| Preview | Compressed thumbnail (~280 px wide), file-size label ("Photo attached · 187 KB"), two buttons: **Retake** (reopens camera), **Remove** (clears field). |
| Error | Inline red message: "Could not process this photo — please try again." Field returns to empty. Submission stays enabled (field is optional). |

### Compression flow

On file input `onChange`:

1. Validate `file.type.startsWith('image/')`; reject otherwise.
2. Run `browser-image-compression` with:
   ```js
   {
     maxSizeMB: 0.3,
     maxWidthOrHeight: 1600,
     useWebWorker: true,
     fileType: 'image/jpeg',
     initialQuality: 0.8,
   }
   ```
3. Convert resulting `Blob` to base64 data URL via `FileReader.readAsDataURL`.
4. Store in form state as `dashSummaryPhoto: string`.

### Submit flow

Existing submission POST body gains one new field:
`dashSummaryPhoto: string | null`. No multipart, no separate upload — rides
the same JSON body as every other answer.

### Retake / Remove

- **Retake**: re-trigger the file input; overwrites current photo after
  re-compression.
- **Remove**: set state back to `null`. No confirm dialog — it's optional
  and trivial to re-take.

### Accessibility

- Visible `<label>` tied to the file input.
- Preview `<img>` has descriptive `alt` text.
- Explicit `aria-label` on Retake/Remove buttons.

### Dependencies

New dependency: `browser-image-compression` (~15 KB min+gz). Add to
[frontend/package.json](frontend/package.json).

---

## Section 4 — Dashboard view + PDF export

### Dashboard view page

File: [frontend/app/[teamSlug]/manager/submission/[id]/page.tsx](frontend/app/[teamSlug]/manager/submission/[id]/page.tsx)

- New section at the end of the submission detail card, titled "Dash Summary"
  (translated per the manager's language).
- Render via `<img src={submission.dashSummaryPhoto} alt="Dash summary photo" />`
  — data URL means no network fetch, no signed URL, no broken-image edge case.
- Sized at `max-width: 600px; height: auto`, with a light border and rounded
  corners consistent with the rest of the card.
- **Click to zoom**: opens the image at full resolution in a lightbox
  overlay (fixed overlay, click backdrop or ESC to close). Minimal
  ~30-line component — no library needed.
- If `dashSummaryPhoto` is null, the whole section is omitted. No
  "no photo" placeholder.

### Dashboard list

No thumbnail in the list rows — the field is optional and would clutter.
Managers see the photo after clicking into a submission. (Also aligns with
the Section 2 list-endpoint exclusion for speed.)

### PDF export

File: [backend/src/services/pdfService.ts](backend/src/services/pdfService.ts)

- New section after the existing "Final Details" content.
- Section heading: "Dash Summary" / "Resumo do Dash" / "Resumen del Dash" —
  styled the same as existing section headings.
- Embed via `doc.image()` using the existing pattern at
  [backend/src/services/pdfService.ts:212](backend/src/services/pdfService.ts#L212).
- Sizing: `width: 450`, height auto (pdfkit preserves aspect ratio).
- **Page-break handling:** before drawing, check remaining page space for
  heading + image; `doc.addPage()` if insufficient. pdfkit does not
  auto-reflow.
- Pass the base64 string (or buffer) directly to `doc.image()`, stripping
  the `data:image/jpeg;base64,` prefix.
- Wrap the embed in try/catch — if the stored string is malformed, skip
  the section silently and log a warning with the submission ID. Don't
  fail the whole PDF for one broken image.
- If `dashSummaryPhoto` is null, section omitted entirely.

### i18n additions

Add to the existing translations object at
[backend/src/services/pdfService.ts:36-151](backend/src/services/pdfService.ts#L36-L151):

```
dashSummary:
  en: "Dash Summary"
  pt: "Resumo do Dash"
  es: "Resumen del Dash"
```

Corresponding additions to the frontend translation files for the form
labels and helper text, and the dashboard view heading.

---

## Section 5 — Error handling & edge cases

### Client-side (form)

| Scenario | Behavior |
|---|---|
| Non-image file selected | `onChange` rejects if `!file.type.startsWith('image/')`; show inline red error. |
| HEIC file from iPhone | `browser-image-compression` auto-converts to JPEG. No special handling. |
| EXIF rotation (landscape shot sideways) | Library normalizes rotation during compression. |
| Compression throws (corrupt file, OOM on old phone) | Catch, show "Could not process this photo — please try again." Field returns to empty; submission stays enabled. |
| Result still > 500 KB after compression | Guard anyway: reject with "Photo too large — please try a different shot." |
| Browser closed mid-compression | Worker aborts; no persistence, no recovery. Next visit starts fresh. |
| Network loss during submit | Existing submission-submit retry re-sends the photo along with the rest. No partial-upload state. |

### Server-side (`POST /submissions`)

| Scenario | Behavior |
|---|---|
| `dashSummaryPhoto` missing / null | Write `null` to the column. Normal path. |
| Length > 500 KB | HTTP 413 `{ error: 'Photo too large' }`. |
| Not a valid data URL (regex `^data:image/(jpeg\|png\|webp);base64,[A-Za-z0-9+/=]+$`) | HTTP 400 `{ error: 'Invalid photo format' }`. |
| Valid data URL | Store verbatim. No server-side re-compression. |

Body-parser limit raised to 1 MB on the submission route.

### PDF generation

| Scenario | Behavior |
|---|---|
| `dashSummaryPhoto` is null | Skip the section entirely (no heading, no empty box). |
| `doc.image()` throws | Catch, skip section, log warning with submission ID. PDF still generates successfully. |
| Image would overflow the page | Explicit page-break check before drawing (covered in Section 4). |

### Dashboard view

| Scenario | Behavior |
|---|---|
| `dashSummaryPhoto` is null | Section omitted. |
| Stored string corrupt | `<img>` renders broken. Acceptable — rare, cosmetic only. No special handling. |

### Database / storage

- Postgres `TEXT` has no relevant size ceiling (1 GB per value).
- Table growth predictable for years at expected submission volume.
- Backup size: HOTZ rows with photos ~300× larger than text-only rows.
  Monitor; the list-query exclusion already keeps the hot path fast.

---

## Section 6 — Verification / end-to-end testing

### Prerequisites

1. Run the Prisma migration locally: `npx prisma migrate dev --name add_dash_summary_photo`.
2. Run the HOTZ seed update: re-run the script in
   [backend/src/scripts/create-hotz-team.ts](backend/src/scripts/create-hotz-team.ts)
   (or a targeted update) to set `dashSummaryPhoto: true` in HOTZ's
   `enabledFields`.
3. Install `browser-image-compression` in the frontend.

### Test matrix

| # | Test | How |
|---|---|---|
| 1 | Field shows for HOTZ, hides for other teams | Open the form at `/hotz/form` — field appears in step 5. Open `/<other-team>/form` — field absent. |
| 2 | Optional submit (no photo) | Complete a HOTZ form without uploading a photo. Submit succeeds. Dashboard detail view omits the "Dash Summary" section. PDF export omits the section. |
| 3 | Happy-path photo upload | Take/upload a real image. Watch "Compressing..." state briefly. Preview renders with file-size label. Submit. Dashboard view shows the photo at ~600 px. Clicking opens lightbox. PDF export includes a readable embedded photo. |
| 4 | Retake | After preview, click Retake → camera/file-picker reopens → new photo replaces old. |
| 5 | Remove | After preview, click Remove → field returns to empty state. Submitting persists `null`. |
| 6 | Non-image file | Pick a `.txt`/`.pdf` → inline error, nothing uploads. |
| 7 | Oversized client compression output (force by uploading a huge solid-color image) | Client guard rejects cleanly, UX message shown. |
| 8 | Server-side size cap | Use `curl` to POST a `dashSummaryPhoto` string > 500 KB → HTTP 413. |
| 9 | Server-side format validation | POST an invalid data URL → HTTP 400. |
| 10 | Dashboard list performance | Open the dashboard list for a HOTZ account with many submissions. Confirm payload size/response time is unchanged (list query excludes the photo column). |
| 11 | PDF image placement near page bottom | Fill up a submission with long `observation` text so the photo would overflow. Confirm pdfkit page-break logic puts the photo on a new page. |
| 12 | Malformed stored photo | Manually corrupt a row's `dashSummaryPhoto` value in the DB. Request its PDF → PDF generates without the section. Open the dashboard view → `<img>` is visibly broken but page doesn't crash. |

### Readability check (manual)

After test #3, open the generated PDF at 100% zoom. Lap times, temperatures,
and RPMs on the dash should be legible without pinch-zoom. If blurry in
real-world testing:

- Bump `maxWidthOrHeight` to 2000.
- Bump `initialQuality` to 0.85.
- Bump the server-side size cap proportionally (500 → 700 KB).

---

## Files to modify

### Backend
- [backend/prisma/schema.prisma](backend/prisma/schema.prisma) — add `dashSummaryPhoto` column
- [backend/prisma/migrations/](backend/prisma/migrations/) — new migration file (auto-generated)
- [backend/src/scripts/create-hotz-team.ts](backend/src/scripts/create-hotz-team.ts) — add field to `enabledFields`
- [backend/src/routes/submissions.ts](backend/src/routes/submissions.ts) — accept + validate + persist; bump body-parser limit; exclude from list query; include in detail + PDF routes
- [backend/src/services/pdfService.ts](backend/src/services/pdfService.ts) — new section, `doc.image()` embed, translations

### Frontend
- [frontend/package.json](frontend/package.json) — add `browser-image-compression`
- [frontend/app/[teamSlug]/form/page.tsx](frontend/app/[teamSlug]/form/page.tsx) — new field block in step 5
- [frontend/app/[teamSlug]/manager/submission/[id]/page.tsx](frontend/app/[teamSlug]/manager/submission/[id]/page.tsx) — new "Dash Summary" section + lightbox
- [frontend/types/submission.ts](frontend/types/submission.ts) — add `dashSummaryPhoto?: string | null` to the `Submission` interface
- [frontend/lib/api.ts](frontend/lib/api.ts) — (if submission types are centralized here, include the new field)
- Translation files (EN/PT/ES) — form label, helper text, dashboard section heading, error messages

### Existing patterns to reuse
- Per-team field gating: existing `isFieldEnabled()` helper in the form page.
- PDF image embed: existing `doc.image()` call at [pdfService.ts:212](backend/src/services/pdfService.ts#L212).
- Prisma `select` exclusion: same pattern as any list endpoint that already trims columns; confirm during implementation which list endpoints need updating.

---

## Out of scope (explicit non-goals)

- Not using external object storage (Netlify Blobs, Supabase Storage, S3).
  Flagged as the migration target if HOTZ usage outgrows the in-DB approach.
- Not enabling the field for any non-HOTZ team at launch.
- Not supporting multiple photos per submission.
- No inline live-camera preview (`getUserMedia`) — native OS camera only.
- No server-side re-compression — trust the client, guard with size cap.
- No photo thumbnail in the dashboard list view.
- No email attachment changes as part of this work (if the PDF is already
  email-attached, the photo flows through automatically; if not, out of scope).
