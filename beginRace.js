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

        // Assuming distance traveled needs to be calculated as speed per segment
        let distanceTraveled = currentSpeed;
        distanceTraveled = distanceTraveled / (100 * totalSegments);

        return distanceTraveled;
    }

    function handleRacerMovement(racerId, currentRacerElem, currentSegment, currentMarginLeft, totalSegments) {
        let thisRacer = gameState.racers[racerId];        
        const percentRaceComplete = (currentSegment / totalSegments) * 100;
        const percentEnduranceUsed = Math.floor(100 - ((thisRacer.remainingEndurance / thisRacer.stats.endurance) * 100));
        const segmentType = gameState.currentRace.segments[currentSegment] || 'Grass';

        if (thisRacer.remainingStumble > 1) {
            thisRacer.remainingStumble -= 1;
        } else {
            if (thisRacer.stats.stumbleChance < Math.random()) {
                currentRacerElem.classList.remove("stumbling");

                if (!thisRacer.isBoosting && thisRacer.remainingBoost > 0 && percentRaceComplete > thisRacer.stats.boostActivationPercent) {
                    if (Math.random() > 0.4) {
                        thisRacer.activateBoost();
                        currentRacerElem.classList.add("boosting");
                    }
                }

                if (thisRacer.isBoosting) {
                    thisRacer.reduceRemainingBoost(1);
                    if (thisRacer.remainingBoost < 1) {
                        thisRacer.deactivateBoost();
                        currentRacerElem.classList.remove("boosting");
                    }
                }

                const distanceToTravel = updateRacerPosition(racerId, currentSegment, percentRaceComplete);
                let nextPosition = currentMarginLeft + distanceToTravel;
                currentRacerElem.style.left = `${nextPosition}%`;
                
                if (!thisRacer.isExhausted) {
                    thisRacer.reduceRemainingEndurance((thisRacer.stats.ground[segmentType] * distanceToTravel) * gameState.settings.racerProperties.enduranceDrainMultiplier);
                    if (thisRacer.remainingEndurance < 1) {
                        thisRacer.makeExhausted();
                    }
                }
                const enduranceElement = currentRacerElem.querySelector(".remainingEndurance");
                enduranceElement.style.bottom = percentEnduranceUsed + "%";
                
                thisRacer.shadowDistance = thisRacer.shadowDistance + (distanceToTravel / 50000);
                updateBoxShadowX(currentRacerElem, thisRacer.shadowDistance);

                gameState.currentRace.liveLocations[racerId] = nextPosition;                
            } else {
                thisRacer.remainingStumble = thisRacer.stats.stumbleDuration;
                currentRacerElem.classList.add("stumbling");
            }
        }

        updateLivePositionDisplayIndividual(racerId);
    }

    function race() {
        gameState.currentRace.racers.forEach(racerId => {
            const currentRacerElem = document.getElementById(`racer${racerId}`);
            currentRacerElem.classList.remove("startingLine");
            let currentMarginLeft = parseFloat(currentRacerElem.style.left) || 0;
            const totalSegments = gameState.currentRace.segments.length;
            const currentSegment = Math.floor((currentMarginLeft / 100) * totalSegments);
            if (currentSegment < totalSegments - 1) {
                handleRacerMovement(racerId, currentRacerElem, currentSegment, currentMarginLeft, totalSegments);
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