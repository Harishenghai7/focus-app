/**
 * NotificationsTabs — Sovereign Ecosystem
 * Icon-driven filter pills with animated sliding indicator
 */
import React, { useRef, useState, useEffect } from 'react';
import { Bell, Heart, Shield, CheckCircle, AtSign } from 'lucide-react';
import styles from './NotificationsTabs.module.css';

const TAB_ICONS = {
    all: Bell,
    interactions: Heart,
    mentions: AtSign,
    security: Shield,
    verification: CheckCircle,
};

const NotificationsTabs = ({ tabs, activeTab, onTabChange }) => {
    const containerRef = useRef(null);
    const tabRefs = useRef({});
    const [indicator, setIndicator] = useState({ left: 0, width: 0 });

    // Update sliding indicator position
    useEffect(() => {
        const activeEl = tabRefs.current[activeTab];
        const container = containerRef.current;
        if (activeEl && container) {
            const containerRect = container.getBoundingClientRect();
            const tabRect = activeEl.getBoundingClientRect();
            setIndicator({
                left: tabRect.left - containerRect.left + container.scrollLeft,
                width: tabRect.width,
            });
        }
    }, [activeTab, tabs]);

    return (
        <div className={styles.tabsContainer}>
            <div className={styles.tabs} ref={containerRef} role="tablist">
                {/* Sliding active indicator */}
                <div
                    className={styles.indicator}
                    style={{
                        transform: `translateX(${indicator.left}px)`,
                        width: `${indicator.width}px`,
                    }}
                />

                {tabs.map((tab) => {
                    const IconComp = TAB_ICONS[tab.id] || Bell;
                    const isActive = activeTab === tab.id;
                    const isSecurity = tab.id === 'security';

                    return (
                        <button
                            key={tab.id}
                            ref={(el) => { tabRefs.current[tab.id] = el; }}
                            role="tab"
                            className={`${styles.tab} ${isActive ? styles.active : ''}`}
                            onClick={() => onTabChange(tab.id)}
                            aria-selected={isActive}
                            aria-label={`${tab.label} notifications`}
                        >
                            <IconComp size={15} className={styles.tabIcon} />
                            <span className={styles.tabLabel}>{tab.label}</span>
                            {tab.count > 0 && (
                                <span className={`${styles.tabBadge} ${isSecurity && tab.count > 0 ? styles.securityBadge : ''}`}>
                                    {tab.count > 99 ? '99+' : tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Fade edges for scroll overflow */}
            <div className={styles.fadeLeft} />
            <div className={styles.fadeRight} />
        </div>
    );
};

export default NotificationsTabs;
