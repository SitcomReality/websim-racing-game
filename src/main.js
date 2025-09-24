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
import { UIManager } from '../ui/UIManager.js';
// Ensure legacy UI helpers are available
import '../ui/components/settingsPanel.js';
import '../ui/components/tabs.js';
import '../ui/eventHandlers.js';
import { initGame } from '../init.js';
import '../setupRace.js';
import '../setupTrack.js';
import '../domUtils.js';

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
    
    // UI Components
    this.uiManager = new UIManager(this.eventBus);
    this.hud = new HUDComponent(document.getElementById('hud'));
    
    // Make eventBus available globally for compatibility
    window.eventBus = this.eventBus;
    window.app = this;
    
    // Setup event listeners
    this.setupEventListeners();
  }

  async initialize() {
    try {
      // Load XML wordlists first
      await this.loadXmlWordlists();

      // Initialize core systems
      await this.initializeCoreSystems();

      // Load and initialize modules
      await this.moduleLoader.loadModules();

      // Initialize UI
      this.initializeUI();

      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      throw error;
    }
  }

  /**
   * Setup event listeners for game logic
   */
  setupEventListeners() {
    // Race events
    this.eventBus.on('race:startWeek', () => {
      const week = this.progressionManager.startNewRaceWeek();
      if (week && this.hud) {
        this.hud.setStep(2, 'done');
        this.hud.setStep(3, 'active');
      }
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
    });
    
    this.eventBus.on('game:initialize', () => {
      initGame(this.gameStateManager);
      this.hud.setStep(1, 'done');
      this.hud.setStep(2, 'active');
      this.hud.setStatus('Racers and tracks generated. Start Race Week.');
      const intro = document.getElementById('introScreen');
      if (intro) intro.remove();
    });
  }

  /**
   * Check and award achievements
   */
  checkAchievements(eventType, data) {
    this.progressionManager.checkAchievements(eventType, data);
  }

  async loadXmlWordlists() {
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
    // Initialize core game systems
    // This will be expanded as we convert individual modules
  }

  initializeUI() {
    // Legacy UI initialization: hide no-js and show intro
    const noJsDiv = document.getElementById('no-js');
    if (noJsDiv) noJsDiv.style.display = 'none';

    const introScreen = document.getElementById('introScreen');
    if (introScreen) introScreen.style.display = 'block';

    // Initialize legacy UI components
    if (window.SettingsPanel) SettingsPanel.refresh();
    if (window.Tabs) Tabs.initialize();
    if (window.EventHandlers) EventHandlers.initializeAll();
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