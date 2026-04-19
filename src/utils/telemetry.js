const makeEvent = (type, payload = {}) => ({
  type,
  payload,
  at: new Date().toISOString(),
});

export const logTelemetry = (type, payload = {}) => {
  if (process.env.NODE_ENV !== 'production') {
    console.info('[focus-telemetry]', makeEvent(type, payload));
  }
};

export const logOptimisticFailure = (action, error, payload = {}) => {
  logTelemetry('optimistic_failure', {
    action,
    error: error?.message || String(error || 'unknown_error'),
    ...payload,
  });
};

export const logOptimisticSuccess = (action, payload = {}) => {
  logTelemetry('optimistic_success', { action, ...payload });
};
