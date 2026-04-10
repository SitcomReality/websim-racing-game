/**
 * RenderPipeline - Manages the render pipeline phases
 */
export class RenderPipeline {
  constructor(renderManager) {
    this.renderManager = renderManager;
    this.phases = [
      'clear',
      'update', 
      'renderScene',
      'renderOverlays',
      'renderDebug'
    ];
  }

  execute(time, deltaTime) {
    for (const phase of this.phases) {
      if (typeof this.renderManager[phase] === 'function') {
        this.renderManager[phase](time, deltaTime);
      }
    }
  }
}