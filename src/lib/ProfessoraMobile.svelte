<script lang="ts">
  import ProfessoraHeader from './ProfessoraHeader.svelte';
  import ProfessoraFilters from './ProfessoraFilters.svelte';
  import ManagePanel from './ManagePanel.svelte';
  import CardGrid from './CardGrid.svelte';
</script>

<div class="professora-mobile" data-testid="professora-mobile">
  <ProfessoraHeader />
  <ManagePanel />
  <ProfessoraFilters />
  <CardGrid />
</div>
