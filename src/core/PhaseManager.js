export class PhaseManager {
  constructor(eventBus, gameState) {
    this.eventBus = eventBus;
    this.gameState = gameState;
    this.currentPhase = 'intro';
    this.bind();
  }
  bind() {
    this.eventBus.on('progression:weekStarted', () => this.setPhase('week_preview'));
    this.eventBus.on('race:setupComplete', () => this.setPhase('pre_race'));
    this.eventBus.on('race:started', () => this.setPhase('race'));
    this.eventBus.on('race:finish', ({ race }) => {
      this._lastRace = race; this.setPhase('results');
    });
    this.eventBus.on('race:weekEnded', () => this.setPhase('week_summary'));
  }
  setPhase(phase, data = null) {
    if (this.currentPhase === phase) return;
    this.currentPhase = phase;
    this.eventBus.emit('phase:changed', { phase, data });
  }
}

