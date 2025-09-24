/**
 * TrackRenderer - Renders the racing track with segments and textures
 */
export class TrackRenderer {
  constructor() {
    this.textureManager = new TextureManager();
    this.textureManager.loadTextures();
    this.seamAligned = new Set(['marble']);
  }

  render(ctx, race, props, camera) {
    const w = ctx.canvas.width / (window.devicePixelRatio || 1);
    const h = ctx.canvas.height / (window.devicePixelRatio || 1);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(camera.zoom, camera.zoom);

    const laneHeight = 40;
    const totalHeight = laneHeight * props.numberOfLanes;
    const trackCenterY = totalHeight / 2;
    ctx.translate(0, -trackCenterY);

    const worldPixelWidth = w * 4;
    const cameraPixelX = camera.target.x / 100 * worldPixelWidth;
    ctx.translate(-cameraPixelX, 0);

    const segs = race.segments.length;
    const segW = worldPixelWidth / Math.max(1, segs);

    // Solid base to prevent any background bleed
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(0, 0, worldPixelWidth, totalHeight);

    // Draw lane backgrounds first
    let currentY = 0;
    for (let l = 0; l < props.numberOfLanes; l++) {
      const laneH = laneHeight;

      const rid = race.racers[l];
      const racer = window.gameState?.racers[rid];

      if (racer && racer.visual.finished) {
        ctx.fillStyle = this.getPlacingColor(race.results.indexOf(rid) + 1);
      } else {
        ctx.fillStyle = l % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)';
      }
      ctx.fillRect(0, currentY, laneH - 2, laneH);
      currentY += laneH;
    }

    // Draw segment textures
    currentY = 0;
    for (let i = 0; i < segs; i++) {
      const x0 = Math.round(i * segW);
      const x1 = Math.round((i + 1) * segW);
      const segmentType = race.segments[i];
      const pattern = this.textureManager.getPattern(segmentType, ctx);
      if (this.seamAligned.has(segmentType)) {
        const img = this.textureManager.images.get(segmentType);
        if (img && pattern && typeof pattern.setTransform === 'function') {
          pattern.setTransform(new DOMMatrix().scale(1, laneHeight / img.height));
        }
      }
      ctx.fillStyle = pattern;
      ctx.fillRect(x0, 0, (x1 - x0) + 1, totalHeight);

      if ((i + 1) % 3 === 0 && i < segs - 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(x1 - 1, 0, 1, totalHeight);
      }
    }

    const fx0 = Math.round((segs - 1) * segW);
    const fx1 = Math.round(segs * segW);
    ctx.fillStyle = 'rgba(255,255,0,0.35)';
    ctx.fillRect(fx0, 0, (fx1 - fx0) + 1, totalHeight);

    // Draw lane separators on top of everything
    currentY = 0;
    for (let l = 0; l < props.numberOfLanes; l++) {
      const laneH = laneHeight;

      // Draw lane separator line - bright white and visible
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = Math.max(2, 3 / camera.zoom);
      ctx.beginPath();
      ctx.moveTo(0, currentY + laneH);
      ctx.lineTo(worldPixelWidth, currentY + laneH);
      ctx.stroke();
      
      currentY += laneH;
    }

    ctx.restore();
  }

  getPlacingColor(place) {
    switch(place) {
      case 1: return '#FFC273';
      case 2: return '#778B95';
      case 3: return '#824229';
      default: return 'rgba(17,17,17,0.85)';
    }
  }
}