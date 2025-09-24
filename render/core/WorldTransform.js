class WorldTransform {
  constructor(laneHeight = 40, segmentWidth = 30) {
    this.laneHeight = laneHeight;
    this.segmentWidth = segmentWidth;
  }

  worldToScreen(worldX, laneIndex, camera, canvasWidth, canvasHeight, numberOfLanes, gameState) {
    // defaults for missing params
    camera = camera || { target: { x: 0, y: 0 }, zoom: 1 };
    const dpr = (window.devicePixelRatio || 1);
    canvasWidth = canvasWidth || 800;
    canvasHeight = canvasHeight || 520;
    numberOfLanes = numberOfLanes || 10;
    
    // Get gameState from the app instance
    if (!gameState) {
      console.warn('WorldTransform: gameState not available');
      return { x: 0, y: 0, scale: 1 };
    }

    const pad = 10;
    const w = canvasWidth / dpr;
    const h = this.laneHeight;

    const totalHeight = h * numberOfLanes;
    const trackCenterY = pad + totalHeight / 2;

    const yPos = pad + laneIndex * h + h / 2;

    const worldPixelWidth = w * 4;
    const cameraPixelX = camera ? (camera.target.x / 100 * worldPixelWidth) : 0;

    const screenX = (worldX / 100 * worldPixelWidth - cameraPixelX) * (camera ? camera.zoom : 1) + w / 2;
    const screenY = (yPos - trackCenterY) * (camera ? camera.zoom : 1) + (canvasHeight / dpr) / 2;

    return { x: screenX, y: screenY, scale: (camera ? camera.zoom : 1) };
  }
}

export { WorldTransform };