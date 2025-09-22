function processRaceFinish() {
	cancelAnimationFrame(animationFrameId);
	updateRaceHistory(gameState.currentRace.results);
	if (gameState.currentRaceIndex > gameState.settings.weekProperties.numberOfRaces) {
		document.getElementById('startRaceWeek').disabled = false;
		document.getElementById('setupRace').disabled = true;
		console.log("DEBUG: the week was detected ended from beginRace()");
	} else {
		document.getElementById('setupRace').disabled = false;
		document.getElementById('startRace').disabled = true;
	}
}