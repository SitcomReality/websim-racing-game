function initGame() {

	const avgSpeed = 
		gameState.settings.racerProperties.speedBase *
		calculateBasePropertyAverage(gameState.settings.weatherProperties) *
		calculateBasePropertyAverage(gameState.settings.groundProperties) *
		calculateBasePropertyAverage(gameState.settings.thirdProperties);
	
	// define the average speed using the calculated values from settings
	gameState.racerPerformance.baseline.averageSpeed = avgSpeed;
	
	
	// use the avg speed calculation to set the base endurance for the racers
	const averageTrackLength = ((gameState.settings.trackProperties.minSectionsPerTrack + gameState.settings.trackProperties.maxSectionsPerTrack) / 2) * gameState.settings.trackProperties.segmentsPerSection;
	gameState.settings.racerProperties.enduranceBase = Math.floor(((avgSpeed * gameState.settings.racerProperties.speedMultiplier) * averageTrackLength) * gameState.settings.racerProperties.enduranceInitialValueMultiplier);
	gameState.settings.racerProperties.enduranceVariance = Math.floor(gameState.settings.racerProperties.enduranceBase * 0.15);
	

	gameState.racers = generateNewRacers(gameState.settings.racerProperties.totalPoolSize);
	
	let trackNamePrefixes = [];
	let trackNameSuffixes = [];
	
	const trackNamePrefixesId = generateUniqueNumbers(0, racerNamePrefixes.length - 1, gameState.settings.trackProperties.totalPoolSize);
	const trackNameSuffixesId = generateUniqueNumbers(0, locationSuffixes.length - 1, gameState.settings.trackProperties.totalPoolSize);

	for (let i = 0; i < gameState.settings.trackProperties.totalPoolSize; i++) {
        // Generate a track		
		const trackName = racerNamePrefixes[trackNamePrefixesId[i]] + " " + locationSuffixes[(trackNameSuffixesId[i])];
        const track = new Track(i, trackName, gameState.settings.trackProperties.numberOfSections);
		gameState.tracks.push(track);
	}
	
	// Initialize other elements like starting money, settings, etc.	
	document.getElementById('introScreen').remove();
}

export { initGame };