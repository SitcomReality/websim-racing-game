class Race {
    constructor(id, racers, track) {
        this.id = id;
        this.racers = racers;
        this.track = track;
        this.results = [];
        this.winner = null;
        this.liveLocations = [];
        this.livePositions = [];
    }
}