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
            // Keep ferret in crash/recovery animation during stumble
            if (thisRacer.ferret) {
                thisRacer.ferret.isStumbling = true;
                thisRacer.ferret.gait.stride = 0.2; // Very minimal movement while stumbling
                thisRacer.ferret.gait.cyclePhase += 0.3; // Erratic movement
            }
        } else {
            if (thisRacer.stats.stumbleChance < Math.random()) {
                // Handle boost logic
                if (!thisRacer.isBoosting && thisRacer.remainingBoost > 0 && percentRaceComplete > thisRacer.stats.boostActivationPercent) {
                  if (Math.random() > 0.4) {
                    thisRacer.activateBoost();
                    // Update animation for boost state
                    if (thisRacer.ferret) {
                      thisRacer.ferret.gait.stride *= 1.3; // Longer stride during boost
                    }
                  }
                }

                if (thisRacer.isBoosting) {
                  thisRacer.reduceRemainingBoost(1);
                  if (thisRacer.remainingBoost < 1) {
                    thisRacer.deactivateBoost();
                    // Reset stride length after boost
                    if (thisRacer.ferret) {
                      thisRacer.ferret.gait.stride /= 1.3;
                    }
                  }
                }

                const distanceToTravel = updateRacerPosition(racerId, currentSegment, percentRaceComplete);
                let nextPosition = currentMarginLeft + distanceToTravel;
                
                // Update live location for canvas rendering
                gameState.currentRace.liveLocations[racerId] = nextPosition;
                
                // Update animation cycle for this ferret
                if (thisRacer.ferret) {
                  const currentSpeed = thisRacer.calculateSpeed(thisRacer.formThisWeek, percentRaceComplete, segmentType, gameState.currentRace.weather);
                  const baseSpeed = gameState.settings.racerProperties.speedBase;
                  const speedRatio = currentSpeed / baseSpeed;
                  thisRacer.ferret.gait.cyclePhase += speedRatio * 0.02;
                  thisRacer.ferret.isStumbling = false; // Normal running
                }
                
                if (!thisRacer.isExhausted) {
                  thisRacer.reduceRemainingEndurance((thisRacer.stats.ground[segmentType] * distanceToTravel) * gameState.settings.racerProperties.enduranceDrainMultiplier);
                  if (thisRacer.remainingEndurance < 1) {
                    thisRacer.makeExhausted();
                    // Reduce stride when exhausted
                    if (thisRacer.ferret) {
                      thisRacer.ferret.gait.stride *= 0.7;
                    }
                  }
                }
            } else {
                // Ferret stumbles - trigger crash animation and particles
                thisRacer.remainingStumble = thisRacer.stats.stumbleDuration;
                
                if (thisRacer.ferret) {
                    thisRacer.ferret.isStumbling = true;
                    thisRacer.ferret.crashPhase = 0; // Start crash animation
                    thisRacer.ferret.gait.stride = 0.1; // Almost no forward movement
                }
                
                const laneIndex = gameState.currentRace.racers.indexOf(racerId);
                const color = getGroundParticleColor(segmentType, 0.25);
                if (window.canvasRenderer && laneIndex >= 0) {
                  const screen = window.canvasRenderer.worldToScreen(currentMarginLeft, laneIndex);
                  // Enhanced particle effects for ferret crash
                  window.canvasRenderer.particleSystem.emit(screen.x, screen.y, 0, 200, 32, color, { spread: 1.5, forwardBoost: 0.9 });
                  window.canvasRenderer.particleSystem.emit(screen.x, screen.y, Math.PI, 140, 8, color, { spread: 0.8, forwardBoost: 0.4 });
                  // Add some debris particles
                  window.canvasRenderer.particleSystem.emit(screen.x, screen.y, -Math.PI/4, 120, 6, 'rgba(139,69,19,0.8)', { spread: 0.6, forwardBoost: 0.3 });
                }
            }
        }
    }

    function race() {
        // Check if race should end early
        if (window.canvasRenderer && window.canvasRenderer.raceEndCountdown && window.canvasRenderer.raceEndCountdown.active) {
            const timeLeft = Math.max(0, Math.ceil((window.canvasRenderer.raceEndCountdown.endTime - performance.now()) / 1000));
            if (timeLeft <= 0) {
                // Race should end, don't continue updating positions
                return;
            }
        }

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