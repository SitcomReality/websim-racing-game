/**
 * RaceEventManager - Handles race event detection and management
 */
export class RaceEventManager {
  constructor() {
    this.events = [];
    this.eventListeners = new Map();
    this.raceAnalysis = null;
  }

  /**
   * Analyze ongoing race events for dramatic moments
   */
  analyzeRaceEvents(race, gameState, raceAnalysis) {
    this.raceAnalysis = raceAnalysis;
    const now = performance.now();
    
    if (!race || !race.racers) return;
    
    // Track finish events
    this.detectFinishEvents(race, now);

    const activeRacers = race.racers.filter(rid => !(race.results || []).includes(rid));
    
    // Detect lead changes
    this.detectLeadChanges(race, now);
    
    // Detect close racing
    this.detectCloseRacing(race, activeRacers, now);
    
    // Detect stumbles and incidents
    this.detectIncidents(race, gameState, now);
    
    // Clean up old events
    this.cleanupOldEvents(now);
  }

  detectFinishEvents(race, now) {
    if (!race.results || !race.finishedAt) return;
    
    // Check if any new finishers since last check
    const recentFinishes = race.results.filter(rid => {
      const finishTime = race.finishedAt[rid];
      return finishTime && (now - finishTime) < 1000; // Within last second
    });
    
    if (recentFinishes.length > 0) {
      // Update last finish time to current time for camera tracking
      this.raceAnalysis.lastFinishTime = now;
      
      recentFinishes.forEach(rid => {
        this.emitEvent('racerFinished', {
          racerId: rid,
          finishTime: race.finishedAt[rid],
          position: race.results.indexOf(rid) + 1
        });
      });
    }
  }

  detectLeadChanges(race, now) {
    const sortedRacers = [...race.racers]
      .filter(rid => !(race.results || []).includes(rid))
      .sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
    
    if (sortedRacers.length === 0) return;
    
    const currentLeader = sortedRacers[0];
    const lastLeader = this.raceAnalysis.lastLeader;
    
    if (lastLeader && currentLeader !== lastLeader) {
      this.raceAnalysis.leadChanges.push({
        time: now,
        oldLeader: lastLeader,
        newLeader: currentLeader,
        position: race.liveLocations[currentLeader] || 0
      });
      
      this.emitEvent('leadChange', {
        oldLeader: lastLeader,
        newLeader: currentLeader,
        position: race.liveLocations[currentLeader] || 0
      });
    }
    
    this.raceAnalysis.lastLeader = currentLeader;
  }

  detectCloseRacing(race, activeRacers, now) {
    if (activeRacers.length < 2) return;
    
    const positions = activeRacers.map(rid => ({
      rid,
      pos: race.liveLocations[rid] || 0
    })).sort((a, b) => b.pos - a.pos);
    
    // Check for tight racing (racers within 5% of each other)
    for (let i = 0; i < positions.length - 1; i++) {
      const gap = positions[i].pos - positions[i + 1].pos;
      if (gap < 5 && positions[i].pos > 20) {
        this.emitEvent('closeRacing', {
          racers: [positions[i].rid, positions[i + 1].rid],
          gap: gap,
          position: positions[i].pos
        });
      }
    }
  }

  detectIncidents(race, gameState, now) {
    if (!gameState || !gameState.racers) return;
    
    race.racers.forEach(rid => {
      const racer = gameState.racers.find(r => r.id === rid);
      if (!racer) return;
      
      // Detect stumbles
      if (racer.ferret && racer.ferret.isStumbling) {
        const existingStumble = this.raceAnalysis.stumbles.find(s => 
          s.racerId === rid && now - s.time < 2000
        );
        
        if (!existingStumble) {
          this.raceAnalysis.stumbles.push({
            time: now,
            racerId: rid,
            position: race.liveLocations[rid] || 0
          });
          
          this.emitEvent('stumble', {
            racerId: rid,
            position: race.liveLocations[rid] || 0
          });
        }
      }
    });
  }

  cleanupOldEvents(now) {
    const maxAge = 30000; // 30 seconds
    this.events = this.events.filter(event => now - event.time < maxAge);
  }

  emitEvent(type, data) {
    const event = {
      type,
      data,
      time: performance.now()
    };
    
    this.events.push(event);
    
    const listeners = this.eventListeners.get(type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in race director event listener for ${type}:`, error);
      }
    });
  }

  on(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType).push(callback);
  }

  getRecentEvents(maxAge = 10000) {
    const now = performance.now();
    return this.events.filter(event => now - event.time < maxAge);
  }
}