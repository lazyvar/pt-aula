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
  <ProfessoraFilters
    manageTestId="manage-sheet-toggle"
    showCaret={false}
    onManageClick={() => professoraSheetOpen.set(true)}
  />
  <CardGrid />
</div>

<ProfessoraSheet>
  <ManagePanel showToggle={false} open={true} />
</ProfessoraSheet>
