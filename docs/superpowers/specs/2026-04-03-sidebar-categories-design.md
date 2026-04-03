# Sidebar Categories UI Redesign

## Problem

Category filter buttons are displayed as a flat, wrapping row of buttons. As the number of categories grows (currently 19), this becomes hard to scan and maintain.

## Solution

Responsive layout with grouped categories:
- **Desktop (>768px):** Fixed left sidebar with grouped, expandable category sections
- **Mobile (<=768px):** Collapsible toggle at the top with grouped category list

## Data Model Changes

Add `group_name` field to the `categories` table.

```sql
ALTER TABLE categories ADD COLUMN IF NOT EXISTS group_name TEXT NOT NULL DEFAULT 'Topics';
```

### Category Groups

| Group         | Categories                                                        |
|---------------|-------------------------------------------------------------------|
| Topics        | Fitness, Vocabulary, Phrases, Verbs, Weather, Daily Life, Time & Days, Birthday, Quase |
| IR            | IR Phrases, IR Conjugations                                       |
| Conjugations  | Ler, Esquecer, Lembrar, Dizer                                    |
| Aulas         | Aula Mar 27, Aula Mar 30, April Fools, April 2                   |

## API Changes

`GET /api/cards` response adds `group` to each category entry:

```json
{
  "categories": {
    "fitness": { "cls": "cat-fitness", "label": "Fitness", "group": "Topics" }
  }
}
```

No other API changes.

## Desktop Layout (>768px)

- Left sidebar, ~240px wide, fixed position
- Contains: app title, grouped categories (expand/collapse per group), control buttons (mode toggle, shuffle, reset)
- Main content area shifts right for the card, progress bar, stats, and mark buttons
- All groups expanded by default

## Mobile Layout (<=768px)

- No sidebar, full-width layout (similar to current)
- Collapsible toggle button at top: "Categories (N selected)"
- When expanded, shows grouped category list
- Groups collapsed by default to save vertical space

## Implementation Details

- **CSS-only responsive**: `@media (max-width: 768px)` switches between sidebar and collapsible
- **Group headers**: clickable to expand/collapse with chevron indicator. Clicking a group header only toggles visibility of that group's buttons — does NOT select/deselect all categories in the group
- **Category buttons**: same visual style as current `.filter-btn`, organized under group headers
- **Mobile toggle**: single button showing "Categories (N selected)" that expands/collapses the grouped list
- **Expand/collapse state**: purely local UI, not persisted to server
- **Seed data**: updated with `group_name` for each category

## Files Changed

1. `seed-data.js` — add `group_name` to each category
2. `server.js` — add `group_name` column to schema, include in API response
3. `public/index.html` — new sidebar/collapsible layout, grouped rendering, responsive CSS
