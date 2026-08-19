import { ENEMY_DATA } from '../data/enemies.js';

export class Enemy {
  constructor(enemyId, levelScale = 1) {
    const data = ENEMY_DATA[enemyId];
    this.id = enemyId;
    this.name = data.name;
    this.element = data.element;
    this.color = data.color;
    this.isBoss = data.isBoss || false;
    
    // Scale stats to level
    this.maxHp = Math.floor(data.hp * levelScale);
    this.currentHp = this.maxHp;
    this.atk = Math.floor(data.atk * levelScale);
    this.def = Math.floor(data.def * levelScale);
    
    // Attack pattern: array of turns until each attack
    this.attackPattern = [...data.attackPattern];
    this.currentTurnIndex = 0;
    this.turnsUntilAttack = this.attackPattern[0];
    
    this.rewards = {
      gold: Math.floor(data.rewards.gold * levelScale),
      exp: Math.floor(data.rewards.exp * levelScale)
    };
    
    this.alive = true;
    this.portraitSymbol = data.portraitSymbol;
  }
  
  takeDamage(amount) {
    const reduced = Math.max(1, amount - this.def * 0.2);
    this.currentHp = Math.max(0, Math.floor(this.currentHp - reduced));
    if (this.currentHp <= 0) this.alive = false;
    return Math.floor(reduced);
  }
  
  advanceTurn() {
    this.turnsUntilAttack--;
    if (this.turnsUntilAttack <= 0) {
      this.currentTurnIndex = (this.currentTurnIndex + 1) % this.attackPattern.length;
      this.turnsUntilAttack = this.attackPattern[this.currentTurnIndex];
      return true; // will attack
    }
    return false;
  }
  
  getAttackDamage() {
    return this.atk + Math.floor(Math.random() * this.atk * 0.3);
  }
  
  getTarget(heroes) {
    // Target the hero with lowest HP (alive)
    const alive = heroes.filter(h => h.alive);
    if (alive.length === 0) return null;
    return alive.reduce((min, h) => h.currentHp < min.currentHp ? h : min);
  }
  
  getHpPercent() { return this.currentHp / this.maxHp; }
}
