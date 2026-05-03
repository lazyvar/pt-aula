<script lang="ts">
  import { allCards, catConfig } from '../stores/cards';
  import { professoraFilters } from '../stores/professoraFilters';

  $: includedCatIds = (() => {
    const cfg = $catConfig;
    const f = $professoraFilters;
    const passing = new Set<string>();
    for (const [id, c] of Object.entries(cfg)) {
      if (c.status === 'studying' && f.studying) passing.add(id);
      else if (c.status === 'complete' && f.complete) passing.add(id);
    }
    if (f.categoryIds.length > 0) {
      const restrict = new Set(f.categoryIds);
      for (const id of Array.from(passing)) {
        if (!restrict.has(id)) passing.delete(id);
      }
    }
    return passing;
  })();

  $: visibleCards = $allCards.filter((c) => includedCatIds.has(c.cat));

  // True when no category has a non-unmarked status (i.e. nothing to ever show).
  $: noMarked = Object.values($catConfig).every((c) => c.status === 'unmarked');
  // True when both status filter chips are off.
  $: noFilter = !$professoraFilters.studying && !$professoraFilters.complete;
</script>

<div class="grid-wrapper">
  {#if noMarked}
    <div class="empty" data-testid="grid-empty-no-marked">
      No categories marked yet — open Manage to set some.
    </div>
  {:else if noFilter}
    <div class="empty" data-testid="grid-empty-no-filter">
      Pick a status filter.
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
  .grid-wrapper { padding: 12px 20px 40px; }
  .empty {
    padding: 32px 20px;
    text-align: center;
    color: var(--text-dim, #8892a4);
    font-size: 0.95rem;
  }
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
  }
  .tile {
    background: var(--card-front, #1a1a2e);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    padding: 14px 16px;
  }
  .pt { font-size: 1.05rem; color: var(--text, #f0f0f0); margin-bottom: 4px; }
  .en { font-size: 0.85rem; color: var(--text-dim, #8892a4); }
  @media (max-width: 768px) {
    .card-grid { grid-template-columns: 1fr; }
  }
</style>
