import { SplineUtils } from './SplineUtils.js';

/**
 * FerretTailRenderer - Renders ferret tail with physics-based animation
 */
export class FerretTailRenderer {
  constructor() {
    // Tail rendering state managed per ferret instance
  }

  render(ctx, ferret, colors) {
    if (ferret.tailChain?.enabled && ferret.tailChain.nodes.length >= 2) {
      const pts = SplineUtils.samplePolyline(ferret.tailChain.nodes, 16);
      const startW = (ferret.tailChain.params?.thicknessStart || 8) * (ferret.tail.fluffiness || 1);
      const endW = (ferret.tailChain.params?.thicknessEnd || 2) * (ferret.tail.fluffiness || 1);
      SplineUtils.renderThickSpline(ctx, pts, startW, endW, colors[2]);
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