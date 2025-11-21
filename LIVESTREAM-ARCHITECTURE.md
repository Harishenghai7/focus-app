# 🎥 LiveStream.js - Architecture Diagram

## 📐 Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         LiveStream.js                            │
│                      (Main Page Component)                       │
└───────────┬─────────────────────────────────────────┬───────────┘
            │                                         │
            ├─────────────────────┬──────────────────┤
            │                     │                  │
            ▼                     ▼                  ▼
    ┌───────────────┐   ┌──────────────┐   ┌─────────────────┐
    │ VideoPlayer   │   │ ChatWindow   │   │ HeartAnimation  │
    │  Component    │   │  Component   │   │   Component     │
    └───────────────┘   └──────────────┘   └─────────────────┘
            │                     │                  │
            ▼                     ▼                  ▼
    [Video Stream]      [Chat Messages]      [Heart Effects]
```

## 🔄 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Actions                             │
└───────┬───────────────┬──────────────┬──────────────┬───────────┘
        │               │              │              │
        ▼               ▼              ▼              ▼
   [Join Stream]   [Send Chat]   [Like Stream]   [Share Stream]
        │               │              │              │
        ▼               ▼              ▼              ▼
┌───────────────────────────────────────────────────────────────────┐
│                    useWebRTCStream Hook                           │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ startBroad- │  │ joinStream() │  │ endBroadcast │            │
│  │   cast()    │  │              │  │     ()       │            │
│  └─────────────┘  └──────────────┘  └──────────────┘            │
└───────────────────────────────────────────────────────────────────┘
        │                                         │
        ▼                                         ▼
┌──────────────────┐                   ┌──────────────────┐
│ WebRTC Peer      │◄─────────────────►│ Supabase         │
│ Connection       │   ICE Candidates  │ Real-time        │
└──────────────────┘                   └──────────────────┘
        │                                         │
        ▼                                         ▼
   [Video/Audio]                          [Chat/Viewers/Likes]
```

## 🗄️ Database Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                         live_streams                             │
│  ┌─────────────────────────────────────────────────────┐        │
│  │ id, broadcaster_id, title, status, started_at,      │        │
│  │ ended_at, like_count, created_at                    │        │
│  └─────────────────────────────────────────────────────┘        │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├──────────────┬──────────────┬──────────────┐
             │              │              │              │
             ▼              ▼              ▼              ▼
    ┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
    │stream_viewers│ │stream_   │ │stream_   │ │stream_       │
    │              │ │chat      │ │likes     │ │reports       │
    │              │ │          │ │          │ │              │
    │- stream_id   │ │-stream_id│ │-stream_id│ │- stream_id   │
    │- user_id     │ │- user_id │ │- user_id │ │- reported_by │
    │- joined_at   │ │- message │ │-created_ │ │- reason      │
    │- left_at     │ │-created_ │ │  at      │ │- status      │
    └──────────────┘ └──────────┘ └──────────┘ └──────────────┘
```

## 🔐 Security Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Request                             │
└───────────┬─────────────────────────────────────────────────────┘
            │
            ▼
    ┌──────────────────┐
    │ Authentication   │────► Check if user is logged in
    │   Check          │
    └───────┬──────────┘
            │
            ▼
    ┌──────────────────┐
    │ Authorization    │────► Check if user is broadcaster
    │   Check          │      (for end stream, etc.)
    └───────┬──────────┘
            │
            ▼
    ┌──────────────────┐
    │ Row Level        │────► Database RLS policies
    │   Security       │      (Supabase)
    └───────┬──────────┘
            │
            ▼
    ┌──────────────────┐
    │  Action          │────► Perform requested action
    │  Executed        │
    └──────────────────┘
```

## 🌐 WebRTC Connection Flow

```
Broadcaster                                              Viewer
    │                                                      │
    │ 1. Start broadcast (get media)                      │
    ├──────────────────────────────────────────┐          │
    │                                           │          │
    │ 2. Create peer connection                 │          │
    │    + Add local stream tracks              │          │
    │    + Create data channel                  │          │
    ├──────────────────────────────────────────┘          │
    │                                                      │
    │ 3. Create offer                                      │
    ├─────────────────────────────────────────────────────►│
    │                  [Signaling Server]                  │
    │                                                      │ 4. Receive offer
    │                                                      ├──────────┐
    │                                                      │          │
    │                                                      │ 5. Create answer
    │◄─────────────────────────────────────────────────────┤          │
    │                  [Signaling Server]                  │          │
    │                                                      │          │
    │ 6. Exchange ICE candidates                           │          │
    │◄────────────────────────────────────────────────────►│          │
    │                                                      │          │
    │ 7. Establish peer connection                         │          │
    │═══════════════════════════════════════════════════════│          │
    │                 [Direct Connection]                  │          │
    │                                                      │          │
    │ 8. Stream video/audio                                │          │
    ├─────────────────────────────────────────────────────►│          │
    │                                                      │          │
    │ 9. Send/receive data (chat, metadata)                │          │
    │◄────────────────────────────────────────────────────►│          │
    │                                                      │          │
```

## 📱 State Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    LiveStream Component State                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Stream Data:                    User State:                    │
│  ├─ stream                       ├─ currentUser                 │
│  ├─ chatMessages                 ├─ isLiked                     │
│  ├─ viewerCount                  └─ loading / error             │
│  └─ newMessage                                                  │
│                                                                  │
│  UI State:                       WebRTC State:                  │
│  ├─ showHearts                   ├─ localStream                 │
│  ├─ showShareMenu                ├─ remoteStream                │
│  └─ showEndStreamConfirm         ├─ isConnected                 │
│                                  └─ viewersList                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🎬 User Journey

```
                        BROADCASTER FLOW
┌───────────────────────────────────────────────────────┐
│                                                       │
│  1. Navigate to /live/:streamId                       │
│          ↓                                            │
│  2. LiveStream page loads                             │
│          ↓                                            │
│  3. Request camera/mic permissions                    │
│          ↓                                            │
│  4. Start broadcast (startBroadcast)                  │
│          ↓                                            │
│  5. Display local video                               │
│          ↓                                            │
│  6. Accept viewer connections                         │
│          ↓                                            │
│  7. Stream video/audio to viewers                     │
│          ↓                                            │
│  8. Monitor viewer count, chat, likes                 │
│          ↓                                            │
│  9. End stream (endBroadcast)                         │
│          ↓                                            │
│  10. Redirect to profile                              │
│                                                       │
└───────────────────────────────────────────────────────┘

                          VIEWER FLOW
┌───────────────────────────────────────────────────────┐
│                                                       │
│  1. Navigate to /live/:streamId                       │
│          ↓                                            │
│  2. LiveStream page loads                             │
│          ↓                                            │
│  3. Join stream (joinStream)                          │
│          ↓                                            │
│  4. Display join notification                         │
│          ↓                                            │
│  5. Receive remote video stream                       │
│          ↓                                            │
│  6. Display remote video                              │
│          ↓                                            │
│  7. Send chat messages                                │
│          ↓                                            │
│  8. Like stream (heart animation)                     │
│          ↓                                            │
│  9. Share stream link                                 │
│          ↓                                            │
│  10. Leave stream (navigate away)                     │
│                                                       │
└───────────────────────────────────────────────────────┘
```

## 🎨 UI Component Tree

```
LiveStream.js
│
├─ video-section
│  │
│  ├─ VideoPlayer
│  │  └─ video (ref: videoRef)
│  │
│  ├─ stream-overlay
│  │  │
│  │  ├─ stream-top-bar
│  │  │  ├─ stream-info
│  │  │  │  ├─ live-badge "LIVE"
│  │  │  │  └─ viewer-count
│  │  │  │
│  │  │  └─ end-stream-button (if broadcaster)
│  │  │
│  │  ├─ broadcaster-info
│  │  │  ├─ broadcaster-avatar
│  │  │  └─ broadcaster-details
│  │  │     ├─ broadcaster-name
│  │  │     └─ broadcaster-username
│  │  │
│  │  └─ stream-actions
│  │     ├─ like-button
│  │     ├─ share-button
│  │     └─ leave-button (if viewer)
│  │
│  ├─ HeartAnimation (if showHearts)
│  │
│  └─ connection-status (if !isConnected)
│
├─ chat-section
│  │
│  └─ ChatWindow
│     ├─ chat-header
│     │  ├─ title "Live Chat"
│     │  └─ chat-count
│     │
│     ├─ chat-messages
│     │  └─ chat-message[] (mapped)
│     │     ├─ message-header
│     │     │  ├─ message-avatar
│     │     │  └─ message-username
│     │     │
│     │     └─ message-content
│     │
│     └─ chat-input-form
│        ├─ chat-input
│        └─ chat-send-button
│
├─ modal-overlay (if showEndStreamConfirm)
│  └─ modal-content
│     ├─ title "End Stream?"
│     ├─ message
│     └─ modal-actions
│        ├─ cancel-button
│        └─ confirm-button
│
└─ join-notification (if viewer && isConnected)
```

## 🔄 Real-time Subscriptions

```
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Real-time Channels                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Channel 1: stream:{streamId}:viewers                            │
│  ├─ Table: stream_viewers                                        │
│  ├─ Events: INSERT, UPDATE, DELETE                               │
│  └─ Action: Update viewer count                                  │
│                                                                  │
│  Channel 2: stream:{streamId}:chat                               │
│  ├─ Table: stream_chat                                           │
│  ├─ Events: INSERT                                               │
│  └─ Action: Append new message to chat                           │
│                                                                  │
│  Channel 3: stream:{streamId}:likes (optional)                   │
│  ├─ Table: stream_likes                                          │
│  ├─ Events: INSERT                                               │
│  └─ Action: Update like count, trigger animation                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Performance Optimizations

```
┌─────────────────────────────────────────────────────────────────┐
│                      Optimization Strategy                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Code Splitting:                                                 │
│  └─ Lazy load LiveStream page                                    │
│                                                                  │
│  Memoization:                                                    │
│  ├─ React.memo on VideoPlayer                                    │
│  ├─ useCallback on stream functions                              │
│  └─ useMemo on computed values                                   │
│                                                                  │
│  Efficient Rendering:                                            │
│  ├─ Virtual scrolling (for long chat)                            │
│  ├─ Debounced updates                                            │
│  └─ Throttled event handlers                                     │
│                                                                  │
│  Resource Management:                                            │
│  ├─ Cleanup WebRTC on unmount                                    │
│  ├─ Unsubscribe from channels                                    │
│  └─ Stop media tracks                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎉 Architecture Summary

The LiveStream feature is built with a **modular, scalable architecture**:

- ✅ **Separation of concerns** (components, hooks, utils)
- ✅ **Real-time data flow** (Supabase subscriptions)
- ✅ **Peer-to-peer streaming** (WebRTC)
- ✅ **Responsive design** (mobile-first)
- ✅ **Security-first** (RLS, authentication)
- ✅ **Performance optimized** (lazy loading, memoization)
- ✅ **Accessible** (ARIA labels, keyboard navigation)

**Ready for production deployment!** 🚀
