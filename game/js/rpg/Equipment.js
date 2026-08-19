export const RARITY = {
  COMMON: { name: 'Common', color: '#aaaaaa', multiplier: 1 },
  UNCOMMON: { name: 'Uncommon', color: '#44cc44', multiplier: 1.3 },
  RARE: { name: 'Rare', color: '#4488ff', multiplier: 1.6 },
  EPIC: { name: 'Epic', color: '#9944ff', multiplier: 2.0 },
  LEGENDARY: { name: 'Legendary', color: '#ffaa00', multiplier: 2.5 }
};

export const EQUIPMENT_DATA = {
  // Weapons
  iron_sword: { name: 'Iron Sword', slot: 'weapon', rarity: 'COMMON', stats: { atk: 5 } },
  steel_blade: { name: 'Steel Blade', slot: 'weapon', rarity: 'UNCOMMON', stats: { atk: 10 } },
  flame_sword: { name: 'Flame Sword', slot: 'weapon', rarity: 'RARE', stats: { atk: 18, element: 'fire' } },
  frost_staff: { name: 'Frost Staff', slot: 'weapon', rarity: 'RARE', stats: { atk: 15, element: 'water' } },
  nature_bow: { name: 'Nature Bow', slot: 'weapon', rarity: 'RARE', stats: { atk: 16, element: 'nature' } },
  holy_mace: { name: 'Holy Mace', slot: 'weapon', rarity: 'EPIC', stats: { atk: 25, element: 'light' } },
  shadow_dagger: { name: 'Shadow Dagger', slot: 'weapon', rarity: 'EPIC', stats: { atk: 22, spd: 5 } },
  runic_greatsword: { name: 'Runic Greatsword', slot: 'weapon', rarity: 'LEGENDARY', stats: { atk: 40 } },
  
  // Armor
  leather_vest: { name: 'Leather Vest', slot: 'armor', rarity: 'COMMON', stats: { def: 5, hp: 20 } },
  chainmail: { name: 'Chainmail', slot: 'armor', rarity: 'UNCOMMON', stats: { def: 10, hp: 40 } },
  plate_armor: { name: 'Plate Armor', slot: 'armor', rarity: 'RARE', stats: { def: 18, hp: 80 } },
  dragon_scale: { name: 'Dragon Scale Armor', slot: 'armor', rarity: 'EPIC', stats: { def: 25, hp: 120 } },
  celestial_robe: { name: 'Celestial Robe', slot: 'armor', rarity: 'LEGENDARY', stats: { def: 15, hp: 200, atk: 15 } },
  
  // Accessories
  copper_ring: { name: 'Copper Ring', slot: 'accessory', rarity: 'COMMON', stats: { hp: 30 } },
  amulet_speed: { name: 'Amulet of Speed', slot: 'accessory', rarity: 'UNCOMMON', stats: { spd: 8 } },
  fire_pendant: { name: 'Fire Pendant', slot: 'accessory', rarity: 'RARE', stats: { atk: 12, element: 'fire' } },
  ice_crown: { name: 'Ice Crown', slot: 'accessory', rarity: 'EPIC', stats: { def: 15, hp: 60, element: 'water' } },
  void_amulet: { name: 'Void Amulet', slot: 'accessory', rarity: 'LEGENDARY', stats: { atk: 20, def: 20, hp: 100 } }
};

export function generateRandomEquipment(tierChances = { COMMON: 0.5, UNCOMMON: 0.3, RARE: 0.15, EPIC: 0.04, LEGENDARY: 0.01 }) {
  // Roll for rarity
  const roll = Math.random();
  let cumulative = 0;
  let selectedRarity = 'COMMON';
  for (const [rarity, chance] of Object.entries(tierChances)) {
    cumulative += chance;
    if (roll < cumulative) { selectedRarity = rarity; break; }
  }
  
  // Pick random equipment of that rarity
  const candidates = Object.entries(EQUIPMENT_DATA).filter(([_, eq]) => eq.rarity === selectedRarity);
  if (candidates.length === 0) return null;
  const [id, data] = candidates[Math.floor(Math.random() * candidates.length)];
  
  return {
    instanceId: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    equipmentId: id,
    ...data,
    rarityData: RARITY[selectedRarity]
  };
}
