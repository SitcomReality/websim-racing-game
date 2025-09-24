/**
 * RaceManager - Core race management logic
 */
export class RaceManager {
  constructor(eventBus, gameState) {
    this.eventBus = eventBus;
    this.gameState = gameState;
    this.currentRace = null;
    this.raceTimer = null;
    this.raceEndCountdown = null;
    this.animationFrameId = null;
  }

  /**
   * Start a new race week
   */
  startRaceWeek() {
    this.gameState.raceWeekCounter++;
    this.createNewRaceWeek();

    this.eventBus.emit('race:weekStarted', {
      weekNumber: this.gameState.raceWeekCounter
    });
  }

  /**
   * Setup the next race
   */
  setupRace() {
    if (!this.gameState.raceWeek) {
      this.startRaceWeek();
    }

    const raceIndex = this.gameState.currentRaceIndex || 0;
    if (raceIndex >= this.gameState.raceWeek.races.length) {
      this.endRaceWeek();
      return;
    }

    const raceData = this.gameState.raceWeek.races[raceIndex];
    this.prepareRace(raceData);

    this.eventBus.emit('race:setup', {
      raceIndex: raceIndex,
      race: raceData
    });
  }

  /**
   * Start the current race
   */
  startRace() {
    if (!this.currentRace) {
      this.setupRace();
    }

    this.gameState.running = true;
    this.startRaceTimer();

    this.eventBus.emit('race:start', {
      race: this.currentRace
    });
  }

  /**
   * Prepare race data and initialize racers
   */
  prepareRace(raceData) {
    this.currentRace = {
      id: raceData.id,
      racers: raceData.racers.map(racer => racer.id),
      track: raceData.track,
      weather: raceData.weather,
      segments: this.createTrackSegments(raceData.track),
      results: [],
      liveLocations: {},
      livePositions: [],
      startTime: Date.now()
    };

    // Initialize racer positions
    this.currentRace.racers.forEach(racerId => {
      this.currentRace.liveLocations[racerId] = 0;
      const racer = this.gameState.racers[racerId];
      if (racer) {
        racer.reset();
        racer.formThisWeek = this.calculateRacerForm(racer);
      }
    });

    this.gameState.currentRace = this.currentRace;
  }

  /**
   * Create track segments from track sections
   */
  createTrackSegments(track) {
    const segments = [];
    track.sections.forEach(section => {
      for (let i = 0; i < this.gameState.settings.trackProperties.segmentsPerSection; i++) {
        segments.push(section);
      }
    });
    segments.push('finishLine');
    return segments;
  }

  /**
   * Calculate racer form for this week
   */
  calculateRacerForm(racer) {
    const baseForm = 1.0;
    const variation = this.gameState.settings.racerProperties.formVariationBase;
    const formVariation = (Math.random() - 0.5) * variation * 2;

    return Math.max(0.8, Math.min(1.2, baseForm + formVariation));
  }

  /**
   * Start race timer
   */
  startRaceTimer() {
    this.raceTimer = setInterval(() => {
      this.updateRace();
    }, 16); // ~60fps
  }

  /**
   * Update race state
   */
  updateRace() {
    if (!this.gameState.running || !this.currentRace) return;

    const currentTime = Date.now();
    const raceDuration = currentTime - this.currentRace.startTime;

    // Check for race end conditions
    if (this.shouldEndRace()) {
      this.endRace();
      return;
    }

    // Update racer positions
    this.updateRacerPositions();

    // Check for finishers
    this.checkForFinishers();

    // Emit race update
    this.eventBus.emit('race:update', {
      race: this.currentRace,
      duration: raceDuration
    });
  }

  /**
   * Update all racer positions
   */
  updateRacerPositions() {
    this.currentRace.racers.forEach(racerId => {
      const racer = this.gameState.racers[racerId];
      if (!racer || racer.visual.finished) return;

      const currentPosition = this.currentRace.liveLocations[racerId] || 0;
      const segmentIndex = Math.floor((currentPosition / 100) * this.currentRace.segments.length);

      if (segmentIndex >= this.currentRace.segments.length - 1) {
        // Racer has finished
        this.finishRacer(racerId);
        return;
      }

      const segmentType = this.currentRace.segments[segmentIndex];
      const speed = racer.calculateSpeed(
        racer.formThisWeek,
        (currentPosition / 100) * 100,
        segmentType,
        this.currentRace.weather
      );

      // Update position
      const distanceToTravel = speed / (100 * this.currentRace.segments.length);
      this.currentRace.liveLocations[racerId] = Math.min(100, currentPosition + distanceToTravel);
    });
  }

  /**
   * Check if race should end
   */
  shouldEndRace() {
    // Check if all racers have finished
    if (this.currentRace.results.length >= this.currentRace.racers.length) {
      return true;
    }

    // Check race end countdown
    if (this.raceEndCountdown && this.raceEndCountdown.active) {
      const timeLeft = this.raceEndCountdown.endTime - Date.now();
      return timeLeft <= 0;
    }

    return false;
  }

  /**
   * Check for racers that have crossed the finish line
   */
  checkForFinishers() {
    this.currentRace.racers.forEach(racerId => {
      const position = this.currentRace.liveLocations[racerId] || 0;
      if (position >= 100 && !this.currentRace.results.includes(racerId)) {
        this.finishRacer(racerId);
      }
    });
  }

  /**
   * Mark a racer as finished
   */
  finishRacer(racerId) {
    const finishingPosition = this.currentRace.results.length + 1;
    this.currentRace.results.push(racerId);

    const racer = this.gameState.racers[racerId];
    if (racer) {
      racer.visual.finished = true;
      racer.updateRacerHistory(this.currentRace.id, finishingPosition);
    }

    // Start countdown after 3rd place
    if (finishingPosition === 3) {
      this.startRaceEndCountdown();
    }

    this.eventBus.emit('race:racerFinished', {
      racerId: racerId,
      position: finishingPosition
    });
  }

  /**
   * Start race end countdown
   */
  startRaceEndCountdown() {
    this.raceEndCountdown = {
      active: true,
      startTime: Date.now(),
      endTime: Date.now() + 30000 // 30 seconds
    };
  }

  /**
   * End the current race
   */
  endRace() {
    this.gameState.running = false;

    if (this.raceTimer) {
      clearInterval(this.raceTimer);
      this.raceTimer = null;
    }

    // Handle any racers that didn't finish
    this.handleUnfinishedRacers();

    this.eventBus.emit('race:finish', {
      race: this.currentRace,
      results: this.currentRace.results
    });

    // Advance to next race
    this.gameState.currentRaceIndex = (this.gameState.currentRaceIndex || 0) + 1;
    this.currentRace = null;
  }

  /**
   * Handle racers that didn't finish the race
   */
  handleUnfinishedRacers() {
    const finishedRacers = new Set(this.currentRace.results);

    this.currentRace.racers.forEach(racerId => {
      if (!finishedRacers.has(racerId)) {
        const position = this.currentRace.results.length + 1;
        this.currentRace.results.push(racerId);

        const racer = this.gameState.racers[racerId];
        if (racer) {
          racer.didNotFinish = true;
          racer.updateRacerHistory(this.currentRace.id, position);
        }
      }
    });
  }

  /**
   * End the race week
   */
  endRaceWeek() {
    this.eventBus.emit('race:weekEnded', {
      weekNumber: this.gameState.raceWeekCounter
    });
  }

  /**
   * End race early
   */
  endRaceEarly() {
    if (this.raceEndCountdown) {
      this.raceEndCountdown.active = false;
    }
    this.endRace();
  }

  /**
   * Create a new race week
   */
  createNewRaceWeek() {
    // This will be implemented in the progression system
    // For now, emit an event to trigger the UI creation
    this.eventBus.emit('race:createWeek');
  }

  /**
   * Get current race state
   */
  getCurrentRace() {
    return this.currentRace;
  }

  /**
   * Get race results
   */
  getRaceResults() {
    return this.currentRace ? this.currentRace.results : [];
  }
}