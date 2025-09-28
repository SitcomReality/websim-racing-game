import { MemphisRacerCard } from '../components/MemphisRacerCard.js';
import { TrackPreviewComponent } from '../components/TrackPreviewComponent.js';

export class PreRaceScreen {
  initialize(eventBus) { this.eventBus = eventBus; this.create(); }
  create() {
    this.el = document.createElement('div');
    this.el.id = 'preRaceScreen';
    // Use a stacked layout: full-width track visual on top, participants/betting below
    this.el.innerHTML = `<div class="ui gui-container pre-race-stack">
      <div class="pre-race-track" id="preRaceTrack" style="width:100%;"></div>
      <div class="pre-race-participants" style="margin-top:16px;">
        <h3>Participants & Betting</h3>
        <div class="racers-list pre-race-racers-list" id="prsRacers"></div>
        <div class="pre-race-actions" style="margin-top:12px;"><button id="prsStart" class="btn btn-primary">Start Race</button></div>
      </div>
    </div>`;
    this.el.querySelector('#prsStart').addEventListener('click', () => this.eventBus.emit('race:start'));
  }
  show({ container, gameState }) {
    (container||document.getElementById('app')).appendChild(this.el);
    this.el.classList.add('screen-transition-enter');
    const i = gameState?.currentRaceIndex ?? 0, r = gameState?.raceWeek?.races?.[i];
    const trackWrap = this.el.querySelector('#preRaceTrack'); trackWrap.innerHTML = '';
    if (r?.track) {
      const tpc = new TrackPreviewComponent(null, { raceIndex: i+1, showWeather: true });
      tpc.setTrackData(r.track, { participants: r.racers, weather: r.weather, segments: r.segments });
      const tpcEl = tpc.createElement();
      trackWrap.appendChild(tpcEl);
    }
    const list = this.el.querySelector('#prsRacers'); list.innerHTML = '';
    (r?.racers||[]).forEach(racer => {
      const card = new MemphisRacerCard(racer, {});
      const el = card.createElement();
      const btn = document.createElement('button');
      btn.className = 'btn btn-outline btn-memphis bet-quick';
      btn.textContent = 'Bet $100';
      btn.addEventListener('click', () => {
        window.app?.bettingManager?.placeBet({ type:'win', racerId: racer.id, amount:100, raceId: r.id });
      });
      el.appendChild(btn);
      list.appendChild(el);
    });
  }
  hide() { this.el?.parentNode?.removeChild(this.el); }
}