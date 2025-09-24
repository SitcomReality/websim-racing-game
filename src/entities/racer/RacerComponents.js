import { RacerStats } from './RacerStats.js';
import { RacerPerformance } from './RacerPerformance.js';
import { RacerBetting } from './RacerBetting.js';
import { RacerHistory } from './RacerHistory.js';
import { RacerPersonality } from './RacerPersonality.js';
import { RacerInjuries } from './RacerInjuries.js';
import { RacerTraining } from './RacerTraining.js';
import { RacerRelationships } from './RacerRelationships.js';

/**
 * RacerComponents - Component registration and management system
 */
export class RacerComponents {
  constructor() {
    this.components = new Map();
    this.componentOrder = [];
  }

  /**
   * Register a component class
   */
  register(name, ComponentClass, dependencies = []) {
    this.components.set(name, {
      class: ComponentClass,
      dependencies: dependencies,
      instances: new WeakMap()
    });
    this.componentOrder.push(name);
  }

  /**
   * Create component instances for a racer
   */
  createComponents(racer, config) {
    const instances = new Map();

    // Create components in dependency order
    for (const name of this.componentOrder) {
      const componentInfo = this.components.get(name);
      if (!componentInfo) continue;

      // Check if component already exists for this racer
      if (componentInfo.instances.has(racer)) {
        instances.set(name, componentInfo.instances.get(racer));
        continue;
      }

      // Resolve dependencies
      const deps = componentInfo.dependencies.map(depName => {
        if (typeof depName === 'string') {
          return instances.get(depName);
        }
        return depName;
      });

      // Create component instance
      const component = new componentInfo.class(racer, config, ...deps);
      component.initialize?.();

      componentInfo.instances.set(racer, component);
      instances.set(name, component);
    }

    return instances;
  }

  /**
   * Get component for a specific racer
   */
  getComponent(racer, name) {
    const componentInfo = this.components.get(name);
    if (!componentInfo) return null;
    return componentInfo.instances.get(racer);
  }

  /**
   * Update all components for a racer
   */
  updateComponents(racer, deltaTime, context) {
    const instances = this.getAllComponents(racer);
    for (const [name, component] of instances) {
      if (component.update) {
        component.update(deltaTime, context);
      }
    }
  }

  /**
   * Reset all components for a racer
   */
  resetComponents(racer) {
    const instances = this.getAllComponents(racer);
    for (const [name, component] of instances) {
      if (component.reset) {
        component.reset();
      }
    }
  }

  /**
   * Serialize all components
   */
  serializeComponents(racer) {
    const instances = this.getAllComponents(racer);
    const serialized = {};

    for (const [name, component] of instances) {
      if (component.serialize) {
        serialized[name] = component.serialize();
      }
    }

    return serialized;
  }

  /**
   * Get all components for a racer
   */
  getAllComponents(racer) {
    const instances = new Map();
    for (const name of this.componentOrder) {
      const component = this.getComponent(racer, name);
      if (component) {
        instances.set(name, component);
      }
    }
    return instances;
  }

  /**
   * Clear all component instances
   */
  clear() {
    for (const componentInfo of this.components.values()) {
      componentInfo.instances = new WeakMap();
    }
  }
}

// Create global component registry
export const racerComponents = new RacerComponents();

// Register standard components
racerComponents.register('stats', RacerStats);
racerComponents.register('performance', RacerPerformance, ['stats']);
racerComponents.register('betting', RacerBetting, ['performance', 'history']);
racerComponents.register('history', RacerHistory);
racerComponents.register('personality', RacerPersonality);
racerComponents.register('injuries', RacerInjuries);
racerComponents.register('training', RacerTraining);
racerComponents.register('relationships', RacerRelationships);