<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { session } from '../stores/session';
  import { snapshotDeck, applyGeneratedDeck } from '../stores/session';
  import { generatingKind, generatedMode, generate } from '../stores/generated';
  import { TENSES, type TenseValue } from './tenses';

  // When true (default), surface test ids on the trigger + popover.
  // Pass false in the mobile bottom-sheet copy to avoid strict-mode
  // selector violations.
  export let testIds = true;

  const STORAGE_KEY = 'pt-aula:conjugation-tenses';
  const ALL_VALUES: readonly TenseValue[] = TENSES.map((t) => t.value);

  let popoverOpen = false;
  let triggerEl: HTMLButtonElement;
  let popoverEl: HTMLDivElement;
  let selected: Set<TenseValue> = new Set(ALL_VALUES);

  // Hydrate from localStorage. Drop unknown values; fall back to all-six
  // if missing or corrupt.
  onMount(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === null) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const allowed = new Set<TenseValue>(ALL_VALUES);
      const next: Set<TenseValue> = new Set(
        parsed.filter((v): v is TenseValue => typeof v === 'string' && allowed.has(v as TenseValue)),
      );
      // Valid array (including empty) wins. Unparseable JSON is caught below.
      selected = next;
    } catch {
      // Corrupt JSON or missing API — keep the all-six default.
    }
  });

  function persist() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...selected]));
    } catch {
      // localStorage may be disabled; ignore.
    }
  }

  function toggle(value: TenseValue, checked: boolean) {
    if (checked) selected.add(value);
    else selected.delete(value);
    selected = selected; // reactive nudge
    persist();
  }

  function onCheckboxChange(value: TenseValue, e: Event) {
    toggle(value, (e.currentTarget as HTMLInputElement).checked);
  }

  function openPopover() {
    if ($generatingKind !== null || $generatedMode) return;
    popoverOpen = true;
  }

  function closePopover() {
    popoverOpen = false;
  }

  async function onGenerate() {
    if (selected.size === 0) return;
    closePopover();
    const err = await generate(
      {
        kind: 'conjugations',
        activeCats: get(session).activeCats,
        tenses: [...selected],
      },
      { takeSnapshot: snapshotDeck, applyGenerated: applyGeneratedDeck },
    );
    if (err) alert(err);
  }

  function onDocumentClick(e: MouseEvent) {
    if (!popoverOpen) return;
    const target = e.target as Node | null;
    if (!target) return;
    if (popoverEl?.contains(target)) return;
    if (triggerEl?.contains(target)) return;
    closePopover();
  }

  function onDocumentKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && popoverOpen) closePopover();
  }

  onMount(() => {
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onDocumentKeydown);
  });
  onDestroy(() => {
    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener('keydown', onDocumentKeydown);
  });
</script>

<div class="conjugations-wrap">
  <button
    type="button"
    class="ctrl-btn gen-btn"
    bind:this={triggerEl}
    on:click={openPopover}
    disabled={$generatingKind !== null || $generatedMode}
  >
    {$generatingKind === 'conjugations' ? '⏳ Generating…' : '✨ Conjugations'}
  </button>

  {#if popoverOpen}
    <div
      class="tense-popover"
      bind:this={popoverEl}
      data-testid={testIds ? 'conjugation-tense-popover' : undefined}
      role="dialog"
      aria-label="Choose tenses"
    >
      <ul class="tense-list">
        {#each TENSES as tense (tense.value)}
          <li>
            <label>
              <input
                type="checkbox"
                checked={selected.has(tense.value)}
                on:change={(e) => onCheckboxChange(tense.value, e)}
              />
              <span>{tense.label}</span>
            </label>
          </li>
        {/each}
      </ul>
      <button
        type="button"
        class="ctrl-btn gen-btn tense-generate"
        data-testid={testIds ? 'conjugation-generate' : undefined}
        on:click={onGenerate}
        disabled={selected.size === 0}
      >
        Generate
      </button>
    </div>
  {/if}
</div>

<style>
  .conjugations-wrap {
    position: relative;
    display: block;
  }
  .tense-popover {
    position: absolute;
    bottom: 100%;
    left: 0;
    margin-bottom: 8px;
    background: var(--card-front, #1a1a2e);
    color: var(--text, #f0f0f0);
    border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
    padding: 10px 12px;
    min-width: 220px;
    z-index: 50;
  }
  .tense-list {
    list-style: none;
    margin: 0 0 8px 0;
    padding: 0;
  }
  .tense-list li {
    margin: 4px 0;
  }
  .tense-list label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 0.95rem;
  }
  .tense-generate {
    width: 100%;
  }
</style>
