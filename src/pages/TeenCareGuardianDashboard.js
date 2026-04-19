/**
 * Guardian Dashboard - Main Page
 * Central hub for guardians to monitor teens
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGuardianship } from '../hooks/useGuardianship';
import { useSafetyAlerts } from '../hooks/useSafetyAlerts';
import { getActivitySummary } from '../utils/activityLogger';
import ActivityOverview from '../components/teencare/ActivityOverview';
import SafetyAlertsPanel from '../components/teencare/SafetyAlertsPanel';
import ControlsPanel from '../components/teencare/ControlsPanel';
import PageShell from '../components/layout/PageShell';
import styles from './TeenCareGuardianDashboard.module.css';

const TeenCareGuardianDashboard = () => {
    const navigate = useNavigate();
    const { teenId } = useParams(); // Optional: specific teen view
    const { teens, loading: teensLoading } = useGuardianship();
    const [selectedTeen, setSelectedTeen] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [activityData, setActivityData] = useState(null);

    // Select first teen by default or from URL param
    useEffect(() => {
        if (teens && teens.length > 0) {
            if (teenId) {
                const teen = teens.find(t => t.teen_id === teenId);
                setSelectedTeen(teen);
            } else {
                setSelectedTeen(teens[0]);
            }
        }
    }, [teens, teenId]);

    // Fetch activity data for selected teen
    useEffect(() => {
        if (!selectedTeen) return;

        const fetchActivity = async () => {
            try {
                console.log('📊 Fetching activity for teen:', selectedTeen.teen_id);
                const endDate = new Date().toISOString();
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 7); // Last 7 days

                const summary = await getActivitySummary(
                    selectedTeen.teen_id,
                    startDate.toISOString(),
                    endDate
                );

                console.log('✅ Activity summary fetched:', summary);
                setActivityData(summary);
            } catch (error) {
                console.error('❌ Error fetching activity:', error);
                // Set empty data to prevent undefined errors
                setActivityData({
                    total_activities: 0,
                    posts_created: 0,
                    new_followers: 0
                });
            }
        };

        fetchActivity();
    }, [selectedTeen]);

    const { alerts, unreadCount } = useSafetyAlerts(selectedTeen?.teen_id);

    if (teensLoading) {
        return (
            <PageShell>
                <div className={`${styles.guardianDashboard} ${styles.loading}`}>
                    <div className={styles.loaderContainer}>
                        <div className={styles.loader}></div>
                        <p>Loading dashboard...</p>
                    </div>
                </div>
            </PageShell>
        );
    }

    if (!teens || teens.length === 0) {
        return (
            <PageShell>
                <div className={`${styles.guardianDashboard} ${styles.empty}`}>
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>👨‍👩‍👧</div>
                        <h2>No Teen Accounts Linked</h2>
                        <p>You have not linked any teen accounts yet. Use Settings to send an invite when Teen Care is enabled for your region.</p>
                        <button className={styles.inviteBtn} onClick={() => navigate('/settings')}>
                            Open Settings
                        </button>
                    </div>
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell>
        <div className={styles.guardianDashboard}>
            {/* Header */}
            <div className={styles.dashboardHeader}>
                <div className={styles.headerContent}>
                    <h1>Guardian Dashboard</h1>
                    <p className={styles.headerSubtitle}>Monitor and protect your teen's online safety</p>
                </div>

                {/* Teen Selector */}
                {teens.length > 1 && (
                    <div className={styles.teenSelector}>
                        <label>Viewing:</label>
                        <select
                            value={selectedTeen?.teen_id || ''}
                            onChange={(e) => {
                                const teen = teens.find(t => t.teen_id === e.target.value);
                                setSelectedTeen(teen);
                            }}
                            className={styles.teenSelect}
                        >
                            {teens.map((teen) => (
                                <option key={teen.teen_id} value={teen.teen_id}>
                                    {teen.teen?.full_name || teen.teen?.username || 'Teen User'}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Quick Stats */}
            <div className={styles.quickStats}>
                <div className={`${styles.statCard} ${styles.alerts}`}>
                    <div className={styles.statIcon}>🚨</div>
                    <div className={styles.statContent}>
                        <h3>{unreadCount}</h3>
                        <p>Unread Alerts</p>
                    </div>
                </div>

                <div className={`${styles.statCard} ${styles.activity}`}>
                    <div className={styles.statIcon}>📊</div>
                    <div className={styles.statContent}>
                        <h3>{activityData?.total_activities || 0}</h3>
                        <p>Activities (7 days)</p>
                    </div>
                </div>

                <div className={`${styles.statCard} ${styles.posts}`}>
                    <div className={styles.statIcon}>📝</div>
                    <div className={styles.statContent}>
                        <h3>{activityData?.posts_created || 0}</h3>
                        <p>Posts Created</p>
                    </div>
                </div>

                <div className={`${styles.statCard} ${styles.followers}`}>
                    <div className={styles.statIcon}>👥</div>
                    <div className={styles.statContent}>
                        <h3>{activityData?.new_followers || 0}</h3>
                        <p>New Followers</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.dashboardTabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'alerts' ? styles.active : ''}`}
                    onClick={() => setActiveTab('alerts')}
                >
                    Safety Alerts
                    {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'controls' ? styles.active : ''}`}
                    onClick={() => setActiveTab('controls')}
                >
                    Controls
                </button>
            </div>

            {/* Tab Content */}
            <div className={styles.dashboardContent}>
                {activeTab === 'overview' && (
                    <ActivityOverview
                        teenId={selectedTeen?.teen_id}
                        activityData={activityData}
                    />
                )}

                {activeTab === 'alerts' && (
                    <SafetyAlertsPanel
                        teenId={selectedTeen?.teen_id}
                        alerts={alerts}
                    />
                )}

                {activeTab === 'controls' && (
                    <ControlsPanel
                        teenId={selectedTeen?.teen_id}
                        relationship={selectedTeen}
                    />
                )}
            </div>
        </div>
        </PageShell>
    );
};

export default TeenCareGuardianDashboard;

