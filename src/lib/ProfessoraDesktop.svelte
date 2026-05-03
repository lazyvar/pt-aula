<script lang="ts">
  import ProfessoraHeader from './ProfessoraHeader.svelte';
  import ProfessoraFilters from './ProfessoraFilters.svelte';
  import ManagePanel from './ManagePanel.svelte';
  import CardGrid from './CardGrid.svelte';

  let manageOpen = false;
</script>

<div class="professora-desktop" data-testid="professora-desktop">
  <ProfessoraHeader />
  <ProfessoraFilters bind:manageOpen />
  <ManagePanel showToggle={false} bind:open={manageOpen} />
  <CardGrid />
</div>

<style>
  .professora-desktop {
    max-width: 1100px;
    margin: 0 auto;
  }
</style>
