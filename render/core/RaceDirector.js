/**
 * RaceDirector - Comprehensive race direction system that manages camera, events, and spectacle
 */
export class RaceDirector {
  constructor() {
    this.currentShot = 'starting_lineup';
    this.lastShotChangeTime = 0;
    this.minShotDuration = 3000; // 3 seconds minimum between shot changes
    this.events = [];
    this.activeNotifications = new Map();
    this.eventListeners = new Map();
    
    // Track race state for better decisions
    this.raceAnalysis = {
      leadChanges: [],
      closeFinishes: [],
      stumbles: [],
      injuries: [],
      dramaticMoments: []
    };
  }

  /**
   * Get the current shot configuration with improved zoom logic
   */
  getShot(race, gameState, canvasDimensions) {
    this.analyzeRaceEvents(race, gameState);
    this.updateShot(race, gameState, canvasDimensions);
    
    const shotDef = this.shots[this.currentShot];
    const racers = shotDef.updateRacers(race, gameState);
    
    return {
      ...shotDef,
      racers: racers,
      zoom: this.calculateOptimalZoom(racers, race, canvasDimensions, shotDef),
      target: this.calculateOptimalTarget(racers, race, shotDef)
    };
  }

  /**
   * Analyze ongoing race events for dramatic moments
   */
  analyzeRaceEvents(race, gameState) {
    if (!race || !race.racers) return;
    
    const now = performance.now();
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

  /**
   * Detect lead changes for dramatic camera work
   */
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

  /**
   * Detect close racing situations
   */
  detectCloseRacing(race, activeRacers, now) {
    if (activeRacers.length < 2) return;
    
    const positions = activeRacers.map(rid => ({
      rid,
      pos: race.liveLocations[rid] || 0
    })).sort((a, b) => b.pos - a.pos);
    
    // Check for tight racing (racers within 5% of each other)
    for (let i = 0; i < positions.length - 1; i++) {
      const gap = positions[i].pos - positions[i + 1].pos;
      if (gap < 5 && positions[i].pos > 20) { // Close racing after start
        this.emitEvent('closeRacing', {
          racers: [positions[i].rid, positions[i + 1].rid],
          gap: gap,
          position: positions[i].pos
        });
      }
    }
  }

  /**
   * Detect incidents like stumbles
   */
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

  /**
   * Update the current shot based on race analysis
   */
  updateShot(race, gameState, canvasDimensions) {
    const now = performance.now();
    if (now - this.lastShotChangeTime < this.minShotDuration) {
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
    const recentEvents = this.events.filter(e => now - e.time < 5000);
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
      
      if (spread > 20) {
        this.setShot('leader_focus', now);
      } else {
        this.setShot('pack_focus', now);
      }
    }
  }

  /**
   * Calculate optimal zoom that considers actual screen dimensions
   */
  calculateOptimalZoom(racers, race, canvasDimensions, shotDef) {
    if (!canvasDimensions || racers.length === 0) {
      return 1.0;
    }

    const { width, height } = canvasDimensions;
    const laneHeight = 40; // From WorldTransform
    const numberOfLanes = race.racers.length;
    
    // Calculate how much vertical space we need for all lanes
    const totalTrackHeight = numberOfLanes * laneHeight;
    
    // Ensure all lanes are visible vertically
    const maxZoomForVerticalFit = height / (totalTrackHeight + 40); // +40 for padding
    
    // Calculate horizontal requirements
    const positions = racers.map(rid => race.liveLocations[rid] || 0);
    const minPos = Math.min(...positions);
    const maxPos = Math.max(...positions);
    const span = Math.max(shotDef.minSpan || 30, maxPos - minPos);
    const targetSpan = span + (shotDef.margin || 20);
    
    // Calculate zoom needed for horizontal fit
    const worldPixelWidth = width * 4; // From rendering system
    const maxZoomForHorizontalFit = (width * 0.8) / (worldPixelWidth * targetSpan / 100);
    
    // Use the more restrictive zoom (usually vertical)
    const optimalZoom = Math.min(maxZoomForVerticalFit, maxZoomForHorizontalFit);
    
    // Clamp to reasonable bounds
    return Math.max(0.3, Math.min(2.0, optimalZoom));
  }

  /**
   * Calculate optimal camera target position
   */
  calculateOptimalTarget(racers, race, shotDef) {
    if (racers.length === 0) {
      return { x: 50, y: 0 };
    }

    const positions = racers.map(rid => race.liveLocations[rid] || 0);
    const minPos = Math.min(...positions);
    const maxPos = Math.max(...positions);
    
    let targetX = (minPos + maxPos) / 2;
    
    // Apply lookahead for dynamic shots
    if (shotDef.lookahead && shotDef.lookahead > 0) {
      targetX = Math.max(...positions) + shotDef.lookahead;
    }
    
    return {
      x: Math.max(0, Math.min(100, targetX)),
      y: 0
    };
  }

  /**
   * Set the current shot
   */
  setShot(shotName, time) {
    if (this.currentShot !== shotName) {
      const previousShot = this.currentShot;
      this.currentShot = shotName;
      this.lastShotChangeTime = time;
      
      this.emitEvent('shotChange', {
        from: previousShot,
        to: shotName,
        time: time
      });
    }
  }

  /**
   * Emit events to listeners
   */
  emitEvent(type, data) {
    const event = {
      type,
      data,
      time: performance.now()
    };
    
    this.events.push(event);
    
    // Notify listeners
    const listeners = this.eventListeners.get(type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in race director event listener for ${type}:`, error);
      }
    });
  }

  /**
   * Subscribe to race director events
   */
  on(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType).push(callback);
  }

  /**
   * Clean up old events
   */
  cleanupOldEvents(now) {
    const maxAge = 30000; // 30 seconds
    this.events = this.events.filter(event => now - event.time < maxAge);
    
    // Clean up analysis data
    Object.keys(this.raceAnalysis).forEach(key => {
      if (Array.isArray(this.raceAnalysis[key])) {
        this.raceAnalysis[key] = this.raceAnalysis[key].filter(item => 
          !item.time || now - item.time < maxAge
        );
      }
    });
  }

  /**
   * Get current race events for UI display
   */
  getRecentEvents(maxAge = 10000) {
    const now = performance.now();
    return this.events.filter(event => now - event.time < maxAge);
  }

  /**
   * Shot definitions with improved parameters
   */
  shots = {
    starting_lineup: {
      updateRacers: (race, gameState) => race.racers.filter(rid => !(race.results || []).includes(rid)),
      margin: 15, // Reduced from 25
      minSpan: 40, // Reduced from 120
      lookahead: 0,
      priority: 'wide'
    },
    
    leader_focus: {
      updateRacers: (race, gameState) => {
        const sorted = race.racers
          .filter(rid => !(race.results || []).includes(rid))
          .sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
        return sorted.slice(0, 2); // Leader + closest competitor
      },
      margin: 20, // Reduced from 35
      minSpan: 25, // Reduced from 50
      lookahead: 3,
      priority: 'medium'
    },
    
    pack_focus: {
      updateRacers: (race, gameState) => {
        const sorted = race.racers
          .filter(rid => !(race.results || []).includes(rid))
          .sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
        return sorted.slice(0, Math.min(6, sorted.length)); // Top 6 or all
      },
      margin: 15, // Reduced from 25
      minSpan: 35, // Reduced from 70
      lookahead: 2,
      priority: 'wide'
    },
    
    close_finish: {
      updateRacers: (race, gameState) => {
        const sorted = race.racers
          .filter(rid => !(race.results || []).includes(rid))
          .sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
        return sorted.slice(0, 3); // Top 3 in close finish
      },
      margin: 8, // Reduced from 15
      minSpan: 15, // Reduced from 25
      lookahead: 1,
      priority: 'tight'
    },
    
    battle_focus: {
      updateRacers: (race, gameState) => {
        // Focus on racers involved in recent lead changes
        const recentLeadChange = this.raceAnalysis.leadChanges
          .filter(lc => performance.now() - lc.time < 5000)
          .pop();
        
        if (recentLeadChange) {
          return [recentLeadChange.oldLeader, recentLeadChange.newLeader];
        }
        
        // Fallback to top 3
        const sorted = race.racers
          .filter(rid => !(race.results || []).includes(rid))
          .sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
        return sorted.slice(0, 3);
      },
      margin: 12,
      minSpan: 20,
      lookahead: 2,
      priority: 'medium'
    },
    
    incident_focus: {
      updateRacers: (race, gameState) => {
        // Focus on racers involved in recent incidents
        const recentStumble = this.raceAnalysis.stumbles
          .filter(s => performance.now() - s.time < 3000)
          .pop();
        
        if (recentStumble) {
          // Include the stumbling racer and nearby competitors
          const stumblerPos = race.liveLocations[recentStumble.racerId] || 0;
          const nearbyRacers = race.racers.filter(rid => {
            const pos = race.liveLocations[rid] || 0;
            return Math.abs(pos - stumblerPos) < 15;
          });
          return nearbyRacers;
        }
        
        // Fallback to pack focus
        return this.shots.pack_focus.updateRacers(race);
      },
      margin: 18,
      minSpan: 30,
      lookahead: 0,
      priority: 'medium'
    },
    
    finish_approach: {
      updateRacers: (race, gameState) => {
        const sorted = race.racers
          .filter(rid => !(race.results || []).includes(rid))
          .sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
        return sorted.slice(0, 4); // Top 4 approaching finish
      },
      margin: 10,
      minSpan: 20,
      lookahead: 5,
      priority: 'medium'
    },
    
    finish_focus: {
      updateRacers: (race, gameState) => {
        // Focus on recently finished racers or the last active ones
        if (race.results && race.results.length > 0) {
          return race.results.slice(-2); // Last two finishers
        }
        return race.racers.filter(rid => !(race.results || []).includes(rid));
      },
      margin: 15,
      minSpan: 25,
      lookahead: 0,
      priority: 'medium'
    }
  };
}