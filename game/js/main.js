import { engine } from './engine/GameEngine.js';
import { Renderer } from './engine/Renderer.js';
import { Input } from './engine/Input.js';
import { audio } from './engine/Audio.js';
import { ParticleSystem } from './engine/Particles.js';
import { Board } from './puzzle/Board.js';
import { Battle } from './rpg/Battle.js';
import { STAGES } from './data/stages.js';
import { ScreenManager } from './ui/Screens.js';
import { BattleUI } from './ui/BattleUI.js';
import { CampUI } from './ui/CampUI.js';
import { HeroesUI } from './ui/HeroesUI.js';
import { MapUI } from './ui/MapUI.js';
import { OfflineCalculator } from './idle/OfflineCalc.js';
import { HERO_DATA } from './data/heroes.js';
import { QuestManager } from './engine/QuestManager.js';

// ===== INITIALIZATION =====
const renderer = new Renderer(engine);
const input = new Input(engine);
const particles = new ParticleSystem();
const board = new Board(engine);
const battle = new Battle(engine);
const screens = new ScreenManager(engine);
const battleUI = new BattleUI(engine);
const campUI = new CampUI(engine);
const heroesUI = new HeroesUI(engine);
const mapUI = new MapUI(engine);
const offlineCalc = new OfflineCalculator(engine);
const questManager = new QuestManager(engine);

// Initialize engine
engine.init();
renderer.init();
input.init();
audio.init();

// Register systems for game loop
engine.addSystem({
  update(dt) {
    if (screens.currentScreen === 'battle-screen') {
      board.update(dt);
      particles.update(dt);
      renderer.update(dt);
    }
  },
  render() {
    if (screens.currentScreen === 'battle-screen') {
      renderer.clear();
      renderer.applyScreenShake();
      renderer.drawBattleBackground();
      board.render(renderer);
      particles.render(engine.ctx);
    }
  }
});

// ===== SCREEN MANAGEMENT =====
screens.init();

// Title screen - Play button
document.getElementById('btn-play').addEventListener('click', () => {
  audio.playButtonClick();
  
  // Check Tutorial
  if (!engine.state.player.tutorialCompleted) {
    document.getElementById('tutorial-overlay').classList.remove('hidden');
  }
  
  screens.showScreen('map-screen');
  mapUI.render();
  updateQuestBanner();
});

// Continue button (show if save exists)
if (engine.state.lastSavedTimestamp) {
  document.getElementById('btn-continue').style.display = 'block';
  document.getElementById('btn-continue').addEventListener('click', () => {
    audio.playButtonClick();
    
    // Check Tutorial
    if (!engine.state.player.tutorialCompleted) {
      document.getElementById('tutorial-overlay').classList.remove('hidden');
    }
    
    // Calculate offline rewards
    const rewards = offlineCalc.calculateOfflineRewards(engine.state);
    if (rewards) {
      offlineCalc.showWelcomeBack(rewards);
    }
    
    screens.showScreen('map-screen');
    mapUI.render();
    updateQuestBanner();
  });
}

// Handle Tutorial Next
document.getElementById('btn-tutorial-next').addEventListener('click', () => {
  audio.playButtonClick();
  document.getElementById('tutorial-overlay').classList.add('hidden');
  engine.state.player.tutorialCompleted = true;
  
  // Backwards compatibility for old saves
  if (!engine.state.player.currentQuestId) {
    engine.state.player.currentQuestId = 'quest_1';
  }
  if (!engine.state.player.completedQuests) {
    engine.state.player.completedQuests = [];
  }
  
  engine.saveState();
  updateQuestBanner();
});

// Listen for quest completion
engine.on('questCompleted', (quest) => {
  alert(`Quest Completed: ${quest.title}!\nRewards: ${quest.rewards.gold || 0} Gold, ${quest.rewards.gems || 0} Gems`);
  updateQuestBanner();
  mapUI.render();
  campUI.render();
});

function updateQuestBanner() {
  const quest = questManager.getCurrentQuest();
  const mapBanner = document.getElementById('map-quest-banner');
  const campBanner = document.getElementById('camp-quest-banner');
  
  if (quest && mapBanner && campBanner) {
    mapBanner.classList.remove('hidden');
    campBanner.classList.remove('hidden');
    document.getElementById('map-quest-title').innerText = quest.title;
    document.getElementById('map-quest-desc').innerText = quest.description;
    document.getElementById('camp-quest-title').innerText = quest.title;
    document.getElementById('camp-quest-desc').innerText = quest.description;
  } else if (mapBanner && campBanner) {
    mapBanner.classList.add('hidden');
    campBanner.classList.add('hidden');
  }
}

// Screen change handlers
engine.on('screenChange', ({ screen }) => {
  if (screen === 'map-screen') mapUI.render();
  if (screen === 'camp-screen') campUI.render();
  if (screen === 'heroes-screen') heroesUI.render();
  updateQuestBanner();
});

// ===== BATTLE SYSTEM =====

// Stage selected from map
engine.on('stageSelected', ({ stageId }) => {
  const stageData = STAGES[stageId];
  if (!stageData) return;
  
  audio.playButtonClick();
  
  // Start battle
  screens.showScreen('battle-screen');
  battle.startBattle(stageId, engine.state.player.currentTeam, stageData.enemies);
  board.init();
});

// Battle started - render UI
engine.on('battleStart', ({ heroes, enemies }) => {
  battleUI.renderEnemies(enemies);
  battleUI.renderHeroes(heroes);
});

// ===== INPUT → PUZZLE → BATTLE FLOW =====

let processingTurn = false;

engine.on('inputStart', ({ gridPos }) => {
  if (battle.state !== 'playerTurn' || processingTurn) return;
  if (!gridPos) return;
  board.selectedTile = board.grid[gridPos.row]?.[gridPos.col] || null;
});

engine.on('inputDrag', ({ from, direction }) => {
  if (battle.state !== 'playerTurn' || processingTurn || !board.selectedTile) return;
  
  const row = board.selectedTile.row;
  const col = board.selectedTile.col;
  let toRow = row, toCol = col;
  
  switch (direction) {
    case 'up': toRow--; break;
    case 'down': toRow++; break;
    case 'left': toCol--; break;
    case 'right': toCol++; break;
  }
  
  if (toRow < 0 || toRow >= 8 || toCol < 0 || toCol >= 8) return;
  
  processingTurn = true;
  board.selectedTile = null;
  audio.playSwap();
  
  handleSwap(row, col, toRow, toCol);
});

async function handleSwap(row1, col1, row2, col2) {
  const tile1 = board.grid[row1][col1];
  const tile2 = board.grid[row2][col2];
  if (!tile1 || !tile2) { processingTurn = false; return; }
  
  // Animate swap
  const pos1 = board.gridToScreen(row1, col1);
  const pos2 = board.gridToScreen(row2, col2);
  tile1.setTarget(pos2.x, pos2.y);
  tile2.setTarget(pos1.x, pos1.y);
  
  // Swap in grid
  board.grid[row1][col1] = tile2;
  board.grid[row2][col2] = tile1;
  tile1.row = row2; tile1.col = col2;
  tile2.row = row1; tile2.col = col1;
  
  await delay(200);
  
  // Check for matches
  let matchResult = board.matcher.findAllMatches();
  
  if (!matchResult || matchResult.matchedTiles.size === 0) {
    // No match — swap back
    board.grid[row1][col1] = tile1;
    board.grid[row2][col2] = tile2;
    tile1.row = row1; tile1.col = col1;
    tile2.row = row2; tile2.col = col2;
    tile1.setTarget(pos1.x, pos1.y);
    tile2.setTarget(pos2.x, pos2.y);
    await delay(200);
    processingTurn = false;
    return;
  }
  
  // Process matches in a loop (for cascades)
  board.combo.reset();
  let allMatchedTypes = [];
  
  while (matchResult && matchResult.matchedTiles.size > 0) {
    board.combo.increment();
    audio.playMatch();
    
    // Collect matched tile types for battle processing
    const typeCount = {};
    for (const tile of matchResult.matchedTiles) {
      typeCount[tile.type] = (typeCount[tile.type] || 0) + 1;
    }
    allMatchedTypes.push(...Object.entries(typeCount).map(([type, count]) => ({ type, count })));
    
    // Particles for each matched tile
    for (const tile of matchResult.matchedTiles) {
      const colors = tile.getColors();
      particles.emitMatchBurst(tile.x, tile.y, colors.main);
    }
    
    // Create special tiles if needed
    for (const special of matchResult.specialsToCreate) {
      const newTile = board.grid[special.row][special.col];
      if (newTile) {
        newTile.special = special.special;
        audio.playExplosion();
      }
    }
    
    // Handle special tile activations
    for (const tile of matchResult.matchedTiles) {
      if (tile.special !== 'none') {
        const extraMatched = board.activateSpecialTile(tile);
        if (extraMatched) {
          for (const t of extraMatched) {
            matchResult.matchedTiles.add(t);
            particles.emitExplosion(t.x, t.y, t.getColors().main);
          }
        }
      }
    }
    
    // Remove matched tiles
    for (const tile of matchResult.matchedTiles) {
      tile.matched = true;
      tile.alpha = 0;
      board.grid[tile.row][tile.col] = null;
    }
    
    if (board.combo.count >= 2) {
      renderer.triggerScreenShake(3 + board.combo.count);
      audio.playCombo(board.combo.count);
    }
    
    await delay(300);
    
    // Apply gravity
    board.applyGravity();
    await delay(250);
    
    // Fill empty spaces
    board.fillEmptySpaces();
    await delay(300);
    
    // Check for new matches (cascade)
    matchResult = board.matcher.findAllMatches();
  }
  
  // Battle processing
  const comboResult = board.combo.reset();
  const battleResults = battle.processPlayerTurn({
    matchedTiles: allMatchedTypes,
    comboMultiplier: comboResult.multiplier,
    specialsTriggered: []
  });
  
  // Update battle UI
  if (battleResults) {
    for (const result of battleResults) {
      switch (result.type) {
        case 'damage': {
          const enemyIdx = battle.enemies.indexOf(result.target);
          battleUI.updateEnemy(enemyIdx, result.target);
          const enemyEl = document.getElementById(`enemy-${enemyIdx}`);
          battleUI.showDamageNumber(enemyEl, result.damage, result.effective);
          break;
        }
        case 'enemyAttack': {
          const heroIdx = battle.heroes.indexOf(result.target);
          battleUI.updateHero(heroIdx, result.target);
          const heroEl = document.getElementById(`hero-battle-${heroIdx}`);
          battleUI.showDamageNumber(heroEl, result.damage);
          renderer.triggerScreenShake(5);
          break;
        }
        case 'heal': {
          const hIdx = battle.heroes.indexOf(result.target);
          battleUI.updateHero(hIdx, result.target);
          const hEl = document.getElementById(`hero-battle-${hIdx}`);
          battleUI.showHealNumber(hEl, result.amount);
          break;
        }
        case 'enemyDefeated': {
          const eIdx = battle.enemies.indexOf(result.enemy);
          battleUI.updateEnemy(eIdx, result.enemy);
          particles.emitExplosion(
            engine.width / 2,
            80 + eIdx * 60,
            result.enemy.color
          );
          break;
        }
        case 'heroDefeated': {
          const hdIdx = battle.heroes.indexOf(result.hero);
          battleUI.updateHero(hdIdx, result.hero);
          break;
        }
      }
    }
    
    // Update all hero mana bars
    battle.heroes.forEach((hero, i) => battleUI.updateHero(i, hero));
    
    // Update all enemy turn indicators
    battle.enemies.forEach((enemy, i) => {
      if (enemy.alive) battleUI.updateEnemy(i, enemy);
    });
  }
  
  // Check battle end
  if (battle.state === 'victory') {
    await delay(500);
    audio.playVictory();
    const results = battle.getVictoryResults();
    applyBattleRewards(results);
    updateQuestBanner();
    battleUI.showVictory(results);
  } else if (battle.state === 'defeat') {
    await delay(500);
    audio.playDefeat();
    battleUI.showDefeat();
  }
  
  processingTurn = false;
}

// Apply battle rewards to game state
function applyBattleRewards(results) {
  const state = engine.state;
  state.player.gold += results.gold;
  
  // Distribute EXP to team
  const expPerHero = Math.floor(results.exp / state.player.currentTeam.length);
  for (const heroId of state.player.currentTeam) {
    if (state.player.heroes[heroId]) {
      state.player.heroes[heroId].exp = (state.player.heroes[heroId].exp || 0) + expPerHero;
      state.player.heroes[heroId].level = state.player.heroes[heroId].level || 1;
      // Simple level up check
      const expNeeded = Math.floor(100 * Math.pow(1.15, state.player.heroes[heroId].level - 1));
      let leveledUp = false;
      while (state.player.heroes[heroId].exp >= expNeeded) {
        state.player.heroes[heroId].exp -= expNeeded;
        state.player.heroes[heroId].level++;
        leveledUp = true;
      }
      
      if (leveledUp) {
        engine.emit('heroLeveledUp', { heroId, newLevel: state.player.heroes[heroId].level });
      }
    }
  }
  
  // Mark stage completed
  state.player.stagesCompleted[results.stageId] = { stars: results.stars, completed: true };
  const parts = results.stageId.split('_stage');
  if (parts.length === 2) {
    const zoneNum = parseInt(parts[0].replace('zone', ''));
    const stageNum = parseInt(parts[1]);
    engine.emit('stageCompleted', { zone: zoneNum, stage: stageNum });
  }
  
  // Add equipment drop
  if (results.equipment) {
    state.player.ownedEquipment.push(results.equipment);
  }
  
  // Check hero unlocks
  const completedZones = new Set();
  for (const stageId of Object.keys(state.player.stagesCompleted)) {
    if (stageId.endsWith('_stage10')) {
      const zoneId = stageId.replace('_stage10', '');
      const zoneNum = parseInt(zoneId.replace('zone', ''));
      completedZones.add(zoneNum);
    }
  }
  
  // Unlock heroes based on zone completion
  for (const [heroId, data] of Object.entries(HERO_DATA)) {
    if (data.unlockZone > 0 && completedZones.has(data.unlockZone) && state.player.heroes[heroId]) {
      if (!state.player.heroes[heroId].unlocked) {
        state.player.heroes[heroId].unlocked = true;
        // TODO: Show unlock notification
      }
    }
  }
  
  // Player EXP and level
  state.player.exp += results.exp;
  while (state.player.exp >= state.player.expToNext) {
    state.player.exp -= state.player.expToNext;
    state.player.level++;
    state.player.expToNext = Math.floor(100 * Math.pow(1.2, state.player.level - 1));
    audio.playLevelUp();
  }
  
  engine.saveState();
}

// Battle continue (after victory/defeat modal)
engine.on('battleContinue', (results) => {
  battleUI.clear();
  screens.showScreen('map-screen');
  mapUI.render();
});

// Hero skill activation
engine.on('heroSkillActivated', ({ heroIndex }) => {
  if (battle.state !== 'playerTurn' || processingTurn) return;
  
  const results = battle.useHeroSkill(heroIndex);
  if (results) {
    for (const result of results) {
      if (result.type === 'skillDamage') {
        const eIdx = battle.enemies.indexOf(result.target);
        battleUI.updateEnemy(eIdx, result.target);
        const eEl = document.getElementById(`enemy-${eIdx}`);
        battleUI.showDamageNumber(eEl, result.damage);
        particles.emitSkillActivation(result.target.x || engine.width/2, 100, result.element);
      }
      if (result.type === 'heal') {
        const hIdx = battle.heroes.indexOf(result.target);
        battleUI.updateHero(hIdx, result.target);
        const hEl = document.getElementById(`hero-battle-${hIdx}`);
        battleUI.showHealNumber(hEl, result.amount);
      }
    }
    
    battle.heroes.forEach((h, i) => battleUI.updateHero(i, h));
    
    if (battle.state === 'victory') {
      audio.playVictory();
      const victoryResults = battle.getVictoryResults();
      applyBattleRewards(victoryResults);
      updateQuestBanner();
      battleUI.showVictory(victoryResults);
    }
  }
});

// ===== OFFLINE REWARDS =====
const offlineRewards = offlineCalc.calculateOfflineRewards(engine.state);
if (offlineRewards && (offlineRewards.gold > 0 || offlineRewards.exp > 0)) {
  offlineCalc.showWelcomeBack(offlineRewards);
}

// ===== CLAIM EXPEDITION (global handler) =====
window._claimExpedition = (index) => {
  const state = engine.state.player;
  const exp = state.expeditions[index];
  if (exp) {
    state.gold += exp.rewards.gold;
    if (state.heroes[exp.heroId]) {
      state.heroes[exp.heroId].exp = (state.heroes[exp.heroId].exp || 0) + exp.rewards.exp;
    }
    state.expeditions.splice(index, 1);
    engine.saveState();
    campUI.render();
  }
};

// ===== AUTO-SAVE =====
setInterval(() => {
  engine.state.lastSavedTimestamp = Date.now();
  engine.saveState();
}, 30000); // Auto-save every 30 seconds

// ===== HELPER =====
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== START GAME =====
engine.start();
console.log('🏰 RuneQuest Chronicles loaded!');
