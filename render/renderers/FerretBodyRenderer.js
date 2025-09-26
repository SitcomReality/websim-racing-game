import { FerretColorUtils } from './FerretColorUtils.js';
import { FerretHeadRenderer } from './FerretHeadRenderer.js';
import { FerretTailRenderer } from './FerretTailRenderer.js';
import { FerretLegRenderer } from './FerretLegRenderer.js';
import { SplineUtils } from './SplineUtils.js';

/**
 * FerretBodyRenderer - Main ferret body renderer that coordinates components
 */
export class FerretBodyRenderer {
  constructor() {
    this.headRenderer = new FerretHeadRenderer();
    this.tailRenderer = new FerretTailRenderer();
    this.legRenderer = new FerretLegRenderer();
  }

  renderBody(ctx, ferret, colors) {
    if (ferret.bodyChain?.enabled && ferret.bodyChain?.nodes?.length >= 2) {
      const pts = SplineUtils.samplePolyline(ferret.bodyChain.nodes, 24);
      const startW = (ferret.bodyChain.params?.thicknessStart || 12) * (ferret.body?.stockiness || 1);
      const endW = (ferret.bodyChain.params?.thicknessEnd || 6) * (ferret.body?.stockiness || 1);
      
      // Use the primary color for the body spline
      SplineUtils.renderThickSpline(ctx, pts, startW, endW, colors[0]);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; 
      ctx.lineWidth = 1.5; 
      ctx.stroke();
      return;
    }

    const bodyLength = ferret.body.length * 30;
    let bodyHeight = ferret.body.height * 20;
    bodyHeight *= ferret.body.stockiness;

    // Draw body (elongated ellipse)
    ctx.beginPath();
    ctx.ellipse(-5, 0, bodyLength/2, bodyHeight/2, 0, 0, Math.PI * 2);
    
    // Use the primary color for the body
    ctx.fillStyle = colors[0];
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Coat pattern: dorsal banding - use the correct color from racer's colors
    if (ferret.coat && ferret.coat.pattern === 'banded') {
      // Use the stripe index from the ferret's coat configuration
      const stripeColorIndex = ferret.coat.stripeIndex || 1;
      const stripeColor = colors[stripeColorIndex] || colors[1];
      
      ctx.fillStyle = stripeColor;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(-bodyLength/2 + 6, -bodyHeight*0.15, bodyLength - 12, bodyHeight*0.3);
      ctx.globalAlpha = 1.0;
    }
  }

  render(ctx, ferret, colors, time, racer) {
    // Draw far-side legs first (behind body)
    this.legRenderer.render(ctx, ferret, colors, true);
    
    // Draw body - now properly uses the colors array
    this.renderBody(ctx, ferret, colors);
    
    // Draw head
    this.headRenderer.render(ctx, ferret, colors, time, racer);
    
    // Draw tail
    this.tailRenderer.render(ctx, ferret, colors);
    
    // Draw near-side legs (on top)
    this.legRenderer.render(ctx, ferret, colors, false);
  }
}