function advanceToNextRace() {
	
	gameState.currentRaceIndex++;
	
	/* WE MAKE THE USER MANUALLY START NEW RACE WEEKS.
	This snippet would make a new race week start automatically when trying to start a new race
    if (!gameState.raceWeek || gameState.currentRaceIndex >= gameState.raceWeek.races.length) {
        // Start a new race week if none exists or if the current one is finished
        createNewRaceWeek();
    } */
	
	if (gameState.currentRaceIndex > gameState.settings.weekProperties.numberOfRaces) {
		document.getElementById('startRaceWeek').disabled = false;
		document.getElementById('setupRace').disabled = true;
		document.getElementById('startRace').disabled = true;
		
		console.log("Debug: the week was detected ended from advanceToNextRace()");
		return;
	}
    
    const currentRace = gameState.raceWeek.races[gameState.currentRaceIndex - 1];
	
	document.getElementById('raceNumberThisWeek').innerHTML = gameState.currentRaceIndex;
	document.getElementById('raceNumber').innerHTML =  gameState.raceHistory.length + 1;
    
    // Update the current race in gameState
	/* don't overwrite everything... this requires updating this code every time gameState.currentRace is changed elsewhere/in settings
    gameState.currentRace = {
        id: currentRace.id,
        racers: currentRace.racers.map(racer => racer.id),
        segments: currentRace.track.sections.flatMap(section => Array(gameState.settings.trackProperties.segmentsPerSection).fill(section)),
        results: [],
        winner: null,
        liveLocations: [],
        livePositions: []
    }; */
	
	gameState.currentRace.id = currentRace.id;
	gameState.currentRace.racers = currentRace.racers.map(racer => racer.id);
	gameState.currentRace.segments = currentRace.track.sections.flatMap(section => Array(gameState.settings.trackProperties.segmentsPerSection).fill(section));
	gameState.currentRace.results = [];
	gameState.currentRace.winner = null;
	gameState.currentRace.liveLocations = [];
	gameState.currentRace.livePositions = [];
    
    // Set up the track for the current race
    setupTrack(currentRace.track);
}