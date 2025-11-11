// Multi-User Testing Utilities
// This file provides utilities for managing multiple user sessions,
// cross-session synchronization, and real-time event validation

class MultiUserManager {
  constructor() {
    this.sessions = new Map()
    this.activeSession = null
    this.eventListeners = new Map()
  }

  // Session Management
  async setupSession(username, userData) {
    const sessionId = `session_${username}_${Date.now()}`
    const session = {
      id: sessionId,
      username,
      userData,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: false
    }

    this.sessions.set(username, session)
    return session
  }

  async switchToSession(username) {
    // Deactivate current session
    if (this.activeSession) {
      this.activeSession.isActive = false
    }

    // Activate new session
    const session = this.sessions.get(username)
    if (!session) {
      throw new Error(`Session not found for user: ${username}`)
    }

    session.isActive = true
    session.lastActivity = new Date()
    this.activeSession = session

    // Switch browser context if needed
    await this._switchBrowserContext(session)

    return session
  }

  async cleanupSession(username) {
    const session = this.sessions.get(username)
    if (session) {
      session.isActive = false
      this.sessions.delete(username)

      if (this.activeSession === session) {
        this.activeSession = null
      }
    }
  }

  async _switchBrowserContext(session) {
    // Implementation depends on Cypress browser management
    // This would typically involve switching between browser tabs/windows
    // or using Cypress's session management features
    cy.window().then((win) => {
      // Store session data in window for access
      win.__currentSession = session
    })
  }

  // Real-Time Event Management
  onRealtimeEvent(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, [])
    }
    this.eventListeners.get(eventType).push(callback)
  }

  offRealtimeEvent(eventType, callback) {
    const listeners = this.eventListeners.get(eventType)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  async emitRealtimeEvent(eventType, data) {
    const listeners = this.eventListeners.get(eventType) || []
    listeners.forEach(callback => callback(data))

    // Also emit to all sessions
    for (const session of this.sessions.values()) {
      await this._sendEventToSession(session, eventType, data)
    }
  }

  async _sendEventToSession(session, eventType, data) {
    // Implementation for sending events to specific sessions
    // This could involve WebSocket messages, Supabase broadcasts, etc.
    cy.task('sendRealtimeEvent', {
      sessionId: session.id,
      eventType,
      data
    })
  }

  // Synchronization Validation
  async waitForSync(targetUsername, expectedState, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      const checkSync = async () => {
        try {
          const isSynced = await this._checkSyncState(targetUsername, expectedState)
          if (isSynced) {
            resolve()
          } else if (Date.now() - startTime > timeout) {
            reject(new Error(`Sync timeout for user ${targetUsername}`))
          } else {
            setTimeout(checkSync, 100)
          }
        } catch (error) {
          reject(error)
        }
      }
      checkSync()
    })
  }

  async _checkSyncState(username, expectedState) {
    const session = this.sessions.get(username)
    if (!session) return false

    // Check if the session's UI state matches expected state
    return cy.window().then((win) => {
      // This would check specific DOM elements or application state
      // Implementation depends on your app's state management
      return win.__appState && win.__appState[username] === expectedState
    })
  }

  // Cross-Session Interaction
  async performActionInSession(username, action) {
    const currentSession = this.activeSession
    await this.switchToSession(username)

    try {
      await action()
    } finally {
      if (currentSession) {
        await this.switchToSession(currentSession.username)
      }
    }
  }

  async broadcastAction(action, targetUsers = null) {
    const users = targetUsers || Array.from(this.sessions.keys())

    for (const username of users) {
      await this.performActionInSession(username, action)
    }
  }

  // Data Sharing Between Sessions
  async shareDataBetweenSessions(fromUsername, toUsername, dataKey) {
    const fromSession = this.sessions.get(fromUsername)
    const toSession = this.sessions.get(toUsername)

    if (!fromSession || !toSession) {
      throw new Error('Session not found')
    }

    // Get data from source session
    const data = await this._getSessionData(fromSession, dataKey)

    // Set data in target session
    await this._setSessionData(toSession, dataKey, data)

    return data
  }

  async _getSessionData(session, dataKey) {
    return cy.window().then((win) => {
      return win.__sessionData && win.__sessionData[session.username] &&
             win.__sessionData[session.username][dataKey]
    })
  }

  async _setSessionData(session, dataKey, data) {
    cy.window().then((win) => {
      if (!win.__sessionData) win.__sessionData = {}
      if (!win.__sessionData[session.username]) win.__sessionData[session.username] = {}
      win.__sessionData[session.username][dataKey] = data
    })
  }
}

// Global instance
const multiUserManager = new MultiUserManager()

// Utility Functions
export const setupMultiUserTest = async (users) => {
  for (const user of users) {
    await multiUserManager.setupSession(user.username, user)
  }
}

export const switchToUser = async (username) => {
  await multiUserManager.switchToSession(username)
}

export const cleanupMultiUserTest = async (users) => {
  for (const user of users) {
    await multiUserManager.cleanupSession(user.username)
  }
}

export const waitForCrossSessionSync = async (users, expectedState, timeout = 5000) => {
  const promises = users.map(username =>
    multiUserManager.waitForSync(username, expectedState, timeout)
  )
  await Promise.all(promises)
}

export const simulateRealtimeInteraction = async (fromUser, toUser, action) => {
  await multiUserManager.performActionInSession(fromUser, async () => {
    await action()
    await multiUserManager.emitRealtimeEvent('user_action', {
      from: fromUser,
      to: toUser,
      action: action.name
    })
  })
}

export const validateRealtimeUpdate = async (username, selector, expectedContent, timeout = 2000) => {
  await multiUserManager.switchToSession(username)
  cy.get(selector, { timeout }).should('contain', expectedContent)
}

export const broadcastToAllUsers = async (action) => {
  await multiUserManager.broadcastAction(action)
}

export const shareDataAcrossSessions = async (fromUser, toUsers, dataKey) => {
  for (const toUser of toUsers) {
    await multiUserManager.shareDataBetweenSessions(fromUser, toUser, dataKey)
  }
}

// Real-Time Event Helpers
export const onRealtimeEvent = (eventType, callback) => {
  multiUserManager.onRealtimeEvent(eventType, callback)
}

export const emitRealtimeEvent = async (eventType, data) => {
  await multiUserManager.emitRealtimeEvent(eventType, data)
}

// Session State Helpers
export const getCurrentSession = () => {
  return multiUserManager.activeSession
}

export const getAllSessions = () => {
  return Array.from(multiUserManager.sessions.values())
}

export const isSessionActive = (username) => {
  const session = multiUserManager.sessions.get(username)
  return session && session.isActive
}

// Synchronization Helpers
export const waitForAllSessionsSync = async (expectedState, timeout = 5000) => {
  const sessions = getAllSessions()
  await waitForCrossSessionSync(sessions.map(s => s.username), expectedState, timeout)
}

export const validateCrossSessionState = async (users, stateSelector, expectedValue) => {
  for (const username of users) {
    await multiUserManager.switchToSession(username)
    cy.get(stateSelector).should('have.text', expectedValue)
  }
}

// Performance Monitoring
export const monitorSessionPerformance = async (username) => {
  const session = multiUserManager.sessions.get(username)
  if (!session) return null

  return cy.window().then((win) => {
    const performance = win.performance
    const memory = performance.memory

    return {
      sessionId: session.id,
      loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
      memoryUsage: memory ? memory.usedJSHeapSize / 1024 / 1024 : 0,
      lastActivity: session.lastActivity
    }
  })
}

// Error Handling
export const handleSessionError = async (username, error) => {
  cy.task('log', `Session error for ${username}: ${error.message}`)

  const session = multiUserManager.sessions.get(username)
  if (session) {
    session.errorCount = (session.errorCount || 0) + 1
    session.lastError = error
  }

  // Optionally cleanup session on critical errors
  if (error.message.includes('critical')) {
    await multiUserManager.cleanupSession(username)
  }
}

// Export the manager instance for advanced usage
export { multiUserManager }

// Cypress Command Integration
Cypress.Commands.add('setupMultiUserTest', setupMultiUserTest)
Cypress.Commands.add('switchToUser', switchToUser)
Cypress.Commands.add('cleanupMultiUserTest', cleanupMultiUserTest)
Cypress.Commands.add('waitForCrossSessionSync', waitForCrossSessionSync)
Cypress.Commands.add('simulateRealtimeInteraction', simulateRealtimeInteraction)
Cypress.Commands.add('validateRealtimeUpdate', validateRealtimeUpdate)
Cypress.Commands.add('broadcastToAllUsers', broadcastToAllUsers)
Cypress.Commands.add('shareDataAcrossSessions', shareDataAcrossSessions)
Cypress.Commands.add('onRealtimeEvent', onRealtimeEvent)
Cypress.Commands.add('emitRealtimeEvent', emitRealtimeEvent)
Cypress.Commands.add('waitForAllSessionsSync', waitForAllSessionsSync)
Cypress.Commands.add('validateCrossSessionState', validateCrossSessionState)
Cypress.Commands.add('monitorSessionPerformance', monitorSessionPerformance)
Cypress.Commands.add('handleSessionError', handleSessionError)
