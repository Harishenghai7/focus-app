import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import "./ChangePasswordModal.css";

export default function ChangePasswordModal({ isOpen, onClose, onSuccess }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: ""
  });

  // Password strength validation
  const validatePasswordStrength = (password) => {
    let score = 0;
    let feedback = [];

    if (password.length >= 8) score++;
    else feedback.push("at least 8 characters");

    if (/[a-z]/.test(password)) score++;
    else feedback.push("lowercase letter");

    if (/[A-Z]/.test(password)) score++;
    else feedback.push("uppercase letter");

    if (/\d/.test(password)) score++;
    else feedback.push("number");

    if (/[@$!%*?&]/.test(password)) score++;
    else feedback.push("special character (@$!%*?&)");

    return {
      score,
      feedback: feedback.length > 0 ? `Missing: ${feedback.join(", ")}` : "Strong password!"
    };
  };

  const handleNewPasswordChange = (value) => {
    setNewPassword(value);
    setPasswordStrength(validatePasswordStrength(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (passwordStrength.score < 5) {
      setError("Password does not meet strength requirements");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from current password");
      return;
    }

    setLoading(true);

    try {
      // First, verify current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        throw new Error("User email not found");
      }

      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (signInError) {
        setError("Current password is incorrect");
        setLoading(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      // Success
      onSuccess?.("Password changed successfully!");
      onClose();
      
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordStrength({ score: 0, feedback: "" });
    } catch (err) {
      console.error("Error changing password:", err);
      setError(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength.score <= 2) return "#ff3b30";
    if (passwordStrength.score <= 3) return "#ff9500";
    if (passwordStrength.score <= 4) return "#ffcc00";
    return "#34c759";
  };

  const getStrengthLabel = () => {
    if (passwordStrength.score <= 2) return "Weak";
    if (passwordStrength.score <= 3) return "Fair";
    if (passwordStrength.score <= 4) return "Good";
    return "Strong";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="change-password-modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="modal-header">
              <h2>Change Password</h2>
              <button className="close-btn" onClick={onClose}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="current-password">Current Password</label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-password">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => handleNewPasswordChange(e.target.value)}
                  placeholder="Enter new password"
                  disabled={loading}
                  autoComplete="new-password"
                />
                {newPassword && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div
                        className="strength-fill"
                        style={{
                          width: `${(passwordStrength.score / 5) * 100}%`,
                          backgroundColor: getStrengthColor()
                        }}
                      />
                    </div>
                    <div className="strength-info">
                      <span
                        className="strength-label"
                        style={{ color: getStrengthColor() }}
                      >
                        {getStrengthLabel()}
                      </span>
                      <span className="strength-feedback">
                        {passwordStrength.feedback}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">Confirm New Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              <div className="password-requirements">
                <p className="requirements-title">Password must contain:</p>
                <ul>
                  <li className={newPassword.length >= 8 ? "met" : ""}>
                    At least 8 characters
                  </li>
                  <li className={/[a-z]/.test(newPassword) ? "met" : ""}>
                    One lowercase letter
                  </li>
                  <li className={/[A-Z]/.test(newPassword) ? "met" : ""}>
                    One uppercase letter
                  </li>
                  <li className={/\d/.test(newPassword) ? "met" : ""}>
                    One number
                  </li>
                  <li className={/[@$!%*?&]/.test(newPassword) ? "met" : ""}>
                    One special character (@$!%*?&)
                  </li>
                </ul>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || passwordStrength.score < 5}
                >
                  {loading ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
