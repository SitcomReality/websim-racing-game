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
  }

  showBanner(type, laneIndex, text, racer, duration = null) {
    const banner = this.activeBanners.get(laneIndex);
    if (banner) {
      // Update existing banner if needed, and reactivate it
      banner.type = type;
      banner.text = text;
      banner.racer = racer;
      banner.active = true;
      banner.startTime = Date.now();
      banner.duration = duration;
      banner.targetX = 20; // Slide in
    } else {
      // Create a new banner, starting off-screen
      this.activeBanners.set(laneIndex, {
        laneIndex, text, type, racer, duration,
        active: true,
        startTime: Date.now(),
        x: (window.innerWidth / (window.devicePixelRatio || 1)) + 100, // Start off-screen right
        targetX: 20, // Target on-screen left
        opacity: 0,
      });
    }
  }

  hideBanner(laneIndex) {
    const banner = this.activeBanners.get(laneIndex);
    if (banner) {
      banner.active = false;
      banner.targetX = -450; // Target off-screen left
    }
  }

  render(ctx, camera, worldTransform, race, renderProps) {
    if (!renderProps) return;
    const dpr = (window.devicePixelRatio || 1);
    const w = ctx.canvas.width / dpr;
    const h = ctx.canvas.height / dpr;
    const laneHeight = worldTransform.laneHeight;
    
    // Banners are independent of camera transform, so we use a clean context
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform to screen space
    ctx.scale(dpr, dpr);

    for (const [laneIndex, banner] of this.activeBanners.entries()) {
      if (!banner || (!banner.active && banner.opacity <= 0.02)) continue;

      // Animate position and opacity
      banner.x += (banner.targetX - banner.x) * 0.18;
      const targetOpacity = banner.active ? 1 : 0;
      banner.opacity += (targetOpacity - banner.opacity) * 0.15;

      // Garbage collect banners that are fully faded out and off-screen
      if (!banner.active && banner.opacity < 0.02 && Math.abs(banner.x - banner.targetX) < 2) {
        this.activeBanners.delete(laneIndex);
        continue;
      }
      
      const isFinishedByDuration = typeof banner.duration === 'number' && (Date.now() - banner.startTime > banner.duration * 1000);
      if (isFinishedByDuration) {
          this.hideBanner(laneIndex);
      }
      
      this.renderSingleBanner(ctx, banner, w, h, laneHeight, laneIndex, camera, renderProps);
    }
    
    ctx.restore();
  }

  renderSingleBanner(ctx, banner, w, h, laneHeight, laneIndex, camera, renderProps) {
    const racer = banner.racer;
    if (!racer) return;

    const color1 = window.racerColors[racer.colors[0]];
    const color2 = window.racerColors[racer.colors[1]];
    const color3 = window.racerColors[racer.colors[2]];

    // Calculate vertical position based on lane, respecting camera zoom
    const laneY = (laneIndex * laneHeight + laneHeight/2 - (laneHeight * renderProps.numberOfLanes)/2) * camera.zoom + h/2;
    const bannerHeight = laneHeight * camera.zoom;
    const bannerY = laneY - bannerHeight/2;

    const startX = banner.x;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, banner.opacity));

    const nameFontSize = Math.max(12, bannerHeight * 0.45);
    ctx.font = `900 ${nameFontSize}px Orbitron`;
    const nameMetrics = ctx.measureText(banner.text.toUpperCase());
    const nameWidth = nameMetrics.width;

    const numberCircleRadius = bannerHeight * 0.5;
    const nameBarPadding = bannerHeight * 0.4;
    const totalNameBarWidth = nameWidth + nameBarPadding * 2;
    const slant = bannerHeight * 0.4;

    // Use CSS classes for styling
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    // --- Draw Banner Background ---
    ctx.fillStyle = color1;
    ctx.beginPath();
    ctx.moveTo(startX, bannerY);
    ctx.lineTo(startX + totalNameBarWidth + slant, bannerY);
    ctx.lineTo(startX + totalNameBarWidth, bannerY + bannerHeight);
    ctx.lineTo(startX, bannerY + bannerHeight);
    ctx.closePath();
    ctx.fill();

    // --- Draw Number Circle ---
    ctx.beginPath();
    ctx.arc(startX, laneY, numberCircleRadius, Math.PI * 1.5, Math.PI * 0.5);
    ctx.fillStyle = color3;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // --- Draw Text Content ---
    ctx.shadowColor = 'transparent'; // No shadow for text itself
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    
    const textX = startX + nameBarPadding;
    const textY = laneY + bannerHeight * 0.05;

    ctx.strokeText(banner.text.toUpperCase(), textX, textY);
    ctx.fillStyle = '#fff';
    ctx.fillText(banner.text.toUpperCase(), textX, textY);
    
    // --- Draw Racer Number on Circle ---
    const numberFontSize = Math.max(10, bannerHeight * 0.45);
    ctx.font = `700 ${numberFontSize}px Orbitron`;
    ctx.textAlign = 'center';

    ctx.strokeText(String(racer.id), startX, laneY);
    ctx.fillStyle = '#fff';
    ctx.fillText(String(racer.id), startX, laneY);

    ctx.restore();
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