import { calculateBasePropertyAverage, generateUniqueNumbers } from './src/utils/helpers.js';
import { Racer } from './src/entities/racer/Racer.js';
import { Track } from './Track.js';

// Import locationSuffixes from the constants file
import { locationSuffixes } from './wordlist/const_locationSuffixes.js';

window.Track = Track; // for save/load compatibility

function initGame(gameState) {
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
	

	gameState.racers = generateNewRacers(gameState.settings.racerProperties.totalPoolSize, gameState.settings);
	
	let trackNamePrefixes = [];
	let trackNameSuffixes = [];
	
	const trackNamePrefixesId = generateUniqueNumbers(0, window.racerNamePrefixes.length - 1, gameState.settings.trackProperties.totalPoolSize);
	const trackNameSuffixesId = generateUniqueNumbers(0, locationSuffixes.length - 1, gameState.settings.trackProperties.totalPoolSize);

	for (let i = 0; i < gameState.settings.trackProperties.totalPoolSize; i++) {
        const trackName = window.racerNamePrefixes[trackNamePrefixesId[i]] + " " + window.locationSuffixes[(trackNameSuffixesId[i])];
        const min = gameState.settings.trackProperties.minSectionsPerTrack;
        const max = gameState.settings.trackProperties.maxSectionsPerTrack;
        const numSections = Math.floor(Math.random() * (max - min + 1)) + min;
        const track = new Track(i, trackName, numSections, gameState.settings.worldProperties.groundTypes);
		gameState.tracks.push(track);
	}
	
	// Initialize other elements like starting money, settings, etc.	
	document.getElementById('introScreen').remove();
}

function generateNewRacers(numberToGenerate, settings) {
	const racers = [];
	const namePrefixNumber = generateUniqueNumbers(0, window.racerNamePrefixes.length - 1, numberToGenerate);
	const nameSuffixNumber = generateUniqueNumbers(0, window.racerNameSuffixes.length - 1, numberToGenerate);
	for (let i = 0; i < numberToGenerate; i++) {
        const name = window.racerNamePrefixes[namePrefixNumber[i]] + ' ' + window.racerNameSuffixes[nameSuffixNumber[i]];
		const colors = [
			Math.floor(Math.random() * 31),
			Math.floor(Math.random() * 31),
			Math.floor(Math.random() * 31),
		];
		racers.push(new Racer(i, name, colors, settings));
	}
	return racers;
}

export { initGame };