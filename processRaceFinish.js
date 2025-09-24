function processRaceFinish() {
	cancelAnimationFrame(animationFrameId);
	
	// Handle racers who didn't finish (DNF)
	const finishedRacers = new Set(gameState.currentRace.results);
	const allRacers = gameState.currentRace.racers;
	
	for (const racerId of allRacers) {
		if (!finishedRacers.has(racerId)) {
			// Mark as DNF and add to results based on current position
			const position = gameState.currentRace.results.length + 1;
			gameState.currentRace.results.push(racerId);
			gameState.racers[racerId].didNotFinish = true;
			gameState.racers[racerId].updateRacerHistory(gameState.currentRace.id, position);
		}
	}
	
	updateRaceHistory(gameState.currentRace.results);
	if (gameState.currentRaceIndex > gameState.settings.weekProperties.numberOfRaces) {
		document.getElementById('startRaceWeek').disabled = false;
		document.getElementById('setupRace').disabled = true;
		console.log("DEBUG: the week was detected ended from beginRace()");
		HUD.setStep(4,'done'); HUD.setStep(2,'active'); HUD.setStatus('Week complete! Start a new Race Week when ready.');
	} else {
		document.getElementById('setupRace').disabled = false;
		document.getElementById('startRace').disabled = true;
		HUD.setStep(4,'done'); HUD.setStep(3,'active'); HUD.setStatus('Race finished. Setup the next race.');
	}
	if (window.renderManager) {
		if (window.renderManager.raceEndCountdown) {
			window.renderManager.raceEndCountdown.active = false;
		}
		window.renderManager.stop();
	}
}