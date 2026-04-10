/**
 * ShotDefinitions - Defines available camera shots
 */
export const shotDefinitions = {
  starting_lineup: {
    updateRacers: (race, gameState) => {
      const now = performance.now();
      const activeRacers = race.racers.filter(rid => {
        const t = race.finishedAt?.[rid];
        return !t || (Date.now() - t) < 1000;
      }).filter(rid => !(race.results || []).includes(rid));
      return activeRacers.length > 0 ? activeRacers : race.racers;
    },
    margin: 15,
    minSpan: 5,
    lookahead: 0,
    priority: 'wide',
    description: 'Wide shot showing all racers at the start'
  },
  
  leader_focus: {
    updateRacers: (race, gameState) => {
      const active = race.racers.filter(rid => {
        const t = race.finishedAt?.[rid];
        return !t || (Date.now() - t) < 1000;
      }).filter(rid => !(race.results || []).includes(rid));
      const sorted = [...active].sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
      return sorted.length > 0 ? [sorted[0]] : [];
    },
    margin: 6,
    minSpan: 6,
    lookahead: 0.1,
    priority: 'tight',
    tightSpanThreshold: 6,
    description: 'Focus on the race leader'
  },
  
  pack_focus: {
    updateRacers: (race, gameState) => {
      const active = race.racers.filter(rid => {
        const t = race.finishedAt?.[rid];
        return !t || (Date.now() - t) < 1000;
      }).filter(rid => !(race.results || []).includes(rid));
      const sorted = [...active].sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
      return sorted.slice(0, Math.min(4, sorted.length));
    },
    margin: 8,
    minSpan: 12,
    lookahead: 0.08,
    priority: 'medium',
    tightSpanThreshold: 10,
    description: 'Focus on the racing pack'
  },
  
  close_finish: {
    updateRacers: (race, gameState) => {
      const activeRacers = race.racers.filter(rid => !(race.results || []).includes(rid));
      const sorted = [...activeRacers].sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
      return sorted.slice(0, Math.min(3, sorted.length));
    },
    margin: 6,
    minSpan: 10,
    lookahead: 0.05,
    priority: 'tight',
    tightSpanThreshold: 8,
    description: 'Tight focus on close finish'
  },
  
  battle_focus: {
    updateRacers: (race, gameState, raceAnalysis) => {
      const recentLeadChange = raceAnalysis.leadChanges
        .filter(lc => performance.now() - lc.time < 5000)
        .pop();
      if (recentLeadChange) {
        return [recentLeadChange.oldLeader, recentLeadChange.newLeader].filter(rid => {
          const t = race.finishedAt?.[rid];
          const recent = t && (Date.now() - t) < 1500;
          return !((race.results || []).includes(rid)) || recent;
        });
      }
      const active = race.racers.filter(rid => {
        const t = race.finishedAt?.[rid];
        return !t || (Date.now() - t) < 1500;
      }).filter(rid => !(race.results || []).includes(rid));
      const sorted = [...active].sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
      return sorted.slice(0, Math.min(3, sorted.length));
    },
    margin: 8,
    minSpan: 12,
    lookahead: 0.08,
    priority: 'medium',
    tightSpanThreshold: 10,
    description: 'Focus on racing battles'
  },
  
  incident_focus: {
    updateRacers: (race, gameState, raceAnalysis) => {
      const recentStumble = raceAnalysis.stumbles
        .filter(s => performance.now() - s.time < 3000)
        .pop();
      if (recentStumble) {
        const stumblerPos = race.liveLocations[recentStumble.racerId] || 0;
        const nearbyRacers = race.racers.filter(rid => {
          const t = race.finishedAt?.[rid];
          const stillActive = !t || (Date.now() - t) < 1500;
          if ((race.results || []).includes(rid) && !stillActive) return false;
          const pos = race.liveLocations[rid] || 0;
          return Math.abs(pos - stumblerPos) < 12;
        });
        return nearbyRacers.length > 0 ? nearbyRacers : [recentStumble.racerId];
      }
      return shotDefinitions.pack_focus.updateRacers(race, gameState);
    },
    margin: 14,
    minSpan: 20,
    lookahead: 0,
    priority: 'medium',
    description: 'Focus on racing incidents'
  },
  
  finish_approach: {
    updateRacers: (race, gameState) => {
      const active = race.racers.filter(rid => {
        const t = race.finishedAt?.[rid];
        return !t || (Date.now() - t) < 1000;
      }).filter(rid => !(race.results || []).includes(rid));
      const sorted = [...active].sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
      return sorted.slice(0, Math.min(2, sorted.length));
    },
    margin: 4,
    minSpan: 6,
    lookahead: 0,
    priority: 'tight',
    tightSpanThreshold: 6,
    description: 'Focus on finish approach'
  },
  
  finish_focus: {
    updateRacers: (race, gameState) => {
      return []; // use fixed finish-line target for stability
    },
    margin: 4,
    minSpan: 6,
    lookahead: 0,
    priority: 'tight',
    tightSpanThreshold: 6,
    fixedFinishTarget: true,
    description: 'Lock on the finish line and let racers enter the frame'
  }
};