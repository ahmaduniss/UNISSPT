import { PerformanceMetric, SportKey } from '@/types/workout';

export const SPORTS: { key: SportKey; label: string }[] = [
  { key: 'basketball', label: 'Basketball' },
  { key: 'track_field', label: 'Track & Field' },
  { key: 'football', label: 'Football' },
  { key: 'general', label: 'General' },
];

export const DEFAULT_METRICS: Record<SportKey, PerformanceMetric[]> = {
  basketball: [
    { id: 'bb_vertical', name: 'Max Vertical Jump', unit: 'in' },
    { id: 'bb_standing_reach', name: 'Standing Reach', unit: 'in' },
    { id: 'bb_lane_agility', name: 'Lane Agility Drill', unit: 'sec', lowerIsBetter: true },
    { id: 'bb_sprint_34', name: '3/4 Court Sprint', unit: 'sec', lowerIsBetter: true },
  ],
  track_field: [
    { id: 'tf_100m', name: '100 Meter', unit: 'sec', lowerIsBetter: true },
    { id: 'tf_200m', name: '200 Meter', unit: 'sec', lowerIsBetter: true },
    { id: 'tf_400m', name: '400 Meter', unit: 'sec', lowerIsBetter: true },
    { id: 'tf_long_jump', name: 'Long Jump', unit: 'ft' },
    { id: 'tf_shot_put', name: 'Shot Put', unit: 'ft' },
  ],
  football: [
    { id: 'fb_40yd', name: '40-Yard Dash', unit: 'sec', lowerIsBetter: true },
    { id: 'fb_bench', name: 'Bench Press Reps (185 lb)', unit: 'reps' },
    { id: 'fb_vertical', name: 'Vertical Jump', unit: 'in' },
    { id: 'fb_broad_jump', name: 'Broad Jump', unit: 'in' },
    { id: 'fb_3cone', name: '3-Cone Drill', unit: 'sec', lowerIsBetter: true },
  ],
  general: [
    { id: 'gen_vertical', name: 'Vertical Jump', unit: 'in' },
    { id: 'gen_40yd', name: '40-Yard Dash', unit: 'sec', lowerIsBetter: true },
    { id: 'gen_mile', name: '1 Mile Run', unit: 'min', lowerIsBetter: true },
  ],
};

export function sportLabel(sport: SportKey): string {
  return SPORTS.find((s) => s.key === sport)?.label ?? 'General';
}
