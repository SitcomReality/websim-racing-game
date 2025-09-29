import { PodiumDisplay } from '../components/PodiumDisplay.js';
import { ComicBurst } from '../components/ComicBurst.js';

/**
 * RaceResultsScreen - Displays race results with Memphis design styling
 */
export class RaceResultsScreen {
  constructor() {
    this.eventBus = null;
    this.podiumDisplay = null;
  }

  initialize(eventBus) {
    this.eventBus = eventBus;
    this.create();
  }

  create() {
    this.el = document.createElement('div');
    this.el.id = 'raceResultsScreen';
    this.el.innerHTML = `
      <div class="race-results-container-memphis">
        <div class="race-results-header-memphis">
          <h1 class="race-results-title-memphis">RACE RESULTS</h1>
          <div class="race-results-burst-memphis"></div>
        </div>
        
        <div id="podiumContainer" class="podium-display-memphis"></div>
        
        <div class="results-section-memphis full-results-memphis">
          <h2 class="results-subtitle-memphis">COMPLETE RESULTS</h2>
          <ol id="resultsList" class="results-list-memphis"></ol>
        </div>
        
        <div class="race-results-actions-memphis">
          <button id="rrNext" class="btn btn-primary btn-memphis">NEXT RACE</button>
          <button id="rrWeek" class="btn btn-outline btn-memphis">WEEK SUMMARY</button>
        </div>
      </div>
    `;
    
    this.el.querySelector('#rrNext').addEventListener('click', () => this.eventBus.emit('race:setup'));
    this.el.querySelector('#rrWeek').addEventListener('click', () => this.eventBus.emit('race:weekEnded', {}));
  }

  show({ container, gameState }) {
    (container || document.getElementById('app')).appendChild(this.el);
    this.el.classList.add('memphis-bounce');
    
    const results = gameState?.raceHistory?.[gameState.raceHistory.length - 1]?.results ||
                    gameState?.currentRace?.results || [];
    
    // Check if this is the last race of the week
    const currentWeek = gameState?.currentWeek || gameState?.raceWeek;
    const isLastRace = currentWeek && currentWeek.currentRaceIndex >= (currentWeek.races?.length - 1);
    
    // Update navigation buttons based on whether there are more races
    const nextButton = this.el.querySelector('#rrNext');
    const weekButton = this.el.querySelector('#rrWeek');
    
    if (isLastRace) {
      nextButton.style.display = 'none';
      weekButton.style.display = 'block';
      weekButton.textContent = 'WEEK SUMMARY';
    } else {
      nextButton.style.display = 'block';
      weekButton.style.display = 'none';
      nextButton.textContent = 'NEXT RACE';
    }
    
    // Show betting payouts if player has settled bets
    this.showBettingPayouts(gameState);
    
    // Create podium display
    this.podiumDisplay = new PodiumDisplay(this.el.querySelector('#podiumContainer'), {
      showTop3Only: false
    });
    this.podiumDisplay.initialize();

    // Format results for podium
    const podiumResults = results.map((racerId, index) => {
      const racer = gameState.racers.find(r => r.id === racerId);
      return {
        id: racerId,
        name: this.getName(racer),
        position: index + 1,
        time: this.getRaceTime(racer, index)
      };
    });
    
    this.podiumDisplay.setResults(podiumResults);
    
    // Add celebration burst for winner
    if (podiumResults.length > 0) {
      const burst = new ComicBurst({
        text: 'WINNER!',
        type: 'winner',
        duration: 3000
      });
      
      const burstContainer = this.el.querySelector('.race-results-burst-memphis');
      if (burstContainer) {
        const burstElement = document.createElement('div');
        burstElement.innerHTML = burst.renderToString();
        burstContainer.appendChild(burstElement);
      }
    }
    
    // Animate podium appearance
    setTimeout(() => {
      this.podiumDisplay.animateIn();
    }, 500);
    
    // Populate full results list with placement badges
    const resultsList = this.el.querySelector('#resultsList');
    resultsList.innerHTML = '';
    
    results.forEach((racerId, index) => {
      const racer = gameState.racers.find(r => r.id === racerId);
      const listItem = document.createElement('li');
      listItem.className = 'results-item-memphis';
      
      const position = document.createElement('div');
      position.className = `results-position-memphis position-${index + 1}`;
      position.textContent = this.getPositionBadge(index + 1);
      
      const name = document.createElement('div');
      name.className = 'results-name-memphis';
      name.textContent = this.getName(racer);
      
      const time = document.createElement('div');
      time.className = 'results-time-memphis';
      time.textContent = this.getRaceTime(racer, index);
      
      listItem.appendChild(position);
      listItem.appendChild(name);
      listItem.appendChild(time);
      
      resultsList.appendChild(listItem);
    });
  }

  showBettingPayouts(gameState) {
    // Get the most recent betting settlement data
    const lastRace = gameState?.raceHistory?.[gameState.raceHistory.length - 1];
    const settledBets = lastRace?.settledBets || [];
    
    if (settledBets.length === 0) return;
    
    const totalWinnings = settledBets.reduce((sum, bet) => sum + (bet.payout || 0), 0);
    const totalWagered = settledBets.reduce((sum, bet) => sum + bet.amount, 0);
    
    // Create betting payout section
    const payoutSection = document.createElement('div');
    payoutSection.className = 'betting-payouts-memphis';
    payoutSection.innerHTML = `
      <h3 class="payout-title-memphis">BETTING RESULTS</h3>
      <div class="payout-summary-memphis">
        <div class="payout-item-memphis">
          <span class="payout-label-memphis">Wagered:</span>
          <span class="payout-amount-memphis">$${totalWagered}</span>
        </div>
        <div class="payout-item-memphis">
          <span class="payout-label-memphis">Winnings:</span>
          <span class="payout-amount-memphis ${totalWinnings > 0 ? 'positive' : 'negative'}">$${totalWinnings}</span>
        </div>
        <div class="payout-item-memphis profit">
          <span class="payout-label-memphis">Profit:</span>
          <span class="payout-amount-memphis ${totalWinnings - totalWagered > 0 ? 'positive' : 'negative'}">$${totalWinnings - totalWagered}</span>
        </div>
      </div>
    `;
    
    // Insert after podium container
    const podiumContainer = this.el.querySelector('#podiumContainer');
    podiumContainer.parentNode.insertBefore(payoutSection, podiumContainer.nextSibling);
  }

  getPositionBadge(position) {
    const badges = {
      1: '🥇',
      2: '🥈', 
      3: '🥉'
    };
    return badges[position] || position;
  }

  hide() {
    if (this.el?.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
  }

  getName(racer) {
    if (!racer?.name) return 'Unknown Racer';
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

  getRaceTime(racer, position) {
    // Generate realistic race times based on position
    const baseTime = 120; // 2 minutes base
    const positionPenalty = position * 2; // 2 seconds per position
    const randomVariation = Math.random() * 10 - 5; // ±5 seconds random
    
    const totalSeconds = baseTime + positionPenalty + randomVariation;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor((totalSeconds % 1) * 100);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  }
}