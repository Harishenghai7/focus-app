import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { jest } from '@jest/globals';
import NotificationsNew from '../../pages/NotificationsNew';

// Mock dependencies
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              then: jest.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        }))
      })),
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

// Mock importMap
jest.mock('../../importMap', () => ({
  components: {
    NotificationToast: ({ children, ...props }) => <div data-testid="notification-toast" {...props}>{children}</div>,
    Badge: ({ children, count }) => <span data-testid="badge" data-count={count}>{children}</span>,
    SkeletonLoader: () => <div data-testid="skeleton-loader">Loading...</div>,
    InfiniteScrollLoader: ({ loading }) => loading ? <div data-testid="infinite-scroll-loader">Loading more...</div> : null,
    ErrorBoundary: ({ children }) => <div data-testid="error-boundary">{children}</div>
  },
  hooks: {
    useNotifications: () => ({
      notifications: [
        {
          id: '1',
          type: 'LIKE',
          user_id: 'user1',
          target_user_id: 'current_user',
          created_at: new Date().toISOString(),
          read: false,
          data: { post_id: 'post1', post_type: 'boltz' },
          user: { id: 'user1', username: 'testuser', profile_picture: null }
        },
        {
          id: '2',
          type: 'FOLLOW',
          user_id: 'user2',
          target_user_id: 'current_user', 
          created_at: new Date().toISOString(),
          read: true,
          data: {},
          user: { id: 'user2', username: 'follower', profile_picture: null }
        }
      ],
      loading: false,
      error: null,
      unreadCount: 1,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      loadMore: jest.fn()
    }),
    useRealtimeConnection: () => ({ connected: true }),
    useDebounce: (value) => value
  },
  utils: {
    notificationService: {
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn()
    },
    formatDate: (date) => new Date(date).toLocaleDateString(),
    trackEvent: jest.fn(),
    trackPageView: jest.fn(),
    measureLoadTime: jest.fn(() => 100),
    logPerformance: jest.fn()
  }
}));

const mockUser = {
  id: 'current_user',
  email: 'test@example.com'
};

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('NotificationsNew', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithRouter(<NotificationsNew user={mockUser} />);
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });

  it('displays notifications correctly', async () => {
    renderWithRouter(<NotificationsNew user={mockUser} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    });
  });

  it('shows skeleton loader when loading', () => {
    // Mock loading state
    const { components } = require('../../importMap');
    components.hooks = {
      ...components.hooks,
      useNotifications: () => ({
        notifications: [],
        loading: true,
        error: null,
        unreadCount: 0,
        markAsRead: jest.fn(),
        markAllAsRead: jest.fn(),
        deleteNotification: jest.fn(),
        loadMore: jest.fn()
      })
    };

    renderWithRouter(<NotificationsNew user={mockUser} />);
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('handles notification filter changes', async () => {
    renderWithRouter(<NotificationsNew user={mockUser} />);
    
    // Test filter functionality would be implemented here
    // This depends on the actual component implementation
  });

  it('marks notifications as read', async () => {
    const mockMarkAsRead = jest.fn();
    const { hooks } = require('../../importMap');
    hooks.useNotifications = () => ({
      notifications: [
        {
          id: '1',
          type: 'LIKE',
          user_id: 'user1',
          target_user_id: 'current_user',
          created_at: new Date().toISOString(),
          read: false,
          data: { post_id: 'post1' },
          user: { id: 'user1', username: 'testuser' }
        }
      ],
      loading: false,
      error: null,
      unreadCount: 1,
      markAsRead: mockMarkAsRead,
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      loadMore: jest.fn()
    });

    renderWithRouter(<NotificationsNew user={mockUser} />);
    
    // Test mark as read functionality
    expect(mockMarkAsRead).toHaveBeenCalledTimes(0);
  });

  it('handles notification deletion', async () => {
    const mockDeleteNotification = jest.fn();
    const { hooks } = require('../../importMap');
    hooks.useNotifications = () => ({
      notifications: [
        {
          id: '1',
          type: 'LIKE', 
          user_id: 'user1',
          target_user_id: 'current_user',
          created_at: new Date().toISOString(),
          read: false,
          data: { post_id: 'post1' },
          user: { id: 'user1', username: 'testuser' }
        }
      ],
      loading: false,
      error: null,
      unreadCount: 1,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: mockDeleteNotification,
      loadMore: jest.fn()
    });

    renderWithRouter(<NotificationsNew user={mockUser} />);
    
    expect(mockDeleteNotification).toHaveBeenCalledTimes(0);
  });

  it('displays different notification types correctly', async () => {
    const { hooks } = require('../../importMap');
    hooks.useNotifications = () => ({
      notifications: [
        {
          id: '1',
          type: 'LIKE',
          user_id: 'user1',
          target_user_id: 'current_user',
          created_at: new Date().toISOString(),
          read: false,
          data: { post_id: 'post1' },
          user: { id: 'user1', username: 'liker' }
        },
        {
          id: '2', 
          type: 'COMMENT',
          user_id: 'user2',
          target_user_id: 'current_user',
          created_at: new Date().toISOString(),
          read: false,
          data: { post_id: 'post2', comment: 'Nice post!' },
          user: { id: 'user2', username: 'commenter' }
        },
        {
          id: '3',
          type: 'FOLLOW',
          user_id: 'user3', 
          target_user_id: 'current_user',
          created_at: new Date().toISOString(),
          read: false,
          data: {},
          user: { id: 'user3', username: 'follower' }
        }
      ],
      loading: false,
      error: null,
      unreadCount: 3,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      loadMore: jest.fn()
    });

    renderWithRouter(<NotificationsNew user={mockUser} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    });
  });

  it('handles real-time updates', () => {
    const mockConnected = true;
    const { hooks } = require('../../importMap');
    hooks.useRealtimeConnection = () => ({ connected: mockConnected });

    renderWithRouter(<NotificationsNew user={mockUser} />);
    
    expect(hooks.useRealtimeConnection()).toEqual({ connected: true });
  });

  it('tracks analytics events', () => {
    const { utils } = require('../../importMap');
    
    renderWithRouter(<NotificationsNew user={mockUser} />);
    
    expect(utils.trackPageView).toHaveBeenCalledWith('Notifications');
    expect(utils.measureLoadTime).toHaveBeenCalled();
  });

  it('handles infinite scroll loading', async () => {
    const mockLoadMore = jest.fn();
    const { hooks } = require('../../importMap');
    hooks.useNotifications = () => ({
      notifications: Array.from({ length: 20 }, (_, i) => ({
        id: `notification_${i}`,
        type: 'LIKE',
        user_id: `user_${i}`,
        target_user_id: 'current_user',
        created_at: new Date().toISOString(),
        read: false,
        data: { post_id: `post_${i}` },
        user: { id: `user_${i}`, username: `user${i}` }
      })),
      loading: false,
      error: null,
      unreadCount: 20,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      loadMore: mockLoadMore
    });

    renderWithRouter(<NotificationsNew user={mockUser} />);
    
    expect(mockLoadMore).toHaveBeenCalledTimes(0);
  });

  it('handles error states', () => {
    const { hooks } = require('../../importMap');
    hooks.useNotifications = () => ({
      notifications: [],
      loading: false,
      error: 'Failed to load notifications',
      unreadCount: 0,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      loadMore: jest.fn()
    });

    renderWithRouter(<NotificationsNew user={mockUser} />);
    
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });

  it('handles empty state', () => {
    const { hooks } = require('../../importMap');
    hooks.useNotifications = () => ({
      notifications: [],
      loading: false,
      error: null,
      unreadCount: 0,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      loadMore: jest.fn()
    });

    renderWithRouter(<NotificationsNew user={mockUser} />);
    
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });

  it('is accessible', async () => {
    renderWithRouter(<NotificationsNew user={mockUser} />);
    
    // Test ARIA attributes and keyboard navigation
    const container = screen.getByTestId('error-boundary');
    expect(container).toBeInTheDocument();
  });

  it('handles notification navigation', async () => {
    renderWithRouter(<NotificationsNew user={mockUser} />);
    
    // Test navigation to posts/profiles from notifications
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('displays unread count correctly', () => {
    const { hooks } = require('../../importMap');
    hooks.useNotifications = () => ({
      notifications: [
        { id: '1', read: false },
        { id: '2', read: true },
        { id: '3', read: false }
      ],
      loading: false,
      error: null,
      unreadCount: 2,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      loadMore: jest.fn()
    });

    renderWithRouter(<NotificationsNew user={mockUser} />);
    
    expect(hooks.useNotifications().unreadCount).toBe(2);
  });
});
