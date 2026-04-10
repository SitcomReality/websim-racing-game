import { WeekSummaryHeader } from '../components/WeekSummaryHeader.js';
import { WeekRecapPanel } from '../components/WeekRecapPanel.js';
import { StandingsPanel } from '../components/StandingsPanel.js';
import { EarningsPanel } from '../components/EarningsPanel.js';

export class WeekSummaryScreen {
  initialize(eventBus) { 
    this.eventBus = eventBus; 
    this.create(); 
  }

  create() {
    this.el = document.createElement('div');
    this.el.id = 'weekSummaryScreen';
    this.el.className = 'week-summary-newspaper';
    
    this.el.innerHTML = `
      <div class="newspaper-wrapper">
        <!-- Newspaper Header (Will be replaced by Header Component) -->
        <header class="newspaper-header" id="headerPlaceholder"></header>

        <!-- Main Content Grid -->
        <main class="newspaper-content">
          <!-- Lead Story Section (Will be replaced by Recap Component) -->
          <section class="lead-story-section" id="recapPlaceholder"></section>

          <!-- Race Results Grid (Populated dynamically) -->
          <section class="race-results-grid" id="raceResultsGrid">
            <!-- Race result cards will be populated here -->
          </section>

          <!-- Stats & Highlights Sidebar -->
          <aside class="stats-sidebar">
            <div class="sidebar-section" id="standingsPlaceholder">
              <!-- Standings Panel will be injected here -->
            </div>
            
            <div class="sidebar-section betting-section" id="earningsPlaceholder">
              <h3 class="sidebar-title">FINANCIALS</h3>
              <!-- Earnings Panel will be injected here -->
            </div>
            
            <div class="sidebar-section">
              <h3 class="sidebar-title">PROGRESSION TRACK</h3>
              <div class="stats-content" id="racerStats"></div>
            </div>
          </aside>

          <!-- Fun Facts Section -->
          <section class="fun-facts-section">
            <div class="comic-panel">
              <h3 class="comic-title">DID YOU KNOW?</h3>
              <div class="fun-facts-content" id="funFacts"></div>
            </div>
          </section>
        </main>

        <!-- Newspaper Footer -->
        <footer class="newspaper-footer">
          <div class="footer-content">
            <div class="next-week-teaser">
              <h4>COMING NEXT WEEK</h4>
              <p id="nextWeekPreview">More thrilling ferret racing action!</p>
            </div>
            <button id="wsNewWeek" class="newspaper-button">
              <span class="button-text">START NEW WEEK</span>
              <div class="button-shadow"></div>
            </button>
          </div>
        </footer>
      </div>
    `;

    // Initialize components
    this.header = new WeekSummaryHeader();
    this.recap = new WeekRecapPanel();
    this.standingsPanel = new StandingsPanel();
    this.earningsPanel = new EarningsPanel();

    // Inject components into placeholders
    this.el.querySelector('#headerPlaceholder').replaceWith(this.header.create());
    this.el.querySelector('#recapPlaceholder').replaceWith(this.recap.create());
    this.el.querySelector('#standingsPlaceholder').replaceWith(this.standingsPanel.create());
    this.el.querySelector('#earningsPlaceholder').appendChild(this.earningsPanel.create());

    // Add event listeners
    this.el.querySelector('#wsNewWeek').addEventListener('click', () => {
      this.eventBus.emit('race:startWeek');
    });
  }

  show({ container, gameState }) {
    (container || document.getElementById('app')).appendChild(this.el);
    this.el.classList.add('screen-transition-enter');
    
    this.populateContent(gameState);
  }

  populateContent(gameState) {
    const weekNumber = gameState?.raceWeekCounter ?? 0;
    const raceHistory = gameState?.raceHistory || [];
    
    // Filter races belonging to the current week (based on raceId structure: "weekNumber-raceIndex")
    const weekRaces = raceHistory.filter(h => {
      // Safely access race ID and check if it starts with the current week number
      const raceId = h.race?.id;
      return typeof raceId === 'string' && raceId.startsWith(`${weekNumber}-`);
    }).map(h => {
        // Map history item to a consistent race result structure
        return {
            ...h.race,
            results: h.results.map((racerId, index) => {
                const racer = gameState.racers.find(r => r.id === racerId);
                return {
                    racer: racer,
                    name: this.getName(racer),
                    position: index + 1
                };
            }),
            winner: { name: this.getName(gameState.racers.find(r => r.id === h.results[0])) }
        };
    });

    this.header?.updateDate(weekNumber);
    
    // Pass raw race history items to panels for data calculation
    this.recap?.populateContent(weekNumber, weekRaces, gameState);
    this.standingsPanel?.setData(weekNumber, weekRaces, gameState);
    this.earningsPanel?.populateData(weekNumber, weekRaces, gameState);

    // Update progression stats
    this.populateStats(gameState);
    
    // Populate race results grid (simplified cards)
    this.populateRaceResults(weekRaces);
    
    // Populate fun facts
    this.populateFunFacts(weekRaces, gameState);
    
    // Update next week preview
    this.updateNextWeekPreview(weekNumber);
  }

  populateRaceResults(weekRaces) {
    const grid = this.el.querySelector('#raceResultsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    weekRaces.forEach((race, index) => {
      const winnerName = race.winner?.name || 'TBD';
      const raceCard = document.createElement('div');
      raceCard.className = 'race-result-card';
      raceCard.innerHTML = `
        <div class="race-card-header">
          <h4 class="race-title">Race ${index + 1}</h4>
          <div class="track-name">${race.track?.name || 'Unknown Track'}</div>
        </div>
        <div class="race-winner">
          <div class="winner-label">WINNER:</div>
          <div class="winner-name">${winnerName}</div>
        </div>
        <div class="comic-elements">
          <div class="victory-burst">POW!</div>
        </div>
      `;
      grid.appendChild(raceCard);
    });
  }

  populateStats(gameState) {
    const statsEl = this.el.querySelector('#racerStats');
    if (!statsEl) return;
    
    const progressionStats = window.app.progressionManager.getProgressionStats();

    statsEl.innerHTML = `
      <div class="stat-item">
        <span class="stat-label">Season:</span>
        <span class="stat-value">${progressionStats.currentSeason}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Week In Season:</span>
        <span class="stat-value">${progressionStats.weekInSeason - 1}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Total Races:</span>
        <span class="stat-value">${progressionStats.racesCompleted}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Player Balance:</span>
        <span class="stat-value">$${gameState?.player?.balance || 0}</span>
      </div>
    `;
  }

  populateFunFacts(weekRaces, gameState) {
    const funFacts = this.el.querySelector('#funFacts');
    if (!funFacts) return;

    // Use placeholder facts for now
    const facts = [
      'Ferrets can run up to 15 mph!',
      'Racing ferrets sleep 18-20 hours per day',
      'The average ferret race lasts 45 seconds',
      'Ferrets have been racing since ancient times'
    ];
    
    const randomFact = facts[Math.floor(Math.random() * facts.length)];
    funFacts.innerHTML = `
      <div class="fun-fact-bubble">
        <div class="fact-text">${randomFact}</div>
        <div class="comic-tail"></div>
      </div>
    `;
  }

  updateNextWeekPreview(currentWeek) {
    const preview = this.el.querySelector('#nextWeekPreview');
    if (preview) {
        preview.textContent = `Get ready for Week ${currentWeek + 1} - New tracks, new challenges, new champions await!`;
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

  findWeekWinner(weekRaces) {
    const racerWins = {};
    weekRaces.forEach(race => {
      const winner = race.winner?.name;
      if (winner) {
        racerWins[winner] = (racerWins[winner] || 0) + 1;
      }
    });
    
    const topWinner = Object.entries(racerWins).reduce((a, b) => 
      racerWins[a[0]] > racerWins[b[0]] ? a : b, ['Unknown', 0]
    );
    
    return { name: topWinner[0] };
  }

  hide() { 
    this.el?.parentNode?.removeChild(this.el); 
  }
}