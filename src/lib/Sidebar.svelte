<script lang="ts">
  import CategoryPicker from './CategoryPicker.svelte';
  import ControlButtons from './ControlButtons.svelte';
</script>

<div class="sidebar">
  <div class="sidebar-scroll">
    <div class="header">
      <h1>🇧🇷 Português Aula</h1>
    </div>
    <CategoryPicker prefix="side-" />
  </div>
  <div class="sidebar-controls">
    <ControlButtons />
  </div>
</div>
