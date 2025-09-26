/**
 * InteractionController - Handles mouse interactions and hover effects
 */
export class InteractionController {
  constructor(renderManager) {
    this.renderManager = renderManager;
    this.hoveredLane = null;
    this.currentHoveredLane = null;
    this.previousHoveredLane = null;
    // this.banners = new Map(); // State moved to BannerSystem

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

  update() {
    const w = this.renderManager.canvas.width / this.renderManager.dpr;
    const h = this.renderManager.canvas.height / this.renderManager.dpr;
    const laneH = this.renderManager.worldTransform.laneHeight;

    const currentLane = this.currentHoveredLane;
    const previousLane = this.previousHoveredLane;

    if (currentLane !== previousLane) {
      // Hide banner for previously hovered lane
      if (previousLane !== null) {
        this.renderManager.bannerSystem.hideBanner(previousLane);
      }
      
      // Show banner for newly hovered lane
      if (currentLane !== null && this.renderManager.currentRace) {
        const rid = this.renderManager.currentRace.racers[currentLane];
        const racer = this.renderManager.gameState?.racers.find(r => r.id === rid);
        if (racer) {
          const racerName = this.getRacerNameString(racer);
          this.renderManager.bannerSystem.showBanner('name', currentLane, racerName, racer);
        }
      }
    }
    
    this.previousHoveredLane = this.currentHoveredLane;
  }

  createHoverBanner(racer, laneIndex, w) {
    // Deprecated: Logic moved to update() and BannerSystem
  }

  getRacerNameString(racer) {
    if (!racer || !racer.name) return "Unknown Racer";
    const p = window.racerNamePrefixes?.[racer.name[0]];
    const s = window.racerNameSuffixes?.[racer.name[1]];
    const pref = typeof p === 'function' ? (racer._evaluatedPrefix ||= p()) : p;
    const suff = typeof s === 'function' ? (racer._evaluatedSuffix ||= s()) : s;
    return `${pref} ${suff}`;
  }

  screenToLaneIndex(clientY) {
    if (!this.renderManager.renderProps) return null;

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