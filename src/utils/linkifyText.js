import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Parses text and replaces @mentions and #hashtags with React Router Links.
 * @param {string} text - The text to parse.
 * @param {string} styles - Optional CSS class for the links.
 * @returns {Array} An array of React elements and strings.
 */
export const linkifyText = (text, styles = '') => {
    if (!text) return null;

    const regex = /(@\w+)|(#\w+)/g;
    const parts = text.split(regex);

    return parts.filter(Boolean).map((part, index) => {
        if (part.startsWith('@')) {
            const username = part.slice(1);
            return (
                <Link
                    key={index}
                    to={`/profile/${username}`}
                    className={styles}
                    onClick={(e) => e.stopPropagation()}
                >
                    {part}
                </Link>
            );
        }
        if (part.startsWith('#')) {
            const tag = part.slice(1);
            return (
                <Link
                    key={index}
                    to={`/explore?q=${tag}`}
                    className={styles}
                    onClick={(e) => e.stopPropagation()}
                >
                    {part}
                </Link>
            );
        }
        return part;
    });
};
