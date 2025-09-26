import { FerretAnimationSystem } from "./FerretAnimationSystem.js";
import { FerretBodyRenderer } from "./FerretBodyRenderer.js";
import { FerretEyeRenderer } from "./FerretEyeRenderer.js";

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
    this.animationSystem.update(ferret, racer, time, raceState);

    // Resolve color indices to hex strings
    const colors = racer.colors.map(c => (typeof c === 'string' ? c : window.racerColors?.[c] || '#000'));

    // Render ferret components
    // Use the bodyRenderer's main render method which coordinates all components
    this.bodyRenderer.render(ctx, ferret, colors, time, racer);
    
    // Render eyes with independent tracking
    this.eyeRenderer.render(ctx, ferret, colors);

    ctx.restore();
  }
}