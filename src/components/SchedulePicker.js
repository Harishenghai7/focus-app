import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './SchedulePicker.css';

export default function SchedulePicker({ onSchedule, onCancel, initialDate = null }) {
  const [selectedDate, setSelectedDate] = useState(
    initialDate ? new Date(initialDate).toISOString().slice(0, 16) : ''
  );
  const [error, setError] = useState('');

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // Minimum 5 minutes from now
    return now.toISOString().slice(0, 16);
  };

  const getMaxDateTime = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3); // Maximum 3 months from now
    return maxDate.toISOString().slice(0, 16);
  };

  const handleSchedule = () => {
    if (!selectedDate) {
      setError('Please select a date and time');
      return;
    }

    const scheduledTime = new Date(selectedDate);
    const now = new Date();
    const minTime = new Date(now.getTime() + 5 * 60000); // 5 minutes from now
    const maxTime = new Date(now.getTime() + 90 * 24 * 60 * 60000); // 90 days from now

    if (scheduledTime < minTime) {
      setError('Schedule time must be at least 5 minutes from now');
      return;
    }

    if (scheduledTime > maxTime) {
      setError('Schedule time cannot be more than 3 months from now');
      return;
    }

    onSchedule(scheduledTime.toISOString());
  };

  const getQuickOptions = () => {
    const now = new Date();
    return [
      {
        label: 'In 1 hour',
        value: new Date(now.getTime() + 60 * 60000).toISOString().slice(0, 16)
      },
      {
        label: 'In 3 hours',
        value: new Date(now.getTime() + 3 * 60 * 60000).toISOString().slice(0, 16)
      },
      {
        label: 'Tomorrow 9 AM',
        value: (() => {
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(9, 0, 0, 0);
          return tomorrow.toISOString().slice(0, 16);
        })()
      },
      {
        label: 'Tomorrow 6 PM',
        value: (() => {
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(18, 0, 0, 0);
          return tomorrow.toISOString().slice(0, 16);
        })()
      }
    ];
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <motion.div
      className="schedule-picker-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="schedule-picker-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="schedule-picker-header">
          <h3>📅 Schedule Post</h3>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>

        <div className="schedule-picker-body">
          <div className="quick-options">
            <p className="quick-options-label">Quick Options</p>
            <div className="quick-options-grid">
              {getQuickOptions().map((option, index) => (
                <button
                  key={index}
                  className={`quick-option-btn ${selectedDate === option.value ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedDate(option.value);
                    setError('');
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="custom-datetime">
            <p className="custom-datetime-label">Or Choose Custom Date & Time</p>
            <input
              type="datetime-local"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setError('');
              }}
              min={getMinDateTime()}
              max={getMaxDateTime()}
              className="datetime-input"
            />
          </div>

          {selectedDate && (
            <motion.div
              className="selected-time-display"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="display-icon">🕐</span>
              <div className="display-text">
                <p className="display-label">Scheduled for:</p>
                <p className="display-value">{formatDisplayDate(selectedDate)}</p>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              className="schedule-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              ⚠️ {error}
            </motion.div>
          )}

          <div className="schedule-info">
            <p>ℹ️ Your post will be published automatically at the scheduled time.</p>
            <p>You can view and manage scheduled posts in your profile.</p>
          </div>
        </div>

        <div className="schedule-picker-footer">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSchedule}
            disabled={!selectedDate}
          >
            Schedule Post
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
