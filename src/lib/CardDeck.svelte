<script lang="ts">
  import { onMount } from 'svelte';
  import { session, deck, mark as sessionMark } from '../stores/session';
  import { catConfig } from '../stores/cards';
  import { statsCache, markCard, getCardStats } from '../stores/stats';
  import { generatedMode } from '../stores/generated';
  import type { Card } from '../types';

  let isFlipped = false;
  let cardEl: HTMLDivElement;
  let containerEl: HTMLDivElement;

  // Reset flip on card change
  $: currentCard = $deck[$session.currentIndex];
  $: if (currentCard) isFlipped = false;

  $: front = $session.mode === 'pt-to-en' ? currentCard?.pt : currentCard?.en;
  $: back = $session.mode === 'pt-to-en' ? currentCard?.en : currentCard?.pt;
  $: frontLabel = $session.mode === 'pt-to-en' ? 'Português' : 'English';
  $: backLabel = $session.mode === 'pt-to-en' ? 'English' : 'Português';
  $: progressPct = $deck.length > 0 ? ($session.currentIndex / $deck.length) * 100 : 0;
  $: remaining = Math.max(0, $deck.length - $session.currentIndex);

  // Category tag: generated cards use a sentinel cat. Fallback: cat-generated / "✨ Generated".
  $: cc = currentCard
    ? $catConfig[currentCard.cat] || { cls: 'cat-generated', label: '✨ Generated', group: '' }
    : null;

  // Per-card stats display (reactively recomputed as statsCache updates).
  $: cardStats = currentCard ? getCardStats(currentCard) : { right: 0, wrong: 0 };
  $: showCardStats = cardStats.right > 0 || cardStats.wrong > 0;
  // Reference statsCache so Svelte treats this block as reactive when it changes.
  $: $statsCache, (cardStats = currentCard ? getCardStats(currentCard) : { right: 0, wrong: 0 });

  function flipCard() {
    isFlipped = !isFlipped;
  }

  async function mark(gotIt: boolean) {
    if (!currentCard) return;
    const card = currentCard;
    sessionMark(card, gotIt);
    if (!$generatedMode) {
      await markCard(card, gotIt);
    }
  }

  // Swipe gestures. Ported from public/index.html:873-932.
  onMount(() => {
    if (!containerEl) return;
    let startX = 0;
    let startY = 0;
    let swiping = false;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      swiping = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) {
        swiping = true;
        e.preventDefault();
        if (cardEl) {
          const rotation = dx * 0.05;
          const translateX = dx * 0.3;
          cardEl.style.transition = 'none';
          cardEl.style.transform = `translateX(${translateX}px) rotate(${rotation}deg)${isFlipped ? ' rotateY(180deg)' : ''}`;
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (swiping && Math.abs(dx) > 80) {
        if (cardEl) {
          cardEl.style.transition = 'transform 0.3s ease';
          cardEl.style.transform = `translateX(${dx > 0 ? 300 : -300}px) rotate(${dx > 0 ? 15 : -15}deg)`;
        }
        setTimeout(() => {
          if (dx > 0) mark(true);
          else mark(false);
        }, 200);
      } else {
        if (cardEl) {
          cardEl.style.transition = '';
          cardEl.style.transform = '';
        }
      }
      setTimeout(() => { swiping = false; }, 0);
    };

    const onClickCapture = (e: MouseEvent) => {
      if (swiping) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    containerEl.addEventListener('touchstart', onTouchStart, { passive: true });
    containerEl.addEventListener('touchmove', onTouchMove, { passive: false });
    containerEl.addEventListener('touchend', onTouchEnd);
    containerEl.addEventListener('click', onClickCapture, true);

    return () => {
      containerEl.removeEventListener('touchstart', onTouchStart);
      containerEl.removeEventListener('touchmove', onTouchMove);
      containerEl.removeEventListener('touchend', onTouchEnd);
      containerEl.removeEventListener('click', onClickCapture, true);
    };
  });

  // Exposed to App.svelte for keyboard handlers.
  export function handleKeydown(e: KeyboardEvent) {
    if (!currentCard) return;
    if (e.code === 'Space' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      e.preventDefault();
      flipCard();
    } else if (e.code === 'Enter') {
      mark(true);
    } else if (e.code === 'Backspace' || e.code === 'Delete') {
      e.preventDefault();
      mark(false);
    }
  }
</script>

<div class="progress-area">
  <div class="progress-bar">
    <div class="progress-fill" style="width:{progressPct}%"></div>
  </div>
  <div class="stats">
    <span data-testid="counter-correct">
      <span class="dot green"></span> {$session.correct}
    </span>
    <span data-testid="counter-wrong">
      <span class="dot red"></span> {$session.wrong}
    </span>
    <span data-testid="counter-remaining">
      <span class="dot gray"></span> {remaining} left
    </span>
  </div>
</div>

<div class="card-area">
  <div
    class="card-container"
    id="cardContainer"
    data-testid="card-container"
    bind:this={containerEl}
    on:click={flipCard}
    on:keydown={(e) => e.key === 'Enter' && flipCard()}
    role="button"
    tabindex="0"
  >
    <div class="card {isFlipped ? 'flipped' : ''}" id="theCard" bind:this={cardEl}>
      <div class="card-face card-front" data-testid="card-front">
        {#if cc}<span class="category-tag {cc.cls}">{cc.label}</span>{/if}
        <div class="card-label">{frontLabel}</div>
        <div class="card-word">{front}</div>
        {#if showCardStats}
          <div style="font-size:0.7rem;color:var(--text-dim);margin-top:8px">
            {cardStats.right}&#10003; {cardStats.wrong}&#10007;
          </div>
        {/if}
      </div>
      <div class="card-face card-back" data-testid="card-back">
        {#if cc}<span class="category-tag {cc.cls}">{cc.label}</span>{/if}
        <div class="card-label">{backLabel}</div>
        <div class="card-word">{back}</div>
        {#if showCardStats}
          <div style="font-size:0.7rem;color:var(--text-dim);margin-top:8px">
            {cardStats.right}&#10003; {cardStats.wrong}&#10007;
          </div>
        {/if}
      </div>
    </div>
  </div>

  <div class="buttons">
    <button class="btn btn-wrong" data-testid="btn-wrong" on:click={() => mark(false)}>✗ Again</button>
    <button class="btn btn-right" data-testid="btn-right" on:click={() => mark(true)}>✓ Got it</button>
  </div>
  <div class="keyboard-hint">Space/←/→ = flip · Enter = got it · Delete = again</div>
</div>
