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

  /**
   * Start a new race week
   */
  startNewRaceWeek() {
    this.gameState.raceWeekCounter++;
    this.weekInSeason++;
    this.totalWeeksCompleted++;

    // Create new race week
    const raceWeek = this.createRaceWeek();
    this.gameState.raceWeek = raceWeek;
    this.gameState.currentRaceIndex = 0;

    // Update season if needed
    if (this.weekInSeason > this.gameState.settings.weekProperties.numberOfRaces) {
      this.startNewSeason();
    }

    this.eventBus.emit('progression:weekStarted', {
      weekNumber: this.gameState.raceWeekCounter,
      season: this.currentSeason,
      weekInSeason: this.weekInSeason
    });

    return raceWeek;
  }

  /**
   * Create a new race week
   */
  createRaceWeek() {
    const settings = this.gameState.settings;

    // Select racers for the week
    const numRacers = this.getRandomInt(
      settings.weekProperties.uniqueRacersMin,
      settings.weekProperties.uniqueRacersMax
    );

    const selectedRacers = this.selectRacersForWeek(numRacers);

    // Set racer form for the week
    selectedRacers.forEach(racerId => {
      const racer = this.gameState.racers[racerId];
      if (racer) {
        racer.formThisWeek = this.calculateRacerForm(racer);
      }
    });

    // Select tracks for the week
    const numTracks = this.getRandomInt(
      settings.weekProperties.uniqueTracksMin,
      settings.weekProperties.uniqueTracksMax
    );

    const selectedTracks = this.selectTracksForWeek(numTracks);

    // Create races
    const races = [];
    for (let i = 0; i < settings.weekProperties.numberOfRaces; i++) {
      const track = selectedTracks[i % selectedTracks.length];
      const raceRacers = this.selectRaceRacers(selectedRacers);
      const weather = this.selectWeather();

      const race = new Race(`${this.gameState.raceWeekCounter}-${i + 1}`, raceRacers, track);
      race.weather = weather;
      races.push(race);
    }

    return {
      id: this.gameState.raceWeekCounter,
      races: races,
      selectedRacers: selectedRacers,
      season: this.currentSeason,
      weekInSeason: this.weekInSeason
    };
  }

  /**
   * Select racers for the week
   */
  selectRacersForWeek(count) {
    const allRacers = Array.from({ length: this.gameState.settings.racerProperties.totalPoolSize }, (_, i) => i);

    // Use performance-based selection with some randomization
    const racerPerformances = allRacers.map(racerId => {
      const racer = this.gameState.racers[racerId];
      const avgPosition = racer ? racer.getAverageFinishingPosition(5) : 999;
      return { id: racerId, performance: avgPosition };
    });

    // Sort by performance (lower is better)
    racerPerformances.sort((a, b) => a.performance - b.performance);

    // Select top performers with some randomization
    const selected = [];
    const selectionPool = Math.min(count * 2, racerPerformances.length);

    for (let i = 0; i < count; i++) {
      const poolIndex = Math.min(i, selectionPool - 1);
      const startIndex = Math.max(0, poolIndex - Math.floor(count / 2));
      const endIndex = Math.min(selectionPool, startIndex + count);

      const availableRacers = racerPerformances.slice(startIndex, endIndex);
      const randomIndex = Math.floor(Math.random() * availableRacers.length);
      const selectedRacer = availableRacers[randomIndex];

      if (selectedRacer && !selected.includes(selectedRacer.id)) {
        selected.push(selectedRacer.id);
      }
    }

    return selected;
  }

  /**
   * Select racers for a single race
   */
  selectRaceRacers(availableRacers) {
    const laneCount = this.gameState.settings.trackProperties.numberOfLanes;
    const selectedCount = Math.min(laneCount, availableRacers.length);

    // Shuffle and select
    const shuffled = [...availableRacers].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, selectedCount).map(racerId => this.gameState.racers[racerId]);
  }

  /**
   * Select tracks for the week
   */
  selectTracksForWeek(count) {
    const allTracks = this.gameState.tracks;
    const selected = [];

    // Ensure variety by selecting different track types
    const trackTypes = {};
    allTracks.forEach(track => {
      track.sections.forEach(section => {
        if (!trackTypes[section]) trackTypes[section] = [];
        trackTypes[section].push(track);
      });
    });

    // Select tracks with good variety
    const selectedTracks = [];
    const trackTypeKeys = Object.keys(trackTypes);

    for (let i = 0; i < count; i++) {
      const typeIndex = i % trackTypeKeys.length;
      const typeTracks = trackTypes[trackTypeKeys[typeIndex]];

      if (typeTracks && typeTracks.length > 0) {
        const randomTrack = typeTracks[Math.floor(Math.random() * typeTracks.length)];
        if (!selectedTracks.includes(randomTrack)) {
          selectedTracks.push(randomTrack);
        }
      }
    }

    // If we don't have enough tracks, fill with random ones
    while (selectedTracks.length < count && allTracks.length > 0) {
      const randomTrack = allTracks[Math.floor(Math.random() * allTracks.length)];
      if (!selectedTracks.includes(randomTrack)) {
        selectedTracks.push(randomTrack);
      }
    }

    return selectedTracks;
  }

  /**
   * Select weather for a race
   */
  selectWeather() {
    const weatherTypes = this.gameState.settings.worldProperties.weatherTypes;
    const weights = {
      sunny: 0.3,
      cloudy: 0.25,
      windy: 0.15,
      rainy: 0.1,
      foggy: 0.08,
      dusty: 0.05,
      stormy: 0.04,
      snowy: 0.03
    };

    const random = Math.random();
    let cumulative = 0;

    for (const weather of weatherTypes) {
      cumulative += weights[weather] || 0.1;
      if (random <= cumulative) {
        return weather;
      }
    }

    return weatherTypes[0]; // Fallback
  }

  /**
   * Calculate racer form
   */
  calculateRacerForm(racer) {
    const baseForm = 1.0;
    const variation = this.gameState.settings.racerProperties.formVariationBase;
    const formVariation = (Math.random() - 0.5) * variation * 2;

    return Math.max(0.8, Math.min(1.2, baseForm + formVariation));
  }

  /**
   * Start a new season
   */
  startNewSeason() {
    this.currentSeason++;
    this.weekInSeason = 1;

    // Reset some progression elements
    this.achievements.clear();

    // Improve racers over time
    this.improveRacersForNewSeason();

    this.eventBus.emit('progression:seasonStarted', {
      season: this.currentSeason
    });
  }

  /**
   * Improve racers for new season
   */
  improveRacersForNewSeason() {
    // Slightly improve all racers to keep the game challenging
    this.gameState.racers.forEach(racer => {
      if (racer && racer.stats) {
        // Small improvements to base stats
        const stats = ['endurance', 'boostPower', 'boostDuration'];
        stats.forEach(stat => {
          if (racer.stats[stat]) {
            racer.stats[stat] *= 1.05; // 5% improvement
          }
        });
      }
    });
  }

  /**
   * Get progression statistics
   */
  getProgressionStats() {
    return {
      currentSeason: this.currentSeason,
      weekInSeason: this.weekInSeason,
      totalWeeksCompleted: this.totalWeeksCompleted,
      racesCompleted: this.gameState.raceHistory.length,
      achievements: Array.from(this.achievements)
    };
  }

  /**
   * Check and award achievements
   */
  checkAchievements(eventType, data) {
    switch (eventType) {
      case 'race:finish':
        if (data.results && data.results.length > 0) {
          const winnerId = data.results[0];
          const winner = this.gameState.racers[winnerId];
          if (winner && winner.wins >= 5) {
            this.achievements.add('champion');
          }
        }
        break;

      case 'bet:won':
        if (data.payout >= 1000) {
          this.achievements.add('highRoller');
        }
        break;
    }
  }

  /**
   * Helper function to get random integer
   */
  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}