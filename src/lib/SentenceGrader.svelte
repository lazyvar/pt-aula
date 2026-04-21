<script lang="ts">
  import { graderState, graderResult, graderInput, graderError, submit, giveUp, reset } from '../stores/grader';
  import { catConfig } from '../stores/cards';
  import type { Card } from '../types';

  export let card: Card;
  export let onAdvance: (gotIt: boolean) => void;

  // Reset when card identity changes (new card shown).
  let lastPt: string | undefined;
  $: if (card && card.pt !== lastPt) {
    lastPt = card.pt;
    reset();
  }

  $: cc = $catConfig[card.cat] || { cls: 'cat-generated', label: '✨ Generated', group: '' };

  async function onSubmit() {
    await submit(card);
  }

  function onGiveUp() {
    giveUp();
  }

  function onNext() {
    if (!$graderResult) return;
    const gotIt = $graderResult.grade >= 2;
    onAdvance(gotIt);
  }

  function onInputKeydown(e: KeyboardEvent) {
    // Cmd/Ctrl+Enter submits from a textarea. Plain Enter inserts a newline
    // so longer sentences aren't accidentally submitted mid-thought.
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSubmit();
    }
  }

  function onPageKeydown(e: KeyboardEvent) {
    if ($graderState === 'graded' && e.key === 'Enter') {
      e.preventDefault();
      onNext();
    }
  }
</script>

<svelte:window on:keydown={onPageKeydown} />

<div class="grader" data-testid="sentence-grader">
  <div class="card grader-card">
    <span class="category-tag {cc.cls}">{cc.label}</span>
    <div class="card-label">English</div>
    <div class="card-word" data-testid="grader-prompt">{card.en}</div>
  </div>

  {#if $graderState === 'idle'}
    <textarea
      class="grader-input"
      data-testid="grader-input"
      placeholder="Type the Portuguese translation…"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      rows="3"
      bind:value={$graderInput}
      on:keydown={onInputKeydown}
    ></textarea>
    {#if $graderError}
      <div class="grader-error" data-testid="grader-error">{$graderError}</div>
    {/if}
    <div class="grader-actions">
      <button
        class="btn btn-right"
        data-testid="grader-submit"
        on:click={onSubmit}
        disabled={!$graderInput.trim()}
      >Submit</button>
      <button
        class="btn btn-wrong"
        data-testid="grader-giveup"
        on:click={onGiveUp}
      >Give up</button>
    </div>
    <div class="keyboard-hint">Cmd/Ctrl+Enter to submit</div>
  {:else if $graderState === 'grading'}
    <div class="grader-loading" data-testid="grader-loading">Grading…</div>
  {:else if $graderResult}
    <div class="grader-verdict" data-testid="grader-verdict">
      <div class="grader-grade grade-{$graderResult.grade}" data-testid="grader-grade">
        {$graderResult.grade}/3
      </div>
      <div class="grader-summary">{$graderResult.summary}</div>
    </div>

    <div class="grader-reference" data-testid="grader-reference">
      <div class="card-label">Reference</div>
      <div class="card-word">{card.pt}</div>
    </div>

    {#if $graderResult.mistakes.length > 0}
      <ul class="grader-mistakes" data-testid="grader-mistakes">
        {#each $graderResult.mistakes as m}
          <li>{m}</li>
        {/each}
      </ul>
    {/if}

    {#if $graderResult.rule}
      <div class="grader-rule" data-testid="grader-rule">
        <strong>Rule:</strong> {$graderResult.rule}
      </div>
    {/if}

    <button class="btn btn-right" data-testid="grader-next" on:click={onNext}>Next →</button>
    <div class="keyboard-hint">Enter = next card</div>
  {/if}
</div>

<style>
  .grader {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
  }
  .grader-card {
    padding: 16px;
    border-radius: 12px;
    background: var(--card-bg, #1f2937);
  }
  .grader-input {
    width: 100%;
    padding: 10px 12px;
    font-size: 1rem;
    border-radius: 8px;
    border: 1px solid var(--border, #374151);
    background: var(--input-bg, #111827);
    color: inherit;
    resize: vertical;
    font-family: inherit;
  }
  .grader-actions {
    display: flex;
    gap: 8px;
  }
  .grader-verdict {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .grader-grade {
    font-size: 2rem;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 8px;
  }
  .grade-3 { background: #10b981; color: white; }
  .grade-2 { background: #f59e0b; color: white; }
  .grade-1 { background: #ef4444; color: white; }
  .grader-summary { flex: 1; font-size: 0.95rem; }
  .grader-reference {
    padding: 12px;
    border-radius: 8px;
    background: var(--card-bg, #1f2937);
  }
  .grader-mistakes {
    margin: 0;
    padding-left: 20px;
    font-size: 0.9rem;
  }
  .grader-mistakes li { margin: 4px 0; }
  .grader-rule {
    padding: 10px 12px;
    border-radius: 8px;
    background: var(--accent-bg, #1e3a8a);
    font-size: 0.9rem;
    line-height: 1.4;
  }
  .grader-loading {
    padding: 20px;
    text-align: center;
    color: var(--text-dim, #9ca3af);
  }
  .grader-error {
    color: #ef4444;
    font-size: 0.85rem;
  }
</style>
