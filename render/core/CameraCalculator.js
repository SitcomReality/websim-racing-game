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
    
    // Calculate horizontal requirements based on racers to frame
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
   * Calculate optimal camera target position - focuses on actual racers, not empty space
   */
  calculateOptimalTarget(racers, race, shotDef) {
    if (racers.length === 0) {
      // If no racers to frame, find and focus on the race leader
      const activeRacers = race.racers.filter(rid => !(race.results || []).includes(rid));
      if (activeRacers.length > 0) {
        const sorted = [...activeRacers].sort((a,b) => (race.liveLocations[b]||0) - (race.liveLocations[a]||0));
        return { x: race.liveLocations[sorted[0]] || 50, y: 0 };
      }
      return { x: 50, y: 0 };
    }

    // Get positions of racers we should be tracking
    const positions = racers.map(rid => race.liveLocations[rid] || 0);
    
    // Instead of averaging all positions, weight heavily towards the frontrunners
    const sortedPositions = [...positions].sort((a, b) => b - a); // Sort front to back
    
    let targetX;
    
    if (sortedPositions.length === 1) {
      // Single racer focus - center on them with lookahead
      targetX = sortedPositions[0] + (shotDef.lookahead || 0);
    } else {
      // Multiple racers - weighted average favoring the leaders
      const weights = sortedPositions.map((_, i) => Math.pow(0.6, i)); // Exponential decay
      const weightedSum = sortedPositions.reduce((sum, pos, i) => sum + pos * weights[i], 0);
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      
      targetX = weightedSum / totalWeight + (shotDef.lookahead || 0);
    }

    // Special handling for finish line shots
    if (shotDef === shotDefinitions.finish_approach || shotDef === shotDefinitions.finish_focus) {
      targetX = Math.max(targetX, 98); // Ensure finish line is in view
    }

    // Ensure target stays within track bounds
    return { x: Math.max(0, Math.min(100, targetX)), y: 0 };
  }
}

import { shotDefinitions } from './ShotDefinitions.js';