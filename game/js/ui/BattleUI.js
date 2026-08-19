import { ELEMENTS } from '../rpg/Elements.js';
import { audio } from '../engine/Audio.js';

export class BattleUI {
  constructor(engine) {
    this.engine = engine;
    this.enemyArea = document.getElementById('enemy-area');
    this.heroTeamArea = document.getElementById('hero-team-area');
    this.heroSkills = document.getElementById('hero-skills');
    this.battleFooter = document.getElementById('battle-footer');
  }

  // Render enemy cards at top of battle screen
  renderEnemies(enemies) {
    this.enemyArea.innerHTML = '';
    enemies.forEach((enemy, index) => {
      const card = document.createElement('div');
      card.className = 'enemy-card';
      card.id = `enemy-${index}`;
      card.innerHTML = `
        <div class="enemy-portrait" style="background: linear-gradient(135deg, ${enemy.color}, ${enemy.color}88)">
          <span class="enemy-symbol">${enemy.portraitSymbol}</span>
        </div>
        <div class="enemy-info">
          <span class="enemy-name">${enemy.name}</span>
          <div class="enemy-hp-bar">
            <div class="enemy-hp-fill" id="enemy-hp-${index}" style="width: 100%"></div>
          </div>
          <span class="enemy-hp-text" id="enemy-hp-text-${index}">${enemy.currentHp}/${enemy.maxHp}</span>
          <div class="enemy-turn-indicator">
            <span class="turn-dots" id="enemy-turns-${index}">${this.renderTurnDots(enemy.turnsUntilAttack)}</span>
          </div>
        </div>
      `;
      this.enemyArea.appendChild(card);
    });
  }

  renderTurnDots(turns) {
    // Show dots representing turns until attack
    // Red = attacking next turn, yellow = 2 turns, gray = 3+
    let dots = '';
    for (let i = 0; i < turns; i++) {
      const color = turns === 1 ? '#ff4444' : turns === 2 ? '#ffcc00' : '#666666';
      dots += `<span style="color:${color}">●</span>`;
    }
    return dots;
  }

  // Update enemy HP bars after damage
  updateEnemy(index, enemy) {
    const hpFill = document.getElementById(`enemy-hp-${index}`);
    const hpText = document.getElementById(`enemy-hp-text-${index}`);
    const turns = document.getElementById(`enemy-turns-${index}`);
    const card = document.getElementById(`enemy-${index}`);
    
    if (hpFill) {
      const pct = enemy.getHpPercent() * 100;
      hpFill.style.width = `${pct}%`;
      // Color gradient: green → yellow → red
      if (pct > 50) hpFill.style.background = `linear-gradient(90deg, #44cc44, #88ee44)`;
      else if (pct > 25) hpFill.style.background = `linear-gradient(90deg, #ffcc00, #ff8800)`;
      else hpFill.style.background = `linear-gradient(90deg, #ff4444, #ff6644)`;
    }
    if (hpText) hpText.textContent = `${Math.max(0, enemy.currentHp)}/${enemy.maxHp}`;
    if (turns) turns.innerHTML = this.renderTurnDots(enemy.turnsUntilAttack);
    
    // Death animation
    if (!enemy.alive && card) {
      card.style.opacity = '0.3';
      card.style.transform = 'scale(0.9)';
      card.style.transition = 'all 0.5s ease';
    }
  }

  // Render hero team at bottom area
  renderHeroes(heroes) {
    this.heroTeamArea.innerHTML = '';
    this.heroSkills.innerHTML = '';
    
    heroes.forEach((hero, index) => {
      // Hero battle card
      const card = document.createElement('div');
      card.className = 'hero-battle-card';
      card.id = `hero-battle-${index}`;
      card.innerHTML = `
        <div class="hero-portrait-small" style="background: linear-gradient(135deg, ${hero.portraitColors.primary}, ${hero.portraitColors.secondary})">
          <span class="hero-initial">${hero.name[0]}</span>
        </div>
        <div class="hero-battle-info">
          <span class="hero-battle-name">${hero.name}</span>
          <div class="hp-bar-small">
            <div class="hp-fill-small" id="hero-hp-${index}" style="width: 100%"></div>
          </div>
          <div class="mana-bar">
            <div class="mana-fill" id="hero-mana-${index}" style="width: 0%"></div>
          </div>
        </div>
      `;
      this.heroTeamArea.appendChild(card);
      
      // Skill button
      const skillBtn = document.createElement('button');
      skillBtn.className = 'skill-btn';
      skillBtn.id = `skill-btn-${index}`;
      skillBtn.innerHTML = `<span class="skill-icon">${this.getElementEmoji(hero.element)}</span>`;
      skillBtn.title = hero.skill.name;
      skillBtn.disabled = true;
      skillBtn.addEventListener('click', () => {
        this.engine.emit('heroSkillActivated', { heroIndex: index });
        audio.playHeroSkill();
      });
      this.heroSkills.appendChild(skillBtn);
    });
  }

  getElementEmoji(element) {
    const map = { fire: '🔥', water: '💧', nature: '🌿', light: '✨', dark: '🌙' };
    return map[element] || '⚡';
  }

  // Update hero HP and mana bars
  updateHero(index, hero) {
    const hpFill = document.getElementById(`hero-hp-${index}`);
    const manaFill = document.getElementById(`hero-mana-${index}`);
    const skillBtn = document.getElementById(`skill-btn-${index}`);
    const card = document.getElementById(`hero-battle-${index}`);
    
    if (hpFill) {
      const pct = hero.getHpPercent() * 100;
      hpFill.style.width = `${pct}%`;
      if (pct > 50) hpFill.style.background = '#44cc44';
      else if (pct > 25) hpFill.style.background = '#ffcc00';
      else hpFill.style.background = '#ff4444';
    }
    
    if (manaFill) {
      manaFill.style.width = `${hero.getManaPercent() * 100}%`;
    }
    
    if (skillBtn) {
      const ready = hero.canUseSkill();
      skillBtn.disabled = !ready;
      skillBtn.classList.toggle('skill-ready', ready);
    }
    
    if (!hero.alive && card) {
      card.style.opacity = '0.3';
      card.style.filter = 'grayscale(1)';
    }
  }

  // Show floating damage number
  showDamageNumber(targetElement, damage, isEffective) {
    if (!targetElement) return;
    const num = document.createElement('div');
    num.className = 'floating-damage';
    num.textContent = `-${damage}`;
    if (isEffective) {
      num.classList.add('super-effective');
      num.textContent += ' !';
    }
    targetElement.appendChild(num);
    setTimeout(() => num.remove(), 1500);
  }

  // Show heal number
  showHealNumber(targetElement, amount) {
    if (!targetElement) return;
    const num = document.createElement('div');
    num.className = 'floating-heal';
    num.textContent = `+${amount}`;
    targetElement.appendChild(num);
    setTimeout(() => num.remove(), 1500);
  }

  // Show victory overlay
  showVictory(results) {
    const modal = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    
    const stars = '⭐'.repeat(results.stars) + '☆'.repeat(3 - results.stars);
    
    let equipmentHtml = '';
    if (results.equipment) {
      equipmentHtml = `
        <div class="reward-equipment">
          <span style="color: ${results.equipment.rarityData.color}">${results.equipment.name}</span>
          <span class="rarity-badge" style="background: ${results.equipment.rarityData.color}22; color: ${results.equipment.rarityData.color}">${results.equipment.rarityData.name}</span>
        </div>
      `;
    }
    
    content.innerHTML = `
      <div class="victory-screen">
        <h2 class="victory-title">⚔️ Victory!</h2>
        <div class="victory-stars">${stars}</div>
        <div class="victory-rewards">
          <div class="reward-row"><span>💰 Gold</span><span class="text-gold">+${results.gold}</span></div>
          <div class="reward-row"><span>✨ EXP</span><span class="text-gold">+${results.exp}</span></div>
          ${equipmentHtml}
        </div>
        <div class="victory-stats">
          <span>Turns: ${results.turnCount}</span>
          <span>Damage: ${results.totalDamage}</span>
        </div>
        <button id="btn-victory-continue" class="btn-primary">Continue</button>
      </div>
    `;
    
    modal.classList.remove('hidden');
    
    document.getElementById('btn-victory-continue').addEventListener('click', () => {
      modal.classList.add('hidden');
      this.engine.emit('battleContinue', results);
    });
  }

  // Show defeat overlay
  showDefeat() {
    const modal = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    
    content.innerHTML = `
      <div class="defeat-screen">
        <h2 class="defeat-title">💀 Defeat...</h2>
        <p>Your heroes have fallen. Upgrade your team and try again!</p>
        <button id="btn-defeat-back" class="btn-primary">Back to Map</button>
      </div>
    `;
    
    modal.classList.remove('hidden');
    
    document.getElementById('btn-defeat-back').addEventListener('click', () => {
      modal.classList.add('hidden');
      this.engine.emit('battleContinue', { victory: false });
    });
  }

  // Clear battle UI
  clear() {
    this.enemyArea.innerHTML = '';
    this.heroTeamArea.innerHTML = '';
    this.heroSkills.innerHTML = '';
  }
}
