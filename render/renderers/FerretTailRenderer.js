/**
 * FerretTailRenderer - Renders ferret tail with physics-based animation
 */
export class FerretTailRenderer {
  constructor() {
    // Tail rendering state managed per ferret instance
  }

  render(ctx, ferret, colors) {
    // New: Tail follows the particle chain if enabled
    if (ferret.bodyChain?.enabled && ferret.bodyChain.nodes.length >= 2) {
      this.renderChainedTail(ctx, ferret, colors);
      return;
    }

    const bodyLength = ferret.body.length * 30;
    const tailStartX = -bodyLength/2 - 5;
    const tailStartY = ferret.body.height * 5 * ferret.body.stockiness;
    const tailLength = ferret.tail.length * 25;
    const tailFluffiness = ferret.tail.fluffiness;

    // Much slower, more grounded tail movement
    const tailSway = Math.sin(
      ferret.gait.cyclePhase * 0.5 + 
      ferret.seed % 1000 * 0.1
    ) * (1 + ferret.gait.stride * 0.5);

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
    // Use last nodes but render from body->tip (ensure base is at body and tip points outward)
    const tailNodes = chain.nodes.slice(-3).map(n => ({ x: n.x, y: n.y })); // keep order so index 0 = base, last = tip

    // Simple polyline sampling for tail
    const pts = [];
    for (let i = 0; i < tailNodes.length; i++) {
      pts.push(tailNodes[i]);
    }
    
    // Calculate tail width based on fluffiness and current state
    const baseWidth = 4 * ferret.tail.fluffiness;
    const tipWidth = 2 * ferret.tail.fluffiness;

    // Render as a thick spline
    if (pts.length >= 2) {
      // Simple quadratic curve for tail
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      
      if (pts.length === 2) {
        ctx.lineTo(pts[1].x, pts[1].y);
      } else {
        // Use quadratic curve for smoother tail (base -> control -> tip)
        ctx.quadraticCurveTo(pts[1].x, pts[1].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
      }
      
      ctx.lineWidth = baseWidth;
      ctx.strokeStyle = colors[2];
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Add subtle ground contact shadow
    if (!ferret.isStumbling) {
      ctx.globalAlpha = 0.3;
      const shadowPts = pts.map(p => ({ x: p.x + 1, y: p.y + 2 }));
      if (shadowPts.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(shadowPts[0].x, shadowPts[0].y);
        if (shadowPts.length === 2) {
          ctx.lineTo(shadowPts[1].x, shadowPts[1].y);
        } else {
          ctx.quadraticCurveTo(shadowPts[1].x, shadowPts[1].y, shadowPts[shadowPts.length - 1].x, shadowPts[shadowPts.length - 1].y);
        }
        ctx.lineWidth = baseWidth * 0.8;
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }
}