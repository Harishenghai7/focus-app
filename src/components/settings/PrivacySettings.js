import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useLanguage } from '../../hooks/useLanguage';

const PrivacySettings = ({ user, settings, onUpdate, onSuccess }) => {
  const { t } = useLanguage();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBlocked, setTotalBlocked] = useState(0);
  const [unblocking, setUnblocking] = useState({});
  const [oauthConnections, setOauthConnections] = useState({});
  
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    fetchBlockedUsers();
    fetchOAuthConnections();
  }, [currentPage]);

  const fetchBlockedUsers = async () => {
    try {
      setLoadingBlocked(true);
      
      // Get total count
      const { count } = await supabase
        .from('blocked_users')
        .select('*', { count: 'exact', head: true })
        .eq('blocker_id', user.id);
      
      setTotalBlocked(count || 0);

      // Get paginated blocked users
      const { data, error } = await supabase
        .from('blocked_users')
        .select(`
          id,
          blocked_id,
          created_at,
          profiles:blocked_id (
            id,
            nickname,
            full_name,
            avatar_url
          )
        `)
        .eq('blocker_id', user.id)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (error) throw error;

      setBlockedUsers(data || []);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    } finally {
      setLoadingBlocked(false);
    }
  };

  const fetchOAuthConnections = async () => {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      
      if (error) throw error;

      const identities = authUser?.identities || [];
      const connections = {
        google: identities.some(i => i.provider === 'google'),
        github: identities.some(i => i.provider === 'github'),
        discord: identities.some(i => i.provider === 'discord'),
      };

      setOauthConnections(connections);
    } catch (error) {
      console.error('Error fetching OAuth connections:', error);
    }
  };

  const handleToggle = async (setting, value) => {
    const success = await onUpdate({ [setting]: value });
    if (success) {
      onSuccess(`Privacy setting updated`);
    }
  };

  const handleUnblock = async (blockedUserId, blockRecordId) => {
    setUnblocking({ ...unblocking, [blockedUserId]: true });

    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('id', blockRecordId);

      if (error) throw error;

      setBlockedUsers(blockedUsers.filter(u => u.id !== blockRecordId));
      setTotalBlocked(totalBlocked - 1);
      onSuccess('User unblocked successfully');
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert('Failed to unblock user. Please try again.');
    } finally {
      setUnblocking({ ...unblocking, [blockedUserId]: false });
    }
  };

  const handleOAuthToggle = async (provider) => {
    if (oauthConnections[provider]) {
      // Disconnect
      try {
        const { error } = await supabase.auth.unlinkIdentity({
          provider
        });

        if (error) throw error;

        setOauthConnections({ ...oauthConnections, [provider]: false });
        onSuccess(`Disconnected from ${provider}`);
      } catch (error) {
        console.error(`Error disconnecting ${provider}:`, error);
        alert(`Failed to disconnect from ${provider}`);
      }
    } else {
      // Connect
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/settings`,
          skipBrowserRedirect: false
        }
      });

      if (error) {
        console.error(`Error connecting ${provider}:`, error);
        alert(`Failed to connect to ${provider}`);
      }
    }
  };

  const totalPages = Math.ceil(totalBlocked / ITEMS_PER_PAGE);

  return (
    <div className="privacy-settings">
      <h2 className="section-title">{t('privacy.title')}</h2>

      {/* Privacy Toggles */}
      <div className="settings-group">
        <div className="settings-field toggle-field">
          <div className="toggle-info">
            <label className="field-label">{t('privacy.privateAccount')}</label>
            <p className="field-description">
              Only approved followers can see your posts
            </p>
          </div>
          <label className="settings-switch">
            <input
              type="checkbox"
              checked={settings?.private_account || false}
              onChange={(e) => handleToggle('private_account', e.target.checked)}
              role="switch"
              aria-checked={settings?.private_account || false}
            />
            <span className="switch-slider"></span>
          </label>
        </div>

        <div className="settings-field toggle-field">
          <div className="toggle-info">
            <label className="field-label">{t('privacy.showActivityStatus')}</label>
            <p className="field-description">
              Let others see when you're active
            </p>
          </div>
          <label className="settings-switch">
            <input
              type="checkbox"
              checked={settings?.show_activity_status ?? true}
              onChange={(e) => handleToggle('show_activity_status', e.target.checked)}
              role="switch"
              aria-checked={settings?.show_activity_status ?? true}
            />
            <span className="switch-slider"></span>
          </label>
        </div>

        <div className="settings-field toggle-field">
          <div className="toggle-info">
            <label className="field-label">{t('privacy.allowMessages')}</label>
            <p className="field-description">
              Allow message requests from people you don't follow
            </p>
          </div>
          <label className="settings-switch">
            <input
              type="checkbox"
              checked={settings?.allow_message_requests ?? true}
              onChange={(e) => handleToggle('allow_message_requests', e.target.checked)}
              role="switch"
              aria-checked={settings?.allow_message_requests ?? true}
            />
            <span className="switch-slider"></span>
          </label>
        </div>

        <div className="settings-field toggle-field">
          <div className="toggle-info">
            <label className="field-label">{t('privacy.allowCalls')}</label>
            <p className="field-description">
              Allow voice and video calls
            </p>
          </div>
          <label className="settings-switch">
            <input
              type="checkbox"
              checked={settings?.allow_calls ?? true}
              onChange={(e) => handleToggle('allow_calls', e.target.checked)}
              role="switch"
              aria-checked={settings?.allow_calls ?? true}
            />
            <span className="switch-slider"></span>
          </label>
        </div>

        <div className="settings-field toggle-field">
          <div className="toggle-info">
            <label className="field-label">{t('privacy.allowTags')}</label>
            <p className="field-description">
              Allow others to tag you in posts
            </p>
          </div>
          <label className="settings-switch">
            <input
              type="checkbox"
              checked={settings?.allow_tags ?? true}
              onChange={(e) => handleToggle('allow_tags', e.target.checked)}
              role="switch"
              aria-checked={settings?.allow_tags ?? true}
            />
            <span className="switch-slider"></span>
          </label>
        </div>

        <div className="settings-field toggle-field">
          <div className="toggle-info">
            <label className="field-label">{t('privacy.allowMentions')}</label>
            <p className="field-description">
              Allow others to mention you in comments
            </p>
          </div>
          <label className="settings-switch">
            <input
              type="checkbox"
              checked={settings?.allow_mentions ?? true}
              onChange={(e) => handleToggle('allow_mentions', e.target.checked)}
              role="switch"
              aria-checked={settings?.allow_mentions ?? true}
            />
            <span className="switch-slider"></span>
          </label>
        </div>

        <div className="settings-field toggle-field">
          <div className="toggle-info">
            <label className="field-label">{t('privacy.discoverable')}</label>
            <p className="field-description">
              Allow your profile to appear in search results and suggestions
            </p>
          </div>
          <label className="settings-switch">
            <input
              type="checkbox"
              checked={settings?.discoverable ?? true}
              onChange={(e) => handleToggle('discoverable', e.target.checked)}
              role="switch"
              aria-checked={settings?.discoverable ?? true}
            />
            <span className="switch-slider"></span>
          </label>
        </div>
      </div>

      {/* OAuth Connections */}
      <div className="settings-group">
        <h3 className="group-title">Connected Accounts</h3>
        
        <div className="oauth-connections">
          <div className="oauth-item">
            <div className="oauth-info">
              <span className="oauth-icon">🔍</span>
              <div>
                <div className="oauth-name">Google</div>
                <div className="oauth-status">
                  {oauthConnections.google ? 'Connected' : 'Not connected'}
                </div>
              </div>
            </div>
            <button
              className={`oauth-button ${oauthConnections.google ? 'connected' : ''}`}
              onClick={() => handleOAuthToggle('google')}
            >
              {oauthConnections.google ? 'Disconnect' : 'Connect'}
            </button>
          </div>

          <div className="oauth-item">
            <div className="oauth-info">
              <span className="oauth-icon">🐙</span>
              <div>
                <div className="oauth-name">GitHub</div>
                <div className="oauth-status">
                  {oauthConnections.github ? 'Connected' : 'Not connected'}
                </div>
              </div>
            </div>
            <button
              className={`oauth-button ${oauthConnections.github ? 'connected' : ''}`}
              onClick={() => handleOAuthToggle('github')}
            >
              {oauthConnections.github ? 'Disconnect' : 'Connect'}
            </button>
          </div>

          <div className="oauth-item">
            <div className="oauth-info">
              <span className="oauth-icon">💬</span>
              <div>
                <div className="oauth-name">Discord</div>
                <div className="oauth-status">
                  {oauthConnections.discord ? 'Connected' : 'Not connected'}
                </div>
              </div>
            </div>
            <button
              className={`oauth-button ${oauthConnections.discord ? 'connected' : ''}`}
              onClick={() => handleOAuthToggle('discord')}
            >
              {oauthConnections.discord ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        </div>
      </div>

      {/* Blocked Users */}
      <div className="settings-group">
        <h3 className="group-title">{t('privacy.blockedUsers')} ({totalBlocked})</h3>
        
        {loadingBlocked ? (
          <div className="loading-text">Loading blocked users...</div>
        ) : blockedUsers.length === 0 ? (
          <p className="empty-state">No blocked users</p>
        ) : (
          <>
            <div className="blocked-users-list">
              {blockedUsers.map((block) => (
                <div key={block.id} className="blocked-user-item">
                  <div className="user-info">
                    <img 
                      src={block.profiles?.avatar_url || '/default-avatar.png'} 
                      alt={block.profiles?.nickname}
                      className="user-avatar"
                    />
                    <div className="user-details">
                      <div className="user-name">{block.profiles?.full_name || block.profiles?.nickname}</div>
                      <div className="user-username">@{block.profiles?.nickname}</div>
                    </div>
                  </div>
                  <button
                    className="unblock-button"
                    onClick={() => handleUnblock(block.blocked_id, block.id)}
                    disabled={unblocking[block.blocked_id]}
                  >
                    {unblocking[block.blocked_id] ? 'Unblocking...' : 'Unblock'}
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-button"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </button>
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="page-button"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PrivacySettings;
