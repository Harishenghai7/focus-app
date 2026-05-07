import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const SCAN_DEBOUNCE_MS = 250;
const PURITY_THRESHOLD = 0.8;

const KEYWORD_BLOCKLIST = {
  severe: [
    'kill yourself',
    'kys',
    'end your life',
    'suicide',
    'rape',
    'molest',
    'child porn',
    'cp ',
    'loli ',
    'shotacon'
  ],
  hate: ['nigger', 'nigga', 'faggot', 'chink', 'kike', 'wetback', 'raghead', 'towelhead'],
  profanity: ['fuck', 'shit', 'bitch', 'cunt', 'asshole']
};

function keywordScan(text) {
  const lower = (text || '').toLowerCase();

  const violations = [];
  let maxScore = 0;

  for (const kw of KEYWORD_BLOCKLIST.severe) {
    if (lower.includes(kw)) {
      violations.push({ type: 'SEVERE_TOXICITY', keyword: kw, score: 1 });
      maxScore = Math.max(maxScore, 1);
    }
  }

  for (const kw of KEYWORD_BLOCKLIST.hate) {
    if (lower.includes(kw)) {
      violations.push({ type: 'HATE_SPEECH', keyword: kw, score: 0.95 });
      maxScore = Math.max(maxScore, 0.95);
    }
  }

  for (const kw of KEYWORD_BLOCKLIST.profanity) {
    if (lower.includes(kw)) {
      violations.push({ type: 'PROFANITY', keyword: kw, score: 0.7 });
      maxScore = Math.max(maxScore, 0.7);
    }
  }

  const purityScore = 1 - maxScore;

  return {
    purityScore,
    maxScore,
    violations,
    isClean: purityScore >= PURITY_THRESHOLD && violations.length === 0,
    isQuestionable: purityScore >= 0.5 && purityScore < PURITY_THRESHOLD,
    isToxic: purityScore < 0.5,
    isBlocked: purityScore < 0.5 || violations.some((v) => v.type === 'SEVERE_TOXICITY')
  };
}

function buildWorker() {
  const workerSource = `
    const PURITY_THRESHOLD = ${PURITY_THRESHOLD};
    const KEYWORD_BLOCKLIST = ${JSON.stringify(KEYWORD_BLOCKLIST)};

    function keywordScan(text) {
      const lower = (text || '').toLowerCase();
      const violations = [];
      let maxScore = 0;

      for (const kw of KEYWORD_BLOCKLIST.severe) {
        if (lower.includes(kw)) {
          violations.push({ type: 'SEVERE_TOXICITY', keyword: kw, score: 1 });
          maxScore = Math.max(maxScore, 1);
        }
      }

      for (const kw of KEYWORD_BLOCKLIST.hate) {
        if (lower.includes(kw)) {
          violations.push({ type: 'HATE_SPEECH', keyword: kw, score: 0.95 });
          maxScore = Math.max(maxScore, 0.95);
        }
      }

      for (const kw of KEYWORD_BLOCKLIST.profanity) {
        if (lower.includes(kw)) {
          violations.push({ type: 'PROFANITY', keyword: kw, score: 0.7 });
          maxScore = Math.max(maxScore, 0.7);
        }
      }

      const purityScore = 1 - maxScore;
      return {
        purityScore,
        maxScore,
        violations,
        isClean: purityScore >= PURITY_THRESHOLD && violations.length === 0,
        isQuestionable: purityScore >= 0.5 && purityScore < PURITY_THRESHOLD,
        isToxic: purityScore < 0.5,
        isBlocked: purityScore < 0.5 || violations.some((v) => v.type === 'SEVERE_TOXICITY')
      };
    }

    self.onmessage = (event) => {
      const { id, type, text } = event.data || {};
      if (type !== 'scan') return;
      const result = keywordScan(text);
      self.postMessage({ type: 'result', id, result });
    };
  `;

  const blob = new Blob([workerSource], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  worker.__revokeUrl = () => URL.revokeObjectURL(url);
  return worker;
}

export const useToxicityScanner = () => {
  const [state, setState] = useState({
    isScanning: false,
    purityScore: 1,
    isClean: true,
    isQuestionable: false,
    isToxic: false,
    isBlocked: false,
    violations: [],
    canProceed: true
  });

  const workerRef = useRef(null);
  const debounceRef = useRef(null);
  const scanIdRef = useRef(0);

  useEffect(() => {
    const worker = buildWorker();

    worker.onmessage = (event) => {
      const { type, id, result } = event.data || {};
      if (type !== 'result') return;
      if (id !== scanIdRef.current) return;

      setState({
        isScanning: false,
        purityScore: result.purityScore,
        isClean: result.isClean,
        isQuestionable: result.isQuestionable,
        isToxic: result.isToxic,
        isBlocked: result.isBlocked,
        violations: result.violations || [],
        canProceed: !result.isBlocked
      });
    };

    worker.onerror = () => {
      setState((prev) => ({ ...prev, isScanning: false, canProceed: true }));
    };

    workerRef.current = worker;

    return () => {
      try {
        worker.terminate();
        if (worker.__revokeUrl) worker.__revokeUrl();
      } catch (_) {
        // ignore
      }
    };
  }, []);

  const scanText = useCallback((text) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!text || text.trim().length === 0) {
      setState({
        isScanning: false,
        purityScore: 1,
        isClean: true,
        isQuestionable: false,
        isToxic: false,
        isBlocked: false,
        violations: [],
        canProceed: true
      });
      return;
    }

    setState((prev) => ({ ...prev, isScanning: true }));

    debounceRef.current = setTimeout(() => {
      scanIdRef.current += 1;
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'scan', id: scanIdRef.current, text });
      } else {
        const fallback = keywordScan(text);
        setState({
          isScanning: false,
          purityScore: fallback.purityScore,
          isClean: fallback.isClean,
          isQuestionable: fallback.isQuestionable,
          isToxic: fallback.isToxic,
          isBlocked: fallback.isBlocked,
          violations: fallback.violations || [],
          canProceed: !fallback.isBlocked
        });
      }
    }, SCAN_DEBOUNCE_MS);
  }, []);

  const indicatorProps = useMemo(() => {
    if (state.isScanning) {
      return {
        severity: 'scanning',
        message: 'Scanning...',
        borderColor: 'rgba(139, 92, 246, 0.5)'
      };
    }

    if (state.isBlocked || state.isToxic) {
      return {
        severity: 'blocked',
        message: 'Content blocked - violates guidelines',
        borderColor: 'rgba(239, 68, 68, 0.7)'
      };
    }

    if (state.isQuestionable) {
      return {
        severity: 'warning',
        message: 'May be flagged for review',
        borderColor: 'rgba(245, 158, 11, 0.6)'
      };
    }

    if (state.isClean && state.purityScore < 1) {
      return {
        severity: 'clean',
        message: `Purity Verified: ${Math.round(state.purityScore * 100)}%`,
        borderColor: 'rgba(16, 185, 129, 0.4)'
      };
    }

    return null;
  }, [state]);

  return {
    ...state,
    scanText,
    indicatorProps
  };
};

export default useToxicityScanner;
