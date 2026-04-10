import { RenderManager } from '../../render/RenderManager.js';
import { createGameLayout } from './game/GameLayout.js';

/** 
 * GameScreen - Main game screen for live race viewing
 */
export class GameScreen {
  constructor(gameState = null) {
    this.element = null;
    this.eventBus = null;
    this.renderManager = null;
    this.gameState = gameState;
  }

  initialize(eventBus) {
    this.eventBus = eventBus;
    this.createElement();
    
    this.renderManager = new RenderManager(this.element.querySelector('#raceCanvas'), this.gameState);
    this.renderManager.initialize();
    
    this.bindEvents();

    this.eventBus.on('race:start', (data) => this.onRaceStart(data));
    this.eventBus.on('race:finish', (raceData) => this.onRaceFinish(raceData));
    this.eventBus.on('race:countdownStarted', (data) => this.onCountdownStarted(data));
    this.eventBus.on('race:preCountdownStart', (data) => this.onPreCountdownStart(data));
  }

  createElement() {
    this.element = createGameLayout();
  }

  bindEvents() {
    const endNowBtn = this.element.querySelector('#endRaceNow');

    if (endNowBtn) {
      endNowBtn.addEventListener('click', () => {
        this.eventBus.emit('race:endNow');
        endNowBtn.disabled = true;
      });
    }
    const showBtn = this.element.querySelector('#showResultsBtn');
    if (showBtn) showBtn.addEventListener('click', () => this.emitShowResultsNow());
  }
  
  setupRaceFromState() {
    const race = this.gameState.currentRace;
    if (!race) {
        console.warn("GameScreen: No current race data in gameState.");
        return;
    }

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

    // Initial render of the track and racers at starting line
    this.renderManager.renderOnce();
  }

  onRaceStart(data) {
    this.renderManager.start();
    const endNowBtn = this.element.querySelector('#endRaceNow');
    if (endNowBtn) endNowBtn.disabled = false;
  }
  
  onCountdownStarted(data) {
    this.renderManager.raceEndCountdown = data.countdown;
  }
  
  onPreCountdownStart({ countdown }) {
    const overlay = this.element.querySelector('#preCountdownOverlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    const tick = () => {
      const now = Date.now(), left = Math.max(0, countdown.endTime - now);
      const sec = Math.ceil(left / 1000);
      overlay.textContent = sec > 0 ? String(sec) : 'GO!';
      if (left <= 0) { overlay.style.display = 'none'; return; }
      this._preCdRAF = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(this._preCdRAF); this._preCdRAF = requestAnimationFrame(tick);
  }
  
  onRaceFinish(raceData) {
    this.renderManager.stop();
    const wrap = this.element.querySelector('#postRaceOverlay');
    const progress = this.element.querySelector('#showResultsProgress');
    if (wrap && progress) {
      wrap.style.display = 'block';
      const duration = 5000, start = Date.now(), end = start + duration;
      const step = () => {
        const now = Date.now(), pct = Math.min(1, (now - start) / duration);
        progress.style.width = (pct * 100) + '%';
        if (now >= end) { this.emitShowResultsNow(); return; }
        this._resultsRAF = requestAnimationFrame(step);
      };
      cancelAnimationFrame(this._resultsRAF); this._resultsRAF = requestAnimationFrame(step);
      this._resultsTimeout = setTimeout(() => this.emitShowResultsNow(), duration);
    }
  }

  show(data = {}) {
    this.gameState = data.gameState; // Make sure we have the latest game state
    (data?.container || document.getElementById('app') || document.body).appendChild(this.element);
    
    // Resize canvas after it's added to the DOM
    if (this.renderManager) {
        this.renderManager.resizeToContainer();
    }

    this.setupRaceFromState();
  }

  hide() {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.renderManager.stop();
    if (this._resultsTimeout) { clearTimeout(this._resultsTimeout); this._resultsTimeout = null; }
    cancelAnimationFrame(this._resultsRAF);
    cancelAnimationFrame(this._preCdRAF);
  }

  cleanup() {
    this.renderManager?.cleanup();
    this.element = null;
    this.eventBus = null;
  }

  emitShowResultsNow() {
    const wrap = this.element.querySelector('#postRaceOverlay');
    const progress = this.element.querySelector('#showResultsProgress');
    if (wrap) wrap.style.display = 'none';
    if (progress) progress.style.width = '100%';
    if (this._resultsTimeout) { clearTimeout(this._resultsTimeout); this._resultsTimeout = null; }
    cancelAnimationFrame(this._resultsRAF);
    this.eventBus.emit('results:show');
  }
}