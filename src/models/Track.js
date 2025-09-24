export class Track {
  constructor(id, name, numberOfSections = 3, groundTypes = []) {
    this.id = id;
    this.name = name;
    this.sections = [];
    const types = Array.isArray(groundTypes) && groundTypes.length ? groundTypes : ["asphalt","gravel","dirt","grass","mud","rock","marble"];
    for (let i = 0; i < numberOfSections; i++) {
      const t = types[Math.floor(Math.random() * types.length)];
      this.sections.push(t);
    }
  }
}
window.Track = Track;

