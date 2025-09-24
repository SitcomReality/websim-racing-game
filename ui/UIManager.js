/** 
 * UIManager - Centralized UI coordinator
 */
export class UIManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.components = new Map();
    this.screens = new Map();
    this.activeScreen = null;
    this.isInitialized = false;
    this.root = document.getElementById('app') || null;
  }

  /** 
   * Register a UI component
   */
  registerComponent(name, component) {
    this.components.set(name, component);
    if (component.initialize) {
      component.initialize();
    }
  }

  /** 
   * Register a screen
   */
  registerScreen(name, screen) {
    this.screens.set(name, screen);
    if (screen.initialize) {
      screen.initialize(this.eventBus);
    }
  }

  /** 
   * Show a screen
   */
  showScreen(name, data = {}) {
    const screen = this.screens.get(name);
    if (!screen) {
      console.warn(`Screen ${name} not found`);
      return;
    }
    if (!this.root) this.root = document.getElementById('app');

    // Hide current screen
    if (this.activeScreen) {
      this.activeScreen.hide?.();
      if (this.root) this.root.innerHTML = '';
    }

    // Show new screen
    this.activeScreen = screen;
    screen.show?.({ ...data, container: this.root });
    this.eventBus.emit('screen:changed', { name, data });
  }

  /** 
   * Hide current screen
   */
  hideCurrentScreen() {
    if (this.activeScreen) {
      this.activeScreen.hide?.();
      this.activeScreen = null;
      if (this.root) this.root.innerHTML = '';
      this.eventBus.emit('screen:hidden');
    }
  }

  /** 
   * Get a component
   */
  getComponent(name) {
    return this.components.get(name);
  }

  /** 
   * Refresh all components
   */
  refreshComponents() {
    for (const [name, component] of this.components) {
      if (component.refresh) {
        component.refresh();
      }
    }
  }

  /** 
   * Initialize UI system
   */
  initialize() {
    if (this.isInitialized) return;

    // Initialize all components
    for (const [name, component] of this.components) {
      if (component.initialize) {
        component.initialize();
      }
    }

    // Initialize all screens
    for (const [name, screen] of this.screens) {
      if (screen.initialize) {
        screen.initialize(this.eventBus);
      }
    }

    this.isInitialized = true;
    this.eventBus.emit('ui:initialized');
  }

  /** 
   * Cleanup UI system
   */
  cleanup() {
    // Cleanup components
    for (const [name, component] of this.components) {
      if (component.cleanup) {
        component.cleanup();
      }
    }

    // Cleanup screens
    for (const [name, screen] of this.screens) {
      if (screen.cleanup) {
        screen.cleanup();
      }
    }

    this.components.clear();
    this.screens.clear();
    this.activeScreen = null;
    this.isInitialized = false;
  }
}