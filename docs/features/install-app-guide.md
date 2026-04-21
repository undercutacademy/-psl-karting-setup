# Install App Guide

A "How to install the app" button on each team's main page that teaches users how to save the web app to their iOS home screen. On desktop it shows a QR code so the user can switch to their phone. On Android and inside an already-installed PWA it hides itself.

Shipped on `main` between commits `8bd3fad` and `01720a2` (2026-04-21).

## What the user sees

- **Team home page** (e.g. `/demo`) has a muted full-width button below the Submit Setup / Manager Dashboard cards: "📱 How to install the app".
- **On iOS (Safari, Chrome, any iOS browser)** — tapping opens a full-screen modal with:
  - Team logo + "Install this app" title + close button
  - Subtitle: "Follow the steps to add this app to your home screen"
  - Looping, muted, autoplay portrait video (a screen recording of the real iOS share → Add to Home Screen flow) inside a faint phone frame
  - 3 numbered steps with the team's primary color as the badge: "Tap the Share button in Safari" → 'Scroll and tap "Add to Home Screen"' → 'Tap "Add" in the top-right corner'
  - Footer: "Once installed, open the app from your home screen for the best experience"
- **On desktop** — the same modal, but:
  - Wider card (`max-w-2xl` instead of `max-w-md`)
  - Horizontal layout: QR code (of `window.location.href`) on the left, title + "Scan with your phone camera to continue" on the right
  - No video, no step list
- **On Android** — button is hidden. An Android recording will be added later.
- **Inside the installed PWA** (launched from the home screen icon) — button is hidden. Detected via `display-mode: standalone` and Safari's `navigator.standalone`.

## Environment detection

Done once on mount in [InstallAppButton.tsx](../../frontend/components/InstallAppButton.tsx) via `detectMode()`:

| Environment | UA / media query check | Result |
|---|---|---|
| iOS | `iPad\|iPhone\|iPod` OR (`Mac` + `navigator.maxTouchPoints > 1`) | `mode = 'ios'` |
| Standalone PWA | `(display-mode: standalone)` OR `navigator.standalone === true` | `mode = null` (hidden) |
| Android | `Android` | `mode = null` (hidden) |
| Everything else | (fallback) | `mode = 'desktop'` |

The iPadOS-reports-as-Mac fallback is important: modern iPads default to desktop-mode user agents, but they have touch, so we use `maxTouchPoints` to catch them.

## Localization

Fully translated into English, Spanish, Portuguese, Italian via [`translations.ts`](../../frontend/lib/translations.ts). 10 keys:

- `installAppButton` — the button label
- `installModalTitle` — the modal header ("Install this app")
- `installModalSubtitle`, `installStep1`, `installStep2`, `installStep3`, `installFooterNote` — iOS body
- `installDesktopTitle`, `installDesktopSubtitle` — desktop body
- `installClose` — close button's aria-label

Safari's literal UI labels ("Share", "Add to Home Screen", "Add") deliberately stay in English across all languages — that's what the user sees on-screen in Safari.

Language is read from `localStorage.preferred_language` (same convention used by the form page), defaulting to `en`.

## Accessibility

- `role="dialog"`, `aria-modal="true"`, `aria-labelledby="install-modal-title"` on the overlay
- Close button has localized `aria-label`
- `<video>` has a localized `aria-label` so screen readers can describe it
- Step numbers on the iOS body have `aria-hidden="true"` to avoid screen readers announcing "1. 1. Tap..."
- Focus trap: Tab/Shift+Tab cycle between focusables; the close button is focused on open
- Focus restoration: the element focused *before* the modal opens receives focus back on close
- Close affordances: backdrop click, X button, Esc key

## Assets

- [`frontend/public/install-guide/ios-install.mp4`](../../frontend/public/install-guide/ios-install.mp4) — ~228 KB, 720p portrait, H.264, no audio, 14.7s, looping. Compressed from the original 27 MB `Share_Guide.MP4` with:

  ```bash
  ffmpeg -i "Share_Guide.MP4" -vf "scale=-2:720" -r 24 \
    -c:v libx264 -crf 30 -preset slow \
    -an -movflags +faststart \
    ios-install.mp4
  ```

- [`frontend/public/install-guide/ios-install-poster.jpg`](../../frontend/public/install-guide/ios-install-poster.jpg) — ~28 KB, first-frame poster so the video doesn't flash black before it loads

## Files involved

- [frontend/components/InstallAppButton.tsx](../../frontend/components/InstallAppButton.tsx) — the entire feature lives here: button, modal, iOS body, desktop body, environment detection, focus trap, focus restoration, QR rendering
- [frontend/app/[teamSlug]/page.tsx](../../frontend/app/[teamSlug]/page.tsx) — renders `<InstallAppButton />` inside the existing card container
- [frontend/lib/translations.ts](../../frontend/lib/translations.ts) — 10 new localization keys per language
- [frontend/package.json](../../frontend/package.json) — added `qrcode` + `@types/qrcode`
- [frontend/public/install-guide/](../../frontend/public/install-guide/) — video + poster

## Commits (oldest first)

Related spec and plan:

- `ca4364a` — spec ([docs/superpowers/specs/2026-04-21-install-app-guide-design.md](../superpowers/specs/2026-04-21-install-app-guide-design.md))
- `31b573a` — plan ([docs/superpowers/plans/2026-04-21-install-app-guide.md](../superpowers/plans/2026-04-21-install-app-guide.md))

Implementation:

- `8bd3fad` — compressed video + poster, deleted the 27 MB source
- `8d8576c` — added `qrcode` dependency
- `9d12d38` — translations (en/es/pt/it)
- `4b651e8` — scaffolded `InstallAppButton` with environment detection
- `777c09a` — rendered the button on the team home page
- `ff314ad` — iOS modal with video + step list
- `608159d` — desktop QR modal body
- `1e1f9d4` — added focus trap
- `65f2fa5` — focus restoration on close + a11y polish
- `01720a2` — widened the modal and switched desktop to a landscape layout

To roll back just the desktop layout change: `git revert 01720a2`.
To roll back the whole feature: `git revert 01720a2..HEAD` from a commit before `8bd3fad`, or cherry-pick only the spec/plan commits.

## Known limits / follow-ups

- **No Android video yet.** Button is simply hidden on Android. When the recording exists, set `mode = 'android'` and add an `AndroidBody` component parallel to `IOSBody`.
- **Video bitrate is aggressive** (228 KB for 14.7s). If users report blurry Safari chrome in the video, re-encode at `-crf 26` for a larger but sharper file.
- **Video is never unmounted until the modal closes.** For a very quick open/close cycle the browser may not release network if it's still downloading. Harmless but a theoretical leak.
- **No analytics** on button clicks or modal opens. Add later if you want to measure conversion.
- **No `beforeinstallprompt` support** for Chrome. Programmatic install on Android/desktop Chrome was explicitly out of scope.
