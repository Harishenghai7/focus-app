import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import MediaSelector from "../components/MediaSelector";
import SchedulePicker from "../components/SchedulePicker";
import { 
  saveDraftToLocal, 
  saveDraftToDatabase, 
  loadDraftsFromDatabase,
  deleteDraftFromDatabase,
  deleteLocalDraft,
  mergeDrafts,
  createAutoSaveManager,
  draftToPostData
} from "../utils/draftManager";
import { compressVideo, generateThumbnail } from "../utils/videoUtils";
import "./Create.css";

export default function Create({ user, userProfile }) {
  const navigate = useNavigate();
  const [contentType, setContentType] = useState('post');
  const [content, setContent] = useState("");
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(1);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  
  // 🔥 CAROUSEL SUPPORT - Using MediaSelector
  const [selectedMedia, setSelectedMedia] = useState([]);
  
  // 🔥 DRAFT SUPPORT
  const [drafts, setDrafts] = useState([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const autoSaveManagerRef = useRef(null);
  
  // 🔥 SCHEDULED POSTING
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [scheduledFor, setScheduledFor] = useState(null);
  
  // 🔥 CLOSE FRIENDS (for Flash)
  const [isCloseFriends, setIsCloseFriends] = useState(false);
  
  // 🔥 MENTIONS & HASHTAGS
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [mentionedUsers, setMentionedUsers] = useState([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef(null);

  // Load drafts on mount
  useEffect(() => {
    if (user && step === 2) {
      loadDrafts();
    }
  }, [user, step]);

  // Setup auto-save
  useEffect(() => {
    if (step === 2 && contentType === 'post') {
      autoSaveManagerRef.current = createAutoSaveManager(handleAutoSave, 30000);
      autoSaveManagerRef.current.start();

      return () => {
        if (autoSaveManagerRef.current) {
          autoSaveManagerRef.current.stop();
        }
      };
    }
  }, [step, contentType]);

  // Mark as dirty when content changes
  useEffect(() => {
    if (autoSaveManagerRef.current && (content || selectedMedia.length > 0)) {
      autoSaveManagerRef.current.markDirty();
    }
  }, [content, selectedMedia, mentionedUsers]);

  const loadDrafts = async () => {
    try {
      const dbDrafts = await loadDraftsFromDatabase(supabase, user.id);
      const merged = mergeDrafts(dbDrafts);
      setDrafts(merged);
    } catch (error) {
      console.error('Failed to load drafts:', error);
    }
  };

  const handleAutoSave = async () => {
    if (!content.trim() && selectedMedia.length === 0) return;

    try {
      setAutoSaveStatus('Saving...');
      
      const draftData = {
        id: currentDraftId,
        caption: content,
        mediaUrls: selectedMedia.map(m => m.url),
        mediaTypes: selectedMedia.map(m => m.type),
        isCarousel: selectedMedia.length > 1,
        mentionedUsers: mentionedUsers,
        hashtags: extractHashtags(content),
        scheduledFor: scheduledFor
      };

      // Save to local storage first (fast)
      const draftId = saveDraftToLocal(draftData);
      setCurrentDraftId(draftId);

      // Then save to database (slower, but persistent)
      try {
        await saveDraftToDatabase(supabase, user.id, { ...draftData, id: draftId });
        setAutoSaveStatus('Saved');
      } catch (dbError) {
        console.error('Failed to save to database:', dbError);
        setAutoSaveStatus('Saved locally');
      }

      setTimeout(() => setAutoSaveStatus(''), 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('Save failed');
      setTimeout(() => setAutoSaveStatus(''), 2000);
    }
  };

  const handleSchedule = (scheduledTime) => {
    setScheduledFor(scheduledTime);
    setShowSchedulePicker(false);
    setMessage(`Post scheduled for ${new Date(scheduledTime).toLocaleString()}`);
    setTimeout(() => setMessage(''), 3000);
  };

  const clearSchedule = () => {
    setScheduledFor(null);
    setMessage('Schedule cleared');
    setTimeout(() => setMessage(''), 2000);
  };

  const loadDraft = (draft) => {
    setContent(draft.caption || '');
    setMentionedUsers(draft.mentionedUsers || []);
    setCurrentDraftId(draft.id);
    setShowDrafts(false);
    
    // Note: Media URLs from drafts can't be directly loaded as File objects
    // This is a limitation - we'd need to fetch and convert them
    if (draft.mediaUrls && draft.mediaUrls.length > 0) {
      setMessage('Note: Draft media needs to be re-uploaded');
    }
  };

  const deleteDraft = async (draft) => {
    try {
      if (draft.dbId) {
        await deleteDraftFromDatabase(supabase, user.id, draft.dbId);
      }
      if (draft.id) {
        deleteLocalDraft(draft.id);
      }
      await loadDrafts();
      
      if (currentDraftId === draft.id) {
        setCurrentDraftId(null);
      }
    } catch (error) {
      console.error('Failed to delete draft:', error);
      setMessage('Failed to delete draft');
    }
  };

  const saveDraftManually = async () => {
    if (autoSaveManagerRef.current) {
      await autoSaveManagerRef.current.saveNow();
      setMessage('Draft saved! 💾');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const contentTypes = [
    { id: 'post', label: 'Post', icon: '📷', description: 'Share photos and thoughts', color: '#3B82F6' },
    { id: 'boltz', label: 'Boltz', icon: '⚡', description: 'Create short videos', color: '#EF4444' },
    { id: 'flash', label: 'Flash', icon: '✨', description: 'Quick 24h stories', color: '#8B5CF6' }
  ];

  // Handle single media for non-post content
  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMedia(file);
      const reader = new FileReader();
      reader.onload = (e) => setMediaPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Remove single media
  const removeMedia = () => {
    setMedia(null);
    setMediaPreview(null);
  };

  // 🔥 HASHTAG AUTOCOMPLETE
  const [showHashtags, setShowHashtags] = useState(false);
  const [hashtagSuggestions, setHashtagSuggestions] = useState([]);

  // Handle content change with mentions and hashtags
  const handleContentChange = async (e) => {
    const text = e.target.value;
    setContent(text);
    setCursorPosition(e.target.selectionStart);

    const lastWord = text.slice(0, e.target.selectionStart).split(/\s/).pop();
    
    // Check for mentions
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      const query = lastWord.slice(1);
      await searchUsers(query);
      setShowMentions(true);
      setShowHashtags(false);
    } 
    // Check for hashtags
    else if (lastWord.startsWith('#') && lastWord.length > 1) {
      const query = lastWord.slice(1);
      await searchHashtags(query);
      setShowHashtags(true);
      setShowMentions(false);
    } 
    else {
      setShowMentions(false);
      setShowHashtags(false);
    }
  };

  const searchUsers = async (query) => {
    try {
      const { data, error } = await supabase.rpc('search_users', {
        search_query: query,
        page_size: 5
      });

      if (error) throw error;
      setMentionSuggestions(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setMentionSuggestions([]);
    }
  };

  const searchHashtags = async (query) => {
    try {
      const { data, error } = await supabase
        .from('hashtags')
        .select('name, posts_count')
        .ilike('name', `${query}%`)
        .order('posts_count', { ascending: false })
        .limit(5);

      if (error) throw error;
      setHashtagSuggestions(data || []);
    } catch (error) {
      console.error('Error searching hashtags:', error);
      setHashtagSuggestions([]);
    }
  };

  const selectMention = (username, userId) => {
    const beforeCursor = content.slice(0, cursorPosition);
    const afterCursor = content.slice(cursorPosition);
    
    const beforeWords = beforeCursor.split(/\s/);
    beforeWords[beforeWords.length - 1] = `@${username}`;
    const newText = beforeWords.join(' ') + ' ' + afterCursor;
    
    setContent(newText);
    setShowMentions(false);
    
    if (!mentionedUsers.find(u => u.id === userId)) {
      setMentionedUsers([...mentionedUsers, { id: userId, username }]);
    }
    
    textareaRef.current?.focus();
  };

  const selectHashtag = (hashtag) => {
    const beforeCursor = content.slice(0, cursorPosition);
    const afterCursor = content.slice(cursorPosition);
    
    const beforeWords = beforeCursor.split(/\s/);
    beforeWords[beforeWords.length - 1] = `#${hashtag}`;
    const newText = beforeWords.join(' ') + ' ' + afterCursor;
    
    setContent(newText);
    setShowHashtags(false);
    
    textareaRef.current?.focus();
  };

  const extractHashtags = (text) => {
    const hashtagRegex = /#[\w]+/g;
    return text.match(hashtagRegex) || [];
  };

  const saveHashtags = async (postId, text) => {
    const hashtags = extractHashtags(text);
    
    for (const hashtag of hashtags) {
      try {
        const hashtagName = hashtag.slice(1).toLowerCase();
        
        const { data: existingHashtag } = await supabase
          .from('hashtags')
          .select('id')
          .eq('name', hashtagName)
          .single();

        let hashtagId = existingHashtag?.id;

        if (!hashtagId) {
          const { data: newHashtag } = await supabase
            .from('hashtags')
            .insert({ name: hashtagName, posts_count: 1 })
            .select()
            .single();
          
          hashtagId = newHashtag?.id;
        } else {
          await supabase.rpc('increment_hashtag_count', { hashtag_id: hashtagId });
        }

        if (hashtagId) {
          await supabase
            .from('post_hashtags')
            .insert({ post_id: postId, hashtag_id: hashtagId });
        }
      } catch (error) {
        console.error('Error saving hashtag:', error);
      }
    }
  };

  const saveMentions = async (contentId, contentType) => {
    for (const mention of mentionedUsers) {
      try {
        await supabase
          .from('mentions')
          .insert({
            content_type: contentType,
            content_id: contentId,
            mentioned_user_id: mention.id,
            mentioned_by_user_id: user.id
          });
      } catch (error) {
        console.error('Error saving mention:', error);
      }
    }
  };

  // 🔥 UPDATED: Handle submit with NEW carousel support (media_urls array)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !media && selectedMedia.length === 0) {
      setMessage("Please add some content or media");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      let createdContent;

      if (contentType === 'post') {
        const isCarousel = selectedMedia.length > 1;
        
        // 🔥 CAROUSEL UPLOAD (multiple media items)
        if (selectedMedia.length > 0) {
          const mediaUrls = [];
          const mediaTypes = [];
          const thumbnailUrls = [];

          // Upload all media files in parallel
          const uploadPromises = selectedMedia.map(async (mediaItem, index) => {
            const file = mediaItem.file;
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}_${index}.${fileExt}`;

            // Upload main file
            const { error: uploadError } = await supabase.storage
              .from('posts')
              .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from('posts')
              .getPublicUrl(fileName);

            // Upload thumbnails if available (for images)
            let thumbnailUrl = null;
            if (mediaItem.thumbnails && mediaItem.thumbnails['640x640']) {
              const thumbFileName = `${user.id}/thumbs/${Date.now()}_${index}_640.jpg`;
              const { error: thumbError } = await supabase.storage
                .from('posts')
                .upload(thumbFileName, mediaItem.thumbnails['640x640']);

              if (!thumbError) {
                const { data: { publicUrl: thumbUrl } } = supabase.storage
                  .from('posts')
                  .getPublicUrl(thumbFileName);
                thumbnailUrl = thumbUrl;
              }
            }

            return {
              url: publicUrl,
              type: mediaItem.type,
              thumbnailUrl
            };
          });

          const uploadedMedia = await Promise.all(uploadPromises);
          
          uploadedMedia.forEach(item => {
            mediaUrls.push(item.url);
            mediaTypes.push(item.type);
            if (item.thumbnailUrl) {
              thumbnailUrls.push(item.thumbnailUrl);
            }
          });

          // CREATE POST with carousel data
          const postData = {
            user_id: user.id,
            caption: content.trim() || null,
            is_carousel: isCarousel,
            media_urls: mediaUrls,
            media_types: mediaTypes,
            image_url: mediaUrls[0], // First image as cover
            media_type: isCarousel ? 'carousel' : mediaTypes[0]
          };

          // Add scheduling if set
          if (scheduledFor) {
            postData.is_draft = true;
            postData.scheduled_for = scheduledFor;
          }

          const { data: post, error: postError } = await supabase
            .from("posts")
            .insert([postData])
            .select()
            .single();

          if (postError) throw postError;
          createdContent = post;

        } else if (media) {
          // 🔥 SINGLE MEDIA UPLOAD (backward compatible)
          const fileExt = media.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('posts')
            .upload(fileName, media);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('posts')
            .getPublicUrl(fileName);

          const postData = {
            user_id: user.id,
            caption: content.trim() || null,
            image_url: publicUrl,
            media_type: 'image',
            is_carousel: false
          };

          // Add scheduling if set
          if (scheduledFor) {
            postData.is_draft = true;
            postData.scheduled_for = scheduledFor;
          }

          const { data: post, error: postError } = await supabase
            .from("posts")
            .insert([postData])
            .select()
            .single();

          if (postError) throw postError;
          createdContent = post;
        } else {
          // Text-only post
          const postData = {
            user_id: user.id,
            caption: content.trim(),
            media_type: 'text',
            is_carousel: false
          };

          // Add scheduling if set
          if (scheduledFor) {
            postData.is_draft = true;
            postData.scheduled_for = scheduledFor;
          }

          const { data: post, error: postError } = await supabase
            .from("posts")
            .insert([postData])
            .select()
            .single();

          if (postError) throw postError;
          createdContent = post;
        }

        // Save hashtags & mentions
        if (content.trim()) await saveHashtags(createdContent.id, content);
        if (mentionedUsers.length > 0) await saveMentions(createdContent.id, 'post');

      } else if (contentType === 'boltz') {
        let videoUrl = null;
        let thumbnailUrl = null;

        if (media) {
          // Compress video if needed
          setIsCompressing(true);
          setMessage("Compressing video...");
          
          const compressedVideo = await compressVideo(
            media,
            { maxSizeMB: 50, maxWidthOrHeight: 1920 },
            (progress) => {
              setCompressionProgress(progress);
            }
          );
          
          setIsCompressing(false);
          setMessage("Uploading video...");

          // Upload compressed video
          const fileExt = media.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('boltz')
            .upload(fileName, compressedVideo);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('boltz')
            .getPublicUrl(fileName);

          videoUrl = publicUrl;

          // Generate and upload thumbnail
          setMessage("Generating thumbnail...");
          try {
            const thumbnailBlob = await generateThumbnail(media, 1, { width: 640, height: 1138 });
            const thumbnailFileName = `${user.id}/${Date.now()}_thumb.jpg`;
            
            const { error: thumbUploadError } = await supabase.storage
              .from('boltz')
              .upload(thumbnailFileName, thumbnailBlob);

            if (!thumbUploadError) {
              const { data: { publicUrl: thumbPublicUrl } } = supabase.storage
                .from('boltz')
                .getPublicUrl(thumbnailFileName);
              
              thumbnailUrl = thumbPublicUrl;
            }
          } catch (thumbError) {
            console.warn('Failed to generate thumbnail:', thumbError);
            // Continue without thumbnail
          }
        }

        setMessage("Creating Boltz...");
        const { data, error } = await supabase
          .from("boltz")
          .insert([{
            user_id: user.id,
            description: content.trim() || null,
            video_url: videoUrl,
            thumbnail_url: thumbnailUrl || mediaPreview
          }])
          .select()
          .single();

        if (error) throw error;
        createdContent = data;

        if (mentionedUsers.length > 0) await saveMentions(createdContent.id, 'boltz');

      } else if (contentType === 'flash') {
        let flashMediaUrl = null;

        if (media) {
          const fileExt = media.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('flash')
            .upload(fileName, media);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('flash')
            .getPublicUrl(fileName);

          flashMediaUrl = publicUrl;
        }

        const { data, error } = await supabase
          .from("flash")
          .insert([{
            user_id: user.id,
            caption: content.trim() || null,
            media_url: flashMediaUrl,
            media_type: media?.type.startsWith('video/') ? 'video' : 'image',
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            is_close_friends: isCloseFriends
          }])
          .select()
          .single();

        if (error) throw error;
        createdContent = data;
      }

      if (scheduledFor) {
        setMessage("Post scheduled successfully! 📅");
      } else {
        setMessage("Content created successfully! 🎉");
      }
      
      // Clear draft after successful post
      if (currentDraftId) {
        try {
          const draft = drafts.find(d => d.id === currentDraftId);
          if (draft) {
            if (draft.dbId) {
              await deleteDraftFromDatabase(supabase, user.id, draft.dbId);
            }
            deleteLocalDraft(currentDraftId);
          }
        } catch (error) {
          console.error('Failed to clear draft:', error);
        }
      }
      
      setTimeout(() => {
        setContent("");
        setMedia(null);
        setMediaPreview(null);
        setSelectedMedia([]);
        setMentionedUsers([]);
        setCurrentDraftId(null);
        setStep(1);
        setMessage("");
        
        if (contentType === 'post') navigate('/home');
        else if (contentType === 'boltz') navigate('/boltz');
        else navigate('/');
      }, 1500);

    } catch (error) {
      setMessage("An error occurred. Please try again.");
      console.error('Create error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMediaAccept = () => {
    switch (contentType) {
      case 'post': return 'image/*';
      case 'boltz': return 'video/*';
      case 'flash': return 'image/*,video/*';
      default: return '*';
    }
  };

  const getMediaLabel = () => {
    switch (contentType) {
      case 'post': return 'Photo';
      case 'boltz': return 'Video';
      case 'flash': return 'Photo or Video';
      default: return 'Media';
    }
  };

  if (step === 1) {
    return (
      <motion.div className="page page-create" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="page-inner">
          <motion.div className="create-container card-surface" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <div className="create-header">
              <h1>Create Content</h1>
              <p>Choose what you want to share with the Focus community</p>
            </div>

            <div className="content-type-selector">
              {contentTypes.map((type) => (
                <motion.button
                  key={type.id}
                  className={`content-type-card ${contentType === type.id ? 'selected' : ''}`}
                  onClick={() => { setContentType(type.id); setStep(2); }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ '--accent-color': type.color }}
                >
                  <div className="content-type-icon">{type.icon}</div>
                  <h3>{type.label}</h3>
                  <p>{type.description}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div className="page page-create" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-inner">
        <motion.div className="create-container card-surface" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div className="create-header">
            <button className="back-btn" onClick={() => setStep(1)}>← Back</button>
            <h1>Create {contentTypes.find(t => t.id === contentType)?.label}</h1>
            <p>Share your {contentTypes.find(t => t.id === contentType)?.description.toLowerCase()}</p>
          </div>

          <form onSubmit={handleSubmit} className="create-form">
            {/* Drafts Section */}
            {contentType === 'post' && drafts.length > 0 && (
              <div className="drafts-section">
                <button 
                  type="button" 
                  className="drafts-toggle-btn"
                  onClick={() => setShowDrafts(!showDrafts)}
                >
                  📝 Drafts ({drafts.length})
                  <span className="toggle-icon">{showDrafts ? '▼' : '▶'}</span>
                </button>
                
                <AnimatePresence>
                  {showDrafts && (
                    <motion.div 
                      className="drafts-list"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      {drafts.map(draft => (
                        <div key={draft.id} className="draft-item">
                          <div className="draft-content" onClick={() => loadDraft(draft)}>
                            <p className="draft-caption">
                              {draft.caption?.substring(0, 60) || 'Untitled draft'}
                              {draft.caption?.length > 60 && '...'}
                            </p>
                            <div className="draft-meta">
                              <span className="draft-date">
                                {new Date(draft.lastSaved).toLocaleDateString()}
                              </span>
                              {draft.mediaUrls && draft.mediaUrls.length > 0 && (
                                <span className="draft-media-count">
                                  📷 {draft.mediaUrls.length}
                                </span>
                              )}
                              <span className={`draft-status ${draft.savedTo}`}>
                                {draft.savedTo === 'both' ? '☁️' : draft.savedTo === 'database' ? '☁️' : '💾'}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="draft-delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Delete this draft?')) {
                                deleteDraft(draft);
                              }
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="content-section">
              <div className="textarea-wrapper">
                <div className="textarea-header">
                  <label className="textarea-label">Caption</label>
                  {contentType === 'post' && autoSaveStatus && (
                    <span className="auto-save-status">{autoSaveStatus}</span>
                  )}
                </div>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleContentChange}
                  placeholder="What's happening? Use @ to mention and # for hashtags"
                  className="content-textarea"
                  rows={4}
                  maxLength={500}
                />
                
                <AnimatePresence>
                  {showMentions && mentionSuggestions.length > 0 && (
                    <motion.div className="mention-suggestions" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      {mentionSuggestions.map(u => (
                        <div key={u.id} className="mention-suggestion-item" onClick={() => selectMention(u.username, u.id)}>
                          <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.username}`} alt={u.username} />
                          <div className="mention-user-info">
                            <span className="mention-username">@{u.username}</span>
                            {u.full_name && <span className="mention-fullname">{u.full_name}</span>}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                  
                  {showHashtags && hashtagSuggestions.length > 0 && (
                    <motion.div className="hashtag-suggestions" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      {hashtagSuggestions.map((tag, index) => (
                        <div key={index} className="hashtag-suggestion-item" onClick={() => selectHashtag(tag.name)}>
                          <span className="hashtag-icon">#</span>
                          <div className="hashtag-info">
                            <span className="hashtag-name">{tag.name}</span>
                            <span className="hashtag-count">{tag.posts_count} post{tag.posts_count !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="character-count-wrapper">
                <div className={`character-count ${content.length > 450 ? 'warning' : ''} ${content.length >= 500 ? 'error' : ''}`}>
                  {content.length}/500
                </div>
                {content.length > 450 && (
                  <span className="character-warning">
                    {content.length >= 500 ? '⚠️ Maximum length reached' : `${500 - content.length} characters remaining`}
                  </span>
                )}
              </div>

              {mentionedUsers.length > 0 && (
                <div className="mentioned-users">
                  <span className="mentioned-label">Mentioned:</span>
                  {mentionedUsers.map((u, i) => (
                    <span key={i} className="mentioned-user-tag">@{u.username}</span>
                  ))}
                </div>
              )}

              {extractHashtags(content).length > 0 && (
                <div className="hashtags-preview">
                  <span className="hashtags-label">Hashtags:</span>
                  {extractHashtags(content).map((tag, i) => (
                    <span key={i} className="hashtag-tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* 🔥 MEDIA SELECTOR FOR POSTS (Carousel Support) */}
            {contentType === 'post' && (
              <MediaSelector
                selectedMedia={selectedMedia}
                onMediaChange={setSelectedMedia}
                maxItems={10}
              />
            )}

            {/* SINGLE MEDIA PREVIEW FOR BOLTZ/FLASH */}
            {contentType !== 'post' && mediaPreview && (
              <motion.div className="media-preview-container" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                {contentType === 'boltz' || media?.type.startsWith('video/') ? (
                  <video src={mediaPreview} controls className="media-preview video-preview" />
                ) : (
                  <img src={mediaPreview} alt="Preview" className="media-preview image-preview" />
                )}
                <button type="button" onClick={() => removeMedia()} className="remove-media-btn">✕</button>
              </motion.div>
            )}

            {/* 🔥 CLOSE FRIENDS TOGGLE (Flash only) */}
            {contentType === 'flash' && (
              <div className="close-friends-section">
                <div className="close-friends-toggle">
                  <div className="toggle-info">
                    <span className="toggle-label">⭐ Close Friends</span>
                    <span className="toggle-description">Share with close friends only</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={isCloseFriends}
                      onChange={(e) => setIsCloseFriends(e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                {isCloseFriends && (
                  <motion.div 
                    className="close-friends-notice"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    <span>Only your close friends will see this flash</span>
                  </motion.div>
                )}
              </div>
            )}

            <div className="create-actions">
              <div className="media-options">
                {/* Only show file input for Boltz/Flash (Posts use MediaSelector) */}
                {contentType !== 'post' && (
                  <label className="media-btn">
                    {contentType === 'boltz' ? '🎥' : '📱'} {getMediaLabel()}
                    <input
                      type="file"
                      accept={getMediaAccept()}
                      onChange={handleMediaChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
                {contentType === 'post' && (
                  <>
                    <button 
                      type="button" 
                      className="media-btn save-draft-btn"
                      onClick={saveDraftManually}
                    >
                      💾 Save Draft
                    </button>
                    <button 
                      type="button" 
                      className="media-btn schedule-btn"
                      onClick={() => setShowSchedulePicker(true)}
                    >
                      📅 Schedule
                    </button>
                  </>
                )}
                <button type="button" className="media-btn hint-btn">@ Mention</button>
                <button type="button" className="media-btn hint-btn"># Hashtag</button>
              </div>

              {scheduledFor && (
                <motion.div 
                  className="scheduled-indicator"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className="scheduled-icon">📅</span>
                  <span className="scheduled-text">
                    Scheduled for {new Date(scheduledFor).toLocaleString()}
                  </span>
                  <button 
                    type="button" 
                    className="clear-schedule-btn"
                    onClick={clearSchedule}
                  >
                    ✕
                  </button>
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={loading || (!content.trim() && !media && selectedMedia.length === 0)}
                className="btn-primary post-btn"
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner-sm"></div>
                    Creating...
                  </>
                ) : (
                  `Share ${contentTypes.find(t => t.id === contentType)?.label}`
                )}
              </motion.button>
            </div>
          </form>

          <AnimatePresence>
            {message && (
              <motion.div className={`message ${message.includes('success') || message.includes('scheduled') ? 'success-msg' : 'error-msg'}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {message}
                {isCompressing && compressionProgress > 0 && (
                  <div className="compression-progress">
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${compressionProgress}%` }}
                      />
                    </div>
                    <span className="progress-text">{Math.round(compressionProgress)}%</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Schedule Picker Modal */}
      <AnimatePresence>
        {showSchedulePicker && (
          <SchedulePicker
            onSchedule={handleSchedule}
            onCancel={() => setShowSchedulePicker(false)}
            initialDate={scheduledFor}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
