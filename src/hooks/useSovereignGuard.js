import { useCallback, useMemo, useState } from 'react';
import { focusToast } from '../utils/focusToast';
import { useAuth } from './useAuth';
import { useStrikeSystem } from './useStrikeSystem';
import { useFreeModeration } from './useFreeModeration';

const PURITY_THRESHOLD = 0.8;

export const useSovereignGuard = () => {
  const { user } = useAuth();
  const strike = useStrikeSystem();
  const free = useFreeModeration();

  const [showIntervention, setShowIntervention] = useState(false);
  const [interventionData, setInterventionData] = useState(null);

  const closeIntervention = useCallback(() => {
    setShowIntervention(false);
    setInterventionData(null);
  }, []);

  const moderateContent = useCallback(
    async ({ text = '', mediaFiles = [], contentType = 'post' }) => {
      if (!user?.id) {
        return { blocked: true, reason: 'Not authenticated' };
      }

      const permission = await strike.checkPostPermission(user.id);
      if (!permission?.canPost && !permission?.isGhost) {
        focusToast.error(permission?.reason || 'You cannot post right now');
        return { blocked: true, reason: permission?.reason || 'Posting restricted' };
      }

      let violations = [];
      let maxScore = 0;

      if (text?.trim()) {
        const textResult = await free.moderate({ text });
        if (textResult?.moderationStatus === 'restricted') {
          violations.push({
            type: (textResult.toxicityType || 'VIOLATION').toUpperCase(),
            score: textResult.confidence || 0.9,
            reason: textResult.reason
          });
          maxScore = Math.max(maxScore, textResult.confidence || 0.9);
        }

        if (textResult?.moderationStatus === 'flagged') {
          violations.push({ type: 'FLAGGED', score: textResult.confidence || 0.6, reason: textResult.reason });
          maxScore = Math.max(maxScore, textResult.confidence || 0.6);
        }
      }

      if (Array.isArray(mediaFiles) && mediaFiles.length > 0) {
        for (const f of mediaFiles) {
          try {
            if (!f || !f.type || !f.type.startsWith('image/')) continue;
            const url = URL.createObjectURL(f);
            const imgRes = await free.moderateImage(url);
            URL.revokeObjectURL(url);

            if (imgRes?.nsfw) {
              violations.push({ type: 'NSFW', score: imgRes.confidence || 0.9, reason: 'Image contains adult content' });
              maxScore = Math.max(maxScore, imgRes.confidence || 0.9);
            }
          } catch (_) {
            // ignore
          }
        }
      }

      const purityScore = 1 - maxScore;
      const blocked = purityScore < 0.5 || violations.some((v) => v.type === 'NSFW' || v.type === 'SEVERE_TOXICITY');
      const flagged = !blocked && purityScore < PURITY_THRESHOLD;

      if (blocked) {
        const v0 = violations[0] || { type: 'VIOLATION', reason: 'Content violates guidelines' };
        const strikeRes = await strike.recordStrike({
          userId: user.id,
          violationType: v0.type,
          reason: v0.reason || 'Content violates guidelines',
          contentType,
          contentSnapshot: text
        });

        setInterventionData({
          violations,
          purityScore,
          strikeNumber: strikeRes?.strikeNumber || 0
        });
        setShowIntervention(true);

        return { blocked: true, purityScore, violations, strikeRes };
      }

      return {
        blocked: false,
        flagged,
        purityScore,
        violations,
        isGhost: !!permission?.isGhost
      };
    },
    [free, strike, user]
  );

  const api = useMemo(
    () => ({
      moderateContent,
      showIntervention,
      interventionData,
      closeIntervention
    }),
    [moderateContent, showIntervention, interventionData, closeIntervention]
  );

  return api;
};

export default useSovereignGuard;
