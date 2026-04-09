/**
 * AI coach chat — expects requireFirebaseUser middleware; loads Firestore user context,
 * calls OpenAI when OPENAI_API_KEY is set, otherwise returns a heuristic reply.
 */
const { getAdmin } = require('./firebaseAdmin');

function defaultContext() {
  return {
    goals: [],
    age: null,
    heightCm: null,
    weightKg: null,
    bodyType: null,
    fitnessLevel: null,
    faceStructure: null,
    latestNutrition: null,
  };
}

async function loadUserContext(uid) {
  const admin = getAdmin();
  if (!admin) return null;
  const db = admin.firestore();
  const userSnap = await db.collection('users').doc(uid).get();
  const userData = userSnap.exists ? userSnap.data() : {};

  const onboarding = userData.onboardingProfile || {};
  let latestNutrition = null;
  try {
    const nutSnap = await db
      .collection('users')
      .doc(uid)
      .collection('dailyNutrition')
      .orderBy('dateKey', 'desc')
      .limit(1)
      .get();
    if (!nutSnap.empty) {
      latestNutrition = nutSnap.docs[0].data();
    }
  } catch {
    // Missing index or empty — ignore
  }

  return {
    goals: Array.isArray(onboarding.goals) ? onboarding.goals : [],
    age: onboarding.age ?? null,
    heightCm: onboarding.heightCm ?? null,
    weightKg: onboarding.weightKg ?? null,
    bodyType: onboarding.bodyType ?? null,
    fitnessLevel: onboarding.fitnessLevel ?? null,
    faceStructure: onboarding.faceStructure ?? null,
    latestNutrition: latestNutrition
      ? {
          calories: latestNutrition.calories,
          proteinG: latestNutrition.proteinG,
          goal: latestNutrition.calorieGoal,
        }
      : null,
  };
}

function buildSystemPrompt(context) {
  const lines = [
    'You are a supportive fitness, grooming, and wellness coach for a mobile app user.',
    'Give concise, actionable advice (short paragraphs or bullets). This is not telehealth: do not diagnose, prescribe medication, or interpret lab results.',
    'If the user describes chest pain, stroke symptoms, severe shortness of breath, thoughts of self-harm, or any emergency: tell them to call local emergency services immediately and seek in-person care.',
    'Do not request or store government IDs, full medical records, or highly sensitive health data in chat. Encourage a qualified clinician for medical concerns.',
    'Personalize using the user profile below. If asked about jawline, posture, skin, workouts, haircuts, or style, tailor to their goals and body/face data.',
    '',
    'User profile:',
    `- Goals: ${context.goals.length ? context.goals.join(', ') : 'not set'}`,
    `- Age: ${context.age ?? 'unknown'}`,
    `- Height (cm): ${context.heightCm ?? 'unknown'}`,
    `- Weight (kg): ${context.weightKg ?? 'unknown'}`,
    `- Body type: ${context.bodyType ?? 'unknown'}`,
    `- Fitness level: ${context.fitnessLevel ?? 'unknown'}`,
    `- Face structure (self-reported): ${context.faceStructure ?? 'unknown'}`,
  ];
  if (context.latestNutrition) {
    lines.push(
      `- Latest logged day: ~${context.latestNutrition.calories} kcal (goal ${context.latestNutrition.goal}), protein ~${context.latestNutrition.proteinG}g`
    );
  } else {
    lines.push('- Nutrition logs: none yet — encourage logging.');
  }
  return lines.join('\n');
}

async function callOpenAI(systemPrompt, messages) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.warn('[chat] OPENAI_API_KEY is not set — using heuristic replies');
    return null;
  }
  const base = (process.env.OPENAI_API_BASE || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const body = {
    model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    max_tokens: Number(process.env.OPENAI_MAX_TOKENS || 900),
    temperature: 0.65,
  };
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let errText = await res.text();
    try {
      const j = JSON.parse(errText);
      errText = j.error?.message || errText;
    } catch {
      /* keep raw */
    }
    console.error('[chat] OpenAI HTTP', res.status, errText);
    throw new Error(`OpenAI error: ${res.status} ${errText.slice(0, 500)}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  return text || null;
}

function heuristicReply(userMessage, context) {
  const q = userMessage.toLowerCase();
  const hello = /^(hi|hello|hey|yo)\b/.test(q);
  if (hello) {
    return (
      `Hey — glad you're here. I can help with jawline, skin, haircut, posture, fat loss, and routines. ` +
      `If you want, start with one goal for this week and I will give you a daily plan.`
    );
  }

  if (q.includes('hair') || q.includes('haircut')) {
    return (
      `Based on your self-reported face shape (${context.faceStructure || 'general'}), consider styles that add structure without hiding your jaw: ` +
      `side parts or textured crops often work well; avoid heavy bangs if you want a longer-looking face. ` +
      `Your goals (${context.goals.length ? context.goals.join(', ') : 'general health'}) suggest keeping grooming consistent — ask a stylist for a cut that matches your maintenance level.`
    );
  }
  if (q.includes('jawline') || q.includes('jaw')) {
    return (
      `For jawline definition, combine body-composition work (${context.weightKg ? `you're around ${context.weightKg} kg` : 'track weight'}) with posture and neck hygiene: ` +
      `chin tucks, gentle neck and jaw mobility, and reducing sodium bloat. ` +
      `Your goals: ${context.goals.length ? context.goals.join(', ') : 'general health'} — align cardio and strength with those.`
    );
  }
  if (q.includes('skin')) {
    return (
      'Skin: prioritize sleep, SPF daily, gentle cleanser AM/PM, and hydration. ' +
      `If you're training hard (${context.fitnessLevel || 'your level'}), rinse sweat promptly and avoid harsh scrubs daily.`
    );
  }
  if (q.includes('plan') || q.includes('routine')) {
    return (
      `Simple 7-day starter:\n` +
      `1) Sleep 7.5h+ nightly\n2) Protein-focused meals and lower late sodium\n3) Strength 3x + light cardio 2x\n` +
      `4) Daily SPF + PM cleanser\n5) 10 min posture/jaw-neck mobility.\n` +
      `Reply with "customize it" and your schedule and I will tailor it.`
    );
  }
  return (
    `Here's a quick take tailored to you: goals (${context.goals.length ? context.goals.join(', ') : 'not set yet'}), ` +
    `fitness ${context.fitnessLevel || 'unspecified'}, face shape ${context.faceStructure || 'unspecified'}. ` +
    `Set a 7-day habit (training + sleep + nutrition logging) and revisit. ` +
    `Tell me your exact goal and timeframe (e.g. "jawline in 6 weeks") and I will build a specific plan.`
  );
}

const MAX_MESSAGE_CHARS = 8000;
const MAX_HISTORY_MESSAGES = 12;

async function postChat(req, res) {
  const decoded = req.firebaseUser;
  const { message, history = [] } = req.body || {};
  let text = typeof message === 'string' ? message.trim() : '';
  if (!text) {
    return res.status(400).json({ error: 'message is required' });
  }
  if (text.length > MAX_MESSAGE_CHARS) {
    text = text.slice(0, MAX_MESSAGE_CHARS);
  }

  let context = defaultContext();
  if (decoded?.uid) {
    try {
      context = (await loadUserContext(decoded.uid)) || defaultContext();
    } catch (e) {
      console.error('[chat] loadUserContext', e);
      context = defaultContext();
    }
  }

  const systemPrompt = buildSystemPrompt(context);
  const recentHistory = Array.isArray(history)
    ? history
        .filter((h) => h && (h.role === 'user' || h.role === 'assistant') && h.content)
        .slice(-MAX_HISTORY_MESSAGES)
        .map((h) => ({ role: h.role, content: String(h.content).slice(0, 4000) }))
    : [];

  try {
    const openaiMessages = [
      ...recentHistory,
      { role: 'user', content: text },
    ];
    let reply = await callOpenAI(systemPrompt, openaiMessages);
    const provider = reply ? 'openai' : 'basic-free';
    if (!reply) {
      reply = heuristicReply(text, context);
    }
    return res.json({ reply, provider });
  } catch (e) {
    console.error('[chat] error', e);
    const reply = heuristicReply(text, context);
    return res.json({ reply, provider: 'basic-free', warning: 'AI provider failed; fallback used' });
  }
}

module.exports = { postChat };
