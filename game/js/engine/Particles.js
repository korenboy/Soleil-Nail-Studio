export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { 
        this.particles.splice(i, 1); 
        continue; 
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt * 60; // scale gravity
      p.alpha = Math.max(0, p.life / p.maxLife);
      p.size *= p.decay;
    }
  }

  render(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      
      if (p.glow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.glow;
      }

      if (p.text) {
        ctx.font = `bold ${p.fontSize * p.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillText(p.text, p.x, p.y);
      } else if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'star') {
        this.drawStar(ctx, p.x, p.y, Math.max(0.1, p.size));
      } else if (p.shape === 'square') {
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
      }
      
      ctx.restore();
    }
  }

  drawStar(ctx, x, y, size) {
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      ctx.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
      const innerAngle = angle + Math.PI / 4;
      ctx.lineTo(x + Math.cos(innerAngle) * (size * 0.2), y + Math.sin(innerAngle) * (size * 0.2));
    }
    ctx.closePath();
    ctx.fill();
  }

  emitMatchBurst(x, y, color) {
    const count = 15 + Math.floor(Math.random() * 10);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 200;
      this.spawn({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 6,
        color,
        life: 0.5 + Math.random() * 0.5,
        decay: 0.95,
        glow: 10,
        shape: Math.random() > 0.5 ? 'circle' : 'star'
      });
    }
  }

  emitComboBurst(x, y, comboLevel) {
    const count = Math.min(40, 20 + comboLevel * 5);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 150 + Math.random() * 300;
      this.spawn({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 6 + Math.random() * 8,
        color: '#ffd700',
        life: 0.8 + Math.random() * 0.5,
        decay: 0.96,
        gravity: 5,
        glow: 15,
        shape: 'star'
      });
    }
  }

  emitExplosion(x, y, color) {
    // Center burst
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 200 + Math.random() * 400;
      this.spawn({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 8 + Math.random() * 12,
        color,
        life: 0.4 + Math.random() * 0.4,
        decay: 0.92,
        glow: 20
      });
    }
  }

  emitSkillActivation(x, y, color) {
    for (let i = 0; i < 20; i++) {
      this.spawn({
        x: x + (Math.random() - 0.5) * 100,
        y: y + (Math.random() - 0.5) * 50,
        vx: (Math.random() - 0.5) * 50,
        vy: -200 - Math.random() * 200,
        size: 5 + Math.random() * 10,
        color,
        life: 1 + Math.random(),
        decay: 0.98,
        gravity: -2,
        glow: 15
      });
    }
  }

  emitGoldCollect(x, y) {
    for (let i = 0; i < 5; i++) {
      this.spawn({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 30,
        vy: -100 - Math.random() * 100,
        size: 8 + Math.random() * 4,
        color: '#ffd700',
        life: 1,
        decay: 0.99,
        gravity: 2,
        shape: 'star',
        glow: 10
      });
    }
  }

  emitDamageNumber(x, y, damage, isCrit = false) {
    this.spawn({
      x,
      y,
      vx: (Math.random() - 0.5) * 50,
      vy: -150 - Math.random() * 50,
      size: 1,
      color: isCrit ? '#ffcc00' : '#ffffff',
      life: 1.2,
      decay: 0.99,
      gravity: 5,
      text: damage.toString(),
      fontSize: isCrit ? 36 : 24,
      glow: 5
    });
  }

  spawn(config) {
    this.particles.push({
      x: config.x || 0,
      y: config.y || 0,
      vx: config.vx || 0,
      vy: config.vy || 0,
      size: config.size || 4,
      color: config.color || '#fff',
      alpha: 1,
      life: config.life || 1,
      maxLife: config.life || 1,
      gravity: config.gravity || 0,
      decay: config.decay || 0.98,
      glow: config.glow || 0,
      shape: config.shape || 'circle',
      text: config.text || null,
      fontSize: config.fontSize || 16
    });
  }
}
