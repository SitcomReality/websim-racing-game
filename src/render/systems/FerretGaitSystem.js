export class FerretGaitSystem {
  static update(ferret, racer, time, currentRace) {
    const liveX = (currentRace?.liveLocations?.[racer.id]) || 0;
    const dt = Math.max(0.0001, time - (ferret._lastTime ?? time));
    const dtSeconds = Math.max(0.0001, dt / 1000);

    const isRacing = currentRace?.racers?.includes(racer.id) && !racer.visual.finished && !currentRace.results.includes(racer.id);

    const deltaX = liveX - (ferret._lastX ?? liveX);
    const speedPctPerSec = Math.abs(deltaX) / dtSeconds;

    const baseStepSpeed = 3.5;
    const movementMultiplier = Math.max(0.1, speedPctPerSec * 1.2);

    let animationSpeed = 0;
    if (isRacing) {
      animationSpeed = Math.max(1.5, baseStepSpeed * movementMultiplier);
    }

    ferret.gait.cyclePhase += animationSpeed * dtSeconds;

    if (isRacing && speedPctPerSec > 0.01) {
      ferret.gait.stride = Math.min(1.5, 0.6 + speedPctPerSec * 2.0);
    } else if (isRacing) {
      ferret.gait.stride = Math.max(0.2, ferret.gait.stride * 0.98);
    } else {
      ferret.gait.stride = 0;
    }

    if (ferret.gait.cyclePhase > Math.PI * 2) {
      ferret.gait.cyclePhase -= Math.PI * 2;
    }

    if (racer.visual.finished) {
      ferret.gait.stride = 0;
      ferret.gait.cyclePhase = 0;
    }

    ferret._lastX = liveX;
    ferret._lastTime = time;

    ferret.ear = ferret.ear || { value: 0, anim: null, reverse: false };

    const phase = ferret.gait.cyclePhase;
    const prev = ferret._prevPhase ?? phase;
    const wrapped = prev > phase;
    const crossedPi = prev < Math.PI && phase >= Math.PI;

    if (wrapped || crossedPi) {
      ferret.ear.anim = { phase: 'up', t: 0, upDur: 0.15, downDur: 0.30 };
    }

    if (ferret.ear.anim) {
      const easeOutCubic = (u) => 1 - Math.pow(1 - u, 3);
      const easeInCubic = (u) => Math.pow(u, 3);
      const anim = ferret.ear.anim;

      if (anim.phase === 'up') {
        anim.t += dtSeconds;
        const u = Math.min(1, anim.t / anim.upDur);
        ferret.ear.value = easeOutCubic(u);
        ferret.ear.reverse = true;
        if (u >= 1) { anim.phase = 'down'; anim.t = 0; }
      } else {
        anim.t += dtSeconds;
        const u = Math.min(1, anim.t / anim.downDur);
        ferret.ear.value = 1 - easeInCubic(u);
        ferret.ear.reverse = false;
        if (u >= 1) { ferret.ear.value = 0; ferret.ear.anim = null; ferret.ear.reverse = false; }
      }
    } else {
      ferret.ear.value += (0 - ferret.ear.value) * Math.min(1, dtSeconds * 4);
    }

    ferret._prevPhase = phase;

    // Foot contact tracking
    ferret.gait.feet = ferret.gait.feet || {
      FL: { contact: false, justDown: false }, FR: { contact: false, justDown: false },
      BL: { contact: false, justDown: false }, BR: { contact: false, justDown: false }
    };
    const feet = ferret.gait.feet;
    const offsets = { FL: 0, BR: 0, FR: Math.PI, BL: Math.PI };
    const threshold = -0.1;
    const active = isRacing && ferret.gait.stride > 0.05;
    for (const key of Object.keys(feet)) {
      const prev = feet[key].contact;
      const ph = phase + offsets[key];
      const wave = Math.sin(ph);
      const now = active && wave < threshold;
      feet[key].contact = now;
      feet[key].justDown = !prev && now;
    }

    if (ferret.isStumbling) {
      ferret.crashPhase += 0.2;
      if (racer.remainingStumble <= 1) {
        ferret.isStumbling = false;
        ferret.crashPhase = 0;
      }
    } else if (racer?.visual?.stumbling) {
      ferret.isStumbling = true; ferret.crashPhase = 0;
    }
  }
}