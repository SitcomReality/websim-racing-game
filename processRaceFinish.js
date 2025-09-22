function processRaceFinish() {
	cancelAnimationFrame(animationFrameId);
	updateRaceHistory(gameState.currentRace.results);
	if (gameState.currentRaceIndex > gameState.settings.weekProperties.numberOfRaces) {
		document.getElementById('startRaceWeek').disabled = false;
		document.getElementById('setupRace').disabled = true;
		console.log("DEBUG: the week was detected ended from beginRace()");
		setStep(4,'done'); setStep(2,'active'); setStatus('Week complete! Start a new Race Week when ready.');
	} else {
		document.getElementById('setupRace').disabled = false;
		document.getElementById('startRace').disabled = true;
		setStep(4,'done'); setStep(3,'active'); setStatus('Race finished. Setup the next race.');
	}
	if (window.canvasRenderer) window.canvasRenderer.stop();
}