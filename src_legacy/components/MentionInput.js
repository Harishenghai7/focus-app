import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function MentionInput({ value, onChange, onMention }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleChange = async (e) => {
    const text = e.target.value;
    onChange(text);

    // Check for @ mentions
    const lastWord = text.split(' ').pop();
    if (lastWord.startsWith('@')) {
      const query = lastWord.slice(1);
      const { data } = await supabase.rpc('search_users', {
        search_query: query,
        page_size: 5
      });
      setSuggestions(data || []);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectUser = (username) => {
    const words = value.split(' ');
    words[words.length - 1] = `@${username}`;
    onChange(words.join(' ') + ' ');
    setShowSuggestions(false);
    onMention(username);
  };

  return (
    <div className="mention-input">
      <textarea value={value} onChange={handleChange} />
      {showSuggestions && (
        <div className="suggestions">
          {suggestions.map(user => (
            <div key={user.id} onClick={() => selectUser(user.username)}>
              <img src={user.avatar_url} alt="" />
              <span>{user.username}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
