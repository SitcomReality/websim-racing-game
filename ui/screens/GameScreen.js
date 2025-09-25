import { RacerCardComponent } from '../components/RacerCardComponent.js';
import { HUDComponent } from '../components/HUDComponent.js';
import { BettingComponent } from '../components/BettingComponent.js';
import { RenderManager } from '../../render/RenderManager.js';

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
    this.eventBus.on('bets:settled', () => this.updatePlayerBalance());
    this.eventBus.on('race:update', (data) => this.onRaceUpdate(data));
    this.eventBus.on('progression:weekStarted', (data) => this.displayRaceWeekInfo(this.gameState.raceWeek));
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.id = 'gameScreen';
    this.element.innerHTML = `
      <div id="header" class="ui gui-container">
        <div class="header-left">
          <div class="logo">RACER-X</div>
        </div>
        <div class="header-center">
          <div class="ui-item"><button id="startRaceWeek" class="btn btn-primary">Start Race Week</button></div>
          <div class="ui-item"><button id="setupRace" disabled class="btn btn-secondary">Setup Race</button></div>
          <div class="ui-item"><button id="startRace" disabled class="btn btn-primary">Start Race</button></div>
        </div>
        <div class="header-right">
          <div class="ui-item stat"><span id="playerBalanceLabel">Player Balance:</span> <span id="playerBalance">$1000</span></div>
          <div class="ui-section raceNumbers" id="raceNumbers">
            <div class="ui-item">
              <div class="raceNumbersInfo">Race Week <span id="raceWeekNumber">-1</span></div>
              <div class="raceNumbersInfo">Race <span id="raceNumberThisWeek">-1</span> (<span id="raceNumber">-1</span>)</div>
            </div>
          </div>
        </div>
      </div>
      
      <div id="hud" class="ui gui-container">
        <div class="hud-steps">
          <div class="step" data-step="1"><span class="num">1</span> New Game</div>
          <div class="step" data-step="2"><span class="num">2</span> Start Race Week</div>
          <div class="step" data-step="3"><span class="num">3</span> Setup Race</div>
          <div class="step" data-step="4"><span class="num">4</span> Start Race</div>
        </div>
        <div id="statusText" class="hud-status">Welcome! Click "New Game" to begin.</div>
      </div>
      
      <main id="game-container">
        <div id="left-panel">
          <div class="ui gui-container tabs" id="sidebarTabs">
            <div class="tab-buttons">
              <button class="tab-button active" data-tab="raceweek">Race Week</button>
              <button class="tab-button" data-tab="betting">Betting</button>
              <button class="tab-button" data-tab="history">History</button>
              <button class="tab-button" data-tab="settings">Settings</button>
            </div>
            <div class="tab-content">
              <div class="tab-panel active" data-tab-panel="raceweek">
                <div id="raceWeekPanel" class="ui gui-container">
                  <h4>Race Week Info</h4>
                  <div id="raceWeekRacesContainer">Press "Start Race Week" to see races.</div>
                </div>
              </div>
              <div class="tab-panel" data-tab-panel="betting">
                <div id="bettingPanel" class="ui gui-container">
                  <!-- Betting content will be managed by BettingComponent -->
                </div>
              </div>
              <div class="tab-panel" data-tab-panel="history">
                <div id="raceHistory" class="ui gui-container">
                  <h4>Race History</h4>
                  <ul id="historyList"></ul>
                </div>
              </div>
              <div class="tab-panel" data-tab-panel="settings">
                <div id="settings" class="ui gui-container debugui">
                  <div class="ui-section"><h4>Settings</h4></div>
                  <div class="ui-item"><button id="endRace" class="btn btn-outline">End Race</button></div>
                  <div class="ui-item">
                    <label for="speedMultiplier">speedMultiplier</label>
                    <input type="range" min="0.01" max="1.5" step="0.01" id="speedMultiplier" name="speedMultiplier" class="form-control">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="right-panel">
          <div class="track track-container" id="raceTrack">
            <canvas id="raceCanvas" style="width: 100%; height: 100%; display: block;"></canvas>
            <div id="liveLeaderboard" class="overlay-leaderboard">
              <h5>Leaders</h5>
              <ol id="leaderList"></ol>
            </div>
            <div id="overlayWeather" class="overlay-weather"></div>
          </div>
        </div>
      </main>
    `;
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
  }

  bindEvents() {
    // Bind header button events
    const startRaceWeekBtn = this.element.querySelector('#startRaceWeek');
    const setupRaceBtn = this.element.querySelector('#setupRace');
    const startBtn = this.element.querySelector('#startRace');

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
      });
    }

    // Bind tab events
    this.bindTabEvents();
  }

  onRaceWeekStarted(data) {
    this.hudComponent.setStep(1, 'done');
    this.hudComponent.setStep(2, 'done');
    this.hudComponent.setStep(3, 'active');
    this.hudComponent.setStatus(`Race Week ${data.weekNumber} started. Setup the next race.`);
    this.updateRaceNumbers();
  }

  onRaceSetup(data) {
    this.hudComponent.setStep(3, 'done');
    this.hudComponent.setStep(4, 'active');
    this.hudComponent.setStatus('Race is set up. Place your bets and start the race!');
    this.updateRaceNumbers();
    
    const { race } = data;
    this.renderManager.setRace(race, {
      numberOfLanes: race.racers.length
    });
    const weatherDisplay = this.element.querySelector("#overlayWeather");
    if(weatherDisplay) {
        weatherDisplay.textContent = `Weather: ${race.weather}`;
    }
    // Highlight the current race in the race week panel
    this.highlightCurrentRace(this.gameState.currentRaceIndex);
    // Initial render of the track and racers at starting line
    this.renderManager.tick(performance.now());
  }

  onRaceStart(data) {
    this.hudComponent.setStep(4, 'done');
    this.hudComponent.setStatus('The race is on!');
    this.renderManager.start();
  }
  
  onRaceUpdate(data) {
    // This is handled by the main.js now to avoid tight coupling
  }

  onRaceFinish(raceData) {
    this.renderManager.stop();
    this.hudComponent.setStep(3, 'active'); // Ready for next race setup
    this.hudComponent.setStep(4, ''); 
    this.hudComponent.setStatus('Race finished! View results in History. Setup the next race.');

    this.updateRaceHistory(raceData);
    
    // Re-enable buttons for the next race in the week
    const setupRaceBtn = this.element.querySelector('#setupRace');
    const startBtn = this.element.querySelector('#startRace');
    const startRaceWeekBtn = this.element.querySelector('#startRaceWeek');
    
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
  }

  updateRaceHistory(raceData) {
    if (!raceData || !raceData.results || !raceData.race) return;

    const historyList = this.element.querySelector('#historyList');
    if (!historyList) return;

    const newListItem = document.createElement('li');
    const raceTitle = document.createElement('h6');
    raceTitle.textContent = `Race ${raceData.race.id} - ${raceData.race.track.name}`;
    newListItem.appendChild(raceTitle);

    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'd-grid grid-cols-2 gap-2';

    raceData.results.forEach((racerId, index) => {
        const racer = this.gameState.racers.find(r => r.id === racerId);
        if (racer) {
            const racerCard = new RacerCardComponent(racer, { index: index, compact: true });
            resultsContainer.appendChild(racerCard.createElement());
        }
    });

    newListItem.appendChild(resultsContainer);
    historyList.insertBefore(newListItem, historyList.firstChild);
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
    const container = this.element.querySelector('#raceWeekRacesContainer');
    if (!container || !raceWeek) return;
    container.innerHTML = '';

    raceWeek.races.forEach((race, index) => {
      const raceEl = document.createElement('div');
      raceEl.className = 'race-week-container';
      raceEl.id = `race-week-race-${index}`;

      const trackLength = race.track.sections.length;
      const groundTypes = [...new Set(race.track.sections)].join(', ');

      let racersHTML = '<ul class="racers-list">';
      race.racers.forEach(racer => {
        racersHTML += `<li>- ${this.getRacerNameString(racer)}</li>`;
      });
      racersHTML += '</ul>';

      raceEl.innerHTML = `
        <div class="race-week-header">
          <h4>Race ${index + 1}: ${race.track.name}</h4>
          <div class="track-info">
            <span class="track-length">Length: ${trackLength} sections</span>
            <span class="ground-types">Ground: ${groundTypes}</span>
          </div>
        </div>
        <h5>Participants:</h5>
        ${racersHTML}
      `;
      container.appendChild(raceEl);
    });
  }

  highlightCurrentRace(raceIndex) {
    this.element.querySelectorAll('.race-week-container').forEach(el => {
      el.classList.remove('current-race');
      if (parseInt(el.id.split('-').pop()) < raceIndex) {
        el.classList.add('past-race');
      } else {
         el.classList.remove('past-race');
      }
    });
    const currentRaceEl = this.element.querySelector(`#race-week-race-${raceIndex}`);
    if (currentRaceEl) {
      currentRaceEl.classList.add('current-race');
    }
  }
  
  clearRaceWeekInfo() {
      const container = this.element.querySelector('#raceWeekRacesContainer');
      if(container) {
        container.innerHTML = 'Race week complete. Press "Start Race Week" to begin a new one.';
      }
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
    
    // Initial UI state update
    this.hudComponent.setStep(1, 'done');
    this.hudComponent.setStep(2, 'active');
    this.hudComponent.setStatus('Game initialized. Start the first Race Week.');
    this.updatePlayerBalance();
    
    if (window.Tabs?.initialize) window.Tabs.initialize();
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
    this.hudComponent?.cleanup();
    this.bettingComponent?.cleanup();
    this.renderManager?.cleanup();
    this.element = null;
    this.eventBus = null;
  }
}