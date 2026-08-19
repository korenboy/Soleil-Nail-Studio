import { QUESTS } from '../data/quests.js';

export class QuestManager {
  constructor(engine) {
    this.engine = engine;
    this.quests = QUESTS;
    
    // Bind event listener properly so we can remove it if needed (though it lives for game lifetime)
    this.handleEvent = this.handleEvent.bind(this);
    
    // Listen to all events that might trigger quest completion
    const triggerEvents = [...new Set(QUESTS.map(q => q.triggerEvent))];
    triggerEvents.forEach(evt => {
      this.engine.on(evt, (data) => this.handleEvent(evt, data));
    });
  }

  getCurrentQuest() {
    const state = this.engine.state;
    if (!state.player.currentQuestId) return null;
    return this.quests.find(q => q.id === state.player.currentQuestId);
  }

  handleEvent(eventType, eventData) {
    const currentQuest = this.getCurrentQuest();
    if (!currentQuest) return;

    if (currentQuest.triggerEvent === eventType) {
      if (currentQuest.condition(eventData)) {
        this.completeQuest(currentQuest);
      }
    }
  }

  completeQuest(quest) {
    const state = this.engine.state;
    
    // Give rewards
    if (quest.rewards.gold) state.player.gold += quest.rewards.gold;
    if (quest.rewards.gems) state.player.gems += quest.rewards.gems;
    
    // Add to completed
    if (!this.engine.state.player.completedQuests) {
      this.engine.state.player.completedQuests = [];
    }
    if (this.engine.state.player.completedQuests.includes(quest.id)) return;
    
    // Mark completed
    this.engine.state.player.completedQuests.push(quest.id);
    
    // Move to next quest
    state.player.currentQuestId = quest.nextQuest;
    
    this.engine.saveState();
    
    // Emit event so UI can show a notification
    this.engine.emit('questCompleted', quest);
  }
}
