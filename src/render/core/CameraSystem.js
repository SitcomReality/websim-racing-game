/** 
 * CameraSystem - Handles camera calculations and transformations
 */ 
export class CameraSystem {
  constructor(renderManager) {
    this.renderManager = renderManager;
  }

  /** 
   * Apply camera transformation to context
   */ 
  applyTransform(ctx) {
    const dims = this.renderManager.canvasAdapter.getDimensions();

    ctx.translate(dims.width / 2, dims.height / 2);
    ctx.scale(this.renderManager.camera.zoom, this.renderManager.camera.zoom);

    const worldPixelWidth = dims.width * 4;
    const cameraPixelX = this.renderManager.camera.target.x / 100 * worldPixelWidth;
    const laneHeight = this.renderManager.worldTransform.laneHeight;
    const totalHeight = laneHeight * (this.renderManager.renderProps?.numberOfLanes || 10);
    const trackCenterY = totalHeight / 2;

    ctx.translate(-cameraPixelX, -trackCenterY);
  }

  /** 
   * Update camera target to follow the leader
   */ 
  updateTarget(deltaTime = 0.016) {
    if (!this.renderManager.currentRace || 
        !this.renderManager.currentRace.racers || 
        this.renderManager.currentRace.racers.length === 0) return;

    const dims = this.renderManager.canvasAdapter.getDimensions();
    const { desiredX, desiredZoom, suggestedDamping, urgency } = 
      this.renderManager.camera.calculateDesiredState(
        this.renderManager.currentRace, 
        this.renderManager.gameState, 
        dims
      );

    const zMin = this.renderManager.gameState.settings?.render?.camera?.zoomMin || 0.3;
    const zMax = this.renderManager.gameState.settings?.render?.camera?.zoomMax || 2.0;
    const targetZoom = Math.max(zMin, Math.min(zMax, desiredZoom));
    const targetX = Math.max(0, Math.min(100, desiredX));

    // Dynamic damping for smooth transitions
    const panD = suggestedDamping?.pan ?? this.renderManager.camera.damping;
    const zoomD = suggestedDamping?.zoom ?? this.renderManager.camera.damping;

    // Leader-on-screen guard to prevent racers from going off-screen
    const activeRacers = this.renderManager.currentRace.racers.filter(rid => 
      !(this.renderManager.currentRace.results || []).includes(rid)
    );

    if (activeRacers.length) {
      const leader = activeRacers.sort((a,b) => 
        (this.renderManager.currentRace.liveLocations[b]||0) - 
        (this.renderManager.currentRace.liveLocations[a]||0)
      )[0];

      const worldPixelWidth = dims.width * 4;
      const leaderX = (this.renderManager.currentRace.liveLocations[leader] || 0) / 100 * worldPixelWidth;
      const cameraX = this.renderManager.camera.target.x / 100 * worldPixelWidth;
      const uiLeaderX = (leaderX - cameraX) * this.renderManager.camera.zoom + dims.width / 2;
      const margin = dims.width * 0.15;

      if (uiLeaderX < margin || uiLeaderX > (dims.width - margin)) {
        // Faster pan to keep leader in frame
        const fastPan = Math.max(panD, 0.06);
        this.renderManager.camera.target.x += (targetX - this.renderManager.camera.target.x) * fastPan;
      } else {
        this.renderManager.camera.target.x += (targetX - this.renderManager.camera.target.x) * panD;
      }
    } else {
      this.renderManager.camera.target.x += (targetX - this.renderManager.camera.target.x) * panD;
    }

    this.renderManager.camera.zoom += (targetZoom - this.renderManager.camera.zoom) * zoomD;
  }
}