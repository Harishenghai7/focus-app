import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./GuardianModal.css";

const GuardianVerificationModal = ({ isOpen, onConfirm, onCancel }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="guardian-overlay">
          <motion.div
            className="guardian-modal"
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <h2>👨‍👩‍👧 Parental Verification Required</h2>
            <p>
              Since you’re under 18, please confirm you have a parent or guardian available for verification before proceeding.
            </p>
            <div className="guardian-buttons">
              <button className="confirm-btn" onClick={onConfirm}>Yes, Confirm</button>
              <button className="cancel-btn" onClick={onCancel}>Cancel</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GuardianVerificationModal;
