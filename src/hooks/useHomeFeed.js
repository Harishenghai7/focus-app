import { useEffect, useState, useCallback } from 'react';
import { fetchHomePosts } from '../services/postService';
import { fetchFlashStories } from '../services/flashService';
import { fetchBoltzPreview } from '../services/boltzService';

export const useHomeFeed = (userId) => {
  const [posts, setPosts] = useState([]);
  const [flash, setFlash] = useState([]);
  const [boltz, setBoltz] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHomeFeed = useCallback(async () => {
    setLoading(true);
    setError(null);

    // POSTS (critical)
    try {
      const postData = await fetchHomePosts(userId);
      setPosts(postData);
    } catch (err) {
      console.error('❌ Posts load failed:', err);
      setError('Failed to load posts');
    }

    // FLASH (non-blocking)
    try {
      const flashData = await fetchFlashStories();
      setFlash(flashData);
    } catch (err) {
      console.warn('⚠️ Flash load failed:', err);
      setFlash([]);
    }

    // BOLTZ (non-blocking)
    try {
      const boltzData = await fetchBoltzPreview();
      setBoltz(boltzData);
    } catch (err) {
      console.warn('⚠️ Boltz load failed:', err);
      setBoltz([]);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    loadHomeFeed();
  }, [userId, loadHomeFeed]);

  return {
    posts,
    flash,
    boltz,
    loading,
    error,
    refresh: loadHomeFeed
  };
};
