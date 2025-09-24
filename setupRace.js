// Provide a legacy-compatible global setupRace function.
// Determines the current race and calls the shared setupTrack function.

(function() {
  function setupRaceLegacy() {
    const gs = window.gameState;
    if (!gs) {
      console.warn('setupRace: gameState not available yet');
      return;
    }

    // Prefer raceWeek-defined race if present
    const raceWeek = gs.raceWeek;
    let race = null;
    if (raceWeek && Array.isArray(raceWeek.races) && typeof gs.currentRaceIndex === 'number') {
      race = raceWeek.races[gs.currentRaceIndex];
    }

    // Fallback: use currentRace.track if set
    if (!race && gs.currentRace && gs.currentRace.track) {
      race = gs.currentRace;
    }

    if (!race || !race.track) {
      console.warn('setupRace: No race or track found to setup');
      return;
    }

    if (typeof window.setupTrack === 'function') {
      window.setupTrack(race.track);
    } else {
      console.error('setupRace: setupTrack function is not available');
    }
  }

  window.setupRace = setupRaceLegacy;
})();
```