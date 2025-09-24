// Main entry point for the ES6 module system
import { ModuleLoader } from './utils/moduleLoader.js';
import { GameState } from './core/GameState.js';
import { EventBus } from './core/EventBus.js';
import { RaceManager } from './game/RaceManager.js';
import { BettingManager } from './game/betting/BettingManager.js';
import { ProgressionManager } from './game/progression/ProgressionManager.js';
import { HUDComponent } from '../ui/components/HUDComponent.js';
import { BettingComponent } from '../ui/components/BettingComponent.js';
import { GameScreen } from '../ui/screens/GameScreen.js';
import { UIManager } from '../ui/UIManager.js';
import { SettingsPanel } from '../ui/components/settingsPanel.js';
// Ensure legacy UI helpers are available
import '../ui/components/tabs.js';
import '../ui/eventHandlers.js';
import { initGame } from '../init.js';
// removed obsolete legacy module imports that cause 404s
// import '../setupRace.js';
// import '../setupTrack.js';
import '../domUtils.js';

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new Application();
    window.app.initialize().catch(console.error);
  });
} else {
  window.app = new Application();
  window.app.initialize().catch(console.error);
}

// Export for use in other modules
export { Application };