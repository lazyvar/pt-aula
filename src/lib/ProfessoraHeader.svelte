<header class="professora-header">
  <a href="/" data-testid="professora-back" class="back-link">
    <span class="arrow">←</span><span>back to study</span>
  </a>
  <div class="title">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
    <h1>Professora</h1>
  </div>
</header>

<style>
  .professora-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 22px 28px 18px;
  }
  .back-link {
    color: var(--text-dim, #8892a4);
    text-decoration: none;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: color 0.2s ease, gap 0.2s ease;
  }
  .back-link:hover { color: var(--text, #f0f0f0); gap: 12px; }
  .back-link .arrow { transition: transform 0.2s ease; }
  .back-link:hover .arrow { transform: translateX(-2px); }
  .title {
    display: flex;
    align-items: baseline;
    gap: 10px;
    color: var(--text, #f0f0f0);
  }
  .title svg {
    color: var(--accent, #e94560);
    transform: translateY(3px);
  }
  h1 {
    font-family: 'Dela Gothic One', cursive;
    font-size: 1.4rem;
    font-weight: 400;
    letter-spacing: -0.5px;
    margin: 0;
    background: linear-gradient(135deg, var(--text, #f0f0f0), #cfd6e4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  @media (max-width: 768px) {
    .professora-header { padding: 18px 18px 14px; }
    .back-link { font-size: 0.7rem; letter-spacing: 1.2px; }
    h1 { font-size: 1.15rem; }
    .title svg { width: 18px; height: 18px; }
  }
</style>
