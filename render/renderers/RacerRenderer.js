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
      this.ferretRenderer.render(ctx, screenX, screenY, racer, time, this.renderManager.camera.zoom);

      // Handle boost particles
      this.renderBoostEffects(ctx, racer, { x: screenX, y: screenY, scale: this.renderManager.camera.zoom }, idx, worldTransform);
    }

    this.updateLeaderboard(race);
  }

  renderBoostEffects(ctx, racer, screen, laneIndex, worldTransform) {
    if (racer?.isBoosting && Math.random() < 0.3) {
      if (this.renderManager && this.renderManager.particleSystem) {
        this.renderManager.particleSystem.emit(
          screen.x, 
          screen.y, 
          Math.PI, 
          80 * screen.scale, 
          2, 
          'rgba(255,255,255,0.8)'
        );
      }
    }
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
}