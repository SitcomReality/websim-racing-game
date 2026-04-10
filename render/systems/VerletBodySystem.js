import { VerletChain } from "../../src/render/systems/VerletChain.js";

export class VerletBodySystem {
  static update(ferret, racer, dt) {
    const chain = ferret.bodyChain;
    if (!chain || !chain.nodes || !chain.enabled) return;

    const bounceHeight = ferret.gait.bounceHeight || 3;
    const strideAmp = ferret.gait.strideAmplitude || 1;
    const gaitPhase = ferret.gait.cyclePhase;

    chain.anchors.head.offsetY = -Math.sin(gaitPhase) * bounceHeight * strideAmp;
    chain.anchors.hip.offsetY = Math.sin(gaitPhase) * bounceHeight * strideAmp;

    const bodyPixelLength = (chain.nodes.length - 1) * (chain.restLengths[0] || 8);
    chain.anchors.head.x = bodyPixelLength / 2;
    chain.anchors.hip.x = -bodyPixelLength / 2;

    chain.anchors.head.y = chain.anchors.head.offsetY;
    chain.anchors.hip.y = chain.anchors.hip.offsetY;

    if (ferret.isStumbling) {
      chain.anchors.head.y = 14; chain.anchors.hip.y = 10;
      chain.anchors.head.weight = 0.05; chain.anchors.hip.weight = 0.05;
    } else {
      chain.anchors.head.weight = 0.8;
      chain.anchors.hip.weight = 0.6;
    }

    const contactDuty = ferret.gait.contact.dutyCycle || 0.6;
    const isFrontContact = Math.sin(gaitPhase) < (contactDuty * 2 - 1);
    ferret.gait.contact.frontInContact = isFrontContact;
    ferret.gait.contact.backInContact = !isFrontContact;

    const { nodes, prevNodes, restLengths, params, anchors } = chain;
    VerletChain.integrate(nodes, prevNodes, dt, params.damping);
    if (ferret.isStumbling) { VerletChain.applyGravity(nodes, 35); VerletChain.applyGroundConstraint(nodes, prevNodes, 15, 0.85, dt); }
    VerletChain.updateAnchors(nodes, anchors.hip, anchors.head);
    VerletChain.satisfyConstraints(nodes, restLengths, params.iterations, params.stiffness);
    VerletChain.smoothCurvature(nodes, 0.1);
  }
}
