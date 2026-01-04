import React from 'react';
import CustomIcon from '../CustomIcon/CustomIcon';
import './Button.css';

const Button = ({
    children,
    variant = 'primary', // primary | secondary | ghost | icon
    size = 'medium', // small | medium | large
    icon = null,
    iconPosition = 'left', // left | right
    fullWidth = false,
    loading = false,
    disabled = false,
    onClick,
    className = '',
    ...props
}) => {
    const handleClick = (e) => {
        if (disabled || loading) return;

        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }

        if (onClick) {
            onClick(e);
        }
    };

    const buttonClass = `
    btn
    btn-${variant}
    btn-${size}
    ${fullWidth ? 'btn-full-width' : ''}
    ${loading ? 'btn-loading' : ''}
    ${disabled ? 'btn-disabled' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

    return (
        <button
            className={buttonClass}
            onClick={handleClick}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <span className="btn-spinner" />
            ) : (
                <>
                    {icon && iconPosition === 'left' && (
                        <CustomIcon name={icon} size={size === 'small' ? 16 : size === 'large' ? 24 : 20} />
                    )}
                    {children && <span className="btn-text">{children}</span>}
                    {icon && iconPosition === 'right' && (
                        <CustomIcon name={icon} size={size === 'small' ? 16 : size === 'large' ? 24 : 20} />
                    )}
                </>
            )}
        </button>
    );
};

export default Button;
