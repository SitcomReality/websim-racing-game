/**
 * CanvasAdapter - Handles canvas operations and device pixel ratio management
 */
export class CanvasAdapter {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
  }

  resizeToContainer() {
    const container = this.canvas.parentElement || document.body;
    const targetW = container.clientWidth || 800;
    const targetH = container.clientHeight || 520;
    
    this.canvas.width = Math.floor(targetW * this.dpr);
    this.canvas.height = Math.floor(targetH * this.dpr);
    
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);
    
    this.canvas.style.width = (this.canvas.width / this.dpr) + 'px';
    this.canvas.style.height = (this.canvas.height / this.dpr) + 'px';
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  getContext() {
    return this.ctx;
  }

  getDimensions() {
    return {
      width: this.canvas.width / this.dpr,
      height: this.canvas.height / this.dpr
    };
  }
}

