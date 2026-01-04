/**
 * Controls Panel Component
 * Manage screen time limits, content filters, and contact restrictions
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useGuardianship } from '../../hooks/useGuardianship';
import styles from './ControlsPanel.module.css';

const ControlsPanel = ({ teenId, relationship }) => {
    const { hasPermission } = useGuardianship();
    const [activeSection, setActiveSection] = useState('screen-time');

    // Screen Time State
    const [screenTimeSettings, setScreenTimeSettings] = useState({
        daily_limit_minutes: 120,
        weekend_limit_minutes: 180,
        enabled: true,
        time_blocks: []
    });

    // Content Filter State
    const [contentFilters, setContentFilters] = useState({
        nsfw_filter_enabled: true,
        violence_filter_enabled: true,
        profanity_filter_enabled: true,
        hide_offensive_comments: true,
        prevent_download: true
    });

    // Contact Restrictions State
    const [contactRestrictions, setContactRestrictions] = useState({
        allow_messages_from: 'followers_only',
        allow_comments_from: 'followers_only',
        block_adult_strangers: true,
        alert_on_stranger_message: true
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch current settings
    useEffect(() => {
        if (!teenId) return;

        const fetchSettings = async () => {
            setLoading(true);
            try {
                // Fetch screen time
                const { data: screenTime } = await supabase
                    .from('screen_time_limits')
                    .select('*')
                    .eq('teen_id', teenId)
                    .single();

                if (screenTime) setScreenTimeSettings(screenTime);

                // Fetch content filters
                const { data: filters } = await supabase
                    .from('content_filter_settings')
                    .select('*')
                    .eq('user_id', teenId)
                    .single();

                if (filters) setContentFilters(filters);

                // Fetch contact restrictions
                const { data: restrictions } = await supabase
                    .from('contact_restrictions')
                    .select('*')
                    .eq('user_id', teenId)
                    .single();

                if (restrictions) setContactRestrictions(restrictions);
            } catch (error) {
                console.error('Error fetching settings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [teenId]);

    // Save screen time settings
    const saveScreenTime = async () => {
        if (!hasPermission(relationship, 'set_screen_time')) {
            alert('You don\'t have permission to modify screen time settings');
            return;
        }

        setSaving(true);
        try {
            await supabase
                .from('screen_time_limits')
                .upsert({
                    teen_id: teenId,
                    ...screenTimeSettings
                });

            alert('Screen time settings saved successfully!');
        } catch (error) {
            console.error('Error saving screen time:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    // Save content filters
    const saveContentFilters = async () => {
        if (!hasPermission(relationship, 'set_content_filters')) {
            alert('You don\'t have permission to modify content filters');
            return;
        }

        setSaving(true);
        try {
            await supabase
                .from('content_filter_settings')
                .upsert({
                    user_id: teenId,
                    ...contentFilters
                });

            alert('Content filter settings saved successfully!');
        } catch (error) {
            console.error('Error saving filters:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    // Save contact restrictions
    const saveContactRestrictions = async () => {
        if (!hasPermission(relationship, 'set_contact_restrictions')) {
            alert('You don\'t have permission to modify contact restrictions');
            return;
        }

        setSaving(true);
        try {
            await supabase
                .from('contact_restrictions')
                .upsert({
                    user_id: teenId,
                    ...contactRestrictions
                });

            alert('Contact restriction settings saved successfully!');
        } catch (error) {
            console.error('Error saving restrictions:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className={`${styles.controlsPanel} ${styles.loading}`}>
                <div className={styles.loader}></div>
            </div>
        );
    }

    return (
        <div className={styles.controlsPanel}>
            {/* Section Tabs */}
            <div className={styles.controlTabs}>
                <button
                    className={activeSection === 'screen-time' ? styles.active : ''}
                    onClick={() => setActiveSection('screen-time')}
                >
                    ⏰ Screen Time
                </button>
                <button
                    className={activeSection === 'content' ? styles.active : ''}
                    onClick={() => setActiveSection('content')}
                >
                    🛡️ Content Filters
                </button>
                <button
                    className={activeSection === 'contacts' ? styles.active : ''}
                    onClick={() => setActiveSection('contacts')}
                >
                    👥 Contact Restrictions
                </button>
            </div>

            {/* Screen Time Section */}
            {activeSection === 'screen-time' && (
                <div className={styles.controlSection}>
                    <h3>Screen Time Limits</h3>

                    <div className={styles.settingGroup}>
                        <label className={styles.toggleLabel}>
                            <input
                                type="checkbox"
                                checked={screenTimeSettings.enabled}
                                onChange={(e) => setScreenTimeSettings({
                                    ...screenTimeSettings,
                                    enabled: e.target.checked
                                })}
                            />
                            <span>Enable Screen Time Limits</span>
                        </label>
                    </div>

                    <div className={styles.settingGroup}>
                        <label>Daily Limit (Weekdays)</label>
                        <div className={styles.sliderContainer}>
                            <input
                                type="range"
                                min="0"
                                max="480"
                                step="15"
                                value={screenTimeSettings.daily_limit_minutes}
                                onChange={(e) => setScreenTimeSettings({
                                    ...screenTimeSettings,
                                    daily_limit_minutes: parseInt(e.target.value)
                                })}
                                className={styles.timeSlider}
                            />
                            <span className={styles.sliderValue}>
                                {Math.floor(screenTimeSettings.daily_limit_minutes / 60)}h {screenTimeSettings.daily_limit_minutes % 60}m
                            </span>
                        </div>
                    </div>

                    <div className={styles.settingGroup}>
                        <label>Daily Limit (Weekends)</label>
                        <div className={styles.sliderContainer}>
                            <input
                                type="range"
                                min="0"
                                max="480"
                                step="15"
                                value={screenTimeSettings.weekend_limit_minutes || 180}
                                onChange={(e) => setScreenTimeSettings({
                                    ...screenTimeSettings,
                                    weekend_limit_minutes: parseInt(e.target.value)
                                })}
                                className={styles.timeSlider}
                            />
                            <span className={styles.sliderValue}>
                                {Math.floor((screenTimeSettings.weekend_limit_minutes || 180) / 60)}h {(screenTimeSettings.weekend_limit_minutes || 180) % 60}m
                            </span>
                        </div>
                    </div>

                    <button onClick={saveScreenTime} disabled={saving} className={styles.saveBtn}>
                        {saving ? 'Saving...' : 'Save Screen Time Settings'}
                    </button>
                </div>
            )}

            {/* Content Filters Section */}
            {activeSection === 'content' && (
                <div className={styles.controlSection}>
                    <h3>Content Filters</h3>

                    <div className={styles.settingsList}>
                        <div className={styles.settingItem}>
                            <div className={styles.settingInfo}>
                                <span className={styles.settingName}>NSFW Filter</span>
                                <span className={styles.settingDesc}>Block adult/sexual content</span>
                            </div>
                            <label className={styles.switch}>
                                <input
                                    type="checkbox"
                                    checked={contentFilters.nsfw_filter_enabled}
                                    onChange={(e) => setContentFilters({
                                        ...contentFilters,
                                        nsfw_filter_enabled: e.target.checked
                                    })}
                                />
                                <span className={styles.switchSlider}></span>
                            </label>
                        </div>

                        <div className={styles.settingItem}>
                            <div className={styles.settingInfo}>
                                <span className={styles.settingName}>Violence Filter</span>
                                <span className={styles.settingDesc}>Block violent content</span>
                            </div>
                            <label className={styles.switch}>
                                <input
                                    type="checkbox"
                                    checked={contentFilters.violence_filter_enabled}
                                    onChange={(e) => setContentFilters({
                                        ...contentFilters,
                                        violence_filter_enabled: e.target.checked
                                    })}
                                />
                                <span className={styles.switchSlider}></span>
                            </label>
                        </div>

                        <div className={styles.settingItem}>
                            <div className={styles.settingInfo}>
                                <span className={styles.settingName}>Profanity Filter</span>
                                <span className={styles.settingDesc}>Hide profane language</span>
                            </div>
                            <label className={styles.switch}>
                                <input
                                    type="checkbox"
                                    checked={contentFilters.profanity_filter_enabled}
                                    onChange={(e) => setContentFilters({
                                        ...contentFilters,
                                        profanity_filter_enabled: e.target.checked
                                    })}
                                />
                                <span className={styles.switchSlider}></span>
                            </label>
                        </div>

                        <div className={styles.settingItem}>
                            <div className={styles.settingInfo}>
                                <span className={styles.settingName}>Hide Offensive Comments</span>
                                <span className={styles.settingDesc}>Auto-hide mean/offensive comments</span>
                            </div>
                            <label className={styles.switch}>
                                <input
                                    type="checkbox"
                                    checked={contentFilters.hide_offensive_comments}
                                    onChange={(e) => setContentFilters({
                                        ...contentFilters,
                                        hide_offensive_comments: e.target.checked
                                    })}
                                />
                                <span className={styles.switchSlider}></span>
                            </label>
                        </div>

                        <div className={styles.settingItem}>
                            <div className={styles.settingInfo}>
                                <span className={styles.settingName}>Prevent Downloads</span>
                                <span className={styles.settingDesc}>Others can't download teen's posts</span>
                            </div>
                            <label className={styles.switch}>
                                <input
                                    type="checkbox"
                                    checked={contentFilters.prevent_download}
                                    onChange={(e) => setContentFilters({
                                        ...contentFilters,
                                        prevent_download: e.target.checked
                                    })}
                                />
                                <span className={styles.switchSlider}></span>
                            </label>
                        </div>
                    </div>

                    <button onClick={saveContentFilters} disabled={saving} className={styles.saveBtn}>
                        {saving ? 'Saving...' : 'Save Content Filter Settings'}
                    </button>
                </div>
            )}

            {/* Contact Restrictions Section */}
            {activeSection === 'contacts' && (
                <div className={styles.controlSection}>
                    <h3>Contact Restrictions</h3>

                    <div className={styles.settingGroup}>
                        <label>Who can send messages?</label>
                        <select
                            value={contactRestrictions.allow_messages_from}
                            onChange={(e) => setContactRestrictions({
                                ...contactRestrictions,
                                allow_messages_from: e.target.value
                            })}
                            className={styles.settingSelect}
                        >
                            <option value="everyone">Everyone</option>
                            <option value="followers_only">Followers Only</option>
                            <option value="approved_contacts">Approved Contacts Only</option>
                            <option value="no_one">No One</option>
                        </select>
                    </div>

                    <div className={styles.settingGroup}>
                        <label>Who can comment?</label>
                        <select
                            value={contactRestrictions.allow_comments_from}
                            onChange={(e) => setContactRestrictions({
                                ...contactRestrictions,
                                allow_comments_from: e.target.value
                            })}
                            className={styles.settingSelect}
                        >
                            <option value="everyone">Everyone</option>
                            <option value="followers_only">Followers Only</option>
                            <option value="off">Comments Off</option>
                        </select>
                    </div>

                    <div className={styles.settingsList}>
                        <div className={styles.settingItem}>
                            <div className={styles.settingInfo}>
                                <span className={styles.settingName}>Block Adult Strangers</span>
                                <span className={styles.settingDesc}>Auto-block adults (25+) who aren't followers</span>
                            </div>
                            <label className={styles.switch}>
                                <input
                                    type="checkbox"
                                    checked={contactRestrictions.block_adult_strangers}
                                    onChange={(e) => setContactRestrictions({
                                        ...contactRestrictions,
                                        block_adult_strangers: e.target.checked
                                    })}
                                />
                                <span className={styles.switchSlider}></span>
                            </label>
                        </div>

                        <div className={styles.settingItem}>
                            <div className={styles.settingInfo}>
                                <span className={styles.settingName}>Alert on Stranger Messages</span>
                                <span className={styles.settingDesc}>Notify when a stranger messages teen</span>
                            </div>
                            <label className={styles.switch}>
                                <input
                                    type="checkbox"
                                    checked={contactRestrictions.alert_on_stranger_message}
                                    onChange={(e) => setContactRestrictions({
                                        ...contactRestrictions,
                                        alert_on_stranger_message: e.target.checked
                                    })}
                                />
                                <span className={styles.switchSlider}></span>
                            </label>
                        </div>
                    </div>

                    <button onClick={saveContactRestrictions} disabled={saving} className={styles.saveBtn}>
                        {saving ? 'Saving...' : 'Save Contact Settings'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ControlsPanel;

