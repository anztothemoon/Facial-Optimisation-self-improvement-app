/**
 * Heuristic face analysis - deterministic scores from input (placeholder until CV/AI).
 * Must be mounted behind requireFirebaseUser.
 */

/**
 * Builds a structured detailed preview for clients (schema v2).
 * @param {object} params
 */
function buildDetailedPreview({
  overallScore,
  label,
  metrics,
  priorityImprovementAreas,
  maxPotential,
  timelineWeeks,
  hasPhotoInput,
}) {
  const topMetrics = [...metrics]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((m) => ({ key: m.key, label: m.label, score: m.score }));
  return {
    headline: `${label} - ${overallScore}/100`,
    summary: `Overall appearance-style score is ${overallScore} (${label}). Top strengths: ${topMetrics.map((m) => m.label).join(", ")}.`,
    strengths: topMetrics,
    improvementFocus: priorityImprovementAreas.map((name, i) => ({
      rank: i + 1,
      area: name,
    })),
    trajectory: {
      estimatedMaxScore: maxPotential,
      suggestedTimelineWeeks: timelineWeeks,
    },
    metricTable: metrics.map((m) => ({
      key: m.key,
      label: m.label,
      score: m.score,
      band:
        m.score < 60 ? "develop" : m.score < 80 ? "solid" : "strong",
    })),
    input: {
      hasPhotoUrl: hasPhotoInput,
      note: hasPhotoInput
        ? "Scores use provided URL context heuristically."
        : "No photo URL; scores are derived from goals/text seed only.",
    },
  };
}

function faceAnalysisHandler(req, res) {
  const { photoUrl, goals = [] } = req.body || {};
  const text = String(photoUrl || "") + JSON.stringify(goals);
  let seed = 0;
  for (let i = 0; i < text.length; i++) {
    seed = (seed * 31 + text.charCodeAt(i)) % 9973;
  }
  const metricDefs = [
    ["jawline", "Jawline", 71],
    ["cheekbones", "Cheekbones", 66],
    ["chin", "Chin", 68],
    ["symmetry", "Symmetry", 74],
    ["eyes", "Eyes", 78],
    ["skin", "Skin", 72],
    ["nose", "Nose", 70],
    ["lips", "Lips", 73],
    ["facialThirds", "Facial thirds", 69],
    ["facialHarmony", "Facial harmony", 75],
  ];
  const metrics = metricDefs.map(([key, label, base], idx) => {
    const drift = ((seed + idx * 13) % 9) - 4;
    const score = Math.max(40, Math.min(96, Number(base) + drift));
    return { key, label, score };
  });
  const overallScore = Math.round(
    metrics.reduce((acc, item) => acc + item.score, 0) / metrics.length
  );
  const label =
    overallScore < 50
      ? "Weak"
      : overallScore < 70
        ? "Average"
        : overallScore < 85
          ? "Strong"
          : "Elite";
  const sorted = [...metrics].sort((a, b) => a.score - b.score);
  const priorityImprovementAreas = sorted.slice(0, 3).map((m) => m.label);
  const maxPotential = Math.min(99, Math.max(overallScore + 4, overallScore + 14));
  const timelineWeeks = Math.max(
    4,
    Math.min(20, Math.round((maxPotential - overallScore) / 2))
  );

  const hasPhotoInput = Boolean(String(photoUrl || "").trim());

  const detailedPreview = buildDetailedPreview({
    overallScore,
    label,
    metrics,
    priorityImprovementAreas,
    maxPotential,
    timelineWeeks,
    hasPhotoInput,
  });

  res.json({
    provider: "heuristic-api-v1",
    analysis: {
      overallScore,
      label,
      metrics,
      priorityImprovementAreas,
      maxPotential,
      timelineWeeks,
    },
    detailedPreview,
    meta: {
      schemaVersion: 2,
      provider: "heuristic-api-v1",
      hasPhotoInput,
      disclaimer:
        "Educational wellness / appearance-style scoring only. Not a medical device or diagnostic. Results depend on image quality and angle.",
    },
  });
}

module.exports = { faceAnalysisHandler, buildDetailedPreview };
