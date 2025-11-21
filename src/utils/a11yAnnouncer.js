/**
 * Screen reader announcer utility
 */

let announcerContainer = null;

const createAnnouncerContainer = () => {
  if (announcerContainer) return announcerContainer;
  
  announcerContainer = document.createElement('div');
  announcerContainer.id = 'a11y-announcer';
  announcerContainer.setAttribute('aria-live', 'polite');
  announcerContainer.setAttribute('aria-atomic', 'true');
  announcerContainer.className = 'sr-only';
  announcerContainer.style.cssText = `
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  `;
  
  document.body.appendChild(announcerContainer);
  return announcerContainer;
};

export const announce = (message, priority = 'polite') => {
  if (!message || typeof message !== 'string') return;
  
  const container = createAnnouncerContainer();
  
  // Update aria-live attribute based on priority
  container.setAttribute('aria-live', priority);
  
  // Clear previous message and set new one
  container.textContent = '';
  
  // Use setTimeout to ensure screen readers pick up the change
  setTimeout(() => {
    container.textContent = message;
  }, 100);
  
  // Clear the message after a delay to avoid it being read repeatedly
  setTimeout(() => {
    container.textContent = '';
  }, 5000);
};

export const announceAssertive = (message) => {
  announce(message, 'assertive');
};

export const announcePolite = (message) => {
  announce(message, 'polite');
};

export const announceStatus = (message) => {
  const statusContainer = document.createElement('div');
  statusContainer.setAttribute('role', 'status');
  statusContainer.setAttribute('aria-live', 'polite');
  statusContainer.className = 'sr-only';
  statusContainer.style.cssText = `
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  `;
  
  document.body.appendChild(statusContainer);
  statusContainer.textContent = message;
  
  setTimeout(() => {
    if (statusContainer.parentNode) {
      statusContainer.parentNode.removeChild(statusContainer);
    }
  }, 1000);
};

export const announceAlert = (message) => {
  const alertContainer = document.createElement('div');
  alertContainer.setAttribute('role', 'alert');
  alertContainer.className = 'sr-only';
  alertContainer.style.cssText = `
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  `;
  
  document.body.appendChild(alertContainer);
  alertContainer.textContent = message;
  
  setTimeout(() => {
    if (alertContainer.parentNode) {
      alertContainer.parentNode.removeChild(alertContainer);
    }
  }, 1000);
};

export const announcePageChange = (pageName) => {
  announce(`Navigated to ${pageName}`, 'polite');
};

export const announceFormError = (fieldName, error) => {
  announceAssertive(`Error in ${fieldName}: ${error}`);
};

export const announceFormSuccess = (message) => {
  announcePolite(`Success: ${message}`);
};

export const announceLoading = (resource = 'content') => {
  announce(`Loading ${resource}...`, 'polite');
};

export const announceLoadingComplete = (resource = 'content') => {
  announce(`${resource} loaded`, 'polite');
};

export const announceNewContent = (contentType = 'content', count = 1) => {
  const plural = count === 1 ? '' : 's';
  announce(`${count} new ${contentType}${plural} available`, 'polite');
};

export const announceButtonAction = (action, target = '') => {
  const message = target ? `${action} ${target}` : action;
  announce(message, 'polite');
};

export const announceModalOpen = (modalTitle) => {
  announcePolite(`${modalTitle} dialog opened`);
};

export const announceModalClose = (modalTitle) => {
  announcePolite(`${modalTitle} dialog closed`);
};

export const announceTabChange = (tabName) => {
  announce(`${tabName} tab selected`, 'polite');
};

export const announceSearchResults = (count, query) => {
  if (count === 0) {
    announce(`No results found for "${query}"`, 'polite');
  } else if (count === 1) {
    announce(`1 result found for "${query}"`, 'polite');
  } else {
    announce(`${count} results found for "${query}"`, 'polite');
  }
};

export const announceValidationResult = (fieldName, isValid, message) => {
  if (isValid) {
    announce(`${fieldName} is valid`, 'polite');
  } else {
    announceAssertive(`${fieldName} error: ${message}`);
  }
};

export const cleanupAnnouncer = () => {
  if (announcerContainer && announcerContainer.parentNode) {
    announcerContainer.parentNode.removeChild(announcerContainer);
    announcerContainer = null;
  }
};

// Initialize on module load
if (typeof window !== 'undefined') {
  createAnnouncerContainer();
}

export default {
  announce,
  announceAssertive,
  announcePolite,
  announceStatus,
  announceAlert,
  announcePageChange,
  announceFormError,
  announceFormSuccess,
  announceLoading,
  announceLoadingComplete,
  announceNewContent,
  announceButtonAction,
  announceModalOpen,
  announceModalClose,
  announceTabChange,
  announceSearchResults,
  announceValidationResult,
  cleanupAnnouncer
};
