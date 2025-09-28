ui/components/MemphisRacerCard.js
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
   */
  constructor(racer, options = {}) {
    super(null, options); // The element will be created by `createElement()`
    this.racer = racer;
    this.position = options.position;
    this.isWinner = options.isWinner || false;
  }

  /**
   * Creates and returns the DOM element for the racer card.
   * @returns {HTMLElement} The generated card element.
   */
  createElement() {
    this.element = document.createElement('div');
    this.element.className = 'racer-card-memphis';
    if (this.isWinner) {
      this.element.classList.add('winner');
    }

    const name = this.getRacerNameString(this.racer);
    
    // Fetch stats from the racer's stats component
    const stats = this.racer.getComponent('stats')?.stats;
    const speed = stats?.speedBase || stats?.speed || 10;
    const endurance = stats?.endurance || 2000;
    const boost = stats?.boostPower || 800;
    const form = this.racer.formThisWeek || 1.0;
    
    // Get betting odds from the betting component
    const odds = this.racer.getComponent('betting')?.baseBettingOdds?.toFixed(2) || 'N/A';

    this.element.innerHTML = `
      ${this.position ? `<div class="racer-position-memphis">${this.position}</div>` : ''}
      <div class="racer-name-memphis">${name}</div>
      <div class="racer-stats-memphis">
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
      </div>
      <div class="racer-odds-memphis">ODDS: ${odds}</div>
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
    const colors = window.racerColors || ["#FFF275", "#FF8C42", "#FF3C38"];
    return colors[index % colors.length];
  }
}