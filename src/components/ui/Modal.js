import React from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';
import Card from './Card';
import { useClickOutside } from '../../hooks/useClickOutside';

const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
    const modalRef = useClickOutside(onClose);

    if (!isOpen) return null;

    return createPortal(
        <div className={styles.overlay}>
            <div className={styles.modalContainer} ref={modalRef}>
                <Card className={`${styles.modalContent} ${className}`}>
                    {(title || onClose) && (
                        <div className={styles.header}>
                            {title && <h3 className={styles.title}>{title}</h3>}
                            {onClose && (
                                <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                            )}
                        </div>
                    )}
                    <div className={styles.body}>
                        {children}
                    </div>
                </Card>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
