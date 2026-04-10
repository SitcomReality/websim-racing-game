/** 
 * WordListManager - Handles name generation data loading and management
 */ 
export class WordListManager {
  constructor() {
    this.prefixes = [];
    this.suffixes = [];
    this.locationSuffixes = [];
    this.colors = [];
    this.loaded = false;
  }

  /**
   * Load all word lists
   */
  async loadWordLists() {
    try {
      // Load XML wordlists first
      await this.loadXmlWordlists();

      // Load color data
      await this.loadColorData();

      this.loaded = true;
      return true;
    } catch (error) {
      console.error('Failed to load word lists:', error);
      this.loaded = false;
      return false;
    }
  }

  /**
   * Load XML wordlists from files
   */
  async loadXmlWordlists() {
    try {
      // Define dynamic affixes
      const dynamicPrefixes = [
        () => `00${Math.floor(Math.random()*9)}: Licensed To`, 
        () => `${Math.floor(1 + Math.random()*111)}%`, 
        () => `${Math.floor(1 + Math.random()*12)} O'Clock`, 
        () => `${Math.floor(Math.random()*1000)}mL Of`, 
        () => `${Math.floor(Math.random()*1000)}Kg Of`, 
        () => `${Math.floor(Math.random()*1000)}Km Of`, 
        () => `${Math.floor(Math.random()*99)} Units Of`,
      ];

      const dynamicSuffixes = [
        () => `V${Math.floor(Math.random()*10)}.${Math.floor(Math.random()*10)}`, 
        () => `'${Math.floor(10 + Math.random()*89)}` , 
        () => `${Math.floor(1 + Math.random()*9)}000`, 
      ];

      // Load prefixes
      const prefixResponse = await fetch('src/wordlist/racerNamePrefixes.xml');
      const prefixXmlText = await prefixResponse.text();
      const prefixParser = new DOMParser();
      const prefixXml = prefixParser.parseFromString(prefixXmlText, "text/xml");

      this.prefixes = [];
      const prefixItems = prefixXml.getElementsByTagName('item');
      for (let item of prefixItems) {
        const index = parseInt(item.getAttribute('index'));
        this.prefixes[index] = item.textContent;
      }

      // Add dynamic prefixes
      this.prefixes.push(...dynamicPrefixes);

      // Load suffixes
      const suffixResponse = await fetch('src/wordlist/racerNameSuffixes.xml');
      const suffixXmlText = await suffixResponse.text();
      const suffixParser = new DOMParser();
      const suffixXml = suffixParser.parseFromString(suffixXmlText, "text/xml");

      this.suffixes = [];
      const suffixItems = suffixXml.getElementsByTagName('item');
      for (let item of suffixItems) {
        const index = parseInt(item.getAttribute('index'));
        this.suffixes[index] = item.textContent;
      }

      // Add dynamic suffixes
      this.suffixes.push(...dynamicSuffixes);

      // Load location suffixes
      this.locationSuffixes = [
        "Stadium", "Stadium", "Stadium", "Stadium",
        "Arena", "Arena", "Arena", "Arena",
        "Court", "Court",
        "Racetrack", "Racetrack", "Racetrack", "Racetrack",
        "Square", "Route", "Field", "Dome", "Meadow", "Track", "Road",
        "Racetrack", "Oval", "Land", "Ground", "Auditorium", "Alley",
        "Runway", "Vista", "Turnpike", "Nexus", "Park", "Domain",
        "Summit", "Valley", "Boulevard", "Gardens", "Pitch", "Gymnasium"
      ];

      console.log('Loaded XML wordlists:', {
        prefixes: this.prefixes.length,
        suffixes: this.suffixes.length,
        locationSuffixes: this.locationSuffixes.length
      });
    } catch (error) {
      console.error('Error loading XML wordlists:', error);
      // Fallback to JavaScript arrays
      this.loadFallbackWordLists();
    }
  }

  /**
   * Load fallback word lists if XML fails
   */
  loadFallbackWordLists() {
    // These would be the JavaScript arrays from the original wordlist files
    this.prefixes = window.racerNamePrefixes || [];
    this.suffixes = window.racerNameSuffixes || [];
    this.locationSuffixes = window.locationSuffixes || [];
  }

  /**
   * Load color data
   */
  async loadColorData() {
    // Load color palette
    this.colors = [
      "#FFF275", "#FF8C42", "#FF3C38", "#A23E48", "#6C8EAD",
      "#171219", "#225560", "#7AC74F", "#F1DABF", "#08BDBD",
      "#2A0C4E", "#EEABC4", "#006BA6", "#161032", "#E06D06",
      "#475841", "#266DD3", "#B7ADCF", "#4F646F", "#083D77",
      "#EE964B", "#1D3557", "#F7A072", "#435058", "#084C61",
      "#606C38", "#283618", "#FFB2E6", "#D972FF", "#EA9E8D",
      "#1C2826"
    ];

    // Make colors available globally
    window.racerColors = this.colors;
  }

  /**
   * Generate a racer name
   */
  generateRacerName(racerId = null) {
    if (!this.loaded) {
      console.warn('Word lists not loaded, using fallback');
      this.loadFallbackWordLists();
    }

    const prefixIndex = Math.floor(Math.random() * this.prefixes.length);
    const suffixIndex = Math.floor(Math.random() * this.suffixes.length);

    const prefix = this.prefixes[prefixIndex];
    const suffix = this.suffixes[suffixIndex];

    // Handle dynamic functions
    let prefixStr, suffixStr;

    if (typeof prefix === 'function') {
      prefixStr = prefix();
    } else {
      prefixStr = prefix;
    }

    if (typeof suffix === 'function') {
      suffixStr = suffix();
    } else {
      suffixStr = suffix;
    }

    return [prefixIndex, suffixIndex];
  }

  /**
   * Generate a track name
   */
  generateTrackName(trackId = null) {
    if (!this.loaded) {
      console.warn('Word lists not loaded, using fallback');
      this.loadFallbackWordLists();
    }

    const prefixIndex = Math.floor(Math.random() * this.prefixes.length);
    const locationIndex = Math.floor(Math.random() * this.locationSuffixes.length);

    const prefix = this.prefixes[prefixIndex];
    const location = this.locationSuffixes[locationIndex];

    let prefixStr;
    if (typeof prefix === 'function') {
      prefixStr = prefix();
    } else {
      prefixStr = prefix;
    }

    return `${prefixStr} ${location}`;
  }

  /**
   * Get racer name string from indices
   */
  getRacerNameString(nameIndices) {
    if (!Array.isArray(nameIndices) || nameIndices.length !== 2) {
      return "Unknown Racer";
    }

    const [prefixIndex, suffixIndex] = nameIndices;

    const prefix = this.prefixes[prefixIndex];
    const suffix = this.suffixes[suffixIndex];

    if (!prefix || !suffix) {
      return "Unknown Racer";
    }

    let prefixStr, suffixStr;

    if (typeof prefix === 'function') {
      prefixStr = prefix();
    } else {
      prefixStr = prefix;
    }

    if (typeof suffix === 'function') {
      suffixStr = suffix();
    } else {
      suffixStr = suffix;
    }

    return `${prefixStr} ${suffixStr}`;
  }

  /**
   * Get color by index
   */
  getColor(index) {
    if (!this.colors || this.colors.length === 0) {
      return '#000000';
    }
    return this.colors[index % this.colors.length];
  }

  /**
   * Get random color
   */
  getRandomColor() {
    if (!this.colors || this.colors.length === 0) {
      return '#000000';
    }
    return this.colors[Math.floor(Math.random() * this.colors.length)];
  }

  /**
   * Get all available colors
   */
  getAllColors() {
    return [...this.colors];
  }

  /**
   * Check if word lists are loaded
   */
  isLoaded() {
    return this.loaded;
  }

  /**
   * Export word list data
   */
  exportData() {
    return {
      prefixes: this.prefixes.filter(p => typeof p !== 'function'),
      suffixes: this.suffixes.filter(s => typeof s !== 'function'),
      locationSuffixes: this.locationSuffixes,
      colors: this.colors,
      loaded: this.loaded
    };
  }

  /**
   * Import word list data
   */
  importData(data) {
    if (data.prefixes) this.prefixes = data.prefixes;
    if (data.suffixes) this.suffixes = data.suffixes;
    if (data.locationSuffixes) this.locationSuffixes = data.locationSuffixes;
    if (data.colors) {
      this.colors = data.colors;
      window.racerColors = this.colors;
    }
    this.loaded = data.loaded || true;
  }
}
