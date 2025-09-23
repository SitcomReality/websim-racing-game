class ParticleSystem {
  constructor() {
    this.particles = [];
    this.maxParticles = 100;
  }

  createParticle(x, y, vx, vy, color, life) {
    return {
      x, y, vx, vy,
      color: color || 'rgba(255,255,255,0.8)',
      life: life || 1.0,
      maxLife: life || 1.0,
      size: 2 + Math.random() * 3
    };
  }

  emit(x, y, angle, speed, count = 3, color = null, opts = {}) {
    const spread = opts.spread ?? 1.2, fboost = opts.forwardBoost ?? 0.6;
    for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
      const particleAngle = angle + (Math.random() - 0.5) * spread;
      const dirWeight = (1 + Math.cos(particleAngle)) * 0.5;
      const rand = 0.6 + Math.random() * 0.6;
      const boost = 1 + fboost * dirWeight;
      const s = speed * rand * boost;
      const vx = Math.cos(particleAngle) * s;
      const vy = Math.sin(particleAngle) * s;
      const life = 0.6 + Math.random() * 0.6;
      this.particles.push(this.createParticle(x, y, vx, vy, color, life));
    }
  }

  update(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life -= deltaTime;
      p.vy += 50 * deltaTime;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    ctx.save();
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

window.ParticleSystem = ParticleSystem;