// Routine songs (M3), songs and calm tracks (M4 and M7), sound types (M5), goal templates (M6),
// red-flag checker (M8), therapist checklist (M9) and crisis lines (coach escalation).
import { FRERE_JACQUES, HOT_CROSS_BUNS, MARY_LAMB, OLD_MACDONALD, ROW_BOAT, TWINKLE, meta } from './activities';
import type { CrisisLines, GoalTemplate, Note, RedFlagQuestion, Routine, Song, SoundType } from './types';

// REQ-M3-01 one fixed song per routine. REQ-M3-02 linked visual schedule.
export const ROUTINES: readonly Routine[] = [
  {
    ...meta(['C-015', 'C-017'], ['§7.1', '§7.2']), id: 'rt-tidy', title: 'Tidy-up', icon: 'tidy', tune: 'Hot Cross Buns',
    lyrics: ['Tidy up, tidy up,', 'toys go in the box.', 'One by one and two by two,', 'tidy up, tidy up.'],
    song: { kind: 'melody', bpm: 96, notes: HOT_CROSS_BUNS, timbre: 'soft' },
    schedule: [{ icon: 'toys', label: 'Pick up toys' }, { icon: 'box', label: 'Into the box' }, { icon: 'star', label: 'All done' }],
  },
  {
    ...meta(['C-015', 'C-017'], ['§7.1', '§7.2']), id: 'rt-teeth', title: 'Brushing teeth', icon: 'teeth', tune: 'Row, Row, Row Your Boat',
    lyrics: ['Brush, brush, brush your teeth,', 'round and round they go.', 'Top and bottom, front and back,', 'shiny, clean, hello!'],
    song: { kind: 'melody', bpm: 92, notes: ROW_BOAT, timbre: 'soft' },
    schedule: [{ icon: 'paste', label: 'Toothpaste on' }, { icon: 'teeth', label: 'Brush' }, { icon: 'water', label: 'Rinse' }, { icon: 'star', label: 'All done' }],
  },
  {
    ...meta(['C-015', 'C-017'], ['§7.1', '§7.2']), id: 'rt-bath', title: 'Bath time', icon: 'bath', tune: 'Frère Jacques',
    lyrics: ['Bath time, bath time,', 'splash, splash, splash.', 'Wash my hands and wash my feet,', 'now I’m clean, now I’m clean.'],
    song: { kind: 'melody', bpm: 92, notes: FRERE_JACQUES, timbre: 'soft' },
    schedule: [{ icon: 'clothes', label: 'Clothes off' }, { icon: 'bath', label: 'In the bath' }, { icon: 'towel', label: 'Towel' }, { icon: 'star', label: 'All done' }],
  },
  {
    ...meta(['C-015', 'C-017'], ['§7.1', '§7.2']), id: 'rt-leaving', title: 'Leaving the house', icon: 'door', tune: 'Mary Had a Little Lamb',
    lyrics: ['Shoes on, coat on, out we go,', 'out we go, out we go.', 'Shoes on, coat on, out we go,', 'off we go today.'],
    song: { kind: 'melody', bpm: 100, notes: MARY_LAMB, timbre: 'soft' },
    schedule: [{ icon: 'shoes', label: 'Shoes on' }, { icon: 'coat', label: 'Coat on' }, { icon: 'door', label: 'Out the door' }],
  },
  {
    ...meta(['C-015', 'C-016', 'C-017'], ['§7.1', '§7.2']), id: 'rt-bedtime', title: 'Bedtime', icon: 'bed', tune: 'Twinkle, Twinkle',
    lyrics: ['Close your eyes and rest your head,', 'snuggle down in your warm bed.', 'Quiet night and quiet sky,', 'time to sleep, goodnight, goodbye.'],
    song: { kind: 'melody', bpm: 60, notes: TWINKLE, timbre: 'soft' },
    schedule: [{ icon: 'pyjamas', label: 'Pyjamas' }, { icon: 'teeth', label: 'Teeth' }, { icon: 'book', label: 'Story' }, { icon: 'bed', label: 'Bed' }],
  },
  {
    ...meta(['C-015', 'C-017'], ['§7.1', '§7.2']), id: 'rt-meal', title: 'Mealtime', icon: 'food', tune: 'Old MacDonald',
    lyrics: ['Time to eat, let’s sit down,', 'yum, yum, yum.', 'Wash our hands and take our seat,', 'yum, yum, yum.'],
    song: { kind: 'melody', bpm: 96, notes: OLD_MACDONALD, timbre: 'soft' },
    schedule: [{ icon: 'hands', label: 'Wash hands' }, { icon: 'chair', label: 'Sit down' }, { icon: 'food', label: 'Eat' }],
  },
];

// Calm tracks: original slow pentatonic patterns (no special frequencies; A4 = 440 Hz). REQ-M4-02.
const C4 = 60, D4 = 62, E4 = 64, G4 = 67, A4 = 69, C5 = 72;
const WAVES: Note[] = [[C4, 2], [E4, 2], [G4, 2], [E4, 2], [D4, 2], [G4, 2], [E4, 4]];
const STARS: Note[] = [[G4, 2], [E4, 2], [C5, 2], [A4, 2], [G4, 4], [E4, 2], [D4, 2], [C4, 4]];
const CLOUDS: Note[] = [[E4, 3], [D4, 3], [C4, 3], [0, 1], [D4, 3], [E4, 3], [G4, 4]];

export const SONGS: readonly Song[] = [
  { ...meta(['C-016', 'C-017'], ['§7.1', '§7.2']), id: 'song-star', title: 'Twinkle star', icon: 'star', audio: { kind: 'melody', bpm: 84, notes: TWINKLE, timbre: 'bell' }, calm: false },
  { ...meta(['C-016', 'C-017'], ['§7.1', '§7.2']), id: 'song-boat', title: 'Row the boat', icon: 'boat', audio: { kind: 'melody', bpm: 92, notes: ROW_BOAT, timbre: 'bell' }, calm: false },
  { ...meta(['C-016', 'C-017'], ['§7.1', '§7.2']), id: 'song-lamb', title: 'Little lamb', icon: 'lamb', audio: { kind: 'melody', bpm: 96, notes: MARY_LAMB, timbre: 'bell' }, calm: false },
  { ...meta(['C-016', 'C-017'], ['§7.1', '§7.2']), id: 'song-farm', title: 'Farm song', icon: 'cow', audio: { kind: 'melody', bpm: 100, notes: OLD_MACDONALD, timbre: 'bell' }, calm: false },
  { ...meta(['C-016', 'C-017', 'C-027'], ['§7.1', '§6.2']), id: 'calm-waves', title: 'Slow waves', icon: 'wave', audio: { kind: 'melody', bpm: 48, notes: WAVES, timbre: 'soft' }, calm: true },
  { ...meta(['C-016', 'C-017', 'C-027'], ['§7.1', '§6.2']), id: 'calm-stars', title: 'Night stars', icon: 'moon', audio: { kind: 'melody', bpm: 48, notes: STARS, timbre: 'soft' }, calm: true },
  { ...meta(['C-016', 'C-017', 'C-027'], ['§7.1', '§6.2']), id: 'calm-clouds', title: 'Soft clouds', icon: 'cloud', audio: { kind: 'melody', bpm: 44, notes: CLOUDS, timbre: 'soft' }, calm: true },
];

// REQ-M5-01 sound diary types. `synth` marks built-in practice sounds for graded exposure (REQ-M5-05).
export const SOUND_TYPES: readonly SoundType[] = [
  { id: 'hand-dryer', label: 'Hand dryer', icon: 'wind', synth: 'hum' },
  { id: 'blender', label: 'Blender / kitchen machine', icon: 'blender', synth: 'whirr' },
  { id: 'vacuum', label: 'Vacuum cleaner', icon: 'vacuum', synth: 'whirr' },
  { id: 'beeps', label: 'Beeps and alarms', icon: 'bell', synth: 'beep' },
  { id: 'school-bell', label: 'School bell', icon: 'bell', synth: 'bell' },
  { id: 'siren', label: 'Siren', icon: 'siren' },
  { id: 'crying', label: 'Crying baby', icon: 'baby' },
  { id: 'crowd', label: 'Crowded room', icon: 'people' },
  { id: 'bang', label: 'Bangs / fireworks', icon: 'bang' },
  { id: 'toilet', label: 'Toilet flush', icon: 'water' },
  { id: 'dog', label: 'Dog barking', icon: 'dog' },
  { id: 'other', label: 'Something else', icon: 'sound' },
];

export const PLACES = ['home', 'school', 'shop', 'outside', 'car', 'other'] as const;

// REQ-M6-01 goal templates. No template aims to reduce stimming or "normalise" (principle 2.5).
export const GOAL_TEMPLATES: readonly GoalTemplate[] = [
  { id: 'g-turns', area: 'joint-attention', label: 'Takes turns in music play', measure: 'How well did your child take turns today?', claimIds: ['C-005'] },
  { id: 'g-anticipation', area: 'anticipation', label: 'Shows they want more at a song pause', measure: 'Did your child look, make a sound or say a word at the pause?', claimIds: ['C-010'] },
  { id: 'g-words', area: 'early-words', label: 'Fills in a sound or word in familiar songs', measure: 'Did your child fill in a sound or word?', claimIds: ['C-010'] },
  { id: 'g-instructions', area: 'instructions', label: 'Joins in with actions in action songs', measure: 'Did your child join in with actions?', claimIds: ['C-014'] },
  { id: 'g-routine', area: 'transitions', label: 'Moves through a routine with its song', measure: 'How did the routine go with its song?', claimIds: ['C-015'] },
  { id: 'g-calm', area: 'regulation', label: 'Uses calm music to settle', measure: 'Did calm music help your child settle?', claimIds: ['C-016'] },
  { id: 'g-signal', area: 'regulation', label: 'Tells us when a sound is too loud', measure: 'Did your child signal "too loud" (card, gesture or words)?', claimIds: ['C-025'] },
  { id: 'g-sound-comfort', area: 'regulation', label: 'Stays comfortable in a chosen sound situation', measure: 'How comfortable was your child in that situation?', claimIds: ['C-026'] },
  { id: 'g-motor', area: 'motor', label: 'Joins in with movement to music', measure: 'Did your child move to the music?', claimIds: ['C-014'] },
  { id: 'g-social', area: 'social-play', label: 'Plays music with a sibling or friend', measure: 'Did your child play music with someone else?', claimIds: ['C-005'] },
];

export const SCALE_0_4 = ['Not yet', 'With lots of help', 'Sometimes', 'Often', 'On their own'] as const;

// REQ-M8-02 red-flag checker.
export const RED_FLAG_QUESTIONS: readonly RedFlagQuestion[] = [
  { id: 'rf-cure', text: 'Does it promise to cure autism, or to make a child "recover" or become "normal"?', claimIds: ['C-040'], critical: true },
  { id: 'rf-retrain', text: 'Does it claim to retrain hearing or the brain with filtered music, special frequencies or tones?', claimIds: ['C-032', 'C-033', 'C-036'], critical: true },
  { id: 'rf-testimonials', text: 'Is the main evidence stories and testimonials, rather than controlled trials?', claimIds: ['C-032', 'C-038'], critical: false },
  { id: 'rf-cost', text: 'Does it need expensive equipment or a large up-front package?', claimIds: ['C-040'], critical: false },
  { id: 'rf-discourage', text: 'Does the provider discourage other therapies, such as speech therapy or OT?', claimIds: ['C-040'], critical: true },
  { id: 'rf-credential', text: 'Is it delivered by someone without a recognised therapy credential?', claimIds: ['C-039'], critical: false },
  { id: 'rf-goals', text: 'Is there no plan for measurable goals and a review date?', claimIds: ['C-038', 'C-039'], critical: false },
];

export type RedFlagAnswer = 'yes' | 'no' | 'unsure';
export type RedFlagVerdict = { level: 'none' | 'caution' | 'unverified'; flags: number; unsure: number; message: string; learnIds: string[] };

export function evaluateRedFlags(answers: Readonly<Record<string, RedFlagAnswer>>): RedFlagVerdict {
  let flags = 0, unsure = 0, critical = false;
  for (const q of RED_FLAG_QUESTIONS) {
    const a = answers[q.id];
    if (a === 'yes') { flags++; if (q.critical) critical = true; }
    else if (a !== 'no') unsure++;
  }
  const learnIds = ['edu-red-flags', ...(answers['rf-retrain'] === 'yes' ? ['edu-ait', 'edu-tomatis', 'edu-frequencies'] : [])];
  if (critical || flags >= 3) {
    return { level: 'unverified', flags, unsure, learnIds, message: 'Treat this as Unverified. These are warning signs that the sub-study links with programmes that lack good evidence. Talk to your child’s clinicians before spending money or time on it.' };
  }
  if (flags > 0 || unsure > 0) {
    return { level: 'caution', flags, unsure, learnIds, message: 'Be cautious. Ask the provider for controlled-trial evidence, agree measurable goals, and set a fixed trial period, for example 8 weeks.' };
  }
  return { level: 'none', flags, unsure, learnIds, message: 'No red flags from these questions. Still ask for evidence, agree goals, and review progress after a fixed trial period.' };
}

// REQ-M9-01 choosing a music therapist (sub-study §7.3).
export const THERAPIST_QUESTIONS: readonly string[] = [
  'Are you a credentialed music therapist (for example MT-BC, HCPC-registered, or your country’s equivalent), and what experience do you have with autistic children?',
  'What goals will we set, and how will you measure and report progress?',
  'Will you coordinate with my child’s speech therapist, OT and school?',
  'Can parents join sessions or learn activities to use at home?',
  'How long is the initial trial, and when will we review whether to continue?',
];

/** National credentialing bodies. No paid rankings. URLs to be re-verified before launch (OQ-04). */
export const CREDENTIAL_BODIES: readonly { region: string; name: string; url?: string }[] = [
  { region: 'Singapore', name: 'Association for Music Therapy (Singapore)', url: 'https://www.musictherapy.org.sg' },
  { region: 'Philippines', name: 'Ask your developmental paediatrician or therapy centre; check for recognised international credentials (for example MT-BC or RMT)' },
  { region: 'United States', name: 'Certification Board for Music Therapists (MT-BC register)', url: 'https://www.cbmt.org' },
  { region: 'United Kingdom', name: 'Health and Care Professions Council register', url: 'https://www.hcpc-uk.org' },
  { region: 'Australia', name: 'Australian Music Therapy Association (RMT register)', url: 'https://www.austmta.org.au' },
];

// Crisis lines for coach escalation (REQ-AI-04). PROVISIONAL: to be verified by a safeguarding lead (OQ-12).
export const CRISIS_LINES: readonly CrisisLines[] = [
  { region: 'SG', emergency: '995 (ambulance) or 999 (police)', lines: [{ name: 'Samaritans of Singapore (24h)', number: '1767' }, { name: 'IMH Mental Health Helpline', number: '6389 2222' }] },
  { region: 'PH', emergency: '911', lines: [{ name: 'NCMH Crisis Hotline', number: '1553' }] },
  { region: 'US', emergency: '911', lines: [{ name: '988 Suicide & Crisis Lifeline', number: '988' }, { name: 'Childhelp National Child Abuse Hotline', number: '1-800-422-4453' }] },
  { region: 'UK', emergency: '999', lines: [{ name: 'Samaritans', number: '116 123' }, { name: 'NSPCC Helpline', number: '0808 800 5000' }] },
  { region: 'AU', emergency: '000', lines: [{ name: 'Lifeline', number: '13 11 14' }, { name: 'Kids Helpline', number: '1800 55 1800' }] },
];

export function crisisLinesFor(region: string): CrisisLines {
  return CRISIS_LINES.find((c) => c.region === region) ?? CRISIS_LINES[0]!;
}
