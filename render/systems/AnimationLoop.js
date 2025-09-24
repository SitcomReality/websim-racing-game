/**
 * AnimationLoop - Manages the render loop
 */
export class AnimationLoop {
  constructor() {
    this.isRunning = false;
    this.callback = null;
    this.animationId = null;
  }

  start(callback) {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.callback = callback;
    this.loop();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  loop() {
    if (!this.isRunning) return;
    
    const time = performance.now();
    this.callback(time);
    
    this.animationId = requestAnimationFrame(() => this.loop());
  }
}

