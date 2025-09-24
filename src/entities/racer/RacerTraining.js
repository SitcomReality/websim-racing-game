/** 
 * RacerTraining - Long-term stat improvements between races
 */
export class RacerTraining {
  constructor(racer, config) {
    this.racer = racer;
    this.config = config;
    this.trainingPoints = 0;
    this.trainingHistory = [];
    this.statImprovements = {
      endurance: 0,
      boostPower: 0,
      boostDuration: 0,
      stumbleRecovery: 0,
      consistency: 0
    };
    this.trainingFocus = 'balanced';
    this.trainingEfficiency = 1.0;
  }

  addTrainingPoints(points) {
    this.trainingPoints += points;
    this.trainingEfficiency *= 0.98; // Diminishing returns
  }

  setTrainingFocus(focus) {
    this.trainingFocus = focus;
    this.applyTrainingFocus();
  }

  applyTrainingFocus() {
    switch (this.trainingFocus) {
      case 'speed':
        this.trainingEfficiency = 1.2;
        break;
      case 'endurance':
        this.trainingEfficiency = 1.3;
        break;
      case 'consistency':
        this.trainingEfficiency = 1.4;
        break;
      case 'recovery':
        this.trainingEfficiency = 1.1;
        break;
      default:
        this.trainingEfficiency = 1.0;
    }
  }

  applyTraining() {
    if (this.trainingPoints <= 0) return;

    const cost = this.calculateTrainingCost();
    const effectivePoints = this.trainingPoints * this.trainingEfficiency;

    switch (this.trainingFocus) {
      case 'speed':
        this.improveStat('boostPower', effectivePoints * 0.4);
        this.improveStat('boostDuration', effectivePoints * 0.3);
        break;
      case 'endurance':
        this.improveStat('endurance', effectivePoints * 0.6);
        this.improveStat('stumbleRecovery', effectivePoints * 0.2);
        break;
      case 'consistency':
        this.improveStat('consistency', effectivePoints * 0.5);
        this.improveStat('stumbleRecovery', effectivePoints * 0.3);
        break;
      case 'recovery':
        this.improveStat('stumbleRecovery', effectivePoints * 0.5);
        this.improveStat('endurance', effectivePoints * 0.3);
        break;
      default:
        // Balanced improvement
        this.improveStat('endurance', effectivePoints * 0.2);
        this.improveStat('boostPower', effectivePoints * 0.15);
        this.improveStat('boostDuration', effectivePoints * 0.15);
        this.improveStat('stumbleRecovery', effectivePoints * 0.2);
        this.improveStat('consistency', effectivePoints * 0.1);
    }

    this.trainingPoints = Math.max(0, this.trainingPoints - cost);
    this.trainingEfficiency *= 0.95;
  }

  improveStat(statName, points) {
    const improvement = points * 0.01; // Convert points to percentage improvement
    const maxImprovement = 0.3; // Maximum 30% improvement

    this.statImprovements[statName] = Math.min(
      maxImprovement,
      this.statImprovements[statName] + improvement
    );

    // Record training history
    this.trainingHistory.push({
      stat: statName,
      improvement: improvement,
      timestamp: Date.now()
    });
  }

  getTrainingBonus(statName) {
    return 1 + this.statImprovements[statName];
  }

  calculateTrainingCost() {
    // Cost increases with training level
    const totalImprovements = Object.values(this.statImprovements).reduce((a, b) => a + b, 0);
    return Math.max(1, 10 * (1 + totalImprovements * 5));
  }

  getTrainingStatus() {
    return {
      trainingPoints: this.trainingPoints,
      trainingFocus: this.trainingFocus,
      trainingEfficiency: this.trainingEfficiency,
      statImprovements: { ...this.statImprovements },
      recentTraining: this.trainingHistory.slice(-5)
    };
  }

  canTrain() {
    return this.trainingPoints >= this.calculateTrainingCost();
  }

  getTrainingRecommendations() {
    const stats = this.racer.getComponent('stats');
    if (!stats) return 'balanced';

    const currentStats = {
      endurance: stats.getStat('endurance'),
      boostPower: stats.getStat('boostPower'),
      boostDuration: stats.getStat('boostDuration')
    };

    // Recommend focus based on weaknesses
    if (currentStats.endurance < 1000) return 'endurance';
    if (currentStats.boostPower < 600) return 'speed';
    if (currentStats.boostDuration < 400) return 'speed';

    return 'balanced';
  }

  serialize() {
    return {
      trainingPoints: this.trainingPoints,
      trainingHistory: [...this.trainingHistory],
      statImprovements: { ...this.statImprovements },
      trainingFocus: this.trainingFocus,
      trainingEfficiency: this.trainingEfficiency
    };
  }

  reset() {
    this.trainingPoints = 0;
    this.trainingHistory = [];
    this.statImprovements = {
      endurance: 0,
      boostPower: 0,
      boostDuration: 0,
      stumbleRecovery: 0,
      consistency: 0
    };
    this.trainingFocus = 'balanced';
    this.trainingEfficiency = 1.0;
  }
}