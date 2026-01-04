import React, { useState } from 'react';
import PrivacySettings from './PrivacySettings';

/**
 * Example usage of PrivacySettings component
 */
const PrivacySettingsExample = () => {
  // Initial privacy settings object
  const [privacySettings, setPrivacySettings] = useState({
    accountPrivate: false,
    storySharing: true,
    allowStoryReplies: true,
    showActivityStatus: true,
    messagePermission: 'everyone',
    allowComments: 'everyone',
    allowTags: 'followers',
    allowMentions: 'everyone'
  });

  // Handler for when settings change
  const handlePrivacyChange = (newSettings) => {
    console.log('Privacy settings updated:', newSettings);
    setPrivacySettings(newSettings);
    
    // Here you would typically:
    // 1. Save to backend API
    // 2. Update user context/state
    // 3. Show success notification
    
    // Example API call (commented out):
    // await api.updatePrivacySettings(newSettings);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <PrivacySettings 
        settings={privacySettings}
        onChange={handlePrivacyChange}
      />
      
      {/* Debug output - remove in production */}
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}>
        <h3>Current Settings (Debug):</h3>
        <pre>{JSON.stringify(privacySettings, null, 2)}</pre>
      </div>
    </div>
  );
};

export default PrivacySettingsExample;
