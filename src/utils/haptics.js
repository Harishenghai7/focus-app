export const triggerHaptic = (duration = 10) => {
    try {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate(duration);
        }
    } catch (_) {
        // No-op for unsupported environments.
    }
};

export const triggerErrorHaptic = () => {
    // Distinct "error" pulse pattern: short-short.
    triggerHaptic([10, 28, 10]);
};

export default triggerHaptic;

