# Weather capture on submissions — design

**Date:** 2026-06-10
**Status:** Approved

## Goal

Record the ambient weather — temperature, surface pressure, humidity — on every setup
submission, automatically, via browser geolocation + a weather API. These three variables
drive tyre pressure and carburation decisions, so managers need them stored alongside each
setup.

## Decisions made

| Decision | Choice |
|---|---|
| Capture UX | Visible to the driver, auto-filled, **read-only** (no manual editing) |
| Location denied / unavailable | Skip weather, submit normally (fields stay null) |
| Units | Metric everywhere: °C, hPa, % |
| Architecture | **Approach A** — frontend fetches Open-Meteo directly, values submitted with the form, backend validates and stores |
| Weather provider | Open-Meteo (`api.open-meteo.com/v1/forecast`), free, no API key, CORS-enabled |
| Pressure variable | `surface_pressure` (station-level at track elevation), **not** sea-level corrected — carburation cares about actual air density |
| GPS coordinates | **Not stored** — privacy surface with no current use |
| Per-team toggle | None in v1 — always on for all teams (passive, read-only) |

### Approaches considered and rejected

- **B — backend fetches at submit time:** conflicts with the read-only display requirement
  (driver must see the values before submitting, so a display fetch is needed anyway and the
  re-fetched stored value could differ from what was shown); adds third-party latency to the
  submission path; stores driver GPS coordinates server-side.
- **C — backend proxy endpoint (`GET /api/weather`):** same UX as A but adds an endpoint and
  service for no current benefit. Revisit if the provider ever needs an API key or caching.

## Data model

Three new optional columns on `Submission` (Prisma migration `add_weather_to_submissions`):

| Column | Type | Meaning |
|---|---|---|
| `weatherTempC` | `Float?` | Air temperature, °C |
| `weatherPressureHpa` | `Float?` | Surface pressure at track elevation, hPa |
| `weatherHumidityPct` | `Float?` | Relative humidity, % |

Dedicated columns (not `customData`) because these are quantitative, cross-team values that
will be filtered/correlated later. No `fetchedAt` column: the fetch happens on the final form
step seconds-to-minutes before submit, so `createdAt` already dates the sample.

## Frontend

New helper `frontend/lib/weather.ts`:

- `fetchCurrentWeather(): Promise<WeatherData | null>` where
  `WeatherData = { tempC: number; pressureHpa: number; humidityPct: number }`.
- Wraps `navigator.geolocation.getCurrentPosition` with `timeout: 10000` and
  `maximumAge: 600000` (a 10-minute-old cached fix is fine — weather needs city-block
  accuracy, not GPS precision). `enableHighAccuracy: false`.
- Calls
  `https://api.open-meteo.com/v1/forecast?latitude=…&longitude=…&current=temperature_2m,relative_humidity_2m,surface_pressure`.
- Returns `null` on any failure: permission denied, timeout, offline, non-OK response,
  malformed body. Never throws.

Form integration (`app/[teamSlug]/form/page.tsx`):

- Fetch fires once when the driver reaches the **final step**. Both paths land there (the
  full form and the "setup unchanged" skip), so every submission gets a capture attempt.
- A read-only **"Track conditions"** card with three states:
  1. loading (spinner),
  2. values — e.g. `24.3 °C · 1013 hPa · 62 %`,
  3. "Conditions unavailable" — non-blocking, the form submits fine without it.
- Captured values are held in component state and included in the `createSubmission` POST
  body (`Submission` type in `lib/api.ts` gains the three optional fields).
- New translation keys in `lib/translations.ts`, all four languages (en/es/pt/it):
  "Track conditions", "Temperature", "Humidity", "Air pressure", "Conditions unavailable".

Platform notes: geolocation requires HTTPS (Netlify is HTTPS; `localhost` is exempt for
dev). iPhone Safari permission flow must be tested per `Plans/testing-on-iphone.md`.

## Backend

`POST /api/submissions` (`routes/submissions.ts`):

- Accepts the three optional numeric fields.
- Range-validates: temp −30…55 °C, pressure 800…1100 hPa, humidity 0…100 %.
- Out-of-range or non-numeric values are **dropped to null**, not rejected — weather is
  auxiliary and must never block a race-day submission.
- The fields pass through `GET` list/detail responses and the edit `PUT` unchanged
  (read-only everywhere, including the manager edit page).

## Display surfaces

One "Conditions" line, omitted when null, on each surface that shows submission detail:

- Dashboard **detail view** (`manager/dashboard/page.tsx`)
- **PDF** (`services/pdfService.ts`)
- **Manager notification email** (`services/emailService.ts`)

The dashboard *list* is intentionally untouched.

## Error handling

Every failure path degrades to "no weather on this submission": permission denied,
geolocation timeout, airplane mode, Open-Meteo outage, malformed response. Old submissions
have null fields; display surfaces omit the line.

## Open point (non-blocking)

Open-Meteo's free tier is licensed for non-commercial use (10k calls/day). If this app is
considered commercial, either pay Open-Meteo (~€29/mo) or switch to OpenWeatherMap's free
tier (1k calls/day, API key required — would motivate moving to Approach C's proxy). Code
shape is identical; swap is localized to `lib/weather.ts`.

## Verification

No test suite in this repo. Verification =

1. `npm run build` passes in both `frontend/` and `backend/`.
2. Real-browser test: grant location → values appear and land in the DB; deny → card shows
   unavailable, submission succeeds with nulls; airplane mode → same.
3. iPhone Safari test of the permission flow.
4. Conditions line renders in dashboard detail, PDF, and manager email; absent for old
   submissions.
