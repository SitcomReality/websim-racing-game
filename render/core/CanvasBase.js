export class CanvasBase {
  constructor(canvas) {
    this.setCanvas(canvas);
    this.dpr = 1;
    this.lastTime = performance.now();
  }

  setCanvas(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  resizeToContainer() {
    const container = this.canvas.parentElement || document.body;
    this.dpr = window.devicePixelRatio || 1;
    const targetW = (container.clientWidth || 800);
    const targetH = (container.clientHeight || 520);
    this.canvas.width = Math.floor(targetW * this.dpr);
    this.canvas.height = Math.floor(targetH * this.dpr);
    this.ctx.setTransform(1,0,0,1,0,0); 
    this.ctx.scale(this.dpr, this.dpr);
    this.canvas.style.width = (this.canvas.width / this.dpr) + 'px';
    this.canvas.style.height = (this.canvas.height / this.dpr) + 'px';
  }
}

