import { RaceDirector } from './RaceDirector.js';

class Camera {
  constructor() {
    this.mode = 'directed'; // Use the new director-based mode
    this.target = { x: 0, y: 0 };
    this.zoom = 1;
    this.damping = 0.15;
    this.director = new RaceDirector();
    this.debug = true; // Enable debug logging
  }

  setMode(mode, opts = {}) {
    this.mode = mode || this.mode;
    if (opts.zoom) this.zoom = Math.max(0.5, Math.min(3, opts.zoom));
    if (opts.target) this.target = { x: opts.target.x || 0, y: opts.target.y || 0 };
  }

  calculateDesiredState(race, gameState, canvasDimensions) {
    if (!race || !race.racers || race.racers.length === 0 || !gameState) {
      return { desiredX: this.target.x, desiredZoom: this.zoom };
    }
    
    if (this.mode === 'directed') {
      const shot = this.director.getShot(race, gameState, canvasDimensions);
      if (this.director.debug || this.debug) {
        console.log('[Camera:calculateDesiredState]', shot.name, { 
          racers: shot.racers, 
          target: shot.target, 
          zoom: shot.zoom 
        });
      }
      return {
        desiredX: shot.target.x,
        desiredZoom: shot.zoom
      };
    }

    // Fallback for older modes (simplified)
    const loc = race.liveLocations;
    const xs = race.racers.map(rid => loc[rid] || 0);
    const avg = xs.reduce((a, b) => a + b, 0) / xs.length;

    return { 
      desiredX: Math.max(0, Math.min(100, avg)), 
      desiredZoom: 1.0 
    };
  }

  // Expose director for external access
  getRaceDirector() {
    return this.director;
  }
}

export { Camera };