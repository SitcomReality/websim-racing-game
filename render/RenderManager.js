import { Camera } from './core/Camera.js';
import { WorldTransform } from './core/WorldTransform.js';
import { HitTestIndex } from './core/HitTestIndex.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
import { Nameplate } from './ui/Nameplate.js';
import { TrackRenderer } from './renderers/TrackRenderer.js';
import { RacerRenderer } from './renderers/RacerRenderer.js';
import { AnimationLoop } from './systems/AnimationLoop.js';
import { RenderPipeline } from './systems/RenderPipeline.js';
import { CanvasAdapter } from './core/CanvasAdapter.js';
import { InteractionController } from './systems/InteractionController.js';
import { OverlayRenderer } from './renderers/OverlayRenderer.js';

/**
 * RenderManager - Centralized rendering coordinator
 * Manages all rendering systems and coordinates render pipeline
 */
export class RenderManager {
  constructor(canvas, gameState) {
    this.animationLoop = new AnimationLoop();
    this.canvasAdapter = new CanvasAdapter(canvas);
    this.canvas = canvas;
    this.ctx = this.canvasAdapter.getContext();
    this.dpr = this.canvasAdapter.dpr;
    this.gameState = gameState;

    // Core rendering systems
    this.camera = new Camera();
    this.worldTransform = new WorldTransform();
    this.particleSystem = new ParticleSystem();
    this.nameplate = new Nameplate();
    this.hitIndex = new HitTestIndex();

    // Renderer instances
    this.trackRenderer = new TrackRenderer();
    this.racerRenderer = new RacerRenderer();

    // Additional systems
    this.interactionController = new InteractionController(this);
    this.overlayRenderer = new OverlayRenderer(this);
    this.renderPipeline = new RenderPipeline(this);

    // Render state
    this.isRendering = false;
    this.lastTime = performance.now();
    this.currentRace = null;
    this.renderProps = null;
    this.raceEndCountdown = null;

    // Initialize camera
    this.camera.damping = (this.gameState?.settings?.render?.camera?.smoothing) || 0.15;
    this.camera.setMode('fitAll');
  }

  /**
   * Initialize the render manager
   */
  initialize() {
    this.canvasAdapter.resizeToContainer();
    // Legacy compatibility for modules still referencing window.renderManager
    window.renderManager = this;
    // Provide gameState to renderers
    this.trackRenderer.gameState = this.gameState;
    this.racerRenderer.renderManager = this;
    
    // Set up race director event listeners for future features
    const raceDirector = this.camera.getRaceDirector();
    raceDirector.on('shotChange', (event) => {
      // Future: trigger UI updates based on shot changes
      console.log(`Camera shot changed from ${event.data.from} to ${event.data.to}`);
    });
    
    raceDirector.on('stumble', (event) => {
      // Future: show racer name banner and notify commentary system
      console.log(`Racer ${event.data.racerId} stumbled at position ${event.data.position.toFixed(1)}%`);
    });
    
    raceDirector.on('leadChange', (event) => {
      // Future: dramatic camera work and UI notifications
      console.log(`Lead change! Racer ${event.data.newLeader} overtook ${event.data.oldLeader}`);
    });
    
    raceDirector.on('closeRacing', (event) => {
      // Future: highlight close racing with UI elements
      console.log(`Close racing detected between racers ${event.data.racers.join(' and ')}`);
    });
  }

  /**
   * Set the current race data for rendering
   */
  setRace(race, props) {
    this.currentRace = race;
    this.renderProps = props;
    this.banners?.clear();
    this.currentHoveredLane = null;
    this.previousHoveredLane = null;

    // Update camera target
    if (race && race.racers && race.racers.length > 0) {
      this.updateCameraTarget();
    }
  }

  /**
   * Main render loop managed by AnimationLoop
   */
  tick(time) {
    // if (!this.isRendering) return; // We want to tick even if paused to update UI, but not game logic

    const deltaTime = (time - this.lastTime) / 1000;
    this.lastTime = time;

    // Emit a global tick event for other modules to use
    if (window.app?.eventBus) {
      window.app.eventBus.emit('app:tick', deltaTime);
    }

    if (!this.isRendering) return;

    this.renderPipeline.execute(time, deltaTime);
  }

  /**
   * Render a single frame (useful for setup screens)
   */
  renderOnce(time = performance.now()) {
    const deltaTime = (time - this.lastTime) / 1000;
    this.lastTime = time;
    this.renderPipeline.execute(time, deltaTime);
  }

  /**
   * Clear the canvas
   */
  clear() {
    this.canvasAdapter.clear();
  }

  /**
   * Update systems
   */
  update(time, deltaTime) {
    this.updateCameraTarget();
    this.particleSystem.update(deltaTime);
  }

  /**
   * Render the main scene
   */
  renderScene(time) {
    if (!this.currentRace || !this.renderProps) return;

    this.ctx.save();
    this.applyCameraTransform();

    this.trackRenderer.render(this.ctx, this.currentRace, this.renderProps, this.camera);
    this.racerRenderer.render(this.ctx, this.currentRace, this.worldTransform, time / 1000);

    this.ctx.restore();

    this.ctx.save();
    this.applyCameraTransform();
    this.particleSystem.render(this.ctx);
    this.ctx.restore();

    this.ctx.save();
    this.renderWeatherEffects();
    this.hitIndex.update(this.racerRenderer.getScreenPositions());
    this.nameplate.render(this.ctx, this.gameState);
    this.ctx.restore();
  }

  /**
   * Render overlays and UI elements
   */
  renderOverlays() {
    this.overlayRenderer.renderLaneBanners(this.ctx);
    if (this.raceEndCountdown && this.raceEndCountdown.active) {
      this.overlayRenderer.renderCountdown(this.ctx);
    }
  }

  /**
   * Render debug information
   */
  renderDebug(time, deltaTime) {
    if (!this.gameState.settings.render.debug) return;

    const fps = 1 / deltaTime;
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(10, 10, 200, 100);
    this.ctx.fillStyle = '#0f0';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`FPS: ${fps.toFixed(1)}`, 20,30);
    this.ctx.fillText(`Camera X: ${this.camera.target.x.toFixed(2)}`, 20,45);
    this.ctx.fillText(`Camera Zoom: ${this.camera.zoom.toFixed(2)}`, 20,60);
    this.ctx.fillText(`Particles: ${this.particleSystem.particles.length}`, 20,75);
    this.ctx.fillText(`Hovered Lane: ${this.interactionController.hoveredLane}`, 20,90);
  }

  /**
   * Apply camera transformation to context
   */
  applyCameraTransform() {
    const dims = this.canvasAdapter.getDimensions();

    this.ctx.translate(dims.width / 2, dims.height / 2);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);

    const worldPixelWidth = dims.width * 4;
    const cameraPixelX = this.camera.target.x / 100 * worldPixelWidth;
    const laneHeight = this.worldTransform.laneHeight;
    const totalHeight = laneHeight * (this.renderProps?.numberOfLanes || 10);
    const trackCenterY = totalHeight / 2;

    this.ctx.translate(-cameraPixelX, -trackCenterY);
  }

  /**
   * Render weather effects
   */
  renderWeatherEffects() {
    const weather = this.currentRace?.weather;
    if (!weather) return;

    const dims = this.canvasAdapter.getDimensions();
    const wLower = weather.toLowerCase();

    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (wLower === 'rainy' || wLower === 'stormy') {
      this.renderRainEffect(dims);
    } else if (wLower === 'snowy') {
      this.renderSnowEffect(dims);
    } else if (wLower === 'foggy' || wLower === 'cloudy') {
      this.renderFogEffect(dims);
    } else if (wLower === 'dusty') {
      this.renderDustEffect(dims);
    }

    this.ctx.restore();
  }

  renderRainEffect(dims) {
    this.ctx.strokeStyle = 'rgba(180,180,255,0.35)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * dims.width;
      const y = Math.random() * dims.height;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x + 10, y + 20);
      this.ctx.stroke();
    }
  }

  renderSnowEffect(dims) {
    this.ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * dims.width;
      const y = Math.random() * dims.height;
      const r = 1 + Math.random() * 2;
      this.ctx.beginPath();
      this.ctx.arc(x, y, r, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  renderFogEffect(dims) {
    this.ctx.fillStyle = 'rgba(200,200,200,0.12)';
    this.ctx.fillRect(0, 0, dims.width, dims.height);
  }

  renderDustEffect(dims) {
    this.ctx.fillStyle = 'rgba(160,120,80,0.12)';
    this.ctx.fillRect(0, 0, dims.width, dims.height);
  }

  /**
   * Resize canvas to container
   */
  resizeToContainer() {
    this.canvasAdapter.resizeToContainer();
  }

  /**
   * Start rendering
   */
  start() {
    this.isRendering = true;
    this.lastTime = performance.now();
    this.animationLoop.start((time) => this.tick(time));
  }

  /**
   * Stop rendering
   */
  stop() {
    this.isRendering = false;
    this.animationLoop.stop();
  }

  /**
   * Pause rendering
   */
  pause() {
    this.isRendering = false;
  }

  /**
   * Resume rendering
   */
  resume() {
    if (!this.isRendering) {
      this.isRendering = true;
      this.lastTime = performance.now();
      this.animationLoop.start((time) => this.tick(time));
    }
  }

  /**
   * Update camera target to follow the leader
   */
  updateCameraTarget() {
    if (!this.currentRace || !this.currentRace.racers || this.currentRace.racers.length === 0) return;
    
    const dims = this.canvasAdapter.getDimensions();
    const { desiredX, desiredZoom } = this.camera.calculateDesiredState(this.currentRace, this.gameState, dims);
    
    const zMin = this.gameState.settings?.render?.camera?.zoomMin || 0.3;
    const zMax = this.gameState.settings?.render?.camera?.zoomMax || 2.0;
    
    const targetZoom = Math.max(zMin, Math.min(zMax, desiredZoom));
    const targetX = Math.max(0, Math.min(100, desiredX));
    
    this.camera.target.x += (targetX - this.camera.target.x) * this.camera.damping;
    this.camera.zoom += (targetZoom - this.camera.zoom) * this.camera.damping;
  }

  /**
   * End race early (moved from OverlayRenderer for better cohesion)
   */
  endRaceEarly() {
    this.gameState.running = false;
    this.raceEndCountdown.active = false;

    const finishedRacers = new Set(this.gameState.currentRace.results);
    const allRacers = this.gameState.currentRace.racers;

    for (const racerId of allRacers) {
      if (!finishedRacers.has(racerId)) {
        const position = this.gameState.currentRace.results.length + 1;
        this.gameState.currentRace.results.push(racerId);
        this.gameState.racers[racerId].didNotFinish = true;
        this.gameState.racers[racerId].updateRacerHistory(this.gameState.currentRace.id, position);
      }
    }

    if (window.processRaceFinish) {
      window.processRaceFinish();
    }
  }

  /**
   * Get screen positions for hit testing
   */
  getScreenPositions() {
    return this.racerRenderer.getScreenPositions();
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldX, laneIndex) {
    return this.worldTransform.worldToScreen(
      worldX,
      laneIndex,
      this.camera,
      this.canvas.width,
      this.canvas.height,
      this.renderProps?.numberOfLanes,
      this.gameState
    );
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenX, screenY) {
    return this.worldTransform.screenToWorld(screenX, screenY, this.camera, this.canvas.width, this.canvas.height, this.renderProps?.numberOfLanes);
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.interactionController.cleanup();
    this.stop();
  }

  /**
   * Set canvas
   */
  setCanvas(canvas) {
    this.canvas = canvas;
    this.canvasAdapter = new CanvasAdapter(canvas);
    this.ctx = this.canvasAdapter.getContext();
    this.dpr = this.canvasAdapter.dpr;
  }
}

// Helper function for racer name strings
function getRacerNameString(racer) {
  if (!racer || !racer.name) {
    return "Unknown Racer";
  }

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