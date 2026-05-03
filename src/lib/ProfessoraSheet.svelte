<script lang="ts">
  import { onMount } from 'svelte';
  import { professoraSheetOpen } from '../stores/ui';

  let sheetEl: HTMLDivElement;
  let backdropEl: HTMLDivElement;
  let isClosing = false;

  function close() {
    isClosing = true;
    sheetEl.classList.remove('open');
    backdropEl.style.opacity = '0';
    setTimeout(() => {
      isClosing = false;
      backdropEl.classList.remove('open');
      backdropEl.style.opacity = '';
      document.body.style.overflow = '';
      professoraSheetOpen.set(false);
    }, 300);
  }

  onMount(() => {
    const unsub = professoraSheetOpen.subscribe((open) => {
      if (!sheetEl || !backdropEl) return;
      if (open && !isClosing) {
        backdropEl.classList.add('open');
        requestAnimationFrame(() => sheetEl.classList.add('open'));
        document.body.style.overflow = 'hidden';
      }
    });
    return unsub;
  });

  let startY = 0;
  let currentY = 0;

  function onTouchStart(e: TouchEvent) {
    startY = e.touches[0].clientY;
    sheetEl.style.transition = 'none';
  }
  function onTouchMove(e: TouchEvent) {
    currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    if (diff > 0) sheetEl.style.transform = `translateY(${diff}px)`;
  }
  function onTouchEnd() {
    sheetEl.style.transition = '';
    const diff = currentY - startY;
    if (diff > 80) close();
    else sheetEl.style.transform = '';
    startY = 0;
    currentY = 0;
  }
</script>

<div
  class="bottom-sheet-backdrop"
  bind:this={backdropEl}
  on:click={close}
  on:keydown={(e) => e.key === 'Escape' && close()}
  role="button"
  tabindex="-1"
  aria-label="Close sheet"
></div>
<div class="bottom-sheet" bind:this={sheetEl} data-testid="professora-sheet">
  <div
    class="bottom-sheet-handle"
    on:touchstart={onTouchStart}
    on:touchmove={onTouchMove}
    on:touchend={onTouchEnd}
  ></div>
  <div class="bottom-sheet-title">Manage categories</div>
  <div class="bottom-sheet-body">
    <slot />
  </div>
</div>
