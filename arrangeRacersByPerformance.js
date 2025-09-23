function arrangeRacersByPerformance(selectedRacers, gameState) {
    let racerPerformances = [];
    for (let i = 0; i < selectedRacers.length; i++) {
        let racerID = selectedRacers[i];
        let racer = gameState.racers[racerID];
        
        // Skip if racer doesn't exist
        if (!racer) {
            console.warn(`Racer with ID ${racerID} not found in gameState.racers`);
            continue;
        }
        
        let averagePosition = racer.getAverageFinishingPosition(5);
        if (averagePosition <= 0) {
            averagePosition = gameState.settings.racerProperties.totalPoolSize;
        }
        racerPerformances.push({ racerID, averagePosition });
    }

    // If no valid racers found, return empty array
    if (racerPerformances.length === 0) {
        return [];
    }

    // Sort racers by averagePosition, best (low value) to worst (high value)
    racerPerformances.sort((a, b) => a.averagePosition - b.averagePosition);

    // Calculate middle index
    let midIndex = Math.floor(racerPerformances.length / 2);
    let arrangedRacers = new Array(racerPerformances.length);

    // Place the best racer in the middle, and fill outward
    let leftIndex = midIndex - 1;
    let rightIndex = midIndex + 1;
    arrangedRacers[midIndex] = racerPerformances[0].racerID; // Best racer in the middle

    for (let i = 1; i < racerPerformances.length; i++) {
        if (i % 2 === 1) {
            // Place next best racer to the left, then the right, alternately
            arrangedRacers[leftIndex] = racerPerformances[i].racerID;
            leftIndex--;
        } else {
            arrangedRacers[rightIndex] = racerPerformances[i].racerID;
            rightIndex++;
        }
    }

    return arrangedRacers;
}