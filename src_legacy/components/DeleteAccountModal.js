import React, { useState } from "react";
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import styles from "./DeleteAccountModal.module.css";

/**
 * DeleteAccountModal - Modal for deleting user account with password verification.
 * @component
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Handler to close modal
 * @param {Object} user - Current user object
 * @param {function} onSuccess - Handler for successful account deletion
 * @returns {React.ReactElement}
 */
const DeleteAccountModal = React.memo(function DeleteAccountModal({ isOpen, onClose, user, onSuccess }) {
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    setStep(1);
    setPassword("");
    setConfirmText("");
    setError("");
    onClose();
  };

  const handleVerifyPassword = async () => {
    setError("");
    
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setLoading(true);

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser?.email) {
        throw new Error("User email not found");
      }

      // Verify password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: password
      });

      if (signInError) {
        setError("Incorrect password");
        setLoading(false);
        return;
      }

      // Move to confirmation step
      setStep(2);
      setError("");
    } catch (err) {
      console.error("Error verifying password:", err);
      setError(err.message || "Failed to verify password");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setError("");

    if (confirmText !== "DELETE") {
      setError('Please type "DELETE" to confirm');
      return;
    }

    setLoading(true);

    try {
      // Mark account for deletion with 30-day grace period
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 30);

      // Update profile with deletion flag
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          deletion_scheduled_at: new Date().toISOString(),
          deletion_date: deletionDate.toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Send confirmation email (would be handled by backend in production)
      // For now, we'll just show a success message

      onSuccess?.("Account scheduled for deletion. You have 30 days to cancel.");
      handleClose();

      // Sign out user
      setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = '/auth';
      }, 2000);
    } catch (err) {
      console.error("Error deleting account:", err);
      setError(err.message || "Failed to schedule account deletion");
    } finally {
      setLoading(false);
    }
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
            onClick={handleClose}
          />
          <motion.div
            className={styles.deleteAccountModal}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className={styles.modalHeader}>
              <h2>Delete Account</h2>
              <button className={styles.closeBtn} onClick={handleClose} aria-label="Close modal">
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {step === 1 && (
                <div className={styles.stepContent}>
                  <div className={styles.warningBox}>
                    <span className={styles.warningIcon} role="img" aria-label="Warning">⚠️</span>
                    <div>
                      <h3>This action cannot be undone</h3>
                      <p>
                        Your account will be scheduled for deletion. You'll have 30 days
                        to cancel before your data is permanently removed.
                      </p>
                    </div>
                  </div>

                  <div className={styles.deletionInfo}>
                    <h4>What will be deleted:</h4>
                    <ul>
                      <li>Your profile and account information</li>
                      <li>All your posts, photos, and videos</li>
                      <li>Your comments and likes</li>
                      <li>Your messages and conversations</li>
                      <li>Your followers and following connections</li>
                    </ul>
                  </div>

                  <div className={styles.gracePeriodInfo}>
                    <h4>30-Day Grace Period</h4>
                    <p>
                      After confirming deletion, you'll have 30 days to change your mind.
                      Simply log in again within this period to cancel the deletion.
                    </p>
                  </div>

                  {error && (
                    <div className={styles.errorMessage}>
                      {error}
                    </div>
                  )}

                  <div className={styles.formGroup}>
                    <label htmlFor="password">Enter your password to continue</label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      disabled={loading}
                      autoComplete="current-password"
                      onKeyPress={(e) => e.key === 'Enter' && handleVerifyPassword()}
                    />
                  </div>

                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={handleClose}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={styles.btnDanger}
                      onClick={handleVerifyPassword}
                      disabled={loading || !password}
                    >
                      {loading ? "Verifying..." : "Continue"}
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className={styles.stepContent}>
                  <div className={styles.finalWarning}>
                    <span className={styles.warningIcon} role="img" aria-label="Warning">⚠️</span>
                    <h3>Final Confirmation</h3>
                    <p>
                      This will schedule your account for permanent deletion in 30 days.
                      Are you absolutely sure?
                    </p>
                  </div>

                  {error && (
                    <div className={styles.errorMessage}>
                      {error}
                    </div>
                  )}

                  <div className={styles.formGroup}>
                    <label htmlFor="confirm-text">
                      Type <strong>DELETE</strong> to confirm
                    </label>
                    <input
                      id="confirm-text"
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="DELETE"
                      disabled={loading}
                      autoComplete="off"
                      onKeyPress={(e) => e.key === 'Enter' && handleDeleteAccount()}
                    />
                  </div>

                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={() => setStep(1)}
                      disabled={loading}
                    >
                      Go Back
                    </button>
                    <button
                      type="button"
                      className={styles.btnDanger}
                      onClick={handleDeleteAccount}
                      disabled={loading || confirmText !== "DELETE"}
                    >
                      {loading ? "Deleting..." : "Delete My Account"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

DeleteAccountModal.displayName = 'DeleteAccountModal';
DeleteAccountModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object,
  onSuccess: PropTypes.func
};

export default DeleteAccountModal;
