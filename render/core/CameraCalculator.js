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
      // If no racers to frame (e.g., between shots), find the leader of the whole race
      const sorted = [...race.racers].sort((a,b) => (race.liveLocations[b]||0) - (race.liveLocations[a]||0));
      if (sorted.length > 0) {
        return { x: race.liveLocations[sorted[0]] || 50, y: 0 };
      }
      return { x: 50, y: 0 };
    }
    const positions = racers.map(rid => race.liveLocations[rid] || 0).sort((a,b) => b - a);
    const leaderPos = positions[0] || 0;
    const runnerUp = positions[1] ?? leaderPos;
    const spread = Math.max(...positions) - Math.min(...positions);
    
    // Bias towards the front of the pack. 0.5 is center, 1.0 is leader.
    // A higher bias keeps the camera focused on the frontrunners.
    const bias = shotDef.priority === 'wide' ? 0.75 : 0.9;
    let targetX = minPos + (maxPos - minPos) * bias;

    // Apply lookahead to keep the leader from being at the edge of the screen
    if (shotDef.lookahead) {
      targetX += shotDef.lookahead;
    }

    // Special case for finish line shots, frame the finish line itself
    if (shotDef === shotDefinitions.finish_approach || shotDef === shotDefinitions.finish_focus) {
        targetX = Math.max(targetX, 98); // Ensure finish line is in view
    }

    return { x: Math.max(0, Math.min(100, targetX)), y: 0 };
  }
}