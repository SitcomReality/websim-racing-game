export class StandingsPanel {
  constructor() {
    this.el = null;
    this.standings = [];
  }

  create() {
    this.el = document.createElement('section');
    this.el.className = 'standings-panel';

    this.el.innerHTML = `
      <div class="standings-header">
        <h3 class="standings-title">WEEKLY STANDINGS</h3>
        <div class="standings-subtitle" id="standingsSubtitle">Top performers of the week</div>
      </div>
      <div class="standings-table-wrapper">
        <table class="standings-table" id="standingsTable">
          <thead>
            <tr>
              <th>#</th>
              <th>Racer</th>
              <th>Pts</th>
              <th>Wins</th>
              <th>Avg Pos</th>
            </tr>
          </thead>
          <tbody id="standingsBody"></tbody>
        </table>
      </div>
      <div class="standings-footnote" id="standingsFootnote">
        Points: 1st 25 • 2nd 18 • 3rd 15 • 4th 12 • 5th 10 • 6th 8 • 7th 6 • 8th 4
      </div>
    `;

    return this.el;
  }

  setData(weekNumber, weekRaces = [], gameState = {}) {
    const subtitle = this.el?.querySelector('#standingsSubtitle');
    if (subtitle) {
      subtitle.textContent = `Week ${weekNumber} • ${weekRaces.length} race${weekRaces.length === 1 ? '' : 's'}`;
    }

    this.standings = this.computeStandings(weekRaces);
    this.renderTable(this.standings);
  }

  renderTable(rows) {
    const tbody = this.el?.querySelector('#standingsBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    rows.slice(0, 10).forEach((row, idx) => {
      const tr = document.createElement('tr');
      tr.className = 'standings-row';
      tr.innerHTML = `
        <td class="col-rank">${idx + 1}</td>
        <td class="col-name">${row.name}</td>
        <td class="col-points">${row.points}</td>
        <td class="col-wins">${row.wins}</td>
        <td class="col-avg">${row.avgPosition.toFixed(1)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  computeStandings(weekRaces) {
    const pointsScale = [25, 18, 15, 12, 10, 8, 6, 4];
    const stats = new Map();

    weekRaces.forEach(race => {
      const results = Array.isArray(race.results) ? race.results : [];
      results.sort((a, b) => (a.position || 999) - (b.position || 999));

      results.forEach((res, idx) => {
        const name = res?.racer?.name || 'Unknown';
        const pos = res?.position ?? idx + 1;
        const pts = pointsScale[idx] || 0;

        if (!stats.has(name)) {
          stats.set(name, { name, points: 0, wins: 0, totalPos: 0, races: 0 });
        }
        const r = stats.get(name);
        r.points += pts;
        r.wins += pos === 1 ? 1 : 0;
        r.totalPos += pos;
        r.races += 1;
      });
    });

    const rows = Array.from(stats.values()).map(r => ({
      ...r,
      avgPosition: r.races ? r.totalPos / r.races : 999
    }));

    rows.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.avgPosition - b.avgPosition;
    });

    return rows;
  }

  updateFootnote(text) {
    const foot = this.el?.querySelector('#standingsFootnote');
    if (foot) foot.textContent = text;
  }

  getElement() {
    return this.el;
  }
}