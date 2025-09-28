export class WeekPreviewScreen {
  initialize(eventBus) { this.eventBus = eventBus; this.create(); }
  create() {
    this.el = document.createElement('div');
    this.el.id = 'weekPreviewScreen';
    this.el.innerHTML = `<div class="ui gui-container"><h3>Week Preview</h3><div id="weekPreviewBody">Upcoming races will appear here.</div><button id="wpSetup" class="btn btn-primary">Setup Next Race</button></div>`;
    this.el.querySelector('#wpSetup').addEventListener('click', () => this.eventBus.emit('race:setup'));
  }
  show({ container }) { 
    (container||document.getElementById('app')).appendChild(this.el);
    this.el.classList.add('screen-transition-enter');
  }
  hide() { this.el?.parentNode?.removeChild(this.el); }
}