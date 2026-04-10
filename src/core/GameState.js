/**
 * GameState - Centralized game state management
 */
export class GameState {
  constructor() {
    this.state = {
      running: false,
      raceWeekRaceCounter: 0,
      raceWeekCounter: 0,
      settings: this.getDefaultSettings(),
      player: {
        balance: 1000,
      },
      tracks: [],
      racers: [],
      currentRace: this.getDefaultRaceState(),
      raceHistory: [],
      racerPerformance: {
        baseline: {
          averageSpeed: 1,
          averageWins: 0.1,
        },
      },
      raceWeek: null, // Add raceWeek property
      currentRaceIndex: 0, // Add currentRaceIndex property
    };
  }

  getDefaultSettings() {
    return {
      compensationThreshold: 0.5,
      bettingProperties: {
        minOdds: 0.5,
        maxOdds: 15,
        winningCalculationModifier: 1.5,
      },
      trackProperties: {
        minConsecutiveSegmentsOfSameType: 1,
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

  getDefaultRaceState() {
    return {
      id: 0,
      racers: [],
      track: null,
      segments: [],
      sections: [],
      weather: null,
      results: [],
      winner: null,
      liveLocations: {},
      livePositions: [],
    };
  }

  // Getters
  get running() { return this.state.running; }
  get raceWeekRaceCounter() { return this.state.raceWeekRaceCounter; }
  get raceWeekCounter() { return this.state.raceWeekCounter; }
  get settings() { return this.state.settings; }
  get player() { return this.state.player; }
  get tracks() { return this.state.tracks; }
  get racers() { return this.state.racers; }
  get currentRace() { return this.state.currentRace; }
  get raceHistory() { return this.state.raceHistory; }
  get racerPerformance() { return this.state.racerPerformance; }
  get raceWeek() { return this.state.raceWeek; }
  get currentRaceIndex() { return this.state.currentRaceIndex; }

  // Setters
  set running(value) { this.state.running = value; }
  set raceWeekRaceCounter(value) { this.state.raceWeekRaceCounter = value; }
  set raceWeekCounter(value) { this.state.raceWeekCounter = value; }
  set player(value) { this.state.player = value; }
  set tracks(value) { this.state.tracks = value; }
  set racers(value) { this.state.racers = value; }
  set currentRace(value) { this.state.currentRace = value; }
  set raceHistory(value) { this.state.raceHistory = value; }
  set racerPerformance(value) { this.state.racerPerformance = value; }
  set raceWeek(value) { this.state.raceWeek = value; }
  set currentRaceIndex(value) { this.state.currentRaceIndex = value; }

  // Utility methods
  getState(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.state);
  }

  setState(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, this.state);
    target[lastKey] = value;
  }

  reset() {
    this.state = {
      running: false,
      raceWeekRaceCounter: 0,
      raceWeekCounter: 0,
      settings: this.getDefaultSettings(),
      player: {
        balance: 1000,
      },
      tracks: [],
      racers: [],
      currentRace: this.getDefaultRaceState(),
      raceHistory: [],
      racerPerformance: {
        baseline: {
          averageSpeed: 1,
          averageWins: 0.1,
        },
      },
      raceWeek: null,
      currentRaceIndex: 0,
    };
  }

  /**
   * Serialize game state for save/load
   */
  serialize() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Deserialize game state from save data
   */
  deserialize(data) {
    if (data && typeof data === 'object') {
      this.state = { ...this.state, ...data };
    }
  }
}