import React from 'react';
import { Routes, useLocation } from 'react-router-dom';

/**
 * Route outlet wrapper. Intentionally avoids Framer Motion (or any ancestor
 * `transform` / `filter`) so `position: fixed` — e.g. the desktop sidebar —
 * stays viewport-relative per the CSS spec.
 */
const AnimatedRoutes = ({ children }) => {
    const location = useLocation();

    return (
        <div
            key={location.pathname}
            style={{ width: '100%', minHeight: '100%' }}
        >
            <Routes location={location}>
                {children}
            </Routes>
        </div>
    );
};

export default AnimatedRoutes;
