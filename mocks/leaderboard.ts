import { LeaderboardEntry } from '@/types/workout';

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'l1', name: 'Haikal M.', totalVolume: 187500, streak: 23, visits: 89, sport: 'Powerlifting' },
  { id: 'l2', name: 'Abu Ali', totalVolume: 172300, streak: 31, visits: 112, sport: 'Bodybuilding' },
  { id: 'l3', name: 'Sara K.', totalVolume: 156800, streak: 18, visits: 76, sport: 'CrossFit' },
  { id: 'l4', name: 'Omar R.', totalVolume: 143200, streak: 15, visits: 68, sport: 'Powerlifting' },
  { id: 'l5', name: 'Nadia F.', totalVolume: 134500, streak: 12, visits: 54, sport: 'Bodybuilding' },
  { id: 'l6', name: 'Khalid B.', totalVolume: 128900, streak: 9, visits: 47, sport: 'CrossFit' },
  { id: 'l7', name: 'Layla S.', totalVolume: 119400, streak: 7, visits: 42, sport: 'Bodybuilding' },
  { id: 'l8', name: 'Tariq W.', totalVolume: 112700, streak: 21, visits: 63, sport: 'Powerlifting' },
  { id: 'l9', name: 'Zain A.', totalVolume: 105200, streak: 5, visits: 35, sport: 'CrossFit' },
  { id: 'l10', name: 'Mira H.', totalVolume: 98600, streak: 11, visits: 39, sport: 'Bodybuilding' },
  { id: 'l11', name: 'Faris D.', totalVolume: 91300, streak: 4, visits: 28, sport: 'Powerlifting' },
  { id: 'l12', name: 'Amina J.', totalVolume: 87100, streak: 8, visits: 31, sport: 'CrossFit' },
];

export const SPORT_CATEGORIES = ['All', 'Powerlifting', 'Bodybuilding', 'CrossFit'] as const;
