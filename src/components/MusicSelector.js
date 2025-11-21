import React, { useEffect, useState, useRef, useCallback } from 'react';

// Custom icon components (replacing lucide-react and custom icons)
const Flame = ({ size }) => <span style={{ fontSize: size || 16 }}>🔥</span>;
const Clock = ({ size }) => <span style={{ fontSize: size || 16 }}>🕐</span>;
const Play = ({ size }) => <span style={{ fontSize: size || 16 }}>▶️</span>;
const Pause = ({ size }) => <span style={{ fontSize: size || 16 }}>⏸️</span>;
const Layers = ({ size }) => <span style={{ fontSize: size || 16 }}>📋</span>;
const X = ({ size }) => <span style={{ fontSize: size || 16 }}>✕</span>;
const Check = ({ size }) => <span style={{ fontSize: size || 16 }}>✓</span>;
const SearchIcon = ({ size }) => <span style={{ fontSize: size || 16 }}>🔍</span>;
const MusicIcon = ({ size }) => <span style={{ fontSize: size || 16 }}>🎵</span>;

/**
 * MusicSelector
 * Updated to use Jamendo API instead of curated static library.
 * Requires env var REACT_APP_JAMENDO_CLIENT_ID.
 */

// Remove curated fallback library and rely fully on API. If env missing, show error.
// Added 'Other' category for unmapped tags.
const CATEGORIES = ['All', 'Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Chill', 'Ambient', 'Other'];

// LocalStorage keys
const RECENT_KEY = 'music_recent_songs_v1';

const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return debounced;
};

function MusicSelector({ onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [category, setCategory] = useState('All');
  // Initialize songs empty; will populate from Jamendo trending fetch + searches
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recent, setRecent] = useState([]); // store ids
  const [previewing, setPreviewing] = useState(null); // song id
  const audioRef = useRef(null);
  const waveformCanvasRef = useRef(null);
  const [waveformData, setWaveformData] = useState(null);
  const previewTimeoutRef = useRef(null);

  // Load recent from storage
  useEffect(() => {
    try { setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')); } catch { setRecent([]); }
  }, []);

  // Save recent when changed
  useEffect(() => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 20)));
  }, [recent]);

  // Helper: map Jamendo track object to internal song model
  const mapJamendoTrack = useCallback((r) => {
    const tags = (r.musicinfo?.tags || '').toLowerCase();
    let category = 'Other';
    if (/hip.?hop/.test(tags)) category = 'Hip-Hop';
    else if (/rock/.test(tags)) category = 'Rock';
    else if (/electro|electronic|synth|edm/.test(tags)) category = 'Electronic';
    else if (/chill|lofi|lo-fi/.test(tags)) category = 'Chill';
    else if (/ambient|drone|atmos/.test(tags)) category = 'Ambient';
    else if (/pop/.test(tags)) category = 'Pop';
    return {
      id: `jamendo-${r.id}`,
      title: r.name,
      artist: r.artist_name,
      category,
      url: r.audio,
      bpm: r.musicinfo?.bpm || null,
      duration: r.duration,
      external: true,
      license: r.license_ccurl
    };
  }, []);

  // Fetch trending tracks on mount
  useEffect(() => {
    const CLIENT_ID = process.env.REACT_APP_JAMENDO_CLIENT_ID;
    if (!CLIENT_ID) {
      setError('Missing Jamendo client id (REACT_APP_JAMENDO_CLIENT_ID)');
      return;
    }
    setLoading(true); setError(null);
    fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=json&limit=30&order=popularity_total`)
      .then(res => res.json())
      .then(json => {
        if (json?.results) setSongs(json.results.map(mapJamendoTrack));
      })
      .catch(() => setError('Failed to load trending tracks'))
      .finally(() => setLoading(false));
  }, [mapJamendoTrack]);

  // Trending: naive top-curated (first 5) + any searched external appended.
  const trending = songs.slice(0, 5);

  // Filter by category and search
  const filtered = songs.filter(s => {
    const matchCategory = category === 'All' || s.category === category;
    const q = debouncedSearch.toLowerCase();
    const matchSearch = !q || s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q);
    return matchCategory && matchSearch;
  });

  // Fetch from Jamendo (optional) - requires client id
  const fetchExternal = useCallback(async (query) => {
    const CLIENT_ID = process.env.REACT_APP_JAMENDO_CLIENT_ID; // ensure set or skip
    if (!CLIENT_ID || !query) return;
    setLoading(true); setError(null);
    try {
      const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=json&limit=10&search=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json?.results) {
        const mapped = json.results.map(mapJamendoTrack);
        setSongs(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          return [...prev, ...mapped.filter(m => !existingIds.has(m.id))];
        });
      }
    } catch (e) { setError('Search failed'); }
    finally { setLoading(false); }
  }, [mapJamendoTrack]);

  // Trigger external search
  useEffect(() => { if (debouncedSearch.length > 2) fetchExternal(debouncedSearch); }, [debouncedSearch, fetchExternal]);

  // Start preview
  const startPreview = async (song) => {
    if (!audioRef.current) return;
    clearTimeout(previewTimeoutRef.current);
    setPreviewing(song.id);
    audioRef.current.src = song.url;
    audioRef.current.currentTime = 0;
    try { await audioRef.current.play(); } catch {}
    generateWaveform(song.url).catch(() => {});
    // Stop after 15 seconds
    previewTimeoutRef.current = setTimeout(() => stopPreview(), 15000);
  };

  const stopPreview = () => {
    clearTimeout(previewTimeoutRef.current);
    if (audioRef.current) { audioRef.current.pause(); }
    setPreviewing(null);
  };

  // Waveform generation
  const generateWaveform = async (url) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const res = await fetch(url);
      const arrBuf = await res.arrayBuffer();
      const audioBuf = await ctx.decodeAudioData(arrBuf);
      const raw = audioBuf.getChannelData(0);
      const samples = 200; // number of bars
      const blockSize = Math.floor(raw.length / samples);
      const data = [];
      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) sum += Math.abs(raw[(i * blockSize) + j]);
        data.push(sum / blockSize);
      }
      setWaveformData(data);
      drawWaveform(data);
    } catch (e) { /* ignore */ }
  };

  const drawWaveform = (data) => {
    const canvas = waveformCanvasRef.current; if (!canvas) return;
    const w = canvas.width = canvas.clientWidth || 320;
    const h = canvas.height = 60;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    const barW = w / data.length;
    data.forEach((v, i) => {
      const barH = v * h * 1.4;
      ctx.fillStyle = '#4f46e5';
      ctx.fillRect(i * barW, h - barH, barW * 0.9, barH);
    });
  };

  // Resize waveform redraw
  useEffect(() => { const onResize = () => { if (waveformData) drawWaveform(waveformData); }; window.addEventListener('resize', onResize); return () => window.removeEventListener('resize', onResize); }, [waveformData]);

  const markRecent = (id) => {
    setRecent(r => [id, ...r.filter(x => x !== id)].slice(0, 20));
  };

  const recentSongs = recent.map(id => songs.find(s => s.id === id)).filter(Boolean);

  const handleUseSong = (song) => {
    markRecent(song.id);
    if (onSelect) onSelect({
      id: song.id,
      title: song.title,
      artist: song.artist,
      url: song.url,
      bpm: song.bpm || null,
      duration: song.duration || null,
      category: song.category,
      external: !!song.external,
      license: song.license || null
    });
    if (onClose) onClose();
  };

  return (
    <div className="music-selector-container">
      <div className="music-selector-header">
        <h3><MusicIcon size={16} /> Choose Music</h3>
        <button onClick={onClose} className="ms-btn-ghost" aria-label="Close"><X size={18} /></button>
      </div>

      <div className="music-selector-search">
        <SearchIcon size={16} />
        <input
          type="text"
          placeholder="Search song or artist..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="music-selector-categories">
        {CATEGORIES.map(cat => (
          <button key={cat} className={`cat-btn ${category === cat ? 'active' : ''}`} onClick={() => setCategory(cat)}>{cat}</button>
        ))}
      </div>

      {/* Waveform preview */}
      <div className="waveform-area">
        <canvas ref={waveformCanvasRef} className="waveform-canvas" />
        {previewing && <div className="waveform-label">Previewing 15s • {previewing}</div>}
      </div>

      <div className="music-scroll">
        {/* Trending */}
        <section className="music-section">
          <div className="section-header"><Flame size={14} /> Trending</div>
          <div className="song-list">
            {trending.map(song => <SongRow key={song.id} song={song} previewing={previewing} startPreview={startPreview} stopPreview={stopPreview} useSong={handleUseSong} />)}
          </div>
        </section>

        {/* Recent */}
        {recentSongs.length > 0 && (
          <section className="music-section">
            <div className="section-header"><Clock size={14} /> Recently Used</div>
            <div className="song-list">
              {recentSongs.map(song => <SongRow key={song.id} song={song} previewing={previewing} startPreview={startPreview} stopPreview={stopPreview} useSong={handleUseSong} />)}
            </div>
          </section>
        )}

        {/* All (filtered) */}
        <section className="music-section">
          <div className="section-header"><Layers size={14} /> {loading ? 'Loading...' : 'Library'}</div>
          {error && <div className="error-msg">{error}</div>}
          <div className="song-list">
            {filtered.map(song => <SongRow key={song.id} song={song} previewing={previewing} startPreview={startPreview} stopPreview={stopPreview} useSong={handleUseSong} />)}
            {filtered.length === 0 && <div className="empty-msg">No songs found.</div>}
          </div>
        </section>
      </div>

      <audio ref={audioRef} />

      {/* Styles */}
      <style>{`
        .music-selector-container { background:#111; color:#eee; display:flex; flex-direction:column; height:100%; width:100%; max-width:420px; }
        .music-selector-header { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border-bottom:1px solid #222; }
        .music-selector-header h3 { font-size:15px; display:flex; align-items:center; gap:6px; margin:0; }
        .music-selector-search { display:flex; align-items:center; gap:6px; padding:8px 12px; border-bottom:1px solid #222; }
        .music-selector-search input { flex:1; background:#181818; border:1px solid #222; padding:6px 8px; border-radius:6px; color:#eee; font-size:13px; }
        .music-selector-categories { display:flex; gap:6px; flex-wrap:wrap; padding:8px 12px; }
        .cat-btn { background:#1d1d1d; border:1px solid #262626; color:#bbb; font-size:11px; padding:4px 8px; border-radius:14px; cursor:pointer; }
        .cat-btn.active { background:#4f46e5; color:#fff; border-color:#4f46e5; }
        .music-scroll { flex:1; overflow-y:auto; padding:6px 12px 80px; }
        .music-section { margin-bottom:16px; }
        .section-header { font-size:12px; text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; gap:6px; color:#aaa; margin-bottom:6px; }
        .song-list { display:flex; flex-direction:column; gap:4px; }
        .song-row { display:flex; align-items:center; gap:8px; background:#181818; padding:8px 10px; border-radius:8px; font-size:12px; border:1px solid #1f1f1f; }
        .song-row.active { outline:1px solid #4f46e5; }
        .song-meta { flex:1; min-width:0; }
        .song-title { font-weight:600; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .song-artist { font-size:11px; color:#888; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .song-tags { font-size:10px; color:#666; }
        .ms-btn, .ms-btn-ghost { background:#222; border:1px solid #333; color:#ddd; padding:6px 10px; font-size:11px; border-radius:6px; cursor:pointer; }
        .ms-btn-ghost { background:transparent; border:none; color:#aaa; }
        .play-btn { background:#262626; border:none; padding:6px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#ddd; }
        .use-btn { background:#4f46e5; color:#fff; border:none; padding:6px 10px; border-radius:6px; font-size:11px; cursor:pointer; }
        .error-msg { color:#f55; font-size:11px; margin:4px 0; }
        .empty-msg { font-size:11px; color:#666; padding:6px; }
        .waveform-area { padding:4px 12px; }
        .waveform-canvas { width:100%; height:60px; background:#181818; border-radius:6px; display:block; }
        .waveform-label { font-size:10px; color:#888; margin-top:4px; }
        /* Bottom sheet for mobile */
        @media (max-width: 800px) {
          .music-selector-container { position:fixed; left:0; right:0; bottom:0; max-width:none; height:70vh; border-top:1px solid #222; border-radius:20px 20px 0 0; box-shadow:0 -4px 16px rgba(0,0,0,0.4); }
        }
      `}</style>
    </div>
  );
}

function SongRow({ song, previewing, startPreview, stopPreview, useSong: onSelectSong }) {
  const isPreviewing = previewing === song.id;
  return (
    <div className={`song-row ${isPreviewing ? 'active' : ''}`}>      
      <button
        className="play-btn"
        aria-label={isPreviewing ? 'Pause preview' : 'Play preview'}
        onClick={() => isPreviewing ? stopPreview() : startPreview(song)}
      >{isPreviewing ? <Pause size={16} /> : <Play size={16} />}</button>
      <div className="song-meta">
        <div className="song-title">{song.title}</div>
        <div className="song-artist">{song.artist}</div>
        <div className="song-tags">{song.category}{song.external ? ' • Jamendo' : ''}</div>
      </div>
      <button className="use-btn" onClick={() => onSelectSong(song)} aria-label="Use this song"><Check size={14} /></button>
    </div>
  );
}

export default MusicSelector;
