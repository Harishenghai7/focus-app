import React from 'react';
import { formatDateDivider } from '../../utils/formatDateDivider';
import styles from './DateDivider.module.css';

const DateDivider = ({ date }) => {
    return (
        <div className={styles.dateDivider}>
            <div className={styles.line}></div>
            <span className={styles.dateText}>{formatDateDivider(date)}</span>
            <div className={styles.line}></div>
        </div>
    );
};

export default DateDivider;
