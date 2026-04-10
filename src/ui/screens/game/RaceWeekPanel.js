import { RacerCardComponent } from '../../components/RacerCardComponent.js';

export class RaceWeekPanel {
  constructor(rootEl, gameState) {
    this.rootEl = rootEl;
    this.gameState = gameState;
    this.container = rootEl.querySelector('#raceWeekRacesContainer');
  }
  displayRaceWeekInfo(raceWeek) {
    if (!this.container || !raceWeek) return; this.container.innerHTML = '';
    raceWeek.races.forEach((race, index) => {
      const raceEl = document.createElement('div'); raceEl.className = 'race-week-container'; raceEl.id = `race-week-race-${index}`;
      const trackLength = Math.max(0, (race.segments?.length || 0) - 1);
      const groundTypes = [...new Set(race.track.sections)].join(', ');
      const racersWrap = document.createElement('div'); racersWrap.className = 'racers-list';
      race.racers.forEach(racer => {
        const rc = new RacerCardComponent(racer, { compact: true });
        racersWrap.appendChild(rc.createElement());
      });
      raceEl.innerHTML = `
        <div class="race-week-header">
          <h4>Race ${index + 1}: ${race.track.name}</h4>
          <div class="track-info">
            <span class="track-length">Length: ${trackLength} segments</span>
            <span class="ground-types">Ground: ${groundTypes}</span>
          </div>
        </div>
        <h5>Participants:</h5>
      `;
      raceEl.appendChild(racersWrap);
      this.container.appendChild(raceEl);
    });
  }
  highlightCurrentRace(raceIndex) {
    this.rootEl.querySelectorAll('.race-week-container').forEach(el => {
      el.classList.remove('current-race');
      if (parseInt(el.id.split('-').pop()) < raceIndex) el.classList.add('past-race'); else el.classList.remove('past-race');
    });
    const cur = this.rootEl.querySelector(`#race-week-race-${raceIndex}`); if (cur) cur.classList.add('current-race');
  }
  clearRaceWeekInfo() {
    if (this.container) this.container.innerHTML = 'Race week complete. Press "Start Race Week" to begin a new one.';
  }
}