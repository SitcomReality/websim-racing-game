import { Race } from '../../models/Race.js';

/**
 * ProgressionManager - Handles week/season progression
 */
export class ProgressionManager {
  constructor(eventBus, gameState) {
    this.eventBus = eventBus;
    this.gameState = gameState;
    this.currentSeason = 1;
    this.weekInSeason = 1;
    this.totalWeeksCompleted = 0;
    this.achievements = new Set();
  }

