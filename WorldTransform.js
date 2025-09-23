class WorldTransform {
  constructor(laneHeight = 40, segmentWidth = 30) {
    this.laneHeight = laneHeight;
    this.segmentWidth = segmentWidth;
  }

  worldToScreen(worldX, laneIndex, camera, canvasWidth, canvasHeight, numberOfLanes) {
    const pad = 10;
    const dpr = (camera && camera.dpr) || window.devicePixelRatio || 1;
    const w = canvasWidth / dpr;
    const h = this.laneHeight;

    const perspectiveFactor = 1 - (laneIndex / numberOfLanes) * 0.2;
    const scaledLaneHeight = h * perspectiveFactor;

    let totalPerspectiveHeight = 0;
    for(let i = 0; i < numberOfLanes; i++) {
        totalPerspectiveHeight += h * (1 - (i / numberOfLanes) * 0.2);
    }
    const trackCenterY = pad + totalPerspectiveHeight / 2;

    let yPos = pad;
    for(let i = 0; i < laneIndex; i++) {
        yPos += h * (1 - (i / numberOfLanes) * 0.2);
    }
    yPos += scaledLaneHeight / 2;

    const worldPixelWidth = w * 4;
    const cameraPixelX = camera ? (camera.target.x / 100 * worldPixelWidth) : 0;

    const screenX = (worldX / 100 * worldPixelWidth - cameraPixelX) * (camera ? camera.zoom : 1) + w / 2;
    const screenY = (yPos - trackCenterY) * (camera ? camera.zoom : 1) + (canvasHeight / dpr) / 2;

    return { x: screenX, y: screenY, scale: perspectiveFactor * (camera ? camera.zoom : 1) };
  }
}

window.WorldTransform = WorldTransform;

