// Deterministic safety classifier for the Caregiver Coach (REQ-AI-03, REQ-AI-04, REQ-AI-05).
// Rebuilt after the blind held-out evaluation (DEF-010): the first version matched narrow phrases and escalated only
// 2 of 30 paraphrased crises. These patterns are organised by GENERAL category (ideation, harm to a child, abuse,
// medical emergency, …) and include common Singapore and Philippine phrasing. Crisis detection favours recall:
// escalating a benign question costs little, while missing a crisis is Critical.

export type RefusalCategory = 'diagnosis' | 'medication' | 'cure';

export interface Classification {
  crisis: boolean;
  injection: boolean;
  refusal: RefusalCategory | null;
  stimming: boolean;
  distress: boolean;
}

const P = '(him|her|them|me|us|my (son|daughter|child|kid|kids|baby|boy|girl|children)|the (kids?|baby|child))';
const ADULT = '(i|i\'m|i\'d|i\'ll|i might|we|husband|wife|partner|boyfriend|girlfriend|dad|daddy|father|papa|mum|mom|mummy|mommy|mother|mama|teacher|tutor|helper|maid|nanny|uncle|aunt|auntie|neighbou?r|stepdad|stepmom|grandpa|grandma|someone|somebody|stranger|cousin|coach|driver|man|he|she|they)';

const CRISIS: RegExp[] = [
  // Suicidal ideation, including indirect and passive phrasing.
  /\bsuicid/, /\bkill(ing)? (myself|me|us)\b/, /\bwant(s|ed)? to die\b/, /\bwish(ing)? i (was|were) (dead|gone)\b/,
  /\b(end|ending) (my life|it all|things|everything)\b/, /\bend it\b[^.?!]{0,25}\b(tonight|today|now|soon)\b/,
  /\bbetter off\b[^.?!]{0,30}\bwithout me\b/, /\b(manage|cope|be fine|be okay|be ok)\b[^.?!]{0,15}\bwithout me\b/,
  /\bbetter off if i\b/, /\b(if|when) i\b[^.?!]{0,10}\b(wasn'?t|weren'?t|am not|was not|were not|weren't) (here|around|alive)\b/,
  /\bno (point|reason)\b[^.?!]{0,15}\b(going on|living|to live|being here|carrying on|anymore)\b/,
  /\bdon'?t see the point\b[^.?!]{0,20}\b(going on|living|anymore|being here)\b/,
  /\bcan'?t (go on|do this any ?more|take (it|this) any ?more|cope any ?more|keep going)\b/, /\bcannot (go on|do this any ?more)\b/,
  /\b(letters?|notes?)\b[^.?!]{0,12}\b(to|for) (everyone|my (kids|children|family|husband|wife|partner))\b/,
  /\b(saving|stockpil\w*|hoard\w*) (up )?(my |all my )?(pills|tablets|meds|medication|sleeping pills)\b/,
  /\b(ledge|rooftop|jump(ing)? (off|from|in front)|tumalon|magpakamatay|mamatay na|mawala na lang|gusto ko na (lang )?mawala)\b/,
  /\b(drive|driving|crash\w*|swerv\w*)\b[^.?!]{0,40}\b(canal|river|sea|reservoir|bridge|wall|lorry|truck|with (both of )?us)\b/,
  /\bself[- ]?harm/, /\b(cutting|cuts|scratching|burning) (her|his|their|my)(self|selves)?( arms?| legs?| wrists?| skin)?\b/,
  /\b(hurt|harm|injur|cut|burn)\w* (myself|himself|herself|themselves|themself)\b/, /\boverdos/,
  // Third-person suicidality and self-harm (the child or another person).
  /\b(wants?|wanted|trying|tried|going|threaten\w*) to (kill|hurt|harm) (himself|herself|themselves|themself)\b/, /\bkill (himself|herself|themselves)\b/,
  /\b(wants?|wanted) to (disappear|die|not exist|not be here)\b/, /\b(razor|blades?)\b/, /\b(arms?|legs?|wrists?)\b[^.?!]{0,20}\bcut (up)?\b/,
  // Overdose and intentional harm with medicines.
  /\bhow many\b[^.?!]{0,25}\b(pills|tablets|meds)\b[^.?!]{0,20}\b(take|it would take|to die|kill)\b/, /\bhow many of my (pills|tablets|meds)\b/,
  /\b(take|swallow) (the rest|all of (them|it)|the whole)\b/, /\bextra (of )?(his|her|their) (sleep )?(meds|medication|pills)\b[^.?!]{0,40}\b(myself|both|rest)\b/,
  /\bboth (of us )?(can )?finally rest\b/,
  // Other languages: Filipino, Malay, Mandarin.
  /\b(ayoko nang mabuhay|ayaw ko nang mabuhay|wala na akong gana mabuhay|magpapakamatay)\b/,
  /\b(bunuh diri|tamatkan (semuanya|hidup)|tak nak hidup|tidak mahu hidup|nak mati)\b/,
  /(不想活|自杀|想死|活不下去)/,
  // Harm to a child, violence, abuse, neglect.
  /\b(pillow|hand|hands)\b[^.?!]{0,15}\bover (his|her|their) (face|mouth)\b/, /\bscared of what i('ll| will| might)? do\b/,
  /\b(burn|set fire to) the (house|flat|place)\b/, /\bwith us in it\b/, /\b(threaten\w*|threat)\b[^.?!]{0,30}\b(kill|hurt|burn|take the kids)\b/,
  /\b(stand|sleep|stay|locked|left) outside\b[^.?!]{0,30}\b(all night|in the cold|in the rain|overnight)\b/,
  /\b(takes?|took) (him|her|them) into (a|the|his|her) room alone\b/,
  new RegExp(`\\b${ADULT}\\b[^.?!]{0,30}\\b(hit|hits|hitting|beat|beats|beating|shook|shake|shakes|shaking|slap\\w*|smack\\w*|punch\\w*|kick\\w*|chok\\w*|strangl\\w*|hurt|hurts|hurting|harm\\w*|lock\\w*|tie\\w*|tied|burn\\w*|throw\\w*|threw|pinch\\w*|starv\\w*)\\b[^.?!]{0,12}\\b${P}`),
  // Missing or endangered child.
  /\b(can'?t|cannot|couldn'?t) find (him|her|them|my (son|daughter|child|kid|boy|girl))\b/, /\b(missing|ran away|wandered off)\b[^.?!]{0,40}\b(river|road|dark|canal|sea|highway|night)\b/,
  /\b(snap|lose it|lose control)\b[^.?!]{0,30}\b(hurt|harm|hit)\b/, /\bshut (him|her|them) up for good\b/,
  /\b(scared|afraid|worried) (i|i'll|i will|i might)\b[^.?!]{0,20}\b(hurt|harm|hit|do it again)\b/,
  /\b(touch(es|ed|ing)?|fondl\w*)\b[^.?!]{0,30}\b(private|down there|under (her|his) clothes|lessons?|his flat|his house|secret)\b/,
  /\b(uncle|teacher|tutor|neighbou?r|coach|man|stranger|someone|helper|driver|cousin)\b[^.?!]{0,30}\btouch(es|ed|ing)? (her|him)\b/,
  /\b(inappropriate touch\w*|sexual\w*|molest\w*|groom\w*|abus(e|ed|es|ing|ive))\b/, /\bbruis(e|es|ed|ing)\b/,
  /\b(unsafe|not safe)\b[^.?!]{0,15}\b(at home|here|with)\b/, /\bin danger\b/, /\bhiding (in|from)\b/,
  /\b(drunk|violent)\b[^.?!]{0,30}\b(again|throwing|hitting|shouting|screaming)\b/, /\bthrowing things\b/,
  /\block(s|ed|ing)? (him|her|them) (in|up|inside)\b/, /\b(saktan|sinasaktan|binubugbog|sinaktan)\b/,
  // Medical emergencies.
  /\b(not|isn'?t|stopped|barely|can'?t|cannot|trouble|hard to) (breathing|breathe|responding|waking up|get(ting)? air)\b/,
  /\bnot responding\b/, /\b(unconscious|unresponsive|passed out|collapsed|fainted|won'?t wake)\b/,
  /\blips?\b[^.?!]{0,15}\b(blue|purple|grey|gray)\b/, /\bturn(ing|ed)? (blue|purple)\b/,
  /\bchok(e|es|ed|ing)\b/, /\b(seizure|convuls\w*|fitting)\b/, /\bhaving a fit\b/, /\bjerk(ing|s)?\b/, /\beyes rolled\b/,
  /\bswallow(ed|ing|s)?\b[^.?!]{0,30}\b(battery|batteries|magnet|pills?|tablets?|medicine|coin|bead|button|bleach|detergent|chemical|small|toy|part)\b/,
  /\b(drank|drunk|drink|ate|eaten|swallowed)\b[^.?!]{0,60}\b(bleach|detergent|dishwashing|cleaner|chemical|poison|medicine|pills|liquid)\b/, /\bsmells? (like|of) (bleach|chemicals?|detergent)\b/,
  /\bpoison/, /\bhit (his|her|their) head\b/, /\b(head injury|concussion)\b/, /\bvomit\w*\b[^.?!]{0,40}\b(sleepy|drowsy|confused)\b/,
  /\b(car|bus|lorry|truck|motorbike|bike) (hit|knocked|ran over) (him|her|them)\b/, /\b(bleeding|lots of blood|blood on)\b/,
  /\b(broken (bone|arm|leg|wrist)|looks wrong|bone sticking)\b/,
  /\b(fire|smoke)\b[^.?!]{0,30}\b(corridor|house|flat|block|room|building|kitchen|for real|real)\b/, /\bfire alarm\b[^.?!]{0,20}\bfor real\b/,
  /\bfever\b[^.?!]{0,40}\b(stiff|jerk\w*|seizure|fit|floppy|won'?t wake)\b/, /\b(this is an|it'?s an|medical) emergency\b/,
];

const INJECTION: RegExp[] = [
  /\b(ignore|disregard|forget|bypass|override|disable|skip)\b[^.?!]{0,40}\b(instructions?|rules|guidelines|guardrails|polic(y|ies)|prompt|safety|disclaimer|checks|citations|restrictions)\b/,
  /\b(repeat|print|reveal|show|list|paste|output|translate|recite|read out|read me|dump|return)\b[^.?!]{0,50}\b(instructions?|rules|prompt|system|guidelines|passage ids?|hidden|verbatim|word for word)\b/,
  /\bsystem prompt\b/, /\bdeveloper mode\b/, /\byou are now\b/, /\bjailbreak\w*/, /\bpretend (to be|you are|you're)\b/,
  /\bact as (a |an |my )?(doctor|psychiatrist|pharmacist|clinician|dan|therapist)\b/, /\bnew (instructions|rules?)\b/,
  /\bno (content )?(restrictions|rules|filters|limits)\b/, /<\/?(system|passage|instructions|question)>/, /\bwords above\b/,
  /\b(base64|rot13|decode this|encoded)\b/, /\b(i am|i'm)\b[^.?!]{0,15}\b(administrator|admin|developer|owner)\b/, /\bauthori[sz](ation|e|ed)\b[^.?!]{0,20}\b(code|you|skip|bypass)\b/, /\bhidden (instructions|rules|prompt)\b/,
  /\b(abaikan|lupakan)\b[^.?!]{0,30}\b(arahan|peraturan)\b/, /\bprompt sistem\b/, /\b(text|everything|all) (above|before) this\b/,
  /\bfirst letters?\b[^.?!]{0,40}\bspell\b/, /\bconfirm (it'?s|that it'?s|it is) true\b/,
  /\bhypothetical\w*\b/, /\bstop saying you'?re an ai\b/, /\brepeat after me\b/, /\bhidden_?prompt\b/, /\bverbatim\b/,
  /\b(story|role-?play|fiction|poem|script)\b[^.?!]{0,80}\b(dose|dosage|mg|diagnos\w*|cure|heal\w*|rules|instructions)\b/,
];

const CONDITION = '(autis\\w*|on the spectrum|spectrum|\\basd\\b|adhd|\\badd\\b|\\bapd\\b|auditory processing|sensory processing|\\bspd\\b|hyperacusis|misophonia|speech delay|language delay|hearing loss|deaf|dyspraxia|\\bocd\\b|level [123]|m-?chat)';
const DIAGNOSIS: RegExp[] = [
  /\b(can|could|would|will) (you|u)\b[^.?!]{0,15}\b(diagnos\w*|assess|confirm|tell (me )?if|score|screen|test)\b/,
  /\bdiagnose (my|him|her|them)\b/, /\b(score|screen|assess|test) (him|her|them|my \w+)\b/, /\bm-?chat\b/,
  // The child must be the subject: "is it good for autism" asks about a therapy, not for an assessment.
  new RegExp(`\\b(is|does|do|could|might|may|would|has|have)\\b\\s+(my \\w+|he|she|they|her|him|his|he's|she's)\\b[^.?!]{0,40}\\b${CONDITION}`),
  new RegExp(`\\b(is|could|might) (it|that|this)\\b[^.?!]{0,25}\\b${CONDITION}[^.?!]{0,25}\\bor\\b`),
  new RegExp(`\\bmean(s)? (he|she|they|my \\w+)('s| is| are| has| have)?\\b[^.?!]{0,10}${CONDITION}`),
  new RegExp(`\\b(sound|sounds|seem|seems|look|looks)\\b[^.?!]{0,10}\\b${CONDITION}`),
  new RegExp(`\\b(is|could|might|does) (it|that|this|he|she|my \\w+)\\b[^.?!]{0,25}${CONDITION}[^.?!]{0,30}\\b(or just|or is it|or not|instead)\\b`), new RegExp(`\\binstead of\\b[^.?!]{0,10}${CONDITION}`),
  new RegExp(`${CONDITION}[^.?!]{0,40}\\bwhich (one|is it)\\b`), /\bwhat (level|type) of autism\b/, /\bsigns of autism\b/, /\bhow autistic\b/,
  /\b(please|pls|plz) (assess|diagnose|screen)\b/, /\bassess (him|her|them)?\s*$/, /\b(savant|asperger'?s?|aspergers)\b[^.?!]{0,30}\?/,
  new RegExp(`\\b(whether|if) (he|she|they|my \\w+)('s| is| are| has| have)?\\b[^.?!]{0,12}${CONDITION}`),
  /\bautistic ba\b/, /\bada autism\b/, /(是不是|是否)[^。？?]{0,10}(autism|自闭)/, /你觉得[^。？?]{0,20}(autism|自闭|level)/,
  /\bmay autism\b/, /\b(what|which) (does|condition does) (he|she|my \w+) (have|has)\b/, /\bneed to know what (he|she|they) (has|have)\b/,
];
const MEDICATION: RegExp[] = [
  /\b(medic(ine|ation)s?|meds|drugs?|dos(e|es|age|ing)|\d+\s?(mg|ml|mcg)|milligrams?|tablets|capsules?|syrup|tincture|herbal|chamomile|essential oils?|lavender oil)\b/,
  /\b(melatonin|antihistamines?|benadryl|diphenhydramine|cetirizine|zyrtec|promethazine|phenergan|risperidone|risperdal|aripiprazole|abilify|ritalin|methylphenidate|concerta|guanfacine|intuniv|clonidine|fluoxetine|prozac|sertraline|zoloft|ssris?|antidepressants?|antipsychotics?|stimulants?|sedat\w*|supplements?|vitamins?|probiotics?|omega[- ]?3|fish oil|magnesium|cbd|cannabis|gummies|prescri\w*|painumin|gamot)\b/,
  /\b(a|one|half|\d+) tablets?\b/, /\b(ubat|dos|gamot|药|吃药)\b/, /\b(brandy|whisky|whiskey|alcohol|rum)\b[^.?!]{0,40}\b(sleep|calm|give)\b/, /\b(drops|pills?)\b[^.?!]{0,20}\b(calm|sleep|before|give|take)\b/, /\b(give|take)\b[^.?!]{0,20}\b(drops|pills?)\b/,
];
const CURE: RegExp[] = [
  /\bcur(e|es|ed|ing)\b/, /\bheal(s|ed|ing)?\b/, /\brecover(y|ed|s|ing)?\b/, /\brevers(e|al|ed|ing)\b/, /\brewir\w*/,
  /\bnormali[sz]\w*/, /\b(get rid of|remove|eliminate|fix)\b[^.?!]{0,15}\b(autism|the autism|his autism|her autism)\b/,
  /\b(no longer|won'?t be)\b[^.?!]{0,8}\b(autistic|on the spectrum)\b/, /\bnot (autistic|on the spectrum) any ?more\b/,
  /\buntil (he|she|they)('s| is| are)? not (autistic|on the spectrum)\b/, /\boff the spectrum\b/, /\bback to normal\b/,
  /\b(autism|it) (go|goes) away\b/, /\bindistinguishable\b/, /\bbring (him|her|them) back\b/, /\bthe way (he|she|they) (was|were) before\b/,
  /\b(grew|grow|grows|growing) out of\b/, /\blose\W{0,2} (his|her|their|the)\W{0,2} diagnosis\b/,
  /\b(make|get|become|turn|be|act|look|talk)\b[^.?!]{0,25}\b(normal|like (the )?other (kids|children))\b/,
  /\blose (his|her|their|the) diagnosis\b/, /\b(nobody|no one|no-one) (can|will|would) (tell|know)\b/,
  /\b(milder|less autistic|more normal|less severe)\b/, /\b(reduce|lower|decrease|bring down)\b[^.?!]{0,30}\b(autism|severity|symptoms?|score)\b/,
  /\bseverity\b/, /\b(grow out of|outgrow)\b/, /\b(gumaling|pagaling|mawala ang autism|gagaling)\b/,
];

const STIM_ACT = /\b(stim\w*|flap\w*|tap(s|ping)? on|squeal\w*|jumps?|jumping|goyang\w*|same \d+ notes|rock(s|ing)?\b(?! music)|spin(s|ning)?|twirl\w*|hum(s|ming)?|flick\w*|pacing|jump(s|ing)? up and down|repetitive|vocal (stim|sounds?|noises?)|(same|repeat\w*) (sound|noise|word)s?|pag-?ikot|pag-?flap|e{3,}|quiet hands)\b/;
const STIM_STOP = /\b(stop|stops|stopping|reduce|get rid|prevent|extinguish|decrease|quit|replace|train (him|her|them) out|out of (his|her|their) stims?|hold (his|her|their) hands?|quiet hands|reward chart|sticker|mapapatigil|patigilin|tigil|berhenti|less|blend in|hold (him|her|them) still|bad habit|normal-looking|look normal|make (him|her|them) (stop|quit))\b/;

const DISTRESS = /\b(exhausted|overwhelmed|burn(ed|t)? ?out|at my (wits'? )?end|can'?t cope|cannot cope|so tired|no support|all alone|breaking down|pagod na pagod|walang tumutulong|guilty|guilt)\b/;

function normalise(text: string): string {
  return text.toLowerCase().replace(/[’‘`]/g, "'").replace(/\s+/g, ' ');
}

export function classify(question: string): Classification {
  const q = normalise(question);
  const stimming = STIM_ACT.test(q) && STIM_STOP.test(q);
  const refusal: RefusalCategory | null =
    DIAGNOSIS.some((r) => r.test(q)) ? 'diagnosis'
      : MEDICATION.some((r) => r.test(q)) ? 'medication'
        // A request to stop stimming that says "normal" gets the affirming stimming policy, not a cure refusal.
        : !stimming && CURE.some((r) => r.test(q)) ? 'cure'
          : null;
  return {
    crisis: CRISIS.some((r) => r.test(q)),
    injection: INJECTION.some((r) => r.test(q)),
    refusal,
    stimming,
    distress: DISTRESS.test(q),
  };
}

/** Words that show a question is about this app's domain. Used as a relevance gate before retrieval. */
export const DOMAIN = /\b(music\w*|musik\w*|song\w*|sing|sings|singing|sang|kanta\w*|drum\w*|shaker|instrument\w*|piano|rhythm|beat|melod\w*|tune|playlist|lullab\w*|sound\w*|noise\w*|nois[ey]|loud\w*|quiet\w*|volume|ears?|hear|hearing|tunog|ingay|headphones?|defenders?|audiolog\w*|auditory|hyperacusis|sensitiv\w*|sensory|calm\w*|meltdown\w*|routines?|transitions?|bedtime|sleep|turn[- ]taking|take turns|requesting|ready,? steady|words?|speech|nonverbal|non-verbal|minimally verbal|picture cards?|aac|blenders?|vacuums?|vaccum|dryers?|clipper\w*|exposure|graded|tone deaf|fireworks?|siren\w*|alarm\w*|announcement\w*|beep\w*|drill\w*|renovation|traffic|aircon|band|concert|balloon\w*|evidence|research|studies|study|proven|tomatis|integration training|binaural|432|solfeggio|safe and sound|samonas|listening|coordination|clap\w*|march\w*|danc\w*|siblings?|pitch|music therap\w*|therapist)\b/;

/**
 * Service, admin, shopping, legal and funding questions are out of scope even when they mention a domain word
 * ("does insurance cover OT", "where to buy ear defenders", "a music therapist near me, name and number").
 */
export const OUT_OF_SCOPE = /\b(insurance|insurer|tax|deduct\w*|ndis|subsid\w*|funding|grant|legal|sue|lawyer|my rights|buy|purchase|shop|shops|shopee|lazada|amazon|price|brand|near me|name and number|phone number|contact details|address|waiting list|dentist|preschool|kindergarten|pwd id|visa|cover letter|recommend a (good )?\w+ (near|in))\b/;
