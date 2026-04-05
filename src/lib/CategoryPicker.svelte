<script lang="ts">
  import { allCards, catConfig } from '../stores/cards';
  import { session } from '../stores/session';
  import { toggleCat } from '../stores/session';
  import { groupCollapseState } from '../stores/ui';
  import type { Card } from '../types';

  export let prefix: 'side-' | 'mob-';

  // Reactive: compute groups from catConfig + activeCats + allCards
  $: activeCats = new Set($session.activeCats);
  $: groups = buildGroups($catConfig, $allCards, activeCats);

  function buildGroups(
    cfg: typeof $catConfig,
    cards: Card[],
    active: Set<string>,
  ) {
    const out: Record<string, Array<{ key: string; label: string; count: number; active: boolean }>> = {};
    for (const [key, val] of Object.entries(cfg)) {
      const group = val.group || 'Topics';
      if (!out[group]) out[group] = [];
      const count = cards.filter((c) => c.cat === key).length;
      out[group].push({ key, label: val.label, count, active: active.has(key) });
    }
    return out;
  }

  function toggleGroup(stateKey: string) {
    groupCollapseState.update((s) => ({
      ...s,
      [stateKey]: s[stateKey] === false ? true : false,
    }));
  }

  function onFilterClick(catKey: string) {
    toggleCat(catKey, $allCards);
  }

  function onChipClick(catKey: string) {
    toggleCat(catKey, $allCards);
  }

  $: selectedChips = $session.activeCats
    .map((key) => ({ key, cc: $catConfig[key] }))
    .filter((x) => x.cc);
</script>

{#if selectedChips.length > 0}
  <div class="selected-section">
    <div class="selected-label">Selected</div>
    <div class="selected-chips">
      {#each selectedChips as { key, cc } (key)}
        <button class="chip" on:click={() => onChipClick(key)}>
          {cc.label} <span class="chip-x">✕</span>
        </button>
      {/each}
    </div>
  </div>
{/if}

{#each Object.entries(groups) as [groupName, cats] (groupName)}
  {@const stateKey = prefix + groupName}
  {@const collapsed = $groupCollapseState[stateKey] !== false}
  <div class="cat-group">
    <div
      class="cat-group-header {collapsed ? 'collapsed' : ''}"
      on:click={() => toggleGroup(stateKey)}
      on:keydown={(e) => e.key === 'Enter' && toggleGroup(stateKey)}
      role="button"
      tabindex="0"
    >
      <span>{groupName}</span>
      <span class="chevron">&#9660;</span>
    </div>
    <div class="cat-group-items {collapsed ? 'hidden' : ''}">
      {#each cats as c (c.key)}
        <button
          class="filter-btn {c.active ? 'active' : ''}"
          data-testid="category-filter"
          data-category-key={c.key}
          on:click={() => onFilterClick(c.key)}
        >
          {c.label} ({c.count})
        </button>
      {/each}
    </div>
  </div>
{/each}
