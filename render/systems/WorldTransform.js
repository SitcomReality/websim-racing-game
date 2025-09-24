/**
 * WorldTransform - Handles coordinate transformations between world and screen space
 */
export class WorldTransform {
  constructor(laneHeight = 40, segmentWidth = 30) {
    this.laneHeight = laneHeight;
    this.segmentWidth = segmentWidth;
  }

  worldToScreen(worldX, laneIndex, camera, canvasWidth, canvasHeight, numberOfLanes) {
    // Defaults for missing params
    camera = camera || (window.renderManager && window.renderManager.camera) || null;
    const dpr = (window.devicePixelRatio || 1);
    canvasWidth = canvasWidth || (window.renderManager && window.renderManager.canvas && window.renderManager.canvas.width) || 800;
    canvasHeight = canvasHeight || (window.renderManager && window.renderManager.canvas && window.renderManager.canvas.height) || 520;
    numberOfLanes = numberOfLanes || (window.renderManager && window.renderManager.renderProps && window.renderManager.renderProps.numberOfLanes) || (window.gameState && window.gameState.settings && window.gameState.settings.trackProperties.numberOfLanes) || 1;

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

  screenToWorld(screenX, screenY, camera, canvasWidth, canvasHeight, numberOfLanes) {
    const dpr = (window.devicePixelRatio || 1);
    canvasWidth = canvasWidth || (window.renderManager && window.renderManager.canvas && window.renderManager.canvas.width) || 800;
    canvasHeight = canvasHeight || (window.renderManager && window.renderManager.canvas && window.renderManager.canvas.height) || 520;
    numberOfLanes = numberOfLanes || (window.renderManager && window.renderManager.renderProps && window.renderManager.renderProps.numberOfLanes) || (window.gameState && window.gameState.settings && window.gameState.settings.trackProperties.numberOfLanes) || 1;

    const w = canvasWidth / dpr;
    const h = this.laneHeight;

    const totalHeight = h * numberOfLanes;
    const trackCenterY = totalHeight / 2;

    const worldPixelWidth = w * 4;
    const cameraPixelX = camera ? (camera.target.x / 100 * worldPixelWidth) : 0;

    const worldX = ((screenX - w / 2) / (camera ? camera.zoom : 1) + cameraPixelX) / worldPixelWidth * 100;
    const worldY = ((screenY - (canvasHeight / dpr) / 2) / (camera ? camera.zoom : 1) + trackCenterY - h / 2) / h;

    return { x: worldX, y: worldY };
  }
}