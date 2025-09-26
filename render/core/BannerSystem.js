/** 
 * BannerSystem - Manages race event banners with different visual styles
 */ 
export class BannerSystem {
  constructor() {
    this.activeBanners = new Map();
    this.bannerTypes = {
      STUMBLE: 'stumble',
      FINISH: 'finish', 
      INCIDENT: 'incident',
      NAME: 'name'
    };
    // screen-space animation defaults
    this.slideInStartOffset = 100; // start off-screen to the right
  }

  createBanner(type, laneIndex, text, duration = null) {
    // Create different visual styles based on type
    // Handle banner lifecycle
    // Position banners behind ferrets
    if (this.activeBanners.has(laneIndex)) {
      const banner = this.activeBanners.get(laneIndex);
      banner.text = text;
      banner.type = type;
      banner.startTime = Date.now();
    } else {
      const banner = {
        laneIndex: laneIndex,
        text: text,
        type: type,
        startTime: Date.now(),
        duration: duration,
        x: null,            // will be initialized on first render
        targetX: 20,        // fixed left-side position in screen space
        opacity: 0,
        active: true
      };
      this.activeBanners.set(laneIndex, banner);
    }
  }

  render(ctx, camera, worldTransform, race, renderProps) {
    // Render active banners in screen-space (fixed left position; vertical follows lane)
    const dpr = (window.devicePixelRatio || 1);
    const w = ctx.canvas.width / dpr;
    const h = ctx.canvas.height / dpr;
    const laneHeight = worldTransform.laneHeight;
    const totalHeight = laneHeight * (renderProps?.numberOfLanes || 10);

    for (const [laneIndex, banner] of this.activeBanners.entries()) {
      const { type, text, startTime, duration } = banner;

      if (banner.x === null) banner.x = w + this.slideInStartOffset;
      banner.x += (banner.targetX - banner.x) * 0.18;
      const targetOpacity = banner.active ? 1 : 0;
      banner.opacity += (targetOpacity - banner.opacity) * 0.15;

      const bannerWidth = 220;
      const bannerHeight = Math.max(30, laneHeight * camera.zoom * 0.8);
      const laneCenterY = (laneIndex * laneHeight + laneHeight / 2 - totalHeight / 2) * camera.zoom + h / 2;
      const bannerY = laneCenterY - bannerHeight / 2;
      const bannerX = banner.x;

      const bannerColor = this.getBannerColor(type);
      const textColor = this.getBannerTextColor(type);
      const isDurationElapsed = typeof duration === 'number' && (Date.now() - startTime > duration * 1000);
      if (isDurationElapsed) { banner.active = false; banner.targetX = -bannerWidth - 50; }

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, banner.opacity));
      ctx.fillStyle = bannerColor;
      ctx.fillRect(bannerX, bannerY, bannerWidth, bannerHeight);
      ctx.fillStyle = textColor;
      ctx.font = 'bold 16px Orbitron';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, bannerX + 10, laneCenterY);
      ctx.restore();

      const offLeft = banner.x < -bannerWidth - 60;
      const fullyFaded = banner.opacity < 0.02;
      if (!banner.active && offLeft && fullyFaded) {
        this.activeBanners.delete(laneIndex);
      }
    }
  }

  getBannerColor(type) {
    switch (type) {
      case this.bannerTypes.STUMBLE:
        return 'rgba(255, 0, 0, 0.8)';
      case this.bannerTypes.FINISH:
        return 'rgba(0, 255, 0, 0.8)';
      case this.bannerTypes.INCIDENT:
        return 'rgba(0, 0, 255, 0.8)';
      case this.bannerTypes.NAME:
        return 'rgba(255, 255, 255, 0.8)';
      default:
        return 'rgba(255, 255, 255, 0.8)';
    }
  }

  getBannerTextColor(type) {
    switch (type) {
      case this.bannerTypes.STUMBLE:
        return 'white';
      case this.bannerTypes.FINISH:
        return 'black';
      case this.bannerTypes.INCIDENT:
        return 'white';
      case this.bannerTypes.NAME:
        return 'black';
      default:
        return 'black';
    }
  }
}