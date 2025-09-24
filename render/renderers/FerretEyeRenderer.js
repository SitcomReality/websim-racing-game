/**
 * FerretEyeRenderer - Renders ferret eyes with blinking and tracking
 */
export class FerretEyeRenderer {
  constructor() {
    // Eye rendering state managed per ferret instance
  }

  render(ctx, ferret, colors) {
    const headX = ferret.body.length * 15 - 2;
    const headY = -4;
    
    this.renderEye(ctx, headX, headY, ferret, colors);
  }

  renderEye(ctx, eyeX, eyeY, ferret, colors) {
    const eyeSize = 3;
    
    // Calculate blink amount
    const blinkAmount = ferret.eye.isBlinking ? Math.sin(ferret.eye.blinkPhase) : 0;
    const upperLidOffset = (ferret.eye.upperLid + blinkAmount * 0.8) * eyeSize;
    const lowerLidOffset = (ferret.eye.lowerLid + blinkAmount * 0.3) * eyeSize;
    
    // Eye background (white of eye)
    ctx.save();
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.clip();
    
    // Draw eye white, accounting for eyelids
    ctx.fillStyle = '#fff';
    ctx.fillRect(eyeX - eyeSize, eyeY - eyeSize + upperLidOffset, eyeSize * 2, (eyeSize * 2) - upperLidOffset - lowerLidOffset);
    
    // Draw pupil with tracking
    if (!ferret.eye.isBlinking || blinkAmount < 0.9) {
      const pupilX = eyeX + ferret.eye.pupil.x * 0.8;
      const pupilY = eyeY + ferret.eye.pupil.y * 0.8;
      const pupilSize = eyeSize * 0.6;
      
      ctx.beginPath();
      ctx.arc(pupilX, pupilY, pupilSize, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();
    }
    
    ctx.restore();
    
    // Draw eyelids over the eye
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    
    // Upper eyelid
    if (upperLidOffset > 0) {
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, eyeSize + 0.5, 0, Math.PI * 2);
      ctx.arc(eyeX, eyeY + upperLidOffset, eyeSize + 0.5, 0, Math.PI * 2, true);
      ctx.fill();
    }
    
    // Lower eyelid
    if (lowerLidOffset > 0) {
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, eyeSize + 0.5, 0, Math.PI * 2);
      ctx.arc(eyeX, eyeY - lowerLidOffset, eyeSize + 0.5, 0, Math.PI * 2, true);
      ctx.fill();
    }
  }
}