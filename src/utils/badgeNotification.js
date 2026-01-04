import { toast } from 'react-toastify';
import { BADGE_DEFINITIONS } from './badgeRules';

/**
 * Badge Notification System
 * Handles notifications for badge awards, revocations, and application updates
 */

/**
 * Show badge awarded notification
 */
export const notifyBadgeAwarded = (badgeName) => {
    const definition = BADGE_DEFINITIONS[badgeName];
    if (!definition) return;

    toast.success(
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: definition.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
            }}>
                {definition.icon && <definition.icon size={20} />}
            </div>
            <div>
                <div style={{ fontWeight: '600' }}>Badge Unlocked!</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>{definition.name}</div>
            </div>
        </div>,
        {
            autoClose: 5000,
            position: 'top-center'
        }
    );
};

/**
 * Show badge revoked notification
 */
export const notifyBadgeRevoked = (badgeName, reason) => {
    const definition = BADGE_DEFINITIONS[badgeName];
    if (!definition) return;

    toast.error(
        <div>
            <div style={{ fontWeight: '600' }}>Badge Revoked</div>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>{definition.name}</div>
            {reason && <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>{reason}</div>}
        </div>,
        {
            autoClose: 7000
        }
    );
};

/**
 * Show application submitted notification
 */
export const notifyApplicationSubmitted = (badgeName) => {
    const definition = BADGE_DEFINITIONS[badgeName];
    if (!definition) return;

    toast.info(
        <div>
            <div style={{ fontWeight: '600' }}>Application Submitted</div>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>
                Your {definition.name} badge application is under review
            </div>
        </div>,
        {
            autoClose: 5000
        }
    );
};

/**
 * Show application approved notification
 */
export const notifyApplicationApproved = (badgeName) => {
    const definition = BADGE_DEFINITIONS[badgeName];
    if (!definition) return;

    toast.success(
        <div>
            <div style={{ fontWeight: '600' }}>Application Approved!</div>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>
                Your {definition.name} badge application has been approved
            </div>
        </div>,
        {
            autoClose: 7000
        }
    );
};

/**
 * Show application rejected notification
 */
export const notifyApplicationRejected = (badgeName, reason) => {
    const definition = BADGE_DEFINITIONS[badgeName];
    if (!definition) return;

    toast.warning(
        <div>
            <div style={{ fontWeight: '600' }}>Application Not Approved</div>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>
                Your {definition.name} badge application was not approved
            </div>
            {reason && <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>{reason}</div>}
        </div>,
        {
            autoClose: 7000
        }
    );
};

/**
 * Show badge progress notification
 */
export const notifyBadgeProgress = (badgeName, progressMessage) => {
    const definition = BADGE_DEFINITIONS[badgeName];
    if (!definition) return;

    toast.info(
        <div>
            <div style={{ fontWeight: '600' }}>Badge Progress</div>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>{definition.name}</div>
            <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>{progressMessage}</div>
        </div>,
        {
            autoClose: 4000
        }
    );
};

/**
 * Show eligibility notification
 */
export const notifyBadgeEligible = (badgeName) => {
    const definition = BADGE_DEFINITIONS[badgeName];
    if (!definition) return;

    const message = definition.requiresApplication
        ? `You're eligible! Apply for the ${definition.name} badge`
        : `You've earned the ${definition.name} badge!`;

    toast.success(
        <div>
            <div style={{ fontWeight: '600' }}>New Badge Available!</div>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>{message}</div>
        </div>,
        {
            autoClose: 6000
        }
    );
};

/**
 * Send email notification (placeholder - would integrate with backend email service)
 */
export const sendBadgeEmail = async (userId, type, badgeName, data = {}) => {
    // This would integrate with your email service (SendGrid, AWS SES, etc.)
    console.log(`Email notification: ${type} for badge ${badgeName} to user ${userId}`, data);

    // Example implementation:
    // await fetch('/api/send-badge-email', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ userId, type, badgeName, data })
    // });
};
