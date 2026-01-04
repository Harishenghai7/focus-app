import React from 'react';
import styles from './Avatar.module.css';

const Avatar = ({
    src,
    alt = 'Avatar',
    size = 'md',
    status,
    className = '',
    onClick
}) => {
    return (
        <div
            className={`${styles.avatar} ${styles[`avatar-${size}`]} ${className}`}
            onClick={onClick}
        >
            <img
                src={src || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMTUwIDE1MCI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjUwIiBmaWxsPSIjNjY2IiBkeT0iLjNlbSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VXNlcjwvdGV4dD48L3N2Zz4='}
                alt={alt}
            />
            {status && <span className={`${styles.status} ${styles[status]}`}></span>}
        </div>
    );
};

export default Avatar;
