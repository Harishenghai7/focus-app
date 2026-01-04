import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout/Layout';
import ShareModal from '../components/ShareModal';
import useClipboard from '../hooks/useClipboard';
import {
  FiMail,
  FiMessageSquare,
  FiLink,
  FiShare2,
  FiTwitter,
  FiFacebook,
  FiLinkedin,
  FiCheck,
  FiCopy,
  FiSend,
  FiUsers,
  FiClock
} from 'react-icons/fi';
import { FaWhatsapp, FaTelegram } from 'react-icons/fa';
import './Invite.css';

/**
 * Invite.js - Invite friends to the platform
 * Features:
 * - Invite via SMS
 * - Invite via email
 * - Copy invite link
 * - Share on social media
 * - Track sent invites
 */
export default function Invite({ user }) {
  const { copy } = useClipboard();
  const [inviteLink, setInviteLink] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sentInvites, setSentInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState('send'); // 'send' or 'history'

  useEffect(() => {
    if (user?.id) {
      generateInviteLink();
      fetchSentInvites();
    }
  }, [user]);

  const generateInviteLink = () => {
    const baseUrl = window.location.origin;
    const referralCode = user?.username || user?.id;
    const link = `${baseUrl}/signup?ref=${referralCode}`;
    setInviteLink(link);
  };

  const fetchSentInvites = async () => {
    try {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSentInvites(data || []);
    } catch (error) {
      console.error('Error fetching sent invites:', error);
    }
  };

  const handleCopyLink = async () => {
    try {
      await copy(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  const saveInvite = async (method, recipient) => {
    try {
      const { error } = await supabase
        .from('invites')
        .insert({
          user_id: user.id,
          method,
          recipient,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      await fetchSentInvites();
    } catch (error) {
      console.error('Error saving invite:', error);
    }
  };

  const handleEmailInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      // In a real app, you'd send an email via an API
      const emailSubject = `Join me on FocusApp!`;
      const emailBody = `Hi! I'm inviting you to join FocusApp, an amazing social platform.\n\nClick here to sign up: ${inviteLink}\n\n${message || 'Hope to see you there!'}`;

      // Open email client
      const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      window.location.href = mailtoLink;

      // Save invite record
      await saveInvite('email', email);

      setEmail('');
      setMessage('');
      alert('Email invitation prepared! Please send it from your email client.');
    } catch (error) {
      console.error('Error sending email invite:', error);
      alert('Failed to prepare email invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleSMSInvite = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setLoading(true);
    try {
      const smsBody = `Hey! Join me on FocusApp: ${inviteLink} ${message ? `\n${message}` : ''}`;

      // Open SMS app
      const smsLink = `sms:${phone}?body=${encodeURIComponent(smsBody)}`;
      window.location.href = smsLink;

      // Save invite record
      await saveInvite('sms', phone);

      setPhone('');
      setMessage('');
      alert('SMS invitation prepared! Please send it from your messaging app.');
    } catch (error) {
      console.error('Error sending SMS invite:', error);
      alert('Failed to prepare SMS invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialShare = async (platform) => {
    const shareText = `Join me on FocusApp!`;
    const shareUrl = inviteLink;

    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
      default:
        return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
    await saveInvite(platform, 'social');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  if (!user) {
    return (
      <Layout layoutType="feed">
        <div className="invite-page">
          <div className="invite-empty">
            <FiUsers size={48} />
            <p>Please log in to invite friends</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout layoutType="feed">
      <div className="invite-page">
        {/* Header */}
        <div className="invite-header">
          <div className="invite-header-content">
            <FiUsers className="invite-header-icon" size={32} />
            <div>
              <h1>Invite Friends</h1>
              <p>Share FocusApp with your friends and grow our community</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="invite-tabs">
          <button
            className={`tab-btn ${activeTab === 'send' ? 'active' : ''}`}
            onClick={() => setActiveTab('send')}
          >
            <FiSend size={18} />
            <span>Send Invites</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <FiClock size={18} />
            <span>History</span>
            {sentInvites.length > 0 && (
              <span className="badge">{sentInvites.length}</span>
            )}
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'send' ? (
            <motion.div
              key="send"
              className="invite-content"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Invite Link Section */}
              <div className="invite-section">
                <h2>Your Invite Link</h2>
                <div className="invite-link-box">
                  <div className="invite-link-wrapper">
                    <FiLink className="link-icon" />
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="invite-link-input"
                    />
                  </div>
                  <button
                    className={`copy-btn ${copied ? 'copied' : ''}`}
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <>
                        <FiCheck />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <FiCopy />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Email Invite Section */}
              <div className="invite-section">
                <h2>
                  <FiMail />
                  Invite via Email
                </h2>
                <form onSubmit={handleEmailInvite} className="invite-form">
                  <input
                    type="email"
                    placeholder="friend@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="invite-input"
                    required
                  />
                  <textarea
                    placeholder="Add a personal message (optional)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="invite-textarea"
                    rows={3}
                  />
                  <button
                    type="submit"
                    className="invite-submit-btn"
                    disabled={loading}
                  >
                    <FiMail />
                    <span>{loading ? 'Preparing...' : 'Send Email Invite'}</span>
                  </button>
                </form>
              </div>

              {/* SMS Invite Section */}
              <div className="invite-section">
                <h2>
                  <FiMessageSquare />
                  Invite via SMS
                </h2>
                <form onSubmit={handleSMSInvite} className="invite-form">
                  <input
                    type="tel"
                    placeholder="+1234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="invite-input"
                    required
                  />
                  <textarea
                    placeholder="Add a personal message (optional)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="invite-textarea"
                    rows={3}
                  />
                  <button
                    type="submit"
                    className="invite-submit-btn"
                    disabled={loading}
                  >
                    <FiMessageSquare />
                    <span>{loading ? 'Preparing...' : 'Send SMS Invite'}</span>
                  </button>
                </form>
              </div>

              {/* Social Media Share Section */}
              <div className="invite-section">
                <h2>
                  <FiShare2 />
                  Share on Social Media
                </h2>
                <div className="social-buttons">
                  <button
                    className="social-btn twitter"
                    onClick={() => handleSocialShare('twitter')}
                  >
                    <FiTwitter />
                    <span>Twitter</span>
                  </button>
                  <button
                    className="social-btn facebook"
                    onClick={() => handleSocialShare('facebook')}
                  >
                    <FiFacebook />
                    <span>Facebook</span>
                  </button>
                  <button
                    className="social-btn linkedin"
                    onClick={() => handleSocialShare('linkedin')}
                  >
                    <FiLinkedin />
                    <span>LinkedIn</span>
                  </button>
                  <button
                    className="social-btn whatsapp"
                    onClick={() => handleSocialShare('whatsapp')}
                  >
                    <FaWhatsapp />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    className="social-btn telegram"
                    onClick={() => handleSocialShare('telegram')}
                  >
                    <FaTelegram />
                    <span>Telegram</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="history"
              className="invite-content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="invite-section">
                <h2>
                  <FiClock />
                  Invite History
                </h2>
                {sentInvites.length === 0 ? (
                  <div className="invite-history-empty">
                    <FiUsers size={48} />
                    <p>No invites sent yet</p>
                    <button
                      className="switch-tab-btn"
                      onClick={() => setActiveTab('send')}
                    >
                      Send Your First Invite
                    </button>
                  </div>
                ) : (
                  <div className="invite-history-list">
                    {sentInvites.map((invite) => (
                      <motion.div
                        key={invite.id}
                        className="invite-history-item"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="invite-history-icon">
                          {invite.method === 'email' && <FiMail />}
                          {invite.method === 'sms' && <FiMessageSquare />}
                          {invite.method === 'twitter' && <FiTwitter />}
                          {invite.method === 'facebook' && <FiFacebook />}
                          {invite.method === 'linkedin' && <FiLinkedin />}
                          {invite.method === 'whatsapp' && <FaWhatsapp />}
                          {invite.method === 'telegram' && <FaTelegram />}
                          {!['email', 'sms', 'twitter', 'facebook', 'linkedin', 'whatsapp', 'telegram'].includes(invite.method) && <FiShare2 />}
                        </div>
                        <div className="invite-history-info">
                          <div className="invite-history-method">
                            {invite.method.charAt(0).toUpperCase() + invite.method.slice(1)}
                          </div>
                          <div className="invite-history-recipient">
                            {invite.recipient !== 'social' ? invite.recipient : 'Shared on social media'}
                          </div>
                        </div>
                        <div className="invite-history-date">
                          {formatDate(invite.created_at)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          contentId={user.id}
          contentType="invite"
          contentUrl={inviteLink}
          user={user}
          onClose={() => setShowShareModal(false)}
          isOpen={showShareModal}
        />
      )}
    </Layout>
  );
}
