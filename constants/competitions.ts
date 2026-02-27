import { Competition } from '@/types/workout';

const COMPETITION_TEMPLATES: Omit<Competition, 'id' | 'date' | 'userProgress' | 'isCompleted'>[] = [
  {
    type: 'daily_volume',
    title: 'Volume Crusher',
    description: 'Lift 5,000 kg total volume today',
    target: 5000,
  },
  {
    type: 'daily_volume',
    title: 'Heavy Hitter',
    description: 'Lift 10,000 kg total volume today',
    target: 10000,
  },
  {
    type: 'daily_sets',
    title: 'Set Stacker',
    description: 'Complete 20 sets today',
    target: 20,
  },
  {
    type: 'daily_sets',
    title: 'Endurance Test',
    description: 'Complete 30 sets today',
    target: 30,
  },
  {
    type: 'cardio',
    title: 'Cardio King',
    description: 'Do 15 minutes of cardio exercises',
    target: 15,
  },
  {
    type: 'cardio',
    title: 'Heart Pumper',
    description: 'Do 30 minutes of cardio exercises',
    target: 30,
  },
];

export function generateDailyCompetitions(): Competition[] {
  const today = new Date().toISOString().split('T')[0];
  const seed = today.split('-').reduce((s, n) => s + parseInt(n), 0);

  const volumeComps = COMPETITION_TEMPLATES.filter((c) => c.type === 'daily_volume');
  const setComps = COMPETITION_TEMPLATES.filter((c) => c.type === 'daily_sets');
  const cardioComps = COMPETITION_TEMPLATES.filter((c) => c.type === 'cardio');

  return [
    {
      ...volumeComps[seed % volumeComps.length],
      id: `comp_vol_${today}`,
      date: today,
      userProgress: 0,
      isCompleted: false,
    },
    {
      ...setComps[seed % setComps.length],
      id: `comp_set_${today}`,
      date: today,
      userProgress: 0,
      isCompleted: false,
    },
    {
      ...cardioComps[seed % cardioComps.length],
      id: `comp_cardio_${today}`,
      date: today,
      userProgress: 0,
      isCompleted: false,
    },
  ];
}
