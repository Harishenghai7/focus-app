import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Stories.css';

export default function Stories({ user, userProfile }) {
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [userStory, setUserStory] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchStories();
      fetchUserStory();
    }
  }, [user?.id]);

  useEffect(() => {
    const handleRefresh = () => {
      if (user?.id) {
        fetchStories();
        fetchUserStory();
      }
    };
    window.addEventListener('refreshStories', handleRefresh);
    return () => window.removeEventListener('refreshStories', handleRefresh);
  }, [user?.id]);

  const fetchStories = async () => {
    try {
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      const followingIds = followingData?.map(f => f.following_id) || [];
      let { data } = await supabase
        .from('flashes')
        .select(`
          *,
          profiles (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .in('user_id', followingIds)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      const groupedStories = {};
      data?.forEach(story => {
        const userId = story.user_id;
        if (!groupedStories[userId]) {
          groupedStories[userId] = {
            user: story.profiles,
            stories: [],
            hasCloseFriends: false
          };
        }
        groupedStories[userId].stories.push(story);
        // Check if any story is close friends only
        if (story.is_close_friends) {
          groupedStories[userId].hasCloseFriends = true;
        }
      });

      setStories(Object.values(groupedStories));
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const fetchUserStory = async () => {
    try {
      const { data } = await supabase
        .from('flashes')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);
      setUserStory(data?.[0] || null);
    } catch (error) {
      console.error('Error fetching user story:', error);
      setUserStory(null);
    }
  };

  const handleYourFlashClick = () => {
    if (userStory) {
      navigate(`/flash/${user.id}`);
    } else {
      navigate('/create');
    }
  };

  return (
    <div className="stories-container">
      <div className="stories-scroll">
        {/* Your Flash */}
        <div className="story-item your-flash" onClick={handleYourFlashClick}>
          <div className={`story-avatar ${userStory ? 'has-story' : 'add-story'}`} style={{ position: 'relative', width: 64, height: 64 }}>
            <img
              src={
                userStory?.media_url ||
                userProfile?.avatar_url ||
                user?.user_metadata?.avatar_url ||
                '/default-avatar.png'
              }
              alt="Your Flash"
              className="avatar-img"
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                objectFit: "cover",
                border: userStory ? "3px solid #2196f3" : "3px dashed #aaa",
                background: '#111'
              }}
            />
            {!userStory && (
              <span
                style={{
                  position: "absolute",
                  bottom: 6,   // was 0: prevents covering text below!
                  right: 2,
                  background: "#2196f3",
                  borderRadius: "100%",
                  width: 22,
                  height: 22,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #fff",
                  boxSizing: "content-box"
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="2" />
                  <line x1="12" y1="8" x2="12" y2="16" stroke="#fff" strokeWidth="2" />
                  <line x1="8" y1="12" x2="16" y2="12" stroke="#fff" strokeWidth="2" />
                </svg>
              </span>
            )}
          </div>
          <span className="story-username">Your Flash</span>
        </div>

        {/* Follower stories */}
        {stories.map((storyGroup) => (
          <div
            key={storyGroup.user.id}
            className="story-item"
            onClick={() => navigate(`/flash/${storyGroup.user.id}`)}
          >
            <div className="story-avatar has-story" style={{ width: 64, height: 64 }}>
              <img
                src={storyGroup.user.avatar_url || '/default-avatar.png'}
                alt={storyGroup.user.username}
                className="avatar-img"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: storyGroup.hasCloseFriends 
                    ? "3px solid #10b981" 
                    : "3px solid #2196f3",
                  background: '#111'
                }}
              />
            </div>
            <span className="story-username">{storyGroup.user.username || storyGroup.user.full_name || 'User'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
