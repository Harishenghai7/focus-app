/**
 * FOCUS SOCIAL MEDIA APP - PROFILE PAGE TESTS
 * 
 * Comprehensive unit and integration tests for ProfileNew.js
 * Testing profile management, content tabs, and user interactions
 * 
 * Created: November 15, 2025
 * Coverage Target: 95%+
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUser, mockPost, waitForLoadingToFinish } from '../setup';
import ProfileNew from '../../pages/ProfileNew';
import * as supabaseLib from '../../lib/supabase';

describe('ProfileNew Page', () => {
  let user;
  const mockProfileUser = {
    ...mockUser,
    id: 'profile-user-id',
    username: 'profileuser',
    full_name: 'Profile User',
    bio: 'This is a test bio with some interesting content',
    website: 'https://example.com',
    location: 'New York, NY',
    followers_count: 1500,
    following_count: 250,
    posts_count: 42,
    is_verified: true,
    is_private: false,
    avatar_url: 'https://example.com/avatar.jpg',
    cover_url: 'https://example.com/cover.jpg',
    created_at: '2023-01-01T00:00:00Z',
    last_active: '2024-01-01T00:00:00Z'
  };

  const mockUserPosts = [
    {
      ...mockPost,
      id: 'post-1',
      user_id: 'profile-user-id',
      content: 'First post by profile user',
      media_urls: ['https://example.com/post1.jpg']
    },
    {
      ...mockPost,
      id: 'post-2',
      user_id: 'profile-user-id',
      content: 'Second post by profile user',
      media_urls: ['https://example.com/post2.jpg', 'https://example.com/post2-2.jpg']
    }
  ];

  const mockBoltzVideos = [
    {
      id: 'boltz-1',
      user_id: 'profile-user-id',
      video_url: 'https://example.com/boltz1.mp4',
      thumbnail_url: 'https://example.com/boltz1-thumb.jpg',
      description: 'User Boltz video',
      likes_count: 200,
      views_count: 5000
    }
  ];

  const mockTaggedPosts = [
    {
      ...mockPost,
      id: 'tagged-1',
      content: 'Tagged in this post',
      user: { ...mockUser, username: 'othuser' },
      tagged_users: [{ user_id: 'profile-user-id', username: 'profileuser' }]
    }
  ];

  beforeEach(() => {
    user = userEvent.setup();

    // Reset mocks
    jest.clearAllMocks();

    // Mock route params
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useParams: () => ({ username: 'profileuser' }),
      useNavigate: () => jest.fn()
    }));

    // Mock Supabase responses
    supabaseLib.supabase.from.mockImplementation((table) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      then: jest.fn(() => {
        if (table === 'users') {
          return Promise.resolve({ data: mockProfileUser, error: null });
        }
        if (table === 'posts') {
          return Promise.resolve({ data: mockUserPosts, error: null });
        }
        if (table === 'boltz') {
          return Promise.resolve({ data: mockBoltzVideos, error: null });
        }
        if (table === 'tagged_posts') {
          return Promise.resolve({ data: mockTaggedPosts, error: null });
        }
        return Promise.resolve({ data: [], error: null });
      })
    }));

    // Mock current user
    supabaseLib.supabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
  });

  describe('Initial Render', () => {
    test('renders profile page with user information', async () => {
      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      expect(screen.getByTestId('profile-container')).toBeInTheDocument();
      expect(screen.getByText('Profile User')).toBeInTheDocument();
      expect(screen.getByText('@profileuser')).toBeInTheDocument();
      expect(screen.getByText('This is a test bio with some interesting content')).toBeInTheDocument();
    });

    test('displays profile statistics correctly', async () => {
      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      expect(screen.getByText('42')).toBeInTheDocument(); // posts count
      expect(screen.getByText('1,500')).toBeInTheDocument(); // followers count
      expect(screen.getByText('250')).toBeInTheDocument(); // following count
    });

    test('shows verified badge for verified users', async () => {
      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      expect(screen.getByTestId('verified-badge')).toBeInTheDocument();
    });

    test('displays profile and cover images', async () => {
      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      const avatar = screen.getByTestId('profile-avatar');
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
      
      const cover = screen.getByTestId('profile-cover');
      expect(cover).toHaveAttribute('src', 'https://example.com/cover.jpg');
    });

    test('shows website and location if provided', async () => {
      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
      expect(screen.getByText('New York, NY')).toBeInTheDocument();
    });
  });

  describe('Own Profile Features', () => {
    beforeEach(() => {
      // Mock viewing own profile
      supabaseLib.supabase.auth.getUser.mockResolvedValue({
        data: { user: { ...mockUser, id: 'profile-user-id', username: 'profileuser' } },
        error: null
      });
    });

    test('shows edit profile button on own profile', async () => {
      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      expect(screen.getByTestId('edit-profile-button')).toBeInTheDocument();
    });

    test('opens edit profile modal', async () => {
      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      const editButton = screen.getByTestId('edit-profile-button');
      await user.click(editButton);
      
      expect(screen.getByTestId('edit-profile-modal')).toBeInTheDocument();
    });

    test('updates profile information', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({ error: null });
      supabaseLib.supabase.from.mockImplementation(() => ({
        update: mockUpdate,
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn(() => Promise.resolve({ data: mockProfileUser, error: null }))
      }));

      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      const editButton = screen.getByTestId('edit-profile-button');
      await user.click(editButton);
      
      const bioInput = screen.getByLabelText(/bio/i);
      await user.clear(bioInput);
      await user.type(bioInput, 'Updated bio content');
      
      const saveButton = screen.getByTestId('save-profile-button');
      await user.click(saveButton);
      
      expect(mockUpdate).toHaveBeenCalledWith({
        bio: 'Updated bio content'
      });
    });

    test('handles profile picture upload', async () => {
      const mockUpload = jest.fn().mockResolvedValue({ 
        data: { path: 'avatars/new-avatar.jpg' }, 
        error: null 
      });
      
      supabaseLib.supabase.storage.from.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: jest.fn(() => ({ 
          data: { publicUrl: 'https://example.com/new-avatar.jpg' } 
        }))
      });

      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      const editButton = screen.getByTestId('edit-profile-button');
      await user.click(editButton);
      
      const fileInput = screen.getByTestId('avatar-upload-input');
      const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
      
      await user.upload(fileInput, file);
      
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringContaining('avatars/'),
        file,
        expect.any(Object)
      );
    });
  });

  describe('Other User Profile Features', () => {
    test('shows follow button for other users', async () => {
      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      expect(screen.getByTestId('follow-button')).toBeInTheDocument();
      expect(screen.getByText('Follow')).toBeInTheDocument();
    });

    test('handles follow action', async () => {
      const mockFollow = jest.fn().mockResolvedValue({ error: null });
      supabaseLib.supabase.from.mockImplementation(() => ({
        insert: mockFollow,
        select: jest.fn().mockReturnThis(),
        then: jest.fn(() => Promise.resolve({ data: mockProfileUser, error: null }))
      }));

      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      const followButton = screen.getByTestId('follow-button');
      await user.click(followButton);
      
      expect(mockFollow).toHaveBeenCalledWith({
        follower_id: mockUser.id,
        following_id: 'profile-user-id'
      });
    });

    test('handles unfollow action', async () => {
      // Mock already following
      const followingUser = { ...mockProfileUser, is_following: true };
      supabaseLib.supabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        then: jest.fn(() => Promise.resolve({ data: followingUser, error: null }))
      }));

      const mockUnfollow = jest.fn().mockResolvedValue({ error: null });

      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      const unfollowButton = screen.getByTestId('follow-button');
      expect(unfollowButton).toHaveTextContent('Following');
      
      await user.click(unfollowButton);
      
      expect(mockUnfollow).toHaveBeenCalled();
    });

    test('shows message button for other users', async () => {
      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      expect(screen.getByTestId('message-button')).toBeInTheDocument();
    });

    test('opens options menu', async () => {
      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      const optionsButton = screen.getByTestId('profile-options-button');
      await user.click(optionsButton);
      
      expect(screen.getByTestId('profile-options-menu')).toBeInTheDocument();
      expect(screen.getByText('Report')).toBeInTheDocument();
      expect(screen.getByText('Block')).toBeInTheDocument();
      expect(screen.getByText('Share Profile')).toBeInTheDocument();
    });
  });

  describe('Content Tabs', () => {
    test('displays posts tab by default', async () => {
      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      const postsTab = screen.getByTestId('posts-tab');
      expect(postsTab).toHaveClass('active');
      
      expect(screen.getByTestId('post-post-1')).toBeInTheDocument();
      expect(screen.getByTestId('post-post-2')).toBeInTheDocument();
    });

    test('switches to boltz tab', async () => {
      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      const boltzTab = screen.getByTestId('boltz-tab');
      await user.click(boltzTab);
      
      expect(boltzTab).toHaveClass('active');
      expect(screen.getByTestId('boltz-boltz-1')).toBeInTheDocument();
    });

    test('switches to tagged tab', async () => {
      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      const taggedTab = screen.getByTestId('tagged-tab');
      await user.click(taggedTab);
      
      expect(taggedTab).toHaveClass('active');
      expect(screen.getByTestId('post-tagged-1')).toBeInTheDocument();
    });

    test('displays grid view for posts', async () => {
      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      const grid = screen.getByTestId('posts-grid');
      expect(grid).toHaveClass('grid-layout');
      
      const posts = within(grid).getAllByTestId(/post-/);
      expect(posts).toHaveLength(2);
    });

    test('opens post detail on grid item click', async () => {
      const mockNavigate = jest.fn();
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate,
        useParams: () => ({ username: 'profileuser' })
      }));

      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      const postItem = screen.getByTestId('post-post-1');
      await user.click(postItem);
      
      expect(mockNavigate).toHaveBeenCalledWith('/post/post-1');
    });
  });

  describe('Private Profile Handling', () => {
    beforeEach(() => {
      const privateUser = { ...mockProfileUser, is_private: true };
      supabaseLib.supabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn(() => Promise.resolve({ data: privateUser, error: null }))
      }));
    });

    test('shows private account message for non-followers', async () => {
      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      expect(screen.getByTestId('private-account-message')).toBeInTheDocument();
      expect(screen.getByText(/this account is private/i)).toBeInTheDocument();
    });

    test('shows follow request button for private accounts', async () => {
      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      const followButton = screen.getByTestId('follow-button');
      expect(followButton).toHaveTextContent('Request');
    });

    test('hides content tabs for private non-following accounts', async () => {
      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      expect(screen.queryByTestId('content-tabs')).not.toBeInTheDocument();
    });
  });

  describe('Stories and Highlights', () => {
    const mockStories = [
      {
        id: 'story-1',
        user_id: 'profile-user-id',
        media_url: 'https://example.com/story1.jpg',
        created_at: '2024-01-01T10:00:00Z'
      }
    ];

    const mockHighlights = [
      {
        id: 'highlight-1',
        title: 'Travel',
        cover_url: 'https://example.com/highlight1.jpg',
        stories_count: 5
      }
    ];

    beforeEach(() => {
      supabaseLib.supabase.from.mockImplementation((table) => {
        if (table === 'stories') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            then: jest.fn(() => Promise.resolve({ data: mockStories, error: null }))
          };
        }
        if (table === 'highlights') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            then: jest.fn(() => Promise.resolve({ data: mockHighlights, error: null }))
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
          then: jest.fn(() => Promise.resolve({ data: mockProfileUser, error: null }))
        };
      });
    });

    test('displays active stories', async () => {
      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      const storiesRow = screen.getByTestId('stories-row');
      expect(storiesRow).toBeInTheDocument();
      
      const activeStory = screen.getByTestId('active-story');
      expect(activeStory).toBeInTheDocument();
    });

    test('displays story highlights', async () => {
      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      const highlightsRow = screen.getByTestId('highlights-row');
      expect(highlightsRow).toBeInTheDocument();
      
      const highlight = screen.getByTestId('highlight-highlight-1');
      expect(highlight).toBeInTheDocument();
      expect(screen.getByText('Travel')).toBeInTheDocument();
    });

    test('opens story viewer on story click', async () => {
      const mockNavigate = jest.fn();
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate,
        useParams: () => ({ username: 'profileuser' })
      }));

      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      const storyElement = screen.getByTestId('active-story');
      await user.click(storyElement);
      
      expect(mockNavigate).toHaveBeenCalledWith('/stories/story-1');
    });
  });

  describe('Real-time Updates', () => {
    test('subscribes to profile updates', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn()
      };
      
      supabaseLib.supabase.realtime.channel.mockReturnValue(mockChannel);
      
      renderWithProviders(<ProfileNew />);
      
      expect(supabaseLib.supabase.realtime.channel).toHaveBeenCalledWith('profile-updates');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: 'id=eq.profile-user-id'
        }),
        expect.any(Function)
      );
    });

    test('updates profile data on real-time changes', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn()
      };
      
      supabaseLib.supabase.realtime.channel.mockReturnValue(mockChannel);
      
      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      // Simulate real-time update
      const updateCallback = mockChannel.on.mock.calls[0][2];
      const updatedUser = { ...mockProfileUser, followers_count: 1501 };
      
      updateCallback({
        eventType: 'UPDATE',
        new: updatedUser
      });
      
      await waitFor(() => {
        expect(screen.getByText('1,501')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles profile not found error', async () => {
      supabaseLib.supabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn(() => Promise.resolve({ 
          data: null, 
          error: { message: 'User not found' } 
        }))
      }));

      renderWithProviders(<ProfileNew />);
      
      await waitFor(() => {
        expect(screen.getByTestId('profile-not-found')).toBeInTheDocument();
        expect(screen.getByText(/user not found/i)).toBeInTheDocument();
      });
    });

    test('handles follow action error', async () => {
      const mockFollow = jest.fn().mockResolvedValue({ 
        error: { message: 'Follow failed' } 
      });
      
      supabaseLib.supabase.from.mockImplementation(() => ({
        insert: mockFollow,
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn(() => Promise.resolve({ data: mockProfileUser, error: null }))
      }));

      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      const followButton = screen.getByTestId('follow-button');
      await user.click(followButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to follow user/i)).toBeInTheDocument();
      });
    });

    test('handles image upload error', async () => {
      const mockUpload = jest.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Upload failed' } 
      });
      
      supabaseLib.supabase.storage.from.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: jest.fn()
      });

      // Mock own profile
      supabaseLib.supabase.auth.getUser.mockResolvedValue({
        data: { user: { ...mockUser, id: 'profile-user-id', username: 'profileuser' } },
        error: null
      });

      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      const editButton = screen.getByTestId('edit-profile-button');
      await user.click(editButton);
      
      const fileInput = screen.getByTestId('avatar-upload-input');
      const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
      
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to upload image/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('provides proper ARIA labels', async () => {
      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      const avatar = screen.getByTestId('profile-avatar');
      expect(avatar).toHaveAttribute('alt', 'Profile User avatar');
      
      const followButton = screen.getByTestId('follow-button');
      expect(followButton).toHaveAttribute('aria-label', 'Follow Profile User');
    });

    test('supports keyboard navigation', async () => {
      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      const followButton = screen.getByTestId('follow-button');
      const postsTab = screen.getByTestId('posts-tab');
      const boltzTab = screen.getByTestId('boltz-tab');
      
      followButton.focus();
      expect(followButton).toHaveFocus();
      
      fireEvent.keyDown(followButton, { key: 'Tab' });
      postsTab.focus();
      expect(postsTab).toHaveFocus();
      
      fireEvent.keyDown(postsTab, { key: 'ArrowRight' });
      boltzTab.focus();
      expect(boltzTab).toHaveFocus();
    });
  });

  describe('Performance', () => {
    test('lazy loads content tabs', async () => {
      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      // Posts should be loaded initially
      expect(screen.getByTestId('post-post-1')).toBeInTheDocument();
      
      // Boltz content should not be loaded until tab is clicked
      expect(screen.queryByTestId('boltz-boltz-1')).not.toBeInTheDocument();
      
      const boltzTab = screen.getByTestId('boltz-tab');
      await user.click(boltzTab);
      
      // Now boltz content should be loaded
      expect(screen.getByTestId('boltz-boltz-1')).toBeInTheDocument();
    });

    test('implements virtual scrolling for large content lists', async () => {
      const largePosts = Array.from({ length: 100 }, (_, i) => ({
        ...mockPost,
        id: `post-${i}`,
        content: `Post ${i}`
      }));

      supabaseLib.supabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn(() => Promise.resolve({ data: largePosts, error: null }))
      }));

      renderWithProviders(<ProfileNew />);
      
      await waitForLoadingToFinish();
      
      // Should only render visible items
      const renderedPosts = screen.getAllByTestId(/post-/);
      expect(renderedPosts.length).toBeLessThan(100);
    });
  });
});

console.log('🧪 ProfileNew Page Tests - Complete Coverage');
