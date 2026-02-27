import { SocialPost } from '@/types/workout';

export const MOCK_SOCIAL_FEED: SocialPost[] = [
  {
    id: 's1',
    userName: 'Haikal M.',
    type: 'workout',
    content: 'Just crushed a heavy chest day at KABS UNDERGROUND. Bench is feeling strong!',
    timestamp: '2h ago',
    likes: 24,
    volume: 12450,
  },
  {
    id: 's2',
    userName: 'Sara K.',
    type: 'pr',
    content: 'NEW PR! Hit 100kg on Barbell Squat for 3 reps. Hard work pays off!',
    timestamp: '4h ago',
    likes: 47,
  },
  {
    id: 's3',
    userName: 'Omar R.',
    type: 'streak',
    content: 'Just hit a 15-day training streak! Consistency is key.',
    timestamp: '6h ago',
    likes: 31,
  },
  {
    id: 's4',
    userName: 'Abu Ali',
    type: 'workout',
    content: 'Back and biceps session done. 18 sets, feeling pumped.',
    timestamp: '8h ago',
    likes: 19,
    volume: 9870,
  },
  {
    id: 's5',
    userName: 'Nadia F.',
    type: 'pr',
    content: 'Finally got 60kg on Overhead Press! Shoulder strength is going up.',
    timestamp: '12h ago',
    likes: 38,
  },
  {
    id: 's6',
    userName: 'Khalid B.',
    type: 'workout',
    content: 'CrossFit WOD complete. 23 min AMRAP - legs are toast!',
    timestamp: '1d ago',
    likes: 15,
    volume: 7200,
  },
  {
    id: 's7',
    userName: 'Layla S.',
    type: 'streak',
    content: '30-day streak unlocked! This is the longest I\'ve ever been consistent.',
    timestamp: '1d ago',
    likes: 62,
  },
];

export const MOCK_FRIENDS = [
  { id: 'f1', name: 'Haikal M.', status: 'Trained today' },
  { id: 'f2', name: 'Sara K.', status: 'Last seen 2h ago' },
  { id: 'f3', name: 'Omar R.', status: 'On a 15-day streak' },
  { id: 'f4', name: 'Abu Ali', status: 'Trained today' },
  { id: 'f5', name: 'Nadia F.', status: 'Last seen yesterday' },
  { id: 'f6', name: 'Khalid B.', status: 'Trained today' },
];

export const TRENDING_ROUTINES = [
  { id: 'tr1', name: 'Morning Burn', creator: 'Haikal M.', uses: 342 },
  { id: 'tr2', name: 'Full Body Friday', creator: 'Sara K.', uses: 289 },
  { id: 'tr3', name: 'The Gauntlet', creator: 'Abu Ali', uses: 214 },
];
