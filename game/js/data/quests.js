export const QUESTS = [
  {
    id: 'quest_1',
    title: 'Welcome to RuneQuest!',
    description: 'Complete the very first stage (1-1) to start your journey.',
    triggerEvent: 'stageCompleted',
    condition: (data) => data.zone === 0 && data.stage === 0, // 0-indexed stage 1-1
    rewards: { gold: 100, gems: 5 },
    nextQuest: 'quest_2'
  },
  {
    id: 'quest_2',
    title: 'Resource Gathering',
    description: 'Go to the Camp and upgrade your Gold Mine to Level 2.',
    triggerEvent: 'mineUpgraded',
    condition: (data) => data.newLevel >= 2,
    rewards: { gold: 50, gems: 0 },
    nextQuest: 'quest_3'
  },
  {
    id: 'quest_3',
    title: 'Power Up!',
    description: 'Go to the Heroes screen and level up the Warrior.',
    triggerEvent: 'heroLeveledUp',
    condition: (data) => data.heroId === 'warrior',
    rewards: { gold: 150, gems: 2 },
    nextQuest: 'quest_4'
  },
  {
    id: 'quest_4',
    title: 'The Journey Continues',
    description: 'Complete Stage 1-2 to delve deeper into the forest.',
    triggerEvent: 'stageCompleted',
    condition: (data) => data.zone === 0 && data.stage === 1,
    rewards: { gold: 150, gems: 5 },
    nextQuest: 'quest_5'
  },
  {
    id: 'quest_5',
    title: 'Unlocking New Potential',
    description: 'Level up any hero to Level 3.',
    triggerEvent: 'heroLeveledUp',
    condition: (data) => data.newLevel >= 3,
    rewards: { gold: 300, gems: 10 },
    nextQuest: 'quest_6'
  },
  {
    id: 'quest_6',
    title: 'First Boss',
    description: 'Complete Stage 1-5 to defeat the first boss.',
    triggerEvent: 'stageCompleted',
    condition: (data) => data.zone === 0 && data.stage === 4,
    rewards: { gold: 500, gems: 20 },
    nextQuest: null
  }
];
