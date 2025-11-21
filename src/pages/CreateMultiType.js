
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import MediaSelector from "../components/MediaSelector";
import SchedulePicker from "../components/SchedulePicker";
import useDebounce from "../hooks/useDebounce";
import {
  saveDraftToLocal,
  saveDraftToDatabase,
  loadDraftsFromDatabase,
  deleteDraftFromDatabase,
  deleteLocalDraft,
  mergeDrafts,
  createAutoSaveManager,
} from "../utils/draftManager";
import { compressVideo, generateThumbnail } from "../utils/videoUtils";
import "./Create.css";

export default function Create({ user, userProfile }) {
  const navigate = useNavigate();
  const contentTypes = [
    { id: "post", label: "Post", icon: "📷", description: "Share photos, videos or moments", color: "#3B82F6" },
    { id: "boltz", label: "Boltz", icon: "⚡", description: "Short-form video content", color: "#EF4444" },
    { id: "flash", label: "Flash", icon: "✨", description: "24-hour stories", color: "#8B5CF6" }
  ];

  // Main state and refs
  const [contentType, setContentType] = useState("post");
  const [content, setContent] = useState("");
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(1);

  // Drafts management
  const [drafts, setDrafts] = useState([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState("");
  const autoSaveManagerRef = useRef(null);

  // Schedule
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [scheduledFor, setScheduledFor] = useState(null);

  // Flash
  const [isCloseFriends, setIsCloseFriends] = useState(false);

  // Mentions & Hashtags
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [mentionedUsers, setMentionedUsers] = useState([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showHashtags, setShowHashtags] = useState(false);
  const [hashtagSuggestions, setHashtagSuggestions] = useState([]);
  const textareaRef = useRef(null);

  // Debounced search queries
  const [mentionQuery, setMentionQuery] = useState("");
  const [hashtagQuery, setHashtagQuery] = useState("");
  const debouncedMentionQuery = useDebounce(mentionQuery, 300);
  const debouncedHashtagQuery = useDebounce(hashtagQuery, 300);

  // Compression (boltz)
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);

  // Drafts/autosave
  useEffect(() => {
    if (user && step === 2) loadDrafts();
  }, [user, step]);

  useEffect(() => {
    if (step === 2 && contentType === "post") {
      autoSaveManagerRef.current = createAutoSaveManager(handleAutoSave, 30000);
      autoSaveManagerRef.current.start();
      return () => autoSaveManagerRef.current?.stop();
    }
  }, [step, contentType]);

  useEffect(() => {
    if (autoSaveManagerRef.current && (content || selectedMedia.length > 0)) {
      autoSaveManagerRef.current.markDirty();
    }
  }, [content, selectedMedia, mentionedUsers]);

  // Debounced search effects
  useEffect(() => {
    if (debouncedMentionQuery) {
      searchUsers(debouncedMentionQuery);
    } else {
      setMentionSuggestions([]);
    }
  }, [debouncedMentionQuery]);

  useEffect(() => {
    if (debouncedHashtagQuery) {
      searchHashtags(debouncedHashtagQuery);
    } else {
      setHashtagSuggestions([]);
    }
  }, [debouncedHashtagQuery]);

  // --- Draft/AutoSave helpers ---
  async function loadDrafts() {
    try {
      const dbDrafts = await loadDraftsFromDatabase(supabase, user.id);
      const merged = mergeDrafts(dbDrafts);
      setDrafts(merged);
    } catch (err) {
      console.error("Load drafts error:", err);
    }
  }

  async function handleAutoSave() {
    if (!content.trim() && selectedMedia.length === 0) return;
    try {
      setAutoSaveStatus("Saving...");
      const draftData = {
        id: currentDraftId,
        caption: content,
        mediaUrls: selectedMedia.map((m) => m.url),
        mediaTypes: selectedMedia.map((m) => m.type),
        isCarousel: selectedMedia.length > 1,
        mentionedUsers,
        hashtags: extractHashtags(content),
        scheduledFor,
      };
      const draftId = saveDraftToLocal(draftData);
      setCurrentDraftId(draftId);
      try {
        await saveDraftToDatabase(supabase, user.id, { ...draftData, id: draftId });
        setAutoSaveStatus("Saved ✓");
      } catch {
        setAutoSaveStatus("Saved locally");
      }
      setTimeout(() => setAutoSaveStatus(""), 2000);
    } catch {
      setAutoSaveStatus("Save failed");
      setTimeout(() => setAutoSaveStatus(""), 2000);
    }
  }

  async function saveDraftManually() {
    await handleAutoSave();
  }

  function loadDraft(draft) {
    setContent(draft.caption || "");
    setCurrentDraftId(draft.id);
    setMentionedUsers(draft.mentionedUsers || []);
    if (draft.scheduledFor) setScheduledFor(draft.scheduledFor);
    setShowDrafts(false);
  }

  async function deleteDraft(draft) {
    try {
      if (draft.dbId) {
        await deleteDraftFromDatabase(supabase, user.id, draft.dbId);
      }
      deleteLocalDraft(draft.id);
      await loadDrafts();
    } catch (err) {
      console.error("Delete draft error:", err);
    }
  }

  function handleSchedule(date) {
    setScheduledFor(date);
    setShowSchedulePicker(false);
  }

  // --- FIXED: CONTENT CHANGE WITH PROPER DEBOUNCING ---
  const handleContentChange = useCallback((e) => {
    const text = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    // Update content immediately for smooth typing
    setContent(text);
    setCursorPosition(cursorPos);

    // Extract the word at cursor
    const textBeforeCursor = text.slice(0, cursorPos);
    const words = textBeforeCursor.split(/s/);
    const currentWord = words[words.length - 1];

    // Check for mentions
    if (currentWord.startsWith("@") && currentWord.length > 1) {
      const query = currentWord.slice(1);
      setMentionQuery(query);
      setShowMentions(true);
      setShowHashtags(false);
      setHashtagQuery("");
    }
    // Check for hashtags
    else if (currentWord.startsWith("#") && currentWord.length > 1) {
      const query = currentWord.slice(1);
      setHashtagQuery(query);
      setShowHashtags(true);
      setShowMentions(false);
      setMentionQuery("");
    }
    // Hide both
    else {
      setShowMentions(false);
      setShowHashtags(false);
      setMentionQuery("");
      setHashtagQuery("");
    }
  }, []);

  async function searchUsers(query) {
    try {
      const { data, error } = await supabase
        .rpc("search_users", { search_query: query, page_size: 5 });
      if (error) throw error;
      setMentionSuggestions(data || []);
    } catch (err) {
      console.error("Search users error:", err);
      setMentionSuggestions([]);
    }
  }

  async function searchHashtags(query) {
    try {
      const { data, error } = await supabase
        .from("hashtags")
        .select("name, posts_count")
        .ilike("name", `${query}%`)
        .order("posts_count", { ascending: false })
        .limit(5);
      if (error) throw error;
      setHashtagSuggestions(data || []);
    } catch (err) {
      console.error("Search hashtags error:", err);
      setHashtagSuggestions([]);
    }
  }

  function selectMention(username, userId) {
    const beforeCursor = content.slice(0, cursorPosition);
    const afterCursor = content.slice(cursorPosition);
    const beforeWords = beforeCursor.split(/s/);
    beforeWords[beforeWords.length - 1] = `@${username}`;
    const newText = beforeWords.join(" ") + " " + afterCursor;

    setContent(newText);
    setShowMentions(false);
    setMentionQuery("");
    
    if (!mentionedUsers.find((u) => u.id === userId)) {
      setMentionedUsers([...mentionedUsers, { id: userId, username }]);
    }
    
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function selectHashtag(hashtag) {
    const beforeCursor = content.slice(0, cursorPosition);
    const afterCursor = content.slice(cursorPosition);
    const beforeWords = beforeCursor.split(/s/);
    beforeWords[beforeWords.length - 1] = `#${hashtag}`;
    const newText = beforeWords.join(" ") + " " + afterCursor;

    setContent(newText);
    setShowHashtags(false);
    setHashtagQuery("");
    
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function extractHashtags(text) {
    const hashtagRegex = /#[w]+/g;
    return text.match(hashtagRegex) || [];
  }

  async function saveHashtags(postId, text) {
    const hashtags = extractHashtags(text);
    for (const hashtag of hashtags) {
      try {
        const hashtagName = hashtag.slice(1).toLowerCase();
        const { data: existingHashtag } = await supabase
          .from("hashtags")
          .select("id")
          .eq("name", hashtagName)
          .single();

        let hashtagId = existingHashtag?.id;

        if (!hashtagId) {
          const { data: newHashtag } = await supabase
            .from("hashtags")
            .insert({ name: hashtagName, posts_count: 1 })
            .select()
            .single();
          hashtagId = newHashtag?.id;
        } else {
          await supabase.rpc("increment_hashtag_count", { hashtag_id: hashtagId });
        }

        if (hashtagId) {
          await supabase.from("post_hashtags").insert({ post_id: postId, hashtag_id: hashtagId });
        }
      } catch (error) {
        console.error("Error saving hashtag:", error);
      }
    }
  }

  async function saveMentions(contentId, contentType) {
    for (const mention of mentionedUsers) {
      try {
        await supabase.from("mentions").insert({
          content_type: contentType,
          content_id: contentId,
          mentioned_user_id: mention.id,
          mentioned_by_user_id: user.id,
        });
      } catch (error) {
        console.error("Error saving mention:", error);
      }
    }
  }

  function handleMediaChange(e) {
    const file = e.target.files[0];
    if (file) {
      setMedia(file);
      const reader = new FileReader();
      reader.onloadend = () => setMediaPreview(reader.result);
      reader.readAsDataURL(file);
    }
  }

  function removeMedia() {
    setMedia(null);
    setMediaPreview(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!content.trim() && !media && selectedMedia.length === 0) {
      setMessage("⚠️ Please add some content or media");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      let createdContent;

      if (contentType === "post") {
        const isCarousel = selectedMedia.length > 1;
        if (selectedMedia.length > 0) {
          const mediaUrls = [];
          const mediaTypes = [];
          const thumbnailUrls = [];
          setMessage("📤 Uploading your media...");

          const uploadPromises = selectedMedia.map(async (mediaItem, index) => {
            const file = mediaItem.file;
            const fileExt = file.name.split(".").pop();
            const fileName = `${user.id}/${Date.now()}_${index}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
              .from("posts")
              .upload(fileName, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from("posts")
              .getPublicUrl(fileName);

            let thumbnailUrl = null;
            if (mediaItem.thumbnails && mediaItem.thumbnails["640x640"]) {
              const thumbFileName = `${user.id}/thumbs/${Date.now()}_${index}_640.jpg`;
              const { error: thumbError } = await supabase.storage
                .from("posts")
                .upload(thumbFileName, mediaItem.thumbnails["640x640"]);
              if (!thumbError) {
                const { data: { publicUrl: thumbPublicUrl } } = supabase.storage
                  .from("posts")
                  .getPublicUrl(thumbFileName);
                thumbnailUrl = thumbPublicUrl;
              }
            }
            return { url: publicUrl, type: mediaItem.type, thumbnailUrl };
          });

          const uploadedMedia = await Promise.all(uploadPromises);
          uploadedMedia.forEach((item) => {
            mediaUrls.push(item.url);
            mediaTypes.push(item.type);
            if (item.thumbnailUrl) thumbnailUrls.push(item.thumbnailUrl);
          });

          setMessage("✨ Creating your post...");
          const postData = {
            user_id: user.id,
            caption: content.trim() || null,
            is_carousel: isCarousel,
            media_urls: mediaUrls,
            media_types: mediaTypes,
            image_url: mediaUrls[0],
            media_type: isCarousel ? "carousel" : mediaTypes[0],
          };
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
          setMessage("📤 Uploading your media...");
          const fileExt = media.name.split(".").pop();
          const fileName = `${user.id}/${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from("posts").upload(fileName, media);
          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage.from("posts").getPublicUrl(fileName);
          setMessage("✨ Creating your post...");
          const postData = {
            user_id: user.id,
            caption: content.trim() || null,
            image_url: publicUrl,
            media_type: "image",
            is_carousel: false,
          };
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
          setMessage("✨ Creating your post...");
          const postData = {
            user_id: user.id,
            caption: content.trim(),
            media_type: "text",
            is_carousel: false,
          };
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

        if (content.trim()) await saveHashtags(createdContent.id, content);
        if (mentionedUsers.length > 0) await saveMentions(createdContent.id, "post");
      } else if (contentType === "boltz") {
        let videoUrl = null;
        let thumbnailUrl = null;

        if (media) {
          setIsCompressing(true);
          setMessage("🎬 Compressing video...");
          const compressedVideo = await compressVideo(
            media,
            { maxSizeMB: 50, maxWidthOrHeight: 1920 },
            (progress) => setCompressionProgress(progress)
          );
          setIsCompressing(false);

          setMessage("📤 Uploading video...");
          const fileExt = media.name.split(".").pop();
          const fileName = `${user.id}/${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from("boltz")
            .upload(fileName, compressedVideo);
          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage.from("boltz").getPublicUrl(fileName);
          videoUrl = publicUrl;

          setMessage("🖼️ Generating thumbnail...");
          try {
            const thumbnailBlob = await generateThumbnail(media, 1, { width: 640, height: 1138 });
            const thumbnailFileName = `${user.id}/${Date.now()}_thumb.jpg`;
            const { error: thumbUploadError } = await supabase.storage
              .from("boltz")
              .upload(thumbnailFileName, thumbnailBlob);
            if (!thumbUploadError) {
              const { data: { publicUrl: thumbPublicUrl } } = supabase.storage
                .from("boltz")
                .getPublicUrl(thumbnailFileName);
              thumbnailUrl = thumbPublicUrl;
            }
          } catch (thumbErr) {
            console.warn("Failed to generate thumbnail:", thumbErr);
          }
        }

        setMessage("✨ Creating Boltz...");
        const { data, error } = await supabase
          .from("boltz")
          .insert([
            {
              user_id: user.id,
              description: content.trim() || null,
              video_url: videoUrl,
              thumbnail_url: thumbnailUrl || mediaPreview,
            },
          ])
          .select()
          .single();
        if (error) throw error;
        createdContent = data;
        if (mentionedUsers.length > 0) await saveMentions(createdContent.id, "boltz");
      } else if (contentType === "flash") {
        let flashMediaUrl = null;
        if (media) {
          setMessage("📤 Uploading your Flash...");
          const fileExt = media.name.split(".").pop();
          const fileName = `${user.id}/${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from("flash").upload(fileName, media);
          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage.from("flash").getPublicUrl(fileName);
          flashMediaUrl = publicUrl;
        }

        setMessage("✨ Creating Flash...");
        const { data, error } = await supabase
          .from("flashes")
          .insert([
            {
              user_id: user.id,
              caption: content.trim() || null,
              media_url: flashMediaUrl,
              media_type: media?.type.startsWith("video/") ? "video" : "image",
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              is_close_friends: isCloseFriends,
            },
          ])
          .select()
          .single();
        if (error) throw error;
        createdContent = data;
      }

      if (scheduledFor) {
        setMessage("✅ Post scheduled successfully! 📅");
      } else {
        setMessage("🎉 Content created successfully!");
      }

      // Clear draft after successful post
      if (currentDraftId) {
        try {
          const draft = drafts.find((d) => d.id === currentDraftId);
          if (draft) {
            if (draft.dbId) await deleteDraftFromDatabase(supabase, user.id, draft.dbId);
            deleteLocalDraft(currentDraftId);
          }
        } catch (err) {
          console.error("Failed to clear draft:", err);
        }
      }

      setTimeout(() => {
        setContent("");
        setMedia(null);
        setMediaPreview(null);
        setSelectedMedia([]);
        setMentionedUsers([]);
        setCurrentDraftId(null);
        setScheduledFor(null);
        setIsCloseFriends(false);
        setStep(1);
        setMessage("");
        if (contentType === "post") navigate("/home");
        else if (contentType === "boltz") navigate("/boltz");
        else navigate("/");
      }, 1500);
    } catch (error) {
      setMessage("❌ An error occurred. Please try again.");
      console.error("Create error:", error);
    } finally {
      setLoading(false);
    }
  }

  const getMediaAccept = () => {
    switch (contentType) {
      case "post":
        return "image/*,video/*";
      case "boltz":
        return "video/*";
      case "flash":
        return "image/*,video/*";
      default:
        return "*";
    }
  };

  const getMediaLabel = () => {
    switch (contentType) {
      case "post":
        return "Add Photos";
      case "boltz":
        return "Add Video";
      case "flash":
        return "Add Media";
      default:
        return "Media";
    }
  };

  // Step 1: Select content type
  if (step === 1) {
    return (
      <motion.div
        className="page page-create"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="page-inner">
          <motion.div
            className="create-container card-surface"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="create-header">
              <h1>✨ Create & Share</h1>
              <p>Share photos, videos, or moments that inspire</p>
            </div>

            <div className="content-type-selector">
              {contentTypes.map((type) => (
                <motion.button
                  key={type.id}
                  className={`content-type-card ${
                    contentType === type.id ? "selected" : ""
                  }`}
                  onClick={() => {
                    setContentType(type.id);
                    setStep(2);
                  }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ "--accent-color": type.color }}
                >
                  <div className="content-type-icon">{type.icon}</div>
                  <h3>{type.label}</h3>
                  <p>{type.description}</p>
                  <div className="card-shimmer"></div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Step 2: Create form
  return (
    <motion.div className="page page-create" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-inner">
        <motion.div className="create-container card-surface" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div className="create-header">
            <button className="back-btn" onClick={() => setStep(1)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back
            </button>
            <h1>Create {contentTypes.find(t => t.id === contentType)?.label}</h1>
            <p>{contentTypes.find(t => t.id === contentType)?.description}</p>
          </div>

          <form onSubmit={handleSubmit} className="create-form">
            {/* Drafts Section */}
            {contentType === "post" && drafts.length > 0 && (
              <div className="drafts-section">
                <button
                  type="button"
                  className="drafts-toggle-btn"
                  onClick={() => setShowDrafts(!showDrafts)}
                >
                  <span>📝 Drafts ({drafts.length})</span>
                  <span className="toggle-icon">{showDrafts ? "▼" : "▶"}</span>
                </button>

                <AnimatePresence>
                  {showDrafts && (
                    <motion.div
                      className="drafts-list"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      {drafts.map((draft) => (
                        <div key={draft.id} className="draft-item">
                          <div className="draft-content" onClick={() => loadDraft(draft)}>
                            <p className="draft-caption">
                              {draft.caption?.substring(0, 60) || "Untitled draft"}
                              {draft.caption?.length > 60 && "..."}
                            </p>
                            <div className="draft-meta">
                              <span className="draft-date">
                                {new Date(draft.lastSaved).toLocaleDateString()}
                              </span>
                              {draft.mediaUrls && draft.mediaUrls.length > 0 && (
                                <span className="draft-media-count">📷 {draft.mediaUrls.length}</span>
                              )}
                              <span className={`draft-status ${draft.savedTo}`}>
                                {draft.savedTo === "both"
                                  ? "☁️"
                                  : draft.savedTo === "database"
                                  ? "☁️"
                                  : "💾"}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="draft-delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm("Delete this draft?")) {
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
                  {contentType === "post" && autoSaveStatus && (
                    <span className="auto-save-status">{autoSaveStatus}</span>
                  )}
                </div>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Write a caption... Use @ to mention and # for hashtags"
                  className="content-textarea"
                  rows={4}
                  maxLength={2200}
                />

                <AnimatePresence>
                  {showMentions && mentionSuggestions.length > 0 && (
                    <motion.div
                      className="mention-suggestions"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {mentionSuggestions.map((u) => (
                        <div
                          key={u.id}
                          className="mention-suggestion-item"
                          onClick={() => selectMention(u.username, u.id)}
                        >
                          <img
                            src={
                              u.avatar_url ||
                              `https://ui-avatars.com/api/?name=${u.username}&background=667eea&color=fff`
                            }
                            alt={u.username}
                          />
                          <div className="mention-user-info">
                            <span className="mention-username">@{u.username}</span>
                            {u.full_name && (
                              <span className="mention-fullname">{u.full_name}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {showHashtags && hashtagSuggestions.length > 0 && (
                    <motion.div
                      className="hashtag-suggestions"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {hashtagSuggestions.map((tag, index) => (
                        <div
                          key={index}
                          className="hashtag-suggestion-item"
                          onClick={() => selectHashtag(tag.name)}
                        >
                          <span className="hashtag-icon">#</span>
                          <div className="hashtag-info">
                            <span className="hashtag-name">{tag.name}</span>
                            <span className="hashtag-count">
                              {tag.posts_count} post
                              {tag.posts_count !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="character-count-wrapper">
                <div
                  className={`character-count ${
                    content.length > 2000 ? "warning" : ""
                  } ${content.length >= 2200 ? "error" : ""}`}
                >
                  {content.length}/2200
                </div>
                {content.length > 2000 && (
                  <span className="character-warning">
                    {content.length >= 2200
                      ? "⚠️ Maximum length reached"
                      : `${2200 - content.length} characters remaining`}
                  </span>
                )}
              </div>

              {mentionedUsers.length > 0 && (
                <div className="mentioned-users">
                  <span className="mentioned-label">Mentioned:</span>
                  {mentionedUsers.map((u, i) => (
                    <span key={i} className="mentioned-user-tag">
                      @{u.username}
                    </span>
                  ))}
                </div>
              )}

              {extractHashtags(content).length > 0 && (
                <div className="hashtags-preview">
                  <span className="hashtags-label">Hashtags:</span>
                  {extractHashtags(content).map((tag, i) => (
                    <span key={i} className="hashtag-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* MEDIA SELECTOR FOR POSTS (Carousel Support) */}
            {contentType === "post" && (
              <MediaSelector
                selectedMedia={selectedMedia}
                onMediaChange={setSelectedMedia}
                maxItems={10}
              />
            )}

            {/* SINGLE MEDIA PREVIEW FOR BOLTZ/FLASH */}
            {contentType !== "post" && mediaPreview && (
              <motion.div
                className="media-preview-container"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {contentType === "boltz" || media?.type.startsWith("video/") ? (
                  <video src={mediaPreview} controls className="media-preview video-preview" />
                ) : (
                  <img src={mediaPreview} alt="Preview" className="media-preview image-preview" />
                )}
                <button type="button" onClick={removeMedia} className="remove-media-btn">
                  ✕
                </button>
              </motion.div>
            )}

            {/* CLOSE FRIENDS TOGGLE (Flash only) */}
            {contentType === "flash" && (
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
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    <span>Only your close friends will see this flash</span>
                  </motion.div>
                )}
              </div>
            )}

            <div className="create-actions">
              <div className="media-options">
                {contentType !== "post" && (
                  <label className="media-btn">
                    {contentType === "boltz" ? "🎥" : "📱"} {getMediaLabel()}
                    <input
                      type="file"
                      accept={getMediaAccept()}
                      onChange={handleMediaChange}
                      style={{ display: "none" }}
                    />
                  </label>
                )}
                {contentType === "post" && (
                  <>
                    <button
                      type="button"
                      className="media-btn save-draft-btn"
                      onClick={saveDraftManually}
                      disabled={!content.trim() && selectedMedia.length === 0}
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
              </div>

              <motion.button
                type="submit"
                disabled={loading || (!content.trim() && !media && selectedMedia.length === 0)}
                className="btn-primary post-btn"
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner-sm"></div>
                    {isCompressing ? "Processing..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                    Share {contentTypes.find((t) => t.id === contentType)?.label}
                  </>
                )}
              </motion.button>
            </div>
          </form>

          <AnimatePresence>
            {message && (
              <motion.div
                className={`message ${
                  message.includes("success") ||
                  message.includes("scheduled") ||
                  message.includes("🎉") ||
                  message.includes("✅")
                    ? "success-msg"
                    : message.includes("❌") || message.includes("⚠️")
                    ? "error-msg"
                    : "info-msg"
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {message}
                {isCompressing && compressionProgress > 0 && (
                  <div className="compression-progress">
                    <div
                      className="progress-bar-container"
                      style={{ flex: 1, background: "rgba(0,0,0,0.1)", borderRadius: "9999px", overflow: "hidden" }}
                    >
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${compressionProgress}%`, height: "100%", background: "var(--primary-color)", borderRadius: "9999px" }}
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
