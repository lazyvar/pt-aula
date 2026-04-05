<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import Sidebar from './lib/Sidebar.svelte';
  import BottomSheet from './lib/BottomSheet.svelte';
  import MobileTopBar from './lib/MobileTopBar.svelte';
  import CardDeck from './lib/CardDeck.svelte';

  import { allCards, hydrateCards, getDefaultActiveCats } from './stores/cards';
  import { hydrateStats } from './stores/stats';
  import { session, hydrateSession, startDeck, deck, flushSession, reviewWrongCards, wrongCardsList } from './stores/session';
  import { generatedMode, generatedCards, exitGenerated } from './stores/generated';
  import { restoreSnapshot } from './stores/session';

  let loaded = false;
  let error: string | null = null;
  let cardDeckRef: CardDeck | undefined;

  $: isFinished = loaded && $deck.length > 0 && $session.currentIndex >= $deck.length;
  $: isEmpty = loaded && $deck.length === 0;
  $: isActive = loaded && !isEmpty && !isFinished;

  function onKeydown(e: KeyboardEvent) {
    // Delegate to CardDeck when active. Other states have no shortcuts.
    if (isActive && cardDeckRef) {
      cardDeckRef.handleKeydown(e);
    }
  }

  function onExitGenerated() {
    exitGenerated(restoreSnapshot);
  }

  onMount(() => {
    (async () => {
      try {
        await hydrateCards();
        await hydrateStats();
        const restored = await hydrateSession(get(allCards));
        if (restored === null) {
          // No session row exists (first boot): apply default activeCats then startDeck.
          session.update((s) => ({ ...s, activeCats: getDefaultActiveCats() }));
          startDeck(get(allCards));
        } else if (!restored) {
          // Session exists but deck is empty (e.g. all categories toggled off).
          // Rebuild the deck from the restored activeCats without overriding them.
          startDeck(get(allCards));
        }
        loaded = true;
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      }
    })();

    window.addEventListener('beforeunload', flushSession);
    window.addEventListener('keydown', onKeydown);
  });

  onDestroy(() => {
    window.removeEventListener('beforeunload', flushSession);
    window.removeEventListener('keydown', onKeydown);
  });
</script>

{#if error}
  <main style="padding:40px"><p style="color:red">Error: {error}</p></main>
{:else if !loaded}
  <main style="padding:40px"><p>Loading…</p></main>
{:else}
  {#if $generatedMode}
    <div class="gen-banner">
      <span>✨ Generated Mode · {$generatedCards.length} sentences</span>
      <button on:click={onExitGenerated}>Exit</button>
    </div>
  {/if}

  <div class="layout">
    <Sidebar />
    <div class="main-content">
      <MobileTopBar />
      {#if isEmpty}
        <div class="card-area">
          <div class="done-screen animate-in">
            <div style="font-size:3rem;margin-bottom:16px">🦜</div>
            <h2>Cadê as cartas?</h2>
            <p style="margin-top:8px">Pick some topics from the sidebar<br>and let's get studying!</p>
          </div>
        </div>
      {:else if isFinished}
        <div class="card-area">
          {#if $wrongCardsList.length > 0}
            <div class="done-screen animate-in">
              <h2>Round done!</h2>
              <p>You finished {$deck.length} cards</p>
              <div class="stats" style="margin-bottom:20px; font-size:1rem;">
                <span><span class="dot green"></span> {$session.correct} correct</span>
                <span><span class="dot red"></span> {$session.wrong} wrong</span>
              </div>
              <p style="font-size:0.95rem;">
                {$wrongCardsList.length} card{$wrongCardsList.length === 1 ? '' : 's'} to review
              </p>
              <button
                class="btn btn-wrong"
                on:click={reviewWrongCards}
                style="margin:20px auto 0;"
              >Review Wrong Cards</button>
            </div>
          {:else}
            <div class="done-screen animate-in">
              <h2>Parabéns! 🎉</h2>
              <p>You got all {$deck.length} cards right!</p>
              <div class="stats" style="margin-bottom:20px; font-size:1rem;">
                <span><span class="dot green"></span> {$session.correct} correct</span>
              </div>
              <p style="font-size:0.95rem;">100% accuracy</p>
              <button
                class="btn btn-right"
                on:click={() => startDeck($allCards)}
                style="margin:20px auto 0;"
              >Study Again</button>
            </div>
          {/if}
        </div>
      {:else}
        <CardDeck bind:this={cardDeckRef} />
      {/if}
    </div>
  </div>
  <BottomSheet />
{/if}
