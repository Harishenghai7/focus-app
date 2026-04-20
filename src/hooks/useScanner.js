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
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
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
      const { data } = await workerRef.current.recognize(frameDataUrl);
      const confidence = data.confidence;

      if (confidence < 60) {
        setStatusMessage('⚠️ Confidence too low — repositioning...');
        setPhase('streaming');
        isScanningRef.current = false;
        startAnalysisLoop();
        return;
      }

      const text = data.text;

      // ── Field extraction ──────────────────────────────────────────────
      const nameMatch = text.match(/(?:Name|NAME)[:\s]+([A-Z][A-Z\s]{3,40})/i);
      const dobPatterns = [
        /(?:DOB|Date of Birth|D\.O\.B)[:\s]+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
        /\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/,
        /\b(\d{4}[\/\-]\d{2}[\/\-]\d{2})\b/,
      ];
      let dob = null;
      for (const p of dobPatterns) { const m = text.match(p); if (m) { dob = m[1]; break; } }
      const aadhaarMatch = text.match(/\b(\d{4}\s?\d{4}\s?\d{4})\b/);
      const idNumber = aadhaarMatch?.[1]?.replace(/\s/g, '');

      const result = {
        ok: !!nameMatch || !!dob,
        name: nameMatch?.[1]?.trim() || null,
        dob: dob || null,
        idNumber: idNumber || null,
        confidence: confidence / 100,
        rawText: text,
        reason: !nameMatch && !dob ? 'Could not extract Name or DOB. Try better lighting.' : null,
      };

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
  };
};

export default useScanner;
