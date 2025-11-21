// Import commands.js using ES2015 syntax:
import './commands'
import './manual-guide-commands'

// Hide fetch/XHR requests from command log
const app = window.top;
if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML = '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}
// Network error handling
beforeEach(() => {
  // Intercept and handle network errors gracefully
  cy.intercept('**', (req) => {
    req.on('response', (res) => {
      if (res.statusCode >= 400) {
        console.warn('Network error intercepted:', res.statusCode);
      }
    });
  });
});
