import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * GifPicker (Modal)
 * - Provider: 'tenor' (default) or 'giphy'
 * - Env keys:
 *   - Tenor: process.env.REACT_APP_TENOR_API_KEY
 *   - Giphy: process.env.REACT_APP_GIPHY_API_KEY
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - onSelect: (gif) => void  // gif = { id, previewUrl, url, width, height, provider, alt }
 * - provider?: 'tenor' | 'giphy'
 * - initialQuery?: string
 * - zIndex?: number
 */
export default function GifPicker({
  isOpen,
  onClose,
  onSelect,
  provider = 'tenor',
  initialQuery = '',
  zIndex = 1000,
}) {
  const [mode, setMode] = useState(initialQuery ? 'search' : 'trending'); // 'trending' | 'search'
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // Pagination state (offset for giphy, pos for tenor)
  const nextRef = useRef(null);
  const observerRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const keys = useMemo(() => ({
    tenor: process.env.REACT_APP_TENOR_API_KEY,
    giphy: process.env.REACT_APP_GIPHY_API_KEY,
  }), []);

  const cfg = useMemo(() => ({
    pageSize: 24,
    provider: provider === 'giphy' ? 'giphy' : 'tenor',
  }), [provider]);

  const resetPaging = () => { nextRef.current = null; setHasMore(true); };

  const clearAndLoad = useCallback(async () => {
    setItems([]);
    resetPaging();
    await loadMore(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.provider, query, mode, activeCategory]);

  useEffect(() => {
    if (!isOpen) return;
    // Focus search input on open
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    // Load categories lazily
    loadCategories();
    // Initial load
    clearAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, cfg.provider]);

  // Debounce search
  useEffect(() => {
    if (!isOpen) return;
    if (mode !== 'search') return;
    const h = setTimeout(() => {
      clearAndLoad();
    }, 400);
    return () => clearTimeout(h);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeCategory]);

  // Infinite scroll observer
  useEffect(() => {
    if (!isOpen) return;
    if (observerRef.current) observerRef.current.disconnect();
    const sentinel = document.getElementById('gifpicker-sentinel');
    if (!sentinel) return;
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && hasMore && !loading) {
          loadMore(false);
        }
      });
    }, { root: listRef.current, rootMargin: '300px', threshold: 0 });
    observerRef.current.observe(sentinel);
    return () => observerRef.current?.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, hasMore, loading, items.length]);

  const loadCategories = useCallback(async () => {
    try {
      const cats = await fetchCategories(cfg.provider, keys);
      setCategories(cats);
    } catch (e) {
      // Non-fatal
    }
  }, [cfg.provider, keys]);

  const loadMore = useCallback(async (replace = false) => {
    if (loading) return;
    if (!keys[cfg.provider]) {
      setError(`Missing ${cfg.provider.toUpperCase()} API key. Set REACT_APP_${cfg.provider === 'tenor' ? 'TENOR' : 'GIPHY'}_API_KEY`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchGifs({
        provider: cfg.provider,
        keys,
        limit: cfg.pageSize,
        cursor: nextRef.current,
        mode,
        query: mode === 'search' ? (activeCategory?.searchTerm || query) : undefined,
      });
      nextRef.current = res.nextCursor || null;
      setHasMore(Boolean(res.nextCursor));
      setItems(prev => (replace ? res.items : [...prev, ...res.items]));
    } catch (e) {
      setError(e?.message || 'Failed to load GIFs');
    } finally {
      setLoading(false);
    }
  }, [cfg.provider, cfg.pageSize, keys, mode, query, activeCategory, loading]);

  const onKeyDown = (e) => {
    if (e.key === 'Escape') onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div style={{ ...S.overlay, zIndex }} onKeyDown={onKeyDown} tabIndex={-1}>
      <div style={S.backdrop} onClick={onClose} />
      <div style={S.modal} role="dialog" aria-modal="true" aria-label="GIF picker" onClick={(e) => e.stopPropagation()}>
        <div style={S.header}>
          <div style={S.tabs}>
            <button
              type="button"
              onClick={() => { setMode('trending'); setActiveCategory(null); setQuery(''); clearAndLoad(); }}
              style={{ ...S.tab, ...(mode === 'trending' ? S.tabActive : {}) }}
            >Trending</button>
            <button
              type="button"
              onClick={() => { setMode('search'); setActiveCategory(null); }}
              style={{ ...S.tab, ...(mode === 'search' ? S.tabActive : {}) }}
            >Search</button>
          </div>
          <div style={S.searchBar}>
            <input
              ref={inputRef}
              type="text"
              placeholder={mode === 'search' ? 'Search GIFs' : 'Search in Trending'}
              value={query}
              onChange={(e) => { setMode('search'); setQuery(e.target.value); }}
              style={S.searchInput}
              aria-label="Search GIFs"
            />
            <span style={S.providerBadge}>{cfg.provider.toUpperCase()}</span>
          </div>
          {categories?.length > 0 && (
            <div style={S.categories} aria-label="GIF categories">
              <button
                type="button"
                onClick={() => { setActiveCategory(null); if (mode === 'search') clearAndLoad(); }}
                style={{ ...S.categoryChip, ...(activeCategory ? {} : S.categoryChipActive) }}
              >All</button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { setMode('search'); setActiveCategory(c); setQuery(''); clearAndLoad(); }}
                  title={c.name}
                  style={{ ...S.categoryChip, ...(activeCategory?.id === c.id ? S.categoryChipActive : {}) }}
                >{c.emoji ? `${c.emoji} ${c.name}` : c.name}</button>
              ))}
            </div>
          )}
        </div>

        <div ref={listRef} style={S.body}>
          {error && <div style={S.error}>{error}</div>}
          <div style={S.grid} data-gifpicker-grid="1">
            {items.map((it) => (
              <button
                key={`${it.provider}-${it.id}`}
                type="button"
                onClick={() => onSelect?.(it)}
                style={S.gridItem}
                className="gifpicker-grid-item"
                title="Click to insert"
              >
                <img
                  src={it.previewUrl}
                  alt={it.alt || 'GIF'}
                  style={S.img}
                  loading="lazy"
                />
              </button>
            ))}
            {/* sentinel */}
            <div id="gifpicker-sentinel" style={{ height: 1, width: '100%' }} />
          </div>
          {loading && <div style={S.loading}>Loading…</div>}
        </div>

        <button type="button" onClick={onClose} style={S.closeBtn} aria-label="Close">×</button>
      </div>
    </div>
  );
}

// Data fetching helpers
async function fetchGifs({ provider, keys, limit, cursor, mode, query }) {
  if (provider === 'giphy') {
    const api = 'https://api.giphy.com/v1/gifs';
    const params = new URLSearchParams({
      api_key: keys.giphy || '',
      limit: String(limit || 24),
      offset: String(Number(cursor || 0)),
      rating: 'pg',
    });
    const endpoint = mode === 'search' && query ? `${api}/search` : `${api}/trending`;
    if (mode === 'search' && query) params.set('q', query);

    const res = await fetch(`${endpoint}?${params.toString()}`);
    if (!res.ok) throw new Error('Giphy request failed');
    const json = await res.json();
    const items = (json.data || []).map(mapGiphyItem);
    const nextCursor = (json.pagination?.offset || 0) + (json.pagination?.count || items.length);
    const total = json.pagination?.total_count ?? 0;
    return { items, nextCursor: nextCursor < total ? nextCursor : null };
  }

  // Tenor default
  const api = 'https://tenor.googleapis.com/v2';
  const base = mode === 'search' && query ? 'search' : 'featured';
  const params = new URLSearchParams({
    key: keys.tenor || '',
    limit: String(limit || 24),
    media_filter: 'minimal',
    contentfilter: 'medium',
  });
  if (cursor) params.set('pos', String(cursor));
  if (mode === 'search' && query) params.set('q', query);

  const res = await fetch(`${api}/${base}?${params.toString()}`);
  if (!res.ok) throw new Error('Tenor request failed');
  const json = await res.json();
  const items = (json.results || []).map(mapTenorItem);
  const nextCursor = json.next || null;
  return { items, nextCursor };
}

async function fetchCategories(provider, keys) {
  try {
    if (provider === 'giphy') {
      const params = new URLSearchParams({ api_key: keys.giphy || '' });
      const res = await fetch(`https://api.giphy.com/v1/gifs/categories?${params.toString()}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      const cats = (json.data || []).map((c) => ({
        id: c.name_encoded || c.name || String(c.name_encoded || Math.random()),
        name: titleCase(c.name || c.name_encoded || 'Category'),
        emoji: c.gif?.title?.match(/^[^\w]/)?.[0] || '',
        searchTerm: c.name || c.name_encoded,
      }));
      return cats.slice(0, 20);
    }
    // Tenor
    const params = new URLSearchParams({ key: keys.tenor || '', type: 'featured' });
    const res = await fetch(`https://tenor.googleapis.com/v2/categories?${params.toString()}`);
    if (!res.ok) throw new Error();
    const json = await res.json();
    const cats = (json.tags || []).map((t) => ({
      id: t.searchterm || t.name || String(Math.random()),
      name: titleCase(t.searchterm || t.name || 'Category'),
      emoji: t.image || t.emoji || '',
      searchTerm: t.searchterm || t.name,
    }));
    return cats.slice(0, 20);
  } catch {
    return [];
  }
}

// Mappers
function mapGiphyItem(g) {
  const imgs = g.images || {};
  const preview = imgs.fixed_width_small || imgs.preview_gif || imgs.fixed_width || imgs.original || {};
  const original = imgs.original || preview;
  return {
    id: g.id,
    provider: 'giphy',
    url: original.url,
    previewUrl: preview.url,
    width: Number(preview.width) || 200,
    height: Number(preview.height) || 200,
    alt: g.title || 'GIF',
  };
}

function mapTenorItem(t) {
  const mf = t.media_formats || {};
  const preview = mf?.tinygif || mf?.gif || mf?.nanogif || mf?.mediumgif || {};
  const original = mf?.gif || preview;
  return {
    id: t.id,
    provider: 'tenor',
    url: original?.url,
    previewUrl: preview?.url,
    width: Number(preview?.dims?.[0]) || 200,
    height: Number(preview?.dims?.[1]) || 200,
    alt: t.content_description || 'GIF',
  };
}

function titleCase(s = '') {
  try {
    return s.replace(/[-_]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  } catch { return s; }
}

// Styles (inline CSS-in-JS, no external deps)
const S = {
  overlay: {
    position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  backdrop: {
    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)'
  },
  modal: {
    position: 'relative', width: 'min(1000px, 96vw)', height: 'min(80vh, 800px)', background: '#0b0b0c', color: '#fff',
    borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', overflow: 'hidden',
    display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.08)'
  },
  header: { padding: '12px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0))' },
  tabs: { display: 'flex', gap: 8, marginBottom: 8 },
  tab: {
    background: 'transparent', color: '#bbb', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
  },
  tabActive: { background: 'rgba(255,255,255,0.08)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' },
  searchBar: { display: 'flex', alignItems: 'center', gap: 8 },
  searchInput: {
    flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff',
    outline: 'none'
  },
  providerBadge: { fontSize: 12, color: '#9aa0a6', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '4px 8px' },
  categories: {
    display: 'flex', gap: 8, overflowX: 'auto', paddingTop: 10, scrollbarWidth: 'thin'
  },
  categoryChip: {
    background: 'rgba(255,255,255,0.06)', color: '#ddd', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 10px', borderRadius: 999,
    whiteSpace: 'nowrap', cursor: 'pointer'
  },
  categoryChipActive: { background: '#6c5ce7', color: '#fff', borderColor: 'transparent' },
  error: { color: '#ffb3b3', padding: '8px 10px' },
  body: { flex: 1, overflow: 'auto', padding: 12 },
  grid: {
    display: 'grid', gap: 8,
    gridTemplateColumns: 'repeat(4, 1fr)',
  },
  gridItem: {
    position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', padding: 0, cursor: 'pointer',
    background: 'rgba(255,255,255,0.05)', transition: 'transform 120ms ease, box-shadow 120ms ease',
  },
  img: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  loading: { textAlign: 'center', color: '#9aa0a6', padding: 12 },
  closeBtn: {
    position: 'absolute', top: 6, right: 8, background: 'transparent', color: '#fff', border: 'none', fontSize: 24, cursor: 'pointer', lineHeight: 1
  }
};

// Responsive style injection and hover effects
(function injectGifPickerStyles() {
  if (typeof document === 'undefined') return;
  const id = 'gifpicker-responsive-style';
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    /* Hover preview effect */
    .gifpicker-grid-item:hover { transform: scale(1.02); box-shadow: 0 6px 24px rgba(0,0,0,0.35); }

    /* Responsive columns: 3 on mobile, 4 on desktop */
    @media (max-width: 640px) {
      [data-gifpicker-grid] { grid-template-columns: repeat(3, 1fr) !important; }
    }
    @media (min-width: 641px) {
      [data-gifpicker-grid] { grid-template-columns: repeat(4, 1fr) !important; }
    }
  `;
  document.head.appendChild(style);
})();

GifPicker.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  onSelect: PropTypes.func.isRequired,
  provider: PropTypes.oneOf(['tenor', 'giphy']),
  initialQuery: PropTypes.string,
  zIndex: PropTypes.number,
};
