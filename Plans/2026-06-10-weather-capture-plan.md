# Weather Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record temperature, surface pressure, and humidity on every setup submission via browser geolocation + Open-Meteo, shown read-only to the driver and surfaced to managers in the detail view, PDF, and email.

**Architecture:** The form's final step gets a coarse GPS fix and calls Open-Meteo directly from the browser (no API key, CORS-enabled); the values are displayed read-only and included in the existing `POST /api/submissions` body. The backend range-validates (invalid → null, never reject) and stores them in three new nullable `Submission` columns. Spec: `Plans/2026-06-10-weather-capture-design.md`.

**Tech Stack:** Next.js 16 / React 19 frontend, Express 5 + Prisma 5 backend, Open-Meteo `v1/forecast` API.

**Testing note:** This repo has no test suite (per CLAUDE.md). Verification for each task = `npm run build` passes; final task verifies in a real browser. Do not introduce a test framework.

---

### Task 1: Prisma schema + migration

**Files:**
- Modify: `backend/prisma/schema.prisma` (Submission model, after `dashSummaryPhoto` at ~line 187)
- Created by tooling: `backend/prisma/migrations/<timestamp>_add_weather_to_submissions/`

- [ ] **Step 1: Add the three columns to the Submission model**

In `backend/prisma/schema.prisma`, find:

```prisma
  customData        Json?             // Team-specific field values
  dashSummaryPhoto  String?           // Optional dash summary photo (base64 data URL, JPEG)
  isFavorite        Boolean           @default(false)
```

and insert the weather columns between `dashSummaryPhoto` and `isFavorite`:

```prisma
  customData        Json?             // Team-specific field values
  dashSummaryPhoto  String?           // Optional dash summary photo (base64 data URL, JPEG)
  weatherTempC       Float?           // Auto-captured at submit: air temperature, °C
  weatherPressureHpa Float?           // Auto-captured at submit: surface pressure at track elevation, hPa
  weatherHumidityPct Float?           // Auto-captured at submit: relative humidity, %
  isFavorite        Boolean           @default(false)
```

- [ ] **Step 2: Create and apply the migration**

Run from `backend/`: `npx prisma migrate dev --name add_weather_to_submissions`

Expected: a new folder under `backend/prisma/migrations/` containing a `migration.sql` with three `ALTER TABLE "Submission" ADD COLUMN` statements, "Your database is now in sync", and the Prisma client regenerated. (Nullable columns — non-breaking for the running app.)

- [ ] **Step 3: Verify backend compiles against the new client**

Run from `backend/`: `npm run build`
Expected: exit code 0, no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations
git commit -m "feat: add weather columns to Submission"
```

---

### Task 2: Backend — normalize and store weather fields

**Files:**
- Create: `backend/src/lib/weather.ts`
- Modify: `backend/src/routes/submissions.ts` (imports at top; POST handler ~line 382; PUT handler ~line 564)

- [ ] **Step 1: Create `backend/src/lib/weather.ts`**

```ts
// Plausible-on-Earth ranges; anything outside is treated as API/client garbage.
const WEATHER_RANGES: Record<string, { min: number; max: number }> = {
  weatherTempC: { min: -30, max: 55 },
  weatherPressureHpa: { min: 800, max: 1100 },
  weatherHumidityPct: { min: 0, max: 100 },
};

// Weather is auxiliary data: invalid values become null instead of failing
// the submission. Keys that are absent stay absent so PUT doesn't clobber
// stored values the caller never sent.
export function normalizeWeatherFields(data: any): void {
  for (const [key, range] of Object.entries(WEATHER_RANGES)) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
    const num = typeof data[key] === 'number' ? data[key] : parseFloat(data[key]);
    data[key] = Number.isFinite(num) && num >= range.min && num <= range.max ? num : null;
  }
}

// "24.3 °C · 62% · 1013 hPa" from whichever readings are present; '' if none.
export function formatConditions(s: {
  weatherTempC?: number | null;
  weatherPressureHpa?: number | null;
  weatherHumidityPct?: number | null;
}): string {
  const parts: string[] = [];
  if (s.weatherTempC != null) parts.push(`${s.weatherTempC.toFixed(1)} °C`);
  if (s.weatherHumidityPct != null) parts.push(`${Math.round(s.weatherHumidityPct)}%`);
  if (s.weatherPressureHpa != null) parts.push(`${Math.round(s.weatherPressureHpa)} hPa`);
  return parts.join(' · ');
}
```

(`formatConditions` is consumed in Task 5 by the PDF and email services.)

- [ ] **Step 2: Wire into the POST handler**

In `backend/src/routes/submissions.ts`, add to the imports at the top of the file:

```ts
import { normalizeWeatherFields } from '../lib/weather';
```

Then in `router.post('/', ...)`, find:

```ts
    delete cleanSubmissionData.dashSummaryPhoto;

    // Transform enum values from frontend format to Prisma format
    const transformedData = transformSubmissionData(cleanSubmissionData);
```

and insert the normalization between them:

```ts
    delete cleanSubmissionData.dashSummaryPhoto;

    normalizeWeatherFields(cleanSubmissionData);

    // Transform enum values from frontend format to Prisma format
    const transformedData = transformSubmissionData(cleanSubmissionData);
```

- [ ] **Step 3: Wire into the PUT handler**

In `router.put('/:id', ...)`, find:

```ts
      normalizedPhoto = photoResult.value;
      delete cleanData.dashSummaryPhoto;
    }

    // Transform enum values
    const transformedData = transformSubmissionData(cleanData);
```

and insert:

```ts
      normalizedPhoto = photoResult.value;
      delete cleanData.dashSummaryPhoto;
    }

    normalizeWeatherFields(cleanData);

    // Transform enum values
    const transformedData = transformSubmissionData(cleanData);
```

- [ ] **Step 4: Build**

Run from `backend/`: `npm run build`
Expected: exit code 0.

- [ ] **Step 5: Commit**

```bash
git add backend/src/lib/weather.ts backend/src/routes/submissions.ts
git commit -m "feat: accept and range-validate weather fields on submission create/update"
```

---

### Task 3: Frontend — weather helper + Submission type

**Files:**
- Create: `frontend/lib/weather.ts`
- Modify: `frontend/types/submission.ts` (Submission interface, after `dashSummaryPhoto` at ~line 123)

- [ ] **Step 1: Create `frontend/lib/weather.ts`**

```ts
export interface WeatherData {
  tempC: number;
  pressureHpa: number;
  humidityPct: number;
}

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false, // weather needs city-block accuracy, not GPS precision
  timeout: 10_000,
  maximumAge: 600_000, // a cached fix up to 10 minutes old is fine
};

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation unavailable'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, GEO_OPTIONS);
  });
}

// Fetches current conditions for the device's location from Open-Meteo.
// surface_pressure (not sea-level) — carburation cares about actual air
// density at track elevation. Returns null on ANY failure (permission
// denied, timeout, offline, bad response): weather never blocks a submission.
export async function fetchCurrentWeather(): Promise<WeatherData | null> {
  try {
    const pos = await getPosition();
    // ~110 m precision — enough for weather, avoids sending an exact
    // position to a third party.
    const lat = pos.coords.latitude.toFixed(3);
    const lon = pos.coords.longitude.toFixed(3);
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure`
    );
    if (!res.ok) return null;
    const body = await res.json();
    const tempC = Number(body?.current?.temperature_2m);
    const humidityPct = Number(body?.current?.relative_humidity_2m);
    const pressureHpa = Number(body?.current?.surface_pressure);
    if (![tempC, humidityPct, pressureHpa].every(Number.isFinite)) return null;
    return { tempC, pressureHpa, humidityPct };
  } catch {
    return null;
  }
}

// "24.3 °C · 62% · 1013 hPa" from whichever readings are present; '' if none.
export function formatConditions(s: {
  weatherTempC?: number | null;
  weatherPressureHpa?: number | null;
  weatherHumidityPct?: number | null;
}): string {
  const parts: string[] = [];
  if (s.weatherTempC != null) parts.push(`${s.weatherTempC.toFixed(1)} °C`);
  if (s.weatherHumidityPct != null) parts.push(`${Math.round(s.weatherHumidityPct)}%`);
  if (s.weatherPressureHpa != null) parts.push(`${Math.round(s.weatherPressureHpa)} hPa`);
  return parts.join(' · ');
}
```

- [ ] **Step 2: Add the fields to the Submission type**

In `frontend/types/submission.ts`, find:

```ts
  dashSummaryPhoto?: string | null;
  isFavorite?: boolean;
```

and insert:

```ts
  dashSummaryPhoto?: string | null;
  weatherTempC?: number | null;
  weatherPressureHpa?: number | null;
  weatherHumidityPct?: number | null;
  isFavorite?: boolean;
```

- [ ] **Step 3: Build**

Run from `frontend/`: `npm run build`
Expected: exit code 0 ("Compiled successfully").

- [ ] **Step 4: Commit**

```bash
git add frontend/lib/weather.ts frontend/types/submission.ts
git commit -m "feat: add Open-Meteo weather helper and Submission weather fields"
```

---

### Task 4: Frontend — form capture UI + translations

**Files:**
- Modify: `frontend/lib/translations.ts` (all four language blocks)
- Modify: `frontend/app/[teamSlug]/form/page.tsx` (imports ~line 8; state ~line 141; effects ~line 213; handleSubmit ~line 393; step 5 JSX ~line 1467)

- [ ] **Step 1: Add translation keys to all four languages**

In `frontend/lib/translations.ts`, add three keys to **each** of the `en`, `es`, `pt`, `it` blocks, next to the `photoTooLarge` key (each block mirrors the same key set — TypeScript will error if any block is missed):

`en`:
```ts
        trackConditions: 'Track Conditions',
        detectingConditions: 'Detecting conditions...',
        conditionsUnavailable: 'Conditions unavailable',
```

`es`:
```ts
        trackConditions: 'Condiciones de Pista',
        detectingConditions: 'Detectando condiciones...',
        conditionsUnavailable: 'Condiciones no disponibles',
```

`pt`:
```ts
        trackConditions: 'Condições da Pista',
        detectingConditions: 'Detectando condições...',
        conditionsUnavailable: 'Condições indisponíveis',
```

`it`:
```ts
        trackConditions: 'Condizioni della Pista',
        detectingConditions: 'Rilevamento condizioni...',
        conditionsUnavailable: 'Condizioni non disponibili',
```

- [ ] **Step 2: Import the helper in the form page**

In `frontend/app/[teamSlug]/form/page.tsx`, after the existing `@/lib/api` import line, add:

```ts
import { fetchCurrentWeather, formatConditions, WeatherData } from '@/lib/weather';
```

- [ ] **Step 3: Add weather state**

After the tyre-pressure state lines:

```ts
  const [pressureRR, setPressureRR] = useState('');
  const [pressureLR, setPressureLR] = useState('');
```

add:

```ts
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherStatus, setWeatherStatus] = useState<'idle' | 'loading' | 'done' | 'unavailable'>('idle');
  // The capture must fire exactly once even if the driver navigates back
  // and forth between steps.
  const weatherRequestedRef = useRef(false);
```

- [ ] **Step 4: Add the capture effect**

After the "Fetch team configuration on mount" `useEffect` (ends ~line 213), add:

```ts
  // Capture conditions once, when the driver first reaches the final step.
  // Both paths land on step 5 (the full form and the "setup unchanged" skip),
  // so every submission gets a capture attempt.
  useEffect(() => {
    if (currentStep !== 5 || weatherRequestedRef.current) return;
    weatherRequestedRef.current = true;
    setWeatherStatus('loading');
    fetchCurrentWeather().then((data) => {
      setWeather(data);
      setWeatherStatus(data ? 'done' : 'unavailable');
    });
  }, [currentStep]);
```

- [ ] **Step 5: Include weather in the submission payload**

In `handleSubmit`, find:

```ts
      submissionData.customData = customData;
```

and insert directly after it:

```ts
      // Always overwrite with the fresh capture (or null) — formData may
      // carry stale weather prefilled from the driver's previous submission.
      submissionData.weatherTempC = weather?.tempC ?? null;
      submissionData.weatherPressureHpa = weather?.pressureHpa ?? null;
      submissionData.weatherHumidityPct = weather?.humidityPct ?? null;
```

- [ ] **Step 6: Add the read-only Conditions card to step 5**

In the `{currentStep === 5 && (...)}` block, find the "using previous setup" banner:

```tsx
              {hasSetupChanged === false && (
                <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4 mb-6">
                  <p className="text-green-400 font-semibold">✓ {t.usingPrevious}</p>
                </div>
              )}
```

and insert the card directly after it (before the session-type grid):

```tsx
              <div className="rounded-xl border-2 border-gray-700 bg-gray-800/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className={labelClass}>🌤 {t.trackConditions}</span>
                  {weatherStatus === 'loading' && (
                    <span className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></span>
                      {t.detectingConditions}
                    </span>
                  )}
                  {weatherStatus === 'done' && weather && (
                    <span className="font-bold text-white">
                      {formatConditions({
                        weatherTempC: weather.tempC,
                        weatherPressureHpa: weather.pressureHpa,
                        weatherHumidityPct: weather.humidityPct,
                      })}
                    </span>
                  )}
                  {weatherStatus === 'unavailable' && (
                    <span className="text-sm text-gray-500">{t.conditionsUnavailable}</span>
                  )}
                </div>
              </div>
```

- [ ] **Step 7: Build**

Run from `frontend/`: `npm run build`
Expected: exit code 0.

- [ ] **Step 8: Commit**

```bash
git add frontend/lib/translations.ts "frontend/app/[teamSlug]/form/page.tsx"
git commit -m "feat: capture and display track conditions on the form final step"
```

---

### Task 5: Manager display surfaces — detail view, PDF, email

**Files:**
- Modify: `frontend/app/[teamSlug]/manager/submission/[id]/page.tsx` (imports ~line 9; General Info grid ~line 183)
- Modify: `backend/src/services/pdfService.ts` (PDF_TRANSLATIONS blocks ~lines 37–153; General Info section ~line 293)
- Modify: `backend/src/services/emailService.ts` (notification HTML ~line 81)

- [ ] **Step 1: Detail view — add a Conditions entry to General Information**

In `frontend/app/[teamSlug]/manager/submission/[id]/page.tsx`, add to the imports:

```ts
import { formatConditions } from '@/lib/weather';
```

Then find the date entry at the end of the General Information grid:

```tsx
              <div>
                <p className={labelClass}>{t.date}</p>
                <p className={valueClass}>
                  {submission.createdAt
                    ? new Date(submission.createdAt).toLocaleString()
                    : '-'}
                </p>
              </div>
            </div>
          </div>
```

and insert a conditions entry after the date `</div>` (still inside the grid):

```tsx
              <div>
                <p className={labelClass}>{t.date}</p>
                <p className={valueClass}>
                  {submission.createdAt
                    ? new Date(submission.createdAt).toLocaleString()
                    : '-'}
                </p>
              </div>
              {formatConditions(submission) && (
                <div>
                  <p className={labelClass}>{t.trackConditions}</p>
                  <p className={valueClass}>{formatConditions(submission)}</p>
                </div>
              )}
            </div>
          </div>
```

(For old submissions all three fields are null, `formatConditions` returns `''`, and the entry is omitted.)

- [ ] **Step 2: PDF — add the translation key and the row**

In `backend/src/services/pdfService.ts`, add a `conditions` key to each of the three `PDF_TRANSLATIONS` blocks, next to `generalInfo`:

- `en`: `conditions: 'Conditions',`
- `pt`: `conditions: 'Condições',`
- `es`: `conditions: 'Condiciones',`

Add to the imports at the top of the file:

```ts
import { formatConditions } from '../lib/weather';
```

Then find the General Information section:

```ts
    // General Information Section
    yPos = drawSectionHeader(t.generalInfo, yPos);
    yPos = drawDataRow(t.championship, submission.championship, t.division, submission.division, yPos);
    yPos = drawDataRow(t.classCode, submission.classCode, t.session, submission.sessionType, yPos);
    yPos += 5;
```

and insert a conditions row before `yPos += 5;`:

```ts
    // General Information Section
    yPos = drawSectionHeader(t.generalInfo, yPos);
    yPos = drawDataRow(t.championship, submission.championship, t.division, submission.division, yPos);
    yPos = drawDataRow(t.classCode, submission.classCode, t.session, submission.sessionType, yPos);
    const conditions = formatConditions(submission);
    if (conditions) {
      yPos = drawDataRow(t.conditions, conditions, '', '', yPos);
    }
    yPos += 5;
```

- [ ] **Step 3: Email — add a Conditions line to General Info**

In `backend/src/services/emailService.ts`, add to the imports at the top of the file:

```ts
import { formatConditions } from '../lib/weather';
```

In `buildSubmissionNotificationHtml`, before the `return` statement add:

```ts
  const conditions = formatConditions(submission);
  const conditionsLine = conditions
    ? `<div><strong>Conditions:</strong> ${conditions}</div>`
    : '';
```

Then find the General Info grid in the template:

```html
          <div><strong>Championship:</strong> ${val(submission.championship)}</div>
          <div><strong>Division:</strong> ${val(submission.division)}</div>
        </div>
```

and insert the line after the Division div:

```html
          <div><strong>Championship:</strong> ${val(submission.championship)}</div>
          <div><strong>Division:</strong> ${val(submission.division)}</div>
          ${conditionsLine}
        </div>
```

(The email template is English-only by existing convention — no translation needed.)

- [ ] **Step 4: Build both halves**

Run from `backend/`: `npm run build` — expected: exit code 0.
Run from `frontend/`: `npm run build` — expected: exit code 0.

- [ ] **Step 5: Commit**

```bash
git add "frontend/app/[teamSlug]/manager/submission/[id]/page.tsx" backend/src/services/pdfService.ts backend/src/services/emailService.ts
git commit -m "feat: show track conditions in detail view, PDF, and manager email"
```

---

### Task 6: End-to-end verification (real browser)

**Files:** none (verification only)

- [ ] **Step 1: Start both servers**

Run `start_app.bat` from the repo root (or `npm run dev` in `backend/` and `frontend/` separately). Frontend on `http://localhost:3000`, backend on `:3001`.

- [ ] **Step 2: Happy path — location granted**

Open `http://localhost:3000/<any-team-slug>/form` (e.g. `psl-karting`), fill the form to step 5, **grant** the location prompt. Expected: the Conditions card shows a spinner then real values (e.g. `24.3 °C · 62% · 1013 hPa`). Submit. Verify in Prisma Studio (`npm run prisma:studio` from `backend/`) that the new submission row has `weatherTempC`, `weatherPressureHpa`, `weatherHumidityPct` populated.

- [ ] **Step 3: Denied path**

In a fresh browser context (or after resetting site permissions), reach step 5 and **deny** location. Expected: card shows "Conditions unavailable", submission succeeds, weather columns are null.

- [ ] **Step 4: Offline weather API path**

With DevTools → Network, block requests to `api.open-meteo.com`, reach step 5 with location granted. Expected: "Conditions unavailable", submission still succeeds.

- [ ] **Step 5: Manager surfaces**

Log in as a manager, open the new submission's detail view — Conditions entry appears in General Information. Download the PDF — Conditions row appears in General Information. Check the manager notification email (dev recipient) — Conditions line appears. Open an **old** submission — no Conditions entry anywhere, no errors.

- [ ] **Step 6: iPhone test**

Per `Plans/testing-on-iphone.md`, test the location permission prompt and the Conditions card on iPhone Safari (geolocation requires HTTPS or the documented dev tunnel). Grant and deny once each.

---

## Self-review (spec coverage)

- 3 nullable columns, no coordinates stored → Task 1 ✓
- `fetchCurrentWeather` with `surface_pressure`, coarse coords, null-on-any-failure → Task 3 ✓
- Capture on final step, both entry paths, read-only 3-state card, 4-language labels → Task 4 ✓
- Backend range validation (−30…55 / 800…1100 / 0…100), drop-to-null, POST + PUT → Task 2 ✓
- Detail view + PDF + email, omitted when null; dashboard list untouched → Task 5 ✓
- Verification incl. deny/offline paths and iPhone → Task 6 ✓
