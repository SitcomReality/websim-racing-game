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
    this.phaseToScreen = {};
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
   * Show a screen with transitions
   */
  showScreen(name, data = {}) {
    const screen = this.screens.get(name);
    if (!screen) {
      console.warn(`Screen ${name} not found`);
      return;
    }
    if (!this.root) this.root = document.getElementById('app');

    // Hide current screen with exit animation
    if (this.activeScreen && this.activeScreen.el) {
      this.activeScreen.el.classList.add('screen-transition-exit');
      setTimeout(() => {
        this.activeScreen.hide?.();
        this.showNewScreen(screen, data);
      }, 300);
    } else {
      if (this.root) this.root.innerHTML = '';
      this.showNewScreen(screen, data);
    }
  }

  showNewScreen(screen, data) {
    // Show new screen with enter animation
    this.activeScreen = screen;
    screen.show?.({ ...data, container: this.root });
    
    if (screen.el) {
      screen.el.classList.add('screen-transition-enter');
      setTimeout(() => {
        screen.el.classList.remove('screen-transition-enter');
      }, 400);
    }
    
    this.eventBus.emit('screen:changed', { name: screen.constructor.name, data });
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

  setPhaseMapping(map) { this.phaseToScreen = map; }
  showPhase(phase, data = {}) {
    const screenName = this.phaseToScreen?.[phase];
    if (screenName) this.showScreen(screenName, data);
  }
}