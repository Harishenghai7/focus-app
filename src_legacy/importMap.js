/**
 * Central Import Map for Focus App
 * 
 * Provides a single point of import for all components, hooks, and utilities
 * throughout the application. Reduces import path complexity and improves
 * maintainability by centralizing module exports.
 * 
 * @usage
 * // Instead of:
 * import PostCard from '../components/PostCard';
 * import { useRealtimeInteractions } from '../hooks/useRealtimeInteractions';
 * import { formatDate } from '../utils/dateFormatter';
 * 
 * // Use:
 * import { components, hooks, utils } from '../importMap';
 * const { PostCard } = components;
 * const { useRealtimeInteractions } = hooks;
 * const { formatDate } = utils;
 */

// ============================================================================
// COMPONENTS
// ============================================================================

// UI Foundation Components
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import RealtimeErrorBoundary from './components/RealtimeErrorBoundary';
import ScreenReaderAnnouncer from './components/ScreenReaderAnnouncer';

// Post & Feed Components
import PostCard from './components/PostCard';
import InteractionBar from './components/InteractionBar';
import CommentSection from './components/CommentSection';
import Stories from './components/Stories';
import CarouselViewer from './components/CarouselViewer';
import DoubleTapLike from './components/DoubleTapLike';

// Media Components
import MediaViewer from './components/MediaViewer';
import MediaEditor from './components/MediaEditor';
import AdvancedMediaEditor from './components/AdvancedMediaEditor';
import MediaPreview from './components/MediaPreview';
import MediaSelector from './components/MediaSelector';
import LazyImage from './components/LazyImage';
import AudioPlayer from './components/AudioPlayer';
import VoiceRecorder from './components/VoiceRecorder';
import ReelPlayer from './components/ReelPlayer';
import MusicPlayer from './components/MusicPlayer/MusicPlayer';

// User Interaction Components
import FollowButton from './components/FollowButton';
import VerifiedBadge from './components/VerifiedBadge';
import UserSearchResult from './components/UserSearchResult';
import AvatarUpload from './components/AvatarUpload';
import UserOptionsMenu from './components/UserOptionsMenu';

// Search & Discovery Components
import SearchBar from './components/SearchBar';
import SearchResultCard from './components/SearchResultCard';
import ExploreGrid from './components/ExploreGrid';
import ExploreTabs from './components/ExploreTabs';
import ExploreTile from './components/ExploreTile';
import TrendingHashtags from './components/TrendingHashtags';
import TrendingSection from './components/TrendingSection';
import TrendingCard from './components/TrendingCard';
import InfiniteScrollLoader from './components/InfiniteScrollLoader';
import SkeletonLoader from './components/SkeletonLoader';

// Modal Components
import CommentsModal from './components/CommentsModal';
import InstagramCommentsModal from './components/InstagramCommentsModal';
import ShareModal from './components/ShareModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import DeleteAccountModal from './components/DeleteAccountModal';
import SessionExpiredModal from './components/SessionExpiredModal';
import CreateGroupModal from './components/CreateGroupModal';
import CreateHighlightModal from './components/CreateHighlightModal';
import SaveCollectionsModal from './components/SaveCollectionsModal';
import ReportModal from './components/ReportModal';
import TwoFactorModal from './components/TwoFactorModal';
import TwoFactorSetup from './components/TwoFactorSetup';
import DataExportModal from './components/DataExportModal';
import ViewersModal from './components/ViewersModal';

// Communication Components
import GroupChat from './components/GroupChat';
import GroupChatList from './components/GroupChatList';
import GroupSettings from './components/GroupSettings';
import CloseFriendsManager from './components/CloseFriendsManager';
import TypingIndicator from './components/TypingIndicator';
import ReactionPicker from './components/ReactionPicker';
import LinkifiedText from './components/LinkifiedText';
import ParsedContent from './components/ParsedContent';

// Call & WebRTC Components
import CallButton from './components/CallButton';
import CallControls from './components/CallControls';
import CallIcon from './components/CallIcon';
import ActiveCallModal from './components/ActiveCallModal';
import IncomingCallModal from './components/IncomingCallModal';
import IncomingCallListener from './components/IncomingCallListener';
import WebRTCTest from './components/WebRTCTest';

// Notification & Status Components
import NotificationToast from './components/NotificationToast';
import OfflineIndicator from './components/OfflineIndicator';
import SkeletonScreen from './components/SkeletonScreen';
import UpdateNotification from './components/UpdateNotification';
import RateLimitError from './components/RateLimitError';
import ActivityStatus from './components/ActivityStatus';

// Auth & Security Components
import EmailVerification from './components/EmailVerification';
import TwoFactorAuth from './components/TwoFactorAuth';
import CSRFProtectionProvider from './components/CSRFProtectionProvider';
import SessionManagement from './components/SessionManagement';
import AccessibilitySettings from './components/AccessibilitySettings';

// Specialty Components
import Dashboard from './components/Dashboard';
import OnboardingFlow from './components/OnboardingFlow';
import AddStoryModal from './components/AddStoryModal';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import PushNotificationPrompt from './components/PushNotificationPrompt';
import EditPostModal from './components/EditPostModal';
import ScheduledPosts from './components/ScheduledPosts';
import SchedulePicker from './components/SchedulePicker';
import PeoplePicker from './components/PeoplePicker';
import MentionInput from './components/MentionInput';
import HashtagInput from './components/HashtagInput';
import LocationPicker from './components/LocationPicker';
import ImageCropper from './components/ImageCropper';
import FilterSelector from './components/FilterSelector';
import ProgressBar from './components/ProgressBar';
import ContentOptionsMenu from './components/ContentOptionsMenu';
import StateHandler from './components/StateHandler';
import OrientationHandler from './components/OrientationHandler';

// Hook imports
import { useRealtimeInteractions } from './hooks/useRealtimeInteractions';
import { useMessages } from './hooks/useMessages';
import { useNotifications } from './hooks/useNotifications';
import { useDebounce } from './hooks/useDebounce';
import { useInfiniteScroll } from './hooks/useInfiniteScroll';
import { useCall } from './hooks/useCall';
import { useWebRTCCall } from './hooks/useWebRTCCall';
import { usePeerConnection } from './hooks/usePeerConnection';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { useLazyLoad } from './hooks/useLazyLoad';
import { useLoadingState } from './hooks/useLoadingState';
import { useOptimisticAction } from './hooks/useOptimisticAction';
import { useOrientation } from './hooks/useOrientation';
import { useRateLimit } from './hooks/useRateLimit';
import { useRealtimeConnection } from './hooks/useRealtimeConnection';
import { useScrollRestoration } from './hooks/useScrollRestoration';
import { useSignedUrl } from './hooks/useSignedUrl';
import { useStateSync } from './hooks/useStateSync';
import { useCSRFProtection } from './hooks/useCSRFProtection';
import { useInstagramInteractions } from './hooks/useInstagramInteractions';
import { useInstagramLikeInteractions } from './hooks/useInstagramLikeInteractions';
import { useInstagramSave } from './hooks/useInstagramSave';
import { useAITracking } from './hooks/useAITracking';
import { useImageUpload } from './hooks/useImageUpload';
import { useMediaPermissions } from './hooks/useMediaPermissions';
import useSessionTimeout from './hooks/useSessionTimeout';
import { useTheme } from './context/ThemeContext';
import { useNavigate } from 'react-router-dom';

// Utility imports
import * as validation from './utils/validation';
import * as inputSanitizer from './utils/inputSanitizer';
import * as csrfProtection from './utils/csrfProtection';
import * as authSecurityManager from './utils/authSecurityManager';
import * as deviceFingerprint from './utils/deviceFingerprint';
import * as securityLogger from './utils/securityLogger';
import * as twoFactorAuth from './utils/twoFactorAuth';
import * as rlsPolicyTester from './utils/rlsPolicyTester';
import * as apiClient from './utils/apiClient';
import * as apiErrorHandler from './utils/apiErrorHandler';
import * as callSignaling from './utils/callSignaling';
import * as fetchOrCreateUser from './utils/fetchOrCreateUser';
import * as insertUser from './utils/insertUser';
import * as createUserProfile from './utils/createUserProfile';
import * as signedUrlManager from './utils/signedUrlManager';
import * as uploadFile from './utils/uploadFile';
import WebRTCService from './utils/webrtcService';
import CallSignalingService from './utils/callSignaling';
import * as notificationService from './utils/notificationService';
import * as pushNotifications from './utils/pushNotifications';
import * as rateLimitManager from './utils/rateLimitManager';
import { feedCache } from './utils/feedCache';
import queryCache from './utils/queryCache';
import { cacheManager } from './utils/cacheManager';
import { stateDeduplicator } from './utils/stateDeduplicator';
import { subscriptionManager } from './utils/subscriptionManager';
import { draftManager } from './utils/draftManager';
import * as sessionManager from './utils/sessionManager';
import { offlineManager } from './utils/offlineManager';
import { versionManager } from './utils/versionManager';
import { NotificationManager } from './utils/NotificationManager';
import * as dataParser from './utils/data/dataParser';
import * as eventEmitter from './utils/data/eventEmitter';
import * as immutableHelpers from './utils/data/immutableHelpers';
import * as objectUtils from './utils/data/objectUtils';
import * as parseMarkdown from './utils/data/parseMarkdown';
import * as sanitizeHTML from './utils/data/sanitizeHTML';
import * as sorters from './utils/data/sorters';
import * as validators from './utils/data/validators';
import * as analytics from './utils/analytics';
import * as accessibilityHelpers from './utils/accessibilityHelpers';
import * as a11yAnnouncer from './utils/a11yAnnouncer';
import * as emojiPicker from './utils/emojiPicker';
import * as errorHandler from './utils/errorHandler';
import * as loadingStates from './utils/loadingStates';
import * as logger from './utils/logger';
import * as performanceMonitor from './utils/performanceMonitor';
import * as storage from './utils/storage';
import * as dateFormatter from './utils/dateFormatter';
import * as constants from './utils/constants';
import * as helpers from './utils/helpers';
import * as debounce from './utils/debounce';
import * as throttle from './utils/throttle';
import * as lazyLoader from './utils/lazyLoader';
import * as scrollUtils from './utils/scrollUtils';
import * as urlUtils from './utils/urlUtils';
import * as domUtils from './utils/domUtils';
import * as mediaUtils from './utils/mediaUtils';
import * as networkUtils from './utils/networkUtils';
import * as deviceUtils from './utils/deviceUtils';
import * as notificationUtils from './utils/notificationUtils';
import * as imageUtils from './utils/imageUtils';
import * as imageCompression from './utils/imageCompression';
import * as videoUtils from './utils/videoUtils';
import * as contentParser from './utils/contentParser';
import * as linkifiedText from './utils/linkifiedText';
import * as altTextGenerator from './utils/altTextGenerator';
import * as lazyLoad from './utils/lazyLoad';
import * as haptics from './utils/haptics';
import * as browserCompatibility from './utils/browserCompatibility';
import * as colorContrast from './utils/colorContrast';
import * as accessibility from './utils/accessibility';
import * as i18n from './utils/i18n';
import * as errorTracking from './utils/errorTracking';
import * as errorLogger from './utils/errorLogger';
import * as compressImage from './utils/media/compressImage';
import * as resizeImage from './utils/media/resizeImage';
import * as generateThumbnail from './utils/media/generateThumbnail';
import * as extractVideoFrame from './utils/media/extractVideoFrame';
import * as getVideoDuration from './utils/media/getVideoDuration';
import * as getAudioDuration from './utils/media/getAudioDuration';
import * as validateImageDimensions from './utils/media/validateImageDimensions';
import * as validateVideoFormat from './utils/media/validateVideoFormat';
import * as generateBlurHash from './utils/media/generateBlurHash';
import * as detectFaces from './utils/media/detectFaces';
import * as validateUsername from './utils/validation/validateUsername';
import * as validateBio from './utils/validation/validateBio';
import * as validateURL from './utils/validation/validateURL';
import * as validatePhoneNumber from './utils/validation/validatePhoneNumber';
import * as validateCreditCard from './utils/validation/validateCreditCard';
import * as validateAge from './utils/validation/validateAge';
import * as profanityFilter from './utils/validation/profanityFilter';
import * as spamDetector from './utils/validation/spamDetector';
import * as hashPassword from './utils/security/hashPassword';
import * as generateToken from './utils/security/generateToken';
import * as encryptData from './utils/security/encryptData';
import * as decryptData from './utils/security/decryptData';
import * as sanitizeHTMLSecurity from './utils/security/sanitizeHTML';
import * as preventXSS from './utils/security/preventXSS';
import * as rateLimiterUtil from './utils/security/rateLimiter';
import * as formatDate from './utils/formatters/formatDate';
import { formatNumber } from './utils/formatters/formatNumber';
import { formatBytes } from './utils/formatters/formatBytes';
import { formatDuration } from './utils/formatters/formatDuration';
import { formatUsername } from './utils/formatters/formatUsername';
import { formatHashtag } from './utils/formatters/formatHashtag';
import { formatTimeAgo } from './utils/formatDate';

// Additional Validation & Security
import reportWebVitals from './utils/reportWebVitals';
import autoErrorFixer from './utils/autoErrorFixer';

// Features & Services
import searchService from './utils/searchService';
import trendingService from './utils/trendingService';
import realtimeManager from './utils/realtimeManager';
import serviceWorkerManager from './utils/serviceWorkerManager';
import scheduledPostsPublisher from './utils/scheduledPostsPublisher';
import * as notificationPreferences from './utils/notificationPreferences';
import * as callNotifications from './utils/callNotifications';
import * as rateLimiter from './utils/rateLimiter';

// Auth & Other
import * as authListener from './utils/authListener';
import * as logout from './utils/logout';
import * as autoTester from './utils/autoTester';

// Data Utilities (continued)
import * as sanitizeInput from './utils/data/sanitizeInput';
import * as linkify from './utils/data/linkify';
import * as extractMentions from './utils/data/extractMentions';
import * as extractHashtags from './utils/data/extractHashtags';
import * as extractEmails from './utils/data/extractEmails';
import * as extractPhoneNumbers from './utils/data/extractPhoneNumbers';
import * as slugify from './utils/data/slugify';
import * as truncateText from './utils/data/truncateText';
import * as highlightText from './utils/data/highlightText';

// Additional Security
import { detectBot } from './utils/security/detectBot';

// Analytics Utilities
import { trackEvent } from './utils/analytics/trackEvent';
import { trackPageView } from './utils/analytics/trackPageView';
import { logError } from './utils/analytics/logError';
import { logPerformance } from './utils/analytics/logPerformance';
import { setUserId } from './utils/analytics/setUserId';
import { setUserProperties } from './utils/analytics/setUserProperties';
import { startSession } from './utils/analytics/startSession';
import { endSession } from './utils/analytics/endSession';

// Performance Utilities
import { measureLoadTime } from './utils/performance/measureLoadTime';
import { measureRenderTime } from './utils/performance/measureRenderTime';
import { getFps } from './utils/performance/getFps';
import { getMemoryUsage } from './utils/performance/getMemoryUsage';
import { throttleFunction } from './utils/performance/throttleFunction';
import { debounceFunction } from './utils/performance/debounceFunction';
import { monitorNetwork } from './utils/performance/monitorNetwork';
import { optimizeImages } from './utils/performance/optimizeImages';

// Utility stubs for Boltz page
const setupAutoPlay = () => {}; // Placeholder for autoplay setup
const trackVideoView = (videoId) => {
  // Stub implementation
  console.log('[Analytics] Video view:', videoId);
}; // Stub for video view tracking

export const components = {
  // Foundation
  Header,
  BottomNav,
  Navbar,
  ErrorBoundary,
  RealtimeErrorBoundary,
  ScreenReaderAnnouncer,
  
  // Posts & Feed
  PostCard,
  InteractionBar,
  CommentSection,
  Stories,
  CarouselViewer,
  DoubleTapLike,
  
  // Media
  MediaViewer,
  MediaEditor,
  AdvancedMediaEditor,
  MediaPreview,
  MediaSelector,
  LazyImage,
  AudioPlayer,
  VoiceRecorder,
  ReelPlayer,
  MusicPlayer,
  
  // User Interactions
  FollowButton,
  VerifiedBadge,
  UserSearchResult,
  AvatarUpload,
  UserOptionsMenu,
  
  // Search & Discovery
  SearchBar,
  SearchResultCard,
  ExploreGrid,
  ExploreTabs,
  ExploreTile,
  TrendingHashtags,
  TrendingSection,
  TrendingCard,
  InfiniteScrollLoader,
  SkeletonLoader,
  
  // Modals
  CommentsModal,
  InstagramCommentsModal,
  ShareModal,
  ChangePasswordModal,
  DeleteAccountModal,
  SessionExpiredModal,
  CreateGroupModal,
  CreateHighlightModal,
  SaveCollectionsModal,
  ReportModal,
  TwoFactorModal,
  TwoFactorSetup,
  DataExportModal,
  ViewersModal,
  
  // Communication
  GroupChat,
  GroupChatList,
  GroupSettings,
  CloseFriendsManager,
  TypingIndicator,
  ReactionPicker,
  LinkifiedText,
  ParsedContent,
  
  // Calls
  CallButton,
  CallControls,
  CallIcon,
  ActiveCallModal,
  IncomingCallModal,
  IncomingCallListener,
  WebRTCTest,
  
  // Notifications & Status
  NotificationToast,
  OfflineIndicator,
  SkeletonScreen,
  UpdateNotification,
  RateLimitError,
  ActivityStatus,
  
  // Auth & Security
  EmailVerification,
  TwoFactorAuth,
  CSRFProtectionProvider,
  SessionManagement,
  AccessibilitySettings,
  
  // Specialty
  Dashboard,
  OnboardingFlow,
  AddStoryModal,
  KeyboardShortcutsHelp,
  PushNotificationPrompt,
  EditPostModal,
  ScheduledPosts,
  SchedulePicker,
  PeoplePicker,
  MentionInput,
  HashtagInput,
  LocationPicker,
  ImageCropper,
  FilterSelector,
  ProgressBar,
  ContentOptionsMenu,
  StateHandler,
  OrientationHandler
};

// ============================================================================
// HOOKS
// ============================================================================

export const hooks = {
  useRealtimeInteractions,
  useMessages,
  useNotifications,
  useDebounce,
  useInfiniteScroll,
  useCall,
  useWebRTCCall,
  usePeerConnection,
  useKeyboardNavigation,
  useLazyLoad,
  useLoadingState,
  useOptimisticAction,
  useOrientation,
  useRateLimit,
  useRealtimeConnection,
  useScrollRestoration,
  useSignedUrl,
  useStateSync,
  useCSRFProtection,
  useInstagramInteractions,
  useInstagramLikeInteractions,
  useInstagramSave,
  useAITracking,
  useImageUpload,
  useMediaPermissions,
  useSessionTimeout,
  useTheme,
  useNavigate
};

// ============================================================================
// UTILITIES
// ============================================================================


export const utils = {
  // Validation & Security
  validation,
  inputSanitizer,
  csrfProtection,
  authSecurityManager,
  deviceFingerprint,
  securityLogger,
  twoFactorAuth,
  rlsPolicyTester,
  
  // API & HTTP
  apiClient,
  apiErrorHandler,
  callSignaling,
  fetchOrCreateUser,
  insertUser,
  createUserProfile,
  signedUrlManager,
  uploadFile,
  WebRTCService,
  CallSignalingService,
  notificationService,
  pushNotifications,
  rateLimitManager,
  
  // Data & State
  feedCache,
  queryCache,
  cacheManager,
  stateDeduplicator,
  subscriptionManager,
  sessionManager,
  offlineManager,
  draftManager,
  versionManager,
  NotificationManager,
  
  // Utilities & Helpers
  dateFormatter,
  imageUtils,
  imageCompression,
  videoUtils,
  contentParser,
  linkifiedText,
  altTextGenerator,
  lazyLoad,
  haptics,
  browserCompatibility,
  colorContrast,
  accessibility,
  i18n,
  logger,
  errorHandler,
  
  // Analytics & Tracking
  analytics,
  errorTracking,
  errorLogger,
  reportWebVitals,
  
  // Features & Services
  searchService,
  trendingService,
  realtimeManager,
  serviceWorkerManager,
  scheduledPostsPublisher,
  notificationPreferences,
  callNotifications,
  rateLimiter,
  
  // Auth & Other
  authListener,
  logout,
  autoTester,
  // Data
  sanitizeInput,
  parseMarkdown,
  linkify,
  extractMentions,
  extractHashtags,
  extractEmails,
  extractPhoneNumbers,
  slugify,
  truncateText,
  highlightText,
  // Media
  compressImage,
  resizeImage,
  generateThumbnail,
  extractVideoFrame,
  getVideoDuration,
  getAudioDuration,
  validateImageDimensions,
  validateVideoFormat,
  generateBlurHash,
  detectFaces,
  // Validation
  validateUsername,
  validateBio,
  validateURL,
  validatePhoneNumber,
  validateCreditCard,
  validateAge,
  profanityFilter,
  spamDetector,
  // Security
  hashPassword,
  generateToken,
  encryptData,
  decryptData,
  sanitizeHTML,
  sanitizeHTMLSecurity,
  preventXSS,
  rateLimiterUtil,
  detectBot,
  // Analytics
  trackEvent,
  trackPageView,
  trackVideoView,
  logError,
  logPerformance,
  setUserId,
  setUserProperties,
  startSession,
  endSession,
  // Performance
  setupAutoPlay,
  measureLoadTime,
  measureRenderTime,
  getFps,
  getMemoryUsage,
  throttleFunction,
  debounceFunction,
  monitorNetwork,
  optimizeImages,
  // Formatters
  formatDate,
  formatNumber,
  formatBytes,
  formatDuration,
  formatUsername,
  formatHashtag,
  formatTimeAgo
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  components,
  hooks,
  utils
};
