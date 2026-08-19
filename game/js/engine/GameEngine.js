export class GameEngine {
  constructor() {
    this.state = null;
    this.canvas = null;
    this.ctx = null;
    this.listeners = {};
    this.lastTime = 0;
    this.deltaTime = 0;
    this.running = false;
    this.currentScreen = 'title';
    this.systems = [];
    this.width = 0;
    this.height = 0;
  }

  init() {
    this.canvas = document.getElementById('gameCanvas');
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'gameCanvas';
      document.body.appendChild(this.canvas);
    }
    this.ctx = this.canvas.getContext('2d');
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    this.loadState();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    this.ctx.scale(dpr, dpr);
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  loadState() {
    const saved = localStorage.getItem('runequest_save');
    if (saved) {
      try {
        this.state = JSON.parse(saved);
      } catch (e) {
        this.state = this.getDefaultState();
      }
    } else {
      this.state = this.getDefaultState();
    }
  }

  saveState() {
    this.state.lastSavedTimestamp = Date.now();
    localStorage.setItem('runequest_save', JSON.stringify(this.state));
  }

  getDefaultState() {
    return {
      player: {
        gold: 500,
        gems: 10,
        level: 1,
        exp: 0,
        expToNext: 100,
        heroes: {
          warrior: { unlocked: true, level: 1, exp: 0, equipment: { weapon: null, armor: null, accessory: null } },
          mage: { unlocked: true, level: 1, exp: 0, equipment: { weapon: null, armor: null, accessory: null } },
          healer: { unlocked: true, level: 1, exp: 0, equipment: { weapon: null, armor: null, accessory: null } },
          ranger: { unlocked: false, level: 1, exp: 0, equipment: {} },
          paladin: { unlocked: false, level: 1, exp: 0, equipment: {} },
          assassin: { unlocked: false, level: 1, exp: 0, equipment: {} }
        },
        ownedEquipment: [],
        currentTeam: ['warrior', 'mage', 'healer'],
        stagesCompleted: {},
        mine: { level: 1, lastCollected: Date.now(), ratePerMinute: 5 },
        expeditions: [],
        tutorialCompleted: false,
        currentQuestId: 'quest_1',
        completedQuests: []
      },
      settings: { sound: true, music: true, vibration: true },
      lastSavedTimestamp: Date.now()
    };
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop() {
    this.running = false;
  }

  loop(timestamp) {
    if (!this.running) return;
    this.deltaTime = (timestamp - this.lastTime) / 1000;
    // Cap delta time to prevent huge jumps on tab resume
    if (this.deltaTime > 0.1) this.deltaTime = 0.1;
    this.lastTime = timestamp;
    
    this.update(this.deltaTime);
    this.render();
    
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    for (const system of this.systems) {
      if (system.update) system.update(dt);
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    for (const system of this.systems) {
      if (system.render) system.render(this.ctx);
    }
  }

  addSystem(system) {
    this.systems.push(system);
  }
}

export const engine = new GameEngine();
