
```javascript
class HitTestIndex {
  constructor() {
    this.items = new Map(); // rid -> {x,y,r}
  }
  update(screenPositions) {
    this.items.clear();
    for (const p of screenPositions || []) {
      this.items.set(p.rid, { x: p.x, y: p.y, r: p.r });
    }
  }
  getUnderPoint(x, y) {
    const hits = [];
    this.items.forEach((aabb, rid) => {
      const dx = x - aabb.x, dy = y - aabb.y;
      if (dx*dx + dy*dy <= aabb.r*aabb.r) hits.push(rid);
    });
    return hits;
  }
}
window.HitTestIndex = HitTestIndex;