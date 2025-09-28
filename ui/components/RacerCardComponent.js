import { BaseComponent } from './BaseComponent.js';

/**
 * RacerCardComponent - Displays racer information in card format
 */
export class RacerCardComponent extends BaseComponent {
  constructor(racer, options = {}) {
    super(null, options);
    this.racer = racer;
    this.showPlacing = options.showPlacing !== false;
    this.compact = options.compact || false;
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.className = 'racer-card';
    this.element.setAttribute('data-racer-id', this.racer.id);

    // Set CSS custom properties for colors
    const primaryColor = this.getRacerColor(this.racer.colors[0]);
    const secondaryColor = this.getRacerColor(this.racer.colors[1]);
    const tertiaryColor = this.getRacerColor(this.racer.colors[2]);
    // Defensive fallbacks if racer.colors is missing
    if (!Array.isArray(this.racer?.colors) || this.racer.colors.length < 3) {
      const fallback = [0,1,2];
      this.racer = { ...this.racer, colors: this.racer?.colors ? [...this.racer.colors, ...fallback].slice(0,3) : fallback };
    }

    this.element.style.setProperty('--primary-color', primaryColor);
    this.element.style.setProperty('--primary-color-dark', this.shadeColor(primaryColor, -20));
    this.element.style.setProperty('--secondary-color', secondaryColor);

    if (this.showPlacing && this.options.index !== undefined) {
      const placing = document.createElement('div');
      placing.className = 'placing-badge';
      placing.textContent = this.options.index + 1;
      this.element.appendChild(placing);
    }

    const num = document.createElement('div');
    num.className = 'racer-number';
    num.textContent = this.racer.id;
    num.style.backgroundColor = tertiaryColor;
    this.element.appendChild(num);

    const info = document.createElement('div');
    info.className = 'racer-info';
    const name = document.createElement('div');
    name.className = 'racer-name';
    name.textContent = this.getRacerNameString(this.racer);
    info.appendChild(name);

    this.element.appendChild(info);

    return this.element;
  }

  getRacerColor(index) {
    const colors = window.racerColors || [
      "#FFF275", "#FF8C42", "#FF3C38", "#A23E48", "#6C8EAD",
      "#171219", "#225560", "#7AC74F", "#F1DABF", "#08BDBD"
    ];
    return colors[index % colors.length];
  }

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

  shadeColor(color, percent) {
    let R = parseInt(color.substring(1,3),16);
    let G = parseInt(color.substring(3,5),16);
    let B = parseInt(color.substring(5,7),16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  

    R = Math.round(R);
    G = Math.round(G);
    B = Math.round(B);

    const RR = ((R.toString(16).length===1)?"0"+R.toString(16):R.toString(16));
    const GG = ((G.toString(16).length===1)?"0"+G.toString(16):G.toString(16));
    const BB = ((B.toString(16).length===1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
  }

  refresh() {
    // Update racer information if needed
    const nameElement = this.element.querySelector('.racer-name');
    if (nameElement) {
      nameElement.textContent = this.getRacerNameString(this.racer);
    }
  }
}