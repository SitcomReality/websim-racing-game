import { Camera } from './systems/Camera.js';
import { WorldTransform } from './systems/WorldTransform.js';
import { TextureManager } from './systems/TextureManager.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
import { Nameplate } from './ui/Nameplate.js';
import { TrackRenderer } from './renderers/TrackRenderer.js';
import { RacerRenderer } from './renderers/RacerRenderer.js';
import { AnimationLoop } from './systems/AnimationLoop.js';
import { HitTestIndex } from './core/HitTestIndex.js';

/**
 * RenderManager - Centralized rendering coordinator
 * Manages all rendering systems and coordinates render pipeline
 */
export class RenderManager {
  constructor(canvas) {
    this.animationLoop = new AnimationLoop();
    this.setCanvas(canvas);
    
    // Core rendering systems
    this.camera = new Camera();
    this.worldTransform = new WorldTransform();
    this.textureManager = new TextureManager();
    this.particleSystem = new ParticleSystem();
    this.nameplate = new Nameplate();
    this.hitIndex = new HitTestIndex();
    
    // Renderer instances
    this.trackRenderer = new TrackRenderer();
    this.racerRenderer = new RacerRenderer();
    
    // Render state
    this.isRendering = false;
    this.lastTime = performance.now();
    this.currentRace = null;
    this.renderProps = null;
    this.raceEndCountdown = null;
    this.hoveredLane = null;
    this.banners = new Map();
    this.currentHoveredLane = null;
    this.previousHoveredLane = null;
    
    // Initialize camera
    this.camera.damping = (gameState.settings?.render?.camera?.smoothing) || 0.15;
    this.camera.setMode('fitAll');

    // Define Render Pipeline
    this.pipeline = [
        this.clear.bind(this),
        this.update.bind(this),
        this.renderScene.bind(this),
        this.renderOverlays.bind(this),
        this.renderDebug.bind(this),
    ];
  }

  setCanvas(canvas) {
    // unbind previous canvas listeners
    if (this._boundCanvas && this._onMouseMove) {
      this._boundCanvas.removeEventListener('mousemove', this._onMouseMove);
      this._boundCanvas.removeEventListener('mouseleave', this._onMouseLeave);
    }
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    // bind listeners to new canvas
    if (!this._onMouseMove) {
      this._onMouseMove = (e) => { const r=this.canvas.getBoundingClientRect(); const y=e.clientY-r.top; this.setHoveredLane(this.screenToLaneIndex(y)); };
      this._onMouseLeave = () => this.setHoveredLane(null);
    }
    this.canvas.addEventListener('mousemove', this._onMouseMove);
    this.canvas.addEventListener('mouseleave', this._onMouseLeave);
    this._boundCanvas = this.canvas;
  }

  /**
   * Initialize the render manager
   */
  initialize() {
    this.resizeToContainer();
    this.textureManager.loadTextures();
  }

  /**
   * Set the current race data for rendering
   */
  setRace(race, props) {
    this.currentRace = race;
    this.renderProps = props;
    this.banners.clear();
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
    if (!this.isRendering) return;
    
    const deltaTime = (time - this.lastTime) / 1000;
    this.lastTime = time;

    for (const step of this.pipeline) {
        step(time, deltaTime);
    }
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  update(time, deltaTime) {
    this.updateCameraTarget();
    this.particleSystem.update(deltaTime);
  }

  renderScene(time) {
    if (!this.currentRace || !this.renderProps) return;
    
    this.ctx.save();
    this.applyCameraTransform();
    
    this.trackRenderer.render(this.ctx, this.currentRace, this.renderProps, this.camera);
    this.renderWeatherEffects();
    this.particleSystem.render(this.ctx);
    this.racerRenderer.render(this.ctx, this.currentRace, this.worldTransform, time / 1000);
    this.hitIndex.update(this.racerRenderer.getScreenPositions());
    this.nameplate.render(this.ctx);
    
    this.ctx.restore();
  }

  renderOverlays() {
    this.renderLaneBanners(this.ctx);
    if (this.raceEndCountdown && this.raceEndCountdown.active) {
      this.renderCountdown(this.ctx);
    }
  }

  renderDebug(time, deltaTime) {
      if (!gameState.settings.render.debug) return;

      const fps = 1 / deltaTime;
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(10, 10, 200, 100);
      this.ctx.fillStyle = '#0f0';
      this.ctx.font = '12px monospace';
      this.ctx.fillText(`FPS: ${fps.toFixed(1)}`, 20, 30);
      this.ctx.fillText(`Camera X: ${this.camera.target.x.toFixed(2)}`, 20, 45);
      this.ctx.fillText(`Camera Zoom: ${this.camera.zoom.toFixed(2)}`, 20, 60);
      this.ctx.fillText(`Particles: ${this.particleSystem.particles.length}`, 20, 75);
      this.ctx.fillText(`Hovered Lane: ${this.hoveredLane}`, 20, 90);
  }
  
  applyCameraTransform() {
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;
    
    this.ctx.translate(w / 2, h / 2);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    
    const worldPixelWidth = w * 4;
    const cameraPixelX = this.camera.target.x / 100 * worldPixelWidth;
    const laneHeight = this.worldTransform.laneHeight;
    const totalHeight = laneHeight * this.renderProps.numberOfLanes;
    const trackCenterY = totalHeight / 2;

    this.ctx.translate(-cameraPixelX, -trackCenterY);
  }
  
  renderWeatherEffects() {
    const weather = this.currentRace.weather;
    if (!weather) return;
    
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;
    const wLower = weather.toLowerCase();
    
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for screen-space effects
    
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
    this.ctx.restore();
  }

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

  start() {
    this.isRendering = true;
    this.lastTime = performance.now();
    this.animationLoop.start((time) => this.tick(time));
  }
  
  stop() {
    this.isRendering = false;
    this.animationLoop.stop();
  }

  pause() {
    this.isRendering = false;
  }

  resume() {
    if(!this.isRendering) {
        this.isRendering = true;
        this.lastTime = performance.now();
        this.animationLoop.start((time) => this.tick(time));
    }
  }

  getScreenPositions() {
    return this.racerRenderer.getScreenPositions();
  }

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

  screenToWorld(screenX, screenY) {
    return this.worldTransform.screenToWorld(screenX, screenY, this.camera, this.canvas.width, this.canvas.height, this.renderProps?.numberOfLanes);
  }

  updateCameraTarget() {
    if (!this.currentRace || !this.currentRace.racers || this.currentRace.racers.length === 0) return;

    const loc = this.currentRace.liveLocations;
    const xs = this.currentRace.racers.map(rid => loc[rid] || 0);
    const avg = xs.reduce((a,b) => a+b, 0) / xs.length;
    const minX = Math.max(0, Math.min(...xs));
    const maxX = Math.min(100, Math.max(...xs));
    let desiredX = avg, desiredZoom = this.camera.zoom || 1;
    
    if (this.camera.mode === 'single' && this.currentRace.racers[0] != null) {
      desiredX = avg;
    } else if (this.camera.mode === 'leaders') {
      desiredX = Math.max(...xs);
    } else if (this.camera.mode === 'fitAll') {
      const w = (this.canvas.width / this.dpr), h = (this.canvas.height / this.dpr);
      const worldPixelWidth = w * 4;
      const worldUnitsVisibleAtZoom1 = (w * 100) / worldPixelWidth;
      const marginUnits = 5; const rawSpan = (maxX - minX); const span = Math.max(5, rawSpan);
      const neededUnits = span + marginUnits * 2;
      const zMin = (gameState.settings?.render?.camera?.zoomMin) || 0.5;
      const zMax = (gameState.settings?.render?.camera?.zoomMax) || 3.0;
      const zoomH = worldUnitsVisibleAtZoom1 / neededUnits;
      const totalH = this.worldTransform.laneHeight * this.renderProps.numberOfLanes;
      const marginPx = 30; const zoomV = (h - marginPx * 2) / Math.max(1, totalH);
      desiredZoom = Math.max(zMin, Math.min(zMax, Math.min(zoomH, zoomV)));
      
      const leaderX = Math.max(...xs);
      const visibleWorldUnits = worldUnitsVisibleAtZoom1 / desiredZoom;
      const minVisibleX = leaderX - visibleWorldUnits + marginUnits;
      const maxVisibleX = leaderX + marginUnits;

      const idealCenter = (minX + maxX) / 2;
      const minAllowedCenter = minVisibleX + (visibleWorldUnits / 2);
      const maxAllowedCenter = maxVisibleX - (visibleWorldUnits / 2);

      desiredX = Math.max(minAllowedCenter, Math.min(maxAllowedCenter, idealCenter));
    }

    this.camera.target.x += (desiredX - this.camera.target.x) * this.camera.damping;
    this.camera.zoom += ((desiredZoom||1) - (this.camera.zoom||1)) * this.camera.damping;
  }

  renderLaneBanners(ctx) {
    const w = ctx.canvas.width / this.dpr;
    const h = ctx.canvas.height / this.dpr;
    const laneH = this.worldTransform.laneHeight;

    if (this.currentHoveredLane !== this.previousHoveredLane) {
      if (this.previousHoveredLane !== null && this.banners.has(this.previousHoveredLane)) {
        const prevBanner = this.banners.get(this.previousHoveredLane);
        prevBanner.active = false;
        prevBanner.targetX = -400;
      }
      
      if (this.currentHoveredLane !== null) {
        const rid = this.currentRace.racers[this.currentHoveredLane];
        const racer = gameState.racers[rid];
        if (racer) {
            const startX = w + 100;
          if (!this.banners.has(this.currentHoveredLane)) {
            this.banners.set(this.currentHoveredLane, {
              lane: this.currentHoveredLane,
              text: getRacerNameString(racer),
              x: startX,
              targetX: 20,
              opacity: 0,
              active: true
            });
          } else {
            const banner = this.banners.get(this.currentHoveredLane);
            banner.active = true;
            banner.targetX = 20;
            if (banner.x > w + 50 || banner.x < -350) banner.x = startX;
            banner.opacity = Math.max(banner.opacity, 0.1);
          }
        }
      }
      this.previousHoveredLane = this.currentHoveredLane;
    }

    for (const [laneIndex, banner] of this.banners.entries()) {
      if (!banner || (!banner.active && banner.opacity <= 0.02)) continue;

      banner.x += (banner.targetX - banner.x) * 0.18;
      const targetOpacity = banner.active ? 1 : 0;
      banner.opacity += (targetOpacity - banner.opacity) * 0.15;

      if (!banner.active && banner.opacity < 0.02 && Math.abs(banner.x - banner.targetX) < 2) {
        this.banners.delete(laneIndex);
        continue;
      }
      
      const rid = this.currentRace.racers[laneIndex];
      const racer = gameState.racers[rid];
      if (!racer) continue;
      
      const color1 = window.racerColors[racer.colors[0]];
      const color2 = window.racerColors[racer.colors[1]];
      const color3 = window.racerColors[racer.colors[2]];

      const totalH = laneH * this.renderProps.numberOfLanes;
      const laneY = (laneIndex * laneH + laneH/2 - totalH/2) * this.camera.zoom + h/2;
      const bannerHeight = laneH * this.camera.zoom;
      const bannerY = laneY - bannerHeight/2;
      const startX = banner.x;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, banner.opacity));
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;

      const nameFontSize = Math.max(12, bannerHeight * 0.55);
      ctx.font = `900 ${nameFontSize}px Orbitron`;
      const nameText = banner.text.toUpperCase();
      const nameMetrics = ctx.measureText(nameText);
      const nameWidth = nameMetrics.width;

      const numberFontSize = Math.max(10, bannerHeight * 0.45);
      ctx.font = `700 ${numberFontSize}px Orbitron`;
      const numberText = String(racer.id);

      const numberCircleRadius = bannerHeight * 0.6;
      const nameBarHeight = bannerHeight;
      const nameBarPadding = bannerHeight * 0.5;
      const totalNameBarWidth = nameWidth + nameBarPadding * 2;
      const slant = bannerHeight * 0.3;

      ctx.fillStyle = color1;
      ctx.beginPath();
      ctx.moveTo(startX + numberCircleRadius, bannerY);
      ctx.lineTo(startX + numberCircleRadius + totalNameBarWidth + slant, bannerY);
      ctx.lineTo(startX + numberCircleRadius + totalNameBarWidth, bannerY + nameBarHeight);
      ctx.lineTo(startX + numberCircleRadius - slant, bannerY + nameBarHeight);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = color2;
      ctx.beginPath();
      const stripeHeight = bannerHeight * 0.15;
      ctx.moveTo(startX + numberCircleRadius - slant, bannerY + nameBarHeight - stripeHeight);
      ctx.lineTo(startX + numberCircleRadius + totalNameBarWidth, bannerY + nameBarHeight - stripeHeight);
      ctx.lineTo(startX + numberCircleRadius + totalNameBarWidth - slant, bannerY + nameBarHeight);
      ctx.lineTo(startX + numberCircleRadius - slant * 2, bannerY + nameBarHeight);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.arc(startX + numberCircleRadius, laneY, numberCircleRadius, 0, Math.PI*2);
      ctx.fillStyle = color3;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';

      ctx.textAlign = 'center';
      ctx.font = `900 ${nameFontSize}px Orbitron`;
      const nameX = startX + numberCircleRadius + totalNameBarWidth/2;
      ctx.strokeText(nameText, nameX, laneY + bannerHeight*0.05);
      ctx.fillStyle = '#fff';
      ctx.fillText(nameText, nameX, laneY + bannerHeight*0.05);
      
      ctx.font = `700 ${numberFontSize}px Orbitron`;
      const numberX = startX + numberCircleRadius;
      ctx.strokeText(numberText, numberX, laneY);
      ctx.fillStyle = '#fff';
      ctx.fillText(numberText, numberX, laneY);

      ctx.restore();
    }
  }

  renderCountdown(ctx) {
    const w = ctx.canvas.width / this.dpr;
    const h = ctx.canvas.height / this.dpr;
    const timeLeft = Math.max(0, Math.ceil((this.raceEndCountdown.endTime - performance.now()) / 1000));
    
    ctx.save();
    
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(w/2 - 120, 20, 240, 40);
    
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(w/2 - 120, 20, 240, 40);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Race ends in: ${timeLeft}s`, w/2, 40);
    
    const totalTime = 30000;
    const elapsed = performance.now() - this.raceEndCountdown.startTime;
    const progress = Math.max(0, 1 - (elapsed / totalTime));
    const barWidth = 200;
    const barHeight = 4;
    const barX = w/2 - barWidth/2;
    const barY = 55;
    
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    ctx.fillStyle = progress > 0.3 ? '#44ff44' : '#ff4444';
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    
    ctx.restore();
    
    if (timeLeft <= 0) {
        this.endRaceEarly();
    }
  }

  endRaceEarly() {
    gameState.running = false;
    this.raceEndCountdown.active = false;
    
    const finishedRacers = new Set(gameState.currentRace.results);
    const allRacers = gameState.currentRace.racers;
    
    for (const racerId of allRacers) {
        if (!finishedRacers.has(racerId)) {
            const position = gameState.currentRace.results.length + 1;
            gameState.currentRace.results.push(racerId);
            gameState.racers[racerId].didNotFinish = true;
            gameState.racers[racerId].updateRacerHistory(gameState.currentRace.id, position);
        }
    }
    
    processRaceFinish();
  }

  screenToLaneIndex(clientY) {
    const dpr = this.dpr, w = this.canvas.width/dpr, h = this.canvas.height/dpr;
    const laneH = this.worldTransform.laneHeight, totalH = laneH * this.renderProps.numberOfLanes;
    const y = clientY; const localY = (y - h/2) / this.camera.zoom + totalH/2;
    const idx = Math.floor(localY / laneH); return (idx>=0 && idx < this.renderProps.numberOfLanes) ? idx : null;
  }

  setHoveredLane(lane) {
    this.hoveredLane = lane;
    this.currentHoveredLane = lane;
  }
}

function getRacerNameString(racer) {
    if (!racer || !racer.name) {
        return "Unknown Racer";
    }

    const prefix = window.racerNamePrefixes[racer.name[0]];
    const suffix = window.racerNameSuffixes[racer.name[1]];
    let prefixStr, suffixStr;

    if (typeof prefix === 'function') {
        if (!racer._evaluatedPrefix) racer._evaluatedPrefix = prefix();
        prefixStr = racer._evaluatedPrefix;
    } else {
        prefixStr = prefix;
    }

    if (typeof suffix === 'function') {
        if (!racer._evaluatedSuffix) racer._evaluatedSuffix = suffix();
        suffixStr = racer._evaluatedSuffix;
    } else {
        suffixStr = suffix;
    }

    return `${prefixStr} ${suffixStr}`;
}


// Export for use in other modules
export { RenderManager };