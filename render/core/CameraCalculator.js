/**
 * CameraCalculator - Handles camera calculations
 */
export class CameraCalculator {
  constructor() {
    // Camera calculation state
  }

  /**
   * Calculate optimal zoom that considers actual screen dimensions
   */
  calculateOptimalZoom(racers, race, canvasDimensions, shotDef) {
    if (!canvasDimensions || racers.length === 0) {
      return 1.0;
    }

    const { width, height } = canvasDimensions;
    const laneHeight = 40; // From WorldTransform
    const numberOfLanes = race.racers.length;
    
    // Calculate how much vertical space we need for all lanes
    const totalTrackHeight = numberOfLanes * laneHeight;
    
    // Ensure all lanes are visible vertically
    const maxZoomForVerticalFit = height / (totalTrackHeight + 40); // +40 for padding
    
    // Calculate horizontal requirements
    const positions = racers.map(rid => race.liveLocations[rid] || 0);
    const minPos = Math.min(...positions);
    const maxPos = Math.max(...positions);
    const span = Math.max(shotDef.minSpan || 30, maxPos - minPos);
    const targetSpan = span + (shotDef.margin || 20);
    
    // Calculate zoom needed for horizontal fit
    const worldPixelWidth = width * 4; // From rendering system
    const maxZoomForHorizontalFit = (width * 0.8) / (worldPixelWidth * targetSpan / 100);
    
    // Use the more restrictive zoom (usually vertical)
    const optimalZoom = Math.min(maxZoomForVerticalFit, maxZoomForHorizontalFit);
    
    // Clamp to reasonable bounds
    return Math.max(0.3, Math.min(2.0, optimalZoom));
  }

  /**
   * Calculate optimal camera target position
   */
  calculateOptimalTarget(racers, race, shotDef) {
    if (racers.length === 0) {
      return { x: 50, y: 0 };
    }
    const positions = racers.map(rid => race.liveLocations[rid] || 0);
    const minPos = Math.min(...positions);
    const maxPos = Math.max(...positions);
    const leaderPos = maxPos;
    const bias = shotDef.priority === 'wide' ? 0.7 : 0.85;
    let targetX = minPos + (leaderPos - minPos) * bias;
    if (shotDef.lookahead && shotDef.lookahead > 0) {
      targetX = leaderPos + shotDef.lookahead;
    }
    return { x: Math.max(0, Math.min(100, targetX)), y: 0 };
  }
}