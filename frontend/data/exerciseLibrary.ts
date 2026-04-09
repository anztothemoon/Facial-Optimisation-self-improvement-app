/**
 * Large library of face / neck / posture / mobility drills for timer-based sessions.
 * `visualHint` is an emoji cue (no bundled image assets required).
 */

export type ExerciseRegion =
  | 'face'
  | 'jaw'
  | 'neck'
  | 'posture'
  | 'shoulders'
  | 'core'
  | 'breath'
  | 'mobility'
  | 'eyes'
  | 'habits';

export type ExerciseDef = {
  id: string;
  name: string;
  region: ExerciseRegion;
  seconds: number;
  steps: string[];
  visualHint: string;
};

function ex(
  id: string,
  name: string,
  region: ExerciseRegion,
  seconds: number,
  steps: string[],
  visualHint: string
): ExerciseDef {
  return { id, name, region, seconds, steps, visualHint };
}

/** 80+ exercises — mix of short holds and mobility work */
export const EXERCISE_LIBRARY: ExerciseDef[] = [
  ex('e001', 'Nasal diaphragmatic breathing', 'breath', 60, ['Lie or sit tall', 'Inhale nose 4s', 'Exhale nose 6–8s'], '🫁'),
  ex('e002', 'Box breathing (4-4-4-4)', 'breath', 75, ['Inhale 4s • hold 4s', 'Exhale 4s • hold 4s', 'Repeat smooth'], '📦'),
  ex('e003', 'Extended exhale calm', 'breath', 55, ['Inhale 3s', 'Long exhale 8–10s', 'Relax shoulders'], '🌊'),
  ex('e004', 'Jaw release + sigh', 'jaw', 45, ['Let teeth part slightly', 'Soft tongue on palate', 'Two gentle sighs out'], '😌'),
  ex('e005', 'Chin tuck isometric', 'neck', 50, ['Ears over shoulders', 'Slide chin back', 'Hold without strain'], '🎯'),
  ex('e006', 'Chin tuck reps', 'neck', 55, ['Slow tuck', 'Return neutral', '12–15 smooth reps'], '↩️'),
  ex('e007', 'Upper trap stretch L', 'neck', 40, ['Ear toward shoulder', 'Opposite hand behind back', 'Breathe into stretch'], '↔️'),
  ex('e008', 'Upper trap stretch R', 'neck', 40, ['Switch sides', 'No sharp pain', 'Gentle hold'], '↔️'),
  ex('e009', 'Levator scap stretch L', 'neck', 45, ['Nose toward armpit', 'Light hand assist', '3–5 breaths'], '🧭'),
  ex('e010', 'Levator scap stretch R', 'neck', 45, ['Mirror on R side', 'Keep jaw relaxed', 'Easy range'], '🧭'),
  ex('e011', 'Neck rotation L', 'neck', 50, ['Turn head slowly', 'Stay tall', 'Pause at end range'], '🔄'),
  ex('e012', 'Neck rotation R', 'neck', 50, ['Smooth arc', 'Eyes soft', 'No forcing'], '🔄'),
  ex('e013', 'Neck side bend L', 'neck', 45, ['Ear toward shoulder', 'Opposite shoulder down', 'Breathe'], '⤵️'),
  ex('e014', 'Neck side bend R', 'neck', 45, ['Switch', 'Keep chin slightly tucked', 'Relax jaw'], '⤵️'),
  ex('e015', 'Suboccipital release ball', 'neck', 50, ['Lie on small ball at skull base', 'Tiny nods', 'Light pressure'], '⚪'),
  ex('e016', 'Wall angel warm-up', 'posture', 60, ['Back to wall', 'Arms W shape', 'Slide up/down'], '🧱'),
  ex('e017', 'Scapular retraction squeeze', 'shoulders', 50, ['Pinch shoulder blades', 'Hold 3s', 'Repeat'], '🧷'),
  ex('e018', 'Band pull-apart', 'shoulders', 45, ['Light band', 'Pull to chest height', 'Control return'], '🪢'),
  ex('e019', 'External rotation with band', 'shoulders', 50, ['Elbows at sides', 'Rotate out', 'Slow eccentric'], '🔄'),
  ex('e020', 'Prone Y raise', 'shoulders', 45, ['Lie face down', 'Thumbs up', 'Lift chest slightly'], '✌️'),
  ex('e021', 'Prone T raise', 'shoulders', 45, ['Arms out to sides', 'Squeeze mid-back', 'Lower slow'], '✝️'),
  ex('e022', 'Serratus punch plus', 'shoulders', 55, ['Straight arm reach', 'Round upper back slightly', 'Protract/retract'], '👊'),
  ex('e023', 'Dead bug ISO hold', 'core', 55, ['Back flat', 'Hips/knees 90', 'Reach opposite limbs'], '🐞'),
  ex('e024', 'Bird dog hold', 'core', 50, ['Quadruped', 'Reach long', 'Hips square'], '🐕'),
  ex('e025', 'Side plank knee L', 'core', 40, ['Elbow under shoulder', 'Lift hips', 'Breathe'], '📐'),
  ex('e026', 'Side plank knee R', 'core', 40, ['Switch sides', 'Neck neutral', 'Quality over height'], '📐'),
  ex('e027', 'McGill curl-up', 'core', 50, ['One knee bent', 'Hands under low back', 'Small crunch'], '📎'),
  ex('e028', 'Standing pelvic tilt', 'posture', 45, ['Hands on hips', 'Rock pelvis', 'Find neutral'], '⚖️'),
  ex('e029', 'Thoracic extension over chair', 'posture', 55, ['Mid-back on chair edge', 'Support head', 'Extend gently'], '🪑'),
  ex('e030', 'Cat-cow slow', 'mobility', 60, ['Quadruped', 'Flex/extend spine', 'Let neck follow'], '🐈'),
  ex('e031', 'Thread the needle L', 'mobility', 45, ['Reach under', 'Open back', 'Breathe'], '🪡'),
  ex('e032', 'Thread the needle R', 'mobility', 45, ['Switch', 'Keep hips stable', 'Smooth'], '🪡'),
  ex('e033', 'Open book L', 'mobility', 50, ['Side lie', 'Top knee block', 'Rotate open'], '📖'),
  ex('e034', 'Open book R', 'mobility', 50, ['Mirror', 'Control rotation', 'Eyes follow hand'], '📖'),
  ex('e035', 'Hip flexor stretch L', 'mobility', 55, ['Half kneel', 'Squeeze glute', 'Tall torso'], '🦵'),
  ex('e036', 'Hip flexor stretch R', 'mobility', 55, ['Switch legs', 'Ribs down', 'No arching'], '🦵'),
  ex('e037', 'Standing forward fold', 'mobility', 45, ['Soft knees', 'Hang heavy head', 'Shake out'], '🌿'),
  ex('e038', 'Calf raise holds', 'mobility', 50, ['Wall touch', 'Lift heels', 'Pause top'], '🦶'),
  ex('e039', 'Ankle circles L', 'mobility', 35, ['Point/flex', 'Slow circles', 'No cracking chase'], '⭕'),
  ex('e040', 'Ankle circles R', 'mobility', 35, ['Switch', 'Smooth range', 'Breathe'], '⭕'),
  ex('e041', 'Masseter self-massage L', 'jaw', 40, ['Clean hands', 'Small circles at cheek', 'Light pressure'], '💆'),
  ex('e042', 'Masseter self-massage R', 'jaw', 40, ['Switch', 'Avoid clenching', 'Relax between'], '💆'),
  ex('e043', 'TMJ relaxation cue', 'jaw', 45, ['Lips together teeth apart', 'Warm washcloth optional', 'Slow breaths'], '😶'),
  ex('e044', 'Cheek puff + release', 'face', 35, ['Air in cheeks', 'Hold 3s', 'Slow release'], '🎈'),
  ex('e045', 'Lip seal + nasal breath', 'face', 40, ['Light lip seal', 'All nasal', 'Quiet'], '👄'),
  ex('e046', 'Smile + relax cycles', 'face', 40, ['Gentle smile', 'Fully release', '10 cycles'], '😊'),
  ex('e047', 'Eye palming', 'eyes', 50, ['Rub palms warm', 'Cup eyes', 'No pressure on eyeball'], '🙈'),
  ex('e048', '20-20-20 screen habit drill', 'eyes', 45, ['Look 20ft away', '20 seconds', 'Blink fully'], '👀'),
  ex('e049', 'Figure-eight eye tracking', 'eyes', 40, ['Slow big figure 8', 'Head still', 'Smooth'], '∞'),
  ex('e050', 'Brow + orbicularis light massage', 'face', 40, ['Ring fingers', 'Outward strokes', 'Feather light'], '✨'),
  ex('e051', 'Nasal strips breathing cue', 'breath', 35, ['Focus on nostril airflow', 'Relax mouth', 'Count breaths'], '👃'),
  ex('e052', 'Posture alarm reset', 'habits', 30, ['Stand', 'Roll shoulders', 'Set phone away', 'One deep breath'], '⏰'),
  ex('e053', 'Hydration + swallow cue', 'habits', 25, ['Small sip', 'Swallow mindfully', 'Unclench jaw'], '💧'),
  ex('e054', 'Salt awareness pause', 'habits', 25, ['Notice cravings', 'Plan meal', 'Relax face'], '🧂'),
  ex('e055', 'Sleep wind-down stretch', 'habits', 45, ['Gentle neck rolls', 'Dim lights', 'Slow exhale'], '🌙'),
  ex('e056', 'Mewing light posture cue', 'jaw', 40, ['Whole tongue up', 'Teeth apart', 'Nasal breathe'], '👅'),
  ex('e057', 'Suprahyoid stretch', 'neck', 45, ['Tuck chin', 'Lift sternum slightly', 'Easy hold'], '📏'),
  ex('e058', 'Longus colli activation', 'neck', 50, ['Supine', 'Nod “yes” tiny range', 'No strain'], '🔋'),
  ex('e059', 'Scalene stretch L', 'neck', 45, ['Clavicle anchor', 'Gentle side bend away', 'Breathe'], '🎻'),
  ex('e060', 'Scalene stretch R', 'neck', 45, ['Mirror', 'Micro adjustments', 'Stop if dizzy'], '🎻'),
  ex('e061', 'Wall posture check', 'posture', 40, ['Heels, glutes, upper back, head touch', 'Slide up tall', 'Hold'], '🧍'),
  ex('e062', 'Brugger relief position', 'posture', 50, ['Sit edge', 'Open chest', 'Externally rotate arms'], '🪑'),
  ex('e063', 'Farmer carry posture walk', 'posture', 55, ['Light weights optional', 'Tall ribs', 'Short steps'], '🚶'),
  ex('e064', 'Face posture check mirror', 'face', 35, ['Neutral brows', 'Soft eyes', 'Jaw unclenched'], '🪞'),
  ex('e065', 'Cheek lift + hold', 'face', 35, ['Smile lines engaged', 'Hold 5s', 'Release slowly'], '🙂'),
  ex('e066', 'Forehead smooth', 'face', 30, ['Fingers on forehead', 'Gentle glide up', 'Relax'], '🧴'),
  ex('e067', 'Platysma light stretch', 'neck', 40, ['Turn slightly', 'Pull corner of mouth down', 'Easy'], '😬'),
  ex('e068', 'Sternocleidomastoid stretch L', 'neck', 45, ['Rotate away', 'Tilt head back slightly', 'Mild'], '🧣'),
  ex('e069', 'Sternocleidomastoid stretch R', 'neck', 45, ['Switch', 'No vertigo', 'Stop if needed'], '🧣'),
  ex('e070', 'Shoulder roll + shrug down', 'shoulders', 45, ['Big roll back', 'Drop shoulders heavy', 'Repeat'], '🔃'),
  ex('e071', 'Doorway pec stretch', 'shoulders', 50, ['Forearm on frame', 'Step through', 'Open chest'], '🚪'),
  ex('e072', 'Downward dog pedal', 'mobility', 55, ['Heels toward floor', 'Pedal legs', 'Relax neck'], '🐕'),
  ex('e073', 'Child pose breathing', 'mobility', 50, ['Knees wide', 'Arms forward', 'Belly breaths'], '🧒'),
  ex('e074', 'Pigeon prep L', 'mobility', 55, ['Shin angle safe', 'Square hips', 'Support with hands'], '🕊️'),
  ex('e075', 'Pigeon prep R', 'mobility', 55, ['Switch', 'Fold forward if able', 'Soft face'], '🕊️'),
  ex('e076', 'Lateral neck glide', 'neck', 45, ['Slide head sideways', 'Keep nose forward', 'Slow'], '↔️'),
  ex('e077', 'Resisted chin tuck (hand)', 'neck', 50, ['Fingers at chin', 'Press lightly', 'Isometric match'], '✋'),
  ex('e078', 'Supine neck flexion', 'neck', 45, ['Small nod', 'Chin toward throat', 'No lifting head high'], '🛏️'),
  ex('e079', 'Standing T-spine opener', 'mobility', 55, ['Hinge hips', 'Arms overhead light', 'Reach long'], '🙆'),
  ex('e080', 'Breath holds light (Wim-light)', 'breath', 40, ['Normal inhale', 'Soft exhale', 'Comfortable pause'], '✨'),
  ex('e081', 'Jaw lateral glide L', 'jaw', 35, ['Slow shift', 'Stay pain-free', 'Relax'], '↔️'),
  ex('e082', 'Jaw lateral glide R', 'jaw', 35, ['Mirror', 'Tiny range', 'No clicking chase'], '↔️'),
  ex('e083', 'Tongue sweep swallow', 'habits', 35, ['Front to back sweep', 'Swallow', 'Unclench'], '👅'),
  ex('e084', 'Cold rinse face (optional)', 'face', 30, ['Splash cool water', 'Pat dry', 'Moisturize after'], '💦'),
  ex('e085', 'Gratitude micro-break', 'habits', 35, ['Name 1 win', 'Drop shoulders', 'Slow exhale'], '🙏'),
  ex('e086', 'Neck isometric side bend L', 'neck', 45, ['Hand on side of head', 'Press gently', 'Match with neck'], '💪'),
  ex('e087', 'Neck isometric side bend R', 'neck', 45, ['Switch', 'Light effort', 'Breathe'], '💪'),
  ex('e088', 'Prone W to Y', 'shoulders', 55, ['Lie face down', 'W position lift', 'Transition to Y'], '🔱'),
  ex('e089', 'Bear plank hover', 'core', 45, ['Knees float', 'Short hold', 'Quiet neck'], '🐻'),
  ex('e090', 'Standing side reach', 'mobility', 40, ['Reach overhead', 'Lean slightly', 'Alternate'], '🌤️'),
];

export function regionsForFilter(): (ExerciseRegion | 'all')[] {
  return [
    'all',
    'face',
    'jaw',
    'neck',
    'posture',
    'shoulders',
    'core',
    'breath',
    'mobility',
    'eyes',
    'habits',
  ];
}

export function filterExercises(
  region: ExerciseRegion | 'all',
  query: string
): ExerciseDef[] {
  const q = query.trim().toLowerCase();
  return EXERCISE_LIBRARY.filter((e) => {
    if (region !== 'all' && e.region !== region) return false;
    if (!q) return true;
    return (
      e.name.toLowerCase().includes(q) ||
      e.steps.some((s) => s.toLowerCase().includes(q))
    );
  });
}

export function randomSession(count: number, seedRegion?: ExerciseRegion | 'all'): ExerciseDef[] {
  const pool =
    seedRegion && seedRegion !== 'all'
      ? EXERCISE_LIBRARY.filter((e) => e.region === seedRegion)
      : [...EXERCISE_LIBRARY];
  if (pool.length === 0) return [];
  const out: ExerciseDef[] = [];
  const n = Math.min(count, pool.length);
  const used = new Set<string>();
  let guard = 0;
  while (out.length < n && guard < 600) {
    guard += 1;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (!used.has(pick.id)) {
      used.add(pick.id);
      out.push(pick);
    }
  }
  return out;
}

export function getExerciseById(id: string): ExerciseDef | undefined {
  return EXERCISE_LIBRARY.find((e) => e.id === id);
}
