import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import StoryViewer from '../components/StoryViewer';
import { formatDate } from '../utils/dateFormatter';
import './HighlightViewer.css';

export default function HighlightViewer({ user }) {
  const { highlightId } = useParams();
  const navigate = useNavigate();
  const [highlight, setHighlight] = useState(null);
  const [stories, setStories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const progressRef = useRef(null);

  const STORY_DURATION = 5000; // 5 seconds per story

  useEffect(() => {
    fetchHighlight();
  }, [highlightId]);

  // Auto-advance timer with progress
  useEffect(() => {
    if (stories.length === 0 || isPaused) return;

    const startTime = Date.now();
    setProgress(0);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / STORY_DURATION) * 100;

      if (newProgress >= 100) {
        clearInterval(timerRef.current);
        handleNext();
      } else {
        setProgress(newProgress);
      }
    }, 16); // ~60fps

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentIndex, stories.length, isPaused]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'Escape') navigate(-1);
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, stories.length]);

  const fetchHighlight = async () => {
    try {
      const { data: highlightData, error: highlightError } = await supabase
        .from('highlights')
        .select('*')
        .eq('id', highlightId)
        .single();

      if (highlightError) throw highlightError;

      const { data: storiesData, error: storiesError } = await supabase
        .from('highlight_stories')
        .select(`
          *,
          flash:flash_id(*)
        `)
        .eq('highlight_id', highlightId)
        .order('position', { ascending: true });

      if (storiesError) throw storiesError;

      setHighlight(highlightData);
      setStories(storiesData || []);
    } catch (error) {
      console.error('Error fetching highlight:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
      setIsPaused(false);
    } else {
      navigate(-1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
      setIsPaused(false);
    }
  };

  const handleProgressBarClick = (index) => {
    setCurrentIndex(index);
    setProgress(0);
    setIsPaused(false);
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  if (loading) {
    return <div className="highlight-viewer loading">Loading...</div>;
  }

  if (!highlight || stories.length === 0) {
    return <div className="highlight-viewer empty">No stories found</div>;
  }

  const currentStory = stories[currentIndex];

  return (
    <div className="highlight-viewer">
      {/* Progress bars */}
      <div className="progress-bars">
        {stories.map((story, index) => (
          <div 
            key={index} 
            className="progress-bar-container"
            onClick={() => handleProgressBarClick(index)}
          >
            <div
              className="progress-bar-fill"
              style={{
                width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%',
                transition: index === currentIndex ? 'none' : 'width 0.2s ease'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="story-header">
        <div className="story-user-info">
          <div className="story-avatar">
            <img
              src={highlight.cover_url || 'https://via.placeholder.com/40'}
              alt={highlight.title}
            />
          </div>
          <div className="story-info">
            <span className="story-title">{highlight.title}</span>
            <span className="story-time">{formatDate(currentStory?.created_at)}</span>
          </div>
        </div>
        <div className="story-controls">
          <button 
            className="pause-btn" 
            onClick={togglePause}
            title={isPaused ? 'Play' : 'Pause'}
          >
            {isPaused ? (
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M8 5v14l11-7z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            )}
          </button>
          <button className="close-story-btn" onClick={() => navigate(-1)}>
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Story content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="story-content"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          {currentStory?.media_type === 'video' ? (
            <video 
              src={currentStory.media_url} 
              autoPlay 
              loop 
              muted
              playsInline
              className="story-media"
            />
          ) : (
            <img 
              src={currentStory?.media_url} 
              alt="Story" 
              className="story-media"
            />
          )}
          {currentStory?.caption && (
            <div className="story-caption">{currentStory.caption}</div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation areas */}
      <div className="story-nav-left" onClick={handlePrevious}>
        {currentIndex > 0 && (
          <div className="nav-indicator">
            <svg viewBox="0 0 24 24" width="32" height="32">
              <path fill="white" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </div>
        )}
      </div>
      <div className="story-nav-right" onClick={handleNext}>
        {currentIndex < stories.length - 1 && (
          <div className="nav-indicator">
            <svg viewBox="0 0 24 24" width="32" height="32">
              <path fill="white" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </div>
        )}
      </div>

      {/* Story counter */}
      <div className="story-counter">
        {currentIndex + 1} / {stories.length}
      </div>
    </div>
  );
}
