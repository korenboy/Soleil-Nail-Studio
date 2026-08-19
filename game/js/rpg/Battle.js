import { Hero } from './Hero.js';
import { Enemy } from './Enemy.js';
import { getElementalMultiplier } from './Elements.js';
import { generateRandomEquipment } from './Equipment.js';
import { audio } from '../engine/Audio.js';

export class Battle {
  constructor(engine) {
    this.engine = engine;
    this.heroes = [];     // Hero instances
    this.enemies = [];    // Enemy instances
    this.state = 'inactive'; // 'inactive', 'playerTurn', 'processing', 'enemyTurn', 'victory', 'defeat'
    this.turnCount = 0;
    this.totalDamageDealt = 0;
    this.totalGold = 0;
    this.totalExp = 0;
    this.stageId = null;
  }
  
  startBattle(stageId, heroIds, enemyConfigs) {
    this.stageId = stageId;
    this.state = 'playerTurn';
    this.turnCount = 0;
    this.totalDamageDealt = 0;
    
    // Create hero instances from saved data
    const savedHeroes = this.engine.state.player.heroes;
    this.heroes = heroIds.map(id => {
      const hero = new Hero(id, savedHeroes[id]);
      hero.initBattle();
      return hero;
    });
    
    // Create enemies
    this.enemies = enemyConfigs.map(config => new Enemy(config.id, config.levelScale || 1));
    
    this.engine.emit('battleStart', { heroes: this.heroes, enemies: this.enemies });
  }
  
  // Called when the player completes a match-3 turn
  processPlayerTurn(matchResults) {
    // matchResults: { matchedTiles: [{type, count}], comboMultiplier: number, specialsTriggered: [] }
    this.state = 'processing';
    this.turnCount++;
    
    const results = [];
    
    // Calculate damage per element type matched
    for (const match of matchResults.matchedTiles) {
      if (match.type === 'skull') {
        // Skull tiles = direct damage to random enemy
        const damage = match.count * 8 * matchResults.comboMultiplier;
        const target = this.getRandomAliveEnemy();
        if (target) {
          const actualDmg = target.takeDamage(damage);
          results.push({ type: 'damage', target, damage: actualDmg, element: null });
          this.totalDamageDealt += actualDmg;
        }
      } else {
        // Element tiles charge heroes of matching element and deal damage
        for (const hero of this.heroes) {
          if (hero.alive && hero.element === match.type) {
            hero.addMana(match.count * 12);
          }
        }
        // Also deal elemental damage
        const heroOfElement = this.heroes.find(h => h.alive && h.element === match.type);
        if (heroOfElement) {
          const target = this.getRandomAliveEnemy();
          if (target) {
            const baseDmg = heroOfElement.atk * (match.count / 3);
            const elMul = getElementalMultiplier(match.type, target.element);
            const totalDmg = baseDmg * elMul * matchResults.comboMultiplier;
            const actualDmg = target.takeDamage(totalDmg);
            results.push({ type: 'damage', target, damage: actualDmg, element: match.type, effective: elMul > 1 });
            this.totalDamageDealt += actualDmg;
          }
        }
      }
    }
    
    // Check for enemy deaths, collect rewards
    for (const enemy of this.enemies) {
      if (!enemy.alive && !enemy._rewarded) {
        enemy._rewarded = true;
        this.totalGold += enemy.rewards.gold;
        this.totalExp += enemy.rewards.exp;
        results.push({ type: 'enemyDefeated', enemy });
      }
    }
    
    // Check victory
    if (this.enemies.every(e => !e.alive)) {
      this.state = 'victory';
      this.engine.emit('battleEnd', this.getVictoryResults());
      return results;
    }
    
    // Enemy turn
    this.state = 'enemyTurn';
    const enemyResults = this.processEnemyTurn();
    results.push(...enemyResults);
    
    // Check defeat
    if (this.heroes.every(h => !h.alive)) {
      this.state = 'defeat';
      this.engine.emit('battleEnd', { victory: false });
      return results;
    }
    
    this.state = 'playerTurn';
    return results;
  }
  
  processEnemyTurn() {
    const results = [];
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const willAttack = enemy.advanceTurn();
      if (willAttack) {
        const target = enemy.getTarget(this.heroes);
        if (target) {
          const damage = enemy.getAttackDamage();
          const elMul = getElementalMultiplier(enemy.element, target.element);
          const actualDmg = target.takeDamage(damage * elMul);
          results.push({ type: 'enemyAttack', enemy, target, damage: actualDmg });
          if (!target.alive) {
            results.push({ type: 'heroDefeated', hero: target });
          }
        }
      }
    }
    return results;
  }
  
  useHeroSkill(heroIndex) {
    const hero = this.heroes[heroIndex];
    if (!hero || !hero.canUseSkill()) return null;
    
    const skill = hero.useSkill();
    const results = [];
    
    // Skill effects based on hero type
    switch(skill.effectType) {
      case 'damage_all': {
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          const dmg = hero.atk * skill.power;
          const elMul = getElementalMultiplier(hero.element, enemy.element);
          const actualDmg = enemy.takeDamage(dmg * elMul);
          results.push({ type: 'skillDamage', target: enemy, damage: actualDmg, element: hero.element });
        }
        break;
      }
      case 'damage_single': {
        const target = this.getRandomAliveEnemy();
        if (target) {
          const dmg = hero.atk * skill.power;
          const elMul = getElementalMultiplier(hero.element, target.element);
          const actualDmg = target.takeDamage(dmg * elMul);
          results.push({ type: 'skillDamage', target, damage: actualDmg, element: hero.element });
        }
        break;
      }
      case 'heal_all': {
        for (const h of this.heroes) {
          if (!h.alive) continue;
          const amount = Math.floor(hero.atk * skill.power);
          h.heal(amount);
          results.push({ type: 'heal', target: h, amount });
        }
        break;
      }
      case 'buff_team': {
        for (const h of this.heroes) {
          if (!h.alive) continue;
          h.atk = Math.floor(h.atk * (1 + skill.power * 0.01));
          results.push({ type: 'buff', target: h, stat: 'ATK', amount: Math.floor(skill.power) });
        }
        break;
      }
    }
    
    this.engine.emit('heroSkillUsed', { hero, skill, results });
    
    // Check enemy deaths
    for (const enemy of this.enemies) {
      if (!enemy.alive && !enemy._rewarded) {
        enemy._rewarded = true;
        this.totalGold += enemy.rewards.gold;
        this.totalExp += enemy.rewards.exp;
      }
    }
    
    if (this.enemies.every(e => !e.alive)) {
      this.state = 'victory';
      this.engine.emit('battleEnd', this.getVictoryResults());
    }
    
    return results;
  }
  
  getRandomAliveEnemy() {
    const alive = this.enemies.filter(e => e.alive);
    return alive.length > 0 ? alive[Math.floor(Math.random() * alive.length)] : null;
  }
  
  getVictoryResults() {
    // Calculate stars
    const aliveHeroes = this.heroes.filter(h => h.alive).length;
    const stars = aliveHeroes === this.heroes.length ? 3 : aliveHeroes >= 2 ? 2 : 1;
    
    // Generate equipment drop (30% chance per stage)
    let equipmentDrop = null;
    if (Math.random() < 0.3) {
      equipmentDrop = generateRandomEquipment();
    }
    
    return {
      victory: true,
      stars,
      gold: this.totalGold,
      exp: this.totalExp,
      equipment: equipmentDrop,
      stageId: this.stageId,
      turnCount: this.turnCount,
      totalDamage: this.totalDamageDealt
    };
  }
}
