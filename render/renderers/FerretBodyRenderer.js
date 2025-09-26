import { SplineUtils } from "spline-utils";

/**
 * FerretBodyRenderer - Renders ferret body parts
 */
export class FerretBodyRenderer {
  renderBody(ctx, ferret, colors) {
    if (ferret.bodyChain?.enabled && ferret.bodyChain?.nodes?.length >= 2) {
      const pts = SplineUtils.samplePolyline(ferret.bodyChain.nodes, 24);
      const startW = (ferret.bodyChain.params?.thicknessStart || 12) * (ferret.body?.stockiness || 1);
      const endW = (ferret.bodyChain.params?.thicknessEnd || 6) * (ferret.body?.stockiness || 1);
      SplineUtils.renderThickSpline(ctx, pts, startW, endW, colors[0]);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.5; ctx.stroke();
      return;
    }

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
    // New: Position head based on the front of the particle chain
    if (ferret.bodyChain?.enabled && ferret.bodyChain.nodes.length > 0) {
      const headNode = ferret.bodyChain.nodes[0];
      const nextNode = ferret.bodyChain.nodes[1];
      const tangentX = headNode.x - nextNode.x;
      const tangentY = headNode.y - nextNode.y;
      const angle = Math.atan2(tangentY, tangentX);
      
      ctx.save();
      ctx.translate(headNode.x, headNode.y);
      ctx.rotate(angle);
      
      const base = 12 * (ferret.head.size || 1);
      const round = ferret.head.roundness ?? 0.3;
      const rx = base * (1 + round * 0.8), ry = base * (1 - round * 0.4);
      const headX = 0, headY = 0;

      ctx.beginPath(); ctx.ellipse(headX, headY, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = colors[0];
      ctx.fill();
      ctx.stroke();

      // Render features relative to the new transformed head position
      this.renderEars(ctx, ferret, colors, headX, headY, rx);
      this.renderNose(ctx, ferret, colors, headX + rx, headY, time, racer);
      this.renderUnderbite(ctx, ferret, headX, headY, rx);
      
      ctx.restore();
      return;
    }

    const bodyLength = ferret.body.length * 30;
    const attachX = -5 + bodyLength / 2;
    const base = 12 * (ferret.head.size || 1);
    const round = ferret.head.roundness ?? 0.3;
    const rx = base * (1 + round * 0.8), ry = base * (1 - round * 0.4);
    const headX = attachX + rx, headY = 0; // anchor at left edge of head

    ctx.beginPath(); ctx.ellipse(headX, headY, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = colors[0];
    ctx.fill();
    ctx.stroke();

    // Ears (biased left)
    this.renderEars(ctx, ferret, colors, headX, headY, rx);

    // Nose (at right-most point)
    this.renderNose(ctx, ferret, colors, headX + rx, headY, time, racer);

    // Underbite aligned with ellipse
    this.renderUnderbite(ctx, ferret, headX, headY, rx);
  }

  renderEars(ctx, ferret, colors, headX, headY, headSize) {
    ctx.fillStyle = colors[2];
    const earBaseX = headX - headSize * 0.8; // bias further left
    const earBaseY = headY - headSize * 0.6;

    // Ear flap value: 0 = down, 1 = up
    const v = Math.max(0, Math.min(1, ferret.ear?.value ?? 0));

    // Map to angle (radians): down ~ 70deg, up ~ -10deg
    const downAngle = 70 * Math.PI / 180;
    const upAngle = -10 * Math.PI / 180;
    let earAngle = downAngle + (upAngle - downAngle) * v;
    if (ferret.ear?.reverse) earAngle = -earAngle;

    const baseLen = Math.max(3, headSize * 0.5);
    const len = baseLen;
    const w = Math.max(2, headSize * 0.18);

    // Draw single ear with rotation based on earAngle
    ctx.save();
    ctx.translate(earBaseX, earBaseY);
    ctx.rotate(earAngle);
    ctx.beginPath();
    ctx.moveTo(-w, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(0, -len);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  renderNose(ctx, ferret, colors, headX, headY, time, racer) {
    const noseLength = ferret.head.noseLength * 6;
    const noseTwitch = ferret.isStumbling ? 0 : Math.sin(time * 10 + (racer?.id || 0)) * 0.8;

    ctx.beginPath();
    ctx.ellipse(headX + noseTwitch, headY, Math.max(2, noseLength / 2), 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = colors[1];
    ctx.fill();
    ctx.stroke();
  }

  renderUnderbite(ctx, ferret, headX, headY, headSize) {
    if (ferret.head.underbiteDepth > 0.02) {
      const d = ferret.head.underbiteDepth * 6;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.moveTo(headX + headSize*0.4, headY + headSize*0.25);
      ctx.lineTo(headX + headSize*0.2 + d, headY + headSize*0.38 + d*0.4);
      ctx.lineTo(headX, headY + headSize*0.25); ctx.closePath(); ctx.fill();
    }
  }

  renderTail(ctx, ferret, colors) {
    const bodyLength = ferret.body.length * 30;
    const tailStartX = -bodyLength/2 - 5;
    const tailStartY = ferret.body.height * 5 * ferret.body.stockiness;
    const tailLength = ferret.tail.length * 25;
    const tailFluffiness = ferret.tail.fluffiness;
    
    // Much slower, more grounded tail movement
    const tailSway = ferret.isStumbling
      ? Math.sin(ferret.crashPhase * 3) * 6
      : Math.sin(ferret.gait.cyclePhase * 0.5 + ferret.seed % 1000 * 0.1) * (1 + ferret.gait.stride * 0.5);

    // Tail should drag along the ground with gentle sway
    const groundMargin = 8; // How close tail stays to ground
    const tailEndY = tailStartY + groundMargin + (ferret.isStumbling ? 0 : 2);
    
    // Create a gentle curve that drags along the ground
    const controlPointX = tailStartX - tailLength * 0.4;
    const controlPointY = tailStartY + groundMargin + (Math.abs(tailSway) * 0.3);
    
    ctx.beginPath();
    ctx.moveTo(tailStartX, tailStartY);
    ctx.quadraticCurveTo(
      controlPointX, 
      controlPointY, 
      tailStartX - tailLength, 
      tailEndY
    );
    
    // Tail should appear heavier/thicker at the base
    const baseWidth = 6 * tailFluffiness;
    const tipWidth = 3 * tailFluffiness;
    const currentWidth = baseWidth - (baseWidth - tipWidth) * (1 - Math.abs(tailSway) * 0.1);
    
    ctx.lineWidth = currentWidth;
    ctx.strokeStyle = colors[2];
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // Add subtle shadow underneath for ground contact effect
    if (!ferret.isStumbling) {
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(tailStartX, tailStartY + 2);
      ctx.quadraticCurveTo(
        controlPointX + 1, 
        controlPointY + 2, 
        tailStartX - tailLength + 1, 
        tailEndY + 2
      );
      ctx.lineWidth = currentWidth;
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  // draw farSideOnly = true to draw legs that should appear behind the body,
  // false to draw the ones on the visible (near) side
  renderLegs(ctx, ferret, colors, farSideOnly = false) {
    // New: Bounding gait driven by anchors
    if (ferret.bodyChain?.enabled) {
      this.renderBoundingLegs(ctx, ferret, colors, farSideOnly);
      return;
    }

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
      const hipX = startX + (farSideOnly ? -sideOffset : sideOffset);
      const hipY = bodyHeight/4;
      const footX = pos.x + (farSideOnly ? -sideOffset : sideOffset);
      const footY = hipY + finalLegLength;
      const bendDir = (footX - hipX) >= 0 ? 1 : -1;
      const kneeX = (hipX + footX) * 0.5 + bendDir * Math.min(6, Math.abs(footX - hipX) * 0.3);
      const kneeY = hipY + finalLegLength * 0.5 - 4;

      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(kneeX, kneeY);
      ctx.lineTo(footX, footY);
      ctx.lineWidth = 3 * legThickness;
      ctx.strokeStyle = farSideOnly ? this.shadeColor(colors[1] || '#000000', -25) : (colors[1] || '#000');
      ctx.lineCap = 'round';
      ctx.stroke();

      const pawSize = ferret.isStumbling ? 2 : 3;
      ctx.fillStyle = farSideOnly ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.arc(footX, footY, pawSize, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  renderBoundingLegs(ctx, ferret, colors, farSideOnly) {
    const chain = ferret.bodyChain;
    if (!chain || chain.nodes.length < 3) return;

    const legLength = (ferret.legs?.length || 1) * 15;
    const legThickness = (ferret.legs?.thickness || 1);
    const sideOffset = farSideOnly ? 2 : 0;
    const groundY = 15; // Ground level relative to body centerline

    // Front legs are attached near the head anchor
    const frontHipNode = chain.nodes[1];
    const frontHip = { x: frontHipNode.x + (farSideOnly ? -sideOffset : sideOffset), y: frontHipNode.y };
    
    // Back legs are attached near the hip anchor
    const backHipNode = chain.nodes[chain.nodes.length - 2];
    const backHip = { x: backHipNode.x + (farSideOnly ? -sideOffset : sideOffset), y: backHipNode.y };

    const stridePhase = ferret.gait.cyclePhase;
    const strideLength = (ferret.gait.stride || 1) * 8;

    // Stance/Swing logic
    const frontFootX = frontHip.x + Math.cos(stridePhase) * strideLength;
    const backFootX = backHip.x + Math.cos(stridePhase + Math.PI) * strideLength;

    const frontFootY = groundY + (ferret.gait.contact.frontInContact ? 0 : 5);
    const backFootY = groundY + (ferret.gait.contact.backInContact ? 0 : 5);
    
    const strokeStyle = farSideOnly ? this.shadeColor(colors[1] || '#000000', -25) : (colors[1] || '#000');
    
    // Draw front leg
    this.drawSingleLeg(ctx, frontHip, { x: frontFootX, y: frontFootY }, legLength, legThickness, strokeStyle);
    
    // Draw back leg
    this.drawSingleLeg(ctx, backHip, { x: backFootX, y: backFootY }, legLength, legThickness, strokeStyle);
  }

  drawSingleLeg(ctx, hip, foot, legLength, legThickness, strokeStyle) {
    const dx = foot.x - hip.x;
    const dy = foot.y - hip.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Simple IK for knee position
    let kneeX, kneeY;
    if (dist >= legLength) {
      // Straight leg
      kneeX = (hip.x + foot.x) / 2;
      kneeY = (hip.y + foot.y) / 2;
    } else {
      const h = legLength / 2;
      const d = dist / 2;
      const a = Math.sqrt(h*h - d*d);
      const angle = Math.atan2(dy, dx);
      
      const midX = (hip.x + foot.x) / 2;
      const midY = (hip.y + foot.y) / 2;
      
      kneeX = midX - a * Math.sin(angle);
      kneeY = midY + a * Math.cos(angle);
    }

    ctx.beginPath();
    ctx.moveTo(hip.x, hip.y);
    ctx.lineTo(kneeX, kneeY);
    ctx.lineTo(foot.x, foot.y);
    ctx.lineWidth = 3 * legThickness;
    ctx.strokeStyle = strokeStyle;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    const pawSize = 3;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(foot.x, foot.y, pawSize, 0, Math.PI * 2);
    ctx.fill();
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