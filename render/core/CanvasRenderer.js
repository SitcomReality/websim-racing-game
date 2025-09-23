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
    this.hoveredLane = null; this.banner = {active:false, lane:null, x:-1000, targetX:-1000, opacity:0, text:''};
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
      const totalH = this.laneHeight * this.props.numberOfLanes;
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
    
    // Lane hover name banner
    if (this.banner.lane != null) {
      const w = this.canvas.width / this.dpr, laneH = this.laneHeight, totalH = laneH * this.props.numberOfLanes;
      const laneY = (this.banner.lane * laneH + laneH/2 - totalH/2) * this.camera.zoom + (this.canvas.height/this.dpr)/2;
      this.banner.x += (this.banner.targetX - this.banner.x) * 0.18;
      const targetOpacity = this.banner.active ? 1 : 0;
      this.banner.opacity += (targetOpacity - this.banner.opacity) * 0.15;
      ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, this.banner.opacity));
      ctx.fillStyle='rgba(0,0,0,0.65)'; const pad=14; ctx.font='700 28px Orbitron'; const tw=ctx.measureText(this.banner.text).width;
      ctx.fillRect(this.banner.x- pad, laneY-28, tw+pad*2, 38); ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.strokeRect(this.banner.x- pad, laneY-28, tw+pad*2, 38);
      ctx.shadowColor='rgba(0,0,0,0.6)'; ctx.shadowBlur=10; ctx.textBaseline='middle'; ctx.fillStyle='#fff'; ctx.fillText(this.banner.text, this.banner.x, laneY-9);
      ctx.restore();
      if (!this.banner.active && this.banner.opacity < 0.02 && Math.abs(this.banner.x - this.banner.targetX) < 2) { this.banner.lane=null; }
    }
    
    // Render countdown if active
    if (this.raceEndCountdown && this.raceEndCountdown.active) {
      this.renderCountdown(ctx);
    }
  }

  renderCountdown(ctx) {
    const w = ctx.canvas.width / (window.devicePixelRatio || 1);
    const h = ctx.canvas.height / (window.devicePixelRatio || 1);
    const timeLeft = Math.max(0, Math.ceil((this.raceEndCountdown.endTime - performance.now()) / 1000));
    
    // Subtle countdown in top center instead of full overlay
    ctx.save();
    
    // Semi-transparent background bar
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(w/2 - 120, 20, 240, 40);
    
    // Border
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(w/2 - 120, 20, 240, 40);
    
    // Timer text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Race ends in: ${timeLeft}s`, w/2, 40);
    
    // Progress bar showing time remaining
    const totalTime = 30000; // 30 seconds
    const elapsed = performance.now() - this.raceEndCountdown.startTime;
    const progress = Math.max(0, 1 - (elapsed / totalTime));
    const barWidth = 200;
    const barHeight = 4;
    const barX = w/2 - barWidth/2;
    const barY = 55;
    
    // Background of progress bar
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Filled portion
    ctx.fillStyle = progress > 0.3 ? '#44ff44' : '#ff4444';
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    
    ctx.restore();
    
    if (timeLeft <= 0) {
        this.endRaceEarly();
    }
  }

  endRaceEarly() {
    // Stop the race and handle DNFs
    gameState.running = false;
    this.raceEndCountdown.active = false;
    
    // Handle racers who didn't finish (DNF)
    const finishedRacers = new Set(gameState.currentRace.results);
    const allRacers = gameState.currentRace.racers;
    
    for (const racerId of allRacers) {
        if (!finishedRacers.has(racerId)) {
            // Mark as DNF and add to results based on current position
            const position = gameState.currentRace.results.length + 1;
            gameState.currentRace.results.push(racerId);
            gameState.racers[racerId].didNotFinish = true;
            gameState.racers[racerId].updateRacerHistory(gameState.currentRace.id, position);
        }
    }
    
    // Process race finish
    processRaceFinish();
  }

  screenToLaneIndex(clientY) {
    const dpr = this.dpr, w = this.canvas.width/dpr, h = this.canvas.height/dpr;
    const laneH = this.laneHeight, totalH = laneH * this.props.numberOfLanes;
    const y = clientY; const localY = (y - h/2) / this.camera.zoom + totalH/2;
    const idx = Math.floor(localY / laneH); return (idx>=0 && idx < this.props.numberOfLanes) ? idx : null;
  }

  setHoveredLane(lane) {
    if (lane == null) { this.banner.active=false; this.banner.targetX = -600; return; }
    if (this.banner.lane !== lane) {
      const rid = this.race.racers[lane]; const r = gameState.racers[rid]; this.banner.text = r ? getRacerNameString(r) : '';
      this.banner.lane = lane; this.banner.active = true; this.banner.targetX = 60; if (this.banner.x < -500) this.banner.x = -600; this.banner.opacity = Math.max(this.banner.opacity, 0.1);
    } else { this.banner.active = true; this.banner.targetX = 60; }
  }
}

window.CanvasRenderer = CanvasRenderer;