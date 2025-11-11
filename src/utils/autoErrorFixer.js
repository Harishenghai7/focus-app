/**
 * Auto Error Fixer - Attempts to automatically fix common bugs and errors
 */

class AutoErrorFixer {
  constructor() {
    this.fixStrategies = new Map();
    this.setupFixStrategies();
  }

  setupFixStrategies() {
    // Missing click handler fix
    this.fixStrategies.set('missing_click_handler', (bug) => {
      const element = document.querySelector(bug.data.element.path);
      if (element && element.style.cursor === 'pointer') {
        element.style.cursor = 'default';

        return true;
      }
      return false;
    });

    // Resource load failure fix
    this.fixStrategies.set('resource_load_failure', (bug) => {
      const element = document.querySelector(`[src="${bug.data.src}"]`);
      if (element) {
        // Try alternative CDN or fallback
        const fallbackSrc = this.getFallbackResource(bug.data.src);
        if (fallbackSrc) {
          element.src = fallbackSrc;

          return true;
        }
      }
      return false;
    });

    // Form validation error fix
    this.fixStrategies.set('validation_error', (bug) => {
      const element = document.querySelector(`[name="${bug.data.field}"]`);
      if (element) {
        // Add better validation feedback
        this.addValidationFeedback(element);

        return true;
      }
      return false;
    });

    // Network error retry fix
    this.fixStrategies.set('network_error', (bug) => {
      // Implement exponential backoff retry
      this.retryNetworkRequest(bug.data.url);

      return true;
    });

    // Memory leak fix
    this.fixStrategies.set('high_memory_usage', (bug) => {
      // Force garbage collection if available
      if (window.gc) {
        window.gc();

        return true;
      }
      
      // Clear caches
      this.clearMemoryCaches();

      return true;
    });

    // User frustration fix
    this.fixStrategies.set('user_frustration_rapid_clicking', (bug) => {
      // Show helpful tooltip or guide
      this.showUserGuidance();

      return true;
    });
  }

  async fixBug(bug) {
    const strategy = this.fixStrategies.get(bug.type);
    if (strategy) {
      try {
        const fixed = await strategy(bug);
        if (fixed) {
          this.logFix(bug);
          return true;
        }
      } catch (error) {

      }
    }
    return false;
  }

  getFallbackResource(originalSrc) {
    const fallbacks = {
      // Common CDN fallbacks
      'cdn.jsdelivr.net': 'unpkg.com',
      'cdnjs.cloudflare.com': 'cdn.jsdelivr.net',
      // Image fallbacks
      '.jpg': '/default-image.jpg',
      '.png': '/default-image.png',
      '.svg': '/default-icon.svg'
    };

    for (const [pattern, replacement] of Object.entries(fallbacks)) {
      if (originalSrc.includes(pattern)) {
        return originalSrc.replace(pattern, replacement);
      }
    }

    return null;
  }

  addValidationFeedback(element) {
    // Remove existing feedback
    const existingFeedback = element.parentNode.querySelector('.validation-feedback');
    if (existingFeedback) {
      existingFeedback.remove();
    }

    // Add new feedback element
    const feedback = document.createElement('div');
    feedback.className = 'validation-feedback';
    feedback.style.cssText = `
      color: #e74c3c;
      font-size: 0.8rem;
      margin-top: 0.25rem;
      display: none;
    `;

    element.parentNode.appendChild(feedback);

    // Show feedback on invalid input
    element.addEventListener('invalid', () => {
      feedback.textContent = element.validationMessage;
      feedback.style.display = 'block';
    });

    element.addEventListener('input', () => {
      if (element.validity.valid) {
        feedback.style.display = 'none';
      }
    });
  }

  async retryNetworkRequest(url) {
    const maxRetries = 3;
    let retries = 0;

    const retry = async () => {
      try {
        const response = await fetch(url);
        if (response.ok) {

          return response;
        }
      } catch (error) {
        retries++;
        if (retries < maxRetries) {
          const delay = Math.pow(2, retries) * 1000; // Exponential backoff
          setTimeout(retry, delay);
        }
      }
    };

    return retry();
  }

  clearMemoryCaches() {
    // Clear various caches to free memory
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('temp') || name.includes('cache')) {
            caches.delete(name);
          }
        });
      });
    }

    // Clear image caches
    const images = document.querySelectorAll('img[data-cached]');
    images.forEach(img => {
      img.removeAttribute('data-cached');
    });

    // Clear localStorage if too large
    try {
      const storageSize = JSON.stringify(localStorage).length;
      if (storageSize > 5 * 1024 * 1024) { // 5MB
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('cache') || key.includes('temp')) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {

    }
  }

  showUserGuidance() {
    // Create guidance tooltip
    const guidance = document.createElement('div');
    guidance.className = 'user-guidance-tooltip';
    guidance.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #2c3e50;
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        text-align: center;
        max-width: 300px;
      ">
        <h4 style="margin: 0 0 0.5rem 0;">💡 Tip</h4>
        <p style="margin: 0; font-size: 0.9rem;">
          Try waiting a moment between clicks for better performance.
        </p>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="
                  background: #3498db;
                  color: white;
                  border: none;
                  padding: 0.5rem 1rem;
                  border-radius: 4px;
                  margin-top: 1rem;
                  cursor: pointer;
                ">
          Got it!
        </button>
      </div>
    `;

    document.body.appendChild(guidance);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (guidance.parentNode) {
        guidance.remove();
      }
    }, 5000);
  }

  logFix(bug) {

    // Send fix report to analytics
    if (window.aiTracker) {
      window.aiTracker.trackCustomEvent('auto_fix_applied', {
        bugType: bug.type,
        bugId: bug.id,
        timestamp: Date.now()
      });
    }
  }

  // Proactive fixes
  setupProactiveFixes() {
    // Monitor for common issues and fix them before they become bugs
    
    // Fix broken images
    document.addEventListener('error', (e) => {
      if (e.target.tagName === 'IMG') {
        const fallback = this.getFallbackResource(e.target.src);
        if (fallback) {
          e.target.src = fallback;
        }
      }
    }, true);

    // Fix slow loading resources
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 3000) { // 3 second threshold

          // Could implement resource optimization here
        }
      });
    });

    if ('PerformanceObserver' in window) {
      observer.observe({ entryTypes: ['resource'] });
    }

    // Fix memory leaks
    setInterval(() => {
      if ('memory' in performance) {
        const memory = performance.memory;
        const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        if (usage > 0.8) { // 80% memory usage
          this.clearMemoryCaches();
        }
      }
    }, 30000); // Check every 30 seconds
  }
}

export const autoErrorFixer = new AutoErrorFixer();

// Initialize proactive fixes
autoErrorFixer.setupProactiveFixes();

export default autoErrorFixer;