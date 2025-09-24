/** 
 * InteractionController - Handles mouse interactions and hover effects
 */ 
export class InteractionController {
  constructor(renderManager) {
    this.renderManager = renderManager;
    this.hoveredLane = null;
    this.currentHoveredLane = null;
    this.previousHoveredLane = null;
    this.banners = new Map();
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    if (!this.renderManager.canvas) return;
    
    this.onMouseMove = (e) => {
      const r = this.renderManager.canvas.getBoundingClientRect();
      const y = e.clientY - r.top;
      this.setHoveredLane(this.screenToLaneIndex(y));
    };
    
    this.onMouseLeave = () => this.setHoveredLane(null);
    
    this.renderManager.canvas.addEventListener('mousemove', this.onMouseMove);
    this.renderManager.canvas.addEventListener('mouseleave', this.onMouseLeave);
  }

  screenToLaneIndex(clientY) {
    const dpr = this.renderManager.dpr;
    const w = this.renderManager.canvas.width / dpr;
    const h = this.renderManager.canvas.height / dpr;
    const laneH = this.renderManager.worldTransform.laneHeight;
    const totalH = laneH * this.renderManager.renderProps.numberOfLanes;
    
    const y = clientY;
    const localY = (y - h/2) / this.renderManager.camera.zoom + totalH/2;
    const idx = Math.floor(localY / laneH);
    
    return (idx >= 0 && idx < this.renderManager.renderProps.numberOfLanes) ? idx : null;
  }

  setHoveredLane(lane) {
    this.hoveredLane = lane;
    this.currentHoveredLane = lane;
  }

  cleanup() {
    if (this.renderManager.canvas) {
      this.renderManager.canvas.removeEventListener('mousemove', this.onMouseMove);
      this.renderManager.canvas.removeEventListener('mouseleave', this.onMouseLeave);
    }
  }
}