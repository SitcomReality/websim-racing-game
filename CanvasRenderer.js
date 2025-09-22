class CanvasRenderer {
  constructor(canvas) {
    this.setCanvas(canvas);
    this.props = null;
    this.loop = null;
    this.laneHeight = 40;
    this.segmentWidth = 30;
    this.camera = new Camera();
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
    
    // Set canvas dimensions accounting for device pixel ratio
    this.canvas.width = Math.floor((container.clientWidth || 800) * this.dpr);
    const lanes = (this.props && this.props.numberOfLanes) || (this.race && this.race.racers.length) || 10;
    this.canvas.height = Math.floor((lanes * this.laneHeight + 20) * this.dpr);
    
    // Scale context to match device pixel ratio
    this.ctx.setTransform(1,0,0,1,0,0);
    this.ctx.scale(this.dpr, this.dpr);
    
    // Set display size via CSS
    this.canvas.style.width = (this.canvas.width / this.dpr) + 'px';
    this.canvas.style.height = (this.canvas.height / this.dpr) + 'px';
  }
  
  worldToScreen(worldX, laneIndex) {
    const pad = 10;
    const lanes = (this.props && this.props.numberOfLanes) || this.race.racers.length;
    const w = (this.canvas.width / this.dpr - pad * 2);
    const h = this.laneHeight;
    const visRange = Math.max(10, Math.min(100, 100 / (this.camera.zoom || 1)));
    const half = visRange / 2;
    const left = Math.max(0, Math.min(100 - visRange, (this.camera.target.x || 0) - half));
    const x = pad + ((worldX - left) / visRange) * w;
    const y = pad + (laneIndex * h) + (h / 2);
    return { x, y };
  }
  
  updateCamera() {
    if (!this.race || !this.race.racers || this.race.racers.length === 0) return;
    
    const loc = this.race.liveLocations;
    const xs = this.race.racers.map(rid => loc[rid] || 0);
    const avg = xs.reduce((a,b) => a+b, 0) / xs.length;
    const minX = Math.min(...xs, 0), maxX = Math.max(...xs, 100);
    let desiredX = avg, desiredZoom = this.camera.zoom || 1;

    if (this.camera.mode === 'leaders') desiredX = Math.max(...xs);
    else if (this.camera.mode === 'single') desiredX = avg;
    else if (this.camera.mode === 'fitAll') {
      const margin = 8;
      const span = Math.max(10, (maxX - minX) + margin*2);
      desiredX = (minX + maxX) / 2;
      const w = this.canvas.width / this.dpr - 20;
      desiredZoom = Math.max((gameState.settings?.render?.camera?.zoomMin)||0.5,
                     Math.min((gameState.settings?.render?.camera?.zoomMax)||3.0, 100 / span));
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
    tick();
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
      this.screenPositions.push({ rid, x: screen.x, y: screen.y, r: 25 });
      
      // Draw the blob
      this.drawBlob(ctx, screen.x, screen.y, racer, time);
      
      // Emit particles for boosting racers
      if (racer.isBoosting && Math.random() < 0.3) {
        this.particleSystem.emit(screen.x - 20, screen.y, Math.PI, 80, 2);
      }
    }
  }
  drawTrack() {
    const ctx = this.ctx;
    const lanes = this.props.numberOfLanes;
    const segs = this.race.segments.length;
    const pad = 10;
    const h = this.laneHeight;
    const w = (this.canvas.width/this.dpr - pad*2);
    const segW = w / Math.max(1, segs);
    
    ctx.save();
    
    // lane backgrounds
    for (let l=0; l<lanes; l++) {
      const y = pad + l*h;

      const rid = this.race.racers[l];
      const racer = gameState.racers[rid];

      if (racer && racer.visual.finished) {
          const place = this.race.results.indexOf(rid);
          ctx.fillStyle = this.getPlacingColor(place + 1);
      } else {
        ctx.fillStyle = l%2 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)';
      }
      ctx.fillRect(pad, y, w, h-4);
    }
    
    // segments with textures
    for (let i=0; i<segs; i++) {
      const x = pad + i*segW;
      ctx.fillStyle = this.textureManager.getPattern(this.race.segments[i], ctx);
      ctx.fillRect(x, pad, segW-1, lanes*h-4);
      
      // every 3rd segment – strong divider
      if ((i+1)%3===0) {
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(x+segW-2, pad, 2, lanes*h-4);
      }
    }
    
    // finish line
    const fx = pad + (segs-1)*segW;
    ctx.fillStyle = 'rgba(255,255,0,0.35)';
    ctx.fillRect(fx, pad, segW, lanes*h-4);
    
    ctx.restore();
  }
  
  drawBlob(ctx, x, y, racer, time) {
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
    ctx.scale(scaleX, scaleY);
    
    // Draw blob body
    ctx.beginPath();
    const points = blob.controlPoints;
    const N = points.length;
    
    for (let i = 0; i < N; i++) {
      const p = points[i];
      const next = points[(i + 1) % N];
      const prev = points[(i - 1 + N) % N];
      
      // Apply breathing animation
      const radius = p.rad + breathing;
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