/** 
 * OverlayRenderer - Renders UI overlays, countdowns, and lane banners
 */
export class OverlayRenderer {
  constructor(renderManager) {
    this.renderManager = renderManager;
  }

  renderLaneBanners(ctx) {
    const w = ctx.canvas.width / this.renderManager.dpr;
    const h = ctx.canvas.height / this.renderManager.dpr;
    const laneH = this.renderManager.worldTransform.laneHeight;

    if (this.renderManager.interactionController.currentHoveredLane !== this.renderManager.interactionController.previousHoveredLane) {
      this.updateHoverBanners(w, h, laneH);
      this.renderManager.interactionController.previousHoveredLane = this.renderManager.interactionController.currentHoveredLane;
    }

    this.renderBanners(ctx, w, h, laneH);
  }

  updateHoverBanners(w, h, laneH) {
    const currentLane = this.renderManager.interactionController.currentHoveredLane;

    if (currentLane !== null) {
      // Deactivate all non-current lane banners (so only one stays active)
      for (const [laneIndex, banner] of this.renderManager.interactionController.banners.entries()) {
        if (laneIndex !== currentLane) { banner.active = false; banner.targetX = -350; }
      }
      const rid = this.renderManager.currentRace.racers[currentLane];
      const racer = this.renderManager.gameState?.racers[rid];
      if (racer) { this.createHoverBanner(racer, currentLane, w); }
    } else {
      // No hover: send all banners off-screen to the left and fade out
      for (const banner of this.renderManager.interactionController.banners.values()) {
        banner.active = false; banner.targetX = -350;
      }
    }
  }

  createHoverBanner(racer, laneIndex, w) {
    const startX = w + 100;

    if (!this.renderManager.interactionController.banners.has(laneIndex)) {
      this.renderManager.interactionController.banners.set(laneIndex, {
        lane: laneIndex,
        text: this.getRacerNameString(racer),
        x: startX,
        targetX: 20,
        opacity: 0,
        active: true
      });
    } else {
      const banner = this.renderManager.interactionController.banners.get(laneIndex);
      banner.active = true;
      banner.targetX = 20;
      if (banner.x > w + 50 || banner.x < -350) banner.x = startX;
      banner.opacity = Math.max(banner.opacity, 0.1);
    }
  }

  getRacerNameString(racer) {
    if (!racer || !racer.name) return "Unknown Racer";
    const p = window.racerNamePrefixes?.[racer.name[0]];
    const s = window.racerNameSuffixes?.[racer.name[1]];
    const pref = typeof p === 'function' ? (racer._evaluatedPrefix ||= p()) : p;
    const suff = typeof s === 'function' ? (racer._evaluatedSuffix ||= s()) : s;
    return `${pref} ${suff}`;
  }

  renderBanners(ctx, w, h, laneH) {
    for (const [laneIndex, banner] of this.renderManager.interactionController.banners.entries()) {
      if (!banner || (!banner.active && banner.opacity <= 0.02)) continue;

      banner.x += (banner.targetX - banner.x) * 0.18;
      const targetOpacity = banner.active ? 1 : 0;
      banner.opacity += (targetOpacity - banner.opacity) * 0.15;

      if (!banner.active && banner.opacity < 0.02 && Math.abs(banner.x - banner.targetX) < 2) {
        this.renderManager.interactionController.banners.delete(laneIndex);
        continue;
      }

      this.renderSingleBanner(ctx, banner, w, h, laneH, laneIndex);
    }
  }

  renderSingleBanner(ctx, banner, w, h, laneH, laneIndex) {
    const rid = this.renderManager.currentRace.racers[laneIndex];
    const racer = this.renderManager.gameState?.racers[rid];
    if (!racer) return;

    const color1 = window.racerColors[racer.colors[0]];
    const color2 = window.racerColors[racer.colors[1]];
    const color3 = window.racerColors[racer.colors[2]];

    const laneY = (laneIndex * laneH + laneH/2 - (laneH * this.renderManager.renderProps.numberOfLanes)/2) * this.renderManager.camera.zoom + h/2;
    const bannerHeight = laneH * this.renderManager.camera.zoom;
    const bannerY = laneY - bannerHeight/2;
    const startX = banner.x;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, banner.opacity));
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    this.drawBannerBackground(ctx, banner, startX, bannerY, bannerHeight, color1, color2);
    this.drawBannerContent(ctx, banner, startX, laneY, bannerHeight, color3, racer);

    ctx.restore();
  }

  drawBannerBackground(ctx, banner, startX, bannerY, bannerHeight, color1, color2) {
    const nameFontSize = Math.max(12, bannerHeight * 0.55);
    ctx.font = `900 ${nameFontSize}px Orbitron`;
    const nameMetrics = ctx.measureText(banner.text.toUpperCase());
    const nameWidth = nameMetrics.width;

    const numberCircleRadius = bannerHeight * 0.6;
    const nameBarPadding = bannerHeight * 0.5;
    const totalNameBarWidth = nameWidth + nameBarPadding * 2;
    const slant = bannerHeight * 0.3;

    ctx.fillStyle = color1;
    ctx.beginPath();
    ctx.moveTo(startX + numberCircleRadius, bannerY);
    ctx.lineTo(startX + numberCircleRadius + totalNameBarWidth + slant, bannerY);
    ctx.lineTo(startX + numberCircleRadius + totalNameBarWidth, bannerY + bannerHeight);
    ctx.lineTo(startX + numberCircleRadius - slant, bannerY + bannerHeight);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = color2;
    ctx.beginPath();
    const stripeHeight = bannerHeight * 0.15;
    ctx.moveTo(startX + numberCircleRadius - slant, bannerY + bannerHeight - stripeHeight);
    ctx.lineTo(startX + numberCircleRadius + totalNameBarWidth, bannerY + bannerHeight - stripeHeight);
    ctx.lineTo(startX + numberCircleRadius + totalNameBarWidth - slant, bannerY + bannerHeight);
    ctx.lineTo(startX + numberCircleRadius - slant * 2, bannerY + bannerHeight);
    ctx.closePath();
    ctx.fill();
  }

  drawBannerContent(ctx, banner, startX, laneY, bannerHeight, color3, racer) {
    const numberCircleRadius = bannerHeight * 0.6;

    ctx.beginPath();
    ctx.arc(startX + numberCircleRadius, laneY, numberCircleRadius, 0, Math.PI*2);
    ctx.fillStyle = color3;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';

    const nameFontSize = Math.max(12, bannerHeight * 0.55);
    ctx.font = `900 ${nameFontSize}px Orbitron`;
    ctx.textAlign = 'center';
    ctx.strokeText(banner.text.toUpperCase(), startX + numberCircleRadius + (ctx.measureText(banner.text.toUpperCase()).width)/2 + bannerHeight * 0.5, laneY + bannerHeight*0.05);
    ctx.fillStyle = '#fff';
    ctx.fillText(banner.text.toUpperCase(), startX + numberCircleRadius + (ctx.measureText(banner.text.toUpperCase()).width)/2 + bannerHeight * 0.5, laneY + bannerHeight*0.05);

    const numberFontSize = Math.max(10, bannerHeight * 0.45);
    ctx.font = `700 ${numberFontSize}px Orbitron`;
    ctx.strokeText(String(racer.id), startX + numberCircleRadius, laneY);
    ctx.fillStyle = '#fff';
    ctx.fillText(String(racer.id), startX + numberCircleRadius, laneY);
  }

  renderCountdown(ctx) {
    if (!this.renderManager.raceEndCountdown || !this.renderManager.raceEndCountdown.active) return;
    const w = ctx.canvas.width / this.renderManager.dpr;
    const h = ctx.canvas.height / this.renderManager.dpr;
    const timeLeft = Math.max(0, Math.ceil((this.renderManager.raceEndCountdown.endTime - Date.now()) / 1000));

    ctx.save();

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(w/2 - 120, 20, 240, 40);

    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(w/2 - 120, 20, 240, 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Race ends in: ${timeLeft}s`, w/2, 40);

    const totalTime = 30000;
    const elapsed = Date.now() - this.renderManager.raceEndCountdown.startTime;
    const progress = Math.max(0, 1 - (elapsed / totalTime));
    const barWidth = 200;
    const barHeight = 4;
    const barX = w/2 - barWidth/2;
    const barY = 55;

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = progress > 0.3 ? '#44ff44' : '#ff4444';
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    ctx.restore();

    if (timeLeft <= 0) {
      this.renderManager.endRaceEarly();
    }
  }
}