function processRacerFinish(racerId) {
	const currentRacerElem = document.getElementById(`racer${racerId}`);
	
	gameState.currentRace.results.push(racerId);
	console.log(`${gameState.currentRace.results.length}: Racer: ${racerId}. Odds: ${gameState.racers[racerId].baseBettingOdds} | Payout: $${gameState.racers[racerId].generateWinningPayout(10)}`);
	
	let winLoseResult;
	if (gameState.currentRace.results.length == 1) {
		winLoseResult = "win";
	}
	else {
		winLoseResult = "lose";
	}
	gameState.racers[racerId].addRaceResult(gameState.currentRace.weather, 20, winLoseResult);
	
	gameState.racers[racerId].updateRacerHistory(gameState.currentRace.id, gameState.currentRace.results.length);
	const raceEndPoint = 100 - currentRacerElem.width;
	currentRacerElem.style.left = raceEndPoint + '%'; // Visual representation of finished
	currentRacerElem.classList.add("finished");
	const laneRacer = document.getElementById(`laneRacer${racerId}`);
	laneRacer.className = `lane laneResult${gameState.currentRace.results.length}`;
}