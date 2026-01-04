import React from 'react';
import styles from './FilterGallery.module.css';

const FILTERS = [
    { id: 'none', label: 'Normal', style: '' },
    { id: 'clarendon', label: 'Clarendon', style: 'contrast(1.2) saturate(1.35) brightness(1.1)' },
    { id: 'gingham', label: 'Gingham', style: 'brightness(1.05) hue-rotate(-10deg)' },
    { id: 'moon', label: 'Moon', style: 'grayscale(1) contrast(1.1) brightness(1.1)' },
    { id: 'lark', label: 'Lark', style: 'contrast(0.9) brightness(1.1) saturate(1.3)' },
    { id: 'reyes', label: 'Reyes', style: 'sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)' },
    { id: 'juno', label: 'Juno', style: 'contrast(1.2) brightness(1.1) saturate(1.4) sepia(0.2)' },
    { id: 'slumber', label: 'Slumber', style: 'saturate(0.66) brightness(1.05)' },
    { id: 'crema', label: 'Crema', style: 'sepia(0.5) hue-rotate(-10deg) saturate(1.2) contrast(0.8)' },
    { id: 'ludwig', label: 'Ludwig', style: 'sepia(0.25) contrast(1.05) saturate(1.1)' },
    { id: 'aden', label: 'Aden', style: 'hue-rotate(-20deg) contrast(0.9) saturate(0.85) brightness(1.2)' },
    { id: 'perpetua', label: 'Perpetua', style: 'contrast(1.1) brightness(1.25) saturate(1.1)' },
    { id: 'amaro', label: 'Amaro', style: 'sepia(0.35) contrast(1.1) brightness(1.2) saturate(1.3)' },
    { id: 'mayfair', label: 'Mayfair', style: 'contrast(1.1) saturate(1.1)' },
    { id: 'rise', label: 'Rise', style: 'sepia(0.25) contrast(1.25) brightness(1.2) saturate(0.9)' },
    { id: 'hudson', label: 'Hudson', style: 'brightness(1.2) contrast(0.9) saturate(1.1)' },
    { id: 'valencia', label: 'Valencia', style: 'sepia(0.25) contrast(1.08) brightness(1.08)' },
    { id: 'xpro2', label: 'X-Pro II', style: 'sepia(0.3) contrast(1.25) saturate(1.25) brightness(1.75) hue-rotate(-5deg)' },
    { id: 'sierra', label: 'Sierra', style: 'contrast(0.8) saturate(1.2) sepia(0.15)' },
    { id: 'willow', label: 'Willow', style: 'grayscale(0.5) contrast(0.85) brightness(1.2)' },
    { id: 'lofi', label: 'Lo-Fi', style: 'saturate(1.1) contrast(1.5)' },
    { id: 'inkwell', label: 'Inkwell', style: 'sepia(0.3) contrast(1.1) brightness(1.1) grayscale(1)' },
    { id: 'hefe', label: 'Hefe', style: 'contrast(1.5) saturate(1.4)' },
    { id: 'nashville', label: 'Nashville', style: 'sepia(0.2) contrast(1.2) brightness(1.05) saturate(1.2)' },
];

const FilterGallery = ({ activeFilter, onSelect, previewImage }) => {
    return (
        <div className={styles.container}>
            {FILTERS.map(filter => (
                <button
                    key={filter.id}
                    className={`${styles.filterBtn} ${activeFilter === filter.id ? styles.active : ''}`}
                    onClick={() => onSelect(filter.id)}
                >
                    <div className={styles.previewWrapper}>
                        <img
                            src={previewImage}
                            alt={filter.label}
                            className={styles.previewImage}
                            style={{ filter: filter.style }}
                        />
                    </div>
                    <span className={styles.label}>{filter.label}</span>
                </button>
            ))}
        </div>
    );
};

export default FilterGallery;
export { FILTERS };
