/** 
 * WeatherRenderer - Handles weather effects rendering
 */ 
export class WeatherRenderer {
  constructor(renderManager) {
    this.renderManager = renderManager;
  }

  /** 
   * Render weather effects based on current race weather
   */ 
  render() {
    const weather = this.renderManager.currentRace?.weather;
    if (!weather) return;

    const dims = this.renderManager.canvasAdapter.getDimensions();
    const wLower = weather.toLowerCase();

    this.renderManager.ctx.save();
    this.renderManager.ctx.setTransform(1, 0, 0, 1, 0, 0);

    switch (wLower) {
      case 'rainy':
      case 'stormy':
        this.renderRainEffect(dims);
        break;
      case 'snowy':
        this.renderSnowEffect(dims);
        break;
      case 'foggy':
      case 'cloudy':
        this.renderFogEffect(dims);
        break;
      case 'dusty':
        this.renderDustEffect(dims);
        break;
    }

    this.renderManager.ctx.restore();
  }

  renderRainEffect(dims) {
    this.renderManager.ctx.strokeStyle = 'rgba(180,180,255,0.35)';
    this.renderManager.ctx.lineWidth = 1;
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * dims.width;
      const y = Math.random() * dims.height;
      this.renderManager.ctx.beginPath();
      this.renderManager.ctx.moveTo(x, y);
      this.renderManager.ctx.lineTo(x + 10, y + 20);
      this.renderManager.ctx.stroke();
    }
  }

  renderSnowEffect(dims) {
    this.renderManager.ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * dims.width;
      const y = Math.random() * dims.height;
      const r = 1 + Math.random() * 2;
      this.renderManager.ctx.beginPath();
      this.renderManager.ctx.arc(x, y, r, 0, Math.PI * 2);
      this.renderManager.ctx.fill();
    }
  }

  renderFogEffect(dims) {
    this.renderManager.ctx.fillStyle = 'rgba(200,200,200,0.12)';
    this.renderManager.ctx.fillRect(0, 0, dims.width, dims.height);
  }

  renderDustEffect(dims) {
    this.renderManager.ctx.fillStyle = 'rgba(160,120,80,0.12)';
    this.renderManager.ctx.fillRect(0, 0, dims.width, dims.height);
  }
}