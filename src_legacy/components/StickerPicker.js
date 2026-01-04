import React, { useState, useEffect, useMemo } from 'react';
import './StickerPicker.css';

// Custom icon components (replacing lucide-react)
const X = () => <span>✕</span>;
const Star = () => <span>⭐</span>;
const Clock = () => <span>🕐</span>;

// Custom icon components (replacing custom icons)
const SearchIcon = () => <span>🔍</span>;

// Sticker pack data
const STICKER_PACKS = {
  emoji: {
    id: 'emoji',
    name: 'Emoji Reactions',
    icon: '😊',
    stickers: [
      { id: 'emoji-1', content: '❤️', tags: ['love', 'heart', 'like'] },
      { id: 'emoji-2', content: '😂', tags: ['laugh', 'funny', 'lol'] },
      { id: 'emoji-3', content: '😮', tags: ['wow', 'shocked', 'surprised'] },
      { id: 'emoji-4', content: '😢', tags: ['sad', 'cry', 'tear'] },
      { id: 'emoji-5', content: '👏', tags: ['clap', 'applause', 'great'] },
      { id: 'emoji-6', content: '🔥', tags: ['fire', 'hot', 'lit'] },
      { id: 'emoji-7', content: '💯', tags: ['hundred', 'perfect', 'agree'] },
      { id: 'emoji-8', content: '🎉', tags: ['party', 'celebrate', 'yay'] },
      { id: 'emoji-9', content: '👍', tags: ['thumbs', 'like', 'good'] },
      { id: 'emoji-10', content: '🙏', tags: ['pray', 'thanks', 'please'] },
      { id: 'emoji-11', content: '😍', tags: ['love', 'heart eyes', 'adore'] },
      { id: 'emoji-12', content: '🤔', tags: ['think', 'hmm', 'wonder'] },
      { id: 'emoji-13', content: '😎', tags: ['cool', 'sunglasses', 'awesome'] },
      { id: 'emoji-14', content: '🤩', tags: ['star struck', 'wow', 'amazing'] },
      { id: 'emoji-15', content: '😊', tags: ['smile', 'happy', 'blush'] },
      { id: 'emoji-16', content: '💪', tags: ['strong', 'flex', 'power'] },
      { id: 'emoji-17', content: '✨', tags: ['sparkle', 'shine', 'magic'] },
      { id: 'emoji-18', content: '💖', tags: ['heart', 'love', 'pink'] },
      { id: 'emoji-19', content: '🎊', tags: ['confetti', 'party', 'celebrate'] },
      { id: 'emoji-20', content: '🌟', tags: ['star', 'shine', 'bright'] }
    ]
  },
  focus: {
    id: 'focus',
    name: 'Focus Brand',
    icon: '⚡',
    stickers: [
      { id: 'focus-1', content: '⚡', tags: ['focus', 'energy', 'power'] },
      { id: 'focus-2', content: '🎯', tags: ['target', 'goal', 'aim'] },
      { id: 'focus-3', content: '💡', tags: ['idea', 'bright', 'light'] },
      { id: 'focus-4', content: '🚀', tags: ['rocket', 'launch', 'grow'] },
      { id: 'focus-5', content: '🏆', tags: ['trophy', 'win', 'champion'] },
      { id: 'focus-6', content: '⭐', tags: ['star', 'favorite', 'best'] },
      { id: 'focus-7', content: '📱', tags: ['phone', 'app', 'mobile'] },
      { id: 'focus-8', content: '💬', tags: ['chat', 'message', 'talk'] },
      { id: 'focus-9', content: '📸', tags: ['camera', 'photo', 'snap'] },
      { id: 'focus-10', content: '🎬', tags: ['video', 'film', 'record'] },
      { id: 'focus-11', content: '👥', tags: ['friends', 'people', 'community'] },
      { id: 'focus-12', content: '🌐', tags: ['world', 'global', 'internet'] },
      { id: 'focus-13', content: '💼', tags: ['work', 'business', 'professional'] },
      { id: 'focus-14', content: '🎓', tags: ['graduate', 'education', 'learn'] },
      { id: 'focus-15', content: '🌈', tags: ['rainbow', 'colorful', 'happy'] }
    ]
  },
  festival: {
    id: 'festival',
    name: 'Festivals',
    icon: '🎉',
    stickers: [
      // Diwali
      { id: 'fest-1', content: '🪔', tags: ['diwali', 'lamp', 'diya'] },
      { id: 'fest-2', content: '🎆', tags: ['diwali', 'fireworks', 'celebrate'] },
      { id: 'fest-3', content: '🎇', tags: ['diwali', 'sparkler', 'light'] },
      { id: 'fest-4', content: '🕉️', tags: ['om', 'hindu', 'spiritual'] },
      { id: 'fest-5', content: '🙏', tags: ['namaste', 'pray', 'greet'] },
      // Holi
      { id: 'fest-6', content: '🎨', tags: ['holi', 'colors', 'paint'] },
      { id: 'fest-7', content: '💜', tags: ['holi', 'purple', 'color'] },
      { id: 'fest-8', content: '💚', tags: ['holi', 'green', 'color'] },
      { id: 'fest-9', content: '🌺', tags: ['flower', 'spring', 'holi'] },
      { id: 'fest-10', content: '🥁', tags: ['drum', 'music', 'celebrate'] },
      // General festivals
      { id: 'fest-11', content: '🎄', tags: ['christmas', 'tree', 'holiday'] },
      { id: 'fest-12', content: '🎃', tags: ['halloween', 'pumpkin', 'spooky'] },
      { id: 'fest-13', content: '🌙', tags: ['eid', 'moon', 'ramadan'] },
      { id: 'fest-14', content: '⭐', tags: ['eid', 'star', 'night'] },
      { id: 'fest-15', content: '🎁', tags: ['gift', 'present', 'birthday'] },
      { id: 'fest-16', content: '🎂', tags: ['cake', 'birthday', 'celebrate'] },
      { id: 'fest-17', content: '🎈', tags: ['balloon', 'party', 'celebrate'] },
      { id: 'fest-18', content: '🎀', tags: ['bow', 'gift', 'pretty'] },
      { id: 'fest-19', content: '👑', tags: ['crown', 'king', 'queen'] },
      { id: 'fest-20', content: '💐', tags: ['flowers', 'bouquet', 'gift'] }
    ]
  },
  trending: {
    id: 'trending',
    name: 'Trending',
    icon: '❤️',
    stickers: [
      // Safe for work meme reactions
      { id: 'trend-1', content: '😏', tags: ['smirk', 'sus', 'hmm'] },
      { id: 'trend-2', content: '🫡', tags: ['salute', 'respect', 'aye'] },
      { id: 'trend-3', content: '🤝', tags: ['handshake', 'deal', 'agree'] },
      { id: 'trend-4', content: '👀', tags: ['eyes', 'looking', 'watching'] },
      { id: 'trend-5', content: '💀', tags: ['skull', 'dead', 'laughing'] },
      { id: 'trend-6', content: '🧢', tags: ['cap', 'no cap', 'hat'] },
      { id: 'trend-7', content: '🐐', tags: ['goat', 'greatest', 'best'] },
      { id: 'trend-8', content: '✅', tags: ['check', 'done', 'yes'] },
      { id: 'trend-9', content: '❌', tags: ['x', 'no', 'wrong'] },
      { id: 'trend-10', content: '🎪', tags: ['circus', 'clown', 'joke'] },
      { id: 'trend-11', content: '🤡', tags: ['clown', 'fool', 'silly'] },
      { id: 'trend-12', content: '👁️', tags: ['eye', 'see', 'watch'] },
      { id: 'trend-13', content: '🗿', tags: ['moai', 'stone', 'statue'] },
      { id: 'trend-14', content: '💅', tags: ['nails', 'slay', 'fabulous'] },
      { id: 'trend-15', content: '🫠', tags: ['melting', 'dying', 'help'] },
      { id: 'trend-16', content: '😭', tags: ['crying', 'tears', 'sob'] },
      { id: 'trend-17', content: '🥺', tags: ['pleading', 'puppy eyes', 'please'] },
      { id: 'trend-18', content: '😤', tags: ['huff', 'proud', 'determined'] },
      { id: 'trend-19', content: '🤨', tags: ['raised eyebrow', 'sus', 'really'] },
      { id: 'trend-20', content: '💅', tags: ['fierce', 'confident', 'slay'] }
    ]
  }
};

const StickerPicker = ({ onSelect, onClose, context = 'message' }) => {
  const [activeTab, setActiveTab] = useState('emoji');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentStickers, setRecentStickers] = useState([]);
  const [favoriteStickers, setFavoriteStickers] = useState([]);
  const [hoveredSticker, setHoveredSticker] = useState(null);

  // Load recent and favorite stickers from localStorage
  useEffect(() => {
    const loadedRecent = JSON.parse(localStorage.getItem('recentStickers') || '[]');
    const loadedFavorites = JSON.parse(localStorage.getItem('favoriteStickers') || '[]');
    setRecentStickers(loadedRecent);
    setFavoriteStickers(loadedFavorites);
  }, []);

  // Filter stickers based on search query
  const filteredStickers = useMemo(() => {
    if (!searchQuery.trim()) {
      return STICKER_PACKS[activeTab]?.stickers || [];
    }

    const query = searchQuery.toLowerCase();
    const allStickers = Object.values(STICKER_PACKS).flatMap(pack => 
      pack.stickers.map(sticker => ({ ...sticker, packId: pack.id }))
    );

    return allStickers.filter(sticker => 
      sticker.tags.some(tag => tag.includes(query)) ||
      sticker.content.includes(query)
    );
  }, [activeTab, searchQuery]);

  // Get recent stickers with full data
  const recentStickersData = useMemo(() => {
    const allStickers = Object.values(STICKER_PACKS).flatMap(pack => pack.stickers);
    return recentStickers
      .map(id => allStickers.find(s => s.id === id))
      .filter(Boolean)
      .slice(0, 10);
  }, [recentStickers]);

  // Get favorite stickers with full data
  const favoriteStickersData = useMemo(() => {
    const allStickers = Object.values(STICKER_PACKS).flatMap(pack => pack.stickers);
    return favoriteStickers
      .map(id => allStickers.find(s => s.id === id))
      .filter(Boolean);
  }, [favoriteStickers]);

  const handleStickerSelect = (sticker) => {
    // Add to recent stickers
    const updatedRecent = [
      sticker.id,
      ...recentStickers.filter(id => id !== sticker.id)
    ].slice(0, 20);
    
    setRecentStickers(updatedRecent);
    localStorage.setItem('recentStickers', JSON.stringify(updatedRecent));

    // Call the onSelect callback
    onSelect(sticker);
    
    // Close the picker
    if (onClose) {
      onClose();
    }
  };

  const toggleFavorite = (stickerId, e) => {
    e.stopPropagation();
    
    const isFavorite = favoriteStickers.includes(stickerId);
    const updatedFavorites = isFavorite
      ? favoriteStickers.filter(id => id !== stickerId)
      : [...favoriteStickers, stickerId];
    
    setFavoriteStickers(updatedFavorites);
    localStorage.setItem('favoriteStickers', JSON.stringify(updatedFavorites));
  };

  const isFavorite = (stickerId) => favoriteStickers.includes(stickerId);

  return (
    <div className="sticker-picker">
      <div className="sticker-picker-header">
        <h3 className="sticker-picker-title">Choose a Sticker</h3>
        <button 
          className="sticker-picker-close"
          onClick={onClose}
          aria-label="Close sticker picker"
        >
          <X size={20} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="sticker-picker-search">
        <SearchIcon size={18} />
        <input
          type="text"
          placeholder="Search stickers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sticker-search-input"
        />
      </div>

      {/* Tabs */}
      {!searchQuery && (
        <div className="sticker-picker-tabs">
          {Object.values(STICKER_PACKS).map(pack => {
            const Icon = pack.icon;
            return (
              <button
                key={pack.id}
                className={`sticker-tab ${activeTab === pack.id ? 'active' : ''}`}
                onClick={() => setActiveTab(pack.id)}
                title={pack.name}
              >
                <Icon size={20} />
                <span className="sticker-tab-label">{pack.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Content Area */}
      <div className="sticker-picker-content">
        {/* Recent Stickers */}
        {!searchQuery && recentStickersData.length > 0 && (
          <div className="sticker-section">
            <div className="sticker-section-header">
              <Clock size={16} />
              <span>Recently Used</span>
            </div>
            <div className="sticker-grid recent">
              {recentStickersData.map(sticker => (
                <button
                  key={sticker.id}
                  className="sticker-item"
                  onClick={() => handleStickerSelect(sticker)}
                  onMouseEnter={() => setHoveredSticker(sticker.id)}
                  onMouseLeave={() => setHoveredSticker(null)}
                  title={sticker.tags[0]}
                >
                  <span className="sticker-content">{sticker.content}</span>
                  <button
                    className={`sticker-favorite-btn ${isFavorite(sticker.id) ? 'active' : ''}`}
                    onClick={(e) => toggleFavorite(sticker.id, e)}
                    aria-label={isFavorite(sticker.id) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star size={14} fill={isFavorite(sticker.id) ? 'currentColor' : 'none'} />
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Favorite Stickers */}
        {!searchQuery && favoriteStickersData.length > 0 && (
          <div className="sticker-section">
            <div className="sticker-section-header">
              <Star size={16} />
              <span>Favorites</span>
            </div>
            <div className="sticker-grid favorites">
              {favoriteStickersData.map(sticker => (
                <button
                  key={sticker.id}
                  className="sticker-item"
                  onClick={() => handleStickerSelect(sticker)}
                  onMouseEnter={() => setHoveredSticker(sticker.id)}
                  onMouseLeave={() => setHoveredSticker(null)}
                  title={sticker.tags[0]}
                >
                  <span className="sticker-content">{sticker.content}</span>
                  <button
                    className={`sticker-favorite-btn active`}
                    onClick={(e) => toggleFavorite(sticker.id, e)}
                    aria-label="Remove from favorites"
                  >
                    <Star size={14} fill="currentColor" />
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Sticker Grid */}
        <div className="sticker-section">
          {searchQuery && (
            <div className="sticker-section-header">
              <SearchIcon size={16} />
              <span>Search Results ({filteredStickers.length})</span>
            </div>
          )}
          <div className="sticker-grid main">
            {filteredStickers.length > 0 ? (
              filteredStickers.map(sticker => (
                <button
                  key={sticker.id}
                  className="sticker-item"
                  onClick={() => handleStickerSelect(sticker)}
                  onMouseEnter={() => setHoveredSticker(sticker.id)}
                  onMouseLeave={() => setHoveredSticker(null)}
                  title={sticker.tags[0]}
                >
                  <span className="sticker-content">{sticker.content}</span>
                  <button
                    className={`sticker-favorite-btn ${isFavorite(sticker.id) ? 'active' : ''}`}
                    onClick={(e) => toggleFavorite(sticker.id, e)}
                    aria-label={isFavorite(sticker.id) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star size={14} fill={isFavorite(sticker.id) ? 'currentColor' : 'none'} />
                  </button>
                </button>
              ))
            ) : (
              <div className="sticker-empty">
                <span>No stickers found</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context hint */}
      <div className="sticker-picker-footer">
        <span className="sticker-context-hint">
          {context === 'message' && '💬 Send in message'}
          {context === 'comment' && '💭 Add to comment'}
          {context === 'story' && '📸 Add to story'}
          {context === 'flash' && '⚡ Add to flash'}
        </span>
      </div>
    </div>
  );
};

export default React.memo(StickerPicker);
