/**
 * ModuleLoader - Handles dynamic loading of ES6 modules with fallback support
 */
export class ModuleLoader {
  constructor() {
    this.modules = new Map();
    this.loadedModules = new Set();
    this.moduleCache = new Map();
  }

  /**
   * Check if the browser supports ES6 modules
   */
  static supportsModules() {
    return 'noModule' in HTMLScriptElement.prototype;
  }

  /**
   * Dynamically import a module with fallback support
   */
  async loadModule(modulePath) {
    if (this.loadedModules.has(modulePath)) {
      return this.moduleCache.get(modulePath);
    }

    try {
      // Try ES6 dynamic import first (direct dynamic import; will throw in older environments)
      const module = await import(modulePath);
      this.loadedModules.add(modulePath);
      this.moduleCache.set(modulePath, module);
      return module;
    } catch (error) {
      console.warn(`Failed to load module ${modulePath} via dynamic import:`, error);
    }

    // Fallback to script tag loading for older browsers
    return this.loadModuleViaScript(modulePath);
  }

  /**
   * Load module using script tag (fallback for older browsers)
   */
  loadModuleViaScript(modulePath) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = modulePath;

      script.onload = () => {
        this.loadedModules.add(modulePath);
        // For script tag loading, modules are available globally
        const moduleName = this.extractModuleName(modulePath);
        const module = window[moduleName];
        this.moduleCache.set(modulePath, module);
        resolve(module);
      };

      script.onerror = () => {
        reject(new Error(`Failed to load module: ${modulePath}`));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Load multiple modules in parallel
   */
  async loadModules(modulePaths) {
    if (!modulePaths) {
      // Load default modules if no paths provided
      return this.loadDefaultModules();
    }

    const loadPromises = modulePaths.map(path => this.loadModule(path));
    return Promise.all(loadPromises);
  }

  /**
   * Load default application modules
   */
  async loadDefaultModules() {
    // This will be expanded as we convert individual modules
    // For now, just return a resolved promise
    return Promise.resolve();
  }

  /**
   * Extract module name from path
   */
  extractModuleName(modulePath) {
    const parts = modulePath.split('/');
    const fileName = parts[parts.length - 1];
    return fileName.replace('.js', '').replace(/-/g, '');
  }

  /**
   * Check if a module is loaded
   */
  isLoaded(modulePath) {
    return this.loadedModules.has(modulePath);
  }

  /**
   * Get a loaded module
   */
  getModule(modulePath) {
    return this.moduleCache.get(modulePath);
  }

  /**
   * Clear module cache
   */
  clearCache() {
    this.loadedModules.clear();
    this.moduleCache.clear();
  }
}