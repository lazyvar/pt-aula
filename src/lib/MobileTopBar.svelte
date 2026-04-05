<script lang="ts">
  import { session, deck } from '../stores/session';
  import { catConfig } from '../stores/cards';
  import { sheetOpen } from '../stores/ui';

  $: remaining = Math.max(0, $deck.length - $session.currentIndex);

  $: label = (() => {
    const activeCats = $session.activeCats;
    const total = Object.keys($catConfig).length;
    if (activeCats.length === 0 || activeCats.length === total) return 'All Categories';
    if (activeCats.length === 1) {
      return $catConfig[activeCats[0]]?.label || 'Categories';
    }
    return `${activeCats.length} selected`;
  })();
</script>

<div class="mobile-top-bar">
  <div class="stats">
    <span data-testid="mobile-counter-correct">
      <span class="dot green"></span> {$session.correct}
    </span>
    <span data-testid="mobile-counter-wrong">
      <span class="dot red"></span> {$session.wrong}
    </span>
    <span data-testid="mobile-counter-remaining">
      <span class="dot gray"></span> {remaining} left
    </span>
  </div>
  <button
    class="mobile-cat-dropdown"
    data-testid="mobile-cat-dropdown"
    on:click={() => sheetOpen.set(true)}
  >
    {label} ▾
  </button>
</div>
