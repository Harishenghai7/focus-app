describe('Multi-User Messaging & Calls', () => {
  const userA = { username: 'msg_user_a', email: 'msg_a@focus.com', password: 'password123' }
  const userB = { username: 'msg_user_b', email: 'msg_b@focus.com', password: 'password123' }

  before(() => {
    cy.task('setupTestUsers', [userA, userB])
  })

  after(() => {
    cy.task('cleanupTestUsers', [userA, userB])
  })

  it('should handle real-time messaging between users', () => {
    // Setup sessions
    cy.setupMultiUserSession(userA, userB)

    // User A starts conversation
    cy.switchUserSession(userA.username)
    cy.visit('/messages')
    cy.get('[data-testid="new-message"]').click()
    cy.get('[data-testid="recipient-input"]').type(userB.username)
    cy.get('[data-testid="message-input"]').type('Hello from User A!')
    cy.get('[data-testid="send-message"]').click()
    cy.get('[data-testid="chat-messages"]').should('contain', 'Hello from User A!')

    // User B receives message instantly
    cy.switchUserSession(userB.username)
    cy.get('[data-testid="messages-badge"]').should('be.visible')
    cy.visit('/messages')
    cy.get('[data-testid="chat-messages"]').should('contain', 'Hello from User A!')

    // User B replies
    cy.get('[data-testid="message-input"]').type('Hello back from User B!')
    cy.get('[data-testid="send-message"]').click()

    // User A sees reply instantly
    cy.switchUserSession(userA.username)
    cy.get('[data-testid="chat-messages"]').should('contain', 'Hello back from User B!')
  })

  it('should show typing indicators in real-time', () => {
    cy.setupMultiUserSession(userA, userB)

    // User B starts typing
    cy.switchUserSession(userB.username)
    cy.visit('/messages')
    cy.get('[data-testid="message-input"]').type('Typing a message...')

    // User A sees typing indicator
    cy.switchUserSession(userA.username)
    cy.visit('/messages')
    cy.get('[data-testid="typing-indicator"]').should('contain', userB.username)

    // User B stops typing
    cy.switchUserSession(userB.username)
    cy.get('[data-testid="message-input"]').clear()

    // Typing indicator disappears for User A
    cy.switchUserSession(userA.username)
    cy.get('[data-testid="typing-indicator"]').should('not.exist')
  })

  it('should handle message read receipts', () => {
    cy.setupMultiUserSession(userA, userB)

    // User A sends message
    cy.switchUserSession(userA.username)
    cy.visit('/messages')
    cy.get('[data-testid="message-input"]').type('Message with read receipt')
    cy.get('[data-testid="send-message"]').click()

    // User B receives and reads
    cy.switchUserSession(userB.username)
    cy.visit('/messages')
    cy.get('[data-testid="chat-messages"]').should('contain', 'Message with read receipt')
    // Simulate reading by focusing on the message
    cy.get('[data-testid="chat-messages"]').click()

    // User A sees read receipt
    cy.switchUserSession(userA.username)
    cy.get('[data-testid="read-receipt"]').should('be.visible')
  })

  it('should handle message edits and deletions', () => {
    cy.setupMultiUserSession(userA, userB)

    // User A sends message
    cy.switchUserSession(userA.username)
    cy.visit('/messages')
    cy.get('[data-testid="message-input"]').type('Original message')
    cy.get('[data-testid="send-message"]').click()

    // User B sees original message
    cy.switchUserSession(userB.username)
    cy.get('[data-testid="chat-messages"]').should('contain', 'Original message')

    // User A edits message
    cy.switchUserSession(userA.username)
    cy.get('[data-testid="message-options"]').first().click()
    cy.get('[data-testid="edit-message"]').click()
    cy.get('[data-testid="edit-input"]').clear().type('Edited message')
    cy.get('[data-testid="save-edit"]').click()

    // User B sees edited message instantly
    cy.switchUserSession(userB.username)
    cy.get('[data-testid="chat-messages"]').should('contain', 'Edited message')
    cy.get('[data-testid="chat-messages"]').should('not.contain', 'Original message')

    // User A deletes message
    cy.switchUserSession(userA.username)
    cy.get('[data-testid="message-options"]').first().click()
    cy.get('[data-testid="delete-message"]').click()
    cy.get('[data-testid="confirm-delete"]').click()

    // User B sees message deleted
    cy.switchUserSession(userB.username)
    cy.get('[data-testid="chat-messages"]').should('contain', 'message deleted')
  })

  it('should handle blocked user messaging restrictions', () => {
    cy.setupMultiUserSession(userA, userB)

    // User A blocks User B
    cy.switchUserSession(userA.username)
    cy.visit('/profile/' + userB.username)
    cy.get('[data-testid="three-dot-menu"]').click()
    cy.get('[data-testid="block-user"]').click()
    cy.get('[data-testid="confirm-block"]').click()

    // User B cannot send messages to User A
    cy.switchUserSession(userB.username)
    cy.visit('/messages')
    cy.get('[data-testid="new-message"]').click()
    cy.get('[data-testid="recipient-input"]').type(userA.username)
    cy.get('[data-testid="message-input"]').type('Blocked message')
    cy.get('[data-testid="send-message"]').should('be.disabled')

    // Previous conversation is hidden
    cy.get('[data-testid="chat-list"]').should('not.contain', userA.username)
  })

  it('should handle audio/video calls in real-time', () => {
    cy.setupMultiUserSession(userA, userB)

    // User A initiates call
    cy.switchUserSession(userA.username)
    cy.visit('/messages')
    cy.get(`[data-testid="call-${userB.username}"]`).click()
    cy.get('[data-testid="call-type"]').contains('Video').click() // Video call
    cy.get('[data-testid="outgoing-call"]').should('be.visible')

    // User B receives call notification
    cy.switchUserSession(userB.username)
    cy.get('[data-testid="incoming-call"]').should('be.visible')
    cy.get('[data-testid="caller-name"]').should('contain', userA.username)

    // User B answers call
    cy.get('[data-testid="answer-call"]').click()
    cy.get('[data-testid="active-call"]').should('be.visible')

    // Both users are in call
    cy.switchUserSession(userA.username)
    cy.get('[data-testid="active-call"]').should('be.visible')

    // User A ends call
    cy.get('[data-testid="end-call"]').click()
    cy.get('[data-testid="call-ended"]').should('be.visible')

    // User B sees call ended
    cy.switchUserSession(userB.username)
    cy.get('[data-testid="call-ended"]').should('be.visible')

    // Call appears in history for both
    cy.switchUserSession(userA.username)
    cy.get('[data-testid="call-history"]').should('contain', userB.username)
    cy.get('[data-testid="call-duration"]').should('be.visible')

    cy.switchUserSession(userB.username)
    cy.get('[data-testid="call-history"]').should('contain', userA.username)
  })

  it('should handle missed calls and notifications', () => {
    cy.setupMultiUserSession(userA, userB)

    // User A calls User B
    cy.switchUserSession(userA.username)
    cy.visit('/messages')
    cy.get(`[data-testid="call-${userB.username}"]`).click()

    // User B doesn't answer (simulate by not clicking answer)
    cy.switchUserSession(userB.username)
    cy.get('[data-testid="incoming-call"]').should('be.visible')
    // Wait for call timeout (don't answer)

    // Call ends as missed
    cy.switchUserSession(userA.username)
    cy.get('[data-testid="call-ended"]').should('contain', 'missed')

    // User B sees missed call notification
    cy.switchUserSession(userB.username)
    cy.get('[data-testid="missed-call-notification"]').should('be.visible')
    cy.get('[data-testid="call-history"]').should('contain', 'missed')
  })

  it('should handle group messaging', () => {
    const userC = { username: 'msg_user_c', email: 'msg_c@focus.com', password: 'password123' }
    cy.task('setupTestUsers', [userC])

    cy.setupMultiUserSession(userA, userB)
    cy.task('switchToUser', userC.username)

    // User A creates group chat
    cy.switchUserSession(userA.username)
    cy.visit('/messages')
    cy.get('[data-testid="new-group"]').click()
    cy.get('[data-testid="group-name"]').type('Test Group')
    cy.get('[data-testid="add-member"]').type(userB.username)
    cy.get('[data-testid="add-member"]').type(userC.username)
    cy.get('[data-testid="create-group"]').click()

    // User A sends group message
    cy.get('[data-testid="message-input"]').type('Group message from User A')
    cy.get('[data-testid="send-message"]').click()

    // User B sees group message
    cy.switchUserSession(userB.username)
    cy.visit('/messages')
    cy.get('[data-testid="group-chat-Test Group"]').should('be.visible')
    cy.get('[data-testid="chat-messages"]').should('contain', 'Group message from User A')

    // User C sees group message
    cy.task('switchToUser', userC.username)
    cy.visit('/messages')
    cy.get('[data-testid="group-chat-Test Group"]').should('be.visible')
    cy.get('[data-testid="chat-messages"]').should('contain', 'Group message from User A')

    // User C replies in group
    cy.get('[data-testid="message-input"]').type('Reply from User C')
    cy.get('[data-testid="send-message"]').click()

    // Both User A and User B see reply
    cy.switchUserSession(userA.username)
    cy.get('[data-testid="chat-messages"]').should('contain', 'Reply from User C')

    cy.switchUserSession(userB.username)
    cy.get('[data-testid="chat-messages"]').should('contain', 'Reply from User C')

    cy.task('cleanupTestUsers', [userC])
  })

  it('should handle message reactions and replies', () => {
    cy.setupMultiUserSession(userA, userB)

    // User A sends message
    cy.switchUserSession(userA.username)
    cy.visit('/messages')
    cy.get('[data-testid="message-input"]').type('Message for reactions')
    cy.get('[data-testid="send-message"]').click()

    // User B reacts to message
    cy.switchUserSession(userB.username)
    cy.get('[data-testid="message-bubble"]').last().trigger('contextmenu')
    cy.get('[data-testid="react-emoji"]').first().click() // React with first emoji

    // User A sees reaction instantly
    cy.switchUserSession(userA.username)
    cy.get('[data-testid="message-reactions"]').should('be.visible')

    // User B replies to message
    cy.switchUserSession(userB.username)
    cy.get('[data-testid="message-bubble"]').last().trigger('contextmenu')
    cy.get('[data-testid="reply-message"]').click()
    cy.get('[data-testid="reply-input"]').type('This is a reply')
    cy.get('[data-testid="send-reply"]').click()

    // User A sees reply as threaded message
    cy.switchUserSession(userA.username)
    cy.get('[data-testid="thread-indicator"]').should('be.visible')
    cy.get('[data-testid="thread-messages"]').should('contain', 'This is a reply')
  })

  it('should handle message search and history', () => {
    cy.setupMultiUserSession(userA, userB)

    // Send multiple messages
    cy.switchUserSession(userA.username)
    cy.visit('/messages')
    const messages = ['First message', 'Second message', 'Third message with keyword']
    messages.forEach(msg => {
      cy.get('[data-testid="message-input"]').type(msg)
      cy.get('[data-testid="send-message"]').click()
    })

    // User B searches messages
    cy.switchUserSession(userB.username)
    cy.visit('/messages')
    cy.get('[data-testid="search-messages"]').type('keyword')
    cy.get('[data-testid="search-results"]').should('contain', 'Third message with keyword')
    cy.get('[data-testid="search-results"]').should('not.contain', 'First message')
  })

  it('should handle offline message queuing', () => {
    cy.setupMultiUserSession(userA, userB)

    // Go offline
    cy.window().then((win) => {
      win.dispatchEvent(new Event('offline'))
    })

    // User A tries to send message while offline
    cy.switchUserSession(userA.username)
    cy.get('[data-testid="message-input"]').type('Offline message')
    cy.get('[data-testid="send-message"]').click()
    cy.get('[data-testid="queued-message"]').should('be.visible')

    // Go online
    cy.window().then((win) => {
      win.dispatchEvent(new Event('online'))
    })

    // Message should send automatically
    cy.get('[data-testid="sending-indicator"]').should('be.visible')
    cy.get('[data-testid="message-sent"]').should('be.visible')

    // User B receives message
    cy.switchUserSession(userB.username)
    cy.get('[data-testid="chat-messages"]').should('contain', 'Offline message')
  })

  it('should handle message encryption and security', () => {
    cy.setupMultiUserSession(userA, userB)

    // User A enables end-to-end encryption
    cy.switchUserSession(userA.username)
    cy.visit('/messages')
    cy.get('[data-testid="chat-settings"]').click()
    cy.get('[data-testid="enable-encryption"]').check()
    cy.get('[data-testid="save-settings"]').click()

    // Messages should be marked as encrypted
    cy.get('[data-testid="message-input"]').type('Encrypted message')
    cy.get('[data-testid="send-message"]').click()
    cy.get('[data-testid="encrypted-indicator"]').should('be.visible')

    // User B sees encrypted message
    cy.switchUserSession(userB.username)
    cy.get('[data-testid="chat-messages"]').should('contain', 'Encrypted message')
    cy.get('[data-testid="encrypted-indicator"]').should('be.visible')
  })
})
