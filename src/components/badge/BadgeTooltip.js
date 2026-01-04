import React from 'react';
import PropTypes from 'prop-types';
import styles from './BadgeTooltip.module.css';

/**
 * BadgeTooltip Component
 * Tooltip showing badge name, description, and criteria
 */
const BadgeTooltip = ({ name, description, color = '#3b82f6' }) => {
    return (
        <div className={styles.tooltip} style={{ borderColor: color }}>
            <div className={styles.name} style={{ color }}>{name}</div>
            <div className={styles.description}>{description}</div>
        </div>
    );
};

BadgeTooltip.propTypes = {
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    color: PropTypes.string
};

export default BadgeTooltip;
