import React, { useState } from 'react';
import { useTeenCare } from '../../context/TeenCareContext';
import { toast } from 'react-toastify';
import { FaExclamationTriangle } from 'react-icons/fa';
import styles from './EmergencyPanicButtonMain.module.css';

const EmergencyPanicButtonMain = () => {
  const { activatePanicButton } = useTeenCare();
  const [activated, setActivated] = useState(false);
  const [error, setError] = useState(null);

  const handlePanic = async () => {
    setError(null);
    try {
      await activatePanicButton('Panic button pressed!');
      setActivated(true);
      toast.success('Panic activated! Guardians notified.');
    } catch (e) {
      setError(e.message);
      toast.error('Failed to activate panic: ' + e.message);
    }
  };

  if (activated) {
    return (
      <div className={styles.container}>
        <div className={styles.activated}>
          <FaExclamationTriangle className={styles.activatedIcon} />
          <h2 className={styles.activatedTitle}>Panic Activated!</h2>
          <p className={styles.activatedText}>Your guardians have been notified and sent your location.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Emergency Panic Button</h1>

      <button
        className={styles.panicButton}
        onClick={handlePanic}
        aria-label="Activate Panic Button"
      >
        Panic
      </button>

      <p className={styles.description}>
        Pressing this button will immediately notify your guardians and share your current location. Use only in emergencies.
      </p>

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};
export default EmergencyPanicButtonMain;
