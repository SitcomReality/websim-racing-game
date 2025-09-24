/** 
 * RacerInjuries - Temporary stat modifications from race incidents
 */
export class RacerInjuries {
  constructor(racer, config) {
    this.racer = racer;
    this.config = config;
    this.injuries = [];
    this.injuryTypes = this.defineInjuryTypes();
  }

  defineInjuryTypes() {
    return {
      minorStrain: {
        name: 'Minor Strain',
        enduranceMultiplier: 0.95,
        speedMultiplier: 0.98,
        duration: 300, // seconds
        recoveryRate: 0.1
      },
      stumbleImpact: {
        name: 'Stumble Impact',
        stumbleChanceMultiplier: 1.5,
        speedMultiplier: 0.92,
        duration: 180,
        recoveryRate: 0.15
      },
      boostFatigue: {
        name: 'Boost Fatigue',
        boostPowerMultiplier: 0.85,
        enduranceMultiplier: 0.9,
        duration: 240,
        recoveryRate: 0.12
      },
      weatherExposure: {
        name: 'Weather Exposure',
        weatherPenaltyMultiplier: 1.3,
        enduranceMultiplier: 0.88,
        duration: 360,
        recoveryRate: 0.08
      },
      psychological: {
        name: 'Psychological Impact',
        consistencyMultiplier: 0.8,
        competitiveDriveMultiplier: 0.7,
        duration: 420,
        recoveryRate: 0.06
      }
    };
  }

  addInjury(type, severity = 1.0) {
    if (!this.injuryTypes[type]) return;

    const injuryTemplate = this.injuryTypes[type];
    const injury = {
      type: type,
      name: injuryTemplate.name,
      severity: severity,
      duration: injuryTemplate.duration * severity,
      maxDuration: injuryTemplate.duration * severity,
      recoveryRate: injuryTemplate.recoveryRate,
      startTime: Date.now()
    };

    // Check for existing injury of same type and stack severity
    const existingInjury = this.injuries.find(i => i.type === type);
    if (existingInjury) {
      existingInjury.severity = Math.min(2.0, existingInjury.severity + severity * 0.7);
      existingInjury.duration = existingInjury.maxDuration * existingInjury.severity;
    } else {
      this.injuries.push(injury);
    }
  }

  updateInjuries(deltaTime) {
    for (let i = this.injuries.length - 1; i >= 0; i--) {
      const injury = this.injuries[i];
      injury.duration -= deltaTime;
      
      // Natural recovery
      if (Math.random() < injury.recoveryRate * deltaTime / 60) {
        injury.severity *= 0.95;
      }

      // Remove healed injuries
      if (injury.duration <= 0 || injury.severity <= 0.1) {
        this.injuries.splice(i, 1);
      }
    }
  }

  getStatMultiplier(statName) {
    let multiplier = 1.0;
    
    this.injuries.forEach(injury => {
      const injuryType = this.injuryTypes[injury.type];
      if (injuryType && injuryType[statName + 'Multiplier']) {
        const effect = injuryType[statName + 'Multiplier'];
        // Calculate diminishing effect based on severity
        const severityEffect = 1 - (1 - injury.severity) * 0.3;
        multiplier *= (1 + (effect - 1) * severityEffect);
      }
    });

    return Math.max(0.3, Math.min(2.0, multiplier));
  }

  getTotalInjurySeverity() {
    return this.injuries.reduce((total, injury) => total + injury.severity, 0);
  }

  hasInjury(type) {
    return this.injuries.some(injury => injury.type === type);
  }

  getActiveInjuries() {
    return this.injuries.map(injury => ({
      name: injury.name,
      severity: injury.severity,
      timeRemaining: Math.ceil(injury.duration / 60) // minutes
    }));
  }

  // Trigger methods for specific events
  onStumble() {
    this.addInjury('stumbleImpact', 1.0);
  }

  onBoostOveruse() {
    this.addInjury('boostFatigue', 1.2);
  }

  onWeatherExposure(weatherType, duration) {
    const severity = duration > 300 ? 1.5 : 1.0;
    this.addInjury('weatherExposure', severity);
  }

  onPsychologicalImpact() {
    this.addInjury('psychological', 0.8);
  }

  serialize() {
    return {
      injuries: this.injuries.map(injury => ({
        type: injury.type,
        severity: injury.severity,
        duration: injury.duration,
        maxDuration: injury.maxDuration
      }))
    };
  }

  reset() {
    this.injuries = [];
  }
}