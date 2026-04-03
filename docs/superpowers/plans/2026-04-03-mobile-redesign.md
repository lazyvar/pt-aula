# Mobile Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the mobile view (≤768px) to feel like a native app — card fills available space, categories in a bottom sheet, no wasted vertical space.

**Architecture:** All changes in `public/index.html` (single-file app). Mobile-only CSS changes within the existing `@media (max-width: 768px)` block, plus new CSS for the bottom sheet. JS changes for bottom sheet toggling, swipe gestures, and updated `render()` HTML output.

**Tech Stack:** Vanilla HTML/CSS/JS, touch events API for swipe gestures.

**Spec:** `docs/superpowers/specs/2026-04-03-mobile-redesign-design.md`

---

### Task 1: Restructure Mobile Top Bar and Card Layout (CSS)

Replace the mobile header, category toggle, and fixed-height card with a compact top bar and flex-filling card.

**Files:**
- Modify: `public/index.html` (CSS block, lines 212-261 — the `@media (max-width: 768px)` section)

- [ ] **Step 1: Replace the mobile media query CSS**

Replace the entire `@media (max-width: 768px) { ... }` block (lines 212-261) with:

```css
@media (max-width: 768px) {
  .sidebar { display: none; }
  .layout { flex-direction: column; }
  .main-content {
    padding: 0;
    padding-bottom: 56px;
    max-width: 100% !important;
    margin: 0 !important;
    height: 100vh;
    height: 100dvh;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }
  .mobile-header { display: none; }
  .mobile-cat-toggle { display: none; }
  .mobile-cats { display: none !important; }

  /* Compact top bar */
  .mobile-top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px 8px;
    flex-shrink: 0;
  }
  .mobile-top-bar .stats {
    display: flex;
    gap: 12px;
    margin: 0;
    padding: 0;
    font-size: 0.78rem;
    justify-content: flex-start;
  }
  .mobile-cat-dropdown {
    padding: 5px 12px;
    border-radius: 20px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: var(--text-dim);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.72rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .mobile-cat-dropdown:hover { background: rgba(255,255,255,0.07); }

  /* Thin progress bar */
  .progress-area {
    padding: 0 16px;
    margin-bottom: 0;
    flex-shrink: 0;
  }
  .progress-area .progress-bar { height: 2px; }
  .progress-area .stats { display: none; }

  /* Card fills remaining space */
  .card-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: stretch;
    padding: 12px 16px;
    min-height: 0;
  }
  .card-container {
    flex: 1;
    height: auto;
    width: 100%;
    margin: 0 0 12px 0;
  }
  .card-face { padding: 20px 16px; border-radius: 20px; }
  .card-word { font-size: 1.4rem; }
  .card-hint { display: none; }

  /* Fixed bottom buttons */
  .buttons {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    gap: 0;
    margin: 0;
    padding: 0;
    z-index: 100;
  }
  .btn {
    flex: 1;
    justify-content: center;
    padding: 18px 0;
    border-radius: 0;
    font-size: 1.05rem;
    border: none;
  }
  .btn-wrong {
    background: rgba(231,76,60,0.15);
    border-right: 1px solid rgba(255,255,255,0.06);
  }
  .btn-right {
    background: rgba(46,204,113,0.15);
  }
  .keyboard-hint { display: none; }
}
```

- [ ] **Step 2: Verify CSS compiles (open in browser)**

Run: `npm start` (if not already running)
Open on mobile or use Chrome DevTools responsive mode at 375px width.
Expected: Layout will look broken because the HTML doesn't have `.mobile-top-bar` yet. That's fine — CSS is ready.

- [ ] **Step 3: Commit**

```bash
git add public/index.html
git commit -m "refactor: replace mobile CSS with compact top bar and flex card layout"
```

---

### Task 2: Add Bottom Sheet CSS

Add all CSS for the category bottom sheet overlay.

**Files:**
- Modify: `public/index.html` (add CSS before the closing `</style>` tag, line 510)

- [ ] **Step 1: Add bottom sheet styles**

Insert before the `</style>` closing tag:

```css
/* Bottom Sheet */
.bottom-sheet-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 200;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.bottom-sheet-backdrop.open {
  display: block;
  opacity: 1;
}

.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 201;
  background: var(--card-front);
  border-radius: 16px 16px 0 0;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}
.bottom-sheet.open {
  transform: translateY(0);
}

.bottom-sheet-handle {
  display: flex;
  justify-content: center;
  padding: 10px 0 6px;
  cursor: grab;
}
.bottom-sheet-handle::after {
  content: '';
  width: 36px;
  height: 4px;
  background: rgba(255,255,255,0.2);
  border-radius: 2px;
}

.bottom-sheet-title {
  padding: 4px 20px 12px;
  font-size: 0.95rem;
  font-weight: 700;
}

.bottom-sheet-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px;
  -webkit-overflow-scrolling: touch;
}

.bottom-sheet-body .cat-group { margin-bottom: 16px; }
.bottom-sheet-body .cat-group-header {
  font-size: 0.65rem;
  padding: 6px 0;
}
.bottom-sheet-body .cat-group-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex-direction: row;
  padding: 4px 0 0;
}
.bottom-sheet-body .filter-btn {
  padding: 7px 14px;
  border-radius: 20px;
  font-size: 0.75rem;
  width: auto;
  text-align: center;
}

.bottom-sheet-controls {
  padding: 12px 20px 24px;
  border-top: 1px solid rgba(255,255,255,0.06);
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.bottom-sheet-controls .ctrl-btn {
  flex: 1;
  text-align: center;
  padding: 10px;
  border-radius: 12px;
  font-size: 0.78rem;
}
```

- [ ] **Step 2: Commit**

```bash
git add public/index.html
git commit -m "feat: add bottom sheet CSS for mobile category selector"
```

---

### Task 3: Update render() HTML for Mobile Top Bar and Bottom Sheet

Replace the mobile header/toggle/cats HTML in all `render()` branches with the new mobile top bar and bottom sheet.

**Files:**
- Modify: `public/index.html` (JS `render()` function, lines 675-837)

- [ ] **Step 1: Add helper function for mobile dropdown label**

Insert before the `render()` function (before line 675):

```javascript
function mobileDropdownLabel() {
  if (activeCats.size === 0 || activeCats.size === Object.keys(catConfig).length) return 'All Categories';
  if (activeCats.size === 1) {
    const key = [...activeCats][0];
    return catConfig[key]?.label || 'Categories';
  }
  return activeCats.size + ' selected';
}
```

- [ ] **Step 2: Add helper function for mobile top bar HTML**

Insert after `mobileDropdownLabel()`:

```javascript
function mobileTopBarHTML(correct, wrong, remaining) {
  return `<div class="mobile-top-bar">
    <div class="stats">
      <span><span class="dot green"></span> ${correct}</span>
      <span><span class="dot red"></span> ${wrong}</span>
      <span><span class="dot gray"></span> ${remaining} left</span>
    </div>
    <button class="mobile-cat-dropdown" onclick="openBottomSheet()">${mobileDropdownLabel()} ▾</button>
  </div>`;
}

function bottomSheetHTML() {
  return `<div class="bottom-sheet-backdrop" id="sheetBackdrop" onclick="closeBottomSheet()"></div>
  <div class="bottom-sheet" id="bottomSheet">
    <div class="bottom-sheet-handle" id="sheetHandle"></div>
    <div class="bottom-sheet-title">Categories</div>
    <div class="bottom-sheet-body" id="sheetBody">${renderCatGroups(true)}</div>
    <div class="bottom-sheet-controls">
      <button class="ctrl-btn" onclick="startDeck()">Shuffle</button>
      <button class="ctrl-btn" onclick="resetStats()">Reset Stats</button>
      <button class="ctrl-btn" onclick="toggleMode()">${mode === "pt-to-en" ? "PT → EN" : "EN → PT"}</button>
    </div>
  </div>`;
}
```

- [ ] **Step 3: Replace the empty deck render branch (deck.length === 0)**

Replace lines 678-692 (the `if (deck.length === 0)` block) with:

```javascript
if (deck.length === 0) {
  app.innerHTML = `<div class="layout"><div class="sidebar">
    <div class="sidebar-scroll"><div class="header"><h1>🇧🇷 Português Aula</h1></div>
    ${renderCatGroups(false)}</div>
  </div><div class="main-content">
    ${mobileTopBarHTML(0, 0, 0)}
    <div class="card-area"><div class="done-screen animate-in">
      <div style="font-size:3rem;margin-bottom:16px">🦜</div>
      <h2>Cadê as cartas?</h2>
      <p style="margin-top:8px">Pick some topics from the sidebar<br>and let's get studying!</p>
    </div></div>
  </div></div>${bottomSheetHTML()}`;
  return;
}
```

- [ ] **Step 4: Replace the "round done with wrong cards" render branch**

Replace lines 696-726 (the `if (wrongCards.length > 0)` block inside `currentIndex >= deck.length`) with:

```javascript
if (wrongCards.length > 0) {
  app.innerHTML = `<div class="layout"><div class="sidebar">
    <div class="sidebar-scroll"><div class="header"><h1>🇧🇷 Português Aula</h1></div>
    ${renderCatGroups(false)}</div>
    <div class="sidebar-controls">
      <button class="ctrl-btn" onclick="toggleMode()">${mode === "pt-to-en" ? "PT → EN" : "EN → PT"}</button>
      <button class="ctrl-btn" onclick="startDeck()">Shuffle</button>
      <button class="ctrl-btn" onclick="resetStats()">Reset Stats</button>
    </div>
  </div><div class="main-content">
    ${mobileTopBarHTML(correct, wrong, 0)}
    <div class="done-screen animate-in">
      <h2>Round done!</h2>
      <p>You finished ${deck.length} cards</p>
      <div class="stats" style="margin-bottom:20px; font-size:1rem;">
        <span><span class="dot green"></span> ${correct} correct</span>
        <span><span class="dot red"></span> ${wrong} wrong</span>
      </div>
      <p style="font-size:0.95rem;">${wrongCards.length} card${wrongCards.length === 1 ? '' : 's'} to review</p>
      <button class="btn btn-wrong" onclick="reviewWrongCards()" style="margin:20px auto 0;">Review Wrong Cards</button>
    </div>
  </div></div>${bottomSheetHTML()}`;
```

- [ ] **Step 5: Replace the "all correct" render branch**

Replace lines 727-756 (the `else` block for all-correct completion) with:

```javascript
} else {
  app.innerHTML = `<div class="layout"><div class="sidebar">
    <div class="sidebar-scroll"><div class="header"><h1>🇧🇷 Português Aula</h1></div>
    ${renderCatGroups(false)}</div>
    <div class="sidebar-controls">
      <button class="ctrl-btn" onclick="toggleMode()">${mode === "pt-to-en" ? "PT → EN" : "EN → PT"}</button>
      <button class="ctrl-btn" onclick="startDeck()">Shuffle</button>
      <button class="ctrl-btn" onclick="resetStats()">Reset Stats</button>
    </div>
  </div><div class="main-content">
    ${mobileTopBarHTML(correct, 0, 0)}
    <div class="done-screen animate-in">
      <h2>Parabéns! 🎉</h2>
      <p>You got all ${deck.length} cards right!</p>
      <div class="stats" style="margin-bottom:20px; font-size:1rem;">
        <span><span class="dot green"></span> ${correct} correct</span>
      </div>
      <p style="font-size:0.95rem;">100% accuracy</p>
      <button class="btn btn-right" onclick="startDeck()" style="margin:20px auto 0;">Study Again</button>
    </div>
  </div></div>${bottomSheetHTML()}`;
}
```

- [ ] **Step 6: Replace the main card render branch**

Replace lines 771-837 (the main card rendering from `app.innerHTML = \`` to the closing of render) with:

```javascript
app.innerHTML = `
  <div class="layout">
    <div class="sidebar">
      <div class="sidebar-scroll">
        <div class="header">
          <h1>🇧🇷 Português Aula</h1>
        </div>
        ${renderCatGroups(false)}
      </div>
      <div class="sidebar-controls">
        <button class="ctrl-btn" onclick="toggleMode()">${mode === "pt-to-en" ? "PT → EN" : "EN → PT"}</button>
        <button class="ctrl-btn" onclick="startDeck()">Shuffle</button>
        <button class="ctrl-btn" onclick="resetStats()">Reset Stats</button>
      </div>
    </div>

    <div class="main-content">
      ${mobileTopBarHTML(correct, wrong, deck.length - currentIndex)}

      <div class="progress-area">
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="stats">
          <span><span class="dot green"></span> ${correct}</span>
          <span><span class="dot red"></span> ${wrong}</span>
          <span><span class="dot gray"></span> ${deck.length - currentIndex} left</span>
        </div>
      </div>

      <div class="card-area">
        <div class="card-container" id="cardContainer" onclick="flipCard()">
          <div class="card ${isFlipped ? 'flipped' : ''}" id="theCard">
            <div class="card-face card-front">
              <span class="category-tag ${cc.cls}">${cc.label}</span>
              <div class="card-label">${frontLabel}</div>
              <div class="card-word">${front}</div>
              ${cardStatsHTML}
            </div>
            <div class="card-face card-back">
              <span class="category-tag ${cc.cls}">${cc.label}</span>
              <div class="card-label">${backLabel}</div>
              <div class="card-word">${back}</div>
              ${cardStatsHTML}
            </div>
          </div>
        </div>

        <div class="buttons">
          <button class="btn btn-wrong" onclick="mark(false)">✗ Again</button>
          <button class="btn btn-right" onclick="mark(true)">✓ Got it</button>
        </div>
        <div class="keyboard-hint">Space/←/→ = flip · Enter = got it · Delete = again</div>
      </div>
    </div>
  </div>${bottomSheetHTML()}`;

  setupSwipeGestures();
```

Note: we add `id="cardContainer"` to the card container and call `setupSwipeGestures()` at the end (defined in Task 5). Also removed the `<div class="card-hint">tap to flip</div>` from the front face.

- [ ] **Step 7: Verify in browser**

Open in Chrome DevTools at 375px width.
Expected: Mobile shows compact top bar with stats left and dropdown right, thin progress bar, card filling remaining space, fixed bottom buttons. Desktop unchanged.

- [ ] **Step 8: Commit**

```bash
git add public/index.html
git commit -m "feat: update render() with mobile top bar, bottom sheet, and full-height card"
```

---

### Task 4: Add Bottom Sheet Open/Close JS

Add the JavaScript functions to open, close, and swipe-dismiss the bottom sheet.

**Files:**
- Modify: `public/index.html` (JS section, insert after `toggleMobileCats()` function around line 595)

- [ ] **Step 1: Replace toggleMobileCats with bottom sheet functions**

Replace the `toggleMobileCats()` function (line 593-595) with:

```javascript
function openBottomSheet() {
  const backdrop = document.getElementById('sheetBackdrop');
  const sheet = document.getElementById('bottomSheet');
  if (!backdrop || !sheet) return;
  backdrop.classList.add('open');
  // Small delay for CSS transition
  requestAnimationFrame(() => {
    sheet.classList.add('open');
  });
  document.body.style.overflow = 'hidden';
}

function closeBottomSheet() {
  const backdrop = document.getElementById('sheetBackdrop');
  const sheet = document.getElementById('bottomSheet');
  if (!backdrop || !sheet) return;
  sheet.classList.remove('open');
  setTimeout(() => {
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }, 300);
}
```

- [ ] **Step 2: Add swipe-to-dismiss on the bottom sheet handle**

Insert after `closeBottomSheet()`:

```javascript
function setupSheetDrag() {
  const handle = document.getElementById('sheetHandle');
  const sheet = document.getElementById('bottomSheet');
  if (!handle || !sheet) return;

  let startY = 0;
  let currentY = 0;

  handle.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    sheet.style.transition = 'none';
  }, { passive: true });

  handle.addEventListener('touchmove', (e) => {
    currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    if (diff > 0) {
      sheet.style.transform = `translateY(${diff}px)`;
    }
  }, { passive: true });

  handle.addEventListener('touchend', () => {
    sheet.style.transition = '';
    const diff = currentY - startY;
    if (diff > 80) {
      closeBottomSheet();
    } else {
      sheet.style.transform = '';
    }
    startY = 0;
    currentY = 0;
  });
}
```

- [ ] **Step 3: Call setupSheetDrag after render**

At the very end of the `render()` function (after `setupSwipeGestures();` or at the end of the function body), add:

```javascript
setupSheetDrag();
```

Note: This should be the last line inside `render()`, called for all branches. Add it after the final closing of the last `if/else` block but before the closing `}` of `render()`.

- [ ] **Step 4: Verify bottom sheet works**

Open in Chrome DevTools at 375px width.
1. Tap the category dropdown — bottom sheet should slide up with backdrop
2. Tap backdrop — sheet should dismiss
3. Swipe down on handle — sheet should dismiss
4. Select/deselect categories — should work and update the deck

- [ ] **Step 5: Commit**

```bash
git add public/index.html
git commit -m "feat: add bottom sheet open/close/drag-dismiss behavior"
```

---

### Task 5: Add Swipe Gestures on Card

Add touch swipe left/right on the card for Again/Got it.

**Files:**
- Modify: `public/index.html` (JS section, insert after `setupSheetDrag()`)

- [ ] **Step 1: Add swipe gesture function**

Insert after `setupSheetDrag()`:

```javascript
function setupSwipeGestures() {
  const container = document.getElementById('cardContainer');
  if (!container) return;

  let startX = 0;
  let startY = 0;
  let swiping = false;

  container.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    swiping = false;
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;

    // Only swipe if horizontal movement is dominant
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) {
      swiping = true;
      const card = document.getElementById('theCard');
      if (card) {
        const rotation = dx * 0.05;
        const translateX = dx * 0.3;
        card.style.transition = 'none';
        card.style.transform = `translateX(${translateX}px) rotate(${rotation}deg)${isFlipped ? ' rotateY(180deg)' : ''}`;
      }
    }
  }, { passive: true });

  container.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    const card = document.getElementById('theCard');

    if (swiping && Math.abs(dx) > 80) {
      // Swipe threshold met
      if (card) {
        card.style.transition = 'transform 0.3s ease';
        card.style.transform = `translateX(${dx > 0 ? 300 : -300}px) rotate(${dx > 0 ? 15 : -15}deg)`;
      }
      setTimeout(() => {
        if (dx > 0) mark(true);  // Swipe right = Got it
        else mark(false);         // Swipe left = Again
      }, 200);
    } else {
      // Snap back
      if (card) {
        card.style.transition = 'transform 0.55s cubic-bezier(0.4, 0.0, 0.2, 1)';
        card.style.transform = isFlipped ? 'rotateY(180deg)' : '';
      }
    }
    swiping = false;
  });

  // Prevent card click when swiping
  container.addEventListener('click', (e) => {
    if (swiping) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);
}
```

- [ ] **Step 2: Verify swipe gestures**

Open in Chrome DevTools at 375px width with touch simulation enabled.
1. Swipe right on card — should animate off and mark as correct
2. Swipe left on card — should animate off and mark as wrong
3. Small swipe — should snap back
4. Tap card — should still flip normally

- [ ] **Step 3: Commit**

```bash
git add public/index.html
git commit -m "feat: add swipe left/right gestures for Again/Got it on mobile"
```

---

### Task 6: Hide Mobile Top Bar on Desktop and Polish

Ensure the new mobile elements are hidden on desktop and handle edge cases.

**Files:**
- Modify: `public/index.html` (CSS section)

- [ ] **Step 1: Add desktop-hiding rules for mobile-only elements**

Add these rules in the main CSS section (outside the media query, near the existing `.mobile-header` rules around line 202):

```css
.mobile-top-bar { display: none; }
.mobile-cat-dropdown { display: none; }
.bottom-sheet-backdrop { display: none; }
.bottom-sheet { display: none; }

@media (max-width: 768px) {
  .bottom-sheet-backdrop { display: none; }
  .bottom-sheet-backdrop.open { display: block; }
  .bottom-sheet { display: flex; }
}
```

Note: The `.mobile-top-bar` display is already set to `display: flex` inside the `@media (max-width: 768px)` block from Task 1.

- [ ] **Step 2: Update the toggleCat function to refresh bottom sheet**

Find the `toggleCat` function and add a line to update the bottom sheet body if it's open:

Replace the existing `toggleCat` function (lines 660-673) with:

```javascript
function toggleCat(cat) {
  if (activeCats.has(cat)) {
    activeCats.delete(cat);
    deck = deck.filter(c => c.cat !== cat);
    wrongCards = wrongCards.filter(c => c.cat !== cat);
    if (currentIndex > deck.length) currentIndex = deck.length;
  } else {
    activeCats.add(cat);
    const newCards = shuffle(allCards.filter(c => c.cat === cat));
    deck = [...deck.slice(0, currentIndex), ...deck.slice(currentIndex), ...newCards];
  }
  saveSession();
  render();
}
```

This is identical to the existing function — no changes needed since `render()` already rebuilds the bottom sheet HTML. The sheet will close on category toggle because `render()` replaces the DOM. This is acceptable — selecting a category should dismiss the sheet so you can see the updated card.

- [ ] **Step 3: Verify full flow end-to-end**

Test on mobile (375px):
1. App loads — compact top bar with stats + dropdown, card fills space
2. Tap dropdown — bottom sheet slides up
3. Select categories — sheet closes, deck updates, card shows
4. Swipe right — marks correct, next card
5. Swipe left — marks wrong, next card
6. Buttons still work — tap Again/Got it
7. Complete deck — done screen shows correctly
8. Empty state — shows correctly with top bar

Test on desktop (>768px):
1. Sidebar visible, no mobile elements showing
2. All existing functionality unchanged

- [ ] **Step 4: Commit**

```bash
git add public/index.html
git commit -m "feat: polish mobile redesign — hide desktop elements, end-to-end verified"
```
