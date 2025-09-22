function processRacerFinish(racerId) {
	const racer = gameState.racers[racerId];
    racer.visual.finished = true;

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
}