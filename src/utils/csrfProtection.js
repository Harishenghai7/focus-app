// CSRF Protection utilities
let csrfToken = null;

export const generateCSRFToken = () => {
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  csrfToken = token;
  return token;
};

export const getCSRFToken = () => {
  if (!csrfToken) {
    csrfToken = generateCSRFToken();
  }
  return csrfToken;
};

export const validateCSRFToken = (token) => {
  return token === csrfToken;
};

export const addCSRFHeader = (headers = {}) => {
  return {
    ...headers,
    'X-CSRF-Token': getCSRFToken()
  };
};