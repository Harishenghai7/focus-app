import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import styles from './VideoTrimmer.module.css';

/**
 * VideoTrimmer
 * Video trim editor with timeline scrubber.
 * @param {string} src - Video source URL
 * @param {Function} onTrim - Callback with start/end times
 * @example <VideoTrimmer src={videoUrl} onTrim={handleTrim} />
 */
const VideoTrimmer = ({ src, onTrim }) => {
  const videoRef = useRef(null);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(10);

  const handleTrim = () => {
    if (onTrim) onTrim({ start, end });
  };

  return (
    <div className={styles.container}>
      <video ref={videoRef} src={src} controls className={styles.video} />
      <div className={styles.timeline}>
        <label>
          Start
          <input type="number" min={0} value={start} onChange={e => setStart(Number(e.target.value))} className={styles.input} />
        </label>
        <label>
          End
          <input type="number" min={start} value={end} onChange={e => setEnd(Number(e.target.value))} className={styles.input} />
        </label>
      </div>
      <button className={styles.trimBtn} onClick={handleTrim} aria-label="Trim video">Trim</button>
    </div>
  );
};

VideoTrimmer.propTypes = {
  src: PropTypes.string.isRequired,
  onTrim: PropTypes.func.isRequired
};

export default React.memo(VideoTrimmer);
