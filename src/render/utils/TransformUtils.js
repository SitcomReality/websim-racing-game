/** 
 * TransformUtils - Utility functions for coordinate transformations
 */ 
export class TransformUtils {
  constructor(renderManager) {
    this.renderManager = renderManager;
  }

  /** 
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldX, laneIndex) {
    return this.renderManager.worldTransform.worldToScreen(
      worldX,
      laneIndex,
      this.renderManager.camera,
      this.renderManager.canvas.width,
      this.renderManager.canvas.height,
      this.renderManager.renderProps?.numberOfLanes,
      this.renderManager.gameState
    );
  }

  /** 
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenX, screenY) {
    return this.renderManager.worldTransform.screenToWorld(
      screenX, 
      screenY, 
      this.renderManager.camera, 
      this.renderManager.canvas.width, 
      this.renderManager.canvas.height, 
      this.renderManager.renderProps?.numberOfLanes
    );
  }
}