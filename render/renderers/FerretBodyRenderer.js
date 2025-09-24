class FerretBodyRenderer {
  renderBody(ctx, ferret, colors) {
    const bodyLength = ferret.body.length * 30;
    let bodyHeight = ferret.body.height * 20;
    bodyHeight *= ferret.body.stockiness;

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
  }

  renderHead(ctx, ferret, colors, time, racer) {
    const headX = ferret.body.length * 15 - 8;
    const headY = 0;
    const headSize = 12 * (ferret.head.headType === 'rounded' ? 1.1 : 0.9) * ferret.head.earSize;

    ctx.beginPath();
    ctx.arc(headX, headY, headSize, 0, Math.PI * 2);
    ctx.fillStyle = colors[0];
    ctx.fill();
    ctx.stroke();

    // Ears
    this.renderEars(ctx, ferret, colors, headX, headY, headSize);

    // Nose
    this.renderNose(ctx, ferret, colors, headX, headY, time, racer);

    // Underbite
    this.renderUnderbite(ctx, ferret, headX, headY, headSize);
  }

  renderEars(ctx, ferret, colors, headX, headY, headSize) {
    ctx.fillStyle = colors[2];
    const earR = Math.max(3, headSize * 0.35);
    const earFlap = Math.sin(ferret.gait.cyclePhase * 3) * Math.min(6, 6 * (ferret.isStumbling ? 0.5 : 1));

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
  }

  renderNose(ctx, ferret, colors, headX, headY, time, racer) {
    const noseLength = ferret.head.noseLength * 8;
    const noseTwitch = ferret.isStumbling ? 0 : Math.sin(time * 10 + (racer?.id || 0)) * 0.8;

    ctx.beginPath();
    ctx.ellipse(headX + noseLength + noseTwitch, headY, noseLength/2, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = colors[1];
    ctx.fill();
    ctx.stroke();
  }

  renderUnderbite(ctx, ferret, headX, headY, headSize) {
    if (ferret.head.underbiteDepth > 0.02) {
      const d = ferret.head.underbiteDepth * 6;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.moveTo(headX + headSize*0.6, headY + headSize*0.3);
      ctx.lineTo(headX + headSize*0.3 + d, headY + headSize*0.45 + d*0.4);
      ctx.lineTo(headX + headSize*0.1, headY + headSize*0.3); ctx.closePath(); ctx.fill();
    }
  }

  renderTail(ctx, ferret, colors) {
    const bodyLength = ferret.body.length * 30;
    const tailStartX = -bodyLength/2 - 5;
    const tailStartY = -ferret.body.height * 5;
    const tailLength = ferret.tail.length * 25;
    const tailFluffiness = ferret.tail.fluffiness;
    const tailSway = ferret.isStumbling
      ? Math.sin(ferret.crashPhase * 5) * 8
      : Math.sin(ferret.gait.cyclePhase * 2) * (3 + Math.min(4, ferret.gait.stride * 3));

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
  }

  // draw farSideOnly = true to draw legs that should appear behind the body,
  // false to draw the ones on the visible (near) side
  renderLegs(ctx, ferret, colors, farSideOnly = false) {
    const bodyLength = ferret.body.length * 30;
    const bodyHeight = ferret.body.height * 20 * ferret.body.stockiness;
    const legLength = ferret.legs.length * 15;
    const legThickness = ferret.legs.thickness;

    let legPositions;
    if (ferret.isStumbling) {
      // Scrambling/crashing leg positions
      const scramblePhase = ferret.crashPhase * 6;
      legPositions = [
        { x: bodyLength/3 + Math.sin(scramblePhase) * 8, y: bodyLength/4 + Math.cos(scramblePhase * 1.3) * 4, lift: 0 },
        { x: bodyLength/3 - 5 + Math.sin(scramblePhase + 1) * 6, y: bodyLength/4 + Math.cos(scramblePhase * 1.1) * 3, lift: 0 },
        { x: -bodyLength/4 + Math.sin(scramblePhase + 2) * 7, y: bodyLength/4 + Math.cos(scramblePhase * 0.9) * 5, lift: 0 },
        { x: -bodyLength/4 - 5 + Math.sin(scramblePhase + 3) * 5, y: bodyLength/4 + Math.cos(scramblePhase * 1.2) * 4, lift: 0 }
      ];
    } else {
      // Normal running stride
      const strideLength = ferret.gait.stride * 10;
      const stridePhase = ferret.gait.cyclePhase;
      const strideOffset = Math.sin(stridePhase) * strideLength;
      const strideOffset2 = Math.sin(stridePhase + Math.PI) * strideLength * (ferret.legs.length > 1 ? 1.05 : 0.95);

      // Determine foot lift. Lift happens when foot is moving forward (positive velocity)
      const liftHeight = 8;
      const cosPhase = Math.cos(stridePhase);
      const liftAmount = cosPhase > 0 ? cosPhase * liftHeight : 0;
      const liftAmount2 = -cosPhase > 0 ? -cosPhase * liftHeight : 0;

      legPositions = [
        { x: bodyLength/3 + strideOffset, y: bodyHeight/4, lift: liftAmount },
        { x: bodyLength/3 - 5 + strideOffset2, y: bodyHeight/4, lift: liftAmount2 },
        { x: -bodyLength/4 + strideOffset2, y: bodyHeight/4, lift: liftAmount2 },
        { x: -bodyLength/4 - 5 + strideOffset, y: bodyHeight/4, lift: liftAmount }
      ];
    }

    // Decide which legs to draw this pass:
    // legs 0 (front near),1 (front far),2 (rear near),3 (rear far) - we'll treat indices 1 and 3 as far-side.
    const farIndices = [1, 3];
    const nearIndices = [0, 2];
    const indicesToDraw = farSideOnly ? farIndices : nearIndices;

    indicesToDraw.forEach((i) => {
      const pos = legPositions[i];
      const sideOffset = farSideOnly ? 2 : 0; // subtle horizontal offset for depth
      const finalLegLength = legLength - pos.lift;

      const startX = i < 2 ? (i === 0 ? bodyLength/3 : bodyLength/3 - 5) : (i === 2 ? -bodyLength/4 : -bodyLength/4 - 5);
      // Skip any leg that doesn't have horizontal stride (removes duplicate "up–down only" legs)
      if (Math.abs(pos.x - startX) < 1) return;

      ctx.beginPath();
      ctx.moveTo(startX + (farSideOnly ? -sideOffset : sideOffset), bodyHeight/4);
      ctx.lineTo(pos.x + (farSideOnly ? -sideOffset : sideOffset), pos.y + finalLegLength);
      ctx.lineWidth = 3 * legThickness;
      // far-side legs should be slightly dimmer to sell depth
      ctx.strokeStyle = farSideOnly ? shadeColor(colors[1] || '#000000', -25) : (colors[1] || '#000');
      ctx.lineCap = 'round';
      ctx.stroke();

      // Draw paw
      const pawSize = ferret.isStumbling ? 2 : 3;
      ctx.fillStyle = farSideOnly ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.arc(pos.x + (farSideOnly ? -sideOffset : sideOffset), pos.y + finalLegLength, pawSize, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

window.FerretBodyRenderer = FerretBodyRenderer;