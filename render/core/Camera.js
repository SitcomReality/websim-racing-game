
```javascript
class Camera {
  constructor() {
    this.mode = 'fitAll';
    this.target = { x: 0, y: 0 };
    this.zoom = 1;
    this.damping = 0.15;
  }
  setMode(mode, opts = {}) {
    this.mode = mode || this.mode;
    if (opts.zoom) this.zoom = Math.max(0.5, Math.min(3, opts.zoom));
    if (opts.target) this.target = { x: opts.target.x || 0, y: opts.target.y || 0 };
  }
  update(race) {
    if (!race || !race.racers || race.racers.length === 0) return;
    const loc = race.liveLocations;
    const xs = race.racers.map(rid => loc[rid] || 0);
    const avg = xs.reduce((a,b)=>a+b,0) / xs.length;
    const minX = Math.max(0, Math.min(...xs));
    const maxX = Math.min(100, Math.max(...xs));

    if (this.mode === 'single' && race.racers[0] != null) {
      this.target.x = avg;
    } else if (this.mode === 'leaders') {
      const lead = Math.max(...xs);
      this.target.x = lead;
    } else if (this.mode === 'fitAll') {
      const margin = 15;
      const span = Math.max(30, (maxX - minX) + margin * 2);
      this.target.x = (minX + maxX) / 2;
      const zMin = (gameState.settings?.render?.camera?.zoomMin) || 0.5;
      const zMax = (gameState.settings?.render?.camera?.zoomMax) || 2.0;
      this.zoom = Math.max(zMin, Math.min(zMax, 100 / span));
    }
  }
}

window.Camera = Camera;