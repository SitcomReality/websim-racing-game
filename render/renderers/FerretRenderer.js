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

    // Render ferret components
    this.bodyRenderer.renderBody(ctx, ferret, racer.colors);
    this.bodyRenderer.renderHead(ctx, ferret, racer.colors, time, racer);
    this.bodyRenderer.renderTail(ctx, ferret, racer.colors);
    this.bodyRenderer.renderLegs(ctx, ferret, racer.colors);

    // Render eyes with independent tracking
    this.eyeRenderer.render(ctx, ferret, racer.colors);

    ctx.restore();
  }
}

window.FerretRenderer = FerretRenderer;