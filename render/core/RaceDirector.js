import { RaceEventManager } from './RaceEventManager.js';
import { ShotSelector } from './ShotSelector.js';
import { CameraCalculator } from './CameraCalculator.js';
import { shotDefinitions } from './ShotDefinitions.js';

/**
 * RaceDirector - Comprehensive race direction system that manages camera, events, and spectacle
 * Refactored into smaller, focused modules
 */
export class RaceDirector {
  constructor() {
    this.currentShot = 'starting_lineup';
    this.lastShotChangeTime = 0;
    this.minShotDuration = 3000; // 3 seconds minimum between shot changes
    this.debug = true;
    
    // Initialize subsystems
    this.eventManager = new RaceEventManager();
    this.shotSelector = new ShotSelector(this);
    this.cameraCalculator = new CameraCalculator();
    this.shots = shotDefinitions;
    
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
    if (this.debug) console.log('[RaceDirector:getShot] Starting analysis');
    
    this.eventManager.analyzeRaceEvents(race, gameState, this.raceAnalysis);
    
    // ShotSelector will call back to director's setShot method
    this.shotSelector.updateShot(race, gameState, this.raceAnalysis);
    
    const shotDef = this.shots[this.currentShot];
    // The racers to frame are determined by the shot definition
    const racersToFrame = shotDef.updateRacers(race, gameState, this.raceAnalysis);
    
    if (this.debug) {
      console.log('[RaceDirector:getShot] Results:', {
        shotName: this.currentShot,
        racersToFrame: racersToFrame,
        target: this.cameraCalculator.calculateOptimalTarget(racersToFrame, race, shotDef),
        zoom: this.cameraCalculator.calculateOptimalZoom(racersToFrame, race, canvasDimensions, shotDef)
      });
    }
    
    return {
      name: this.currentShot,
      racers: racersToFrame,
      zoom: this.cameraCalculator.calculateOptimalZoom(racersToFrame, race, canvasDimensions, shotDef),
      target: this.cameraCalculator.calculateOptimalTarget(racersToFrame, race, shotDef)
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
      
      if (this.debug) {
        console.log('[RaceDirector:setShot] Shot changed:', { 
          from: previousShot, 
          to: shotName, 
          time: time 
        });
      }
      
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
}