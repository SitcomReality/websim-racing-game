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
    let bodyHeight = ferret.body.height * 20;
    bodyHeight *= ferret.body.stockiness;

    // Calculate running animation based on current speed
    const currentSpeed = racer.speedThisRace[racer.speedThisRace.length - 1] || 10;
    const baseSpeed = gameState.settings.racerProperties.speedBase;
    const speedRatio = currentSpeed / baseSpeed;
    /* Running style based on proportions */
    const styleFactor = (ferret.body.stockiness > 1 ? 0.92 : 1.08) * (ferret.legs.length > 1 ? 1.08 : 0.96);
    
    // Update gait cycle based on movement speed
    ferret.gait.cyclePhase += speedRatio * 0.15;
    if (ferret.gait.cyclePhase > Math.PI * 2) ferret.gait.cyclePhase -= Math.PI * 2;
    
    // Calculate stride length based on speed
    const strideLength = ferret.gait.stride * (10 + speedRatio * 5) * styleFactor;
    const headBob = Math.sin(ferret.gait.cyclePhase * 2) * (1 + speedRatio) * 1.2;

    // Handle stumbling/crash animation
    let bodyRotation = 0;
    let bodyOffsetY = 0;
    if (ferret.isStumbling) {
        // Update crash animation phase
        ferret.crashPhase += 0.2;
        
        // Tumbling rotation effect
        bodyRotation = Math.sin(ferret.crashPhase * 3) * 0.8;
        
        // Bouncing/hitting ground effect
        const bouncePhase = Math.sin(ferret.crashPhase * 4);
        bodyOffsetY = Math.max(0, bouncePhase * 8);
        
        // Reset crash when stumble ends
        if (racer.remainingStumble <= 1) {
            ferret.isStumbling = false;
            ferret.crashPhase = 0;
        }
    }

    // Apply crash transformation
    ctx.rotate(bodyRotation);
    ctx.translate(0, bodyOffsetY);

    // Update independent eye behavior
    this.updateFerretEye(ferret, racer, time);

    // Draw body (elongated ellipse)
    ctx.beginPath();
    ctx.ellipse(-5, 0, bodyLength/2, bodyHeight/2, 0, 0, Math.PI * 2);
    ctx.fillStyle = colors[0];
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Coat pattern: dorsal banding
    if (ferret.coat && ferret.coat.pattern === 'banded') {
      ctx.fillStyle = colors[ferret.coat.stripeIndex] || colors[1];
      ctx.globalAlpha = 0.6;
      ctx.fillRect(-bodyLength/2 + 6, -bodyHeight*0.15, bodyLength - 12, bodyHeight*0.3);
      ctx.globalAlpha = 1.0;
    }

    // Draw head (circle at front of body)
    const headX = bodyLength/2 - 8;
    let headY = 0; headY += headBob; // subtle head bob
    const headSize = 12 * (ferret.head.headType === 'rounded' ? 1.1 : 0.9) * ferret.head.earSize;
    
    ctx.beginPath();
    ctx.arc(headX, headY, headSize, 0, Math.PI * 2);
    ctx.fillStyle = colors[0];
    ctx.fill();
    ctx.stroke();

    // Ears (shape/size variation)
    ctx.fillStyle = colors[2];
    const earR = Math.max(3, headSize * 0.35);
    const earFlap = Math.sin(ferret.gait.cyclePhase * 3) * Math.min(6, 6 * speedRatio * (racer.isBoosting ? 1.4 : 1));
    if (ferret.head.earShape === 'pointy') {
      [[-headSize*0.2,-headSize*0.9 + earFlap],[headSize*0.2,-headSize*0.9 + earFlap]].forEach(offset=>{
        ctx.beginPath(); ctx.moveTo(headX+offset[0], headY+offset[1]);
        ctx.lineTo(headX+offset[0]-earR, headY+offset[1]+earR);
        ctx.lineTo(headX+offset[0]+earR, headY+offset[1]+earR); ctx.closePath(); ctx.fill(); ctx.stroke();
      });
    } else {
      [[-headSize*0.3,-headSize*0.8 + earFlap],[headSize*0.3,-headSize*0.8 + earFlap]].forEach(offset=>{
        ctx.beginPath(); ctx.arc(headX+offset[0], headY+offset[1], earR, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      });
    }

    // Draw nose/snout
    const noseLength = ferret.head.noseLength * 8;
    const noseTwitch = ferret.isStumbling ? 0 : Math.sin(time * 10 + racer.id) * 0.8;
    ctx.beginPath();
    ctx.ellipse(headX + noseLength + noseTwitch, headY, noseLength/2, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = colors[1];
    ctx.fill();
    ctx.stroke();

    // Underbite/jaw
    if (ferret.head.underbiteDepth > 0.02) {
      const d = ferret.head.underbiteDepth * 6;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.moveTo(headX + headSize*0.6, headY + headSize*0.3);
      ctx.lineTo(headX + headSize*0.3 + d, headY + headSize*0.45 + d*0.4);
      ctx.lineTo(headX + headSize*0.1, headY + headSize*0.3); ctx.closePath(); ctx.fill();
    }

    // Draw eye with independent tracking and blinking
    this.drawFerretEye(ctx, headX, headY, ferret, time);

    // Draw tail (curved line extending from back of body)
    const tailStartX = -bodyLength/2 - 5;
    const tailStartY = -bodyHeight/4;
    const tailLength = ferret.tail.length * 25;
    const tailFluffiness = ferret.tail.fluffiness;
    const tailSway = ferret.isStumbling
      ? Math.sin(ferret.crashPhase * 5) * 8
      : Math.sin(ferret.gait.cyclePhase * 2) * (3 + Math.min(4, speedRatio * 3));
    
    ctx.beginPath();
    ctx.moveTo(tailStartX, tailStartY);
    ctx.quadraticCurveTo(
      tailStartX - tailLength/2, 
      tailStartY - tailFluffiness * 10 + tailSway, 
      tailStartX - tailLength, 
      tailStartY - tailFluffiness * 5 + tailSway
    );
    ctx.lineWidth = 6 * tailFluffiness;
    ctx.strokeStyle = colors[2];
    ctx.lineCap = 'round';
    ctx.stroke();

    // Draw legs with running animation or crash animation
    const legLength = ferret.legs.length * 15;
    const legThickness = ferret.legs.thickness;
    
    let legPositions;
    if (ferret.isStumbling) {
        // Scrambling/crashing leg positions
        const scramblePhase = ferret.crashPhase * 6;
        legPositions = [
            { x: bodyLength/3 + Math.sin(scramblePhase) * 8, y: bodyHeight/4 + Math.cos(scramblePhase * 1.3) * 4 },
            { x: bodyLength/3 - 5 + Math.sin(scramblePhase + 1) * 6, y: bodyHeight/4 + Math.cos(scramblePhase * 1.1) * 3 },
            { x: -bodyLength/4 + Math.sin(scramblePhase + 2) * 7, y: bodyHeight/4 + Math.cos(scramblePhase * 0.9) * 5 },
            { x: -bodyLength/4 - 5 + Math.sin(scramblePhase + 3) * 5, y: bodyHeight/4 + Math.cos(scramblePhase * 1.2) * 4 }
        ];
    } else {
        // Normal running stride
        const strideOffset = Math.sin(ferret.gait.cyclePhase) * strideLength;
        const strideOffset2 = Math.sin(ferret.gait.cyclePhase + Math.PI) * strideLength * (ferret.legs.length > 1 ? 1.05 : 0.95);
        
        legPositions = [
            { x: bodyLength/3 + strideOffset, y: bodyHeight/4 },
            { x: bodyLength/3 - 5 + strideOffset2, y: bodyHeight/4 },
            { x: -bodyLength/4 + strideOffset2, y: bodyHeight/4 },
            { x: -bodyLength/4 - 5 + strideOffset, y: bodyHeight/4 }
        ];
    }
    
    // Draw all four legs
    legPositions.forEach((pos, i) => {
        ctx.beginPath();
        const startX = i < 2 ? (i === 0 ? bodyLength/3 : bodyLength/3 - 5) : (i === 2 ? -bodyLength/4 : -bodyLength/4 - 5);
        ctx.moveTo(startX, bodyHeight/4);
        ctx.lineTo(pos.x, pos.y + legLength);
        ctx.lineWidth = 3 * legThickness;
        ctx.strokeStyle = colors[1];
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Draw paw
        const pawSize = ferret.isStumbling ? 2 : 3; // Smaller paws when stumbling
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y + legLength, pawSize, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.restore();
  }

  updateFerretEye(ferret, racer, time) {
    const deltaTime = time - (ferret.eye.lastUpdateTime || time);
    ferret.eye.lastUpdateTime = time;

    // Update blink timer
    ferret.eye.blinkTimer -= deltaTime;
    if (ferret.eye.blinkTimer <= 0) {
      // Start a new blink cycle
      ferret.eye.blinkTimer = Math.random() * 4 + 2; // 2-6 seconds between blinks
      ferret.eye.isBlinking = true;
      ferret.eye.blinkPhase = 0;
    }

    // Update blink animation
    if (ferret.eye.isBlinking) {
      ferret.eye.blinkPhase += deltaTime * 8; // Blink speed
      if (ferret.eye.blinkPhase >= Math.PI) {
        ferret.eye.isBlinking = false;
        ferret.eye.blinkPhase = 0;
      }
    }

    // Eye tracking logic - look for nearby racers
    const currentRace = gameState.currentRace;
    if (currentRace && currentRace.racers) {
      const myLaneIndex = currentRace.racers.indexOf(racer.id);
      let targetFound = false;

      // Check adjacent lanes for targets
      for (let offset of [-1, 1]) {
        const targetLane = myLaneIndex + offset;
        if (targetLane >= 0 && targetLane < currentRace.racers.length) {
          const targetRacerId = currentRace.racers[targetLane];
          const targetX = currentRace.liveLocations[targetRacerId] || 0;
          const myX = currentRace.liveLocations[racer.id] || 0;
          
          // Only track if target is within reasonable distance
          if (Math.abs(targetX - myX) < 20) {
            ferret.eye.targetRid = targetRacerId;
            
            // Calculate look direction based on relative position
            const deltaX = targetX - myX;
            const distance = Math.abs(deltaX);
            const maxPupilOffset = 1.5;
            
            if (distance > 1) {
              ferret.eye.targetPupilX = Math.sign(deltaX) * Math.min(maxPupilOffset, distance / 10);
              ferret.eye.targetPupilY = (offset * 0.5); // Look slightly up/down based on lane
            } else {
              ferret.eye.targetPupilX = 1; // Default forward look
              ferret.eye.targetPupilY = 0;
            }
            targetFound = true;
            break;
          }
        }
      }

      // Default to looking forward if no target
      if (!targetFound) {
        ferret.eye.targetRid = null;
        ferret.eye.targetPupilX = 1; // Look forward (right)
        ferret.eye.targetPupilY = 0;
      }
    }

    // Smooth pupil movement
    const moveSpeed = 3;
    ferret.eye.pupil.x += (ferret.eye.targetPupilX - ferret.eye.pupil.x) * deltaTime * moveSpeed;
    ferret.eye.pupil.y += (ferret.eye.targetPupilY - ferret.eye.pupil.y) * deltaTime * moveSpeed;

    // Update eyelid expressions - slightly open/close based on mood
    const moodTimer = time * 0.5 + racer.id; // Each ferret has different phase
    ferret.eye.upperLid = 0.1 + Math.sin(moodTimer) * 0.05; // Subtle eyelid movement
    ferret.eye.lowerLid = 0.05 + Math.cos(moodTimer * 0.7) * 0.02;
  }

  drawFerretEye(ctx, headX, headY, ferret, time) {
    const eyeX = headX - 2;
    const eyeY = headY - 4;
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

  getScreenPositions() {
    return this.screenPositions;
  }
}

window.RacerRenderer = RacerRenderer;