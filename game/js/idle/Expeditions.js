export class Expeditions {
  constructor(engine) {
    this.engine = engine;
  }

  getAvailableDurations() {
    return [
      { label: '1 Hour', duration: 3600000, rewards: { gold: 100, exp: 50 } },
      { label: '4 Hours', duration: 14400000, rewards: { gold: 500, exp: 200 } },
      { label: '8 Hours', duration: 28800000, rewards: { gold: 1200, exp: 500 } }
    ];
  }

  startExpedition(state, heroId, durationIndex) {
    if (state.expeditions.length >= 3) return false;
    const dur = this.getAvailableDurations()[durationIndex];
    state.expeditions.push({
      heroId,
      startTime: Date.now(),
      duration: dur.duration,
      rewards: { ...dur.rewards }
    });
    return true;
  }

  checkCompleted(state) {
    const completed = [];
    const now = Date.now();
    state.expeditions = state.expeditions.filter(exp => {
      if (now - exp.startTime >= exp.duration) {
        completed.push(exp);
        return false;
      }
      return true;
    });
    return completed;
  }

  claimRewards(state, expedition) {
    state.gold += expedition.rewards.gold;
    if (state.heroes[expedition.heroId]) {
      state.heroes[expedition.heroId].exp = (state.heroes[expedition.heroId].exp || 0) + expedition.rewards.exp;
    }
  }
}
