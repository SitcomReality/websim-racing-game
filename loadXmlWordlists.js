async function loadXmlWordlists() {
    try {
        // Load prefixes
        const prefixResponse = await fetch('wordlist/racerNamePrefixes.xml');
        const prefixXmlText = await prefixResponse.text();
        const prefixParser = new DOMParser();
        const prefixXml = prefixParser.parseFromString(prefixXmlText, "text/xml");

        window.racerNamePrefixes = [];
        const prefixItems = prefixXml.getElementsByTagName('item');
        for (let item of prefixItems) {
            const index = parseInt(item.getAttribute('index'));
            window.racerNamePrefixes[index] = item.textContent;
        }

        // Load suffixes
        const suffixResponse = await fetch('wordlist/racerNameSuffixes.xml');
        const suffixXmlText = await suffixResponse.text();
        const suffixParser = new DOMParser();
        const suffixXml = suffixParser.parseFromString(suffixXmlText, "text/xml");

        window.racerNameSuffixes = [];
        const suffixItems = suffixXml.getElementsByTagName('item');
        for (let item of suffixItems) {
            const index = parseInt(item.getAttribute('index'));
            window.racerNameSuffixes[index] = item.textContent;
        }

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