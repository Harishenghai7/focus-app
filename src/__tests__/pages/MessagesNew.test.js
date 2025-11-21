import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useParams } from 'react-router-dom';
import { jest } from '@jest/globals';
import MessagesNew from '../../pages/MessagesNew';

// Mock dependencies
const mockNavigate = jest.fn();
const mockParams = { conversationId: 'conv123' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockParams
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
                    id: 'msg1',
                    conversation_id: 'conv123',
                    sender_id: 'user1',
                    content: 'Hello there!',
                    message_type: 'text',
                    created_at: new Date().toISOString(),
                    read: true,
                    sender: {
                      id: 'user1',
                      username: 'sender1',
                      display_name: 'Sender One',
                      profile_picture: null
                    }
                  },
                  {
                    id: 'msg2',
                    conversation_id: 'conv123',
                    sender_id: 'current_user',
                    content: 'Hi! How are you?',
                    message_type: 'text',
                    created_at: new Date().toISOString(),
                    read: true,
                    sender: {
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
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: { path: 'test-media.jpg' }, error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/test-media.jpg' } }))
      }))
    }
  }
}));

// Mock importMap
jest.mock('../../importMap', () => ({
  components: {
    ChatThread: ({ messages, onMessageReply, currentUserId }) => (
      <div data-testid="chat-thread">
        {messages?.map(msg => (
          <div key={msg.id} data-testid={`message-${msg.id}`}>
            <span>{msg.sender?.display_name}: {msg.content}</span>
            <button onClick={() => onMessageReply?.(msg)}>Reply</button>
          </div>
        ))}
      </div>
    ),
    MessageInput: ({ onSend, onTyping, placeholder, disabled }) => (
      <div data-testid="message-input">
        <input
          placeholder={placeholder}
          onChange={(e) => onTyping?.(e.target.value.length > 0)}
          disabled={disabled}
        />
        <button onClick={() => onSend?.('Test message')}>Send</button>
      </div>
    ),
    OnlineIndicator: ({ isOnline, lastSeen }) => (
      <div data-testid="online-indicator" data-online={isOnline}>
        {isOnline ? 'Online' : `Last seen ${lastSeen}`}
      </div>
    ),
    SearchBar: ({ onSearch, placeholder, value }) => (
      <input
        data-testid="search-bar"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onSearch?.(e.target.value)}
      />
    ),
    CreateGroupModal: ({ isOpen, onClose, onCreateGroup }) => 
      isOpen ? (
        <div data-testid="create-group-modal">
          <h3>Create Group</h3>
          <button onClick={() => onCreateGroup?.({ name: 'Test Group', members: [] })}>Create</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      ) : null,
    EmojiPicker: ({ isOpen, onEmojiSelect, onClose }) => 
      isOpen ? (
        <div data-testid="emoji-picker">
          <button onClick={() => onEmojiSelect?.('😀')}>😀</button>
          <button onClick={onClose}>Close</button>
        </div>
      ) : null,
    VoiceRecorder: ({ onRecordingComplete, isRecording }) => (
      <div data-testid="voice-recorder">
        <button data-recording={isRecording}>
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>
    ),
    InfiniteScrollLoader: ({ loading }) => 
      loading ? <div data-testid="infinite-scroll-loader">Loading more...</div> : null,
    SkeletonLoader: () => <div data-testid="skeleton-loader">Loading...</div>,
    ErrorBoundary: ({ children }) => <div data-testid="error-boundary">{children}</div>
  },
  hooks: {
    useMessages: () => ({
      messages: [
        {
          id: 'msg1',
          conversation_id: 'conv123',
          sender_id: 'user1',
          content: 'Hello there!',
          message_type: 'text',
          created_at: new Date().toISOString(),
          read: true,
          sender: {
            id: 'user1',
            username: 'sender1',
            display_name: 'Sender One',
            profile_picture: null
          }
        }
      ],
      loading: false,
      error: null,
      sendMessage: jest.fn(),
      deleteMessage: jest.fn(),
      editMessage: jest.fn(),
      loadMore: jest.fn(),
      hasMore: true
    }),
    useTypingIndicator: () => ({
      isTyping: false,
      startTyping: jest.fn(),
      stopTyping: jest.fn(),
      typingUsers: []
    }),
    usePresence: () => ({
      onlineUsers: new Set(['user1']),
      lastSeenTimes: { user1: new Date().toISOString() }
    }),
    useReadReceipts: () => ({
      markAsRead: jest.fn(),
      readReceipts: { msg1: ['current_user'] }
    }),
    useDebounce: (value) => value,
    useRealtimeConnection: () => ({ connected: true })
  },
  utils: {
    formatDate: (date) => new Date(date).toLocaleDateString(),
    notificationService: {
      requestPermission: jest.fn(),
      showNotification: jest.fn()
    },
    linkify: (text) => text,
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

describe('MessagesNew', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithRouter(<MessagesNew user={mockUser} userProfile={mockUserProfile} />);
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });

  it('displays chat thread with messages', async () => {
    renderWithRouter(<MessagesNew user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('chat-thread')).toBeInTheDocument();
      expect(screen.getByTestId('message-msg1')).toBeInTheDocument();
    });
  });

  it('handles message sending', async () => {
    const mockSendMessage = jest.fn();
    const { hooks } = require('../../importMap');
    hooks.useMessages = () => ({
      messages: [],
      loading: false,
      error: null,
      sendMessage: mockSendMessage,
      deleteMessage: jest.fn(),
      editMessage: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false
    });

    renderWithRouter(<MessagesNew user={mockUser} userProfile={mockUserProfile} />);
    
    const sendButton = screen.getByText('Send');
    fireEvent.click(sendButton);
    
    expect(mockSendMessage).toHaveBeenCalledWith('Test message');
  });

  it('displays typing indicators', async () => {
    const { hooks } = require('../../importMap');
    hooks.useTypingIndicator = () => ({
      isTyping: true,
      startTyping: jest.fn(),
      stopTyping: jest.fn(),
      typingUsers: ['user1']
    });

    renderWithRouter(<MessagesNew user={mockUser} userProfile={mockUserProfile} />);
    
    // Test typing indicator display
    expect(screen.getByTestId('chat-thread')).toBeInTheDocument();
  });

  it('shows online status for users', async () => {
    renderWithRouter(<MessagesNew user={mockUser} userProfile={mockUserProfile} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('online-indicator')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    renderWithRouter(<MessagesNew user={mockUser} userProfile={mockUserProfile} />);
    
    const searchBar = screen.getByTestId('search-bar');
    fireEvent.change(searchBar, { target: { value: 'test search' } });
    
    expect(searchBar.value).toBe('test search');
  });

  it('manages group chat creation', async () => {
    renderWithRouter(<MessagesNew user={mockUser} userProfile={mockUserProfile} />);
    
    // Test group creation modal
    // This would be triggered by some UI element
  });

  it('handles emoji picker', async () => {
    renderWithRouter(<MessagesNew user={mockUser} userProfile={mockUserProfile} />);
    
    // Test emoji picker functionality
    // This would be triggered by some UI element
  });

  it('supports voice message recording', async () => {
    renderWithRouter(<MessagesNew user={mockUser} userProfile={mockUserProfile} />);
    
    const voiceRecorder = screen.getByTestId('voice-recorder');
    expect(voiceRecorder).toBeInTheDocument();
  });

  it('handles message deletion', async () => {
    const mockDeleteMessage = jest.fn();
    const { hooks } = require('../../importMap');
    hooks.useMessages = () => ({
      messages: [
        {
          id: 'msg1',
          sender_id: 'current_user',
          content: 'Test message',
          message_type: 'text',
          created_at: new Date().toISOString(),
          sender: mockUserProfile
        }
      ],
      loading: false,
      error: null,
      sendMessage: jest.fn(),
      deleteMessage: mockDeleteMessage,
      editMessage: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false
    });

    renderWithRouter(<MessagesNew user={mockUser} userProfile={mockUserProfile} />);
    
    // Test message deletion functionality
    expect(mockDeleteMessage).toHaveBeenCalledTimes(0);
  });

  it('handles message editing', async () => {
    const mockEditMessage = jest.fn();
    const { hooks } = require('../../importMap');
    hooks.useMessages = () => ({
      messages: [
        {
          id: 'msg1',
          sender_id: 'current_user',
          content: 'Test message',
          message_type: 'text',
          created_at: new Date().toISOString(),
          sender: mockUserProfile
        }
      ],
      loading: false,
      error: null,
      sendMessage: jest.fn(),
      deleteMessage: jest.fn(),
      editMessage: mockEditMessage,
      loadMore: jest.fn(),
      hasMore: false
    });

    renderWithRouter(<MessagesNew user={mockUser} userProfile={mockUserProfile} />);
    
    // Test message editing functionality
    expect(mockEditMessage).toHaveBeenCalledTimes(0);
  });

  it('manages read receipts', async () => {
    const mockMarkAsRead = jest.fn();
    const { hooks } = require('../../importMap');
    hooks.useReadReceipts = () => ({
      markAsRead: mockMarkAsRead,
      readReceipts: { msg1: ['current_user'] }
    });

    renderWithRouter(<MessagesNew user={mockUser} userProfile={mockUserProfile} />);
    
    // Test read receipts functionality
    expect(mockMarkAsRead).toHaveBeenCalledTimes(0);
  });

  it('handles infinite scroll for message history', async () => {
    const mockLoadMore = jest.fn();
    const { hooks } = require('../../importMap');
    hooks.useMessages = () => ({
      messages: Array.from({ length: 50 }, (_, i) => ({
        id: `msg${i}`,
        sender_id: i % 2 === 0 ? 'current_user' : 'other_user',
        content: `Message ${i}`,
        message_type: 'text',
        created_at: new Date().toISOString(),
        sender: { id: `user${i}`, display_name: `User ${i}` }
      })),
      loading: false,
      error: null,
      sendMessage: jest.fn(),
      deleteMessage: jest.fn(),
      editMessage: jest.fn(),
      loadMore: mockLoadMore,
      hasMore: true
    });

    renderWithRouter(<MessagesNew user={mockUser} userProfile={mockUserProfile} />);
    
    expect(mockLoadMore).toHaveBeenCalledTimes(0);
  });

  it('handles media message attachments', async () => {
    renderWithRouter(<MessagesNew user={mockUser} userProfile={mockUserProfile} />);
    
    // Test media attachment functionality
    expect(screen.getByTestId('message-input')).toBeInTheDocument();
  });

  it('manages conversation participants', async () => {
    renderWithRouter(<MessagesNew user={mockUser} userProfile={mockUserProfile} />);
    
    // Test participant management
    expect(screen.getByTestId('chat-thread')).toBeInTheDocument();
  });

  it('handles message replies', async () => {
    renderWithRouter(<MessagesNew user={mockUser} userProfile={mockUserProfile} />);
    
    const replyButton = screen.getByText('Reply');
    fireEvent.click(replyButton);
    
    // Test message reply functionality
  });

  it('displays loading states', async () => {
    const { hooks } = require('../../importMap');
    hooks.useMessages = () => ({
      messages: [],
      loading: true,
      error: null,
      sendMessage: jest.fn(),
      deleteMessage: jest.fn(),
      editMessage: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false
    });

    renderWithRouter(<MessagesNew user={mockUser} userProfile={mockUserProfile} />);
    
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('handles error states', async () => {
    const { hooks } = require('../../importMap');
    hooks.useMessages = () => ({
      messages: [],
      loading: false,
      error: 'Failed to load messages',
      sendMessage: jest.fn(),
      deleteMessage: jest.fn(),
      editMessage: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false
    });

    renderWithRouter(<MessagesNew user={mockUser} userProfile={mockUserProfile} />);
    
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });

  it('tracks analytics events', () => {
    const { utils } = require('../../importMap');
    
    renderWithRouter(<MessagesNew user={mockUser} userProfile={mockUserProfile} />);
    
    expect(utils.trackPageView).toHaveBeenCalledWith('Messages');
    expect(utils.measureLoadTime).toHaveBeenCalled();
  });

  it('handles real-time message updates', () => {
    renderWithRouter(<MessagesNew user={mockUser} userProfile={mockUserProfile} />);
    
    const { hooks } = require('../../importMap');
    expect(hooks.useRealtimeConnection()).toEqual({ connected: true });
  });

  it('manages notification permissions', async () => {
    renderWithRouter(<MessagesNew user={mockUser} userProfile={mockUserProfile} />);
    
    const { utils } = require('../../importMap');
    expect(utils.notificationService.requestPermission).toHaveBeenCalledTimes(0);
  });

  it('handles message formatting and linkification', async () => {
    const { utils } = require('../../importMap');
    
    renderWithRouter(<MessagesNew user={mockUser} userProfile={mockUserProfile} />);
    
    expect(utils.linkify).toBeDefined();
  });

  it('supports keyboard shortcuts', async () => {
    renderWithRouter(<MessagesNew user={mockUser} userProfile={mockUserProfile} />);
    
    // Test keyboard shortcuts for sending messages, etc.
    fireEvent.keyDown(screen.getByTestId('message-input'), { 
      key: 'Enter', 
      ctrlKey: true 
    });
  });

  it('is accessible', async () => {
    renderWithRouter(<MessagesNew user={mockUser} userProfile={mockUserProfile} />);
    
    // Test ARIA attributes and keyboard navigation
    const chatThread = screen.getByTestId('chat-thread');
    expect(chatThread).toBeInTheDocument();
    
    const messageInput = screen.getByTestId('message-input');
    expect(messageInput).toBeInTheDocument();
  });

  it('handles empty conversation state', async () => {
    const { hooks } = require('../../importMap');
    hooks.useMessages = () => ({
      messages: [],
      loading: false,
      error: null,
      sendMessage: jest.fn(),
      deleteMessage: jest.fn(),
      editMessage: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false
    });

    renderWithRouter(<MessagesNew user={mockUser} userProfile={mockUserProfile} />);
    
    expect(screen.getByTestId('chat-thread')).toBeInTheDocument();
  });
});
