import React, { useState } from 'react';
import SettingsSection from './SettingsSection';
import Toggle from '../shared/Toggle';
import Button from '../ui/Button';
import ChangePasswordModal from './ChangePasswordModal';
import DeleteAccountModal from './DeleteAccountModal';
import LinkedAccounts from './LinkedAccounts';
import { useAuth } from '../../hooks/useAuth';
import styles from './AccountSection.module.css';

const AccountSection = ({ isExpanded, onToggle, settings, onUpdateSetting }) => {
    const { user } = useAuth();
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const icon = (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    return (
        <>
            <SettingsSection
                id="account"
                title="Account"
                description="Manage your account settings and preferences"
                icon={icon}
                isExpanded={isExpanded}
                onToggle={onToggle}
            >
                <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                        <h3 className={styles.settingLabel}>Email</h3>
                        <p className={styles.settingValue}>{user?.email || 'Not set'}</p>
                    </div>
                </div>

                <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                        <h3 className={styles.settingLabel}>Username</h3>
                        <p className={styles.settingValue}>@{user?.user_metadata?.username || 'Not set'}</p>
                    </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.actionButtons}>
                    <Button
                        variant="secondary"
                        onClick={() => setShowPasswordModal(true)}
                        className={styles.actionButton}
                    >
                        Change Password
                    </Button>
                </div>

                <div className={styles.divider} />

                <LinkedAccounts />

                <div className={styles.divider} />

                <div className={styles.dangerZone}>
                    <h3 className={styles.dangerTitle}>Danger Zone</h3>
                    <p className={styles.dangerDescription}>
                        Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => setShowDeleteModal(true)}
                        className={styles.deleteButton}
                    >
                        Delete Account
                    </Button>
                </div>
            </SettingsSection>

            <ChangePasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
            />

            <DeleteAccountModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
            />
        </>
    );
};

export default AccountSection;
