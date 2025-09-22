function updateRaceHistoryLog() {
    const historyLog = document.getElementById('historyLog').querySelector('ul');
    historyLog.innerHTML = ''; // Clear current history 
    gameState.raceHistory.forEach(race => {
        const result = document.createElement('li');
        result.textContent = `Race ${race.id}: Winner - Racer ${race.winner + 1}`;
        historyLog.appendChild(result);
    });
}
function updateRaceHistory(currentRaceResults) {
    gameState.raceHistory.push(currentRaceResults);
    var historyList = document.getElementById('historyList');
    var newListItem = document.createElement('li');

    for (let i = 0; i < currentRaceResults.length; i++) {
        const thisRacer = gameState.racers[currentRaceResults[i]];
        const newPlaceItem = DOMUtils.createRacerGuiElement(currentRaceResults[i], i);
        
        newListItem.appendChild(newPlaceItem);
    }

    historyList.insertBefore(newListItem, historyList.firstChild);
}