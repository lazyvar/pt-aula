<script lang="ts">
  import { session, toggleMode, setMode, shuffleRemaining, startDeck, deleteSession } from '../stores/session';
  import { allCards, catConfig, hydrateCards } from '../stores/cards';
  import { resetStats } from '../stores/stats';
  import { generatingKind, generatedMode, generate, type GenerateKind } from '../stores/generated';
  import ConjugationsButton from './ConjugationsButton.svelte';
  import { snapshotDeck, applyGeneratedDeck, reviewDifficultCards } from '../stores/session';
  import { get } from 'svelte/store';
  import { difficultCount } from '../stores/difficulty';

  // When true (default), the mode-toggle button carries data-testid="mode-toggle".
  // Pass false in contexts where a second instance would create strict-mode violations.
  export let testIds = true;

  $: studyingCats = Object.entries($catConfig)
    .filter(([, cc]) => cc.status === 'studying')
    .map(([id]) => id);

  function onStudying() {
    session.update((s) => ({ ...s, activeCats: studyingCats }));
    startDeck(get(allCards));
  }

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

  async function onGenerate(kind: GenerateKind) {
    const err = await generate(
      { kind, activeCats: get(session).activeCats },
      { takeSnapshot: snapshotDeck, applyGenerated: applyGeneratedDeck },
    );
    if (err) alert(err);
  }
</script>

{#if $session.mode === 'listen-to-pt'}
  <button
    class="ctrl-btn"
    data-testid={testIds ? 'listen-exit' : undefined}
    on:click={() => setMode('pt-to-en')}
  >
    🃏 Flashcards
  </button>
{:else}
  <button class="ctrl-btn" data-testid={testIds ? 'mode-toggle' : undefined} data-mode={$session.mode} on:click={toggleMode}>
    🔁 {$session.mode === 'pt-to-en' ? 'PT → EN' : 'EN → PT'}
  </button>
  <button
    class="ctrl-btn"
    data-testid={testIds ? 'listen-enter' : undefined}
    on:click={() => setMode('listen-to-pt')}
  >
    🎧 Listen
  </button>
{/if}
<button class="ctrl-btn" on:click={() => shuffleRemaining($allCards)}>🔀 Shuffle</button>
<button
  class="ctrl-btn"
  data-testid="difficult-btn"
  on:click={() => reviewDifficultCards($allCards)}
  disabled={$difficultCount === 0}
>
  💪 Difficult ({$difficultCount})
</button>
<button
  class="ctrl-btn"
  data-testid="studying-btn"
  on:click={onStudying}
  disabled={studyingCats.length === 0}
>
  📚 Studying ({studyingCats.length})
</button>
<button class="ctrl-btn" on:click={onResetStats}>🧹 Reset Stats</button>
<button class="ctrl-btn" on:click={onReseed}>🌱 Reseed</button>
<button
  class="ctrl-btn gen-btn"
  on:click={() => onGenerate('sentences')}
  disabled={$generatingKind !== null || $generatedMode}
>
  {$generatingKind === 'sentences' ? '⏳ Generating…' : '✨ Sentences'}
</button>
<ConjugationsButton {testIds} />
