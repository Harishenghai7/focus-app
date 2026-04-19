import React from 'react';
import { motion } from 'framer-motion';
import styles from './MainLayout.module.css';
import Sidebar from './Sidebar';
import TopBar from './TopBar'; 
import BottomNav from './BottomNav';
import useMediaQuery from '../../hooks/useMediaQuery';

const MainLayout = ({ children }) => {
    // Breakpoint: Desktop view starts at 1024px
    const isDesktop = useMediaQuery('(min-width: 1024px)');

    return (
        <div className={styles.layout}>
            {/* Desktop: Sidebar on Left / Mobile: TopBar */}
            {isDesktop ? <Sidebar /> : <TopBar />}

            <motion.main
                className={styles.main}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
            >
                <div className={styles.contentWrapper}>
                    {children}
                </div>
            </motion.main>

            {/* Mobile: Bottom Nav */}
            {!isDesktop && <BottomNav />}
        </div>
    );
};

export default MainLayout;