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
        <!-- Newspaper Header -->
        <header class="newspaper-header">
          <div class="newspaper-masthead">
            <h1 class="newspaper-title">THE FERRET HERALD</h1>
            <div class="newspaper-subtitle">Weekly Racing Digest</div>
            <div class="newspaper-date" id="newspaperDate"></div>
          </div>
          <div class="newspaper-banner-ads">
            <div class="banner-ad">🏁 RACING NEWS 🏁</div>
          </div>
        </header>

        <!-- Main Content Grid -->
        <main class="newspaper-content">
          <!-- Lead Story Section -->
          <section class="lead-story-section">
            <div class="comic-burst top-story-burst">
              <span>TOP STORY!</span>
            </div>
            <article class="lead-article">
              <h2 class="headline" id="leadHeadline">WEEK RECAP</h2>
              <div class="byline">By Sports Reporter Ferret</div>
              <div class="article-content" id="leadStoryContent"></div>
            </article>
          </section>

          <!-- Race Results Grid -->
          <section class="race-results-grid" id="raceResultsGrid">
            <!-- Race result cards will be populated here -->
          </section>

          <!-- Stats & Highlights Sidebar -->
          <aside class="stats-sidebar">
            <div class="sidebar-section">
              <h3 class="sidebar-title">WEEK HIGHLIGHTS</h3>
              <div class="highlights-content" id="weekHighlights"></div>
            </div>
            
            <div class="sidebar-section">
              <h3 class="sidebar-title">RACER STATS</h3>
              <div class="stats-content" id="racerStats"></div>
            </div>

            <div class="sidebar-section betting-section">
              <h3 class="sidebar-title">BETTING ROUNDUP</h3>
              <div class="betting-content" id="bettingRoundup"></div>
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

    // Inject components
    const headerHost = this.el.querySelector('.newspaper-header');
    this.header = new WeekSummaryHeader(); headerHost.replaceWith(this.header.create());
    const recapHost = this.el.querySelector('.lead-story-section');
    this.recap = new WeekRecapPanel(); recapHost.replaceWith(this.recap.create());
    const standingsWrap = this.el.querySelector('.stats-sidebar');
    this.standingsPanel = new StandingsPanel(); standingsWrap.appendChild(this.standingsPanel.create());

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
    const weekRaces = raceHistory.filter(h => 
      String(h.race?.id || '').startsWith(`${weekNumber}-`)
    );

    this.header?.updateDate(weekNumber);
    this.recap?.populateContent(weekNumber, weekRaces, gameState);
    this.standingsPanel?.setData(weekNumber, weekRaces, gameState);

    // Update newspaper date
    const dateEl = this.el.querySelector('#newspaperDate');
    dateEl.textContent = `Week ${weekNumber} Edition`;

    // Populate lead story
    this.populateLeadStory(weekNumber, weekRaces);
    
    // Populate race results
    this.populateRaceResults(weekRaces);
    
    // Populate sidebar content
    this.populateHighlights(weekRaces, gameState);
    this.populateStats(gameState);
    this.populateBettingRoundup(weekRaces);
    
    // Populate fun facts
    this.populateFunFacts(weekRaces, gameState);
    
    // Update next week preview
    this.updateNextWeekPreview(weekNumber);
  }

  populateLeadStory(weekNumber, weekRaces) {
    const headline = this.el.querySelector('#leadHeadline');
    const content = this.el.querySelector('#leadStoryContent');
    
    if (weekRaces.length === 0) {
      headline.textContent = `WEEK ${weekNumber} PREPARATION COMPLETE`;
      content.innerHTML = `
        <p class="article-paragraph">
          The ferret racing community is buzzing with excitement as Week ${weekNumber} 
          preparations conclude. Racers have been training hard and are ready to compete!
        </p>
      `;
    } else {
      const winner = this.findWeekWinner(weekRaces);
      headline.textContent = `${winner?.name || 'CHAMPION'} DOMINATES WEEK ${weekNumber}!`;
      content.innerHTML = `
        <p class="article-paragraph">
          In a spectacular display of speed and agility, ${winner?.name || 'our champion'} 
          emerged victorious after ${weekRaces.length} thrilling races this week.
        </p>
        <p class="article-paragraph">
          The week featured intense competition across ${weekRaces.length} different tracks, 
          with fans cheering from the sidelines throughout each exciting race.
        </p>
      `;
    }
  }

  populateRaceResults(weekRaces) {
    const grid = this.el.querySelector('#raceResultsGrid');
    grid.innerHTML = '';
    
    weekRaces.forEach((race, index) => {
      const raceCard = document.createElement('div');
      raceCard.className = 'race-result-card';
      raceCard.innerHTML = `
        <div class="race-card-header">
          <h4 class="race-title">Race ${index + 1}</h4>
          <div class="track-name">${race.track?.name || 'Unknown Track'}</div>
        </div>
        <div class="race-winner">
          <div class="winner-label">WINNER:</div>
          <div class="winner-name">${race.winner?.name || 'TBD'}</div>
        </div>
        <div class="comic-elements">
          <div class="speed-lines"></div>
          <div class="victory-burst">POW!</div>
        </div>
      `;
      grid.appendChild(raceCard);
    });
  }

  populateHighlights(weekRaces, gameState) {
    const highlights = this.el.querySelector('#weekHighlights');
    const highlightsList = [
      `${weekRaces.length} races completed`,
      'New track records set',
      'Spectacular photo finishes',
      'Crowd favorites emerged'
    ];
    
    highlights.innerHTML = highlightsList.map(highlight => 
      `<div class="highlight-item">★ ${highlight}</div>`
    ).join('');
  }

  populateStats(gameState) {
    const stats = this.el.querySelector('#racerStats');
    // This would be populated with actual racer statistics
    stats.innerHTML = `
      <div class="stat-item">
        <span class="stat-label">Total Racers:</span>
        <span class="stat-value">${gameState?.racers?.length || 0}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Active Season:</span>
        <span class="stat-value">${gameState?.raceWeekCounter || 0}</span>
      </div>
    `;
  }

  populateBettingRoundup(weekRaces) {
    const betting = this.el.querySelector('#bettingRoundup');
    betting.innerHTML = `
      <div class="betting-item">
        <span class="betting-label">Races with Bets:</span>
        <span class="betting-value">${weekRaces.length}</span>
      </div>
      <div class="betting-item">
        <span class="betting-label">Avg. Payout:</span>
        <span class="betting-value">2.5x</span>
      </div>
    `;
  }

  populateFunFacts(weekRaces, gameState) {
    const funFacts = this.el.querySelector('#funFacts');
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
    preview.textContent = `Get ready for Week ${currentWeek + 1} - New tracks, new challenges, new champions await!`;
  }

  findWeekWinner(weekRaces) {
    // Simple logic to find the most successful racer of the week
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