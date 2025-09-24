import { BaseComponent } from './BaseComponent.js';

/** 
 * BettingComponent - Betting interface component
 */ 
export class BettingComponent extends BaseComponent {
  constructor(element, options = {}) {
    super(element, options);
    this.currentBets = [];
    this.racers = [];
  }

  initialize() {
    super.initialize();
    this.setupBettingControls();
  }

  setupBettingControls() {
    const betTypeSelect = this.element.querySelector('#betType');
    const raceNumberSelect = this.element.querySelector('#raceNumber');
    const placeBetButton = this.element.querySelector('#placeBet');
    const submitBetsButton = this.element.querySelector('#submitBetsButton');

    if (betTypeSelect) {
      this.addEventListener(betTypeSelect, 'change', (e) => {
        this.onBetTypeChange(e.target.value);
      });
    }

    if (placeBetButton) {
      this.addEventListener(placeBetButton, 'click', () => {
        this.placeBet();
      });
    }

    if (submitBetsButton) {
      this.addEventListener(submitBetsButton, 'click', () => {
        this.submitBets();
      });
    }
  }

  onBetTypeChange(betType) {
    // Update UI based on bet type
    const racerSelection = this.element.querySelector('#racerSelection');
    if (racerSelection) {
      racerSelection.innerHTML = '';

      if (betType === 'win') {
        this.createSingleRacerSelection(racerSelection);
      } else if (betType === 'quinella') {
        this.createMultipleRacerSelection(racerSelection);
      }
    }
  }

  createSingleRacerSelection(container) {
    const select = document.createElement('select');
    select.id = 'selectRacer';
    select.className = 'form-control';

    this.racers.forEach((racer, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `Racer ${index + 1} - ${this.getRacerName(racer)}`;
      select.appendChild(option);
    });

    container.appendChild(select);
  }

  createMultipleRacerSelection(container) {
    const instruction = document.createElement('p');
    instruction.textContent = 'Select 2 racers for quinella bet:';
    container.appendChild(instruction);

    this.racers.forEach((racer, index) => {
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = index;
      checkbox.className = 'quinella-checkbox';

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(` Racer ${index + 1} - ${this.getRacerName(racer)}`));
      container.appendChild(label);
    });
  }

  placeBet() {
    const betType = this.element.querySelector('#betType')?.value;
    const betAmount = parseInt(this.element.querySelector('#betAmount')?.value) || 100;

    if (betType === 'win') {
      const selectRacer = this.element.querySelector('#selectRacer');
      if (selectRacer) {
        const racerId = parseInt(selectRacer.value);
        this.addBet('win', racerId, betAmount);
      }
    } else if (betType === 'quinella') {
      const checkboxes = this.element.querySelectorAll('.quinella-checkbox:checked');
      if (checkboxes.length === 2) {
        const racerIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
        this.addBet('quinella', racerIds, betAmount);
      }
    }
  }

  addBet(type, racerId, amount) {
    const bet = {
      id: Date.now(),
      type: type,
      racerId: racerId,
      amount: amount,
      timestamp: new Date()
    };

    this.currentBets.push(bet);
    this.updateBetsSummary();
  }

  updateBetsSummary() {
    const summary = this.element.querySelector('#betsSummary');
    if (!summary) return;

    summary.innerHTML = '<h4>Current Bets</h4>';

    if (this.currentBets.length === 0) {
      summary.innerHTML += '<p>No bets placed</p>';
      return;
    }

    this.currentBets.forEach(bet => {
      const betDiv = document.createElement('div');
      betDiv.className = 'bet-item';

      const racerName = this.getRacerName(this.racers[bet.racerId]);
      betDiv.innerHTML = `
        <span>${bet.type.toUpperCase()}: ${racerName}</span>
        <span>$${bet.amount}</span>
        <button class="btn btn-sm btn-outline remove-bet" data-bet-id="${bet.id}">Remove</button>
      `;

      summary.appendChild(betDiv);
    });

    // Add remove bet listeners
    summary.querySelectorAll('.remove-bet').forEach(button => {
      this.addEventListener(button, 'click', (e) => {
        const betId = parseInt(e.target.getAttribute('data-bet-id'));
        this.removeBet(betId);
      });
    });
  }

  removeBet(betId) {
    this.currentBets = this.currentBets.filter(bet => bet.id !== betId);
    this.updateBetsSummary();
  }

  submitBets() {
    if (this.currentBets.length === 0) {
      alert('Please place at least one bet');
      return;
    }

    // Process bets through event bus
    this.options.eventBus?.emit('bets:submitted', { bets: this.currentBets });
    this.currentBets = [];
    this.updateBetsSummary();
  }

  getRacerName(racer) {
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

  setRacers(racers) {
    this.racers = racers;
    this.refresh();
  }

  refresh() {
    this.updateBetsSummary();
  }
}