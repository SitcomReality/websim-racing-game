/**
 * FerretLegRenderer - Renders ferret legs with different gait styles
 */
export class FerretLegRenderer {
  constructor() {
    // Leg rendering state managed per ferret instance
  }

  render(ctx, ferret, colors, farSideOnly = false) {
    // New: Bounding gait driven by anchors
    if (ferret.bodyChain?.enabled) {
      this.renderBoundingLegs(ctx, ferret, colors, farSideOnly);
      return;
    }

    this.renderTraditionalLegs(ctx, ferret, colors, farSideOnly);
  }

  renderTraditionalLegs(ctx, ferret, colors, farSideOnly) {
    const bodyLength = ferret.body.length * 30;
    const bodyHeight = ferret.body.height * 20 * ferret.body.stockiness;
    const legLength = ferret.legs.length * 15;
    const legThickness = ferret.legs.thickness;

    // Initialize smooth leg length tracking
    if (!ferret._legLengths) {
      ferret._legLengths = [legLength, legLength, legLength, legLength];
    }

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
      const strideLength = ferret.gait.stride * 8; 
      const stridePhase = ferret.gait.cyclePhase;
      const strideOffset = Math.sin(stridePhase) * strideLength;
      const strideOffset2 = Math.sin(stridePhase + Math.PI) * strideLength * (ferret.legs.length > 1 ? 1.05 : 0.95);

      // Determine foot lift. Lift happens when foot is moving forward (positive velocity)
      const liftHeight = 6; 
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
      const sideOffset = farSideOnly ? 2 : 0; 

      // Smooth leg length transitions to eliminate snapping
      const targetLegLength = legLength - pos.lift;
      const lerpSpeed = 0.15; 
      ferret._legLengths[i] += (targetLegLength - ferret._legLengths[i]) * lerpSpeed;
      const finalLegLength = ferret._legLengths[i];

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
    const groundY = 15; 

    // Initialize smooth foot position tracking
    if (!ferret._smoothFootPositions) {
      ferret._smoothFootPositions = {
        frontX: 0, frontY: groundY,
        backX: 0, backY: groundY
      };
    }

    // Front legs are attached near the head anchor
    const frontHipNode = chain.nodes[1];
    const frontHip = { x: frontHipNode.x + (farSideOnly ? -sideOffset : sideOffset), y: frontHipNode.y };

    // Back legs are attached near the hip anchor
    const backHipNode = chain.nodes[chain.nodes.length - 2];
    const backHip = { x: backHipNode.x + (farSideOnly ? -sideOffset : sideOffset), y: backHipNode.y };

    const stridePhase = ferret.gait.cyclePhase;
    const strideLength = (ferret.gait.stride || 1) * 6; 

    // Target foot positions
    const targetFrontFootX = frontHip.x + Math.cos(stridePhase) * strideLength;
    const targetBackFootX = backHip.x + Math.cos(stridePhase + Math.PI) * strideLength;

    const targetFrontFootY = groundY + (ferret.gait.contact.frontInContact ? 0 : 4); 
    const targetBackFootY = groundY + (ferret.gait.contact.backInContact ? 0 : 4);

    // Smooth foot position interpolation for realistic ground contact
    const footLerpSpeed = 0.2; 
    ferret._smoothFootPositions.frontX += (targetFrontFootX - ferret._smoothFootPositions.frontX) * footLerpSpeed;
    ferret._smoothFootPositions.frontY += (targetFrontFootY - ferret._smoothFootPositions.frontY) * footLerpSpeed;
    ferret._smoothFootPositions.backX += (targetBackFootX - ferret._smoothFootPositions.backX) * footLerpSpeed;
    ferret._smoothFootPositions.backY += (targetBackFootY - ferret._smoothFootPositions.backY) * footLerpSpeed;

    const strokeStyle = farSideOnly ? this.shadeColor(colors[1] || '#000000', -25) : (colors[1] || '#000');

    // Draw legs with smoothed positions
    this.drawSingleLeg(ctx, frontHip, 
      { x: ferret._smoothFootPositions.frontX, y: ferret._smoothFootPositions.frontY }, 
      legLength, legThickness, strokeStyle);

    this.drawSingleLeg(ctx, backHip, 
      { x: ferret._smoothFootPositions.backX, y: ferret._smoothFootPositions.backY }, 
      legLength, legThickness, strokeStyle);
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