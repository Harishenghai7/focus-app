import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import styles from './AgeVerification.module.css';

const AgeVerification = ({ userId }) => {
  const [birthDate, setBirthDate] = useState('');
  const [method, setMethod] = useState('parent_verification');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    try {
      const { error } = await supabase.from('age_verifications').insert({
        user_id: userId,
        claimed_birth_date: birthDate,
        method
      });
      if (error) throw error;
      setStatus('Verification submitted!');
      toast.success('Verification submitted!');
    } catch (e) {
      setError(e.message);
      toast.error('Failed to submit verification: ' + e.message);
    }
  };

  return (
    <div>
      <h2 className={styles.title}>Age Verification</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          Birth Date:
          <input
            type="date"
            value={birthDate}
            onChange={e => setBirthDate(e.target.value)}
            required
            className={styles.input}
          />
        </label>
        <label className={styles.label}>
          Verification Method:
          <select
            value={method}
            onChange={e => setMethod(e.target.value)}
            className={styles.select}
          >
            <option value="parent_verification">Parent Verification</option>
            <option value="id_upload">ID Upload</option>
            <option value="ai_estimation">AI Estimation</option>
          </select>
        </label>
        <button type="submit" className={styles.button}>Submit</button>
      </form>
      {status && <div className={styles.status}>{status}</div>}
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};
export default AgeVerification;
