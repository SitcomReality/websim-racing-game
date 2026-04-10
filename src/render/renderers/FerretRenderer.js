import { FerretAnimationSystem } from "./FerretAnimationSystem.js";
import { FerretBodyRenderer } from "./FerretBodyRenderer.js";
import { FerretEyeRenderer } from "./FerretEyeRenderer.js";
import { FerretColorUtils } from './FerretColorUtils.js';

/**
 * FerretRenderer - Renders individual ferret racers
 */
export class FerretRenderer {
  constructor() {
    this.animationSystem = new FerretAnimationSystem();
    this.bodyRenderer = new FerretBodyRenderer();
    this.eyeRenderer = new FerretEyeRenderer();
  }

  render(ctx, x, y, racer, time, scale = 1, raceState = null) {
    const ferret = racer?.ferret;
    if (!ferret) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Update animation state
    // Pass time in milliseconds (as provided by RenderManager.tick)
    this.animationSystem.update(ferret, racer, time, raceState);

    // Resolve racer colors from the racer's colors array using the global palette
    const palette = window.racerColors || [
      "#FFF275", "#FF8C42", "#FF3C38", "#A23E48", "#6C8EAD",
      "#171219", "#225560", "#7AC74F", "#F1DABF", "#08BDBD"
    ];
    
    // Map the racer's color indices to actual hex colors (robust fallback)
    const colors = racer?.colors?.map(c => {
      if (typeof c === 'string' && /^#([0-9a-f]{3}){1,2}$/i.test(c)) return c;
      const idx = typeof c === 'number' ? c % palette.length : 0;
      return palette[idx] || palette[0];
    }) || [palette[0], palette[1], palette[2]];
    
    // Render ferret components
    // Use the bodyRenderer's main render method which coordinates all components
    this.bodyRenderer.render(ctx, ferret, colors, time, racer);
    
    // Render eyes with independent tracking
    this.eyeRenderer.render(ctx, ferret, colors);

    ctx.restore();
  }
}