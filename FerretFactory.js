
```javascript
class FerretFactory {
  static _hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h += (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24); }
    return Math.abs(h >>> 0);
  }
  static _rng(seed) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0xffffffff); }
  static create(racer) {
    const seedStr = `${racer.id}-${racer.name[0]}-${racer.name[1]}-${racer.colors.join('-')}`;
    let seed = this._hash(seedStr); const rnd = this._rng(seed);
    const pick = (min, max) => min + (max - min) * rnd();
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    const body = {
      length: pick(0.8, 1.2),
      height: pick(0.9, 1.1),
      stockiness: pick(0.8, 1.2)
    };
    const legs = {
      length: pick(0.8, 1.2),
      thickness: pick(0.8, 1.2)
    };
    const tail = {
      length: pick(0.7, 1.5),
      fluffiness: pick(0.8, 1.3)
    };
    const head = {
      noseLength: pick(0.7, 1.3),
      underbiteDepth: pick(0.0, 0.3),
      earSize: pick(0.8, 1.2)
    };
    const eye = {
      pupil: { x: 1, y: 0 }, // look forward right by default
      blinkTimer: pick(2.0, 8.0),
      upperLid: clamp(pick(0.0, 0.3), 0, 1),
      lowerLid: clamp(pick(0.0, 0.2), 0, 1),
      targetRid: null
    };
    const gait = {
      stride: pick(0.8, 1.3),
      cyclePhase: rnd() * Math.PI * 2,
      footfall: ['FL','FR','BL','BR'] // order reference
    };

    return { body, legs, tail, head, eye, gait, seed };
  }
}
window.FerretFactory = FerretFactory;