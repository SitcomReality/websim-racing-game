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
import { IntroScreen } from '../ui/screens/IntroScreen.js';
import { UIManager } from '../ui/UIManager.js';
import { SettingsPanel } from '../ui/components/settingsPanel.js';
// Ensure legacy UI helpers are available
import '../ui/components/tabs.js';
// ui/eventHandlers.js is deprecated and will be removed.
// import '../ui/eventHandlers.js'; 
import { initGame } from '../init.js';
import { FerretFactory } from './entities/racer/FerretFactory.js';
import { Racer } from './entities/racer/Racer.js';
import { Track } from './models/Track.js';
// remove legacy domUtils import

// Initialize the application
class Application {
  constructor() {
    this.moduleLoader = new ModuleLoader();
    this.gameStateManager = new GameState();
    this.gameState = this.gameStateManager; // Use the manager directly
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
    
    // Make eventBus and app available globally for compatibility/debugging
    window.eventBus = this.eventBus;
    window.app = this;
    window.gameState = this.gameStateManager;
    window.FerretFactory = FerretFactory;
    window.Racer = Racer;
    window.Track = Track;
    
    // Setup event listeners
    this.setupEventListeners();
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

  /**
   * Start loading sequence
   */
  startLoading() {
    this.isLoading = true;
    this.loadingProgress = 0;
    this.eventBus.emit('loading:started');
    // Show loading overlay immediately
    this.loadingManager?.show();
  }

  /**
   * Update loading progress
   */
  updateLoadingProgress(progress, message) {
    this.loadingProgress = Math.min(100, Math.max(0, progress));
    this.eventBus.emit('loading:progress', { 
      progress: this.loadingProgress, 
      message: message || 'Loading...' 
    });
    // Update visual progress bar if available
    this.loadingManager?.updateProgress(this.loadingProgress, message);
  }

  /**
   * Complete loading sequence
   */
  completeLoading() {
    this.isLoading = false;
    this.loadingProgress = 100;
    this.eventBus.emit('loading:completed');
    // Hide loading overlay when finished
    this.loadingManager?.hide();
  }

  /**
   * Fail loading sequence
   */
  failLoading(errorMessage) {
    this.isLoading = false;
    this.loadingProgress = 0;
    this.eventBus.emit('loading:failed', { error: errorMessage });
    // Show overlay (if not already) and display failure message
    this.loadingManager?.show();
    this.loadingManager?.updateProgress(0, `Failed: ${errorMessage}`);
  }

  /**
   * Setup event listeners for game logic
   */
  setupEventListeners() {
    // Race events
    this.eventBus.on('race:startWeek', () => {
      const week = this.progressionManager.startNewRaceWeek();
      this.eventBus.emit('progression:weekStarted', {
        weekNumber: this.gameState.raceWeekCounter,
        season: this.progressionManager.currentSeason,
        weekInSeason: this.progressionManager.weekInSeason
      });
    });
    
    this.eventBus.on('race:setup', () => {
      this.raceManager.setupRace();
    });
    
    this.eventBus.on('race:start', () => {
      this.raceManager.startRace();
    });
    
    // Betting events
    this.eventBus.on('bet:placed', (betData) => {
      this.uiManager.refreshComponents();
    });
    
    this.eventBus.on('bets:settled', (settlementData) => {
      this.uiManager.refreshComponents();
      this.checkAchievements('bet:won', settlementData);
    });
    
    // Race finish
    this.eventBus.on('race:finish', (raceData) => {
      this.bettingManager.settleBets(raceData.results);
      this.checkAchievements('race:finish', raceData);
      this.gameState.raceHistory.push(raceData);
    });
    
    this.eventBus.on('game:initialize', () => {
      initGame(this.gameStateManager);
      this.uiManager.showScreen('game');
    });

    this.eventBus.on('race:update', (raceData) => {
        if (this.uiManager.activeScreen?.renderManager) {
            this.uiManager.activeScreen.renderManager.setRace(raceData.race, { numberOfLanes: raceData.race.racers.length});
        }
    });

    this.eventBus.on('app:tick', (deltaTime) => {
      if (this.gameState.running) {
        this.raceManager.updateRace(deltaTime);
      }
    });
  }

  /**
   * Check and award achievements
   */
  checkAchievements(eventType, data) {
    this.progressionManager.checkAchievements(eventType, data);
  }

  async loadXmlWordlists() {
    this.updateLoadingProgress(10, 'Loading word lists...');
    
    // Implementation moved from loadXmlWordlists.js
    try {
      const dynamicPrefixes = [
        () => `00${Math.floor(Math.random()*9)}: Licensed To`,
        () => `${Math.floor(1 + Math.random()*111)}%`,
        () => `${Math.floor(1 + Math.random()*12)} O'Clock`,
        () => `${Math.floor(Math.random()*1000)}mL Of`,
        () => `${Math.floor(Math.random()*1000)}Kg Of`,
        () => `${Math.floor(Math.random()*1000)}Km Of`,
        () => `${Math.floor(Math.random()*99)} Units Of`,
      ];

      const dynamicSuffixes = [
        () => `V${Math.floor(Math.random()*10)}.${Math.floor(Math.random()*10)}`,
        () => `'${Math.floor(10 + Math.random()*89)}`,
        () => `${Math.floor(1 + Math.random()*9)}000`,
      ];

      // Load prefixes
      const prefixResponse = await fetch('wordlist/racerNamePrefixes.xml');
      const prefixXmlText = await prefixResponse.text();
      const prefixParser = new DOMParser();
      const prefixXml = prefixParser.parseFromString(prefixXmlText, "text/xml");

      window.racerNamePrefixes = [];
      const prefixItems = prefixXml.getElementsByTagName('item');
      for (let item of prefixItems) {
        const index = parseInt(item.getAttribute('index'));
        window.racerNamePrefixes[index] = item.textContent;
      }

      // Add dynamic prefixes
      window.racerNamePrefixes.push(...dynamicPrefixes);

      // Load suffixes
      const suffixResponse = await fetch('wordlist/racerNameSuffixes.xml');
      const suffixXmlText = await suffixResponse.text();
      const suffixParser = new DOMParser();
      const suffixXml = suffixParser.parseFromString(suffixXmlText, "text/xml");

      window.racerNameSuffixes = [];
      const suffixItems = suffixXml.getElementsByTagName('item');
      for (let item of suffixItems) {
        const index = parseInt(item.getAttribute('index'));
        window.racerNameSuffixes[index] = item.textContent;
      }

      // Add dynamic suffixes
      window.racerNameSuffixes.push(...dynamicSuffixes);

      this.updateLoadingProgress(30, 'Word lists loaded');
      console.log('Loaded XML wordlists:', {
        prefixes: window.racerNamePrefixes.length,
        suffixes: window.racerNameSuffixes.length
      });
    } catch (error) {
      console.error('Error loading XML wordlists:', error);
      // Fallback to the JavaScript arrays if XML loading fails
      if (!window.racerNamePrefixes) {
        console.warn('Falling back to JavaScript wordlists');
      }
    }
  }

  async initializeCoreSystems() {
    this.updateLoadingProgress(50, 'Initializing core systems...');
    
    // Initialize core game systems
    // This will be expanded as we convert individual modules
    
    // Simulate some initialization time
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

    // Register screens
    this.uiManager.registerScreen('intro', new IntroScreen());
    this.uiManager.registerScreen('game', new GameScreen(this.gameStateManager));

    // Show the intro screen
    this.uiManager.showScreen('intro', { gameState: this.gameState });

    // Initialize legacy UI components that might still be needed globally
    if (window.Tabs) window.Tabs.initialize();
    
    this.updateLoadingProgress(90, 'Interface ready');
  }
}

// LoadingManager class to handle loading state
class LoadingManager {
  constructor() {
    this.loadingElement = null;
    this.createLoadingElement();
  }

  createLoadingElement() {
    this.loadingElement = document.createElement('div');
    this.loadingElement.id = 'loadingOverlay';
    this.loadingElement.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading...</div>
        <div class="loading-bar">
          <div class="loading-progress"></div>
        </div>
      </div>
    `;
    this.loadingElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      color: white;
      font-family: 'Orbitron', sans-serif;
    `;
  }

  show() {
    if (!this.loadingElement.parentNode) {
      document.body.appendChild(this.loadingElement);
    }
  }

  hide() {
    if (this.loadingElement.parentNode) {
      document.body.removeChild(this.loadingElement);
    }
  }

  updateProgress(progress, message) {
    const progressBar = this.loadingElement.querySelector('.loading-progress');
    const textElement = this.loadingElement.querySelector('.loading-text');
    
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
    if (textElement) {
      textElement.textContent = message || 'Loading...';
    }
  }
}

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