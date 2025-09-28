export class PreRaceScreen {
  initialize(eventBus) { this.eventBus = eventBus; this.create(); }
  create() {
    this.el = document.createElement('div');
    this.el.id = 'preRaceScreen';
    this.el.innerHTML = `<div class="ui gui-container"><h3>Pre-Race</h3><div id="preRaceInfo"></div><button id="prsStart" class="btn btn-primary">Start Race</button></div>`;
    this.el.querySelector('#prsStart').addEventListener('click', () => this.eventBus.emit('race:start'));
  }
  show({ container, gameState }) {
    (container||document.getElementById('app')).appendChild(this.el);
    this.el.classList.add('screen-transition-enter');
    
    const i = gameState?.currentRaceIndex ?? 0, r = gameState?.raceWeek?.races?.[i]; 
    this.el.querySelector('#preRaceInfo').textContent = r ? `Race ${i+1}: ${r.track.name} • Weather: ${r.weather}` : 'Race details unavailable';
  }
  hide() { this.el?.parentNode?.removeChild(this.el); }
}