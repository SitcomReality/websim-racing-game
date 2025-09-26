/**
 * Main entry point for the ES6 module system
 */
import { Application } from './core/Application.js';

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