/**
 * Nameplate - Manages racer name display
 */
export class Nameplate {
  constructor() {
    this.visibleNames = new Map();
  }

  show(racerId, x, y) {
    this.visibleNames.set(racerId, { x, y, time: performance.now() });
  }

  hide(racerId) {
    this.visibleNames.delete(racerId);
  }

  render(ctx, gameState) {
    const now = performance.now();

    for (const [racerId, data] of this.visibleNames.entries()) {
      const racer = gameState?.racers[racerId];
      if (!racer) continue;

      const age = now - data.time;
      if (age > 2000) {
        this.visibleNames.delete(racerId);
        continue;
      }

      const alpha = Math.max(0, 1 - age / 2000);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1;

      const name = this.getRacerNameString(racer);
      ctx.font = '12px Orbitron';
      const width = ctx.measureText(name).width + 10;
      const height = 20;

      ctx.fillRect(data.x - width/2, data.y - 30, width, height);
      ctx.strokeRect(data.x - width/2, data.y - 30, width, height);

      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(name, data.x, data.y - 15);
      ctx.restore();
    }
  }

  getRacerNameString(racer) {
    if (!racer || !racer.name) return "Unknown Racer";

    const prefix = window.racerNamePrefixes?.[racer.name[0]];
    const suffix = window.racerNameSuffixes?.[racer.name[1]];

    let prefixStr, suffixStr;

    if (typeof prefix === 'function') {
      prefixStr = racer._evaluatedPrefix || (racer._evaluatedPrefix = prefix());
    } else {
      prefixStr = prefix;
    }

    if (typeof suffix === 'function') {
      suffixStr = racer._evaluatedSuffix || (racer._evaluatedSuffix = suffix());
    } else {
      suffixStr = suffix;
    }

    return `${prefixStr} ${suffixStr}`;
  }
}