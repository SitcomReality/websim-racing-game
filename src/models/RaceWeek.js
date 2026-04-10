export class RaceWeek {
  constructor(id, settings) {
    this.id = id;
    this.settings = settings;
    this.races = [];
    this.selectedRacers = [];
    this.season = 1;
    this.weekInSeason = 1;
  }

  addRace(race) {
    this.races.push(race);
  }
}