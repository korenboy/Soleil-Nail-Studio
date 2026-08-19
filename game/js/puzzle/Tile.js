export const TILE_TYPES = {
  FIRE: 'fire',
  WATER: 'water',
  NATURE: 'nature',
  LIGHT: 'light',
  DARK: 'dark',
  SKULL: 'skull'
};

export const TILE_COLORS = {
  fire: { main: '#ff4444', glow: '#ff6b6b', dark: '#cc2222' },
  water: { main: '#4488ff', glow: '#66aaff', dark: '#2266cc' },
  nature: { main: '#44cc44', glow: '#66ee66', dark: '#228822' },
  light: { main: '#ffcc00', glow: '#ffdd44', dark: '#cc9900' },
  dark: { main: '#9944ff', glow: '#bb66ff', dark: '#6622cc' },
  skull: { main: '#cccccc', glow: '#ffffff', dark: '#888888' }
};

export const TILE_SPECIALS = {
  NONE: 'none',
  EXPLOSIVE: 'explosive',
  ELEMENTAL: 'elemental'
};

export const ALL_TYPES = Object.values(TILE_TYPES);

export class Tile {
  constructor(type, row, col) {
    this.type = type;
    this.special = TILE_SPECIALS.NONE;
    this.row = row;
    this.col = col;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.alpha = 1;
    this.scale = 1;
    this.matched = false;
    this.falling = false;
    this.animating = false;
  }

  getColors() { 
    return TILE_COLORS[this.type]; 
  }

  update(dt) {
    const speed = 15;
    
    if (this.x !== this.targetX || this.y !== this.targetY) {
      this.x += (this.targetX - this.x) * speed * dt;
      this.y += (this.targetY - this.y) * speed * dt;
      
      if (Math.abs(this.x - this.targetX) < 1) this.x = this.targetX;
      if (Math.abs(this.y - this.targetY) < 1) this.y = this.targetY;
      
      this.animating = (this.x !== this.targetX || this.y !== this.targetY);
    } else {
      this.animating = false;
    }
  }

  setTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
    this.animating = true;
  }

  setPosition(x, y) {
    this.x = x; 
    this.y = y;
    this.targetX = x; 
    this.targetY = y;
    this.animating = false;
  }

  static random(row, col) {
    const types = ALL_TYPES;
    return new Tile(types[Math.floor(Math.random() * types.length)], row, col);
  }
}
