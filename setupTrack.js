function setupTrack(track) {
    document.getElementById('setupRace').disabled = true;
    document.getElementById('startRace').disabled = false;
    const trackDom = document.getElementById('raceTrack');
    trackDom.innerHTML = '';
	gameState.currentRace.trackName = track.name;
	gameState.currentRace.sections = [];
	gameState.currentRace.segments = [];
    for (let section = 0; section < track.sections.length; section++) {
		 gameState.currentRace.sections.push(track.sections[section]);
		 // Each section is three segments... so... this is how I'm doing this
		 gameState.currentRace.segments.push(track.sections[section]);
		 gameState.currentRace.segments.push(track.sections[section]);
		 gameState.currentRace.segments.push(track.sections[section]);
    }
	gameState.currentRace.segments.push("finishLine");
	gameState.currentRace.weather = gameState.settings.worldProperties.weatherTypes[Math.floor(Math.random() * gameState.settings.worldProperties.weatherTypes.length)] || 'Sunny';
    gameState.currentRace.racers = [];
    gameState.currentRace.results = [];
    gameState.currentRace.winner = null;
	DOMUtils.updateTrackDetails();
	const selectedRacers = gameState.raceWeek.selectedRacers;
    const arrangedRacers = arrangeRacersByPerformance(selectedRacers, gameState);
    for (let i = 0; i < gameState.settings.trackProperties.numberOfLanes; i++) {
        const thisRacerID = arrangedRacers[i];
        const thisRacer = gameState.racers[thisRacerID];
        gameState.currentRace.racers[i] = thisRacerID;
        const lane = DOMUtils.createLane(thisRacerID, track.sections, gameState.settings.trackProperties.segmentsPerSection);
        trackDom.appendChild(lane);
        const totalSegments = gameState.settings.trackProperties.numberOfSegments;
		const racer = DOMUtils.createRacerElement(thisRacer, thisRacerID, racerNamePrefixes[thisRacer.name[0]], racerNameSuffixes[thisRacer.name[1]], totalSegments);
        thisRacer.reset();
        lane.appendChild(racer);
    }
    gameState.currentRace.liveLocations = [];
    gameState.currentRace.livePositions = [];
}