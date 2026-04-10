import { FerretGaitSystem } from "../systems/FerretGaitSystem.js";
import { VerletBodySystem } from "../systems/VerletBodySystem.js";
import { VerletTailSystem } from "../systems/VerletTailSystem.js";
import { FerretLookSystem } from "../systems/FerretLookSystem.js";

/**
 * FerretAnimationSystem - Handles ferret animation and movement
 */
export class FerretAnimationSystem {
  constructor() {
    // Animation state will be managed per ferret instance
  }

  update(ferret, racer, time, currentRace) {
    const dt = Math.max(0.0001, time - (ferret._lastTime ?? time));
    const dtSeconds = Math.max(0.0001, dt / 1000);
    
    // --- 1. Update primary timing and gait parameters ---
    FerretGaitSystem.update(ferret, racer, time, currentRace);

    // Don't update particles if racer has finished (gait system handled final state cleanup)
    if (racer.visual?.finished) return;

    // --- 2. Update particle chain physics ---
    if (ferret.bodyChain?.enabled) {
      VerletBodySystem.update(ferret, racer, dtSeconds);
    }
    if (ferret.tailChain?.enabled) {
      VerletTailSystem.update(ferret, racer, dtSeconds);
    }

    // --- 3. Update eye tracking and expressions ---
    FerretLookSystem.update(ferret, racer, time, currentRace);
    this.updateFootContacts(ferret);

    // Stumble state sync and timing
    const prev = !!ferret.isStumbling;
    if (racer?.visual?.stumbling) ferret.isStumbling = true;
    if (ferret.isStumbling && !prev) { ferret._stumbleEntered = true; ferret._stumbleTimer = ferret._stumbleTimer ?? 1.1; }
    if (ferret.isStumbling) { ferret._stumbleTimer = Math.max(0, (ferret._stumbleTimer ?? 1.1) - dtSeconds); if (ferret._stumbleTimer === 0) ferret.isStumbling = false; }
  }

  updateFootContacts(ferret) {
    // Ensure feet structure exists for downstream particle emission
    ferret.gait = ferret.gait || {};
    ferret.gait.feet = ferret.gait.feet || {
      FL: { contact: false, justDown: false }, FR: { contact: false, justDown: false },
      BL: { contact: false, justDown: false }, BR: { contact: false, justDown: false }
    };
  }
}