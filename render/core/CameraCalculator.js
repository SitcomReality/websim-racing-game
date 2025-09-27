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

    // The baseline zoom fits the track height perfectly in the viewport.
    const baselineZoom = this.getTrackBasedZoom(canvasDimensions, race);

    if (racers.length === 0) {
      return baselineZoom;
    }

    const { width } = canvasDimensions;
    
    const positions = racers.map(rid => race.liveLocations[rid] || 0);
    const minPos = Math.min(...positions);
    const maxPos = Math.max(...positions);
    
    // Prevent zooming on empty space if racers are too spread out.
    // If the gap is huge, we might frame a smaller group.
    let racersToFrame = [...racers];
    const maxSpreadThreshold = 35; // tightened to avoid excessive zooming for very spread-out packs
    if ((maxPos - minPos) > maxSpreadThreshold && shotDef.priority !== 'wide') {
        const leaderPos = Math.max(...positions);
        // Filter out racers that are too far behind the leader for this shot
        racersToFrame = racers.filter(rid => (leaderPos - (race.liveLocations[rid] || 0)) < maxSpreadThreshold);
    }
    
    const framedPositions = racersToFrame.map(rid => race.liveLocations[rid] || 0);
    const framedMinPos = Math.min(...framedPositions);
    const framedMaxPos = Math.max(...framedPositions);
    const horizontalSpread = framedMaxPos - framedMinPos;

    // If spread is very small, keep vertical-fit zoom (avoid unnecessary zoom-out)
    const tightenThreshold = shotDef.tightSpanThreshold ?? 8;
    if (horizontalSpread <= tightenThreshold) {
      return baselineZoom;
    }

    const span = Math.max(shotDef.minSpan || 5, horizontalSpread);
    const targetSpan = span + (shotDef.margin || 6);
    
    // Calculate zoom needed for horizontal fit
    const worldPixelWidth = width * 4; // From rendering system
    const maxZoomForHorizontalFit = (width * 0.90) / (worldPixelWidth * targetSpan / 100);

    // Start with the horizontal fit, but don't zoom in closer than the baseline allows (prevents clipping top/bottom)
    let optimalZoom = Math.min(baselineZoom, maxZoomForHorizontalFit);

    // Apply shot-specific zoom modifiers for more dynamic camera work
    if (shotDef.priority === 'tight') {
      optimalZoom *= 1.1; // Push in a bit for tight shots
    }

    // Reasonable bounds - baseline zoom sets an effective upper limit for most shots.
    return Math.max(0.6, Math.min(baselineZoom * 1.1, optimalZoom));
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
    
    return Math.max(0.85, Math.min(1.6, trackFitZoom));
  }

  /**
   * Calculate optimal camera target position - focuses on actual racers, not empty space
   */
  calculateOptimalTarget(racers, race, shotDef) {
    if (racers.length === 0) {
      const activeRacers = race.racers.filter(rid => {
        const t = race.finishedAt?.[rid];
        return !t || (Date.now() - t) < 1500;
      }).filter(rid => !(race.results || []).includes(rid));
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
      // Single racer focus - center on them with minimal lookahead
      const lead = Math.min(shotDef.lookahead || 0, 0.2);
      targetX = sortedPositions[0] + lead * 0.05; // Significantly reduced lookahead
    } else {
      // Multiple racers - more balanced weighting
      const weights = sortedPositions.map((_, i) => Math.pow(0.9, i)); // Less aggressive front-weighting
      const weightedSum = sortedPositions.reduce((sum, pos, i) => sum + pos * weights[i], 0);
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      
      const lead = Math.min(shotDef.lookahead || 0, 0.2);
      targetX = weightedSum / totalWeight + lead * 0.05; // Significantly reduced lookahead
    }

    // Special handling for finish line shots - much less aggressive
    if (shotDef === shotDefinitions.finish_approach || shotDef === shotDefinitions.finish_focus) {
      const maxPos = Math.max(...positions);
      if (maxPos >= 90) {
        targetX = Math.max(targetX, 88);
      }
    }

    // Ensure target stays within track bounds
    return { x: Math.max(0, Math.min(100, targetX)), y: 0 };
  }
}

import { shotDefinitions } from './ShotDefinitions.js';