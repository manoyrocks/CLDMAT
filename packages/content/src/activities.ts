// Home Music Activity Library (M1). Source: sub-study §7.1, §7.2, §4. REQ-M1-01, REQ-M1-02, REQ-M1-03.
import type { Activity, EvidenceMeta, Note, Tier } from './types';

export const REVIEWER = 'Evaluator agent (EV)';
export const REVIEWED_AT = '2026-09-23';

export function meta(claimIds: string[], sections: string[], tier: Tier = 'Emerging', version = '1.0.0'): EvidenceMeta {
  return { version, sections, claimIds, tier, reviewer: REVIEWER, reviewedAt: REVIEWED_AT, clinicalReview: 'pending' };
}

// Public-domain melodies (C major, MIDI note numbers; 0 = rest).
const C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, C5 = 72, G3 = 55;
export const TWINKLE: Note[] = [
  [C4, 1], [C4, 1], [G4, 1], [G4, 1], [A4, 1], [A4, 1], [G4, 2],
  [F4, 1], [F4, 1], [E4, 1], [E4, 1], [D4, 1], [D4, 1], [C4, 2],
];
/** Twinkle with the last note left out, so the child can fill it in. */
export const TWINKLE_GAP: Note[] = [...TWINKLE.slice(0, -1), [0, 2]];
export const ROW_BOAT: Note[] = [
  [C4, 1], [C4, 1], [C4, 0.67], [D4, 0.33], [E4, 1], [E4, 0.67], [D4, 0.33], [E4, 0.67], [F4, 0.33], [G4, 2],
  [C5, 0.33], [C5, 0.33], [C5, 0.33], [G4, 0.33], [G4, 0.33], [G4, 0.33], [E4, 0.33], [E4, 0.33], [E4, 0.33],
  [C4, 0.33], [C4, 0.33], [C4, 0.33], [G4, 0.67], [F4, 0.33], [E4, 0.67], [D4, 0.33], [C4, 2],
];
export const MARY_LAMB: Note[] = [
  [E4, 1], [D4, 1], [C4, 1], [D4, 1], [E4, 1], [E4, 1], [E4, 2], [D4, 1], [D4, 1], [D4, 2], [E4, 1], [G4, 1], [G4, 2],
  [E4, 1], [D4, 1], [C4, 1], [D4, 1], [E4, 1], [E4, 1], [E4, 1], [E4, 1], [D4, 1], [D4, 1], [E4, 1], [D4, 1], [C4, 3],
];
export const HOT_CROSS_BUNS: Note[] = [
  [E4, 1], [D4, 1], [C4, 2], [E4, 1], [D4, 1], [C4, 2],
  [C4, 0.5], [C4, 0.5], [C4, 0.5], [C4, 0.5], [D4, 0.5], [D4, 0.5], [D4, 0.5], [D4, 0.5], [E4, 1], [D4, 1], [C4, 2],
];
export const FRERE_JACQUES: Note[] = [
  [C4, 1], [D4, 1], [E4, 1], [C4, 1], [C4, 1], [D4, 1], [E4, 1], [C4, 1],
  [E4, 1], [F4, 1], [G4, 2], [E4, 1], [F4, 1], [G4, 2],
  [C4, 1], [G3, 1], [C4, 2], [C4, 1], [G3, 1], [C4, 2],
];
export const OLD_MACDONALD: Note[] = [
  [C4, 1], [C4, 1], [C4, 1], [G3, 1], [A4 - 12, 1], [A4 - 12, 1], [G3, 2],
  [E4, 1], [E4, 1], [D4, 1], [D4, 1], [C4, 3], [0, 1],
];
/** "Ready, steady… GO!": rising notes, a long pause, then one note. */
const READY_GO: Note[] = [[C4, 1], [E4, 1], [G4, 1], [0, 3], [C5, 1]];

export const ACTIVITIES: readonly Activity[] = [
  {
    ...meta(['C-005', 'C-010', 'C-029'], ['§7.1', '§4', '§6.2']),
    id: 'act-drum-conversation', title: 'Drum conversation', goal: 'joint-attention',
    summary: 'Take turns on a drum, like a conversation without words.',
    ageBands: ['2-4', '5-7', '8-12'], communication: ['speaking', 'some-words', 'minimally-verbal'],
    minutes: 4, energy: 'active',
    steps: [
      'Sit facing your child with a drum, a box or a pot between you.',
      'First, copy whatever your child plays: taps, scratches or pats.',
      'Then tap a short pattern of 2–3 beats.',
      'Pause and wait for your child to reply.',
      'Copy their reply, then take your turn again.',
    ],
    pauseCue: 'Pause… wait 5–10 seconds for any reply: a tap, a look or a sound.',
    cueCards: ['Copy your child first', 'Tap 2–3 beats', 'Pause 5–10 s', 'Copy their reply'],
    tips: ['Keep pauses long. Waiting is the teaching moment.', 'Let your child play loud if they want to. Being in control of loud sounds can feel safe.'],
    example: { kind: 'drum', bpm: 90, pattern: [1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0] },
    learnId: 'edu-structured-mt',
  },
  {
    ...meta(['C-005', 'C-018'], ['§7.1', '§4']),
    id: 'act-copy-cat', title: 'Copy-cat music', goal: 'joint-attention',
    summary: 'You copy your child’s sounds and moves, so they lead the music.',
    ageBands: ['2-4', '5-7'], communication: ['speaking', 'some-words', 'minimally-verbal'],
    minutes: 3, energy: 'calm',
    steps: [
      'Offer two instruments, such as a shaker and a drum, or two spoons.',
      'Watch what your child does with sound or movement.',
      'Copy it back, at the same speed and loudness.',
      'Pause and see if they notice and do it again.',
    ],
    pauseCue: 'Pause after copying. Wait for your child to look or play again.',
    cueCards: ['Watch first', 'Copy exactly', 'Pause and wait'],
    tips: ['There is no wrong way to play.', 'If your child walks away, that is fine. Try again later.'],
    example: { kind: 'drum', bpm: 80, pattern: [1, 0, 1, 0, 0, 0, 0, 0] },
    learnId: 'edu-improvisational-mt',
  },
  {
    ...meta(['C-010'], ['§7.1']),
    id: 'act-ready-steady-go', title: 'Ready, steady… GO!', goal: 'anticipation',
    summary: 'Build up excitement, pause, then GO! Great for requesting.',
    ageBands: ['2-4', '5-7'], communication: ['speaking', 'some-words', 'minimally-verbal'],
    minutes: 3, energy: 'active',
    steps: [
      'Pick something your child enjoys: a bounce, a spin, a drum roll or bubbles.',
      'Say or sing "Ready… steady…" slowly.',
      'Pause before "GO!" and wait.',
      'When your child looks, makes a sound or says "go", do the fun thing straight away.',
    ],
    pauseCue: 'Pause before "GO!" Wait for a look, a sound or a word.',
    cueCards: ['Ready…', 'Steady…', 'PAUSE and wait', 'GO!'],
    tips: ['The pause is the teaching moment.', 'Accept any signal: a look, a reach or a sound all count.'],
    example: { kind: 'melody', bpm: 80, notes: READY_GO, timbre: 'soft' },
    learnId: 'edu-structured-mt',
  },
  {
    ...meta(['C-010', 'C-011'], ['§7.1']),
    id: 'act-stop-go-shakers', title: 'Stop-and-go shakers', goal: 'anticipation',
    summary: 'Shake while the music plays, freeze when it stops.',
    ageBands: ['2-4', '5-7', '8-12'], communication: ['speaking', 'some-words', 'minimally-verbal'],
    minutes: 3, energy: 'active',
    steps: [
      'Give everyone a shaker (a sealed bottle of rice works).',
      'Play or sing a song and shake together.',
      'Stop suddenly and freeze. Keep the stop quiet, never a loud bang.',
      'Wait, then start again when your child signals.',
    ],
    pauseCue: 'Freeze and wait for your child to ask for more: a look, a shake or a word.',
    cueCards: ['Shake together', 'Freeze', 'Wait for a signal', 'Start again'],
    tips: ['Keep the volume moderate.', 'Let your child be the one who says "stop" and "go" too.'],
    example: { kind: 'melody', bpm: 100, notes: HOT_CROSS_BUNS, timbre: 'soft' },
    learnId: 'edu-structured-mt',
  },
  {
    ...meta(['C-010'], ['§7.1']),
    id: 'act-fill-the-gap', title: 'Fill in the last word', goal: 'early-words',
    summary: 'Sing a familiar song and leave out the last word.',
    ageBands: ['2-4', '5-7'], communication: ['speaking', 'some-words', 'minimally-verbal'],
    minutes: 3, energy: 'calm',
    steps: [
      'Choose a song your child knows well, such as "Twinkle, twinkle, little…".',
      'Sing it the same way a few times.',
      'Next time, stop before the last word and wait.',
      'Accept any attempt, then sing the word clearly.',
    ],
    pauseCue: 'Stop before the last word. Wait 5–10 seconds, smiling.',
    cueCards: ['Sing it through', 'Stop before the last word', 'Wait', 'Model the word'],
    tips: ['Any sound counts as a turn.', 'Sing the word afterwards whatever happens. Never make your child "earn" it.'],
    example: { kind: 'melody', bpm: 90, notes: TWINKLE_GAP, timbre: 'soft' },
    learnId: 'edu-structured-mt',
  },
  {
    ...meta(['C-010', 'C-017'], ['§7.1', '§7.2']),
    id: 'act-animal-song', title: 'Animal sounds song', goal: 'early-words',
    summary: 'Pick an animal picture and make its sound together in the song.',
    ageBands: ['2-4', '5-7'], communication: ['speaking', 'some-words', 'minimally-verbal'],
    minutes: 4, energy: 'active',
    steps: [
      'Show 2–3 animal pictures and let your child choose one.',
      'Sing "Old MacDonald had a farm…" to the chosen animal.',
      'Pause where the animal sound goes.',
      'Make the sound together, then choose the next animal.',
    ],
    pauseCue: 'Pause where the animal sound goes. Wait for your child’s sound.',
    cueCards: ['Choose a picture', 'Sing', 'Pause for the sound'],
    tips: ['Choosing is a big part of this. Let your child pick with a look, a point or a tap.'],
    example: { kind: 'melody', bpm: 100, notes: OLD_MACDONALD, timbre: 'soft' },
    learnId: 'edu-structured-mt',
  },
  {
    ...meta(['C-014'], ['§7.1', '§4']),
    id: 'act-action-song', title: 'Slow action song', goal: 'instructions',
    summary: 'Do simple actions to a slow beat: clap, tap your knees, touch your head.',
    ageBands: ['2-4', '5-7', '8-12'], communication: ['speaking', 'some-words', 'minimally-verbal'],
    minutes: 3, energy: 'active',
    steps: [
      'Stand or sit facing your child.',
      'Play the slow beat and do one action with a gesture, such as clapping.',
      'Name the action as you do it: "Clap, clap".',
      'Change the action after a few beats: "Knees, knees".',
    ],
    pauseCue: 'Before changing action, pause and let your child copy.',
    cueCards: ['One action at a time', 'Show and say', 'Slow down'],
    tips: ['Slow the tempo right down.', 'Use gestures as well as words.', 'Songs such as "Head, shoulders, knees and toes" work well when sung slowly.'],
    example: { kind: 'drum', bpm: 72, pattern: [1, 0, 1, 0, 1, 0, 1, 0] },
    learnId: 'edu-structured-mt',
  },
  {
    ...meta(['C-014', 'C-010'], ['§7.1']),
    id: 'act-happy-song', title: 'Feelings action song', goal: 'instructions',
    summary: 'Sing about a feeling and do the matching action.',
    ageBands: ['5-7', '8-12'], communication: ['speaking', 'some-words'],
    minutes: 3, energy: 'active',
    steps: [
      'Sing "If you’re happy and you know it, clap your hands", slowly.',
      'Show the action as you sing it.',
      'Let your child choose the next action from pictures: clap, stamp or wave.',
    ],
    pauseCue: 'Pause before the action. Wait for your child to do it or choose it.',
    cueCards: ['Sing slowly', 'Show the action', 'Let them choose'],
    tips: ['Use gestures.', 'Your child may prefer to watch at first. Watching is joining in too.'],
    example: { kind: 'drum', bpm: 84, pattern: [1, 0, 0, 1, 0, 0, 1, 1] },
    learnId: 'edu-structured-mt',
  },
  {
    ...meta(['C-014'], ['§7.1', '§4']),
    id: 'act-marching-band', title: 'Marching band', goal: 'motor',
    summary: 'March, stamp or tap to a steady beat.',
    ageBands: ['2-4', '5-7', '8-12'], communication: ['speaking', 'some-words', 'minimally-verbal'],
    minutes: 3, energy: 'active',
    steps: [
      'Play the steady beat.',
      'March around the room together, stepping on the beat.',
      'Try slow marching, then fast marching.',
      'End with a slow, quiet march to calm down.',
    ],
    pauseCue: 'Stop the beat and wait. Does your child want more?',
    cueCards: ['Steady beat', 'Slow, then fast', 'Finish slow and quiet'],
    tips: ['Rhythm supports coordination.', 'Tapping hands on knees is fine if marching is too much.'],
    example: { kind: 'drum', bpm: 96, pattern: [1, 0, 1, 0, 1, 0, 1, 0] },
    learnId: 'edu-nmt',
  },
  {
    ...meta(['C-014', 'C-016'], ['§7.1']),
    id: 'act-scarf-dance', title: 'Scarf dance', goal: 'motor',
    summary: 'Wave scarves high and low, slow and fast, to music.',
    ageBands: ['2-4', '5-7'], communication: ['speaking', 'some-words', 'minimally-verbal'],
    minutes: 3, energy: 'calm',
    steps: [
      'Give your child a light scarf or tea towel.',
      'Play slow music and wave the scarves slowly.',
      'Try up high, then down low.',
      'Finish by letting the scarves float down.',
    ],
    pauseCue: 'Hold the scarf still and wait for your child to start it moving.',
    cueCards: ['Slow waves', 'High and low', 'Float down'],
    tips: ['Watch your child’s energy. Slow music can help settle.'],
    example: { kind: 'melody', bpm: 60, notes: MARY_LAMB, timbre: 'soft' },
    learnId: 'edu-structured-mt',
  },
  {
    ...meta(['C-016', 'C-009'], ['§7.1', '§4']),
    id: 'act-calm-sway', title: 'Calm sway song', goal: 'regulation',
    summary: 'Sway or rock gently to a slow, familiar song.',
    ageBands: ['2-4', '5-7', '8-12'], communication: ['speaking', 'some-words', 'minimally-verbal'],
    minutes: 3, energy: 'calm',
    steps: [
      'Sit close together, or with your child on your lap if they like it.',
      'Play or hum a slow song your child knows.',
      'Sway gently side to side on the beat.',
      'Keep the volume low and the lights soft.',
    ],
    pauseCue: 'Let the song end quietly, then pause and wait together for a moment.',
    cueCards: ['Slow and quiet', 'Sway on the beat', 'Rest together'],
    tips: ['Build a calm playlist your child chooses.', 'Use the same calm song each time.'],
    example: { kind: 'melody', bpm: 56, notes: TWINKLE, timbre: 'soft' },
    learnId: 'edu-structured-mt',
  },
  {
    ...meta(['C-016', 'C-025'], ['§7.1', '§6.2']),
    id: 'act-slow-drum-breaths', title: 'Slow drum breathing', goal: 'regulation',
    summary: 'Slow drum taps help set a calm pace for breathing.',
    ageBands: ['5-7', '8-12'], communication: ['speaking', 'some-words', 'minimally-verbal'],
    minutes: 2, energy: 'calm',
    steps: [
      'Tap the drum very slowly, once every 3–4 seconds.',
      'Breathe in between taps, and out on the tap.',
      'Invite your child to do the tapping.',
    ],
    pauseCue: 'Leave long, quiet gaps between taps.',
    cueCards: ['Very slow taps', 'Breathe out on the tap', 'Child leads'],
    tips: ['Never insist. Just model calm breathing and let your child join when ready.'],
    example: { kind: 'drum', bpm: 40, pattern: [1, 0, 0, 0] },
    learnId: 'edu-structured-mt',
  },
  {
    ...meta(['C-010', 'C-005'], ['§7.1']),
    id: 'act-band-game', title: 'Band game', goal: 'social-play',
    summary: 'Everyone plays together and everyone stops when the music stops.',
    ageBands: ['5-7', '8-12'], communication: ['speaking', 'some-words', 'minimally-verbal'],
    minutes: 4, energy: 'active',
    steps: [
      'Give each player an instrument (siblings or a friend can join).',
      'One person is the leader and plays or sings.',
      'Everyone plays along. When the leader stops, everyone stops.',
      'Take turns being the leader.',
    ],
    pauseCue: 'When the music stops, wait. Who will be the next leader?',
    cueCards: ['Everyone plays', 'Leader stops, everyone stops', 'Swap leader'],
    tips: ['Keep groups small and predictable.', 'Loud instruments are optional. Offer quiet ones too.'],
    example: { kind: 'melody', bpm: 100, notes: ROW_BOAT, timbre: 'soft' },
    learnId: 'edu-structured-mt',
  },
  {
    ...meta(['C-005', 'C-010'], ['§7.1']),
    id: 'act-pass-the-drum', title: 'Pass the drum', goal: 'social-play',
    summary: 'Pass one drum around the circle; whoever holds it plays.',
    ageBands: ['5-7', '8-12'], communication: ['speaking', 'some-words', 'minimally-verbal'],
    minutes: 3, energy: 'calm',
    steps: [
      'Sit in a small circle with one drum.',
      'The person with the drum plays a few beats.',
      'Pass the drum to the next person.',
      'Everyone waits and watches while it is not their turn.',
    ],
    pauseCue: 'Before passing, pause. Let your child notice whose turn is next.',
    cueCards: ['Play', 'Pass', 'Wait and watch'],
    tips: ['A visual "my turn" card can help.'],
    example: { kind: 'drum', bpm: 90, pattern: [1, 1, 0, 1, 0, 0, 0, 0] },
    learnId: 'edu-structured-mt',
  },
];

export function activityById(id: string): Activity | undefined {
  return ACTIVITIES.find((a) => a.id === id);
}

export const GOAL_AREA_LABELS: Readonly<Record<Activity['goal'], string>> = {
  'joint-attention': 'Joint attention and turn-taking',
  anticipation: 'Anticipation and requesting',
  'early-words': 'Early words',
  instructions: 'Following instructions',
  motor: 'Motor skills',
  regulation: 'Emotional regulation',
  transitions: 'Transitions and routines',
  'social-play': 'Play with siblings or friends',
};
