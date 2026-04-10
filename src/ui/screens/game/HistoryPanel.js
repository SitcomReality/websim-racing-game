import { RacerCardComponent } from '../../components/RacerCardComponent.js';

export class HistoryPanel {
  constructor(rootEl, gameState) {
    this.rootEl = rootEl;
    this.gameState = gameState;
    this.list = rootEl.querySelector('#historyList');
  }
  updateRaceHistory(raceData) {
    if (!raceData?.results || !raceData?.race || !this.list) return;
    const li = document.createElement('li');
    const title = document.createElement('h6'); title.textContent = `Race ${raceData.race.id} - ${raceData.race.track.name}`; li.appendChild(title);
    const results = document.createElement('div'); results.className = 'd-grid grid-cols-2 gap-2';
    raceData.results.forEach((rid, i) => {
      const racer = this.gameState.racers.find(r => r.id === rid);
      if (racer) { const card = new RacerCardComponent(racer, { index: i, compact: true }); results.appendChild(card.createElement()); }
    });
    li.appendChild(results); this.list.insertBefore(li, this.list.firstChild);
  }
}

