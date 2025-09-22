
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
    // simple modes
    if (this.mode === 'single' && race.racers[0] != null) {
      this.target.x = avg; // could be specific racer; keep avg minimal
    } else if (this.mode === 'leaders') {
      const lead = Math.max(...xs);
      this.target.x = lead;
    } else if (this.mode === 'average') {
      this.target.x = avg;
    } else if (this.mode === 'fitAll') {
      this.target.x = avg; // placeholder
      this.zoom = 1;
    }
  }
}
window.Camera = Camera;