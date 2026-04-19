import { useMemo } from 'react';
import { getAllFeatureFlags, getFeatureFlag } from '../config/featureFlags';

export const useFeatureFlag = (flagKey) =>
  useMemo(() => getFeatureFlag(flagKey), [flagKey]);

export const useFeatureFlags = () => useMemo(() => getAllFeatureFlags(), []);
