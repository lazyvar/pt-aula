<script lang="ts">
  import ProfessoraHeader from './ProfessoraHeader.svelte';
  import ProfessoraFilters from './ProfessoraFilters.svelte';
</script>

<div class="professora-desktop" data-testid="professora-desktop">
  <ProfessoraHeader />
  <ProfessoraFilters />
  <!-- Manage panel + grid arrive in later tasks. -->
</div>

<style>
  .professora-desktop {
    max-width: 1100px;
    margin: 0 auto;
  }
</style>
