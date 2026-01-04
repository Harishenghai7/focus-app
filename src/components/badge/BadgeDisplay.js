import React, { useState } from 'react';
import PropTypes from 'prop-types';
import BadgeIcon from '../shared/BadgeIcon';
import BadgeTooltip from './BadgeTooltip';
import styles from './BadgeDisplay.module.css';

/**
 * BadgeDisplay Component
 * Single badge display with icon, tooltip, and click interactions
 */
const BadgeDisplay = ({
    badge,
    size = 'md',
    showTooltip = true,
    onClick = null,
    className = ''
}) => {
    const [showTooltipState, setShowTooltipState] = useState(false);

    const { icon: Icon, color, gradient, name, description } = badge;

    const handleClick = () => {
        if (onClick) onClick(badge);
    };

    return (
        <div
            className={`${styles.badgeDisplay} ${styles[size]} ${onClick ? styles.clickable : ''} ${className}`}
            onClick={handleClick}
            onMouseEnter={() => showTooltip && setShowTooltipState(true)}
            onMouseLeave={() => setShowTooltipState(false)}
        >
            <BadgeIcon
                Icon={Icon}
                color={color}
                gradient={gradient}
                size={size}
            />

            {showTooltip && showTooltipState && (
                <BadgeTooltip
                    name={name}
                    description={description}
                    color={color}
                />
            )}
        </div>
    );
};

BadgeDisplay.propTypes = {
    badge: PropTypes.shape({
        icon: PropTypes.elementType,
        color: PropTypes.string,
        gradient: PropTypes.string,
        name: PropTypes.string,
        description: PropTypes.string
    }).isRequired,
    size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
    showTooltip: PropTypes.bool,
    onClick: PropTypes.func,
    className: PropTypes.string
};

export default BadgeDisplay;
