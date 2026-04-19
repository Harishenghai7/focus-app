/**
 * useOCRScanner.js
 * ================
 * Real ID text extraction using Tesseract.js
 * Supports: Aadhaar Card, Student ID, Passport
 * Extracts: Name, Date of Birth, ID Number
 *
 * H2 Innovative — Focus Trust Shield
 */

import { useState, useCallback, useRef } from 'react';
import { createWorker } from 'tesseract.js';

// ── Text Parsers ──────────────────────────────────────────────────────────────

// Aadhaar: 12-digit number in groups of 4
const AADHAAR_REGEX = /\b\d{4}\s?\d{4}\s?\d{4}\b/;

const DOB_REGEX = /\b(\d{4}[\/\\-.](?:0?[1-9]|1[0-2])[\/\\-.](?:0?[1-9]|[12]\d|3[01])|(?:0?[1-9]|[12]\d|3[01])[\/\\-.](?:0?[1-9]|1[0-2])[\/\\-.]\d{4})\b/;

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
   * @param {File|string} imageSource — File object or image URL
   * @returns {Object} Parsed ID data
   */
  const scanID = useCallback(async (imageSource) => {
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

      if (avgConf < 30) {
        throw new Error('Image quality too low. Please upload a clearer photo of your ID in good lighting.');
      }

      setStatusMessage('Parsing identity data...');
      const parsed = parseIDText(text);

      if (parsed.confidence === 0) {
        throw new Error('Could not extract identity data. Please ensure the text on your ID is clearly visible and not blurred.');
      }

      setResult(parsed);
      setStatusMessage('ID scanned successfully.');
      return { ok: true, ...parsed };
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
