/**
 * useScanner.js — Focus Trust Shield Native Camera Scanner
 * Live preview + auto-capture when confidence >90% and sharpness is optimal.
 * No upload buttons. Fully on-device. Zero data leaves the browser.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import Tesseract from 'tesseract.js';

// ── Sharpness via Laplacian variance on a Canvas ────────────────────────────
const measureSharpness = (canvas) => {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Convert to grayscale and apply Laplacian kernel [0,1,0,1,-4,1,0,1,0]
  let sum = 0, sumSq = 0, count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const top    = 0.299 * data[((y-1)*width+x)*4] + 0.587 * data[((y-1)*width+x)*4+1] + 0.114 * data[((y-1)*width+x)*4+2];
      const bottom = 0.299 * data[((y+1)*width+x)*4] + 0.587 * data[((y+1)*width+x)*4+1] + 0.114 * data[((y+1)*width+x)*4+2];
      const left   = 0.299 * data[(y*width+x-1)*4]   + 0.587 * data[(y*width+x-1)*4+1]   + 0.114 * data[(y*width+x-1)*4+2];
      const right  = 0.299 * data[(y*width+x+1)*4]   + 0.587 * data[(y*width+x+1)*4+1]   + 0.114 * data[(y*width+x+1)*4+2];
      const lap = gray * (-4) + top + bottom + left + right;
      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  }
  const mean = sum / count;
  const variance = (sumSq / count) - (mean * mean);
  return variance; // higher = sharper
};

// ── Low-Light Detection via mean luminance ──────────────────────────────────
const measureLuminance = (canvas) => {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return total / (data.length / 4);
};

// ── Image Preprocessing for Better OCR ─────────────────────────────────────
const preprocessImage = (canvas) => {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // 1. Convert to grayscale with better contrast
  for (let i = 0; i < data.length; i += 4) {
    // Grayscale conversion
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    
    // Increase contrast (s-curve approximation)
    const contrast = (gray - 128) * 1.5 + 128;
    const final = Math.max(0, Math.min(255, contrast));
    
    data[i] = final;     // R
    data[i + 1] = final; // G
    data[i + 2] = final; // B
  }
  
  // 2. Apply threshold for black/white effect (helps OCR)
  const threshold = 128;
  for (let i = 0; i < data.length; i += 4) {
    const val = data[i] > threshold ? 255 : 0;
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
};

// ── Main Hook ───────────────────────────────────────────────────────────────
const useScanner = () => {
  const [phase, setPhase] = useState('idle'); // idle|requesting|streaming|scanning|captured|error
  const [statusMessage, setStatusMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState(null);
  const [capturedFrame, setCapturedFrame] = useState(null); // base64 data URL
  const [lightWarning, setLightWarning] = useState(false);
  const [sharpnessOk, setSharpnessOk] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const loopRef   = useRef(null);
  const workerRef = useRef(null);
  const isScanningRef = useRef(false);

  // ── Init Tesseract Worker ─────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      workerRef.current = await Tesseract.createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });
    };
    init();
    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, []);

  // ── Start Camera ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setPhase('requesting');
    setStatusMessage('Requesting camera access...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPhase('streaming');
      setStatusMessage('Hold your ID card steady inside the frame...');
      startAnalysisLoop();
    } catch (err) {
      setPhase('error');
      setStatusMessage('Camera permission denied. Please allow camera access and refresh.');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Analysis Loop: sharpness + luminance every 500ms ─────────────────────
  const startAnalysisLoop = useCallback(() => {
    if (loopRef.current) clearInterval(loopRef.current);
    loopRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || isScanningRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const lum = measureLuminance(canvas);
      const sharpness = measureSharpness(canvas);

      const isLowLight = lum < 60;
      const isSharp = sharpness > 80;

      setLightWarning(isLowLight);
      setSharpnessOk(isSharp);

      if (isLowLight) {
        setStatusMessage('⚡ Low Light Detected — move closer to a light source');
        return;
      }

      if (isSharp) {
        setStatusMessage('✅ Optimal quality — scanning...');
        // Auto-trigger OCR once good frame is detected
        isScanningRef.current = true;
        clearInterval(loopRef.current);
        await runOCR(canvas);
      } else {
        setStatusMessage('📋 Align ID clearly — avoid glare and motion blur');
      }
    }, 600);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── OCR Run ───────────────────────────────────────────────────────────────
  const runOCR = useCallback(async (canvas) => {
    if (!workerRef.current) return;
    setPhase('scanning');
    setStatusMessage('🔍 Reading ID — please hold still...');

    // Capture the frame immediately
    const frameDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedFrame(frameDataUrl);

    try {
      // ═══════════════════════════════════════════════════════════════════════════
      // 🔱 IMAGE PREPROCESSING - Enhance contrast for better OCR
      // ═══════════════════════════════════════════════════════════════════════════
      const processedCanvas = preprocessImage(canvas);
      const processedDataUrl = processedCanvas.toDataURL('image/jpeg', 0.92);
      
      // Try OCR on both original and preprocessed images
      let data = await workerRef.current.recognize(frameDataUrl);
      let processedData = await workerRef.current.recognize(processedDataUrl);
      
      // Use the result with higher confidence
      if (processedData.confidence > data.confidence) {
        data = processedData;
      }
      
      const confidence = data.confidence;

      if (confidence < 60) {
        setStatusMessage('⚠️ Confidence too low — repositioning...');
        setPhase('streaming');
        isScanningRef.current = false;
        startAnalysisLoop();
        return;
      }

      const text = data.text;
      
      // ═══════════════════════════════════════════════════════════════════════════
      // 🔱 ULTRA AADHAAR-FOCUSED OCR - Camera Optimized with Error Correction
      // ═══════════════════════════════════════════════════════════════════════════
      
      // Clean up common OCR errors from camera images
      const cleanedText = text
        .replace(/[oO]/g, '0')   // O -> 0
        .replace(/[lI]/g, '1')   // l, I -> 1
        .replace(/[S]/g, '5')    // S -> 5
        .replace(/[B]/g, '8')    // B -> 8
        .replace(/[Z]/g, '2')    // Z -> 2
        .replace(/[G]/g, '6')    // G -> 6
        .replace(/[^0-9A-Za-z\s\-]/g, ''); // Remove special chars
      
      // DEBUG: Log raw OCR output
      console.log('[TrustShield OCR] Raw text:', text);
      console.log('[TrustShield OCR] Cleaned text:', cleanedText);
      
      // ── Field extraction ──────────────────────────────────────────────
      // Name extraction - handles DigiLocker format (M. Hariharun, First Last, etc.)
      const nameMatch = text.match(/(?:Name|NAME|नाम)[:\s]+([A-Z][A-Za-z\s\.]{2,40})/i) ||
                       text.match(/(?:^|\n)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})(?:\s*\n|\s+\d)/m) ||
                       text.match(/(?:^|\n)([A-Z]\.\s*[A-Za-z\s\.]{2,30})(?:\s*\n|\s+Male|\s+Female|\s+\d)/m) ||
                       text.match(/^([A-Z][A-Za-z\.]+(?:\s+[A-Z][A-Za-z\.]+){1,3})$/m);
      
      const dobPatterns = [
        /(?:DOB|Date of Birth|D\.O\.B|जन्म तिथि)[:\s]+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
        /\b(\d{2}[\/-]\d{2}[\/-]\d{4})\b/,
        /\b(\d{4}[\/-]\d{2}[\/-]\d{2})\b/,
        /\b(\d{2}[\/-]\d{2}[\/-]\d{2})\b/,  // YY format fallback
      ];
      let dob = null;
      for (const p of dobPatterns) { const m = text.match(p); if (m) { dob = m[1]; break; } }
      
      // ═══════════════════════════════════════════════════════════════════════════
      // 🔱 AADHAAR DETECTION - Handles FULL, MASKED, and CAMERA images
      // ═══════════════════════════════════════════════════════════════════════════
      
      // First, try to find FULL 12-digit Aadhaar
      const FULL_AADHAAR_PATTERNS = [
        /\b(\d{4}\s+\d{4}\s+\d{4})\b/,           // Standard: 1234 5678 9012
        /\b(\d{12})\b/,                          // No spaces: 123456789012
        /\b(\d{4}-\d{4}-\d{4})\b/,               // Dashed: 1234-5678-9012
        /\b[0-9OIlSBJ]{4}\s*[0-9OIlSBJ]{4}\s*[0-9OIlSBJ]{4}\b/i, // OCR error tolerant
      ];
      
      // Then, try MASKED Aadhaar (DigiLocker format: xxxxxxxx1234, ××××××××1234, XXXX XXXX 1234)
      const MASKED_AADHAAR_PATTERNS = [
        /[xX×✕✖*#\-]{4,12}(\d{4})\b/,                    // xxxxxxxx1234, ××××××××1234 (any masking char)
        /[xX×✕✖*#]{4}\s*[xX×✕✖*#]{4}\s*(\d{4})\b/,   // XXXX XXXX 1234 with spaces
        /[xX×]{8}[-\s]?(\d{4})\b/,                     // xxxxxxxx-1234 or xxxxxxxx 1234
        /.{8,16}(\d{4})\b/,                             // Fallback: anything ending in 4 digits
        /(?:Aadhaar|AADHAAR|आधार)[^\n]{0,100}[xX×*#\-]{4,}(\d{4})\b/i, // Aadhaar label + masked
        /(?:Aadhaar|AADHAAR)[^\n]{0,50}:\s*[^\n]*(\d{4})\b/i, // Aadhaar: xxxxxx1234
      ];
      
      let idNumber = null;
      let idType = 'unknown';
      let idSource = 'unknown'; // 'full_aadhaar', 'masked_aadhaar', 'other_id'
      
      // 1. Try FULL Aadhaar patterns first (best case)
      for (const pattern of FULL_AADHAAR_PATTERNS) {
        const match = text.match(pattern) || cleanedText.match(pattern);
        if (match) {
          const rawId = match[0].replace(/[^0-9]/g, '');
          if (rawId.length === 12) {
            idNumber = rawId;
            idType = 'aadhaar';
            idSource = 'full_aadhaar';
            break;
          }
        }
      }
      
      // 2. If no full Aadhaar, try MASKED patterns (DigiLocker documents)
      if (!idNumber) {
        for (const pattern of MASKED_AADHAAR_PATTERNS) {
          const match = text.match(pattern) || cleanedText.match(pattern);
          if (match) {
            const last4 = match[1]; // The captured last 4 digits
            console.log('[TrustShield OCR] Masked pattern matched:', match[0], 'Last4:', last4);
            if (last4 && last4.length === 4 && /^\d{4}$/.test(last4)) {
              idNumber = 'MASKED-' + last4; // Format: MASKED-1234
              idType = 'aadhaar_masked';
              idSource = 'masked_aadhaar';
              break;
            }
          }
        }
      }
      
      // 3. AGGRESSIVE FALLBACK: Look for line with masked chars ending in 4 digits
      if (!idNumber) {
        // Look for lines containing masking characters followed by 4 digits
        const aggressiveMatch = text.match(/[x×*#\-\s]{4,}(\d{4})\b/i) ||
                               text.match(/(?: masked|hidden|redacted|xxxx)[^\n]*(\d{4})\b/i) ||
                               text.match(/\D{8,}(\d{4})\s*$/m); // Any 8+ non-digits ending in 4 digits
        if (aggressiveMatch) {
          const last4 = aggressiveMatch[1];
          console.log('[TrustShield OCR] Aggressive pattern matched:', aggressiveMatch[0], 'Last4:', last4);
          if (last4 && /^\d{4}$/.test(last4)) {
            idNumber = 'MASKED-' + last4;
            idType = 'aadhaar_masked';
            idSource = 'masked_aadhaar_aggressive';
          }
        }
      }
      
      // Try PAN Card if no Aadhaar found
      if (!idNumber) {
        const panMatch = text.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/i) ||
                        cleanedText.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/i);
        if (panMatch) {
          idNumber = panMatch[0].toUpperCase().replace(/\s/g, '');
          idType = 'pan';
        }
      }
      
      // Try other Government IDs
      if (!idNumber) {
        const passportMatch = text.match(/\b([A-Z][0-9]{7})\b/);
        const voterMatch = text.match(/\b([A-Z]{3}[0-9]{7})\b/);
        const dlMatch = text.match(/\b([A-Z]{2}[0-9]{13})\b/);
        
        if (passportMatch) { idNumber = passportMatch[0].toUpperCase(); idType = 'passport'; }
        else if (voterMatch) { idNumber = voterMatch[0].toUpperCase(); idType = 'voter'; }
        else if (dlMatch) { idNumber = dlMatch[0].toUpperCase(); idType = 'dl'; }
      }
      
      // ═══════════════════════════════════════════════════════════════════════════
      // 🔱 STUDENT ID DETECTION - For 13-17 Teen Tier
      // ═══════════════════════════════════════════════════════════════════════════
      if (!idNumber) {
        // Common Student ID patterns
        const studentPatterns = [
          // Student ID: various formats
          /\b(?:Student\s*ID|ID\s*No|Roll\s*No|Reg\.?\s*No)[:\s]+([A-Z0-9]{5,20})\b/i,
          // Admission number
          /\b(?:Admission|Adm)[:\s]+([A-Z0-9]{5,20})\b/i,
          // Generic ID patterns
          /\b(?:ID|ID\s*Number)[:\s]+([A-Z0-9]{6,20})\b/i,
        ];
        
        for (const pattern of studentPatterns) {
          const match = text.match(pattern);
          if (match) {
            const studentId = match[1].trim().toUpperCase();
            // Validate it looks like an ID (not a date or random number)
            if (studentId.length >= 5 && /[A-Z]/.test(studentId) && /[0-9]/.test(studentId)) {
              idNumber = studentId;
              idType = 'student';
              break;
            }
          }
        }
      }

      // ═══════════════════════════════════════════════════════════════════════════
      // 🔱 VALIDATION: All 3 fields required for successful scan
      // Name, DOB, and ID Number must ALL be detected
      // ═══════════════════════════════════════════════════════════════════════════
      const hasName = !!nameMatch?.[1]?.trim();
      const hasDob = !!dob;
      const hasIdNumber = !!idNumber && idNumber.length >= 4;
      
      // Build specific error message for what's missing
      let failReason = null;
      if (!hasName && !hasDob && !hasIdNumber) {
        failReason = 'Could not read ID. Please ensure good lighting and hold the ID steady.';
      } else if (!hasIdNumber) {
        failReason = 'ID Number NOT DETECTED - Upload clearer image. Make sure the ID number is clearly visible.';
      } else if (!hasName) {
        failReason = 'Name not detected. Ensure the name field is clearly visible.';
      } else if (!hasDob) {
        failReason = 'Date of Birth not detected. Ensure the DOB field is clearly visible.';
      }
      
      // Extract last 4 digits for deduplication (especially for masked Aadhaar)
      const last4 = idNumber ? idNumber.slice(-4) : null;
      
      const result = {
        ok: hasName && hasDob && hasIdNumber, // ALL 3 required
        name: nameMatch?.[1]?.trim() || null,
        dob: dob || null,
        idNumber: idNumber || null,
        idType: idType || null,
        idSource: idSource || null, // 'full_aadhaar', 'masked_aadhaar', 'pan', etc.
        last4: last4, // Last 4 digits for deduplication
        confidence: confidence / 100,
        rawText: text,
        reason: failReason,
        missingFields: {
          name: !hasName,
          dob: !hasDob,
          idNumber: !hasIdNumber
        }
      };
      
      // DEBUG: Final result
      console.log('[TrustShield OCR] === RESULT ===');
      console.log('  Name:', result.name, '| Match:', nameMatch?.[0]);
      console.log('  DOB:', result.dob);
      console.log('  ID Number:', result.idNumber, '| Type:', result.idType, '| Source:', result.idSource);
      console.log('  Success:', result.ok, '| Reason:', result.reason);

      setOcrResult(result);
      setPhase('captured');
      setProgress(100);
      setStatusMessage(result.ok
        ? `✅ ID scanned — ${Math.round(confidence)}% confidence`
        : '⚠️ Partial read — please retake'
      );
      stopCamera();
    } catch (err) {
      isScanningRef.current = false;
      setPhase('error');
      setStatusMessage('OCR failed. Please retry.');
    }
  }, [startAnalysisLoop]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stop Camera ───────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (loopRef.current) clearInterval(loopRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // ── Retry ─────────────────────────────────────────────────────────────────
  const retry = useCallback(() => {
    isScanningRef.current = false;
    setOcrResult(null);
    setCapturedFrame(null);
    setProgress(0);
    setLightWarning(false);
    setSharpnessOk(false);
    startCamera();
  }, [startCamera]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  return {
    phase,
    statusMessage,
    progress,
    ocrResult,
    capturedFrame,
    lightWarning,
    sharpnessOk,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    retry,
    runOCR,
  };
};

export default useScanner;
