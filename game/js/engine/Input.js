export class Input {
  constructor(engine) {
    this.engine = engine;
    this.canvas = null;
    this.touching = false;
    this.startPos = null;
    this.currentPos = null;
    this.dragThreshold = 15;
    this.enabled = true;
  }

  init() {
    this.canvas = this.engine.canvas;
    
    this.canvas.addEventListener('touchstart', (e) => this.onStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.onMove(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.onEnd(e));
    
    this.canvas.addEventListener('mousedown', (e) => this.onStart(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onEnd(e));
    this.canvas.addEventListener('mouseleave', (e) => this.onEnd(e));
  }

  getPosition(e) {
    const rect = this.canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  onStart(e) {
    if (e.cancelable) e.preventDefault();
    if (!this.enabled) return;
    
    this.touching = true;
    this.startPos = this.getPosition(e);
    this.currentPos = { ...this.startPos };
    
    this.engine.emit('inputStart', this.startPos);
  }

  onMove(e) {
    if (e.cancelable) e.preventDefault();
    if (!this.touching || !this.enabled) return;
    
    this.currentPos = this.getPosition(e);
    
    const dx = this.currentPos.x - this.startPos.x;
    const dy = this.currentPos.y - this.startPos.y;
    
    if (Math.abs(dx) > this.dragThreshold || Math.abs(dy) > this.dragThreshold) {
      let direction = '';
      if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? 'right' : 'left';
      } else {
        direction = dy > 0 ? 'down' : 'up';
      }
      
      this.engine.emit('inputDrag', { start: this.startPos, current: this.currentPos, direction });
      this.touching = false; // Prevent multiple drags from single swipe
    }
  }

  onEnd(e) {
    if (e.cancelable) e.preventDefault();
    if (!this.touching) return;
    
    const endPos = this.getPosition(e);
    this.engine.emit('inputEnd', endPos);
    
    this.touching = false;
    this.startPos = null;
    this.currentPos = null;
  }

  screenToGrid(x, y, boardConfig) {
    const col = Math.floor((x - boardConfig.offsetX) / boardConfig.tileSize);
    const row = Math.floor((y - boardConfig.offsetY) / boardConfig.tileSize);
    if (col >= 0 && col < boardConfig.gridSize && row >= 0 && row < boardConfig.gridSize) {
      return { row, col };
    }
    return null;
  }
}
