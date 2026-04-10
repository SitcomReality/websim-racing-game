/** 
 * VerletChain - Generic particle chain constraint solver 
 * Provides physics simulation for flexible particle chains using Verlet integration 
 */ 
export class VerletChain {
  /** 
   * Create a new particle chain 
   * @param {Object} config - Chain configuration 
   * @param {number} config.count - Number of nodes in the chain 
   * @param {Object} config.start - Starting position {x, y} 
   * @param {Object} config.dir - Direction vector {x, y} 
   * @param {number} config.spacing - Rest distance between nodes 
   */ 
  static createChain({ count, start, dir, spacing }) {
    const nodes = []; 
    const prevNodes = []; 
    const restLengths = []; 

    // Normalize direction 
    const length = Math.sqrt(dir.x * dir.x + dir.y * dir.y) || 1; 
    const normDir = { x: dir.x / length, y: dir.y / length }; 

    // Create nodes along the direction 
    for (let i = 0; i < count; i++) {
      const pos = { 
        x: start.x + normDir.x * spacing * i, 
        y: start.y + normDir.y * spacing * i 
      }; 
      nodes.push(pos); 
      prevNodes.push({ ...pos }); // Copy for Verlet 
      
      if (i > 0) { 
        restLengths.push(spacing); 
      } 
    } 

    return { nodes, prevNodes, restLengths }; 
  }

  /** 
   * Integrate particle positions using Verlet integration 
   * @param {Array} nodes - Current positions 
   * @param {Array} prevNodes - Previous positions 
   * @param {number} dt - Delta time 
   * @param {number} damping - Damping factor (0-1) 
   */ 
  static integrate(nodes, prevNodes, dt, damping = 0.99) {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]; 
      const prev = prevNodes[i]; 

      // Calculate velocity from position difference 
      const velX = (node.x - prev.x) * damping; 
      const velY = (node.y - prev.y) * damping; 

      // Store current position as previous 
      prev.x = node.x; 
      prev.y = node.y; 

      // Update position with velocity 
      node.x += velX; 
      node.y += velY; 
    } 
  }

  /** 
   * Apply a simple gravity force
   * @param {Array} nodes - Node positions
   * @param {number} strength - Gravity strength
   */
  static applyGravity(nodes, strength = 9.8) {
    for (let i = 0; i < nodes.length; i++) {
        // A small constant gravity pull downwards
        nodes[i].y += strength * 0.05;
    }
  }

  /**
   * Apply constraint to keep nodes above a ground plane and apply drag/friction.
   * @param {Array} nodes - Node positions
   * @param {Array} prevNodes - Previous positions (for velocity calculation/friction)
   * @param {number} groundY - The Y coordinate of the ground plane
   * @param {number} friction - Friction coefficient (0=none, 1=max drag)
   * @param {number} dt - Delta time
   */
  static applyGroundConstraint(nodes, prevNodes, groundY, friction = 0.5, dt) {
      if (nodes.length === 0) return;
      
      const frictionRate = friction * dt * 60; // Convert friction coefficient to per-frame rate

      for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          const prev = prevNodes[i];

          // 1. Ground Collision/Constraint (Repulsion)
          if (node.y >= groundY) {
              
              // Push the node back to the surface
              node.y = groundY;
              
              // Update previous position to simulate an inelastic collision/stop vertical velocity
              const velY = node.y - prev.y; 
              // Reduce vertical velocity significantly (0.2 retains a slight upward spring/bounce reduction)
              prev.y = node.y - velY * 0.2; 

              // 2. Horizontal Friction/Drag
              const velX = node.x - prev.x;
              
              // Apply drag: reduces horizontal speed when touching the ground.
              const dragMultiplier = 1.0 - frictionRate;
              
              prev.x = node.x - velX * dragMultiplier;
          }
      }
  }

  /** 
   * Satisfy distance constraints between connected nodes 
   * @param {Array} nodes - Node positions to modify 
   * @param {Array} restLengths - Rest distances between adjacent nodes 
   * @param {number} iterations - Number of constraint iterations 
   * @param {number} stiffness - Constraint stiffness (0-1) 
   */ 
  static satisfyConstraints(nodes, restLengths, iterations = 3, stiffness = 0.8) {
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < restLengths.length; i++) {
        const nodeA = nodes[i]; 
        const nodeB = nodes[i + 1]; 
        const restLength = restLengths[i]; 

        // Calculate current distance 
        const dx = nodeB.x - nodeA.x; 
        const dy = nodeB.y - nodeA.y; 
        const currentLength = Math.sqrt(dx * dx + dy * dy); 

        if (currentLength === 0) continue; // Avoid division by zero 

        // Calculate correction 
        const difference = restLength - currentLength; 
        const percent = difference / currentLength * stiffness * 0.5; 

        const offsetX = dx * percent; 
        const offsetY = dy * percent; 

        // Apply correction to both nodes 
        nodeA.x -= offsetX; 
        nodeA.y -= offsetY; 
        nodeB.x += offsetX; 
        nodeB.y += offsetY; 
      } 
    } 
  }

  /** 
   * Pin or lerp end nodes to anchor positions 
   * @param {Array} nodes - Node positions to modify 
   * @param {Object} frontAnchor - Front anchor {x, y, weight} 
   * @param {Object} backAnchor - Back anchor {x, y, weight} 
   */ 
  static updateAnchors(nodes, frontAnchor, backAnchor) {
    if (nodes.length === 0) return; 

    // Update front node (head) 
    if (frontAnchor && frontAnchor.weight > 0) {
      const front = nodes[0]; 
      const weight = Math.min(1, Math.max(0, frontAnchor.weight)); 
      front.x = front.x * (1 - weight) + frontAnchor.x * weight; 
      front.y = front.y * (1 - weight) + frontAnchor.y * weight; 
    } 

    // Update back node (tail) 
    if (backAnchor && backAnchor.weight > 0) {
      const back = nodes[nodes.length - 1]; 
      const weight = Math.min(1, Math.max(0, backAnchor.weight)); 
      back.x = back.x * (1 - weight) + backAnchor.x * weight; 
      back.y = back.y * (1 - weight) + backAnchor.y * weight; 
    } 
  }

  /** 
   * Apply mild curvature smoothing to prevent sharp kinks 
   * @param {Array} nodes - Node positions to smooth 
   * @param {number} strength - Smoothing strength (0-1) 
   */ 
  static smoothCurvature(nodes, strength = 0.1) {
    if (nodes.length < 3) return; 

    const smoothed = nodes.map(node => ({ ...node })); 

    for (let i = 1; i < nodes.length - 1; i++) {
      const prev = nodes[i - 1]; 
      const curr = nodes[i]; 
      const next = nodes[i + 1]; 

      // Calculate smooth position as average of neighbors 
      const smoothX = (prev.x + next.x) * 0.5; 
      const smoothY = (prev.y + next.y) * 0.5; 

      // Blend current position with smooth position 
      smoothed[i].x = curr.x * (1 - strength) + smoothX * strength; 
      smoothed[i].y = curr.y * (1 - strength) + smoothY * strength; 
    } 

    // Copy smoothed positions back 
    for (let i = 1; i < nodes.length - 1; i++) {
      nodes[i].x = smoothed[i].x; 
      nodes[i].y = smoothed[i].y; 
    } 
  }
}
