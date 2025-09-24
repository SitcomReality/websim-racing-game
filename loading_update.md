A lading system to provide feedback during script loading and initialization. This will involve creating a `LoadingComponent` to manage a loading screen overlay, which will be visible from the moment the page starts loading. Then integrate this component into the application's startup and game initialization routines to display progress messages and a progress bar during potentially long operations like loading word lists and generating racers.

index.html
src/main.js
styles/components/gui.css
init.js
ui/components/BaseComponent.js
ui/index.js
ui/components/LoadingComponent.js
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Racing Game</title>
    
    <!-- Load variables first so other styles can use them -->
    <link rel="stylesheet" href="styles/base/variables.css">
    <!-- Base Reset & Typography -->
    <link rel="stylesheet" href="styles/base/reset.css">
    <link rel="stylesheet" href="styles/base/typography.css">
    
    <!-- Layout Styles -->
    <link rel="stylesheet" href="styles/layout/main.css">
    <link rel="stylesheet" href="styles/layout/grid.css">
    <link rel="stylesheet" href="styles/layout/flex.css">
    
    <!-- Component Styles -->
    <link rel="stylesheet" href="styles/components/buttons.css">
    <link rel="stylesheet" href="styles/components/forms.css">
    <link rel="stylesheet" href="styles/components/gui.css">
    <link rel="stylesheet" href="styles/components/track.css">
    <link rel="stylesheet" href="styles/components/racers.css">
    
    <!-- Utility Styles -->
    <link rel="stylesheet" href="styles/utilities/helpers.css">
    <link rel="stylesheet" href="styles/utilities/animations.css">
    <link rel="stylesheet" href="styles/utilities/responsive.css">
    
    <!-- Theme Styles (load last to allow overrides) -->
    <link rel="stylesheet" href="styles/themes/dark.css">
    <link rel="stylesheet" href="styles/themes/light.css">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Roboto:wght@400;700&display=swap" rel="stylesheet">
</head>
<body data-theme="dark">
    <div id="loading-screen">
        <div class="loading-spinner"></div>
        <div class="loading-text">
            <h2 class="loading-title">LOADING</h2>
            <p class="loading-message">Initializing application...</p>
        </div>
        <div class="loading-progress">
            <div class="loading-progress-bar"></div>
        </div>
    </div>
    <div id="no-js" style="text-align:center;background-color:white;width:80%;margin:5% 10%;color:#391d1d;padding:2px 4px 12px 4px;border:3px dashed #ff6000;z-index:99999;position:fixed;"><h2 style="color:red;">No JavaScript?</h2><p style="font-weight:bold;">JavaScript is required for this page to work.</p><p>If you're seeing this message, it's because JavaScript is disabled.</p><p>Check your browser/NoScript settings and make sure JavaScript is allowed for this domain.</p></div>
    <div id="app"></div>
    <script>
      (function setPaletteCSS() {
        const racerColors = [
        	"#FFF275", "#FF8C42", "#FF3C38", "#A23E48", "#6C8EAD",
        	"#171219", "#225560", "#7AC74F", "#F1DABF", "#08BDBD",
        	"#2A0C4E", "#EEABC4", "#006BA6", "#161032", "#E06D06",
        	"#475841", "#266DD3", "#B7ADCF", "#4F646F", "#083D77",
        	"#EE964B", "#1D3557", "#F7A072", "#435058", "#084C61",
        	"#606C38", "#283618", "#FFB2E6", "#D972FF", "#EA9E8D",
        	"#1C2826"
        ];
        window.racerColors = racerColors;
        const root = document.documentElement;
        for (let i = 0; i < racerColors.length; i++) {
          root.style.setProperty(`--racer-color-${i}`, racerColors[i]);
        }
      })();
    </script>
    <script type="module" src="src/main.js"></script>
</body>
</html>// Main entry point for the ES6 module system
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
import { LoadingComponent } from '../ui/components/LoadingComponent.js';
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
    
    // UI Manager
    this.uiManager = new UIManager(this.eventBus);
    this.loadingManager = new LoadingComponent(document.getElementById('loading-screen'));
    
    // Initialize game logic managers
    this.raceManager = new RaceManager(this.eventBus, this.gameStateManager);
    this.bettingManager = new BettingManager(this.eventBus, this.gameStateManager);
    this.progressionManager = new ProgressionManager(this.eventBus, this.gameStateManager);
    this.eventBus._progressionManager = this.progressionManager;
    
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
      this.loadingManager.show('Initializing Application...');

      // Load XML wordlists first
      this.loadingManager.update('Loading wordlists...', 20);
      await this.loadXmlWordlists();

      // Initialize core systems
      this.loadingManager.update('Initializing core systems...', 40);
      await this.initializeCoreSystems();

      // Load and initialize modules
      this.loadingManager.update('Loading modules...', 60);
      await this.moduleLoader.loadModules();

      // Initialize UI
      this.loadingManager.update('Initializing UI...', 80);
      this.initializeUI();

      this.loadingManager.update('Ready!', 100);
      console.log('Application initialized successfully');
      this.loadingManager.hide();
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.loadingManager.update('Error during initialization. Check console.');
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
    
    this.eventBus.on('game:initialize', async () => {
      this.loadingManager.show('Generating New Game...');
      // Using setTimeout to allow the UI to update with the loading message
      await new Promise(resolve => setTimeout(resolve, 50)); 
      
      initGame(this.gameStateManager, this.loadingManager);
      
      this.loadingManager.update('Finalizing...', 100);
      await new Promise(resolve => setTimeout(resolve, 50)); 

      this.uiManager.showScreen('game');
      this.loadingManager.hide();
    });

    this.eventBus.on('race:update', (raceData) => {
        if (this.uiManager.activeScreen?.renderManager) {
            this.uiManager.activeScreen.renderManager.setRace(raceData.race, { numberOfLanes: raceData.race.racers.length});
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
export { Application };.gui-container {
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    background: url("../../assets/images/panel_background.png") repeat, linear-gradient(180deg, #2d2d2d 0%, #1a1a1a 100%);
    border: 1px solid #444;
    padding: 15px;
}

.race-week-container {
    margin: 10px 0;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #444;
    background: rgba(0,0,0,0.3);
    transition: all 0.3s ease;
}

.race-week-container.current-week {
    border-color: var(--accent-color);
    background: linear-gradient(135deg, rgba(0,123,255,0.1) 0%, rgba(0,0,0,0.3) 100%);
    box-shadow: 0 0 15px rgba(0,123,255,0.3);
}

.race-week-container.past-week {
    opacity: 0.6;
    border-color: #555;
}

.race-week-container.past-week:hover {
    opacity: 0.8;
}

.race-week-header {
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
}

.race-week-header h4 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: var(--accent-color);
}

.track-info {
    display: flex;
    gap: 15px;
    font-size: 12px;
    color: var(--text-secondary);
}

.track-length {
    background: rgba(0,123,255,0.2);
    padding: 2px 6px;
    border-radius: 4px;
}

.ground-types {
    font-style: italic;
}

.racers-list {
    margin: 0;
    padding-left: 0;
    list-style: none;
}

.racers-list li {
    margin: 4px 0;
    font-size: 11px;
}

.stat {
    font-family: 'Orbitron', sans-serif;
    font-weight: bold;
    color: #4dff88;
    background: rgba(0,0,0,0.3);
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid #4dff88;
}

#hud .hud-steps {
    display: flex; gap: 8px; align-items: center; margin-bottom: 8px;
}
#hud .step {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 10px; border: 1px solid #555; border-radius: 16px;
    background: rgba(0,0,0,0.3); color: var(--text-primary);
    opacity: 0.6; transition: opacity .2s ease, border-color .2s ease;
}
#hud .step .num {
    display: inline-block; width: 18px; height: 18px; border-radius: 50%;
    background: var(--accent-color); color: #fff; font-size: 12px; text-align: center; line-height: 18px;
}
#hud .step.active { opacity: 1; border-color: var(--accent-color); }
#hud .step.done { opacity: 0.9; border-color: #2aa34a; }
#hud .hud-status {
    padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px;
    background: rgba(0,0,0,0.25);
}

.tabs { display: flex; flex-direction: column; gap: 10px; }
.tab-buttons { display: flex; gap: 6px; }
.tab-button {
    padding: 6px 10px; border: 1px solid #555; background: rgba(0,0,0,0.2);
    color: var(--text-primary); border-radius: 6px; cursor: pointer; font-size: 12px;
}
.tab-button.active { border-color: var(--accent-color); background: rgba(0,0,0,0.35); }
.tab-content { position: relative; }
.tab-panel { display: none; }
.tab-panel.active { display: block; }

/* Loading Screen */
#loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--bg-primary);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    color: var(--text-primary);
    transition: opacity 0.5s ease-in-out;
}

.loading-spinner {
    border: 8px solid var(--border-color);
    border-top: 8px solid var(--accent-color);
    border-radius: 50%;
    width: 80px;
    height: 80px;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.loading-text {
    text-align: center;
}

.loading-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 24px;
    letter-spacing: 4px;
    margin-bottom: 10px;
    color: var(--accent-color);
}

.loading-message {
    font-size: 16px;
    font-family: 'Roboto', sans-serif;
    color: var(--text-secondary);
}

.loading-progress {
    width: 300px;
    height: 8px;
    background-color: var(--border-color);
    border-radius: 4px;
    margin-top: 20px;
    overflow: hidden;
}

.loading-progress-bar {
    width: 0%;
    height: 100%;
    background-color: var(--accent-color);
    border-radius: 4px;
    transition: width 0.3s ease;
}import { calculateBasePropertyAverage, generateUniqueNumbers, getRacerNameString } from './src/utils/helpers.js';
import { Racer } from './src/entities/racer/Racer.js';
import { Track } from './src/models/Track.js';

// Import locationSuffixes from the constants file
import { locationSuffixes } from './wordlist/const_locationSuffixes.js';

// window.Track = Track; // DEPRECATED: No longer needed for save/load

function initGame(gameState, loadingManager) {
	loadingManager?.update('Calculating baseline performance...', 10);
	const avgSpeed = 
		gameState.settings.racerProperties.speedBase *
		calculateBasePropertyAverage(gameState.settings.weatherProperties) *
		calculateBasePropertyAverage(gameState.settings.groundProperties) *
		calculateBasePropertyAverage(gameState.settings.thirdProperties);
	
	// define the average speed using the calculated values from settings
	gameState.racerPerformance.baseline.averageSpeed = avgSpeed;
	
	
	// use the avg speed calculation to set the base endurance for the racers
	const averageTrackLength = ((gameState.settings.trackProperties.minSectionsPerTrack + gameState.settings.trackProperties.maxSectionsPerTrack) / 2) * gameState.settings.trackProperties.segmentsPerSection;
	gameState.settings.racerProperties.enduranceBase = Math.floor(((avgSpeed * gameState.settings.racerProperties.speedMultiplier) * averageTrackLength) * gameState.settings.racerProperties.enduranceInitialValueMultiplier);
	gameState.settings.racerProperties.enduranceVariance = Math.floor(gameState.settings.racerProperties.enduranceBase * 0.15);
	

	loadingManager?.update('Generating racers...', 30);
	gameState.racers = generateNewRacers(gameState.settings.racerProperties.totalPoolSize, gameState.settings);
	
	// Ensure name lists exist (fallbacks for older/partial loads)
	const racerNamePrefixesList = (window.racerNamePrefixes && window.racerNamePrefixes.length) ? window.racerNamePrefixes : ['Racer'];
	const racerNameSuffixesList = (window.racerNameSuffixes && window.racerNameSuffixes.length) ? window.racerNameSuffixes : ['Ferret'];
	const locationSuffixesList = (locationSuffixes && locationSuffixes.length) ? locationSuffixes : ['Track'];
	
	const trackNamePrefixesId = generateUniqueNumbers(0, racerNamePrefixesList.length - 1, gameState.settings.trackProperties.totalPoolSize);
	const trackNameSuffixesId = generateUniqueNumbers(0, locationSuffixesList.length - 1, gameState.settings.trackProperties.totalPoolSize);

	loadingManager?.update('Generating tracks...', 70);
	for (let i = 0; i < gameState.settings.trackProperties.totalPoolSize; i++) {
        const trackName = racerNamePrefixesList[trackNamePrefixesId[i]] + " " + locationSuffixesList[(trackNameSuffixesId[i])];
        const min = gameState.settings.trackProperties.minSectionsPerTrack;
        const max = gameState.settings.trackProperties.maxSectionsPerTrack;
        const numSections = Math.floor(Math.random() * (max - min + 1)) + min;
        const track = new Track(i, trackName, numSections, gameState.settings.worldProperties.groundTypes);
		gameState.tracks.push(track);
	}
	
	// Initialize other elements like starting money, settings, etc.
}

function generateNewRacers(numberToGenerate, settings) {
	const racers = [];
	const namePrefixes = (window.racerNamePrefixes && window.racerNamePrefixes.length) ? window.racerNamePrefixes : ['Racer'];
	const nameSuffixes = (window.racerNameSuffixes && window.racerNameSuffixes.length) ? window.racerNameSuffixes : ['Ferret'];
	const namePrefixNumber = generateUniqueNumbers(0, namePrefixes.length - 1, numberToGenerate);
	const nameSuffixNumber = generateUniqueNumbers(0, nameSuffixes.length - 1, numberToGenerate);
	for (let i = 0; i < numberToGenerate; i++) {
        const name = namePrefixes[namePrefixNumber[i]] + ' ' + nameSuffixes[nameSuffixNumber[i]];
		const colors = [
			Math.floor(Math.random() * 31),
			Math.floor(Math.random() * 31),
			Math.floor(Math.random() * 31),
		];
		racers.push(new Racer(i, name, colors, settings));
	}
	return racers;
}

export { initGame };/** 
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