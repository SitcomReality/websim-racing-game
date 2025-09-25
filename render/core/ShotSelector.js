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

    // --- SHOT SELECTION HIERARCHY ---

    // 1. ABSOLUTE PRIORITY: Finish Line Sequence
    // If anyone has finished, lock focus on the finishers.
    if (race.results && race.results.length > 0) {
        this.director.setShot('finish_focus', now);
        return;
    }
    // As the leader approaches the finish, lock into the finish approach shot.
    if (leaderPos >= 95) {
        this.director.setShot('finish_approach', now);
        return;
    }

    // 2. HIGH PRIORITY: Critical Race Moments
    // Close finish battle
    if (leaderPos > 85 && sortedRacers.length > 1) {
      const secondPos = race.liveLocations[sortedRacers[1]] || 0;
      if (leaderPos - secondPos < 5) { // Tight gap near the end
        this.director.setShot('close_finish', now);
        return;
      }
    }

    // Look for recent dramatic events to guide camera
    const recentEvents = this.director.eventManager.getRecentEvents(5000); // last 5s
    const hasRecentStumble = recentEvents.some(e => e.type === 'stumble');
    const hasRecentLeadChange = recentEvents.some(e => e.type === 'leadChange');

    if (hasRecentStumble && leaderPos > 15) {
      this.director.setShot('incident_focus', now);
      return;
    }
    if (hasRecentLeadChange && leaderPos > 20 && leaderPos < 80) {
      this.director.setShot('battle_focus', now);
      return;
    }

    // 3. STANDARD PRIORITY: Race Stage & Dynamics
    // Start of the race
    if (leaderPos < 15) {
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
            this.director.setShot('leader_focus', now);
            return;
        }
    }
    
    // Default to showing the front pack
    this.director.setShot('pack_focus', now);
  }
}