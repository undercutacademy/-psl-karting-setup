# Measurement Guide Album — Design Spec

## Problem

The app currently has "?" help icons only for Seat Position and Seat Inclination, restricted to the BRAVAR team. Users of other teams and other measurement fields have no visual guidance on how/where to take measurements, making the form less intuitive — especially for new kart mechanics and drivers.

## Solution

Create an `Album/` folder containing professional measurement guide images (SVG with embedded reference photos + annotations) for all 15 Kart Setup fields (13 new + 2 existing seat guides migrated). Then integrate "?" help icons into the form for all teams.

## Scope

### Phase 1: Album Creation (Image Generation)

Create `frontend/public/Album/` with 15 SVG files (13 new + 2 migrated from `Ajuste de banco/`):

| # | File | Field | Photo Angle | Annotation Shows |
|---|------|-------|-------------|-----------------|
| 1 | `Seat_Position.svg` | seatPosition | Side view of kart chassis | Distance from seat mount to reference point [cm] *(migrated from Ajuste de banco/)* |
| 2 | `Seat_Inclination.svg` | seatInclination | Side view of kart chassis | Seat tilt angle relative to chassis *(migrated from Ajuste de banco/)* |
| 3 | `Caster.svg` | caster | Side view of front steering assembly | Angle between kingpin axis and vertical reference line |
| 4 | `Camber.svg` | camber | Front view of kart | Wheel tilt angle relative to vertical |
| 5 | `Rear_Track_Width.svg` | rearTrackWidth | Rear view of kart | Center-to-center distance between rear wheels |
| 6 | `Axle_Size.svg` | axleSize | Close-up of rear axle | Axle diameter measurement point |
| 7 | `Front_Hubs_Length.svg` | frontHubsLength | Close-up of front hub area | Hub spacer length dimension |
| 8 | `Rear_Hubs_Length.svg` | rearHubsLength | Close-up of rear hub area | Hub spacer length dimension |
| 9 | `Back_Height.svg` | backHeight | Side/rear view of chassis | Rear ride height adjustment positions (Low/Medium/High/Standard) |
| 10 | `Front_Height.svg` | frontHeight | Side/front view of chassis | Front ride height adjustment positions (Low/Medium/High/Standard) |
| 11 | `Front_Bar.svg` | frontBar | Front view of chassis underside | Location of stabilizer bar, visual difference between types (Nylon/Standard/Black/None) |
| 12 | `Spindle.svg` | spindle | Close-up of front steering knuckle | Different spindle types/colors (Blue/Standard/Red/Green/Gold/Single Piece) |
| 13 | `Front_Wheel_Type.svg` | frontWheelType | Front wheel comparison | Visual difference between Hub and No-Hub wheels |
| 14 | `Rear_Hubs_Material.svg` | rearHubsMaterial | Close-up comparison | Visual difference between Aluminium and Magnesium hubs |
| 15 | `Front_Hubs_Material.svg` | frontHubsMaterial | Close-up comparison | Visual difference between Aluminium and Magnesium hubs |

### Image Style

- **Format:** SVG files with embedded reference kart photos (sourced online)
- **Annotations:** Professional overlay style — dimension lines, arrows, highlighted measurement areas, circled regions
- **Accent color:** Orange/red for high contrast against kart photos
- **Labels:** Clean sans-serif font with measurement title and brief instruction
- **Background:** Photo fills the SVG viewport, annotations overlay on top
- **Dimensions:** ~800x500px viewport for landscape images

### Phase 2: App Integration

After Album images are approved by the user:

1. **Add "?" buttons** next to all 15 Kart Setup field labels in `frontend/app/[teamSlug]/form/page.tsx`
2. **Remove BRAVAR restriction** — make help icons available to ALL teams
3. **Migrate seat guides** — update seat position/inclination to reference `Album/` instead of `Ajuste de banco/`
4. **Reuse existing modal pattern** — same overlay modal used for seat position/inclination
5. **Image mapping:** Map each field name to its corresponding SVG path in `Album/`
6. **Clean up** — remove old `Ajuste de banco/` folder after migration

#### Key Files to Modify

- `frontend/app/[teamSlug]/form/page.tsx` — Add ? buttons and modals for all 15 fields, update seat image paths
- `frontend/public/Album/` — New directory with 15 SVG guide images
- `frontend/public/Ajuste de banco/` — Remove after migration

#### Existing Pattern to Reuse

The current implementation in the form page uses:
- A `w-5 h-5 rounded-full` button with "?" text
- `title="How to measure"` tooltip
- Full-screen modal (`fixed inset-0 z-[100]`) with `bg-black/80 backdrop-blur-sm`
- Image displayed inside a gray-900 dialog box with title (emoji + field name + "Guide")
- Close button

This pattern will be extended to all 15 fields, and the existing seat guides will be migrated to the new `Album/` folder.

#### Modal Title Format

Each modal will show: `📏 {Field Name} - Guide` (matching existing pattern)

## Availability

Help icons visible to **all teams** (removing the current `bravar`-only conditional).

## Verification

1. Open `Album/` folder and verify all 15 SVG files render correctly in a browser
2. Review each image for accuracy — correct photo angle, clear annotations, readable labels
3. After Phase 2 integration: submit a test form and verify all ? icons appear and modals display correctly
4. Test across multiple teams (not just BRAVAR) to confirm universal availability
