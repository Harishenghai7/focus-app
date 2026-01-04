/**
 * SchedulePicker Component
 * Schedule posts for later publication
 */

import React, { useState, useEffect } from 'react';
import './SchedulePicker.css';

const SchedulePicker = ({ value, onChange, onClose }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [timezone, setTimezone] = useState('');

  useEffect(() => {
    // Get user's timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(userTimezone);

    // If value exists, parse it
    if (value) {
      const date = new Date(value);
      setSelectedDate(date.toISOString().split('T')[0]);
      setSelectedTime(date.toTimeString().slice(0, 5));
    } else {
      // Set default to 1 hour from now
      const defaultDate = new Date();
      defaultDate.setHours(defaultDate.getHours() + 1);
      setSelectedDate(defaultDate.toISOString().split('T')[0]);
      setSelectedTime(defaultDate.toTimeString().slice(0, 5));
    }
  }, [value]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleTimeChange = (e) => {
    setSelectedTime(e.target.value);
  };

  const handleQuickSelect = (minutes) => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + minutes);
    setSelectedDate(date.toISOString().split('T')[0]);
    setSelectedTime(date.toTimeString().slice(0, 5));
  };

  const handleSave = () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select both date and time');
      return;
    }

    const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}`);
    const now = new Date();

    if (scheduledDateTime <= now) {
      alert('Scheduled time must be in the future');
      return;
    }

    // Check if more than 75 days in future (Instagram limit)
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 75);
    if (scheduledDateTime > maxDate) {
      alert('Cannot schedule more than 75 days in advance');
      return;
    }

    onChange(scheduledDateTime.toISOString());
    onClose();
  };

  const handlePostNow = () => {
    onChange(null);
    onClose();
  };

  // Get formatted preview
  const getPreview = () => {
    if (!selectedDate || !selectedTime) return null;

    const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}`);
    const now = new Date();
    
    if (scheduledDateTime <= now) {
      return null;
    }

    const diffMs = scheduledDateTime - now;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let timeUntil = '';
    if (diffDays > 0) {
      timeUntil = `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      timeUntil = `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      timeUntil = `in ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    }

    return {
      formatted: scheduledDateTime.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      timeUntil
    };
  };

  const preview = getPreview();

  // Get min date (today) and max date (75 days from now)
  const minDate = new Date().toISOString().split('T')[0];
  const maxDateObj = new Date();
  maxDateObj.setDate(maxDateObj.getDate() + 75);
  const maxDate = maxDateObj.toISOString().split('T')[0];

  return (
    <div className="schedule-picker">
      <div className="schedule-picker-header">
        <h3>Schedule Post</h3>
        <button
          className="schedule-picker-close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="schedule-picker-subtitle">
        Choose when to publish your post
      </div>

      {/* Quick Select Options */}
      <div className="schedule-quick-select">
        <h4>Quick Select</h4>
        <div className="schedule-quick-buttons">
          <button
            className="schedule-quick-button"
            onClick={() => handleQuickSelect(15)}
          >
            <span className="schedule-quick-icon">⏰</span>
            15 min
          </button>
          <button
            className="schedule-quick-button"
            onClick={() => handleQuickSelect(30)}
          >
            <span className="schedule-quick-icon">⏰</span>
            30 min
          </button>
          <button
            className="schedule-quick-button"
            onClick={() => handleQuickSelect(60)}
          >
            <span className="schedule-quick-icon">⏰</span>
            1 hour
          </button>
          <button
            className="schedule-quick-button"
            onClick={() => handleQuickSelect(180)}
          >
            <span className="schedule-quick-icon">⏰</span>
            3 hours
          </button>
          <button
            className="schedule-quick-button"
            onClick={() => handleQuickSelect(1440)}
          >
            <span className="schedule-quick-icon">📅</span>
            Tomorrow
          </button>
        </div>
      </div>

      {/* Custom Date/Time */}
      <div className="schedule-custom">
        <h4>Custom Schedule</h4>
        
        <div className="schedule-input-group">
          <label className="schedule-label">Date</label>
          <input
            type="date"
            className="schedule-input"
            value={selectedDate}
            onChange={handleDateChange}
            min={minDate}
            max={maxDate}
          />
        </div>

        <div className="schedule-input-group">
          <label className="schedule-label">Time</label>
          <input
            type="time"
            className="schedule-input"
            value={selectedTime}
            onChange={handleTimeChange}
          />
        </div>

        <div className="schedule-timezone">
          <span className="schedule-timezone-icon">🌍</span>
          <span className="schedule-timezone-text">{timezone}</span>
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div className="schedule-preview">
          <div className="schedule-preview-icon">📅</div>
          <div className="schedule-preview-content">
            <div className="schedule-preview-title">Your post will be published</div>
            <div className="schedule-preview-datetime">{preview.formatted}</div>
            <div className="schedule-preview-relative">{preview.timeUntil}</div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="schedule-info">
        <span className="schedule-info-icon">💡</span>
        <div className="schedule-info-text">
          <strong>Note:</strong> You can schedule posts up to 75 days in advance. 
          Scheduled posts can be edited or deleted before they go live.
        </div>
      </div>

      {/* Actions */}
      <div className="schedule-actions">
        <button
          className="schedule-action-secondary"
          onClick={handlePostNow}
        >
          Post Now Instead
        </button>
        <button
          className="schedule-action-primary"
          onClick={handleSave}
          disabled={!preview}
        >
          Schedule Post
        </button>
      </div>
    </div>
  );
};

export default SchedulePicker;
