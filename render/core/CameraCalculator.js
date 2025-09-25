/**
 * CameraCalculator - Handles camera calculations
 */
export class CameraCalculator {
  constructor() {
    // Camera calculation state
  }

  /**
   * Calculate optimal zoom that considers actual screen dimensions with track height as baseline
   */
  calculateOptimalZoom(racers, race, canvasDimensions, shotDef) {
    if (!canvasDimensions) {
      return 1.0;
    }

    const baselineZoom = this.getTrackBasedZoom(canvasDimensions, race);

    if (racers.length === 0) {
      return baselineZoom;
    }

    const { width, height } = canvasDimensions;
    
    // Get the baseline zoom that fits the entire track height

    // Calculate horizontal requirements based on racers to frame
    const positions = racers.map(rid => race.liveLocations[rid] || 0);
    const minPos = Math.min(...positions);
    const maxPos = Math.max(...positions);
    const span = Math.max(shotDef.minSpan || 20, maxPos - minPos);
    const targetSpan = span + (shotDef.margin || 15);
    
    // Calculate zoom needed for horizontal fit
    const worldPixelWidth = width * 4; // From rendering system
    const maxZoomForHorizontalFit = (width * 0.85) / (worldPixelWidth * targetSpan / 100);

    // Use baseline as starting point; for pack/battle restrict zoom-out unless truly needed
    const isPackOrBattle = (shotDef === shotDefinitions.pack_focus || shotDef === shotDefinitions.battle_focus);
    const minZoomForPackBattle = baselineZoom * 0.9; // keep close to track-fit
    const needsWideFit = (targetSpan > 45 || racers.length >= 6);
    let optimalZoom = Math.min(baselineZoom, maxZoomForHorizontalFit);
    if (isPackOrBattle && !needsWideFit && optimalZoom < minZoomForPackBattle) {
      optimalZoom = minZoomForPackBattle;
    }

    // Apply shot-specific zoom modifiers for more dynamic camera work
    if (shotDef.priority === 'tight') {
      optimalZoom = Math.min(optimalZoom * 1.4, baselineZoom * 1.2); // Allow tighter than baseline for tight shots
    } else if (shotDef.priority === 'medium') {
      optimalZoom = Math.min(optimalZoom * 1.2, baselineZoom * 1.1);
    }
    // Wide shots use the calculated zoom as-is

    // Reasonable bounds - baseline zoom sets the upper limit
    return Math.max(0.3, Math.min(baselineZoom * 1.5, optimalZoom));
  }

  /**
   * Calculate the baseline zoom that fits the track height perfectly
   */
  getTrackBasedZoom(canvasDimensions, race) {
    if (!canvasDimensions) {
      return 1.0;
    }

    const { height } = canvasDimensions;
    const laneHeight = 40; // From WorldTransform
    
    // Get number of lanes from game state or race data
    // Default to 10 lanes if not available
    const numberOfLanes = race?.numberOfLanes || 10;
    
    // Calculate total track height including small padding
    const trackHeight = numberOfLanes * laneHeight;
    const padding = 20; // Small padding above and below track
    const totalHeight = trackHeight + padding;
    
    // Calculate zoom that fits the track height exactly
    const trackFitZoom = height / totalHeight;
    
    return Math.max(0.5, Math.min(2.0, trackFitZoom));
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
      const lead = Math.min(shotDef.lookahead || 0, 0.8);
      targetX = sortedPositions[0] + lead * 0.35;
    } else {
      // Multiple racers - more balanced weighting
      const weights = sortedPositions.map((_, i) => Math.pow(0.75, i)); // Less extreme decay
      const weightedSum = sortedPositions.reduce((sum, pos, i) => sum + pos * weights[i], 0);
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      
      const lead = Math.min(shotDef.lookahead || 0, 0.8);
      targetX = weightedSum / totalWeight + lead * 0.3;
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