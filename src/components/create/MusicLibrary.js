/**
 * MusicLibrary Component
 * Browse, search, and select music for posts and Boltz
 */

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import './MusicLibrary.css';

const MusicLibrary = ({ onSelect, selectedMusic, onClose }) => {
  const [music, setMusic] = useState([]);
  const [filteredMusic, setFilteredMusic] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [playing, setPlaying] = useState(null);
  const audioRef = useRef(null);

  const categories = [
    { id: 'all', label: 'All', icon: '🎵' },
    { id: 'trending', label: 'Trending', icon: '🔥' },
    { id: 'pop', label: 'Pop', icon: '🎤' },
    { id: 'hip-hop', label: 'Hip Hop', icon: '🎧' },
    { id: 'rock', label: 'Rock', icon: '🎸' },
    { id: 'electronic', label: 'Electronic', icon: '🎹' },
    { id: 'indie', label: 'Indie', icon: '🎼' },
    { id: 'classical', label: 'Classical', icon: '🎻' },
    { id: 'jazz', label: 'Jazz', icon: '🎺' },
    { id: 'country', label: 'Country', icon: '🤠' },
  ];

  // Fetch music from database
  useEffect(() => {
    fetchMusic();
  }, []);

  const fetchMusic = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('music_library')
        .select('*')
        .order('plays', { ascending: false })
        .limit(100);

      if (error) throw error;

      setMusic(data || []);
      setFilteredMusic(data || []);
    } catch (error) {
      console.error('Error fetching music:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter music by search and category
  useEffect(() => {
    let filtered = music;

    // Filter by category
    if (category !== 'all') {
      filtered = filtered.filter(track => 
        track.genre?.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(track =>
        track.title?.toLowerCase().includes(query) ||
        track.artist?.toLowerCase().includes(query) ||
        track.album?.toLowerCase().includes(query)
      );
    }

    setFilteredMusic(filtered);
  }, [music, category, searchQuery]);

  // Play/pause preview
  const togglePlay = async (track) => {
    if (playing === track.id) {
      audioRef.current?.pause();
      setPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = track.preview_url || track.url;
        try {
          await audioRef.current.play();
          setPlaying(track.id);
        } catch (error) {
          console.error('Error playing audio:', error);
        }
      }
    }
  };

  // Handle track selection
  const handleSelect = (track) => {
    onSelect(track);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlaying(null);
  };

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="music-library">
      <div className="music-library-header">
        <h2>Choose Music</h2>
        <button className="music-library-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      {/* Search Bar */}
      <div className="music-search-bar">
        <span className="music-search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search songs, artists, albums..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="music-search-input"
        />
        {searchQuery && (
          <button
            className="music-search-clear"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="music-categories">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`music-category ${category === cat.id ? 'active' : ''}`}
            onClick={() => setCategory(cat.id)}
          >
            <span className="music-category-icon">{cat.icon}</span>
            <span className="music-category-label">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Music List */}
      <div className="music-list">
        {loading ? (
          <div className="music-loading">
            <div className="music-loading-spinner"></div>
            <p>Loading music library...</p>
          </div>
        ) : filteredMusic.length === 0 ? (
          <div className="music-empty">
            <span className="music-empty-icon">🎵</span>
            <p>No music found</p>
            <p className="music-empty-subtitle">Try a different search or category</p>
          </div>
        ) : (
          filteredMusic.map((track) => (
            <div
              key={track.id}
              className={`music-track ${selectedMusic?.id === track.id ? 'selected' : ''} ${playing === track.id ? 'playing' : ''}`}
            >
              {/* Album Art */}
              <div className="music-track-art">
                {track.album_art ? (
                  <img src={track.album_art} alt={track.title} />
                ) : (
                  <div className="music-track-art-placeholder">🎵</div>
                )}
                {playing === track.id && (
                  <div className="music-track-playing-indicator">
                    <div className="music-wave"></div>
                    <div className="music-wave"></div>
                    <div className="music-wave"></div>
                  </div>
                )}
              </div>

              {/* Track Info */}
              <div className="music-track-info">
                <div className="music-track-title">{track.title}</div>
                <div className="music-track-artist">{track.artist}</div>
                {track.duration && (
                  <div className="music-track-duration">
                    {formatDuration(track.duration)}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="music-track-actions">
                <button
                  className="music-track-play"
                  onClick={() => togglePlay(track)}
                  aria-label={playing === track.id ? 'Pause' : 'Play preview'}
                >
                  {playing === track.id ? '⏸️' : '▶️'}
                </button>
                <button
                  className={`music-track-select ${selectedMusic?.id === track.id ? 'selected' : ''}`}
                  onClick={() => handleSelect(track)}
                  aria-label="Select music"
                >
                  {selectedMusic?.id === track.id ? '✓ Selected' : 'Select'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Audio Player (hidden) */}
      <audio
        ref={audioRef}
        onEnded={() => setPlaying(null)}
        onError={() => setPlaying(null)}
      />

      {/* Selected Music Preview */}
      {selectedMusic && (
        <div className="music-selected-preview">
          <div className="music-selected-info">
            <span className="music-selected-icon">🎵</span>
            <div>
              <div className="music-selected-title">{selectedMusic.title}</div>
              <div className="music-selected-artist">{selectedMusic.artist}</div>
            </div>
          </div>
          <button
            className="music-selected-remove"
            onClick={() => onSelect(null)}
            aria-label="Remove music"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
};

export default MusicLibrary;
