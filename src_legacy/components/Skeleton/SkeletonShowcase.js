/**
 * SkeletonShowcase Component
 * 
 * Visual showcase of all skeleton components
 * Great for testing and demoing
 * 
 * Usage: Import and add to your app routes
 * <Route path="/skeleton-showcase" element={<SkeletonShowcase />} />
 */

import React from 'react';
import {
  PostSkeleton,
  PostListSkeleton,
  ProfileSkeleton,
  ProfileHeaderSkeleton,
  ProfileGridSkeleton,
  MessageSkeleton,
  ChatListSkeleton,
  ChatListItemSkeleton,
  ConversationSkeleton,
  CommentSkeleton,
  CommentSectionSkeleton,
  CommentInputSkeleton,
} from '../Skeleton';
import '../styles/skeleton.css';

export function SkeletonShowcase() {
  const [selectedSection, setSelectedSection] = React.useState('posts');

  const sections = [
    { id: 'posts', label: '📝 Posts', icon: '📝' },
    { id: 'profile', label: '👤 Profile', icon: '👤' },
    { id: 'messages', label: '💬 Messages', icon: '💬' },
    { id: 'comments', label: '💭 Comments', icon: '💭' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>🎯 Skeleton Loaders Showcase</h1>
        <p>Beautiful loading states for every component</p>
      </div>

      <div style={styles.navigation}>
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setSelectedSection(section.id)}
            style={{
              ...styles.navButton,
              ...(selectedSection === section.id ? styles.navButtonActive : {}),
            }}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {/* POSTS SECTION */}
        {selectedSection === 'posts' && (
          <div>
            <h2>📝 Post Skeletons</h2>

            <div style={styles.section}>
              <h3>Single Post</h3>
              <PostSkeleton />
            </div>

            <div style={styles.section}>
              <h3>Post with Custom Lines</h3>
              <PostSkeleton lines={2} />
            </div>

            <div style={styles.section}>
              <h3>Post Without Actions</h3>
              <PostSkeleton showActions={false} />
            </div>

            <div style={styles.section}>
              <h3>Post List (5 Items)</h3>
              <PostListSkeleton count={5} />
            </div>

            <div style={styles.section}>
              <h3>Post List (3 Items)</h3>
              <PostListSkeleton count={3} />
            </div>
          </div>
        )}

        {/* PROFILE SECTION */}
        {selectedSection === 'profile' && (
          <div>
            <h2>👤 Profile Skeletons</h2>

            <div style={styles.section}>
              <h3>Complete Profile Page</h3>
              <ProfileSkeleton postCount={6} />
            </div>

            <div style={styles.section}>
              <h3>Profile Header Only</h3>
              <ProfileHeaderSkeleton />
            </div>

            <div style={styles.section}>
              <h3>Posts Grid Only</h3>
              <ProfileGridSkeleton count={9} />
            </div>

            <div style={styles.section}>
              <h3>Posts Grid (12 Items)</h3>
              <ProfileGridSkeleton count={12} />
            </div>
          </div>
        )}

        {/* MESSAGES SECTION */}
        {selectedSection === 'messages' && (
          <div>
            <h2>💬 Message Skeletons</h2>

            <div style={styles.section}>
              <h3>Single Message - Received</h3>
              <MessageSkeleton isCurrentUser={false} />
            </div>

            <div style={styles.section}>
              <h3>Single Message - Sent</h3>
              <MessageSkeleton isCurrentUser={true} />
            </div>

            <div style={styles.section}>
              <h3>Chat List Item</h3>
              <ChatListItemSkeleton />
            </div>

            <div style={styles.section}>
              <h3>Chat List (5 Items)</h3>
              <ChatListSkeleton count={5} />
            </div>

            <div style={styles.section}>
              <h3>Full Conversation</h3>
              <ConversationSkeleton messageCount={5} />
            </div>

            <div style={styles.section}>
              <h3>Full Conversation (10 Messages)</h3>
              <ConversationSkeleton messageCount={10} />
            </div>
          </div>
        )}

        {/* COMMENTS SECTION */}
        {selectedSection === 'comments' && (
          <div>
            <h2>💭 Comment Skeletons</h2>

            <div style={styles.section}>
              <h3>Single Comment</h3>
              <CommentSkeleton isReply={false} />
            </div>

            <div style={styles.section}>
              <h3>Comment Reply (Indented)</h3>
              <CommentSkeleton isReply={true} />
            </div>

            <div style={styles.section}>
              <h3>Comment Input</h3>
              <CommentInputSkeleton />
            </div>

            <div style={styles.section}>
              <h3>Comment Section (4 Comments with Replies)</h3>
              <CommentSectionSkeleton count={4} hasReplies={true} />
            </div>

            <div style={styles.section}>
              <h3>Comment Section (6 Comments)</h3>
              <CommentSectionSkeleton count={6} hasReplies={false} />
            </div>
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <p>💡 Tip: Copy and use these components in your pages!</p>
        <p>📚 See SKELETON-LOADERS-GUIDE.md for full documentation</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '20px',
  },
  navigation: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    flexWrap: 'wrap',
  },
  navButton: {
    padding: '10px 20px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  navButtonActive: {
    background: '#4a90e2',
    color: '#fff',
    borderColor: '#4a90e2',
  },
  content: {
    marginBottom: '40px',
  },
  section: {
    marginBottom: '40px',
    padding: '20px',
    background: '#f9f9f9',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },
  footer: {
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
    borderTop: '1px solid #e0e0e0',
    paddingTop: '20px',
  },
};

export default SkeletonShowcase;
