export class EarningsPanel {
  constructor() {
    this.el = null;
    this.earningsData = [];
  }

  create() {
    this.el = document.createElement('section');
    this.el.className = 'earnings-panel';

    this.el.innerHTML = `
      <div class="earnings-header">
        <div class="comic-burst earnings-burst">
          <span class="burst-text">MONEY TALKS!</span>
        </div>
        <h3 class="earnings-title">WEEKLY EARNINGS REPORT</h3>
        <div class="earnings-subtitle" id="earningsSubtitle">Prize money distribution</div>
      </div>

      <div class="earnings-content">
        <div class="earnings-summary">
          <div class="total-purse">
            <div class="purse-label">TOTAL WEEK PURSE</div>
            <div class="purse-amount" id="totalPurse">$0</div>
          </div>
          <div class="earnings-stats">
            <div class="stat-item">
              <div class="stat-value" id="avgEarnings">$0</div>
              <div class="stat-label">Avg Earnings</div>
            </div>
            <div class="stat-item">
              <div class="stat-value" id="topEarner">--</div>
              <div class="stat-label">Top Earner</div>
            </div>
          </div>
        </div>

        <div class="earnings-table-wrapper">
          <table class="earnings-table" id="earningsTable">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Racer</th>
                <th>Earnings</th>
                <th>Races</th>
                <th>Per Race</th>
              </tr>
            </thead>
            <tbody id="earningsBody"></tbody>
          </table>
        </div>

        <div class="earnings-footnote">
          <div class="memphis-decoration-line"></div>
          <div class="prize-breakdown" id="prizeBreakdown">
            Prize Structure: 1st $500 • 2nd $300 • 3rd $200 • 4th $100
          </div>
        </div>
      </div>
    `;

    return this.el;
  }

  populateData(weekNumber, weekRaces = [], gameState = {}) {
    const subtitle = this.el?.querySelector('#earningsSubtitle');
    if (subtitle) {
      subtitle.textContent = `Week ${weekNumber} • ${weekRaces.length} race${weekRaces.length === 1 ? '' : 's'}`;
    }

    this.earningsData = this.calculateEarnings(weekRaces);
    this.updateSummary(this.earningsData);
    this.renderEarningsTable(this.earningsData);
  }

  calculateEarnings(weekRaces) {
    const prizeStructure = [500, 300, 200, 100, 50, 25, 10, 5];
    const racerEarnings = new Map();

    weekRaces.forEach(race => {
      const results = Array.isArray(race.results) ? race.results : [];
      // If results items are racer objects with position property or just racer ids, handle defensively
      const sorted = results.slice().sort((a, b) => (a.position || 999) - (b.position || 999));

      sorted.forEach((result, index) => {
        const racerName = result?.racer?.name || (result?.name) || 'Unknown';
        const prize = prizeStructure[index] || 0;

        if (!racerEarnings.has(racerName)) {
          racerEarnings.set(racerName, {
            name: racerName,
            totalEarnings: 0,
            raceCount: 0,
            bestFinish: 999,
            winnings: []
          });
        }

        const racer = racerEarnings.get(racerName);
        racer.totalEarnings += prize;
        racer.raceCount += 1;
        racer.bestFinish = Math.min(racer.bestFinish, result.position || (index + 1));
        racer.winnings.push({
          race: race.track?.name || 'Unknown Track',
          prize,
          position: result.position || (index + 1)
        });
      });
    });

    const earningsArray = Array.from(racerEarnings.values()).map(racer => {
      return {
        ...racer,
        avgEarningsPerRace: racer.raceCount > 0 ? racer.totalEarnings / racer.raceCount : 0
      };
    });

    earningsArray.sort((a, b) => b.totalEarnings - a.totalEarnings);
    return earningsArray;
  }

  updateSummary(earningsData) {
    const totalPurse = earningsData.reduce((sum, racer) => sum + racer.totalEarnings, 0);
    const avgEarnings = earningsData.length > 0 ? Math.round(totalPurse / earningsData.length) : 0;
    const topEarner = earningsData.length > 0 ? earningsData[0].name : '--';

    const totalPurseEl = this.el?.querySelector('#totalPurse');
    const avgEarningsEl = this.el?.querySelector('#avgEarnings');
    const topEarnerEl = this.el?.querySelector('#topEarner');

    if (totalPurseEl) totalPurseEl.textContent = `$${totalPurse.toLocaleString()}`;
    if (avgEarningsEl) avgEarningsEl.textContent = `$${avgEarnings}`;
    if (topEarnerEl) topEarnerEl.textContent = topEarner;
  }

  renderEarningsTable(earningsData) {
    const tbody = this.el?.querySelector('#earningsBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    earningsData.slice(0, 8).forEach((racer, index) => {
      const row = document.createElement('tr');
      row.className = 'earnings-row';

      if (index === 0) row.classList.add('top-earner');
      if (index < 3) row.classList.add('podium-earner');

      row.innerHTML = `
        <td class="col-rank">${index + 1}</td>
        <td class="col-name">${racer.name}</td>
        <td class="col-earnings">$${racer.totalEarnings.toLocaleString()}</td>
        <td class="col-races">${racer.raceCount}</td>
        <td class="col-per-race">$${(racer.avgEarningsPerRace || 0).toFixed(2)}</td>
      `;

      tbody.appendChild(row);
    });
  }

  updatePrizeStructure(structure) {
    const breakdown = this.el?.querySelector('#prizeBreakdown');
    if (breakdown && Array.isArray(structure)) {
      const structureText = structure.map((prize, index) =>
        `${this.getPositionText(index + 1)} $${prize}`
      ).join(' • ');
      breakdown.textContent = `Prize Structure: ${structureText}`;
    }
  }

  getPositionText(position) {
    const suffixes = ['st', 'nd', 'rd'];
    const suffix = suffixes[position - 1] || 'th';
    return `${position}${suffix}`;
  }

  // Utility methods for external access
  getTopEarner() {
    return this.earningsData.length > 0 ? this.earningsData[0] : null;
  }

  getTotalPurse() {
    return this.earningsData.reduce((sum, racer) => sum + racer.totalEarnings, 0);
  }

  getRacerEarnings(racerName) {
    return this.earningsData.find(racer => racer.name === racerName) || null;
  }

  updateBurstText(text = 'MONEY TALKS!') {
    const burstEl = this.el?.querySelector('.burst-text');
    if (burstEl) {
      burstEl.textContent = text;
    }
  }

  getElement() {
    return this.el;
  }
}