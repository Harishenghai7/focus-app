import React from 'react';
import PropTypes from 'prop-types';

/**
 * BadgeIcon Component
 * Reusable badge icon with color variants and sizes
 */
const BadgeIcon = ({
    Icon,
    color = '#3b82f6',
    size = 'md',
    gradient = null,
    className = '',
    style = {}
}) => {
    const sizeMap = {
        xs: 16,
        sm: 20,
        md: 24,
        lg: 32,
        xl: 40
    };

    const iconSize = sizeMap[size] || sizeMap.md;

    const containerStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${iconSize + 8}px`,
        height: `${iconSize + 8}px`,
        borderRadius: '50%',
        background: gradient || `${color}20`,
        color: color,
        ...style
    };

    return (
        <div className={className} style={containerStyle}>
            {Icon && <Icon size={iconSize} />}
        </div>
    );
};

BadgeIcon.propTypes = {
    Icon: PropTypes.elementType,
    color: PropTypes.string,
    size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
    gradient: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object
};

export default BadgeIcon;
