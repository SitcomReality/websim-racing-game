import { ModuleLoader } from '../utils/moduleLoader.js';
import { GameState } from './GameState.js';
import { EventBus } from './EventBus.js';
import { RaceManager } from '../game/RaceManager.js';
import { BettingManager } from '../game/betting/BettingManager.js';
import { ProgressionManager } from '../game/progression/ProgressionManager.js';
import { UIManager } from '../../ui/UIManager.js';
import { LoadingManager } from './LoadingManager.js';
import { XmlWordlistLoader } from '../data/XmlWordlistLoader.js';
import { EventListeners } from './EventListeners.js';

/**
 * Application - Main application coordinator
 */
export class Application {
  constructor() {
    this.moduleLoader = new ModuleLoader();
    this.gameStateManager = new GameState();
    this.gameState = this.gameStateManager;
    this.eventBus = new EventBus();

    // Initialize game logic managers
    this.raceManager = new RaceManager(this.eventBus, this.gameStateManager);
    this.bettingManager = new BettingManager(this.eventBus, this.gameStateManager);
    this.progressionManager = new ProgressionManager(this.eventBus, this.gameStateManager);
    this.eventBus._progressionManager = this.progressionManager;

    // UI Manager
    this.uiManager = new UIManager(this.eventBus);

    // Loading system
    this.loadingManager = new LoadingManager();
    this.isLoading = false;
    this.loadingProgress = 0;

    // Sub-module loaders
    this.xmlWordlistLoader = new XmlWordlistLoader();
    this.eventListeners = new EventListeners(this);

    // Make eventBus and app available globally for compatibility/debugging
    window.eventBus = this.eventBus;
    window.app = this;
    window.gameState = this.gameStateManager;
  }

  async initialize() {
    try {
      // Start loading sequence
      this.startLoading();

      // Load XML wordlists first
      await this.loadXmlWordlists();

      // Initialize core systems
      await this.initializeCoreSystems();

      // Load and initialize modules
      await this.moduleLoader.loadModules();

      // Initialize UI
      this.initializeUI();

      console.log('Application initialized successfully');
      this.completeLoading();
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.failLoading(error.message);
      throw error;
    }
  }

  startLoading() {
    this.isLoading = true;
    this.loadingProgress = 0;
    this.eventBus.emit('loading:started');
    this.loadingManager.show();
  }

  updateLoadingProgress(progress, message) {
    this.loadingProgress = Math.min(100, Math.max(0, progress));
    this.eventBus.emit('loading:progress', { 
      progress: this.loadingProgress, 
      message: message || 'Loading...' 
    });
    this.loadingManager.updateProgress(this.loadingProgress, message);
  }

  completeLoading() {
    this.isLoading = false;
    this.loadingProgress = 100;
    this.eventBus.emit('loading:completed');
    this.loadingManager.hide();
  }

  failLoading(errorMessage) {
    this.isLoading = false;
    this.loadingProgress = 0;
    this.eventBus.emit('loading:failed', { error: errorMessage });
    this.loadingManager.show();
    this.loadingManager.updateProgress(0, `Failed: ${errorMessage}`);
  }

  async loadXmlWordlists() {
    this.updateLoadingProgress(10, 'Loading word lists...');
    await this.xmlWordlistLoader.loadWordlists();
    this.updateLoadingProgress(30, 'Word lists loaded');
  }

  async initializeCoreSystems() {
    this.updateLoadingProgress(50, 'Initializing core systems...');
    
    // Initialize core game systems
    await new Promise(resolve => setTimeout(resolve, 500));

    this.updateLoadingProgress(70, 'Core systems initialized');
  }

  initializeUI() {
    this.updateLoadingProgress(80, 'Setting up user interface...');
    
    // Ensure root container exists
    let root = document.getElementById('app');
    if (!root) {
      root = document.createElement('div');
      root.id = 'app';
      document.body.appendChild(root);
    }
    document.body.setAttribute('data-theme', document.body.getAttribute('data-theme') || 'dark');

    // Hide no-js message
    const noJsDiv = document.getElementById('no-js');
    if (noJsDiv) noJsDiv.style.display = 'none';

    // Setup event listeners
    // this.eventListeners.setup(); // removed: constructor already sets listeners

    this.updateLoadingProgress(90, 'Interface ready');
  }

  checkAchievements(eventType, data) {
    this.progressionManager.checkAchievements(eventType, data);
  }
}