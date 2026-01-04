import React from 'react';
import styles from './MainLayout.module.css';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import useMediaQuery from '../../hooks/useMediaQuery';

const MainLayout = ({ children }) => {
    const isDesktop = useMediaQuery('(min-width: 1024px)');

    return (
        <div className={styles.layout}>
            {isDesktop ? (
                <Sidebar />
            ) : (
                <TopBar />
            )}

            <main className={styles.main}>
                {children}
            </main>

            {!isDesktop && <BottomNav />}
        </div>
    );
};

export default MainLayout;
