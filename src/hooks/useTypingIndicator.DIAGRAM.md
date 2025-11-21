# 🎯 useTypingIndicator - Visual Architecture

## Component Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Chat Component (User A)                      │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  useTypingIndicator(userId: 'A', username: 'Alice')        │ │
│  │                                                              │ │
│  │  1. User types in input                                     │ │
│  │     onChange={(e) => setTyping('chat-1', true)}            │ │
│  │                                                              │ │
│  │  2. Hook emits typing event (debounced 500ms)              │ │
│  │     → channel.send({ userId: 'A', isTyping: true })        │ │
│  │                                                              │ │
│  │  3. Auto-clear timer starts (3000ms)                        │ │
│  │     → setTimeout(() => setTyping(false), 3000)             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│                            ↓ Broadcast                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌──────────────────┐
                    │  Supabase Cloud  │
                    │  Realtime Server │
                    │                  │
                    │  Channel:        │
                    │  "typing:chat-1" │
                    └──────────────────┘
                              ↓
                         Broadcast
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Chat Component (User B)                      │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  useTypingIndicator(userId: 'B', username: 'Bob')          │ │
│  │                                                              │ │
│  │  1. Receives typing event                                   │ │
│  │     ← { userId: 'A', username: 'Alice', isTyping: true }   │ │
│  │                                                              │ │
│  │  2. Updates local state                                     │ │
│  │     typingUsers['chat-1'] = [{ userId: 'A', ... }]         │ │
│  │                                                              │ │
│  │  3. Displays indicator                                      │ │
│  │     {getTypingText('chat-1')} → "Alice is typing..."       │ │
│  │                                                              │ │
│  │  4. Auto-removes after 3 seconds                            │ │
│  │     → setTimeout(() => remove, 3000)                        │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## State Machine Diagram

```
                    ┌──────────────┐
                    │  NOT TYPING  │
                    │              │
                    └──────┬───────┘
                           │
                    User starts typing
                    setTyping(chatId, true)
                           │
                           ↓
                    ┌──────────────┐
                    │    TYPING    │ ←──────┐
                    │              │        │
                    │ Emitting...  │        │
                    └──────┬───────┘        │
                           │                │
              ┌────────────┼────────────┐   │
              │            │            │   │
              │            │            │   │
     User sends message    │    User continues typing
              │            │     (within 3 seconds)
              │            │            │
              ↓            ↓            └───┘
    ┌──────────────┐  ┌──────────────┐
    │  STOPPED     │  │  AUTO-CLEAR  │
    │              │  │              │
    │ Cleared      │  │ Timer: 3s    │
    └──────────────┘  └──────────────┘
```

## Multi-User Flow

```
Chat Room: "chat-1"

Time: 0s
┌──────────────────────────────────────────────────┐
│ No one typing                                    │
│ Display: [Empty]                                 │
└──────────────────────────────────────────────────┘

Time: 1s - Alice starts typing
┌──────────────────────────────────────────────────┐
│ Alice is typing                                  │
│ Display: "Alice is typing..."                    │
└──────────────────────────────────────────────────┘

Time: 2s - Bob starts typing
┌──────────────────────────────────────────────────┐
│ Alice is typing                                  │
│ Bob is typing                                    │
│ Display: "Alice and Bob are typing..."           │
└──────────────────────────────────────────────────┘

Time: 3s - Charlie starts typing
┌──────────────────────────────────────────────────┐
│ Alice is typing                                  │
│ Bob is typing                                    │
│ Charlie is typing                                │
│ Display: "Alice and 2 others are typing..."      │
└──────────────────────────────────────────────────┘

Time: 4s - Alice stops (auto-clear)
┌──────────────────────────────────────────────────┐
│ Bob is typing                                    │
│ Charlie is typing                                │
│ Display: "Bob and Charlie are typing..."         │
└──────────────────────────────────────────────────┘

Time: 5s - Bob sends message
┌──────────────────────────────────────────────────┐
│ Charlie is typing                                │
│ Display: "Charlie is typing..."                  │
└──────────────────────────────────────────────────┘

Time: 8s - Charlie stops (auto-clear)
┌──────────────────────────────────────────────────┐
│ No one typing                                    │
│ Display: [Empty]                                 │
└──────────────────────────────────────────────────┘
```

## Debouncing Mechanism

```
User Typing Events:
    t=0ms    t=100ms  t=200ms  t=300ms  t=700ms
    ──────────────────────────────────────────→ Time
    keypress keypress keypress keypress keypress
       ↓        ↓        ↓        ↓        ↓
    
Emit Events (500ms debounce):
    ───┬──────────────────────────────┬─────→ Time
       ↓                              ↓
     EMIT                           EMIT
    (First)                     (After 500ms gap)

Without Debouncing: 5 emits
With Debouncing: 2 emits
Savings: 60% reduction
```

## Auto-Clear Timer Flow

```
User Types
    ↓
Emit Typing Event
    ↓
Start 3s Timer ──────────────────────────┐
    ↓                                     │
User continues typing                     │
    ↓                                     │
Reset Timer ──────────────────────────┐   │
    ↓                                  │   │
User continues typing                  │   │
    ↓                                  │   │
Reset Timer ──────────────────────┐    │   │
    ↓                              │    │   │
User stops typing                  │    │   │
    ↓                              │    │   │
Wait 3s                            │    │   │
    ↓                              ↓    ↓   ↓
Auto-clear                       (Cancelled)
    ↓
Stop Typing Event
```

## Memory Management

```
┌─────────────────────────────────────────────────┐
│              Component Lifecycle                 │
└─────────────────────────────────────────────────┘

Mount
  ↓
┌─────────────────────────────────────────────────┐
│ Initialize State                                 │
│ - typingUsers = {}                               │
│ - channelsRef = new Map()                        │
│ - typingTimersRef = new Map()                    │
│ - lastTypingEmitRef = new Map()                  │
│ - clearTimersRef = new Map()                     │
└─────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────┐
│ Subscribe to Chats                               │
│ subscribeToChat('chat-1')                        │
│ subscribeToChat('chat-2')                        │
└─────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────┐
│ Active Usage                                     │
│ - Emit typing events                             │
│ - Receive typing events                          │
│ - Manage timers                                  │
└─────────────────────────────────────────────────┘
  ↓
Unmount
  ↓
┌─────────────────────────────────────────────────┐
│ Cleanup (Automatic)                              │
│                                                  │
│ 1. Unsubscribe all channels                      │
│    channelsRef.forEach(ch => removeChannel)      │
│                                                  │
│ 2. Clear all typing timers                       │
│    typingTimersRef.forEach(t => clearTimeout)    │
│                                                  │
│ 3. Clear all auto-stop timers                    │
│    clearTimersRef.forEach(t => clearTimeout)     │
│                                                  │
│ 4. Clear all Maps                                │
│    channelsRef.clear()                           │
│    typingTimersRef.clear()                       │
│    lastTypingEmitRef.clear()                     │
│    clearTimersRef.clear()                        │
│                                                  │
│ Result: No memory leaks! ✅                      │
└─────────────────────────────────────────────────┘
```

## Channel Structure

```
┌─────────────────────────────────────────────────────────┐
│           Supabase Realtime Channel                     │
│                                                          │
│  Channel Name: "typing:chat-1"                          │
│                                                          │
│  Config:                                                 │
│  {                                                       │
│    broadcast: {                                          │
│      self: false  ← Don't receive own events            │
│    }                                                     │
│  }                                                       │
│                                                          │
│  Events:                                                 │
│  ┌────────────────────────────────────────────────┐     │
│  │  Event: "typing"                                │     │
│  │                                                  │     │
│  │  Payload:                                        │     │
│  │  {                                               │     │
│  │    userId: "user-123",                          │     │
│  │    username: "Alice",                           │     │
│  │    isTyping: true                               │     │
│  │  }                                               │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  Subscribers:                                            │
│  - User A (Alice)   ← Sending                           │
│  - User B (Bob)     ← Receiving                         │
│  - User C (Charlie) ← Receiving                         │
└─────────────────────────────────────────────────────────┘
```

## Performance Metrics

```
┌─────────────────────────────────────────────────────────┐
│                 Without Optimization                     │
├─────────────────────────────────────────────────────────┤
│ User types "Hello" (5 characters)                       │
│ Events emitted: 5                                        │
│ Network requests: 5                                      │
│ Bandwidth: ~500 bytes                                    │
│ State updates: 5                                         │
└─────────────────────────────────────────────────────────┘

                         ↓
              Apply Optimizations
                         ↓

┌─────────────────────────────────────────────────────────┐
│                  With useTypingIndicator                 │
├─────────────────────────────────────────────────────────┤
│ User types "Hello" (5 characters)                       │
│ Events emitted: 1 (debounced)                           │
│ Network requests: 1                                      │
│ Bandwidth: ~100 bytes                                    │
│ State updates: 1                                         │
│                                                          │
│ Improvement:                                             │
│ - 80% fewer events                                       │
│ - 80% less bandwidth                                     │
│ - 80% fewer renders                                      │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

```
Local Component State
        ↓
    setTyping()
        ↓
  Check Debounce
        ↓
   Emit to Channel ────────→ Supabase
        ↓                        ↓
   Set Auto-clear          Broadcast
        ↓                        ↓
   Wait 3s                  Other Users
        ↓                        ↓
  Auto-clear ←──────────── Update UI
```

## Hook Return Values

```
useTypingIndicator(userId, username)
        ↓
    Returns Object
        │
        ├── setTyping(chatId, isTyping)
        │   └── Emit typing event
        │
        ├── stopTyping(chatId)
        │   └── Stop typing manually
        │
        ├── whoIsTyping(chatId)
        │   └── Return: ['Alice', 'Bob']
        │
        ├── getTypingText(chatId)
        │   └── Return: "Alice and Bob are typing..."
        │
        ├── isAnyoneTyping(chatId)
        │   └── Return: boolean
        │
        ├── subscribeToChat(chatId)
        │   └── Subscribe to channel
        │
        ├── unsubscribeFromChat(chatId)
        │   └── Unsubscribe from channel
        │
        └── typingUsers
            └── Raw state object
```

## Integration Example

```
┌─────────────────────────────────────────────────────────┐
│                    ChatComponent.jsx                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  import useTypingIndicator from './useTypingIndicator'  │
│                                                          │
│  const { setTyping, getTypingText } =                   │
│    useTypingIndicator('user-1', 'Alice')                │
│                                                          │
│  return (                                                │
│    <>                                                    │
│      {/* Display typing indicator */}                   │
│      <div>{getTypingText('chat-1')}</div>              │
│                                                          │
│      {/* Chat input */}                                 │
│      <input                                              │
│        onChange={e =>                                    │
│          setTyping('chat-1', e.target.value.length > 0) │
│        }                                                 │
│      />                                                  │
│    </>                                                   │
│  )                                                       │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Reference

### Timing Constants
- **Debounce Delay**: 500ms
- **Auto-clear Delay**: 3000ms (3 seconds)

### Channel Naming
- Format: `typing:{chatId}`
- Example: `typing:chat-123`

### Event Payload
```javascript
{
  userId: string,
  username: string,
  isTyping: boolean
}
```

### State Structure
```javascript
{
  'chat-1': [
    { userId: 'A', username: 'Alice', timestamp: 123456 },
    { userId: 'B', username: 'Bob', timestamp: 123457 }
  ]
}
```

---

**Visual guide complete!** 🎨
