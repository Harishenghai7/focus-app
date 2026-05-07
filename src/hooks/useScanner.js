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
  const runOCRRef = useRef(null); // Ref to hold runOCR for circular dependency fix

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

  // ── Analysis Loop: sharpness + luminance every 800ms ─────────────────────
  const startAnalysisLoop = useCallback(() => {
    if (loopRef.current) clearInterval(loopRef.current);
    
    // Track last status to prevent duplicate updates - STRONGER debouncing
    let lastStatus = '';
    let lastStatusTime = 0;
    let stableFrameCount = 0;
    
    const updateStatus = (msg, force = false) => {
      const now = Date.now();
      // 🔱 BULLETPROOF: 2000ms debounce, must be different message
      if (force || (msg !== lastStatus && now - lastStatusTime > 2000)) {
        setStatusMessage(msg);
        lastStatus = msg;
        lastStatusTime = now;
      }
    };
    
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

      // 🔱 RELAXED THRESHOLDS: More forgiving for real-world conditions
      const isLowLight = lum < 45;
      const isSharp = sharpness > 45;
      const isAcceptable = sharpness > 25;

      // Batch state updates to prevent re-render spam
      const newLightWarning = isLowLight;
      const newSharpnessOk = isSharp;
      
      // Only update state if values changed
      setLightWarning(prev => prev !== newLightWarning ? newLightWarning : prev);
      setSharpnessOk(prev => prev !== newSharpnessOk ? newSharpnessOk : prev);

      // Smart status messages - only when quality changes
      if (isSharp && !isScanningRef.current) {
        isScanningRef.current = true;
        clearInterval(loopRef.current);
        updateStatus('✅ Good quality — capturing...', true);
        // Call runOCR through ref to avoid circular dependency
        runOCRRef.current?.(canvas);
      } else if (isLowLight) {
        updateStatus('⚡ Low light detected — add more lighting or move to brighter area');
      } else if (isAcceptable) {
        // Only show this message after several stable frames
        stableFrameCount++;
        if (stableFrameCount > 3) {
          updateStatus('📷 Hold ID steady — waiting for sharp focus...');
        }
      } else {
        stableFrameCount = 0;
        updateStatus('📋 Position ID in frame — avoid glare and shadows');
      }
    }, 800);
  }, []);

  // ── Start Camera ──────────────────────────────────────────────────────────
  // 🔱 FIXED: Now defined AFTER startAnalysisLoop to avoid TDZ error
  const startCamera = useCallback(async () => {
    // Prevent starting if already streaming or scanning
    if (phase === 'streaming' || phase === 'scanning' || phase === 'requesting') {

      return;
    }

    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
    isScanningRef.current = false;

    setPhase('requesting');
    setStatusMessage('Requesting camera access...');
    setError(null);
    setOcrResult(null);
    setCapturedFrame(null);
    setProgress(0);
    
    const cameraConfigs = [
      // Try back camera first (best for ID scanning)
      { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
      // Try front camera
      { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
      // Fallback to any camera
      { video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
      // Final fallback - any video
      { video: true, audio: false },
    ];
    
    let lastError = null;
    
    for (let i = 0; i < cameraConfigs.length; i++) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(cameraConfigs[i]);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.playsInline = true;
          videoRef.current.muted = true;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.setAttribute('webkit-playsinline', 'true');
          await videoRef.current.play();
        }
        setPhase('streaming');
        setStatusMessage('Position your ID in the frame...');
        // Small delay before starting analysis to let video stabilize
        setTimeout(() => startAnalysisLoop(), 500);
        return;
      } catch (err) {
        lastError = err;
        console.warn(`[TrustShield] Camera attempt ${i + 1} failed:`, err.message);
      }
    }
    
    // All attempts failed
    console.error('[TrustShield] All camera attempts failed:', lastError);
    setPhase('error');
    
    if (lastError?.name === 'NotAllowedError' || lastError?.name === 'PermissionDeniedError') {
      setStatusMessage('Camera permission denied. Please allow camera access and refresh.');
    } else if (lastError?.name === 'NotFoundError' || lastError?.name === 'DevicesNotFoundError') {
      setStatusMessage('No camera found. Please use the file upload option below.');
    } else {
      setStatusMessage('Camera error. Please use the file upload option.');
    }
  }, [startAnalysisLoop, phase]);

  // ── OCR Run ───────────────────────────────────────────────────────────────
  const runOCR = useCallback(async (canvas) => {
    // Prevent duplicate OCR runs
    if (isScanningRef.current) {

      return;
    }
    if (!workerRef.current) {
      setStatusMessage('OCR worker not ready. Please wait a moment and try again.');
      return;
    }
    
    isScanningRef.current = true;
    setPhase('scanning');
    setStatusMessage('🔍 Reading ID — please hold still...');

    // Capture the frame immediately
    const preprocessForOCR = (srcCanvas) => {
      const c = document.createElement('canvas');
      c.width = srcCanvas.width;
      c.height = srcCanvas.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(srcCanvas, 0, 0);
      const img = ctx.getImageData(0, 0, c.width, c.height);
      const d = img.data;
      const contrast = 1.35;
      const intercept = 128 * (1 - contrast);
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        let y = 0.299 * r + 0.587 * g + 0.114 * b;
        y = (y * contrast) + intercept;
        y = y < 0 ? 0 : (y > 255 ? 255 : y);
        const v = y > 155 ? 255 : 0;
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v;
      }
      ctx.putImageData(img, 0, 0);
      return c.toDataURL('image/jpeg', 0.92);
    };

    const frameDataUrl = preprocessForOCR(canvas);
    setCapturedFrame(frameDataUrl);

    try {
      const { data } = await workerRef.current.recognize(frameDataUrl);
      const confidence = data.confidence;

      if (confidence < 60) {
        setStatusMessage('⚠️ Confidence too low — repositioning...');
        setPhase('streaming');
        isScanningRef.current = false;
        // 🔱 MEMORY FIX: Properly restart analysis loop
        setTimeout(() => {
          if (phase === 'streaming' && !loopRef.current) {
            startAnalysisLoop();
          }
        }, 500);
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
      
      // ── Field extraction ──────────────────────────────────────────────
      const nameMatch = text.match(/(?:Name|NAME|नाम)[:\s]+([A-Z][A-Za-z\s\.]{2,40})/i) ||
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
      // 🔱 AADHAAR DETECTION - Multiple patterns for camera images
      // ═══════════════════════════════════════════════════════════════════════════
      const AADHAAR_PATTERNS = [
        /\b(\d{4}\s+\d{4}\s+\d{4})\b/,           // Standard: 1234 5678 9012
        /\b(\d{12})\b/,                          // No spaces: 123456789012
        /\b(\d{4}\s+\d{8})\b/,                   // Partial: 1234 56789012
        /\b(\d{8}\s+\d{4})\b/,                   // Partial: 12345678 9012
        /\b(\d{4}-\d{4}-\d{4})\b/,               // Dashed: 1234-5678-9012
        /\b[0-9OIlSBJ]{4}\s*[0-9OIlSBJ]{4}\s*[0-9OIlSBJ]{4}\b/i, // OCR error tolerant
      ];
      
      let idNumber = null;
      let idType = 'unknown';
      let idMaskedLast4 = null;
      
      // Try ALL patterns on both raw and cleaned text
      for (const pattern of AADHAAR_PATTERNS) {
        const match = text.match(pattern) || cleanedText.match(pattern);
        if (match) {
          // Clean the matched ID - keep only digits
          const rawId = match[0].replace(/[^0-9]/g, '');
          // Validate: must be exactly 12 digits (Aadhaar)
          if (rawId.length === 12) {
            idNumber = rawId;
            idType = 'aadhaar';
            break;
          }
        }
      }

      if (!idNumber) {
        const maskedMatch = text.match(/\b[Xx]{4,}\s*([0-9]{4})\b/) || cleanedText.match(/\b[Xx]{4,}\s*([0-9]{4})\b/);
        if (maskedMatch) {
          idMaskedLast4 = maskedMatch[1];
          idType = 'aadhaar_masked';
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
      } else if (idType === 'aadhaar_masked') {
        failReason = 'Aadhaar number is masked in this document (shows only last 4 digits). Upload an unmasked Aadhaar photo (12 digits visible) or enter Aadhaar manually.';
      } else if (!hasIdNumber) {
        failReason = 'ID Number NOT DETECTED - Upload clearer image. Make sure the ID number is clearly visible.';
      } else if (!hasName) {
        failReason = 'Name not detected. Ensure the name field is clearly visible.';
      } else if (!hasDob) {
        failReason = 'Date of Birth not detected. Ensure the DOB field is clearly visible.';
      }
      
      const result = {
        ok: hasName && hasDob && hasIdNumber, // ALL 3 required
        name: nameMatch?.[1]?.trim() || null,
        dob: dob || null,
        idNumber: idNumber || null,
        idType: idType || null,
        idMaskedLast4: idMaskedLast4 || null,
        confidence: confidence / 100,
        rawText: text,
        reason: failReason,
        missingFields: {
          name: !hasName,
          dob: !hasDob,
          idNumber: !hasIdNumber
        }
      };

      setOcrResult(result);
      setPhase('captured');
      setProgress(100);
      setStatusMessage(result.ok
        ? `✅ ID scanned — ${Math.round(confidence)}% confidence`
        : '⚠️ Partial read — please retake'
      );
      isScanningRef.current = false;
      stopCamera();
    } catch (err) {
      console.error('[useScanner] OCR error:', err);
      isScanningRef.current = false;
      setPhase('error');
      setStatusMessage('OCR failed. Please retry.');
    }
  }, []);

  // Store runOCR in ref for circular dependency resolution
  useEffect(() => {
    runOCRRef.current = runOCR;
  }, [runOCR]);

  // ── Stop Camera ───────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    // 🔱 MEMORY FIX: Properly clear interval and reset ref
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    isScanningRef.current = false;
  }, []);

  // ── Process Uploaded File ───────────────────────────────────────────────
  const processFile = useCallback(async (file) => {
    // Prevent duplicate processing
    if (isScanningRef.current) {

      return { ok: false, reason: 'Processing in progress' };
    }
    
    if (!file) {
      setStatusMessage('No file selected');
      return { ok: false, reason: 'No file' };
    }
    
    if (!workerRef.current) {
      setStatusMessage('OCR worker not ready. Please wait a moment and try again.');
      return { ok: false, reason: 'Worker not ready' };
    }
    
    isScanningRef.current = true;
    setPhase('scanning');
    setStatusMessage('Processing uploaded ID...');
    setProgress(0);
    setError(null);
    
    try {
      // Validate file
      if (file.size === 0) throw new Error('Empty file');
      if (file.size > 10 * 1024 * 1024) throw new Error('File too large (max 10MB)');
      
      // Convert file to image
      const imgUrl = URL.createObjectURL(file);
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imgUrl;
      });
      
      // Draw to canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 1280;
      canvas.height = img.naturalHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Revoke object URL to free memory
      URL.revokeObjectURL(imgUrl);
      
      // Run OCR
      const { data } = await workerRef.current.recognize(canvas);
      
      setOcrResult({
        text: data.text,
        confidence: data.confidence,
      });
      
      setCapturedFrame(canvas.toDataURL('image/jpeg', 0.9));
      setPhase('captured');
      setStatusMessage('ID processed successfully');
      setProgress(100);
      isScanningRef.current = false;
      
      return { 
        ok: true, 
        text: data.text, 
        confidence: data.confidence,
        canvas 
      };
    } catch (err) {
      console.error('[useScanner] File processing error:', err);
      setPhase('error');
      setStatusMessage('Failed to process file: ' + (err.message || 'Unknown error'));
      isScanningRef.current = false;
      return { ok: false, reason: err.message || 'Processing failed' };
    }
  }, []);

  // ── Manual Capture ────────────────────────────────────────────────────────
  // 🏛️ SOVEREIGN FIX: Allow users to force capture when auto-capture doesn't work
  const captureManually = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      setStatusMessage('Camera not ready. Please wait...');
      return;
    }
    
    if (isScanningRef.current) {

      return;
    }
    
    try {
      isScanningRef.current = true;
      
      // Clear the analysis loop
      if (loopRef.current) {
        clearInterval(loopRef.current);
        loopRef.current = null;
      }
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Ensure video is playing
      if (video.paused || video.ended) {
        await video.play();
      }
      
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      setStatusMessage('🔍 Manual capture — processing...');
      
      // Use ref to avoid circular dependency
      await runOCRRef.current?.(canvas);
    } catch (err) {
      console.error('[useScanner] Manual capture error:', err);
      isScanningRef.current = false;
      setStatusMessage('Capture failed. Please try again.');
    }
  }, []);

  // ── Retry ─────────────────────────────────────────────────────────────────
  const retry = useCallback(() => {
    isScanningRef.current = false;
    setOcrResult(null);
    setCapturedFrame(null);
    setProgress(0);
    setLightWarning(false);
    setSharpnessOk(false);
    setError(null);
    stopCamera();
    setTimeout(() => startCamera(), 300);
  }, [startCamera, stopCamera]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  // ── Set Error ────────────────────────────────────────────────────────────
  const setError = useCallback((msg) => {
    setStatusMessage(msg);
    if (msg) setPhase('error');
  }, []);

  return {
    phase,
    statusMessage,
    progress,
    ocrResult,
    capturedFrame,
    capturedFile: null, // Will be set when file is uploaded
    lightWarning,
    sharpnessOk,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    retry,
    runOCR,
    processFile,
    captureManually,
    setError,
  };
};

export default useScanner;
