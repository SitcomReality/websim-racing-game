/**
 * RenderManager - Centralized rendering coordinator
 * Manages all rendering systems and coordinates render pipeline
 */
export class RenderManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    
    // Core rendering systems
    this.camera = new Camera();
    this.worldTransform = new WorldTransform();
    this.textureManager = new TextureManager();
    this.particleSystem = new ParticleSystem();
    this.nameplate = new Nameplate();
    
    // Renderer instances
    this.trackRenderer = new TrackRenderer();
    this.racerRenderer = new RacerRenderer();
    
    // Render state
    this.isRendering = false;
    this.lastTime = performance.now();
    this.currentRace = null;
    this.renderProps = null;
    
    // Initialize camera
    this.camera.setMode('fitAll');
  }

  /**
   * Initialize the render manager
   */
  initialize() {
    this.resizeToContainer();
    this.textureManager.loadTextures();
    
    // Set up resize handler
    window.addEventListener('resize', () => this.resizeToContainer());
  }

  /**
   * Set the current race data for rendering
   */
  setRace(race, props) {
    this.currentRace = race;
    this.renderProps = props;
    
    // Update camera target
    if (race && race.racers && race.racers.length > 0) {
      this.updateCameraTarget();
    }
  }

  /**
   * Update camera target based on race state
   */
  updateCameraTarget() {
    if (!this.currentRace || !this.currentRace.racers) return;
    
    const loc = this.currentRace.liveLocations;
    const xs = this.currentRace.racers.map(rid => loc[rid] || 0);
    
    if (xs.length === 0) return;
    
    const avg = xs.reduce((a, b) => a + b, 0) / xs.length;
    const minX = Math.max(0, Math.min(...xs));
    const maxX = Math.min(100, Math.max(...xs));
    
    if (this.camera.mode === 'fitAll') {
      // Calculate zoom to fit all racers
      const margin = 15;
      const span = Math.max(30, (maxX - minX) + margin * 2);
      this.camera.target.x = (minX + maxX) / 2;
      
      const zMin = (this.renderProps?.camera?.zoomMin) || 0.5;
      const zMax = (this.renderProps?.camera?.zoomMax) || 2.0;
      this.camera.zoom = Math.max(zMin, Math.min(zMax, 100 / span));
    } else if (this.camera.mode === 'leaders') {
      this.camera.target.x = Math.max(...xs);
    } else if (this.camera.mode === 'average') {
      this.camera.target.x = avg;
    }
  }

  /**
   * Main render loop
   */
  render(time) {
    if (!this.isRendering) return;
    
    const deltaTime = (time - this.lastTime) / 1000;
    this.lastTime = time;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update systems
    this.updateSystems(deltaTime);
    
    // Render scene
    this.renderScene(time);
  }

  /**
   * Update all rendering systems
   */
  updateSystems(deltaTime) {
    // Update particle system
    this.particleSystem.update(deltaTime);
    
    // Update camera
    this.updateCameraTarget();
  }

  /**
   * Render the complete scene
   */
  renderScene(time) {
    if (!this.currentRace || !this.renderProps) return;
    
    // Save context state
    this.ctx.save();
    
    // Apply camera transform
    this.applyCameraTransform();
    
    // Render track
    this.renderTrack();
    
    // Render racers
    this.renderRacers(time);
    
    // Render weather effects
    this.renderWeatherEffects();
    
    // Render particles
    this.particleSystem.render(this.ctx);
    
    // Render nameplates
    this.nameplate.render(this.ctx);
    
    // Restore context state
    this.ctx.restore();
    
    // Render UI overlays (not affected by camera)
    this.renderUIOverlays();
  }

  /**
   * Apply camera transformation
   */
  applyCameraTransform() {
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;
    
    this.ctx.translate(w / 2, h / 2);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    
    const worldPixelWidth = w * 4;
    const cameraPixelX = this.camera.target.x / 100 * worldPixelWidth;
    this.ctx.translate(-cameraPixelX, 0);
  }

  /**
   * Render the track
   */
  renderTrack() {
    this.trackRenderer.render(this.ctx, this.currentRace, this.renderProps, this.camera);
  }

  /**
   * Render all racers
   */
  renderRacers(time) {
    this.racerRenderer.render(this.ctx, this.currentRace, this.worldTransform, time);
  }

  /**
   * Render weather effects
   */
  renderWeatherEffects() {
    const weather = this.currentRace.weather;
    if (!weather) return;
    
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;
    const wLower = weather.toLowerCase();
    
    if (wLower === 'rainy' || wLower === 'stormy') {
      this.ctx.strokeStyle = 'rgba(180,180,255,0.35)';
      this.ctx.lineWidth = 1;
      for (let i = 0; i < 80; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + 10, y + 20);
        this.ctx.stroke();
      }
    } else if (wLower === 'snowy') {
      this.ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < 60; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = 1 + Math.random() * 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.ctx.fill();
      }
    } else if (wLower === 'foggy' || wLower === 'cloudy') {
      this.ctx.fillStyle = 'rgba(200,200,200,0.12)';
      this.ctx.fillRect(0, 0, w, h);
    } else if (wLower === 'dusty') {
      this.ctx.fillStyle = 'rgba(160,120,80,0.12)';
      this.ctx.fillRect(0, 0, w, h);
    }
  }

  /**
   * Render UI overlays
   */
  renderUIOverlays() {
    // This can be extended to render race countdowns, leaderboards, etc.
  }

  /**
   * Resize canvas to container
   */
  resizeToContainer() {
    const container = this.canvas.parentElement || document.body;
    const targetW = (container.clientWidth || 800);
    const targetH = (container.clientHeight || 520);
    
    this.canvas.width = Math.floor(targetW * this.dpr);
    this.canvas.height = Math.floor(targetH * this.dpr);
    
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);
    
    this.canvas.style.width = (this.canvas.width / this.dpr) + 'px';
    this.canvas.style.height = (this.canvas.height / this.dpr) + 'px';
  }

  /**
   * Start rendering
   */
  start() {
    this.isRendering = true;
    this.lastTime = performance.now();
    this.renderLoop();
  }

  /**
   * Stop rendering
   */
  stop() {
    this.isRendering = false;
  }

  /**
   * Render loop
   */
  renderLoop() {
    if (!this.isRendering) return;
    
    const time = performance.now();
    this.render(time);
    
    requestAnimationFrame(() => this.renderLoop());
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
      this.renderProps?.numberOfLanes
    );
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenX, screenY) {
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;
    
    const worldPixelWidth = w * 4;
    const cameraPixelX = this.camera.target.x / 100 * worldPixelWidth;
    
    const worldX = ((screenX - w / 2) / this.camera.zoom + cameraPixelX) / worldPixelWidth * 100;
    
    const totalHeight = this.worldTransform.laneHeight * (this.renderProps?.numberOfLanes || 1);
    const trackCenterY = totalHeight / 2;
    const worldY = ((screenY - h / 2) / this.camera.zoom + trackCenterY) / this.worldTransform.laneHeight;
    
    return { x: worldX, y: worldY };
  }
}

// Export for use in other modules
export { RenderManager };