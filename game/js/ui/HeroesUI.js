import { HERO_DATA } from '../data/heroes.js';
import { ELEMENTS } from '../rpg/Elements.js';

export class HeroesUI {
  constructor(engine) {
    this.engine = engine;
    this.rosterContainer = document.getElementById('hero-roster');
    this.detailContainer = document.getElementById('hero-detail');
  }

  render() {
    const state = this.engine.state.player;
    this.rosterContainer.innerHTML = '';
    this.detailContainer.classList.add('hidden');
    
    // Sort: team first, then unlocked, then locked
    const heroIds = Object.keys(HERO_DATA);
    const teamSet = new Set(state.currentTeam);
    
    heroIds.sort((a, b) => {
      const aTeam = teamSet.has(a) ? 0 : 1;
      const bTeam = teamSet.has(b) ? 0 : 1;
      if (aTeam !== bTeam) return aTeam - bTeam;
      const aUnlock = state.heroes[a]?.unlocked ? 0 : 1;
      const bUnlock = state.heroes[b]?.unlocked ? 0 : 1;
      return aUnlock - bUnlock;
    });
    
    for (const heroId of heroIds) {
      const data = HERO_DATA[heroId];
      const saved = state.heroes[heroId];
      const unlocked = saved?.unlocked || false;
      const level = saved?.level || 1;
      const inTeam = teamSet.has(heroId);
      
      const card = document.createElement('div');
      card.className = `hero-card ${!unlocked ? 'hero-locked' : ''} ${inTeam ? 'hero-in-team' : ''}`;
      card.innerHTML = `
        <div class="hero-portrait" style="background: linear-gradient(135deg, ${data.portraitColors.primary}, ${data.portraitColors.secondary})">
          <span class="hero-portrait-initial">${unlocked ? data.name[0] : '?'}</span>
        </div>
        <div class="hero-info">
          <div class="hero-name-row">
            <span class="hero-name">${unlocked ? data.name : '???'}</span>
            ${inTeam ? '<span class="team-badge">IN TEAM</span>' : ''}
          </div>
          <span class="hero-title">${unlocked ? data.title : 'Locked'}</span>
          <div class="hero-meta">
            <span class="element-badge" style="background: ${data.portraitColors.primary}33; color: ${data.portraitColors.primary}">${ELEMENTS[data.element]?.emoji || ''} ${data.element}</span>
            <span class="hero-level">Lv.${level}</span>
          </div>
          ${unlocked ? `
          <div class="hero-quick-stats">
            <span>❤️${Math.floor(data.baseStats.hp * (1 + (level-1)*0.08))}</span>
            <span>⚔️${Math.floor(data.baseStats.atk * (1 + (level-1)*0.08))}</span>
            <span>🛡️${Math.floor(data.baseStats.def * (1 + (level-1)*0.08))}</span>
          </div>` : `<span class="unlock-hint">Unlocks at Zone ${data.unlockZone + 1}</span>`}
        </div>
      `;
      
      if (unlocked) {
        card.addEventListener('click', () => this.showDetail(heroId));
      }
      
      this.rosterContainer.appendChild(card);
    }
  }

  showDetail(heroId) {
    const data = HERO_DATA[heroId];
    const state = this.engine.state.player;
    const saved = state.heroes[heroId];
    const level = saved?.level || 1;
    const levelMul = 1 + (level - 1) * 0.08;
    const inTeam = state.currentTeam.includes(heroId);
    
    this.detailContainer.classList.remove('hidden');
    this.detailContainer.innerHTML = `
      <div class="hero-detail-card">
        <button class="btn-close" id="btn-close-detail">✕</button>
        <div class="hero-detail-header">
          <div class="hero-portrait-large" style="background: linear-gradient(135deg, ${data.portraitColors.primary}, ${data.portraitColors.secondary})">
            <span class="hero-portrait-letter">${data.name[0]}</span>
          </div>
          <div>
            <h3 class="hero-detail-name">${data.name}</h3>
            <span class="hero-detail-title">${data.title}</span>
            <span class="element-badge" style="background: ${data.portraitColors.primary}33; color: ${data.portraitColors.primary}">${ELEMENTS[data.element]?.emoji || ''} ${data.element}</span>
          </div>
        </div>
        
        <div class="hero-detail-stats">
          <h4>Stats (Lv.${level})</h4>
          <div class="stat-row"><span>❤️ HP</span><span>${Math.floor(data.baseStats.hp * levelMul)}</span></div>
          <div class="stat-row"><span>⚔️ ATK</span><span>${Math.floor(data.baseStats.atk * levelMul)}</span></div>
          <div class="stat-row"><span>🛡️ DEF</span><span>${Math.floor(data.baseStats.def * levelMul)}</span></div>
          <div class="stat-row"><span>💨 SPD</span><span>${Math.floor(data.baseStats.spd * levelMul)}</span></div>
        </div>
        
        <div class="hero-detail-skill">
          <h4>🔮 ${data.skill.name}</h4>
          <p>${data.skill.description}</p>
          <span class="skill-cost">Mana Cost: ${data.skill.manaCost}</span>
        </div>
        
        <div class="hero-detail-actions">
          ${inTeam 
            ? '<button class="btn-secondary" id="btn-remove-team">Remove from Team</button>'
            : '<button class="btn-primary" id="btn-add-team">Add to Team</button>'
          }
        </div>
      </div>
    `;
    
    document.getElementById('btn-close-detail')?.addEventListener('click', () => {
      this.detailContainer.classList.add('hidden');
    });
    
    document.getElementById('btn-add-team')?.addEventListener('click', () => {
      if (state.currentTeam.length < 3) {
        state.currentTeam.push(heroId);
      } else {
        // Replace last hero
        state.currentTeam[2] = heroId;
      }
      this.engine.saveState();
      this.render();
    });
    
    document.getElementById('btn-remove-team')?.addEventListener('click', () => {
      if (state.currentTeam.length > 1) {
        state.currentTeam = state.currentTeam.filter(id => id !== heroId);
        this.engine.saveState();
        this.render();
      }
    });
  }
}
