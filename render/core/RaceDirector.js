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
    this.minShotDuration = 3000;
    this.lastShotChangeSection = -1;
    this.currentTransition = { urgency: 'smooth', suggestedDamping: { pan: 0.10, zoom: 0.10 } };
    this.finishGraceMs = 1200; // ensure camera holds on finishers briefly

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
      dramaticMoments: [],
      lastFinishTime: 0 // Track time of last racer finishing (performance.now())
    };
  }

  /**
   * Get the current shot configuration
   */
  getShot(race, gameState, canvasDimensions) {
    this.eventManager.analyzeRaceEvents(race, gameState, this.raceAnalysis);

    // ShotSelector will call back to director's setShot method
    this.shotSelector.updateShot(race, gameState, this.raceAnalysis);

    const shotDef = this.shots[this.currentShot];
    // The racers to frame are determined by the shot definition
    const racersToFrame = shotDef.updateRacers(race, gameState, this.raceAnalysis);

    return {
      name: this.currentShot,
      racers: racersToFrame,
      zoom: this.cameraCalculator.calculateOptimalZoom(racersToFrame, race, canvasDimensions, shotDef),
      target: this.cameraCalculator.calculateOptimalTarget(racersToFrame, race, shotDef),
      meta: this.currentTransition
    };
  }

  /**
   * Set the current shot
   */
  setShot(shotName, time, section) {
    if (this.currentShot !== shotName) {
      const previousShot = this.currentShot;
      this.currentShot = shotName;
      this.lastShotChangeTime = time;
      this.lastShotChangeSection = section;

      // Transition metadata: urgent shots move faster, otherwise ease
      const urgentShots = new Set(['incident_focus','finish_approach','finish_focus','close_finish']);
      const urgency = urgentShots.has(shotName) ? 'urgent' : 'smooth';
      this.currentTransition = {
        urgency,
        suggestedDamping: urgency === 'urgent' ? { pan: 0.05, zoom: 0.05 } : { pan: 0.015, zoom: 0.015 }
      };

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