export class WeekRecapPanel {
  constructor() {
    this.el = null;
  }

  create() {
    this.el = document.createElement('section');
    this.el.className = 'week-recap-panel';
    
    this.el.innerHTML = `
      <div class="lead-story-section">
        <div class="comic-burst top-story-burst">
          <span class="burst-text">TOP STORY!</span>
        </div>
        <article class="lead-article">
          <h2 class="headline" id="leadHeadline">WEEK RECAP</h2>
          <div class="byline">By Sports Reporter Ferret</div>
          <div class="article-meta">
            <span class="publish-time" id="publishTime"></span>
            <span class="article-category">RACING NEWS</span>
          </div>
          <div class="article-content" id="leadStoryContent">
            <p class="article-paragraph">Loading week recap...</p>
          </div>
          <div class="article-footer">
            <div class="memphis-decoration-line"></div>
            <div class="article-tags">
              <span class="tag">FERRET RACING</span>
              <span class="tag">WEEKLY WRAP-UP</span>
            </div>
          </div>
        </article>
      </div>
      
      <div class="recap-highlights">
        <div class="highlight-box">
          <h3 class="highlight-title">WEEK AT A GLANCE</h3>
          <div class="highlight-stats" id="weekStats"></div>
        </div>
        
        <div class="spotlight-racer">
          <h3 class="spotlight-title">RACER SPOTLIGHT</h3>
          <div class="spotlight-content" id="racerSpotlight"></div>
        </div>
      </div>
    `;
    
    return this.el;
  }

  populateContent(weekNumber, weekRaces, gameState) {
    this.updateHeadline(weekNumber, weekRaces);
    this.updatePublishTime(weekNumber);
    this.updateLeadStory(weekNumber, weekRaces);
    this.updateWeekStats(weekRaces, gameState);
    this.updateRacerSpotlight(weekRaces, gameState);
  }

  updateHeadline(weekNumber, weekRaces) {
    const headline = this.el.querySelector('#leadHeadline');
    
    if (weekRaces.length === 0) {
      headline.textContent = `WEEK ${weekNumber} PREPARATION COMPLETE`;
    } else {
      const winner = this.findWeekWinner(weekRaces);
      const winCount = this.getWinCount(winner?.name, weekRaces);
      
      if (winCount > 1) {
        headline.textContent = `${winner?.name || 'CHAMPION'} SWEEPS WEEK ${weekNumber}!`;
      } else {
        headline.textContent = `${winner?.name || 'CHAMPION'} CLAIMS WEEK ${weekNumber} GLORY!`;
      }
    }
  }

  updatePublishTime(weekNumber) {
    const timeEl = this.el.querySelector('#publishTime');
    const now = new Date();
    timeEl.textContent = `Week ${weekNumber} • ${now.toLocaleDateString()}`;
  }

  updateLeadStory(weekNumber, weekRaces) {
    const content = this.el.querySelector('#leadStoryContent');
    
    if (weekRaces.length === 0) {
      content.innerHTML = `
        <p class="article-paragraph">
          The ferret racing community is buzzing with anticipation as Week ${weekNumber} 
          preparations conclude. Trainers have been putting their racers through rigorous 
          practice sessions, fine-tuning their speed and agility for the upcoming competitions.
        </p>
        <p class="article-paragraph">
          "This week is going to be special," commented one veteran trainer. "The racers 
          are in peak condition and ready to give fans the thrilling races they deserve."
        </p>
      `;
    } else {
      const winner = this.findWeekWinner(weekRaces);
      const winCount = this.getWinCount(winner?.name, weekRaces);
      const totalRacers = this.getTotalRacersCount(weekRaces);
      
      content.innerHTML = `
        <p class="article-paragraph">
          In what can only be described as a masterclass performance, 
          <strong>${winner?.name || 'our champion'}</strong> dominated Week ${weekNumber} 
          with ${winCount} ${winCount === 1 ? 'victory' : 'victories'} out of ${weekRaces.length} races.
        </p>
        <p class="article-paragraph">
          The week featured intense competition across ${weekRaces.length} different tracks, 
          with ${totalRacers} racers pushing their limits in pursuit of glory. Spectators 
          were treated to photo finishes, unexpected upsets, and breathtaking displays of 
          ferret athleticism.
        </p>
        <p class="article-paragraph">
          "It's been an incredible week of racing," said track officials. "The level of 
          competition continues to rise, and fans can expect even more excitement in the weeks ahead."
        </p>
      `;
    }
  }

  updateWeekStats(weekRaces, gameState) {
    const stats = this.el.querySelector('#weekStats');
    const totalRacers = this.getTotalRacersCount(weekRaces);
    const avgRaceTime = this.getAverageRaceTime(weekRaces);
    
    stats.innerHTML = `
      <div class="stat-grid">
        <div class="stat-item">
          <div class="stat-number">${weekRaces.length}</div>
          <div class="stat-label">Races</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">${totalRacers}</div>
          <div class="stat-label">Racers</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">${avgRaceTime}s</div>
          <div class="stat-label">Avg Time</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">${this.getPhotoFinishes(weekRaces)}</div>
          <div class="stat-label">Photo Finishes</div>
        </div>
      </div>
    `;
  }

  updateRacerSpotlight(weekRaces, gameState) {
    const spotlight = this.el.querySelector('#racerSpotlight');
    const winner = this.findWeekWinner(weekRaces);
    
    if (!winner) {
      spotlight.innerHTML = `
        <div class="spotlight-placeholder">
          <div class="spotlight-icon">🏆</div>
          <p>Week's top performer will be featured here after races complete!</p>
        </div>
      `;
      return;
    }

    const winCount = this.getWinCount(winner.name, weekRaces);
    const racerPerformance = this.calculateRacerPerformance(winner.name, weekRaces);
    
    spotlight.innerHTML = `
      <div class="spotlight-racer-card">
        <div class="spotlight-name">${winner.name}</div>
        <div class="spotlight-achievement">Week ${gameState?.raceWeekCounter || 0} Champion</div>
        <div class="spotlight-stats">
          <div class="spotlight-stat">
            <span class="stat-value">${winCount}</span>
            <span class="stat-unit">${winCount === 1 ? 'Win' : 'Wins'}</span>
          </div>
          <div class="spotlight-stat">
            <span class="stat-value">${racerPerformance.avgPosition}</span>
            <span class="stat-unit">Avg Position</span>
          </div>
          <div class="spotlight-stat">
            <span class="stat-value">${racerPerformance.consistency}%</span>
            <span class="stat-unit">Consistency</span>
          </div>
        </div>
        <div class="spotlight-quote">
          "${this.generateQuote(winner.name, winCount)}"
        </div>
      </div>
    `;
  }

  // Helper methods
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

  getWinCount(racerName, weekRaces) {
    return weekRaces.filter(race => race.winner?.name === racerName).length;
  }

  getTotalRacersCount(weekRaces) {
    const allRacers = new Set();
    weekRaces.forEach(race => {
      if (race.results) {
        race.results.forEach(result => {
          if (result.racer?.name) allRacers.add(result.racer.name);
        });
      }
    });
    return allRacers.size || 8; // Default estimate
  }

  getAverageRaceTime(weekRaces) {
    if (weekRaces.length === 0) return 45;
    // Simulate race times between 30-60 seconds
    return (35 + Math.random() * 25).toFixed(1);
  }

  getPhotoFinishes(weekRaces) {
    // Simulate photo finishes (roughly 20% of races)
    return Math.floor(weekRaces.length * 0.2);
  }

  calculateRacerPerformance(racerName, weekRaces) {
    let totalPosition = 0;
    let raceCount = 0;
    
    weekRaces.forEach(race => {
      if (race.results) {
        const racerResult = race.results.find(r => r.racer?.name === racerName);
        if (racerResult) {
          totalPosition += racerResult.position || 4;
          raceCount++;
        }
      }
    });
    
    const avgPosition = raceCount > 0 ? (totalPosition / raceCount).toFixed(1) : '4.0';
    const consistency = Math.max(60, 100 - (parseFloat(avgPosition) - 1) * 15);
    
    return {
      avgPosition,
      consistency: Math.round(consistency)
    };
  }

  generateQuote(racerName, winCount) {
    const quotes = [
      "Every race is a new opportunity to prove yourself.",
      "The track doesn't lie - speed and heart win races.",
      "I'm just getting started this season!",
      "My fans keep me motivated to push harder.",
      "Training pays off when it matters most.",
      "This week felt like everything clicked perfectly."
    ];
    
    if (winCount > 1) {
      return "Consistency is key - I prepare the same way for every race.";
    }
    
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  getElement() {
    return this.el;
  }

  // Public methods for external updates
  setByline(author = 'Sports Reporter Ferret') {
    const bylineEl = this.el?.querySelector('.byline');
    if (bylineEl) {
      bylineEl.textContent = `By ${author}`;
    }
  }

  addTag(tagText) {
    const tagsContainer = this.el?.querySelector('.article-tags');
    if (tagsContainer) {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = tagText.toUpperCase();
      tagsContainer.appendChild(tag);
    }
  }

  updateBurstText(text = 'TOP STORY!') {
    const burstEl = this.el?.querySelector('.burst-text');
    if (burstEl) {
      burstEl.textContent = text;
    }
  }
}