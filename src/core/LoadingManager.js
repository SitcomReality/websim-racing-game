/** 
 * LoadingManager - Handles loading state and visual feedback
 */ 
export class LoadingManager {
  constructor() {
    this.loadingElement = null;
    this.createLoadingElement();
  }

  createLoadingElement() {
    this.loadingElement = document.createElement('div');
    this.loadingElement.id = 'loadingOverlay';
    this.loadingElement.innerHTML = `
      <div class=\"loading-container\">
        <div class=\"loading-spinner\"></div>
        <div class=\"loading-text\">Loading...</div>
        <div class=\"loading-bar\">
          <div class=\"loading-progress\"></div>
        </div>
      </div>
    `;
    this.loadingElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      color: white;
      font-family: 'Orbitron', sans-serif;
    `;
  }

  show() {
    if (!this.loadingElement.parentNode) {
      document.body.appendChild(this.loadingElement);
    }
  }

  hide() {
    if (this.loadingElement.parentNode) {
      document.body.removeChild(this.loadingElement);
    }
  }

  updateProgress(progress, message) {
    const progressBar = this.loadingElement.querySelector('.loading-progress');
    const textElement = this.loadingElement.querySelector('.loading-text');
    
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
    if (textElement) {
      textElement.textContent = message || 'Loading...';
    }
  }
}