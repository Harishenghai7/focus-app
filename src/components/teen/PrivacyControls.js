import React from 'react';
import { useTeenCare } from '../../context/TeenCareContext';
import styles from './PrivacyControls.module.css';

const PrivacyControls = ({ userAge, myGuardians }) => {
  const { removeGuardian } = useTeenCare();
  if (!userAge) return null;
  return (
    <div>
      <h2 className={styles.title}>Privacy Controls</h2>
      {userAge >= 18 && (
        <div className={styles.warningBox}>
          <b>You are 18 or older. You may remove guardians from your account.</b>
          <ul className={styles.guardianList}>
            {myGuardians?.map(g => (
              <li key={g.id} className={styles.guardianItem}>
                {g.username}
                <button
                  className={styles.removeButton}
                  onClick={() => removeGuardian(g.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className={styles.info}>
        <b>Transparency:</b> Your guardians can see your activity summary, not your full content or DMs. You will be notified when a guardian is alerted.
      </div>
    </div>
  );
};
export default PrivacyControls;
