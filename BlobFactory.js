
```javascript
class BlobFactory {
  static _hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return Math.abs(h >>> 0);
  }
  static create(racer) {
    const seedStr = `${racer.id}-${racer.name[0]}-${racer.name[1]}-${racer.colors.join('-')}`;
    let seed = this._hash(seedStr);
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0xffffffff);
    const baseRadius = 22 + Math.floor(rnd() * 10);
    const N = 12;
    const points = [];
    for (let i = 0; i < N; i++) {
      const ang = (i / N) * Math.PI * 2;
      const variance = (rnd() * 0.35 + 0.85);
      points.push({ ang, rad: baseRadius * variance, wobblePhase: rnd() * Math.PI * 2 });
    }
    return {
      baseRadius,
      controlPoints: points,
      eyes: { blinkTimer: 0, pupil: { x: 0, y: 0 } },
      mouth: { orientation: Math.PI }
    };
  }
}
window.BlobFactory = BlobFactory;