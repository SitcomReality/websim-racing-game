/** 
 * BaseComponent - Base class for UI components
 */
export class BaseComponent {
  constructor(element, options = {}) {
    this.element = element;
    this.options = options;
    this.isVisible = true;
    this.eventListeners = new Map();
  }

  /** 
   * Initialize the component
   */
  initialize() {
    this.bindEvents();
  }

  /** 
   * Bind event listeners
   */
  bindEvents() {
    // Override in subclasses
  }

  /** 
   * Add event listener
   */
  addEventListener(element, event, handler, options = {}) {
    if (!element || !event || !handler) return;

    const key = `${element.id || element.tagName}-${event}`;
    this.eventListeners.set(key, { element, event, handler, options });

    element.addEventListener(event, handler, options);
  }

  /** 
   * Remove event listener
   */
  removeEventListener(element, event) {
    const key = `${element.id || element.tagName}-${event}`;
    const listener = this.eventListeners.get(key);
    
    if (listener) {
      element.removeEventListener(event, listener.handler, listener.options);
      this.eventListeners.delete(key);
    }
  }

  /** 
   * Show component
   */
  show() {
    this.isVisible = true;
    if (this.element) {
      this.element.style.display = '';
    }
  }

  /** 
   * Hide component
   */
  hide() {
    this.isVisible = false;
    if (this.element) {
      this.element.style.display = 'none';
    }
  }

  /** 
   * Refresh component
   */
  refresh() {
    // Override in subclasses
  }

  /** 
   * Cleanup component
   */
  cleanup() {
    // Remove all event listeners
    for (const [key, listener] of this.eventListeners) {
      this.removeEventListener(listener.element, listener.event);
    }
    this.eventListeners.clear();
  }
}