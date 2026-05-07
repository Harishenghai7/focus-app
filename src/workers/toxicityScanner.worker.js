/*
 * Note: This file exists for clarity/versioning of the Sovereign Guard worker.
 * The current implementation is generated as a Blob worker in `useToxicityScanner`
 * to maximize compatibility with the current CRA/react-app-rewired setup.
 */

self.onmessage = (event) => {
  const { id, type } = event.data || {};
  if (type !== 'scan') return;
  self.postMessage({ type: 'result', id, result: { purityScore: 1, isClean: true, isBlocked: false, violations: [] } });
};
