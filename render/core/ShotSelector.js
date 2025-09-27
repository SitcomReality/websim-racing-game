/**
 * ShotSelector - Handles shot selection logic
 */
export class ShotSelector {
  constructor(director) {
    this.director = director;
    this.lastSeenFinishTime = 0;
    this.finishLockUntil = 0;
  }
  
  /**
   * Tries to set a new shot, respecting section-based pacing.
   * High priority events can override the section lock.
   */
  trySetShot(shotName, now, currentSection, isSameSection, highPriorityEvent) {
    // Loosen section rule: allow transitions within the same section unless pace lock applies
    const isNearStart = currentSection === 0;
    const isNearFinish = (this.director.raceAnalysis?.leaderPos || 0) > 90;

    if (highPriorityEvent || isNearStart || isNearFinish || !isSameSection) {
      this.director.setShot(shotName, now, currentSection);
    }
  }

  /**
   * Update the current shot based on race analysis
   */
  updateShot(race, gameState, raceAnalysis) {
    const now = performance.now();
    
    // Detect new finisher and establish a finish lock window
    if (raceAnalysis.lastFinishTime && raceAnalysis.lastFinishTime > this.lastSeenFinishTime) {
      this.lastSeenFinishTime = raceAnalysis.lastFinishTime;
      this.finishLockUntil = now + 1500; // enforce stable finish focus for 1.5s
    }

    // If within lock window, force finish_focus immediately (override minDuration)
    if (now < this.finishLockUntil) {
      this.director.setShot('finish_focus', now, -1);
      return;
    }

    // Use longer minimum durations for finish-related shots
    const isFinishShot = ['finish_focus', 'finish_approach', 'close_finish'].includes(this.director.currentShot);
    const minDuration = isFinishShot ? 4000 : this.director.minShotDuration;
    
    if (now - this.director.lastShotChangeTime < minDuration) {
      return; // Don't change shots too frequently
    }

    const activeRacers = race.racers.filter(rid => {
      const t = race.finishedAt?.[rid];
      return !t || (Date.now() - t) < 1000;
    });
    
    // If no active racers remain, force finish focus on the last position.
    if (activeRacers.length === 0) {
      this.director.setShot('finish_focus', now, -1); // Use -1 for section as race is over
      return;
    }

    const sortedRacers = [...activeRacers].sort((a, b) => 
      (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0)
    );
    const leaderPos = race.liveLocations[sortedRacers[0]] || 0;
    raceAnalysis.leaderPos = leaderPos; // Store for other modules

    // --- CALCULATE CURRENT SECTION FOR PACING ---
    const segmentsPerSection = gameState.settings.trackProperties.segmentsPerSection;
    const totalSegments = race.segments.length > 1 ? race.segments.length -1 : 1;
    const currentSegment = Math.floor((leaderPos / 100) * totalSegments);
    const currentSection = Math.floor(currentSegment / segmentsPerSection);
    const isSameSection = currentSection === this.director.lastShotChangeSection;

    // --- SHOT SELECTION LOGIC ---
    const recentEvents = this.director.eventManager.getRecentEvents(4000);
    const highPriorityEvent = recentEvents.some(e => e.type === 'stumble' || e.type === 'leadChange');

    // Calculate recent finish drama with extended grace period
    const timeSinceLastFinish = now - (raceAnalysis.lastFinishTime || 0);
    const isRecentFinishDrama = timeSinceLastFinish < 2000;

    // Force finish focus during recent finish drama, regardless of current leader position
    if (isRecentFinishDrama) {
      this.trySetShot('finish_focus', now, -1, false, true);
      return;
    }

    // 1. FINISH LINE SEQUENCE - ABSOLUTE TOP PRIORITY
    // Be much more aggressive about staying on finish shots
    if (leaderPos >= 88 || (isRecentFinishDrama && leaderPos >= 80)) {
      if (leaderPos >= 94 || isRecentFinishDrama) {
        this.trySetShot('finish_focus', now, currentSection, isSameSection, true);
      } else {
        this.trySetShot('finish_approach', now, currentSection, isSameSection, true);
      }
      return;
    }
    
    // 2. START OF RACE
    if (leaderPos < 15) {
      this.trySetShot('starting_lineup', now, currentSection, isSameSection, false);
      return;
    }

    // 3. MID-RACE DYNAMICS
    const positions = sortedRacers.map(rid => race.liveLocations[rid] || 0);
    const pack = positions.slice(0, Math.min(positions.length, 5));
    const packSpread = pack.length > 1 ? Math.max(...pack) - Math.min(...pack) : 0;
    
    // Close finish potential - be more conservative near the end
    if (leaderPos > 82 && sortedRacers.length > 1) {
      const secondPos = race.liveLocations[sortedRacers[1]] || 0;
      if (leaderPos - secondPos < 10) {
        this.trySetShot('close_finish', now, currentSection, isSameSection, highPriorityEvent);
        return;
      }
    }

    // Battles & Lead Changes
    if (highPriorityEvent && recentEvents.some(e => e.type === 'leadChange')) {
      this.trySetShot('battle_focus', now, currentSection, isSameSection, true);
      return;
    }
    
    // Pack analysis
    if (sortedRacers.length > 1) {
        const leaderGap = positions[0] - positions[1];
        
        // Leader breakaway
        if (leaderGap > 12) {
            this.trySetShot('leader_focus', now, currentSection, isSameSection, false);
            return;
        }
        
        // Tight pack racing
        if (packSpread < 10 && positions.length > 2) {
            this.trySetShot('battle_focus', now, currentSection, isSameSection, false);
            return;
        }
    }
    
    // 4. DEFAULT SHOT
    this.trySetShot('pack_focus', now, currentSection, isSameSection, false);
  }
}