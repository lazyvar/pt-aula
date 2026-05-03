<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { hydrateCards } from './stores/cards';
  import ProfessoraDesktop from './lib/ProfessoraDesktop.svelte';
  import ProfessoraMobile from './lib/ProfessoraMobile.svelte';

  let loaded = false;
  let error: string | null = null;
  let isMobile = false;

  // Standard mobile breakpoint (matches the existing app's split). Re-evaluate on resize.
  let mql: MediaQueryList | null = null;
  function syncIsMobile() {
    if (mql) isMobile = mql.matches;
  }

  onMount(() => {
    mql = window.matchMedia('(max-width: 768px)');
    syncIsMobile();
    mql.addEventListener('change', syncIsMobile);

    (async () => {
      try {
        await hydrateCards();
        loaded = true;
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      }
    })();
  });

  onDestroy(() => {
    if (mql) mql.removeEventListener('change', syncIsMobile);
  });
</script>

{#if error}
  <main data-testid="professora-page" class="professora-root" style="padding:40px;color:red">Error: {error}</main>
{:else if !loaded}
  <main data-testid="professora-page" class="professora-root" style="padding:40px">Loading…</main>
{:else}
  <main data-testid="professora-page" class="professora-root">
    {#if isMobile}
      <ProfessoraMobile />
    {:else}
      <ProfessoraDesktop />
    {/if}
  </main>
{/if}

<style>
  /* Lift above the body::before gradient overlay (z-index: 0) */
  .professora-root {
    position: relative;
    z-index: 1;
  }
</style>
