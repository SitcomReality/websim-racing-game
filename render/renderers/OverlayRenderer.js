  renderCountdown(ctx) {
    if (!this.renderManager.raceEndCountdown || !this.renderManager.raceEndCountdown.active) return;

    const w = ctx.canvas.width / this.renderManager.dpr;
    const h = ctx.canvas.height / this.renderManager.dpr;
    const timeLeft = Math.max(0, Math.ceil((this.renderManager.raceEndCountdown.endTime - performance.now()) / 1000));

    ctx.save();

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(w/2 - 120, 20, 240, 40);

    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(w/2 - 120, 20, 240, 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Race ends in: ${timeLeft}s`, w/2, 40);

    const totalTime = 30000;
    const elapsed = performance.now() - this.renderManager.raceEndCountdown.startTime;
    const progress = Math.max(0, 1 - (elapsed / totalTime));
    const barWidth = 200;
    const barHeight = 4;
    const barX = w/2 - barWidth/2;
    const barY = 55;

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = progress > 0.3 ? '#44ff44' : '#ff4444';
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    ctx.restore();

    if (timeLeft <= 0) {
      this.renderManager.endRaceEarly();
    }
  }

