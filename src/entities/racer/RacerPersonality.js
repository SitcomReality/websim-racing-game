/** 
 * RacerPersonality - Behavioral traits affecting race strategy
 */
export class RacerPersonality {
  constructor(racer, config) {
    this.racer = racer;
    this.config = config;
    this.traits = this.generateTraits();
    this.behaviorModifiers = this.calculateBehaviorModifiers();
  }

  generateTraits() {
    const traits = {};
    const traitTypes = ['aggression', 'consistency', 'adaptability', 'competitiveness', 'stamina'];

    traitTypes.forEach(trait => {
      // Generate trait value between 0-1 with normal distribution
      const baseValue = Math.random();
      const variance = 0.2;
      traits[trait] = Math.max(0, Math.min(1, baseValue + (Math.random() - 0.5) * variance));
    });

    return traits;
  }

  calculateBehaviorModifiers() {
    const modifiers = {
      boostAggression: this.traits.aggression > 0.7 ? 1.2 : 1.0,
      enduranceConservation: this.traits.consistency > 0.6 ? 1.1 : 1.0,
      weatherAdaptation: this.traits.adaptability * 0.3,
      stumbleRecovery: this.traits.resilience > 0.5 ? 0.8 : 1.0,
      competitiveDrive: this.traits.competitiveness > 0.8 ? 1.15 : 1.0
    };

    return modifiers;
  }

  shouldActivateBoost(racePosition, percentComplete, nearbyRacers) {
    const stats = this.racer.getComponent('stats');
    const baseActivationPercent = stats?.getStat('boostActivationPercent') || 70;

    // Aggressive racers activate boost earlier
    const adjustedPercent = baseActivationPercent - (this.traits.aggression * 20);

    if (percentComplete < adjustedPercent) return false;

    // Competitive racers are more likely to boost when behind
    const positionModifier = this.traits.competitiveness * 0.3;
    const behindLikelihood = nearbyRacers.behind * positionModifier;

    return Math.random() < (0.6 + behindLikelihood);
  }

  handleStumble() {
    // Adaptable racers recover faster from stumbles
    const stats = this.racer.getComponent('stats');
    const baseStumbleDuration = stats?.getStat('stumbleDuration') || 120;
    const recoveryMultiplier = this.behaviorModifiers.stumbleRecovery;

    return Math.floor(baseStumbleDuration * recoveryMultiplier);
  }

  calculateEnduranceDrain(baseDrain) {
    // Consistent racers manage endurance better
    return baseDrain * this.behaviorModifiers.enduranceConservation;
  }

  getWeatherPenalty(weatherType) {
    // Adaptable racers handle weather changes better
    const basePenalty = 1.0;
    const adaptationBonus = this.behaviorModifiers.weatherAdaptation;

    return Math.max(0.7, basePenalty - adaptationBonus);
  }

  getCompetitiveIntensity() {
    return this.traits.competitiveness + (this.traits.aggression * 0.5);
  }

  serialize() {
    return {
      traits: { ...this.traits },
      behaviorModifiers: { ...this.behaviorModifiers }
    };
  }

  reset() {
    this.traits = this.generateTraits();
    this.behaviorModifiers = this.calculateBehaviorModifiers();
  }
}