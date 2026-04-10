/** 
 * EventListeners - Manages application event listeners
 */ 
export class EventListeners {
  constructor(application) {
    this.app = application;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Race events
    this.app.eventBus.on('race:startWeek', () => {
      const week = this.app.progressionManager.startNewRaceWeek();
      this.app.eventBus.emit('progression:weekStarted', {
        weekNumber: this.app.gameState.raceWeekCounter,
        season: this.app.progressionManager.currentSeason,
        weekInSeason: this.app.progressionManager.weekInSeason
      });
    }); 

    this.app.eventBus.on('race:setup', () => {
      this.app.raceManager.setupRace();
    }); 

    this.app.eventBus.on('race:start', () => {
      this.app.raceManager.startRace();
    }); 

    // Manual end race now
    this.app.eventBus.on('race:endNow', () => {
      this.app.raceManager.endRaceNow();
    });

    this.app.eventBus.on('race:initiateStart', () => {
      const duration = 3000, now = Date.now();
      this.app.eventBus.emit('race:preCountdownStart', { countdown: { active: true, startTime: now, endTime: now + duration, duration } });
      setTimeout(() => this.app.eventBus.emit('race:start'), duration);
    });

    // Betting events
    this.app.eventBus.on('bet:placed', (betData) => {
      this.app.uiManager.refreshComponents();
    }); 

    this.app.eventBus.on('bets:settled', (settlementData) => {
      this.app.uiManager.refreshComponents();
      this.app.checkAchievements('bet:won', settlementData);
    }); 

    // Race finish
    this.app.eventBus.on('race:finish', (raceData) => {
      const settledBets = this.app.bettingManager.settleBets(raceData.results);
      this.app.checkAchievements('race:finish', raceData);
      
      // Store settled bets with race data for results screen
      raceData.settledBets = settledBets;
      this.app.gameState.raceHistory.push(raceData);
    }); 

    this.app.eventBus.on('game:initialize', () => {
      import('../init.js').then(({ initGame }) => {
        initGame(this.app.gameStateManager);
        // After initialization, immediately start the first race week to show Week Preview
        this.app.eventBus.emit('race:startWeek');
        // Don't show race screen on init anymore. PhaseManager handles it.
        // this.app.uiManager.showScreen('race', { gameState: this.app.gameStateManager });
      }).catch(err => console.error('Failed to load init.js', err));
    });

    this.app.eventBus.on('race:update', (raceData) => {
      if (this.app.uiManager.activeScreen?.renderManager) {
        this.app.uiManager.activeScreen.renderManager.setRace(raceData.race, { numberOfLanes: raceData.race.racers.length});
      }
    }); 

    this.app.eventBus.on('app:tick', (deltaTime) => {
      if (this.app.gameState.running) {
        this.app.raceManager.updateRace(deltaTime);
      }
    });
  }
}