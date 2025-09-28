import { RenderManager } from '../../render/RenderManager.js';

/** 
 * GameScreen - Full-screen race viewing
 */
export class GameScreen {
  constructor(gameState = null) {
    this.element = null;
    this.eventBus = null;
    this.renderManager = null;
    this.gameState = gameState;
    this.countdownTimer = null;
  }

  initialize(eventBus) {
    this.eventBus = eventBus;
    this.createElement();
    
    this.renderManager = new RenderManager(this.element.querySelector('#raceCanvas'), this.gameState);
    this.renderManager.initialize();
    
    this.bindEvents();

    // Game State -> UI events
    this.eventBus.on('race:setupComplete', (data) => this.onRaceSetup(data));
    this.eventBus.on('race:start', (data) => this.onRaceStart(data));
    this.eventBus.on('race:finish', (raceData) => this.onRaceFinish(raceData));
    this.eventBus.on('race:countdownStarted', (data) => this.onCountdownStarted(data));
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.className = 'race-screen';
    this.element.innerHTML = `
      <div class="race-canvas-container">
        <canvas id="raceCanvas"></canvas>
        <div class="race-overlay">
          <div class="countdown-display" id="countdownDisplay" style="display: none;">
            <div class="countdown-number" id="countdownNumber">3</div>
            <div class="countdown-text">GET READY!</div>
          </div>
          <div class="race-controls">
            <button id="endRaceBtn" class="btn btn-outline" style="display: none;">End Race</button>
          </div>
          <div class="live-leaderboard" id="liveLeaderboard" style="display: none;">
            <!-- Live positions will be populated here -->
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const endRaceBtn = this.element.querySelector('#endRaceBtn');
    if (endRaceBtn) {
      endRaceBtn.addEventListener('click', () => {
        this.eventBus.emit('race:endNow');
        endRaceBtn.style.display = 'none';
      });
    }
  }

  onRaceSetup(data) {
    const { race } = data;
    this.renderManager.setRace(race, { numberOfLanes: race.racers.length });
    this.renderManager.raceEndCountdown = null;
    
    // Setup camera for race view
    const dims = this.renderManager.canvasAdapter.getDimensions();
    const baselineZoom = this.renderManager.camera.director.cameraCalculator.getTrackBasedZoom(dims, race);
    this.renderManager.camera.target.x = 0;
    this.renderManager.camera.zoom = baselineZoom;
    
    // Initial render of the track and racers at starting line
    this.renderManager.renderOnce();
    
    // Start countdown
    this.startCountdown();
  }

  startCountdown() {
    const countdownDisplay = this.element.querySelector('#countdownDisplay');
    const countdownNumber = this.element.querySelector('#countdownNumber');
    
    countdownDisplay.style.display = 'flex';
    
    let count = 3;
    countdownNumber.textContent = count;
    
    this.countdownTimer = setInterval(() => {
      count--;
      if (count > 0) {
        countdownNumber.textContent = count;
      } else if (count === 0) {
        countdownNumber.textContent = 'GO!';
        countdownNumber.style.color = '#00ff00';
      } else {
        clearInterval(this.countdownTimer);
        countdownDisplay.style.display = 'none';
        this.eventBus.emit('race:start');
      }
    }, 1000);
  }

  onRaceStart(data) {
    this.renderManager.start();
    
    // Show race controls
    const endRaceBtn = this.element.querySelector('#endRaceBtn');
    const leaderboard = this.element.querySelector('#liveLeaderboard');
    
    endRaceBtn.style.display = 'block';
    leaderboard.style.display = 'block';
  }
  
  onCountdownStarted(data) {
    this.renderManager.raceEndCountdown = data.countdown;
  }

  onRaceFinish(raceData) {
    this.renderManager.stop();
    
    // Hide race controls
    const endRaceBtn = this.element.querySelector('#endRaceBtn');
    const leaderboard = this.element.querySelector('#liveLeaderboard');
    
    endRaceBtn.style.display = 'none';
    leaderboard.style.display = 'none';
    
    // Show completion effect
    this.element.classList.add('race-complete');
    setTimeout(() => {
      this.element.classList.remove('race-complete');
      // Transition to results screen will be handled by phase manager
    }, 2000);
  }

  show(data = {}) {
    (data?.container || document.getElementById('app') || document.body).appendChild(this.element);
    
    // Resize canvas after it's added to the DOM
    if (this.renderManager) {
      this.renderManager.resizeToContainer();
    }
  }

  hide() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

  cleanup() {
    this.renderManager?.cleanup();
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
    this.element = null;
    this.eventBus = null;
  }
}