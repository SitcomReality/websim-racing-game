/**
 * ShotSelector - Handles shot selection logic
 */
export class ShotSelector {
  constructor(director) {
    this.director = director;
  }

  /**
   * Update the current shot based on race analysis
   */
  updateShot(race, gameState, raceAnalysis) {
    const now = performance.now();
    if (now - this.director.lastShotChangeTime < this.director.minShotDuration) {
      return; // Don't change shots too frequently
    }

    const activeRacers = race.racers.filter(rid => !(race.results || []).includes(rid));
    if (activeRacers.length === 0) {
      this.director.setShot('finish_focus', now);
      return;
    }

    const sortedRacers = [...activeRacers].sort((a, b) => 
      (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0)
    );
    const leaderPos = race.liveLocations[sortedRacers[0]] || 0;

    // --- DYNAMIC SHOT SELECTION ---

    // 1. FINISH LINE PRIORITY (but more flexible)
    if (race.results && race.results.length > 0) {
        this.director.setShot('finish_focus', now);
        return;
    }
    
    if (leaderPos >= 96) { // Closer to finish line before locking
        this.director.setShot('finish_approach', now);
        return;
    }

    // 2. RECENT EVENTS (with reduced rigidity)
    const recentEvents = this.director.eventManager.getRecentEvents(4000); // Shorter window
    const hasRecentStumble = recentEvents.some(e => e.type === 'stumble');
    const hasRecentLeadChange = recentEvents.some(e => e.type === 'leadChange');

    // 3. DYNAMIC RACING CONDITIONS
    const positions = sortedRacers.map(rid => race.liveLocations[rid] || 0);
    const pack = positions.slice(0, Math.min(positions.length, 5));
    const packSpread = Math.max(...pack) - Math.min(...pack);
    
    // Close finish detection (more nuanced)
    if (leaderPos > 88 && sortedRacers.length > 1) {
      const secondPos = race.liveLocations[sortedRacers[1]] || 0;
      if (leaderPos - secondPos < 6) {
        this.director.setShot('close_finish', now);
        return;
      }
    }

    // Incident focus (less sticky)
    if (hasRecentStumble && leaderPos > 20 && Math.random() < 0.7) { // Add some randomness
      this.director.setShot('incident_focus', now);
      return;
    }

    // Battle focus (more flexible conditions)
    if (hasRecentLeadChange && leaderPos > 25 && leaderPos < 85) {
      this.director.setShot('battle_focus', now);
      return;
    }

    // 4. CONTEXTUAL SHOTS
    // Start of the race (shorter duration)
    if (leaderPos < 12) {
      this.director.setShot('starting_lineup', now);
      return;
    }
    
    // Dynamic mid-race decisions
    if (sortedRacers.length > 1) {
        const leaderGap = positions[0] - positions[1];
        
        // Leader breakaway (higher threshold)
        if (leaderGap > 15 && Math.random() < 0.6) { // Add variety
            this.director.setShot('leader_focus', now);
            return;
        }
        
        // Tight pack racing
        if (packSpread < 8 && positions.length > 2) {
            this.director.setShot('battle_focus', now);
            return;
        }
    }
    
    // Default to pack focus with occasional variation
    if (Math.random() < 0.85) {
        this.director.setShot('pack_focus', now);
    } else {
        // Occasional leader focus for variety
        this.director.setShot('leader_focus', now);
    }
  }
}