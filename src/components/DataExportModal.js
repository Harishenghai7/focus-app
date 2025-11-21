import React, { useState } from "react";
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import styles from "./DataExportModal.module.css";

/**
 * DataExportModal - Modal for exporting user data.
 * @component
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Handler to close modal
 * @param {Object} user - Current user object
 * @returns {React.ReactElement}
 */
const DataExportModal = React.memo(function DataExportModal({ isOpen, onClose, user }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [exportComplete, setExportComplete] = useState(false);
  const [exportData, setExportData] = useState(null);

  const handleExport = async () => {
    setLoading(true);
    setProgress(0);
    setStatus("Starting export...");
    setError("");
    setExportComplete(false);

    try {
      const exportResult = {
        export_date: new Date().toISOString(),
        user_id: user.id,
        profile: null,
        posts: [],
        comments: [],
        likes: [],
        saves: [],
        follows: [],
        followers: [],
        messages: [],
        notifications: [],
        settings: null
      };

      // 1. Export Profile Data
      setStatus("Exporting profile data...");
      setProgress(10);
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      exportResult.profile = profileData;

      // 2. Export Posts
      setStatus("Exporting posts...");
      setProgress(20);
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      exportResult.posts = postsData || [];

      // 3. Export Comments
      setStatus("Exporting comments...");
      setProgress(30);
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      exportResult.comments = commentsData || [];

      // 4. Export Likes
      setStatus("Exporting likes...");
      setProgress(40);
      const { data: likesData } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      exportResult.likes = likesData || [];

      // 5. Export Saves
      setStatus("Exporting saved posts...");
      setProgress(50);
      const { data: savesData } = await supabase
        .from('saves')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      exportResult.saves = savesData || [];

      // 6. Export Following
      setStatus("Exporting following list...");
      setProgress(60);
      const { data: followingData } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .order('created_at', { ascending: false });
      exportResult.follows = followingData || [];

      // 7. Export Followers
      setStatus("Exporting followers list...");
      setProgress(70);
      const { data: followersData } = await supabase
        .from('follows')
        .select('*')
        .eq('following_id', user.id)
        .order('created_at', { ascending: false });
      exportResult.followers = followersData || [];

      // 8. Export Messages
      setStatus("Exporting messages...");
      setProgress(80);
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });
      exportResult.messages = messagesData || [];

      // 9. Export Notifications
      setStatus("Exporting notifications...");
      setProgress(90);
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100); // Limit to last 100 notifications
      exportResult.notifications = notificationsData || [];

      // 10. Export Settings
      setStatus("Exporting settings...");
      setProgress(95);
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      exportResult.settings = settingsData;

      // Complete
      setStatus("Export complete!");
      setProgress(100);
      setExportData(exportResult);
      setExportComplete(true);
    } catch (err) {
      console.error("Error exporting data:", err);
      setError(err.message || "Failed to export data");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!exportData) return;

    // Create a formatted JSON string
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Create a blob
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `focus-data-export-${new Date().toISOString().split('T')[0]}.json`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setLoading(false);
    setProgress(0);
    setStatus("");
    setError("");
    setExportComplete(false);
    setExportData(null);
    onClose();
  };

  const formatDataSize = () => {
    if (!exportData) return "0 KB";
    const jsonString = JSON.stringify(exportData);
    const bytes = new Blob([jsonString]).size;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  const getDataSummary = () => {
    if (!exportData) return null;
    return {
      posts: exportData.posts.length,
      comments: exportData.comments.length,
      likes: exportData.likes.length,
      saves: exportData.saves.length,
      following: exportData.follows.length,
      followers: exportData.followers.length,
      messages: exportData.messages.length
    };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!loading ? handleClose : undefined}
            aria-hidden="true"
          />
          <motion.div
            className={styles.dataExportModal}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.modalHeader}>
              <h2>Export Your Data</h2>
              <button 
                className={styles.closeBtn} 
                onClick={handleClose}
                disabled={loading}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {!exportComplete && !loading && (
                <div className={styles.exportInfo}>
                  <div className={styles.infoIcon}>📦</div>
                  <h3>Download a copy of your Focus data</h3>
                  <p>
                    This will create a JSON file containing all your data including:
                  </p>
                  <ul>
                    <li>Profile information</li>
                    <li>Posts and media</li>
                    <li>Comments and likes</li>
                    <li>Saved posts</li>
                    <li>Following and followers</li>
                    <li>Messages</li>
                    <li>Notifications (last 100)</li>
                    <li>Account settings</li>
                  </ul>
                  <p className={styles.privacyNote}>
                    <strong>Privacy Note:</strong> This file will contain all your personal
                    data. Keep it secure and don't share it with anyone.
                  </p>
                </div>
              )}

              {loading && (
                <div className={styles.exportProgress}>
                  <div className={styles.progressIcon}>⏳</div>
                  <h3>Exporting your data...</h3>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className={styles.progressStatus}>{status}</p>
                  <p className={styles.progressPercentage}>{progress}%</p>
                </div>
              )}

              {exportComplete && (
                <div className={styles.exportComplete}>
                  <div className={styles.successIcon}>✅</div>
                  <h3>Export Complete!</h3>
                  <p>Your data has been successfully exported.</p>
                  
                  <div className={styles.exportSummary}>
                    <h4>Data Summary</h4>
                    <div className={styles.summaryGrid}>
                      {Object.entries(getDataSummary()).map(([key, value]) => (
                        <div key={key} className={styles.summaryItem}>
                          <span className={styles.summaryLabel}>
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </span>
                          <span className={styles.summaryValue}>{value}</span>
                        </div>
                      ))}
                    </div>
                    <div className={styles.exportSize}>
                      <strong>Total Size:</strong> {formatDataSize()}
                    </div>
                  </div>

                  <button 
                    className={styles.btnPrimary + ' ' + styles.downloadBtn}
                    onClick={handleDownload}
                    aria-label="Download JSON file"
                  >
                    📥 Download JSON File
                  </button>
                </div>
              )}

              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}

              {!exportComplete && !loading && (
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={handleClose}
                    aria-label="Cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={handleExport}
                    aria-label="Start export"
                  >
                    Start Export
                  </button>
                </div>
              )}

              {exportComplete && (
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={handleClose}
                    aria-label="Close"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

DataExportModal.displayName = 'DataExportModal';
DataExportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired
};

export default DataExportModal;
