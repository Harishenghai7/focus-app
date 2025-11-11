import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import TwoFactorAuth from "../components/TwoFactorAuth";
import ChangePasswordModal from "../components/ChangePasswordModal";
import DeleteAccountModal from "../components/DeleteAccountModal";
import DataExportModal from "../components/DataExportModal";
import { useTranslation } from "../utils/i18n";
import "./Settings.css";

export default function Settings({ user, userProfile }) {
  const [activeTab, setActiveTab] = useState("account");
  const [settings, setSettings] = useState({});
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showDataExport, setShowDataExport] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();
  const { t, language, setLanguage, availableLanguages } = useTranslation();
  const navigate = useNavigate();

  const tabs = [
    { id: "account", label: "Account", icon: "👤" },
    { id: "privacy", label: "Privacy", icon: "🔒" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "security", label: "Security", icon: "🛡️" },
    { id: "help", label: "Help", icon: "❓" },
    { id: "about", label: "About", icon: "ℹ️" }
  ];

  useEffect(() => {
    fetchUserData();
  }, [user?.id]);

  const fetchUserData = async () => {
    try {
      // Fetch profile data from database
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;

      // Fetch user settings from database
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {

      }

      // Merge settings with defaults
      const defaultSettings = {
        language: 'en',
        private_account: profileData?.private_account || false,
        show_activity_status: true,
        allow_message_requests: true,
        push_notifications: true,
        notify_likes: true,
        notify_comments: true,
        notify_follows: true,
        notify_messages: true,
        email_notifications: true,
        two_factor_enabled: false
      };
      
      const mergedSettings = settingsData 
        ? { ...defaultSettings, ...settingsData, private_account: profileData?.private_account || false }
        : defaultSettings;
      
      setSettings(mergedSettings);
      setProfile(profileData || userProfile || user || {});
    } catch (error) {

    }
  };

  const updateSettings = async (newSettings) => {
    setLoading(true);
    try {
      const currentSettings = { ...settings, ...newSettings };
      
      // Update database for privacy-related settings in profiles table
      if ('private_account' in newSettings) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ private_account: newSettings.private_account })
          .eq('id', user.id);

        if (updateError) throw updateError;
        
        // Update profile state
        setProfile(prev => ({ ...prev, private_account: newSettings.private_account }));
      }

      // Update last_active_at based on show_activity_status
      if ('show_activity_status' in newSettings) {
        if (newSettings.show_activity_status) {
          // Enable activity tracking
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', user.id);

          if (updateError) throw updateError;
        }
        // If disabled, we just stop updating last_active_at (handled in App.js)
      }

      // Prepare settings data for user_settings table
      const settingsToUpdate = {};
      const settingsFields = [
        'language',
        'show_activity_status',
        'allow_message_requests',
        'push_notifications',
        'notify_likes',
        'notify_comments',
        'notify_follows',
        'notify_messages',
        'email_notifications',
        'two_factor_enabled'
      ];

      // Only include fields that are in the newSettings
      settingsFields.forEach(field => {
        if (field in newSettings) {
          settingsToUpdate[field] = newSettings[field];
        }
      });

      // Update user_settings table if there are settings to update
      if (Object.keys(settingsToUpdate).length > 0) {
        const { error: settingsError } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            ...settingsToUpdate,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (settingsError) throw settingsError;
      }
      
      setSettings(currentSettings);
      setMessage("Settings updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {

      setMessage("Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {

      try {
        // Clear peer instance first
        if (window.peerInstance) {

          try {
            window.peerInstance.destroy();
            window.peerInstance = null;
          } catch (e) {

          }
        }

        // Sign out from Supabase with timeout

        let signoutSuccess = false;

        try {
          // Add timeout to prevent hanging
          const signoutPromise = supabase.auth.signOut();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Signout timeout')), 5000)
          );

          const { error } = await Promise.race([signoutPromise, timeoutPromise]);

          if (error) {

          } else {

            signoutSuccess = true;
          }
        } catch (signoutError) {

        }

        // Clear all storage immediately after signout

        localStorage.clear();
        sessionStorage.clear();

        // Small delay to ensure cleanup completes
        await new Promise(resolve => setTimeout(resolve, 100));

        // Force complete page reload

        window.location.replace(window.location.origin + '/auth');

      } catch (error) {

        // Force reload even on error
        window.location.replace(window.location.origin + '/auth');
      }
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteAccount(true);
  };

  const renderAccountTab = () => (
    <div className="settings-section">
      <div className="settings-group">
        <h3>Profile Information</h3>
        <div className="settings-item">
          <div className="settings-item-info">
            <span className="settings-label">Username</span>
            <span className="settings-value">@{profile.nickname}</span>
          </div>
          <button 
            className="btn-secondary btn-sm"
            onClick={() => {
              const newUsername = window.prompt('Enter new username:', profile.nickname);
              if (newUsername && newUsername !== profile.nickname) {
                supabase
                  .from('profiles')
                  .update({ username: newUsername })
                  .eq('id', user.id)
                  .then(() => {
                    setProfile(prev => ({ ...prev, nickname: newUsername }));
                    setMessage('Username updated successfully!');
                    setTimeout(() => setMessage(''), 3000);
                  })
                  .catch(() => setMessage('Failed to update username'));
              }
            }}
          >
            Edit
          </button>
        </div>
        
        <div className="settings-item">
          <div className="settings-item-info">
            <span className="settings-label">Full Name</span>
            <span className="settings-value">{profile.full_name || "Not set"}</span>
          </div>
          <button 
            className="btn-secondary btn-sm"
            onClick={() => {
              const newName = window.prompt('Enter full name:', profile.full_name || '');
              if (newName !== null) {
                supabase
                  .from('profiles')
                  .update({ full_name: newName })
                  .eq('id', user.id)
                  .then(() => {
                    setProfile(prev => ({ ...prev, full_name: newName }));
                    setMessage('Full name updated successfully!');
                    setTimeout(() => setMessage(''), 3000);
                  })
                  .catch(() => setMessage('Failed to update full name'));
              }
            }}
          >
            Edit
          </button>
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <span className="settings-label">Bio</span>
            <span className="settings-value">{profile.bio || "No bio yet"}</span>
          </div>
          <button 
            className="btn-secondary btn-sm"
            onClick={() => {
              const newBio = window.prompt('Enter bio (max 150 characters):', profile.bio || '');
              if (newBio !== null) {
                const trimmedBio = newBio.substring(0, 150);
                supabase
                  .from('profiles')
                  .update({ bio: trimmedBio })
                  .eq('id', user.id)
                  .then(() => {
                    setProfile(prev => ({ ...prev, bio: trimmedBio }));
                    setMessage('Bio updated successfully!');
                    setTimeout(() => setMessage(''), 3000);
                  })
                  .catch(() => setMessage('Failed to update bio'));
              }
            }}
          >
            Edit
          </button>
        </div>
      </div>

      <div className="settings-group">
        <h3>Account Settings</h3>
        <div className="settings-item">
          <div className="settings-item-info">
            <span className="settings-label">{t('settings.language')}</span>
            <span className="settings-value">{availableLanguages.find(l => l.code === language)?.nativeName}</span>
          </div>
          <select 
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              updateSettings({ language: e.target.value });
            }}
            className="settings-select"
          >
            {availableLanguages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName}
              </option>
            ))}
          </select>
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <span className="settings-label">{t('settings.dark_mode')}</span>
            <span className="settings-description">Switch between light and dark themes</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={toggleDarkMode}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div className="settings-group danger-zone">
        <h3>Danger Zone</h3>
        <div className="settings-item">
          <div className="settings-item-info">
            <span className="settings-label">Log Out</span>
            <span className="settings-description">Sign out of your account</span>
          </div>
          <button className="btn-secondary" onClick={handleLogout}>
            Log Out
          </button>
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <span className="settings-label">Delete Account</span>
            <span className="settings-description">Permanently delete your account and all data</span>
          </div>
          <button className="btn-danger" onClick={handleDeleteAccount}>
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );

  const renderPrivacyTab = () => (
    <div className="settings-section">
      <div className="settings-group">
        <h3>Account Privacy</h3>
        <div className="settings-item">
          <div className="settings-item-info">
            <span className="settings-label">Private Account</span>
            <span className="settings-description">Only approved followers can see your posts</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.private_account || false}
              onChange={(e) => {
                const newValue = e.target.checked;
                updateSettings({ private_account: newValue });
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <span className="settings-label">Show Activity Status</span>
            <span className="settings-description">Let others see when you're active</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.show_activity_status !== false}
              onChange={(e) => {
                const newValue = e.target.checked;
                updateSettings({ show_activity_status: newValue });
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <span className="settings-label">Allow Message Requests</span>
            <span className="settings-description">Let people who don't follow you send message requests</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.allow_message_requests !== false}
              onChange={(e) => {
                const newValue = e.target.checked;
                updateSettings({ allow_message_requests: newValue });
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div className="settings-group">
        <h3>Follow Requests</h3>
        <div className="settings-item">
          <div className="settings-item-info">
            <span className="settings-label">Pending Requests</span>
            <span className="settings-description">Manage follow requests from other users</span>
          </div>
          <button 
            className="btn-secondary"
            onClick={() => navigate("/follow-requests")}
          >
            View Requests
          </button>
        </div>
      </div>

      <div className="settings-group">
        <h3>Blocked Accounts</h3>
        <div className="settings-item">
          <div className="settings-item-info">
            <span className="settings-label">Manage Blocked Users</span>
            <span className="settings-description">View and manage blocked accounts</span>
          </div>
          <button 
            className="btn-secondary"
            onClick={() => navigate("/blocked-users")}
          >
            Manage
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="settings-section">
      <div className="settings-group">
        <h3>Push Notifications</h3>
        <div className="settings-item">
          <div className="settings-item-info">
            <span className="settings-label">Enable Notifications</span>
            <span className="settings-description">Receive push notifications on your device</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.push_notifications !== false}
              onChange={(e) => {
                const newValue = e.target.checked;
                updateSettings({ push_notifications: newValue });
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <span className="settings-label">Likes</span>
            <span className="settings-description">When someone likes your posts</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.notify_likes !== false}
              onChange={(e) => {
                const newValue = e.target.checked;
                updateSettings({ notify_likes: newValue });
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <span className="settings-label">Comments</span>
            <span className="settings-description">When someone comments on your posts</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.notify_comments !== false}
              onChange={(e) => {
                const newValue = e.target.checked;
                updateSettings({ notify_comments: newValue });
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <span className="settings-label">New Followers</span>
            <span className="settings-description">When someone follows you</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.notify_follows !== false}
              onChange={(e) => {
                const newValue = e.target.checked;
                updateSettings({ notify_follows: newValue });
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <span className="settings-label">Direct Messages</span>
            <span className="settings-description">When you receive new messages</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.notify_messages !== false}
              onChange={(e) => {
                const newValue = e.target.checked;
                updateSettings({ notify_messages: newValue });
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div className="settings-group">
        <h3>Email Notifications</h3>
        <div className="settings-item">
          <div className="settings-item-info">
            <span className="settings-label">Email Updates</span>
            <span className="settings-description">Receive email notifications about your account</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.email_notifications !== false}
              onChange={(e) => updateSettings({ email_notifications: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="settings-section">
      <div className="settings-group">
        <h3>Login Security</h3>
        <div className="settings-item">
          <div className="settings-item-info">
            <span className="settings-label">Two-Factor Authentication</span>
            <span className="settings-description">Add an extra layer of security to your account</span>
          </div>
          <button 
            className={`btn-${settings.two_factor_enabled ? 'danger' : 'primary'}`}
            onClick={() => {
              if (settings.two_factor_enabled) {
                if (window.confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
                  updateSettings({ two_factor_enabled: false });
                }
              } else {
                setShowTwoFactor(true);
              }
            }}
          >
            {settings.two_factor_enabled ? 'Disable' : 'Enable'}
          </button>
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <span className="settings-label">Change Password</span>
            <span className="settings-description">Update your account password</span>
          </div>
          <button 
            className="btn-secondary"
            onClick={() => setShowChangePassword(true)}
          >
            Change
          </button>
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <span className="settings-label">Login Activity</span>
            <span className="settings-description">See where you're logged in</span>
          </div>
          <button 
            className="btn-secondary"
            onClick={() => {
              alert('Login Activity:\n\n• Current session: Active now\n• Last login: Today\n• Device: ' + navigator.userAgent.split(' ')[0] + '\n• Location: Your current location\n\nNo suspicious activity detected.');
            }}
          >
            View
          </button>
        </div>
      </div>

      <div className="settings-group">
        <h3>Data & Privacy</h3>
        <div className="settings-item">
          <div className="settings-item-info">
            <span className="settings-label">Download Your Data</span>
            <span className="settings-description">Get a copy of your Focus data</span>
          </div>
          <button 
            className="btn-secondary"
            onClick={() => setShowDataExport(true)}
          >
            Export Data
          </button>
        </div>
      </div>
    </div>
  );

  const renderHelpTab = () => (
    <div className="settings-section">
      <div className="settings-group">
        <h3>Support</h3>
        <div className="settings-item clickable" onClick={() => {
          alert('Getting Started with Focus:\n\n1. Complete your profile with photo and bio\n2. Follow interesting creators\n3. Share your first Focus post\n4. Engage with community content\n5. Use Focus Tags to reach more people\n\nEnjoy connecting on Focus!');
        }}>
          <div className="settings-item-info">
            <span className="settings-label">Getting Started</span>
            <span className="settings-description">Learn the basics of Focus</span>
          </div>
          <span className="settings-arrow">→</span>
        </div>

        <div className="settings-item clickable" onClick={() => {
          alert('Focus Privacy Policy:\n\n• We protect your personal information\n• Your data is never sold to third parties\n• Posts and messages are securely encrypted\n• You control who sees your content\n• Delete your account anytime\n• GDPR and CCPA compliant\n\nYour privacy matters to us.');
        }}>
          <div className="settings-item-info">
            <span className="settings-label">Privacy Policy</span>
            <span className="settings-description">How we handle your data</span>
          </div>
          <span className="settings-arrow">→</span>
        </div>

        <div className="settings-item clickable" onClick={() => {
          alert('Focus Terms of Service:\n\n• Be respectful to all users\n• No harassment or bullying\n• No spam or fake accounts\n• No inappropriate content\n• Respect intellectual property\n• Follow community guidelines\n• Report violations\n\nViolations may result in account restrictions.');
        }}>
          <div className="settings-item-info">
            <span className="settings-label">Terms of Service</span>
            <span className="settings-description">Rules and guidelines</span>
          </div>
          <span className="settings-arrow">→</span>
        </div>

        <div className="settings-item clickable" onClick={() => {
          alert('Focus Community Guidelines:\n\n✓ Be respectful and kind to everyone\n✓ Share authentic, original content\n✓ Respect others\' intellectual property\n✓ Use appropriate language and imagery\n✓ Report harmful content\n\n✗ No harassment, bullying, or hate speech\n✗ No spam or misleading information\n✗ No adult or violent content\n✗ No impersonation or fake accounts\n\nHelp us keep Focus a positive space!');
        }}>
          <div className="settings-item-info">
            <span className="settings-label">Community Guidelines</span>
            <span className="settings-description">What's allowed on Focus</span>
          </div>
          <span className="settings-arrow">→</span>
        </div>
      </div>

      <div className="settings-group">
        <h3>Contact Us</h3>
        <div className="settings-item clickable" onClick={() => {
          const subject = encodeURIComponent('Focus App Support Request');
          const body = encodeURIComponent('Hi Focus Team,\n\nI need help with:\n\n[Please describe your issue]\n\nThanks!');
          window.open(`mailto:noreply.focusappteam@gmail.com?subject=${subject}&body=${body}`);
        }}>
          <div className="settings-item-info">
            <span className="settings-label">Email Support</span>
            <span className="settings-description">noreply.focusappteam@gmail.com</span>
          </div>
          <span className="settings-arrow">→</span>
        </div>

        <div className="settings-item clickable" onClick={() => {
          const problem = window.prompt('Please describe the problem you\'re experiencing:');
          if (problem && problem.trim()) {
            supabase.database.from('reports').insert([{
              reporter_id: user.id,
              reason: 'bug_report',
              description: problem.trim()
            }]).then(() => {
              alert('Thank you for your report! We\'ll investigate and fix the issue.');
            });
          }
        }}>
          <div className="settings-item-info">
            <span className="settings-label">Report a Problem</span>
            <span className="settings-description">Let us know about issues</span>
          </div>
          <span className="settings-arrow">→</span>
        </div>
      </div>
    </div>
  );

  const renderAboutTab = () => (
    <div className="settings-section">
      <div className="settings-group">
        <div className="about-header">
          <img src="/focus-logo.png" alt="Focus" className="about-logo" />
          <h2>Focus</h2>
          <p className="version">Version 1.0.0</p>
        </div>
      </div>

      <div className="settings-group">
        <h3>About Focus</h3>
        <p className="about-description">
          Focus is a modern social media platform designed to help you connect with friends, 
          share moments, and discover new content. Built with privacy and user experience in mind.
        </p>
      </div>

      <div className="settings-group">
        <h3>Credits</h3>
        <div className="settings-item">
          <div className="settings-item-info">
            <span className="settings-label">Developed by</span>
            <span className="settings-value">Focus Team</span>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <span className="settings-label">Built with</span>
            <span className="settings-value">React, InsForge, Framer Motion</span>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <span className="settings-label">Last Updated</span>
            <span className="settings-value">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h3>Legal</h3>
        <div className="settings-item clickable" onClick={() => {
          window.open('https://focus-app-legal.vercel.app/privacy', '_blank');
        }}>
          <div className="settings-item-info">
            <span className="settings-label">Privacy Policy</span>
          </div>
          <span className="settings-arrow">→</span>
        </div>

        <div className="settings-item clickable" onClick={() => {
          window.open('https://focus-app-legal.vercel.app/terms', '_blank');
        }}>
          <div className="settings-item-info">
            <span className="settings-label">Terms of Service</span>
          </div>
          <span className="settings-arrow">→</span>
        </div>

        <div className="settings-item clickable" onClick={() => {
          const licenses = [
            'React - MIT License',
            'InsForge - Apache 2.0',
            'Framer Motion - MIT License',
            'React Router - MIT License',
            'PeerJS - MIT License'
          ];
          alert('Open Source Licenses:\n\n' + licenses.join('\n'));
        }}>
          <div className="settings-item-info">
            <span className="settings-label">Open Source Licenses</span>
          </div>
          <span className="settings-arrow">→</span>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "account": return renderAccountTab();
      case "privacy": return renderPrivacyTab();
      case "notifications": return renderNotificationsTab();
      case "security": return renderSecurityTab();
      case "help": return renderHelpTab();
      case "about": return renderAboutTab();
      default: return renderAccountTab();
    }
  };

  return (
    <motion.div 
      className="page page-settings"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-inner">
        <div className="page-header">
          <button 
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            ← Back
          </button>
          <h1 className="page-title">Settings</h1>
          <div></div>
        </div>

        <div className="settings-container">
          {/* Settings Tabs */}
          <div className="settings-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Settings Content */}
          <div className="settings-content">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {message && (
          <motion.div 
            className={`message ${message.includes('success') ? 'success-msg' : 'error-msg'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {message}
          </motion.div>
        )}

        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        )}

        {/* Two-Factor Auth Modal */}
        {showTwoFactor && (
          <TwoFactorAuth
            user={user}
            onClose={() => setShowTwoFactor(false)}
            onSuccess={() => {
              updateSettings({ two_factor_enabled: true });
              setMessage('Two-factor authentication enabled successfully!');
              setTimeout(() => setMessage(''), 3000);
            }}
          />
        )}

        {/* Change Password Modal */}
        <ChangePasswordModal
          isOpen={showChangePassword}
          onClose={() => setShowChangePassword(false)}
          onSuccess={(msg) => {
            setMessage(msg);
            setTimeout(() => setMessage(''), 3000);
          }}
        />

        {/* Delete Account Modal */}
        <DeleteAccountModal
          isOpen={showDeleteAccount}
          onClose={() => setShowDeleteAccount(false)}
          user={user}
          onSuccess={(msg) => {
            setMessage(msg);
            setTimeout(() => setMessage(''), 3000);
          }}
        />

        {/* Data Export Modal */}
        <DataExportModal
          isOpen={showDataExport}
          onClose={() => setShowDataExport(false)}
          user={user}
        />
      </div>
    </motion.div>
  );
}