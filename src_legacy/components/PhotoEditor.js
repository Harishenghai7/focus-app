import React, { useState, useRef, useEffect } from 'react';

// Custom icon components (replacing lucide-react)
const Crop = () => <span>✂️</span>;
const Sliders = () => <span>🎚️</span>;
const Type = () => <span>📝</span>;
const Sticker = () => <span>😊</span>;
const Pencil = () => <span>✏️</span>;
const ArrowRight = () => <span>→</span>;
const ChevronLeft = () => <span>‹</span>;
const ChevronRight = () => <span>›</span>;
const Layers = () => <span>📋</span>;

/**
 * PhotoEditor Component
 * Supports: Crop (square, 4:5, 16:9, original), Filters (15 presets), Adjustments,
 * Text overlay, Stickers, Simple Draw/Markup, Multi-image navigation.
 *
 * Props:
 *  - images: Array<string|File|Blob> (URLs or File objects)
 *  - onComplete(editedBlobs: Array<Blob>)
 *  - onCancel()
 *
 * No external dependencies – uses native canvas for export.
 */
export default function PhotoEditor({ images = [], onComplete, onCancel }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tool, setTool] = useState('crop'); // crop | filter | adjust | text | stickers | draw
  const [aspect, setAspect] = useState('original');
  const [cropRect, setCropRect] = useState({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 }); // normalized
  const [dragging, setDragging] = useState(false);
  const [filters, setFilters] = useState({ preset: 'Original' });
  const [adjust, setAdjust] = useState({ brightness: 100, contrast: 100, saturation: 100, warmth: 0 });
  const [texts, setTexts] = useState([]); // [{id, text, x,y,size,color}]
  const [stickers, setStickers] = useState([]); // same shape but sticker
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const [drawPaths, setDrawPaths] = useState([]); // [{color, size, points:[{x,y}]}]
  const [activeColor, setActiveColor] = useState('#ffffff');
  const [activeSize, setActiveSize] = useState(6);
  const [isDrawing, setIsDrawing] = useState(false);
  const previewRef = useRef(null);
  const drawCanvasRef = useRef(null);
  const fileCacheRef = useRef({});

  // Filter presets (CSS filter chains)
  const FILTER_PRESETS = [
    { name: 'Original', value: '' },
    { name: 'Warm Glow', value: 'brightness(1.05) contrast(1.05) saturate(1.1) sepia(0.15)' },
    { name: 'Cool Fade', value: 'brightness(1.05) contrast(0.9) saturate(0.8) hue-rotate(200deg)' },
    { name: 'Vivid', value: 'contrast(1.15) saturate(1.4)' },
    { name: 'Mono', value: 'grayscale(1) contrast(1.1)' },
    { name: 'Retro', value: 'sepia(0.5) contrast(1.1) brightness(1.05)' },
    { name: 'Soft', value: 'brightness(1.1) contrast(0.9) saturate(0.9)' },
    { name: 'Dream', value: 'brightness(1.15) blur(1px) saturate(1.2)' },
    { name: 'Film', value: 'contrast(1.2) saturate(0.9) sepia(0.35)' },
    { name: 'Matte', value: 'contrast(0.85) brightness(1.1)' },
    { name: 'Night', value: 'brightness(0.8) contrast(1.2) saturate(0.9)' },
    { name: 'Gold', value: 'sepia(0.8) contrast(1.05)' },
    { name: 'Lush', value: 'saturate(1.6) contrast(1.1)' },
    { name: 'Ocean', value: 'saturate(1.2) hue-rotate(160deg)' },
    { name: 'Pop', value: 'contrast(1.25) saturate(1.3) brightness(1.05)' }
  ];

  // Convert File/Blob to object URL
  const getImageURL = (img) => {
    if (typeof img === 'string') return img;
    if (fileCacheRef.current[img]) return fileCacheRef.current[img];
    const url = URL.createObjectURL(img);
    fileCacheRef.current[img] = url;
    return url;
  };

  useEffect(() => () => { // cleanup URLs
    Object.values(fileCacheRef.current).forEach(URL.revokeObjectURL);
  }, []);

  // Crop dragging/resizing
  const startDrag = (e) => {
    setDragging(true);
    previewRef.current.dataset.dragOriginX = e.clientX;
    previewRef.current.dataset.dragOriginY = e.clientY;
    previewRef.current.dataset.orig = JSON.stringify(cropRect);
  };
  const onDrag = (e) => {
    if (!dragging) return;
    const rect = previewRef.current.getBoundingClientRect();
    const orig = JSON.parse(previewRef.current.dataset.orig);
    const dx = (e.clientX - parseFloat(previewRef.current.dataset.dragOriginX)) / rect.width;
    const dy = (e.clientY - parseFloat(previewRef.current.dataset.dragOriginY)) / rect.height;
    let x = Math.min(Math.max(orig.x + dx, 0), 1 - orig.w);
    let y = Math.min(Math.max(orig.y + dy, 0), 1 - orig.h);
    setCropRect({ ...orig, x, y });
  };
  const endDrag = () => setDragging(false);

  useEffect(() => {
    const handleDrag = (e) => {
      if (!dragging) return;
      const rect = previewRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dx = e.clientX / rect.width;
      const dy = e.clientY / rect.height;
      setCropRect(prev => ({
        ...prev,
        w: Math.max(0.1, Math.min(1 - prev.x, dx - prev.x)),
        h: Math.max(0.1, Math.min(1 - prev.y, dy - prev.y))
      }));
    };
    
    const handleEndDrag = () => setDragging(false);
    
    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', handleEndDrag);
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleEndDrag);
    };
  }, [dragging]);

  // Maintain aspect ratio while resizing through quick presets
  useEffect(() => {
    if (aspect === 'original') return;
    setCropRect(prev => {
      const ratioMap = { square: 1, '4:5': 4/5, '16:9': 16/9 };
      const target = ratioMap[aspect];
      if (!target) return prev;
      // Adjust width/height keeping center
      const centerX = prev.x + prev.w/2;
      const centerY = prev.y + prev.h/2;
      let w, h;
      if (prev.w / prev.h > target) { // too wide
        h = prev.h;
        w = h * target;
      } else {
        w = prev.w;
        h = w / target;
      }
      w = Math.min(w, 1); h = Math.min(h, 1);
      const x = Math.min(Math.max(centerX - w/2, 0), 1 - w);
      const y = Math.min(Math.max(centerY - h/2, 0), 1 - h);
      return { x, y, w, h };
    });
  }, [aspect]);

  // Add text overlay
  const addText = () => {
    const val = prompt('Enter text');
    if (!val) return;
    setTexts(t => [...t, { id: Date.now(), text: val, x: 0.5, y: 0.5, size: 32, color: '#ffffff' }]);
  };
  // Simple reposition text by click
  const moveText = (id, e) => {
    const rect = previewRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTexts(ts => ts.map(t => t.id === id ? { ...t, x, y } : t));
  };

  // Stickers (basic emoji set)
  const STICKER_SET = ['🔥','⭐','💎','🎵','⚡','🌙','🌟','❤️','🚀','😎'];
  const addSticker = (s) => setStickers(st => [...st, { id: Date.now()+Math.random(), text: s, x: 0.2, y: 0.2, size: 48 }]);
  const moveSticker = (id, e) => {
    const rect = previewRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setStickers(st => st.map(t => t.id === id ? { ...t, x, y } : t));
  };

  // Drawing
  const handleDrawDown = (e) => {
    if (!drawingEnabled) return;
    setIsDrawing(true);
    const rect = previewRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setDrawPaths(p => [...p, { color: activeColor, size: activeSize, points: [{x,y}] }]);
  };
  const handleDrawMove = (e) => {
    if (!isDrawing) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setDrawPaths(p => {
      const last = p[p.length - 1];
      last.points.push({x,y});
      return [...p.slice(0, -1), last];
    });
  };
  const handleDrawUp = () => setIsDrawing(false);
  useEffect(() => {
    const handleMove = (e) => {
      if (!isDrawing) return;
      const rect = previewRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setDrawPaths(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1].points.push({ x, y });
        }
        return updated;
      });
    };
    
    const handleUp = () => setIsDrawing(false);
    
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDrawing]);

  // Build effective filter string
  const effectiveFilter = () => {
    const preset = FILTER_PRESETS.find(f => f.name === filters.preset)?.value || '';
    const adj = `brightness(${adjust.brightness/100}) contrast(${adjust.contrast/100}) saturate(${adjust.saturation/100}) hue-rotate(${adjust.warmth}deg)`;
    return `${preset} ${adj}`.trim();
  };

  // Export all images with overlays
  const handleNext = async () => {
    const outputs = [];
    for (let i = 0; i < images.length; i++) {
      const url = getImageURL(images[i]);
      const imgEl = await loadImage(url);
      // Compute crop relative
      const { x,y,w,h } = cropRect; // using same crop for all – can be extended per-image
      const cw = imgEl.width * w;
      const ch = imgEl.height * h;
      const cx = imgEl.width * x;
      const cy = imgEl.height * y;
      const canvas = document.createElement('canvas');
      canvas.width = cw; canvas.height = ch;
      const ctx = canvas.getContext('2d');
      // Apply filter by drawing onto offscreen if needed
      ctx.filter = effectiveFilter();
      ctx.drawImage(imgEl, cx, cy, cw, ch, 0, 0, cw, ch);
      // Overlays (texts)
      texts.forEach(t => {
        ctx.filter = 'none';
        ctx.fillStyle = t.color;
        ctx.font = `${t.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.text, t.x * cw, t.y * ch);
      });
      // Stickers
      stickers.forEach(s => {
        ctx.filter = 'none';
        ctx.font = `${s.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.text, s.x * cw, s.y * ch);
      });
      // Draw paths
      drawPaths.forEach(path => {
        ctx.filter = 'none';
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.size;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        path.points.forEach((pt, idx) => {
          const px = pt.x * cw;
          const py = pt.y * ch;
          if (idx === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
        ctx.stroke();
      });
      const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.9));
      outputs.push(blob);
    }
    if (onComplete) onComplete(outputs);
  };

  const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  const currentURL = getImageURL(images[currentIndex]);

  return (
    <div className="photo-editor-root">
      <div className="pe-header">
        <div className="pe-nav">
          <button className="pe-btn" disabled={currentIndex===0} onClick={()=>setCurrentIndex(i=>Math.max(0,i-1))}><ChevronLeft size={18}/></button>
          <span className="pe-count">{currentIndex+1} / {images.length}</span>
          <button className="pe-btn" disabled={currentIndex===images.length-1} onClick={()=>setCurrentIndex(i=>Math.min(images.length-1,i+1))}><ChevronRight size={18}/></button>
        </div>
        <div className="pe-actions">
          <button className="pe-next" onClick={handleNext}><ArrowRight size={16}/> Next</button>
          <button className="pe-cancel" onClick={onCancel}>Cancel</button>
        </div>
      </div>

      <div
        className="pe-preview"
        ref={previewRef}
        onMouseDown={(e)=>{ if(tool==='crop') startDrag(e); if(tool==='draw') handleDrawDown(e); }}
        style={{ cursor: tool==='crop' ? 'move' : tool==='draw' ? 'crosshair' : 'default' }}
      >
        <div className="pe-image-wrapper">
          <img src={currentURL} alt="edit" className="pe-image" style={{ filter: effectiveFilter() }}/>
          {/* Crop overlay */}
          {tool==='crop' && (
            <div
              className="pe-crop-rect"
              style={{ left:`${cropRect.x*100}%`, top:`${cropRect.y*100}%`, width:`${cropRect.w*100}%`, height:`${cropRect.h*100}%` }}
            />
          )}
          {/* Texts */}
          {texts.map(t => (
            <div
              key={t.id}
              className="pe-text-item"
              onClick={(e)=>tool==='text' && moveText(t.id,e)}
              style={{ left:`${t.x*100}%`, top:`${t.y*100}%`, fontSize:t.size, color:t.color, transform:'translate(-50%, -50%)' }}
            >{t.text}</div>
          ))}
          {/* Stickers */}
          {stickers.map(s => (
            <div
              key={s.id}
              className="pe-sticker-item"
              onClick={(e)=>tool==='stickers' && moveSticker(s.id,e)}
              style={{ left:`${s.x*100}%`, top:`${s.y*100}%`, fontSize:s.size, transform:'translate(-50%, -50%)' }}
            >{s.text}</div>
          ))}
          {/* Drawing canvas mimic (paths rendered as svg overlay) */}
          <svg className="pe-draw-layer">
            {drawPaths.map((p,i)=> (
              <polyline
                key={i}
                points={p.points.map(pt=>`${pt.x*100},${pt.y*100}`).join(' ')}
                stroke={p.color}
                strokeWidth={p.size}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Toolbars */}
      <div className="pe-toolbar">
        <div className="pe-tool-buttons">
          <ToolButton active={tool==='crop'} icon={<Crop size={16}/>} label="Crop" onClick={()=>setTool('crop')} />
          <ToolButton active={tool==='filter'} icon={<Layers size={16}/>} label="Filters" onClick={()=>setTool('filter')} />
            <ToolButton active={tool==='adjust'} icon={<Sliders size={16}/>} label="Adjust" onClick={()=>setTool('adjust')} />
          <ToolButton active={tool==='text'} icon={<Type size={16}/>} label="Text" onClick={()=>setTool('text')} />
          <ToolButton active={tool==='stickers'} icon={<Sticker size={16}/>} label="Stickers" onClick={()=>setTool('stickers')} />
          <ToolButton active={tool==='draw'} icon={<Pencil size={16}/>} label="Draw" onClick={()=>{ setTool('draw'); setDrawingEnabled(true); }} />
        </div>
        <div className="pe-tool-panel">
          {tool==='crop' && (
            <div className="pe-crop-panel">
              <AspectButton current={aspect} setAspect={setAspect} value="original" label="Original" />
              <AspectButton current={aspect} setAspect={setAspect} value="square" label="1:1" />
              <AspectButton current={aspect} setAspect={setAspect} value="4:5" label="4:5" />
              <AspectButton current={aspect} setAspect={setAspect} value="16:9" label="16:9" />
            </div>
          )}
          {tool==='filter' && (
            <div className="pe-filter-panel">
              {FILTER_PRESETS.map(fp => (
                <button key={fp.name} className={`pe-filter-btn ${filters.preset===fp.name?'active':''}`} onClick={()=>setFilters({preset:fp.name})}>{fp.name}</button>
              ))}
            </div>
          )}
          {tool==='adjust' && (
            <div className="pe-adjust-panel">
              <SliderControl label="Brightness" value={adjust.brightness} min={0} max={200} onChange={v=>setAdjust(a=>({...a,brightness:v}))} />
              <SliderControl label="Contrast" value={adjust.contrast} min={0} max={200} onChange={v=>setAdjust(a=>({...a,contrast:v}))} />
              <SliderControl label="Saturation" value={adjust.saturation} min={0} max={300} onChange={v=>setAdjust(a=>({...a,saturation:v}))} />
              <SliderControl label="Warmth" value={adjust.warmth} min={-180} max={180} onChange={v=>setAdjust(a=>({...a,warmth:v}))} />
            </div>
          )}
          {tool==='text' && (
            <div className="pe-text-panel">
              <button className="pe-btn-secondary" onClick={addText}>Add Text</button>
              <div className="pe-text-items">Click text inside preview to reposition.</div>
            </div>
          )}
          {tool==='stickers' && (
            <div className="pe-sticker-panel">
              {STICKER_SET.map(s => (
                <button key={s} className="pe-sticker-btn" onClick={()=>addSticker(s)}>{s}</button>
              ))}
              <div className="pe-hint">Click sticker in preview to move.</div>
            </div>
          )}
          {tool==='draw' && (
            <div className="pe-draw-panel">
              <div className="pe-row">
                <label>Color</label>
                <input type="color" value={activeColor} onChange={e=>setActiveColor(e.target.value)} />
              </div>
              <div className="pe-row">
                <label>Size</label>
                <input type="range" min={1} max={40} value={activeSize} onChange={e=>setActiveSize(parseInt(e.target.value,10))} />
                <span>{activeSize}px</span>
              </div>
              <button className="pe-btn-secondary" onClick={()=>{ setDrawPaths([]); }}>Clear</button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .photo-editor-root { display:flex; flex-direction:column; gap:12px; background:#0f0f12; color:#eee; padding:16px; border-radius:20px; max-width:900px; margin:0 auto; }
        .pe-header { display:flex; align-items:center; justify-content:space-between; }
        .pe-nav { display:flex; align-items:center; gap:8px; }
        .pe-btn { background:#1e1e22; border:1px solid #26262b; color:#eee; padding:6px 10px; border-radius:8px; cursor:pointer; font-size:12px; }
        .pe-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .pe-count { font-size:12px; color:#999; }
        .pe-next { background:linear-gradient(135deg,#667eea,#764ba2); border:none; color:#fff; padding:8px 16px; font-size:13px; font-weight:600; border-radius:10px; cursor:pointer; display:flex; align-items:center; gap:6px; }
        .pe-cancel { background:#222; border:1px solid #333; color:#bbb; padding:8px 14px; border-radius:10px; cursor:pointer; font-size:12px; }
        .pe-preview { position:relative; width:100%; aspect-ratio: 4/5; background:#111; border:1px solid #222; border-radius:16px; overflow:hidden; }
        .pe-image-wrapper { position:relative; width:100%; height:100%; }
        .pe-image { width:100%; height:100%; object-fit:cover; user-select:none; pointer-events:none; }
        .pe-crop-rect { position:absolute; border:2px dashed #fff; box-shadow:0 0 0 9999px rgba(0,0,0,0.55); cursor:move; }
        .pe-text-item, .pe-sticker-item { position:absolute; font-weight:700; text-shadow:0 2px 4px rgba(0,0,0,0.6); user-select:none; cursor:pointer; }
        .pe-draw-layer { position:absolute; left:0; top:0; width:100%; height:100%; pointer-events:none; }
        .pe-toolbar { display:flex; flex-direction:column; gap:10px; }
        .pe-tool-buttons { display:flex; gap:6px; flex-wrap:wrap; }
        .tool-btn { background:#1e1e22; border:1px solid #26262b; color:#ccc; padding:6px 10px; border-radius:8px; font-size:11px; display:flex; align-items:center; gap:6px; cursor:pointer; }
        .tool-btn.active { background:#4f46e5; color:#fff; border-color:#4f46e5; }
        .pe-tool-panel { background:#151519; border:1px solid #222; border-radius:14px; padding:12px; min-height:80px; display:flex; flex-wrap:wrap; gap:8px; }
        .pe-crop-panel button, .pe-filter-btn, .pe-sticker-btn { background:#222; border:1px solid #333; color:#ddd; padding:6px 10px; font-size:11px; border-radius:8px; cursor:pointer; }
        .pe-filter-btn.active { background:#4f46e5; border-color:#4f46e5; color:#fff; }
        .pe-adjust-panel { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; width:100%; }
        .slider-row { display:flex; flex-direction:column; gap:4px; font-size:11px; }
        .slider-row input { width:100%; }
        .pe-text-panel, .pe-draw-panel { display:flex; flex-direction:column; gap:10px; font-size:11px; }
        .pe-btn-secondary { background:#2a2a30; border:1px solid #333; color:#eee; padding:6px 12px; font-size:12px; border-radius:8px; cursor:pointer; }
        .pe-sticker-panel { display:flex; gap:6px; flex-wrap:wrap; }
        .pe-hint { width:100%; font-size:10px; color:#666; }
        .pe-row { display:flex; align-items:center; gap:10px; font-size:11px; }
        @media (max-width:700px){ .photo-editor-root { padding:12px; } .pe-preview { aspect-ratio:1/1; } }
      `}</style>
    </div>
  );
}

function ToolButton({ active, icon, label, onClick }) {
  return <button className={`tool-btn ${active?'active':''}`} onClick={onClick}>{icon}<span>{label}</span></button>;
}
function AspectButton({ current, setAspect, value, label }) {
  return <button className={`pe-filter-btn ${current===value?'active':''}`} onClick={()=>setAspect(value)}>{label}</button>;
}
function SliderControl({ label, value, min, max, onChange }) {
  return (
    <div className="slider-row">
      <label>{label}: {value}</label>
      <input type="range" min={min} max={max} value={value} onChange={e=>onChange(parseInt(e.target.value,10))} />
    </div>
  );
}
