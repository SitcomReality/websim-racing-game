import { racerComponents } from './RacerComponents.js';
import { FerretFactory } from './FerretFactory.js';

/**
 * Racer - Lightweight entity that composes components
 * NOTE: This is becoming the new source of truth for racer objects.
 */
export class Racer {
  constructor(id, name, colors, config) {
    this.id = id;
    this.name = name;
    this.colors = colors;
    this.config = config;

    // Visual properties
    this.visual = {
      finished: false
    };

    this.didNotFinish = false;

    // Create ferret anatomy data for rendering
    this.ferret = FerretFactory.create(this);

    // Initialize components - FIX: ensure components is initialized first
    this.components = new Map();
    
    // Then create component instances
    this.components = racerComponents.createComponents(this, config);

    // Initialize component-based properties
    this.initializeFromComponents();
  }

  /**
   * Initialize properties from components
   */
  initializeFromComponents() {
    const stats = this.getComponent('stats');
    const performance = this.getComponent('performance');
    const betting = this.getComponent('betting');
    const history = this.getComponent('history');

    if (stats) {
      stats.compensateStats();
    }

    if (performance) {
      performance.initialize();
    }

    if (betting) {
      betting.generateBaseBettingOdds();
    }
  }

  /**
   * Get a component by name
   */
  getComponent(name) {
    // Ensure components exists before accessing it
    if (!this.components) {
      this.components = new Map();
    }
    return this.components.get(name);
  }

  /**
   * Get component property - backward compatibility
   */
  get stats() {
    return this.getComponent('stats')?.stats || {};
  }

  get remainingEndurance() {
    return this.getComponent('performance')?.remainingEndurance || 0;
  }

  set remainingEndurance(value) {
    const performance = this.getComponent('performance');
    if (performance) {
      performance.remainingEndurance = value;
    }
  }

  get remainingBoost() {
    return this.getComponent('performance')?.remainingBoost || 0;
  }

  set remainingBoost(value) {
    const performance = this.getComponent('performance');
    if (performance) {
      performance.remainingBoost = value;
    }
  }

  get isExhausted() {
    return this.getComponent('performance')?.isExhausted || false;
  }

  set isExhausted(value) {
    const performance = this.getComponent('performance');
    if (performance) {
      performance.isExhausted = value;
    }
  }

  get isBoosting() {
    return this.getComponent('performance')?.isBoosting || false;
  }

  set isBoosting(value) {
    const performance = this.getComponent('performance');
    if (performance) {
      performance.isBoosting = value;
    }
  }

  get baseBettingOdds() {
    return this.getComponent('betting')?.baseBettingOdds || 1.5;
  }

  set baseBettingOdds(value) {
    const betting = this.getComponent('betting');
    if (betting) {
      betting.baseBettingOdds = value;
    }
  }

  get history() {
    return this.getComponent('history')?.history || [];
  }

  get performance() {
    return this.getComponent('performance') || {};
  }

  get speedHistory() {
    return this.getComponent('history')?.speedHistory || [];
  }

  get wins() {
    return this.getComponent('history')?.wins || 0;
  }

  set wins(value) {
    const history = this.getComponent('history');
    if (history) {
      history.wins = value;
    }
  }

  get speedThisRace() {
    return this.getComponent('performance')?.speedThisRace || [];
  }

  set speedThisRace(value) {
    const performance = this.getComponent('performance');
    if (performance) {
      performance.speedThisRace = value;
    }
  }

  /**
   * Calculate speed - delegates to performance component
   */
  calculateSpeed(racerForm, percentRaceComplete, groundType, weatherType) {
    const performance = this.getComponent('performance');
    if (performance) {
      return performance.calculateSpeed(racerForm, percentRaceComplete, groundType, weatherType);
    }

    // Fallback calculation
    let returnSpeed = this.config.racerProperties.speedBase;
    returnSpeed *= this.stats.ground?.[groundType] || 1;
    returnSpeed *= this.stats.weather?.[weatherType] || 1;

    const currentThird = percentRaceComplete < 34 ? 1 : percentRaceComplete > 66 ? 3 : 2;
    let thirdName = "one";
    if (currentThird === 2) { thirdName = "two"; }
    if (currentThird === 3) { thirdName = "three"; }

    returnSpeed *= this.stats.third?.[thirdName] || 1;
    returnSpeed *= racerForm;

    if (this.isExhausted) {
      returnSpeed *= this.stats.exhaustionMultiplier || 0.75;
    }

    if (this.isBoosting) {
      returnSpeed += this.stats.boostPower || 800;
    }

    returnSpeed = Math.trunc(returnSpeed * this.config.racerProperties.speedMultiplier * 10000) / 10000;

    if (this.speedThisRace[this.speedThisRace.length - 1] !== returnSpeed) {
      this.speedThisRace.push(returnSpeed);
    }

    return returnSpeed;
  }

  /**
   * Get average speed - delegates to performance component
   */
  getAverageSpeed() {
    const performance = this.getComponent('performance');
    if (performance) {
      return performance.getAverageSpeed();
    }

    if (this.speedThisRace.length === 0) return 0;
    const totalSpeed = this.speedThisRace.reduce((accumulator, speed) => accumulator + speed, 0);
    return totalSpeed / this.speedThisRace.length;
  }

  /**
   * Boost control - delegates to performance component
   */
  activateBoost() {
    const performance = this.getComponent('performance');
    if (performance) {
      performance.activateBoost();
    }
  }

  deactivateBoost() {
    const performance = this.getComponent('performance');
    if (performance) {
      performance.deactivateBoost();
    }
  }

  reduceRemainingBoost(reduction) {
    const performance = this.getComponent('performance');
    if (performance) {
      performance.reduceRemainingBoost(reduction);
    }
  }

  reduceRemainingEndurance(reduction) {
    const performance = this.getComponent('performance');
    if (performance) {
      performance.reduceRemainingEndurance(reduction);
    }
  }

  makeExhausted() {
    const performance = this.getComponent('performance');
    if (performance) {
      performance.makeExhausted();
    }
  }

  /**
   * History management - delegates to history component
   */
  updateRacerHistory(raceid, finishingPosition) {
    const history = this.getComponent('history');
    if (history) {
      history.updateRacerHistory(raceid, finishingPosition);
    } else {
      // Fallback: history getter returns a copy, so direct push is a no-op.
      // This path should not be reached when the history component is registered.
      console.warn(`Racer ${this.id}: history component missing, race result not recorded`);
    }
  }

  getAverageFinishingPosition(numberOfRaces) {
    const history = this.getComponent('history');
    if (history) {
      return history.getAverageFinishingPosition(numberOfRaces);
    }

    // Fallback calculation - ensure history exists and is properly formatted
    if (!this.history || !Array.isArray(this.history) || this.history.length === 0) {
      return 0;
    }

    let sum = 0;
    let count = 0;
    const racesToConsider = Math.min(numberOfRaces, this.history.length);

    for (let i = 0; i < racesToConsider; i++) {
      if (Array.isArray(this.history[i]) && this.history[i].length >= 2) {
        sum += this.history[i][1];
        count++;
      }
    }

    return count > 0 ? sum / count : 0;
  }

  getFavoredConditions() {
    const history = this.getComponent('history');
    if (history) {
      return history.getFavoredConditions();
    }

    let favorite = { condition: null, winRate: 0 };

    for (let condition in this.performance) {
      let stats = this.performance[condition];
      let winRate = stats.wins / stats.races;

      if (favorite.condition === null || winRate > favorite.winRate) {
        favorite = { condition, winRate };
      }
    }

    return favorite.condition;
  }

  getFormGuide() {
    const history = this.getComponent('history');
    if (history) {
      return history.getFormGuide();
    }

    let favoredCondition = this.getFavoredConditions();
    let averageSpeed = this.speedHistory.reduce((a, b) => a + b, 0) / this.speedHistory.length;
    return {
      name: this.name,
      totalWins: this.wins,
      averageSpeed: averageSpeed.toFixed(2),
      favoredCondition: favoredCondition
    };
  }

  compareToBaseline(baseline) {
    const history = this.getComponent('history');
    if (history) {
      return history.compareToBaseline(baseline);
    }

    const guide = this.getFormGuide();
    return {
      ...guide,
      aboveAverageWins: guide.totalWins > baseline.averageWins,
      aboveAverageSpeed: guide.averageSpeed > baseline.averageSpeed
    };
  }

  addRaceResult(condition, speed, result) {
    const history = this.getComponent('history');
    if (history) {
      history.addRaceResult(condition, speed, result);
    } else {
      if (!this.performance[condition]) {
        this.performance[condition] = {
          totalSpeed: 0,
          races: 0,
          wins: 0,
          dnfs: 0
        };
      }

      this.performance[condition].totalSpeed += speed;
      this.performance[condition].races += 1;

      if (result === 'win') {
        this.performance[condition].wins += 1;
        this.wins += 1;
      } else if (result === 'dnf') {
        this.performance[condition].dnfs += 1;
      }

      this.performanceHistory.push({ condition, speed, result });
      this.speedHistory.push(speed);
    }
  }

  generateBaseBettingOdds() {
    const betting = this.getComponent('betting');
    if (betting) {
      return betting.generateBaseBettingOdds();
    }

    const numberOfLanes = this.config.trackProperties.numberOfLanes;
    if (this.history.length === 0) {
      return 1 / numberOfLanes;
    }

    const averageFinishingPosition = this.getAverageFinishingPosition(Math.min(5, this.history.length));
    let baseOdds = averageFinishingPosition / numberOfLanes;
    this.baseBettingOdds = 1 + Math.trunc(Math.max(this.config.bettingProperties.minOdds, Math.min(this.config.bettingProperties.maxOdds, baseOdds)) * 1000) / 1000;
    return this.baseBettingOdds;
  }

  generateWinningPayout(betValue) {
    const betting = this.getComponent('betting');
    if (betting) {
      return betting.generateWinningPayout(betValue);
    }

    if (typeof this.baseBettingOdds !== 'number' || isNaN(this.baseBettingOdds) || this.baseBettingOdds <= 0) {
      throw new Error('Invalid base betting odds for racer with ID ' + this.id);
    }

    const winningPayout = betValue * this.baseBettingOdds;
    return Math.trunc(winningPayout * 100) / 100;
  }

  /**
   * Reset racer state
   */
  reset() {
    // Reset component-based properties
    const performance = this.getComponent('performance');
    if (performance) {
      performance.reset();
    }

    const betting = this.getComponent('betting');
    if (betting) {
      betting.reset();
    }

    // Reset legacy properties for backward compatibility
    this.visual.finished = false;
    this.didNotFinish = false;
    this.shadowDistance = 0;

    if (this.ferret) {
      this.ferret.isStumbling = false;
      this.ferret.crashPhase = 0;
      // Reset animation state variables to prevent carry-over bugs
      this.ferret._lastTime = null;
      this.ferret._lastX = null;
      this.ferret.eye.blinkTimer = (this.ferret.eye.blinkTimer / 1000) * 1000; // Reset timer to initial value (in ms)
    }
  }

  /**
   * Update all components
   */
  update(deltaTime, context) {
    racerComponents.updateComponents(this, deltaTime, context);
  }

  /**
   * Serialize racer state
   */
  serialize() {
    const data = {
      id: this.id,
      name: this.name,
      colors: [...this.colors],
      visual: { ...this.visual },
      didNotFinish: this.didNotFinish,
      ferret: this.ferret
    };

    // Serialize components
    const componentData = racerComponents.serializeComponents(this);
    Object.assign(data, componentData);

    return data;
  }
}

// Export the component registry for external use
export { racerComponents };