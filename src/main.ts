import './styles/main.css';
import { App } from './app/App';
import { audio } from './audio/AudioEngine';

const app = new App();
app.start();

// Expose a small debug/testing surface (used by the Playwright suite).
declare global {
  interface Window {
    __armory?: App;
    __armoryAudio?: typeof audio;
  }
}
window.__armory = app;
window.__armoryAudio = audio;
