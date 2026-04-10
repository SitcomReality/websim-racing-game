import { TrackPreviewComponent } from '../components/TrackPreviewComponent.js';

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
      // Pass required data and options to the component
      const previewComp = new TrackPreviewComponent(null, {
          raceIndex: idx + 1, // Pass index for title rendering
      });
      previewComp.setTrackData(race.track, {
          participants: race.racers,
          weather: race.weather,
          segments: race.segments
      });
      racesGrid.appendChild(previewComp.createElement());
    });
    
    const rosterEl = this.el.querySelector('#wpRoster'); rosterEl.innerHTML = '';
    const rosterFromWeekIds = gameState?.raceWeek?.selectedRacers;
    
    let roster;
    // Ensure roster always contains Racer objects, not just IDs
    if (Array.isArray(rosterFromWeekIds) && rosterFromWeekIds.length) {
      const allRacers = gameState?.racers || [];
      roster = rosterFromWeekIds
          .map(id => allRacers.find(rr => rr.id === id))
          .filter(Boolean);
    } else {
      // Fallback: collect unique IDs from all races and map them to objects
      const rawRacerList = races.flatMap(r=>r.racers)||[];
      const allRacers = gameState?.racers || [];
      
      roster = Array.from(new Set(rawRacerList.map(r => r?.id ?? r)))
          .map(id => allRacers.find(rr=>rr.id===id))
          .filter(Boolean);
    }
    
    import('../components/MemphisRacerCard.js').then(({ MemphisRacerCard }) => {
      roster.forEach(racer => {
        const card = new MemphisRacerCard(racer, { compact: true });
        rosterEl.appendChild(card.createElement());
      });
    });
  }
  hide() { this.el?.parentNode?.removeChild(this.el); }
}