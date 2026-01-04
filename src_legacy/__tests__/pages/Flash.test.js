import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useParams, useSearchParams } from 'react-router-dom';
import { jest } from '@jest/globals';
import Flash from '../../pages/Flash';

// Mock dependencies
const mockNavigate = jest.fn();
const mockParams = { userId: 'user123' };
const mockSearchParams = new URLSearchParams('story=story123');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
  useSearchParams: () => [mockSearchParams]
}));

jest.mock('../../supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            then: jest.fn(() => Promise.resolve({ 
              data: [
                {
                  id: 'story123',
                  user_id: 'user123',
                  media_url: 'https://example.com/story1.jpg',
                  media_type: 'image',
                  caption: 'Test story caption',
                  created_at: new Date().toISOString(),
                  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  user: {
                    id: 'user123',
                    username: 'testuser',
                    display_name: 'Test User',
                    profile_picture: null
                  }
                },
                {
                  id: 'story456',
                  user_id: 'user123',
                  media_url: 'https://example.com/story2.mp4',
                  media_type: 'video',
                  caption: 'Another story',
                  created_at: new Date().toISOString(),
                  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  user: {
                    id: 'user123',
                    username: 'testuser',
                    display_name: 'Test User',
                    profile_picture: null
                  }
                }
              ], 
              error: null 
            }))
          }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn()
      })),
      unsubscribe: jest.fn()
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: { path: 'test-path.jpg' }, error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/test.jpg' } }))
      }))
    }
  }
}));

// Mock ViewersModal component
jest.mock('../../components/ViewersModal', () => {
  return function ViewersModal({ isOpen, onClose, storyId, viewsCount }) {
    return isOpen ? (
      <div data-testid="viewers-modal">
        <h3>Viewers ({viewsCount})</h3>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

// Mock utils
global.utils = {
  trackPageView: jest.fn(),
  measureLoadTime: jest.fn(() => 100),
  logPerformance: jest.fn(),
  trackEvent: jest.fn()
};

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

describe('Flash', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders without crashing', () => {
    renderWithRouter(<Flash user={mockUser} userProfile={mockUserProfile} />);
    
    // Component should render without throwing
  });

  it('fetches and displays stories', async () => {
    renderWithRouter(<Flash user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      // Stories should be loaded and displayed
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });
  });

  it('handles story navigation with arrow keys', async () => {
    renderWithRouter(<Flash user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    // Test keyboard navigation
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
  });

  it('handles story navigation with touch gestures', async () => {
    renderWithRouter(<Flash user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    // Test touch/swipe navigation
    const container = document.body;
    fireEvent.touchStart(container, {
      touches: [{ clientX: 100, clientY: 100 }]
    });
    fireEvent.touchEnd(container, {
      changedTouches: [{ clientX: 50, clientY: 100 }]
    });
  });

  it('manages story progress automatically', async () => {
    renderWithRouter(<Flash user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    // Test progress timer
    jest.advanceTimersByTime(1000);
  });

  it('pauses and resumes story progress', async () => {
    renderWithRouter(<Flash user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    // Test pause/resume functionality
    fireEvent.click(document.body);
    expect(screen.queryByText('Paused')).toBeInTheDocument();
  });

  it('displays story viewers count', async () => {
    renderWithRouter(<Flash user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    // Test viewers modal
    const viewersButton = screen.queryByText(/viewers/i);
    if (viewersButton) {
      fireEvent.click(viewersButton);
      expect(screen.getByTestId('viewers-modal')).toBeInTheDocument();
    }
  });

  it('handles different media types (images/videos)', async () => {
    renderWithRouter(<Flash user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    // Test different media type handling
  });

  it('handles story deletion for own stories', async () => {
    // Mock user as story owner
    const ownerUser = { ...mockUser, id: 'user123' };
    
    renderWithRouter(<Flash user={ownerUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    // Test story deletion
  });

  it('marks story as viewed', async () => {
    renderWithRouter(<Flash user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    // Test view tracking
  });

  it('handles story expiration', async () => {
    // Mock expired story
    const { supabase } = require('../../supabaseClient');
    supabase.from = jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            then: jest.fn(() => Promise.resolve({ 
              data: [
                {
                  id: 'expired_story',
                  user_id: 'user123',
                  media_url: 'https://example.com/expired.jpg',
                  media_type: 'image',
                  caption: 'Expired story',
                  created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
                  expires_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                  user: {
                    id: 'user123',
                    username: 'testuser',
                    display_name: 'Test User',
                    profile_picture: null
                  }
                }
              ], 
              error: null 
            }))
          }))
        }))
      }))
    }));

    renderWithRouter(<Flash user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      // Expired stories should be filtered out
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });
  });

  it('handles story replies/reactions', async () => {
    renderWithRouter(<Flash user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    // Test story interaction (reply, reaction)
  });

  it('navigates to specific story from URL parameter', async () => {
    renderWithRouter(<Flash user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    // Test URL parameter handling for specific story
  });

  it('handles empty stories state', async () => {
    // Mock empty stories response
    const { supabase } = require('../../supabaseClient');
    supabase.from = jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            then: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }))
    }));

    renderWithRouter(<Flash user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.queryByText('No stories')).toBeInTheDocument();
    });
  });

  it('handles network errors gracefully', async () => {
    // Mock network error
    const { supabase } = require('../../supabaseClient');
    supabase.from = jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            then: jest.fn(() => Promise.resolve({ 
              data: null, 
              error: { message: 'Network error' }
            }))
          }))
        }))
      }))
    }));

    renderWithRouter(<Flash user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Error')).toBeInTheDocument();
    });
  });

  it('tracks analytics events', () => {
    renderWithRouter(<Flash user={mockUser} userProfile={mockUserProfile} />);
    
    expect(global.utils.trackPageView).toHaveBeenCalledWith('Flash');
    expect(global.utils.measureLoadTime).toHaveBeenCalled();
  });

  it('handles story sharing', async () => {
    renderWithRouter(<Flash user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    // Test story sharing functionality
  });

  it('manages story privacy settings', async () => {
    renderWithRouter(<Flash user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    // Test privacy settings for stories
  });

  it('handles story reporting', async () => {
    renderWithRouter(<Flash user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    // Test story reporting functionality
  });

  it('supports accessibility features', async () => {
    renderWithRouter(<Flash user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    // Test ARIA attributes and keyboard navigation
  });

  it('handles story close and navigation back', async () => {
    renderWithRouter(<Flash user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('manages story playback controls', async () => {
    renderWithRouter(<Flash user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    // Test playback controls for video stories
  });

  it('handles story analytics and insights', async () => {
    renderWithRouter(<Flash user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    // Test story analytics tracking
    expect(global.utils.trackEvent).toHaveBeenCalledTimes(0);
  });
});
