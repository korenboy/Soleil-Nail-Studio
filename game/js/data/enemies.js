export const ENEMY_DATA = {
  // Zone 1: Goblin Forest (Nature theme)
  goblin_scout: { name: 'Goblin Scout', element: 'nature', hp: 60, atk: 12, def: 4, attackPattern: [2, 2], rewards: { gold: 30, exp: 15 }, color: '#44aa44', portraitSymbol: 'G', isBoss: false },
  goblin_warrior: { name: 'Goblin Warrior', element: 'nature', hp: 90, atk: 16, def: 8, attackPattern: [3, 2], rewards: { gold: 45, exp: 20 }, color: '#338833', portraitSymbol: 'G', isBoss: false },
  goblin_shaman: { name: 'Goblin Shaman', element: 'nature', hp: 70, atk: 20, def: 5, attackPattern: [3, 3, 2], rewards: { gold: 50, exp: 25 }, color: '#55cc55', portraitSymbol: 'S', isBoss: false },
  goblin_king: { name: 'Goblin King', element: 'nature', hp: 250, atk: 30, def: 15, attackPattern: [3, 2, 2, 1], rewards: { gold: 200, exp: 100 }, color: '#228822', portraitSymbol: '👑', isBoss: true },
  
  // Zone 2: Lava Caverns (Fire theme)
  fire_imp: { name: 'Fire Imp', element: 'fire', hp: 80, atk: 18, def: 5, attackPattern: [2, 1], rewards: { gold: 40, exp: 20 }, color: '#ff6644', portraitSymbol: 'I', isBoss: false },
  lava_golem: { name: 'Lava Golem', element: 'fire', hp: 140, atk: 14, def: 18, attackPattern: [4, 3], rewards: { gold: 55, exp: 30 }, color: '#cc3311', portraitSymbol: 'G', isBoss: false },
  flame_mage: { name: 'Flame Mage', element: 'fire', hp: 90, atk: 24, def: 6, attackPattern: [3, 2, 2], rewards: { gold: 60, exp: 35 }, color: '#ff4400', portraitSymbol: 'M', isBoss: false },
  inferno_dragon: { name: 'Inferno Dragon', element: 'fire', hp: 400, atk: 35, def: 18, attackPattern: [4, 2, 2, 1], rewards: { gold: 350, exp: 150 }, color: '#ff2200', portraitSymbol: '🐉', isBoss: true },
  
  // Zone 3: Frozen Peaks (Water theme)
  ice_sprite: { name: 'Ice Sprite', element: 'water', hp: 70, atk: 20, def: 6, attackPattern: [2, 2], rewards: { gold: 50, exp: 25 }, color: '#66aaff', portraitSymbol: 'S', isBoss: false },
  frost_wolf: { name: 'Frost Wolf', element: 'water', hp: 110, atk: 22, def: 10, attackPattern: [2, 1, 2], rewards: { gold: 65, exp: 35 }, color: '#4488cc', portraitSymbol: 'W', isBoss: false },
  ice_witch: { name: 'Ice Witch', element: 'water', hp: 100, atk: 28, def: 8, attackPattern: [3, 2], rewards: { gold: 70, exp: 40 }, color: '#88bbff', portraitSymbol: 'W', isBoss: false },
  frost_titan: { name: 'Frost Titan', element: 'water', hp: 500, atk: 40, def: 22, attackPattern: [4, 3, 2, 1], rewards: { gold: 500, exp: 200 }, color: '#2266cc', portraitSymbol: '❄', isBoss: true },
  
  // Zone 4: Sunlit Ruins (Light theme)
  light_guardian: { name: 'Light Guardian', element: 'light', hp: 130, atk: 20, def: 20, attackPattern: [3, 3, 2], rewards: { gold: 60, exp: 35 }, color: '#ddbb44', portraitSymbol: 'G', isBoss: false },
  sun_priest: { name: 'Sun Priest', element: 'light', hp: 100, atk: 26, def: 10, attackPattern: [3, 2], rewards: { gold: 75, exp: 40 }, color: '#ffcc44', portraitSymbol: 'P', isBoss: false },
  golden_sphinx: { name: 'Golden Sphinx', element: 'light', hp: 600, atk: 45, def: 25, attackPattern: [4, 3, 2, 1, 1], rewards: { gold: 600, exp: 250 }, color: '#ffaa00', portraitSymbol: '🦁', isBoss: true },
  
  // Zone 5: Shadow Realm (Dark theme)  
  shadow_imp: { name: 'Shadow Imp', element: 'dark', hp: 90, atk: 24, def: 6, attackPattern: [2, 1, 2], rewards: { gold: 70, exp: 40 }, color: '#8844cc', portraitSymbol: 'I', isBoss: false },
  dark_knight: { name: 'Dark Knight', element: 'dark', hp: 160, atk: 28, def: 22, attackPattern: [3, 2, 2], rewards: { gold: 85, exp: 50 }, color: '#6622aa', portraitSymbol: 'K', isBoss: false },
  void_wraith: { name: 'Void Wraith', element: 'dark', hp: 120, atk: 32, def: 8, attackPattern: [2, 2, 1], rewards: { gold: 90, exp: 55 }, color: '#9955ee', portraitSymbol: 'W', isBoss: false },
  shadow_lord: { name: 'Shadow Lord', element: 'dark', hp: 800, atk: 50, def: 28, attackPattern: [3, 2, 1, 1, 2], rewards: { gold: 800, exp: 350 }, color: '#440088', portraitSymbol: '👿', isBoss: true },
  
  // Zones 6-10: Add more with scaling stats
  // Zone 6: Volcanic Forge
  magma_elemental: { name: 'Magma Elemental', element: 'fire', hp: 180, atk: 30, def: 16, attackPattern: [3, 2, 1], rewards: { gold: 100, exp: 60 }, color: '#ff4400', portraitSymbol: 'E', isBoss: false },
  forge_master: { name: 'Forge Master', element: 'fire', hp: 1000, atk: 55, def: 30, attackPattern: [4, 2, 2, 1, 1], rewards: { gold: 1000, exp: 400 }, color: '#cc2200', portraitSymbol: '🔨', isBoss: true },
  
  // Zone 7: Enchanted Grove
  treant: { name: 'Ancient Treant', element: 'nature', hp: 220, atk: 25, def: 28, attackPattern: [4, 3, 2], rewards: { gold: 110, exp: 65 }, color: '#228822', portraitSymbol: 'T', isBoss: false },
  forest_queen: { name: 'Forest Queen', element: 'nature', hp: 1200, atk: 48, def: 35, attackPattern: [3, 3, 2, 1, 1], rewards: { gold: 1200, exp: 500 }, color: '#00aa44', portraitSymbol: '🌿', isBoss: true },
  
  // Zone 8: Abyssal Depths
  deep_leviathan: { name: 'Deep Leviathan', element: 'water', hp: 250, atk: 35, def: 20, attackPattern: [3, 2, 1], rewards: { gold: 130, exp: 75 }, color: '#1155bb', portraitSymbol: 'L', isBoss: false },
  kraken: { name: 'Kraken', element: 'water', hp: 1500, atk: 60, def: 32, attackPattern: [4, 2, 1, 1, 2], rewards: { gold: 1500, exp: 600 }, color: '#003388', portraitSymbol: '🐙', isBoss: true },
  
  // Zone 9: Celestial Tower
  angel_guard: { name: 'Celestial Guard', element: 'light', hp: 200, atk: 38, def: 25, attackPattern: [3, 2, 2], rewards: { gold: 150, exp: 85 }, color: '#ffdd66', portraitSymbol: 'A', isBoss: false },
  arch_seraph: { name: 'Arch Seraph', element: 'light', hp: 1800, atk: 65, def: 38, attackPattern: [4, 3, 1, 1, 1], rewards: { gold: 2000, exp: 800 }, color: '#ffcc00', portraitSymbol: '👼', isBoss: true },
  
  // Zone 10: The Void
  void_horror: { name: 'Void Horror', element: 'dark', hp: 300, atk: 42, def: 22, attackPattern: [2, 2, 1, 1], rewards: { gold: 200, exp: 100 }, color: '#550099', portraitSymbol: 'H', isBoss: false },
  void_emperor: { name: 'Void Emperor', element: 'dark', hp: 2500, atk: 75, def: 40, attackPattern: [3, 2, 1, 1, 1, 1], rewards: { gold: 3000, exp: 1200 }, color: '#220044', portraitSymbol: '💀', isBoss: true }
};
