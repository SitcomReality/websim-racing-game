import { SplineUtils } from './SplineUtils.js';

/**
 * FerretTailRenderer - Renders ferret tail with physics-based animation
 */
export class FerretTailRenderer {
  constructor() {
    // Tail rendering state managed per ferret instance
  }

  render(ctx, ferret, colors) {
    // If body chain exists, attach the tail to node 0 (the hip/tail base) and render a thick spline
    if (ferret.bodyChain?.enabled && ferret.bodyChain.nodes.length >= 2) {
      const nodes = ferret.bodyChain.nodes; 
      
      // 1. Identify tail base (Node 0) and the preceding body node (Node 1)
      const tailBase = nodes[0];
      const tailNext = nodes[1];

      // 2. Calculate the backward direction (from tailNext towards tailBase)
      const dx = tailBase.x - tailNext.x;
      const dy = tailBase.y - tailNext.y;
      const L = Math.hypot(dx, dy) || 1;
      
      // 3. Calculate animation parameters for sway and gravity
      // Lateral sway (perpendicular to body), smoothed over time
      const dirX = dx / L, dirY = dy / L, nx = -dirY, ny = dirX;
      const phase = ferret.gait.cyclePhase;
      const targetSway = Math.sin(phase * 0.6 + (ferret.seed % 997) * 0.015) * (2 + ferret.gait.stride * 2);
      ferret._tailSway = ferret._tailSway == null ? targetSway : ferret._tailSway + (targetSway - ferret._tailSway) * 0.15;
      const droop = ferret.isStumbling ? 14 : 8;
      const extensionLength = ferret.tail.length * 15;
      
      const bodyEndThickness = ferret.bodyChain.params?.thicknessEnd || 10;
      
      // 4. Define virtual control points for the tail spline (P1 is start/base)
      const P1 = tailBase;
      // Mid-tail point, offset by sway and gravity. Sway is amplified towards the tip.
      const P2 = {
        x: P1.x + dirX * extensionLength * 0.5 + nx * ferret._tailSway * 0.6,
        y: P1.y + dirY * extensionLength * 0.5 + droop * 0.5
      };
      // Tip point, full extension, max gravity and sway
      const P3 = { 
        x: P1.x + dirX * extensionLength + nx * ferret._tailSway * 1.2,
        y: P1.y + dirY * extensionLength + droop
      };

      // 5. Sample the Catmull-Rom spline defined by [P1, P2, P3]
      // We use P1, P2, P3 as the points for the spline 
      const tailSplinePts = [P1, P2, P3];
      const finalSpline = SplineUtils.samplePolyline(tailSplinePts, 11);

      const startW = bodyEndThickness * 0.8 * (ferret.tail.fluffiness || 1); 
      const endW = (ferret.tail.fluffiness || 1) * 2;
      
      // Render the tail using the third racer color
      SplineUtils.renderThickSpline(ctx, finalSpline, startW, endW, colors[2]);
      
      return;
    }

    // Fallback: simple tapered stroke behind the body
    const w = Math.max(1, (ferret.tail.fluffiness || 1) * 3);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-ferret.tail.length * 25, 2);
    ctx.lineWidth = w; ctx.strokeStyle = colors[2]; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  }

  shadeColor(color, percent) {
    let R = parseInt(color.substring(1,3),16);
    let G = parseInt(color.substring(3,5),16);
    let B = parseInt(color.substring(5,7),16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  

    R = Math.round(R);
    G = Math.round(G);
    B = Math.round(B);

    const RR = ((R.toString(16).length===1)?"0"+R.toString(16):R.toString(16));
    const GG = ((G.toString(16).length===1)?"0"+G.toString(16):G.toString(16));
    const BB = ((B.toString(16).length===1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
  }
}