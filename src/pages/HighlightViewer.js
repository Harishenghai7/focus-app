import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import './HighlightViewer.css';

export default function HighlightViewer({ user }) {
  const { highlightId } = useParams();
  const navigate = useNavigate();
  const [highlight, setHighlight] = useState(null);
  const [stories, setStories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchHighlight();
  }, [highlightId]);

  useEffect(() => {
    if (stories.length > 0) {
      // Auto-advance story every 5 seconds
      const timer = setInterval(() => {
        if (progress >= 100) {
          handleNext();
        } else {
          setProgress(prev => prev + 2);
        }
      }, 100);

      return () => clearInterval(timer);
    }
  }, [stories, currentIndex, progress]);

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
    } else {
      navigate(-1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  if (loading) {
    return <div className="highlight-viewer loading">Loading...</div>;
  }

  if (!highlight || stories.length === 0) {
    return <div className="highlight-viewer empty">No stories found</div>;
  }

  const currentStory = stories[currentIndex]?.flash;

  return (
    <div className="highlight-viewer">
      {/* Progress bars */}
      <div className="progress-bars">
        {stories.map((_, index) => (
          <div key={index} className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{
                width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="story-header">
        <div className="story-user-info">
          <img
            src={highlight.cover_url || 'https://via.placeholder.com/40'}
            alt={highlight.title}
          />
          <span>{highlight.title}</span>
        </div>
        <button className="close-story-btn" onClick={() => navigate(-1)}>
          ✕
        </button>
      </div>

      {/* Story content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="story-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {currentStory?.media_type === 'video' ? (
            <video src={currentStory.media_url} autoPlay loop />
          ) : (
            <img src={currentStory?.media_url} alt="Story" />
          )}
          {currentStory?.caption && (
            <div className="story-caption">{currentStory.caption}</div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation areas */}
      <div className="story-nav-left" onClick={handlePrevious} />
      <div className="story-nav-right" onClick={handleNext} />
    </div>
  );
}
