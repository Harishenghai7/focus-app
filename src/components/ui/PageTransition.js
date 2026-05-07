import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

/**
 * PageTransition — Cinematic route transition wrapper
 * Wraps page content with smooth, GPU-accelerated transitions.
 * Uses Framer Motion for buttery-smooth page changes.
 */

const PRESETS = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.25, ease: 'easeInOut' },
  },
  fadeSlide: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  scale: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
  slideRight: {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  slideUp: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  morph: {
    initial: { opacity: 0, scale: 0.92, filter: 'blur(8px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 1.02, filter: 'blur(4px)' },
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  cinematic: {
    initial: { opacity: 0, y: 20, scale: 0.98, filter: 'blur(4px)' },
    animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, y: -10, scale: 0.99, filter: 'blur(2px)' },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const PageTransition = memo(({ 
  children, 
  preset = 'fadeSlide',
  custom = null,
  mode = 'wait',
  className = '',
  style = {},
}) => {
  const location = useLocation();
  const motionProps = custom || PRESETS[preset] || PRESETS.fadeSlide;

  return (
    <AnimatePresence mode={mode}>
      <motion.div
        key={location.pathname}
        initial={motionProps.initial}
        animate={motionProps.animate}
        exit={motionProps.exit}
        transition={motionProps.transition}
        className={className}
        style={{ 
          width: '100%', 
          minHeight: '100%',
          willChange: 'transform, opacity',
          ...style 
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
});

PageTransition.displayName = 'PageTransition';

/**
 * StaggerContainer — Animates children with staggered delays
 * Wraps a list of items to reveal them one-by-one with a delay.
 */
const StaggerContainer = memo(({
  children,
  staggerDelay = 0.06,
  initialDelay = 0.1,
  className = '',
  style = {},
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: initialDelay,
          },
        },
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
});

StaggerContainer.displayName = 'StaggerContainer';

/**
 * StaggerItem — Individual item inside a StaggerContainer
 */
const StaggerItem = memo(({
  children,
  className = '',
  style = {},
  preset = 'fadeUp',
}) => {
  const variants = {
    fadeUp: {
      hidden: { opacity: 0, y: 20 },
      visible: { 
        opacity: 1, y: 0,
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
      },
    },
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { 
        opacity: 1,
        transition: { duration: 0.35 }
      },
    },
    scaleUp: {
      hidden: { opacity: 0, scale: 0.9 },
      visible: { 
        opacity: 1, scale: 1,
        transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
      },
    },
    slideRight: {
      hidden: { opacity: 0, x: -20 },
      visible: { 
        opacity: 1, x: 0,
        transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
      },
    },
  };

  return (
    <motion.div
      variants={variants[preset] || variants.fadeUp}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
});

StaggerItem.displayName = 'StaggerItem';

/**
 * AnimatedNumber — Animates number counting up/down
 */
const AnimatedNumber = memo(({ value, duration = 0.8, className = '' }) => {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {typeof value === 'number' ? value.toLocaleString() : value}
    </motion.span>
  );
});

AnimatedNumber.displayName = 'AnimatedNumber';

export default PageTransition;
export { StaggerContainer, StaggerItem, AnimatedNumber, PRESETS };
