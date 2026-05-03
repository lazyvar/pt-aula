<script lang="ts">
  import { professoraFilters } from '../stores/professoraFilters';

  function toggle(key: 'studying' | 'complete') {
    professoraFilters.update((f) => ({ ...f, [key]: !f[key] }));
  }
</script>

<div class="filters">
  <div class="status-chips">
    <button
      type="button"
      class="chip"
      class:on={$professoraFilters.studying}
      data-testid="filter-status-studying"
      aria-pressed={$professoraFilters.studying}
      on:click={() => toggle('studying')}
    >Studying</button>
    <button
      type="button"
      class="chip"
      class:on={$professoraFilters.complete}
      data-testid="filter-status-complete"
      aria-pressed={$professoraFilters.complete}
      on:click={() => toggle('complete')}
    >Complete</button>
  </div>
</div>

<style>
  .filters { padding: 12px 20px; }
  .status-chips { display: flex; gap: 8px; }
  .chip {
    padding: 6px 14px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.15);
    background: transparent;
    color: var(--text-dim, #8892a4);
    cursor: pointer;
    font-size: 0.9rem;
  }
  .chip.on {
    background: var(--accent, #e94560);
    color: white;
    border-color: transparent;
  }
</style>
