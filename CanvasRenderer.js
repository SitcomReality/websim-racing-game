
```javascript
class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.props = null;
    this.loop = null;
    this.laneHeight = 40;
    this.segmentWidth = 30;
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
    const tick = () => {
      this.render();
      this.loop = requestAnimationFrame(tick);
    };
    tick();
  }
  stop() {
    if (this.loop) cancelAnimationFrame(this.loop);
    this.loop = null;
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
    // lane backgrounds
    for (let l=0; l<lanes; l++) {
      const y = pad + l*h;
      ctx.fillStyle = l%2 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)';
      ctx.fillRect(pad, y, w, h-4);
    }
    // segments with ground colors
    for (let i=0; i<segs; i++) {
      const x = pad + i*segW;
      ctx.fillStyle = this.groundColor(this.race.segments[i]);
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
  }
  drawRacerMarkers() {
    const ctx = this.ctx;
    const pad = 10;
    const segs = this.race.segments.length;
    const w = (this.canvas.width - pad*2);
    const h = this.laneHeight;
    // map racerId -> lane index
    const laneIndexOf = {};
    this.race.racers.forEach((rid, i) => laneIndexOf[rid] = i);
    // draw a small circle for each racer using liveLocations percent [0..100]
    this.race.racers.forEach((rid) => {
      const pos = (this.race.liveLocations[rid] || 0) / 100;
      const x = pad + Math.max(0, Math.min(1, pos)) * w;
      const lane = laneIndexOf[rid] ?? 0;
      const y = pad + lane*h + (h/2);
      ctx.beginPath();
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.arc(x, y, 6, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();
    });
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