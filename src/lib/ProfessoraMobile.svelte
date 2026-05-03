<script lang="ts">
  import ProfessoraHeader from './ProfessoraHeader.svelte';
  import ProfessoraFilters from './ProfessoraFilters.svelte';
  import ManagePanel from './ManagePanel.svelte';
</script>

<div class="professora-mobile" data-testid="professora-mobile">
  <ProfessoraHeader />
  <ManagePanel />
  <ProfessoraFilters />
</div>
