// src/pages/Create.js
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Music, MapPin, Users, Globe, Image as ImageIcon } from 'lucide-react'; // 💎 Pro Icons

import { supabase } from '../supabaseClient';
import { useStepper } from '../hooks/useStepper';
import { useUpload } from '../hooks/useUpload';
import { useKeyboardNav } from '../hooks/useKeyboardNav';
import { validateCaption } from '../utils/validateCaption';

import './Create.css';

// Lazy Components
const CreateStepper = React.lazy(() => import('../components/CreateStepper'));
const TypeSelect = React.lazy(() => import('../components/TypeSelect'));
const MediaPicker = React.lazy(() => import('../components/MediaPicker'));
const CaptionInput = React.lazy(() => import('../components/CaptionInput'));
const CreateActions = React.lazy(() => import('../components/CreateActions'));
const UploadOverlay = React.lazy(() => import('../components/UploadOverlay'));
const PhotoEditor = React.lazy(() => import('../components/PhotoEditor'));
const MusicLibrary = React.lazy(() => import('../components/create/MusicLibrary'));
const LocationPicker = React.lazy(() => import('../components/create/LocationPicker'));
const PeopleTagger = React.lazy(() => import('../components/create/PeopleTagger'));
const AudienceSelector = React.lazy(() => import('../components/create/AudienceSelector'));

const DRAFT_KEY = 'focus_create_draft';

// Animation Variants
const stepVariants = {
  initial: (direction) => ({
    opacity: 0,
    x: direction > 0 ? 20 : -20,
  }),
  animate: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 }
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction > 0 ? -20 : 20,
    transition: { duration: 0.2 }
  })
};

function Create() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [direction, setDirection] = useState(1); // For animation direction

  // Stepper
  const {
    currentStep,
    completedSteps,
    nextStep,
    prevStep,
    goToStep,
    completeStep,
  } = useStepper(0, 5);

  // Upload
  const {
    uploading,
    progress,
    uploadMultiple
  } = useUpload();

  // State
  const [type, setType] = useState(null);
  const [files, setFiles] = useState([]);
  const [editedFiles, setEditedFiles] = useState([]);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState(null);
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [audience, setAudience] = useState('everyone');
  const [schedule, setSchedule] = useState(null);

  // Modals
  const [showEditor, setShowEditor] = useState(false);
  const [currentEditingIndex, setCurrentEditingIndex] = useState(0);
  const [activeModal, setActiveModal] = useState(null); // 'music', 'location', 'people', 'audience'
  
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [draftSaved, setDraftSaved] = useState(false);

  // Auth Check
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) navigate('/auth');
      else setUser(user);
    };
    getUser();
  }, [navigate]);

  // Validations
  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 0: return type !== null;
      case 1: return files.length > 0;
      case 2: return true; // Editing optional
      case 3: return validateCaption(caption).valid || caption.length === 0;
      case 4: return true;
      default: return false;
    }
  }, [currentStep, type, files, caption]);

  // Navigation
  const handleNext = useCallback(() => {
    if (canProceed()) {
      setDirection(1);
      completeStep(currentStep);
      nextStep();
    }
  }, [canProceed, completeStep, currentStep, nextStep]);

  const handlePrevious = useCallback(() => {
    setDirection(-1);
    prevStep();
  }, [prevStep]);

  const handleCancel = useCallback(() => {
    if (window.confirm('Discard this post?')) navigate(-1);
  }, [navigate]);

  // Drafts
  const handleSaveDraft = useCallback(() => {
    if (!type || files.length === 0) return;
    const draft = { type, caption, location, taggedUsers, audience, schedule, selectedMusic, timestamp: Date.now() };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 3000);
  }, [type, files, caption, location, taggedUsers, audience, schedule, selectedMusic]);

  // Keyboard
  useKeyboardNav({
    onNext: handleNext,
    onPrev: handlePrevious,
    onEscape: handleCancel,
    onSave: handleSaveDraft,
    enabled: !uploading && !showEditor && !activeModal
  });

  // --- Content Handlers ---

  const handleTypeSelect = (selectedType) => {
    setType(selectedType);
    completeStep(0);
    setTimeout(() => {
        setDirection(1);
        nextStep();
    }, 200);
  };

  const handleFilesSelected = (selectedFiles) => {
    const newFiles = [...files, ...selectedFiles];
    setFiles(newFiles);
    setEditedFiles(newFiles.map(f => ({ original: f, edited: null })));
    completeStep(1);
    // Auto-advance slightly delayed for UX
    if(newFiles.length > 0) {
        setTimeout(() => {
            setDirection(1);
            nextStep();
        }, 500);
    }
  };

  const handlePublish = useCallback(async () => {
    if (!user || !canProceed()) return;
    setUploadStatus('uploading');
    try {
      const uploadedMedia = await uploadMultiple(editedFiles.map(f => f.edited || f.original), user.id);
      setUploadStatus('processing');
      
      const postData = {
        user_id: user.id,
        type,
        caption: caption || null,
        location: location || null,
        audience,
        scheduled_for: schedule || null,
        music_id: selectedMusic?.id || null,
        media: uploadedMedia.map(m => ({ url: m.url, thumbnail_url: m.thumbnailUrl, type: m.type })),
        hashtags: caption ? caption.match(/#[\w]+/g)?.map(h => h.slice(1)) || [] : [],
        tagged_users: taggedUsers.map(u => u.id),
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('posts').insert([postData]);
      if (error) throw error;

      setUploadStatus('success');
      localStorage.removeItem(DRAFT_KEY);
      setTimeout(() => navigate('/home'), 1500);
    } catch (err) {
      console.error('Publish failed:', err);
      setUploadStatus('error');
    }
  }, [user, type, editedFiles, caption, location, audience, schedule, selectedMusic, taggedUsers, uploadMultiple, navigate, canProceed]);


  // --- Step Renderer ---
  const renderStep = () => {
    switch (currentStep) {
      case 0: return <TypeSelect selectedType={type} onTypeSelect={handleTypeSelect} />;
      case 1: return <MediaPicker type={type} files={files} onFilesSelected={handleFilesSelected} onFileRemove={(i) => {
          const nf = files.filter((_, idx) => idx !== i);
          setFiles(nf);
          setEditedFiles(editedFiles.filter((_, idx) => idx !== i));
      }} maxFiles={type === 'post' ? 10 : 1} />;
      case 2: return (
        <div className="editor-step">
            <h2 className="step-title">Polish your content</h2>
            <div className="media-edit-grid">
                {files.map((file, i) => (
                    <div key={i} className="edit-media-card glass-panel">
                        <img src={editedFiles[i]?.edited ? URL.createObjectURL(editedFiles[i].edited) : URL.createObjectURL(file)} alt="" />
                        <button className="edit-btn-overlay" onClick={() => { setCurrentEditingIndex(i); setShowEditor(true); }}>
                            Edit
                        </button>
                    </div>
                ))}
            </div>
            {(type === 'boltz' || type === 'flash') && (
                <button className="add-music-btn glass-button" onClick={() => setActiveModal('music')}>
                    <Music size={18} /> {selectedMusic ? selectedMusic.title : "Add Music"}
                </button>
            )}
        </div>
      );
      case 3: return (
        <div className="details-step">
            <CaptionInput value={caption} onChange={setCaption} placeholder="Write a caption..." />
            <div className="details-actions">
                <button className="detail-btn" onClick={() => setActiveModal('location')}>
                    <MapPin size={18} /> {location ? location.name : "Add Location"}
                </button>
                <button className="detail-btn" onClick={() => setActiveModal('people')}>
                    <Users size={18} /> {taggedUsers.length ? `${taggedUsers.length} Tagged` : "Tag People"}
                </button>
                <button className="detail-btn" onClick={() => setActiveModal('audience')}>
                    <Globe size={18} /> {audience === 'everyone' ? 'Public' : 'Private'}
                </button>
            </div>
        </div>
      );
      case 4: return (
        <div className="review-step">
            <h2 className="step-title">Ready to share?</h2>
            <div className="review-card glass-panel">
                <div className="review-media-preview">
                    <img src={editedFiles[0]?.edited ? URL.createObjectURL(editedFiles[0].edited) : (files[0] ? URL.createObjectURL(files[0]) : '')} alt="Preview" />
                </div>
                <div className="review-details">
                    <p className="review-caption">{caption || "No caption"}</p>
                    <div className="review-meta-tags">
                        {location && <span>📍 {location.name}</span>}
                        <span>🌍 {audience}</span>
                    </div>
                </div>
            </div>
        </div>
      );
      default: return null;
    }
  };

  if (!user) return null;

  return (
    <div className="create-page">
      <div className="create-container">
        
        {/* Header */}
        <header className="create-header">
            <button className="close-btn" onClick={handleCancel}><X size={24}/></button>
            <h1>Create New</h1>
            <div className="header-spacer"></div> {/* Optical centering */}
        </header>

        {/* Stepper */}
        <div className="create-stepper-wrapper">
            <Suspense fallback={null}>
                <CreateStepper currentStep={currentStep} completedSteps={completedSteps} onStepClick={goToStep} />
            </Suspense>
        </div>

        {/* Main Content Area */}
        <main className="create-content-area glass-panel">
            <AnimatePresence mode='wait' custom={direction}>
                <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="step-content-wrapper"
                >
                    <Suspense fallback={<div className="spinner" />}>
                        {renderStep()}
                    </Suspense>
                </motion.div>
            </AnimatePresence>
        </main>

        {/* Bottom Actions */}
        <div className="create-footer">
            <Suspense fallback={null}>
                <CreateActions
                    currentStep={currentStep}
                    isFirstStep={currentStep === 0}
                    isLastStep={currentStep === 4}
                    onBack={handlePrevious}
                    onNext={handleNext}
                    onPublish={handlePublish}
                    onSaveDraft={handleSaveDraft}
                    canProceed={canProceed()}
                    isPublishing={uploading}
                />
            </Suspense>
        </div>

        {/* Modals & Overlays */}
        <Suspense fallback={null}>
            {showEditor && files[currentEditingIndex] && (
                <PhotoEditor
                    file={files[currentEditingIndex]}
                    onComplete={(blob) => {
                        const nef = [...editedFiles];
                        nef[currentEditingIndex].edited = blob;
                        setEditedFiles(nef);
                        setShowEditor(false);
                    }}
                    onClose={() => setShowEditor(false)}
                />
            )}
            {activeModal === 'music' && (
                <MusicLibrary selected={selectedMusic} onSelect={(m) => { setSelectedMusic(m); setActiveModal(null); }} onClose={() => setActiveModal(null)} />
            )}
            {activeModal === 'location' && (
                <LocationPicker selected={location} onSelect={(l) => { setLocation(l); setActiveModal(null); }} onClose={() => setActiveModal(null)} />
            )}
            {activeModal === 'people' && (
                <PeopleTagger tagged={taggedUsers} onUpdate={(u) => { setTaggedUsers(u); setActiveModal(null); }} onClose={() => setActiveModal(null)} />
            )}
            {activeModal === 'audience' && (
                <AudienceSelector selected={audience} onSelect={(a) => { setAudience(a); setActiveModal(null); }} onClose={() => setActiveModal(null)} />
            )}
            <UploadOverlay 
                progress={progress} 
                isVisible={uploadStatus !== 'idle'} 
                status={uploadStatus} 
                onClose={() => { if(uploadStatus === 'success' || uploadStatus === 'error') setUploadStatus('idle'); }}
            />
        </Suspense>

        {/* Toast */}
        <AnimatePresence>
            {draftSaved && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: 20 }}
                    className="draft-toast"
                >
                    <Save size={16} /> Draft Saved
                </motion.div>
            )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export default Create;