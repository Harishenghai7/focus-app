// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ FOCUS CONTENT MODERATION - Component Exports
// ═══════════════════════════════════════════════════════════════════════════════

export { default as ContentIntegrityModal } from './ContentIntegrityModal';
export { default as ContentModerationExample } from './ContentModerationExample';
export { default as SovereignGuardAlert } from './SovereignGuardAlert';
export { default as EducationalFeedback } from './EducationalFeedback';
export { default as WarningModal } from './WarningModal';
export { default as ContentFilter } from './ContentFilter';

// Re-export from hooks for convenience
export { useContentModeration } from '../../hooks/useContentModeration';
export { useUploadMedia } from '../../hooks/useUploadMedia';
export { useToxicityScanner } from '../../hooks/useToxicityScanner';
export { useStrikeSystem } from '../../hooks/useStrikeSystem';
export { useSovereignGuard } from '../../hooks/useSovereignGuard';

// Re-export service for advanced usage
export { ContentModerationService } from '../../services/ContentModerationService';
