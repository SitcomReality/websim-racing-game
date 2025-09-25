/**
 * ShotDefinitions - Defines available camera shots
 */
export const shotDefinitions = {
  starting_lineup: {
    updateRacers: (race, gameState) => {
      // Show all active racers at start
      const activeRacers = race.racers.filter(rid => !(race.results || []).includes(rid));
      return activeRacers.length > 0 ? activeRacers : race.racers;
    },
    margin: 12,
    minSpan: 25,
    lookahead: 0,
    priority: 'wide',
    description: 'Wide shot showing all racers at the start'
  },
  
  leader_focus: {
    updateRacers: (race, gameState) => {
      const activeRacers = race.racers.filter(rid => !(race.results || []).includes(rid));
      const sorted = [...activeRacers].sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
      return sorted.length > 0 ? [sorted[0]] : [];
    },
    margin: 15,
    minSpan: 18,
    lookahead: 2,
    priority: 'medium',
    description: 'Focus on the race leader'
  },
  
  pack_focus: {
    updateRacers: (race, gameState) => {
      const activeRacers = race.racers.filter(rid => !(race.results || []).includes(rid));
      const sorted = [...activeRacers].sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
      // Focus on top 4 racers for better framing
      return sorted.slice(0, Math.min(4, sorted.length));
    },
    margin: 12,
    minSpan: 25,
    lookahead: 2,
    priority: 'wide',
    description: 'Focus on the racing pack'
  },
  
  close_finish: {
    updateRacers: (race, gameState) => {
      const activeRacers = race.racers.filter(rid => !(race.results || []).includes(rid));
      const sorted = [...activeRacers].sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
      return sorted.slice(0, Math.min(3, sorted.length));
    },
    margin: 6,
    minSpan: 12,
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
        return [recentLeadChange.oldLeader, recentLeadChange.newLeader].filter(rid => 
          !(race.results || []).includes(rid)
        );
      }
      
      const activeRacers = race.racers.filter(rid => !(race.results || []).includes(rid));
      const sorted = [...activeRacers].sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
      return sorted.slice(0, Math.min(3, sorted.length));
    },
    margin: 10,
    minSpan: 16,
    lookahead: 1,
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
        const nearbyRacers = race.racers.filter(rid => {
          if ((race.results || []).includes(rid)) return false;
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
      const activeRacers = race.racers.filter(rid => !(race.results || []).includes(rid));
      const sorted = [...activeRacers].sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
      return sorted.slice(0, Math.min(3, sorted.length));
    },
    margin: 8,
    minSpan: 15,
    lookahead: 1,
    priority: 'medium',
    description: 'Focus on finish approach'
  },
  
  finish_focus: {
    updateRacers: (race, gameState) => {
      // Show the most recent finishers
      if (race.results && race.results.length > 0) {
        return race.results.slice(-2);
      }
      // If no one has finished yet, show the leader who's about to finish
      const activeRacers = race.racers.filter(rid => !(race.results || []).includes(rid));
      const sorted = [...activeRacers].sort((a,b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
      return sorted.slice(0, 1);
    },
    margin: 10,
    minSpan: 18,
    lookahead: 0,
    priority: 'medium',
    description: 'Focus on finishers'
  }
};