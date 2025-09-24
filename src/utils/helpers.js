// Helper function to get a random value within a range
export function getRandomValue(base, variance) {
    const min = base - variance;
    const max = base + variance;
    return truncateToDecimals(Math.random() * (max - min) + min, 3);
}

// Helper function to get a random integer between min (inclusive) and max (inclusive)
export function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to get a random item from an array
export function getRandomElement(suppliedArray) {
    const randomIndex = Math.floor(Math.random() * suppliedArray.length);
    return suppliedArray[randomIndex];
}

// Helper function to shuffle elements in an array
export function shuffleArray(suppliedArray) {
    for (let i = suppliedArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [suppliedArray[i], suppliedArray[j]] = [suppliedArray[j], suppliedArray[i]];
    }
    return suppliedArray;
}

// Helper function to generate a set of unique numbers
export function generateUniqueNumbers(min, max, count) {
    let uniqueNumbers = [];
    while (uniqueNumbers.length < count) {
        let randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        if (!uniqueNumbers.includes(randomNumber)) {
            uniqueNumbers.push(randomNumber);
        }
    }
    return uniqueNumbers;
}

// Helper function to generate random modifiers for given types
export function generateRandomModifiers(types, variance) {
    const modifiers = {};
    types.forEach(type => {
        modifiers[type] = getRandomValue(1, variance);
    });
    return modifiers;
}

// Helper function for trimming long floats because .toFixed() returns strings like some kind of maniac
export function truncateToDecimals(num, dec = 2) {
    const calcDec = Math.pow(10, dec);
    return Math.trunc(num * calcDec) / calcDec;
}

// Helper function to check whether a value exists within an array
export function isValueExists(value, suppliedArray) {
    return suppliedArray.includes(value);
}

// Helper function to shade a hex color
export function shadeColor(color, percent) {
    let R = parseInt(color.substring(1,3),16);
    let G = parseInt(color.substring(3,5),16);
    let B = parseInt(color.substring(5,7),16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  

    R = Math.round(R);
    G = Math.round(G);
    B = Math.round(B);

    const RR = ((R.toString(16).length===1)?"0"+R.toString(16):R.toString(16));
    const GG = ((G.toString(16).length===1)?"0"+G.toString(16):G.toString(16));
    const BB = ((B.toString(16).length===1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
}

// Helper function to get ground particle color
export function getGroundParticleColor(type, variation = 0) {
    const t = String(type).toLowerCase();
    const base = {grass:[10,77,31], dirt:[90,59,31], gravel:[70,70,70], mud:[74,44,20], rock:[47,59,63], marble:[96,106,112], asphalt:[43,43,43]};
    const rgb = base[t] || base.asphalt;
    const f = 1 + (Math.random()*2 - 1) * Math.max(0, Math.min(1, variation));
    const r = Math.max(0, Math.min(255, Math.round(rgb[0]*f)));
    const g = Math.max(0, Math.min(255, Math.round(rgb[1]*f)));
    const b = Math.max(0, Math.min(255, Math.round(rgb[2]*f)));
    return `rgba(${r},${g},${b},0.9)`;
}