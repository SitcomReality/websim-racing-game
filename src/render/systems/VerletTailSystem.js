import { VerletChain } from "./VerletChain.js";

export class VerletTailSystem {
  static update(ferret, racer, dt) {
    const tail = ferret.tailChain;
    const body = ferret.bodyChain;

    if (!tail?.nodes || tail.nodes.length < 2 || !body?.nodes || body.nodes.length < 2 || !tail.enabled) return;

    const hipNode = body.nodes[0];
    tail.anchors.base.x = hipNode.x;
    tail.anchors.base.y = hipNode.y;

    VerletChain.integrate(tail.nodes, tail.prevNodes, dt, tail.params.damping);
    VerletChain.applyGravity(tail.nodes, ferret.isStumbling ? 30 : 9.8);
    const GROUND_Y = 15;
    const friction = ferret.isStumbling ? 0.9 : 0.6;
    VerletChain.applyGroundConstraint(tail.nodes, tail.prevNodes, GROUND_Y, friction, dt);

    VerletChain.updateAnchors(tail.nodes, tail.anchors.base, null);

    const tailP0 = tail.nodes[0];
    const tailP1 = tail.nodes[1];
    const bodyP0 = body.nodes[0];
    const bodyP1 = body.nodes[1];
    
    let Vx = bodyP1.x - bodyP0.x;
    let Vy = bodyP1.y - bodyP0.y;
    let L = Math.sqrt(Vx*Vx + Vy*Vy);
    
    if (L > 0.001) {
      const Tx = Vx / L;
      const Ty = Vy / L;
      const tailRestLength = tail.restLengths[0];
      const Nx = -Ty;
      const Ny = Tx;
      const downwardBiasFactor = 0.3;
      const targetTailDx = -Tx + Nx * downwardBiasFactor;
      const targetTailDy = -Ty + Ny * downwardBiasFactor;
      const targetDirLength = Math.sqrt(targetTailDx*targetTailDx + targetTailDy*targetTailDy);
      const DirTx = targetTailDx / targetDirLength;
      const DirTy = targetTailDy / targetDirLength;
      const targetX1 = tailP0.x + DirTx * tailRestLength;
      const targetY1 = tailP0.y + DirTy * tailRestLength;
      const orientationStiffness = ferret.isStumbling ? 0.5 : 0.9;
      tailP1.x += (targetX1 - tailP1.x) * orientationStiffness;
      tailP1.y += (targetY1 - tailP1.y) * orientationStiffness;
    }

    VerletChain.satisfyConstraints(tail.nodes, tail.restLengths, tail.params.iterations, tail.params.stiffness);
    VerletChain.smoothCurvature(tail.nodes, ferret.isStumbling ? 0.02 : 0.1);
  }
}
