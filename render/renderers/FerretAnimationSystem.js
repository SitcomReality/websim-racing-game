import { VerletChain } from "verlet-chain";

/**
 * FerretAnimationSystem - Handles ferret animation and movement
 */
export class FerretAnimationSystem {
  constructor() {
    // Animation state will be managed per ferret instance
  }

  update(ferret, racer, time, raceState) {
    const liveX = (raceState?.liveLocations?.[racer.id]) || 0;
    const dt = Math.max(0.0001, time - (ferret._lastTime ?? time));
    const velocity = Math.max(0, liveX - (ferret._lastX ?? liveX)) / dt; // world units/sec

    if (velocity > 0.0005) {
      const k = 0.22; // maps world velocity to gait speed
      ferret.gait.cyclePhase += velocity * k;
      ferret.gait.stride = Math.min(1.3, 0.6 + velocity * 0.12);
    } else {
      ferret.gait.stride = 0; // feet planted when not moving
    }
    if (ferret.gait.cyclePhase > Math.PI * 2) ferret.gait.cyclePhase -= Math.PI * 2;
    ferret._lastX = liveX; ferret._lastTime = time;

    // Initialize ear state
    ferret.ear = ferret.ear || { value: 0, anim: null, reverse: false };
    const dtSecs = Math.max(0.0001, dt);

    // Trigger flap once per half-cycle (phase 0 and π)
    const phase = ferret.gait.cyclePhase;
    const prev = ferret._prevPhase ?? phase;
    const wrapped = prev > phase; // crossed 2π -> 0
    const crossedPi = prev < Math.PI && phase >= Math.PI;

    if (wrapped || crossedPi) {
      // start an ear flap (lift then fall)
      ferret.ear.anim = { phase: 'up', t: 0, upDur: 0.15, downDur: 0.30 };
    }

    // Progress ear animation
    if (ferret.ear.anim) {
      const easeOutCubic = (u) => 1 - Math.pow(1 - u, 3);
      const easeInCubic = (u) => Math.pow(u, 3);
      const anim = ferret.ear.anim;

      if (anim.phase === 'up') {
        anim.t += dtSecs;
        const u = Math.min(1, anim.t / anim.upDur);
        ferret.ear.value = easeOutCubic(u);
        ferret.ear.reverse = true;
        if (u >= 1) { anim.phase = 'down'; anim.t = 0; }
      } else { // down
        anim.t += dtSecs;
        const u = Math.min(1, anim.t / anim.downDur);
        ferret.ear.value = 1 - easeInCubic(u);
        ferret.ear.reverse = false;
        if (u >= 1) { ferret.ear.value = 0; ferret.ear.anim = null; ferret.ear.reverse = false; }
      }
    } else {
      // default gently towards down if no animation
      ferret.ear.value += (0 - ferret.ear.value) * Math.min(1, dtSecs * 4);
    }

    ferret._prevPhase = phase;

    // Update stumble/crash animation
    if (ferret.isStumbling) {
      ferret.crashPhase += 0.2;
      
      // Reset crash when stumble ends
      if (racer.remainingStumble <= 1) {
        ferret.isStumbling = false;
        ferret.crashPhase = 0;
      }
    }

    // New: Update particle chain physics
    if (ferret.bodyChain?.enabled) {
      this.updateBodyChain(ferret, racer, dtSecs, velocity);
    }

    // Update eye tracking
    this.updateEyeTracking(ferret, racer, time, raceState);
  }

  updateBodyChain(ferret, racer, dt, velocity) {
    const chain = ferret.bodyChain;
    if (!chain || !chain.nodes) return;

    // --- 1. Update Gait and Anchors ---
    const bounceHeight = ferret.gait.bounceHeight || 3;
    const strideAmp = ferret.gait.strideAmplitude || 1;
    const gaitPhase = ferret.gait.cyclePhase;

    // Bounding gait: front and back anchors move vertically in opposition
    chain.anchors.head.offsetY = -Math.sin(gaitPhase) * bounceHeight * strideAmp;
    chain.anchors.hip.offsetY = Math.sin(gaitPhase) * bounceHeight * strideAmp;

    // Set anchor X positions based on body length
    const bodyPixelLength = (chain.nodes.length - 1) * (chain.restLengths[0] || 8);
    chain.anchors.head.x = bodyPixelLength / 2;
    chain.anchors.hip.x = -bodyPixelLength / 2;
    
    // Update Y positions with offset
    chain.anchors.head.y = chain.anchors.head.offsetY;
    chain.anchors.hip.y = chain.anchors.hip.offsetY;
    
    // Stumbling makes the body go limp
    if (ferret.isStumbling) {
      chain.anchors.head.weight = 0.1;
      chain.anchors.hip.weight = 0.1;
    } else {
      chain.anchors.head.weight = 0.8;
      chain.anchors.hip.weight = 0.6;
    }

    // --- 2. Update Leg Animation State ---
    const contactDuty = ferret.gait.contact.dutyCycle || 0.6;
    const isFrontContact = Math.sin(gaitPhase) < (contactDuty * 2 - 1);
    ferret.gait.contact.frontInContact = isFrontContact;
    ferret.gait.contact.backInContact = !isFrontContact;

    // --- 3. Solve Verlet Chain ---
    const { nodes, prevNodes, restLengths, params, anchors } = chain;
    VerletChain.integrate(nodes, prevNodes, dt, params.damping);
    VerletChain.updateAnchors(nodes, anchors.head, anchors.hip);
    VerletChain.satisfyConstraints(nodes, restLengths, params.iterations, params.stiffness);
    VerletChain.smoothCurvature(nodes, 0.1);
  }

  updateEyeTracking(ferret, racer, time, currentRace) {
    if (!currentRace || !currentRace.racers) return;

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
            ferret.eye.targetPupilY = (offset * 0.5);
          } else {
            ferret.eye.targetPupilX = 1;
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
      ferret.eye.targetPupilX = 1;
      ferret.eye.targetPupilY = 0;
    }

    // Smooth pupil movement
    const moveSpeed = 3;
    const deltaTime = 0.016; // Assume 60fps
    ferret.eye.pupil.x += (ferret.eye.targetPupilX - ferret.eye.pupil.x) * deltaTime * moveSpeed;
    ferret.eye.pupil.y += (ferret.eye.targetPupilY - ferret.eye.pupil.y) * deltaTime * moveSpeed;

    // Blink logic
    const dt = (ferret._blinkLastTime != null) ? (time - ferret._blinkLastTime) : 0;
    ferret._blinkLastTime = time;
    ferret.eye.blinkTimer -= dt;
    if (!ferret.eye.isBlinking && ferret.eye.blinkTimer <= 0) {
      ferret.eye.isBlinking = true;
      ferret.eye.blinkPhase = 0;
    }
    if (ferret.eye.isBlinking) {
      ferret.eye.blinkPhase += (dt || 0.016) * 18; // quick blink
      if (ferret.eye.blinkPhase >= Math.PI) {
        ferret.eye.isBlinking = false;
        // next blink between 2-6s
        const nextBlink = 2 + (ferret.seed % 4000) / 1000; // deterministic-ish per ferret
        ferret.eye.blinkTimer = nextBlink;
        ferret.eye.blinkPhase = 0;
      }
    }

    // Update eyelid expressions
    const moodTimer = time * 0.5 + racer.id;
    ferret.eye.upperLid = 0.1 + Math.sin(moodTimer) * 0.05;
    ferret.eye.lowerLid = 0.05 + Math.cos(moodTimer * 0.7) * 0.02;
  }
}