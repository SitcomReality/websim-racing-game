// Helper function to get a random value within a range
function getRandomValue(base, variance) {
    const min = base - variance;
    const max = base + variance;
    return truncateToDecimals(Math.random() * (max - min) + min, 3);
}

// Helper function to get a random integer between min (inclusive) and max (inclusive)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to get a random item from an array
function getRandomElement(suppliedArray) {
    const randomIndex = Math.floor(Math.random() * suppliedArray.length);
    return suppliedArray[randomIndex];
}

// Helper function to shuffle elements in an array
function shuffleArray(suppliedArray) {
    for (let i = suppliedArray.length - 1; i > 0; i--) {
		console.log(suppliedArray);
        const j = Math.floor(Math.random() * (i + 1));
        [suppliedArray[i], suppliedArray[j]] = [suppliedArray[j], suppliedArray[i]];
    }
	return suppliedArray;
}

// Helper function to generate a set of unique numbers
function generateUniqueNumbers(min, max, count) {
    let uniqueNumbers = [];
    while (uniqueNumbers.length < count) {
        let randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        if (!uniqueNumbers.includes(randomNumber)) {
            uniqueNumbers.push(randomNumber);
        }
    }
    return uniqueNumbers;
}

// Helper function to generate random modifiers for given types
function generateRandomModifiers(types, variance) {
    const modifiers = {};
    types.forEach(type => {
        modifiers[type] = getRandomValue(1, variance);
    });
    return modifiers;
}

// Helper function for trimming long floats because .toFixed() returns strings like some kind of maniac
function truncateToDecimals(num, dec = 2) {
    const calcDec = Math.pow(10, dec);
    return Math.trunc(num * calcDec) / calcDec;
}

// Helper function to check whether a value exists within an array
function isValueExists(value, suppliedArray) {
    return suppliedArray.includes(value);
}

// Used to set the racer's weekly form
function getRandomMultiplier(mulitiplierVariation, maxVal = 0.9, minVal = 1.1) {
    // Box-Muller transform to generate a random number following a normal distribution
    function generateGaussianRandom() {
        let u = 0, v = 0;
        while(u === 0) u = Math.random(); // Convert [0,1) to (0,1)
        while(v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    // Generate a form value
    let mean = 1;
    let standardDeviation = mulitiplierVariation;
    let gaussianRandom = generateGaussianRandom();
    
    // Calculate the form value
    let multiplierValue = mean + gaussianRandom * standardDeviation;
    
    // Ensure formValue is close to 1
    multiplierValue = Math.max(0.9, Math.min(1.1, multiplierValue));
    
    return multiplierValue;
}

// Get an average of all the base values in gameState.settings.[category]Properties
function calculateBasePropertyAverage(category) {
    let sum = 0;
    let count = 0;
    for (const property in category) {
        if (property.endsWith('Base')) {
            sum += category[property];
            count++;
        }
    }
    return count > 0 ? sum / count : 0;
}






function updateBoxShadowX(element, newXValue) {
	//console.log("...racer...shadowDistance");
	console.log("newXValue: "+newXValue);
	
    // Get the current box-shadow value
    let boxShadow = element.style.boxShadow || getComputedStyle(element).boxShadow;
    
    let regex = /(rgba?\([^\)]+\)|#[0-9a-fA-F]{3,6})\s(-?\d+px)\s(-?\d+px)\s(-?\d+px)(\s-?\d+px)?/;
    let match = boxShadow.match(regex);
    
    if (match) {
	// Extract parts from the regex match
        let color = match[1];
        let offsetX = match[2];
        let offsetY = match[3];
		let blurRadius = match[4];
       // let blurRadius = newBlurValue + 'px';
        let spreadRadius = match[5] ? match[5] : '';
		
		offsetX = Math.floor(parseFloat(offsetX) - newXValue);
		console.log("offsetX: "+offsetX);
		offsetX = offsetX + "px";
		
        // Reconstruct the box-shadow value
        let newBoxShadow = `${color} ${offsetX} ${offsetY} ${blurRadius} ${spreadRadius}`.trim();

        // Set the new box-shadow value
        element.style.boxShadow = newBoxShadow;
    } else {
        console.error("Failed to parse box-shadow value:", boxShadow);
    }
}









// End the race early if it's taking too long
function endRaceEarly() {
    
    // Create an array to store racer progress
    const racersProgress = gameState.currentRace.racers.map(racerId => {
        const currentRacerElem = document.getElementById(`racer${racerId}`);
        const currentLeft = parseFloat(currentRacerElem.style.left) || 0;
        return {racerId, currentLeft};
    });

    // Sort the racers by their progress (descending order)
    racersProgress.sort((a, b) => b.currentLeft - a.currentLeft);

    // Process the racers who have not finished yet
    racersProgress.forEach(({racerId}) => {
        if (!gameState.currentRace.results.includes(racerId)) {
            gameState.currentRace.results.push(racerId);
            const currentRacerElem = document.getElementById(`racer${racerId}`);
			const raceEndPoint = 100 - currentRacerElem.width;
            currentRacerElem.style.left = raceEndPoint+'%'; // Visual representation of finished
            const laneRacer = document.getElementById(`laneRacer${racerId}`);
            laneRacer.className = `lane laneResult${gameState.currentRace.results.length}`;
            gameState.racers[racerId].updateRacerHistory(gameState.currentRace.id, gameState.currentRace.results.length);
        }
    });

	processRaceFinish();
}


// A debug/dev helper function to show a certain stat of all racers
function showRacerStats(attribute, showOnlyThisWeek) {
	
	if (!showOnlyThisWeek) {
		racers = gameState.racers;
	}
	else {
		racers = [];
		for (i = 0; i < gameState.raceWeek.selectedRacers.length; i++) {
			racers.push(gameState.racers[gameState.raceWeek.selectedRacers[i]]);
		}
	}
    // Assuming racers is the array containing all racer objects.
    racers.forEach(racer => {
        // Split key by period to check for nested properties
        const keys = attribute.split(".");
        let value = racer;

        // Drill down into the nested properties
        keys.forEach(key => {
            if (value) {
                value = value[key];
            }
        });

        // Output the result to the console
        console.log(value);
    });
}