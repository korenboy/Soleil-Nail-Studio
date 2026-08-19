import { TILE_TYPES, TILE_COLORS, TILE_SPECIALS } from '../puzzle/Tile.js';

export class Renderer {
  constructor(engine) {
    this.engine = engine;
    this.ctx = null;
    this.shakeAmount = 0;
    this.shakeDecay = 0.9;
    this.shakeOffset = { x: 0, y: 0 };
  }

  init() {
    this.ctx = this.engine.ctx;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.engine.width, this.engine.height);
  }

  drawRoundedRect(x, y, w, h, radius, fill, stroke, shadow) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
    
    if (shadow) {
      ctx.shadowColor = shadow.color || 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = shadow.blur || 5;
      ctx.shadowOffsetY = shadow.offsetY || 0;
    } else {
      ctx.shadowColor = 'transparent';
    }

    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    
    ctx.shadowColor = 'transparent'; // reset shadow for stroke

    if (stroke) {
      ctx.lineWidth = stroke.width || 1;
      ctx.strokeStyle = stroke.color || '#fff';
      ctx.stroke();
    }
  }

  drawCircle(x, y, radius, fill, glow) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    if (glow) {
      ctx.shadowColor = glow.color;
      ctx.shadowBlur = glow.blur;
    }
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.shadowColor = 'transparent';
  }

  drawTile(x, y, size, type, special, alpha, scale) {
    const ctx = this.ctx;
    const colors = TILE_COLORS[type];
    if (!colors) return;
    
    const s = size * scale;
    const padding = s * 0.05;
    const ts = s - padding * 2;
    const tx = x - ts / 2;
    const ty = y - ts / 2;
    const radius = ts * 0.25;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Background Gradient
    const gradient = ctx.createLinearGradient(tx, ty, tx, ty + ts);
    gradient.addColorStop(0, colors.main);
    gradient.addColorStop(1, colors.dark);

    // Tile Body
    this.drawRoundedRect(tx, ty, ts, ts, radius, gradient, null, { color: 'rgba(0,0,0,0.4)', blur: 4, offsetY: 2 });
    
    // Inner Glow (simulated with a slightly smaller border)
    this.drawRoundedRect(tx + 2, ty + 2, ts - 4, ts - 4, radius - 1, null, { color: 'rgba(255,255,255,0.2)', width: 1 });

    // Symbol Drawing
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;

    const iconSize = ts * 0.45;

    switch (type) {
      case TILE_TYPES.FIRE:
        ctx.beginPath();
        ctx.moveTo(0, -iconSize);
        ctx.quadraticCurveTo(iconSize, 0, iconSize, iconSize * 0.5);
        ctx.arc(0, iconSize * 0.5, iconSize, 0, Math.PI);
        ctx.quadraticCurveTo(-iconSize, 0, 0, -iconSize);
        ctx.fill();
        break;
      case TILE_TYPES.WATER:
        ctx.beginPath();
        ctx.moveTo(0, -iconSize);
        ctx.quadraticCurveTo(iconSize * 0.8, 0, iconSize * 0.8, iconSize * 0.4);
        ctx.arc(0, iconSize * 0.4, iconSize * 0.8, 0, Math.PI);
        ctx.quadraticCurveTo(-iconSize * 0.8, 0, 0, -iconSize);
        ctx.fill();
        break;
      case TILE_TYPES.NATURE:
        ctx.beginPath();
        ctx.moveTo(0, -iconSize);
        ctx.quadraticCurveTo(iconSize, -iconSize * 0.5, iconSize * 0.5, iconSize);
        ctx.quadraticCurveTo(-iconSize, iconSize * 0.5, 0, -iconSize);
        ctx.fill();
        // Vein
        ctx.shadowBlur = 0;
        ctx.strokeStyle = colors.dark;
        ctx.beginPath();
        ctx.moveTo(0, -iconSize * 0.6);
        ctx.lineTo(0, iconSize * 0.8);
        ctx.stroke();
        break;
      case TILE_TYPES.LIGHT:
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          const r = i % 2 === 0 ? iconSize : iconSize * 0.4;
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        break;
      case TILE_TYPES.DARK:
        ctx.beginPath();
        ctx.arc(0, 0, iconSize, -Math.PI/2, Math.PI * 1.5);
        ctx.arc(iconSize*0.3, -iconSize*0.3, iconSize*0.8, Math.PI * 1.5, -Math.PI/2, true);
        ctx.closePath();
        ctx.fill();
        break;
      case TILE_TYPES.SKULL:
        ctx.beginPath();
        ctx.arc(0, -iconSize*0.2, iconSize*0.8, 0, Math.PI*2);
        ctx.fillRect(-iconSize*0.4, iconSize*0.2, iconSize*0.8, iconSize*0.6);
        ctx.fill();
        // Eyes
        ctx.shadowBlur = 0;
        ctx.fillStyle = colors.dark;
        ctx.beginPath(); ctx.arc(-iconSize*0.3, -iconSize*0.2, iconSize*0.25, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(iconSize*0.3, -iconSize*0.2, iconSize*0.25, 0, Math.PI*2); ctx.fill();
        // Nose
        ctx.beginPath(); ctx.moveTo(0, iconSize*0.1); ctx.lineTo(-iconSize*0.1, iconSize*0.3); ctx.lineTo(iconSize*0.1, iconSize*0.3); ctx.fill();
        break;
    }

    ctx.restore();

    // Specials overlay
    if (special === TILE_SPECIALS.EXPLOSIVE) {
      this.drawExplosiveIndicator(x, y, ts);
    } else if (special === TILE_SPECIALS.ELEMENTAL) {
      this.drawElementalIndicator(x, y, ts, radius);
    }
  }

  drawExplosiveIndicator(x, y, size) {
    const ctx = this.ctx;
    ctx.save();
    const t = Date.now() / 200;
    const pulse = 1 + Math.sin(t) * 0.1;
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 10;
    
    const s = size * 0.3;
    ctx.beginPath();
    ctx.moveTo(-s, 0); ctx.lineTo(s, 0);
    ctx.moveTo(0, -s); ctx.lineTo(0, s);
    ctx.stroke();
    
    ctx.restore();
  }

  drawElementalIndicator(x, y, size, radius) {
    const ctx = this.ctx;
    ctx.save();
    const t = Date.now() / 500;
    ctx.translate(x, y);
    ctx.rotate(t);
    
    const gradient = ctx.createConicGradient(0, 0, 0);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(0.2, '#ffff00');
    gradient.addColorStop(0.4, '#00ff00');
    gradient.addColorStop(0.6, '#00ffff');
    gradient.addColorStop(0.8, '#0000ff');
    gradient.addColorStop(1, '#ff0000');
    
    const r = size / 2 + 2;
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4;
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    ctx.roundRect(-r, -r, r * 2, r * 2, radius);
    ctx.stroke();
    
    ctx.restore();
  }

  applyScreenShake() {
    if (this.shakeAmount > 0.5) {
      this.shakeOffset.x = (Math.random() - 0.5) * this.shakeAmount;
      this.shakeOffset.y = (Math.random() - 0.5) * this.shakeAmount;
      this.ctx.translate(this.shakeOffset.x, this.shakeOffset.y);
    } else {
      this.shakeOffset = { x: 0, y: 0 };
    }
  }

  triggerScreenShake(amount) {
    this.shakeAmount = amount;
  }

  drawText(text, x, y, { font = '20px sans-serif', color = '#fff', align = 'center', shadow = null, glow = null } = {}) {
    const ctx = this.ctx;
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    
    if (shadow) {
      ctx.shadowColor = shadow.color || '#000';
      ctx.shadowBlur = shadow.blur || 4;
      ctx.shadowOffsetX = shadow.offsetX || 2;
      ctx.shadowOffsetY = shadow.offsetY || 2;
    } else if (glow) {
      ctx.shadowColor = glow;
      ctx.shadowBlur = 10;
    } else {
      ctx.shadowColor = 'transparent';
    }
    
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.shadowColor = 'transparent';
  }

  update(dt) {
    if (this.shakeAmount > 0) {
      this.shakeAmount *= this.shakeDecay;
      if (this.shakeAmount < 0.1) this.shakeAmount = 0;
    }
  }
}
