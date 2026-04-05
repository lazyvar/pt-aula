<script lang="ts">
  import { onMount } from 'svelte';
  import { allCards, hydrateCards, getDefaultActiveCats, catConfig } from './stores/cards';
  import { statsCache, hydrateStats } from './stores/stats';
  import { session, hydrateSession, startDeck, deck, flushSession } from './stores/session';
  import { get } from 'svelte/store';

  let loaded = false;
  let error: string | null = null;

  onMount(() => {
    (async () => {
      try {
        await hydrateCards();
        await hydrateStats();
        const restored = await hydrateSession(get(allCards));
        if (!restored) {
          // First boot: set default activeCats, then startDeck
          const defaults = getDefaultActiveCats();
          session.update((s) => ({ ...s, activeCats: defaults }));
          startDeck(get(allCards));
        }
        loaded = true;
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      }
    })();

    window.addEventListener('beforeunload', flushSession);
    return () => window.removeEventListener('beforeunload', flushSession);
  });
</script>

{#if error}
  <main><p style="color:red">Error: {error}</p></main>
{:else if !loaded}
  <main><p>Loading…</p></main>
{:else}
  <main>
    <h1>Svelte scaffold — hydrated</h1>
    <p>Cards loaded: {$allCards.length}</p>
    <p>Categories: {Object.keys($catConfig).length}</p>
    <p>Stats entries: {Object.keys($statsCache).length}</p>
    <p>Session mode: {$session.mode}</p>
    <p>Active cats: {$session.activeCats.length}</p>
    <p>Deck size: {$deck.length}</p>
    <p>currentIndex: {$session.currentIndex}</p>
  </main>
{/if}

<style>
  main { padding: 40px; font-family: 'DM Sans', sans-serif; }
  p { margin: 4px 0; }
</style>
