import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiCalendar, FiClock, FiX } from 'react-icons/fi';
import './DateTimePicker.css';

/**
 * DateTimePicker Component
 * 
 * A combined date and time picker for scheduling posts.
 * 
 * Features:
 * - Date selection
 * - Time selection (hours and minutes)
 * - Minimum date validation
 * - Clear button
 * - Accessible keyboard navigation
 * 
 * @component
 * @example
 * <DateTimePicker
 *   value={scheduledDate}
 *   onChange={handleDateChange}
 *   minDate={new Date()}
 *   label="Schedule Post"
 * />
 * 
 * @param {Date|string|null} value - Selected date/time value
 * @param {Function} onChange - Callback when date/time changes
 * @param {Date|string} minDate - Minimum allowed date (default: now)
 * @param {string} label - Input label text
 * @param {string} className - Additional CSS classes
 */
const DateTimePicker = ({ value, onChange, minDate = new Date(), label = "Select Date & Time", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(formatDateForInput(date));
      setSelectedTime(formatTimeForInput(date));
    }
  }, [value]);

  const formatDateForInput = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeForInput = (date) => {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDisplayValue = () => {
    if (!value) return 'Not scheduled';
    const date = new Date(value);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getMinDateForInput = () => {
    return formatDateForInput(minDate);
  };

  const getMinTimeForInput = () => {
    if (!selectedDate) return '';
    const min = new Date(minDate);
    const selected = new Date(selectedDate);
    
    // Only apply time restriction if selected date is the same as min date
    if (selected.toDateString() === min.toDateString()) {
      return formatTimeForInput(min);
    }
    return '';
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    updateDateTime(newDate, selectedTime);
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setSelectedTime(newTime);
    updateDateTime(selectedDate, newTime);
  };

  const updateDateTime = (date, time) => {
    if (date && time) {
      const dateTime = new Date(`${date}T${time}`);
      const now = new Date(minDate);
      
      // Validate against minimum date
      if (dateTime >= now) {
        onChange(dateTime);
        setIsOpen(false);
      }
    }
  };

  const handleClear = () => {
    setSelectedDate('');
    setSelectedTime('');
    onChange(null);
    setIsOpen(false);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className={`date-time-picker ${className}`}>
      <label className="date-time-picker-label">
        <FiCalendar className="label-icon" />
        {label}
      </label>
      
      <div className="date-time-display" onClick={handleToggle}>
        <span className={value ? 'has-value' : 'no-value'}>
          {formatDisplayValue()}
        </span>
        {value && (
          <button
            type="button"
            className="clear-button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            aria-label="Clear date and time"
          >
            <FiX />
          </button>
        )}
      </div>

      {isOpen && (
        <>
          <div className="date-time-overlay" onClick={handleClose} />
          <div className="date-time-picker-dropdown">
            <div className="picker-header">
              <h3>Select Date & Time</h3>
              <button
                type="button"
                className="close-picker"
                onClick={handleClose}
                aria-label="Close picker"
              >
                <FiX />
              </button>
            </div>

            <div className="picker-inputs">
              <div className="input-group">
                <label htmlFor="date-input">
                  <FiCalendar />
                  Date
                </label>
                <input
                  id="date-input"
                  type="date"
                  value={selectedDate}
                  min={getMinDateForInput()}
                  onChange={handleDateChange}
                  aria-label="Select date"
                />
              </div>

              <div className="input-group">
                <label htmlFor="time-input">
                  <FiClock />
                  Time
                </label>
                <input
                  id="time-input"
                  type="time"
                  value={selectedTime}
                  min={getMinTimeForInput()}
                  onChange={handleTimeChange}
                  aria-label="Select time"
                />
              </div>
            </div>

            <div className="picker-footer">
              <button
                type="button"
                className="picker-clear"
                onClick={handleClear}
              >
                Clear
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

DateTimePicker.propTypes = {
  value: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string,
    PropTypes.oneOf([null])
  ]),
  onChange: PropTypes.func.isRequired,
  minDate: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string
  ]),
  label: PropTypes.string,
  className: PropTypes.string
};

export default React.memo(DateTimePicker);
