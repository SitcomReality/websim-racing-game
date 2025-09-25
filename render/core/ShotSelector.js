/**
 * ShotSelector - Handles shot selection logic
 */
export class ShotSelector {
  constructor(eventManager) {
    this.eventManager = eventManager;
  }

  /**
   * Update the current shot based on race analysis
   */
  updateShot(race, gameState, raceAnalysis, canvasDimensions) {
    const now = performance.now();
    if (now - this.eventManager.lastShotChangeTime < this.eventManager.minShotDuration) {
      return; // Don't change shots too frequently
    }

    const activeRacers = race.racers.filter(rid => !(race.results || []).includes(rid));
    if (activeRacers.length === 0) {
      this.setShot('finish_focus', now);
      return;
    }

    const sortedRacers = [...activeRacers].sort((a, b) => 
      (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0)
    );
    const leaderPos = race.liveLocations[sortedRacers[0]] || 0;

    // Absolute priority: show winner crossing/finish
    if (race.results && race.results.length > 0) { this.setShot('finish_focus', now); return; }
    if (leaderPos >= 97) { this.setShot('finish_approach', now); return; }

    // Check for recent dramatic events that should influence shot selection

    // 1. Close finish (highest priority)
    if (leaderPos > 85 && sortedRacers.length > 1) {
      const secondPos = race.liveLocations[sortedRacers[1]] || 0;
      if (leaderPos - secondPos < 8) {
        this.setShot('close_finish', now);
        return;
      }
    }

    // 2. Recent dramatic events
    const recentEvents = this.eventManager.events.filter(e => now - e.time < 5000);
    const hasRecentStumble = recentEvents.some(e => e.type === 'stumble');
    const hasRecentLeadChange = recentEvents.some(e => e.type === 'leadChange');

    if (hasRecentStumble && leaderPos > 15) {
      this.setShot('incident_focus', now);
      return;
    }

    if (hasRecentLeadChange && leaderPos > 20 && leaderPos < 80) {
      this.setShot('battle_focus', now);
      return;
    }

    // 3. Race stage based shots
    if (leaderPos < 15) {
      this.setShot('starting_lineup', now);
    } else if (leaderPos > 75) {
      this.setShot('finish_approach', now);
    } else {
      // Mid-race: choose based on race dynamics
      const positions = sortedRacers.map(rid => race.liveLocations[rid] || 0);
      const spread = Math.max(...positions) - Math.min(...positions);

      if (spread > 8) {
        this.setShot('leader_focus', now);
      } else {
        this.setShot('pack_focus', now);
      }
    }
  }

  /**
   * Set the current shot
   */
  setShot(shotName, time) {
    if (this.eventManager.currentShot !== shotName) {
      this.eventManager.currentShot = shotName;
      this.eventManager.lastShotChangeTime = time;
    }
  }
}