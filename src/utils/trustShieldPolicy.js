const VERIFIED_STATUSES = new Set(['VERIFIED', 'VERIFIED_MINOR']);

const normalizeStatus = (value) => String(value || '').trim().toUpperCase();

const calculateAge = (dobValue) => {
    if (!dobValue) return null;
    const dob = new Date(dobValue);
    if (Number.isNaN(dob.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const hasBirthdayPassed =
        today.getMonth() > dob.getMonth() ||
        (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());

    if (!hasBirthdayPassed) age -= 1;
    return age;
};

export const getTrustShieldState = (profile) => {
    const trustStatus = normalizeStatus(
        profile?.verification_status ||
        profile?.trust_shield_status ||
        profile?.focus_trust_status
    );

    const age =
        typeof profile?.age === 'number'
            ? profile.age
            : calculateAge(profile?.date_of_birth || profile?.dob);

    const isTeen = typeof age === 'number' && age >= 13 && age <= 17;
    const guardianApproved = Boolean(
        profile?.guardian_verified ||
        profile?.guardian_approved ||
        profile?.identity_metadata?.guardian_approved
    );

    const requiresGuardian = isTeen && !guardianApproved;
    const isVerified = VERIFIED_STATUSES.has(trustStatus) && !requiresGuardian;

    const blockReason = !trustStatus
        ? 'Trust Shield verification is pending.'
        : !VERIFIED_STATUSES.has(trustStatus)
            ? `Trust Shield status is ${trustStatus || 'PENDING'}.`
            : requiresGuardian
                ? 'Guardian approval is required for teen accounts.'
                : null;

    return {
        status: trustStatus || 'PENDING',
        age,
        isTeen,
        guardianApproved,
        isVerified,
        isBlocked: !isVerified,
        blockReason,
    };
};

export default getTrustShieldState;
