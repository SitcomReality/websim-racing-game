/**
 * RacerProperties - Racer generation and configuration parameters
 */
export class RacerProperties {
  constructor() {
    this.baseStats = {
      endurance: { base: 2000, variance: 200, min: 1000, max: 5000 },
      speed: { base: 10, variance: 2, min: 5, max: 20 },
      boostPower: { base: 800, variance: 100, min: 500, max: 1200 },
      boostDuration: { base: 600, variance: 100, min: 300, max: 1000 },
      boostActivationPercent: { base: 70, variance: 4, min: 60, max: 85 },
      stumbleChance: { base: 0.002, variance: 0.0006, min: 0.001, max: 0.01 },
      stumbleDuration: { base: 120, variance: 40, min: 60, max: 240 },
      exhaustionMultiplier: { base: 0.75, variance: 0.1, min: 0.5, max: 0.9 },
      formVariation: { base: 0.05, variance: 0.02, min: 0.01, max: 0.1 }
    };

    this.weatherStats = {
      sunny: { base: 9, variance: 0.3, min: 8, max: 10 },
      rainy: { base: 5, variance: 2.5, min: 2, max: 8 },
      windy: { base: 5, variance: 1.2, min: 3, max: 7 },
      cloudy: { base: 6, variance: 1.1, min: 4, max: 8 },
      foggy: { base: 7, variance: 1.6, min: 5, max: 9 },
      dusty: { base: 5, variance: 1, min: 3, max: 7 },
      stormy: { base: 4, variance: 2, min: 1, max: 7 },
      snowy: { base: 3, variance: 1.2, min: 1, max: 5 }
    };

    this.groundStats = {
      asphalt: { base: 10, variance: 1.5, min: 8, max: 12 },
      grass: { base: 5, variance: 1.2, min: 3, max: 7 },
      dirt: { base: 6, variance: 1, min: 4, max: 8 },
      gravel: { base: 8, variance: 3, min: 4, max: 12 },
      mud: { base: 4, variance: 0.8, min: 3, max: 6 },
      rock: { base: 8, variance: 1, min: 6, max: 10 },
      marble: { base: 5, variance: 1, min: 3, max: 7 }
    };

    this.thirdStats = {
      one: { base: 6, variance: 0.2, min: 5.5, max: 6.5 },
      two: { base: 5, variance: 0.3, min: 4.5, max: 5.5 },
      three: { base: 6, variance: 0.6, min: 5, max: 7 }
    };

    // New: Particle body chain configuration defaults
    this.bodyChain = {
      nodeCount: { base: 4, variance: 1, min: 3, max: 5 },
      restDistance: { base: 8, variance: 2, min: 6, max: 12 },
      stiffness: { base: 0.8, variance: 0.1, min: 0.6, max: 0.95 },
      iterations: { base: 3, variance: 1, min: 2, max: 5 },
      damping: { base: 0.99, variance: 0.01, min: 0.95, max: 0.995 },
      thicknessStart: { base: 12, variance: 3, min: 8, max: 18 },
      thicknessEnd: { base: 6, variance: 2, min: 4, max: 10 },
      enabled: false // Feature flag - will be enabled in later phases
    };

    // New: Enhanced gait configuration for two-leg model
    this.gait = {
      strideAmplitude: { base: 1.0, variance: 0.2, min: 0.7, max: 1.4 },
      contactDutyCycle: { base: 0.6, variance: 0.1, min: 0.4, max: 0.8 },
      bounceHeight: { base: 3, variance: 1, min: 1, max: 6 }
    };

    // New: Tail configuration for chain integration
    this.tail = {
      followFactor: { base: 0.3, variance: 0.1, min: 0.1, max: 0.6 }
    };
  }

  generateRacerStats() {
    const stats = {};

    // Generate base stats
    for (const [statName, config] of Object.entries(this.baseStats)) {
      stats[statName] = this.generateStat(config);
    }

    // Generate weather stats
    stats.weather = {};
    for (const [weatherType, config] of Object.entries(this.weatherStats)) {
      stats.weather[weatherType] = this.generateStat(config);
    }

    // Generate ground stats
    stats.ground = {};
    for (const [groundType, config] of Object.entries(this.groundStats)) {
      stats.ground[groundType] = this.generateStat(config);
    }

    // Generate third stats
    stats.third = {};
    for (const [thirdType, config] of Object.entries(this.thirdStats)) {
      stats.third[thirdType] = this.generateStat(config);
    }

    return stats;
  }

  generateStat(config) {
    const { base, variance, min, max } = config;
    const value = base + (Math.random() - 0.5) * variance * 2;
    return Math.max(min, Math.min(max, value));
  }

  compensateStats(stats, threshold = 0.5) {
    // Apply compensation system for low stats
    const compensationProbability = 0.2; // 20% chance for two stats

    for (const category of ['weather', 'ground', 'third']) {
      for (const [type, value] of Object.entries(stats[category])) {
        const config = this[`${category}Stats`][type];
        const thresholdValue = config.base - (config.variance * threshold);

        if (value <= thresholdValue) {
          const compensationCount = Math.random() < compensationProbability ? 2 : 1;
          const compensationStats = this.getRandomCompensationStats(stats, compensationCount);

          compensationStats.forEach(compensatedStat => {
            if (stats[compensatedStat] !== undefined) {
              const boostPercentage = this.getRandomValue(0.05, 0.15);
              stats[compensatedStat] *= (1 + boostPercentage);
            }
          });
        }
      }
    }
  }

  getRandomCompensationStats(stats, count) {
    const availableStats = Object.keys(this.baseStats);
    const selected = [];

    while (selected.length < count && availableStats.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableStats.length);
      const statName = availableStats.splice(randomIndex, 1)[0];
      selected.push(statName);
    }

    return selected;
  }

  getRandomValue(min, max) {
    return min + Math.random() * (max - min);
  }

  getStatRange(statName) {
    const config = this.baseStats[statName];
    if (!config) return null;

    return {
      min: config.min,
      max: config.max,
      base: config.base,
      variance: config.variance
    };
  }

  getWeatherRange(weatherType) {
    const config = this.weatherStats[weatherType];
    if (!config) return null;

    return {
      min: config.min,
      max: config.max,
      base: config.base,
      variance: config.variance
    };
  }

  getGroundRange(groundType) {
    const config = this.groundStats[groundType];
    if (!config) return null;

    return {
      min: config.min,
      max: config.max,
      base: config.base,
      variance: config.variance
    };
  }

  getThirdRange(thirdType) {
    const config = this.thirdStats[thirdType];
    if (!config) return null;

    return {
      min: config.min,
      max: config.max,
      base: config.base,
      variance: config.variance
    };
  }

  validateStats(stats) {
    const errors = [];

    // Validate base stats
    for (const [statName, config] of Object.entries(this.baseStats)) {
      const value = stats[statName];
      if (value < config.min || value > config.max) {
        errors.push(`${statName}: ${value} is outside range [${config.min}, ${config.max}]`);
      }
    }

    // Validate weather stats
    for (const [weatherType, config] of Object.entries(this.weatherStats)) {
      const value = stats.weather[weatherType];
      if (value < config.min || value > config.max) {
        errors.push(`weather.${weatherType}: ${value} is outside range [${config.min}, ${config.max}]`);
      }
    }

    // Validate ground stats
    for (const [groundType, config] of Object.entries(this.groundStats)) {
      const value = stats.ground[groundType];
      if (value < config.min || value > config.max) {
        errors.push(`ground.${groundType}: ${value} is outside range [${config.min}, ${config.max}]`);
      }
    }

    // Validate third stats
    for (const [thirdType, config] of Object.entries(this.thirdStats)) {
      const value = stats.third[thirdType];
      if (value < config.min || value > config.max) {
        errors.push(`third.${thirdType}: ${value} is outside range [${config.min}, ${config.max}]`);
      }
    }

    return errors;
  }
}

export const racerProperties = new RacerProperties();