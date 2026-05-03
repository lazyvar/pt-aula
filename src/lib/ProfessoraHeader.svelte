<header class="professora-header">
  <a href="/" data-testid="professora-back" class="back-link">← back to study</a>
  <div class="title">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .back-link {
    color: var(--text-dim, #8892a4);
    text-decoration: none;
    font-size: 0.9rem;
  }
  .back-link:hover { color: var(--text, #f0f0f0); }
  .title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text, #f0f0f0);
  }
  h1 {
    font-size: 1.4rem;
    font-weight: 500;
    margin: 0;
  }
</style>
