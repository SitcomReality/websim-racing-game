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
      // Increase body dimensions: min +50%, max +100%
      length: pick(1.6 * 1.5, 1.8 * 2.0),
      height: pick(0.9 * 1.5, 1.1 * 2.0),
      stockiness: pick(0.8, 1.2)
    };
    const legs = {
      length: pick(0.8, 1.2),
      thickness: pick(0.8, 1.2)
    };
    const tail = {
      length: pick(0.7, 1.5),
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

    return { 
      body, legs, tail, head, eye, gait, seed,
      isStumbling: false,
      crashPhase: 0,
      coat,
      bodyChain // New particle chain system
    };
  }

  /**
   * Create the particle body chain for this ferret
   */
  static createBodyChain(racer, rnd, pick) {
    // Get chain parameters with some randomization
    const nodeCount = Math.round(pick(3, 5));
    const restDistance = pick(6, 12);
    const stiffness = pick(0.6, 0.9);
    const iterations = Math.round(pick(2, 4));
    const damping = pick(0.95, 0.995);
    const thicknessStart = pick(8, 16);
    const thicknessEnd = pick(4, 8);

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
        thicknessStart,
        thicknessEnd
      },
      anchors: {
        head: { x: 0, y: 0, offsetY: 0, weight: 0.8 },
        hip: { x: 0, y: 0, offsetY: 0, weight: 0.6 }
      }
    };
  }
}