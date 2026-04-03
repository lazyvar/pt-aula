# Mobile Redesign: App-Like Experience

## Problem

The current mobile view wastes ~60% of screen space. The flashcard has a fixed 260px height centered vertically in the viewport, leaving large empty gaps above and below. The header, category toggle, progress bar, and stats all stack vertically before the card, pushing it further down. The overall feel is "desktop site on a phone" rather than a native app.

## Design: Maximum Card with Bottom Sheet Categories

### Layout Structure (Mobile ≤768px)

```
┌──────────────────────────────┐
│ ●0  ●0  ●35    [Aula Mar 30▾]│  ← top bar (~40px)
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━│  ← 2px progress bar
│                              │
│  ┌──────────────────────────┐│
│  │                          ││
│  │      AULA MAR 30         ││
│  │        ENGLISH           ││
│  │                          ││
│  │     Everything           ││  ← card fills ALL remaining space
│  │                          ││
│  │       1✓ 0✗              ││
│  │                          ││
│  └──────────────────────────┘│
│                              │
│ ✗ Again       │  ✓ Got it    │  ← fixed bottom buttons
└──────────────────────────────┘
```

### Top Bar

- Single row, ~40px height
- **Left side**: Score stats — green dot + correct count, red dot + wrong count, gray dot + remaining count
- **Right side**: Category dropdown button — pill-shaped, subtle border, chevron indicator. Label logic: if 1 category selected, show its name; if 2-3 selected, show count like "3 selected"; if all selected or none selected, show "All Categories"
- No app title on mobile — unnecessary once you're in the app

### Progress Bar

- 2px thin line spanning full width (with 16px horizontal margin)
- Accent color (`#e94560`) fill, dark track
- Positioned directly under the top bar with no extra spacing

### Flashcard

- **No fixed height** — uses `flex: 1` to fill all vertical space between the progress bar and the bottom buttons
- 16px horizontal padding, 12px vertical padding around the card
- Card content (category tag, language label, word, stats) centered vertically and horizontally within
- Existing 3D flip animation preserved
- Remove "tap to flip" hint — unnecessary affordance for a tappable card
- Card border-radius: 20px

### Bottom Buttons

- Fixed to bottom of viewport (unchanged from current)
- Full-width, two equal halves
- Left: "✗ Again" with red background
- Right: "✓ Got it" with green background
- 18px vertical padding for comfortable thumb targets

### Swipe Gestures

- **Swipe left on card** = Again (wrong)
- **Swipe right on card** = Got it (correct)
- Subtle visual feedback during swipe (card tilts slightly in swipe direction)
- Buttons still work for users who prefer tapping

### Category Bottom Sheet

Triggered by tapping the category dropdown button in the top bar.

```
┌──────────────────────────────┐
│         ━━━━━━               │  ← drag handle
│  Categories                  │  ← title
│                              │
│  AULAS                       │  ← group header (uppercase, dim)
│  [Aula Mar 30] [Aula Mar 23]│  ← category chips (wrap)
│  [Aula Mar 16]               │
│                              │
│  TOPICS                      │
│  [Travel] [Food] [Greetings] │
│                              │
│  GRAMMAR                     │
│  [Verbs] [Conjugation]       │
│                              │
│ ┌────────┐┌────────┐┌──────┐│
│ │Shuffle ││ Reset  ││PT→EN ││  ← control buttons
│ └────────┘└────────┘└──────┘│
└──────────────────────────────┘
```

- **Appearance**: Slides up from bottom, dark background (`#1a1a2e`), rounded top corners (16px)
- **Backdrop**: Semi-transparent black overlay behind the sheet
- **Drag handle**: Centered 36px wide, 4px tall rounded bar
- **Max height**: 70% of viewport
- **Scrollable**: Category list scrolls if it exceeds available space
- **Groups**: Same grouped category structure as desktop sidebar — group name as uppercase label, chips below
- **Selected state**: Accent-colored background and border on selected chips
- **Unselected state**: Subtle dark background, dim border
- **Bottom controls**: Shuffle, Reset, and PT→EN mode toggle in a row at the bottom, separated by a top border
- **Dismiss**: Tap backdrop or swipe sheet down

### What Stays the Same on Desktop

This redesign is mobile-only (≤768px). Desktop layout with the sidebar remains unchanged.

### Empty State

The existing empty state (fun message when no cards match) stays the same but should also fill the card area rather than floating in space.

## Technical Notes

- All changes are CSS and JS within `public/index.html` (single-file app)
- Mobile detection via existing `@media (max-width: 768px)` breakpoint
- Bottom sheet is new DOM + CSS + JS (no library needed)
- Swipe detection via touch event listeners on the card container
- Card height change from `height: 260px` to `flex: 1` within a flex column layout
- Remove `.mobile-header` display on mobile
- Replace `.mobile-cat-toggle` and `.mobile-cats` with bottom sheet
