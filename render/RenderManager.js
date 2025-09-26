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
import { BannerSystem } from './core/BannerSystem.js';
import { CameraSystem } from './core/CameraSystem.js';
import { WeatherRenderer } from './systems/WeatherRenderer.js';
import { TransformUtils } from './utils/TransformUtils.js';

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
    this.bannerSystem = new BannerSystem();
    this.renderPipeline = new RenderPipeline(this);

    // New modular systems
    this.cameraSystem = new CameraSystem(this);
    this.weatherRenderer = new WeatherRenderer(this);
    this.transformUtils = new TransformUtils(this);

    // Render state
    this.isRendering = false;
    this.lastTime = performance.now();
    this.currentRace = null;
    this.renderProps = null;
    this.raceEndCountdown = null;

    // Initialize camera
    this.camera.damping = (this.gameState?.settings?.render?.camera?.smoothing) || 0.015;
    this.camera.setMode('directed');
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
      console.log(`Camera shot changed: ${event.data.from} -> ${event.data.to}`);
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
    this.cameraSystem.updateTarget(deltaTime);
    this.particleSystem.update(deltaTime);
    
    // Forward hover lane banners into BannerSystem with short duration to keep alive while hovered
    this.interactionController.update();
    const hoverBanners = this.interactionController?.banners;
    if (hoverBanners && this.currentRace) {
      hoverBanners.forEach((b, laneIndex) => {
        if (b?.active) this.bannerSystem.createBanner('name', laneIndex, b.text, 0.6);
      });
    }
  }

  /**
   * Render the main scene
   */
  renderScene(time) {
    if (!this.currentRace || !this.renderProps) return;

    this.ctx.save();
    this.cameraSystem.applyTransform(this.ctx);

    this.trackRenderer.render(this.ctx, this.currentRace, this.renderProps, this.camera);
    // Render banners in world-space using race positions
    // this.bannerSystem.render(this.ctx, this.camera, this.worldTransform, this.currentRace, this.renderProps);
    this.racerRenderer.render(this.ctx, this.currentRace, this.worldTransform, time);

    this.ctx.restore();

    this.ctx.save();
    this.cameraSystem.applyTransform(this.ctx);
    this.particleSystem.render(this.ctx);
    this.ctx.restore();

    this.ctx.save();
    this.weatherRenderer.render();
    this.hitIndex.update(this.racerRenderer.getScreenPositions());
    this.nameplate.render(this.ctx, this.gameState);
    this.ctx.restore();
  }

  /**
   * Render overlays and UI elements
   */
  renderOverlays() {
    this.overlayRenderer.renderLaneBanners(this.ctx);
    // Render banners in screen-space
    this.bannerSystem.render(this.ctx, this.camera, this.worldTransform, this.currentRace, this.renderProps);
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
   * Update camera target to follow the leader
   */
  updateCameraTarget(deltaTime) {
    this.cameraSystem.updateTarget(deltaTime);
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
   * End race early
   */
  endRaceEarly() {
    this.gameState.running = false;
    if (this.raceEndCountdown) {
      this.raceEndCountdown.active = false;
    }

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
   * Resize canvas to container
   */
  resizeToContainer() {
    this.canvasAdapter.resizeToContainer();
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
    return this.transformUtils.worldToScreen(worldX, laneIndex);
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenX, screenY) {
    return this.transformUtils.screenToWorld(screenX, screenY);
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