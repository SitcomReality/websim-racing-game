/** 
 * FerretTailRenderer - Renders ferret tail with physics-based animation
 */ 
export class FerretTailRenderer {
  constructor() {
    // Tail rendering state managed per ferret instance
  }

  render(ctx, ferret, colors) {
    // New: Tail follows the particle chain if enabled
    if (ferret.bodyChain?.enabled && ferret.bodyChain.nodes.length > 0) {
      this.renderChainedTail(ctx, ferret, colors);
      return;
    }

    const bodyLength = ferret.body.length * 30;
    const tailStartX = -bodyLength/2 - 5;
    const tailStartY = ferret.body.height * 5 * ferret.body.stockiness;
    const tailLength = ferret.tail.length * 25;
    const tailFluffiness = ferret.tail.fluffiness;

    // Much slower, more grounded tail movement
    const { FerretAnimationUtils } = await import('./FerretAnimationUtils.js');
    const tailSway = FerretAnimationUtils.calculateTailSway(ferret, performance.now());

    // Tail should drag along the ground with gentle sway
    const groundMargin = 8; // How close tail stays to ground
    const tailEndY = tailStartY + groundMargin + (ferret.isStumbling ? 0 : 2);

    // Create a gentle curve that drags along the ground
    const controlPointX = tailStartX - tailLength * 0.4;
    const controlPointY = tailStartY + groundMargin + (Math.abs(tailSway) * 0.3);

    ctx.beginPath();
    ctx.moveTo(tailStartX, tailStartY);
    ctx.quadraticCurveTo(
      controlPointX, 
      controlPointY, 
      tailStartX - tailLength, 
      tailEndY
    );

    // Tail should appear heavier/thicker at the base
    const baseWidth = 6 * tailFluffiness;
    const tipWidth = 3 * tailFluffiness;
    const currentWidth = baseWidth - (baseWidth - tipWidth) * (1 - Math.abs(tailSway) * 0.1);

    ctx.lineWidth = currentWidth;
    ctx.strokeStyle = colors[2];
    ctx.lineCap = 'round';
    ctx.stroke();

    // Add subtle shadow underneath for ground contact effect
    if (!ferret.isStumbling) {
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(tailStartX, tailStartY + 2);
      ctx.quadraticCurveTo(
        controlPointX + 1, 
        controlPointY + 2, 
        tailStartX - tailLength + 1, 
        tailEndY + 2
      );
      ctx.lineWidth = currentWidth;
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  renderChainedTail(ctx, ferret, colors) {
    const chain = ferret.bodyChain;
    if (!chain || chain.nodes.length < 2) return;

    // Tail follows the last few nodes of the body chain
    const tailNodes = chain.nodes.slice(-3); // Use last 3 nodes for tail
    const { SplineUtils } = await import('./SplineUtils.js');
    const pts = SplineUtils.samplePolyline(tailNodes, 16);

    // Calculate tail width based on fluffiness and current state
    const baseWidth = 4 * ferret.tail.fluffiness;
    const tipWidth = 2 * ferret.tail.fluffiness;

    // Render as a thick spline
    SplineUtils.renderThickSpline(ctx, pts, baseWidth, tipWidth, colors[2]);

    // Add subtle ground contact shadow
    if (!ferret.isStumbling) {
      ctx.globalAlpha = 0.3;
      const shadowPts = pts.map(p => ({ x: p.x + 1, y: p.y + 2 }));
      SplineUtils.renderThickSpline(ctx, shadowPts, baseWidth * 0.8, tipWidth * 0.8, 'rgba(0,0,0,0.2)');
      ctx.globalAlpha = 1;
    }
  }
}