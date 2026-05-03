<script lang="ts">
  import ProfessoraHeader from './ProfessoraHeader.svelte';
  import ProfessoraFilters from './ProfessoraFilters.svelte';
  import ManagePanel from './ManagePanel.svelte';
  import CardGrid from './CardGrid.svelte';
  import ProfessoraSheet from './ProfessoraSheet.svelte';
  import { professoraSheetOpen } from '../stores/ui';
</script>

<div class="professora-mobile" data-testid="professora-mobile">
  <ProfessoraHeader />
  <button
    type="button"
    class="manage-trigger"
    data-testid="manage-sheet-toggle"
    on:click={() => professoraSheetOpen.set(true)}
  >Manage categories</button>
  <ProfessoraFilters />
  <CardGrid />
</div>

<ProfessoraSheet>
  <ManagePanel showToggle={false} open={true} />
</ProfessoraSheet>

<style>
  .manage-trigger {
    display: block;
    width: fit-content;
    margin: 8px 20px 8px auto;
    padding: 10px 14px;
    background: rgba(255,255,255,0.06);
    color: var(--text, #f0f0f0);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    font-size: 0.95rem;
    cursor: pointer;
  }
</style>
