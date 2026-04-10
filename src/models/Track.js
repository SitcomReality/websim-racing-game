export class Track {
  constructor(id, name, numberOfSections = 3, groundTypes = [], trackProps = null) {
    this.id = id;
    this.name = name;
    this.sections = [];
    const types = Array.isArray(groundTypes) && groundTypes.length ? groundTypes : ["asphalt","gravel","dirt","grass","mud","rock","marble"];
    if (trackProps && typeof trackProps.segmentsPerSection === 'number' && typeof trackProps.minConsecutiveSegmentsOfSameType === 'number') {
      const reqPerRun = Math.max(1, Math.ceil(trackProps.minConsecutiveSegmentsOfSameType / Math.max(1, trackProps.segmentsPerSection)));
      let remaining = numberOfSections;
      while (remaining > 0) {
        const type = types[Math.floor(Math.random() * types.length)];
        const runLen = Math.min(remaining, Math.max(reqPerRun, Math.floor(Math.random() * (reqPerRun + 2)) + 1));
        for (let r = 0; r < runLen; r++) this.sections.push(type);
        remaining -= runLen;
      }
    } else {
      for (let i = 0; i < numberOfSections; i++) this.sections.push(types[Math.floor(Math.random() * types.length)]);
    }
  }
}