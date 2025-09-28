import { BaseComponent } from './BaseComponent.js';

/**
 * PodiumDisplay - Memphis-styled podium for race results
 */
export class PodiumDisplay extends BaseComponent {
  constructor(element, options = {}) {
    super(element, options);
    this.results = [];
    this.showTop3Only = options.showTop3Only || false;
  }

  /**
   * Initialize the podium display
   */
  initialize() {
    super.initialize();
    this.render();
  }

  /**
   * Set race results data
   */
  setResults(results) {
    this.results = Array.isArray(results) ? results : [];
    this.render();
  }

  /**
   * Render the podium display
   */
  render() {
    if (!this.element) return;

    this.element.innerHTML = '';
    this.element.className = 'podium-container-memphis';

    // Title
    const title = document.createElement('div');
    title.className = 'podium-title-memphis';
    title.textContent = 'RACE RESULTS';
    this.element.appendChild(title);

    // Celebration burst effect
    const burst = document.createElement('div');
    burst.className = 'celebration-burst-memphis';
    this.element.appendChild(burst);

    if (this.results.length === 0) {
      this.renderEmptyState();
      return;
    }

    // Podium steps for top 3
    this.renderPodiumSteps();

    // Full results list (if not showing top 3 only)
    if (!this.showTop3Only && this.results.length > 3) {
      this.renderResultsList();
    }
  }

  /**
   * Render empty state
   */
  renderEmptyState() {
    const empty = document.createElement('div');
    empty.className = 'podium-empty-state';
    empty.style.textAlign = 'center';
    empty.style.padding = '40px 20px';
    empty.style.color = 'var(--text-secondary)';
    empty.textContent = 'No race results available';
    this.element.appendChild(empty);
  }

  /**
   * Render podium steps for top 3 finishers
   */
  renderPodiumSteps() {
    const podiumContainer = document.createElement('div');
    podiumContainer.className = 'podium-steps-memphis';

    const top3 = this.results.slice(0, 3);
    // Order: second, first, third (visual layout)
    const order = [
      { idx: 1, pos: 2, cls: 'second' },
      { idx: 0, pos: 1, cls: 'first' },
      { idx: 2, pos: 3, cls: 'third' }
    ];

    order.forEach(entry => {
      const racer = top3[entry.idx];
      if (!racer) return;
      const step = this.createPodiumStep(racer, entry.pos, entry.cls);
      podiumContainer.appendChild(step);
    });

    this.element.appendChild(podiumContainer);
  }

  /**
   * Create individual podium step
   */
  createPodiumStep(racer, position, stepClass) {
    const step = document.createElement('div');
    step.className = `podium-step-memphis ${stepClass}`;

    // Position number
    const positionElement = document.createElement('div');
    positionElement.className = 'podium-position-memphis';
    positionElement.textContent = position;
    step.appendChild(positionElement);

    // Racer name
    const name = document.createElement('div');
    name.className = 'podium-racer-name-memphis';
    name.textContent = racer.name || `Racer ${position}`;
    step.appendChild(name);

    // Race time
    const time = document.createElement('div');
    time.className = 'podium-time-memphis';
    time.textContent = this.formatTime(racer.time ?? racer.raceTime);
    step.appendChild(time);

    return step;
  }

  /**
   * Render full results list
   */
  renderResultsList() {
    const listContainer = document.createElement('div');
    listContainer.className = 'results-list-memphis';

    this.results.forEach((racer, index) => {
      const item = this.createResultsItem(racer, index + 1);
      listContainer.appendChild(item);
    });

    this.element.appendChild(listContainer);
  }

  /**
   * Create individual results item
   */
  createResultsItem(racer, position) {
    const item = document.createElement('div');
    item.className = 'results-item-memphis';

    // Position
    const positionElement = document.createElement('div');
    positionElement.className = 'results-position-memphis';
    positionElement.textContent = position;
    item.appendChild(positionElement);

    // Name
    const name = document.createElement('div');
    name.className = 'results-name-memphis';
    name.textContent = racer.name || `Racer ${position}`;
    item.appendChild(name);

    // Time
    const time = document.createElement('div');
    time.className = 'results-time-memphis';
    time.textContent = this.formatTime(racer.time ?? racer.raceTime);
    item.appendChild(time);

    return item;
  }

  /**
   * Format time for display
   */
  formatTime(time) {
    if (time === undefined || time === null) return '--:--';
    if (typeof time === 'string') return time;

    const totalSeconds = Number(time);
    if (isNaN(totalSeconds)) return '--:--';

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(2);
    const paddedSeconds = seconds.padStart(5, '0');
    return `${minutes}:${paddedSeconds}`;
  }

  /**
   * Animate podium appearance
   */
  animateIn() {
    if (!this.element) return;

    const steps = this.element.querySelectorAll('.podium-step-memphis');
    steps.forEach((step, index) => {
      step.style.transform = 'translateY(100px)';
      step.style.opacity = '0';

      setTimeout(() => {
        step.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        step.style.transform = 'translateY(0)';
        step.style.opacity = '1';
      }, index * 200);
    });

    const resultItems = this.element.querySelectorAll('.results-item-memphis');
    resultItems.forEach((item, index) => {
      item.style.transform = 'translateX(-100px)';
      item.style.opacity = '0';

      setTimeout(() => {
        item.style.transition = 'all 0.4s ease-out';
        item.style.transform = 'translateX(0)';
        item.style.opacity = '1';
      }, 800 + (index * 100));
    });
  }

  /**
   * Update with new results
   */
  updateResults(results) {
    this.setResults(results);
    this.animateIn();
  }

  /**
   * Toggle between top 3 and full results view
   */
  toggleView() {
    this.showTop3Only = !this.showTop3Only;
    this.render();
    this.animateIn();
  }

  /**
   * Get winner information
   */
  getWinner() {
    return this.results.length > 0 ? this.results[0] : null;
  }

  /**
   * Get top 3 finishers
   */
  getTop3() {
    return this.results.slice(0, 3);
  }
}