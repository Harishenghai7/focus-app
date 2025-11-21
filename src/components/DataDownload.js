import React from 'react';
import PropTypes from 'prop-types';
import styles from './DataDownload.module.css';

/**
 * DataDownload
 * Download your data archive UI.
 * @param {Function} onDownload - Callback to start download
 * @example <DataDownload onDownload={handleDownload} />
 */
const DataDownload = ({ onDownload }) => (
  <div className={styles.container}>
    <h3 className={styles.title}>Download Your Data</h3>
    <button className={styles.downloadBtn} onClick={onDownload} aria-label="Download data">Download Archive</button>
  </div>
);

DataDownload.propTypes = {
  onDownload: PropTypes.func.isRequired
};

export default React.memo(DataDownload);
