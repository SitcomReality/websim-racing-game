/** 
 * FerretAnimationUtils - Shared animation calculations for ferret rendering 
 */ 
export class FerretAnimationUtils {
  /** 
   * Calculate ear position based on value 
   */ 
  static calculateEarPosition(earValue, reverse = false) {
    const v = Math.max(0, Math.min(1, earValue ?? 0)); 
    const downAngle = 70 * Math.PI / 180;
    const upAngle = -10 * Math.PI / 180;
    let earAngle = downAngle + (upAngle - downAngle) * v;
    if (reverse) earAngle = -earAngle;
    return earAngle;
  }

  /** 
   * Calculate tail sway based on gait 
   */ 
  static calculateTailSway(ferret, time) {
    if (ferret.isStumbling) {
      return Math.sin(ferret.crashPhase * 3) * 6;
    }
    return Math.sin(
      ferret.gait.cyclePhase * 0.5 + 
      ferret.seed % 1000 * 0.1
    ) * (1 + ferret.gait.stride * 0.5);
  }

  /** 
   * Calculate leg positions for traditional gait 
   */ 
  static calculateLegPositions(ferret, legLength, strideLength, stridePhase) {
    const strideOffset = Math.sin(stridePhase) * strideLength;
    const strideOffset2 = Math.sin(stridePhase + Math.PI) * strideLength;

    const liftHeight = 8;
    const cosPhase = Math.cos(stridePhase);
    const liftAmount = cosPhase > 0 ? cosPhase * liftHeight : 0;
    const liftAmount2 = -cosPhase > 0 ? -cosPhase * liftHeight : 0;

    return {
      strideOffset,
      strideOffset2,
      liftAmount,
      liftAmount2
    };
  }

  /** 
   * Calculate bounding gait contact state 
   */ 
  static calculateBoundingContact(ferret, stridePhase) {
    const contactDuty = ferret.gait.contact.dutyCycle || 0.6;
    const isFrontContact = Math.sin(stridePhase) < (contactDuty * 2 - 1);

    return {
      frontInContact: isFrontContact,
      backInContact: !isFrontContact
    };
  }
}