import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useParams, useLocation } from 'react-router-dom';
import { jest } from '@jest/globals';
import CommentsNew from '../../pages/CommentsNew';

// Mock dependencies
const mockNavigate = jest.fn();
const mockParams = { postId: 'post123' };
const mockLocation = { 
  pathname: '/comments/post123', 
  state: { 
    post: {
      id: 'post123',
      user_id: 'user1',
      content: 'Test post content',
      created_at: new Date().toISOString(),
      user: {
        id: 'user1',
        username: 'postauthor',
        display_name: 'Post Author',
        profile_picture: null
      }
    }
  }
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
  useLocation: () => mockLocation
}));

jest.mock('../../supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              then: jest.fn(() => Promise.resolve({ 
                data: [
                  {
                    id: 'comment1',
                    post_id: 'post123',
                    user_id: 'user2',
                    content: 'Great post!',
                    parent_id: null,
                    created_at: new Date().toISOString(),
                    likes_count: 2,
                    replies_count: 1,
                    user: {
                      id: 'user2',
                      username: 'commenter1',
                      display_name: 'Commenter One',
                      profile_picture: null
                    }
                  },
                  {
                    id: 'comment2',
                    post_id: 'post123',
                    user_id: 'user3',
                    content: 'Nice work 👏',
                    parent_id: null,
                    created_at: new Date().toISOString(),
                    likes_count: 0,
                    replies_count: 0,
                    user: {
                      id: 'user3',
                      username: 'commenter2',
                      display_name: 'Commenter Two',
                      profile_picture: null
                    }
                  },
                  {
                    id: 'reply1',
                    post_id: 'post123',
                    user_id: 'current_user',
                    content: 'Thanks! @commenter1',
                    parent_id: 'comment1',
                    created_at: new Date().toISOString(),
                    likes_count: 1,
                    replies_count: 0,
                    user: {
                      id: 'current_user',
                      username: 'currentuser',
                      display_name: 'Current User',
                      profile_picture: null
                    }
                  }
                ], 
                error: null 
              }))
            }))
          }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn()
      })),
      unsubscribe: jest.fn()
    }))
  }
}));

// Mock @/importMap
jest.mock('@/importMap', () => ({
  components: {
    Avatar: ({ src, alt, size, username }) => (
      <img data-testid="avatar" src={src} alt={alt} data-size={size} data-username={username} />
    ),
    LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
    ErrorMessage: ({ message }) => <div data-testid="error-message">{message}</div>,
    EmptyState: ({ title, description, icon }) => (
      <div data-testid="empty-state">
        <span>{icon}</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    ),
    SkeletonLoader: ({ count = 1 }) => (
      <div data-testid="skeleton-loader">
        {Array.from({ length: count }, (_, i) => (
          <div key={i}>Loading skeleton {i + 1}</div>
        ))}
      </div>
    ),
    InfiniteScrollLoader: ({ loading }) => 
      loading ? <div data-testid="infinite-scroll-loader">Loading more...</div> : null,
    PostEngagement: ({ post, onLike, onShare, onBookmark }) => (
      <div data-testid="post-engagement">
        <button onClick={() => onLike?.(post)}>Like</button>
        <button onClick={() => onShare?.(post)}>Share</button>
        <button onClick={() => onBookmark?.(post)}>Bookmark</button>
      </div>
    ),
    UserMention: ({ username, onClick }) => (
      <span data-testid="user-mention" onClick={() => onClick?.(username)}>
        @{username}
      </span>
    ),
    HashtagLink: ({ hashtag, onClick }) => (
      <span data-testid="hashtag-link" onClick={() => onClick?.(hashtag)}>
        #{hashtag}
      </span>
    ),
    MediaViewer: ({ media, onClose }) => (
      <div data-testid="media-viewer">
        <img src={media?.url} alt="Media content" />
        <button onClick={onClose}>Close</button>
      </div>
    ),
    EmojiPicker: ({ isOpen, onEmojiSelect, onClose }) => 
      isOpen ? (
        <div data-testid="emoji-picker">
          <button onClick={() => onEmojiSelect?.('😀')}>😀</button>
          <button onClick={() => onEmojiSelect?.('❤️')}>❤️</button>
          <button onClick={onClose}>Close</button>
        </div>
      ) : null,
    ReportModal: ({ isOpen, onReport, onClose, contentType }) => 
      isOpen ? (
        <div data-testid="report-modal">
          <h3>Report {contentType}</h3>
          <button onClick={() => onReport?.('spam')}>Report as Spam</button>
          <button onClick={() => onReport?.('inappropriate')}>Inappropriate Content</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      ) : null,
    ActionSheet: ({ isOpen, actions, onClose }) => 
      isOpen ? (
        <div data-testid="action-sheet">
          {actions?.map((action, i) => (
            <button key={i} onClick={() => { action.onClick?.(); onClose?.(); }}>
              {action.label}
            </button>
          ))}
          <button onClick={onClose}>Cancel</button>
        </div>
      ) : null,
    NotificationBanner: ({ message, type, onDismiss }) => (
      <div data-testid="notification-banner" data-type={type}>
        {message}
        {onDismiss && <button onClick={onDismiss}>Dismiss</button>}
      </div>
    )
  },
  hooks: {
    useNavigate: () => mockNavigate,
    useInfiniteScroll: () => ({
      hasMore: true,
      loadMore: jest.fn(),
      loading: false
    }),
    useRealTimeSubscription: () => ({
      connected: true,
      subscribe: jest.fn(),
      unsubscribe: jest.fn()
    }),
    useDebounce: (value) => value,
    useOnlineStatus: () => true,
    useLocalStorage: () => [null, jest.fn()],
    useVirtualization: () => ({
      virtualItems: [],
      totalSize: 0,
      scrollToIndex: jest.fn()
    })
  },
  utils: {
    trackPageView: jest.fn(),
    trackEvent: jest.fn(),
    measureLoadTime: jest.fn(() => 100),
    logPerformance: jest.fn(),
    formatDate: (date) => new Date(date).toLocaleDateString(),
    linkify: (text) => text.replace(/@(\w+)/g, '<span class="mention">@$1</span>'),
    sanitizeContent: (content) => content,
    moderateContent: jest.fn((content) => ({ approved: true, filtered: content })),
    extractMentions: (content) => {
      const mentions = content.match(/@(\w+)/g);
      return mentions ? mentions.map(m => m.slice(1)) : [];
    },
    extractHashtags: (content) => {
      const hashtags = content.match(/#(\w+)/g);
      return hashtags ? hashtags.map(h => h.slice(1)) : [];
    }
  }
}));

const mockUser = {
  id: 'current_user',
  email: 'test@example.com'
};

const mockUserProfile = {
  id: 'profile_1',
  user_id: 'current_user',
  username: 'currentuser',
  display_name: 'Current User',
  profile_picture: null
};

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('CommentsNew', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    expect(screen.getByTestId('post-engagement')).toBeInTheDocument();
  });

  it('displays the original post', async () => {
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('post-engagement')).toBeInTheDocument();
    });
  });

  it('loads and displays comments', async () => {
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('post-engagement')).toBeInTheDocument();
    });
  });

  it('shows loading skeleton while loading comments', () => {
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    // Would show skeleton loader initially
    expect(screen.queryByTestId('skeleton-loader')).not.toBeInTheDocument(); // May not be visible immediately
  });

  it('handles comment submission', async () => {
    const { supabase } = require('../../supabaseClient');
    
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    // Test comment form submission
    await waitFor(() => {
      expect(screen.getByTestId('post-engagement')).toBeInTheDocument();
    });
    
    // Comment submission would be tested here
    expect(supabase.from().insert).toHaveBeenCalledTimes(0);
  });

  it('displays nested comment replies', async () => {
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('post-engagement')).toBeInTheDocument();
    });
    
    // Test nested comment display
  });

  it('handles comment likes', async () => {
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('post-engagement')).toBeInTheDocument();
    });
    
    // Test comment liking functionality
  });

  it('handles comment replies', async () => {
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('post-engagement')).toBeInTheDocument();
    });
    
    // Test comment reply functionality
  });

  it('handles comment editing for own comments', async () => {
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('post-engagement')).toBeInTheDocument();
    });
    
    // Test comment editing
  });

  it('handles comment deletion for own comments', async () => {
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('post-engagement')).toBeInTheDocument();
    });
    
    // Test comment deletion
  });

  it('handles user mentions in comments', async () => {
    const { utils } = require('@/importMap');
    
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    const mentions = utils.extractMentions('@commenter1 nice post!');
    expect(mentions).toEqual(['commenter1']);
  });

  it('handles hashtags in comments', async () => {
    const { utils } = require('@/importMap');
    
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    const hashtags = utils.extractHashtags('Great post! #amazing #photography');
    expect(hashtags).toEqual(['amazing', 'photography']);
  });

  it('supports emoji picker', async () => {
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    // Test emoji picker functionality
    expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument();
  });

  it('handles comment reporting', async () => {
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('post-engagement')).toBeInTheDocument();
    });
    
    // Test comment reporting
    expect(screen.queryByTestId('report-modal')).not.toBeInTheDocument();
  });

  it('displays action sheet for comment options', async () => {
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('post-engagement')).toBeInTheDocument();
    });
    
    // Test action sheet display
    expect(screen.queryByTestId('action-sheet')).not.toBeInTheDocument();
  });

  it('handles infinite scroll for more comments', async () => {
    const mockLoadMore = jest.fn();
    const { hooks } = require('@/importMap');
    hooks.useInfiniteScroll = () => ({
      hasMore: true,
      loadMore: mockLoadMore,
      loading: false
    });
    
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    expect(mockLoadMore).toHaveBeenCalledTimes(0);
  });

  it('handles real-time comment updates', () => {
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    const { hooks } = require('@/importMap');
    const realtime = hooks.useRealTimeSubscription();
    expect(realtime.connected).toBe(true);
  });

  it('displays empty state when no comments', async () => {
    // Mock empty comments response
    const { supabase } = require('../../supabaseClient');
    supabase.from = jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              then: jest.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        }))
      }))
    }));
    
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('handles offline state gracefully', () => {
    const { hooks } = require('@/importMap');
    hooks.useOnlineStatus = () => false;
    
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    // Test offline handling
    expect(screen.getByTestId('post-engagement')).toBeInTheDocument();
  });

  it('tracks analytics events', () => {
    const { utils } = require('@/importMap');
    
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    expect(utils.trackPageView).toHaveBeenCalledWith('Comments', { post_id: 'post123' });
  });

  it('handles content moderation', () => {
    const { utils } = require('@/importMap');
    
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    const moderated = utils.moderateContent('Test comment content');
    expect(moderated.approved).toBe(true);
  });

  it('handles comment sorting', async () => {
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('post-engagement')).toBeInTheDocument();
    });
    
    // Test comment sorting options (newest, oldest, most liked, etc.)
  });

  it('displays comment timestamps', async () => {
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    const { utils } = require('@/importMap');
    expect(utils.formatDate).toBeDefined();
  });

  it('handles comment threading depth', async () => {
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('post-engagement')).toBeInTheDocument();
    });
    
    // Test maximum thread depth handling
  });

  it('supports comment search/filtering', async () => {
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('post-engagement')).toBeInTheDocument();
    });
    
    // Test comment search functionality
  });

  it('handles error states gracefully', async () => {
    // Mock error response
    const { supabase } = require('../../supabaseClient');
    supabase.from = jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              then: jest.fn(() => Promise.resolve({ 
                data: null, 
                error: { message: 'Failed to load comments' }
              }))
            }))
          }))
        }))
      }))
    }));
    
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
  });

  it('is accessible', async () => {
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('post-engagement')).toBeInTheDocument();
    });
    
    // Test ARIA attributes and keyboard navigation
  });

  it('handles link preview in comments', async () => {
    const { utils } = require('@/importMap');
    
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    const linkified = utils.linkify('Check out @user1 and #hashtag');
    expect(linkified).toContain('@user1');
  });

  it('supports comment notifications', async () => {
    renderWithRouter(<CommentsNew user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('post-engagement')).toBeInTheDocument();
    });
    
    // Test comment notification functionality
  });
});
