<script lang="ts">
  import { onMount } from 'svelte';
  import CategoryPicker from './CategoryPicker.svelte';
  import ControlButtons from './ControlButtons.svelte';
  import { sheetOpen } from '../stores/ui';

  let sheetEl: HTMLDivElement;
  let backdropEl: HTMLDivElement;

  // Non-reactive flag so that close() can suppress the store subscription
  // callback during the close animation without triggering a reactive re-run.
  let isClosing = false;

  function open() {
    isClosing = false;
    backdropEl.classList.add('open');
    requestAnimationFrame(() => {
      sheetEl.classList.add('open');
    });
    document.body.style.overflow = 'hidden';
  }

  function close() {
    isClosing = true;
    sheetEl.classList.remove('open');
    backdropEl.style.opacity = '0';
    setTimeout(() => {
      isClosing = false;
      backdropEl.classList.remove('open');
      backdropEl.style.opacity = '';
      document.body.style.overflow = '';
      sheetOpen.set(false);
    }, 300);
  }

  onMount(() => {
    // Subscribe to sheetOpen in onMount so the callback runs in a plain
    // closure — mutation of isClosing here does NOT trigger Svelte reactivity,
    // preventing the "re-open during close animation" bug.
    const unsub = sheetOpen.subscribe((open) => {
      if (!sheetEl || !backdropEl) return;
      if (open && !isClosing) {
        // External open request (e.g. MobileTopBar button)
        backdropEl.classList.add('open');
        requestAnimationFrame(() => sheetEl.classList.add('open'));
        document.body.style.overflow = 'hidden';
      }
    });
    return unsub;
  });

  // Drag-to-close gesture. Ported from public/index.html:839-871.
  let startY = 0;
  let currentY = 0;

  function onTouchStart(e: TouchEvent) {
    startY = e.touches[0].clientY;
    sheetEl.style.transition = 'none';
  }

  function onTouchMove(e: TouchEvent) {
    currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    if (diff > 0) {
      sheetEl.style.transform = `translateY(${diff}px)`;
    }
  }

  function onTouchEnd() {
    sheetEl.style.transition = '';
    const diff = currentY - startY;
    if (diff > 80) {
      close();
    } else {
      sheetEl.style.transform = '';
    }
    startY = 0;
    currentY = 0;
  }
</script>

<div
  class="bottom-sheet-backdrop"
  id="sheetBackdrop"
  bind:this={backdropEl}
  on:click={close}
  on:keydown={(e) => e.key === 'Escape' && close()}
  role="button"
  tabindex="-1"
  aria-label="Close sheet"
></div>
<div class="bottom-sheet" id="bottomSheet" bind:this={sheetEl}>
  <div
    class="bottom-sheet-handle"
    id="sheetHandle"
    on:touchstart={onTouchStart}
    on:touchmove={onTouchMove}
    on:touchend={onTouchEnd}
  ></div>
  <div class="bottom-sheet-title">Categories</div>
  <div class="bottom-sheet-body" id="sheetBody">
    <CategoryPicker prefix="mob-" />
  </div>
  <div class="bottom-sheet-controls">
    <ControlButtons testIds={false} />
  </div>
</div>
