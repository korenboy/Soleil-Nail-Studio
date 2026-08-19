export class Mine {
  constructor(engine) {
    this.engine = engine;
  }

  getProduction(mine) {
    return mine.ratePerMinute * mine.level;
  }

  getPending(mine) {
    const elapsed = Math.min((Date.now() - mine.lastCollected) / 60000, 720);
    return Math.floor(elapsed * this.getProduction(mine));
  }

  collect(mine) {
    const gold = this.getPending(mine);
    mine.lastCollected = Date.now();
    return gold;
  }

  getUpgradeCost(level) {
    return Math.floor(200 * Math.pow(1.5, level - 1));
  }

  upgrade(state) {
    const cost = this.getUpgradeCost(state.mine.level);
    if (state.gold >= cost) {
      state.gold -= cost;
      state.mine.level++;
      return true;
    }
    return false;
  }
}
