/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GLOBAL ANIMATION ENGINE — Focus Universal Theme
 * Centralized Framer Motion variants for cinematic transitions & fluid motion
 * ═══════════════════════════════════════════════════════════════════════════
 */

// 1. PAGE TRANSITIONS (Cinematic, smooth entrance)
export const pageTransitions = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { 
    type: "spring", 
    stiffness: 260, 
    damping: 20,
    mass: 0.5 
  }
};

// 2. STAGGERED LISTS (For feeds, grids, and settings menus)
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

// 3. MICRO-INTERACTIONS (Buttons & Cards)
export const hoverTapScale = {
  whileHover: { scale: 1.02, y: -2 },
  whileTap: { scale: 0.97 },
  transition: { type: "spring", stiffness: 400, damping: 25 }
};

export const hoverGlow = {
  whileHover: { 
    scale: 1.02, 
    boxShadow: "0px 8px 32px rgba(139, 92, 246, 0.4)" 
  },
  whileTap: { scale: 0.98 },
  transition: { type: "spring", stiffness: 400, damping: 25 }
};

// 4. MODALS & OVERLAYS
export const overlayVariants = {
  hidden: { opacity: 0, backdropFilter: "blur(0px)" },
  visible: { 
    opacity: 1, 
    backdropFilter: "blur(12px)",
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0, 
    backdropFilter: "blur(0px)",
    transition: { duration: 0.2 }
  }
};

export const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 350, damping: 30 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 20,
    transition: { duration: 0.2 }
  }
};

// 5. TOASTS & NOTIFICATIONS
export const toastVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 25 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9, 
    transition: { duration: 0.2 }
  }
};
