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
      this.app.bettingManager.settleBets(raceData.results);
      this.app.checkAchievements('race:finish', raceData);
      this.app.gameState.raceHistory.push(raceData);
    }); 

    this.app.eventBus.on('game:initialize', () => {
      import('../../init.js').then(({ initGame }) => {
        initGame(this.app.gameStateManager);
        // this.app.uiManager.showScreen('race', { gameState: this.app.gameStateManager });
        this.app.eventBus.emit('race:startWeek');
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