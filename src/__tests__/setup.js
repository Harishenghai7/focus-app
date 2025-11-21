/**
 * FOCUS SOCIAL MEDIA APP - TEST SETUP CONFIGURATION
 * 
 * Comprehensive testing environment setup for React components,
 * hooks, utilities, and integration tests
 * 
 * Created: November 15, 2025
 * Status: Production-Ready Testing Suite
 */

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { server } from './mocks/server';

// Configure testing library
configure({ testIdAttribute: 'data-testid' });

// Setup MSW (Mock Service Worker) for API mocking
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'error'
  });
});

afterEach(() => {
  server.resetHandlers();
  // Clear all mocks after each test
  jest.clearAllMocks();
  // Clean up localStorage
  localStorage.clear();
  // Clean up sessionStorage
  sessionStorage.clear();
});

afterAll(() => {
  server.close();
});

// Global test utilities
global.matchMedia = global.matchMedia || function (query) {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };
};

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  thresholds: [0],
  root: null,
  rootMargin: '',
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock Navigator APIs
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(() => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve(''))
  }
});

Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: jest.fn((success) => success({
      coords: {
        latitude: 40.7128,
        longitude: -74.0060
      }
    })),
    watchPosition: jest.fn()
  }
});

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock Supabase client
jest.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      }))
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      then: jest.fn(() => Promise.resolve({ data: [], error: null }))
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: { path: 'test-path' }, error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'test-url' } })),
        remove: jest.fn(() => Promise.resolve({ error: null }))
      }))
    },
    realtime: {
      channel: jest.fn(() => ({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn()
      }))
    }
  }
}));

// Mock React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    pathname: '/test',
    search: '',
    hash: '',
    state: null
  }),
  useParams: () => ({})
}));

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    img: ({ children, ...props }) => <img {...props}>{children}</img>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    h3: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    ul: ({ children, ...props }) => <ul {...props}>{children}</ul>,
    li: ({ children, ...props }) => <li {...props}>{children}</li>
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn()
  }),
  useInView: () => true,
  useScroll: () => ({
    scrollY: { get: () => 0 },
    scrollYProgress: { get: () => 0 }
  })
}));

// Test data helpers
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser',
  full_name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg',
  bio: 'Test bio',
  website: 'https://example.com',
  followers_count: 100,
  following_count: 50,
  posts_count: 25,
  created_at: '2024-01-01T00:00:00Z'
};

export const mockPost = {
  id: 'test-post-id',
  user_id: 'test-user-id',
  content: 'Test post content',
  media_urls: ['https://example.com/image.jpg'],
  likes_count: 10,
  comments_count: 5,
  shares_count: 2,
  created_at: '2024-01-01T00:00:00Z',
  user: mockUser
};

export const mockComment = {
  id: 'test-comment-id',
  post_id: 'test-post-id',
  user_id: 'test-user-id',
  content: 'Test comment',
  likes_count: 3,
  replies_count: 1,
  created_at: '2024-01-01T00:00:00Z',
  user: mockUser
};

// Custom render function with providers
export const renderWithProviders = (ui, options = {}) => {
  const { initialEntries = ['/'], ...renderOptions } = options;
  
  const AllProviders = ({ children }) => {
    return (
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  return render(ui, { wrapper: AllProviders, ...renderOptions });
};

// Utility functions for testing
export const waitForLoadingToFinish = () => 
  waitFor(() => {
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });

export const fillForm = async (fields) => {
  for (const [name, value] of Object.entries(fields)) {
    const field = screen.getByLabelText(new RegExp(name, 'i'));
    await user.type(field, value);
  }
};

export const expectToBeInDocument = (text) => {
  expect(screen.getByText(text)).toBeInTheDocument();
};

console.log('🧪 Focus App Test Suite - Setup Complete');
