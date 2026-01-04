import React from 'react';
import PropTypes from 'prop-types';
import styles from './AudioVisualizer.module.css';

/**
 * AudioVisualizer
 * Animated waveform for voice messages.
 * @param {Array<number>} data - Array of amplitude values
 * @example <AudioVisualizer data={[0.2,0.5,0.8,...]} />
 */
const AudioVisualizer = ({ data }) => (
  <div className={styles.container} aria-label="Audio waveform">
    {data.map((amp, i) => (
      <div key={i} className={styles.bar} style={{ height: `${amp * 40}px` }} />
    ))}
  </div>
);

AudioVisualizer.propTypes = {
  data: PropTypes.arrayOf(PropTypes.number).isRequired
};

export default React.memo(AudioVisualizer);
