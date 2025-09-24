class FerretRenderer {
  constructor() {
    this.animationSystem = new FerretAnimationSystem();
    this.bodyRenderer = new FerretBodyRenderer();
    this.eyeRenderer = new FerretEyeRenderer();
  }

  render(ctx, x, y, racer, time, scale = 1) {
    const ferret = racer.ferret;
    if (!ferret) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Update animation state
    this.animationSystem.update(ferret, racer, time);

    // Resolve color indices to hex strings
    const colors = racer.colors.map(c => (typeof c === 'string' ? c : racerColors[c]));

    // Render ferret components
    this.bodyRenderer.renderBody(ctx, ferret, colors);
    this.bodyRenderer.renderHead(ctx, ferret, colors, time, racer);
    this.bodyRenderer.renderTail(ctx, ferret, colors);
    this.bodyRenderer.renderLegs(ctx, ferret, colors);

    // Render eyes with independent tracking
    this.eyeRenderer.render(ctx, ferret, colors);

    ctx.restore();
  }
}

window.FerretRenderer = FerretRenderer;