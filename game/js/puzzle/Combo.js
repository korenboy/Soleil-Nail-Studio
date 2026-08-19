export class Combo {
  constructor(engine) {
    this.engine = engine;
    this.count = 0;
    this.maxCombo = 0;
    this.displayTimer = 0;
    this.showing = false;
    this.multiplier = 1;
  }

  increment() {
    this.count++;
    this.maxCombo = Math.max(this.maxCombo, this.count);
    this.multiplier = 1 + (this.count - 1) * 0.25;
    this.displayTimer = 2;
    this.showing = true;
    
    this.engine.emit('comboTriggered', { count: this.count, multiplier: this.multiplier });
    
    // Attempt DOM update if UI is set up
    const display = document.getElementById('combo-display');
    const countEl = document.getElementById('combo-count');
    if (display && countEl) {
      display.classList.remove('hidden');
      display.style.opacity = '1';
      countEl.textContent = this.count + 'x';
      
      // Retrigger CSS animation
      display.style.animation = 'none';
      void display.offsetWidth; // Trigger reflow
      display.style.animation = 'comboFlash 0.5s ease-out';
    }
  }

  reset() {
    const result = { count: this.count, maxCombo: this.maxCombo, multiplier: this.multiplier };
    this.count = 0;
    this.multiplier = 1;
    this.maxCombo = 0;
    return result;
  }

  update(dt) {
    if (this.showing) {
      this.displayTimer -= dt;
      if (this.displayTimer <= 0) {
        this.showing = false;
        const display = document.getElementById('combo-display');
        if (display) {
          display.style.opacity = '0';
          setTimeout(() => {
            if (!this.showing) display.classList.add('hidden');
          }, 300);
        }
      }
    }
  }
}
