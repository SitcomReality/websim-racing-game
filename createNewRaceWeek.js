function createNewRaceWeek() {
	
	const raceWeekInfoSection1 = document.getElementById("raceWeekInfoSection1"); 
	const raceWeekInfoSection2 = document.getElementById("raceWeekInfoSection2");
	const raceWeekInfoSection3 = document.getElementById("raceWeekInfoSection3");
	raceWeekInfoSection1.innerHTML = "";
	raceWeekInfoSection2.innerHTML = "";
	raceWeekInfoSection3.innerHTML = "";
	
	gameState.raceWeekCounter++;
    // Create a new RaceWeek object
    const raceWeek = new RaceWeek(gameState.raceWeekCounter, gameState.settings);

    // Define the number of races in the week
    const numberOfRacesInWeek = gameState.settings.weekProperties.numberOfRaces;
	
	// Now the number of raceRs
	const numRacersThisWeek = getRandomInt(gameState.settings.weekProperties.uniqueRacersMin, gameState.settings.weekProperties.uniqueRacersMax);
	const selectedRacers = generateUniqueNumbers(0, gameState.settings.racerProperties.totalPoolSize - 1, numRacersThisWeek);

	for (let i = 0; i < selectedRacers.length; i++) {
		gameState.racers[selectedRacers[i]].formThisWeek = getRandomMultiplier(gameState.racers[selectedRacers[i]].stats.formVariation);
	}
	
	
	const numOfUniqueTracks = getRandomInt(gameState.settings.weekProperties.uniqueTracksMin, gameState.settings.weekProperties.uniqueTracksMax);
	let selectedTracks = generateUniqueNumbers(0, gameState.tracks.length - 1, numOfUniqueTracks);
	console.log(numOfUniqueTracks);
	
	/*
	while (selectedTracks.length < numberOfRacesInWeek) {
	  selectedTracks.push(...selectedTracks.slice(0, numberOfRacesInWeek - selectedTracks.length));
	} 
	*/
	while (selectedTracks.length < numberOfRacesInWeek) {
		const nextTrackIndex = selectedTracks.length % numOfUniqueTracks;
		selectedTracks.push(selectedTracks[nextTrackIndex]);
	}
	selectedTracks = shuffleArray(selectedTracks);
	
    // Create tracks and races and add them to the race week
    for (let raceIndex = 0; raceIndex < numberOfRacesInWeek; raceIndex++) {
		const track = gameState.tracks[selectedTracks[raceIndex]];
		
		if (track === undefined || track === "" || track === null) {
				console.log("Error: Failed to get the correct track for this week.");
				console.log("numberOfRacesInWeek: "+numberOfRacesInWeek);
				console.log("raceIndex: "+raceIndex);
				console.log("selectedTracks "+selectedTracks);
				console.log("selectedTracks[raceIndex]: "+selectedTracks[raceIndex]);
		}
	
        const selectedRacersIndexes = generateUniqueNumbers(0,selectedRacers.length-1,gameState.settings.trackProperties.numberOfLanes); // Choose racers as needed
		const racesListDom = document.createElement('li');
		const racesListDomInnerList = document.createElement('ul');
		
		let racersSelectedForThisRace = [];
		for (let racerIndex = 0; racerIndex < selectedRacersIndexes.length; racerIndex++) {
			
			if (selectedRacersIndexes[racerIndex] < 0 || selectedRacersIndexes[racerIndex] >= selectedRacers.length) {
				console.log("Error: Invalid index for selectedRacers");
				console.log("selectedRacers: "+selectedRacers);
				console.log("selectedRacersIndexes: "+selectedRacersIndexes);
				console.log("selectedRacersIndexes[racerIndex]: "+selectedRacersIndexes[racerIndex]);
				console.log("selectedRacers[selectedRacersIndexes[racerIndex]]: "+selectedRacers[selectedRacersIndexes[racerIndex]]);
			}
			racersSelectedForThisRace.push(selectedRacers[selectedRacersIndexes[racerIndex]]);

			const selectedRacerListDom = document.createElement('li');
			selectedRacerListDom.append(DOMUtils.createRacerGuiElement(gameState.racers[selectedRacers[selectedRacersIndexes[racerIndex]]].id));
			racesListDomInnerList.appendChild(selectedRacerListDom);
		}
        
        // Create a new Race object with the track
        const race = new Race(raceIndex, racersSelectedForThisRace, track);
		racesListDom.innerHTML = (race.id + 1)+": "+track.name;
		racesListDom.appendChild(racesListDomInnerList);

        // Add the race to the race week
        raceWeek.addRace(race);
		raceWeekInfoSection1.appendChild(racesListDom);
    }
	raceWeek.selectedRacers = selectedRacers;

    // Store the race week in gameState
    gameState.raceWeek = raceWeek;
    gameState.currentRaceIndex = 0;
	
	document.getElementById("raceWeekNumber").innerHTML = gameState.raceWeekCounter;
}