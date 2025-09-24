/**
 * RacerRenderer - Renders all racers with their ferret representations
 */
export class RacerRenderer {
  constructor() {
    this.screenPositions = [];
    this.ferretRenderer = new FerretRenderer();
  }

  render(ctx, race, worldTransform, time) {
    this.screenPositions = [];

    for (let idx = 0; idx < race.racers.length; idx++) {
      const rid = race.racers[idx];
      const racer = window.gameState?.racers[rid];
      const worldX = race.liveLocations[rid] || 0;
      const screen = worldTransform.worldToScreen(worldX, idx);

      this.screenPositions.push({ rid, x: screen.x, y: screen.y, r: 25 * screen.scale });

      // Render ferret using the dedicated renderer
      this.ferretRenderer.render(ctx, screen.x, screen.y, racer, time, screen.scale);

      // Handle boost particles
      this.renderBoostEffects(ctx, racer, screen, idx, worldTransform);
    }

    this.updateLeaderboard(race);
  }

  renderBoostEffects(ctx, racer, screen, laneIndex, worldTransform) {
    if (racer?.isBoosting && Math.random() < 0.3) {
      const screen = worldTransform.worldToScreen(
        racer.liveLocations || 0,
        laneIndex,
        window.canvasRenderer ? window.canvasRenderer.camera : null,
        window.canvasRenderer ? window.canvasRenderer.canvas.width : 800,
        window.canvasRenderer ? window.canvasRenderer.canvas.height : 520,
        window.canvasRenderer && window.canvasRenderer.props ? window.canvasRenderer.props.numberOfLanes : 10
      );
      
      if (window.canvasRenderer && window.canvasRenderer.particleSystem) {
        window.canvasRenderer.particleSystem.emit(
          screen.x, 
          screen.y, 
          Math.PI,
          80 * screen.scale, 
          2, 
          'rgba(255,255,255,0.8)'
        );
      }
    }
  }

  updateLeaderboard(race) {
    const leaderList = document.getElementById('leaderList');
    if (leaderList && race && Array.isArray(race.racers)) {
      const sorted = race.racers.slice().sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
      leaderList.innerHTML = '';
      sorted.slice(0, 5).forEach((rid, i) => { 
        const r = window.gameState?.racers[rid]; 
        if (!r) return; 
        const li = document.createElement('li'); 
        li.textContent = `${i + 1}. ${this.getRacerNameString(r)}`; 
        leaderList.appendChild(li); 
      });
    }
  }

  getRacerNameString(racer) {
    if (!racer || !racer.name) return "Unknown Racer";

    const prefix = window.racerNamePrefixes?.[racer.name[0]];
    const suffix = window.racerNameSuffixes?.[racer.name[1]];

    let prefixStr, suffixStr;

    if (typeof prefix === 'function') {
      prefixStr = racer._evaluatedPrefix || (racer._evaluatedPrefix = prefix());
    } else {
      prefixStr = prefix;
    }

    if (typeof suffix === 'function') {
      suffixStr = racer._evaluatedSuffix || (racer._evaluatedSuffix = suffix());
    } else {
      suffixStr = suffix;
    }

    return `${prefixStr} ${suffixStr}`;
  }

  getScreenPositions() {
    return this.screenPositions;
  }
}