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
    const tailEndY = tailStartY + (tailSway * 2); // minimal downforce; free oscillation

    // Create a gentle curve that extends outward to the left
    const controlPointX = tailStartX - tailLength * 0.6; // Extend further left
    const controlPointY = tailStartY + (tailSway * 3); // amplify airy wobble

    ctx.beginPath();
    ctx.moveTo(tailStartX, tailStartY);
    ctx.quadraticCurveTo(
      controlPointX, 
      controlPointY, 
      tailStartX - tailLength, // Extend fully to the left
      tailEndY
    );

    // Tail should appear heavier/thicker at the base
    const baseWidth = 4 * tailFluffiness;
    const tipWidth = 2 * tailFluffiness;
    const currentWidth = baseWidth - (baseWidth - tipWidth) * (1 - Math.abs(tailSway) * 0.1);

    ctx.lineWidth = currentWidth;
    ctx.strokeStyle = colors[2];
    ctx.lineCap = 'round';
    ctx.stroke();

    // Add subtle shadow underneath for ground contact effect
    if (!ferret.isStumbling) {
      ctx.globalAlpha = 0.18;
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

    // The attachment point is the last node (N_end = hip)
    const N = chain.nodes.length;
    const baseNode = chain.nodes[N - 1]; 
    const prevNode = chain.nodes[N - 2]; 

    // 1. Calculate the direction vector of the last segment (N_{end-1} -> N_end)
    const dirX = baseNode.x - prevNode.x;
    const dirY = baseNode.y - prevNode.y;
    const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);
    
    let normDirX = dirX;
    let normDirY = dirY;
    if (dirLength > 0.01) {
      normDirX /= dirLength;
      normDirY /= dirLength;
    } else {
        // Fallback direction: straight back (left in local space)
        normDirX = -1;
        normDirY = 0;
    }
    
    // 2. Calculate sway and tip position
    
    // Approximate ground level in local coordinates (used in FerretLegRenderer as well)
    const targetGroundY = baseNode.y + 4; // slight downforce relative to body
    
    const tailLength = ferret.tail.length * 25; 
    const tailSwayFactor = Math.sin(ferret.gait.cyclePhase * 1.3 + ferret.seed % 1000 * 0.1) * 1.0; // freer oscillation
    
    // P0: Tail base, anchored at the last body node
    const P0 = { x: baseNode.x, y: baseNode.y }; 
    
    // Calculate P1 (Tip) target: extend backward (in direction of normDir)
    const tipX = P0.x + normDirX * tailLength * 0.8; 
    // Calculate P1 (Tip) target Y: blend towards ground level (targetGroundY)
    const tipY = P0.y * 0.85 + targetGroundY * 0.15 + Math.sin(ferret.gait.cyclePhase * 1.1) * 3;
    
    // Control Point PC: Halfway, influenced by direction, slightly bent downwards, and sway
    const swayX = tailSwayFactor * 1.5;
    const PC = { 
        x: P0.x + normDirX * tailLength * 0.3 + swayX, 
        y: P0.y + normDirY * tailLength * 0.15 + (tipY - P0.y) * 0.2 
    };

    const P1 = { x: tipX, y: tipY }; 

    // Calculate tail width based on fluffiness
    const baseWidth = 4 * ferret.tail.fluffiness;
    const currentWidth = baseWidth * 0.85;

    // Render tail curve
    ctx.lineWidth = currentWidth;
    ctx.strokeStyle = colors[2];
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(P0.x, P0.y);
    // Use quadratic curve from base (P0) through control (PC) to tip (P1)
    ctx.quadraticCurveTo(PC.x, PC.y, P1.x, P1.y);
    ctx.stroke();

    // Add subtle ground contact shadow
    if (!ferret.isStumbling) {
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      // Offset points for shadow
      const shadowOffset = 2; 
      const shadowP0 = { x: P0.x + 1, y: P0.y + shadowOffset };
      const shadowPC = { x: PC.x + 1, y: PC.y + shadowOffset };
      const shadowP1 = { x: P1.x + 1, y: P1.y + shadowOffset };

      ctx.moveTo(shadowP0.x, shadowP0.y);
      ctx.quadraticCurveTo(shadowPC.x, shadowPC.y, shadowP1.x, shadowP1.y);

      ctx.lineWidth = currentWidth * 0.6;
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}