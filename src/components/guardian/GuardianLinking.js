import React, { useState } from 'react';
import { useTeenCare } from '../../context/TeenCareContext';
import { toast } from 'react-toastify';
import styles from './GuardianLinking.module.css';

const GuardianLinking = () => {
  const { inviteTeen, acceptInvitation, generateInvitationCode, linkedTeens, myGuardians, isGuardian, isTeen } = useTeenCare();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteResult, setInviteResult] = useState(null);
  const [inviteError, setInviteError] = useState(null);
  const [code, setCode] = useState('');
  const [acceptResult, setAcceptResult] = useState(null);
  const [acceptError, setAcceptError] = useState(null);
  const [genCode, setGenCode] = useState(null);
  const [genError, setGenError] = useState(null);

  // Guardian invites teen
  const handleInvite = async () => {
    setInviteError(null);
    try {
      const res = await inviteTeen(inviteEmail);
      setInviteResult(res);
      toast.success('Invitation sent!');
    } catch (e) {
      setInviteError(e.message);
      toast.error('Failed to send invitation: ' + e.message);
    }
  };

  // Teen accepts invitation
  const handleAccept = async () => {
    setAcceptError(null);
    try {
      const res = await acceptInvitation(code);
      setAcceptResult(res);
      toast.success('Guardian linked!');
    } catch (e) {
      setAcceptError(e.message);
      toast.error('Failed to accept invitation: ' + e.message);
    }
  };

  // Teen generates code to send to guardian
  const handleGenerateCode = async () => {
    setGenError(null);
    try {
      const res = await generateInvitationCode();
      setGenCode(res);
      toast.success('Code generated!');
    } catch (e) {
      setGenError(e.message);
      toast.error('Failed to generate code: ' + e.message);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Guardian Account Linking</h2>
      {isGuardian && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Invite Teen</h3>
          <input
            type="email"
            placeholder="Teen's email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            className={styles.input}
          />
          <button onClick={handleInvite} className={styles.button}>Send Invitation</button>
          {inviteResult && <div className={styles.success}>Invitation sent to {inviteResult.teen.email}</div>}
          {inviteError && <div className={styles.error}>{inviteError}</div>}
        </div>
      )}
      {isTeen && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Accept Guardian Invitation</h3>
          <input
            type="text"
            placeholder="Invitation code"
            value={code}
            onChange={e => setCode(e.target.value)}
            className={styles.input}
          />
          <button onClick={handleAccept} className={styles.button}>Accept Invitation</button>
          {acceptResult && <div className={styles.success}>Guardian linked!</div>}
          {acceptError && <div className={styles.error}>{acceptError}</div>}

          <h4 className={styles.sectionTitle} style={{ marginTop: '16px' }}>Or generate a code to send to your guardian:</h4>
          <button onClick={handleGenerateCode} className={styles.button}>Generate Code</button>
          {genCode && <div className={styles.success}>Code: <b>{genCode.code}</b> (expires {new Date(genCode.expiresAt).toLocaleString()})</div>}
          {genError && <div className={styles.error}>{genError}</div>}
        </div>
      )}
      <div style={{ marginTop: 24 }}>
        {isGuardian && (
          <>
            <h4 className={styles.sectionTitle}>Linked Teens:</h4>
            <ul className={styles.list}>
              {linkedTeens?.map(t => <li key={t.id} className={styles.listItem}>{t.username}</li>)}
            </ul>
          </>
        )}
        {isTeen && (
          <>
            <h4 className={styles.sectionTitle}>My Guardians:</h4>
            <ul className={styles.list}>
              {myGuardians?.map(g => <li key={g.id} className={styles.listItem}>{g.username}</li>)}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};
export default GuardianLinking;
