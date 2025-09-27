import { FerretRenderer } from './FerretRenderer.js';

/**
 * RacerRenderer - Renders all racers with their ferret representations
 */
export class RacerRenderer {
  constructor() {
    this.screenPositions = [];
    this.ferretRenderer = new FerretRenderer();
    this.renderManager = null;
  }

  render(ctx, race, worldTransform, time) {
    this.screenPositions = [];

    // Get dimensions and calculate world scale
    const dims = this.renderManager.canvasAdapter.getDimensions();
    const worldPixelWidth = dims.width * 4;
    const laneHeight = worldTransform.laneHeight;
    const totalHeight = laneHeight * race.racers.length;

    for (let idx = 0; idx < race.racers.length; idx++) {
      const rid = race.racers[idx];
      const racer = this.renderManager?.gameState?.racers.find(r => r.id === rid);
      const worldX = race.liveLocations[rid] || 0;
      
      // Convert world position to pixels (0-100% becomes 0 to worldPixelWidth)
      const pixelX = (worldX / 100) * worldPixelWidth;
      
      // Calculate lane Y position - fix the positioning
      const laneY = idx * laneHeight + laneHeight / 2;
      
      // These coordinates are in the world space, and the context is already camera-transformed
      const screenX = pixelX;
      const screenY = laneY;
      
      // Store screen positions for hit testing (convert back to screen space for UI)
      const uiScreenX = (screenX - this.renderManager.camera.target.x / 100 * worldPixelWidth) * this.renderManager.camera.zoom + dims.width / 2;
      const uiScreenY = (screenY - totalHeight / 2) * this.renderManager.camera.zoom + dims.height / 2;
      this.screenPositions.push({ rid, x: uiScreenX, y: uiScreenY, r: 25 * this.renderManager.camera.zoom });

      // Render ferret using the dedicated renderer
      this.ferretRenderer.render(ctx, screenX, screenY, racer, time, this.renderManager.camera.zoom, this.renderManager.currentRace);

      // Emit discrete footstep particles on contact
      this.emitFootstepParticles(racer, { x: screenX, y: screenY, scale: this.renderManager.camera.zoom });
    }

    this.updateLeaderboard(race);
  }

  renderBoostEffects(ctx, racer, screen, laneIndex, worldTransform) {
    // disabled: continuous boost stream removed in favor of footstep events
    return;
  }

  // New: dust trail while moving
  renderTrailEffects({ x, y, scale }) {
    // disabled: moved to discrete footstep puffs
    return;
  }

  updateLeaderboard(race) {
    const leaderList = document.getElementById('leaderList');
    if (leaderList && race && Array.isArray(race.racers)) {
      const sorted = race.racers.slice().sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
      leaderList.innerHTML = '';
      sorted.slice(0, 5).forEach((rid, i) => { 
        const r = this.renderManager?.gameState?.racers.find(r => r.id === rid); 
        if (!r) return; 
        const li = document.createElement('li'); 
        li.textContent = `${i + 1}. ${this.getRacerNameString(r)}`; 
        leaderList.appendChild(li); 
      });
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

  getScreenPositions() {
    return this.screenPositions;
  }

  // Emit discrete puffs when feet touch ground
  emitFootstepParticles(racer, screen) {
    const ps = this.renderManager?.particleSystem;
    if (!ps || !racer?.ferret || racer.visual?.finished) return;
    const ferret = racer.ferret;
    const feet = ferret.gait?.feet;
    if (!feet) return;

    const y = screen.y + 15 * screen.scale;
    const dustColor = 'rgba(120,100,80,0.45)';
    const speed = 55 * screen.scale;

    const tryEmit = (foot, xOffset) => {
      if (!feet[foot]) return;
      if (feet[foot].justDown) {
        ps.emit(
          screen.x + xOffset * screen.scale,
          y,
          Math.PI, // blow backwards
          speed,
          6,
          dustColor,
          { spread: 0.9, forwardBoost: 0.15 }
        );
        feet[foot].justDown = false; // consume event
      }
    };

    // Rear feet slightly further back, front a bit closer to center
    tryEmit('BL', -12);
    tryEmit('BR', -10);
    tryEmit('FL', -7);
    tryEmit('FR', -5);
  }
}