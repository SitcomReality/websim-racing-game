class CanvasRenderer {
  constructor(canvas) {
    this.setCanvas(canvas);
    this.dpr = 1;
    this.lastTime = performance.now();
    this.props = null;
    this.laneHeight = 40;
    this.segmentWidth = 30;
    this.camera = new Camera();
    this.camera.setMode('fitAll');
    this.hitIndex = new HitTestIndex();
    this.worldTransform = new WorldTransform(this.laneHeight, this.segmentWidth);
    this.particleSystem = new ParticleSystem();
    this.particleSystem.maxParticles = (gameState.settings?.render?.particles?.maxParticles) || this.particleSystem.maxParticles;
    this.nameplate = new Nameplate();
    this.animationLoop = new AnimationLoop();
    this.camera.damping = (gameState.settings?.render?.camera?.smoothing) || 0.15;
    this.raceEndCountdown = null;
  }

  setCanvas(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  resizeToContainer() {
    const container = this.canvas.parentElement || document.body;
    this.dpr = window.devicePixelRatio || 1;
    const targetW = (container.clientWidth || 800);
    const targetH = (container.clientHeight || 520);
    this.canvas.width = Math.floor(targetW * this.dpr);
    this.canvas.height = Math.floor(targetH * this.dpr);
    this.ctx.setTransform(1,0,0,1,0,0); this.ctx.scale(this.dpr, this.dpr);
    this.canvas.style.width = (this.canvas.width / this.dpr) + 'px';
    this.canvas.style.height = (this.canvas.height / this.dpr) + 'px';
  }

  // helper for external callers (e.g., beginRace)
  worldToScreen(worldX, laneIndex) {
    return this.worldTransform.worldToScreen(
      worldX,
      laneIndex,
      this.camera,
      this.canvas.width,
      this.canvas.height,
      this.props && this.props.numberOfLanes
    );
  }

  updateCamera() {
    if (!this.race || !this.race.racers || this.race.racers.length === 0) return;

    const loc = this.race.liveLocations;
    const xs = this.race.racers.map(rid => loc[rid] || 0);
    const avg = xs.reduce((a,b) => a+b, 0) / xs.length;
    const minX = Math.max(0, Math.min(...xs));
    const maxX = Math.min(100, Math.max(...xs));
    let desiredX = avg, desiredZoom = this.camera.zoom || 1;
    
    if (this.camera.mode === 'single' && this.race.racers[0] != null) {
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
      let totalH = 0; for (let i=0;i<this.props.numberOfLanes;i++) totalH += this.laneHeight * (1 - (i / this.props.numberOfLanes) * 0.2);
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

  setData(currentRace, trackProps) {
    this.race = currentRace;
    this.props = trackProps;
  }

  start() {
    this.animationLoop.start((ts) => this.tick(ts));
  }

  stop() {
    this.animationLoop.stop();
  }

  tick(dt) {
    this.updateCamera(dt);
    this.render();
    const racerRenderer = new RacerRenderer();
    racerRenderer.render(this.ctx, this.race, this.worldTransform, performance.now() / 1000);
    this.hitIndex.update(racerRenderer.getScreenPositions());
  }

  render() {
    const ctx = this.ctx;
    if (!this.race) return;

    ctx.clearRect(0,0,this.canvas.width,this.canvas.height);

    const now = performance.now();
    const deltaTime = (now - this.lastTime) / 1000;
    this.lastTime = now;

    window.trackRenderer = window.trackRenderer || new TrackRenderer();
    window.trackRenderer.render(ctx, this.race, this.props, this.camera);

    const w = this.race.weather ? String(this.race.weather).toLowerCase() : '', W = this.canvas.width/this.dpr, H = this.canvas.height/this.dpr;
    if (w==='rainy'||w==='stormy'){ ctx.strokeStyle='rgba(180,180,255,0.35)'; ctx.lineWidth=1; for(let i=0;i<80;i++){ const x=Math.random()*W,y=Math.random()*H; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+10,y+20); ctx.stroke(); } }
    else if (w==='snowy'){ ctx.fillStyle='rgba(255,255,255,0.85)'; for(let i=0;i<60;i++){ const x=Math.random()*W,y=Math.random()*H,r=1+Math.random()*2; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); } }
    else if (w==='foggy'||w==='cloudy'){ ctx.fillStyle='rgba(200,200,200,0.12)'; ctx.fillRect(0,0,W,H); }
    else if (w==='dusty'){ ctx.fillStyle='rgba(160,120,80,0.12)'; ctx.fillRect(0,0,W,H); }

    this.particleSystem.update(deltaTime);
    this.particleSystem.render(ctx);

    const racerRenderer = new RacerRenderer();
    racerRenderer.render(ctx, this.race, this.worldTransform, now / 1000);
    this.hitIndex.update(racerRenderer.getScreenPositions());

    this.nameplate.render(ctx);
    
    // Render countdown if active
    if (this.raceEndCountdown && this.raceEndCountdown.active) {
      this.renderCountdown(ctx);
    }
  }

  renderCountdown(ctx) {
    const w = ctx.canvas.width / (window.devicePixelRatio || 1);
    const h = ctx.canvas.height / (window.devicePixelRatio || 1);
    const timeLeft = Math.max(0, Math.ceil((this.raceEndCountdown.endTime - performance.now()) / 1000));
    
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, w, h);
    
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 72px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(timeLeft.toString(), w/2, h/2);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Orbitron';
    ctx.fillText('Race ending soon!', w/2, h/2 + 80);
    ctx.restore();
    
    if (timeLeft <= 0) {
      this.endRaceEarly();
    }
  }

  endRaceEarly() {
    // Handle race ending early logic
  }
}

window.CanvasRenderer = CanvasRenderer;