/**
 * Skeleton Integration Examples
 * Copy and paste these patterns into your components
 */

// ============================================
// QUICK IMPORT
// ============================================
import {
  PostSkeleton,
  PostListSkeleton,
  ProfileSkeleton,
  ProfileHeaderSkeleton,
  ProfileGridSkeleton,
  MessageSkeleton,
  ChatListSkeleton,
  ChatListItemSkeleton,
  ConversationSkeleton,
  CommentSkeleton,
  CommentSectionSkeleton,
  CommentInputSkeleton,
} from '../components/Skeleton';

// ============================================
// PATTERN 1: Simple Loading State
// ============================================
export function SimplePostPage({ postId }) {
  const [post, setPost] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    fetchPost(postId).then(data => {
      setPost(data);
      setIsLoading(false);
    });
  }, [postId]);

  return isLoading ? <PostSkeleton /> : <Post post={post} />;
}

// ============================================
// PATTERN 2: React Query Integration
// ============================================
import { useQuery } from '@tanstack/react-query';

export function FeedWithReactQuery() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['feed'],
    queryFn: () => api.get('/feed'),
  });

  return (
    <>
      {isLoading ? (
        <PostListSkeleton count={5} />
      ) : (
        <PostList posts={posts} />
      )}
    </>
  );
}

// ============================================
// PATTERN 3: Progressive Loading
// ============================================
export function ProfilePageProgressive({ userId }) {
  const [profile, setProfile] = React.useState(null);
  const [posts, setPosts] = React.useState(null);
  const [profileLoading, setProfileLoading] = React.useState(true);
  const [postsLoading, setPostsLoading] = React.useState(true);

  React.useEffect(() => {
    // Load profile first
    fetchProfile(userId).then(data => {
      setProfile(data);
      setProfileLoading(false);
    });

    // Then load posts
    fetchUserPosts(userId).then(data => {
      setPosts(data);
      setPostsLoading(false);
    });
  }, [userId]);

  return (
    <>
      {profileLoading ? (
        <ProfileHeaderSkeleton />
      ) : (
        <ProfileHeader profile={profile} />
      )}

      {postsLoading ? (
        <ProfileGridSkeleton count={9} />
      ) : (
        <PostsGrid posts={posts} />
      )}
    </>
  );
}

// ============================================
// PATTERN 4: Multiple Loading States
// ============================================
export function PostDetailPage({ postId }) {
  const [post, setPost] = React.useState(null);
  const [comments, setComments] = React.useState(null);
  const [postLoading, setPostLoading] = React.useState(true);
  const [commentsLoading, setCommentsLoading] = React.useState(false);

  React.useEffect(() => {
    // Load post
    fetchPost(postId).then(data => {
      setPost(data);
      setPostLoading(false);
    });
  }, [postId]);

  const handleExpandComments = () => {
    if (!comments) {
      setCommentsLoading(true);
      fetchComments(postId).then(data => {
        setComments(data);
        setCommentsLoading(false);
      });
    }
  };

  return (
    <div>
      {postLoading ? (
        <PostSkeleton />
      ) : (
        <>
          <Post post={post} onCommentClick={handleExpandComments} />
          {commentsLoading ? (
            <CommentSectionSkeleton count={5} />
          ) : comments ? (
            <CommentSection comments={comments} />
          ) : null}
        </>
      )}
    </div>
  );
}

// ============================================
// PATTERN 5: Chat Conversation
// ============================================
export function ChatConversation({ threadId }) {
  const {
    data: messages,
    isLoading,
    hasNextPage,
    fetchPreviousPage,
    isFetchingPreviousPage,
  } = useInfiniteQuery({
    queryKey: ['messages', threadId],
    queryFn: ({ pageParam = 0 }) =>
      api.get(`/messages/${threadId}`, { offset: pageParam }),
    getNextPageParam: (lastPage, pages) =>
      lastPage.nextOffset !== undefined ? lastPage.nextOffset : undefined,
  });

  if (isLoading) {
    return <ConversationSkeleton messageCount={8} />;
  }

  return (
    <div className="conversation">
      {hasNextPage && (
        <button
          onClick={() => fetchPreviousPage()}
          disabled={isFetchingPreviousPage}
        >
          {isFetchingPreviousPage ? (
            <MessageSkeleton />
          ) : (
            'Load Earlier Messages'
          )}
        </button>
      )}

      <MessageList messages={messages?.pages.flatMap(p => p.messages)} />
      <MessageInput threadId={threadId} />
    </div>
  );
}

// ============================================
// PATTERN 6: Chat List
// ============================================
export function ChatListPage() {
  const {
    data: chats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['chats'],
    queryFn: () => api.get('/chats'),
  });

  if (isLoading) {
    return <ChatListSkeleton count={8} />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="chat-list">
      {chats?.map(chat => (
        <ChatListItem key={chat.id} chat={chat} />
      ))}
    </div>
  );
}

// ============================================
// PATTERN 7: Skeleton With Minimum Display Time
// ============================================
export function WithMinimumSkeletonTime({ queryFn, count = 5 }) {
  const MIN_SKELETON_TIME = 200; // milliseconds
  const [displaySkeleton, setDisplaySkeleton] = React.useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['data'],
    queryFn,
  });

  React.useEffect(() => {
    if (!isLoading && displaySkeleton) {
      const timer = setTimeout(() => {
        setDisplaySkeleton(false);
      }, MIN_SKELETON_TIME);

      return () => clearTimeout(timer);
    }
  }, [isLoading, displaySkeleton]);

  return displaySkeleton ? (
    <PostListSkeleton count={count} />
  ) : (
    <PostList posts={data} />
  );
}

// ============================================
// PATTERN 8: Skeleton Error Fallback
// ============================================
export function WithErrorHandling({ postId }) {
  const {
    data: post,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => api.get(`/posts/${postId}`),
  });

  if (isLoading) {
    return <PostSkeleton />;
  }

  if (error) {
    return (
      <div className="error-state">
        <p>Failed to load post</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return <Post post={post} />;
}

// ============================================
// PATTERN 9: Infinite Scroll Feed
// ============================================
export function InfiniteScrollFeed() {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam = 0 }) =>
      api.get('/feed', { offset: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });

  const posts = data?.pages.flatMap(page => page.posts) ?? [];

  const observerTarget = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div>
      {isLoading ? (
        <PostListSkeleton count={5} />
      ) : (
        <>
          {posts.map(post => (
            <Post key={post.id} post={post} />
          ))}
        </>
      )}

      {isFetchingNextPage && <PostListSkeleton count={3} />}

      <div ref={observerTarget} style={{ height: '20px' }} />
    </div>
  );
}

// ============================================
// PATTERN 10: Search Results
// ============================================
export function SearchResults({ query }) {
  const [results, setResults] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState('all');

  React.useEffect(() => {
    if (!query) return;

    setIsLoading(true);
    api.get('/search', { q: query, type: selectedType }).then(data => {
      setResults(data);
      setIsLoading(false);
    });
  }, [query, selectedType]);

  if (isLoading) {
    return (
      <>
        {selectedType === 'all' || selectedType === 'posts' && (
          <PostListSkeleton count={3} />
        )}
        {selectedType === 'all' || selectedType === 'profiles' && (
          <div className="search-profiles">
            {[1, 2, 3].map(i => (
              <ProfileHeaderSkeleton key={i} />
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="search-results">
      {results.length === 0 ? (
        <p>No results found for "{query}"</p>
      ) : (
        results.map(result => (
          <SearchResult key={result.id} result={result} />
        ))
      )}
    </div>
  );
}

// ============================================
// PATTERN 11: Custom Skeleton Composition
// ============================================
export function ComplexLoading() {
  return (
    <div className="complex-loading">
      {/* Header section loading */}
      <div className="loading-section">
        <ProfileHeaderSkeleton />
      </div>

      {/* Stats section loading */}
      <div className="loading-section">
        {/* Show 3 stat blocks */}
        <div className="stats-skeleton">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-stat-block">
              <div className="skeleton-stat-value"></div>
              <div className="skeleton-stat-label"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Posts grid loading */}
      <div className="loading-section">
        <ProfileGridSkeleton count={6} />
      </div>
    </div>
  );
}

export default {
  SimplePostPage,
  FeedWithReactQuery,
  ProfilePageProgressive,
  PostDetailPage,
  ChatConversation,
  ChatListPage,
  WithMinimumSkeletonTime,
  WithErrorHandling,
  InfiniteScrollFeed,
  SearchResults,
  ComplexLoading,
};
