class EventHandlers {
    static initializeGame() {
        const initGameBtn = document.getElementById('initGame');
        if (initGameBtn) {
            initGameBtn.addEventListener('click', function() {
                if (window.eventBus && typeof window.eventBus.emit === 'function') {
                    window.eventBus.emit('game:initialize');
                } else if (typeof window.initGame === 'function') {
                    window.initGame(window.gameState);
                }
            });
        }
    }

    static startRaceWeek() {
        const startRaceWeekBtn = document.getElementById('startRaceWeek');
        if (startRaceWeekBtn) {
            startRaceWeekBtn.addEventListener('click', function() {
                this.disabled = true;
                const setupRaceBtn = document.getElementById('setupRace');
                if (setupRaceBtn) { setupRaceBtn.disabled = false; }
                
                // Call the new progression manager
                window.app.progressionManager.startNewRaceWeek();
                
                // Also call the legacy UI update function to display the race week info
                if (typeof createNewRaceWeek === 'function') {
                    createNewRaceWeek();
                }

                window.app.hud.setStep(2, 'done'); 
                window.app.hud.setStep(3, 'active');
                window.app.hud.setStatus('Race Week created. Setup the next race.');
            });
        }
    }

    static setupRace() {
        const setupRaceBtn = document.getElementById('setupRace');
        if (setupRaceBtn) {
            setupRaceBtn.addEventListener('click', function() {
                setupRace();
                // setupBettingOptions(); // Betting component will handle this
                window.app.hud.setStep(3, 'done'); 
                window.app.hud.setStep(4, 'active');
                window.app.hud.setStatus('Track prepared and racers on the grid. Start the race!');
            });
        }
    }

    static startRace() {
        const startRaceBtn = document.getElementById('startRace');
        if (startRaceBtn) {
            startRaceBtn.addEventListener('click', function() {
                startRace();
                window.app.hud.setStatus('Race in progress... watch the leaderboard update live.');
            });
        }
    }

    static placeBet() {
        const placeBetBtn = document.getElementById('placeBet');
        if (placeBetBtn) {
            placeBetBtn.addEventListener('click', function() {
                const selectRacer = document.getElementById('selectRacer');
                const betAmount = document.getElementById('betAmount');
                if (selectRacer && betAmount) {
                    const selectedRacerIndex = parseInt(selectRacer.value);
                    const betAmountValue = parseInt(betAmount.value);
                    placeBet(selectedRacerIndex, betAmountValue);
                }
            });
        }
    }

    static endRace() {
        const endRaceBtn = document.getElementById('endRace');
        if (endRaceBtn) {
            endRaceBtn.addEventListener('click', function() {
                endRaceEarly();
            });
        }
    }

    static speedMultiplier() {
        const speedMultiplier = document.getElementById('speedMultiplier');
        if (speedMultiplier) {
            speedMultiplier.addEventListener('change', function() {
                gameState.settings.racerProperties.speedMultiplier = document.getElementById('speedMultiplier').value;
            });
        }
    }

    static initializeAll() {
        this.initializeGame();
        this.startRaceWeek();
        this.setupRace();
        this.startRace();
        this.placeBet();
        this.endRace();
        this.speedMultiplier();
    }
}

window.EventHandlers = EventHandlers;