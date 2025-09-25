/** 
 * GameSettings - Centralized game configuration with validation
 */
export class GameSettings {
  constructor() {
    this.config = this.getDefaultConfig();
    this.validators = this.setupValidators();
  }

  getDefaultConfig() {
    return {
      compensationThreshold: 0.5,

      bettingProperties: {
        minOdds: 0.5,
        maxOdds: 15,
        winningCalculationModifier: 1.5,
      },

      trackProperties: {
        numberOfSegments: 21,
        minConsecutiveSegmentsOfSameType: 1,
        sequentialSegments: 3,
        numberOfLanes: 10,
        segmentsPerSection: 3,
        minSectionsPerTrack: 3,
        maxSectionsPerTrack: 7,
        totalPoolSize: 30,
      },

      weekProperties: {
        numberOfRaces: 5,
        uniqueTracksMin: 3,
        uniqueTracksMax: 3,
        uniqueRacersMin: 20,
        uniqueRacersMax: 35,
      },

      racerProperties: {
        numberOfColorsToChooseFrom: 31,
        numberOfColorsPerRacer: 3,
        speedBase: 10,
        speedMultiplier: 0.005,
        enduranceInitialValueMultiplier: 1,
        enduranceDrainMultiplier: 1,
        enduranceBase: 2000,
        enduranceVariance: 200,
        exhaustionMultiplierBase: 0.75,
        exhaustionMultiplierVariance: 0.1,
        formVariationBase: 0.05,
        formVariationVariance: 0.02,
        boostPowerBase: 800,
        boostPowerVariance: 100,
        boostDurationBase: 600,
        boostDurationVariance: 100,
        boostActivationPercentBase: 70,
        boostActivationPercentVariance: 4,
        stumbleChanceBase: 0.002,
        stumbleChanceVariance: 0.0006,
        stumbleDurationBase: 120,
        stumbleDurationVariance: 40,
        percentOfLowVarianceForStatBoost: 0.75,
        compensationStatBoostMin: 0.05,
        compensationStatBoostMax: 0.15,
        compensationStatBoostTwoStatsChance: 0.2,
        totalPoolSize: 36,
      },

      render: {
        debug: false,
        textures: {
          enabled: true,
          quality: 'medium',
          patterns: {
            asphalt: 'procedural',
            grass: 'procedural',
            dirt: 'procedural',
            gravel: 'procedural',
            mud: 'procedural',
            rock: 'procedural',
            marble: 'procedural'
          }
        },
        particles: {
          enabled: true,
          maxParticles: 100,
          emitters: 3
        },
        camera: {
          smoothing: 0.15,
          zoomMin: 0.5,
          zoomMax: 3.0,
          fitAllMargin: 15,
        }
      },

      worldProperties: {
        groundTypes: ["asphalt","gravel","dirt","grass","mud","rock","marble"],
        weatherTypes: ["sunny","rainy","windy","cloudy","dusty","stormy","snowy","foggy"],
        thirdTypes: ["one","two","three"],
      },

      weatherProperties: {
        sunnyBase: 9, sunnyVariance: 0.3,
        rainyBase: 5, rainyVariance: 2.5,
        windyBase: 5, windyVariance: 1.2,
        foggyBase: 7, foggyVariance: 1.6,
        cloudyBase: 6, cloudyVariance: 1.1,
        dustyBase: 5, dustyVariance: 1,
        stormyBase: 4, stormyVariance: 2,
        snowyBase: 3, snowyVariance: 1.2,
      },

      groundProperties: {
        dirtBase: 6, dirtVariance: 1,
        grassBase: 5, grassVariance: 1.2,
        gravelBase: 8, gravelVariance: 3,
        asphaltBase: 10, asphaltVariance: 1.5,
        mudBase: 4, mudVariance: 0.8,
        rockBase: 8, rockVariance: 1,
        marbleBase: 5, marbleVariance: 1,
      },

      thirdProperties: {
        oneBase: 6, oneVariance: 0.2,
        twoBase: 5, twoVariance: 0.3,
        threeBase: 6, threeVariance: 0.6,
      },
    };
  }

  setupValidators() {
    return {
      compensationThreshold: (value) => value >= 0 && value <= 1,

      bettingProperties: {
        minOdds: (value) => value > 0 && value <= 10,
        maxOdds: (value) => value >= 1 && value <= 100,
        winningCalculationModifier: (value) => value > 0 && value <= 5,
      },

      trackProperties: {
        numberOfLanes: (value) => value >= 2 && value <= 20,
        totalPoolSize: (value) => value >= 10 && value <= 1000,
      },

      racerProperties: {
        totalPoolSize: (value) => value >= 10 && value <= 1000,
      },

      render: {
        camera: {
          zoomMin: (value) => value >= 0.1 && value <= 2,
          zoomMax: (value) => value >= 1 && value <= 10,
        }
      }
    };
  }

  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.config);
  }

  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, this.config);

    if (this.validateSetting(path, value)) {
      target[lastKey] = value;
      return true;
    }
    return false;
  }

  validateSetting(path, value) {
    const validator = path.split('.').reduce((obj, key) => obj?.[key], this.validators);
    if (typeof validator === 'function') {
      return validator(value);
    }
    return true; // No validator means it's valid
  }

  mergeSettings(newSettings) {
    this.deepMerge(this.config, newSettings);
    this.validateAll();
  }

  deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  validateAll() {
    for (const path in this.validators) {
      const value = this.get(path);
      if (value !== undefined && !this.validateSetting(path, value)) {
        console.warn(`Invalid setting: ${path} = ${value}`);
        // Reset to default value
        const defaultValue = path.split('.').reduce((obj, key) => obj?.[key], this.getDefaultConfig());
        this.set(path, defaultValue);
      }
    }
  }

  getRacerGenerationParameters() {
    return {
      speedBase: this.get('racerProperties.speedBase'),
      speedMultiplier: this.get('racerProperties.speedMultiplier'),
      enduranceBase: this.get('racerProperties.enduranceBase'),
      enduranceVariance: this.get('racerProperties.enduranceVariance'),
      formVariationBase: this.get('racerProperties.formVariationBase'),
      formVariationVariance: this.get('racerProperties.formVariationVariance'),
      compensationThreshold: this.get('compensationThreshold'),
      compensationStatBoostMin: this.get('racerProperties.compensationStatBoostMin'),
      compensationStatBoostMax: this.get('racerProperties.compensationStatBoostMax'),
      compensationStatBoostTwoStatsChance: this.get('racerProperties.compensationStatBoostTwoStatsChance'),
      totalPoolSize: this.get('racerProperties.totalPoolSize')
    };
  }

  getTrackGenerationParameters() {
    return {
      minSectionsPerTrack: this.get('trackProperties.minSectionsPerTrack'),
      maxSectionsPerTrack: this.get('trackProperties.maxSectionsPerTrack'),
      segmentsPerSection: this.get('trackProperties.segmentsPerSection'),
      totalPoolSize: this.get('trackProperties.totalPoolSize')
    };
  }

  getWeatherGenerationParameters() {
    return {
      weatherTypes: this.get('worldProperties.weatherTypes'),
      weatherProperties: this.get('weatherProperties')
    };
  }

  getGroundGenerationParameters() {
    return {
      groundTypes: this.get('worldProperties.groundTypes'),
      groundProperties: this.get('groundProperties')
    };
  }

  getRenderParameters() {
    return {
      debug: this.get('render.debug'),
      textures: this.get('render.textures'),
      particles: this.get('render.particles'),
      camera: this.get('render.camera')
    };
  }

  reset() {
    this.config = this.getDefaultConfig();
  }

  export() {
    return JSON.parse(JSON.stringify(this.config));
  }

  import(configData) {
    if (this.validateConfig(configData)) {
      this.config = configData;
      return true;
    }
    return false;
  }

  validateConfig(config) {
    try {
      // Basic structure validation
      const requiredSections = ['racerProperties', 'trackProperties', 'worldProperties'];
      for (const section of requiredSections) {
        if (!config[section]) {
          console.error(`Missing required config section: ${section}`);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Config validation failed:', error);
      return false;
    }
  }
}

// Create singleton instance
export const gameSettings = new GameSettings();