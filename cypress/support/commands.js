// Custom Cypress commands for Focus App testing

Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/auth');
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('not.include', '/auth');
  });
});

Cypress.Commands.add('createPost', (caption, mediaPath = null) => {
  cy.visit('/create');
  cy.get('[data-testid="content-type-post"]').click();

  if (mediaPath) {
    cy.get('[data-testid="media-selector"]').selectFile(mediaPath);
  }

  if (caption) {
    cy.get('[data-testid="caption-input"]').type(caption);
  }

  cy.get('[data-testid="submit-post"]').click();
  cy.contains('Post created successfully').should('be.visible');
});

Cypress.Commands.add('createBoltz', (description, videoPath) => {
  cy.visit('/create');
  cy.get('[data-testid="content-type-boltz"]').click();

  cy.get('[data-testid="video-input"]').selectFile(videoPath);
  cy.get('[data-testid="description-input"]').type(description);

  cy.get('[data-testid="submit-boltz"]').click();
  cy.contains('Boltz created successfully').should('be.visible');
});

Cypress.Commands.add('followUser', (username) => {
  cy.visit(`/profile/${username}`);
  cy.get('[data-testid="follow-button"]').click();
  cy.get('[data-testid="follow-button"]').should('contain', 'Following');
});

Cypress.Commands.add('likePost', (postId = null) => {
  if (postId) {
    cy.visit(`/post/${postId}`);
    cy.get('[data-testid="like-button"]').click();
  } else {
    cy.get('[data-testid="post-item"]').first().within(() => {
      cy.get('[data-testid="like-button"]').click();
    });
  }
});

Cypress.Commands.add('commentOnPost', (comment, postId = null) => {
  if (postId) {
    cy.visit(`/post/${postId}`);
  }

  cy.get('[data-testid="post-item"]').first().within(() => {
    cy.get('[data-testid="comment-button"]').click();
    cy.get('[data-testid="comment-input"]').type(comment);
    cy.get('[data-testid="submit-comment"]').click();
  });
});

// Generate test data
Cypress.Commands.add('generateTestData', (options = {}) => {
  const defaultOptions = {
    posts: 5,
    users: 10,
    follows: 20,
    messages: 15,
    ...options
  };

  cy.task('generateTestData', defaultOptions);
});

// Mock API responses
Cypress.Commands.add('mockApiResponse', (endpoint, response, status = 200) => {
  cy.intercept(endpoint, { statusCode: status, body: response }).as('mockedApi');
});

// Wait for API calls to complete
Cypress.Commands.add('waitForApi', (alias) => {
  cy.wait(`@${alias}`);
});

// Check for accessibility violations
Cypress.Commands.add('checkAccessibility', () => {
  cy.injectAxe();
  cy.checkA11y();
});

// Performance testing
Cypress.Commands.add('measurePerformance', (action) => {
  const startTime = performance.now();
  action();
  const endTime = performance.now();
  return endTime - startTime;
});

// Visual regression testing
Cypress.Commands.add('takeSnapshot', (name) => {
  cy.screenshot(name);
});

// Database seeding
Cypress.Commands.add('seedDatabase', (data) => {
  cy.task('seedDatabase', data);
});

// Clean up test data
Cypress.Commands.add('cleanupTestData', () => {
  cy.task('cleanupTestData');
});

// Supabase test commands
Cypress.Commands.add('setupSupabase', () => {
  cy.window().then((win) => {
    // Mock Supabase client if not available
    if (!win.supabase) {
      win.supabase = {
        auth: {
          getSession: () => Promise.resolve({ data: { session: null } }),
          signInWithPassword: () => Promise.resolve({ data: { user: null }, error: null }),
          signUp: () => Promise.resolve({ data: { user: null }, error: null }),
          signOut: () => Promise.resolve({ error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
        },
        from: () => ({
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
          insert: () => Promise.resolve({ data: null, error: null }),
          update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
          delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) })
        })
      };
    }
  });
});

Cypress.Commands.add('mockAuth', (user = null) => {
  cy.window().then((win) => {
    if (win.supabase) {
      win.supabase.auth.getSession = () => Promise.resolve({ 
        data: { session: user ? { user } : null } 
      });
    }
  });
});
