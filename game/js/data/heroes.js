export const HERO_DATA = {
  warrior: {
    name: 'Thorin',
    title: 'Iron Guardian',
    element: 'fire',
    baseStats: { hp: 140, atk: 22, def: 20, spd: 8 },
    skill: { name: 'Flame Strike', manaCost: 100, description: 'Deals massive fire damage to all enemies', effectType: 'damage_all', power: 2.5 },
    portraitColors: { primary: '#ff4444', secondary: '#cc2222', accent: '#ffaa00' },
    unlockZone: 0 // starter
  },
  mage: {
    name: 'Lyra',
    title: 'Frost Weaver',
    element: 'water',
    baseStats: { hp: 90, atk: 30, def: 10, spd: 12 },
    skill: { name: 'Blizzard', manaCost: 100, description: 'Freezes all enemies with devastating ice damage', effectType: 'damage_all', power: 3.0 },
    portraitColors: { primary: '#4488ff', secondary: '#2266cc', accent: '#88ccff' },
    unlockZone: 0
  },
  healer: {
    name: 'Aria',
    title: 'Light Priestess',
    element: 'light',
    baseStats: { hp: 110, atk: 18, def: 14, spd: 10 },
    skill: { name: 'Divine Heal', manaCost: 80, description: 'Restores health to all allies', effectType: 'heal_all', power: 2.0 },
    portraitColors: { primary: '#ffcc00', secondary: '#cc9900', accent: '#ffffff' },
    unlockZone: 0
  },
  ranger: {
    name: 'Sylva',
    title: 'Windwalker',
    element: 'nature',
    baseStats: { hp: 100, atk: 28, def: 12, spd: 15 },
    skill: { name: 'Arrow Storm', manaCost: 90, description: 'Rains arrows on a single enemy for massive damage', effectType: 'damage_single', power: 5.0 },
    portraitColors: { primary: '#44cc44', secondary: '#228822', accent: '#88ff88' },
    unlockZone: 2
  },
  paladin: {
    name: 'Aldric',
    title: 'Holy Knight',
    element: 'light',
    baseStats: { hp: 160, atk: 20, def: 25, spd: 6 },
    skill: { name: 'Holy Shield', manaCost: 100, description: 'Boosts all allies ATK by 50%', effectType: 'buff_team', power: 50 },
    portraitColors: { primary: '#ffdd44', secondary: '#ccaa00', accent: '#ffffff' },
    unlockZone: 3
  },
  assassin: {
    name: 'Shade',
    title: 'Void Stalker',
    element: 'dark',
    baseStats: { hp: 80, atk: 35, def: 8, spd: 18 },
    skill: { name: 'Shadow Strike', manaCost: 80, description: 'Devastating critical hit on one enemy', effectType: 'damage_single', power: 6.0 },
    portraitColors: { primary: '#9944ff', secondary: '#6622cc', accent: '#cc88ff' },
    unlockZone: 4
  },
  necromancer: {
    name: 'Mortis',
    title: 'Soul Reaper',
    element: 'dark',
    baseStats: { hp: 95, atk: 32, def: 11, spd: 11 },
    skill: { name: 'Soul Drain', manaCost: 100, description: 'Damages all enemies and heals self', effectType: 'damage_all', power: 2.0 },
    portraitColors: { primary: '#7722cc', secondary: '#440088', accent: '#aa44ff' },
    unlockZone: 5
  },
  berserker: {
    name: 'Grok',
    title: 'Fury Incarnate',
    element: 'fire',
    baseStats: { hp: 120, atk: 38, def: 5, spd: 14 },
    skill: { name: 'Berserk Rage', manaCost: 80, description: 'Massive single-target damage, takes some self-damage', effectType: 'damage_single', power: 7.0 },
    portraitColors: { primary: '#ff6600', secondary: '#cc3300', accent: '#ffcc00' },
    unlockZone: 6
  },
  druid: {
    name: 'Oakhart',
    title: 'Ancient One',
    element: 'nature',
    baseStats: { hp: 130, atk: 20, def: 18, spd: 9 },
    skill: { name: 'Regrowth', manaCost: 90, description: 'Heals all allies and boosts DEF', effectType: 'heal_all', power: 2.5 },
    portraitColors: { primary: '#33aa33', secondary: '#116611', accent: '#88ff44' },
    unlockZone: 7
  },
  elementalist: {
    name: 'Prism',
    title: 'Arcane Conduit',
    element: 'water',
    baseStats: { hp: 85, atk: 35, def: 9, spd: 13 },
    skill: { name: 'Elemental Surge', manaCost: 100, description: 'Devastating damage to all enemies, ignoring defense', effectType: 'damage_all', power: 3.5 },
    portraitColors: { primary: '#2266ff', secondary: '#0044cc', accent: '#66ccff' },
    unlockZone: 8
  }
};
