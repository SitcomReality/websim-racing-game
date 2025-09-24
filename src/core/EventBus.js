/**
 * EventBus - Simple event system for decoupled communication
 */
export class EventBus {
  constructor() {
    this.events = new Map();
  }

  /**
   * Subscribe to an event
   */
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
  }

  /**
   * Unsubscribe from an event
   */
  off(event, callback) {
    if (!this.events.has(event)) return;
    
    const callbacks = this.events.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Emit an event
   */
  emit(event, ...args) {
    if (!this.events.has(event)) return;
    
    const callbacks = this.events.get(event);
    callbacks.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  /**
   * Clear all event listeners
   */
  clear() {
    this.events.clear();
  }

  /**
   * Get all events
   */
  getEvents() {
    return Array.from(this.events.keys());
  }
}