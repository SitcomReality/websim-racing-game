function setupTrack(track) {
    document.getElementById('setupRace').disabled = true;
    document.getElementById('startRace').disabled = false;
    const trackDom = document.getElementById('raceTrack');
    
    // Save the leaderboard before clearing
    const leaderboard = document.getElementById('liveLeaderboard');
    const weatherOverlay = document.getElementById('overlayWeather');
    
    trackDom.innerHTML = '';
    
    // Restore the leaderboard after clearing
    if (leaderboard) {
        trackDom.appendChild(leaderboard);
    }
    if (weatherOverlay) {
        trackDom.appendChild(weatherOverlay);
    }
    
    const canvas = document.createElement('canvas');
    canvas.id = 'raceCanvas';
    trackDom.appendChild(canvas);

    gameState.currentRace.trackName = track.name;
    gameState.currentRace.sections = [];
    gameState.currentRace.segments = [];
    
    for (let section = 0; section < track.sections.length; section++) {
        gameState.currentRace.sections.push(track.sections[section]);
        // Each section is three segments
        gameState.currentRace.segments.push(track.sections[section]);
        gameState.currentRace.segments.push(track.sections[section]);
        gameState.currentRace.segments.push(track.sections[section]);
    }
    gameState.currentRace.segments.push("finishLine");
    const weekRace = gameState.raceWeek && gameState.raceWeek.races[gameState.currentRaceIndex - 1];
    gameState.currentRace.weather = gameState.currentRace.weather || (weekRace && weekRace.weather) || gameState.settings.worldProperties.weatherTypes[Math.floor(Math.random()*gameState.settings.worldProperties.weatherTypes.length)];
    gameState.currentRace.racers = [];
    gameState.currentRace.results = [];
    gameState.currentRace.winner = null;
    gameState.currentRace.liveLocations = [];
    
    DOMUtils.updateTrackDetails();
    const selectedRacers = gameState.raceWeek.selectedRacers.slice(0, gameState.settings.trackProperties.numberOfLanes);
    const arrangedRacers = arrangeRacersByPerformance(selectedRacers, gameState);
    
    for (let i = 0; i < gameState.settings.trackProperties.numberOfLanes; i++) {
        const thisRacerID = arrangedRacers[i];
        if(thisRacerID === undefined) continue;

        const thisRacer = gameState.racers[thisRacerID];
        gameState.currentRace.racers[i] = thisRacerID;
        
        // Create blob data for this racer
        if (!thisRacer.blobData) {
            thisRacer.blobData = BlobFactory.create(thisRacer);
        }
        
        // Initialize live location - key change
        gameState.currentRace.liveLocations[thisRacerID] = 0;
        thisRacer.reset();
    }
    
    // Initialize canvas renderer
    if (!window.canvasRenderer) {
        window.canvasRenderer = new CanvasRenderer(canvas);
        
        // Add resize handler
        const resizeHandler = () => {
            if (window.canvasRenderer) {
                window.canvasRenderer.resizeToContainer();
            }
        };
        window.addEventListener('resize', resizeHandler);
        
        // Add mouse interaction
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const hits = window.canvasRenderer.hitIndex.getUnderPoint(x, y);
            
            // Clear all nameplates first
            window.canvasRenderer.nameplate.visibleNames.clear();
            
            // Show nameplate for hit racers
            hits.forEach(rid => {
                const racer = gameState.racers[rid];
                if (racer && racer.blobData) {
                    const laneIndex = gameState.currentRace.racers.indexOf(parseInt(rid));
                    const pos = gameState.currentRace.liveLocations[rid] || 0;
                    const screenPos = window.canvasRenderer.worldToScreen(pos, laneIndex);
                    window.canvasRenderer.nameplate.show(rid, screenPos.x, screenPos.y);
                }
            });
        });
        canvas.addEventListener('mouseleave', () => {
            if (window.canvasRenderer) {
                window.canvasRenderer.nameplate.visibleNames.clear();
            }
        });
    } else {
        window.canvasRenderer.setCanvas(canvas);
    }
    
    window.canvasRenderer.setData(gameState.currentRace, gameState.settings.trackProperties);
    const icon = ({sunny:'☀️',rainy:'🌧️',windy:'💨',cloudy:'☁️',dusty:'🌫️',stormy:'⛈️',snowy:'❄️',foggy:'🌁'})[gameState.currentRace.weather] || '⛅';
    const ow = document.getElementById('overlayWeather'); if (ow) ow.textContent = `${icon} ${gameState.currentRace.weather}`;
    window.canvasRenderer.resizeToContainer();
    window.canvasRenderer.start();
}