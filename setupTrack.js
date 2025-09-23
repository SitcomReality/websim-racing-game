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
    // Use the current race's selected racers (IDs) so the UI entrants match the actual race participants
    const selectedRacers = (gameState.currentRace.racers || []).slice(0, gameState.settings.trackProperties.numberOfLanes);
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
        
        // remove mouse interaction listeners here; now handled in CanvasRenderer.setCanvas()
        // canvas.addEventListener('mousemove', ...)
        // canvas.addEventListener('mouseleave', ...)
    } else {
        window.canvasRenderer.setCanvas(canvas);
    }
    
    window.canvasRenderer.setData(gameState.currentRace, gameState.settings.trackProperties);
    const icon = ({sunny:'☀️',rainy:'🌧️',windy:'💨',cloudy:'☁️',dusty:'🌫️',stormy:'⛈️',snowy:'❄️',foggy:'🌁'})[gameState.currentRace.weather] || '⛅';
    const ow = document.getElementById('overlayWeather'); if (ow) ow.textContent = `${icon} ${gameState.currentRace.weather}`;
    window.canvasRenderer.resizeToContainer();
    window.canvasRenderer.start();
}