import { RaceEventManager } from './RaceEventManager.js';
import { ShotSelector } from './ShotSelector.js';
import { CameraCalculator } from './CameraCalculator.js';

/**
 * RaceDirector - Comprehensive race direction system that manages camera, events, and spectacle
 * Refactored into smaller, focused modules
 */
export class RaceDirector {
  constructor() {
    this.currentShot = 'starting_lineup';
    this.lastShotChangeTime = 0;
    this.minShotDuration = 3000; // 3 seconds minimum between shot changes
    
    // Initialize subsystems
    this.eventManager = new RaceEventManager();
    this.shotSelector = new ShotSelector(this.eventManager);
    this.cameraCalculator = new CameraCalculator();
    
    // Track race state
    this.raceAnalysis = {
      leadChanges: [],
      closeFinishes: [],
      stumbles: [],
      injuries: [],
      dramaticMoments: []
    };
  }

  /**
   * Get the current shot configuration
   */
  getShot(race, gameState, canvasDimensions) {
    this.eventManager.analyzeRaceEvents(race, gameState, this.raceAnalysis);
    this.shotSelector.updateShot(race, gameState, this.raceAnalysis, canvasDimensions);
    
    const shotDef = this.shots[this.currentShot];
    const racers = shotDef.updateRacers(race, gameState);
    
    return {
      ...shotDef,
      racers: racers,
      zoom: this.cameraCalculator.calculateOptimalZoom(racers, race, canvasDimensions, shotDef),
      target: this.cameraCalculator.calculateOptimalTarget(racers, race, shotDef)
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
      
      this.eventManager.emitEvent('shotChange', {
        from: previousShot,
        to: shotName,
        time: time
      });
    }
  }

  /**
   * Subscribe to race director events
   */
  on(eventType, callback) {
    this.eventManager.on(eventType, callback);
  }

  /**
   * Get current race events for UI display
   */
  getRecentEvents(maxAge = 10000) {
    return this.eventManager.getRecentEvents(maxAge);
  }

  /**
   * Shot definitions
   */
  shots = {
    starting_lineup: {
      updateRacers: (race, gameState) => race.racers.filter(rid => !(race.results || []).includes(rid)),
      margin: 15,
      minSpan: 40,
      lookahead: 0,
      priority: 'wide'
    },
    
    leader_focus: {
      updateRacers: (race, gameState) => {
          const sorted = race.racers
            .filter(rid => !(race.results || []).includes(rid))
            .sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
          return sorted.length > 0 ? [sorted[0]] : [];
      },
      margin: 20,
      minSpan: 25,
      lookahead: 3,
      priority: 'medium'
    },
    
    pack_focus: {
      updateRacers: (race, gameState) => {
        const sorted = race.racers
          .filter(rid => !(race.results || []).includes(rid))
          .sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
        return sorted.slice(0, Math.min(6, sorted.length));
      },
      margin: 15,
      minSpan: 35,
      lookahead: 2,
      priority: 'wide'
    },
    
    close_finish: {
      updateRacers: (race, gameState) => {
        const sorted = race.racers
          .filter(rid => !(race.results || []).includes(rid))
          .sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
        return sorted.slice(0, 3);
      },
      margin: 8,
      minSpan: 15,
      lookahead: 1,
      priority: 'tight'
    },
    
    battle_focus: {
      updateRacers: (race, gameState) => {
        const recentLeadChange = this.raceAnalysis.leadChanges
          .filter(lc => performance.now() - lc.time < 5000)
          .pop();
        
        if (recentLeadChange) {
          return [recentLeadChange.oldLeader, recentLeadChange.newLeader];
        }
        
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
        const recentStumble = this.raceAnalysis.stumbles
          .filter(s => performance.now() - s.time < 3000)
          .pop();
        
        if (recentStumble) {
          const stumblerPos = race.liveLocations[recentStumble.racerId] || 0;
          return race.racers.filter(rid => {
            const pos = race.liveLocations[rid] || 0;
            return Math.abs(pos - stumblerPos) < 15;
          });
        }
        
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
        return sorted.slice(0, 4);
      },
      margin: 10,
      minSpan: 20,
      lookahead: 5,
      priority: 'medium'
    },
    
    finish_focus: {
      updateRacers: (race, gameState) => {
        if (race.results && race.results.length > 0) {
          return race.results.slice(-2);
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