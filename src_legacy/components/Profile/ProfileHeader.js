// src/components/Profile/ProfileHeader.js
import React from 'react';
import { Settings, MoreHorizontal, MessageCircle } from 'lucide-react';
import './ProfileHeader.css';

const ProfileHeader = ({ 
  profile, 
  isOwnProfile, 
  isFollowing, 
  onFollowToggle, 
  onEditProfile, 
  onOptions,
  onMessage 
}) => {
  
  return (
    <header className="profile-header">
      {/* 1. Avatar Column */}
      <div className="profile-avatar-container">
        <div className="profile-avatar-ring">
          <img 
            src={profile.avatar_url || '/default-avatar.png'} 
            alt={profile.username} 
            className="profile-avatar-img"
          />
        </div>
      </div>

      {/* 2. Info Column */}
      <div className="profile-info-section">
        
        {/* Top Row: Username + Actions */}
        <div className="profile-top-row">
          <h2 className="profile-username">{profile.username}</h2>
          {profile.verified && <span className="verified-badge">✓</span>}

          <div className="profile-actions">
            {isOwnProfile ? (
              <button className="btn-secondary" onClick={onEditProfile}>
                Edit Profile
              </button>
            ) : (
              <>
                <button 
                  className={`btn-primary ${isFollowing ? 'following' : ''}`}
                  onClick={onFollowToggle}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button className="btn-secondary" onClick={onMessage}>
                  Message
                </button>
              </>
            )}
            <button className="btn-icon" onClick={onOptions}>
               {isOwnProfile ? <Settings size={20} /> : <MoreHorizontal size={20} />}
            </button>
          </div>
        </div>

        {/* Desktop Stats (Often hidden on mobile and moved to bar) */}
        <div className="profile-desktop-stats">
           {/* Stats rendered via ProfileStats component usually, but text can go here */}
        </div>

        {/* Bio Section */}
        <div className="profile-bio-section">
          <h1 className="profile-fullname">{profile.full_name}</h1>
          <div className="profile-bio-text">
            {profile.bio}
          </div>
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noreferrer" className="profile-website">
              🔗 {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>

      </div>
    </header>
  );
};

export default ProfileHeader;