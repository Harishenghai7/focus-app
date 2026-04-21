import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import { useGuardianHandshake } from '../../hooks/useGuardianHandshake';
import styles from './ParentConsent.module.css';

const FocuslyGuardian = ({ message }) => (
  <div className={styles.focuslyContainer}>
    <div className={styles.focuslyAvatar}>🦁</div>
    <div className={styles.focuslySpeech}>
      <strong>Focusly AI (Guardian Mode)</strong>
      <p>"{message}"</p>
    </div>
  </div>
);

const ParentConsent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  // Accept both `token` and `t` for flexibility with email-client link rewrites
  const token = searchParams.get('token') || searchParams.get('t');
  const { confirmConsent } = useGuardianHandshake();

  // Teen Flow State
  const [parentEmail, setParentEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  // Parent Flow State
  const [parentName, setParentName] = useState('');
  const [parentConfirmEmail, setParentConfirmEmail] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [releasedCount, setReleasedCount] = useState(0);

  // ── TEEN FLOW: Send Request ───────────────────────────────────────────────
  const sendParentConsentRequest = async (e) => {
    e.preventDefault();

    if (!parentEmail || !parentEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);

      // Call Edge Function to send consent email
      const { data, error } = await supabase.functions.invoke('send-parent-consent-email', {
        body: {
          parentEmail,
          childName: user?.user_metadata?.full_name || user?.email,
          childUserId: user?.id,
          token: token || 'pending',
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to send consent request');

      setRequestSent(true);
      toast.success('Consent request sent successfully!');
    } catch (error) {
      console.error('Parent consent error:', error);
      toast.error(error.message || 'Failed to send consent request');
    } finally {
      setLoading(false);
    }
  };

  // ── PARENT FLOW: Approve Request via the new confirm_guardian_consent RPC ─
  const handleApproveHandshake = async (e) => {
    e.preventDefault();

    if (!parentName || !parentConfirmEmail) {
      toast.error('Please fill in your details to approve.');
      return;
    }
    if (!token) {
      toast.error('Missing consent token. Please use the link in the email.');
      return;
    }

    try {
      setIsApproving(true);
      const result = await confirmConsent(token);
      // RPC returns { teen_id, confirmed_at, content_released }
      const released = Number(result?.content_released || 0);
      setReleasedCount(released);
      setIsApproved(true);
      toast.success(
        released > 0
          ? `Account approved. ${released} queued post${released === 1 ? '' : 's'} released.`
          : 'Account approved successfully!'
      );
    } catch (err) {
      toast.error(
        err?.message?.includes('expired') || err?.message?.includes('Invalid')
          ? 'This link has expired or was already used. Ask your teen to request a new one.'
          : 'Failed to approve the account. Please try again.'
      );
      console.error(err);
    } finally {
      setIsApproving(false);
    }
  };

  if (isApproved) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard} data-testid="guardian-consent-success">
          <div className={styles.successIcon}>✨</div>
          <h2 className={styles.title}>Approval Successful</h2>
          <p className={styles.subtitle}>
            Thank you, {parentName}. You have successfully approved this teen account.
          </p>
          <div className={styles.rewardBox}>
            <h3>What happens now?</h3>
            <ul>
              <li>✅ The teen user now has full posting access.</li>
              {releasedCount > 0 && (
                <li>✅ <strong>{releasedCount}</strong> post{releasedCount === 1 ? '' : 's'} queued during the wait {releasedCount === 1 ? 'has' : 'have'} been released to the feed.</li>
              )}
              <li>✅ You will receive weekly activity reports.</li>
              <li>✅ Focus's Teen Care safety nets remain active unconditionally.</li>
              <li>🔒 Private messages remain private — you will never see their DMs.</li>
            </ul>
          </div>
          <button className={styles.primaryBtn} onClick={() => navigate('/')} data-testid="guardian-consent-home-btn">
            Go to Focus Home
          </button>
        </div>
      </div>
    );
  }

  if (token) {
    // ── PARENT VIEW: Approving via token link ──
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <FocuslyGuardian message="A teen has requested your permission to join Focus. We need your legal consent." />
          
          <h2 className={styles.stepTitle}>Guardian Approval Required</h2>
          <p className={styles.stepDesc}>
            You are verifying a teen account securely. Focus employs rigorous identity and safety mechanisms to protect young minds.
          </p>

          <form onSubmit={handleApproveHandshake} className={styles.formContainer}>
            <div className={styles.formGroup}>
              <label>Your Full Legal Name</label>
              <input
                type="text"
                placeholder="e.g. Jane Doe"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                required
                className={styles.inputField}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Your Email Address</label>
              <input
                type="email"
                placeholder="guardian@example.com"
                value={parentConfirmEmail}
                onChange={(e) => setParentConfirmEmail(e.target.value)}
                required
                className={styles.inputField}
              />
            </div>

            <div className={styles.infoBox}>
              <h3>By approving, you agree:</h3>
              <ul>
                <li>✅ You are the legal guardian of this teen.</li>
                <li>✅ You consent to them joining the Focus platform.</li>
                <li>✅ Focus may contact you regarding account safety.</li>
              </ul>
            </div>

            <button type="submit" className={styles.primaryBtn} disabled={isApproving}>
              {isApproving ? 'Approving...' : 'Approve Teen Account'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── TEEN VIEW: Sending request manually if they prefer email ──
  if (requestSent) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>✅</div>
          <h2 className={styles.title}>Consent Request Sent!</h2>
          <p className={styles.subtitle}>
            We've sent a verification email to <strong>{parentEmail}</strong>
          </p>

          <div className={styles.rewardBox}>
            <h3>What happens next?</h3>
            <ol style={{ paddingLeft: '20px', color: '#94a3b8', lineHeight: '1.6' }}>
              <li>Your parent/guardian will receive an email with a verification link.</li>
              <li>They will verify their identity and review your account.</li>
              <li>You'll be granted access to the Focus feeds automatically once approved!</li>
            </ol>
          </div>

          <div className={styles.warningBox}>
            <p>⏰ The verification link expires in 7 days.</p>
            <p>📧 Ask your parent/guardian to check their email (including spam folder).</p>
          </div>

          <button className={styles.primaryBtn} onClick={() => navigate('/security')}>
            Check Approval Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.headerTitle}>Guardian Consent</h1>
        <div style={{ width: 60 }} />
      </div>

      <div className={styles.card}>
        <FocuslyGuardian message="You're almost there! We just need your parent or guardian to say yes, Macha." />

        <h2 className={styles.stepTitle}>Parent/Guardian Consent</h2>
        <p className={styles.stepDesc}>
          Since you are under 18, we need your parent or guardian to verify your account. Enter their email below to send them an approval link.
        </p>

        <form onSubmit={sendParentConsentRequest} className={styles.formContainer}>
          <div className={styles.formGroup}>
            <label htmlFor="parentEmail">Parent/Guardian Email Address</label>
            <input
              id="parentEmail"
              type="email"
              placeholder="parent@example.com"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              required
              className={styles.inputField}
            />
            <p className={styles.hint}>
              Make sure this is an email address your parent/guardian can access immediately.
            </p>
          </div>

          <button type="submit" className={styles.primaryBtn} disabled={loading}>
            {loading ? 'Sending Request...' : 'Send Consent Request'}
          </button>
        </form>

        <div className={styles.helpBox}>
          <p><strong>Need help?</strong> Ask your parent/guardian to:</p>
          <ul>
            <li>Check their email inbox (and spam folder)</li>
            <li>Use the link to approve your access</li>
            <li>Approval must be done within 7 days</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ParentConsent;
