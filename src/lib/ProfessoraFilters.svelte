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
  <section class="filter-section">
    <span class="eyebrow">Filter</span>
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
  </section>

  {#if categoryChips.length > 0}
    <section class="filter-section">
      <span class="eyebrow">Categories</span>
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
    </section>
  {/if}
</div>

<style>
  .filters {
    padding: 18px 28px 20px;
    display: flex;
    flex-direction: column;
    gap: 22px;
  }

  .filter-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .filter-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .eyebrow {
    font-size: 0.62rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: var(--text-dim, #8892a4);
    opacity: 0.7;
  }

  .status-chips, .cat-chips { display: flex; gap: 8px; flex-wrap: wrap; }

  .chip {
    padding: 7px 16px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.02);
    color: var(--text-dim, #8892a4);
    cursor: pointer;
    font-family: inherit;
    font-size: 0.88rem;
    font-weight: 500;
    transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease, transform 0.05s ease;
  }
  .chip:hover { color: var(--text, #f0f0f0); border-color: rgba(255,255,255,0.22); }
  .chip:active { transform: scale(0.97); }
  .chip.small {
    padding: 5px 12px;
    font-size: 0.78rem;
    font-weight: 500;
  }
  .chip.on {
    background: var(--accent, #e94560);
    color: white;
    border-color: transparent;
  }
  .chip.on:hover { background: var(--accent, #e94560); border-color: transparent; }

  .filters-manage-trigger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.1);
    background: transparent;
    color: var(--text-dim, #8892a4);
    cursor: pointer;
    font-size: 0.78rem;
    font-family: inherit;
    transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
  }
  .filters-manage-trigger:hover {
    color: var(--text, #f0f0f0);
    background: rgba(255,255,255,0.04);
    border-color: rgba(255,255,255,0.2);
  }
  .filters-manage-trigger .caret { font-size: 0.65rem; opacity: 0.7; }

  @media (max-width: 768px) {
    .filters { padding: 14px 18px 18px; gap: 18px; }
  }
</style>
