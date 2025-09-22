function updateLivePositionDisplayIndividual(racerid) {
    if (gameState.currentRace.results.length < gameState.settings.trackProperties.numberOfLanes) {
        const liveLocations = gameState.currentRace.liveLocations;
        // Create a new array and populate it with the racerids in order from largest currentLocation to smallest
        const sortedRacerIds = Object.keys(liveLocations).sort((a, b) => liveLocations[b] - liveLocations[a]);
        // Check if racerid exists in sortedRacerIds
        if (sortedRacerIds.includes(racerid.toString())) {
            const racerPosition = sortedRacerIds.indexOf(racerid.toString()) + 1;
            // Get the DOM element corresponding to this racer's lane.
            const thisRacerLane = document.getElementById(`laneRacer${racerid}`); 
            // First, remove any existing livePosition classes
            for (let i = 1; i <= sortedRacerIds.length; i++) {
                thisRacerLane.classList.remove(`livePosition${i}`);
            }
            // Then, add the new livePosition class based on the current racer's position
            thisRacerLane.classList.add(`livePosition${racerPosition}`);
        } else {
            console.log(`Error: Racer ${racerid} not found in sortedRacerIds`);
        }
        // Update live leaderboard (top 5)
        const leaderList = document.getElementById('leaderList');
        if (leaderList) {
            leaderList.innerHTML = '';
            sortedRacerIds.slice(0,5).forEach((rid, i) => {
                const li = document.createElement('li');
                const r = gameState.racers[parseInt(rid,10)];
                li.textContent = `${i+1}. ${window.racerNamePrefixes[r.name[0]]} ${window.racerNameSuffixes[r.name[1]]}`;
                leaderList.appendChild(li);
            });
        }
    }
}