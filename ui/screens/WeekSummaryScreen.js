export class WeekSummaryScreen {
  initialize(eventBus) { this.eventBus = eventBus; this.create(); }
  create() {
    this.el = document.createElement('div');
    this.el.id = 'weekSummaryScreen';
    this.el.innerHTML = `<div class="ui gui-container"><h3>Week Summary</h3><div id="weekSummaryBody"></div><button id="wsNewWeek" class="btn btn-primary">Start New Week</button></div>`;
    this.el.querySelector('#wsNewWeek').addEventListener('click', () => this.eventBus.emit('race:startWeek'));
  }
  show({ container, gameState }) {
    (container||document.getElementById('app')).appendChild(this.el);
    this.el.classList.add('screen-transition-enter');
    
    const body = this.el.querySelector('#weekSummaryBody'); body.innerHTML = '';
    const wk = gameState?.raceWeekCounter ?? 0; const hist = gameState?.raceHistory || [];
    const t = document.createElement('div'); t.textContent = `Week ${wk} complete. Races this week: ${hist.filter(h=>String(h.race?.id||'').startsWith(`${wk}-`)).length}`; body.appendChild(t);
  }
  hide() { this.el?.parentNode?.removeChild(this.el); }
}