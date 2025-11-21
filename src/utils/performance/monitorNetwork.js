/**
 * Monitors network status changes.
 * @param {function} callback - Called with online status.
 * @example
 * monitorNetwork(isOnline => console.log(isOnline));
 */
export function monitorNetwork(callback) {
  window.addEventListener('online', () => callback(true));
  window.addEventListener('offline', () => callback(false));
  callback(navigator.onLine);
}
