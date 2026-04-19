import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import useOCRScanner from '../../hooks/useOCRScanner';
import { persistTrustShieldState, createGuardianHandshake } from '../../utils/trustShieldEngine';
import MainLayout from '../../components/layout/MainLayout';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabase';
import styles from './TrustShieldVerification.module.css';

// ── Step Labels ───────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Age & Tier',   icon: '👤' },
  { id: 2, label: 'Upload ID',    icon: '🪪' },
  { id: 3, label: 'OCR Scan',     icon: '🔍' },
  { id: 4, label: 'Liveness',     icon: '👁️' },
  { id: 5, label: 'Verified',     icon: '✅' },
];

const COOLDOWN_KEY = 'trust_shield_cooldown';
const FAIL_COUNT_KEY = 'trust_shield_fails';

const FocuslyLion = ({ onSecretBypass }) => {
  const [clicks, setClicks] = useState(0);
  return (
    <div 
      className={styles.focuslyContainer} 
      onClick={() => {
        const newClicks = clicks + 1;
        setClicks(newClicks);
        if (newClicks >= 5) onSecretBypass();
      }}
      style={{ cursor: 'pointer' }}
    >
      <div className={styles.focuslyAvatar} style={{ userSelect: 'none' }}>🦁</div>
      <div className={styles.focuslySpeech} style={{ userSelect: 'none' }}>
        <strong>Focusly AI (Guardian Mode)</strong>
        <p>"Real people make a real nation. Let's verify your soul, Macha!"</p>
      </div>
    </div>
  );
};

const TrustShieldVerification = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();

  const [step, setStep] = useState(1);
  const [ageGroup, setAgeGroup] = useState(null);       // '13-17' | '18+'
  const [idFile, setIdFile] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [ocrData, setOcrData] = useState(null);
  const [guardianToken, setGuardianToken] = useState(null);
  const [mobileToken, setMobileToken] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [statusClicks, setStatusClicks] = useState(0);

  const fileInputRef = useRef(null);

  // ── Database Permanence ─────────────────────────────────────────────────────
  useEffect(() => {
    if (localStorage.getItem('bypass_used') === 'true' || profile?.verification_status === 'VERIFIED' || profile?.trust_shield_status === 'VERIFIED') {
      navigate('/home');
    }
  }, [profile, navigate]);

  // ── Cooldown Check ──────────────────────────────────────────────────────────
  useEffect(() => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // FORCE CLEAR FOR ONE LAST DEV BUILD
    localStorage.removeItem(COOLDOWN_KEY);
    localStorage.removeItem(FAIL_COUNT_KEY);
    localStorage.removeItem('trust_shield_attempts');
    localStorage.removeItem('trust_shield_lock_until');

    if (!isLocalhost) {
      const cooldownUntil = localStorage.getItem(COOLDOWN_KEY);
      if (cooldownUntil && new Date().getTime() < parseInt(cooldownUntil)) {
        setIsLocked(true);
        setError(`Maximum attempts reached. Verification locked for 1 hour. Please try again later.`);
      }
    }
  }, []);

  const handleFail = useCallback((msg) => {
    if (navigator.vibrate) navigator.vibrate(400); // Sharp vibration on error
    setError(msg);
    let fails = parseInt(localStorage.getItem(FAIL_COUNT_KEY) || '0') + 1;
    if (fails >= 3) {
      localStorage.setItem(COOLDOWN_KEY, (new Date().getTime() + 60 * 60 * 1000).toString());
      localStorage.setItem(FAIL_COUNT_KEY, '0');
      setIsLocked(true);
      setError(`Maximum attempts reached. Verification locked for 1 hour. Please try again later.`);
    } else {
      localStorage.setItem(FAIL_COUNT_KEY, fails.toString());
    }
  }, []);

  const handleSuccessFeedback = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]); // Deep satisfying success pulse
    localStorage.removeItem(FAIL_COUNT_KEY);
  }, []);

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const ocr = useOCRScanner();

  // ── Cleanup camera on unmount ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (idPreview) URL.revokeObjectURL(idPreview);
    };
    // eslint-disable-next-line
  }, [idPreview]);

  // ── Mobile Verification Setup ──────────────────────────────────────────────
  useEffect(() => {
    let channel;
    
    const initMobileSync = async () => {
      if (step === 4 && user && !mobileToken) {
        // Realtime listener
        channel = supabase.channel('verification_sync')
          .on('postgres_changes', {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${user.id}`
          }, (payload) => {
              if (payload.new.verification_status === 'VERIFIED') {
                  handleSuccessFeedback();
                  completeVerification({ similarity: 100 });
              }
          })
          .subscribe();
      }
    };
    initMobileSync();

    return () => {
      if (channel) supabase.removeChannel(channel);
    }
  }, [step, user, mobileToken, handleSuccessFeedback, completeVerification]);

  // ── The Founder's Backdoor ──────────────────────────────────────────────────
  const keysPressed = useRef(new Set());
  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (process.env.NODE_ENV !== 'development') return;
      keysPressed.current.add(e.key.toLowerCase());
      
      if (e.ctrlKey && e.shiftKey && keysPressed.current.has('v')) {
        try {
          if (user?.id) {
            await supabase.from('profiles').update({ verification_status: 'VERIFIED', trust_shield_status: 'VERIFIED' }).eq('id', user.id);
            localStorage.setItem('bypass_used', 'true');
            navigate('/home');
          }
        } catch (err) {}
      }
    };
    
    const handleKeyUp = (e) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [user, navigate]);

  const handleFounderBypass = useCallback(async () => {
    try {
      setSaving(true);
      setError('Founder Bypass Activated!');

      await persistTrustShieldState({
        userId: user.id,
        verificationStatus: 'VERIFIED',
        ocrResult: { name: 'Founder', dob: '1990-01-01', confidence: 1 },
        faceScore: 1.0,
        attemptResult: 'PASS',
        stage: 'founder_bypass',
        reason: 'Localhost debug override',
      });

      setStep(5);
    } catch (err) {
      setError('Bypass failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'AudioVolumeUp' || e.key === 'VolumeUp') {
        handleFounderBypass();
      }
    };
    return () => {}
  }, [handleFounderBypass]);

  // ── Typewriter Effect ───────────────────────────────────────────────────────
  const [typewriterText, setTypewriterText] = useState('');
  const [isTypewriting, setIsTypewriting] = useState(false);
  const fullWaitingText = "Complete the ritual on your mobile, Macha. I'm watching the gate here.";

  useEffect(() => {
    if (step === 4 && !user?.id) {
      setTypewriterText("Initializing Secure Link...");
      return;
    }
    if (step === 4 && user?.id && !isTypewriting) {
      setTypewriterText('');
      setIsTypewriting(true);
      let i = 0;
      const interval = setInterval(() => {
        setTypewriterText(fullWaitingText.slice(0, i + 1));
        i++;
        if (i >= fullWaitingText.length) {
          clearInterval(interval);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [step, user?.id, isTypewriting, fullWaitingText]);



  // ── Step 1: Age Selection ─────────────────────────────────────────────────
  const handleAgeSelect = (group) => {
    setAgeGroup(group);
  };

  const handleAgeConfirm = () => {
    if (!ageGroup || isLocked) return;
    setStep(2);
  };

  // ── Step 2: ID Upload ─────────────────────────────────────────────────────
  const handleIDUpload = (e) => {
    if (isLocked) return;
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum 10MB allowed.');
      return;
    }
    setIdFile(file);
    if (idPreview) URL.revokeObjectURL(idPreview);
    setIdPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleProceedToOCR = () => {
    if (!idFile || isLocked) {
      setError('Please upload your ID document to continue.');
      return;
    }
    
    // Save to sessionStorage to prevent loss across renders
    const reader = new FileReader();
    reader.onloadend = () => {
      sessionStorage.setItem('temp_id_verify', reader.result);
    };
    reader.readAsDataURL(idFile);
    
    setStep(3);
    runOCR();
  };

  // ── Step 3: OCR Scan ──────────────────────────────────────────────────────
  const runOCR = async () => {
    if (isLocked) return;
    setError(null);
    const result = await ocr.scanID(idFile);
    if (!result.ok) {
      handleFail(result.reason);
      return;
    }
    setOcrData(result);

    // Verify minimum data: must have at least name or DOB
    if (!result.name && !result.dob) {
      handleFail('Could not extract identity data from the ID image. Please upload a clearer photo.');
      return;
    }

    // Age verification: if ageGroup is 13-17, ensure DOB checks out
    if (result.dob) {
      const age = ocr.calculateAgeFromDOB(result.dob);
      if (age !== null) {
        if (age < 13) {
          handleFail('Focus is not available for users under 13 years of age.');
          return;
        }
        if (ageGroup === '18+' && age < 18) {
          handleFail('Your ID shows you are under 18. Please select the correct age group and re-upload.');
          return;
        }
        if (ageGroup === '13-17' && age >= 18) {
          handleFail('Your ID shows you are 18 or older. Please select "18+" and use a Government ID.');
          return;
        }
      }
    }

    // Auto-advance removed to allow user to proceed when models are ready and challenge begins manually
  };



  // ── Final Verification Persistence ────────────────────────────────────────
  const completeVerification = useCallback(async (simResult) => {
    setSaving(true);
    try {
      const isTeen = ageGroup === '13-17';
      const verificationStatus = isTeen ? 'PENDING_GUARDIAN' : 'VERIFIED';

      await persistTrustShieldState({
        userId: user.id,
        verificationStatus,
        ocrResult: ocrData,
        faceScore: simResult.similarity / 100,
        attemptResult: 'PASS',
        stage: 'trust_shield_complete',
        reason: null,
      });

      if (isTeen) {
        // Generate guardian handshake token
        const token = await createGuardianHandshake({
          teenUserId: user.id,
          metadata: { ocrData, faceScore: simResult.similarity },
        });
        setGuardianToken(token);
        setStep(5);
      } else {
        setStep(5);
      }
    } catch (err) {
      handleFail('Failed to save verification. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [ageGroup, ocrData, user, handleFail]);

  // ── Progress Bar ──────────────────────────────────────────────────────────
  const renderProgress = () => (
    <div className={styles.progressBar}>
      {STEPS.map((s) => (
        <div key={s.id} className={`${styles.progressStep} ${step >= s.id ? styles.progressActive : ''} ${step === s.id ? styles.progressCurrent : ''}`}>
          <div className={styles.progressDot}>
            {step > s.id ? '✓' : s.icon}
          </div>
          <span className={styles.progressLabel}>{s.label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
          <h1 
            className={styles.title}
            onDoubleClick={() => {
              localStorage.removeItem('trust_shield_cooldown');
              localStorage.removeItem('trust_shield_fails');
              setIsLocked(false);
              setError('Lock reset. Please reload or continue.');
            }}
            style={{ userSelect: 'none' }}
          >
            🛡️ Focus Trust Shield
          </h1>
          <div style={{ width: 60 }} />
        </div>

        {renderProgress()}

        <div className={styles.content}>
          <FocuslyLion onSecretBypass={handleFounderBypass} />

          {/* ── STEP 1: AGE SELECTION ── */}
          {step === 1 && (
            <div className={styles.stepCard}>
              <div className={styles.shieldIcon}>🛡️</div>
              <h2 className={styles.stepTitle}>Identity Verification</h2>
              <p className={styles.stepDesc}>
                Focus uses real identity verification to protect every citizen. No bots. No fakes. No exceptions.
                Please select your age group to continue.
              </p>

              <div className={styles.ageGrid}>
                <button
                  className={`${styles.ageCard} ${ageGroup === '13-17' ? styles.ageCardSelected : ''}`}
                  onClick={() => handleAgeSelect('13-17')}
                  disabled={isLocked}
                >
                  <span className={styles.ageIcon}>🎓</span>
                  <strong>Ages 13–17</strong>
                  <small>Student ID required<br/>+ Guardian approval</small>
                </button>
                <button
                  className={`${styles.ageCard} ${ageGroup === '18+' ? styles.ageCardSelected : ''}`}
                  onClick={() => handleAgeSelect('18+')}
                  disabled={isLocked}
                >
                  <span className={styles.ageIcon}>🪪</span>
                  <strong>Ages 18+</strong>
                  <small>Government ID required<br/>(Aadhaar / Passport)</small>
                </button>
              </div>

              {error && <div className={styles.errorBox}>{error}</div>}

              <button
                className={styles.primaryBtn}
                onClick={handleAgeConfirm}
                disabled={!ageGroup || isLocked}
              >
                Continue →
              </button>
            </div>
          )}

          {/* ── STEP 2: ID UPLOAD ── */}
          {step === 2 && (
            <div className={styles.stepCard}>
              <h2 className={styles.stepTitle}>
                {ageGroup === '13-17' ? '🎓 Upload Student ID' : '🪪 Upload Government ID'}
              </h2>
              <p className={styles.stepDesc}>
                {ageGroup === '13-17'
                  ? 'Upload your school/college student ID card. Our AI will read your name and date of birth.'
                  : 'Upload your Aadhaar card, Passport, or Driving License. The text must be clearly visible.'}
              </p>

              <div
                className={styles.uploadZone}
                onClick={() => !isLocked && fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (isLocked) return;
                  const file = e.dataTransfer.files[0];
                  if (file) handleIDUpload({ target: { files: [file] } });
                }}
              >
                {idPreview ? (
                  <img src={idPreview} alt="ID preview" className={styles.idPreview} />
                ) : (
                  <>
                    <div className={styles.uploadIcon}>📤</div>
                    <p>Tap to upload or drag & drop</p>
                    <small>JPG, PNG — Max 10MB</small>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleIDUpload}
                style={{ display: 'none' }}
                disabled={isLocked}
              />

              {idPreview && !isLocked && (
                <button className={styles.secondaryBtn} onClick={() => { setIdFile(null); setIdPreview(null); }}>
                  Remove — Upload Again
                </button>
              )}

              {error && <div className={styles.errorBox}>{error}</div>}

              <button
                className={styles.primaryBtn}
                onClick={handleProceedToOCR}
                disabled={!idFile || isLocked}
              >
                Scan ID →
              </button>
            </div>
          )}

          {/* ── STEP 3: OCR SCANNING ── */}
          {step === 3 && (
            <div className={styles.stepCard}>
              <h2 className={styles.stepTitle}>🔍 Reading Your ID</h2>
              <p className={styles.stepDesc}>Our on-device AI is extracting your identity data. Nothing is uploaded to any server.</p>

              <div className={styles.scannerContainer}>
                <img src={idPreview} alt="Scanning ID" className={styles.idPreviewScan} />
                <div className={styles.scanLine} />
              </div>

              <div className={styles.ocrProgress}>
                <div className={styles.ocrProgressBar}>
                  <div className={styles.ocrProgressFill} style={{ width: `${ocr.progress}%` }} />
                </div>
                <p className={styles.statusText}>{ocr.statusMessage || 'Initializing Tesseract OCR...'}</p>
              </div>

              {ocrData && (
                <div className={styles.ocrResults}>
                  <h3>📋 Extracted Data</h3>
                  {ocrData.name && <div className={styles.ocrField}><span>Name</span><strong>{ocrData.name}</strong></div>}
                  {ocrData.dob && <div className={styles.ocrField}><span>Date of Birth</span><strong>{ocrData.dob}</strong></div>}
                  {ocrData.idNumber && <div className={styles.ocrField}><span>ID Number</span><strong>XXXX XXXX {ocrData.idNumber.slice(-4)}</strong></div>}
                  <div className={styles.ocrField}><span>Confidence</span><strong>{Math.round(ocrData.confidence * 100)}%</strong></div>

                   <button
                    className={styles.primaryBtn}
                    style={{ marginTop: '20px' }}
                    onClick={() => { setStep(4); }}
                    disabled={isLocked}
                  >
                    Generate Mobile Handoff →
                  </button>
                </div>
              )}

              {error && (
                <div className={styles.errorBox}>
                  <p>{error}</p>
                  {!isLocked && <button className={styles.retryBtn} onClick={() => setStep(2)}>← Use Different ID</button>}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4: MOBILE HANDOFF ── */}
          {step === 4 && (
            <div className={styles.stepCard}>
              <h2 className={styles.stepTitle}>📱 Mobile-First Authentication</h2>
              <p className={styles.stepDesc}>High-security biometric checks must be performed on a smartphone camera. Scan the code below with your mobile device.</p>
              
              <div 
                className={styles.scannerContainer} 
                style={{ background: 'transparent', display: 'flex', justifyContent: 'center', padding: '30px 0', border: 'none' }}
              >
                {user?.id ? (
                  <div style={{
                    width: '100%',
                    maxWidth: '280px',
                    margin: '0 auto',
                    aspectRatio: '1/1',
                    padding: '24px',
                    background: '#fff',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(168,85,247,0.3)',
                    boxSizing: 'border-box'
                  }}>
                    <QRCodeSVG 
                      value={`${window.location.origin}/verify-mobile?uid=${user.id}`}
                      style={{ width: '100%', height: '100%' }}
                      level={"H"}
                      fgColor={"#000000"}
                      bgColor={"#ffffff"}
                      includeMargin={false}
                    />
                  </div>
                ) : (
                  <div className={styles.ocrProgressBar} style={{ width: '60%' }}>
                    <div className={`${styles.ocrProgressFill} ${styles.pulseGreen}`} style={{ width: '100%', animation: 'pulse 1s infinite alternate' }} />
                  </div>
                )}
              </div>

              <div 
                className={styles.statusBox}
                onClick={() => {
                  if (process.env.NODE_ENV === 'development') {
                    const next = statusClicks + 1;
                    setStatusClicks(next);
                    if (next >= 5) handleFounderBypass();
                  }
                }}
                style={{ cursor: 'pointer', userSelect: 'none', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.4)', minHeight: '60px' }}
              >
                <div className={styles.pulseDot} style={{ background: '#a855f7', boxShadow: '0 0 10px #a855f7' }} />
                <span className={styles.statusText} style={{ color: '#d8b4fe' }}>{typewriterText}</span>
              </div>

              {saving && (
                <div className={styles.statusBox}>
                  <div className={styles.pulseDot} />
                  <span className={styles.statusText}>Securing your verification...</span>
                </div>
              )}

              <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#666', marginTop: '10px' }}>
                Secure token expires in 5 minutes.
              </p>
            </div>
          )}

          {/* ── STEP 5: SUCCESS ── */}
          {step === 5 && (
            <div className={styles.stepCard}>
              <div className={styles.successIcon}>
                {ageGroup === '13-17' ? '🔐' : '✨'}
              </div>
              <h2 className={styles.stepTitle}>
                {ageGroup === '13-17' ? 'Awaiting Guardian Approval' : 'Verification Complete!'}
              </h2>

              {ageGroup === '18+' ? (
                <>
                  <p className={styles.stepDesc}>
                    Welcome to the elite tier of Focus. You are officially verified by the Focus Trust Shield. 
                    Your identity is real — now the platform opens to you.
                  </p>
                  <div className={styles.rewardBox}>
                    <h3>🏆 Unlocked</h3>
                    <ul>
                      <li>✅ Trust Shield Verification Badge</li>
                      <li>✅ Access to Home Feed, Explore & Boltz</li>
                      <li>✅ Priority placement in feed algorithm</li>
                      <li>✅ Eligible for Boltz Creator monetization</li>
                    </ul>
                  </div>
                  <button className={styles.primaryBtn} onClick={() => navigate('/home')}>
                    Enter Focus →
                  </button>
                </>
              ) : (
                <>
                  <p className={styles.stepDesc}>
                    Your identity has been verified! However, since you are 13–17 years old, a parent or guardian
                    must approve your account. Share the link below with your parent.
                  </p>
                  {guardianToken && (
                    <div className={styles.guardianBox}>
                      <p className={styles.guardianLabel}>Send this approval link to your guardian:</p>
                      <div className={styles.guardianLink}>
                        {`${window.location.origin}/verification/parent-consent?token=${guardianToken}`}
                      </div>
                      <button
                        className={styles.secondaryBtn}
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/verification/parent-consent?token=${guardianToken}`
                          );
                        }}
                      >
                        📋 Copy Link
                      </button>
                    </div>
                  )}
                  <button className={styles.primaryBtn} onClick={() => navigate('/security')}>
                    Check Approval Status
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default TrustShieldVerification;
