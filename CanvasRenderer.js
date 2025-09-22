class CanvasRenderer {
  constructor(canvas) {
    this.setCanvas(canvas);
    this.props = null;
    this.loop = null;
    this.laneHeight = 40;
    this.segmentWidth = 30;
    this.camera = new Camera();
    // Set default camera mode to fitAll instead of the current default
    this.camera.setMode('fitAll');
    this.hitIndex = new HitTestIndex();
    this.screenPositions = [];
    this.textureManager = new TextureManager();
    this.textureManager.loadTextures();
    this.particleSystem = new ParticleSystem();
    this.particleSystem.maxParticles = (gameState.settings?.render?.particles?.maxParticles) || this.particleSystem.maxParticles;
    this.nameplate = new Nameplate();
    this.lastTime = performance.now();
    this.dpr = 1;
    this.camera.damping = (gameState.settings?.render?.camera?.smoothing) || 0.15;
  }

  setCanvas(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  resizeToContainer() {
    const container = this.canvas.parentElement || document.body;
    this.dpr = window.devicePixelRatio || 1;
    const lanes = (this.props && this.props.numberOfLanes) || (this.race && this.race.racers.length) || 10;
    const targetW = (container.clientWidth || 800);
    const targetH = (container.clientHeight || Math.max(lanes * this.laneHeight + 20, 520));
    this.canvas.width = Math.floor(targetW * this.dpr);
    this.canvas.height = Math.floor(targetH * this.dpr);
    this.ctx.setTransform(1,0,0,1,0,0); 
    this.ctx.scale(this.dpr, this.dpr);
    this.canvas.style.width = (this.canvas.width / this.dpr) + 'px';
    this.canvas.style.height = (this.canvas.height / this.dpr) + 'px';
  }

  worldToScreen(worldX, laneIndex) {
    const pad = 10;
    const w = (this.canvas.width / this.dpr);
    const h = this.laneHeight;

    // Perspective scaling: racers higher up are slightly smaller
    const perspectiveFactor = 1 - (laneIndex / this.props.numberOfLanes) * 0.2;
    const scaledLaneHeight = h * perspectiveFactor;

    // Total height of all lanes with perspective
    let totalPerspectiveHeight = 0;
    for(let i = 0; i < this.props.numberOfLanes; i++) {
        totalPerspectiveHeight += h * (1 - (i / this.props.numberOfLanes) * 0.2);
    }
    const trackCenterY = pad + totalPerspectiveHeight / 2;

    // Calculate Y position for this lane, accounting for perspective
    let yPos = pad;
    for(let i = 0; i < laneIndex; i++) {
        yPos += h * (1 - (i / this.props.numberOfLanes) * 0.2);
    }
    yPos += scaledLaneHeight / 2;

    const worldPixelWidth = w * 4; // Arbitrary world width for more zoom granularity
    const cameraPixelX = this.camera.target.x / 100 * worldPixelWidth;

    // Apply transformations
    const screenX = (worldX / 100 * worldPixelWidth - cameraPixelX) * this.camera.zoom + w / 2;
    const screenY = (yPos - trackCenterY) * this.camera.zoom + (this.canvas.height / this.dpr) / 2;

    return { x: screenX, y: screenY, scale: perspectiveFactor * this.camera.zoom };
  }

  updateCamera() {
    if (!this.race || !this.race.racers || this.race.racers.length === 0) return;

    const loc = this.race.liveLocations;
    const xs = this.race.racers.map(rid => loc[rid] || 0);
    const avg = xs.reduce((a,b) => a+b, 0) / xs.length;
    const minX = Math.max(0, Math.min(...xs));
    const maxX = Math.min(100, Math.max(...xs));
    let desiredX = avg, desiredZoom = this.camera.zoom || 1;
    if (this.camera.mode === 'leaders') desiredX = Math.max(...xs);
    else if (this.camera.mode === 'single') desiredX = avg;
    else if (this.camera.mode === 'fitAll') {
      const w = (this.canvas.width / this.dpr), h = (this.canvas.height / this.dpr);
      const worldPixelWidth = w * 4;
      const worldUnitsVisibleAtZoom1 = (w * 100) / worldPixelWidth;
      const marginUnits = 5; const rawSpan = (maxX - minX); const span = Math.max(5, rawSpan);
      const neededUnits = span + marginUnits * 2;
      const zMin = (gameState.settings?.render?.camera?.zoomMin) || 0.5;
      const zMax = (gameState.settings?.render?.camera?.zoomMax) || 3.0;
      const zoomH = worldUnitsVisibleAtZoom1 / neededUnits;
      let totalH = 0; for (let i=0;i<this.props.numberOfLanes;i++) totalH += this.laneHeight * (1 - (i / this.props.numberOfLanes) * 0.2);
      const marginPx = 30; const zoomV = (h - marginPx * 2) / Math.max(1, totalH);
      desiredX = (minX + maxX) / 2;
      desiredZoom = Math.max(zMin, Math.min(zMax, Math.min(zoomH, zoomV)));
    }

    this.camera.target.x += (desiredX - this.camera.target.x) * this.camera.damping;
    this.camera.zoom += ((desiredZoom||1) - (this.camera.zoom||1)) * this.camera.damping;
  }

  setData(currentRace, trackProps) {
    this.race = currentRace;
    this.props = trackProps;
  }

  start() {
    if (this.loop) cancelAnimationFrame(this.loop);
    const tick = (ts) => {
      this.tick(ts);
      this.loop = requestAnimationFrame(tick);
    };
    this.loop = requestAnimationFrame(tick);
  }

  stop() {
    if (this.loop) cancelAnimationFrame(this.loop);
    this.loop = null;
  }

  tick(dt) {
    this.updateCamera(dt);
    this.render();
    this.hitIndex.update(this.screenPositions);
  }

  render() {
    const ctx = this.ctx;
    if (!this.race) return;
    ctx.clearRect(0,0,this.canvas.width,this.canvas.height);

    // Calculate delta time for particle system
    const now = performance.now();
    const deltaTime = (now - this.lastTime) / 1000;
    this.lastTime = now;

    this.drawTrack();
    this.drawRacers();

    // Update and render particles
    this.particleSystem.update(deltaTime);
    this.particleSystem.render(ctx);

    // Render nameplates
    this.nameplate.render(ctx);
  }

  drawRacers() {
    const ctx = this.ctx;
    const time = performance.now() / 1000;
    this.screenPositions = [];

    for (let idx = 0; idx < this.race.racers.length; idx++) {
      const rid = this.race.racers[idx];
      const racer = gameState.racers[rid];
      const worldX = this.race.liveLocations[rid] || 0;
      const screen = this.worldToScreen(worldX, idx);

      // Store screen position for hit testing
      this.screenPositions.push({ rid, x: screen.x, y: screen.y, r: 25 * screen.scale });

      // Draw the blob
      this.drawBlob(ctx, screen.x, screen.y, racer, time, screen.scale);

      // Emit particles for boosting racers - FIXED: was checking isBoosting but not emitting
      if (racer.isBoosting && Math.random() < 0.3) {
        this.particleSystem.emit(screen.x - (20 * screen.scale), screen.y, Math.PI, 80, 2);
      }
    }
  }

  drawTrack() {
    const ctx = this.ctx;
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;

    ctx.save();
    // Center view for zoom and pan
    ctx.translate(w / 2, h / 2);
    ctx.scale(this.camera.zoom, this.camera.zoom);

    // Calculate total track height with perspective for centering
    let totalPerspectiveHeight = 0;
    for(let i = 0; i < this.props.numberOfLanes; i++) {
        totalPerspectiveHeight += this.laneHeight * (1 - (i / this.props.numberOfLanes) * 0.2);
    }
    const trackCenterOffsetY = totalPerspectiveHeight / 2;
    ctx.translate(0, -trackCenterOffsetY);

    const worldPixelWidth = w * 4;
    const cameraPixelX = this.camera.target.x / 100 * worldPixelWidth;
    ctx.translate(-cameraPixelX, 0);

    const segs = this.race.segments.length;
    const segW = worldPixelWidth / Math.max(1, segs);

    let currentY = 0;
    // lane backgrounds
    for (let l = 0; l < this.props.numberOfLanes; l++) {
      const perspectiveFactor = 1 - (l / this.props.numberOfLanes) * 0.2;
      const laneH = this.laneHeight * perspectiveFactor;

      const rid = this.race.racers[l];
      const racer = gameState.racers[rid];

      if (racer && racer.visual.finished) {
          const place = this.race.results.indexOf(rid);
          ctx.fillStyle = this.getPlacingColor(place + 1);
      } else {
        ctx.fillStyle = l % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)';
      }
      ctx.fillRect(0, currentY, worldPixelWidth, laneH - 2);
      currentY += laneH;
    }

    currentY = 0;
    // segments with textures - draw as continuous strips
    for (let i = 0; i < segs; i++) {
      const x = i * segW;
      const segmentType = this.race.segments[i];
      const pattern = this.textureManager.getPattern(segmentType, ctx);
      
      // Draw continuous texture for this segment type
      ctx.fillStyle = pattern;
      ctx.fillRect(x, 0, segW, totalPerspectiveHeight);

      // every 3rd segment – subtle divider (thin line, not gap)
      if ((i + 1) % 3 === 0 && i < segs - 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(x + segW - 1, 0, 1, totalPerspectiveHeight);
      }
    }

    // finish line
    const fx = (segs - 1) * segW;
    ctx.fillStyle = 'rgba(255,255,0,0.35)';
    ctx.fillRect(fx, 0, segW, totalPerspectiveHeight);

    ctx.restore();
  }

  drawBlob(ctx, x, y, racer, time, scale = 1) {
    const blob = racer.blobData;
    const breathing = Math.sin(time * 2) * 3;

    let scaleX = 1;
    let scaleY = 1;
    if (racer.isBoosting) {
        const boostEffect = Math.sin(time * 20) * 0.1;
        scaleX = 1.2 + boostEffect;
        scaleY = 0.8 - boostEffect;
    } else {
        const wobble = Math.sin(time * 5 + blob.controlPoints[0].wobblePhase) * 0.05;
        scaleX = 1 + wobble;
        scaleY = 1 - wobble;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scaleX * scale, scaleY * scale);

    // Draw blob body
    ctx.beginPath();
    const points = blob.controlPoints;
    const N = points.length;

    for (let i = 0; i < N; i++) {
      const p = points[i];
      const next = points[(i + 1) % N];
      const prev = points[(i - 1 + N) % N];

      // Apply breathing and per-point wobble
      const wobble = Math.sin(time * 2 + p.wobblePhase) * (blob.baseRadius * 0.05);
      const radius = p.rad + breathing + wobble;
      const px = Math.cos(p.ang) * radius;
      const py = Math.sin(p.ang) * radius;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        // Use quadratic curves for smooth blob shape
        const cpx = (px + Math.cos(prev.ang) * (prev.rad + breathing)) / 2;
        const cpy = (py + Math.sin(prev.ang) * (prev.rad + breathing)) / 2;
        ctx.quadraticCurveTo(cpx, cpy, px, py);
      }
    }
    ctx.closePath();

    // Fill with racer color
    const col = racerColors[racer.colors[0]];
    ctx.fillStyle = col;
    ctx.fill();

    // Add subtle stroke
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw eyes
    this.drawEyes(ctx, blob, time);

    // Draw mouth
    this.drawMouth(ctx, blob);

    ctx.restore();
  }

  drawEyes(ctx, blob, time) {
    const eyeOffset = blob.baseRadius * 0.3;
    const eyeSize = blob.baseRadius * 0.15;

    // Left eye
    ctx.beginPath();
    ctx.arc(-eyeOffset, -eyeOffset, eyeSize, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Right eye
    ctx.beginPath();
    ctx.arc(eyeOffset, -eyeOffset, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    // Pupils (follow movement)
    const pupilOffset = Math.sin(time * 0.5) * 2;
    ctx.beginPath();
    ctx.arc(-eyeOffset + pupilOffset, -eyeOffset, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.arc(eyeOffset + pupilOffset, -eyeOffset, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();

    // Blinking
    if (Math.sin(time * 8) > 0.9) {
      ctx.fillStyle = '#000';
      ctx.fillRect(-eyeOffset - eyeSize, -eyeOffset - eyeSize/2, eyeSize * 2, eyeSize);
      ctx.fillRect(eyeOffset - eyeSize, -eyeOffset - eyeSize/2, eyeSize * 2, eyeSize);
    }
  }

  drawMouth(ctx, blob) {
    const mouthY = blob.baseRadius * 0.2;
    const mouthWidth = blob.baseRadius * 0.4;

    ctx.beginPath();
    ctx.arc(0, mouthY, mouthWidth, 0, Math.PI);
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  getPlacingColor(place) {
    switch(place) {
        case 1: return '#FFC273';
        case 2: return '#778B95';
        case 3: return '#824229';
        default: return 'rgba(17,17,17,0.85)';
    }
  }

  groundColor(type) {
    switch(String(type).toLowerCase()) {
      case 'asphalt': return '#2b2b2b';
      case 'gravel': return '#464646';
      case 'dirt': return '#5a3b1f';
      case 'grass': return '#0a4d1f';
      case 'mud': return '#4a2c14';
      case 'rock': return '#2f3b3f';
      case 'marble': return '#606a70';
      case 'finishline': return 'rgba(255,255,0,0.35)';
      default: return '#303030';
    }
  }
}
window.CanvasRenderer = CanvasRenderer;