import { ZONES, STAGES, getZoneStages, isStageUnlocked } from '../data/stages.js';

export class MapUI {
  constructor(engine) {
    this.engine = engine;
    this.container = document.getElementById('zones-container');
  }

  render() {
    const state = this.engine.state.player;
    this.container.innerHTML = '';
    
    for (const zone of ZONES) {
      const stages = getZoneStages(zone.id);
      const zoneUnlocked = isStageUnlocked(stages[0].id, state.stagesCompleted);
      
      const zoneCard = document.createElement('div');
      zoneCard.className = `zone-card ${!zoneUnlocked ? 'zone-locked' : ''}`;
      zoneCard.innerHTML = `
        <div class="zone-header" style="border-left: 4px solid ${zone.color}">
          <div class="zone-title">
            <h3 class="zone-name">${zone.name}</h3>
            <p class="zone-desc">${zone.description}</p>
          </div>
          ${!zoneUnlocked ? '<span class="lock-icon">🔒</span>' : ''}
        </div>
        ${zoneUnlocked ? `
        <div class="zone-stages">
          ${stages.map(stage => {
            const unlocked = isStageUnlocked(stage.id, state.stagesCompleted);
            const completed = state.stagesCompleted[stage.id];
            const stars = completed?.stars || 0;
            const isBoss = stage.isBoss;
            return `
              <button class="stage-btn ${completed ? 'completed' : ''} ${!unlocked ? 'locked' : ''} ${isBoss ? 'boss' : ''}"
                      data-stage="${stage.id}" ${!unlocked ? 'disabled' : ''}>
                <span class="stage-num">${stage.stageNum}</span>
                ${completed ? `<span class="stars">${'⭐'.repeat(stars)}</span>` : ''}
                ${isBoss ? '<span class="boss-indicator">👑</span>' : ''}
              </button>
            `;
          }).join('')}
        </div>` : ''}
      `;
      
      this.container.appendChild(zoneCard);
    }
    
    // Add click handlers for stage buttons
    this.container.querySelectorAll('.stage-btn:not(.locked)').forEach(btn => {
      btn.addEventListener('click', () => {
        const stageId = btn.dataset.stage;
        this.engine.emit('stageSelected', { stageId });
      });
    });
  }
}
