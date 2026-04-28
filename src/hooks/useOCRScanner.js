/**
 * useOCRScanner.js  — Trust Shield Sovereign OCR Engine v4.0
 * ============================================================
 * On-device Tesseract.js OCR with OpenCV pre-processing pipeline.
 *
 * Tier-Split Architecture:
 *   18+ (Aadhaar) → digit whitelist → strict 12-digit pattern
 *   13-17 (Student ID) → alphanumeric whitelist → institution + roll-no
 *
 * Security Layers:
 *   1. OpenCV purification (grayscale → gaussian blur → adaptive threshold)
 *   2. Tesseract.js with tier-specific character whitelists
 *   3. DOB + Name cross-check against Step 2 manual inputs → ERR_DATA_MISMATCH
 *   4. SHA-256 sovereign identity hash (REACT_APP_TRUST_SHIELD_SALT)
 *
 * H2 Innovative — Focus Trust Shield
 */

import { useState, useCallback, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { purifyIDImage, fileToImageElement } from '../utils/imagePurityEngine';

// ── ADULT & TEEN Document Markers (Weight-Based System) ──────────────────────
const ADULT_KEYWORDS = ['GOVT', 'INDIA', 'INCOME TAX', 'ELECTION', 'AADHAAR', 'PAN', 'VOTER', 'DRIVING'];
const TEEN_KEYWORDS  = ['SCHOOL', 'COLLEGE', 'INSTITUTE', 'STUDENT', 'ID CARD', 'ACADEMIC', 'UNIVERSITY'];

// ── SHA-256 Identity Hash ─────────────────────────────────────────────────────
/**
 * Compute SHA-256 hash of a cleaned ID number using the Web Crypto API,
 * SALTED with the per-deployment secret. Spec: Hash = SHA256(ID_Number + SALT).
 */
export const computeIdentityHash = async (idNumber) => {
  if (!idNumber) return null;
  try {
    const normalized = idNumber.replace(/\s/g, '').toUpperCase();
    const salt =
      (typeof process !== 'undefined' && process.env && (
        process.env.REACT_APP_TRUST_SHIELD_SALT ||
        process.env.VITE_TRUST_SHIELD_SALT
      )) || '';
    if (!salt && typeof console !== 'undefined') {
      console.warn('[TrustShield] REACT_APP_TRUST_SHIELD_SALT is not set — hashes are UNSALTED.');
    }
    const payload = `${normalized}${salt}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
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
  ADULT_KEYWORDS.forEach(kw => { if (normalised.includes(kw)) adultWeight++; });
  TEEN_KEYWORDS.forEach(kw  => { if (normalised.includes(kw)) teenWeight++;  });
  if (adultWeight > teenWeight) return 'adult';
  if (teenWeight > adultWeight) return 'teen';
  return 'unknown';
};

const validateDocumentForTier = (text, expectedTier, dobValid) => {
  if (!text) {
    return { ok: false, reason: 'ERR_INVALID_DOCUMENT: No text could be extracted from the image.', detectedTier: 'unknown' };
  }
  const detected = classifyDocumentTier(text);
  if (!expectedTier) {
    if (detected === 'unknown' && !dobValid)
      return { ok: false, reason: 'ERR_INVALID_DOCUMENT: Document not recognised. Please ensure it is clear.', detectedTier: detected };
    return { ok: true, detectedTier: detected };
  }
  if (expectedTier === 'teen') {
    if (detected === 'adult')
      return { ok: false, reason: 'ERR_WRONG_DOCUMENT_TYPE: A Government ID is not accepted for the Teen tier. Please upload a Student ID.', detectedTier: detected };
  } else if (expectedTier === '18+' || expectedTier === 'adult') {
    if (detected === 'teen')
      return { ok: false, reason: 'ERR_WRONG_DOCUMENT_TYPE: A Student ID is not accepted for the 18+ tier. Please upload a Government ID.', detectedTier: detected };
  }
  if (detected === 'unknown' && !dobValid)
    return { ok: false, reason: 'ERR_INVALID_DOCUMENT: Could not verify document type. Please ensure it is well lit.', detectedTier: detected };
  return { ok: true, detectedTier: detected };
};

// ── ID Patterns ───────────────────────────────────────────────────────────────
const AADHAAR_PATTERNS = [
  /\b\d{4}\s+\d{4}\s+\d{4}\b/,
  /\b\d{12}\b/,
  /\b\d{4}\s+\d{8}\b/,
  /\b\d{8}\s+\d{4}\b/,
  /\b\d{4}-\d{4}-\d{4}\b/,
  /\b[0-9OIlSBJ]{4}\s*[0-9OIlSBJ]{4}\s*[0-9OIlSBJ]{4}\b/i,
];
const PAN_PATTERNS = [
  /\b[A-Z]{5}[0-9]{4}[A-Z]\b/,
  /\b[A-Z]{5}\s*[0-9]{4}\s*[A-Z]\b/,
];
const ID_PATTERNS = {
  aadhaar:        AADHAAR_PATTERNS[0],
  aadhaar_nospace:/\b\d{12}\b/,
  pan:            PAN_PATTERNS[0],
  passport:       /\b[A-Z][0-9]{7}\b/,
  voter:          /\b[A-Z]{3}[0-9]{7}\b/,
  dl:             /\b[A-Z]{2}[0-9]{13}\b/,
};
const DOB_REGEX = /\b(\d{4}[-/.\\/](?:0?[1-9]|1[0-2])[-/.\\/](?:0?[1-9]|[12]\d|3[01])|(?:0?[1-9]|[12]\d|3[01])[-/.\\/](?:0?[1-9]|1[0-2])[-/.\\/]\d{4})\b/;
const YEAR_REGEX = /(?:Year of Birth|DOB|YOB)\s*[:-]?\s*(\d{4})/i;
const NAME_PATTERNS = [
  /(?:Name|नाम)\s*[:-]?\s*([A-Z][A-Za-z\s.]{2,40})/i,
  /^([A-Z][A-Za-z.]+(?:\s+[A-Z][A-Za-z.]+){1,2})$/,
  /^([A-Z][A-Z\s.]{4,35})$/,
];
// Student ID / Roll No patterns
const STUDENT_ID_PATTERNS = [
  /(?:ID|Roll\s*No|Reg(?:istration)?\s*No?)[:\s]*([A-Z0-9\-]{4,20})/i,
  /\b([A-Z]{2,5}\d{4,10})\b/,
  /\b(\d{4,12})\b/,
];
const INSTITUTION_PATTERNS = [
  /(?:School|College|Institute|University|Academy|Vidyalaya|Mahavidyalaya)[:\s]*([A-Za-z\s]{4,60})/i,
  /^([A-Z][A-Za-z\s.]{8,60}(?:School|College|Institute|University|Academy))$/im,
];

const toTitleCase = (str) => str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// ── Full ID Text Parser ───────────────────────────────────────────────────────
const parseIDText = (text, tier = null) => {
  const result = {
    raw: text,
    name: null,
    dob: null,
    idNumber: null,
    idType: tier === '13-17' ? 'student' : 'unknown',
    institution: null,
    idMaskedLast4: null,
    confidence: 0,
  };

  if (!text) return result;

  // Clean common camera OCR errors
  const cleanedText = text
    .replace(/[oO]/g, '0')
    .replace(/[lI]/g, '1')
    .replace(/[S]/g, '5')
    .replace(/[B]/g, '8');

  // ── Aadhaar / Government ID (18+) ───────────────────────────────────────
  if (!tier || tier === '18+') {
    for (const pattern of AADHAAR_PATTERNS) {
      const match = text.match(pattern) || cleanedText.match(pattern);
      if (match) {
        const rawId = match[0].replace(/[^0-9]/g, '');
        if (rawId.length === 12) {
          result.idNumber = rawId;
          result.idType = 'aadhaar';
          result.idMaskedLast4 = rawId.slice(-4);
          break;
        }
      }
    }
    // PAN
    if (!result.idNumber) {
      for (const pattern of PAN_PATTERNS) {
        const match = text.match(pattern);
        if (match) {
          result.idNumber = match[0].toUpperCase().replace(/\s/g, '');
          result.idType = 'pan';
          break;
        }
      }
    }
    // Other govt IDs
    if (!result.idNumber) {
      const patterns = [
        { pattern: ID_PATTERNS.passport, type: 'passport' },
        { pattern: ID_PATTERNS.voter,    type: 'voter'    },
        { pattern: ID_PATTERNS.dl,       type: 'dl'       },
      ];
      for (const { pattern, type } of patterns) {
        const match = text.match(pattern);
        if (match) { result.idNumber = match[0].toUpperCase(); result.idType = type; break; }
      }
    }
  }

  // ── Student ID (13-17) ───────────────────────────────────────────────────
  if (!result.idNumber && (!tier || tier === '13-17')) {
    for (const pattern of STUDENT_ID_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const candidate = (match[1] || match[0]).trim();
        if (candidate.length >= 4) {
          result.idNumber = candidate.toUpperCase();
          result.idType = 'student';
          break;
        }
      }
    }
    // Institution name
    for (const pattern of INSTITUTION_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        result.institution = (match[1] || match[0]).trim();
        break;
      }
    }
  }

  // ── DOB ─────────────────────────────────────────────────────────────────
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
    const yearMatch = text.match(YEAR_REGEX);
    if (yearMatch) result.dob = `${yearMatch[1]}-01-01`;
  }

  // ── Name ─────────────────────────────────────────────────────────────────
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let matchedName = null;
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('.png') || lower.includes('.jpg') || lower.includes('www.') || lower.includes('screenshot')) continue;
    for (const pattern of NAME_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const candidate = match[1].trim();
        if (candidate.length > 3 && !/^\d+$/.test(candidate) && !/(?:dob|year of birth|father)/i.test(candidate)) {
          matchedName = candidate;
          break;
        }
      }
    }
    if (matchedName) break;
  }
  if (matchedName) result.name = toTitleCase(matchedName);

  const fields = [result.name, result.dob, result.idNumber].filter(Boolean).length;
  result.confidence = parseFloat((fields / 3).toFixed(2));

  return result;
};

// ── DOB/Name Cross-Check ─────────────────────────────────────────────────────
/**
 * Strict cross-check: OCR-extracted vs manually-entered DOB and Name.
 * Returns an error string if mismatch, null if OK.
 *
 * Per spec: "If mismatch > 0%, trigger ERR_DATA_MISMATCH"
 */
export const crossCheckOCRData = (ocrResult, { manualName, manualDOB } = {}) => {
  const errors = [];

  // Name check
  if (manualName && ocrResult.name) {
    const normalize = (s) => s.toLowerCase().replace(/[^a-z]/g, '').trim();
    const ocrN   = normalize(ocrResult.name);
    const manN   = normalize(manualName);
    if (ocrN !== manN) {
      // Check at least first word matches
      const ocrFirst = ocrN.split(' ')[0];
      const manFirst = manN.split(' ')[0];
      if (ocrFirst !== manFirst || ocrFirst.length <= 2) {
        errors.push(`ERR_DATA_MISMATCH: Name on ID ("${ocrResult.name}") does not match entered name ("${manualName}"). Please upload the correct ID.`);
      }
    }
  }

  // DOB check
  if (manualDOB && ocrResult.dob) {
    const normDate = (d) => d.replace(/[^0-9]/g, '');
    if (normDate(ocrResult.dob) !== normDate(manualDOB)) {
      errors.push(`ERR_DATA_MISMATCH: Date of birth on ID ("${ocrResult.dob}") does not match entered date ("${manualDOB}"). Please upload the correct ID.`);
    }
  }

  return errors.length > 0 ? errors.join('\n') : null;
};

// ═════════════════════════════════════════════════════════════════════════════
// OCR HOOK — Sovereign Engine v4.0
// ═════════════════════════════════════════════════════════════════════════════

export const useOCRScanner = () => {
  const [scanning, setScanning]         = useState(false);
  const [progress, setProgress]         = useState(0);
  const [phase, setPhase]               = useState('');   // pipeline phase label
  const [statusMessage, setStatusMessage] = useState('');
  const [result, setResult]             = useState(null);
  const [error, setError]               = useState(null);
  const workerRef                       = useRef(null);

  /**
   * Full sovereign scan pipeline:
   *   1. OpenCV image purification
   *   2. Tesseract tier-specific OCR
   *   3. DOB/Name cross-check
   *   4. SHA-256 identity hash
   *
   * @param {File|HTMLImageElement|string} imageSource
   * @param {object} opts
   * @param {'18+'|'13-17'|null} opts.tier       — age tier for whitelist + classifier
   * @param {string|null}  opts.manualName        — from Step 2 manual input
   * @param {string|null}  opts.manualDOB         — from Step 2 manual input
   * @param {Function|null} opts.onPipelineProgress — (0-100, phaseLabel) callback
   */
  const scanID = useCallback(async (imageSource, opts = {}) => {
    const { tier = null, manualName = null, manualDOB = null, onPipelineProgress } = opts;
    setScanning(true);
    setProgress(0);
    setPhase('');
    setError(null);
    setResult(null);

    const report = (pct, label) => {
      setProgress(pct);
      setPhase(label);
      setStatusMessage(label);
      onPipelineProgress?.(pct, label);
    };

    try {
      // ── Validate input ────────────────────────────────────────────────────
      if (!imageSource) throw new Error('ERR_NO_IMAGE: Please select or capture an ID photo first.');
      if (imageSource instanceof File) {
        if (imageSource.size === 0)      throw new Error('ERR_EMPTY_FILE: The selected file is empty.');
        if (imageSource.size > 10 * 1024 * 1024) throw new Error('ERR_FILE_TOO_LARGE: Image must be smaller than 10MB.');
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
        if (!validTypes.includes(imageSource.type) && !imageSource.name?.match(/\.(jpg|jpeg|png|webp|heic)$/i))
          throw new Error('ERR_INVALID_FORMAT: Please upload a JPG, PNG, or WebP image.');
      }

      // ── PHASE 1: Image Purification ───────────────────────────────────────
      report(5, '🔬 Purifying Image...');

      let tesseractSource = imageSource;
      let purifyMethod = 'original';
      try {
        const purified = await purifyIDImage(imageSource, (pct) => {
          report(5 + Math.round(pct * 0.30), '🔬 Purifying Image...');
        });
        tesseractSource = purified.canvas;
        purifyMethod    = purified.method;
        console.log(`[TrustShield] ✅ Image purified via ${purifyMethod}`);
      } catch (purifyErr) {
        console.warn('[TrustShield] Purification skipped:', purifyErr.message);
        // Continue with original — OCR is still attempted
      }

      // ── PHASE 2: Extracting Identity DNA ─────────────────────────────────
      report(38, '🧬 Extracting Identity DNA...');

      // Tier-specific Tesseract config
      const isAadhaar   = tier === '18+';
      const isStudent   = tier === '13-17';
      const charWhitelist = isAadhaar
        ? '0123456789 '                                                      // digits only for Aadhaar
        : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 /-.,'; // alphanumeric for Student

      let worker;
      try {
        worker = await createWorker('eng', 1, {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              report(38 + Math.round(m.progress * 30), '🧬 Extracting Identity DNA...');
            }
          },
        });
      } catch (workerErr) {
        throw new Error('ERR_OCR_INIT: Could not start text recognition. Please try again.');
      }
      workerRef.current = worker;

      // Aadhaar: use digit whitelist; Student: full alphanumeric
      await worker.setParameters({
        tessedit_char_whitelist: isAadhaar
          ? '0123456789 -/'
          : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 /-.',
        preserve_interword_spaces: '1',
        tessedit_pageseg_mode: '6', // Assume a single uniform block of text
      });

      // Run OCR on purified image
      const { data } = await worker.recognize(tesseractSource);
      await worker.terminate();
      workerRef.current = null;

      const text    = data.text;
      const avgConf = data.confidence;

      if (avgConf < 20 && (!text || text.trim().length < 10)) {
        throw new Error('ERR_LOW_QUALITY: Image quality too low. Please use better lighting and hold the camera steady.');
      }

      // ── PHASE 3: Checking Global Uniqueness (parse + validate) ────────────
      report(72, '🔒 Verifying Uniqueness...');

      const parsed = parseIDText(text, tier);

      if (parsed.confidence === 0 && avgConf < 40) {
        throw new Error('ERR_PARSE_FAIL: Could not extract identity data. Ensure text on ID is clearly visible and not blurred.');
      }

      // Document tier classification
      let dobValid = false;
      if (parsed.dob) {
        const parts = parsed.dob.split(/[\/-]/);
        if (parts.length === 3) {
          const year = parts.find(p => p.length === 4);
          if (year) dobValid = true;
        }
      }

      const docCheck = validateDocumentForTier(text, tier, dobValid);
      if (!docCheck.ok) throw new Error(docCheck.reason);

      // ── DOB / Name Cross-Check (ERR_DATA_MISMATCH) ────────────────────────
      if (manualName || manualDOB) {
        const mismatch = crossCheckOCRData(parsed, { manualName, manualDOB });
        if (mismatch) throw new Error(mismatch);
      }

      report(88, '🔒 Verifying Uniqueness...');

      // ── SHA-256 Sovereign Identity Hash ──────────────────────────────────
      const identityHash = await computeIdentityHash(parsed.idNumber);

      report(100, '✅ Identity DNA Extracted');

      const finalResult = {
        ...parsed,
        identityHash,
        detectedTier: docCheck.detectedTier,
        rawText: text,
        purifyMethod,
        ok: true,
      };

      setResult(finalResult);
      return { ok: true, ...finalResult };

    } catch (err) {
      let message = err.message || 'OCR scan failed. Please try again.';

      // Humanize common Tesseract errors
      if (message.includes('Code=0') || message.includes('empty') || message.includes('corrupted'))
        message = 'ERR_IMAGE_UNREADABLE: The image appears empty or corrupted.\n• Ensure good lighting\n• Hold camera steady\n• Fill the frame with your ID';
      else if (message.includes('network') || message.includes('fetch'))
        message = 'ERR_NETWORK: Connection issue while processing. Please check internet.';
      else if (message.includes('memory') || message.includes('heap'))
        message = 'ERR_MEMORY: Image too large to process. Try a smaller image.';
      else if (!message.startsWith('ERR_'))
        message = `ERR_OCR_FAILED: ${message}`;

      setError(message);
      setPhase('error');

      if (workerRef.current) {
        try { await workerRef.current.terminate(); } catch {}
        workerRef.current = null;
      }

      return { ok: false, reason: message };
    } finally {
      setScanning(false);
    }
  }, []);

  // ── Convenience: Aadhaar Scan ──────────────────────────────────────────────
  const scanAadhaarID = useCallback((imageSource, opts = {}) =>
    scanID(imageSource, { ...opts, tier: '18+' }), [scanID]);

  // ── Convenience: Student ID Scan ──────────────────────────────────────────
  const scanStudentID = useCallback((imageSource, opts = {}) =>
    scanID(imageSource, { ...opts, tier: '13-17' }), [scanID]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const verifyNameMatch = useCallback((idName, profileName) => {
    if (!idName || !profileName) return false;
    const normalize = (s) => s.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    const id      = normalize(idName);
    const profile = normalize(profileName);
    if (id === profile) return true;
    const idFirst      = id.split(' ')[0];
    const profileFirst = profile.split(' ')[0];
    return idFirst === profileFirst && idFirst.length > 2;
  }, []);

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
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
      return age;
    } catch { return null; }
  }, []);

  const getRequiredIDTier = useCallback((age) => {
    if (!age) return 'govt';
    if (age >= 13 && age <= 17) return 'student';
    if (age >= 18) return 'govt';
    return null;
  }, []);

  return {
    scanning,
    progress,
    phase,
    statusMessage,
    result,
    error,
    scanID,
    scanAadhaarID,
    scanStudentID,
    verifyNameMatch,
    calculateAgeFromDOB,
    getRequiredIDTier,
    crossCheckOCRData,
  };
};

export default useOCRScanner;
