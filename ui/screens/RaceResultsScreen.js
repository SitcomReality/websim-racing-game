ui/screens/RaceResultsScreen.js
import { SettingsPanel } from '../components/settingsPanel.js';
import { RacerCardComponent } from '../components/RacerCardComponent.js';

/**
 * RaceResultsScreen - Displays race results with colorful, bold Memphis design
 */
export class RaceResultsScreen {
  constructor() {
    this.eventBus = null;
    this.settingsPanel = null;
    this.loadingIndicator = null;
  }

  initialize(eventBus) {
    this.eventBus = eventBus;
    this.create();
  }

  create() {
    this.el = document.createElement('div');
    this.el.id = 'raceResultsScreen';
    this.el.innerHTML = `<div class="ui gui-container"><h3>Race Results</h3><ol id="resultsList"></ol><div class="d-flex" style="gap:8px"><button id="rrNext" class="btn btn-primary">Next Race</button><button id="rrWeek" class="btn btn-outline">Week Summary</button></div></div>`;
    this.el.querySelector('#rrNext').addEventListener('click', () => this.eventBus.emit('race:setup'));
    this.el.querySelector('#rrWeek').addEventListener('click', () => this.eventBus.emit('race:weekEnded', {}));
  }

  show({ container, gameState }) {
    (container||document.getElementById('app')).appendChild(this.el);
    const cl = this.el.querySelector('#resultsList'); cl.innerHTML = '';
    const res = gameState?.raceHistory?.[gameState.raceHistory.length-1]?.results || gameState?.currentRace?.results || [];
    res.forEach((rid, i) => { const r = document.createElement('li'); const racer = gameState.racers.find(x=>x.id===rid); r.textContent = `${i+1}. ${this.getName(racer)}`; cl.appendChild(r); });
  }
  hide() { this.el?.parentNode?.removeChild(this.el); }
  getName(r){ if(!r?.name)return'Unknown'; const p=window.racerNamePrefixes?.[r.name[0]],s = window.racerNameSuffixes?.[r.name[1]]; return `${typeof p==='function'?(r._evaluatedPrefix||(r._evaluatedPrefix=p())) :p} ${typeof s==='function'?(r._evaluatedSuffix||(r._evaluatedSuffix=s())) :s}`; }
}