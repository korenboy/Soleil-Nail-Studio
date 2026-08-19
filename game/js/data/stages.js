export const ZONES = [
  { id: 'zone1', name: 'Goblin Forest', theme: 'nature', color: '#44cc44', description: 'A dark forest infested with goblins' },
  { id: 'zone2', name: 'Lava Caverns', theme: 'fire', color: '#ff4444', description: 'Deep caves filled with molten lava' },
  { id: 'zone3', name: 'Frozen Peaks', theme: 'water', color: '#4488ff', description: 'Ice-covered mountains' },
  { id: 'zone4', name: 'Sunlit Ruins', theme: 'light', color: '#ffcc00', description: 'Ancient ruins bathed in golden light' },
  { id: 'zone5', name: 'Shadow Realm', theme: 'dark', color: '#9944ff', description: 'A dimension of pure darkness' },
  { id: 'zone6', name: 'Volcanic Forge', theme: 'fire', color: '#ff6600', description: 'Where legendary weapons are born' },
  { id: 'zone7', name: 'Enchanted Grove', theme: 'nature', color: '#33aa33', description: 'An ancient magical forest' },
  { id: 'zone8', name: 'Abyssal Depths', theme: 'water', color: '#2255cc', description: 'The deepest ocean trenches' },
  { id: 'zone9', name: 'Celestial Tower', theme: 'light', color: '#ffdd44', description: 'A tower reaching the heavens' },
  { id: 'zone10', name: 'The Void', theme: 'dark', color: '#440088', description: 'The end of all things' }
];

// Generate stages for each zone
function generateStages(zoneIndex, zoneId, regularEnemies, bossEnemy) {
  const stages = [];
  const levelScale = 1 + zoneIndex * 0.5; // difficulty scaling per zone
  
  for (let i = 1; i <= 10; i++) {
    const stageId = `${zoneId}_stage${i}`;
    let enemies;
    
    if (i === 10) {
      // Boss stage: 1 boss
      enemies = [{ id: bossEnemy, levelScale: levelScale * 1.2 }];
    } else if (i % 5 === 0) {
      // Mini-boss: 1 stronger regular + 1 regular
      enemies = [
        { id: regularEnemies[i % regularEnemies.length], levelScale: levelScale * 1.5 },
        { id: regularEnemies[(i + 1) % regularEnemies.length], levelScale }
      ];
    } else if (i > 5) {
      // Harder stages: 3 enemies
      enemies = [
        { id: regularEnemies[i % regularEnemies.length], levelScale },
        { id: regularEnemies[(i + 1) % regularEnemies.length], levelScale },
        { id: regularEnemies[(i + 2) % regularEnemies.length], levelScale }
      ];
    } else {
      // Early stages: 1-2 enemies
      enemies = i < 3 
        ? [{ id: regularEnemies[0], levelScale }]
        : [
            { id: regularEnemies[i % regularEnemies.length], levelScale },
            { id: regularEnemies[(i + 1) % regularEnemies.length], levelScale }
          ];
    }
    
    stages.push({ id: stageId, zone: zoneId, stageNum: i, enemies, isBoss: i === 10 });
  }
  return stages;
}

export const STAGES = {
  ...Object.fromEntries(generateStages(0, 'zone1', ['goblin_scout', 'goblin_warrior', 'goblin_shaman'], 'goblin_king').map(s => [s.id, s])),
  ...Object.fromEntries(generateStages(1, 'zone2', ['fire_imp', 'lava_golem', 'flame_mage'], 'inferno_dragon').map(s => [s.id, s])),
  ...Object.fromEntries(generateStages(2, 'zone3', ['ice_sprite', 'frost_wolf', 'ice_witch'], 'frost_titan').map(s => [s.id, s])),
  ...Object.fromEntries(generateStages(3, 'zone4', ['light_guardian', 'sun_priest', 'light_guardian'], 'golden_sphinx').map(s => [s.id, s])),
  ...Object.fromEntries(generateStages(4, 'zone5', ['shadow_imp', 'dark_knight', 'void_wraith'], 'shadow_lord').map(s => [s.id, s])),
  ...Object.fromEntries(generateStages(5, 'zone6', ['magma_elemental', 'fire_imp', 'lava_golem'], 'forge_master').map(s => [s.id, s])),
  ...Object.fromEntries(generateStages(6, 'zone7', ['treant', 'goblin_shaman', 'treant'], 'forest_queen').map(s => [s.id, s])),
  ...Object.fromEntries(generateStages(7, 'zone8', ['deep_leviathan', 'ice_sprite', 'frost_wolf'], 'kraken').map(s => [s.id, s])),
  ...Object.fromEntries(generateStages(8, 'zone9', ['angel_guard', 'light_guardian', 'sun_priest'], 'arch_seraph').map(s => [s.id, s])),
  ...Object.fromEntries(generateStages(9, 'zone10', ['void_horror', 'shadow_imp', 'void_wraith'], 'void_emperor').map(s => [s.id, s]))
};

// Helper: get stages for a zone
export function getZoneStages(zoneId) {
  return Object.values(STAGES).filter(s => s.zone === zoneId).sort((a, b) => a.stageNum - b.stageNum);
}

// Helper: get next unlocked stage
export function getNextStage(stagesCompleted) {
  for (const zone of ZONES) {
    const stages = getZoneStages(zone.id);
    for (const stage of stages) {
      if (!stagesCompleted[stage.id]) return stage;
    }
  }
  return null; // all completed
}

// Helper: is stage unlocked?
export function isStageUnlocked(stageId, stagesCompleted) {
  const stage = STAGES[stageId];
  if (!stage) return false;
  if (stage.stageNum === 1) {
    // First stage of a zone: check if previous zone boss is beaten
    const zoneIdx = ZONES.findIndex(z => z.id === stage.zone);
    if (zoneIdx === 0) return true;
    const prevZone = ZONES[zoneIdx - 1];
    return !!stagesCompleted[`${prevZone.id}_stage10`];
  }
  // Other stages: previous stage must be completed
  const prevStageId = `${stage.zone}_stage${stage.stageNum - 1}`;
  return !!stagesCompleted[prevStageId];
}
