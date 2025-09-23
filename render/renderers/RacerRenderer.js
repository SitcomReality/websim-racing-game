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

      // Replace blob drawing with ferret drawing
      this.drawFerret(ctx, screen.x, screen.y, racer, time, screen.scale);

      if (racer.isBoosting && Math.random() < 0.3) {
        // Emit boost particles from the racer's position
        const screen = worldTransform.worldToScreen(
          race.liveLocations[rid] || 0,
          idx,
          window.canvasRenderer ? window.canvasRenderer.camera : null,
          window.canvasRenderer ? window.canvasRenderer.canvas.width : 800,
          window.canvasRenderer ? window.canvasRenderer.canvas.height : 520,
          window.canvasRenderer && window.canvasRenderer.props ? window.canvasRenderer.props.numberOfLanes : 10
        );
        if (window.canvasRenderer && window.canvasRenderer.particleSystem) {
          window.canvasRenderer.particleSystem.emit(
            screen.x, 
            screen.y, 
            Math.PI, // angle pointing left (behind)
            80 * screen.scale, 
            2, 
            'rgba(255,255,255,0.8)'
          );
        }
      }

      // Check if we should show the countdown timer
      if (window.canvasRenderer && window.canvasRenderer.raceEndCountdown && window.canvasRenderer.raceEndCountdown.active) {
        window.canvasRenderer.renderCountdown(ctx);
      }
    }

    const leaderList = document.getElementById('leaderList');
    if (leaderList && race && Array.isArray(race.racers)) {
      const sorted = race.racers.slice().sort((a,b)=> (race.liveLocations[b]||0)-(race.liveLocations[a]||0));
      leaderList.innerHTML = '';
      sorted.slice(0,5).forEach((rid,i)=>{ const r = gameState.racers[rid]; if(!r) return; const li = document.createElement('li'); li.textContent = `${i+1}. ${getRacerNameString(r)}`; leaderList.appendChild(li); });
    }
  }

  drawFerret(ctx, x, y, racer, time, scale = 1) {
    const ferret = racer.ferret;
    const colors = racer.colors.map(c => racerColors[c]);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Ferret body proportions
    const bodyLength = ferret.body.length * 30;
    const bodyHeight = ferret.body.height * 20;
    const stockiness = ferret.body.stockiness;

    // Draw body (elongated ellipse)
    ctx.beginPath();
    ctx.ellipse(0, 0, bodyLength/2, bodyHeight/2, 0, 0, Math.PI * 2);
    ctx.fillStyle = colors[0];
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw head (circle at front of body)
    const headX = bodyLength/2 - 8;
    const headY = 0;
    const headSize = 12 * ferret.head.earSize;
    
    ctx.beginPath();
    ctx.arc(headX, headY, headSize, 0, Math.PI * 2);
    ctx.fillStyle = colors[0];
    ctx.fill();
    ctx.stroke();

    // Draw nose/snout
    const noseLength = ferret.head.noseLength * 8;
    ctx.beginPath();
    ctx.ellipse(headX + noseLength, headY, noseLength/2, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = colors[1];
    ctx.fill();
    ctx.stroke();

    // Draw eye (single eye visible from side view)
    const eyeX = headX - 2;
    const eyeY = headY - 4;
    const eyeSize = 3;
    
    // Eye background
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    
    // Pupil
    ctx.beginPath();
    ctx.arc(eyeX + ferret.eye.pupil.x, eyeY + ferret.eye.pupil.y, eyeSize/2, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();

    // Draw tail (curved line extending from back of body)
    const tailStartX = -bodyLength/2;
    const tailStartY = 0;
    const tailLength = ferret.tail.length * 25;
    const tailFluffiness = ferret.tail.fluffiness;
    
    ctx.beginPath();
    ctx.moveTo(tailStartX, tailStartY);
    ctx.quadraticCurveTo(
      tailStartX - tailLength/2, 
      tailStartY - tailFluffiness * 10, 
      tailStartX - tailLength, 
      tailStartY - tailFluffiness * 5
    );
    ctx.lineWidth = 6 * tailFluffiness;
    ctx.strokeStyle = colors[2];
    ctx.lineCap = 'round';
    ctx.stroke();

    // Draw legs (simple lines for now)
    const legLength = ferret.legs.length * 15;
    const legThickness = ferret.legs.thickness;
    
    // Front legs
    ctx.beginPath();
    ctx.moveTo(bodyLength/4, bodyHeight/4);
    ctx.lineTo(bodyLength/4, bodyHeight/4 + legLength);
    ctx.lineWidth = 3 * legThickness;
    ctx.strokeStyle = colors[1];
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // Back legs
    ctx.beginPath();
    ctx.moveTo(-bodyLength/4, bodyHeight/4);
    ctx.lineTo(-bodyLength/4, bodyHeight/4 + legLength);
    ctx.lineWidth = 3 * legThickness;
    ctx.stroke();

    ctx.restore();
  }

  getScreenPositions() {
    return this.screenPositions;
  }
}

window.RacerRenderer = RacerRenderer;