/**
 * Main entry point for the ES6 module system
 */
import { Application } from './core/Application.js';
import { initGame } from './init.js';
import { FerretFactory } from './entities/racer/FerretFactory.js';
import { Racer } from './entities/racer/Racer.js';
import { Track } from './models/Track.js';

// Import polyfills
import './utils/polyfills.js';
import './utils/palette.js';

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