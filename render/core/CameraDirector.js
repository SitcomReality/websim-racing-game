/**
 * CameraDirector - Analyzes the race and selects cinematic shots.
 */
export class CameraDirector {
  constructor() {
    this.currentShot = 'starting_lineup';
    this.lastShotChangeTime = 0;
    this.minShotDuration = 4000; // 4 seconds
  }

  getShot(race, gameState) {
    this.updateShot(race, gameState);
    return this.shots[this.currentShot];
  }

  updateShot(race, gameState) {
    const now = performance.now();
    if (now - this.lastShotChangeTime < this.minShotDuration) {
      return; // Avoid changing shots too frequently
    }

    const activeRacers = race.racers.filter(rid => !(race.results || []).includes(rid));
    if (activeRacers.length === 0) {
        this.currentShot = 'leader_focus'; // Default to focusing on winner or last racer
        return;
    }

    const sortedRacers = [...activeRacers].sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
    const leaderId = sortedRacers[0];
    const leaderPos = race.liveLocations[leaderId] || 0;

    // --- Shot Selection Logic ---

    // 1. Close Finish (Highest Priority)
    if (leaderPos > 90 && sortedRacers.length > 1) {
      const secondPos = race.liveLocations[sortedRacers[1]] || 0;
      if (leaderPos - secondPos < 3) { // Racers are very close
        this.setShot('close_finish', now);
        return;
      }
    }

    // 2. Starting Lineup
    if (leaderPos < 10) {
      this.setShot('starting_lineup', now);
      return;
    } 

    // 3. Leader vs Pack
    if (sortedRacers.length > 2) {
        const secondPos = race.liveLocations[sortedRacers[1]] || 0;
        const thirdPos = race.liveLocations[sortedRacers[2]] || 0;
        const leaderGap = leaderPos - secondPos; // Gap between 1st and 2nd
        const packGap = secondPos - thirdPos; // Gap between 2nd and 3rd (indicates pack closeness)

        if(leaderGap > 8 && packGap < 5) {
            // If leader has a big lead and the pack is tight, focus on the leader
            this.setShot('leader_focus', now);
            return;
        }
    }

    // 4. Default to Pack Focus
    this.setShot('pack_focus', now);
  }

  setShot(shotName, time) {
    if (this.currentShot !== shotName) {
      this.currentShot = shotName;
      this.lastShotChangeTime = time;
      this.shots[shotName].racers = []; // Clear racers to be repopulated
    }
  }

  // Shot definitions
  shots = {
    starting_lineup: {
      updateRacers: (race) => race.racers.filter(rid => !(race.results || []).includes(rid)),
      margin: 25, // Increased from 10
      minSpan: 120, // Increased from 80
      lookahead: 0,
    },
    leader_focus: {
      updateRacers: (race) => {
          const sorted = race.racers
            .filter(rid => !(race.results || []).includes(rid))
            .sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
          return sorted.length > 0 ? [sorted[0]] : [];
      },
      margin: 35, // Increased from 20
      minSpan: 50, // Increased from 25
      lookahead: 5,
    },
    pack_focus: {
      updateRacers: (race) => {
          const sorted = race.racers
            .filter(rid => !(race.results || []).includes(rid))
            .sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
          // Frame the top 5 racers or all if fewer
          return sorted.slice(0, 5);
      },
      margin: 25, // Increased from 15
      minSpan: 70, // Increased from 40
      lookahead: 3,
    },
    close_finish: {
      updateRacers: (race) => {
        const sorted = race.racers
            .filter(rid => !(race.results || []).includes(rid))
            .sort((a, b) => (race.liveLocations[b] || 0) - (race.liveLocations[a] || 0));
        // Tightly frame the top 2-3 racers
        return sorted.slice(0, 3);
      },
      margin: 15, // Increased from 5
      minSpan: 25, // Increased from 10
      lookahead: 2,
    },
  };

  /** 
   * Populates the racer list for the current shot based on its update logic.
   * This is needed because the racers change dynamically during the race.
   */
  getShot(race, gameState) {
      this.updateShot(race, gameState);
      const shotDef = this.shots[this.currentShot];
      
      return {
          ...shotDef,
          racers: shotDef.updateRacers(race)
      };
  }
}