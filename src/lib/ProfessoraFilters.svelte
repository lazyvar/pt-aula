<script lang="ts">
  import { catConfig } from '../stores/cards';
  import { professoraFilters } from '../stores/professoraFilters';

  function toggleStatus(key: 'studying' | 'complete') {
    professoraFilters.update((f) => ({ ...f, [key]: !f[key] }));
  }

  function toggleCat(id: string) {
    professoraFilters.update((f) => {
      const set = new Set(f.categoryIds);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...f, categoryIds: Array.from(set) };
    });
  }

  // Show only non-unmarked categories as chips, in insertion order.
  $: categoryChips = Object.entries($catConfig).filter(([, c]) => c.status !== 'unmarked');
</script>

<div class="filters">
  <div class="status-chips">
    <button
      type="button"
      class="chip"
      class:on={$professoraFilters.studying}
      data-testid="filter-status-studying"
      aria-pressed={$professoraFilters.studying}
      on:click={() => toggleStatus('studying')}
    >Studying</button>
    <button
      type="button"
      class="chip"
      class:on={$professoraFilters.complete}
      data-testid="filter-status-complete"
      aria-pressed={$professoraFilters.complete}
      on:click={() => toggleStatus('complete')}
    >Complete</button>
  </div>

  {#if categoryChips.length > 0}
    <div class="cat-chips">
      {#each categoryChips as [id, cfg] (id)}
        <button
          type="button"
          class="chip small"
          class:on={$professoraFilters.categoryIds.includes(id)}
          data-testid="filter-cat"
          data-cat-id={id}
          aria-pressed={$professoraFilters.categoryIds.includes(id)}
          on:click={() => toggleCat(id)}
        >{cfg.label}</button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .filters { padding: 12px 20px; display: flex; flex-direction: column; gap: 10px; }
  .status-chips, .cat-chips { display: flex; gap: 8px; flex-wrap: wrap; }
  .chip {
    padding: 6px 14px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.15);
    background: transparent;
    color: var(--text-dim, #8892a4);
    cursor: pointer;
    font-size: 0.9rem;
  }
  .chip.small { padding: 4px 10px; font-size: 0.8rem; }
  .chip.on {
    background: var(--accent, #e94560);
    color: white;
    border-color: transparent;
  }
</style>
