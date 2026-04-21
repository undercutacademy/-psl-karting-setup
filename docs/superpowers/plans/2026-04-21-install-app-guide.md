# Install App Guide — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "How to install the app" button on every team's main page that opens a full-screen modal. On iOS, it plays a short looping video tutorial. On desktop, it shows a QR code. Android and already-installed PWA users see nothing.

**Architecture:** A single client-side React component (`InstallAppButton`) rendered inside the existing server page. It detects the environment at mount (iOS / desktop / Android / standalone) and renders the appropriate button + modal. Localization reuses the existing `translations.ts` system and `localStorage.preferred_language` convention. The source `Share_Guide.MP4` (27 MB) is compressed with `ffmpeg` once during implementation into a ~2 MB `mp4` served from `public/install-guide/`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind 4, existing `TRANSLATIONS` dictionary, `qrcode` library (new dependency), `ffmpeg` (system tool, one-shot for asset prep).

**Spec:** [docs/superpowers/specs/2026-04-21-install-app-guide-design.md](../specs/2026-04-21-install-app-guide-design.md)

---

## File Structure

| File | Purpose |
|------|---------|
| `frontend/public/install-guide/ios-install.mp4` | Compressed ~2MB looping tutorial video |
| `frontend/public/install-guide/ios-install-poster.jpg` | First-frame poster image |
| `frontend/components/InstallAppButton.tsx` | Client component: button + modal + environment detection + QR rendering |
| `frontend/lib/translations.ts` | Add 10 new localization keys across en/es/pt/it |
| `frontend/app/[teamSlug]/page.tsx` | Import and render `<InstallAppButton />` inside the cards container |
| `frontend/package.json` | Add `qrcode` and `@types/qrcode` dependencies |

Single component file because the button, modal, and detection logic are tightly coupled and together are under ~300 lines. Splitting would create more import overhead than reading benefit. If the file grows past ~400 lines during implementation, extract the QR renderer into its own helper.

---

## Prerequisites

Before starting:
1. `ffmpeg` installed locally (`brew install ffmpeg` on macOS). Verify with `ffmpeg -version`.
2. Source video exists at `frontend/public/Share guide/Share_Guide.MP4` (~27 MB, already checked in as untracked).
3. Frontend dev server runnable with `cd frontend && npm run dev`.

This project has **no automated test framework** configured. Verification is manual (device simulator + real device where possible) — each task ends with an explicit verification step instead of an automated test.

---

### Task 1: Compress the source video and generate the poster

**Files:**
- Create: `frontend/public/install-guide/ios-install.mp4`
- Create: `frontend/public/install-guide/ios-install-poster.jpg`

- [ ] **Step 1: Create the target directory**

```bash
mkdir -p frontend/public/install-guide
```

- [ ] **Step 2: Compress the source video**

From the repo root:

```bash
ffmpeg -i "frontend/public/Share guide/Share_Guide.MP4" \
  -vf "scale=-2:720" -r 24 \
  -c:v libx264 -crf 30 -preset slow \
  -an -movflags +faststart \
  frontend/public/install-guide/ios-install.mp4
```

Expected: a new file at the target path, size roughly 1.5–3 MB. Check with:

```bash
ls -lh frontend/public/install-guide/ios-install.mp4
```

If the file is > 3 MB, re-run with `-crf 32`. If it's < 1 MB and the motion looks blocky, re-run with `-crf 28`.

- [ ] **Step 3: Extract the poster frame**

```bash
ffmpeg -i frontend/public/install-guide/ios-install.mp4 \
  -frames:v 1 -q:v 4 \
  frontend/public/install-guide/ios-install-poster.jpg
```

Expected: a ~30–80 KB JPG with the first frame of the video.

- [ ] **Step 4: Visually verify the compressed assets**

Open both files in Finder / preview tools. The video should still clearly show the Safari UI and hand taps. Text in the Safari chrome must be legible.

- [ ] **Step 5: Delete the heavy source files from `public/`**

They should not ship with the app.

```bash
rm -rf "frontend/public/Share guide"
```

- [ ] **Step 6: Commit**

```bash
git add frontend/public/install-guide/ios-install.mp4 \
        frontend/public/install-guide/ios-install-poster.jpg
git add -u "frontend/public/Share guide" 2>/dev/null || true
git commit -m "Add compressed iOS install guide video and poster"
```

---

### Task 2: Install the `qrcode` dependency

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`

- [ ] **Step 1: Install the package**

```bash
cd frontend && npm install qrcode && npm install -D @types/qrcode
```

- [ ] **Step 2: Verify it landed in package.json**

Open `frontend/package.json`. Under `dependencies` you should see `"qrcode": "^1.5.x"` (or similar), and under `devDependencies` you should see `"@types/qrcode": "^1.5.x"`.

- [ ] **Step 3: Commit**

```bash
cd /Users/lucasnogueira48/Documents/GitHub/-psl-karting-setup
git add frontend/package.json frontend/package-lock.json
git commit -m "Add qrcode dependency for install-app QR fallback"
```

---

### Task 3: Add localization keys for the install guide

**Files:**
- Modify: `frontend/lib/translations.ts`

The file is ~800 lines with a repeated structure: `en: { ... }, es: { ... }, pt: { ... }, it: { ... }`. Add the same 10 keys to each language block. Group them with a section comment `// Install App Guide`.

- [ ] **Step 1: Locate the four language blocks**

In an editor, search for `en: {`, `es: {`, `pt: {`, `it: {`. Each is a separate top-level key in the `TRANSLATIONS` object.

- [ ] **Step 2: Add the English block**

Inside the `en: { ... }` object, add (near the end, just before the closing `}`):

```ts
    // Install App Guide
    installAppButton: 'How to install the app',
    installModalTitle: 'Install this app',
    installModalSubtitle: 'Follow the steps to add this app to your home screen',
    installStep1: 'Tap the Share button in Safari',
    installStep2: 'Scroll and tap "Add to Home Screen"',
    installStep3: 'Tap "Add" in the top-right corner',
    installFooterNote: 'Once installed, open the app from your home screen for the best experience',
    installDesktopTitle: 'Open this page on your phone',
    installDesktopSubtitle: 'Scan with your phone camera to continue',
    installClose: 'Close',
```

- [ ] **Step 3: Add the Spanish block**

Inside `es: { ... }`:

```ts
    // Install App Guide
    installAppButton: 'Cómo instalar la app',
    installModalTitle: 'Instalar esta app',
    installModalSubtitle: 'Sigue los pasos para agregar la app a tu pantalla de inicio',
    installStep1: 'Toca el botón Share en Safari',
    installStep2: 'Desplázate y toca "Add to Home Screen"',
    installStep3: 'Toca "Add" en la esquina superior derecha',
    installFooterNote: 'Una vez instalada, abre la app desde la pantalla de inicio para una mejor experiencia',
    installDesktopTitle: 'Abre esta página en tu teléfono',
    installDesktopSubtitle: 'Escanea con la cámara de tu teléfono para continuar',
    installClose: 'Cerrar',
```

- [ ] **Step 4: Add the Portuguese block**

Inside `pt: { ... }`:

```ts
    // Install App Guide
    installAppButton: 'Como instalar o app',
    installModalTitle: 'Instalar este app',
    installModalSubtitle: 'Siga os passos para adicionar o app à sua tela inicial',
    installStep1: 'Toque no botão Share no Safari',
    installStep2: 'Role e toque em "Add to Home Screen"',
    installStep3: 'Toque em "Add" no canto superior direito',
    installFooterNote: 'Depois de instalado, abra o app pela tela inicial para a melhor experiência',
    installDesktopTitle: 'Abra esta página no seu celular',
    installDesktopSubtitle: 'Escaneie com a câmera do seu celular para continuar',
    installClose: 'Fechar',
```

- [ ] **Step 5: Add the Italian block**

Inside `it: { ... }`:

```ts
    // Install App Guide
    installAppButton: 'Come installare l\'app',
    installModalTitle: 'Installa questa app',
    installModalSubtitle: 'Segui i passaggi per aggiungere l\'app alla tua schermata Home',
    installStep1: 'Tocca il pulsante Share in Safari',
    installStep2: 'Scorri e tocca "Add to Home Screen"',
    installStep3: 'Tocca "Add" in alto a destra',
    installFooterNote: 'Una volta installata, apri l\'app dalla schermata Home per la migliore esperienza',
    installDesktopTitle: 'Apri questa pagina sul tuo telefono',
    installDesktopSubtitle: 'Scansiona con la fotocamera del tuo telefono per continuare',
    installClose: 'Chiudi',
```

- [ ] **Step 6: Type-check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no new errors. If TypeScript complains that a key is missing from one language, you missed adding it to that block.

- [ ] **Step 7: Commit**

```bash
cd /Users/lucasnogueira48/Documents/GitHub/-psl-karting-setup
git add frontend/lib/translations.ts
git commit -m "Add install-guide translations across en/es/pt/it"
```

---

### Task 4: Create the `InstallAppButton` component skeleton (button + environment detection)

**Files:**
- Create: `frontend/components/InstallAppButton.tsx`

This task creates the client component with environment detection. The modal itself comes in Task 5–6. The button will be visible but won't open anything yet — that's expected at the end of this task.

- [ ] **Step 1: Create the component file**

Create `frontend/components/InstallAppButton.tsx` with:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { TRANSLATIONS, Language } from '@/lib/translations';

type Mode = 'ios' | 'desktop' | null;

type Props = {
  teamName: string;
  logoUrl: string;
  primaryColor: string;
};

function detectMode(): Mode {
  if (typeof window === 'undefined') return null;

  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes('Mac') && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  if (isStandalone) return null;
  if (isIOS) return 'ios';
  if (isAndroid) return null;
  return 'desktop';
}

export default function InstallAppButton({
  teamName,
  logoUrl,
  primaryColor,
}: Props) {
  const [mode, setMode] = useState<Mode>(null);
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    setMode(detectMode());
    const saved = localStorage.getItem('preferred_language') as Language | null;
    if (saved && ['en', 'es', 'pt', 'it'].includes(saved)) {
      setLang(saved);
    }
  }, []);

  if (!mode) return null;

  const t = TRANSLATIONS[lang];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 w-full rounded-xl border border-gray-700/60 bg-gray-800/40 px-4 py-3 text-sm font-semibold text-gray-300 uppercase tracking-wider transition-all hover:border-gray-500 hover:bg-gray-700/60 hover:text-white flex items-center justify-center gap-2"
      >
        <span>📱</span>
        <span>{t.installAppButton}</span>
      </button>
      {/* Modal comes in Task 5 */}
    </>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors. The `primaryColor`, `logoUrl`, `teamName`, and `open` may appear unused — that's fine, they'll be wired up in Task 5.

If TypeScript complains about unused vars and the project has strict `noUnusedLocals`, prefix them with `_` temporarily (`_logoUrl`, etc.) — we'll use them in the next task. Check `tsconfig.json` before resorting to that.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/InstallAppButton.tsx
git commit -m "Scaffold InstallAppButton component with environment detection"
```

---

### Task 5: Render the button on the team home page and verify visibility

**Files:**
- Modify: `frontend/app/[teamSlug]/page.tsx`

- [ ] **Step 1: Import the component**

Open `frontend/app/[teamSlug]/page.tsx` and add to the imports at the top:

```tsx
import InstallAppButton from '@/components/InstallAppButton';
```

- [ ] **Step 2: Render the button inside the cards container**

Find the `<div className="grid gap-6 md:grid-cols-2">...</div>` block (lines ~67–107 in the current file). Immediately after that closing `</div>`, but still inside the `rounded-2xl bg-gray-900/80` card, add:

```tsx
          <InstallAppButton
            teamName={teamName}
            logoUrl={logoUrl}
            primaryColor={primaryColor}
          />
```

The result should look like:

```tsx
        <div className="rounded-2xl bg-gray-900/80 border border-gray-800 p-8 shadow-2xl backdrop-blur-xl">
          <div className="grid gap-6 md:grid-cols-2">
            {/* ...existing Link cards... */}
          </div>
          <InstallAppButton
            teamName={teamName}
            logoUrl={logoUrl}
            primaryColor={primaryColor}
          />
        </div>
```

- [ ] **Step 3: Run the dev server and manually verify**

```bash
cd frontend && npm run dev
```

Open `http://localhost:3000/demo` (or any seeded team slug) in three contexts:

1. **Desktop Chrome (normal window):** The button appears below the two main cards with the text "How to install the app".
2. **Chrome DevTools → Device Toolbar → iPhone preset:** The button still appears (iOS is detected via UA string).
3. **Chrome DevTools → Device Toolbar → Pixel preset:** The button is **hidden** (Android → null).

- [ ] **Step 4: Verify standalone hides the button**

Temporarily append `?pwa=1` to the URL and modify `detectMode` to return `null` when that param is present (just a test — revert after). Or: install the app on iPhone (Share → Add to Home Screen) and launch from home screen — button should be absent. Pick whichever is easier.

Revert any temporary test code before committing.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/[teamSlug]/page.tsx
git commit -m "Render InstallAppButton on team home page"
```

---

### Task 6: Implement the iOS modal (video + steps)

**Files:**
- Modify: `frontend/components/InstallAppButton.tsx`

- [ ] **Step 1: Replace the component body with the full iOS modal**

Replace the return statement (everything after `const t = TRANSLATIONS[lang];`) with:

```tsx
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 w-full rounded-xl border border-gray-700/60 bg-gray-800/40 px-4 py-3 text-sm font-semibold text-gray-300 uppercase tracking-wider transition-all hover:border-gray-500 hover:bg-gray-700/60 hover:text-white flex items-center justify-center gap-2"
      >
        <span>📱</span>
        <span>{t.installAppButton}</span>
      </button>

      {open && (
        <InstallModal
          mode={mode}
          t={t}
          teamName={teamName}
          logoUrl={logoUrl}
          primaryColor={primaryColor}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Add the modal component below the export default function**

At the bottom of `frontend/components/InstallAppButton.tsx`:

```tsx
type ModalProps = {
  mode: Exclude<Mode, null>;
  t: (typeof TRANSLATIONS)[Language];
  teamName: string;
  logoUrl: string;
  primaryColor: string;
  onClose: () => void;
};

function InstallModal({
  mode,
  t,
  teamName,
  logoUrl,
  primaryColor,
  onClose,
}: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top racing stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: `linear-gradient(to right, ${primaryColor}, white, ${primaryColor})`,
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt={teamName}
              className="h-8 w-auto object-contain flex-shrink-0"
            />
            <h2
              id="install-modal-title"
              className="text-white font-bold uppercase tracking-wider text-sm truncate"
            >
              {t.installModalTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.installClose}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {mode === 'ios' ? (
            <IOSBody t={t} primaryColor={primaryColor} />
          ) : (
            <DesktopBody t={t} />
          )}
        </div>
      </div>
    </div>
  );
}

function IOSBody({
  t,
  primaryColor,
}: {
  t: (typeof TRANSLATIONS)[Language];
  primaryColor: string;
}) {
  return (
    <>
      <p className="text-gray-400 text-sm text-center mb-4">
        {t.installModalSubtitle}
      </p>

      <div className="mx-auto max-w-[280px] mb-5">
        <div className="rounded-[2rem] border-4 border-gray-800 overflow-hidden bg-black shadow-inner">
          <video
            src="/install-guide/ios-install.mp4"
            poster="/install-guide/ios-install-poster.jpg"
            muted
            autoPlay
            loop
            playsInline
            preload="metadata"
            aria-label={t.installModalSubtitle}
            className="w-full h-auto block"
          />
        </div>
      </div>

      <ol className="space-y-2 text-sm mb-4">
        {[t.installStep1, t.installStep2, t.installStep3].map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className="flex-shrink-0 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              {i + 1}
            </span>
            <span className="text-gray-200 pt-0.5">{step}</span>
          </li>
        ))}
      </ol>

      <p className="text-gray-500 text-xs text-center border-t border-gray-800 pt-3">
        {t.installFooterNote}
      </p>
    </>
  );
}

function DesktopBody({ t }: { t: (typeof TRANSLATIONS)[Language] }) {
  // Implemented in Task 7
  return null;
}
```

- [ ] **Step 3: Type-check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Manually verify the iOS modal**

```bash
cd frontend && npm run dev
```

1. Open `http://localhost:3000/demo` in Chrome DevTools → iPhone viewport.
2. Click "How to install the app" — modal should appear.
3. Video should autoplay muted and loop.
4. Three numbered steps should show below the video with the team's primary color badge.
5. Click outside the modal — it should close.
6. Reopen, press `Esc` — it should close.
7. Reopen, click the X — it should close.
8. Reopen, scroll the page — body should be locked (no scroll behind the modal).

- [ ] **Step 5: Commit**

```bash
git add frontend/components/InstallAppButton.tsx
git commit -m "Implement iOS install-guide modal with video and step list"
```

---

### Task 7: Implement the desktop QR modal body

**Files:**
- Modify: `frontend/components/InstallAppButton.tsx`

- [ ] **Step 1: Replace the `DesktopBody` stub with the real implementation**

Near the top of `frontend/components/InstallAppButton.tsx`, add to the imports:

```tsx
import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
```

(Merge `useRef` into the existing `useEffect, useState` import.)

Then replace the `DesktopBody` stub at the bottom with:

```tsx
function DesktopBody({ t }: { t: (typeof TRANSLATIONS)[Language] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, window.location.href, {
      width: 220,
      margin: 1,
      color: { dark: '#111111', light: '#ffffff' },
    }).catch((err) => {
      console.error('Failed to render QR code', err);
    });
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <h3 className="text-white font-bold text-lg text-center">
        {t.installDesktopTitle}
      </h3>
      <div className="bg-white p-3 rounded-xl">
        <canvas ref={canvasRef} />
      </div>
      <p className="text-gray-400 text-sm text-center max-w-xs">
        {t.installDesktopSubtitle}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Manually verify the desktop modal**

```bash
cd frontend && npm run dev
```

1. Open `http://localhost:3000/demo` in desktop Chrome (no device emulation).
2. Click "How to install the app" — modal should appear with a QR code and heading "Open this page on your phone".
3. Scan the QR with a phone camera → it should open the same URL.
4. Close works via X, Esc, and backdrop click.

- [ ] **Step 4: Commit**

```bash
git add frontend/components/InstallAppButton.tsx
git commit -m "Implement desktop QR code fallback for install guide"
```

---

### Task 8: Cross-language and accessibility verification

This task is pure verification — no code changes. If anything fails, fix it inline before committing with a short message.

- [ ] **Step 1: Run the build to catch any production-only issues**

```bash
cd frontend && npm run build
```

Expected: build succeeds. If it fails with a module resolution error for `qrcode`, re-run `npm install` in `frontend/`.

- [ ] **Step 2: Verify each language**

With `npm run dev` running:

1. Open a team page (e.g. `/demo`) in the browser.
2. Navigate to `/demo/form` and use the language switcher to set **Español**. This writes `localStorage.preferred_language = 'es'`.
3. Go back to `/demo` — the install button text should now be "Cómo instalar la app".
4. Open the modal — subtitle, 3 steps, and footer note should all be in Spanish.
5. Repeat for Portuguese (`pt`) and Italian (`it`).

If any string falls back to English, that key is missing from that language block in `translations.ts` — add it.

- [ ] **Step 3: Verify accessibility basics**

In the modal:
- Tab key should move through interactive elements (X button, video).
- Screen reader (VoiceOver: Cmd+F5 on Mac) should announce "Install this app, dialog" when the modal opens.
- X button should announce its localized "Close" label.

If focus escapes the modal on Tab, that's a known limitation — add a TODO comment but do not block this task on it (out of scope per the spec, which requires focus trap but the existing project uses no focus-trap library).

Actually — the spec explicitly lists "Focus trap inside the modal while open" as a requirement. Implement it:

Add this inside `InstallModal`, alongside the existing `useEffect`:

```tsx
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = modalRef.current;
    if (!root) return;
    const focusables = root.querySelectorAll<HTMLElement>(
      'button, [href], video, input, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || focusables.length === 0) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener('keydown', handleTab);
    return () => window.removeEventListener('keydown', handleTab);
  }, []);
```

And attach `ref={modalRef}` to the inner modal content `<div>` (the one with `onClick={(e) => e.stopPropagation()}`).

- [ ] **Step 4: Verify on a real iPhone if available**

Point an iPhone at your dev server (`http://<your-mac-ip>:3000/demo`). Walk through:
1. Button is visible.
2. Tap → modal opens, video plays muted.
3. Actually complete the steps shown in the video — the app should install to your home screen.
4. Launch from home screen → button is now hidden (PWA standalone mode).

If step 4 fails, `display-mode: standalone` isn't being detected — check that the app has a valid `manifest.json`. If there's no manifest, Safari uses the `apple-mobile-web-app-capable` meta tag. Either is fine; verify one is set. This may reveal a gap outside this plan's scope — if so, note it and move on.

- [ ] **Step 5: Final commit (only if you made changes in steps 3 or 4)**

```bash
git add frontend/components/InstallAppButton.tsx
git commit -m "Add focus trap and finalize install guide a11y"
```

If no changes were needed, skip this step.

---

## Acceptance Checklist

At the end of implementation, all of these should be true:

- [ ] `frontend/public/install-guide/ios-install.mp4` exists and is between 1.5–3 MB
- [ ] `frontend/public/install-guide/ios-install-poster.jpg` exists
- [ ] `frontend/public/Share guide/` directory has been deleted
- [ ] `qrcode` and `@types/qrcode` are in `frontend/package.json`
- [ ] 10 new localization keys exist in en/es/pt/it blocks of `translations.ts`
- [ ] `frontend/components/InstallAppButton.tsx` exists and is rendered from `frontend/app/[teamSlug]/page.tsx`
- [ ] On iOS (or iPhone emulation), the button is visible and opens the video modal
- [ ] On desktop, the button is visible and opens the QR modal
- [ ] On Android, the button is hidden
- [ ] When running as an installed PWA, the button is hidden
- [ ] All strings display in the user's chosen language (from `localStorage.preferred_language`)
- [ ] Modal closes via backdrop, X button, and Esc
- [ ] `npm run build` succeeds
- [ ] `npx tsc --noEmit` reports no errors
