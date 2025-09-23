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

    const laneHeight = 40;
    const totalHeight = laneHeight * props.numberOfLanes;
    const trackCenterOffsetY = totalHeight / 2;
    ctx.translate(0, -trackCenterOffsetY);

    const worldPixelWidth = w * 4;
    const cameraPixelX = camera.target.x / 100 * worldPixelWidth;
    ctx.translate(-cameraPixelX, 0);

    const segs = race.segments.length;
    const segW = worldPixelWidth / Math.max(1, segs);

    // Draw lane backgrounds first
    let currentY = 0;
    for (let l = 0; l < props.numberOfLanes; l++) {
      const laneH = laneHeight;

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

    // Draw segment textures
    currentY = 0;
    for (let i = 0; i < segs; i++) {
      const x = i * segW;
      const segmentType = race.segments[i];
      const pattern = this.textureManager.getPattern(segmentType, ctx);

      // Check if this texture needs edge-repeat
      const needsEdgeRepeat = this.textureManager.images.has(segmentType + '_edgeRepeat');
      if (needsEdgeRepeat) {
        // Draw texture per-lane with edge repeat
        for (let l = 0; l < props.numberOfLanes; l++) {
          const laneTop = currentY + l * laneHeight;
          const laneBottom = laneTop + laneHeight;
          
          // Create pattern with repeat-x only for this lane
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, laneTop, segW, laneHeight);
          ctx.clip();
          
          ctx.fillStyle = pattern;
          ctx.fillRect(x, laneTop, segW, laneHeight);
          
          ctx.restore();
        }
      } else {
        // Draw normally across all lanes
        ctx.fillStyle = pattern;
        ctx.fillRect(x, 0, segW, totalHeight);
      }

      if ((i + 1) % 3 === 0 && i < segs - 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(x + segW - 1, 0, 1, totalHeight);
      }
    }

    const fx = (segs - 1) * segW;
    ctx.fillStyle = 'rgba(255,255,0,0.35)';
    ctx.fillRect(fx, 0, segW, totalHeight);

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

window.TrackRenderer = TrackRenderer;