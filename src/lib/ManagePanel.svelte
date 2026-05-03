<script lang="ts">
  import { catConfig } from '../stores/cards';
  import { statusError } from '../stores/categoryStatus';
  import StatusPill from './StatusPill.svelte';

  export let showToggle = true;
  export let open = false;

  let groupOpen: Record<string, boolean> = {};
  function toggleGroup(name: string) {
    groupOpen = { ...groupOpen, [name]: !groupOpen[name] };
  }

  // Group categories by group_name; preserve insertion order from the server map.
  $: grouped = (() => {
    const map = new Map<string, Array<[string, typeof $catConfig[string]]>>();
    for (const [id, cfg] of Object.entries($catConfig)) {
      const g = cfg.group;
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push([id, cfg]);
    }
    return Array.from(map.entries());
  })();
</script>

<section class="manage" data-testid="manage-panel">
  {#if showToggle}
    <button
      type="button"
      class="toggle"
      data-testid="manage-panel-toggle"
      aria-expanded={open}
      on:click={() => (open = !open)}
    >
      {open ? '▾' : '▸'} Manage categories
    </button>
  {/if}

  {#if $statusError}
    <div class="error-toast" data-testid="manage-error">{$statusError}</div>
  {/if}

  {#if open}
    <div class="body" data-testid="manage-panel-body">
      <div class="groups-grid">
        {#each grouped as [groupName, entries]}
          <div class="group-card" class:expanded={groupOpen[groupName]}>
            <button
              type="button"
              class="group-toggle"
              data-testid="manage-group-toggle"
              data-group-name={groupName}
              aria-expanded={!!groupOpen[groupName]}
              on:click={() => toggleGroup(groupName)}
            >
              <span class="group-label">{groupName}</span>
              <span class="group-count">{entries.length}</span>
              <svg class="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 6 15 12 9 18"></polyline>
              </svg>
            </button>
            {#if groupOpen[groupName]}
              <ul class="rows">
                {#each entries as [id, cfg] (id)}
                  <li class="row" data-testid="manage-row" data-cat-id={id}>
                    <span class="label">{cfg.label}</span>
                    <StatusPill categoryId={id} status={cfg.status} />
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</section>

<style>
  .manage { padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .toggle {
    background: transparent;
    border: none;
    color: var(--text, #f0f0f0);
    font-size: 0.95rem;
    cursor: pointer;
    padding: 6px 0;
  }
  .error-toast {
    margin: 8px 0;
    padding: 8px 12px;
    background: rgba(231,76,60,0.15);
    border: 1px solid rgba(231,76,60,0.4);
    border-radius: 6px;
    color: #ffb4ab;
    font-size: 0.85rem;
  }
  .body { margin-top: 12px; max-height: 50vh; overflow-y: auto; }

  .groups-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .group-card {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    overflow: hidden;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .group-card.expanded {
    grid-column: 1 / -1;
    background: rgba(255,255,255,0.04);
    border-color: rgba(255,255,255,0.1);
  }

  .group-toggle {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 12px 14px;
    background: transparent;
    border: none;
    cursor: pointer;
    font-family: inherit;
    color: var(--text-dim, #8892a4);
    font-size: 0.78rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    gap: 8px;
  }
  .group-toggle:hover { color: var(--text, #f0f0f0); background: rgba(255,255,255,0.03); }
  .group-card.expanded .group-toggle { color: var(--text, #f0f0f0); }

  .group-label { flex: 1; text-align: left; }

  .group-count {
    font-weight: 500;
    opacity: 0.55;
    font-size: 0.72rem;
  }

  .chevron { transition: transform 0.15s ease; flex-shrink: 0; }
  .group-card.expanded .chevron { transform: rotate(90deg); }

  .rows {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 4px 12px;
    padding: 0 12px 12px;
    margin-top: 0;
  }

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 6px 8px;
    border-radius: 6px;
  }
  .row:hover { background: rgba(255,255,255,0.03); }
  .label { font-size: 0.9rem; color: var(--text, #f0f0f0); }

  @media (max-width: 768px) {
    .groups-grid { grid-template-columns: 1fr; gap: 6px; }
    .group-card.expanded { grid-column: 1; }
    .rows { grid-template-columns: 1fr; }
  }
</style>
