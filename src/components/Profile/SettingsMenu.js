import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Icon from '../ui/Icon';
import Modal from '../ui/Modal';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { focusToast } from '../../utils/focusToast';
import styles from './SettingsMenu.module.css';

const SettingsMenu = ({ isOwnProfile, profile, onClose }) => {
    const menuRef = useRef(null);
    const navigate = useNavigate();
    const { signOut, user } = useAuth();
    const [showQRModal, setShowQRModal] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                // Don't close if clicking inside the modal
                if (document.querySelector('.modal-content')?.contains(event.target)) return;
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleCopyLink = () => {
        const url = `${window.location.origin}/profile/${profile?.username}`;
        navigator.clipboard.writeText(url);
        focusToast.success('Link copied to clipboard');
        onClose();
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${profile?.full_name || profile?.username} on Focus`,
                    url: `${window.location.origin}/profile/${profile?.username}`
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            handleCopyLink();
        }
        onClose();
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/auth/login');
    };

    const handleArchive = () => {
        focusToast.info('Archive feature is coming soon!');
        onClose();
    };

    const handleSwitchAccount = () => {
        focusToast.info('Multi-account support is coming soon!');
        onClose();
    };

    const handleQRCode = () => {
        setShowQRModal(true);
        // Don't close menu immediately so modal can open
    };

    if (isOwnProfile) {
        return (
            <>
                <div className={styles.menu} ref={menuRef}>
                    <button className={styles.menuItem} onClick={() => { navigate('/settings'); onClose(); }}>
                        <Icon name="Settings" size={18} />
                        <span>Settings</span>
                    </button>
                    <button className={styles.menuItem} onClick={handleArchive}>
                        <Icon name="Archive" size={18} />
                        <span>View Archive</span>
                    </button>
                    <button className={styles.menuItem} onClick={handleQRCode}>
                        <Icon name="QrCode" size={18} />
                        <span>QR Code</span>
                    </button>
                    <div className={styles.divider} />
                    <button className={styles.menuItem} onClick={handleSwitchAccount}>
                        <Icon name="Users" size={18} />
                        <span>Switch Account</span>
                    </button>
                    <button className={`${styles.menuItem} ${styles.danger}`} onClick={handleLogout}>
                        <Icon name="LogOut" size={18} />
                        <span>Logout</span>
                    </button>
                </div>

                <Modal
                    isOpen={showQRModal}
                    onClose={() => { setShowQRModal(false); onClose(); }}
                    title="Your QR Code"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', gap: '20px' }}>
                        <div style={{ background: 'white', padding: '20px', borderRadius: '16px' }}>
                            <QRCodeSVG
                                value={`${window.location.origin}/profile/${user?.user_metadata?.username}`}
                                size={200}
                                level="H"
                                includeMargin={true}
                            />
                        </div>
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                            Scan this code to visit @{user?.user_metadata?.username}'s profile
                        </p>
                    </div>
                </Modal>
            </>
        );
    }

    // Mute user
    const handleMute = async () => {
        if (!user || !profile) return;

        try {
            const { error } = await supabase
                .from('mutes')
                .insert({
                    muter_id: user.id,
                    muted_id: profile.id
                });

            if (error) throw error;

            focusToast.success(`@${profile.username} has been muted`);
            onClose();
        } catch (err) {
            console.error('Error muting user:', err);
            focusToast.error('Failed to mute user');
        }
    };

    // Block user
    const handleBlock = async () => {
        if (!user || !profile) return;

        const confirmed = window.confirm(
            `Block @${profile.username}?\n\nThey won't be able to find your profile, posts, or stories. They won't be notified that you blocked them.`
        );

        if (!confirmed) return;

        try {
            // Add to blocks table
            const { error: blockError } = await supabase
                .from('blocks')
                .insert({
                    blocker_id: user.id,
                    blocked_id: profile.id
                });

            if (blockError) throw blockError;

            // Remove from followers
            await supabase
                .from('follows')
                .delete()
                .eq('follower_id', profile.id)
                .eq('following_id', user.id);

            // Remove from following
            await supabase
                .from('follows')
                .delete()
                .eq('follower_id', user.id)
                .eq('following_id', profile.id);

            focusToast.success(`@${profile.username} has been blocked`);
            onClose();

            // Navigate away from profile
            navigate('/');
        } catch (err) {
            console.error('Error blocking user:', err);
            focusToast.error('Failed to block user');
        }
    };

    // Report user
    const handleReport = () => {
        navigate(`/report/user/${profile.id}`, {
            state: {
                username: profile.username,
                fullName: profile.full_name
            }
        });
        onClose();
    };

    return (
        <div className={styles.menu} ref={menuRef}>
            <button className={styles.menuItem} onClick={() => { navigate(`/profile/${profile?.username}/about`); onClose(); }}>
                <Icon name="Info" size={18} />
                <span>About This Account</span>
            </button>
            <button className={styles.menuItem} onClick={handleCopyLink}>
                <Icon name="Link" size={18} />
                <span>Copy Profile Link</span>
            </button>
            <button className={styles.menuItem} onClick={handleShare}>
                <Icon name="Share2" size={18} />
                <span>Share Profile</span>
            </button>
            <div className={styles.divider} />
            <button className={`${styles.menuItem} ${styles.warning}`} onClick={handleMute}>
                <Icon name="VolumeX" size={18} />
                <span>Mute</span>
            </button>
            <button className={`${styles.menuItem} ${styles.danger}`} onClick={handleBlock}>
                <Icon name="Ban" size={18} />
                <span>Block</span>
            </button>
            <button className={`${styles.menuItem} ${styles.danger}`} onClick={handleReport}>
                <Icon name="Flag" size={18} />
                <span>Report</span>
            </button>
        </div>
    );
};

export default SettingsMenu;
