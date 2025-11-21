import React, { useRef, useState, useEffect, useCallback } from 'react';
import { supabase, STORAGE_BUCKETS } from '../supabaseClient';
import StickerPicker from './StickerPicker';

// Custom icon components (replacing lucide-react)
const X = () => <span>✕</span>;
const Scissors = () => <span>✂️</span>;
const SlidersHorizontal = () => <span>🎚️</span>;
const Music = () => <span>🎵</span>;
const Type = () => <span>📝</span>;
const Sticker = () => <span>😊</span>;
const Crop = () => <span>✂️</span>;
const RotateCcw = () => <span>↺</span>;
const Play = () => <span>▶️</span>;
const Save = () => <span>💾</span>;

/**
 * Basic in-browser video editor for Boltz creation.
 * Features implemented with browser primitives (Canvas + MediaRecorder):
 * 1. Trim (start/end range)
 * 2. Filters (CSS filter presets applied during render)
 * 3. Speed control (playbackRate during render)
 * 4. Music overlay (select track; mixed into stream if possible)
 * 5. Text overlay (multiple positioned caption layers)
 * 6. Stickers overlay (placed items via StickerPicker)
 * 7. Crop & Rotate (define crop rect, rotation applied during render)
 *
 * Export will render frames to Canvas and record with MediaRecorder.
 * NOTE: Heavy processing large videos can be slow; this is a baseline implementation.
 */

const FILTERS = [
  { id: 'normal', name: 'Normal', css: 'none' },
  { id: 'clarity', name: 'Clarity', css: 'contrast(1.1) saturate(1.1)' },
  { id: 'pop', name: 'Pop', css: 'contrast(1.2) saturate(1.3)' },
  { id: 'vintage', name: 'Vintage', css: 'sepia(0.4) contrast(1.05)' },
  { id: 'cool', name: 'Cool', css: 'hue-rotate(200deg) saturate(0.9)' },
  { id: 'warm', name: 'Warm', css: 'hue-rotate(320deg) saturate(1.2)' },
  { id: 'mono', name: 'Mono', css: 'grayscale(1) contrast(1.1)' },
  { id: 'vibrant', name: 'Vibrant', css: 'brightness(1.05) contrast(1.15) saturate(1.4)' },
  { id: 'soft', name: 'Soft', css: 'brightness(1.1) contrast(0.9) saturate(0.9)' },
  { id: 'dramatic', name: 'Dramatic', css: 'contrast(1.4) brightness(0.9) saturate(1.2)' }
];

const MUSIC_LIBRARY = [
  { id: 'none', name: 'None', url: null },
  { id: 'beat-1', name: 'Chill Beat', url: 'https://cdn.jsdelivr.net/gh/johnrobinsn/tech/silence.mp3' },
  { id: 'beat-2', name: 'Upbeat Loop', url: 'https://cdn.jsdelivr.net/gh/johnrobinsn/tech/silence.mp3' },
  { id: 'beat-3', name: 'Ambient Pad', url: 'https://cdn.jsdelivr.net/gh/johnrobinsn/tech/silence.mp3' }
  // Replace placeholder URLs with real music assets.
];

const SPEEDS = [0.5, 1, 2];

function VideoEditor({ file, onClose, onUploaded }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const musicRef = useRef(null);

  // State
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [filter, setFilter] = useState(FILTERS[0]);
  const [speed, setSpeed] = useState(1);
  const [selectedMusic, setSelectedMusic] = useState(MUSIC_LIBRARY[0]);
  const [textLayers, setTextLayers] = useState([]); // { id, text, x, y, size, color }
  const [stickers, setStickers] = useState([]); // { id, content, x, y, size }
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [addingText, setAddingText] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [isCropping, setIsCropping] = useState(false);
  const [rotation, setRotation] = useState(0); // degrees
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  // Load video URL
  const [videoURL] = useState(() => file ? URL.createObjectURL(file) : null);

  useEffect(() => {
    return () => {
      if (videoURL) URL.revokeObjectURL(videoURL);
    };
  }, [videoURL]);

  // Capture duration
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
    setTrimEnd(videoRef.current.duration || 0);
    // Default crop full frame after metadata
    setTimeout(() => {
      if (videoRef.current) {
        const w = videoRef.current.videoWidth;
        const h = videoRef.current.videoHeight;
        setCrop({ x: 0, y: 0, w, h });
      }
    }, 50);
  };

  // Add text layer
  const addTextLayer = (text) => {
    if (!text.trim()) return;
    setTextLayers(l => [...l, { id: Date.now(), text, x: 40, y: 40 + l.length * 40, size: 32, color: '#ffffff' }]);
    setAddingText(false);
  };

  // Add sticker selected
  const handleStickerSelect = (sticker) => {
    setStickers(s => [...s, { id: Date.now(), content: sticker.content, x: 60, y: 60 + s.length * 60, size: 64 }]);
    setShowStickerPicker(false);
  };

  // Dragging overlays (simplified - click to move by small increments)
  const nudgeLayer = (type, id, dx, dy) => {
    if (type === 'text') {
      setTextLayers(l => l.map(t => t.id === id ? { ...t, x: t.x + dx, y: t.y + dy } : t));
    } else {
      setStickers(s => s.map(st => st.id === id ? { ...st, x: st.x + dx, y: st.y + dy } : st));
    }
  };

  const updateTextProps = (id, props) => {
    setTextLayers(l => l.map(t => t.id === id ? { ...t, ...props } : t));
  };

  const updateStickerProps = (id, props) => {
    setStickers(s => s.map(st => st.id === id ? { ...st, ...props } : st));
  };

  const removeLayer = (type, id) => {
    if (type === 'text') setTextLayers(l => l.filter(t => t.id !== id));
    else setStickers(s => s.filter(st => st.id !== id));
  };

  // Crop interactions (basic click-drag rectangle)
  const cropOverlayRef = useRef(null);
  const dragState = useRef(null);

  const onCropMouseDown = (e) => {
    if (!isCropping) return;
    const rect = cropOverlayRef.current.getBoundingClientRect();
    dragState.current = { startX: e.clientX, startY: e.clientY, orig: { ...crop }, rect };
    window.addEventListener('mousemove', onCropMouseMove);
    window.addEventListener('mouseup', onCropMouseUp);
  };

  const onCropMouseMove = (e) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setCrop(c => ({ ...c, w: Math.max(50, dragState.current.orig.w + dx), h: Math.max(50, dragState.current.orig.h + dy) }));
  };

  const onCropMouseUp = () => {
    dragState.current = null;
    window.removeEventListener('mousemove', onCropMouseMove);
    window.removeEventListener('mouseup', onCropMouseUp);
  };

  // Export logic
  const handleExport = useCallback(async () => {
    if (!videoRef.current) return;
    setIsExporting(true);
    setProgress(0);
    setError(null);

    const vid = videoRef.current;
    const start = trimStart;
    const end = trimEnd;

    // Prepare canvas
    const targetW = crop.w || vid.videoWidth;
    const targetH = crop.h || vid.videoHeight;
    const canvas = canvasRef.current;
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');

    // Seek to start
    vid.currentTime = start;
    vid.playbackRate = speed;
    vid.pause();

    // Create capture stream
    const stream = canvas.captureStream(30);

    // Mix original audio (optional) and music overlay
    try {
      const videoAudioTracks = vid.captureStream().getAudioTracks();
      videoAudioTracks.forEach(t => stream.addTrack(t));
    } catch (e) {
      console.warn('Could not add video audio track', e);
    }

    if (selectedMusic.url && musicRef.current) {
      try {
        const musicTracks = musicRef.current.captureStream().getAudioTracks();
        musicTracks.forEach(t => stream.addTrack(t));
      } catch (e) {
        console.warn('Could not add music track', e);
      }
    }

    const recordedChunks = [];
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };

    const totalFrames = Math.floor(((end - start) / speed) * 30);
    let frameCount = 0;

    const renderFrame = () => {
      if (!vid || !ctx) return;
      if (vid.currentTime > end) {
        recorder.stop();
        vid.pause();
        return;
      }

      // Clear
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply rotation & draw video subsection for crop
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      try {
        ctx.filter = filter.css;
        ctx.drawImage(
          vid,
          crop.x, crop.y, crop.w, crop.h,
          0, 0, canvas.width, canvas.height
        );
      } catch (e) {
        // ignore draw errors
      }
      ctx.filter = 'none';

      // Overlays - text
      textLayers.forEach(t => {
        ctx.font = `${t.size}px sans-serif`;
        ctx.fillStyle = t.color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(t.text, t.x, t.y);
      });

      // Overlays - stickers (draw text emoji)
      stickers.forEach(s => {
        ctx.font = `${s.size}px sans-serif`;
        ctx.fillText(s.content, s.x, s.y);
      });

      ctx.restore();

      frameCount += 1;
      setProgress(Math.min(100, (frameCount / totalFrames) * 100));

      requestAnimationFrame(renderFrame);
    };

    recorder.onstop = async () => {
      try {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const editedFile = new File([blob], `edited-${Date.now()}.webm`, { type: 'video/webm' });

        // Upload to Supabase Storage
        const path = `boltz/${editedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.POSTS)
          .upload(path, editedFile, { upsert: false });
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from(STORAGE_BUCKETS.POSTS)
          .getPublicUrl(path);

        if (onUploaded) onUploaded({ path, publicUrl: publicUrlData?.publicUrl, file: editedFile });
      } catch (e) {
        console.error(e);
        setError(e.message || 'Export failed');
      } finally {
        setIsExporting(false);
      }
    };

    // Start music playback (muted initially for mixing?)
    if (selectedMusic.url && musicRef.current) {
      musicRef.current.currentTime = 0;
      musicRef.current.play().catch(() => {});
    }

    vid.playbackRate = speed;
    vid.currentTime = start;
    vid.play().catch(() => {});

    recorder.start();
    requestAnimationFrame(renderFrame);
  }, [trimStart, trimEnd, filter, speed, selectedMusic, textLayers, stickers, crop, rotation, onUploaded]);

  // UI helpers
  const formatTime = (t) => {
    if (isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="video-editor-container">
      <div className="video-editor-header">
        <h3>Boltz Video Editor</h3>
        <button onClick={onClose} aria-label="Close" className="ve-btn-ghost"><X size={18} /></button>
      </div>

      <div className="video-editor-body">
        {/* Preview Area */}
        <div className="video-editor-preview">
          {videoURL && (
            <div className="preview-wrapper">
              <video
                ref={videoRef}
                src={videoURL}
                onLoadedMetadata={handleLoadedMetadata}
                controls
                style={{
                  maxWidth: '100%',
                  filter: filter.css,
                  transform: `rotate(${rotation}deg)`,
                }}
              />
              {/* Crop overlay rectangle */}
              {crop.w > 0 && crop.h > 0 && (
                <div
                  ref={cropOverlayRef}
                  onMouseDown={onCropMouseDown}
                  className={`crop-overlay ${isCropping ? 'editing' : ''}`}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    border: '2px dashed rgba(255,255,255,0.7)',
                    pointerEvents: isCropping ? 'auto' : 'none',
                    width: '100%', // shown as full for simplicity
                    height: '100%',
                  }}
                />
              )}
            </div>
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <audio ref={musicRef} src={selectedMusic.url || undefined} preload="auto" />
        </div>

        {/* Tools Sidebar */}
        <div className="video-editor-tools">
          {/* Trim */}
          <div className="tool-group">
            <div className="tool-group-header"><Scissors size={16} /> Trim</div>
            <div className="trim-controls">
              <label>Start: {formatTime(trimStart)}
                <input
                  type="range"
                  min={0}
                  max={duration}
                  step={0.1}
                  value={trimStart}
                  onChange={(e) => setTrimStart(Math.min(Number(e.target.value), trimEnd - 0.1))}
                />
              </label>
              <label>End: {formatTime(trimEnd)}
                <input
                  type="range"
                  min={0}
                  max={duration}
                  step={0.1}
                  value={trimEnd}
                  onChange={(e) => setTrimEnd(Math.max(Number(e.target.value), trimStart + 0.1))}
                />
              </label>
            </div>
          </div>

            {/* Filters */}
          <div className="tool-group">
            <div className="tool-group-header"><SlidersHorizontal size={16} /> Filters</div>
            <div className="filter-grid">
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  className={`filter-btn ${filter.id === f.id ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                  style={{ filter: f.css }}
                >{f.name}</button>
              ))}
            </div>
          </div>

          {/* Speed */}
          <div className="tool-group">
            <div className="tool-group-header"><Play size={16} /> Speed</div>
            <div className="speed-buttons">
              {SPEEDS.map(sp => (
                <button key={sp} className={`speed-btn ${speed === sp ? 'active' : ''}`} onClick={() => setSpeed(sp)}>{sp}x</button>
              ))}
            </div>
          </div>

          {/* Music */}
          <div className="tool-group">
            <div className="tool-group-header"><Music size={16} /> Music</div>
            <select value={selectedMusic.id} onChange={(e) => setSelectedMusic(MUSIC_LIBRARY.find(m => m.id === e.target.value))}>
              {MUSIC_LIBRARY.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          {/* Text Overlay */}
          <div className="tool-group">
            <div className="tool-group-header"><Type size={16} /> Text</div>
            {!addingText && <button className="ve-btn" onClick={() => setAddingText(true)}>Add Caption</button>}
            {addingText && (
              <div className="add-text-form">
                <input type="text" placeholder="Enter text" onKeyDown={(e) => { if (e.key === 'Enter') addTextLayer(e.target.value); }} />
                <button className="ve-btn" onClick={(e) => { const input = e.target.previousSibling; addTextLayer(input.value); }}>Add</button>
              </div>
            )}
            <div className="overlay-list">
              {textLayers.map(t => (
                <div key={t.id} className="overlay-item">
                  <span>{t.text}</span>
                  <input type="color" value={t.color} onChange={(e) => updateTextProps(t.id, { color: e.target.value })} />
                  <input type="number" min={10} max={120} value={t.size} onChange={(e) => updateTextProps(t.id, { size: Number(e.target.value) })} />
                  <div className="nudge-controls">
                    <button onClick={() => nudgeLayer('text', t.id, 0, -5)}>↑</button>
                    <button onClick={() => nudgeLayer('text', t.id, 0, 5)}>↓</button>
                    <button onClick={() => nudgeLayer('text', t.id, -5, 0)}>←</button>
                    <button onClick={() => nudgeLayer('text', t.id, 5, 0)}>→</button>
                  </div>
                  <button className="remove-btn" onClick={() => removeLayer('text', t.id)}>✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Stickers */}
          <div className="tool-group">
            <div className="tool-group-header"><Sticker size={16} /> Stickers</div>
            <button className="ve-btn" onClick={() => setShowStickerPicker(true)}>Add Sticker</button>
            <div className="overlay-list">
              {stickers.map(s => (
                <div key={s.id} className="overlay-item">
                  <span style={{ fontSize: 18 }}>{s.content}</span>
                  <input type="number" min={16} max={160} value={s.size} onChange={(e) => updateStickerProps(s.id, { size: Number(e.target.value) })} />
                  <div className="nudge-controls">
                    <button onClick={() => nudgeLayer('sticker', s.id, 0, -5)}>↑</button>
                    <button onClick={() => nudgeLayer('sticker', s.id, 0, 5)}>↓</button>
                    <button onClick={() => nudgeLayer('sticker', s.id, -5, 0)}>←</button>
                    <button onClick={() => nudgeLayer('sticker', s.id, 5, 0)}>→</button>
                  </div>
                  <button className="remove-btn" onClick={() => removeLayer('sticker', s.id)}>✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Crop & Rotate */}
          <div className="tool-group">
            <div className="tool-group-header"><Crop size={16} /> Crop</div>
            <button className={`ve-btn ${isCropping ? 'active' : ''}`} onClick={() => setIsCropping(v => !v)}>
              {isCropping ? 'Finish Crop' : 'Adjust Crop'}
            </button>
            <div className="tool-group-header" style={{ marginTop: 8 }}><RotateCcw size={16} /> Rotate</div>
            <input type="range" min={0} max={359} value={rotation} onChange={(e) => setRotation(Number(e.target.value))} />
          </div>

          {/* Export */}
          <div className="tool-group">
            <div className="tool-group-header"><Save size={16} /> Export</div>
            <button className="ve-btn-primary" disabled={isExporting} onClick={handleExport}>{isExporting ? 'Exporting...' : 'Save & Upload'}</button>
            {isExporting && <div className="export-progress">Progress: {progress.toFixed(0)}%</div>}
            {error && <div className="error-msg">{error}</div>}
          </div>
        </div>
      </div>

      {/* Bottom timeline scrubber */}
      <div className="video-editor-timeline">
        <input
          type="range"
          min={trimStart}
          max={trimEnd}
          step={0.05}
          value={videoRef.current ? videoRef.current.currentTime : 0}
          onChange={(e) => { if (videoRef.current) videoRef.current.currentTime = Number(e.target.value); }}
          style={{ width: '100%' }}
        />
        <div className="timeline-meta">
          <span>{formatTime(videoRef.current ? videoRef.current.currentTime : 0)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Sticker Picker Modal */}
      {showStickerPicker && (
        <div className="ve-modal">
          <div className="ve-modal-content">
            <StickerPicker onSelect={handleStickerSelect} onClose={() => setShowStickerPicker(false)} context="story" />
          </div>
        </div>
      )}

      {/* Basic styles (could move to CSS file) */}
      <style>{`
        .video-editor-container { display: flex; flex-direction: column; height: 100%; background:#111; color:#fff; }
        .video-editor-header { display:flex; justify-content:space-between; align-items:center; padding:8px 12px; border-bottom:1px solid #222; }
        .video-editor-body { flex:1; display:flex; min-height:0; }
        .video-editor-preview { flex:1; position:relative; display:flex; align-items:center; justify-content:center; padding:12px; }
        .preview-wrapper { position:relative; }
        .video-editor-tools { width:320px; overflow-y:auto; padding:12px; border-left:1px solid #222; display:flex; flex-direction:column; gap:16px; }
        .tool-group { background:#181818; padding:8px 10px; border-radius:8px; }
        .tool-group-header { display:flex; align-items:center; gap:6px; font-size:13px; font-weight:600; margin-bottom:6px; color:#ddd; }
        .trim-controls label { display:flex; flex-direction:column; font-size:12px; margin-bottom:4px; }
        .filter-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(80px,1fr)); gap:6px; }
        .filter-btn { background:#222; border:1px solid #333; padding:6px; border-radius:6px; font-size:11px; cursor:pointer; color:#ddd; }
        .filter-btn.active { outline:2px solid #4f46e5; }
        .speed-buttons { display:flex; gap:6px; }
        .speed-btn { flex:1; background:#222; border:1px solid #333; padding:6px; border-radius:6px; cursor:pointer; }
        .speed-btn.active { background:#4f46e5; }
        .ve-btn, .ve-btn-primary, .ve-btn-ghost { background:#222; border:1px solid #333; color:#ddd; padding:6px 10px; font-size:12px; border-radius:6px; cursor:pointer; }
        .ve-btn-primary { background:#4f46e5; border-color:#4f46e5; }
        .ve-btn-primary:disabled { opacity:0.5; cursor:default; }
        .ve-btn-ghost { background:transparent; border:none; color:#aaa; }
        .overlay-list { display:flex; flex-direction:column; gap:6px; margin-top:6px; }
        .overlay-item { background:#222; padding:6px; border-radius:6px; font-size:11px; display:flex; flex-wrap:wrap; align-items:center; gap:6px; }
        .overlay-item input[type='number'] { width:60px; }
        .nudge-controls { display:flex; gap:2px; }
        .nudge-controls button { background:#333; border:none; color:#ccc; padding:2px 6px; font-size:11px; cursor:pointer; border-radius:4px; }
        .remove-btn { background:#331; border:none; color:#f55; cursor:pointer; padding:4px 6px; border-radius:4px; }
        .video-editor-timeline { padding:8px 12px; border-top:1px solid #222; display:flex; flex-direction:column; gap:4px; }
        .timeline-meta { display:flex; justify-content:space-between; font-size:11px; color:#aaa; }
        .export-progress { font-size:11px; margin-top:6px; }
        .error-msg { color:#f55; font-size:12px; margin-top:4px; }
        .ve-modal { position:fixed; inset:0; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:1000; }
        .ve-modal-content { background:#181818; padding:12px; border-radius:12px; max-height:80vh; overflow:auto; width:420px; }
        @media (max-width: 900px) {
          .video-editor-body { flex-direction:column; }
          .video-editor-tools { width:100%; order:2; flex-direction:row; flex-wrap:wrap; }
          .tool-group { flex:1 1 46%; }
        }
      `}</style>
    </div>
  );
}

export default VideoEditor;
