let animationFrameId;

function beginRace() {
    if (!gameState.running) {
        cancelAnimationFrame(animationFrameId);
        return;
    }

    function updateRacerPosition(racerId, segmentIndex, percentRaceComplete) {
        const totalSegments = gameState.currentRace.segments.length;
        const segmentType = gameState.currentRace.segments[segmentIndex] || 'Grass';
        const groundType = segmentType;
        const weatherType = gameState.currentRace.weather || 'Sunny';
        const racer = gameState.racers[racerId];
        const currentForm = racer.formThisWeek;
        const currentSpeed = racer.calculateSpeed(currentForm, percentRaceComplete, groundType, weatherType);

        let distanceToTravel = currentSpeed;
        distanceToTravel = distanceToTravel / (100 * totalSegments);

        return distanceToTravel;
    }

    function handleRacerMovement(racerId, currentMarginLeft, currentSegment, totalSegments) {
        let thisRacer = gameState.racers[racerId];        
        const percentRaceComplete = (currentMarginLeft / 100) * 100;
        const percentEnduranceUsed = Math.floor(100 - ((thisRacer.remainingEndurance / thisRacer.stats.endurance) * 100));
        const segmentType = gameState.currentRace.segments[currentSegment] || 'Grass';

        if (thisRacer.remainingStumble > 1) {
            thisRacer.remainingStumble -= 1;
        } else {
            if (thisRacer.stats.stumbleChance < Math.random()) {
                // Handle boost logic
                if (!thisRacer.isBoosting && thisRacer.remainingBoost > 0 && percentRaceComplete > thisRacer.stats.boostActivationPercent) {
                    if (Math.random() > 0.4) {
                        thisRacer.activateBoost();
                    }
                }

                if (thisRacer.isBoosting) {
                    thisRacer.reduceRemainingBoost(1);
                    if (thisRacer.remainingBoost < 1) {
                        thisRacer.deactivateBoost();
                    }
                }

                const distanceToTravel = updateRacerPosition(racerId, currentSegment, percentRaceComplete);
                let nextPosition = currentMarginLeft + distanceToTravel;
                
                // Update live location for canvas rendering - this is the key change
                gameState.currentRace.liveLocations[racerId] = nextPosition;
                
                if (!thisRacer.isExhausted) {
                    thisRacer.reduceRemainingEndurance((thisRacer.stats.ground[segmentType] * distanceToTravel) * gameState.settings.racerProperties.enduranceDrainMultiplier);
                    if (thisRacer.remainingEndurance < 1) {
                        thisRacer.makeExhausted();
                    }
                }
            } else {
                thisRacer.remainingStumble = thisRacer.stats.stumbleDuration;
            }
        }
    }

    function race() {
        gameState.currentRace.racers.forEach(racerId => {
            const totalSegments = gameState.currentRace.segments.length;
            const currentMarginLeft = gameState.currentRace.liveLocations[racerId] || 0;
            const currentSegment = Math.floor((currentMarginLeft / 100) * totalSegments);
            
            if (currentSegment < totalSegments - 1) {
                handleRacerMovement(racerId, currentMarginLeft, currentSegment, totalSegments);
            } else {
                if (!gameState.currentRace.results.includes(racerId)) {
                    processRacerFinish(racerId);
                }
            }
        });

        if (gameState.currentRace.racers.length === gameState.currentRace.results.length) {
            processRaceFinish();
        } else {
            if (gameState.running) {
                animationFrameId = requestAnimationFrame(race);
            }
        }
    }

    if (gameState.running) {
        animationFrameId = requestAnimationFrame(race);
    }
}