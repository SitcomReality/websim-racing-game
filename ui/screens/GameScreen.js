import { RacerCardComponent } from '../components/RacerCardComponent.js';
import { HUDComponent } from '../components/HUDComponent.js';
import { BettingComponent } from '../components/BettingComponent.js';
import { RenderManager } from '../../render/RenderManager.js';
import { createGameLayout } from './game/GameLayout.js';
import { TabsController } from './game/TabsController.js';
import { RaceWeekPanel } from './game/RaceWeekPanel.js';
import { HistoryPanel } from './game/HistoryPanel.js';

/** 
 * GameScreen - Main game screen
 */
export class GameScreen {
  constructor(gameState = null) {
    this.element = null;
    this.eventBus = null;
    this.hudComponent = null;
    this.bettingComponent = null;
    this.renderManager = null;
    this.gameState = gameState;
    this.tabsController = null;
    this.raceWeekPanel = null;
    this.historyPanel = null;
    this.countdownElement = null;
    this.raceOverlay = null;
    this.leaderboard = null;
  }

  initialize(eventBus) {
    this.eventBus = eventBus;
    this.createElement();
    
    this.renderManager = new RenderManager(this.element.querySelector('#raceCanvas'), this.gameState);
    this.renderManager.initialize();
    
    this.setupComponents();
    this.bindEvents();

    // Game State -> UI events
    this.eventBus.on('race:weekStarted', (data) => this.onRaceWeekStarted(data));
    this.eventBus.on('race:setupComplete', (data) => this.onRaceSetup(data));
    this.eventBus.on('race:start', (data) => this.onRaceStart(data));
    this.eventBus.on('race:finish', (raceData) => this.onRaceFinish(raceData));
    this.eventBus.on('race:countdownStarted', (data) => this.onCountdownStarted(data));
    this.eventBus.on('bets:settled', () => this.updatePlayerBalance());
    this.eventBus.on('race:update', (data) => this.onRaceUpdate(data));
    this.eventBus.on('progression:weekStarted', (data) => this.displayRaceWeekInfo(this.gameState.raceWeek));
    this.eventBus.on('race:countdown', (data) => this.onRaceCountdown(data));
  }

  createElement() {
    this.element = createGameLayout();
    this.createRaceOverlay();
  }

  createRaceOverlay() {
    // Create race countdown overlay
    this.countdownElement = document.createElement('div');
    this.countdownElement.className = 'race-countdown-overlay';
    this.countdownElement.innerHTML = `
      <div class="countdown-container comic-burst-memphis">
        <div class="countdown-number">3</div>
        <div class="countdown-text">GET READY!</div>
      </div>
      <div class="action-lines-memphis"></div>
    `;

    // Create minimal race overlay with leaderboard
    this.raceOverlay = document.createElement('div');
    this.raceOverlay.className = 'race-overlay-memphis';
    this.raceOverlay.innerHTML = `
      <div class="race-info-panel">
        <div class="race-title-mini"></div>
        <div class="weather-mini"></div>
      </div>
      <div class="leaderboard-mini">
        <div class="leaderboard-header">POSITIONS</div>
        <div class="leaderboard-content"></div>
      </div>
      <button class="end-race-btn comic-burst-memphis" id="endRaceManual">
        FINISH
      </button>
    `;

    // Add overlays to canvas container
    const canvasContainer = this.element.querySelector('#raceCanvas')?.parentElement;
    if (canvasContainer) {
      canvasContainer.style.position = 'relative';
      canvasContainer.appendChild(this.countdownElement);
      canvasContainer.appendChild(this.raceOverlay);
    }
  }

  setupComponents() {
    // Setup HUD component
    const hudElement = this.element.querySelector('#hud');
    if (hudElement) {
      this.hudComponent = new HUDComponent(hudElement);
      this.hudComponent.initialize();
    }

    // Setup betting component
    const bettingElement = this.element.querySelector('#bettingPanel');
    if (bettingElement) {
      this.bettingComponent = new BettingComponent(bettingElement, {
        eventBus: this.eventBus
      });
      this.bettingComponent.initialize();
    }

    this.tabsController = new TabsController(this.element);
    this.tabsController.initialize();
    this.raceWeekPanel = new RaceWeekPanel(this.element, this.gameState);
    this.historyPanel = new HistoryPanel(this.element, this.gameState);
  }

  bindEvents() {
    // Bind header button events
    const startRaceWeekBtn = this.element.querySelector('#startRaceWeek');
    const setupRaceBtn = this.element.querySelector('#setupRace');
    const startBtn = this.element.querySelector('#startRace');
    const endNowBtn = this.element.querySelector('#endRaceNow');

    if (startRaceWeekBtn) {
      startRaceWeekBtn.addEventListener('click', () => {
        this.eventBus.emit('race:startWeek');
        startRaceWeekBtn.disabled = true;
        setupRaceBtn.disabled = false;
      });
    }

    if (setupRaceBtn) {
      setupRaceBtn.addEventListener('click', () => {
        this.eventBus.emit('race:setup');
        setupRaceBtn.disabled = true;
        startBtn.disabled = false;
      });
    }

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.eventBus.emit('race:start');
        startBtn.disabled = true;
        if (endNowBtn) endNowBtn.disabled = false;
      });
    }

    // tabs are now initialized via TabsController in setupComponents

    // Manual end race now
    if (endNowBtn) {
      endNowBtn.addEventListener('click', () => {
        this.eventBus.emit('race:endNow');
        endNowBtn.disabled = true;
      });
    }
  }

  onRaceWeekStarted(data) {
    this.hudComponent.setStep(1, 'done');
    this.hudComponent.setStep(2, 'done');
    this.hudComponent.setStep(3, 'active');
    this.hudComponent.setStatus(`Race Week ${data.weekNumber} started. Setup the next race.`);
    this.updateRaceNumbers();
    
    // Add glow effect to setup button
    const setupBtn = this.element.querySelector('#setupRace');
    if (setupBtn) {
      setupBtn.classList.add('memphis-glow');
    }
  }

  onRaceSetup(data) {
    this.hudComponent.setStep(3, 'done');
    this.hudComponent.setStep(4, 'active');
    this.hudComponent.setStatus('Race is set up. Place your bets and start the race!');
    this.updateRaceNumbers();
    
    // Remove glow from setup, add to start
    const setupBtn = this.element.querySelector('#setupRace');
    const startBtn = this.element.querySelector('#startRace');
    if (setupBtn) setupBtn.classList.remove('memphis-glow');
    if (startBtn) startBtn.classList.add('memphis-pulse');
    
    const { race } = data;
    this.renderManager.setRace(race, { numberOfLanes: race.racers.length });
    // Reset countdown and camera for fresh race setup
    this.renderManager.raceEndCountdown = null;
    const dims = this.renderManager.canvasAdapter.getDimensions();
    const baselineZoom = this.renderManager.camera.director.cameraCalculator.getTrackBasedZoom(dims, race);
    this.renderManager.camera.target.x = 0;
    this.renderManager.camera.zoom = baselineZoom;
    const weatherDisplay = this.element.querySelector("#overlayWeather");
    if(weatherDisplay) {
        weatherDisplay.textContent = `Weather: ${race.weather}`;
    }
    // Highlight the current race in the race week panel
    this.highlightCurrentRace(this.gameState.currentRaceIndex);
    // Initial render of the track and racers at starting line
    this.renderManager.renderOnce();
    
    // Update race overlay info
    const raceTitleMini = this.raceOverlay?.querySelector('.race-title-mini');
    const weatherMini = this.raceOverlay?.querySelector('.weather-mini');
    
    if (raceTitleMini) raceTitleMini.textContent = race.track?.name || 'Race Track';
    if (weatherMini) weatherMini.textContent = race.weather;
    
    this.element.classList.remove('race-mode');
  }

  onRaceStart(data) {
    this.hudComponent.setStep(4, 'done');
    this.hudComponent.setStatus('The race is on!');
    this.renderManager.start();
    
    // Remove pulse from start button
    const startBtn = this.element.querySelector('#startRace');
    if (startBtn) startBtn.classList.remove('memphis-pulse');
    
    const endNowBtn = this.element.querySelector('#endRaceNow');
    if (endNowBtn) endNowBtn.disabled = false;
    
    // Start countdown before race
    this.element.classList.add('race-mode');
    this.startRaceCountdown(() => {
      this.actuallyStartRace(data);
    });
  }

  startRaceCountdown(callback) {
    if (!this.countdownElement) return callback();
    
    this.countdownElement.style.display = 'flex';
    this.countdownElement.classList.add('countdown-active');
    
    const countdownNumber = this.countdownElement.querySelector('.countdown-number');
    const countdownText = this.countdownElement.querySelector('.countdown-text');
    
    let count = 3;
    const countdownInterval = setInterval(() => {
      if (count > 0) {
        countdownNumber.textContent = count;
        countdownText.textContent = count === 1 ? 'GO!' : 'GET READY!';
        
        // Add pulse animation
        countdownNumber.style.animation = 'none';
        setTimeout(() => {
          countdownNumber.style.animation = 'countdown-pulse 1s ease-out';
        }, 10);
        
        count--;
      } else {
        clearInterval(countdownInterval);
        
        // Show GO! with explosion effect
        countdownNumber.textContent = 'GO!';
        countdownText.textContent = 'RACE!';
        countdownNumber.parentElement.classList.add('explosion');
        
        setTimeout(() => {
          this.countdownElement.style.display = 'none';
          this.countdownElement.classList.remove('countdown-active');
          this.raceOverlay.style.display = 'block';
          callback();
        }, 800);
      }
    }, 1000);
  }

  actuallyStartRace(data) {
    this.hudComponent.setStep(4, 'done');
    this.hudComponent.setStatus('The race is on!');
    this.renderManager.start();
    
    // Remove pulse from start button
    const startBtn = this.element.querySelector('#startRace');
    if (startBtn) startBtn.classList.remove('memphis-pulse');
    
    const endNowBtn = this.element.querySelector('#endRaceNow');
    if (endNowBtn) endNowBtn.disabled = false;
    
    // Setup manual end race button
    const endRaceManual = this.raceOverlay?.querySelector('#endRaceManual');
    if (endRaceManual) {
      endRaceManual.addEventListener('click', () => {
        this.eventBus.emit('race:endNow');
      });
    }
    
    // Start leaderboard updates
    this.startLeaderboardUpdates();
  }

  onRaceCountdown(data) {
    // Handle countdown events if needed
  }

  startLeaderboardUpdates() {
    if (this.leaderboardInterval) clearInterval(this.leaderboardInterval);
    
    this.leaderboardInterval = setInterval(() => {
      this.updateLeaderboard();
    }, 500);
  }

  updateLeaderboard() {
    const leaderboardContent = this.raceOverlay?.querySelector('.leaderboard-content');
    if (!leaderboardContent || !this.gameState.currentRace) return;
    
    const race = this.gameState.currentRace;
    const activeRacers = race.racers.filter(rid => !(race.results || []).includes(rid));
    
    // Sort by current position
    const sortedRacers = [...activeRacers]
      .sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0))
      .slice(0, 6); // Show top 6
    
    const leaderboardHTML = sortedRacers.map((racerId, index) => {
      const racer = this.gameState.racers.find(r => r.id === racerId);
      const racerName = this.getRacerNameString(racer);
      const position = race.liveLocations[racerId] || 0;
      
      return `
        <div class="leaderboard-item">
          <span class="position">${index + 1}</span>
          <span class="racer-name">${racerName}</span>
          <span class="progress">${Math.round(position)}%</span>
        </div>
      `;
    }).join('');
    
    leaderboardContent.innerHTML = leaderboardHTML;
  }

  onRaceUpdate(data) {
    // This is handled by the main.js now to avoid tight coupling
  }

  onRaceFinish(raceData) {
    // Clear leaderboard updates
    if (this.leaderboardInterval) {
      clearInterval(this.leaderboardInterval);
      this.leaderboardInterval = null;
    }
    
    // Hide race overlay
    if (this.raceOverlay) {
      this.raceOverlay.style.display = 'none';
    }
    
    this.renderManager.stop();
    this.hudComponent.setStep(3, 'active'); 
    this.hudComponent.setStep(4, ''); 
    this.hudComponent.setStatus('Race finished! View results in History. Setup the next race.');

    // Add shake animation to indicate race completion
    this.element.classList.add('memphis-shake');
    setTimeout(() => {
      this.element.classList.remove('memphis-shake');
    }, 500);

    this.updateRaceHistory(raceData);
    
    // Re-enable buttons for the next race in the week
    const setupRaceBtn = this.element.querySelector('#setupRace');
    const startBtn = this.element.querySelector('#startRace');
    const startRaceWeekBtn = this.element.querySelector('#startRaceWeek');
    const endNowBtn = this.element.querySelector('#endRaceNow');
    
    const gameState = this.gameState;
    if (gameState.currentRaceIndex >= gameState.raceWeek.races.length) {
      // End of week
      this.hudComponent.setStatus('Race week complete! Start a new week.');
      setupRaceBtn.disabled = true;
      startRaceWeekBtn.disabled = false;
      this.clearRaceWeekInfo();
    } else {
      setupRaceBtn.disabled = false;
    }
    startBtn.disabled = true;
    if (endNowBtn) endNowBtn.disabled = true;
    
    this.element.classList.remove('race-mode');
  }

  updateRaceHistory(raceData) {
    this.historyPanel.updateRaceHistory(raceData);
  }

  bindTabEvents() {
    const tabButtons = this.element.querySelectorAll('.tab-button');
    const tabPanels = this.element.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const tabName = e.target.getAttribute('data-tab');
        
        // Update active states
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanels.forEach(panel => panel.classList.remove('active'));
        
        e.target.classList.add('active');
        const targetPanel = this.element.querySelector(`[data-tab-panel="${tabName}"]`);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
      });
    });
  }
  
  updatePlayerBalance() {
    const balanceEl = this.element.querySelector('#playerBalance');
    if (balanceEl) {
      balanceEl.textContent = `$${this.gameState.player.balance.toFixed(2)}`;
    }
  }

  updateRaceNumbers() {
    const raceWeekNumberEl = this.element.querySelector('#raceWeekNumber');
    const raceNumberThisWeekEl = this.element.querySelector('#raceNumberThisWeek');
    const raceNumberEl = this.element.querySelector('#raceNumber');
    const gameState = this.gameState;
    
    if (raceWeekNumberEl) raceWeekNumberEl.textContent = gameState.raceWeekCounter;
    if (raceNumberThisWeekEl) raceNumberThisWeekEl.textContent = gameState.currentRaceIndex + 1;
    if (raceNumberEl) raceNumberEl.textContent = gameState.raceHistory.length + 1;
  }

  displayRaceWeekInfo(raceWeek) {
    this.raceWeekPanel.displayRaceWeekInfo(raceWeek);
  }

  highlightCurrentRace(raceIndex) {
    this.raceWeekPanel.highlightCurrentRace(raceIndex);
  }
  
  clearRaceWeekInfo() {
    this.raceWeekPanel.clearRaceWeekInfo();
  }
  
  getRacerNameString(racer) {
    if (!racer || !racer.name) return "Unknown Racer";

    const prefix = window.racerNamePrefixes?.[racer.name[0]];
    const suffix = window.racerNameSuffixes?.[racer.name[1]];

    let prefixStr, suffixStr;

    if (typeof prefix === 'function') {
      prefixStr = racer._evaluatedPrefix || (racer._evaluatedPrefix = prefix());
    } else {
      prefixStr = prefix;
    }

    if (typeof suffix === 'function') {
      suffixStr = racer._evaluatedSuffix || (racer._evaluatedSuffix = suffix());
    } else {
      suffixStr = suffix;
    }

    return `${prefixStr} ${suffixStr}`;
  }

  show(data = {}) {
    (data?.container || document.getElementById('app') || document.body).appendChild(this.element);
    
    // Add fade in animation for game screen
    this.element.classList.add('fade-in');
    
    // Initial UI state update
    this.hudComponent.setStep(1, 'done');
    this.hudComponent.setStep(2, 'active');
    this.hudComponent.setStatus('Game initialized. Start the first Race Week.');
    this.updatePlayerBalance();
    
    // Resize canvas after it's added to the DOM
    if (this.renderManager) {
        this.renderManager.resizeToContainer();
    }

    if (window.Tabs?.initialize) window.Tabs.initialize();
    
    // Add pulse animation to primary action buttons
    const startWeekBtn = this.element.querySelector('#startRaceWeek');
    if (startWeekBtn) {
      startWeekBtn.classList.add('memphis-pulse');
    }
  }

  hide() {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

  updateHUD(step, status) {
    if (this.hudComponent) {
      this.hudComponent.setStep(step, 'active');
      this.hudComponent.setStatus(status);
    }
  }

  updateBetting(racers) {
    if (this.bettingComponent) {
      this.bettingComponent.setRacers(racers);
    }
  }

  cleanup() {
    if (this.leaderboardInterval) {
      clearInterval(this.leaderboardInterval);
      this.leaderboardInterval = null;
    }
    this.hudComponent?.cleanup();
    this.bettingComponent?.cleanup();
    this.renderManager?.cleanup();
    this.element = null;
    this.eventBus = null;
  }
}