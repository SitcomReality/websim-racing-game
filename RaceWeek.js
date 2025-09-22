class RaceWeek {
    constructor(id, settings) {
		this.id = id;
        this.settings = settings;
        this.races = [];
		this.selectedRacers = [];
    }

    addRace(race) {
        this.races.push(race);
    }
}