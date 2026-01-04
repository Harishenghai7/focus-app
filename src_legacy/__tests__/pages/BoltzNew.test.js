/**
 * FOCUS SOCIAL MEDIA APP - BOLTZ PAGE TESTS
 * 
 * Comprehensive unit and integration tests for BoltzNew.js
 * Testing TikTok-style video functionality, gestures, and interactions
 * 
 * Created: November 15, 2025
 * Coverage Target: 95%+
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUser, waitForLoadingToFinish } from '../setup';
import BoltzNew from '../../pages/BoltzNew';
import * as supabaseLib from '../../lib/supabase';

// Mock video element
const mockVideo = {
  play: jest.fn().mockResolvedValue(),
  pause: jest.fn(),
  currentTime: 0,
  duration: 30,
  volume: 1,
  muted: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  requestFullscreen: jest.fn(),
  exitFullscreen: jest.fn()
};

// Mock IntersectionObserver for video visibility
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock Hammer.js for gesture handling
jest.mock('hammerjs', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    destroy: jest.fn()
  }));
});

describe('BoltzNew Page', () => {
  let user;
  const mockBoltzVideos = [
    {
      id: 'boltz-1',
      user_id: 'user-1',
      video_url: 'https://example.com/video1.mp4',
      thumbnail_url: 'https://example.com/thumb1.jpg',
      description: 'First Boltz video',
      likes_count: 100,
      comments_count: 25,
      shares_count: 10,
      views_count: 1000,
      music_info: {
        title: 'Trending Song',
        artist: 'Popular Artist',
        url: 'https://example.com/music1.mp3'
      },
      hashtags: ['#viral', '#trending'],
      created_at: '2024-01-01T00:00:00Z',
      user: {
        ...mockUser,
        username: 'creator1',
        avatar_url: 'https://example.com/avatar1.jpg',
        is_verified: true
      }
    },
    {
      id: 'boltz-2',
      user_id: 'user-2',
      video_url: 'https://example.com/video2.mp4',
      thumbnail_url: 'https://example.com/thumb2.jpg',
      description: 'Second Boltz video with longer description text that should be truncated properly',
      likes_count: 50,
      comments_count: 12,
      shares_count: 5,
      views_count: 500,
      music_info: {
        title: 'Chill Beats',
        artist: 'Lo-Fi Creator',
        url: 'https://example.com/music2.mp3'
      },
      hashtags: ['#chill', '#lofi'],
      created_at: '2024-01-02T00:00:00Z',
      user: {
        ...mockUser,
        id: 'user-2',
        username: 'creator2',
        avatar_url: 'https://example.com/avatar2.jpg',
        is_verified: false
      }
    }
  ];

  beforeEach(() => {
    user = userEvent.setup();

    // Mock HTMLVideoElement
    Object.defineProperty(HTMLVideoElement.prototype, 'play', {
      writable: true,
      value: jest.fn().mockResolvedValue()
    });
    Object.defineProperty(HTMLVideoElement.prototype, 'pause', {
      writable: true,
      value: jest.fn()
    });

    // Mock Supabase responses
    supabaseLib.supabase.from.mockImplementation((table) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      then: jest.fn(() => {
        if (table === 'boltz') {
          return Promise.resolve({ data: mockBoltzVideos, error: null });
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
    test('renders boltz page with video player', async () => {
      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      expect(screen.getByTestId('boltz-container')).toBeInTheDocument();
      expect(screen.getByTestId('video-player-boltz-1')).toBeInTheDocument();
    });

    test('displays video information correctly', async () => {
      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      expect(screen.getByText('First Boltz video')).toBeInTheDocument();
      expect(screen.getByText('@creator1')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument(); // likes count
      expect(screen.getByText('25')).toBeInTheDocument(); // comments count
      expect(screen.getByText('#viral')).toBeInTheDocument();
      expect(screen.getByText('#trending')).toBeInTheDocument();
    });

    test('displays music information', async () => {
      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      expect(screen.getByText('Trending Song')).toBeInTheDocument();
      expect(screen.getByText('Popular Artist')).toBeInTheDocument();
      expect(screen.getByTestId('music-visualizer')).toBeInTheDocument();
    });

    test('shows verified badge for verified users', async () => {
      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      expect(screen.getByTestId('verified-badge-creator1')).toBeInTheDocument();
    });
  });

  describe('Video Playback', () => {
    test('starts playing video when in view', async () => {
      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      // Simulate intersection observer triggering video play
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];
      observerCallback([{ isIntersecting: true, target: { dataset: { videoId: 'boltz-1' } } }]);
      
      await waitFor(() => {
        const video = screen.getByTestId('video-player-boltz-1');
        expect(video.play).toHaveBeenCalled();
      });
    });

    test('pauses video when out of view', async () => {
      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      // First play the video
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];
      observerCallback([{ isIntersecting: true, target: { dataset: { videoId: 'boltz-1' } } }]);
      
      // Then take it out of view
      observerCallback([{ isIntersecting: false, target: { dataset: { videoId: 'boltz-1' } } }]);
      
      await waitFor(() => {
        const video = screen.getByTestId('video-player-boltz-1');
        expect(video.pause).toHaveBeenCalled();
      });
    });

    test('toggles play/pause on video tap', async () => {
      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      const video = screen.getByTestId('video-player-boltz-1');
      
      await user.click(video);
      expect(video.pause).toHaveBeenCalled();
      
      await user.click(video);
      expect(video.play).toHaveBeenCalled();
    });

    test('handles video loading states', async () => {
      renderWithProviders(<BoltzNew />);
      
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      
      await waitForLoadingToFinish();
      
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      expect(screen.getByTestId('video-player-boltz-1')).toBeInTheDocument();
    });
  });

  describe('Gesture Controls', () => {
    test('handles swipe up to next video', async () => {
      const mockHammer = require('hammerjs');
      const hammerInstance = {
        get: jest.fn(),
        set: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        destroy: jest.fn()
      };
      mockHammer.mockReturnValue(hammerInstance);

      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      // Simulate swipe up gesture
      const swipeHandler = hammerInstance.on.mock.calls.find(call => call[0] === 'swipeup')[1];
      swipeHandler();
      
      await waitFor(() => {
        expect(screen.getByTestId('video-player-boltz-2')).toBeInTheDocument();
      });
    });

    test('handles swipe down to previous video', async () => {
      const mockHammer = require('hammerjs');
      const hammerInstance = {
        get: jest.fn(),
        set: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        destroy: jest.fn()
      };
      mockHammer.mockReturnValue(hammerInstance);

      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      // First go to second video
      const swipeUpHandler = hammerInstance.on.mock.calls.find(call => call[0] === 'swipeup')[1];
      swipeUpHandler();
      
      await waitFor(() => {
        expect(screen.getByTestId('video-player-boltz-2')).toBeInTheDocument();
      });
      
      // Then swipe down to go back
      const swipeDownHandler = hammerInstance.on.mock.calls.find(call => call[0] === 'swipedown')[1];
      swipeDownHandler();
      
      await waitFor(() => {
        expect(screen.getByTestId('video-player-boltz-1')).toBeInTheDocument();
      });
    });

    test('handles double tap to like', async () => {
      const mockLike = jest.fn().mockResolvedValue({ error: null });
      supabaseLib.supabase.from.mockImplementation(() => ({
        insert: mockLike,
        select: jest.fn().mockReturnThis(),
        then: jest.fn(() => Promise.resolve({ data: mockBoltzVideos, error: null }))
      }));

      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      const video = screen.getByTestId('video-player-boltz-1');
      
      // Double click to like
      await user.dblClick(video);
      
      expect(mockLike).toHaveBeenCalledWith({
        boltz_id: 'boltz-1',
        user_id: mockUser.id
      });
      
      // Should show heart animation
      expect(screen.getByTestId('heart-animation')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('handles like button click', async () => {
      const mockLike = jest.fn().mockResolvedValue({ error: null });
      supabaseLib.supabase.from.mockImplementation(() => ({
        insert: mockLike,
        select: jest.fn().mockReturnThis(),
        then: jest.fn(() => Promise.resolve({ data: mockBoltzVideos, error: null }))
      }));

      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      const likeButton = screen.getByTestId('like-button-boltz-1');
      await user.click(likeButton);
      
      expect(mockLike).toHaveBeenCalledWith({
        boltz_id: 'boltz-1',
        user_id: mockUser.id
      });
    });

    test('handles comment button click', async () => {
      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      const commentButton = screen.getByTestId('comment-button-boltz-1');
      await user.click(commentButton);
      
      expect(screen.getByTestId('comments-modal')).toBeInTheDocument();
    });

    test('handles share button click', async () => {
      const mockShare = jest.fn().mockResolvedValue();
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true
      });

      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      const shareButton = screen.getByTestId('share-button-boltz-1');
      await user.click(shareButton);
      
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Check out this Boltz',
        text: 'First Boltz video',
        url: expect.stringContaining('/boltz/boltz-1')
      });
    });

    test('handles follow button click', async () => {
      const mockFollow = jest.fn().mockResolvedValue({ error: null });
      supabaseLib.supabase.from.mockImplementation(() => ({
        insert: mockFollow,
        select: jest.fn().mockReturnThis(),
        then: jest.fn(() => Promise.resolve({ data: mockBoltzVideos, error: null }))
      }));

      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      const followButton = screen.getByTestId('follow-button-creator1');
      await user.click(followButton);
      
      expect(mockFollow).toHaveBeenCalledWith({
        follower_id: mockUser.id,
        following_id: 'user-1'
      });
    });
  });

  describe('Music Integration', () => {
    test('displays music information correctly', async () => {
      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      const musicInfo = screen.getByTestId('music-info-boltz-1');
      expect(within(musicInfo).getByText('Trending Song')).toBeInTheDocument();
      expect(within(musicInfo).getByText('Popular Artist')).toBeInTheDocument();
    });

    test('handles music visualizer animation', async () => {
      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      const musicVisualizer = screen.getByTestId('music-visualizer');
      expect(musicVisualizer).toHaveClass('rotating');
    });

    test('navigates to music page on music click', async () => {
      const mockNavigate = jest.fn();
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate
      }));

      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      const musicInfo = screen.getByTestId('music-info-boltz-1');
      await user.click(musicInfo);
      
      expect(mockNavigate).toHaveBeenCalledWith('/music/trending-song');
    });
  });

  describe('Hashtag Functionality', () => {
    test('displays hashtags correctly', async () => {
      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      expect(screen.getByText('#viral')).toBeInTheDocument();
      expect(screen.getByText('#trending')).toBeInTheDocument();
    });

    test('navigates to hashtag page on hashtag click', async () => {
      const mockNavigate = jest.fn();
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate
      }));

      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      const hashtag = screen.getByText('#viral');
      await user.click(hashtag);
      
      expect(mockNavigate).toHaveBeenCalledWith('/hashtag/viral');
    });
  });

  describe('Infinite Scroll', () => {
    test('loads more videos when reaching end', async () => {
      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      // Simulate scrolling to end
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];
      observerCallback([{ isIntersecting: true, target: { dataset: { trigger: 'load-more' } } }]);
      
      await waitFor(() => {
        expect(supabaseLib.supabase.from).toHaveBeenCalledWith('boltz');
      });
    });

    test('shows loading indicator when loading more videos', async () => {
      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      // Trigger load more
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];
      observerCallback([{ isIntersecting: true, target: { dataset: { trigger: 'load-more' } } }]);
      
      expect(screen.getByTestId('loading-more')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles video loading error', async () => {
      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      const video = screen.getByTestId('video-player-boltz-1');
      
      // Simulate video error
      fireEvent.error(video);
      
      expect(screen.getByTestId('video-error-boltz-1')).toBeInTheDocument();
      expect(screen.getByText(/failed to load video/i)).toBeInTheDocument();
    });

    test('handles API error gracefully', async () => {
      supabaseLib.supabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        then: jest.fn(() => Promise.resolve({ 
          data: null, 
          error: { message: 'Failed to load videos' } 
        }))
      }));

      renderWithProviders(<BoltzNew />);
      
      await waitFor(() => {
        expect(screen.getByText(/error loading videos/i)).toBeInTheDocument();
      });
    });

    test('retries failed video loads', async () => {
      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      const video = screen.getByTestId('video-player-boltz-1');
      fireEvent.error(video);
      
      const retryButton = screen.getByTestId('retry-button-boltz-1');
      await user.click(retryButton);
      
      expect(video.load).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    test('preloads next videos for smooth scrolling', async () => {
      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      // Should preload next 2 videos
      expect(screen.getByTestId('video-player-boltz-2')).toHaveAttribute('preload', 'metadata');
    });

    test('unloads videos that are far from current view', async () => {
      const mockBoltzArray = Array.from({ length: 10 }, (_, i) => ({
        ...mockBoltzVideos[0],
        id: `boltz-${i}`,
        description: `Video ${i}`
      }));

      supabaseLib.supabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        then: jest.fn(() => Promise.resolve({ data: mockBoltzArray, error: null }))
      }));

      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      // Should only keep 3-5 videos loaded at once
      const loadedVideos = screen.getAllByTestId(/video-player-boltz-/);
      expect(loadedVideos.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Accessibility', () => {
    test('provides proper ARIA labels', async () => {
      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      const video = screen.getByTestId('video-player-boltz-1');
      expect(video).toHaveAttribute('aria-label', expect.stringContaining('Video by creator1'));
      
      const likeButton = screen.getByTestId('like-button-boltz-1');
      expect(likeButton).toHaveAttribute('aria-label', 'Like video');
    });

    test('supports keyboard navigation', async () => {
      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      const likeButton = screen.getByTestId('like-button-boltz-1');
      
      likeButton.focus();
      expect(likeButton).toHaveFocus();
      
      fireEvent.keyDown(likeButton, { key: 'Enter' });
      
      expect(supabaseLib.supabase.from).toHaveBeenCalled();
    });

    test('provides video captions if available', async () => {
      const videosWithCaptions = mockBoltzVideos.map(video => ({
        ...video,
        captions_url: 'https://example.com/captions.vtt'
      }));

      supabaseLib.supabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        then: jest.fn(() => Promise.resolve({ data: videosWithCaptions, error: null }))
      }));

      renderWithProviders(<BoltzNew />);
      
      await waitForLoadingToFinish();
      
      const track = screen.getByTestId('video-captions-boltz-1');
      expect(track).toHaveAttribute('src', 'https://example.com/captions.vtt');
    });
  });
});

console.log('🧪 BoltzNew Page Tests - Complete Coverage');
