/**
 * Draft Manager - Handles saving and loading post drafts
 * Drafts are stored in both localStorage (for quick access) and database (for persistence)
 */

const DRAFT_STORAGE_KEY = 'focus_post_drafts';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

/**
 * Save draft to localStorage
 * @param {Object} draft - Draft data
 * @returns {string} - Draft ID
 */
export const saveDraftToLocal = (draft) => {
  try {
    const drafts = getLocalDrafts();
    const draftId = draft.id || `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const draftData = {
      ...draft,
      id: draftId,
      lastSaved: new Date().toISOString(),
      savedTo: 'local'
    };
    
    drafts[draftId] = draftData;
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
    
    return draftId;
  } catch (error) {
    console.error('Failed to save draft to localStorage:', error);
    return null;
  }
};

/**
 * Get all drafts from localStorage
 * @returns {Object} - Object with draft IDs as keys
 */
export const getLocalDrafts = () => {
  try {
    const draftsJson = localStorage.getItem(DRAFT_STORAGE_KEY);
    return draftsJson ? JSON.parse(draftsJson) : {};
  } catch (error) {
    console.error('Failed to load drafts from localStorage:', error);
    return {};
  }
};

/**
 * Get a specific draft from localStorage
 * @param {string} draftId - Draft ID
 * @returns {Object|null} - Draft data or null
 */
export const getLocalDraft = (draftId) => {
  const drafts = getLocalDrafts();
  return drafts[draftId] || null;
};

/**
 * Delete draft from localStorage
 * @param {string} draftId - Draft ID
 */
export const deleteLocalDraft = (draftId) => {
  try {
    const drafts = getLocalDrafts();
    delete drafts[draftId];
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
  } catch (error) {
    console.error('Failed to delete draft from localStorage:', error);
  }
};

/**
 * Clear all drafts from localStorage
 */
export const clearLocalDrafts = () => {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear drafts from localStorage:', error);
  }
};

/**
 * Save draft to database
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @param {Object} draft - Draft data
 * @returns {Promise<Object>} - Saved draft
 */
export const saveDraftToDatabase = async (supabase, userId, draft) => {
  try {
    const draftData = {
      user_id: userId,
      caption: draft.caption || null,
      media_urls: draft.mediaUrls || null,
      media_types: draft.mediaTypes || null,
      is_carousel: draft.isCarousel || false,
      is_draft: true,
      scheduled_for: draft.scheduledFor || null,
      draft_metadata: {
        mentionedUsers: draft.mentionedUsers || [],
        hashtags: draft.hashtags || [],
        localDraftId: draft.id
      }
    };

    let result;
    
    if (draft.dbId) {
      // Update existing draft
      const { data, error } = await supabase
        .from('posts')
        .update(draftData)
        .eq('id', draft.dbId)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create new draft
      const { data, error } = await supabase
        .from('posts')
        .insert([draftData])
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    // Update local draft with database ID
    if (draft.id) {
      const localDrafts = getLocalDrafts();
      if (localDrafts[draft.id]) {
        localDrafts[draft.id].dbId = result.id;
        localDrafts[draft.id].savedTo = 'both';
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(localDrafts));
      }
    }

    return result;
  } catch (error) {
    console.error('Failed to save draft to database:', error);
    throw error;
  }
};

/**
 * Load drafts from database
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of drafts
 */
export const loadDraftsFromDatabase = async (supabase, userId) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_draft', true)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to load drafts from database:', error);
    return [];
  }
};

/**
 * Delete draft from database
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @param {string} draftId - Draft ID
 */
export const deleteDraftFromDatabase = async (supabase, userId, draftId) => {
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', draftId)
      .eq('user_id', userId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Failed to delete draft from database:', error);
    throw error;
  }
};

/**
 * Merge local and database drafts
 * @param {Array} dbDrafts - Drafts from database
 * @returns {Array} - Merged drafts
 */
export const mergeDrafts = (dbDrafts) => {
  const localDrafts = getLocalDrafts();
  const merged = [];
  
  // Add database drafts
  dbDrafts.forEach(dbDraft => {
    merged.push({
      id: dbDraft.id,
      dbId: dbDraft.id,
      caption: dbDraft.caption,
      mediaUrls: dbDraft.media_urls,
      mediaTypes: dbDraft.media_types,
      isCarousel: dbDraft.is_carousel,
      scheduledFor: dbDraft.scheduled_for,
      mentionedUsers: dbDraft.draft_metadata?.mentionedUsers || [],
      hashtags: dbDraft.draft_metadata?.hashtags || [],
      lastSaved: dbDraft.updated_at,
      savedTo: 'database',
      createdAt: dbDraft.created_at
    });
  });
  
  // Add local-only drafts (not yet synced to database)
  Object.values(localDrafts).forEach(localDraft => {
    if (!localDraft.dbId) {
      merged.push(localDraft);
    }
  });
  
  // Sort by last saved date
  merged.sort((a, b) => new Date(b.lastSaved) - new Date(a.lastSaved));
  
  return merged;
};

/**
 * Create auto-save manager
 * @param {Function} saveFn - Function to call for auto-save
 * @param {number} interval - Auto-save interval in ms
 * @returns {Object} - Auto-save manager with start/stop methods
 */
export const createAutoSaveManager = (saveFn, interval = AUTO_SAVE_INTERVAL) => {
  let timer = null;
  let isDirty = false;
  
  const start = () => {
    if (timer) return;
    
    timer = setInterval(() => {
      if (isDirty) {
        saveFn();
        isDirty = false;
      }
    }, interval);
  };
  
  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };
  
  const markDirty = () => {
    isDirty = true;
  };
  
  const saveNow = () => {
    saveFn();
    isDirty = false;
  };
  
  return {
    start,
    stop,
    markDirty,
    saveNow
  };
};

/**
 * Convert draft to post data
 * @param {Object} draft - Draft object
 * @returns {Object} - Post data ready for submission
 */
export const draftToPostData = (draft) => {
  return {
    caption: draft.caption,
    mediaUrls: draft.mediaUrls,
    mediaTypes: draft.mediaTypes,
    isCarousel: draft.isCarousel,
    mentionedUsers: draft.mentionedUsers,
    hashtags: draft.hashtags,
    scheduledFor: draft.scheduledFor
  };
};
