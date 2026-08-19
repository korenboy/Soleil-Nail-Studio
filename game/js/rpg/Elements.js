export const ELEMENTS = {
  fire: {
    name: 'Fire',
    emoji: '🔴',
    color: '#ff4444',
    strongAgainst: 'nature',  // Fire > Nature
    weakAgainst: 'water'      // Fire < Water
  },
  water: {
    name: 'Water',
    emoji: '🔵', 
    color: '#4488ff',
    strongAgainst: 'fire',
    weakAgainst: 'nature'
  },
  nature: {
    name: 'Nature',
    emoji: '🟢',
    color: '#44cc44',
    strongAgainst: 'water',
    weakAgainst: 'fire'
  },
  light: {
    name: 'Light',
    emoji: '🟡',
    color: '#ffcc00',
    strongAgainst: 'dark',
    weakAgainst: 'dark'  // mutual
  },
  dark: {
    name: 'Dark',
    emoji: '🟣',
    color: '#9944ff',
    strongAgainst: 'light',
    weakAgainst: 'light'  // mutual
  }
};

export function getElementalMultiplier(attackerElement, defenderElement) {
  if (!attackerElement || !defenderElement) return 1;
  const el = ELEMENTS[attackerElement];
  if (!el) return 1;
  if (el.strongAgainst === defenderElement) return 1.5; // super effective
  if (el.weakAgainst === defenderElement) return 0.67;  // not very effective
  return 1;
}

export function getElementColor(element) {
  return ELEMENTS[element]?.color || '#cccccc';
}
