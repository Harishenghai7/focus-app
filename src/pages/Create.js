import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useStepper } from '../hooks/useStepper';
import { useUpload } from '../hooks/useUpload';
import { useKeyboardNav } from '../hooks/useKeyboardNav';
import { validateCaption } from '../utils/validateCaption';
import './Create.css';

// Lazy load components to avoid initialization issues
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
const AUTOSAVE_DELAY = 10000;

function Create() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Stepper management
  const {
    currentStep,
    completedSteps,
    nextStep,
    prevStep,
    goToStep,
    completeStep,
    reset: resetStepper
  } = useStepper(0, 5);

  // Upload management
  const {
    uploading,
    progress,
    error: uploadError,
    uploadMultiple
  } = useUpload();

  // Content state
  const [type, setType] = useState(null);
  const [files, setFiles] = useState([]);
  const [editedFiles, setEditedFiles] = useState([]);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState(null);
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [audience, setAudience] = useState('everyone');
  const [schedule, setSchedule] = useState(null);

  // UI state
  const [showEditor, setShowEditor] = useState(false);
  const [currentEditingIndex, setCurrentEditingIndex] = useState(0);
  const [showMusicLibrary, setShowMusicLibrary] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showPeopleTagger, setShowPeopleTagger] = useState(false);
  const [showAudienceSelector, setShowAudienceSelector] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);
    };
    getUser();
  }, [navigate]);

  // Check if current step is valid
  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 0:
        return type !== null;
      case 1:
        return files.length > 0;
      case 2:
        return true;
      case 3:
        const captionValidation = validateCaption(caption);
        return captionValidation.valid || caption.length === 0;
      case 4:
        return true;
      default:
        return false;
    }
  }, [currentStep, type, files, caption]);

  // Navigation handlers - defined before useKeyboardNav to avoid initialization issues
  const handleNext = useCallback(() => {
    if (canProceed()) {
      completeStep(currentStep);
      nextStep();
    }
  }, [canProceed, completeStep, currentStep, nextStep]);

  const handlePrevious = useCallback(() => {
    prevStep();
  }, [prevStep]);

  const handleCancel = useCallback(() => {
    if (window.confirm('Are you sure you want to cancel? Your progress will be lost.')) {
      navigate(-1);
    }
  }, [navigate]);

  // Save draft
  const handleSaveDraft = useCallback(async () => {
    if (!type || files.length === 0) return;

    setSavingDraft(true);
    try {
      const draftData = {
        type,
        caption,
        location,
        taggedUsers,
        audience,
        schedule,
        selectedMusic,
        filesCount: files.length,
        timestamp: Date.now()
      };

      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save draft:', err);
    } finally {
      setSavingDraft(false);
    }
  }, [type, files, caption, location, taggedUsers, audience, schedule, selectedMusic]);

  // Keyboard navigation
  useKeyboardNav({
    onNext: handleNext,
    onPrev: handlePrevious,
    onEscape: handleCancel,
    onSave: handleSaveDraft,
    enabled: !uploading && !showEditor && !showMusicLibrary
  });

  // Type selection handler
  const handleTypeSelect = (selectedType) => {
    setType(selectedType);
    completeStep(0);
    setTimeout(() => nextStep(), 300);
  };

  // Files selected handler
  const handleFilesSelected = (selectedFiles) => {
    const newFiles = [...files, ...selectedFiles];
    setFiles(newFiles);
    setEditedFiles(newFiles.map(f => ({ original: f, edited: null })));
    completeStep(1);
    setTimeout(() => nextStep(), 300);
  };

  // File remove handler
  const handleFileRemove = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newEditedFiles = editedFiles.filter((_, i) => i !== index);
    setFiles(newFiles);
    setEditedFiles(newEditedFiles);
  };

  // Edit photo handler
  const handleEditPhoto = (index) => {
    setCurrentEditingIndex(index);
    setShowEditor(true);
  };

  // Photo edit complete
  const handlePhotoEditComplete = (editedBlob) => {
    const newEditedFiles = [...editedFiles];
    newEditedFiles[currentEditingIndex] = {
      ...newEditedFiles[currentEditingIndex],
      edited: editedBlob
    };
    setEditedFiles(newEditedFiles);
    setShowEditor(false);
  };

  // Music selection
  const handleMusicSelect = (music) => {
    setSelectedMusic(music);
    setShowMusicLibrary(false);
  };

  // Publish post
  const handlePublish = useCallback(async () => {
    if (!user || !canProceed()) return;

    setUploadStatus('uploading');

    try {
      // Upload files
      const uploadedMedia = await uploadMultiple(
        editedFiles.map(f => f.edited || f.original),
        user.id
      );

      setUploadStatus('processing');

      // Create post in database
      const postData = {
        user_id: user.id,
        type: type,
        caption: caption || null,
        location: location || null,
        audience: audience,
        scheduled_for: schedule || null,
        music_id: selectedMusic?.id || null,
        media: uploadedMedia.map(m => ({
          url: m.url,
          thumbnail_url: m.thumbnailUrl,
          type: m.type
        })),
        hashtags: caption ? caption.match(/#[\w]+/g)?.map(h => h.slice(1)) || [] : [],
        mentions: caption ? caption.match(/@[\w.]+/g)?.map(m => m.slice(1)) || [] : [],
        tagged_users: taggedUsers.map(u => u.id),
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select()
        .single();

      if (error) throw error;

      setUploadStatus('success');

      // Clear draft
      localStorage.removeItem(DRAFT_KEY);

      // Navigate after success
      setTimeout(() => {
        navigate('/explore');
      }, 2000);

    } catch (err) {
      console.error('Publish error:', err);
      setUploadStatus('error');
    }
  }, [user, type, files, editedFiles, caption, location, audience, schedule, selectedMusic, taggedUsers, uploadMultiple, navigate, canProceed]);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <TypeSelect
            selectedType={type}
            onTypeSelect={handleTypeSelect}
          />
        );

      case 1:
        return (
          <MediaPicker
            type={type}
            files={files}
            onFilesSelected={handleFilesSelected}
            onFileRemove={handleFileRemove}
            maxFiles={type === 'post' ? 10 : 1}
          />
        );

      case 2:
        return (
          <div className="editor-step">
            <div className="step-header">
              <h2>Edit Your Media</h2>
              <p>Crop, add filters, or skip to continue</p>
            </div>
            
            <div className="media-edit-grid">
              {files.map((file, index) => (
                <div key={index} className="edit-media-card">
                  <img
                    src={editedFiles[index]?.edited 
                      ? URL.createObjectURL(editedFiles[index].edited)
                      : URL.createObjectURL(file)
                    }
                    alt={`Media ${index + 1}`}
                    className="edit-preview"
                  />
                  <button
                    className="edit-btn"
                    onClick={() => handleEditPhoto(index)}
                  >
                    ✏️ Edit
                  </button>
                </div>
              ))}
            </div>

            {(type === 'boltz' || files.some(f => f.type.startsWith('video'))) && (
              <button
                className="music-btn"
                onClick={() => setShowMusicLibrary(true)}
              >
                🎵 {selectedMusic ? 'Change Music' : 'Add Music'}
              </button>
            )}
          </div>
        );

      case 3:
        return (
          <div className="details-step">
            <CaptionInput
              value={caption}
              onChange={setCaption}
              placeholder="Write a caption..."
            />

            <div className="details-controls">
              <button
                className="detail-control-btn"
                onClick={() => setShowLocationPicker(true)}
              >
                📍 {location ? location.name : 'Add Location'}
              </button>

              <button
                className="detail-control-btn"
                onClick={() => setShowPeopleTagger(true)}
              >
                👥 {taggedUsers.length > 0 ? `Tagged ${taggedUsers.length}` : 'Tag People'}
              </button>

              <button
                className="detail-control-btn"
                onClick={() => setShowAudienceSelector(true)}
              >
                🌍 {audience === 'everyone' ? 'Public' : audience === 'friends' ? 'Friends' : 'Private'}
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="review-step">
            <div className="step-header">
              <h2>Review & Publish</h2>
              <p>Everything looks good? Let's share it!</p>
            </div>

            <div className="review-content">
              <div className="review-media">
                {files.slice(0, 3).map((file, index) => (
                  <img
                    key={index}
                    src={editedFiles[index]?.edited 
                      ? URL.createObjectURL(editedFiles[index].edited)
                      : URL.createObjectURL(file)
                    }
                    alt={`Preview ${index + 1}`}
                    className="review-thumbnail"
                  />
                ))}
                {files.length > 3 && (
                  <div className="review-more">+{files.length - 3}</div>
                )}
              </div>

              {caption && (
                <div className="review-caption">
                  <strong>Caption:</strong>
                  <p>{caption}</p>
                </div>
              )}

              <div className="review-meta">
                {location && <div className="review-tag">📍 {location.name}</div>}
                {selectedMusic && <div className="review-tag">🎵 {selectedMusic.title}</div>}
                {taggedUsers.length > 0 && (
                  <div className="review-tag">👥 {taggedUsers.length} tagged</div>
                )}
                <div className="review-tag">🌍 {audience}</div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user) return null;

  return (
    <React.Suspense fallback={<div className="loading-create"><div className="spinner"></div></div>}>
      <div className="page-create" role="main">
        <div className="create-container">
          <CreateStepper
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={goToStep}
          />

          <div className="create-content">
            {renderStepContent()}
          </div>

          <CreateActions
            currentStep={currentStep}
            isFirstStep={currentStep === 0}
            isLastStep={currentStep === 4}
            onBack={handlePrevious}
            onNext={handleNext}
            onCancel={handleCancel}
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
            canProceed={canProceed()}
            isPublishing={uploading}
          />

        {draftSaved && (
          <div className="draft-saved-banner">
            💾 Draft saved successfully!
          </div>
        )}
      </div>

        {showEditor && files[currentEditingIndex] && (
          <PhotoEditor
            file={files[currentEditingIndex]}
            onComplete={handlePhotoEditComplete}
            onClose={() => setShowEditor(false)}
          />
        )}

        {showMusicLibrary && (
          <MusicLibrary
            selected={selectedMusic}
            onSelect={handleMusicSelect}
            onClose={() => setShowMusicLibrary(false)}
          />
        )}

        {showLocationPicker && (
          <LocationPicker
            selected={location}
            onSelect={(loc) => {
              setLocation(loc);
              setShowLocationPicker(false);
            }}
            onClose={() => setShowLocationPicker(false)}
          />
        )}

        {showPeopleTagger && (
          <PeopleTagger
            tagged={taggedUsers}
            onUpdate={(users) => {
              setTaggedUsers(users);
              setShowPeopleTagger(false);
            }}
            onClose={() => setShowPeopleTagger(false)}
          />
        )}

        {showAudienceSelector && (
          <AudienceSelector
            selected={audience}
            onSelect={(aud) => {
              setAudience(aud);
              setShowAudienceSelector(false);
            }}
            onClose={() => setShowAudienceSelector(false)}
          />
        )}

        <UploadOverlay
          progress={progress}
          isVisible={uploadStatus !== 'idle'}
          status={uploadStatus}
          onClose={() => {
            if (uploadStatus === 'success') {
              navigate('/explore');
            } else if (uploadStatus === 'error') {
              setUploadStatus('idle');
            }
          }}
        />
      </div>
    </React.Suspense>
  );
}

export default Create;
