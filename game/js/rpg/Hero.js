import { HERO_DATA } from '../data/heroes.js';
import { getElementColor } from './Elements.js';

export class Hero {
  constructor(heroId, savedData = {}) {
    const data = HERO_DATA[heroId];
    if (!data) throw new Error(`Unknown hero: ${heroId}`);
    
    this.id = heroId;
    this.name = data.name;
    this.title = data.title;
    this.element = data.element;
    this.baseStats = { ...data.baseStats };
    this.skill = { ...data.skill };
    this.portraitColors = data.portraitColors;
    
    this.level = savedData.level || 1;
    this.exp = savedData.exp || 0;
    this.equipment = savedData.equipment || { weapon: null, armor: null, accessory: null };
    
    // Battle state (reset each battle)
    this.currentHp = 0;
    this.maxHp = 0;
    this.currentMana = 0;
    this.maxMana = 100;
    this.alive = true;
    
    this.recalculateStats();
  }
  
  recalculateStats() {
    // Level scaling: each level adds ~8% to all stats
    const levelMul = 1 + (this.level - 1) * 0.08;
    this.maxHp = Math.floor(this.baseStats.hp * levelMul);
    this.atk = Math.floor(this.baseStats.atk * levelMul);
    this.def = Math.floor(this.baseStats.def * levelMul);
    this.spd = Math.floor(this.baseStats.spd * levelMul);
    // TODO: add equipment bonuses
    this.currentHp = this.maxHp;
    this.currentMana = 0;
  }
  
  initBattle() {
    this.currentHp = this.maxHp;
    this.currentMana = 0;
    this.alive = true;
  }
  
  takeDamage(amount) {
    const reduced = Math.max(1, amount - this.def * 0.3);
    this.currentHp = Math.max(0, Math.floor(this.currentHp - reduced));
    if (this.currentHp <= 0) this.alive = false;
    return Math.floor(reduced);
  }
  
  heal(amount) {
    this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
  }
  
  addMana(amount) {
    this.currentMana = Math.min(this.maxMana, this.currentMana + amount);
  }
  
  canUseSkill() {
    return this.alive && this.currentMana >= this.skill.manaCost;
  }
  
  useSkill() {
    if (!this.canUseSkill()) return null;
    this.currentMana -= this.skill.manaCost;
    return this.skill;
  }
  
  addExp(amount) {
    this.exp += amount;
    const expNeeded = this.getExpToLevel();
    let leveled = false;
    while (this.exp >= expNeeded && this.level < 50) {
      this.exp -= expNeeded;
      this.level++;
      this.recalculateStats();
      leveled = true;
    }
    return leveled;
  }
  
  getExpToLevel() {
    return Math.floor(100 * Math.pow(1.15, this.level - 1));
  }
  
  getColor() {
    return getElementColor(this.element);
  }
  
  getHpPercent() { return this.currentHp / this.maxHp; }
  getManaPercent() { return this.currentMana / this.maxMana; }
}
