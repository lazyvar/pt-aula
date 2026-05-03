<script lang="ts">
  import { catConfig } from '../stores/cards';
  import { professoraFilters } from '../stores/professoraFilters';

  export let manageOpen = false;
  export let manageTestId: string = 'manage-panel-toggle';
  export let onManageClick: (() => void) | null = null;
  export let showCaret: boolean = true;

  function handleManageClick() {
    if (onManageClick) onManageClick();
    else manageOpen = !manageOpen;
  }

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

  // Show only categories whose status matches an active status filter chip.
  $: categoryChips = Object.entries($catConfig).filter(([, c]) => {
    if (c.status === 'studying' && $professoraFilters.studying) return true;
    if (c.status === 'complete' && $professoraFilters.complete) return true;
    return false;
  });
</script>

<div class="filters">
  <div class="filter-row">
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
    <button
      type="button"
      class="filters-manage-trigger"
      data-testid={manageTestId}
      aria-expanded={manageOpen}
      on:click={handleManageClick}
    >
      {#if showCaret}<span class="caret">{manageOpen ? '▾' : '▸'}</span>{/if}
      Manage categories
    </button>
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

  .filter-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .status-chips, .cat-chips { display: flex; gap: 8px; flex-wrap: wrap; }
  .cat-chips {
    margin-top: 6px;
    padding-top: 12px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }

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

  .filters-manage-trigger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.15);
    background: transparent;
    color: var(--text-dim, #8892a4);
    cursor: pointer;
    font-size: 0.9rem;
    font-family: inherit;
  }
  .filters-manage-trigger:hover {
    color: var(--text, #f0f0f0);
    background: rgba(255,255,255,0.04);
  }
  .filters-manage-trigger .caret { font-size: 0.7rem; opacity: 0.8; }
</style>
