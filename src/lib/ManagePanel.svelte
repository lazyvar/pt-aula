<script lang="ts">
  import { catConfig } from '../stores/cards';
  import { statusError } from '../stores/categoryStatus';
  import StatusPill from './StatusPill.svelte';

  export let defaultOpen = false;
  let open = defaultOpen;

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
  <button
    type="button"
    class="toggle"
    data-testid="manage-panel-toggle"
    aria-expanded={open}
    on:click={() => (open = !open)}
  >
    {open ? '▾' : '▸'} Manage categories
  </button>

  {#if $statusError}
    <div class="error-toast" data-testid="manage-error">{$statusError}</div>
  {/if}

  {#if open}
    <div class="body" data-testid="manage-panel-body">
      {#each grouped as [groupName, entries]}
        <div class="group">
          <h3 class="group-name">{groupName}</h3>
          <ul class="rows">
            {#each entries as [id, cfg]}
              <li class="row" data-testid="manage-row" data-cat-id={id}>
                <span class="label">{cfg.label}</span>
                <StatusPill categoryId={id} status={cfg.status} />
              </li>
            {/each}
          </ul>
        </div>
      {/each}
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
  .body { margin-top: 12px; display: flex; flex-direction: column; gap: 16px; }
  .group-name {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-dim, #8892a4);
    margin-bottom: 6px;
  }
  .rows { list-style: none; display: flex; flex-direction: column; gap: 6px; }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .label { font-size: 0.95rem; }
</style>
