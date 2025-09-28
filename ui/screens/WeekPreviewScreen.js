export class WeekPreviewScreen {
  initialize(eventBus) { this.eventBus = eventBus; this.create(); }
  create() {
    this.el = document.createElement('div');
    this.el.id = 'weekPreviewScreen';
    this.el.innerHTML = `<div class="ui gui-container week-preview">
      <h2 class="week-title">Week Preview</h2>
      <div class="races-grid" id="wpRaces"></div>
      <h4 class="roster-title">This Week's Racers</h4>
      <div class="racers-roster-grid" id="wpRoster"></div>
      <div class="wp-actions">
        <button id="wpStartWeek" class="btn btn-primary">Start Week</button>
      </div>
    </div>`;
    this.el.querySelector('#wpStartWeek').addEventListener('click', () => this.eventBus.emit('race:setup'));
  }
  show({ container, gameState }) {
    (container||document.getElementById('app')).appendChild(this.el);
    this.el.classList.add('screen-transition-enter');
    const weekNum = gameState?.raceWeekCounter ? gameState.raceWeekCounter + 1 : 1;
    this.el.querySelector('.week-title').textContent = `WEEK ${weekNum}`;
    const races = gameState?.raceWeek?.races || [];
    const racesGrid = this.el.querySelector('#wpRaces'); racesGrid.innerHTML = '';
    races.forEach((race, idx) => {
      const panel = document.createElement('div');
      panel.className = 'track-preview-memphis';
      const participants = race?.racers?.length || 0;
      panel.innerHTML = `
        <div class="weather-indicator-memphis" title="${race.weather||''}">${(race.weather||'').slice(0,1).toUpperCase()}</div>
        <div class="track-title-memphis">Race ${idx+1}: ${race.track?.name||'Unknown Track'}</div>
        <div class="track-visual-memphis"><div class="track-path-memphis"></div></div>
        <div class="track-info-grid-memphis">
          <div class="track-info-item-memphis"><div class="track-info-label-memphis">Surface</div><div class="track-info-value-memphis">${race.track?.surface||'Mixed'}</div></div>
          <div class="track-info-item-memphis"><div class="track-info-label-memphis">Laps</div><div class="track-info-value-memphis">${race.track?.laps||'—'}</div></div>
          <div class="track-info-item-memphis"><div class="track-info-label-memphis">Weather</div><div class="track-info-value-memphis">${race.weather||'—'}</div></div>
        </div>
        <div class="participant-count-memphis">${participants} racers</div>
      `;
      racesGrid.appendChild(panel);
    });
    const rosterEl = this.el.querySelector('#wpRoster'); rosterEl.innerHTML = '';
    const rosterFromWeek = gameState?.raceWeek?.selectedRacers;
    const roster = Array.isArray(rosterFromWeek) && rosterFromWeek.length
      ? rosterFromWeek
      : Array.from(new Set((races.flatMap(r=>r.racers)||[]).map(r=>r.id)))
          .map(id => (gameState?.racers||[]).find(rr=>rr.id===id))
          .filter(Boolean);
    import('../components/MemphisRacerCard.js').then(({ MemphisRacerCard }) => {
      roster.forEach(racer => {
        const card = new MemphisRacerCard(racer, { compact: true });
        rosterEl.appendChild(card.createElement());
      });
    });
  }
  hide() { this.el?.parentNode?.removeChild(this.el); }
}