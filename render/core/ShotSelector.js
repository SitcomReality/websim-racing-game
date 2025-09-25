/**
 * ShotSelector - Handles shot selection logic
 */
export class ShotSelector {
  constructor(director) {
    this.director = director;
    this.debug = true; // Enable debug logging
  }

  /**
   * Update the current shot based on race analysis
   */
  updateShot(race, gameState, raceAnalysis) {
    const now = performance.now();
    if (now - this.director.lastShotChangeTime < this.director.minShotDuration) {
      if (this.debug || this.director.debug) {
        console.debug('[ShotSelector] Throttled shot change');
      }
      return; // Don't change shots too frequently
    }

    const activeRacers = race.racers.filter(rid => !(race.results || []).includes(rid));
    if (activeRacers.length === 0) {
      if (this.debug || this.director.debug) {
        console.debug('[ShotSelector] No active racers -> finish_focus');
      }
      this.director.setShot('finish_focus', now);
      return;
    }

    const sortedRacers = [...activeRacers].sort((a, b) => 
      (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0)
    );
    const leaderPos = race.liveLocations[sortedRacers[0]] || 0;

    // --- SHOT SELECTION HIERARCHY ---

    // 1. ABSOLUTE PRIORITY: Finish Line Sequence
    // If anyone has finished, lock focus on the finishers.
    if (race.results && race.results.length > 0) {
        if (this.debug || this.director.debug) {
          console.debug('[ShotSelector] Winner finished -> finish_focus', race.results[0]);
        }
        this.director.setShot('finish_focus', now);
        return;
    }
    // As the leader approaches the finish, lock into the finish approach shot.
    if (leaderPos >= 95) {
        if (this.debug || this.director.debug) {
          console.debug('[ShotSelector] Leader near finish -> finish_approach', { leaderPos });
        }
        this.director.setShot('finish_approach', now);
        return;
    }

    // 2. HIGH PRIORITY: Critical Race Moments
    // Close finish battle
    if (leaderPos > 85 && sortedRacers.length > 1) {
      const secondPos = race.liveLocations[sortedRacers[1]] || 0;
      if (leaderPos - secondPos < 5) { // Tight gap near the end
        if (this.debug || this.director.debug) {
          console.debug('[ShotSelector] Close finish -> close_finish', { leaderPos, secondPos });
        }
        this.director.setShot('close_finish', now);
        return;
      }
    }

    // Look for recent dramatic events to guide camera
    const recentEvents = this.director.eventManager.getRecentEvents(5000); // last 5s
    const hasRecentStumble = recentEvents.some(e => e.type === 'stumble');
    const hasRecentLeadChange = recentEvents.some(e => e.type === 'leadChange');

    if (hasRecentStumble && leaderPos > 15) {
      if (this.debug || this.director.debug) {
        console.debug('[ShotSelector] Recent stumble -> incident_focus');
      }
      this.director.setShot('incident_focus', now);
      return;
    }
    if (hasRecentLeadChange && leaderPos > 20 && leaderPos < 80) {
      if (this.debug || this.director.debug) {
        console.debug('[ShotSelector] Lead change -> battle_focus');
      }
      this.director.setShot('battle_focus', now);
      return;
    }

    // 3. STANDARD PRIORITY: Race Stage & Dynamics
    // Start of the race
    if (leaderPos < 15) {
      if (this.debug || this.director.debug) {
        console.debug('[ShotSelector] Early race -> starting_lineup', { leaderPos });
      }
      this.director.setShot('starting_lineup', now);
      return;
    }
    
    // Mid-race logic
    const positions = sortedRacers.map(rid => race.liveLocations[rid] || 0);
    const pack = positions.slice(0, Math.min(positions.length, 5));
    const packSpread = Math.max(...pack) - Math.min(...pack);

    if (sortedRacers.length > 2) {
        const leaderGap = positions[0] - positions[1];
        // If leader has a significant breakaway, focus on them.
        if (leaderGap > 12) {
            if (this.debug || this.director.debug) {
              console.debug('[ShotSelector] Leader breakaway -> leader_focus', { leaderGap });
            }
            this.director.setShot('leader_focus', now);
            return;
        }
    }
    
    if (this.debug || this.director.debug) {
      console.debug('[ShotSelector] Default -> pack_focus');
    }
    this.director.setShot('pack_focus', now);
  }
}