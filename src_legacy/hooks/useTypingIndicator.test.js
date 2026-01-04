/**
 * useTypingIndicator Hook - Test Suite
 * 
 * Tests for typing indicator functionality
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import useTypingIndicator from './useTypingIndicator';
import { supabase } from '../supabaseClient';

// Mock Supabase
jest.mock('../supabaseClient', () => ({
  supabase: {
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}));

describe('useTypingIndicator', () => {
  let mockChannel;
  let mockSubscribe;
  let mockSend;
  let mockOn;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Setup mock channel
    mockOn = jest.fn().mockReturnThis();
    mockSubscribe = jest.fn((callback) => {
      callback('SUBSCRIBED');
      return mockChannel;
    });
    mockSend = jest.fn().mockResolvedValue({});

    mockChannel = {
      on: mockOn,
      subscribe: mockSubscribe,
      send: mockSend,
    };

    supabase.channel.mockReturnValue(mockChannel);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ============================================================================
  // Initialization Tests
  // ============================================================================

  test('should initialize with empty state', () => {
    const { result } = renderHook(() =>
      useTypingIndicator('user-1', 'John')
    );

    expect(result.current.typingUsers).toEqual({});
    expect(result.current.whoIsTyping('chat-1')).toEqual([]);
    expect(result.current.isAnyoneTyping('chat-1')).toBe(false);
  });

  test('should require userId and username', () => {
    const { result } = renderHook(() => useTypingIndicator(null, null));
    
    act(() => {
      result.current.setTyping('chat-1', true);
    });

    expect(mockSend).not.toHaveBeenCalled();
  });

  // ============================================================================
  // Subscription Tests
  // ============================================================================

  test('should subscribe to chat channel', () => {
    const { result } = renderHook(() =>
      useTypingIndicator('user-1', 'John')
    );

    act(() => {
      result.current.subscribeToChat('chat-1');
    });

    expect(supabase.channel).toHaveBeenCalledWith(
      'typing:chat-1',
      expect.objectContaining({
        config: { broadcast: { self: false } },
      })
    );
    expect(mockSubscribe).toHaveBeenCalled();
  });

  test('should not subscribe to same chat twice', () => {
    const { result } = renderHook(() =>
      useTypingIndicator('user-1', 'John')
    );

    act(() => {
      result.current.subscribeToChat('chat-1');
      result.current.subscribeToChat('chat-1');
    });

    expect(supabase.channel).toHaveBeenCalledTimes(1);
  });

  test('should unsubscribe from chat channel', () => {
    const { result } = renderHook(() =>
      useTypingIndicator('user-1', 'John')
    );

    act(() => {
      result.current.subscribeToChat('chat-1');
      result.current.unsubscribeFromChat('chat-1');
    });

    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });

  // ============================================================================
  // Typing Indicator Tests
  // ============================================================================

  test('should emit typing event', async () => {
    const { result } = renderHook(() =>
      useTypingIndicator('user-1', 'John')
    );

    act(() => {
      result.current.subscribeToChat('chat-1');
    });

    await act(async () => {
      await result.current.setTyping('chat-1', true);
    });

    expect(mockSend).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: 'user-1',
        username: 'John',
        isTyping: true,
      },
    });
  });

  test('should emit stop typing event', async () => {
    const { result } = renderHook(() =>
      useTypingIndicator('user-1', 'John')
    );

    act(() => {
      result.current.subscribeToChat('chat-1');
    });

    await act(async () => {
      await result.current.setTyping('chat-1', true);
      await result.current.setTyping('chat-1', false);
    });

    expect(mockSend).toHaveBeenLastCalledWith({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: 'user-1',
        username: 'John',
        isTyping: false,
      },
    });
  });

  test('should debounce rapid typing events', async () => {
    const { result } = renderHook(() =>
      useTypingIndicator('user-1', 'John')
    );

    act(() => {
      result.current.subscribeToChat('chat-1');
    });

    // Rapid typing
    await act(async () => {
      await result.current.setTyping('chat-1', true);
      await result.current.setTyping('chat-1', true);
      await result.current.setTyping('chat-1', true);
    });

    // Should only emit once due to debouncing
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test('should auto-clear typing after 3 seconds', async () => {
    const { result } = renderHook(() =>
      useTypingIndicator('user-1', 'John')
    );

    act(() => {
      result.current.subscribeToChat('chat-1');
    });

    await act(async () => {
      await result.current.setTyping('chat-1', true);
    });

    // Fast-forward 3 seconds
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(mockSend).toHaveBeenLastCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ isTyping: false }),
        })
      );
    });
  });

  // ============================================================================
  // Receiving Typing Indicators Tests
  // ============================================================================

  test('should add user to typing list', () => {
    const { result } = renderHook(() =>
      useTypingIndicator('user-1', 'John')
    );

    act(() => {
      result.current.subscribeToChat('chat-1');
    });

    // Simulate receiving typing event
    const onBroadcastCallback = mockOn.mock.calls[0][2];
    act(() => {
      onBroadcastCallback({
        payload: {
          userId: 'user-2',
          username: 'Sarah',
          isTyping: true,
        },
      });
    });

    expect(result.current.whoIsTyping('chat-1')).toEqual(['Sarah']);
    expect(result.current.isAnyoneTyping('chat-1')).toBe(true);
  });

  test('should remove user from typing list', () => {
    const { result } = renderHook(() =>
      useTypingIndicator('user-1', 'John')
    );

    act(() => {
      result.current.subscribeToChat('chat-1');
    });

    const onBroadcastCallback = mockOn.mock.calls[0][2];

    // User starts typing
    act(() => {
      onBroadcastCallback({
        payload: {
          userId: 'user-2',
          username: 'Sarah',
          isTyping: true,
        },
      });
    });

    // User stops typing
    act(() => {
      onBroadcastCallback({
        payload: {
          userId: 'user-2',
          username: 'Sarah',
          isTyping: false,
        },
      });
    });

    expect(result.current.whoIsTyping('chat-1')).toEqual([]);
    expect(result.current.isAnyoneTyping('chat-1')).toBe(false);
  });

  test('should ignore own typing events', () => {
    const { result } = renderHook(() =>
      useTypingIndicator('user-1', 'John')
    );

    act(() => {
      result.current.subscribeToChat('chat-1');
    });

    const onBroadcastCallback = mockOn.mock.calls[0][2];

    // Receive own typing event (shouldn't happen, but test anyway)
    act(() => {
      onBroadcastCallback({
        payload: {
          userId: 'user-1',
          username: 'John',
          isTyping: true,
        },
      });
    });

    expect(result.current.whoIsTyping('chat-1')).toEqual([]);
  });

  test('should handle multiple users typing', () => {
    const { result } = renderHook(() =>
      useTypingIndicator('user-1', 'John')
    );

    act(() => {
      result.current.subscribeToChat('chat-1');
    });

    const onBroadcastCallback = mockOn.mock.calls[0][2];

    // Multiple users start typing
    act(() => {
      onBroadcastCallback({
        payload: { userId: 'user-2', username: 'Sarah', isTyping: true },
      });
      onBroadcastCallback({
        payload: { userId: 'user-3', username: 'Mike', isTyping: true },
      });
      onBroadcastCallback({
        payload: { userId: 'user-4', username: 'Emma', isTyping: true },
      });
    });

    const typing = result.current.whoIsTyping('chat-1');
    expect(typing).toHaveLength(3);
    expect(typing).toContain('Sarah');
    expect(typing).toContain('Mike');
    expect(typing).toContain('Emma');
  });

  test('should auto-clear stale typing indicators', () => {
    const { result } = renderHook(() =>
      useTypingIndicator('user-1', 'John')
    );

    act(() => {
      result.current.subscribeToChat('chat-1');
    });

    const onBroadcastCallback = mockOn.mock.calls[0][2];

    // User starts typing
    act(() => {
      onBroadcastCallback({
        payload: { userId: 'user-2', username: 'Sarah', isTyping: true },
      });
    });

    expect(result.current.whoIsTyping('chat-1')).toEqual(['Sarah']);

    // Fast-forward 3 seconds
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.whoIsTyping('chat-1')).toEqual([]);
  });

  // ============================================================================
  // Formatting Tests
  // ============================================================================

  test('should format single user typing', () => {
    const { result } = renderHook(() =>
      useTypingIndicator('user-1', 'John')
    );

    act(() => {
      result.current.subscribeToChat('chat-1');
    });

    const onBroadcastCallback = mockOn.mock.calls[0][2];

    act(() => {
      onBroadcastCallback({
        payload: { userId: 'user-2', username: 'Sarah', isTyping: true },
      });
    });

    expect(result.current.getTypingText('chat-1')).toBe('Sarah is typing...');
  });

  test('should format two users typing', () => {
    const { result } = renderHook(() =>
      useTypingIndicator('user-1', 'John')
    );

    act(() => {
      result.current.subscribeToChat('chat-1');
    });

    const onBroadcastCallback = mockOn.mock.calls[0][2];

    act(() => {
      onBroadcastCallback({
        payload: { userId: 'user-2', username: 'Sarah', isTyping: true },
      });
      onBroadcastCallback({
        payload: { userId: 'user-3', username: 'Mike', isTyping: true },
      });
    });

    expect(result.current.getTypingText('chat-1')).toBe(
      'Sarah and Mike are typing...'
    );
  });

  test('should format multiple users typing', () => {
    const { result } = renderHook(() =>
      useTypingIndicator('user-1', 'John')
    );

    act(() => {
      result.current.subscribeToChat('chat-1');
    });

    const onBroadcastCallback = mockOn.mock.calls[0][2];

    act(() => {
      onBroadcastCallback({
        payload: { userId: 'user-2', username: 'Sarah', isTyping: true },
      });
      onBroadcastCallback({
        payload: { userId: 'user-3', username: 'Mike', isTyping: true },
      });
      onBroadcastCallback({
        payload: { userId: 'user-4', username: 'Emma', isTyping: true },
      });
    });

    expect(result.current.getTypingText('chat-1')).toBe(
      'Sarah and 2 others are typing...'
    );
  });

  // ============================================================================
  // Cleanup Tests
  // ============================================================================

  test('should cleanup on unmount', () => {
    const { result, unmount } = renderHook(() =>
      useTypingIndicator('user-1', 'John')
    );

    act(() => {
      result.current.subscribeToChat('chat-1');
      result.current.subscribeToChat('chat-2');
    });

    unmount();

    expect(supabase.removeChannel).toHaveBeenCalledTimes(2);
  });

  test('should clear all timers on unmount', () => {
    const { result, unmount } = renderHook(() =>
      useTypingIndicator('user-1', 'John')
    );

    act(() => {
      result.current.subscribeToChat('chat-1');
    });

    const onBroadcastCallback = mockOn.mock.calls[0][2];

    act(() => {
      onBroadcastCallback({
        payload: { userId: 'user-2', username: 'Sarah', isTyping: true },
      });
    });

    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  test('should handle empty chatId', () => {
    const { result } = renderHook(() =>
      useTypingIndicator('user-1', 'John')
    );

    act(() => {
      result.current.subscribeToChat('');
    });

    expect(supabase.channel).not.toHaveBeenCalled();
  });

  test('should handle null chatId', () => {
    const { result } = renderHook(() =>
      useTypingIndicator('user-1', 'John')
    );

    expect(result.current.whoIsTyping(null)).toEqual([]);
    expect(result.current.getTypingText(null)).toBe('');
    expect(result.current.isAnyoneTyping(null)).toBe(false);
  });

  test('should handle rapid subscribe/unsubscribe', () => {
    const { result } = renderHook(() =>
      useTypingIndicator('user-1', 'John')
    );

    act(() => {
      result.current.subscribeToChat('chat-1');
      result.current.unsubscribeFromChat('chat-1');
      result.current.subscribeToChat('chat-1');
    });

    expect(supabase.channel).toHaveBeenCalledTimes(2);
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  test('should work with multiple chats simultaneously', () => {
    const { result } = renderHook(() =>
      useTypingIndicator('user-1', 'John')
    );

    act(() => {
      result.current.subscribeToChat('chat-1');
      result.current.subscribeToChat('chat-2');
    });

    // Get callbacks for both channels
    const chat1Callback = mockOn.mock.calls[0][2];
    const chat2Callback = mockOn.mock.calls[1][2];

    // Different users typing in different chats
    act(() => {
      chat1Callback({
        payload: { userId: 'user-2', username: 'Sarah', isTyping: true },
      });
      chat2Callback({
        payload: { userId: 'user-3', username: 'Mike', isTyping: true },
      });
    });

    expect(result.current.whoIsTyping('chat-1')).toEqual(['Sarah']);
    expect(result.current.whoIsTyping('chat-2')).toEqual(['Mike']);
  });
});
