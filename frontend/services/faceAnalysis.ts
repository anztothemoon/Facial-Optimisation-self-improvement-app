export type FaceMetricKey =
  | 'jawline'
  | 'cheekbones'
  | 'chin'
  | 'symmetry'
  | 'eyes'
  | 'skin'
  | 'nose'
  | 'lips'
  | 'facialThirds'
  | 'facialHarmony';

export type FaceMetric = {
  key: FaceMetricKey;
  label: string;
  score: number;
};

export type FaceAnalysisResult = {
  overallScore: number;
  label: 'Weak' | 'Average' | 'Strong' | 'Elite';
  metrics: FaceMetric[];
  priorityImprovementAreas: string[];
  maxPotential: number;
  timelineWeeks: number;
};

export type FaceInsight = {
  area: string;
  finding: string;
  whyItMatters: string;
  actions: string[];
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function scoreLabel(score: number): FaceAnalysisResult['label'] {
  if (score < 50) return 'Weak';
  if (score < 70) return 'Average';
  if (score < 85) return 'Strong';
  return 'Elite';
}

/**
 * Deterministic heuristic analysis until CV/AI backend is connected.
 */
export function buildFaceAnalysis(seed = 0): FaceAnalysisResult {
  const metricDefs: Array<{ key: FaceMetricKey; label: string; base: number }> = [
    { key: 'jawline', label: 'Jawline', base: 71 },
    { key: 'cheekbones', label: 'Cheekbones', base: 66 },
    { key: 'chin', label: 'Chin', base: 68 },
    { key: 'symmetry', label: 'Symmetry', base: 74 },
    { key: 'eyes', label: 'Eyes', base: 78 },
    { key: 'skin', label: 'Skin', base: 72 },
    { key: 'nose', label: 'Nose', base: 70 },
    { key: 'lips', label: 'Lips', base: 73 },
    { key: 'facialThirds', label: 'Facial thirds', base: 69 },
    { key: 'facialHarmony', label: 'Facial harmony', base: 75 },
  ];

  const metrics = metricDefs.map((m, idx) => {
    const drift = ((seed + idx * 13) % 9) - 4;
    return { key: m.key, label: m.label, score: clamp(m.base + drift, 40, 96) };
  });

  const overallScore = Math.round(
    metrics.reduce((acc, m) => acc + m.score, 0) / metrics.length
  );
  const sortedWeakest = [...metrics].sort((a, b) => a.score - b.score);
  const priorityImprovementAreas = sortedWeakest.slice(0, 3).map((m) => m.label);
  const maxPotential = clamp(overallScore + 14, overallScore + 4, 99);
  const gap = maxPotential - overallScore;
  const timelineWeeks = clamp(Math.round(gap / 2), 4, 20);

  return {
    overallScore,
    label: scoreLabel(overallScore),
    metrics,
    priorityImprovementAreas,
    maxPotential,
    timelineWeeks,
  };
}

function findMetric(
  metrics: FaceMetric[],
  key: FaceMetricKey,
  fallback = 65
): number {
  return metrics.find((m) => m.key === key)?.score ?? fallback;
}

export function buildFaceInsights(result: FaceAnalysisResult): FaceInsight[] {
  const symmetry = findMetric(result.metrics, 'symmetry');
  const skin = findMetric(result.metrics, 'skin');
  const jawline = findMetric(result.metrics, 'jawline');
  const eyes = findMetric(result.metrics, 'eyes');
  const thirds = findMetric(result.metrics, 'facialThirds');

  return [
    {
      area: 'Facial symmetry',
      finding:
        symmetry < 70
          ? 'Mild left-right asymmetry indicators are present in your scan profile.'
          : 'Symmetry is relatively balanced with minor natural variation.',
      whyItMatters:
        'Humans tend to perceive symmetry as a cue of balance and recovery state; poor sleep, stress, and posture can temporarily worsen facial asymmetry.',
      actions: [
        'Sleep 7.5-9h consistently; poor sleep increases fluid retention and asymmetry.',
        'Reduce high-sodium late meals to lower morning puffiness.',
        'Train posture: chin tucks and thoracic extension 5-10 min/day.',
      ],
    },
    {
      area: 'Jawline definition',
      finding:
        jawline < 72
          ? 'Lower-face definition appears softened, often linked with body-fat and fluid retention.'
          : 'Jawline projection and lower-face structure are above average.',
      whyItMatters:
        'Lower-face contour is strongly affected by fat distribution, hydration status, and neck posture more than bone structure alone in short timelines.',
      actions: [
        'Maintain a moderate calorie deficit if fat loss is a goal.',
        'Prioritize protein intake and resistance training to keep muscle while leaning out.',
        'Practice neutral neck posture through the day; avoid constant forward-head position.',
      ],
    },
    {
      area: 'Periorbital / eye area',
      finding:
        eyes < 72
          ? 'Eye area reads more fatigued (possible low lid support / under-eye shadow).'
          : 'Eye openness and resting alertness are strong.',
      whyItMatters:
        'The eye region heavily drives perceived attractiveness and energy. Sleep debt and dehydration can reduce upper-lid tone and increase under-eye contrast.',
      actions: [
        'Keep a fixed wake time, even on weekends.',
        'Hydrate early in the day and limit alcohol before bed.',
        'Use morning light exposure and brief cold rinse for temporary de-puffing.',
      ],
    },
    {
      area: 'Skin quality',
      finding:
        skin < 72
          ? 'Texture/clarity score suggests scope for barrier and inflammation improvements.'
          : 'Skin clarity and tone are trending strong.',
      whyItMatters:
        'Even skin texture strongly boosts attractiveness perceptions. UV exposure and inflammation are major drivers of visible aging and uneven tone.',
      actions: [
        'Daily SPF 30+ and gentle cleanser/moisturizer routine.',
        'Eat omega-3-rich foods, colorful vegetables, and sufficient protein.',
        'Avoid smoking/vaping and minimize high-glycemic binge patterns.',
      ],
    },
    {
      area: 'Facial thirds harmony',
      finding:
        thirds < 70
          ? 'Upper-mid-lower thirds look slightly imbalanced in current scan angles.'
          : 'Facial thirds are proportionally harmonious.',
      whyItMatters:
        'Camera angle, lens distance, and head tilt can exaggerate disproportion, so consistency in scan capture is essential before drawing conclusions.',
      actions: [
        'Capture scans at eye-level camera height with neutral head tilt.',
        'Keep fixed lighting and distance each week for accurate trend comparisons.',
        'Track trend over 6-8 weeks rather than one-off photos.',
      ],
    },
  ];
}

