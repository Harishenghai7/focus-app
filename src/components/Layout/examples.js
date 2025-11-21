import React from 'react';
import Layout from './Layout';
import { useLayout } from './useLayout';

// Example 1: Basic Usage
export const BasicLayoutExample = () => {
  return (
    <Layout>
      <h1>Welcome to Focus App</h1>
      <p>This content will be automatically wrapped with the appropriate layout.</p>
    </Layout>
  );
};

// Example 2: Forced Layout Type
export const ProfileLayoutExample = () => {
  return (
    <Layout layoutType="profile">
      <div className="profile-header">
        <img src="/avatar.jpg" alt="Profile" />
        <h1>John Doe</h1>
        <p>Software Developer</p>
      </div>
      <div className="profile-content">
        <div className="posts-grid">
          {/* Profile posts would go here */}
        </div>
      </div>
    </Layout>
  );
};

// Example 3: Wide Layout for Messages
export const MessagesLayoutExample = () => {
  return (
    <Layout layoutType="wide">
      <div className="messages-container">
        <aside className="conversations-sidebar">
          <h2>Conversations</h2>
          {/* Conversation list */}
        </aside>
        <main className="chat-area">
          <div className="chat-header">
            <h3>John Doe</h3>
          </div>
          <div className="messages">
            {/* Messages */}
          </div>
          <div className="message-input">
            {/* Input area */}
          </div>
        </main>
      </div>
    </Layout>
  );
};

// Example 4: Using the Layout Hook
export const ResponsiveComponentExample = () => {
  const { isMobile, isTablet, isDesktop, windowSize, getLayoutType } = useLayout();

  return (
    <Layout>
      <div className="responsive-info">
        <h2>Device Information</h2>
        <p>Window Size: {windowSize.width} x {windowSize.height}</p>
        <p>Device Type: {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}</p>
        <p>Current Layout: {getLayoutType(window.location.pathname)}</p>
        
        {isMobile && (
          <div className="mobile-only-content">
            <p>This content only shows on mobile devices</p>
          </div>
        )}
        
        {isDesktop && (
          <div className="desktop-only-content">
            <p>This content only shows on desktop devices</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Example 5: Custom Styling
export const CustomStyledLayoutExample = () => {
  return (
    <Layout className="custom-app-layout">
      <div className="hero-section">
        <h1>Custom Styled Page</h1>
        <p>This layout has additional custom styling applied.</p>
      </div>
    </Layout>
  );
};

// Example 6: Feed Layout (Default)
export const FeedLayoutExample = () => {
  return (
    <Layout>
      <div className="feed-container">
        <header className="feed-header">
          <h1>Feed</h1>
        </header>
        <div className="posts">
          {[1, 2, 3, 4, 5].map(i => (
            <article key={i} className="post">
              <div className="post-header">
                <img src={`/avatar${i}.jpg`} alt={`User ${i}`} />
                <div className="post-info">
                  <h3>User {i}</h3>
                  <time>2 hours ago</time>
                </div>
              </div>
              <img src={`/post${i}.jpg`} alt={`Post ${i}`} className="post-image" />
              <div className="post-content">
                <p>This is post content number {i}</p>
              </div>
              <div className="post-actions">
                <button>Like</button>
                <button>Comment</button>
                <button>Share</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Layout>
  );
};

// Example 7: Conditional Layout Based on Route
export const ConditionalLayoutExample = () => {
  const { getLayoutType } = useLayout();
  const currentPath = window.location.pathname;
  const layoutType = getLayoutType(currentPath);

  return (
    <Layout>
      <div className="conditional-content">
        <h1>Current Layout: {layoutType}</h1>
        <p>This page adapts its content based on the current layout type.</p>
        
        {layoutType === 'feed' && (
          <div className="feed-specific-content">
            <p>Optimized for feed viewing with 614px max width</p>
          </div>
        )}
        
        {layoutType === 'profile' && (
          <div className="profile-specific-content">
            <p>Optimized for profile viewing with 935px max width</p>
          </div>
        )}
        
        {layoutType === 'wide' && (
          <div className="wide-specific-content">
            <p>Optimized for wide content with 1200px max width</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Example CSS for the examples above
export const exampleStyles = `
.custom-app-layout {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.hero-section {
  text-align: center;
  padding: 4rem 2rem;
}

.feed-container {
  max-width: 100%;
}

.feed-header {
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-secondary-200);
  margin-bottom: 2rem;
}

.post {
  border: 1px solid var(--color-secondary-200);
  border-radius: var(--border-radius-lg);
  margin-bottom: 2rem;
  overflow: hidden;
}

.post-header {
  display: flex;
  align-items: center;
  padding: 1rem;
  gap: 0.75rem;
}

.post-header img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.post-image {
  width: 100%;
  height: auto;
  display: block;
}

.post-content {
  padding: 1rem;
}

.post-actions {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-top: 1px solid var(--color-secondary-200);
}

.post-actions button {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--border-radius-md);
  transition: background-color 0.2s;
}

.post-actions button:hover {
  background-color: var(--color-secondary-100);
}

.messages-container {
  display: grid;
  grid-template-columns: 300px 1fr;
  height: calc(100vh - 2rem);
  gap: 1rem;
}

.conversations-sidebar {
  background: var(--color-background-secondary);
  border-radius: var(--border-radius-lg);
  padding: 1rem;
}

.chat-area {
  background: var(--color-background-secondary);
  border-radius: var(--border-radius-lg);
  display: flex;
  flex-direction: column;
}

.chat-header {
  padding: 1rem;
  border-bottom: 1px solid var(--color-secondary-200);
}

.messages {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.message-input {
  padding: 1rem;
  border-top: 1px solid var(--color-secondary-200);
}

.responsive-info {
  background: var(--color-background-secondary);
  padding: 2rem;
  border-radius: var(--border-radius-lg);
  margin: 2rem 0;
}

.mobile-only-content,
.desktop-only-content {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--color-primary-50);
  border-radius: var(--border-radius-md);
  border-left: 4px solid var(--color-primary-500);
}

.profile-header {
  text-align: center;
  padding: 2rem 0;
  border-bottom: 1px solid var(--color-secondary-200);
  margin-bottom: 2rem;
}

.profile-header img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  margin-bottom: 1rem;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

@media (max-width: 768px) {
  .messages-container {
    grid-template-columns: 1fr;
    height: auto;
  }
  
  .conversations-sidebar {
    display: none;
  }
  
  .posts-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
`;

export default {
  BasicLayoutExample,
  ProfileLayoutExample,
  MessagesLayoutExample,
  ResponsiveComponentExample,
  CustomStyledLayoutExample,
  FeedLayoutExample,
  ConditionalLayoutExample,
  exampleStyles
};
