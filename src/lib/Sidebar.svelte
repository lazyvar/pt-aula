<script lang="ts">
  import CategoryPicker from './CategoryPicker.svelte';
  import ControlButtons from './ControlButtons.svelte';
  import { session, toggleTypeMode } from '../stores/session';
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
    <button
      class="ctrl-btn"
      data-testid="type-mode-toggle"
      on:click={toggleTypeMode}
    >
      {$session.typeMode ? '⌨️ Type Mode: On' : '⌨️ Type Mode: Off'}
    </button>
  </div>
</div>
