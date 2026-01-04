import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './PrivacySettings.module.css';

/**
 * PrivacySettings
 * Comprehensive privacy controls interface with account privacy, story settings,
 * activity status, messages, comments, tags, and mentions controls.
 * @param {Object} settings - Privacy settings object
 * @param {Function} onChange - Callback when settings change
 * @example <PrivacySettings settings={privacySettings} onChange={handleChange} />
 */
const PrivacySettings = ({ settings, onChange }) => {
  // Initialize default settings if not provided
  const defaultSettings = {
    accountPrivate: false,
    storySharing: true,
    allowStoryReplies: true,
    showActivityStatus: true,
    messagePermission: 'everyone', // everyone, followers, off
    allowComments: 'everyone', // everyone, followers, off
    allowTags: 'everyone', // everyone, followers, off
    allowMentions: 'everyone', // everyone, followers, off
    ...settings
  };

  const [privacySettings, setPrivacySettings] = useState(defaultSettings);

  // Handle toggle switches (boolean values)
  const handleToggle = (key) => {
    const updatedSettings = { ...privacySettings, [key]: !privacySettings[key] };
    setPrivacySettings(updatedSettings);
    onChange(updatedSettings);
  };

  // Handle radio button selections
  const handleRadioChange = (key, value) => {
    const updatedSettings = { ...privacySettings, [key]: value };
    setPrivacySettings(updatedSettings);
    onChange(updatedSettings);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Privacy Settings</h2>
      
      {/* Two-column layout */}
      <div className={styles.twoColumnLayout}>
        
        {/* Left Column */}
        <div className={styles.column}>
          
          {/* Account Privacy */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Account Privacy</h3>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <label className={styles.label} htmlFor="accountPrivate">
                  Private Account
                </label>
                <p className={styles.description}>
                  When your account is private, only followers you approve can see your posts
                </p>
              </div>
              <label className={styles.toggle}>
                <input
                  id="accountPrivate"
                  type="checkbox"
                  checked={privacySettings.accountPrivate}
                  onChange={() => handleToggle('accountPrivate')}
                  aria-label="Toggle account privacy"
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>

          {/* Story Settings */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Story Settings</h3>
            
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <label className={styles.label} htmlFor="storySharing">
                  Allow Story Sharing
                </label>
                <p className={styles.description}>
                  Let others share your stories
                </p>
              </div>
              <label className={styles.toggle}>
                <input
                  id="storySharing"
                  type="checkbox"
                  checked={privacySettings.storySharing}
                  onChange={() => handleToggle('storySharing')}
                  aria-label="Toggle story sharing"
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <label className={styles.label} htmlFor="allowStoryReplies">
                  Allow Story Replies
                </label>
                <p className={styles.description}>
                  Let people reply to your stories
                </p>
              </div>
              <label className={styles.toggle}>
                <input
                  id="allowStoryReplies"
                  type="checkbox"
                  checked={privacySettings.allowStoryReplies}
                  onChange={() => handleToggle('allowStoryReplies')}
                  aria-label="Toggle story replies"
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>

          {/* Activity Status */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Activity Status</h3>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <label className={styles.label} htmlFor="showActivityStatus">
                  Show Activity Status
                </label>
                <p className={styles.description}>
                  Let others see when you're active
                </p>
              </div>
              <label className={styles.toggle}>
                <input
                  id="showActivityStatus"
                  type="checkbox"
                  checked={privacySettings.showActivityStatus}
                  onChange={() => handleToggle('showActivityStatus')}
                  aria-label="Toggle activity status"
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>

          {/* Messages */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Messages</h3>
            <p className={styles.sectionDescription}>
              Control who can send you messages
            </p>
            
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="messagePermission"
                  value="everyone"
                  checked={privacySettings.messagePermission === 'everyone'}
                  onChange={(e) => handleRadioChange('messagePermission', e.target.value)}
                  aria-label="Allow messages from everyone"
                />
                <span className={styles.radioText}>Everyone</span>
              </label>
              
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="messagePermission"
                  value="followers"
                  checked={privacySettings.messagePermission === 'followers'}
                  onChange={(e) => handleRadioChange('messagePermission', e.target.value)}
                  aria-label="Allow messages from followers only"
                />
                <span className={styles.radioText}>Followers Only</span>
              </label>
              
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="messagePermission"
                  value="off"
                  checked={privacySettings.messagePermission === 'off'}
                  onChange={(e) => handleRadioChange('messagePermission', e.target.value)}
                  aria-label="Disable messages"
                />
                <span className={styles.radioText}>Off</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.column}>
          
          {/* Comment Controls */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Comment Controls</h3>
            <p className={styles.sectionDescription}>
              Control who can comment on your posts
            </p>
            
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="allowComments"
                  value="everyone"
                  checked={privacySettings.allowComments === 'everyone'}
                  onChange={(e) => handleRadioChange('allowComments', e.target.value)}
                  aria-label="Allow comments from everyone"
                />
                <span className={styles.radioText}>Everyone</span>
              </label>
              
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="allowComments"
                  value="followers"
                  checked={privacySettings.allowComments === 'followers'}
                  onChange={(e) => handleRadioChange('allowComments', e.target.value)}
                  aria-label="Allow comments from followers only"
                />
                <span className={styles.radioText}>Followers Only</span>
              </label>
              
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="allowComments"
                  value="off"
                  checked={privacySettings.allowComments === 'off'}
                  onChange={(e) => handleRadioChange('allowComments', e.target.value)}
                  aria-label="Disable comments"
                />
                <span className={styles.radioText}>Off</span>
              </label>
            </div>
          </div>

          {/* Tag Controls */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Tag Controls</h3>
            <p className={styles.sectionDescription}>
              Control who can tag you in posts
            </p>
            
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="allowTags"
                  value="everyone"
                  checked={privacySettings.allowTags === 'everyone'}
                  onChange={(e) => handleRadioChange('allowTags', e.target.value)}
                  aria-label="Allow tags from everyone"
                />
                <span className={styles.radioText}>Everyone</span>
              </label>
              
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="allowTags"
                  value="followers"
                  checked={privacySettings.allowTags === 'followers'}
                  onChange={(e) => handleRadioChange('allowTags', e.target.value)}
                  aria-label="Allow tags from followers only"
                />
                <span className={styles.radioText}>Followers Only</span>
              </label>
              
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="allowTags"
                  value="off"
                  checked={privacySettings.allowTags === 'off'}
                  onChange={(e) => handleRadioChange('allowTags', e.target.value)}
                  aria-label="Disable tags"
                />
                <span className={styles.radioText}>Off</span>
              </label>
            </div>
          </div>

          {/* Mention Controls */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Mention Controls</h3>
            <p className={styles.sectionDescription}>
              Control who can mention you in comments
            </p>
            
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="allowMentions"
                  value="everyone"
                  checked={privacySettings.allowMentions === 'everyone'}
                  onChange={(e) => handleRadioChange('allowMentions', e.target.value)}
                  aria-label="Allow mentions from everyone"
                />
                <span className={styles.radioText}>Everyone</span>
              </label>
              
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="allowMentions"
                  value="followers"
                  checked={privacySettings.allowMentions === 'followers'}
                  onChange={(e) => handleRadioChange('allowMentions', e.target.value)}
                  aria-label="Allow mentions from followers only"
                />
                <span className={styles.radioText}>Followers Only</span>
              </label>
              
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="allowMentions"
                  value="off"
                  checked={privacySettings.allowMentions === 'off'}
                  onChange={(e) => handleRadioChange('allowMentions', e.target.value)}
                  aria-label="Disable mentions"
                />
                <span className={styles.radioText}>Off</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

PrivacySettings.propTypes = {
  settings: PropTypes.shape({
    accountPrivate: PropTypes.bool,
    storySharing: PropTypes.bool,
    allowStoryReplies: PropTypes.bool,
    showActivityStatus: PropTypes.bool,
    messagePermission: PropTypes.oneOf(['everyone', 'followers', 'off']),
    allowComments: PropTypes.oneOf(['everyone', 'followers', 'off']),
    allowTags: PropTypes.oneOf(['everyone', 'followers', 'off']),
    allowMentions: PropTypes.oneOf(['everyone', 'followers', 'off'])
  }),
  onChange: PropTypes.func.isRequired
};

PrivacySettings.defaultProps = {
  settings: {}
};

export default React.memo(PrivacySettings);
