# Install App Guide — Design

## Summary

Add a "How to install the app" button to every team's main page. Tapping it opens a full-screen modal that teaches users how to save the web app to their iOS home screen (so it behaves like a native app). Android is hidden for now (no assets yet). Desktop shows a minimal QR code so users can switch to their phone.

## Goals

- Give first-time users a clear, visual path to "install" the PWA on iOS.
- Match the existing dark/racing aesthetic of the team home page.
- Localize all user-facing text (en, es, pt, it).
- Hide the button when it's not useful (Android, already-installed PWA).

## Non-goals

- Full cross-platform coverage. Android will be added later when an Android screen recording exists.
- Programmatic install via `beforeinstallprompt` (Chrome) — out of scope for this spec.
- Analytics on install button clicks — out of scope.

## Entry point

Location: [frontend/app/[teamSlug]/page.tsx](../../../frontend/app/%5BteamSlug%5D/page.tsx), inside the `rounded-2xl bg-gray-900/80` card container, below the two existing grid cards (Submit Setup / Manager Dashboard).

Visual: subtle full-width link-style button with a phone emoji prefix. It should NOT compete with the two primary CTAs. Styled as a muted row with a border-top separator.

Label (localized): **"📱 How to install the app"**

Because the page is a server component and visibility depends on `window`/`navigator`, the button is a `'use client'` component rendered inline.

## Visibility matrix

Computed client-side in `useEffect` after mount. Button renders `null` during SSR and while detecting.

| Environment                                    | Button | Modal content       |
| ---------------------------------------------- | ------ | ------------------- |
| iOS (any browser, detected via user agent)     | Shown  | iOS video guide     |
| Desktop (no touch, large viewport)             | Shown  | QR code "open on phone" |
| Android                                        | Hidden | —                   |
| PWA standalone (`display-mode: standalone`)    | Hidden | —                   |

Detection helpers (all in the button component, simple one-liners — no external lib):

```ts
// iPadOS 13+ reports as Mac, so also check for touch Mac
const ua = navigator.userAgent;
const isIOS = /iPad|iPhone|iPod/.test(ua)
  || (ua.includes('Mac') && navigator.maxTouchPoints > 1);
const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  || (window.navigator as any).standalone === true;
const isAndroid = /Android/.test(ua);
const isDesktop = !isIOS && !isAndroid;
```

## iOS modal

Full-screen overlay: `fixed inset-0 z-50` with a dimmed + blurred backdrop.

Close affordances:
- Tap on backdrop (outside the content card)
- X button in the top-right of the content card
- `Esc` key

Layout (top → bottom, inside a dark rounded content card):

1. **Header row** — small team logo (from `teamInfo.logoUrl`) + "Install this app" title (localized) + close button
2. **Subtitle** (localized): "Follow the steps to add this app to your home screen"
3. **Video**
   - `<video>` with `muted`, `autoplay`, `loop`, `playsinline`, `preload="metadata"`
   - `poster={…ios-install-poster.jpg}` so no black flash
   - Source: `/install-guide/ios-install.mp4`
   - Wrapped in a faint rounded phone frame (CSS only — `rounded-[2.5rem] border-4 border-gray-800`, a subtle inset shadow). No skeuomorphic notch.
   - Constrained to a sensible max-width for portrait video (~280–320px on mobile, centered)
4. **Three step captions** (localized), numbered, rendered as a small list:
   1. "Tap the Share button in Safari"
   2. 'Scroll and tap "Add to Home Screen"'
   3. 'Tap "Add" in the top-right corner'
5. **Footer note** (localized): "Once installed, open the app from your home screen for the best experience"

Accent color: team `primaryColor` (from existing `teamInfo.primaryColor`) on the title underline / number badges.

## Desktop modal

Same modal chrome. Body replaced with:

- Heading (localized): "Open this page on your phone"
- QR code rendered from `window.location.href` — uses the `qrcode` npm package (~30KB gzipped) rendered into a `<canvas>` on mount
- Sub-caption: "Scan with your phone camera to continue"

No video, no step list. Pure handoff to mobile.

## Files

### New

- `frontend/components/InstallAppButton.tsx` — client component. Renders the button + the modal. Handles visibility detection and iOS/desktop mode switching.
- `frontend/public/install-guide/ios-install.mp4` — compressed from `frontend/public/Share guide/Share_Guide.MP4`. Target 1.5–3 MB.
- `frontend/public/install-guide/ios-install-poster.jpg` — first-frame poster (~50 KB) to prevent a black flash while the video loads.

### Modified

- [frontend/app/[teamSlug]/page.tsx](../../../frontend/app/%5BteamSlug%5D/page.tsx) — import and render `<InstallAppButton teamName={teamName} logoUrl={logoUrl} primaryColor={primaryColor} />` inside the cards container below the grid.
- [frontend/lib/translations.ts](../../../frontend/lib/translations.ts) — add 10 keys (listed below) across en/es/pt/it.
- `frontend/package.json` — add `qrcode` dependency (and `@types/qrcode` for TS).

### Source assets (kept but not shipped)

The original `frontend/public/Share guide/` folder is the source material. It should NOT be served to users directly because of its size. Options: delete after compression, or move out of `public/` into a `source-assets/` folder. Decision at implementation time — default: delete `.MP4` and `.PNG` source files from `public/` after the compressed output is committed.

## Video compression

One-shot command during implementation (not at build/runtime):

```bash
ffmpeg -i "frontend/public/Share guide/Share_Guide.MP4" \
  -vf "scale=-2:720" -r 24 \
  -c:v libx264 -crf 30 -preset slow \
  -an -movflags +faststart \
  frontend/public/install-guide/ios-install.mp4

ffmpeg -i frontend/public/install-guide/ios-install.mp4 \
  -frames:v 1 -q:v 4 \
  frontend/public/install-guide/ios-install-poster.jpg
```

Flags:
- `scale=-2:720` — 720p tall, width auto to preserve aspect; `-2` keeps width even for H.264.
- `-r 24` — 24 fps is plenty for a UI demo.
- `-crf 30 -preset slow` — good size/quality tradeoff.
- `-an` — drop audio (silent demo).
- `+faststart` — moves MOOV atom to front so playback starts before full download.

Target: 1.5–3 MB. If overshoot, bump `-crf` to 32–34. If undershoot and quality suffers, drop to `-crf 28`.

## Localization keys

Add to all four languages in [frontend/lib/translations.ts](../../../frontend/lib/translations.ts):

| Key                     | English                                                                     |
| ----------------------- | --------------------------------------------------------------------------- |
| `installAppButton`      | How to install the app                                                      |
| `installModalTitle`     | Install this app                                                            |
| `installModalSubtitle`  | Follow the steps to add this app to your home screen                        |
| `installStep1`          | Tap the Share button in Safari                                              |
| `installStep2`          | Scroll and tap "Add to Home Screen"                                         |
| `installStep3`          | Tap "Add" in the top-right corner                                           |
| `installFooterNote`     | Once installed, open the app from your home screen for the best experience  |
| `installDesktopTitle`   | Open this page on your phone                                                |
| `installDesktopSubtitle`| Scan with your phone camera to continue                                     |
| `installClose`          | Close                                                                       |

Translations to es / pt / it follow the same patterns already used in `translations.ts` (keep Safari's literal UI labels — "Share", "Add to Home Screen", "Add" — unlocalized, since that's what the user literally sees on-screen).

## Accessibility

- Modal uses `role="dialog"` with `aria-modal="true"`, `aria-labelledby` pointing to the title.
- Close button has `aria-label` (localized `installClose`).
- Video has `aria-label` describing the demo (localized), plus the visible step list acts as the text fallback.
- Esc closes the modal; focus returns to the button that opened it.
- Focus trap inside the modal while open.

## Component interface

```tsx
type InstallAppButtonProps = {
  teamName: string;
  logoUrl: string;
  primaryColor: string;
  language?: Language; // defaults to team or 'en'
};
```

Internally the component owns:
- `open: boolean` state for the modal
- `mode: 'ios' | 'desktop' | null` set once after detection (null until detected → button renders `null`)

## Out of scope / future

- Android video + conditional platform switching
- Analytics on open/close/complete
- Programmatic install prompt on Chrome (`beforeinstallprompt`)
- "Install detected — you're all set!" celebratory state

## Testing

Manual:
- Open team page on an iPhone (Safari) → button visible, modal plays video
- Open team page on iPhone already saved to home screen (launched from icon) → button hidden
- Open team page on Android Chrome → button hidden
- Open team page on desktop → button visible, modal shows QR
- Open team page in each of 4 languages → strings localized

No automated tests are being added for this component (matches current project convention).
