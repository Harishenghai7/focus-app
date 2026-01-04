/**
 * Integration Tests for Messaging Flow
 * Tests direct messaging, group chats, and real-time message delivery
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import Messages from '../../pages/Messages';
import ChatThread from '../../components/ChatThread';
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
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({
              data: [],
              error: null
            }))
          })),
          single: jest.fn(() => Promise.resolve({
            data: { id: 'test-user-id', username: 'testuser' },
            error: null
          }))
        })),
        or: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: 'test-message-id', content: 'Test message' },
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          data: { is_read: true },
          error: null
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          error: null
        }))
      }))
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        on: jest.fn(() => ({
          subscribe: jest.fn()
        })),
        subscribe: jest.fn()
      })),
      send: jest.fn(),
      unsubscribe: jest.fn()
    }))
  },
  TABLES: {
    MESSAGES: 'messages',
    CONVERSATIONS: 'conversations',
    PROFILES: 'profiles'
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

describe('Messaging Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Direct Message Sending', () => {
    it('should send a text message successfully', async () => {
      const mockConversation = {
        id: 'conv-1',
        participants: [
          { id: 'test-user-id', username: 'testuser' },
          { id: 'recipient-id', username: 'recipient' }
        ]
      };

      renderWithProviders(<ChatThread conversation={mockConversation} />);

      const messageInput = screen.getByPlaceholderText(/type a message/i);
      fireEvent.change(messageInput, { target: { value: 'Hello!' } });

      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('messages');
      });
    });

    it('should send media message with image', async () => {
      const mockConversation = {
        id: 'conv-1',
        participants: [
          { id: 'test-user-id', username: 'testuser' },
          { id: 'recipient-id', username: 'recipient' }
        ]
      };

      renderWithProviders(<ChatThread conversation={mockConversation} />);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/attach/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByAltText(/preview/i)).toBeInTheDocument();
      });

      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('messages');
      });
    });

    it('should display optimistic UI update before server confirmation', async () => {
      const mockConversation = {
        id: 'conv-1',
        participants: [
          { id: 'test-user-id', username: 'testuser' },
          { id: 'recipient-id', username: 'recipient' }
        ]
      };

      renderWithProviders(<ChatThread conversation={mockConversation} />);

      const messageInput = screen.getByPlaceholderText(/type a message/i);
      fireEvent.change(messageInput, { target: { value: 'Quick message' } });

      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      // Message should appear immediately
      expect(screen.getByText('Quick message')).toBeInTheDocument();
    });
  });

  describe('Real-Time Message Delivery', () => {
    it('should receive messages via realtime subscription', async () => {
      const mockConversation = {
        id: 'conv-1',
        participants: [
          { id: 'test-user-id', username: 'testuser' },
          { id: 'recipient-id', username: 'recipient' }
        ]
      };

      renderWithProviders(<ChatThread conversation={mockConversation} />);

      await waitFor(() => {
        expect(supabase.channel).toHaveBeenCalled();
      });
    });

    it('should display typing indicator when recipient is typing', async () => {
      const mockConversation = {
        id: 'conv-1',
        participants: [
          { id: 'test-user-id', username: 'testuser' },
          { id: 'recipient-id', username: 'recipient' }
        ]
      };

      const mockChannel = {
        on: jest.fn((event, callback) => {
          if (event === 'presence') {
            callback({ type: 'typing', user_id: 'recipient-id' });
          }
          return mockChannel;
        }),
        subscribe: jest.fn(),
        send: jest.fn()
      };

      supabase.channel.mockReturnValue(mockChannel);

      renderWithProviders(<ChatThread conversation={mockConversation} />);

      await waitFor(() => {
        expect(screen.getByText(/typing/i)).toBeInTheDocument();
      });
    });
  });

  describe('Read Receipts', () => {
    it('should mark messages as read when viewed', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          sender_id: 'recipient-id',
          content: 'Unread message',
          is_read: false
        }
      ];

      supabase.from.mockImplementation((table) => {
        if (table === 'messages') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => ({
                  limit: jest.fn(() => Promise.resolve({
                    data: mockMessages,
                    error: null
                  }))
                }))
              }))
            })),
            update: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({
                data: { is_read: true },
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

      const mockConversation = {
        id: 'conv-1',
        participants: [
          { id: 'test-user-id', username: 'testuser' },
          { id: 'recipient-id', username: 'recipient' }
        ]
      };

      renderWithProviders(<ChatThread conversation={mockConversation} />);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('messages');
      });
    });

    it('should display read status to sender', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          sender_id: 'test-user-id',
          content: 'My message',
          is_read: true
        }
      ];

      supabase.from.mockImplementation(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({
                data: mockMessages,
                error: null
              }))
            })),
            single: jest.fn(() => Promise.resolve({
              data: { id: 'test-user-id', username: 'testuser' },
              error: null
            }))
          }))
        }))
      }));

      const mockConversation = {
        id: 'conv-1',
        participants: [
          { id: 'test-user-id', username: 'testuser' },
          { id: 'recipient-id', username: 'recipient' }
        ]
      };

      renderWithProviders(<ChatThread conversation={mockConversation} />);

      await waitFor(() => {
        expect(screen.getByText(/read/i)).toBeInTheDocument();
      });
    });
  });

  describe('Message Deletion', () => {
    it('should delete message for self', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          sender_id: 'test-user-id',
          content: 'Message to delete',
          is_read: false
        }
      ];

      supabase.from.mockImplementation(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({
                data: mockMessages,
                error: null
              }))
            })),
            single: jest.fn(() => Promise.resolve({
              data: { id: 'test-user-id', username: 'testuser' },
              error: null
            }))
          }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            error: null
          }))
        }))
      }));

      const mockConversation = {
        id: 'conv-1',
        participants: [
          { id: 'test-user-id', username: 'testuser' },
          { id: 'recipient-id', username: 'recipient' }
        ]
      };

      renderWithProviders(<ChatThread conversation={mockConversation} />);

      await waitFor(() => {
        const deleteButton = screen.getByLabelText(/delete/i);
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('messages');
      });
    });
  });

  describe('Group Messaging', () => {
    it('should create a group chat', async () => {
      renderWithProviders(<Messages />);

      const createGroupButton = screen.getByText(/new group/i);
      fireEvent.click(createGroupButton);

      const groupNameInput = screen.getByPlaceholderText(/group name/i);
      fireEvent.change(groupNameInput, { target: { value: 'Test Group' } });

      // Select members
      const member1 = screen.getByText(/user1/i);
      const member2 = screen.getByText(/user2/i);
      fireEvent.click(member1);
      fireEvent.click(member2);

      const createButton = screen.getByText(/create/i);
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('conversations');
      });
    });

    it('should send message to all group members', async () => {
      const mockGroupConversation = {
        id: 'group-1',
        type: 'group',
        name: 'Test Group',
        participants: [
          { id: 'test-user-id', username: 'testuser' },
          { id: 'user2-id', username: 'user2' },
          { id: 'user3-id', username: 'user3' }
        ]
      };

      renderWithProviders(<ChatThread conversation={mockGroupConversation} />);

      const messageInput = screen.getByPlaceholderText(/type a message/i);
      fireEvent.change(messageInput, { target: { value: 'Group message' } });

      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('messages');
      });
    });

    it('should allow admin to remove group members', async () => {
      const mockGroupConversation = {
        id: 'group-1',
        type: 'group',
        name: 'Test Group',
        admin_ids: ['test-user-id'],
        participants: [
          { id: 'test-user-id', username: 'testuser' },
          { id: 'user2-id', username: 'user2' }
        ]
      };

      renderWithProviders(<ChatThread conversation={mockGroupConversation} />);

      const settingsButton = screen.getByLabelText(/group settings/i);
      fireEvent.click(settingsButton);

      const removeMemberButton = screen.getByText(/remove/i);
      fireEvent.click(removeMemberButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('conversations');
      });
    });

    it('should allow members to leave group', async () => {
      const mockGroupConversation = {
        id: 'group-1',
        type: 'group',
        name: 'Test Group',
        admin_ids: ['admin-id'],
        participants: [
          { id: 'test-user-id', username: 'testuser' },
          { id: 'admin-id', username: 'admin' }
        ]
      };

      renderWithProviders(<ChatThread conversation={mockGroupConversation} />);

      const settingsButton = screen.getByLabelText(/group settings/i);
      fireEvent.click(settingsButton);

      const leaveButton = screen.getByText(/leave group/i);
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('conversations');
      });
    });
  });

  describe('Voice Messages', () => {
    it('should record and send voice message', async () => {
      const mockConversation = {
        id: 'conv-1',
        participants: [
          { id: 'test-user-id', username: 'testuser' },
          { id: 'recipient-id', username: 'recipient' }
        ]
      };

      // Mock MediaRecorder
      global.MediaRecorder = jest.fn().mockImplementation(() => ({
        start: jest.fn(),
        stop: jest.fn(),
        ondataavailable: null,
        onstop: null,
        state: 'inactive'
      }));

      renderWithProviders(<ChatThread conversation={mockConversation} />);

      const voiceButton = screen.getByLabelText(/record voice/i);
      fireEvent.click(voiceButton);

      // Simulate recording
      await waitFor(() => {
        expect(screen.getByText(/recording/i)).toBeInTheDocument();
      });

      const stopButton = screen.getByLabelText(/stop recording/i);
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('messages');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle message send failure', async () => {
      supabase.from.mockImplementation(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.reject(new Error('Send failed')))
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

      const mockConversation = {
        id: 'conv-1',
        participants: [
          { id: 'test-user-id', username: 'testuser' },
          { id: 'recipient-id', username: 'recipient' }
        ]
      };

      renderWithProviders(<ChatThread conversation={mockConversation} />);

      const messageInput = screen.getByPlaceholderText(/type a message/i);
      fireEvent.change(messageInput, { target: { value: 'Failed message' } });

      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to send/i)).toBeInTheDocument();
      });
    });

    it('should show retry option on network error', async () => {
      supabase.from.mockImplementation(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.reject(new Error('Network error')))
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

      const mockConversation = {
        id: 'conv-1',
        participants: [
          { id: 'test-user-id', username: 'testuser' },
          { id: 'recipient-id', username: 'recipient' }
        ]
      };

      renderWithProviders(<ChatThread conversation={mockConversation} />);

      const messageInput = screen.getByPlaceholderText(/type a message/i);
      fireEvent.change(messageInput, { target: { value: 'Network test' } });

      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/retry/i)).toBeInTheDocument();
      });
    });
  });
});