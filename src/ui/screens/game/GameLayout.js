export function createGameLayout() {
  const el = document.createElement('div');
  el.id = 'gameScreen';
  el.className = 'race-screen-container';
  el.innerHTML = `
      <div class="action-lines-memphis"></div>
      <canvas id="raceCanvas"></canvas>
      <div id="race-overlay">
        <div id="liveLeaderboard" class="overlay-leaderboard-memphis">
          <div class="leaderboard-header-memphis">
            <div class="comic-burst winner">
              <span>RACE ORDER</span>
            </div>
          </div>
          <ol id="leaderList" class="leaderboard-list-memphis"></ol>
        </div>
        <div id="overlayWeather" class="overlay-weather-memphis"></div>
        <button id="endRaceNow" class="btn btn-outline btn-memphis">End Race</button>
        <div id="preCountdownOverlay" class="overlay-countdown" style="position:absolute;inset:0;display:none;align-items:center;justify-content:center;font-size:72px;font-weight:700;color:#fff;background:rgba(0,0,0,0.4);">3</div>
        <div id="postRaceOverlay" class="overlay-postrace" style="position:absolute;left:50%;bottom:15%;transform:translateX(-50%);display:none;">
          <button id="showResultsBtn" class="btn btn-primary btn-memphis" style="position:relative;overflow:hidden;">
            <span>Show Results</span>
            <span id="showResultsProgress" style="position:absolute;left:0;top:0;height:100%;width:0;background:rgba(255,255,255,0.25);transition:width 0.1s;"></span>
          </button>
        </div>
      </div>
  `;
  return el;
}

