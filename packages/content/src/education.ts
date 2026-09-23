// Evidence & Education Hub (M8) and therapist guidance (M9). REQ-M8-01, REQ-M8-03, REQ-M8-04, REQ-M9-01.
import { meta } from './activities';
import type { EducationEntry, EvidenceMeta } from './types';

const DISCLAIMER_APPROVAL = { by: 'Evaluator agent (EV)', reason: 'Mandatory disclaimer D-001 (team prompt §11); approved negation.' };

export const DISCLAIMER =
  'This app supports, and does not replace, professional assessment and therapy. Music activities may help engagement and wellbeing. They do not cure autism. Stop any activity that causes distress, and talk to your child’s clinicians about concerns.';

const e = (m: EvidenceMeta, x: Omit<EducationEntry, keyof EvidenceMeta>): EducationEntry => ({ ...m, ...x });

export const EDUCATION: readonly EducationEntry[] = [
  e({ ...meta(['D-001'], ['§8'], 'Verified'), termApproval: DISCLAIMER_APPROVAL }, {
    id: 'edu-disclaimer', category: 'about', title: 'What this app is, and is not', body: [DISCLAIMER],
  }),
  e(meta(['C-001', 'C-002', 'C-003', 'C-004'], ['§3', '§3.1', '§8'], 'Verified'), {
    id: 'edu-what-mt-can-do', category: 'about', title: 'What music therapy can and can’t do',
    body: [
      'Music therapy from a credentialed music therapist probably helps overall functioning in the short term. The best summary of trials rates this as moderate certainty.',
      'Benefits show up most in parent- and therapist-rated functioning, engagement and family quality of life.',
      'The largest careful trial found that music therapy on its own did not change core autism features on a standard clinical measure.',
      'It is low risk, and trials report no increase in side effects when sound levels respect the child’s sensitivities.',
      'Music is an enjoyable add-on to core support such as speech therapy and developmental support. It is not a replacement for them.',
    ],
  }),
  e(meta(['C-001', 'C-020', 'C-021'], ['§8'], 'Verified'), {
    id: 'edu-tier-verified', category: 'tiers', title: 'Verified',
    body: ['Verified means the sub-study recommends it as an add-on, or it is supported by clinical consensus. Examples: credentialed music therapy, a hearing test with an audiologist, and a sound diary.'],
  }),
  e(meta(['C-005', 'C-013'], ['§8'], 'Emerging'), {
    id: 'edu-tier-emerging', category: 'tiers', title: 'Emerging',
    body: ['Emerging means promising and low risk, but backed by small or limited studies. Most home music activities in this app are Emerging. They are good to try, and they are not therapy on their own.'],
  }),
  e(meta(['C-032', 'C-036'], ['§5', '§8'], 'Unverified'), {
    id: 'edu-tier-unverified', category: 'tiers', title: 'Unverified',
    body: ['Unverified means there are no convincing controlled trials showing it works for autistic children. This app explains these programmes, but does not offer any of them.'],
  }),
  e(meta(['C-001', 'C-005'], ['§2'], 'Verified'), {
    id: 'edu-improvisational-mt', category: 'interventions', title: 'Improvisational music therapy', deliveredBy: 'Credentialed music therapist',
    body: ['The therapist follows your child’s sounds, movements and play, and responds musically to build shared attention and turn-taking. The sub-study rates the evidence as emerging to moderate.'],
  }),
  e(meta(['C-001', 'C-010'], ['§2'], 'Verified'), {
    id: 'edu-structured-mt', category: 'interventions', title: 'Structured music therapy and home music play', deliveredBy: 'Music therapist; caregivers at home',
    body: [
      'Songs and musical games target specific goals such as greetings, naming, waiting and following instructions. The sub-study rates the evidence as emerging to moderate.',
      'The home activities in this app borrow these ideas. They are Emerging, low risk, and meant for shared play, not as a replacement for therapy.',
    ],
  }),
  e(meta(['C-005', 'C-006'], ['§2', '§3'], 'Emerging'), {
    id: 'edu-family-mt', category: 'interventions', title: 'Family-centred music therapy', deliveredBy: 'Music therapist coaching parents',
    body: ['Parents learn musical play for daily routines at home. Small trials found gains in social engagement at home and in family quality of life.'],
  }),
  e(meta(['C-042', 'C-014'], ['§2'], 'Emerging'), {
    id: 'edu-nmt', category: 'interventions', title: 'Neurologic Music Therapy', deliveredBy: 'Certified NMT therapist',
    body: ['Rhythm and melody are used to organise movement, speech and attention. The evidence in autism is limited so far. It is stronger in stroke and Parkinson’s disease.'],
  }),
  e(meta(['C-013'], ['§2', '§3'], 'Emerging'), {
    id: 'edu-ammt', category: 'interventions', title: 'Singing and tapping for speech (AMMT)', deliveredBy: 'Therapist',
    body: ['The child sings words while tapping drums, to link sound with speech movements. Small studies are promising for some minimally verbal children, and larger trials are needed.'],
  }),
  e(meta(['C-020', 'C-021', 'C-023', 'C-024', 'C-026'], ['§2', '§6'], 'Verified'), {
    id: 'edu-sound-strategies', category: 'interventions', title: 'Sound-sensitivity strategies', deliveredBy: 'Parents, OTs, audiologists',
    body: ['Ear defenders for planned loud places, warnings and countdowns, choice and control, quiet spaces, and gradual practice with sounds. These are practical steps supported by clinical consensus.'],
  }),
  e(meta(['C-032'], ['§5'], 'Unverified'), {
    id: 'edu-ait', category: 'unverified', title: 'Auditory Integration Training (Berard)',
    body: ['The claim: 20 half-hour sessions of modulated music change how a child hears.', 'The evidence: a Cochrane review found insufficient evidence, and major professional bodies do not support it.'],
  }),
  e(meta(['C-033'], ['§5'], 'Unverified'), {
    id: 'edu-tomatis', category: 'unverified', title: 'Tomatis method',
    body: ['The claim: filtered music and the mother’s voice re-educate listening.', 'The evidence: a small placebo-controlled trial found no benefit over placebo.'],
  }),
  e(meta(['C-035'], ['§5'], 'Unverified'), {
    id: 'edu-samonas', category: 'unverified', title: 'Samonas, Therapeutic Listening, iLs',
    body: ['The claim: filtered music programmes improve sensory processing.', 'The evidence: no robust controlled trials in autism.'],
  }),
  e(meta(['C-034'], ['§5'], 'Unverified'), {
    id: 'edu-ssp', category: 'unverified', title: 'Safe and Sound Protocol (SSP)',
    body: ['The claim: filtered vocal music calms the nervous system.', 'The evidence: small studies, mostly by the developer’s group, and no controlled trials in autism. The theory behind it is contested. Low risk under a licensed provider, but unproven.'],
  }),
  e(meta(['C-036'], ['§5'], 'Unverified'), {
    id: 'edu-frequencies', category: 'unverified', title: 'Binaural beats, "432 Hz" and "Solfeggio" music',
    body: ['The claim: special frequencies rebalance the brain.', 'The evidence: no scientific basis as an autism therapy. It is harmless as relaxing music if your child enjoys it.'],
  }),
  e(meta(['C-037'], ['§5'], 'Unverified'), {
    id: 'edu-sound-baths', category: 'unverified', title: 'Sound baths and singing bowls',
    body: ['The claim: vibration realigns energy.', 'The evidence: none. Some children find them relaxing; others find them overwhelming.'],
  }),
  e(meta(['C-038', 'C-040', 'C-031'], ['§5', '§7.3'], 'Verified'), {
    id: 'edu-red-flags', category: 'therapist', title: 'If you try an unproven programme',
    body: [
      'Set a fixed trial period, for example 8 weeks. Agree measurable goals before you start. Stop if there is no clear change.',
      'Headphone programmes should never go above safe listening levels (about 85 dB, lower for young children).',
      'Be cautious of anyone who makes big promises about autism, sells expensive listening equipment, or discourages other therapies.',
    ],
  }),
  e(meta(['C-039', 'C-041'], ['§2', '§7.3'], 'Verified'), {
    id: 'edu-choose-therapist', category: 'therapist', title: 'Choosing a music therapist',
    body: [
      'A typical course is 30–45 minute sessions once or twice a week for 8–20 weeks, with written goals shared with your family.',
      'Use the five questions below when you speak to a therapist.',
    ],
  }),
];

export function educationById(id: string): EducationEntry | undefined {
  return EDUCATION.find((x) => x.id === id);
}
