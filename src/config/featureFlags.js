export const FEATURE_FLAGS = Object.freeze({
  focus_v2_identity: true,
  focus_v2_glass_ui: true,
  focus_v2_feed: true,
  focus_v2_explore: true,
  focus_v2_boltz: true,
  focus_v2_messages: true,
  focus_v2_notifications: true,
  focus_v2_profile_settings: true,
});

const parseBooleanFlag = (value, fallback) => {
  if (value == null) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
};

export const getFeatureFlag = (key) => {
  const fallback = FEATURE_FLAGS[key];
  if (typeof fallback === 'undefined') return false;

  const envKey = `REACT_APP_FLAG_${key.toUpperCase()}`;
  const envValue = typeof process !== 'undefined' ? process.env?.[envKey] : undefined;
  return parseBooleanFlag(envValue, fallback);
};

export const getAllFeatureFlags = () =>
  Object.keys(FEATURE_FLAGS).reduce((acc, key) => {
    acc[key] = getFeatureFlag(key);
    return acc;
  }, {});
