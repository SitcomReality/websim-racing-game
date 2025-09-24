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
                
                // Use eventBus to trigger race week start
                if (window.eventBus) {
                    window.eventBus.emit('race:startWeek');
                }
                
                // Update HUD through eventBus or app instance
                if (window.app && window.app.hud) {
                    window.app.hud.setStep(2, 'done'); 
                    window.app.hud.setStep(3, 'active');
                    window.app.hud.setStatus('Race Week created. Setup the next race.');
                }
            });
        }
    }

    static setupRace() {
        const setupRaceBtn = document.getElementById('setupRace');
        if (setupRaceBtn) {
            setupRaceBtn.addEventListener('click', function() {
                // Use eventBus to trigger race setup
                if (window.eventBus) {
                    window.eventBus.emit('race:setup');
                }
                
                // Update HUD
                if (window.app && window.app.hud) {
                    window.app.hud.setStep(3, 'done'); 
                    window.app.hud.setStep(4, 'active');
                    window.app.hud.setStatus('Track prepared and racers on the grid. Start the race!');
                }
            });
        }
    }

    static startRace() {
        const startRaceBtn = document.getElementById('startRace');
        if (startRaceBtn) {
            startRaceBtn.addEventListener('click', function() {
                // Use eventBus to trigger race start
                if (window.eventBus) {
                    window.eventBus.emit('race:start');
                }
                
                // Update HUD
                if (window.app && window.app.hud) {
                    window.app.hud.setStatus('Race in progress... watch the leaderboard update live.');
                }
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
                // Use eventBus to trigger race end
                if (window.eventBus) {
                    window.eventBus.emit('race:end');
                }
            });
        }
    }

    static speedMultiplier() {
        const speedMultiplier = document.getElementById('speedMultiplier');
        if (speedMultiplier) {
            speedMultiplier.addEventListener('change', function() {
                if (window.gameState && window.gameState.settings) {
                    window.gameState.settings.racerProperties.speedMultiplier = document.getElementById('speedMultiplier').value;
                }
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