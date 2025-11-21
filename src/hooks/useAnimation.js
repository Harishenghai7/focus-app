import { useCallback, useRef } from 'react';

/**
 * Custom hook for triggering animations on elements
 * 
 * @example
 * const { animate } = useAnimation();
 * 
 * // In JSX
 * <div ref={elementRef}>Hello</div>
 * 
 * // Trigger animation
 * onClick={() => animate(elementRef, 'heartBeat')}
 */
export const useAnimation = () => {
  const animationRef = useRef(null);

  /**
   * Trigger an animation on an element
   * @param {React.MutableRefObject} ref - Element reference to animate
   * @param {string} animationName - Name of the animation (e.g., 'heartBeat', 'shake', 'bounce')
   * @param {number} duration - Optional duration in milliseconds (overrides CSS duration)
   * @param {Function} onComplete - Optional callback after animation completes
   */
  const animate = useCallback((ref, animationName, duration = null, onComplete = null) => {
    if (!ref?.current) {
      console.warn('useAnimation: Invalid ref provided');
      return;
    }

    const element = ref.current;
    const animClass = `animate-${animationName}`;

    // Remove animation class if it's already there
    element.classList.remove(animClass);

    // Trigger reflow to restart animation
    void element.offsetWidth;

    // Add animation class
    element.classList.add(animClass);

    // If duration is provided, set inline style
    if (duration) {
      element.style.animationDuration = `${duration}ms`;
    }

    // Handle completion callback
    if (onComplete) {
      const animationDuration = duration || getAnimationDuration(animClass);
      const timeoutId = setTimeout(() => {
        onComplete();
        element.classList.remove(animClass);
        if (duration) {
          element.style.animationDuration = '';
        }
      }, animationDuration);

      // Store timeout ID for cleanup
      animationRef.current = timeoutId;
    }

    // Auto-cleanup animation class after completion (if no callback)
    if (!onComplete) {
      const animationDuration = duration || getAnimationDuration(animClass);
      const timeoutId = setTimeout(() => {
        element.classList.remove(animClass);
        if (duration) {
          element.style.animationDuration = '';
        }
      }, animationDuration);

      animationRef.current = timeoutId;
    }
  }, []);

  /**
   * Get the duration of a specific animation from CSS
   * @param {string} animClass - Animation class name
   * @returns {number} Duration in milliseconds
   */
  const getAnimationDuration = useCallback((animClass) => {
    const animationDurations = {
      'animate-fadeIn': 300,
      'animate-fadeOut': 300,
      'animate-slideUp': 400,
      'animate-slideDown': 400,
      'animate-slideLeft': 400,
      'animate-slideRight': 400,
      'animate-scaleIn': 300,
      'animate-scaleOut': 300,
      'animate-heartBeat': 600,
      'animate-shake': 500,
      'animate-bounce': 600,
      'animate-rotate': 1000,
      'animate-shimmer': 2000,
    };

    return animationDurations[animClass] || 300;
  }, []);

  /**
   * Cancel ongoing animation
   */
  const cancelAnimation = useCallback((ref) => {
    if (ref?.current) {
      ref.current.classList.remove(
        'animate-fadeIn',
        'animate-fadeOut',
        'animate-slideUp',
        'animate-slideDown',
        'animate-slideLeft',
        'animate-slideRight',
        'animate-scaleIn',
        'animate-scaleOut',
        'animate-heartBeat',
        'animate-shake',
        'animate-bounce',
        'animate-rotate',
        'animate-shimmer'
      );
      ref.current.style.animationDuration = '';
    }

    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  /**
   * Trigger multiple animations in sequence
   * @param {Array} animations - Array of {ref, name, duration} objects
   * @param {number} staggerDelay - Delay between animations in milliseconds
   * @param {Function} onAllComplete - Callback when all animations complete
   */
  const animateSequence = useCallback((animations, staggerDelay = 100, onAllComplete = null) => {
    let completed = 0;

    animations.forEach((anim, index) => {
      setTimeout(() => {
        animate(anim.ref, anim.name, anim.duration, () => {
          completed += 1;
          if (completed === animations.length && onAllComplete) {
            onAllComplete();
          }
        });
      }, index * staggerDelay);
    });
  }, [animate]);

  /**
   * Trigger same animation on multiple elements with stagger
   * @param {Array} refs - Array of element references
   * @param {string} animationName - Name of the animation
   * @param {number} staggerDelay - Delay between each animation in milliseconds
   * @param {Function} onAllComplete - Callback when all animations complete
   */
  const animateMultiple = useCallback((refs, animationName, staggerDelay = 100, onAllComplete = null) => {
    let completed = 0;

    refs.forEach((ref, index) => {
      setTimeout(() => {
        animate(ref, animationName, null, () => {
          completed += 1;
          if (completed === refs.length && onAllComplete) {
            onAllComplete();
          }
        });
      }, index * staggerDelay);
    });
  }, [animate]);

  return {
    animate,
    cancelAnimation,
    animateSequence,
    animateMultiple,
  };
};

export default useAnimation;
