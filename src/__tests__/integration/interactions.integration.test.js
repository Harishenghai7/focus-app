/**
 * Integration Tests for Interaction Flows
 * Tests likes, comments, follows, saves, and real-time interaction updates
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import PostCard from '../../components/PostCard';
import Profile from '../../pages/Profile';
import { supabase } from '../../supabaseClient';

// Mock Supabase client
jest.mock('../../supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null
      }))
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: 'test-user-id', username: 'testuser' },
            error: null
          })),
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({
              data: [],
              error: null
            }))
          })),
          limit: jest.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        })),
        order: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: 'test-id' },
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          data: {},
          error: null
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          error: null
        }))
      })),
      upsert: jest.fn(() => Promise.resolve({
        data: {},
        error: null
      }))
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn()
      })),
      unsubscribe: jest.fn()
    })),
    rpc: jest.fn(() => Promise.resolve({
      data: null,
      error: null
    }))
  },
  TABLES: {
    LIKES: 'likes',
    COMMENTS: 'comments',
    FOLLOWS: 'follows',
    SAVED_POSTS: 'saved_posts',
    POSTS: 'posts',
    PROFILES: 'profiles',
    NOTIFICATIONS: 'notifications'
  }
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Interaction Flows Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Like Functionality', () => {
    it('should like a post with optimistic UI update', async () => {
      const mockPost = {
        id: 'post-1',
        user_id: 'other-user-id',
        caption: 'Test post',
        media_url: 'https://example.com/image.jpg',
        like_count: 5,
        comment_count: 2,
        created_at: new Date().toISOString()
      };

      renderWithProviders(<PostCard post={mockPost} />);

      const likeButton = screen.getByLabelText(/like/i);
      fireEvent.click(likeButton);

      // Should update UI immediately
      await waitFor(() => {
        expect(screen.getByText('6')).toBeInTheDocument();
      });

      // Should call API
      expect(supabase.from).toHaveBeenCalledWith('likes');
    });

    it('should unlike a post', async () => {
      const mockPost = {
        id: 'post-1',
        user_id: 'other-user-id',
        caption: 'Test post',
        media_url: 'https://example.com/image.jpg',
        like_count: 6,
        comment_count: 2,
        is_liked: true,
        created_at: new Date().toISOString()
      };

      renderWithProviders(<PostCard post={mockPost} />);

      const likeButton = screen.getByLabelText(/unlike/i);
      fireEvent.click(likeButton);

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
      });

      expect(supabase.from).toHaveBeenCalledWith('likes');
    });

    it('should handle double-tap to like', async () => {
      const mockPost = {
        id: 'post-1',
        user_id: 'other-user-id',
        caption: 'Test post',
        media_url: 'https://example.com/image.jpg',
        like_count: 5,
        comment_count: 2,
        created_at: new Date().toISOString()
      };

      renderWithProviders(<PostCard post={mockPost} />);

      const postImage = screen.getByAltText(/post/i);
      
      // Simulate double tap
      fireEvent.doubleClick(postImage);

      await waitFor(() => {
        expect(screen.getByText('6')).toBeInTheDocument();
      });
    });

    it('should revert like on API failure', async () => {
      supabase.from.mockImplementation(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.reject(new Error('API Error')))
          }))
        })),
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { id: 'test-user-id', username: 'testuser' },
              error: null
            }))
          }))
        }))
      }));

      const mockPost = {
        id: 'post-1',
        user_id: 'other-user-id',
        caption: 'Test post',
        media_url: 'https://example.com/image.jpg',
        like_count: 5,
        comment_count: 2,
        created_at: new Date().toISOString()
      };

      renderWithProviders(<PostCard post={mockPost} />);

      const likeButton = screen.getByLabelText(/like/i);
      fireEvent.click(likeButton);

      // Should revert to original count
      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });
  });

  describe('Comment Functionality', () => {
    it('should add a comment to a post', async () => {
      const mockPost = {
        id: 'post-1',
        user_id: 'other-user-id',
        caption: 'Test post',
        media_url: 'https://example.com/image.jpg',
        like_count: 5,
        comment_count: 2,
        created_at: new Date().toISOString()
      };

      renderWithProviders(<PostCard post={mockPost} />);

      const commentButton = screen.getByLabelText(/comment/i);
      fireEvent.click(commentButton);

      const commentInput = screen.getByPlaceholderText(/add a comment/i);
      fireEvent.change(commentInput, { target: { value: 'Great post!' } });

      const submitButton = screen.getByRole('button', { name: /post/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('comments');
      });
    });

    it('should reply to a comment', async () => {
      const mockPost = {
        id: 'post-1',
        user_id: 'other-user-id',
        caption: 'Test post',
        media_url: 'https://example.com/image.jpg',
        like_count: 5,
        comment_count: 2,
        created_at: new Date().toISOString()
      };

      const mockComments = [
        {
          id: 'comment-1',
          user_id: 'commenter-id',
          text: 'Nice photo!',
          like_count: 1,
          reply_count: 0
        }
      ];

      supabase.from.mockImplementation((table) => {
        if (table === 'comments') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => ({
                  limit: jest.fn(() => Promise.resolve({
                    data: mockComments,
                    error: null
                  }))
                }))
              }))
            })),
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({
                  data: { id: 'reply-1', parent_id: 'comment-1' },
                  error: null
                }))
              }))
            }))
          };
        }
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: { id: 'test-user-id', username: 'testuser' },
                error: null
              }))
            }))
          }))
        };
      });

      renderWithProviders(<PostCard post={mockPost} />);

      const commentButton = screen.getByLabelText(/comment/i);
      fireEvent.click(commentButton);

      await waitFor(() => {
        const replyButton = screen.getByText(/reply/i);
        fireEvent.click(replyButton);
      });

      const replyInput = screen.getByPlaceholderText(/reply/i);
      fireEvent.change(replyInput, { target: { value: 'Thanks!' } });

      const submitButton = screen.getByRole('button', { name: /post/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('comments');
      });
    });

    it('should like a comment', async () => {
      const mockPost = {
        id: 'post-1',
        user_id: 'other-user-id',
        caption: 'Test post',
        media_url: 'https://example.com/image.jpg',
        like_count: 5,
        comment_count: 2,
        created_at: new Date().toISOString()
      };

      const mockComments = [
        {
          id: 'comment-1',
          user_id: 'commenter-id',
          text: 'Nice photo!',
          like_count: 1,
          reply_count: 0
        }
      ];

      supabase.from.mockImplementation((table) => {
        if (table === 'comments') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => ({
                  limit: jest.fn(() => Promise.resolve({
                    data: mockComments,
                    error: null
                  }))
                }))
              }))
            }))
          };
        }
        if (table === 'likes') {
          return {
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({
                  data: { id: 'like-1' },
                  error: null
                }))
              }))
            }))
          };
        }
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: { id: 'test-user-id', username: 'testuser' },
                error: null
              }))
            }))
          }))
        };
      });

      renderWithProviders(<PostCard post={mockPost} />);

      const commentButton = screen.getByLabelText(/comment/i);
      fireEvent.click(commentButton);

      await waitFor(() => {
        const commentLikeButton = screen.getByLabelText(/like comment/i);
        fireEvent.click(commentLikeButton);
      });

      expect(supabase.from).toHaveBeenCalledWith('likes');
    });

    it('should delete own comment', async () => {
      const mockPost = {
        id: 'post-1',
        user_id: 'other-user-id',
        caption: 'Test post',
        media_url: 'https://example.com/image.jpg',
        like_count: 5,
        comment_count: 2,
        created_at: new Date().toISOString()
      };

      const mockComments = [
        {
          id: 'comment-1',
          user_id: 'test-user-id',
          text: 'My comment',
          like_count: 0,
          reply_count: 0
        }
      ];

      supabase.from.mockImplementation((table) => {
        if (table === 'comments') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => ({
                  limit: jest.fn(() => Promise.resolve({
                    data: mockComments,
                    error: null
                  }))
                }))
              }))
            })),
            delete: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({
                error: null
              }))
            }))
          };
        }
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: { id: 'test-user-id', username: 'testuser' },
                error: null
              }))
            }))
          }))
        };
      });

      renderWithProviders(<PostCard post={mockPost} />);

      const commentButton = screen.getByLabelText(/comment/i);
      fireEvent.click(commentButton);

      await waitFor(() => {
        const deleteButton = screen.getByLabelText(/delete comment/i);
        fireEvent.click(deleteButton);
      });

      expect(supabase.from).toHaveBeenCalledWith('comments');
    });

    it('should mention users in comments', async () => {
      const mockPost = {
        id: 'post-1',
        user_id: 'other-user-id',
        caption: 'Test post',
        media_url: 'https://example.com/image.jpg',
        like_count: 5,
        comment_count: 2,
        created_at: new Date().toISOString()
      };

      renderWithProviders(<PostCard post={mockPost} />);

      const commentButton = screen.getByLabelText(/comment/i);
      fireEvent.click(commentButton);

      const commentInput = screen.getByPlaceholderText(/add a comment/i);
      fireEvent.change(commentInput, { 
        target: { value: '@friend check this out!' } 
      });

      const submitButton = screen.getByRole('button', { name: /post/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('comments');
      });
    });
  });

  describe('Follow Functionality', () => {
    it('should follow a public account', async () => {
      const mockProfile = {
        id: 'other-user-id',
        username: 'otheruser',
        full_name: 'Other User',
        is_private: false,
        follower_count: 100,
        following_count: 50
      };

      renderWithProviders(<Profile profile={mockProfile} />);

      const followButton = screen.getByText(/follow/i);
      fireEvent.click(followButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('follows');
        expect(screen.getByText(/following/i)).toBeInTheDocument();
      });
    });

    it('should send follow request to private account', async () => {
      const mockProfile = {
        id: 'other-user-id',
        username: 'privateuser',
        full_name: 'Private User',
        is_private: true,
        follower_count: 50,
        following_count: 30
      };

      renderWithProviders(<Profile profile={mockProfile} />);

      const followButton = screen.getByText(/follow/i);
      fireEvent.click(followButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('follows');
        expect(screen.getByText(/requested/i)).toBeInTheDocument();
      });
    });

    it('should unfollow a user', async () => {
      const mockProfile = {
        id: 'other-user-id',
        username: 'otheruser',
        full_name: 'Other User',
        is_private: false,
        follower_count: 101,
        following_count: 50,
        is_following: true
      };

      renderWithProviders(<Profile profile={mockProfile} />);

      const followingButton = screen.getByText(/following/i);
      fireEvent.click(followingButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('follows');
        expect(screen.getByText(/follow/i)).toBeInTheDocument();
      });
    });

    it('should update follower count after follow', async () => {
      const mockProfile = {
        id: 'other-user-id',
        username: 'otheruser',
        full_name: 'Other User',
        is_private: false,
        follower_count: 100,
        following_count: 50
      };

      renderWithProviders(<Profile profile={mockProfile} />);

      expect(screen.getByText('100')).toBeInTheDocument();

      const followButton = screen.getByText(/follow/i);
      fireEvent.click(followButton);

      await waitFor(() => {
        expect(screen.getByText('101')).toBeInTheDocument();
      });
    });
  });

  describe('Save Functionality', () => {
    it('should save a post', async () => {
      const mockPost = {
        id: 'post-1',
        user_id: 'other-user-id',
        caption: 'Test post',
        media_url: 'https://example.com/image.jpg',
        like_count: 5,
        comment_count: 2,
        created_at: new Date().toISOString()
      };

      renderWithProviders(<PostCard post={mockPost} />);

      const saveButton = screen.getByLabelText(/save/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('saved_posts');
      });
    });

    it('should unsave a post', async () => {
      const mockPost = {
        id: 'post-1',
        user_id: 'other-user-id',
        caption: 'Test post',
        media_url: 'https://example.com/image.jpg',
        like_count: 5,
        comment_count: 2,
        is_saved: true,
        created_at: new Date().toISOString()
      };

      renderWithProviders(<PostCard post={mockPost} />);

      const saveButton = screen.getByLabelText(/unsave/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('saved_posts');
      });
    });

    it('should save post to collection', async () => {
      const mockPost = {
        id: 'post-1',
        user_id: 'other-user-id',
        caption: 'Test post',
        media_url: 'https://example.com/image.jpg',
        like_count: 5,
        comment_count: 2,
        created_at: new Date().toISOString()
      };

      renderWithProviders(<PostCard post={mockPost} />);

      const saveButton = screen.getByLabelText(/save/i);
      fireEvent.click(saveButton);

      // Open collection selector
      const collectionButton = screen.getByText(/add to collection/i);
      fireEvent.click(collectionButton);

      const collection = screen.getByText(/favorites/i);
      fireEvent.click(collection);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('saved_posts');
      });
    });
  });

  describe('Real-Time Interaction Updates', () => {
    it('should update like count via realtime subscription', async () => {
      const mockPost = {
        id: 'post-1',
        user_id: 'other-user-id',
        caption: 'Test post',
        media_url: 'https://example.com/image.jpg',
        like_count: 5,
        comment_count: 2,
        created_at: new Date().toISOString()
      };

      const mockChannel = {
        on: jest.fn((event, callback) => {
          // Simulate realtime update
          setTimeout(() => {
            callback({
              new: { id: 'post-1', like_count: 6 }
            });
          }, 100);
          return mockChannel;
        }),
        subscribe: jest.fn()
      };

      supabase.channel.mockReturnValue(mockChannel);

      renderWithProviders(<PostCard post={mockPost} />);

      await waitFor(() => {
        expect(screen.getByText('6')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should display new comments via realtime', async () => {
      const mockPost = {
        id: 'post-1',
        user_id: 'other-user-id',
        caption: 'Test post',
        media_url: 'https://example.com/image.jpg',
        like_count: 5,
        comment_count: 2,
        created_at: new Date().toISOString()
      };

      const mockChannel = {
        on: jest.fn((event, callback) => {
          setTimeout(() => {
            callback({
              new: {
                id: 'new-comment',
                text: 'New comment from realtime',
                user_id: 'other-user-id'
              }
            });
          }, 100);
          return mockChannel;
        }),
        subscribe: jest.fn()
      };

      supabase.channel.mockReturnValue(mockChannel);

      renderWithProviders(<PostCard post={mockPost} />);

      const commentButton = screen.getByLabelText(/comment/i);
      fireEvent.click(commentButton);

      await waitFor(() => {
        expect(screen.getByText(/new comment from realtime/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Notification Creation', () => {
    it('should create notification when liking a post', async () => {
      const mockPost = {
        id: 'post-1',
        user_id: 'other-user-id',
        caption: 'Test post',
        media_url: 'https://example.com/image.jpg',
        like_count: 5,
        comment_count: 2,
        created_at: new Date().toISOString()
      };

      renderWithProviders(<PostCard post={mockPost} />);

      const likeButton = screen.getByLabelText(/like/i);
      fireEvent.click(likeButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('notifications');
      });
    });

    it('should create notification when commenting', async () => {
      const mockPost = {
        id: 'post-1',
        user_id: 'other-user-id',
        caption: 'Test post',
        media_url: 'https://example.com/image.jpg',
        like_count: 5,
        comment_count: 2,
        created_at: new Date().toISOString()
      };

      renderWithProviders(<PostCard post={mockPost} />);

      const commentButton = screen.getByLabelText(/comment/i);
      fireEvent.click(commentButton);

      const commentInput = screen.getByPlaceholderText(/add a comment/i);
      fireEvent.change(commentInput, { target: { value: 'Nice!' } });

      const submitButton = screen.getByRole('button', { name: /post/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('notifications');
      });
    });

    it('should create notification when following', async () => {
      const mockProfile = {
        id: 'other-user-id',
        username: 'otheruser',
        full_name: 'Other User',
        is_private: false,
        follower_count: 100,
        following_count: 50
      };

      renderWithProviders(<Profile profile={mockProfile} />);

      const followButton = screen.getByText(/follow/i);
      fireEvent.click(followButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('notifications');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle like API failure gracefully', async () => {
      supabase.from.mockImplementation(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.reject(new Error('API Error')))
          }))
        })),
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { id: 'test-user-id', username: 'testuser' },
              error: null
            }))
          }))
        }))
      }));

      const mockPost = {
        id: 'post-1',
        user_id: 'other-user-id',
        caption: 'Test post',
        media_url: 'https://example.com/image.jpg',
        like_count: 5,
        comment_count: 2,
        created_at: new Date().toISOString()
      };

      renderWithProviders(<PostCard post={mockPost} />);

      const likeButton = screen.getByLabelText(/like/i);
      fireEvent.click(likeButton);

      await waitFor(() => {
        expect(screen.getByText(/failed/i)).toBeInTheDocument();
      });
    });

    it('should handle comment submission failure', async () => {
      supabase.from.mockImplementation(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.reject(new Error('Comment failed')))
          }))
        })),
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { id: 'test-user-id', username: 'testuser' },
              error: null
            }))
          }))
        }))
      }));

      const mockPost = {
        id: 'post-1',
        user_id: 'other-user-id',
        caption: 'Test post',
        media_url: 'https://example.com/image.jpg',
        like_count: 5,
        comment_count: 2,
        created_at: new Date().toISOString()
      };

      renderWithProviders(<PostCard post={mockPost} />);

      const commentButton = screen.getByLabelText(/comment/i);
      fireEvent.click(commentButton);

      const commentInput = screen.getByPlaceholderText(/add a comment/i);
      fireEvent.change(commentInput, { target: { value: 'Test comment' } });

      const submitButton = screen.getByRole('button', { name: /post/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed/i)).toBeInTheDocument();
      });
    });
  });
});
