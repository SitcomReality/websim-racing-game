import { VerletChain } from '../../render/systems/VerletChain.js';

export class FerretFactory {
  static _hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return Math.abs(h >>> 0);
  }
  
  static create(racer) {
    const seedStr = `${racer.id}-${racer.name[0]}-${racer.name[1]}-${racer.colors.join('-')}`;
    let seed = this._hash(seedStr); 
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0xffffffff);
    const pick = (min, max) => min + (max - min) * rnd();
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    const body = {
        // Standardize all ferrets to similar lengths - reduce variation significantly
        length: pick(2.6, 2.9), // Much tighter range (was 2.4-2.8)
        height: pick(0.9 * 1.5, 1.2 * 2.0), // taller overall
        stockiness: pick(1.0, 1.2) // Reduced max stockiness variation for more consistent body thickness
                                // Was 1.3, now 1.2 to reduce taper
    };
    const legs = {
      length: pick(0.8, 1.2),
      thickness: pick(0.8, 1.2)
    };
    const tail = {
      // Increase tail length by 1.5x - 3x (was 0.7-1.5, now 1.05-4.5)
      length: pick(1.05, 4.5),
      fluffiness: pick(0.8, 1.3),
      followFactor: pick(0.2, 0.5) // New: how closely tail follows body chain
    };
    const head = {
      noseLength: pick(0.7, 1.3),
      underbiteDepth: pick(0.0, 0.3),
      earSize: pick(0.8, 1.2),
      // Make heads smaller: reduce max head size by ~1/3
      size: pick(0.6, 0.85),
      roundness: pick(0.0, 0.8)
    };
    head.headType = rnd() < 0.5 ? 'pointed' : 'rounded';
    head.earShape = rnd() < 0.5 ? 'pointy' : 'round';
    const coat = { pattern: rnd() < 0.5 ? 'solid' : 'banded', stripeIndex: Math.floor(rnd() * racer.colors.length) };
    const eye = {
      pupil: { x: 1, y: 0 }, // look forward right by default
      targetPupilX: 1,
      targetPupilY: 0,
      blinkTimer: pick(2.0, 8.0),
      isBlinking: false,
      blinkPhase: 0,
      lastUpdateTime: 0,
      upperLid: clamp(pick(0.0, 0.3), 0, 1),
      lowerLid: clamp(pick(0.0, 0.2), 0, 1),
      targetRid: null
    };
    const gait = {
      stride: pick(0.8, 1.3),
      cyclePhase: rnd() * Math.PI * 2,
      footfall: ['FL','FR','BL','BR'], // order reference
      // New: Two-leg gait properties
      contact: {
        frontInContact: true,
        backInContact: false,
        dutyCycle: pick(0.5, 0.7)
      },
      anchorOffsets: {
        frontY: 0,
        backY: 0
      },
      strideAmplitude: pick(0.8, 1.3),
      bounceHeight: pick(2, 5)
    };

    // New: Initialize particle body chain (currently disabled by default)
    const bodyChain = this.createBodyChain(racer, rnd, pick);
    const tailChain = this.createTailChain(rnd, pick); // new tail chain

    return { 
      body, legs, tail, head, eye, gait, seed,
      isStumbling: false,
      crashPhase: 0,
      coat,
      bodyChain,
      tailChain // include tail chain
    };
  }

  /**
   * Create the particle body chain for this ferret
   */
  static createBodyChain(racer, rnd, pick) {
    // Standardize to exactly 4 particles for all ferrets - no variation
    const nodeCount = 4; // Fixed count (was pick(3, 5))
    
    // Increase spacing between body nodes to reflect longer bodies
    const restDistance = pick(18, 28); // Increased from pick(12, 20)
    const stiffness = pick(0.15, 0.25); // Reduced from pick(0.6, 0.9) for more wobble
    const iterations = Math.round(pick(1, 2)); // Reduced from Math.round(pick(2, 3))
    const damping = pick(0.82, 0.88); // Reduced from pick(0.95, 0.995) for more jiggle
    
    // Thicker chain rendering for beefier bodies
    // *** REDUCED VARIATION: Thickness range is now much tighter ***
    const thicknessStart = pick(16, 24); // Reduced range from pick(14, 26) to pick(16, 24)
    const thicknessEnd = pick(10, 12);   // Reduced range from pick(7, 13) to pick(10, 12)

    // Initial chain setup (will be positioned properly during animation)
    const chain = VerletChain.createChain({
        count: nodeCount,
        start: { x: 0, y: 0 },
        dir: { x: 1, y: 0 }, // Horizontal initially
        spacing: restDistance
    });

    return {
        enabled: true, // Feature flag - enabled for Phase 1 body rendering
        nodes: chain.nodes,
        prevNodes: chain.prevNodes,
        restLengths: chain.restLengths,
        params: {
            stiffness,
            damping,
            iterations,
            // *** REDUCED VARIATION: Tighter thickness ranges applied here ***
            thicknessStart,
            thicknessEnd
        },
        anchors: {
            head: { x: 0, y: 0, offsetY: 0, weight: 0.5 }, // Reduced from 0.8 for more jiggle
            hip: { x: 0, y: 0, offsetY: 0, weight: 0.3 } // Reduced from 0.6 for more jiggle
        }
    };
  }

  static createTailChain(rnd, pick) { // new: floppy tail chain
    const nodeCount = 5;
    const spacing = pick(10, 14);
    const stiffness = pick(0.08, 0.18);
    const iterations = 1;
    const damping = pick(0.82, 0.9);
    const chain = VerletChain.createChain({ count: nodeCount, start: { x: 0, y: 0 }, dir: { x: -1, y: 0 }, spacing });
    return {
      enabled: true,
      nodes: chain.nodes, prevNodes: chain.prevNodes, restLengths: chain.restLengths,
      params: { stiffness, iterations, damping, thicknessStart: pick(7, 10), thicknessEnd: pick(2, 3) },
      anchors: { base: { x: 0, y: 0, weight: 0.95 }, tip: { x: 0, y: 0, weight: 0 } }
    };
  }
}