<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { session, deck, mark as sessionMark } from '../stores/session';
  import { catConfig } from '../stores/cards';
  import { statsCache, markCard, getCardStats } from '../stores/stats';
  import { generatedMode } from '../stores/generated';
  import { normalizeForListening } from './cardId';
  import { type Card } from '../types';

  $: currentCard = $deck[$session.currentIndex] as Card | undefined;
  $: cc = currentCard
    ? $catConfig[currentCard.cat] || { cls: 'cat-generated', label: '✨ Generated', group: '' }
    : null;
  $: cardStats = currentCard ? getCardStats(currentCard) : { right: 0, wrong: 0 };
  $: showCardStats = cardStats.right > 0 || cardStats.wrong > 0;
  $: $statsCache, (cardStats = currentCard ? getCardStats(currentCard) : { right: 0, wrong: 0 });

  let audioEl: HTMLAudioElement | undefined;
  let inputEl: HTMLInputElement | undefined;
  let typed = '';
  let revealed = false;
  let lastVerdict: 'right' | 'wrong' | null = null;
  let audioStatus: 'ok' | 'missing-key' | 'upstream-error' = 'ok';
  let lastCardPt: string | undefined;

  $: ttsSrc = currentCard ? `/api/tts?text=${encodeURIComponent(currentCard.pt)}` : '';

  // Reset per-card state whenever the active card changes.
  $: if (currentCard && currentCard.pt !== lastCardPt) {
    lastCardPt = currentCard.pt;
    onCardChange();
  }

  async function onCardChange() {
    typed = '';
    revealed = false;
    lastVerdict = null;
    audioStatus = 'ok';
    await tick();
    if (inputEl) inputEl.focus();
    // Auto-play; ignore rejection (autoplay policy).
    if (audioEl) {
      try {
        audioEl.currentTime = 0;
        await audioEl.play();
      } catch {
        // Ignore — visible play button is the fallback.
      }
    }
  }

  async function play() {
    if (!audioEl) return;
    try {
      audioEl.currentTime = 0;
      await audioEl.play();
    } catch {
      // Ignore.
    }
  }

  async function check() {
    if (!currentCard) return;
    if (typed.trim().length === 0) return; // empty submit is a no-op
    const ok = normalizeForListening(typed) === normalizeForListening(currentCard.pt);
    lastVerdict = ok ? 'right' : 'wrong';
    revealed = true;
    // Defer sessionMark until advance() so the reveal panel persists.
  }

  async function skip() {
    if (!currentCard) return;
    if (revealed) { advance(); return; }
    lastVerdict = 'wrong';
    revealed = true;
  }

  async function advance() {
    if (!currentCard || !revealed) return;
    const ok = lastVerdict === 'right';
    const card = currentCard;
    sessionMark(card, ok);
    if (!$generatedMode) await markCard(card, ok);
    // onCardChange() will reset typed/revealed/lastVerdict when the reactive
    // block fires for the new currentCard.
  }

  function onAudioError() {
    // Placeholder — Task 8 wires real error detection (status code).
    audioStatus = 'upstream-error';
  }

  onMount(() => {
    // Trigger the first card's onCardChange even if the reactive block
    // hasn't fired yet (e.g. when component mounts with a card already set).
    if (currentCard) {
      lastCardPt = currentCard.pt;
      onCardChange();
    }
  });
</script>

<div class="card-area" data-testid="listening-card">
  {#if currentCard}
    {#if cc}<span class="category-tag {cc.cls}">{cc.label}</span>{/if}

    <button
      class="btn"
      data-testid="listen-play"
      type="button"
      on:click={play}
    >
      🔊 Play
    </button>

    <audio
      bind:this={audioEl}
      src={ttsSrc}
      preload="auto"
      on:error={onAudioError}
    ></audio>

    <input
      bind:this={inputEl}
      class="type-input"
      data-testid="listen-input"
      type="text"
      lang="pt-BR"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      placeholder="Type the Portuguese you heard…"
      bind:value={typed}
      on:keydown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); revealed ? advance() : check(); }
        else if (e.key === 'Escape') { e.preventDefault(); skip(); }
      }}
    />

    <div class="buttons">
      <button
        class="btn btn-wrong"
        data-testid="listen-skip"
        type="button"
        on:click={skip}
      >Skip</button>
      <button
        class="btn btn-right"
        data-testid="listen-check"
        type="button"
        disabled={typed.trim().length === 0}
        on:click={check}
      >Check</button>
    </div>

    {#if revealed}
      <div class="reveal" data-testid="listen-reveal">
        <div class="card-label">Português</div>
        <div class="card-word">{currentCard.pt}</div>
        <div class="card-label" style="margin-top:8px">English</div>
        <div class="card-word">{currentCard.en}</div>
        <div data-testid="listen-verdict" style="margin-top:12px">
          {lastVerdict === 'right' ? '✓ correct' : '✗ try again'}
        </div>
      </div>
    {/if}

    {#if showCardStats}
      <div style="font-size:0.7rem;color:var(--text-dim);margin-top:8px">
        {cardStats.right}&#10003; {cardStats.wrong}&#10007;
      </div>
    {/if}

    <div class="keyboard-hint">Enter = check · Esc = skip</div>
  {/if}
</div>
