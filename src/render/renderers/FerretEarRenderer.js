/** 
 * FerretEarRenderer - Renders ferret ears with animation 
 */ 
export class FerretEarRenderer {
  constructor() {
    // Ear rendering state managed per ferret instance
  }

  render(ctx, ferret, colors, headX, headY, headSize) {
    const earValue = ferret.ear?.value || 0;
    const earAngle = this.calculateEarAngle(earValue, ferret.ear?.reverse);

    // Ear position relative to head center
    const earOffsetX = headSize * 0.6;
    const earOffsetY = -headSize * 0.4;
    const earSize = 4 * (ferret.head.earSize || 1);

    ctx.save();
    ctx.translate(headX + earOffsetX, headY + earOffsetY);
    ctx.rotate(earAngle);

    // Draw ear shape based on head type
    if (ferret.head.earShape === 'pointy') {
      // Pointy ear
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-earSize, -earSize * 1.5);
      ctx.lineTo(earSize, -earSize * 1.5);
      ctx.closePath();
      ctx.fillStyle = colors[0];
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      // Round ear
      ctx.beginPath();
      ctx.arc(0, -earSize, earSize, 0, Math.PI * 2);
      ctx.fillStyle = colors[0];
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }

  calculateEarAngle(earValue, reverse = false) {
    const v = Math.max(0, Math.min(1, earValue ?? 0));
    const downAngle = 70 * Math.PI / 180;
    const upAngle = -10 * Math.PI / 180;
    let earAngle = downAngle + (upAngle - downAngle) * v;
    if (reverse) earAngle = -earAngle;
    return earAngle;
  }
}