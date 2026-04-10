import { BaseComponent } from './BaseComponent.js';

/**
 * MemphisRacerCard - A Memphis-styled component to display racer information.
 * This component generates a DOM element that can be styled using `styles/components/memphis/racer-cards.css`.
 */
export class MemphisRacerCard extends BaseComponent {
  /**
   * @param {object} racer - The racer data object.
   * @param {object} options - Configuration options for the card.
   * @param {number} [options.position] - The racer's position to display (e.g., 1 for 1st).
   * @param {boolean} [options.isWinner] - If true, applies a special winner style.
   * @param {boolean} [options.compact] - If true, displays a compact version of the card.
   */
  constructor(racer, options = {}) {
    super(null, options); // The element will be created by `createElement()`
    this.racer = racer;
    this.position = options.position;
    this.isWinner = options.isWinner || false;
    this.compact = options.compact || false;
  }

  /**
   * Creates and returns the DOM element for the racer card.
   * @returns {HTMLElement} The generated card element.
   */
  createElement() {
    this.element = document.createElement('div');
    this.element.className = 'racer-card-memphis';
    if (this.isWinner) this.element.classList.add('winner');
    if (this.compact) this.element.classList.add('compact');

    const name = this.getRacerNameString(this.racer);
    
    // Fetch stats from the racer's stats component (defensive: some racer objects may not expose getComponent)
    let stats = null;
    if (this.racer && typeof this.racer.getComponent === 'function') {
      stats = this.racer.getComponent('stats')?.stats;
    } else if (this.racer && this.racer.stats) {
      stats = this.racer.stats;
    } else if (this.racer && this.racer.components && this.racer.components.get) {
      const s = this.racer.components.get('stats');
      stats = s?.stats || null;
    } else {
      stats = null;
    }
    const speed = stats?.speedBase || stats?.speed || 10;
    const endurance = stats?.endurance || 2000;
    const boost = stats?.boostPower || 800;
    const form = this.racer?.formThisWeek || 1.0;
    
    // Get betting odds from the betting component
    let odds = 'N/A';
    if (this.racer && typeof this.racer.getComponent === 'function') {
      const b = this.racer.getComponent('betting');
      if (b && typeof b.baseBettingOdds !== 'undefined') odds = String(Number(b.baseBettingOdds).toFixed(2));
    } else if (this.racer && this.racer.baseBettingOdds) {
      odds = String(Number(this.racer.baseBettingOdds).toFixed(2));
    }

    // Get racer colors - ensure array exists and has at least 3 elements, otherwise use defaults
    const racerColors = this.racer?.colors;
    const cols = (Array.isArray(racerColors) && racerColors.length >= 3) ? racerColors : [0, 1, 2];
    const color1 = this.getRacerColor(cols[0]);
    const color2 = this.getRacerColor(cols[1]);
    const color3 = this.getRacerColor(cols[2]);

    this.element.innerHTML = `
      ${this.position ? `<div class="racer-position-memphis">${this.position}</div>` : ''}
      <div class="racer-header-memphis">
        <div class="racer-colors-memphis">
          <div class="color-swatch-memphis" style="background-color: ${color1};"></div>
          <div class="color-swatch-memphis" style="background-color: ${color2};"></div>
          <div class="color-swatch-memphis" style="background-color: ${color3};"></div>
        </div>
        <div class="racer-name-memphis">${name}</div>
      </div>
      ${this.compact ? '' : `<div class="racer-stats-memphis">
        <div class="stat-item-memphis">
          <div class="stat-label-memphis">Speed</div>
          <div class="stat-value-memphis">${Math.round(speed)}</div>
        </div>
        <div class="stat-item-memphis">
          <div class="stat-label-memphis">Endurance</div>
          <div class="stat-value-memphis">${endurance}</div>
        </div>
        <div class="stat-item-memphis">
          <div class="stat-label-memphis">Boost</div>
          <div class="stat-value-memphis">${boost}</div>
        </div>
        <div class="stat-item-memphis">
          <div class="stat-label-memphis">Form</div>
          <div class="stat-value-memphis">${(form * 100).toFixed(0)}%</div>
        </div>
      </div>`}
      ${this.compact ? '' : `<div class="racer-odds-memphis">ODDS: ${odds}</div>`}
    `;

    // Dynamically set the card's accent color based on the racer's primary color
    const primaryColor = this.getRacerColor(this.racer.colors[0]);
    this.element.style.setProperty('--accent-color', primaryColor);
    
    return this.element;
  }

  /**
   * Generates the full name string for a racer from their name indices.
   * @param {object} racer - The racer object.
   * @returns {string} The full name of the racer.
   */
  getRacerNameString(racer) {
    if (!racer || !racer.name) return "Unknown Racer";
    const prefix = window.racerNamePrefixes?.[racer.name[0]];
    const suffix = window.racerNameSuffixes?.[racer.name[1]];
    let prefixStr, suffixStr;

    if (typeof prefix === 'function') {
      prefixStr = racer._evaluatedPrefix || (racer._evaluatedPrefix = prefix());
    } else {
      prefixStr = prefix;
    }

    if (typeof suffix === 'function') {
      suffixStr = racer._evaluatedSuffix || (racer._evaluatedSuffix = suffix());
    } else {
      suffixStr = suffix;
    }
    
    return `${prefixStr} ${suffixStr}`;
  }

  /**
   * Retrieves a color from the global palette by its index.
   * @param {number} index - The color index.
   * @returns {string} The hex color code.
   */
  getRacerColor(index) {
    const colors = window.racerColors;
    if (Array.isArray(colors) && colors.length) return colors[index % colors.length];
    const css = getComputedStyle(document.documentElement);
    const val = css.getPropertyValue(`--racer-color-${index % 31}`)?.trim();
    return val || ["#FFF275","#FF8C42","#FF3C38"][index % 3];
  }
}