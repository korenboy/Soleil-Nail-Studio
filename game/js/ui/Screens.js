export class ScreenManager {
  constructor(engine) {
    this.engine = engine;
    this.currentScreen = 'title-screen';
    this.previousScreen = null;
    this.screens = ['title-screen', 'map-screen', 'battle-screen', 'camp-screen', 'heroes-screen'];
  }

  init() {
    // Set up nav button listeners
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.screen;
        if (target) this.showScreen(target);
      });
    });
    
    // Update nav active state
    this.updateNavButtons();
  }

  showScreen(screenId) {
    if (this.currentScreen === screenId) return;
    this.previousScreen = this.currentScreen;
    
    // Hide all screens
    this.screens.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });
    
    // Show target
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
    
    this.currentScreen = screenId;
    this.updateNavButtons();
    this.engine.emit('screenChange', { screen: screenId, previous: this.previousScreen });
    
    // Update resource displays
    this.updateResourceDisplays();
  }

  updateNavButtons() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.screen === this.currentScreen);
    });
  }

  updateResourceDisplays() {
    const gold = this.engine.state?.player?.gold || 0;
    const level = this.engine.state?.player?.level || 1;
    const formatted = gold >= 1000 ? (gold / 1000).toFixed(1) + 'K' : gold;
    
    ['gold-display', 'camp-gold-display', 'heroes-gold-display'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = `💰 ${formatted}`;
    });
    
    const levelEl = document.getElementById('level-display');
    if (levelEl) levelEl.textContent = `⭐ Lv.${level}`;
  }

  goBack() {
    if (this.previousScreen) this.showScreen(this.previousScreen);
  }
}
