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
        
        <div class="full-results-memphis">
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
    
    // Create podium display
    this.podiumDisplay = new PodiumDisplay(this.el.querySelector('#podiumContainer'), {
      showTop3Only: true
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
    
    // Add celebration burst
    const burst = new ComicBurst({
      text: 'FINISH!',
      type: 'winner',
      duration: 2000
    });
    
    const burstContainer = this.el.querySelector('.race-results-burst-memphis');
    if (burstContainer) {
      burstContainer.appendChild(burst.createElement ? burst.createElement() : document.createElement('div'));
    }
    
    // Populate full results list
    const resultsList = this.el.querySelector('#resultsList');
    resultsList.innerHTML = '';
    
    results.forEach((racerId, index) => {
      const racer = gameState.racers.find(r => r.id === racerId);
      const listItem = document.createElement('li');
      listItem.className = 'results-item-memphis';
      
      const position = document.createElement('div');
      position.className = 'results-position-memphis';
      position.textContent = index + 1;
      
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