export class Audio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.initialized = false;
  }

  init() {
    const initAudio = () => {
      if (!this.initialized) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.initialized = true;
      }
    };
    
    document.addEventListener('pointerdown', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });
  }

  playTone(frequency, duration, type = 'sine', volume = 0.3) {
    if (!this.ctx || !this.enabled) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playMatch() {
    if (!this.enabled) return;
    this.playTone(440, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(554, 0.1, 'sine', 0.2), 50);
    setTimeout(() => this.playTone(659, 0.2, 'sine', 0.2), 100);
  }

  playCombo(level) {
    if (!this.enabled) return;
    const baseFreq = 440 + (level * 50);
    this.playTone(baseFreq, 0.1, 'triangle', 0.3);
    setTimeout(() => this.playTone(baseFreq * 1.25, 0.1, 'triangle', 0.3), 60);
    setTimeout(() => this.playTone(baseFreq * 1.5, 0.2, 'triangle', 0.3), 120);
  }

  playSwap() {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    
    osc.frequency.setValueAtTime(500, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playExplosion() {
    if (!this.ctx || !this.enabled) return;
    const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.5);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    noise.start();
  }

  playHeroSkill() {
    if (!this.enabled) return;
    this.playTone(200, 0.4, 'sawtooth', 0.3);
    setTimeout(() => this.playTone(400, 0.4, 'square', 0.2), 100);
    this.playExplosion();
  }

  playVictory() {
    if (!this.enabled) return;
    [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 'square', 0.2), i * 150);
    });
  }

  playDefeat() {
    if (!this.enabled) return;
    [329.63, 261.63, 220.00, 174.61].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.4, 'sawtooth', 0.3), i * 300);
    });
  }

  playButtonClick() {
    this.playTone(800, 0.05, 'square', 0.1);
  }

  playGoldCollect() {
    if (!this.enabled) return;
    this.playTone(1200, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(1600, 0.2, 'sine', 0.2), 80);
  }

  playLevelUp() {
    if (!this.enabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.5);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.8);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.8);
    setTimeout(() => this.playVictory(), 500);
  }
}

export const audio = new Audio();
