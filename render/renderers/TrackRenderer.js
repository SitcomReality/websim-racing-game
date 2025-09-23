class TrackRenderer {
  constructor() {
    this.textureManager = new TextureManager();
    this.textureManager.loadTextures();
  }

  render(ctx, race, props, camera) {
    const w = ctx.canvas.width / (window.devicePixelRatio || 1);
    const h = ctx.canvas.height / (window.devicePixelRatio || 1);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(camera.zoom, camera.zoom);

    let totalPerspectiveHeight = 0;
    const laneHeight = 40;
    for(let i = 0; i < props.numberOfLanes; i++) {
        totalPerspectiveHeight += laneHeight * (1 - (i / props.numberOfLanes) * 0.2);
    }
    const trackCenterOffsetY = totalPerspectiveHeight / 2;
    ctx.translate(0, -trackCenterOffsetY);

    const worldPixelWidth = w * 4;
    const cameraPixelX = camera.target.x / 100 * worldPixelWidth;
    ctx.translate(-cameraPixelX, 0);

    const segs = race.segments.length;
    const segW = worldPixelWidth / Math.max(1, segs);

    let currentY = 0;
    for (let l = 0; l < props.numberOfLanes; l++) {
      const perspectiveFactor = 1 - (l / props.numberOfLanes) * 0.2;
      const laneH = laneHeight * perspectiveFactor;

      const rid = race.racers[l];
      const racer = gameState.racers[rid];

      if (racer && racer.visual.finished) {
          ctx.fillStyle = this.getPlacingColor(race.results.indexOf(rid) + 1);
      } else {
        ctx.fillStyle = l % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)';
      }
      ctx.fillRect(0, currentY, worldPixelWidth, laneH - 2);
      currentY += laneH;
    }

    currentY = 0;
    for (let i = 0; i < segs; i++) {
      const x = i * segW;
      const segmentType = race.segments[i];
      const pattern = this.textureManager.getPattern(segmentType, ctx);

      ctx.fillStyle = pattern;
      ctx.fillRect(x, 0, segW, totalPerspectiveHeight);

      if ((i + 1) % 3 === 0 && i < segs - 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(x + segW - 1, 0, 1, totalPerspectiveHeight);
      }
    }

    const fx = (segs - 1) * segW;
    ctx.fillStyle = 'rgba(255,255,0,0.35)';
    ctx.fillRect(fx, 0, segW, totalPerspectiveHeight);

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

window.TrackRenderer = TrackRenderer;