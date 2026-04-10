import { FerretEarRenderer } from './FerretEarRenderer.js';
import { FerretNoseRenderer } from './FerretNoseRenderer.js';

/**
 * FerretHeadRenderer - Renders ferret head components
 */

export class FerretHeadRenderer {
  constructor() {
    this.earRenderer = new FerretEarRenderer();
    this.noseRenderer = new FerretNoseRenderer();
  }

  render(ctx, ferret, colors, time, racer) {
    // New: Position head based on the front of the particle chain
    if (ferret.bodyChain?.enabled && ferret.bodyChain.nodes.length > 0) {
      // FIX: Node 0 is Hip/Tail, Node N-1 is Head.
      const N = ferret.bodyChain.nodes.length;
      const headNode = ferret.bodyChain.nodes[N - 1];
      // Get tangent from the last two nodes to determine rotation
      const prevNode = N > 1 ? ferret.bodyChain.nodes[N - 2] : headNode; 
      const tangentX = headNode.x - prevNode.x;
      const tangentY = headNode.y - prevNode.y;
      const angle = Math.atan2(tangentY, tangentX);
      
      ctx.save();
      ctx.translate(headNode.x, headNode.y);
      ctx.rotate(angle);
      
      const base = 12 * (ferret.head.size || 1);
      const round = ferret.head.roundness ?? 0.3;
      const rx = base * (1 + round * 0.8), ry = base * (1 - round * 0.4);
      const headX = 0, headY = 0;

      ctx.beginPath(); 
      ctx.ellipse(headX, headY, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = colors[0];
      ctx.fill();
      ctx.stroke();

      // Render features relative to the new transformed head position
      this.earRenderer.render(ctx, ferret, colors, headX, headY, rx);
      this.noseRenderer.render(ctx, ferret, colors, headX + rx, headY, time, racer);
      this.renderUnderbite(ctx, ferret, headX, headY, rx);
      
      ctx.restore();
      return;
    }

    const bodyLength = ferret.body.length * 30;
    const attachX = -5 + bodyLength / 2;
    const base = 12 * (ferret.head.size || 1);
    const round = ferret.head.roundness ?? 0.3;
    const rx = base * (1 + round * 0.8), ry = base * (1 - round * 0.4);
    const headX = attachX + rx, headY = 0;

    ctx.beginPath(); 
    ctx.ellipse(headX, headY, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = colors[0];
    ctx.fill();
    ctx.stroke();

    // Ears (biased left)
    this.earRenderer.render(ctx, ferret, colors, headX, headY, rx);

    // Nose (at right-most point)
    this.noseRenderer.render(ctx, ferret, colors, headX + rx, headY, time, racer);

    // Underbite aligned with ellipse
    this.renderUnderbite(ctx, ferret, headX, headY, rx);
  }

  renderUnderbite(ctx, ferret, headX, headY, headSize) {
    if (ferret.head.underbiteDepth > 0.02) {
      const d = ferret.head.underbiteDepth * 6;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); 
      ctx.moveTo(headX + headSize*0.4, headY + headSize*0.25);
      ctx.lineTo(headX + headSize*0.2 + d, headY + headSize*0.38 + d*0.4);
      ctx.lineTo(headX, headY + headSize*0.25); 
      ctx.closePath(); 
      ctx.fill();
    }
  }
}