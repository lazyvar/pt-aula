<script lang="ts">
  import { allCards, catConfig } from '../stores/cards';
  import { professoraFilters } from '../stores/professoraFilters';

  $: includedCatIds = (() => {
    const cfg = $catConfig;
    const f = $professoraFilters;
    const restrict = new Set(f.categoryIds);
    const passing = new Set<string>();
    for (const [id, c] of Object.entries(cfg)) {
      if (!restrict.has(id)) continue;
      if (c.status === 'studying' && f.studying) passing.add(id);
      else if (c.status === 'complete' && f.complete) passing.add(id);
    }
    return passing;
  })();

  $: visibleCards = $allCards.filter((c) => includedCatIds.has(c.cat));

  // True when no category has a non-unmarked status (i.e. nothing to ever show).
  $: noMarked = Object.values($catConfig).every((c) => c.status === 'unmarked');
  // True when both status filter chips are off.
  $: noFilter = !$professoraFilters.studying && !$professoraFilters.complete;
  // True when the user hasn't picked any category chip yet.
  $: noCategorySelected = $professoraFilters.categoryIds.length === 0;
</script>

<div class="grid-wrapper">
  {#if noMarked}
    <div class="empty" data-testid="grid-empty-no-marked">
      <p>No categories marked yet.</p>
    </div>
  {:else if noFilter}
    <div class="empty" data-testid="grid-empty-no-filter">
      <p>Pick a status filter.</p>
    </div>
  {:else if noCategorySelected}
    <div class="empty" data-testid="grid-empty-no-cat">
      <p>Pick a category.</p>
    </div>
  {:else}
    <div class="card-grid" data-testid="card-grid">
      {#each visibleCards as card}
        <!-- Unkeyed: seed cards include duplicate `pt` strings across categories
             (e.g. "Medo" appears in multiple groups), so a `(card.pt)` key would
             crash with "Cannot have duplicate keys". The grid is read-only and
             has no per-tile state, so positional reuse is fine. -->
        <div class="tile" data-testid="card-tile">
          <div class="pt">{card.pt}</div>
          <div class="en">{card.en}</div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .grid-wrapper { padding: 4px 28px 40px; }

  .empty {
    min-height: 45vh;
    padding: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-dim, #8892a4);
  }
  .empty p {
    margin: 0;
    font-size: 1rem;
    font-style: italic;
    opacity: 0.55;
    text-align: center;
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
    margin-top: 8px;
  }
  .tile {
    background: linear-gradient(145deg, var(--card-front, #1a1a2e), #12122a);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 12px;
    padding: 14px 16px;
    transition: border-color 0.15s ease, transform 0.15s ease;
  }
  .tile:hover {
    border-color: rgba(255,255,255,0.12);
    transform: translateY(-1px);
  }
  .pt {
    font-size: 1.05rem;
    color: var(--text, #f0f0f0);
    margin-bottom: 4px;
    font-weight: 500;
  }
  .en {
    font-size: 0.85rem;
    color: var(--text-dim, #8892a4);
  }
  @media (max-width: 768px) {
    .grid-wrapper { padding: 4px 18px 56px; }
    .card-grid { grid-template-columns: 1fr; }
    .empty { padding: 40px 16px 48px; }
  }
</style>
