import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './WeeklySafetyReport.module.css';

const WeeklySafetyReport = ({ guardianId, teenId }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('weekly_safety_reports')
        .select('*')
        .eq('guardian_id', guardianId)
        .eq('teen_id', teenId)
        .order('week_start', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') setError(error.message);
      setReport(data || null);
      setLoading(false);
    };
    if (guardianId && teenId) fetchReport();
  }, [guardianId, teenId]);

  if (loading) return <div className={styles.loading}>Loading weekly report...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!report) return <div className={styles.loading}>No report available.</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Weekly Safety Report</h2>
      <div className={styles.item}><b className={styles.label}>Week:</b> {report.week_start} to {report.week_end}</div>
      <div className={styles.item}><b className={styles.label}>Total Screen Time:</b> {report.total_screen_time_minutes} min</div>
      <div className={styles.item}><b className={styles.label}>Posts Created:</b> {report.posts_created}</div>
      <div className={styles.item}><b className={styles.label}>New Followers:</b> {report.new_followers}</div>
      <div className={styles.item}><b className={styles.label}>Critical Alerts:</b> {report.critical_alerts}</div>
      <div className={styles.item}><b className={styles.label}>Flagged Content:</b> {report.flagged_content_count}</div>
      <div className={styles.item}><b className={styles.label}>Summary:</b> {report.summary_text}</div>
      {/* Add more details as needed */}
    </div>
  );
};
export default WeeklySafetyReport;
