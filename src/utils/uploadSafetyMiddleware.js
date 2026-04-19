import { supabase } from '../lib/supabase';
import { checkKeywords } from './keywordBlocklist';
import { checkToxicity } from './toxicityScorer';
import { analyzeImageNSFW } from './nsfwDetection';

const SAFETY_STRIKE_TABLE = 'user_safety_status';
const NSFW_BLOCK_THRESHOLD = 0.7;

const toObjectUrl = (file) => {
    try {
        return URL.createObjectURL(file);
    } catch (_) {
        return null;
    }
};

const cleanupObjectUrls = (urls) => {
    urls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
    });
};

const awardStrike = async ({ userId, reason, metadata = {} }) => {
    if (!userId) return;
    try {
        await supabase.from(SAFETY_STRIKE_TABLE).upsert(
            {
                user_id: userId,
                strike_count: 1,
                last_strike_at: new Date().toISOString(),
                last_strike_reason: reason,
                moderation_metadata: metadata,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
        );
    } catch (error) {
        // Non-blocking write: a missing table should not break uploads.
        console.warn('Strike write failed:', error?.message || error);
    }
};

export const runPreUploadSafetyCheck = async ({
    userId,
    caption,
    mediaFiles = [],
    huggingFaceApiKey = process.env.REACT_APP_HUGGINGFACE_API_KEY,
}) => {
    const reasons = [];
    const details = {};

    if (caption && caption.trim()) {
        const keywordResult = checkKeywords(caption);
        if (keywordResult.flagged) {
            reasons.push('Caption contains blocked keywords.');
            details.keywordMatches = keywordResult.matches;
        }

        const toxicityResult = await checkToxicity(caption);
        if (toxicityResult.toxic) {
            reasons.push('Caption detected as toxic.');
            details.toxicityLabels = toxicityResult.results;
        }
    }

    const objectUrls = mediaFiles
        .filter((item) => item?.type === 'image' && item?.file)
        .map((item) => toObjectUrl(item.file));

    if (huggingFaceApiKey && objectUrls.length > 0) {
        for (const imageUrl of objectUrls) {
            if (!imageUrl) continue;
            try {
                const analysis = await analyzeImageNSFW(imageUrl, huggingFaceApiKey);
                if (analysis.nsfwScore >= NSFW_BLOCK_THRESHOLD) {
                    reasons.push('Image contains restricted adult content.');
                    details.nsfwScore = Math.max(details.nsfwScore || 0, analysis.nsfwScore);
                }
            } catch (error) {
                console.warn('NSFW scan failed:', error?.message || error);
            }
        }
    }

    cleanupObjectUrls(objectUrls);

    if (reasons.length > 0) {
        const uniqueReasons = [...new Set(reasons)];
        await awardStrike({
            userId,
            reason: uniqueReasons.join(' '),
            metadata: {
                ...details,
                source: 'pre_upload_middleware',
            },
        });

        return {
            blocked: true,
            reason: uniqueReasons[0],
            details,
        };
    }

    return { blocked: false };
};

export default runPreUploadSafetyCheck;
