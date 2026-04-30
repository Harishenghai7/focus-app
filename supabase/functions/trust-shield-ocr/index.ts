/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔱 TRUST SHIELD OCR — Isolated Edge Function (Phase 2 Step 3)
 * Volatile memory processing • Zero raw image persistence • Privacy-first
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This Edge Function runs OCR in an isolated, volatile environment:
 * - Images are processed ENTIRELY in memory
 * - NO raw images are stored or logged
 * - ONLY extracted text/structured data is returned
 * - All memory is released after processing (volatile guarantee)
 *
 * Pipeline:
 *   1. Receive base64 image (in-memory only)
 *   2. Tesseract OCR tier-specific parsing
 *   3. Extract: Name, DOB, ID Number, ID Type, Institution
 *   4. Return structured JSON (no image data)
 *   5. Memory immediately freed
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OCR Patterns for different ID types
const OCR_PATTERNS = {
  // Government IDs (India)
  aadhaar: /\b(\d{4}\s?\d{4}\s?\d{4})\b/,
  aadhaar_strict: /\b(\d{12})\b/,
  pan: /\b([A-Z]{5}[0-9]{4}[A-Z])\b/,
  passport: /\b([A-Z][0-9]{7})\b/,
  voter: /\b([A-Z]{3}[0-9]{7})\b/,
  dl: /\b([A-Z]{2}[0-9]{13})\b/,

  // Student IDs
  student_id: /\b(?:Student\s*ID|ID\s*No|Roll\s*No|Reg\.?\s*No)[:\s]+([A-Z0-9\-]{5,20})\b/i,
  admission_no: /\b(?:Admission|Adm)[:\s]+([A-Z0-9\-]{5,20})\b/i,

  // Common fields
  dob: /\b(\d{2}[\/\-]\d{2}[\/\-]\d{4}|\d{4}[\/\-]\d{2}[\/\-]\d{2})\b/,
  year: /(?:Year of Birth|DOB|YOB)[\s:]*(\d{4})/i,
  name: /(?:Name|नाम)[:\s]+([A-Z][A-Za-z\s\.]{2,40})/i,
  institution: /(?:School|College|Institute|University)[:\s]+([A-Za-z\s]{4,60})/i,
};

/**
 * Extract ID information from OCR text using pattern matching
 * VOLATILE: This function processes text only, no image storage
 */
const extractIDData = (text: string, tier: string) => {
  const result = {
    name: null as string | null,
    dob: null as string | null,
    idNumber: null as string | null,
    idType: null as string | null,
    institution: null as string | null,
    idMaskedLast4: null as string | null,
    confidence: 0,
    rawText: text.substring(0, 500), // Truncated for privacy
  };

  if (!text || text.length < 10) {
    return { ...result, confidence: 0 };
  }

  const upperText = text.toUpperCase();

  // Extract Name
  const nameMatch = text.match(OCR_PATTERNS.name);
  if (nameMatch) {
    result.name = nameMatch[1].trim();
    result.confidence += 25;
  }

  // Extract DOB
  const dobMatch = text.match(OCR_PATTERNS.dob);
  const yearMatch = text.match(OCR_PATTERNS.year);
  if (dobMatch) {
    result.dob = dobMatch[1];
    result.confidence += 25;
  } else if (yearMatch) {
    result.dob = yearMatch[1];
    result.confidence += 15;
  }

  // Government ID extraction (18+ tier)
  if (tier === '18+') {
    // Aadhaar (12 digits)
    const aadhaarMatch = text.match(OCR_PATTERNS.aadhaar) ||
                        text.match(OCR_PATTERNS.aadhaar_strict);
    if (aadhaarMatch) {
      const cleaned = aadhaarMatch[1].replace(/\s/g, '');
      if (cleaned.length === 12) {
        result.idNumber = cleaned;
        result.idType = 'aadhaar';
        result.confidence += 50;
      }
    }

    // PAN
    if (!result.idNumber) {
      const panMatch = upperText.match(OCR_PATTERNS.pan);
      if (panMatch) {
        result.idNumber = panMatch[1];
        result.idType = 'pan';
        result.confidence += 50;
      }
    }

    // Passport
    if (!result.idNumber) {
      const passportMatch = upperText.match(OCR_PATTERNS.passport);
      if (passportMatch) {
        result.idNumber = passportMatch[1];
        result.idType = 'passport';
        result.confidence += 50;
      }
    }

    // Check for masked Aadhaar
    if (!result.idNumber) {
      const maskedMatch = text.match(/\b[Xx]{4,}\s*(\d{4})\b/);
      if (maskedMatch) {
        result.idMaskedLast4 = maskedMatch[1];
        result.idType = 'aadhaar_masked';
        result.confidence += 20;
      }
    }
  }

  // Student ID extraction (13-17 tier)
  if (tier === '13-17') {
    const studentMatch = text.match(OCR_PATTERNS.student_id);
    const admissionMatch = text.match(OCR_PATTERNS.admission_no);

    if (studentMatch) {
      result.idNumber = studentMatch[1].trim().toUpperCase();
      result.idType = 'student';
      result.confidence += 50;
    } else if (admissionMatch) {
      result.idNumber = admissionMatch[1].trim().toUpperCase();
      result.idType = 'student';
      result.confidence += 45;
    }

    // Institution name
    const instMatch = text.match(OCR_PATTERNS.institution);
    if (instMatch) {
      result.institution = instMatch[1].trim();
      result.confidence += 15;
    }
  }

  return result;
};

/**
 * VOLATILE OCR PROCESSOR
 * Processes image in memory only - no persistence whatsoever
 */
const processOCRVolatile = async (imageBase64: string, tier: string) => {
  // Decode base64 to binary (in-memory only)
  const binaryString = atob(imageBase64.split(',')[1] || imageBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Load Tesseract dynamically (volatile WASM execution)
  const { createWorker } = await import('https://esm.sh/tesseract.js@4/dist/tesseract.esm.min.js');

  const worker = await createWorker('eng', 1, {
    logger: () => {}, // Silent logging for privacy
  });

  // Configure for ID type
  const isAadhaar = tier === '18+';
  await worker.setParameters({
    tessedit_char_whitelist: isAadhaar
      ? '0123456789 '
      : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 /-.',
    preserve_interword_spaces: '1',
    tessedit_pageseg_mode: '6',
  });

  // Create temporary blob URL (revoked immediately after use)
  const blob = new Blob([bytes], { type: 'image/jpeg' });
  const tempUrl = URL.createObjectURL(blob);

  let result;
  try {
    result = await worker.recognize(tempUrl);
  } finally {
    // IMMEDIATE CLEANUP: Revoke URL and terminate worker
    URL.revokeObjectURL(tempUrl);
    await worker.terminate();
  }

  // Extract structured data
  const extracted = extractIDData(result.data.text, tier);

  // Calculate overall confidence
  const ocrConfidence = result.data.confidence || 0;
  extracted.confidence = Math.min(100, (extracted.confidence + ocrConfidence) / 2);

  return {
    ok: extracted.confidence > 40,
    ...extracted,
    ocrConfidence,
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
      );
    }

    const { imageBase64, tier, userId } = await req.json();

    if (!imageBase64 || !tier) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters: imageBase64, tier' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Initialize Supabase client (for audit logging only)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = supabaseUrl && supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey)
      : null;

    console.log(`[TrustShieldOCR] 🔒 VOLATILE processing started for tier: ${tier}`);
    console.log(`[TrustShieldOCR] 🛡️  Privacy: Raw image will NOT be stored`);

    // VOLATILE OCR Processing (in-memory only)
    const startTime = Date.now();
    const ocrResult = await processOCRVolatile(imageBase64, tier);
    const processingTime = Date.now() - startTime;

    console.log(`[TrustShieldOCR] ✅ Processing complete in ${processingTime}ms`);
    console.log(`[TrustShieldOCR] 🧹 Memory released - no image data retained`);

    // Log audit trail (metadata only, NO image data)
    if (supabase && userId) {
      await supabase.from('verification_audit_trail').insert({
        user_id: userId,
        event_type: 'ocr_volatile_complete',
        status: ocrResult.ok ? 'success' : 'low_confidence',
        event_data: {
          tier,
          confidence: ocrResult.confidence,
          processing_time_ms: processingTime,
          id_type_detected: ocrResult.idType,
          // NO image data, NO extracted ID numbers
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        result: ocrResult,
        meta: {
          processing_time_ms: processingTime,
          privacy_mode: 'volatile',
          image_retained: false,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('[TrustShieldOCR] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'OCR processing failed',
        privacy_mode: 'volatile',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
