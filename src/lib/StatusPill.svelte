<script lang="ts">
  import type { CategoryStatus } from '../types';
  import { setCategoryStatus } from '../stores/categoryStatus';

  export let categoryId: string;
  export let status: CategoryStatus;

  const options: Array<{ value: CategoryStatus; label: string; testId: string }> = [
    { value: 'unmarked', label: 'Unmarked', testId: 'pill-unmarked' },
    { value: 'studying', label: 'Studying', testId: 'pill-studying' },
    { value: 'complete', label: 'Complete', testId: 'pill-complete' },
  ];
</script>

<div class="pill" role="group" aria-label="Category status">
  {#each options as opt}
    <button
      type="button"
      class="seg"
      class:on={status === opt.value}
      data-testid={opt.testId}
      aria-pressed={status === opt.value}
      on:click={() => setCategoryStatus(categoryId, opt.value)}
    >{opt.label}</button>
  {/each}
</div>

<style>
  .pill {
    display: inline-flex;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 999px;
    overflow: hidden;
  }
  .seg {
    padding: 4px 12px;
    font-size: 0.8rem;
    background: transparent;
    color: var(--text-dim, #8892a4);
    border: none;
    cursor: pointer;
  }
  .seg + .seg { border-left: 1px solid rgba(255,255,255,0.1); }
  .seg.on {
    background: var(--accent, #e94560);
    color: white;
  }
</style>
