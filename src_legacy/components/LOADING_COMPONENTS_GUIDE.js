/**
 * LOADING COMPONENTS USAGE GUIDE
 * LoadingFallback.js & SkeletonLoader.js
 * 
 * Complete examples for implementing loading states
 */

import React, { Suspense, lazy } from 'react';
import LoadingFallback from './LoadingFallback';
import SkeletonLoader from './SkeletonLoader';

// ============================================
// 1. LoadingFallback - Full-screen Spinner
// ============================================

/**
 * Use Case 1: Lazy Loading Components
 * Shows full-screen spinner while loading route components
 */
const LazyProfile = lazy(() => import('./pages/Profile'));
const LazyDashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LazyProfile />
    </Suspense>
  );
}

/**
 * Use Case 2: Route-level Loading
 * Display spinner during route transitions
 */
function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/profile" element={<LazyProfile />} />
        <Route path="/dashboard" element={<LazyDashboard />} />
      </Routes>
    </Suspense>
  );
}

/**
 * Use Case 3: Conditional Full-screen Loading
 * Show spinner while fetching critical data
 */
function AppInitializer() {
  const [isInitializing, setIsInitializing] = React.useState(true);

  React.useEffect(() => {
    initializeApp().finally(() => setIsInitializing(false));
  }, []);

  if (isInitializing) {
    return <LoadingFallback />;
  }

  return <App />;
}

// ============================================
// 2. SkeletonLoader - Content Placeholders
// ============================================

/**
 * Variant: POST
 * Use for feed items, posts, articles
 */
function FeedExample() {
  const [posts, setPosts] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchPosts()
      .then(setPosts)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <SkeletonLoader variant="post" count={5} />;
  }

  return posts.map(post => <PostCard key={post.id} post={post} />);
}

/**
 * Variant: PROFILE
 * Use for avatars, user circles
 */
function UserListExample() {
  const [users, setUsers] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  if (loading) {
    return (
      <div style={{ display: 'flex', gap: '12px' }}>
        <SkeletonLoader variant="profile" count={5} />
      </div>
    );
  }

  return users.map(user => <Avatar key={user.id} user={user} />);
}

/**
 * Variant: LIST
 * Use for list items, menu items, notifications
 */
function NotificationsExample() {
  const [notifications, setNotifications] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  if (loading) {
    return <SkeletonLoader variant="list" count={8} />;
  }

  return notifications.map(notif => (
    <NotificationItem key={notif.id} notification={notif} />
  ));
}

/**
 * Variant: GRID
 * Use for photo grids, card layouts, gallery views
 */
function GalleryExample() {
  const [photos, setPhotos] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  if (loading) {
    return <SkeletonLoader variant="grid" count={12} />;
  }

  return (
    <div className="photo-grid">
      {photos.map(photo => <PhotoCard key={photo.id} photo={photo} />)}
    </div>
  );
}

// ============================================
// 3. Advanced Patterns
// ============================================

/**
 * Nested Loading States
 * Combine LoadingFallback for route with SkeletonLoader for content
 */
function ProfilePage() {
  const [userInfo, setUserInfo] = React.useState(null);
  const [posts, setPosts] = React.useState(null);

  return (
    <div>
      {/* User info section */}
      {!userInfo ? (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <SkeletonLoader variant="profile" count={1} />
          <div style={{ flex: 1 }}>
            <SkeletonLoader variant="list" count={3} />
          </div>
        </div>
      ) : (
        <UserHeader user={userInfo} />
      )}

      {/* Posts section */}
      {!posts ? (
        <SkeletonLoader variant="post" count={3} />
      ) : (
        posts.map(post => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}

/**
 * Progressive Loading
 * Show skeleton, then load content incrementally
 */
function InfiniteScrollExample() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);

  const loadMore = () => {
    setLoadingMore(true);
    fetchMoreItems()
      .then(newItems => setItems([...items, ...newItems]))
      .finally(() => setLoadingMore(false));
  };

  return (
    <>
      {loading && items.length === 0 ? (
        <SkeletonLoader variant="post" count={5} />
      ) : (
        <>
          {items.map(item => <ItemCard key={item.id} item={item} />)}
          {loadingMore && <SkeletonLoader variant="post" count={3} />}
        </>
      )}
    </>
  );
}

/**
 * Custom Skeleton Composition
 * Build complex layouts with multiple skeleton variants
 */
function DashboardSkeleton() {
  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <SkeletonLoader variant="profile" count={1} />
        <SkeletonLoader variant="list" count={2} />
      </div>

      {/* Stats cards */}
      <SkeletonLoader variant="grid" count={4} />

      {/* Recent activity */}
      <SkeletonLoader variant="list" count={5} />

      {/* Content feed */}
      <SkeletonLoader variant="post" count={3} />
    </div>
  );
}

function DashboardPage() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return <Dashboard data={data} />;
}

// ============================================
// 4. Accessibility Features
// ============================================

/**
 * Both components include:
 * ✓ role="status" - Announces loading state to screen readers
 * ✓ aria-busy="true" - Indicates busy state
 * ✓ aria-label - Descriptive text for assistive technology
 * ✓ aria-live="polite" (LoadingFallback) - Announces changes
 * ✓ data-testid - For automated testing
 * ✓ prefers-reduced-motion support - Respects user preferences
 * ✓ Dark mode support - Adapts to color scheme
 */

// ============================================
// 5. Performance Tips
// ============================================

/**
 * 1. Both components use React.memo() for optimization
 * 2. Use appropriate variant to match your content
 * 3. Set count to match expected items
 * 4. LoadingFallback is lightweight (3 spinning rings)
 * 5. SkeletonLoader uses CSS animations (GPU accelerated)
 */

// ============================================
// 6. CSS Customization
// ============================================

/**
 * LoadingFallback.module.css:
 * - Customizable spinner colors (ring colors)
 * - Adjustable animation speed (1.2s default)
 * - Mobile-responsive sizes
 * 
 * SkeletonLoader.module.css:
 * - Gradient shimmer effect
 * - Overlay animation for enhanced effect
 * - Grid auto-fill responsive layout
 * - Variant-specific heights and styles
 */

export {
  LoadingFallback,
  SkeletonLoader,
  FeedExample,
  GalleryExample,
  ProfilePage,
  InfiniteScrollExample,
  DashboardSkeleton
};
