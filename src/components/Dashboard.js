import React from 'react';
import { supabase } from '../supabaseClient';
import './Dashboard.css';

export default function Dashboard({ session }) {
  const user = session?.user;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload(); // Refresh to show auth page
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="logo-section">
          <h1>🎯 Focus</h1>
        </div>
        <div className="user-section">
          <img 
            src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.email}`}
            alt="Profile"
            className="user-avatar"
          />
          <div className="user-info">
            <p className="user-name">{user?.user_metadata?.full_name || user?.user_metadata?.username || 'User'}</p>
            <p className="user-email">{user?.email}</p>
          </div>
          <button onClick={handleSignOut} className="signout-btn">
            Sign Out
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>🎉 Welcome to Focus!</h2>
          <p>You're successfully logged in!</p>
          
          <div className="user-details">
            <h3>Your Account Info:</h3>
            <ul>
              <li><strong>Provider:</strong> {user?.app_metadata?.provider || 'email'}</li>
              <li><strong>ID:</strong> {user?.id}</li>
              <li><strong>Email:</strong> {user?.email}</li>
              <li><strong>Email Verified:</strong> {user?.email_confirmed_at ? '✅ Yes' : '❌ No'}</li>
              <li><strong>Created:</strong> {new Date(user?.created_at).toLocaleDateString()}</li>
            </ul>
          </div>

          <div className="next-steps">
            <h3>🚀 What's Next?</h3>
            <p>Now you can build out the rest of your Focus app features:</p>
            <ul>
              <li>✅ Profile page</li>
              <li>✅ Posts feed</li>
              <li>✅ Messaging</li>
              <li>✅ Calls</li>
              <li>✅ Settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
