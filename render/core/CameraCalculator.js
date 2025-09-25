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
      return 1.2;
    }

    const { width, height } = canvasDimensions;
    const laneHeight = 40; // From WorldTransform
    
    // Calculate how much vertical space we need for racers being tracked
    const racerLanes = racers.length;
    const trackHeight = Math.max(racerLanes * laneHeight, 200); // Minimum reasonable height
    
    // More aggressive vertical zoom - don't need to show ALL lanes if we're tracking specific racers
    const maxZoomForVerticalFit = height / (trackHeight + 80); // Less padding for tighter shots
    
    // Calculate horizontal requirements based on racers to frame
    const positions = racers.map(rid => race.liveLocations[rid] || 0);
    const minPos = Math.min(...positions);
    const maxPos = Math.max(...positions);
    const span = Math.max(shotDef.minSpan || 20, maxPos - minPos);
    const targetSpan = span + (shotDef.margin || 15); // Reduced margin for tighter shots
    
    // Calculate zoom needed for horizontal fit
    const worldPixelWidth = width * 4; // From rendering system
    const maxZoomForHorizontalFit = (width * 0.85) / (worldPixelWidth * targetSpan / 100);
    
    // Use the more restrictive zoom but prefer closer shots
    let optimalZoom = Math.min(maxZoomForVerticalFit, maxZoomForHorizontalFit);
    
    // Apply shot-specific zoom modifiers for more dynamic camera work
    if (shotDef.priority === 'tight') {
      optimalZoom *= 1.3; // Zoom in more for tight shots
    } else if (shotDef.priority === 'medium') {
      optimalZoom *= 1.1; // Slight zoom in for medium shots
    }
    
    // More reasonable bounds - allow closer zoom
    return Math.max(0.6, Math.min(2.5, optimalZoom));
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
    
    // More balanced weight distribution - less extreme leading
    const sortedPositions = [...positions].sort((a, b) => b - a); // Sort front to back
    
    let targetX;
    
    if (sortedPositions.length === 1) {
      // Single racer focus - center on them with modest lookahead
      targetX = sortedPositions[0] + (shotDef.lookahead || 0) * 0.7; // Reduce lookahead by 30%
    } else {
      // Multiple racers - more balanced weighting
      const weights = sortedPositions.map((_, i) => Math.pow(0.75, i)); // Less extreme decay
      const weightedSum = sortedPositions.reduce((sum, pos, i) => sum + pos * weights[i], 0);
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      
      targetX = weightedSum / totalWeight + (shotDef.lookahead || 0) * 0.6; // Reduced lookahead
    }

    // Special handling for finish line shots
    if (shotDef === shotDefinitions.finish_approach || shotDef === shotDefinitions.finish_focus) {
      targetX = Math.max(targetX, 95); // Less aggressive finish line positioning
    }

    // Ensure target stays within track bounds
    return { x: Math.max(0, Math.min(100, targetX)), y: 0 };
  }
}

import { shotDefinitions } from './ShotDefinitions.js';