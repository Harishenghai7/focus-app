import React, { useState, useEffect, useRef } from 'react';
import { BADGE_DEFINITIONS, selectPrimaryBadge } from './VerificationBadge';
import useTrustShield from '../hooks/useTrustShield'; // Assumed hook path
import { supabase } from '../supabaseClient';

/**
 * BadgeProgressTracker
 * Displays earned, in-progress, and locked badges with progress, requirements, and application actions.
 */
const CATEGORY_MAP = {
  trust: ['verified_human','trusted_member','verified_id'],
  community: ['community_star','content_creator','trending_creator','educator','artist'],
  official: ['brand','business','media_press','musician','athlete','public_figure','government'],
  achievement: ['og_member','one_year_strong','centurion','global_connector','community_builder'],
  special: ['pride_supporter','holiday_spirit','birthday_star','guardian','helper']
};

// Requirements metadata (simplified logical placeholders). Each requirement has id and label.
const REQUIREMENTS = {
  verified_human: [
    { id: 'device_fingerprint', label: 'Passed device fingerprinting' },
    { id: 'ip_check', label: 'Valid IP (no VPN/proxy)' },
    { id: 'email_verified', label: 'Email verified' },
    { id: 'captcha_passed', label: 'Captcha passed' },
    { id: 'trust_score_70', label: 'Trust score > 70' }
  ],
  trusted_member: [
    { id: 'age_30_days', label: 'Account age > 30 days' },
    { id: 'trust_score_80', label: 'Trust score > 80' },
    { id: 'no_violations', label: 'No violations' },
    { id: 'active_engagement', label: 'Active genuine engagement' },
    { id: 'mutual_followers', label: 'Has mutual followers' }
  ],
  verified_id: [
    { id: 'gov_id_uploaded', label: 'Government ID uploaded' },
    { id: 'face_match', label: 'Face match successful' },
    { id: 'manual_review', label: 'Manual review (if required)' }
  ],
  community_star: [
    { id: 'helpful_comments_100', label: '100+ helpful comments' },
    { id: 'posts_50_with_likes', label: '50+ posts >10 likes' },
    { id: 'positive_engagement', label: 'Positive engagement ratio' },
    { id: 'no_spam_flags', label: 'No spam flags' }
  ],
  content_creator: [
    { id: 'followers_500', label: '500+ followers' },
    { id: 'posts_20_50likes', label: '20+ posts >50 likes' },
    { id: 'consistent_posting', label: '3x/week for 1 month' },
    { id: 'engagement_5_percent', label: 'Engagement rate >5%' }
  ],
  trending_creator: [
    { id: 'trending_posts_3', label: '3+ posts trending last 30 days' },
    { id: 'followers_1000', label: '1000+ followers' },
    { id: 'viral_coeff', label: 'High viral coefficient' }
  ],
  educator: [
    { id: 'educational_posts_50', label: '50+ educational posts' },
    { id: 'ai_detected', label: 'AI detects educational content' },
    { id: 'high_save_rate', label: 'High save/bookmark rate' },
    { id: 'low_spam_reports', label: 'Low spam reports' }
  ],
  artist: [
    { id: 'art_posts_30', label: '30+ art posts / #art' },
    { id: 'high_quality_images', label: 'High quality images (AI)' },
    { id: 'gallery_enabled', label: 'Gallery view enabled' }
  ],
  brand: [
    { id: 'company_docs', label: 'Company registration docs' },
    { id: 'domain_verification', label: 'Domain ownership verified' },
    { id: 'official_email', label: 'Official company email' }
  ],
  business: [
    { id: 'business_certificate', label: 'Business registration certificate' },
    { id: 'tax_id', label: 'GST/Tax ID provided' },
    { id: 'address_verified', label: 'Physical address verified' }
  ],
  media_press: [
    { id: 'press_credentials', label: 'Press credentials' },
    { id: 'news_outlet', label: 'Works for verified outlet' },
    { id: 'journalist_id', label: 'Journalist ID card' }
  ],
  musician: [
    { id: 'stream_profile_verified', label: 'Verified streaming profile' },
    { id: 'listeners_10000', label: '10K+ monthly listeners OR releases' }
  ],
  athlete: [
    { id: 'pro_credentials', label: 'Professional athlete credentials' },
    { id: 'federation_membership', label: 'Sports federation membership' },
    { id: 'official_competitions', label: 'Official competitions participation' }
  ],
  public_figure: [
    { id: 'followers_10000_other', label: '10K+ followers elsewhere' },
    { id: 'wikipedia_or_media', label: 'Wikipedia page or major media' },
    { id: 'public_recognition', label: 'Public recognition' }
  ],
  government: [
    { id: 'official_position', label: 'Official government position' },
    { id: 'gov_email', label: 'Government email verified' },
    { id: 'authorization_letter', label: 'Department authorization letter' }
  ],
  og_member: [
    { id: 'first_10000', label: 'Joined among first 10K users' }
  ],
  one_year_strong: [
    { id: 'age_365_days', label: 'Account age > 365 days' },
    { id: 'active_recently', label: 'Recent active usage' }
  ],
  centurion: [
    { id: 'posts_100', label: '100+ posts' },
    { id: 'quality_consistency', label: 'Consistent quality' }
  ],
  global_connector: [
    { id: 'followers_10_countries', label: 'Followers from 10+ countries' },
    { id: 'international_engagement', label: 'International engagement diversity' }
  ],
  community_builder: [
    { id: 'threads_5_50replies', label: '5+ threads with >50 replies' },
    { id: 'engaging_conversations', label: 'Creates engaging conversations' }
  ],
  pride_supporter: [
    { id: 'active_pride_month', label: 'Positive activity during Pride Month' }
  ],
  holiday_spirit: [
    { id: 'active_december', label: 'Positive activity in December' }
  ],
  birthday_star: [
    { id: 'is_birthday', label: 'Today is user birthday' }
  ],
  guardian: [
    { id: 'accurate_reports_50', label: '50+ accurate spam/fake reports' },
    { id: 'report_success_80', label: 'Report success rate >80%' }
  ],
  helper: [
    { id: 'answers_100', label: 'Answered 100+ questions' },
    { id: 'helpful_reactions', label: 'High helpful reactions' }
  ]
};

// Progress bar color thresholds
function progressColor(p) {
  if (p >= 100) return '#16a34a';
  if (p >= 76) return '#4ade80';
  if (p >= 51) return '#eab308';
  if (p >= 26) return '#f97316';
  return '#dc2626';
}

// Simple confetti (emoji) generator
function launchConfetti(container) {
  if (!container) return;
  const emojis = ['🎉','✨','🎊','🌟','💫'];
  for (let i = 0; i < 16; i++) {
    const span = document.createElement('span');
    span.textContent = emojis[Math.floor(Math.random()*emojis.length)];
    span.style.position = 'absolute';
    span.style.left = Math.random()*100 + '%';
    span.style.top = '-10%';
    span.style.fontSize = '18px';
    span.style.animation = 'confetti-fall 1.8s ease-out forwards';
    container.appendChild(span);
    setTimeout(()=> span.remove(), 2000);
  }
}

// Sort badges per spec: earned first, then >50%, then available (>0), then locked.
function sortBadges(list) {
  return list.sort((a,b)=> {
    const rank = (x) => x.earned ? 0 : (x.progress >= 50 ? 1 : (x.progress > 0 ? 2 : 3));
    const rA = rank(a); const rB = rank(b);
    if (rA !== rB) return rA - rB;
    return b.progress - a.progress; // tie-breaker higher progress first
  });
}

function BadgeProgressTracker() {
  const { user, stats } = useTrustShield?.() || {}; // stats may include trustScore, accountAgeDays etc.
  const [progressData, setProgressData] = useState({}); // key -> { progress_percent, earned_at, requirements_status }
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const confettiRef = useRef(null);
  const [justEarned, setJustEarned] = useState([]);

  useEffect(()=> {
    if (!user?.id) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('badge_progress')
        .select('*')
        .eq('user_id', user.id);
      if (cancelled) return;
      if (!error && data) {
        const map = {};
        data.forEach(row => {
          map[row.badge_type] = {
            progress_percent: row.progress_percent ?? 0,
            earned_at: row.earned_at || null,
            requirements_status: row.requirements_status || {}
          };
        });
        // detect newly earned (earned_at within last minute)
        const newly = Object.keys(map).filter(k => map[k].earned_at && Date.now() - new Date(map[k].earned_at).getTime() < 60000);
        setJustEarned(newly);
        setProgressData(map);
      }
      setLoading(false);
    }
    load();
    const interval = setInterval(load, 30000); // periodic refresh
    return () => { cancelled = true; clearInterval(interval); };
  }, [user?.id]);

  useEffect(()=> {
    if (justEarned.length && confettiRef.current) {
      launchConfetti(confettiRef.current);
    }
  }, [justEarned]);

  // Build unified badge objects
  const allBadges = Object.entries(BADGE_DEFINITIONS).map(([key, def]) => {
    const pd = progressData[key] || {};
    const progress = pd.progress_percent ?? 0;
    const earned = !!pd.earned_at || progress >= 100;
    const earnedAt = pd.earned_at || (earned ? new Date().toISOString() : null);
    return {
      key,
      category: Object.keys(CATEGORY_MAP).find(cat => CATEGORY_MAP[cat].includes(key)) || 'other',
      icon: def.icon,
      name: def.name,
      tooltip: def.tooltip,
      gradient: def.gradient,
      color: def.color,
      progress: Math.min(progress,100),
      earned,
      earnedAt,
      requirements: REQUIREMENTS[key] || [],
      reqStatus: pd.requirements_status || {},
      isOfficial: CATEGORY_MAP.official.includes(key)
    };
  });

  const filtered = allBadges.filter(b => {
    if (categoryFilter !== 'all' && b.category !== categoryFilter) return false;
    switch (filter) {
      case 'earned': return b.earned;
      case 'in_progress': return !b.earned && b.progress > 0;
      case 'locked': return !b.earned && b.progress === 0;
      default: return true;
    }
  });

  const sorted = sortBadges(filtered);

  function applyForBadge(badgeKey) {
    // Placeholder action for official badge application
    alert(`Application process started for ${badgeKey}`);
  }

  return (
    <div className="badge-progress-tracker" ref={confettiRef}>
      <div className="bpt-controls">
        <div className="bpt-filters">
          {['all','earned','in_progress','locked'].map(f => (
            <button key={f} className={filter===f? 'active':''} onClick={()=> setFilter(f)}>{f.replace('_',' ').toUpperCase()}</button>
          ))}
        </div>
        <div className="bpt-category-filters">
          {['all',...Object.keys(CATEGORY_MAP)].map(cat => (
            <button key={cat} className={categoryFilter===cat? 'active':''} onClick={()=> setCategoryFilter(cat)}>{cat.toUpperCase()}</button>
          ))}
        </div>
      </div>
      {loading && <div className="bpt-loading">Loading progress...</div>}
      <div className="bpt-badge-grid">
        {sorted.map(badge => {
          const barColor = progressColor(badge.progress);
          const locked = !badge.earned && badge.progress === 0;
          return (
            <div key={badge.key} className={`bpt-card ${badge.earned? 'earned':''} ${locked? 'locked':''}`}>
              <div className="bpt-card-header">
                <span className={`bpt-icon ${badge.gradient? 'gradient':''}`} style={badge.gradient? { background: badge.gradient } : { color: badge.color }}>{badge.icon}</span>
                <div className="bpt-title-group">
                  <span className="bpt-name">{badge.name}</span>
                  <span className="bpt-category-label">{badge.category}</span>
                </div>
                {badge.earned && <span className="bpt-earned-check" aria-label="Earned">✓</span>}
              </div>
              <p className="bpt-desc">{badge.tooltip}</p>
              {!badge.earned && (
                <div className="bpt-progress-wrapper" aria-label={`Progress ${badge.progress}%`}>
                  <div className="bpt-progress-bar-bg">
                    <div className="bpt-progress-bar-fill" style={{ width: `${badge.progress}%`, background: barColor }} />
                  </div>
                  <span className="bpt-progress-text">{badge.progress}%</span>
                </div>
              )}
              {badge.earned && <div className="bpt-earned-date">Earned on {new Date(badge.earnedAt).toLocaleDateString()}</div>}
              <ul className="bpt-req-list">
                {badge.requirements.map(req => {
                  const done = badge.reqStatus[req.id] || false;
                  return (
                    <li key={req.id} className={done? 'done':''}>
                      <span className="bpt-req-check" aria-hidden="true">{done? '✔':'•'}</span> {req.label}
                    </li>
                  );
                })}
              </ul>
              {badge.isOfficial && !badge.earned && (
                <button className="bpt-apply-btn" onClick={()=> applyForBadge(badge.key)}>Apply</button>
              )}
              {justEarned.includes(badge.key) && <div className="bpt-celebrate">🎉 Congratulations!</div>}
            </div>
          );
        })}
      </div>
      <style>{`
        .badge-progress-tracker { position: relative; padding: 1rem; }
        .bpt-controls { display: flex; flex-wrap: wrap; gap: .75rem; margin-bottom: 1rem; }
        .bpt-filters button, .bpt-category-filters button { background:#1e293b; color:#fff; border:1px solid #334155; padding:.4rem .7rem; border-radius:6px; cursor:pointer; font-size:.75rem; letter-spacing:.5px; }
        .bpt-filters button.active, .bpt-category-filters button.active { background:#3b82f6; border-color:#3b82f6; }
        .bpt-loading { font-size:.9rem; opacity:.7; }
        .bpt-badge-grid { display:grid; gap:1rem; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); }
        .bpt-card { background:#0f172a; color:#f1f5f9; border:1px solid #1e293b; border-radius:14px; padding:.9rem; display:flex; flex-direction:column; gap:.55rem; position:relative; overflow:hidden; transition:transform .25s ease, border-color .25s ease; }
        .bpt-card:hover { transform:translateY(-4px); border-color:#3b82f6; }
        .bpt-card.locked { opacity:.55; }
        .bpt-card.earned { box-shadow:0 0 0 2px rgba(34,197,94,.3); }
        .bpt-card-header { display:flex; align-items:center; gap:.6rem; }
        .bpt-icon { width:38px; height:38px; display:flex; align-items:center; justify-content:center; font-size:24px; border-radius:10px; background:#1e293b; }
        .bpt-icon.gradient { color:#fff; }
        .bpt-title-group { display:flex; flex-direction:column; }
        .bpt-name { font-weight:600; font-size:.95rem; }
        .bpt-category-label { font-size:.6rem; text-transform:uppercase; letter-spacing:.5px; opacity:.6; }
        .bpt-earned-check { margin-left:auto; font-size:1.1rem; color:#22c55e; }
        .bpt-desc { font-size:.7rem; line-height:1.2; opacity:.8; min-height:32px; }
        .bpt-progress-wrapper { display:flex; align-items:center; gap:.5rem; }
        .bpt-progress-bar-bg { flex:1; height:8px; background:#1e293b; border-radius:5px; overflow:hidden; position:relative; }
        .bpt-progress-bar-fill { height:100%; transition:width .6s cubic-bezier(.4,0,.2,1); }
        .bpt-progress-text { font-size:.65rem; font-weight:600; width:42px; text-align:right; }
        .bpt-earned-date { font-size:.6rem; color:#22c55e; }
        .bpt-req-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:2px; }
        .bpt-req-list li { font-size:.6rem; display:flex; align-items:center; gap:.3rem; }
        .bpt-req-list li.done { opacity:.75; text-decoration:line-through; }
        .bpt-req-check { width:12px; display:inline-block; text-align:center; font-size:.65rem; }
        .bpt-apply-btn { margin-top:.4rem; background:#3b82f6; color:#fff; border:none; padding:.4rem .7rem; font-size:.65rem; border-radius:6px; cursor:pointer; }
        .bpt-apply-btn:hover { background:#2563eb; }
        .bpt-celebrate { position:absolute; inset:auto 0 0 0; background:rgba(34,197,94,.15); padding:.3rem .5rem; font-size:.65rem; text-align:center; animation:fadeIn .5s ease; }
        @keyframes confetti-fall { 0%{ transform:translateY(0) rotate(0deg); opacity:1;} 100%{ transform:translateY(140%) rotate(720deg); opacity:0;} }
        @keyframes fadeIn { from{ opacity:0; } to { opacity:1; } }
        @media (prefers-reduced-motion: reduce){ .bpt-card, .bpt-progress-bar-fill { transition:none !important; } }
      `}</style>
    </div>
  );
}

export default BadgeProgressTracker;
