export class CampUI {
  constructor(engine) {
    this.engine = engine;
    this.container = document.getElementById('camp-buildings');
  }

  render() {
    const state = this.engine.state.player;
    const mineGoldPerMin = state.mine.ratePerMinute * state.mine.level;
    const pendingGold = this.calculatePendingMineGold(state.mine);
    
    this.container.innerHTML = `
      <!-- Mine -->
      <div class="building-card" id="building-mine">
        <div class="building-header">
          <span class="building-icon">⛏️</span>
          <div>
            <h3>Ancient Mine</h3>
            <span class="building-level">Level ${state.mine.level}</span>
          </div>
        </div>
        <p class="building-desc">Produces gold automatically over time</p>
        <div class="building-stats">
          <span>💰 ${mineGoldPerMin}/min</span>
          <span class="text-gold">Pending: ${pendingGold} gold</span>
        </div>
        <div class="building-actions">
          <button class="btn-primary btn-small" id="btn-collect-mine" ${pendingGold === 0 ? 'disabled' : ''}>Collect ${pendingGold > 0 ? '💰' : ''}</button>
          <button class="btn-secondary btn-small" id="btn-upgrade-mine">Upgrade (${this.getMineUpgradeCost(state.mine.level)} 💰)</button>
        </div>
      </div>
      
      <!-- Expedition Hall -->
      <div class="building-card" id="building-expeditions">
        <div class="building-header">
          <span class="building-icon">🗺️</span>
          <div>
            <h3>Expedition Hall</h3>
            <span class="building-level">Expeditions: ${state.expeditions.length}/3</span>
          </div>
        </div>
        <p class="building-desc">Send heroes on timed quests for rewards</p>
        <div id="expedition-list">
          ${this.renderExpeditions(state.expeditions)}
        </div>
        <button class="btn-secondary btn-small" id="btn-new-expedition" ${state.expeditions.length >= 3 ? 'disabled' : ''}>Send Expedition</button>
      </div>
      
      <!-- Training Grounds -->
      <div class="building-card" id="building-training">
        <div class="building-header">
          <span class="building-icon">🏋️</span>
          <div>
            <h3>Training Grounds</h3>
          </div>
        </div>
        <p class="building-desc">Train your heroes to gain experience</p>
        <button class="btn-secondary btn-small" id="btn-train" disabled>Coming Soon</button>
      </div>
      
      <!-- Forge -->
      <div class="building-card" id="building-forge">
        <div class="building-header">
          <span class="building-icon">🔨</span>
          <div>
            <h3>Forge</h3>
          </div>
        </div>
        <p class="building-desc">Craft and upgrade equipment</p>
        <button class="btn-secondary btn-small" id="btn-forge" disabled>Coming Soon</button>
      </div>
    `;
    
    // Event listeners
    document.getElementById('btn-collect-mine')?.addEventListener('click', () => this.collectMine());
    document.getElementById('btn-upgrade-mine')?.addEventListener('click', () => this.upgradeMine());
    document.getElementById('btn-new-expedition')?.addEventListener('click', () => this.startExpedition());
  }

  calculatePendingMineGold(mine) {
    const now = Date.now();
    const elapsed = Math.min((now - mine.lastCollected) / 60000, 720); // max 12 hours
    return Math.floor(elapsed * mine.ratePerMinute * mine.level);
  }

  getMineUpgradeCost(level) {
    return Math.floor(200 * Math.pow(1.5, level - 1));
  }

  collectMine() {
    const state = this.engine.state.player;
    const pending = this.calculatePendingMineGold(state.mine);
    if (pending > 0) {
      state.gold += pending;
      state.mine.lastCollected = Date.now();
      this.engine.saveState();
      this.engine.emit('goldEarned', { amount: pending, source: 'mine' });
      this.render();
      // Show toast
      this.showToast(`Collected ${pending} gold! ⛏️💰`);
    }
  }

  upgradeMine() {
    const state = this.engine.state.player;
    const cost = this.getMineUpgradeCost(state.mine.level);
    if (state.gold >= cost) {
      state.gold -= cost;
      state.mine.level++;
      this.engine.saveState();
      this.engine.emit('mineUpgraded', { newLevel: state.mine.level });
      this.render();
      this.showToast(`Mine upgraded to level ${state.mine.level}! ⛏️⬆️`);
    } else {
      this.showToast('Not enough gold! 💰', true);
    }
  }

  renderExpeditions(expeditions) {
    if (expeditions.length === 0) return '<p class="empty-state">No active expeditions</p>';
    return expeditions.map((exp, i) => {
      const elapsed = Date.now() - exp.startTime;
      const remaining = Math.max(0, exp.duration - elapsed);
      const done = remaining === 0;
      const hours = Math.floor(remaining / 3600000);
      const mins = Math.floor((remaining % 3600000) / 60000);
      return `
        <div class="expedition-card">
          <span>${exp.heroId} — ${done ? '✅ Complete!' : `⏰ ${hours}h ${mins}m`}</span>
          ${done ? `<button class="btn-primary btn-tiny" onclick="window._claimExpedition(${i})">Claim</button>` : ''}
        </div>
      `;
    }).join('');
  }

  startExpedition() {
    // Show expedition selection modal
    const modal = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    const state = this.engine.state.player;
    const activeTeam = new Set(state.currentTeam);
    const activeExpeditions = new Set(state.expeditions.map(e => e.heroId));
    
    const availableHeroes = Object.entries(state.heroes)
      .filter(([id, h]) => h.unlocked && !activeTeam.has(id) && !activeExpeditions.has(id))
      .map(([id]) => id);
    
    if (availableHeroes.length === 0) {
      this.showToast('No available heroes for expedition!', true);
      return;
    }
    
    const durations = [
      { label: '1 Hour', ms: 3600000, rewards: { gold: 100, exp: 50 } },
      { label: '4 Hours', ms: 14400000, rewards: { gold: 500, exp: 200 } },
      { label: '8 Hours', ms: 28800000, rewards: { gold: 1200, exp: 500 } }
    ];
    
    content.innerHTML = `
      <div class="expedition-modal">
        <h3>🗺️ New Expedition</h3>
        <div class="expedition-heroes">
          <p>Select Hero:</p>
          ${availableHeroes.map(id => `<button class="btn-secondary btn-small hero-select-btn" data-hero="${id}">${id}</button>`).join('')}
        </div>
        <div class="expedition-durations" style="display:none">
          <p>Select Duration:</p>
          ${durations.map((d, i) => `<button class="btn-secondary btn-small duration-btn" data-index="${i}">${d.label} (💰${d.rewards.gold})</button>`).join('')}
        </div>
        <button class="btn-secondary btn-small" id="btn-cancel-expedition">Cancel</button>
      </div>
    `;
    
    modal.classList.remove('hidden');
    
    let selectedHero = null;
    
    content.querySelectorAll('.hero-select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedHero = btn.dataset.hero;
        content.querySelector('.expedition-durations').style.display = 'block';
        content.querySelectorAll('.hero-select-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });
    
    content.querySelectorAll('.duration-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!selectedHero) return;
        const dur = durations[parseInt(btn.dataset.index)];
        state.expeditions.push({
          heroId: selectedHero,
          startTime: Date.now(),
          duration: dur.ms,
          rewards: dur.rewards
        });
        this.engine.saveState();
        modal.classList.add('hidden');
        this.render();
        this.showToast(`${selectedHero} sent on expedition! 🗺️`);
      });
    });
    
    document.getElementById('btn-cancel-expedition').addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'toast-error' : 'toast-success'}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('toast-show'), 10);
    setTimeout(() => { toast.classList.remove('toast-show'); setTimeout(() => toast.remove(), 300); }, 2000);
  }
}
