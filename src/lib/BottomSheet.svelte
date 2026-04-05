<script lang="ts">
  import { onMount } from 'svelte';
  import CategoryPicker from './CategoryPicker.svelte';
  import ControlButtons from './ControlButtons.svelte';
  import { sheetOpen } from '../stores/ui';

  let sheetEl: HTMLDivElement;
  let backdropEl: HTMLDivElement;

  function open() {
    sheetOpen.set(true);
    backdropEl.classList.add('open');
    requestAnimationFrame(() => {
      sheetEl.classList.add('open');
    });
    document.body.style.overflow = 'hidden';
  }

  function close() {
    sheetEl.classList.remove('open');
    backdropEl.style.opacity = '0';
    setTimeout(() => {
      backdropEl.classList.remove('open');
      backdropEl.style.opacity = '';
      document.body.style.overflow = '';
      sheetOpen.set(false);
    }, 300);
  }

  // Open/close imperatively in response to sheetOpen changes from outside
  // (e.g., MobileTopBar clicks).
  $: if (sheetEl && backdropEl) {
    if ($sheetOpen && !sheetEl.classList.contains('open')) {
      backdropEl.classList.add('open');
      requestAnimationFrame(() => sheetEl.classList.add('open'));
      document.body.style.overflow = 'hidden';
    }
  }

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
    <ControlButtons />
  </div>
</div>
