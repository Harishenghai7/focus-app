/**
 * useOCRScanner.js
 * ================
 * Real ID text extraction using Tesseract.js
 * Supports: Aadhaar Card, PAN Card, Passport (Govt IDs — 18+ Tier)
 *           School ID, College ID (Student IDs — Teen Tier)
 * Extracts: Name, Date of Birth, ID Number, Identity Hash (SHA-256)
 *
 * H2 Innovative — Focus Trust Shield
 * SECURITY: v3 — Dual-Tier Classification + SHA-256 Identity Hash
 */

import { useState, useCallback, useRef } from 'react';
import { createWorker } from 'tesseract.js';

// ── ADULT & TEEN Document Markers (Weight-Based System) ───────────────
const ADULT_KEYWORDS = ['GOVT', 'INDIA', 'INCOME TAX', 'ELECTION', 'AADHAAR', 'PAN', 'VOTER', 'DRIVING'];
const TEEN_KEYWORDS = ['SCHOOL', 'COLLEGE', 'INSTITUTE', 'STUDENT', 'ID CARD', 'ACADEMIC', 'UNIVERSITY'];

// ── SHA-256 Identity Hash ─────────────────────────────────────────────────────
/**
 * Compute SHA-256 hash of a cleaned ID number using the Web Crypto API.
 * Used for deduplication — one real-world ID can only link to ONE Focus account.
 * @param {string} idNumber
 * @returns {Promise<string|null>} Hex-encoded SHA-256 hash, or null on failure
 */
export const computeIdentityHash = async (idNumber) => {
  if (!idNumber) return null;
  try {
    const normalized = idNumber.replace(/\s/g, '').toUpperCase();
    const encoder = new TextEncoder();
    const data = encoder.encode(normalized);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return null;
  }
};

// ── Document Tier Classifier ──────────────────────────────────────────────────
export const classifyDocumentTier = (text) => {
  if (!text) return 'unknown';
  const normalised = text.toUpperCase();

  let adultWeight = 0;
  let teenWeight = 0;

  ADULT_KEYWORDS.forEach(kw => {
    if (normalised.includes(kw)) adultWeight++;
  });

  TEEN_KEYWORDS.forEach(kw => {
    if (normalised.includes(kw)) teenWeight++;
  });

  if (adultWeight > teenWeight) return 'adult';
  if (teenWeight > adultWeight) return 'teen';
  return 'unknown';
};

/**
 * Validate document against the expected tier.
 * @param {string} text              — Raw OCR text
 * @param {'18+'|'teen'|null} expectedTier — Tier selected by the user
 * @returns {{ ok: boolean, reason?: string, detectedTier: string }}
 */
const validateDocumentForTier = (text, expectedTier, dobValid) => {
  if (!text) {
    return { ok: false, reason: 'ERR_INVALID_DOCUMENT: No text could be extracted from the image.', detectedTier: 'unknown' };
  }

  const detected = classifyDocumentTier(text);

  if (!expectedTier) {
    if (detected === 'unknown' && !dobValid) {
      return { ok: false, reason: 'ERR_INVALID_DOCUMENT: Document not recognised. Please ensure it is clear.', detectedTier: detected };
    }
    return { ok: true, detectedTier: detected };
  }

  const required = (expectedTier === '18+' || expectedTier === 'adult') ? 'adult' : 'teen';

  if (detected !== required) {
    if (detected === 'unknown' && dobValid) {
       console.log('[useOCRScanner] SPECIAL BYPASS: Document unknown, prioritizing DOB.');
       return { ok: true, detectedTier: detected };
    }
    
    if (required === 'adult' && detected === 'teen') {
      return { ok: false, reason: 'ERR_WRONG_DOCUMENT_TYPE: A Student ID is not accepted for the 18+ tier. Please upload a Government ID.', detectedTier: detected };
    }
    if (required === 'teen' && detected === 'adult') {
      return { ok: false, reason: 'ERR_WRONG_DOCUMENT_TYPE: A Government ID is not accepted for the Teen tier. Please upload a Student ID.', detectedTier: detected };
    }
    return { ok: false, reason: 'ERR_INVALID_DOCUMENT: Could not verify if this is a Government or Student ID. Please ensure it is well lit.', detectedTier: detected };
  }

  return { ok: true, detectedTier: detected };
};

// ── Text Parsers ──────────────────────────────────────────────────────────────

// Aadhaar: 12-digit number in groups of 4
const AADHAAR_REGEX = /\b\d{4}\s?\d{4}\s?\d{4}\b/;

const DOB_REGEX = /\b(\d{4}[-/.\\/](?:0?[1-9]|1[0-2])[-/.\\/](?:0?[1-9]|[12]\d|3[01])|(?:0?[1-9]|[12]\d|3[01])[-/.\\/](?:0?[1-9]|1[0-2])[-/.\\/]\d{4})\b/;

// Year of birth (fallback)
const YEAR_REGEX = /(?:Year of Birth|DOB|YOB)\s*[:-]?\s*(\d{4})/i;

// Name patterns — look for lines after "Name:" or "नाम" (Hindi)
const NAME_PATTERNS = [
  /(?:Name|नाम)\s*[:-]?\s*([A-Z][A-Za-z\s.]{2,40})/i,
  /^([A-Z][A-Za-z.]+(?:\s+[A-Z][A-Za-z.]+){1,2})$/, // 2-3 words, Title case
  /^([A-Z][A-Z\s.]{4,35})$/ // ALL CAPS line (common in govt IDs)
];

/**
 * Parse extracted OCR text into structured data
 */
const parseIDText = (text) => {
  const result = {
    raw: text,
    name: null,
    dob: null,
    idNumber: null,
    idType: 'unknown',
    confidence: 0,
  };

  if (!text) return result;

  // Detect Aadhaar
  const aadhaarMatch = text.match(AADHAAR_REGEX);
  if (aadhaarMatch) {
    result.idNumber = aadhaarMatch[0].replace(/\s/g, '');
    result.idType = 'aadhaar';
  }

  // Extract DOB
  const dobMatch = text.match(DOB_REGEX);
  if (dobMatch) {
    const rawDate = dobMatch[1] || dobMatch[0];
    if (/^\d{4}/.test(rawDate)) {
        const parts = rawDate.split(/[-/.]/);
        result.dob = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    } else {
        const parts = rawDate.split(/[-/.]/);
        result.dob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  } else {
    // Try year of birth fallback
    const yearMatch = text.match(YEAR_REGEX);
    if (yearMatch) {
      result.dob = `${yearMatch[1]}-01-01`; // approximate
    }
  }

  // Extract Name line by line to support filtering
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let matchedName = null;

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('.png') || lower.includes('.jpg') || lower.includes('jpeg') || lower.includes('www.') || lower.includes('screenshot')) {
      continue;
    }
    
    for (const pattern of NAME_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const candidate = match[1].trim();
        // Reject if it looks like a label or too short
        if (candidate.length > 3 && !/^\d+$/.test(candidate) && !/(?:dob|year of birth|father)/i.test(candidate)) {
          matchedName = candidate;
          break;
        }
      }
    }
    if (matchedName) break;
  }

  if (matchedName) {
    result.name = toTitleCase(matchedName);
  }

  // Confidence: how many fields did we extract?
  const fields = [result.name, result.dob, result.idNumber].filter(Boolean).length;
  result.confidence = parseFloat((fields / 3).toFixed(2));

  return result;
};

const toTitleCase = (str) =>
  str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useOCRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const workerRef = useRef(null);

  /**
   * Scan an image file for ID text
   * @param {File|string} imageSource   — File object or image URL
   * @param {'18+'|'teen'|null} expectedTier — User's selected age tier for validation
   * @returns {Object} Parsed ID data including identity_hash
   */
  const scanID = useCallback(async (imageSource, expectedTier = null) => {
    setScanning(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      setStatusMessage('Initializing OCR engine...');

      // Create fresh worker
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      workerRef.current = worker;

      setStatusMessage('Reading ID document...');

      // Set parameters for better ID card recognition
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 /-.',
        preserve_interword_spaces: '1',
      });

      const { data } = await worker.recognize(imageSource);
      await worker.terminate();
      workerRef.current = null;

      const text = data.text;
      const avgConf = data.confidence;

      if (avgConf < 20 && (!text || text.trim().length < 10)) {
        throw new Error('Image quality too low or no text detected. Please upload a clearer photo of your ID.');
      }

      setStatusMessage('Parsing identity data...');
      const parsed = parseIDText(text);

      if (parsed.confidence === 0 && avgConf < 40) {
        throw new Error('Could not extract identity data. Please ensure the text on your ID is clearly visible and not blurred.');
      }

      // ── SECURITY: Dual-Tier Document Classification ───────────────────
      setStatusMessage('Validating document type...');
      let dobValid = false;
      if (parsed.dob) {
          const parts = parsed.dob.split(/[\/-]/);
          if (parts.length === 3) {
              const year = parts.find(p => p.length === 4);
              if (year) dobValid = true;
          }
      }
      
      const docCheck = validateDocumentForTier(text, expectedTier, dobValid);
      if (!docCheck.ok) {
        throw new Error(docCheck.reason);
      }

      if (parsed.confidence === 0 && avgConf < 40) {
        throw new Error('Could not extract identity data. Please ensure the text on your ID is clearly visible and not blurred.');
      }

      // ── SECURITY: SHA-256 Identity Hash ──────────────────────────────
      setStatusMessage('Computing identity hash...');
      const identityHash = await computeIdentityHash(parsed.idNumber);

      const finalResult = {
        ...parsed,
        identityHash,
        detectedTier: docCheck.detectedTier,
      };

      setResult(finalResult);
      setStatusMessage('ID scanned successfully.');
      return { ok: true, ...finalResult };
    } catch (err) {
      const message = err.message || 'OCR scan failed. Please try again.';
      setError(message);
      setStatusMessage(message);

      // Terminate worker if still running
      if (workerRef.current) {
        try { await workerRef.current.terminate(); } catch (_) {}
        workerRef.current = null;
      }

      return { ok: false, reason: message };
    } finally {
      setScanning(false);
      setProgress(0);
    }
  }, []);

  /**
   * Verify name from ID matches profile name
   * @param {string} idName     - Name extracted from ID
   * @param {string} profileName - Name from user's Focus profile
   * @returns {boolean}
   */
  const verifyNameMatch = useCallback((idName, profileName) => {
    if (!idName || !profileName) return false;
    const normalize = (s) =>
      s.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    const id = normalize(idName);
    const profile = normalize(profileName);

    // Full match
    if (id === profile) return true;

    // First name match (at least first word must match)
    const idFirst = id.split(' ')[0];
    const profileFirst = profile.split(' ')[0];
    return idFirst === profileFirst && idFirst.length > 2;
  }, []);

  /**
   * Calculate age from DOB string (YYYY-MM-DD or DD/MM/YYYY)
   */
  const calculateAgeFromDOB = useCallback((dob) => {
    if (!dob) return null;
    try {
      let year, month, day;
      if (dob.includes('-') && /^\d{4}-/.test(dob)) {
          [year, month, day] = dob.split('-').map(Number);
      } else {
          [day, month, year] = dob.split('/').map(Number);
      }
      const birth = new Date(year, month - 1, day);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  }, []);

  /**
   * Determine ID tier based on age
   * 13-17 → Student ID required
   * 18+   → Govt ID required
   */
  const getRequiredIDTier = useCallback((age) => {
    if (!age) return 'govt';
    if (age >= 13 && age <= 17) return 'student';
    if (age >= 18) return 'govt';
    return null; // Under 13 — not allowed
  }, []);

  return {
    scanning,
    progress,
    statusMessage,
    result,
    error,
    scanID,
    verifyNameMatch,
    calculateAgeFromDOB,
    getRequiredIDTier,
  };
};

export default useOCRScanner;
