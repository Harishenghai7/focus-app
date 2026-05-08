/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🧠 BOLTZ RECOMMENDATION ENGINE — Focus Platform
 * Authenticity-First, Anti-Brainrot Content Intelligence
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const WEIGHTS = {
  TRUST_AMPLIFIER: 1.35,
  VERIFIED_BONUS: 1.25,
  ORIGINALITY_BONUS: 1.3,
  LIKE_WEIGHT: 1.0,
  COMMENT_DEPTH_WEIGHT: 3.5,
  SHARE_WEIGHT: 5.0,
  SAVE_WEIGHT: 4.0,
  VIEW_WEIGHT: 0.005,
  COMPLETION_RATE_WEIGHT: 2.5,
  REWATCH_BONUS: 1.8,
  SKIP_PENALTY: 0.4,
  CREATIVITY_BONUS: 1.25,
  LEARNING_BONUS: 1.3,
  INSPIRATION_BONUS: 1.15,
  VELOCITY_CEILING: 400,
  VELOCITY_PENALTY: 0.35,
  RECENCY_WINDOW_HOURS: 72,
  DIVERSITY_INJECTION_RATIO: 0.15,
  NEW_CREATOR_BOOST: 1.4,
  UNDERREPRESENTED_BOOST: 1.2,
  SESSION_DECAY_START_MIN: 20,
  SESSION_DECAY_RATE: 0.015,
  MAX_SESSION_DECAY: 0.4,
};

export const CONTENT_CATEGORIES = {
  LEARNING: { id: 'learning', label: 'Learning', icon: '📚', boost: WEIGHTS.LEARNING_BONUS },
  CREATIVE: { id: 'creative', label: 'Creative', icon: '🎨', boost: WEIGHTS.CREATIVITY_BONUS },
  INSPIRATION: { id: 'inspiration', label: 'Inspiration', icon: '✨', boost: WEIGHTS.INSPIRATION_BONUS },
  LIFESTYLE: { id: 'lifestyle', label: 'Lifestyle', icon: '🌿', boost: 1.0 },
  ENTERTAINMENT: { id: 'entertainment', label: 'Entertainment', icon: '🎭', boost: 1.0 },
  TECH: { id: 'tech', label: 'Tech', icon: '💡', boost: WEIGHTS.LEARNING_BONUS },
  FITNESS: { id: 'fitness', label: 'Fitness', icon: '💪', boost: 1.1 },
  MUSIC: { id: 'music', label: 'Music', icon: '🎵', boost: 1.05 },
};

const CATEGORY_KEYWORDS = {
  learning: ['learn', 'tutorial', 'howto', 'how to', 'explain', 'education', 'study', 'tips', 'guide', 'lesson', 'science', 'history', 'facts'],
  creative: ['art', 'create', 'design', 'paint', 'draw', 'craft', 'diy', 'handmade', 'creative', 'photography', 'animation'],
  inspiration: ['inspire', 'motivation', 'mindset', 'growth', 'journey', 'transform', 'dream', 'goal', 'achieve', 'overcome'],
  tech: ['tech', 'code', 'programming', 'developer', 'ai', 'software', 'app', 'startup', 'innovation', 'gadget'],
  fitness: ['workout', 'fitness', 'gym', 'exercise', 'health', 'yoga', 'run', 'training'],
  music: ['music', 'song', 'sing', 'guitar', 'piano', 'beat', 'remix', 'cover', 'melody'],
};

export const classifyBoltzContent = (boltz) => {
  const text = `${boltz.caption || ''} ${boltz.description || ''} ${(boltz.tags || []).join(' ')}`.toLowerCase();
  let bestCategory = 'entertainment';
  let bestScore = 0;
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let s = 0;
    for (const kw of keywords) { if (text.includes(kw)) s++; }
    if (s > bestScore) { bestScore = s; bestCategory = category; }
  }
  return bestCategory;
};

export const calculateBoltzScore = (boltz, options = {}) => {
  if (!boltz) return 0;
  const { sessionMinutes = 0, seenCreators = new Set(), seenCategories = new Set(), userInterests = [] } = options;
  let score = 0;

  const likes = boltz.likes_count || 0;
  const comments = boltz.comments_count || 0;
  const shares = boltz.shares_count || 0;
  const saves = boltz.saves_count || 0;
  const views = boltz.views_count || 0;

  score += likes * WEIGHTS.LIKE_WEIGHT;
  score += comments * WEIGHTS.COMMENT_DEPTH_WEIGHT;
  score += shares * WEIGHTS.SHARE_WEIGHT;
  score += saves * WEIGHTS.SAVE_WEIGHT;
  score += views * WEIGHTS.VIEW_WEIGHT;

  // Engagement quality ratio
  if (likes > 0) {
    const deepRatio = (comments + shares + saves) / (likes + 1);
    if (deepRatio > 0.08) score *= 1 + Math.min(deepRatio * 0.6, 0.35);
  }

  // Watch quality
  const completionRate = boltz.avg_completion_rate || boltz.completion_rate || 0;
  if (completionRate > 0) {
    score *= 1 + (completionRate * WEIGHTS.COMPLETION_RATE_WEIGHT);
    if (completionRate > 1.0) score *= WEIGHTS.REWATCH_BONUS;
  }
  if (completionRate > 0 && completionRate < 0.15 && views > 50) score *= WEIGHTS.SKIP_PENALTY;

  // Trust amplification
  const trustTier = boltz.user?.trust_tier || boltz.trust_tier || 0;
  const isVerified = boltz.user?.is_verified || boltz.is_verified || false;
  if (isVerified || trustTier >= 4) score *= WEIGHTS.TRUST_AMPLIFIER;
  else if (trustTier >= 2) score *= 1.12;
  if (isVerified) score *= WEIGHTS.VERIFIED_BONUS;

  // Content category boost
  const category = classifyBoltzContent(boltz);
  const catConfig = Object.values(CONTENT_CATEGORIES).find(c => c.id === category);
  if (catConfig) score *= catConfig.boost;
  if (userInterests.length > 0 && userInterests.includes(category)) score *= 1.15;

  // Originality
  if (boltz.is_original !== false) score *= WEIGHTS.ORIGINALITY_BONUS;

  // Recency decay
  const hoursSince = (Date.now() - new Date(boltz.created_at).getTime()) / (1000 * 60 * 60);
  score *= Math.max(0.25, 1 - (hoursSince / (WEIGHTS.RECENCY_WINDOW_HOURS * 2)));

  // Velocity check (anti-manipulation)
  if (hoursSince > 0) {
    const vel = (likes + comments + shares) / hoursSince;
    if (vel > WEIGHTS.VELOCITY_CEILING) score *= WEIGHTS.VELOCITY_PENALTY;
  }

  // Diversity injection
  const creatorId = boltz.user_id || boltz.user?.id;
  if (creatorId && !seenCreators.has(creatorId)) score *= WEIGHTS.UNDERREPRESENTED_BOOST;
  if (category && !seenCategories.has(category)) score *= 1.1;

  // New creator boost
  if ((boltz.user?.posts_count || 0) < 10 && trustTier >= 1) score *= WEIGHTS.NEW_CREATOR_BOOST;

  // Session-aware quality shift
  if (sessionMinutes > WEIGHTS.SESSION_DECAY_START_MIN) {
    const decay = Math.min((sessionMinutes - WEIGHTS.SESSION_DECAY_START_MIN) * WEIGHTS.SESSION_DECAY_RATE, WEIGHTS.MAX_SESSION_DECAY);
    const qf = (completionRate > 0.6 || category === 'learning' || category === 'creative') ? 0.3 : 1.0;
    score *= 1 - (decay * qf);
  }

  return Math.round(score * 100) / 100;
};

const applyDiversityInjection = (sorted) => {
  if (sorted.length <= 3) return sorted;
  const result = [];
  const remaining = [...sorted];
  let lastCreator = null;
  let consec = 0;

  while (remaining.length > 0) {
    let placed = false;
    for (let i = 0; i < remaining.length; i++) {
      const cid = remaining[i].user_id || remaining[i].user?.id;
      if (cid !== lastCreator || consec < 2) {
        result.push(remaining.splice(i, 1)[0]);
        consec = cid === lastCreator ? consec + 1 : 1;
        lastCreator = cid;
        placed = true;
        break;
      }
    }
    if (!placed && remaining.length > 0) {
      result.push(remaining.shift());
      lastCreator = result[result.length - 1].user_id;
      consec = 1;
    }
  }
  return result;
};

export const rankBoltzFeed = (boltzItems, sessionContext = {}) => {
  if (!boltzItems?.length) return [];
  const seenCreators = new Set();
  const seenCategories = new Set();

  const scored = boltzItems.map(item => {
    const score = calculateBoltzScore(item, { ...sessionContext, seenCreators, seenCategories });
    const cid = item.user_id || item.user?.id;
    if (cid) seenCreators.add(cid);
    const cat = classifyBoltzContent(item);
    if (cat) seenCategories.add(cat);
    return { ...item, _recommendationScore: score, _contentCategory: cat };
  });

  scored.sort((a, b) => b._recommendationScore - a._recommendationScore);
  return applyDiversityInjection(scored);
};

export const shouldInsertBreakPoint = (ctx) => {
  const { sessionMinutes = 0, videosWatched = 0, lastBreakAt = 0 } = ctx;
  const since = sessionMinutes - lastBreakAt;
  if (since >= 20 && videosWatched >= 10) {
    return { type: 'gentle', title: "You've been scrolling for a while", message: `${Math.floor(sessionMinutes)} minutes of Boltz — want a breather?`, icon: '☕', dismissible: true };
  }
  if (since >= 45) {
    return { type: 'suggested', title: 'Time for a real break', message: `${videosWatched} videos in ${Math.floor(sessionMinutes)} min. Your eyes will thank you.`, icon: '🌿', dismissible: true };
  }
  return null;
};

export const calculateBoltzTrendingScore = (boltz) => {
  if (!boltz) return 0;
  const h = Math.max(0.5, (Date.now() - new Date(boltz.created_at).getTime()) / 3600000);
  const qe = (boltz.likes_count || 0) + ((boltz.comments_count || 0) * 3) + ((boltz.shares_count || 0) * 5) + ((boltz.saves_count || 0) * 3);
  const vel = qe / h;
  const trust = (boltz.user?.is_verified || boltz.is_verified) ? 1.3 : 1.0;
  const comp = 1 + ((boltz.avg_completion_rate || 0) * 0.5);
  const rec = h < 6 ? 1.5 : (h < 24 ? 1.2 : 1.0);
  return Math.round(vel * trust * comp * rec * 10) / 10;
};

export const getTrendingBoltz = (items, limit = 20) =>
  [...items].map(i => ({ ...i, _trendingScore: calculateBoltzTrendingScore(i) })).sort((a, b) => b._trendingScore - a._trendingScore).slice(0, limit);

export const processNotInterested = (boltz, prefs = {}) => {
  const cat = classifyBoltzContent(boltz);
  const cid = boltz.user_id || boltz.user?.id;
  const u = { ...prefs };
  if (!u.dismissedCategories) u.dismissedCategories = {};
  u.dismissedCategories[cat] = (u.dismissedCategories[cat] || 0) + 1;
  if (!u.dismissedCreators) u.dismissedCreators = {};
  if (cid) u.dismissedCreators[cid] = (u.dismissedCreators[cid] || 0) + 1;
  return u;
};
