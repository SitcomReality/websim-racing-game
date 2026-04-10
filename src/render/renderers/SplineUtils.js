/**
 * SplineUtils - Utilities for spline rendering and sampling
 */
export class SplineUtils {
  /**
   * Sample a point on a Catmull-Rom spline
   * @param {number} t - Parameter (0-1)
   * @param {Object} p0 - Control point 0 {x, y}
   * @param {Object} p1 - Control point 1 {x, y}
   * @param {Object} p2 - Control point 2 {x, y}
   * @param {Object} p3 - Control point 3 {x, y}
   * @returns {Object} Interpolated point {x, y}
   */
  static catmullRomPoint(t, p0, p1, p2, p3) {
    const t2 = t * t;
    const t3 = t2 * t;
    
    const x = 0.5 * (
      (2 * p1.x) +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
    );
    
    const y = 0.5 * (
      (2 * p1.y) +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
    );
    
    return { x, y };
  }
  
  /**
   * Sample points along a polyline with uniform spacing
   * @param {Array} points - Input points [{x, y}, ...]
   * @param {number} resolution - Number of samples to generate
   * @returns {Array} Sampled points
   */
  static samplePolyline(points, resolution = 20) {
    if (points.length < 2) return [...points];
    if (points.length === 2) {
      // Linear interpolation for 2 points
      const samples = [];
      for (let i = 0; i < resolution; i++) {
        const t = i / (resolution - 1);
        const x = points[0].x * (1 - t) + points[1].x * t;
        const y = points[0].y * (1 - t) + points[1].y * t;
        samples.push({ x, y });
      }
      return samples;
    }
    
    // Use Catmull-Rom for 3+ points
    const samples = [];
    const segmentCount = points.length - 1;
    const samplesPerSegment = Math.max(1, Math.floor(resolution / segmentCount));
    
    for (let i = 0; i < segmentCount; i++) {
      // Get control points for Catmull-Rom
      const p0 = i === 0 ? points[0] : points[i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i === segmentCount - 1 ? points[i + 1] : points[i + 2];
      
      // Sample along this segment
      for (let j = 0; j < samplesPerSegment; j++) {
        const t = j / samplesPerSegment;
        samples.push(this.catmullRomPoint(t, p0, p1, p2, p3));
      }
    }
    
    // Always include the last point
    if (samples.length === 0 || samples[samples.length - 1] !== points[points.length - 1]) {
      samples.push({ ...points[points.length - 1] });
    }
    
    return samples;
  }
  
  /**
   * Compute normal vectors for ribbon rendering
   * @param {Array} points - Points along the curve
   * @returns {Array} Normal vectors [{x, y}, ...]
   */
  static computeRibbonNormals(points) {
    if (points.length < 2) return [];
    
    const normals = [];
    
    for (let i = 0; i < points.length; i++) {
      let tangent;
      
      if (i === 0) {
        // First point: use forward difference
        tangent = {
          x: points[i + 1].x - points[i].x,
          y: points[i + 1].y - points[i].y
        };
      } else if (i === points.length - 1) {
        // Last point: use backward difference
        tangent = {
          x: points[i].x - points[i - 1].x,
          y: points[i].y - points[i - 1].y
        };
      } else {
        // Middle points: use central difference
        tangent = {
          x: points[i + 1].x - points[i - 1].x,
          y: points[i + 1].y - points[i - 1].y
        };
      }
      
      // Normalize tangent
      const length = Math.sqrt(tangent.x * tangent.x + tangent.y * tangent.y);
      if (length > 0) {
        tangent.x /= length;
        tangent.y /= length;
      }
      
      // Compute normal (perpendicular to tangent)
      const normal = {
        x: -tangent.y,
        y: tangent.x
      };
      
      normals.push(normal);
    }
    
    return normals;
  }
  
  /**
   * Render a thick spline with variable width
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array} points - Points along the spline
   * @param {number} startWidth - Width at start
   * @param {number} endWidth - Width at end
   * @param {string} color - Fill color
   */
  static renderThickSpline(ctx, points, startWidth, endWidth, color) {
    if (points.length < 2) return;
    
    const normals = this.computeRibbonNormals(points);
    
    ctx.fillStyle = color;
    ctx.beginPath();
    
    // Draw top edge
    for (let i = 0; i < points.length; i++) {
      const t = i / (points.length - 1);
      const width = startWidth * (1 - t) + endWidth * t;
      const halfWidth = width * 0.5;
      
      const x = points[i].x + normals[i].x * halfWidth;
      const y = points[i].y + normals[i].y * halfWidth;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    // Draw bottom edge (in reverse)
    for (let i = points.length - 1; i >= 0; i--) {
      const t = i / (points.length - 1);
      const width = startWidth * (1 - t) + endWidth * t;
      const halfWidth = width * 0.5;
      
      const x = points[i].x - normals[i].x * halfWidth;
      const y = points[i].y - normals[i].y * halfWidth;
      
      ctx.lineTo(x, y);
    }
    
    ctx.closePath();
    ctx.fill();
  }
  
  /**
   * Get the tangent direction at a specific point along the curve
   * @param {Array} points - Points along the curve
   * @param {number} index - Point index
   * @returns {Object} Normalized tangent vector {x, y}
   */
  static getTangentAt(points, index) {
    if (points.length < 2) return { x: 1, y: 0 };
    
    let tangent;
    const i = Math.max(0, Math.min(points.length - 1, index));
    
    if (i === 0) {
      tangent = {
        x: points[i + 1].x - points[i].x,
        y: points[i + 1].y - points[i].y
      };
    } else if (i === points.length - 1) {
      tangent = {
        x: points[i].x - points[i - 1].x,
        y: points[i].y - points[i - 1].y
      };
    } else {
      tangent = {
        x: points[i + 1].x - points[i - 1].x,
        y: points[i + 1].y - points[i - 1].y
      };
    }
    
    // Normalize
    const length = Math.sqrt(tangent.x * tangent.x + tangent.y * tangent.y);
    if (length > 0) {
      tangent.x /= length;
      tangent.y /= length;
    }
    
    return tangent;
  }
}