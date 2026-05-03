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
  <div class="right-cluster">
    <a
      href="/professora"
      class="prof-entry"
      data-testid="professora-entry-mobile"
      aria-label="Professora view"
      title="Professora view"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    </a>
    <button
      class="mobile-cat-dropdown"
      data-testid="mobile-cat-dropdown"
      on:click={() => sheetOpen.set(true)}
    >
      {label} ▾
    </button>
  </div>
</div>

<style>
  .right-cluster { display: flex; align-items: center; gap: 8px; }
  .prof-entry {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    color: var(--text-dim, #8892a4);
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    text-decoration: none;
  }
</style>
