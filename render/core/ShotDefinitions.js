
```
/**
 * ShotDefinitions - Defines available camera shots
 */
export const shotDefinitions = {
  starting_lineup: {
    updateRacers: (race, gameState) => race.racers.filter(rid => !(race.results || []).includes(rid)),
    margin: 15,
    minSpan: 40,
    lookahead: 0,
    priority: 'wide',
    description: 'Wide shot showing all racers at the start'
  },
  
  leader_focus: {
    updateRacers: (race, gameState) => {
      const sorted = race.racers
        .filter(rid => !(race.results || []).includes(rid))
        .sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
      return sorted.length > 0 ? [sorted[0]] : [];
    },
    margin: 20,
    minSpan: 25,
    lookahead: 3,
    priority: 'medium',
    description: 'Focus on the race leader'
  },
  
  pack_focus: {
    updateRacers: (race, gameState) => {
      const sorted = race.racers
        .filter(rid => !(race.results || []).includes(rid))
        .sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
      return sorted.slice(0, Math.min(6, sorted.length));
    },
    margin: 15,
    minSpan: 35,
    lookahead: 2,
    priority: 'wide',
    description: 'Focus on the racing pack'
  },
  
  close_finish: {
    updateRacers: (race, gameState) => {
      const sorted = race.racers
        .filter(rid => !(race.results || []).includes(rid))
        .sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
      return sorted.slice(0, 3);
    },
    margin: 8,
    minSpan: 15,
    lookahead: 1,
    priority: 'tight',
    description: 'Tight focus on close finish'
  },
  
  battle_focus: {
    updateRacers: (race, gameState, raceAnalysis) => {
      const recentLeadChange = raceAnalysis.leadChanges
        .filter(lc => performance.now() - lc.time < 5000)
        .pop();
      
      if (recentLeadChange) {
        return [recentLeadChange.oldLeader, recentLeadChange.newLeader];
      }
      
      const sorted = race.racers
        .filter(rid => !(race.results || []).includes(rid))
        .sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
      return sorted.slice(0, 3);
    },
    margin: 12,
    minSpan: 20,
    lookahead: 2,
    priority: 'medium',
    description: 'Focus on racing battles'
  },
  
  incident_focus: {
    updateRacers: (race, gameState, raceAnalysis) => {
      const recentStumble = raceAnalysis.stumbles
        .filter(s => performance.now() - s.time < 3000)
        .pop();
      
      if (recentStumble) {
        const stumblerPos = race.liveLocations[recentStumble.racerId] || 0;
        return race.racers.filter(rid => {
          const pos = race.liveLocations[rid] || 0;
          return Math.abs(pos - stumblerPos) < 15;
        });
      }
      
      return shotDefinitions.pack_focus.updateRacers(race, gameState);
    },
    margin: 18,
    minSpan: 30,
    lookahead: 0,
    priority: 'medium',
    description: 'Focus on racing incidents'
  },
  
  finish_approach: {
    updateRacers: (race, gameState) => {
      const sorted = race.racers
        .filter(rid => !(race.results || []).includes(rid))
        .sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
      return sorted.slice(0, 4);
    },
    margin: 10,
    minSpan: 20,
    lookahead: 5,
    priority: 'medium',
    description: 'Focus on finish approach'
  },
  
  finish_focus: {
    updateRacers: (race, gameState) => {
      if (race.results && race.results.length > 0) {
        return race.results.slice(-2);
      }
      return race.racers.filter(rid => !(race.results || []).includes(rid));
    },
    margin: 15,
    minSpan: 25,
    lookahead: 0,
    priority: 'medium',
    description: 'Focus on finishers'
  }
};