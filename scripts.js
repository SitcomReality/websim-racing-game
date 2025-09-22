function setupBettingOptions() {
    // Populate selectRacer dropdown
    const racerSelect = document.getElementById('selectRacer');
    racerSelect.innerHTML = '';  // Clear existing options
    gameState.racers.forEach((racer, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.text = `Racer ${index + 1} - ${racer.name}`;
        racerSelect.appendChild(option);
    });
}

function setupRace() {
    document.getElementById('setupRace').disabled = true;
    document.getElementById('startRace').disabled = false;
    advanceToNextRace();
}


function startRace() {
	document.getElementById('setupRace').disabled = true;
	document.getElementById('startRace').disabled = true;
	
	gameState.running = true;
	beginRace();
	
    if (gameState.settings.autoStart) {
        // pick racers randomly for the race
        gameState.currentRace.racers = selectRacersForRace();
        // simulates a race and determines a winner.
        gameState.currentRace.winner = determineRaceWinner(gameState.currentRace.racers);
        gameState.raceHistory.push({...gameState.currentRace});
        // Clear current race data
        gameState.currentRace = { id: null, racers: [], winner: null };
        updateDisplay();
    }
}

function placeBet(racerId, betAmount) {
    if (gameState.player.balance >= betAmount) {
        gameState.player.balance -= betAmount;
        const betOutcome = racerId === gameState.currentRace.winner ? "win" : "lose";
        if (betOutcome === "win") {
            gameState.player.balance += betAmount * 2;  // Double the bet for winning
        }
        updateBalanceDisplay();
    } else {
        console.log('Insufficient balance.');
    }
}

function updateDisplay() {
    // Update racer options, balance, and history logs based on gameState
    updateBalanceDisplay();
    updateRaceHistoryLog();
}

function updateBalanceDisplay() {
    document.getElementById('playerBalance').textContent = `$${gameState.player.balance}`;
}



function calculateRandomStat(base, variance) {
    // Implement random stat calculation based on base and variance
    // Example: return base + Math.random() * variance;
    return /* calculated stat */;
}

function getOtherStatName(currentStatName) {
    const statNames = ['endurance', 'exhaustionMultiplier', 'boostPower', 'boostDuration', 'stumbleChance', 'stumbleDuration'];
	// 'formVariation', 'boostActivationPercent',
    const remainingStats = statNames.filter(statName => statName !== currentStatName);
    return remainingStats[Math.floor(Math.random() * remainingStats.length)];
}