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
  
  calculateDesiredState(race, gameState) {
    if (!race || !race.racers || race.racers.length === 0) {
      return { desiredX: this.target.x, desiredZoom: this.zoom };
    }
    
    if (!gameState) {
      return { desiredX: this.target.x, desiredZoom: this.zoom };
    }
    
    const loc = race.liveLocations;
    const xs = race.racers.map(rid => loc[rid] || 0);
    const avg = xs.reduce((a, b) => a + b, 0) / xs.length;
    const minX = Math.max(0, Math.min(...xs));
    const maxX = Math.min(100, Math.max(...xs));
    
    let desiredX = this.target.x;
    let desiredZoom = this.zoom;

    if (this.mode === 'single' && race.racers[0] != null) {
      desiredX = avg;
    } else if (this.mode === 'leaders') {
      const lead = Math.max(...xs);
      desiredX = lead;
    } else if (this.mode === 'average') {
      desiredX = avg;
    } else if (this.mode === 'fitAll') {
      const margin = 15;
      const span = Math.max(30, (maxX - minX) + margin * 2);
      desiredX = (minX + maxX) / 2;
      const zMin = (gameState.settings?.render?.camera?.zoomMin) || 0.5;
      const zMax = (gameState.settings?.render?.camera?.zoomMax) || 2.0;
      desiredZoom = Math.max(zMin, Math.min(zMax, 100 / span));
    }
    return { desiredX, desiredZoom };
  }
}

export { Camera };