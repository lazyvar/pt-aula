<script lang="ts">
  import { session, toggleMode, shuffleRemaining, startDeck, deleteSession } from '../stores/session';
  import { allCards, hydrateCards } from '../stores/cards';
  import { resetStats } from '../stores/stats';
  import { isGenerating, generatedMode, generate } from '../stores/generated';
  import { snapshotDeck, applyGeneratedDeck } from '../stores/session';
  import { get } from 'svelte/store';

  // When true (default), the mode-toggle button carries data-testid="mode-toggle".
  // Pass false in contexts where a second instance would create strict-mode violations.
  export let testIds = true;

  async function onResetStats() {
    await resetStats();
    await deleteSession();
    startDeck(get(allCards));
  }

  async function onReseed() {
    await fetch('/api/reseed', { method: 'POST' });
    await hydrateCards();
    session.update((s) => ({ ...s, activeCats: [] }));
    startDeck(get(allCards));
  }

  async function onGenerate() {
    const err = await generate(
      get(session).activeCats,
      snapshotDeck,
      applyGeneratedDeck,
    );
    if (err) alert(err);
  }
</script>

<button class="ctrl-btn" data-testid={testIds ? 'mode-toggle' : undefined} on:click={toggleMode}>
  {$session.mode === 'pt-to-en' ? 'PT → EN' : 'EN → PT'}
</button>
<button class="ctrl-btn" on:click={() => shuffleRemaining($allCards)}>Shuffle</button>
<button class="ctrl-btn" on:click={onResetStats}>Reset Stats</button>
<button class="ctrl-btn" on:click={onReseed}>Reseed</button>
<button
  class="ctrl-btn gen-btn"
  on:click={onGenerate}
  disabled={$isGenerating || $generatedMode}
>
  {$isGenerating ? '⏳ Generating…' : '✨ Generate'}
</button>
