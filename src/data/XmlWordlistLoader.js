/** 
 * XmlWordlistLoader - Handles loading XML wordlist files
 */ 
export class XmlWordlistLoader {
  constructor() {}

  async loadWordlists() {
    try {
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
        () => `'${Math.floor(10 + Math.random()*89)}`,
        () => `${Math.floor(1 + Math.random()*9)}000`,
      ];

      // Load prefixes
      const prefixResponse = await fetch('wordlist/racerNamePrefixes.xml');
      const prefixXmlText = await prefixResponse.text();
      const prefixParser = new DOMParser();
      const prefixXml = prefixParser.parseFromString(prefixXmlText, \"text/xml\");

      window.racerNamePrefixes = [];
      const prefixItems = prefixXml.getElementsByTagName('item');
      for (let item of prefixItems) {
        const index = parseInt(item.getAttribute('index'));
        window.racerNamePrefixes[index] = item.textContent;
      }

      // Add dynamic prefixes
      window.racerNamePrefixes.push(...dynamicPrefixes);

      // Load suffixes
      const suffixResponse = await fetch('wordlist/racerNameSuffixes.xml');
      const suffixXmlText = await suffixResponse.text();
      const suffixParser = new DOMParser();
      const suffixXml = suffixParser.parseFromString(suffixXmlText, \"text/xml\");

      window.racerNameSuffixes = [];
      const suffixItems = suffixXml.getElementsByTagName('item');
      for (let item of suffixItems) {
        const index = parseInt(item.getAttribute('index'));
        window.racerNameSuffixes[index] = item.textContent;
      }

      // Add dynamic suffixes
      window.racerNameSuffixes.push(...dynamicSuffixes);

      console.log('Loaded XML wordlists:', {
        prefixes: window.racerNamePrefixes.length,
        suffixes: window.racerNameSuffixes.length
      });
    } catch (error) {
      console.error('Error loading XML wordlists:', error);
      // Fallback to the JavaScript arrays if XML loading fails
      if (!window.racerNamePrefixes) {
        console.warn('Falling back to JavaScript wordlists');
      }
    }
  }
}