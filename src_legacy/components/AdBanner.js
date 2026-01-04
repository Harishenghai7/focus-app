import React from 'react';
import PropTypes from 'prop-types';
import styles from './AdBanner.module.css';

/**
 * AdBanner
 * Advertisement placement component.
 * @param {string} imageUrl - Ad image URL
 * @param {string} link - Ad link URL
 * @example <AdBanner imageUrl="..." link="..." />
 */
const AdBanner = ({ imageUrl, link }) => (
  <a href={link} className={styles.banner} target="_blank" rel="noopener noreferrer" aria-label="Advertisement">
    <img src={imageUrl} alt="Ad" className={styles.image} />
  </a>
);

AdBanner.propTypes = {
  imageUrl: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired
};

export default React.memo(AdBanner);
