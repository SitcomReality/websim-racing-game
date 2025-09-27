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
      // This path shouldn't be hit if UI flow is correct, but as a safeguard:
      this.eventBus.emit('race:startWeek');
    }

    const raceIndex = this.gameState.currentRaceIndex || 0;
    if (raceIndex >= this.gameState.raceWeek.races.length) {
      this.endRaceWeek();
      return;
    }

    const raceData = this.gameState.raceWeek.races[raceIndex];
    this.prepareRace(raceData);

    this.eventBus.emit('race:setupComplete', {
      raceIndex: raceIndex,
      race: this.gameState.currentRace
    });
  }

  /**
   * Start the current race
   */
  startRace() {
    if (!this.currentRace) {
      this.setupRace();
    }
    if (!this.currentRace) return; // setupRace might have determined week is over

    this.gameState.running = true;
    // The main loop in application will now call updateRace with deltaTime.
    // this.startRaceTimer();

    // Emit distinct event to avoid recursively triggering startRace listeners
    this.eventBus.emit('race:started', {
      race: this.currentRace
    });
  }

  /**
   * Prepare race data and initialize racers
   */
  prepareRace(raceData) {
    const race = new Race(raceData.id, raceData.racers.map(r => r.id), raceData.track, raceData.weather);
    race.initializeSegments(this.gameState.settings.trackProperties.segmentsPerSection);
    race.startTime = Date.now();
    this.currentRace = {
      id: race.id,
      racers: race.racers,
      track: race.track,
      weather: race.weather,
      segments: race.segments,
      results: [],
      liveLocations: {},
      livePositions: [],
      startTime: race.startTime,
      finishedAt: {}, // track finish timestamps
      finishPercent: ((race.segments.length - 1) / race.segments.length) * 100 // New: finish at start of last segment
    };
    // Reset any prior race countdown
    this.raceEndCountdown = null;

    // Initialize racer positions
    this.currentRace.racers.forEach(racerId => {
      this.currentRace.liveLocations[racerId] = 0;
      const racer = this.gameState.racers.find(r => r.id === racerId);
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
    // DEPRECATED: updateRace is now called from main loop with deltaTime
    this.raceTimer = setInterval(() => {
      this.updateRace(0.016); // Simulate 16ms delta
    }, 16); // ~60fps
  }

  /**
   * Update race state
   */
  updateRace(deltaTime) {
    if (!this.gameState.running || !this.currentRace) return;

    // Check for race end conditions
    if (this.shouldEndRace()) {
      this.endRace();
      return;
    }

    // Update racer positions
    this.updateRacerPositions(deltaTime);

    // Check for finishers
    this.checkForFinishers();

    // Emit race update
    this.eventBus.emit('race:update', {
      race: this.currentRace,
    });
  }

  /**
   * Update all racer positions
   */
  updateRacerPositions(deltaTime) {
    this.currentRace.racers.forEach(racerId => {
      const racer = this.gameState.racers.find(r => r.id === racerId);
      if (!racer || racer.visual.finished) return;
      const currentPosition = this.currentRace.liveLocations[racerId] || 0;
      const segmentIndex = Math.floor((currentPosition / 100) * (this.currentRace.segments.length -1) );

      if (segmentIndex >= this.currentRace.segments.length - 1) {
        // Racer has finished - removed check that's now handled earlier
        return;
      }

      const segmentType = this.currentRace.segments[segmentIndex];
      // Activate boost near finish (or when threshold reached) and drain while active
      const perf = racer.getComponent('performance'), stats = racer.getComponent('stats'), pers = racer.getComponent('personality');
      const activation = stats?.getStat('boostActivationPercent') || 70;
      if (!racer.isBoosting && perf?.remainingBoost > 0 && currentPosition >= activation) {
        const locs = this.currentRace.liveLocations; let nearby = { ahead:0, behind:0 };
        this.currentRace.racers.forEach(id => { if (id!==racerId) { const d=(locs[id]||0)-currentPosition; if (Math.abs(d)<8) { d>0?nearby.ahead++:nearby.behind++; } } });
        if (!pers || pers.shouldActivateBoost(0, currentPosition, nearby)) racer.activateBoost();
      }
      if (racer.isBoosting && perf) { perf.reduceRemainingBoost(deltaTime * 60); if (perf.remainingBoost <= 0) racer.deactivateBoost(); }
      
      // Check for stumbling
      const stumbleChance = stats?.getStat('stumbleChance') || 0.002;
      if (Math.random() < stumbleChance * deltaTime * 60) { // Convert to per-second chance
        racer.ferret.isStumbling = true;
        racer.remainingStumble = stats?.getStat('stumbleDuration') || 120;
        // Emit stumble event for camera system
        this.eventBus.emit('race:racerStumbled', {
          racerId: racerId,
          position: currentPosition
        });
      }
      
      // Handle stumble recovery
      if (racer.ferret.isStumbling && racer.remainingStumble > 0) {
        racer.remainingStumble -= deltaTime * 60;
        if (racer.remainingStumble <= 0) {
          racer.ferret.isStumbling = false;
          racer.ferret.crashPhase = 0;
          this.eventBus.emit('race:racerRecovered', { racerId });
        }
      }
      
      const speed = racer.calculateSpeed(
        racer.formThisWeek,
        currentPosition,
        segmentType,
        this.currentRace.weather
      );

      // Apply stumble speed penalty
      let finalSpeed = speed;
      if (racer.ferret.isStumbling) {
        finalSpeed *= 0.6; // 40% speed reduction while stumbling
      }

      // Update position based on deltaTime for smooth movement
      const distanceToTravel = finalSpeed * deltaTime;
      this.currentRace.liveLocations[racerId] = Math.min(this.currentRace.finishPercent, currentPosition + distanceToTravel);
      
      // Update the racer entity itself, especially its components
      racer.update(deltaTime, { race: this.currentRace, currentPosition });
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
      if (position >= this.currentRace.finishPercent && !this.currentRace.results.includes(racerId)) {
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
    this.currentRace.finishedAt[racerId] = Date.now(); // record finish time

    const racer = this.gameState.racers.find(r => r.id === racerId);
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
    
    // Emit event to notify UI components
    this.eventBus.emit('race:countdownStarted', {
      countdown: this.raceEndCountdown
    });
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

        const racer = this.gameState.racers.find(r => r.id === racerId);
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

  /**
   * Immediately finalize race based on current positions
   */
  endRaceNow() {
    if (!this.currentRace) return;
    this.gameState.running = false;

    // Build standings by current liveLocations (desc)
    const locs = this.currentRace.liveLocations;
    const ids = [...this.currentRace.racers];
    ids.sort((a, b) => {
      const la = (locs[a] ?? 0);
      const lb = (locs[b] ?? 0);
      if (lb !== la) return lb - la;
      // Tie-breaker: earlier finishedAt first, else stable by id
      const fa = this.currentRace.finishedAt[a] ?? Infinity;
      const fb = this.currentRace.finishedAt[b] ?? Infinity;
      if (fa !== fb) return fa - fb;
      return String(a).localeCompare(String(b));
    });

    this.currentRace.results = [];
    ids.forEach((racerId, idx) => {
      this.currentRace.results.push(racerId);
      const racer = this.gameState.racers.find(r => r.id === racerId);
      if (racer) {
        racer.visual.finished = true;
        racer.didNotFinish = false;
        racer.updateRacerHistory(this.currentRace.id, idx + 1);
      }
    });

    if (this.raceTimer) {
      clearInterval(this.raceTimer);
      this.raceTimer = null;
    }
    this.raceEndCountdown = null;

    this.eventBus.emit('race:finish', {
      race: this.currentRace,
      results: this.currentRace.results
    });

    this.gameState.currentRaceIndex = (this.gameState.currentRaceIndex || 0) + 1;
    this.currentRace = null;
  }
}