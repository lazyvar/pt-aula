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
  let isPlaying = false;
  let lastCardPt: string | undefined;

  $: ttsSrc = currentCard ? `/api/tts?text=${encodeURIComponent(currentCard.pt)}` : '';

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
    play();
  }

  async function play() {
    if (!audioEl) return;
    try {
      audioEl.currentTime = 0;
      await audioEl.play();
    } catch {
      // Autoplay policy or load error — visible button is the fallback.
    }
  }

  async function check() {
    if (!currentCard) return;
    if (typed.trim().length === 0) return;
    const ok = normalizeForListening(typed) === normalizeForListening(currentCard.pt);
    lastVerdict = ok ? 'right' : 'wrong';
    revealed = true;
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
  }

  async function onAudioError() {
    if (!currentCard) return;
    try {
      const res = await fetch(ttsSrc, { method: 'GET' });
      if (res.status === 500) {
        const body = await res.json().catch(() => ({}));
        if (body && typeof body.error === 'string' && body.error.includes('ELEVENLABS_API_KEY')) {
          audioStatus = 'missing-key';
          return;
        }
      }
      audioStatus = 'upstream-error';
    } catch {
      audioStatus = 'upstream-error';
    }
  }

  onMount(() => {
    if (currentCard) {
      lastCardPt = currentCard.pt;
      onCardChange();
    }
  });
</script>

<div class="listen-wrap" data-testid="listening-card">
  {#if currentCard}
    <div class="listen-card">
      {#if cc}
        <span class="category-tag {cc.cls}">{cc.label}</span>
      {/if}

      {#if audioStatus === 'missing-key'}
        <div class="audio-banner missing" data-testid="listen-audio-banner-missing">
          Audio unavailable — set <code>ELEVENLABS_API_KEY</code>
        </div>
      {:else if audioStatus === 'upstream-error'}
        <div class="audio-banner error" data-testid="listen-audio-banner-error">
          Couldn't load audio — <button type="button" class="link" on:click={play}>retry</button>
        </div>
      {/if}

      <button
        class="play-btn"
        class:playing={isPlaying}
        data-testid="listen-play"
        type="button"
        aria-label="Play audio"
        on:click={play}
      >
        <span class="play-icon">🔊</span>
      </button>

      <audio
        bind:this={audioEl}
        src={ttsSrc}
        preload="auto"
        on:play={() => (isPlaying = true)}
        on:ended={() => (isPlaying = false)}
        on:pause={() => (isPlaying = false)}
        on:error={onAudioError}
      ></audio>

      <input
        bind:this={inputEl}
        class="listen-input"
        data-testid="listen-input"
        type="text"
        lang="pt-BR"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        placeholder="Type what you heard…"
        bind:value={typed}
        on:keydown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); revealed ? advance() : check(); }
          else if (e.key === 'Escape') { e.preventDefault(); skip(); }
        }}
      />

      <div class="action-row">
        <button
          class="action-btn skip"
          data-testid="listen-skip"
          type="button"
          on:click={skip}
        >Skip</button>
        <button
          class="action-btn check"
          data-testid="listen-check"
          type="button"
          disabled={typed.trim().length === 0}
          on:click={check}
        >Check</button>
      </div>
    </div>

    {#if revealed}
      <div class="reveal" class:right={lastVerdict === 'right'} class:wrong={lastVerdict === 'wrong'} data-testid="listen-reveal">
        <div class="verdict" data-testid="listen-verdict">
          {lastVerdict === 'right' ? '✓ Correct' : '✗ Try again'}
        </div>
        <div class="reveal-row">
          <div class="reveal-label">Português</div>
          <div class="reveal-value">{currentCard.pt}</div>
        </div>
        <div class="reveal-row">
          <div class="reveal-label">English</div>
          <div class="reveal-value">{currentCard.en}</div>
        </div>
        <div class="reveal-hint">Press Enter to continue</div>
      </div>
    {/if}

    {#if showCardStats}
      <div class="stats-line">{cardStats.right}&#10003; {cardStats.wrong}&#10007;</div>
    {/if}

    {#if !revealed}
      <div class="kbd-hint">Enter = check · Esc = skip</div>
    {/if}
  {/if}
</div>

<style>
  .listen-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 14px;
    padding: 0 8px;
  }

  .listen-card {
    width: 100%;
    max-width: 440px;
    padding: 28px 24px 22px;
    background: linear-gradient(160deg, #1a1a2e 0%, #16213e 100%);
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.06);
    box-shadow: 0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
  }

  .play-btn {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    border: 1px solid rgba(233,69,96,0.3);
    background: rgba(233,69,96,0.12);
    color: var(--accent);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s ease, background 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 0 6px 24px rgba(233,69,96,0.15);
  }
  .play-btn:hover { background: rgba(233,69,96,0.2); transform: scale(1.04); }
  .play-btn:active { transform: scale(0.96); }
  .play-btn.playing {
    background: rgba(233,69,96,0.25);
    box-shadow: 0 0 0 6px rgba(233,69,96,0.08), 0 6px 24px rgba(233,69,96,0.25);
  }
  .play-icon { font-size: 2rem; line-height: 1; }

  .listen-input {
    width: 100%;
    padding: 14px 18px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 1.05rem;
    text-align: center;
    outline: none;
    transition: border-color 0.2s ease, background 0.2s ease;
  }
  .listen-input::placeholder { color: var(--text-dim); opacity: 0.6; }
  .listen-input:focus {
    border-color: rgba(233,69,96,0.5);
    background: rgba(255,255,255,0.06);
  }

  .action-row {
    display: flex;
    gap: 10px;
    width: 100%;
  }
  .action-btn {
    flex: 1;
    padding: 12px 18px;
    border-radius: 12px;
    border: 1px solid transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.1s ease;
  }
  .action-btn:active { transform: scale(0.97); }
  .action-btn.skip {
    background: rgba(255,255,255,0.04);
    color: var(--text-dim);
    border-color: rgba(255,255,255,0.06);
  }
  .action-btn.skip:hover { background: rgba(255,255,255,0.08); color: var(--text); }
  .action-btn.check {
    background: rgba(46,204,113,0.14);
    color: var(--green);
    border-color: rgba(46,204,113,0.25);
  }
  .action-btn.check:hover:not(:disabled) { background: rgba(46,204,113,0.22); }
  .action-btn.check:disabled { opacity: 0.4; cursor: not-allowed; }

  .reveal {
    width: 100%;
    max-width: 440px;
    padding: 18px 22px 16px;
    background: rgba(255,255,255,0.03);
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.06);
    display: flex;
    flex-direction: column;
    gap: 10px;
    animation: revealIn 0.2s ease-out;
  }
  @keyframes revealIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .reveal.right { border-color: rgba(46,204,113,0.28); background: rgba(46,204,113,0.05); }
  .reveal.wrong { border-color: rgba(231,76,60,0.28); background: rgba(231,76,60,0.05); }
  .verdict {
    font-family: 'DM Sans', sans-serif;
    font-weight: 700;
    font-size: 0.95rem;
    letter-spacing: 0.5px;
  }
  .reveal.right .verdict { color: var(--green); }
  .reveal.wrong .verdict { color: var(--red); }
  .reveal-row { display: flex; flex-direction: column; gap: 2px; }
  .reveal-label {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-weight: 700;
    color: var(--text-dim);
  }
  .reveal-value {
    font-family: 'DM Sans', sans-serif;
    font-size: 1.05rem;
    line-height: 1.35;
    color: var(--text);
  }
  .reveal-hint {
    font-size: 0.7rem;
    color: var(--text-dim);
    margin-top: 4px;
    font-style: italic;
  }

  .stats-line {
    font-size: 0.7rem;
    color: var(--text-dim);
    letter-spacing: 0.5px;
  }
  .kbd-hint {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.25);
  }

  .audio-banner {
    width: 100%;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 0.82rem;
    text-align: center;
  }
  .audio-banner.missing {
    background: rgba(255,193,7,0.1);
    color: #ffc107;
    border: 1px solid rgba(255,193,7,0.2);
  }
  .audio-banner.error {
    background: rgba(231,76,60,0.1);
    color: var(--red);
    border: 1px solid rgba(231,76,60,0.2);
  }
  .audio-banner code {
    background: rgba(0,0,0,0.3);
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 0.78rem;
  }
  .audio-banner .link {
    background: none;
    border: none;
    color: inherit;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
    font: inherit;
  }
</style>
