/**
 * FerretNoseRenderer - Renders ferret nose and mouth
 */
export class FerretNoseRenderer {
  constructor() {
    // Nose rendering state managed per ferret instance
  }

  render(ctx, ferret, colors, headX, headY, time, racer) {
    const noseSize = 2;
    const noseX = headX;
    const noseY = headY;
    
    // Draw nose
    ctx.beginPath();
    ctx.arc(noseX, noseY, noseSize, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fill();
    
    // Draw nostrils
    ctx.beginPath();
    ctx.arc(noseX - 0.5, noseY - 0.5, 0.5, 0, Math.PI * 2);
    ctx.arc(noseX + 0.5, noseY - 0.5, 0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();
    
    // Draw mouth line
    ctx.beginPath();
    ctx.moveTo(noseX, noseY + noseSize);
    ctx.lineTo(noseX, noseY + noseSize + 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}