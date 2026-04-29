# Form Fields & Settings Toggles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5 new FrontBar enum values, allow free-text in camber/caster, and add Settings toggles for Tyre Age unit (Sessions/Laps) and Tyre Pressure mode (Lowest / All 4 Tyres).

**Architecture:** FrontBar expansion requires one Prisma migration (additive enum change) and a matching frontend enum update. The two Settings toggles are stored in `Team.formConfig` JSON (no migration). Tyre pressure 4-corner values are stored in `Submission.customData` JSON; the lowest value is always written to `tyreColdPressure` for backward compatibility. Tyre age mode is written to `customData` at submission time so the dashboard can show the correct unit.

**Tech Stack:** Prisma (PostgreSQL), Node/Express backend, Next.js 14 frontend (TypeScript, Tailwind CSS)

---

## File Map

| File | Change |
|---|---|
| `backend/prisma/schema.prisma` | Add 5 values to `FrontBar` enum |
| `backend/src/routes/teams.ts` | Pass new `formConfig` keys through (no new route needed — existing PUT handler already merges JSON) |
| `frontend/types/submission.ts` | Add 5 values to `FrontBar` enum |
| `frontend/types/team.ts` | Add `tyreAgeMode` and `tyrePressureMode` to `FormConfig` |
| `frontend/app/[teamSlug]/form/page.tsx` | Free-text camber/caster; tyre age label from config; 4-tyre pressure sub-fields; customData on submit |
| `frontend/app/[teamSlug]/manager/settings/page.tsx` | Two new toggle sections in the settings form |
| `frontend/app/[teamSlug]/manager/submission/[id]/page.tsx` | Display tyre age unit and 4-tyre pressure grid from `customData` |

---

## Task 1: Prisma Migration — Extend FrontBar Enum

**Files:**
- Modify: `backend/prisma/schema.prisma:73-78`

- [ ] **Step 1: Update the enum in schema.prisma**

Replace the existing `FrontBar` enum block:

```prisma
enum FrontBar {
  Nylon
  Standard
  Black
  None
  Flat
  Vertical
  Gold
  Chrome
  Gray
}
```

- [ ] **Step 2: Run the migration**

```bash
cd backend
npx prisma migrate dev --name add_frontbar_values
```

Expected output: `✔  Your database is now in sync with your schema.` No data loss — this only adds new enum values.

- [ ] **Step 3: Verify**

```bash
npx prisma studio
```

Open the `Submission` table, click any row with a `frontBar` value — existing values should be unchanged. Close Prisma Studio.

- [ ] **Step 4: Commit**

```bash
cd ..
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat: extend FrontBar enum with Flat, Vertical, Gold, Chrome, Gray"
```

---

## Task 2: Frontend Enum — FrontBar

**Files:**
- Modify: `frontend/types/submission.ts:59-64`

- [ ] **Step 1: Update the FrontBar enum**

Replace the current `FrontBar` enum:

```typescript
export enum FrontBar {
  Nylon = 'Nylon',
  Standard = 'Standard',
  Black = 'Black',
  None = 'None',
  Flat = 'Flat',
  Vertical = 'Vertical',
  Gold = 'Gold',
  Chrome = 'Chrome',
  Gray = 'Gray',
}
```

- [ ] **Step 2: Verify the form dropdown picks up new values**

The form at `frontend/app/[teamSlug]/form/page.tsx` renders `Object.values(FrontBar).map(...)` — no further change needed there. Run `npm run build` from `frontend/` to confirm no type errors.

```bash
cd frontend && npm run build 2>&1 | tail -20
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/types/submission.ts
git commit -m "feat: add Flat, Vertical, Gold, Chrome, Gray to FrontBar enum"
```

---

## Task 3: Free-text Camber & Caster

**Files:**
- Modify: `frontend/app/[teamSlug]/form/page.tsx:1263-1296`

- [ ] **Step 1: Update the caster input**

Find this block (around line 1269):

```tsx
<input
  type="text"
  inputMode="decimal"
  value={formData.caster}
  onChange={(e) => handleNumberChange('caster', e.target.value)}
  required
  className={inputClass}
  placeholder="e.g., 28"
/>
```

Replace with:

```tsx
<input
  type="text"
  value={formData.caster || ''}
  onChange={(e) => setFormData(prev => ({ ...prev, caster: e.target.value }))}
  required
  className={inputClass}
  placeholder="e.g., +2mm, half, full caster"
/>
```

- [ ] **Step 2: Update the camber input**

Find this block (around line 1286):

```tsx
<input
  type="text"
  inputMode="decimal"
  value={formData.camber || ''}
  onChange={(e) => handleNumberChange('camber', e.target.value)}
  required
  className={inputClass}
  placeholder="e.g., -4"
/>
```

Replace with:

```tsx
<input
  type="text"
  value={formData.camber || ''}
  onChange={(e) => setFormData(prev => ({ ...prev, camber: e.target.value }))}
  required
  className={inputClass}
  placeholder="e.g., -2mm, +4mm, full"
/>
```

- [ ] **Step 3: Manual test**

Start the dev server (`npm run dev` in `frontend/`). Open the form, navigate to Kart Setup step. Verify you can type `half caster`, `-2mm`, `full` in those two fields without characters being stripped. Verify other number fields (e.g., seat position) still only accept numbers.

- [ ] **Step 4: Commit**

```bash
git add "frontend/app/[teamSlug]/form/page.tsx"
git commit -m "feat: allow free-text input for camber and caster fields"
```

---

## Task 4: Extend FormConfig Type

**Files:**
- Modify: `frontend/types/team.ts:3-6`

- [ ] **Step 1: Add new fields to FormConfig interface**

Replace the current `FormConfig` interface:

```typescript
export interface FormConfig {
    enabledFields: string[];
    requiredFields: string[];
    tyreAgeMode?: 'sessions' | 'laps';
    tyrePressureMode?: 'lowest' | 'four';
}
```

- [ ] **Step 2: Verify no type errors**

```bash
cd frontend && npm run build 2>&1 | tail -20
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/types/team.ts
git commit -m "feat: add tyreAgeMode and tyrePressureMode to FormConfig type"
```

---

## Task 5: Settings Page — Tyre Age Toggle

**Files:**
- Modify: `frontend/app/[teamSlug]/manager/settings/page.tsx`

- [ ] **Step 1: Add state variable**

In the state declarations section (after the existing `useState` calls, around line 44), add:

```typescript
const [tyreAgeMode, setTyreAgeMode] = useState<'sessions' | 'laps'>('sessions');
```

- [ ] **Step 2: Load tyreAgeMode from config**

In `loadConfig()` (around line 216), after the `setSuperuserExpiresAt` call, add:

```typescript
if (teamConfig.formConfig?.tyreAgeMode) {
    setTyreAgeMode(teamConfig.formConfig.tyreAgeMode);
}
```

- [ ] **Step 3: Save tyreAgeMode in handleSave**

In `handleSave` (around line 257), update `updatedFormConfig`:

```typescript
const updatedFormConfig = {
    ...config.formConfig,
    enabledFields,
    tyreAgeMode,
};
```

- [ ] **Step 4: Add the toggle UI**

Inside the `<form onSubmit={handleSave}>` block, right after the closing `</div>` of the last `fieldGroups.map(...)` block and before the Save button `<div className="pt-6 border-t ...">`, add a new section:

```tsx
{/* Tyre Age Unit */}
<div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
    <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-1">Tyre Age Unit</h3>
    <p className="text-gray-400 text-sm mb-4">
        Choose whether tyre age is tracked in sessions or laps. This changes the label drivers see on the form.
    </p>
    <div className="flex bg-gray-900/50 p-1 rounded-xl border border-gray-700 w-fit gap-1">
        {(['sessions', 'laps'] as const).map((mode) => (
            <button
                key={mode}
                type="button"
                onClick={() => setTyreAgeMode(mode)}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all capitalize ${tyreAgeMode === mode ? 'text-white shadow-lg' : 'text-gray-400 hover:text-gray-300'}`}
                style={tyreAgeMode === mode ? { backgroundColor: primaryColor } : {}}
            >
                {mode === 'sessions' ? 'Sessions' : 'Laps'}
            </button>
        ))}
    </div>
</div>
```

- [ ] **Step 5: Manual test**

Open Settings page in the browser. Verify the "Tyre Age Unit" section appears. Toggle between Sessions and Laps. Click Save Configuration. Reload the page — verify the toggle is still on the last selection you made.

- [ ] **Step 6: Commit**

```bash
git add "frontend/app/[teamSlug]/manager/settings/page.tsx"
git commit -m "feat: add Tyre Age Unit toggle (sessions/laps) to Settings"
```

---

## Task 6: Settings Page — Tyre Pressure Mode Toggle

**Files:**
- Modify: `frontend/app/[teamSlug]/manager/settings/page.tsx`

- [ ] **Step 1: Add state variable**

Below the `tyreAgeMode` state line added in Task 5, add:

```typescript
const [tyrePressureMode, setTyrePressureMode] = useState<'lowest' | 'four'>('lowest');
```

- [ ] **Step 2: Load tyrePressureMode from config**

In `loadConfig()`, after the `setTyreAgeMode` call added in Task 5, add:

```typescript
if (teamConfig.formConfig?.tyrePressureMode) {
    setTyrePressureMode(teamConfig.formConfig.tyrePressureMode);
}
```

- [ ] **Step 3: Save tyrePressureMode in handleSave**

Update `updatedFormConfig` in `handleSave` to also include `tyrePressureMode`:

```typescript
const updatedFormConfig = {
    ...config.formConfig,
    enabledFields,
    tyreAgeMode,
    tyrePressureMode,
};
```

- [ ] **Step 4: Add the toggle UI**

Immediately after the closing `</div>` of the "Tyre Age Unit" section added in Task 5 (and still before the Save button), add:

```tsx
{/* Tyre Pressure Mode */}
<div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
    <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-1">Tyre Pressure Mode</h3>
    <p className="text-gray-400 text-sm mb-4">
        "Lowest pressure" shows a single input. "All 4 tyres" shows separate RF, LF, RR, LR fields — the lowest value is saved as the summary pressure.
    </p>
    <div className="flex bg-gray-900/50 p-1 rounded-xl border border-gray-700 w-fit gap-1">
        {([
            { key: 'lowest', label: 'Lowest pressure' },
            { key: 'four', label: 'All 4 tyres' },
        ] as const).map(({ key, label }) => (
            <button
                key={key}
                type="button"
                onClick={() => setTyrePressureMode(key)}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${tyrePressureMode === key ? 'text-white shadow-lg' : 'text-gray-400 hover:text-gray-300'}`}
                style={tyrePressureMode === key ? { backgroundColor: primaryColor } : {}}
            >
                {label}
            </button>
        ))}
    </div>
</div>
```

- [ ] **Step 5: Manual test**

Open Settings. Verify both toggles appear. Switch Tyre Pressure Mode to "All 4 tyres", save, reload — verify it persists.

- [ ] **Step 6: Commit**

```bash
git add "frontend/app/[teamSlug]/manager/settings/page.tsx"
git commit -m "feat: add Tyre Pressure Mode toggle (lowest/four) to Settings"
```

---

## Task 7: Form Page — Tyre Age Label from Config

**Files:**
- Modify: `frontend/app/[teamSlug]/form/page.tsx`

- [ ] **Step 1: Derive tyreAgeMode from teamConfig**

In the form page, after the `TYRE_MODELS` line (around line 202), add:

```typescript
const tyreAgeMode = (teamConfig?.formConfig as any)?.tyreAgeMode ?? 'sessions';
const tyrePressureMode = (teamConfig?.formConfig as any)?.tyrePressureMode ?? 'lowest';
```

- [ ] **Step 2: Update the Tyre Age label and placeholder**

Find the tyre age input block (around line 969):

```tsx
<label className={labelClass}>{getLabel('tyreAge')} *</label>
<input
  type="text"
  inputMode="decimal"
  value={formData.tyreAge}
  onChange={(e) => handleNumberChange('tyreAge', e.target.value)}
  required
  className={inputClass}
  placeholder="e.g., 2"
/>
```

Replace with:

```tsx
<label className={labelClass}>
  {getLabel('tyreAge')} ({tyreAgeMode === 'sessions' ? 'Sessions' : 'Laps'}) *
</label>
<input
  type="text"
  inputMode="decimal"
  value={formData.tyreAge}
  onChange={(e) => handleNumberChange('tyreAge', e.target.value)}
  required
  className={inputClass}
  placeholder={tyreAgeMode === 'sessions' ? 'e.g., 2 sessions' : 'e.g., 42 laps'}
/>
```

Note: There is a second occurrence of the tyreAge input around line 1401 (in a different step/layout). Apply the same label and placeholder change there too.

- [ ] **Step 3: Manual test**

With Tyre Age Unit set to "Laps" in Settings, open the driver form. Verify the tyre age field shows "Tyre Age (Laps)" and placeholder "e.g., 42 laps". Switch Settings back to "Sessions" and verify the label resets.

- [ ] **Step 4: Commit**

```bash
git add "frontend/app/[teamSlug]/form/page.tsx"
git commit -m "feat: tyre age field label and placeholder reflect sessions/laps setting"
```

---

## Task 8: Form Page — 4-Tyre Pressure Fields & Submission Logic

**Files:**
- Modify: `frontend/app/[teamSlug]/form/page.tsx`

- [ ] **Step 1: Add state for 4-corner pressures**

In the state declarations section (around line 106), add:

```typescript
const [pressureRF, setPressureRF] = useState('');
const [pressureLF, setPressureLF] = useState('');
const [pressureRR, setPressureRR] = useState('');
const [pressureLR, setPressureLR] = useState('');
```

- [ ] **Step 2: Replace the tyre pressure input block (first occurrence, around line 980)**

Find:

```tsx
<div>
  <label className={labelClass}>{getLabel('tyreColdPressure')} *</label>
  <input
    type="text"
    inputMode="decimal"
    value={formData.tyreColdPressure}
    onChange={(e) => handleNumberChange('tyreColdPressure', e.target.value)}
    required
    className={inputClass}
    placeholder="e.g., 9.5"
  />
</div>
```

Replace with:

```tsx
<div className={tyrePressureMode === 'four' ? 'md:col-span-2' : ''}>
  <label className={labelClass}>{getLabel('tyreColdPressure')} *</label>
  {tyrePressureMode === 'lowest' ? (
    <input
      type="text"
      inputMode="decimal"
      value={formData.tyreColdPressure}
      onChange={(e) => handleNumberChange('tyreColdPressure', e.target.value)}
      required
      className={inputClass}
      placeholder="e.g., 9.5"
    />
  ) : (
    <div className="grid grid-cols-2 gap-3 mt-1">
      {([
        { label: 'RF', value: pressureRF, set: setPressureRF },
        { label: 'LF', value: pressureLF, set: setPressureLF },
        { label: 'RR', value: pressureRR, set: setPressureRR },
        { label: 'LR', value: pressureLR, set: setPressureLR },
      ] as const).map(({ label, value, set }) => (
        <div key={label}>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => {
              const clean = e.target.value.replace(/[^0-9.]/g, '').replace(/(\.\d*)\./g, '$1');
              set(clean);
            }}
            required
            className={inputClass}
            placeholder="e.g., 9.5"
          />
        </div>
      ))}
    </div>
  )}
</div>
```

- [ ] **Step 3: If there is a second occurrence of the tyreColdPressure input (around line 1386), apply the same replacement.**

Check the block around line 1386:

```tsx
<label className={labelClass}>{getLabel('tyreColdPressure')} *</label>
<input
  type="text"
  inputMode="decimal"
  value={formData.tyreColdPressure || ''}
  onChange={(e) => handleNumberChange('tyreColdPressure', e.target.value)}
```

Apply the same conditional rendering pattern as Step 2.

- [ ] **Step 4: Update handleSubmit to set customData and compute lowest pressure**

In `handleSubmit` (around line 346), replace:

```typescript
const submissionData = { ...formData };
```

With:

```typescript
const submissionData: any = { ...formData };

// Record tyreAgeMode in customData
const customData: Record<string, any> = { ...(submissionData.customData || {}) };
customData.tyreAgeMode = tyreAgeMode;

// Handle 4-tyre pressure mode
if (tyrePressureMode === 'four') {
  const pressures = [pressureRF, pressureLF, pressureRR, pressureLR]
    .map(Number)
    .filter(n => !isNaN(n) && n > 0);
  submissionData.tyreColdPressure = pressures.length > 0
    ? String(Math.min(...pressures))
    : '';
  customData.tyrePressureMode = 'four';
  customData.tyrePressureRF = pressureRF;
  customData.tyrePressureLF = pressureLF;
  customData.tyrePressureRR = pressureRR;
  customData.tyrePressureLR = pressureLR;
}

submissionData.customData = customData;
```

- [ ] **Step 5: Manual test — lowest mode**

With Tyre Pressure Mode = "Lowest pressure" in Settings: open the form, fill tyre data with `9.5`, submit. Check the submission detail page shows `9.5`.

- [ ] **Step 6: Manual test — four mode**

Switch Tyre Pressure Mode to "All 4 tyres" in Settings. Open the form, fill RF=9.5, LF=9.4, RR=9.6, LR=9.5. Submit. Check the submission detail page — tyre pressure section should show the 4-corner grid. Check the database (via Prisma Studio or backend logs) that `tyreColdPressure = "9.4"` (lowest) and `customData` contains all 4 values.

- [ ] **Step 7: Commit**

```bash
git add "frontend/app/[teamSlug]/form/page.tsx"
git commit -m "feat: 4-tyre pressure inputs and customData recording for tyre age mode"
```

---

## Task 9: Submission Detail Page — Display Tyre Age Unit and 4-Tyre Pressure

**Files:**
- Modify: `frontend/app/[teamSlug]/manager/submission/[id]/page.tsx:256-263`

- [ ] **Step 1: Update the tyreAge display**

Find:

```tsx
<div>
  <p className={labelClass}>{t.tyreAge}</p>
  <p className={valueClass}>{submission.tyreAge}</p>
</div>
```

Replace with:

```tsx
<div>
  <p className={labelClass}>
    {t.tyreAge}
    {submission.customData?.tyreAgeMode
      ? ` (${submission.customData.tyreAgeMode === 'sessions' ? 'Sessions' : 'Laps'})`
      : ''}
  </p>
  <p className={valueClass}>{submission.tyreAge}</p>
</div>
```

- [ ] **Step 2: Update the tyreColdPressure display**

Find:

```tsx
<div>
  <p className={labelClass}>{t.tyreColdPressure}</p>
  <p className={valueClass}>{submission.tyreColdPressure}</p>
</div>
```

Replace with:

```tsx
<div>
  <p className={labelClass}>{t.tyreColdPressure}</p>
  {submission.customData?.tyrePressureMode === 'four' ? (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
      {(['RF', 'LF', 'RR', 'LR'] as const).map((corner) => (
        <div key={corner} className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase w-6">{corner}</span>
          <span className={valueClass}>
            {submission.customData?.[`tyrePressure${corner}`] || '—'}
          </span>
        </div>
      ))}
    </div>
  ) : (
    <p className={valueClass}>{submission.tyreColdPressure}</p>
  )}
</div>
```

- [ ] **Step 3: Manual test**

Open a submission made in 4-tyre mode in the dashboard. Verify the tyre pressure section shows a 2×2 grid with RF/LF/RR/LR labels and values. Open an old submission — verify it still shows the single value as before.

- [ ] **Step 4: Commit**

```bash
git add "frontend/app/[teamSlug]/manager/submission/[id]/page.tsx"
git commit -m "feat: show tyre age unit and 4-tyre pressure grid in submission detail"
```

---

## Self-Review Checklist

- [x] FrontBar enum: 5 new values in Prisma schema + frontend enum — Tasks 1 & 2
- [x] Camber/caster free-text: `inputMode` removed, `handleNumberChange` bypassed — Task 3
- [x] `FormConfig` type extended with `tyreAgeMode` and `tyrePressureMode` — Task 4
- [x] Settings: Tyre Age toggle saves to `formConfig.tyreAgeMode` — Task 5
- [x] Settings: Tyre Pressure toggle saves to `formConfig.tyrePressureMode` — Task 6
- [x] Form: tyre age label/placeholder reflects config — Task 7
- [x] Form: 4-tyre pressure sub-fields shown in four mode — Task 8
- [x] Form: `customData.tyreAgeMode` written on every submit — Task 8
- [x] Form: `tyreColdPressure` = lowest of 4 in four mode — Task 8
- [x] Submission detail: tyre age shows unit suffix from `customData` — Task 9
- [x] Submission detail: 4-tyre grid shown when `customData.tyrePressureMode === 'four'` — Task 9
- [x] Backward compatibility: old submissions (no `customData` keys) fall through to existing single-value display — Task 9
