class RacerRenderer {
  constructor() {
    this.screenPositions = [];
  }

  render(ctx, race, worldTransform, time) {
    this.screenPositions = [];

    for (let idx = 0; idx < race.racers.length; idx++) {
      const rid = race.racers[idx];
      const racer = gameState.racers[rid];
      const worldX = race.liveLocations[rid] || 0;
      const screen = worldTransform.worldToScreen(worldX, idx);

      this.screenPositions.push({ rid, x: screen.x, y: screen.y, r: 25 * screen.scale });

      this.drawBlob(ctx, screen.x, screen.y, racer, time, screen.scale);

      if (racer.isBoosting && Math.random() < 0.3) {
        // This would need to be refactored to work with the particle system
        // For now, it's commented out to avoid dependency issues
        // window.canvasRenderer.particleSystem.emit(screen.x - (20 * screen.scale), screen.y, Math.PI, 80, 2);
      }
    }

    const leaderList = document.getElementById('leaderList');
    if (leaderList && race && Array.isArray(race.racers)) {
      const sorted = race.racers.slice().sort((a,b)=> (race.liveLocations[b]||0)-(race.liveLocations[a]||0));
      leaderList.innerHTML = '';
      sorted.slice(0,5).forEach((rid,i)=>{ const r = gameState.racers[rid]; if(!r) return; const li = document.createElement('li'); li.textContent = `${i+1}. ${getRacerNameString(r)}`; leaderList.appendChild(li); });
    }
  }

  drawBlob(ctx, x, y, racer, time, scale = 1) {
    const blob = racer.blobData;
    const breathing = Math.sin(time * 2) * 3;

    let scaleX = 1;
    let scaleY = 1;
    if (racer.isBoosting) {
        const boostEffect = Math.sin(time * 20) * 0.1;
        scaleX = 1.2 + boostEffect;
        scaleY = 0.8 - boostEffect;
    } else {
        const wobble = Math.sin(time * 5 + blob.controlPoints[0].wobblePhase) * 0.05;
        scaleX = 1 + wobble;
        scaleY = 1 - wobble;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scaleX * scale, scaleY * scale);

    ctx.beginPath();
    const points = blob.controlPoints;
    const N = points.length;

    for (let i = 0; i < N; i++) {
      const p = points[i];
      const next = points[(i + 1) % N];
      const prev = points[(i - 1 + N) % N];

      const wobble = Math.sin(time * 2 + p.wobblePhase) * (blob.baseRadius * 0.05);
      const radius = p.rad + breathing + wobble;
      const px = Math.cos(p.ang) * radius;
      const py = Math.sin(p.ang) * radius;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        const cpx = (px + Math.cos(prev.ang) * (prev.rad + breathing)) / 2;
        const cpy = (py + Math.sin(prev.ang) * (prev.rad + breathing)) / 2;
        ctx.quadraticCurveTo(cpx, cpy, px, py);
      }
    }
    ctx.closePath();

    const col = racerColors[racer.colors[0]];
    ctx.fillStyle = col;
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    this.drawEyes(ctx, blob, time);
    this.drawMouth(ctx, blob);

    ctx.restore();
  }

  drawEyes(ctx, blob, time) {
    const eyeOffset = blob.baseRadius * 0.3;
    const eyeSize = blob.baseRadius * 0.15;

    ctx.beginPath();
    ctx.arc(-eyeOffset, -eyeOffset, eyeSize, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(eyeOffset, -eyeOffset, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    const pupilOffset = Math.sin(time * 0.5) * 2;
    ctx.beginPath();
    ctx.arc(-eyeOffset + pupilOffset, -eyeOffset, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.arc(eyeOffset + pupilOffset, -eyeOffset, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();

    if (Math.sin(time * 8) > 0.9) {
      ctx.fillStyle = '#000';
      ctx.fillRect(-eyeOffset - eyeSize, -eyeOffset - eyeSize/2, eyeSize * 2, eyeSize);
      ctx.fillRect(eyeOffset - eyeSize, -eyeOffset - eyeSize/2, eyeSize * 2, eyeSize);
    }
  }

  drawMouth(ctx, blob) {
    const mouthY = blob.baseRadius * 0.2;
    const mouthWidth = blob.baseRadius * 0.4;

    ctx.beginPath();
    ctx.arc(0, mouthY, mouthWidth, 0, Math.PI);
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  getScreenPositions() {
    return this.screenPositions;
  }
}

window.RacerRenderer = RacerRenderer;