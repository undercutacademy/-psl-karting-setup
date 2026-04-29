---
title: Form Fields & Settings Toggles
date: 2026-04-29
status: approved
---

# Form Fields & Settings Toggles

## Scope

Four targeted improvements to the submission form and the manager Settings tab:

1. **Front Bar** — 5 new enum values added to the existing `FrontBar` Prisma enum.
2. **Camber & Caster** — free-text input (letters and symbols allowed).
3. **Tyre Age** — Settings toggle: Sessions vs Laps.
4. **Tyre Pressure** — Settings toggle: Lowest pressure vs All 4 tyres.

---

## 1. Front Bar — New Enum Values

### Database

Add 5 new values to the `FrontBar` enum in `backend/prisma/schema.prisma`:

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

Run `npx prisma migrate dev --name add_frontbar_values`. This is additive — existing rows are unaffected.

### Frontend

- Add the 5 new entries to the `FrontBar` enum in `frontend/types/submission.ts`.
- The dropdown in `frontend/app/[teamSlug]/form/page.tsx` already renders from `Object.values(FrontBar)` — no further changes needed there.

---

## 2. Camber & Caster — Free-text Input

### Database

No change. Both `caster` and `camber` are already `String?` in the `Submission` model.

### Frontend

The `handleNumberChange` function in `frontend/app/[teamSlug]/form/page.tsx` currently strips all non-numeric characters (except a single dot). This behavior must be bypassed for `caster` and `camber`.

**Change:** For these two fields, use a plain `onChange` that writes the raw value directly to `formData` — no sanitization. All other fields that call `handleNumberChange` remain unchanged.

Update placeholders:
- Caster: `e.g., +2mm, half, full caster`
- Camber: `e.g., -2mm, +4mm, full`

---

## 3. Tyre Age — Sessions/Laps Toggle

### Settings page (`frontend/app/[teamSlug]/manager/settings/page.tsx`)

Add a new "Tyre Age Unit" section to the settings form. Two options rendered as a toggle/radio:
- `sessions` (default)
- `laps`

Saved to `Team.formConfig` JSON as:
```json
{ "tyreAgeMode": "sessions" | "laps" }
```

Default: `"sessions"` — no change for existing teams that have no value set.

### Form page

- Fetch `formConfig.tyreAgeMode` from the team config on load.
- Render the field label as **"Tyre Age (Sessions)"** or **"Tyre Age (Laps)"** accordingly.
- Placeholder: `e.g., 2 sessions` or `e.g., 42 laps`.
- Field input behavior unchanged (freetext, numeric, `handleNumberChange`).

### Submission storage

When submitting, write to `customData`:
```json
{ "tyreAgeMode": "sessions" | "laps" }
```

This records which unit was active at submission time.

### Dashboard display

Wherever `tyreAge` is displayed (submission detail, dash summary), check `customData.tyreAgeMode`:
- `"sessions"` → append "sessions" (e.g. `3 sessions`)
- `"laps"` → append "laps" (e.g. `42 laps`)
- Missing key (old submissions) → show raw value with no unit suffix.

---

## 4. Tyre Pressure — Lowest / All 4 Tyres Toggle

### Settings page

Add a new "Tyre Pressure Mode" section. Two options:
- `lowest` — single input, current behavior (default)
- `four` — four sub-fields: RF, LF, RR, LR

Saved to `Team.formConfig` JSON as:
```json
{ "tyrePressureMode": "lowest" | "four" }
```

Default: `"lowest"` — no change for existing teams.

### Form page — "lowest" mode

Existing single `tyreColdPressure` input. No changes.

### Form page — "four" mode

Replace the single input with four labeled inputs arranged in a 2×2 grid:

```
[ RF ]  [ LF ]
[ RR ]  [ LR ]
```

Each sub-field uses `handleNumberChange`. All four are required before the step can advance (same validation gate as the existing single field).

### Submission storage — "four" mode

- `tyreColdPressure` (required String column) = lowest of the 4 entered values. Keeps backward compatibility with all existing dashboard queries, exports, and email summaries.
- `customData` gets:
```json
{
  "tyrePressureMode": "four",
  "tyrePressureRF": "9.5",
  "tyrePressureLF": "9.4",
  "tyrePressureRR": "9.6",
  "tyrePressureLR": "9.5"
}
```

### Dashboard display

Where tyre pressure is shown (submission detail, dash summary):
- If `customData.tyrePressureMode === "four"`: render a 2×2 grid showing all four values with corner labels.
- Otherwise: render the single `tyreColdPressure` value as today.

---

## Database Migration Summary

| Change | Migration required? | Notes |
|---|---|---|
| FrontBar enum — 5 new values | Yes | Additive, safe, no data loss |
| Camber/caster free-text | No | Columns are already `String?` |
| Tyre age mode | No | Stored in `Team.formConfig` JSON |
| Tyre pressure mode | No | Stored in `Team.formConfig` JSON |
| 4-tyre pressure values | No | Stored in `Submission.customData` JSON |

---

## Out of Scope

- Changing which fields are enabled/disabled per team (existing `formConfig.enabledFields` mechanism handles this already).
- Any changes to email notification templates (tyre pressure and tyre age summaries in emails are a follow-up if needed).
- Exporting 4-tyre pressure values to CSV/PDF (follow-up).
