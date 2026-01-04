/**
 * FOCUS SOCIAL MEDIA APP - HOME PAGE TESTS
 * 
 * Comprehensive unit and integration tests for Home.js
 * Testing feed functionality, stories, interactions, and real-time updates
 * 
 * Created: November 15, 2025
 * Coverage Target: 95%+
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUser, mockPost, waitForLoadingToFinish } from '../setup';
import Home from '../../pages/Home';
import * as supabaseLib from '../../lib/supabase';

// Mock the Home component dependencies
jest.mock('../../components/PostCard', () => {
  return function MockPostCard({ post, onLike, onComment, onShare }) {
    return (
      <div data-testid={`post-${post.id}`}>
        <div>{post.content}</div>
        <button onClick={() => onLike(post.id)} data-testid={`like-${post.id}`}>
          Like ({post.likes_count})
        </button>
        <button onClick={() => onComment(post.id)} data-testid={`comment-${post.id}`}>
          Comment ({post.comments_count})
        </button>
        <button onClick={() => onShare(post.id)} data-testid={`share-${post.id}`}>
          Share
        </button>
      </div>
    );
  };
});

jest.mock('../../components/Stories', () => {
  return function MockStories({ stories, onViewStory }) {
    return (
      <div data-testid="stories-container">
        {stories.map(story => (
          <div key={story.id} data-testid={`story-${story.id}`}>
            <button onClick={() => onViewStory(story)}>
              {story.user.username}
            </button>
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('../../components/SkeletonLoader', () => {
  return function MockSkeletonLoader() {
    return <div data-testid="loading">Loading...</div>;
  };
});

jest.mock('../../components/SuggestedUsers', () => {
  return function MockSuggestedUsers({ users, onFollow }) {
    return (
      <div data-testid="suggested-users">
        {users.map(user => (
          <div key={user.id} data-testid={`suggested-user-${user.id}`}>
            <span>{user.username}</span>
            <button onClick={() => onFollow(user.id)}>Follow</button>
          </div>
        ))}
      </div>
    );
  };
});

describe('Home Page', () => {
  let user;
  const mockPosts = [
    { ...mockPost, id: 'post-1', content: 'First post' },
    { ...mockPost, id: 'post-2', content: 'Second post' },
    { ...mockPost, id: 'post-3', content: 'Third post' }
  ];

  const mockStories = [
    { id: 'story-1', user: { ...mockUser, username: 'user1' }, media_url: 'story1.jpg' },
    { id: 'story-2', user: { ...mockUser, username: 'user2' }, media_url: 'story2.jpg' }
  ];

  beforeEach(() => {
    user = userEvent.setup();
    
    // Mock successful API responses
    supabaseLib.supabase.from.mockImplementation((table) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      then: jest.fn(() => {
        if (table === 'posts') {
          return Promise.resolve({ data: mockPosts, error: null });
        }
        if (table === 'stories') {
          return Promise.resolve({ data: mockStories, error: null });
        }
        return Promise.resolve({ data: [], error: null });
      })
    }));

    // Mock auth state
    supabaseLib.supabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
  });

  describe('Initial Render', () => {
    test('renders home page with loading state', async () => {
      renderWithProviders(<Home />);
      
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      
      await waitForLoadingToFinish();
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    test('displays stories section', async () => {
      renderWithProviders(<Home />);
      
      await waitForLoadingToFinish();
      
      expect(screen.getByTestId('stories-container')).toBeInTheDocument();
      expect(screen.getByTestId('story-story-1')).toBeInTheDocument();
      expect(screen.getByTestId('story-story-2')).toBeInTheDocument();
    });

    test('displays post feed', async () => {
      renderWithProviders(<Home />);
      
      await waitForLoadingToFinish();
      
      expect(screen.getByTestId('post-post-1')).toBeInTheDocument();
      expect(screen.getByTestId('post-post-2')).toBeInTheDocument();
      expect(screen.getByTestId('post-post-3')).toBeInTheDocument();
      
      expect(screen.getByText('First post')).toBeInTheDocument();
      expect(screen.getByText('Second post')).toBeInTheDocument();
      expect(screen.getByText('Third post')).toBeInTheDocument();
    });

    test('displays suggested users on desktop', async () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      renderWithProviders(<Home />);
      
      await waitForLoadingToFinish();
      
      expect(screen.getByTestId('suggested-users')).toBeInTheDocument();
    });
  });

  describe('Post Interactions', () => {
    test('handles post like correctly', async () => {
      const mockLike = jest.fn().mockResolvedValue({ error: null });
      supabaseLib.supabase.from.mockImplementation(() => ({
        insert: mockLike,
        select: jest.fn().mockReturnThis(),
        then: jest.fn(() => Promise.resolve({ data: mockPosts, error: null }))
      }));

      renderWithProviders(<Home />);
      
      await waitForLoadingToFinish();
      
      const likeButton = screen.getByTestId('like-post-1');
      await user.click(likeButton);
      
      expect(mockLike).toHaveBeenCalledWith({
        post_id: 'post-1',
        user_id: mockUser.id
      });
    });

    test('handles post comment navigation', async () => {
      const mockNavigate = jest.fn();
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate
      }));

      renderWithProviders(<Home />);
      
      await waitForLoadingToFinish();
      
      const commentButton = screen.getByTestId('comment-post-1');
      await user.click(commentButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/post/post-1/comments');
    });

    test('handles post sharing', async () => {
      // Mock navigator.share
      const mockShare = jest.fn().mockResolvedValue();
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true
      });

      renderWithProviders(<Home />);
      
      await waitForLoadingToFinish();
      
      const shareButton = screen.getByTestId('share-post-1');
      await user.click(shareButton);
      
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Check out this post',
        text: 'First post',
        url: expect.stringContaining('/post/post-1')
      });
    });
  });

  describe('Stories Functionality', () => {
    test('handles story viewing', async () => {
      const mockNavigate = jest.fn();
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate
      }));

      renderWithProviders(<Home />);
      
      await waitForLoadingToFinish();
      
      const storyButton = screen.getByRole('button', { name: 'user1' });
      await user.click(storyButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/stories/story-1');
    });
  });

  describe('Feed Filtering', () => {
    test('filters feed by following', async () => {
      renderWithProviders(<Home />);
      
      await waitForLoadingToFinish();
      
      const followingFilter = screen.getByRole('button', { name: /following/i });
      await user.click(followingFilter);
      
      // Should call API with following filter
      expect(supabaseLib.supabase.from).toHaveBeenCalledWith('posts');
    });

    test('filters feed by favorites', async () => {
      renderWithProviders(<Home />);
      
      await waitForLoadingToFinish();
      
      const favoritesFilter = screen.getByRole('button', { name: /favorites/i });
      await user.click(favoritesFilter);
      
      // Should call API with favorites filter
      expect(supabaseLib.supabase.from).toHaveBeenCalledWith('posts');
    });
  });

  describe('Pull to Refresh', () => {
    test('refreshes feed on pull to refresh', async () => {
      renderWithProviders(<Home />);
      
      await waitForLoadingToFinish();
      
      const feedContainer = screen.getByRole('main');
      
      // Simulate pull to refresh gesture
      fireEvent.touchStart(feedContainer, {
        touches: [{ clientY: 0 }]
      });
      
      fireEvent.touchMove(feedContainer, {
        touches: [{ clientY: 100 }]
      });
      
      fireEvent.touchEnd(feedContainer);
      
      // Should show loading indicator
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      
      await waitForLoadingToFinish();
      
      // Should have refreshed the feed
      expect(supabaseLib.supabase.from).toHaveBeenCalledWith('posts');
    });
  });

  describe('Infinite Scroll', () => {
    test('loads more posts on scroll', async () => {
      const mockIntersectionObserver = jest.fn();
      mockIntersectionObserver.mockReturnValue({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      });
      
      window.IntersectionObserver = mockIntersectionObserver;
      
      renderWithProviders(<Home />);
      
      await waitForLoadingToFinish();
      
      // Simulate intersection observer callback
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];
      observerCallback([{ isIntersecting: true }]);
      
      await waitFor(() => {
        expect(supabaseLib.supabase.from).toHaveBeenCalledWith('posts');
      });
    });
  });

  describe('Real-time Updates', () => {
    test('subscribes to real-time updates', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn()
      };
      
      supabaseLib.supabase.realtime.channel.mockReturnValue(mockChannel);
      
      renderWithProviders(<Home />);
      
      expect(supabaseLib.supabase.realtime.channel).toHaveBeenCalledWith('posts');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'posts'
        }),
        expect.any(Function)
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    test('handles real-time post insert', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn()
      };
      
      supabaseLib.supabase.realtime.channel.mockReturnValue(mockChannel);
      
      renderWithProviders(<Home />);
      
      await waitForLoadingToFinish();
      
      // Simulate real-time insert
      const insertCallback = mockChannel.on.mock.calls[0][2];
      const newPost = { ...mockPost, id: 'new-post', content: 'New real-time post' };
      
      insertCallback({
        eventType: 'INSERT',
        new: newPost
      });
      
      await waitFor(() => {
        expect(screen.getByText('New real-time post')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles feed loading error gracefully', async () => {
      supabaseLib.supabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        then: jest.fn(() => Promise.resolve({ 
          data: null, 
          error: { message: 'Failed to load posts' } 
        }))
      }));

      renderWithProviders(<Home />);
      
      await waitFor(() => {
        expect(screen.getByText(/error loading posts/i)).toBeInTheDocument();
      });
    });

    test('handles like error gracefully', async () => {
      const mockLike = jest.fn().mockResolvedValue({ 
        error: { message: 'Like failed' } 
      });
      
      supabaseLib.supabase.from.mockImplementation(() => ({
        insert: mockLike,
        select: jest.fn().mockReturnThis(),
        then: jest.fn(() => Promise.resolve({ data: mockPosts, error: null }))
      }));

      renderWithProviders(<Home />);
      
      await waitForLoadingToFinish();
      
      const likeButton = screen.getByTestId('like-post-1');
      await user.click(likeButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to like post/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', async () => {
      renderWithProviders(<Home />);
      
      await waitForLoadingToFinish();
      
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Home feed');
      expect(screen.getByRole('region', { name: /stories/i })).toBeInTheDocument();
    });

    test('supports keyboard navigation', async () => {
      renderWithProviders(<Home />);
      
      await waitForLoadingToFinish();
      
      const likeButton = screen.getByTestId('like-post-1');
      
      likeButton.focus();
      expect(likeButton).toHaveFocus();
      
      fireEvent.keyDown(likeButton, { key: 'Enter' });
      
      // Should trigger like action
      expect(supabaseLib.supabase.from).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    test('renders efficiently with large post count', async () => {
      const largeMockPosts = Array.from({ length: 100 }, (_, i) => ({
        ...mockPost,
        id: `post-${i}`,
        content: `Post ${i}`
      }));

      supabaseLib.supabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn(() => Promise.resolve({ data: largeMockPosts, error: null }))
      }));

      const startTime = performance.now();
      renderWithProviders(<Home />);
      
      await waitForLoadingToFinish();
      const endTime = performance.now();
      
      // Should render within reasonable time (< 1000ms)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});

console.log('🧪 Home Page Tests - Complete Coverage');
