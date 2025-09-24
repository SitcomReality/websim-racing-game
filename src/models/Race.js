export class Race {
  constructor(id, racers = [], track = null, weather = 'sunny') {
    this.id = id;
    this.racers = racers; // array of Racer instances or IDs depending on usage
    this.track = track;
    this.weather = weather;
    this.segments = [];
    this.results = [];
    this.winner = null;
    this.liveLocations = {};
    this.livePositions = [];
    this.startTime = null;
  }

  initializeSegments(segmentsPerSection = 3) {
    this.segments = [];
    (this.track?.sections || []).forEach(section => {
      for (let i = 0; i < segmentsPerSection; i++) {
        this.segments.push(section);
      }
    });
    this.segments.push('finishLine');
  }
}

window.Race = Race;