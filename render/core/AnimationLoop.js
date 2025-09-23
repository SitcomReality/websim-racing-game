export class AnimationLoop {
  constructor() {
    this.loop = null;
  }

  start(tickCallback) {
    if (this.loop) cancelAnimationFrame(this.loop);
    const tick = (ts) => {
      tickCallback(ts);
      this.loop = requestAnimationFrame(tick);
    };
    this.loop = requestAnimationFrame(tick);
  }

  stop() {
    if (this.loop) cancelAnimationFrame(this.loop);
    this.loop = null;
  }
}

