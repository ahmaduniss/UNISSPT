import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const TRAINER_EMAIL = 'trainer@uniss.app';
const TRAINER_PASSWORD = 'password';
const TRAINER_NAME = 'Coach Younis';

const WORKOUT_TEMPLATES = [
  {
    name: 'Push Day',
    exercises: [
      { exerciseId: 'bench-press', exerciseName: 'Barbell Bench Press', sets: [
        { weight: 100, reps: 5 }, { weight: 100, reps: 5 }, { weight: 95, reps: 6 }, { weight: 90, reps: 8 },
      ]},
      { exerciseId: 'shoulder-press', exerciseName: 'Overhead Press', sets: [
        { weight: 70, reps: 6 }, { weight: 70, reps: 6 }, { weight: 65, reps: 8 },
      ]},
      { exerciseId: 'tricep-pushdown', exerciseName: 'Tricep Pushdown', sets: [
        { weight: 40, reps: 12 }, { weight: 40, reps: 12 }, { weight: 35, reps: 15 },
      ]},
    ],
  },
  {
    name: 'Pull Day',
    exercises: [
      { exerciseId: 'deadlift', exerciseName: 'Deadlift', sets: [
        { weight: 160, reps: 3 }, { weight: 160, reps: 3 }, { weight: 150, reps: 5 },
      ]},
      { exerciseId: 'pullup', exerciseName: 'Pull-ups', sets: [
        { weight: 0, reps: 10 }, { weight: 0, reps: 9 }, { weight: 0, reps: 8 },
      ]},
      { exerciseId: 'cable-row', exerciseName: 'Cable Row', sets: [
        { weight: 65, reps: 10 }, { weight: 65, reps: 10 }, { weight: 60, reps: 12 },
      ]},
    ],
  },
  {
    name: 'Leg Day',
    exercises: [
      { exerciseId: 'squat', exerciseName: 'Barbell Squat', sets: [
        { weight: 140, reps: 5 }, { weight: 140, reps: 5 }, { weight: 130, reps: 6 }, { weight: 120, reps: 8 },
      ]},
      { exerciseId: 'leg-press', exerciseName: 'Leg Press', sets: [
        { weight: 200, reps: 10 }, { weight: 200, reps: 10 }, { weight: 180, reps: 12 },
      ]},
      { exerciseId: 'rdl', exerciseName: 'Romanian Deadlift', sets: [
        { weight: 100, reps: 10 }, { weight: 100, reps: 10 }, { weight: 95, reps: 12 },
      ]},
    ],
  },
];

function calcVolume(exercises: typeof WORKOUT_TEMPLATES[0]['exercises']) {
  return exercises.reduce((total, ex) =>
    total + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0);
}

const WORKOUT_HOURS = [6, 7, 7, 8, 12, 18, 18, 19, 19, 20, 20, 21];

function workoutDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(WORKOUT_HOURS[Math.floor(Math.random() * WORKOUT_HOURS.length)],
    Math.floor(Math.random() * 60), 0, 0);
  return d.toISOString();
}

interface ClientConfig {
  name: string;
  goal: string;
  workoutPattern: { daysAgo: number; templateIdx: number }[];
}

const CLIENTS: ClientConfig[] = [
  {
    name: 'Haikal M.',
    goal: 'Build strength — powerlifting focus',
    workoutPattern: [
      { daysAgo: 2, templateIdx: 0 }, { daysAgo: 5, templateIdx: 2 },
      { daysAgo: 8, templateIdx: 1 }, { daysAgo: 11, templateIdx: 0 },
      { daysAgo: 14, templateIdx: 2 }, { daysAgo: 17, templateIdx: 1 },
      { daysAgo: 20, templateIdx: 0 },
    ],
  },
  {
    name: 'Sara K.',
    goal: 'Fat loss + conditioning',
    workoutPattern: [
      { daysAgo: 1, templateIdx: 2 }, { daysAgo: 4, templateIdx: 0 },
      { daysAgo: 6, templateIdx: 1 }, { daysAgo: 9, templateIdx: 2 },
      { daysAgo: 12, templateIdx: 0 }, { daysAgo: 15, templateIdx: 1 },
    ],
  },
  {
    name: 'Omar R.',
    goal: 'Hypertrophy — upper body',
    workoutPattern: [
      { daysAgo: 3, templateIdx: 0 }, { daysAgo: 7, templateIdx: 1 },
      { daysAgo: 10, templateIdx: 0 }, { daysAgo: 13, templateIdx: 2 },
    ],
  },
  {
    name: 'Nadia F.',
    goal: 'General fitness',
    workoutPattern: [
      { daysAgo: 6, templateIdx: 2 }, { daysAgo: 13, templateIdx: 0 },
    ],
  },
];

async function seed() {
  console.log('🌱 Starting seed...\n');

  const { data: created, error: createError } = await db.auth.admin.createUser({
    email: TRAINER_EMAIL,
    password: TRAINER_PASSWORD,
    email_confirm: true,
  });

  let trainerId = created?.user?.id;
  if (createError && !createError.message.includes('already registered')) {
    console.error('❌ Failed to create trainer:', createError.message);
    return;
  }
  if (!trainerId) {
    const { data: list } = await db.auth.admin.listUsers();
    trainerId = list?.users.find((u) => u.email === TRAINER_EMAIL)?.id;
  }
  if (!trainerId) {
    console.error('❌ Could not resolve trainer id');
    return;
  }

  await db.from('profiles').upsert({ id: trainerId, name: TRAINER_NAME });
  console.log(`✅ Trainer: ${TRAINER_NAME} (${TRAINER_EMAIL} / ${TRAINER_PASSWORD})`);

  await db.from('clients').delete().eq('trainer_id', trainerId);

  for (const clientConfig of CLIENTS) {
    const { data: client, error: clientError } = await db
      .from('clients')
      .insert({
        trainer_id: trainerId,
        name: clientConfig.name,
        goal: clientConfig.goal,
        status: 'active',
      })
      .select()
      .single();

    if (clientError || !client) {
      console.error(`❌ Failed to create client ${clientConfig.name}:`, clientError?.message);
      continue;
    }

    let totalVolume = 0;
    for (const { daysAgo, templateIdx } of clientConfig.workoutPattern) {
      const template = WORKOUT_TEMPLATES[templateIdx];
      const volume = calcVolume(template.exercises);
      const { error } = await db.from('workouts').insert({
        id: crypto.randomUUID(),
        client_id: client.id,
        trainer_id: trainerId,
        name: template.name,
        date: workoutDate(daysAgo),
        duration: Math.floor(Math.random() * 1800 + 2400),
        total_volume: volume,
        exercises: template.exercises,
      });
      if (!error) totalVolume += volume;
    }

    console.log(`✅ Client: ${clientConfig.name} — ${clientConfig.workoutPattern.length} workouts, ${totalVolume.toLocaleString()} kg volume`);
  }

  console.log('\n✨ Seed complete! Log in with:');
  console.log(`   ${TRAINER_EMAIL} / ${TRAINER_PASSWORD}\n`);
}

seed().catch(console.error);
