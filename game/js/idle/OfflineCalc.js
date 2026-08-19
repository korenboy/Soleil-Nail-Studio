export class OfflineCalculator {
  constructor(engine) {
    this.engine = engine;
  }

  calculateOfflineRewards(state) {
    const now = Date.now();
    const lastSaved = state.lastSavedTimestamp || now;
    const elapsedMs = now - lastSaved;
    const elapsedMinutes = Math.min(elapsedMs / 60000, 720); // max 12 hours
    
    if (elapsedMinutes < 1) return null; // less than 1 minute, no rewards
    
    const rewards = {
      gold: 0,
      exp: 0,
      elapsedMinutes: Math.floor(elapsedMinutes),
      elapsedHours: (elapsedMinutes / 60).toFixed(1),
      completedExpeditions: []
    };
    
    // Mine earnings
    const mineGold = Math.floor(elapsedMinutes * state.player.mine.ratePerMinute * state.player.mine.level);
    rewards.gold += mineGold;
    
    // Completed expeditions
    for (const exp of state.player.expeditions) {
      if (now - exp.startTime >= exp.duration) {
        rewards.gold += exp.rewards.gold;
        rewards.exp += exp.rewards.exp;
        rewards.completedExpeditions.push(exp);
      }
    }
    
    return rewards;
  }

  showWelcomeBack(rewards) {
    const container = document.getElementById('welcome-back');
    const rewardsDiv = document.getElementById('offline-rewards');
    
    if (!rewards || rewards.gold === 0 && rewards.exp === 0) return;
    
    rewardsDiv.innerHTML = `
      <p class="offline-time">You were away for ${rewards.elapsedHours} hours</p>
      <div class="offline-reward-list">
        ${rewards.gold > 0 ? `<div class="reward-row"><span>💰 Gold</span><span class="text-gold">+${rewards.gold}</span></div>` : ''}
        ${rewards.exp > 0 ? `<div class="reward-row"><span>✨ EXP</span><span class="text-gold">+${rewards.exp}</span></div>` : ''}
        ${rewards.completedExpeditions.length > 0 ? `<div class="reward-row"><span>🗺️ Expeditions</span><span>${rewards.completedExpeditions.length} completed</span></div>` : ''}
      </div>
    `;

    
    container.classList.remove('hidden');
    
    document.getElementById('btn-claim-offline').addEventListener('click', () => {
      // Apply rewards
      const state = this.engine.state;
      state.player.gold += rewards.gold;
      
      // Remove completed expeditions and apply exp
      for (const exp of rewards.completedExpeditions) {
        if (state.player.heroes[exp.heroId]) {
          state.player.heroes[exp.heroId].exp = (state.player.heroes[exp.heroId].exp || 0) + exp.rewards.exp;
        }
      }
      state.player.expeditions = state.player.expeditions.filter(e => {
        return (Date.now() - e.startTime) < e.duration;
      });
      
      state.lastSavedTimestamp = Date.now();
      this.engine.saveState();
      container.classList.add('hidden');
      this.engine.emit('offlineRewardsClaimed', rewards);
    }, { once: true });
  }
}
