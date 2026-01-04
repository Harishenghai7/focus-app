import React, { useState } from 'react';
import GuardianLinking from './GuardianLinking';
import { useGuardianDashboard } from '../../hooks/useGuardianDashboard';
import WeeklySafetyReport from './WeeklySafetyReport';
import styles from './GuardianDashboardMain.module.css';
import { FaUserShield, FaChartLine, FaClock, FaExclamationTriangle, FaUsers, FaFileAlt } from 'react-icons/fa';

const GuardianDashboardMain = ({ teens }) => {
  const [selectedTeen, setSelectedTeen] = useState(teens?.[0]?.id || '');
  const {
    loading,
    error,
    activityOverview,
    screenTimeData,
    safetyAlerts,
    flaggedContent,
    contactActivity,
    weeklyReport,
    updateScreenTimeLimits,
    blockUserForTeen,
    resolveAlert
  } = useGuardianDashboard(selectedTeen);

  const getAlertClass = (severity) => {
    switch (severity) {
      case 'critical': return styles.alertCritical;
      case 'high': return styles.alertHigh;
      case 'medium': return styles.alertMedium;
      case 'low': return styles.alertLow;
      default: return styles.alertLow;
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <FaUserShield className={styles.headerIcon} />
        <h1>Guardian Dashboard</h1>
      </div>

      <GuardianLinking />

      <div className={styles.teenSelect}>
        <label className={styles.label}>Select Teen: </label>
        <select
          value={selectedTeen}
          onChange={e => setSelectedTeen(e.target.value)}
          className={styles.select}
        >
          {teens?.map(t => <option key={t.id} value={t.id}>{t.username}</option>)}
        </select>
      </div>

      {loading && <div>Loading dashboard...</div>}
      {error && <div className={styles.error}>{error}</div>}

      {selectedTeen && !loading && (
        <>
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>
              <FaChartLine className={styles.sectionIcon} />
              Activity Overview
            </h2>
            <pre>{JSON.stringify(activityOverview, null, 2)}</pre>
          </div>

          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>
              <FaClock className={styles.sectionIcon} />
              Screen Time
            </h2>
            <pre>{JSON.stringify(screenTimeData, null, 2)}</pre>
            {/* Add controls to update limits if needed */}
          </div>

          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>
              <FaExclamationTriangle className={styles.sectionIcon} />
              Content Monitoring
            </h2>
            <pre>{JSON.stringify(flaggedContent, null, 2)}</pre>
          </div>

          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>
              <FaExclamationTriangle className={styles.sectionIcon} />
              Safety Alerts
            </h2>
            <ul className={styles.alertList}>
              {safetyAlerts?.map(alert => (
                <li key={alert.id} className={styles.alertItem}>
                  <div className={styles.alertContent}>
                    <span className={styles.alertType}>{alert.alert_type}</span>: {alert.title}
                    <span className={getAlertClass(alert.severity)}>{alert.severity}</span>
                  </div>
                  <button
                    onClick={() => resolveAlert(alert.id, 'reviewed')}
                    className={styles.resolveButton}
                  >
                    Mark Reviewed
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>
              <FaUsers className={styles.sectionIcon} />
              Contact Activity
            </h2>
            <pre>{JSON.stringify(contactActivity, null, 2)}</pre>
          </div>

          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>
              <FaFileAlt className={styles.sectionIcon} />
              Weekly Report
            </h2>
            <WeeklySafetyReport guardianId={teens.find(t => t.id === selectedTeen)?.guardian_id} teenId={selectedTeen} />
            <pre>{JSON.stringify(weeklyReport, null, 2)}</pre>
          </div>
        </>
      )}
    </div>
  );
};
export default GuardianDashboardMain;
