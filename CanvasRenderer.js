class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
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
    this.nameplate = new Nameplate();
    this.lastTime = performance.now();
  }
  setData(currentRace, trackProps) {
    this.race = currentRace;
    this.props = trackProps;
  }
  resizeToContainer() {
    const container = this.canvas.parentElement || document.body;
    // match container box
    this.canvas.width = container.clientWidth || 800;
    const lanes = (this.props && this.props.numberOfLanes) || (this.race && this.race.racers.length) || 10;
    // add small padding
    this.canvas.height = lanes * this.laneHeight + 20;
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
  updateCamera() {
    this.camera.update(this.race);
  }
  render() {
    const ctx = this.ctx;
    if (!this.race) return;
    ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.drawTrack();
    this.drawRacerMarkers();
  }
  drawTrack() {
    const ctx = this.ctx;
    const lanes = this.props.numberOfLanes;
    const segs = this.race.segments.length;
    const pad = 10;
    const h = this.laneHeight;
    const w = (this.canvas.width - pad*2);
    const segW = w / Math.max(1, segs);
    
    // Apply camera transformations
    ctx.save();
    ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.target.x, -this.camera.target.y);
    
    // lane backgrounds
    for (let l=0; l<lanes; l++) {
      const y = pad + l*h;
      ctx.fillStyle = l%2 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)';
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
  drawRacerMarkers() {
    const ctx = this.ctx;
    const pad = 10;
    const segs = this.race.segments.length;
    const w = (this.canvas.width - pad*2);
    const h = this.laneHeight;
    const laneIndexOf = {};
    this.race.racers.forEach((rid, i) => laneIndexOf[rid] = i);
    this.screenPositions = [];
    
    // Get current time for animations
    const time = performance.now() * 0.001;
    
    this.race.racers.forEach((rid) => {
      const pos = (this.race.liveLocations[rid] || 0) / 100;
      const x = pad + Math.max(0, Math.min(1, pos)) * w;
      const lane = laneIndexOf[rid] ?? 0;
      const y = pad + lane*h + (h/2);
      const r = gameState.racers[rid];
      
      // Get or create blob data
      if (!r.blobData) {
        r.blobData = BlobFactory.create(r);
      }
      
      // Store screen position for hit testing
      this.screenPositions.push({ rid, x, y, r: r.blobData.baseRadius });
      
      // Draw blob with animation
      this.drawBlob(ctx, x, y, r, time);
    });
  }
  
  drawBlob(ctx, x, y, racer, time) {
    const blob = racer.blobData;
    const breathing = Math.sin(time * 2) * 3; // Subtle breathing effect
    
    ctx.save();
    ctx.translate(x, y);
    
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
    const col = (typeof racerColors !== 'undefined') ? racerColors[racer.colors[0]] : '#fff';
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