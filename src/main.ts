import './app.css';
import App from './App.svelte';
import Professora from './Professora.svelte';

const isProfessora = window.location.pathname === '/professora'
  || window.location.pathname.startsWith('/professora/');

const Component = isProfessora ? Professora : App;

const app = new Component({
  target: document.getElementById('app')!,
});

export default app;
