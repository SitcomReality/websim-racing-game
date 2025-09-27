/**
 * FerretLookSystem - Manages eye tracking, blinking, and subtle facial expressions.
 */
export class FerretLookSystem {

  /**
   * Updates eye tracking and blinking state.
   * @param {Object} ferret - The ferret animation data object.
   * @param {Object} racer - The racer entity.
   * @param {number} time - Current time in milliseconds.
   * @param {Object} currentRace - Current race state.
   */
  static update(ferret, racer, time, currentRace) {
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

        // Only track if target is within reasonable distance (20% track length)
        if (Math.abs(targetX - myX) < 20) {
          ferret.eye.targetRid = targetRacerId;

          // Calculate look direction based on relative position
          const deltaX = targetX - myX;
          const distance = Math.abs(deltaX);
          const maxPupilOffset = 1.5;

          if (distance > 1) {
            // Horizontal offset proportional to proximity
            ferret.eye.targetPupilX = Math.sign(deltaX) * Math.min(maxPupilOffset, distance / 10);
            // Vertical offset towards the adjacent lane center (0.5 for slight vertical offset)
            ferret.eye.targetPupilY = (offset * 0.5); 
          } else {
            // Too close, look forward (1.0 is default forward direction)
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

    // Smooth pupil movement (using fixed deltaTime approximation)
    const moveSpeed = 3;
    const deltaTime = 0.016; 
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
      ferret.eye.blinkPhase += (dt || 16) * 0.0018; 
      if (ferret.eye.blinkPhase >= Math.PI) {
        ferret.eye.isBlinking = false;
        const nextBlink = 2 + (ferret.seed % 4000) / 1000; 
        ferret.eye.blinkTimer = nextBlink * 1000; // Store in ms
        ferret.eye.blinkPhase = 0;
      }
    }

    // Update eyelid expressions (mood)
    const moodTimer = time * 0.0005 + racer.id; 
    ferret.eye.upperLid = 0.1 + Math.sin(moodTimer) * 0.05;
    ferret.eye.lowerLid = 0.05 + Math.cos(moodTimer * 0.7) * 0.02;
  }
}