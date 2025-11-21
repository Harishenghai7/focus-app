describe('API Integration Testing', () => {
  const userA = { username: 'api_user_a', email: 'api_a@focus.com', password: 'password123' }
  const userB = { username: 'api_user_b', email: 'api_b@focus.com', password: 'password123' }

  before(() => {
    cy.task('setupTestUsers', [userA, userB])
  })

  after(() => {
    cy.task('cleanupTestUsers', [userA, userB])
  })

  describe('Authentication API', () => {
    it('should handle login API correctly', () => {
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: userA.email,
          password: userA.password
        }
      }).then((response) => {
        expect(response.status).to.equal(200)
        expect(response.body).to.have.property('token')
        expect(response.body).to.have.property('user')
        expect(response.body.user).to.have.property('id')
        expect(response.body.user.email).to.equal(userA.email)
      })
    })

    it('should handle registration API correctly', () => {
      const newUser = { username: 'new_api_user', email: 'new_api@focus.com', password: 'password123' }

      cy.request({
        method: 'POST',
        url: '/api/auth/register',
        body: newUser
      }).then((response) => {
        expect(response.status).to.equal(201)
        expect(response.body).to.have.property('user')
        expect(response.body.user.email).to.equal(newUser.email)

        // Cleanup
        cy.task('cleanupTestUsers', [newUser])
      })
    })

    it('should handle logout API correctly', () => {
      // Login first
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: userA.email,
          password: userA.password
        }
      }).then((loginResponse) => {
        const token = loginResponse.body.token

        // Logout
        cy.request({
          method: 'POST',
          url: '/api/auth/logout',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then((logoutResponse) => {
          expect(logoutResponse.status).to.equal(200)

          // Verify token is invalidated
          cy.request({
            method: 'GET',
            url: '/api/profile',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            failOnStatusCode: false
          }).then((profileResponse) => {
            expect(profileResponse.status).to.equal(401)
          })
        })
      })
    })

    it('should handle password reset API correctly', () => {
      cy.request({
        method: 'POST',
        url: '/api/auth/forgot-password',
        body: {
          email: userA.email
        }
      }).then((response) => {
        expect(response.status).to.equal(200)
        expect(response.body).to.have.property('message', 'Password reset email sent')
      })
    })

    it('should handle token refresh API correctly', () => {
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: userA.email,
          password: userA.password
        }
      }).then((loginResponse) => {
        const refreshToken = loginResponse.body.refreshToken

        cy.request({
          method: 'POST',
          url: '/api/auth/refresh',
          body: {
            refreshToken: refreshToken
          }
        }).then((refreshResponse) => {
          expect(refreshResponse.status).to.equal(200)
          expect(refreshResponse.body).to.have.property('token')
          expect(refreshResponse.body).to.have.property('refreshToken')
        })
      })
    })
  })

  describe('User Profile API', () => {
    let authToken

    beforeEach(() => {
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: userA.email,
          password: userA.password
        }
      }).then((response) => {
        authToken = response.body.token
      })
    })

    it('should get user profile correctly', () => {
      cy.request({
        method: 'GET',
        url: '/api/profile',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.equal(200)
        expect(response.body).to.have.property('id')
        expect(response.body).to.have.property('username', userA.username)
        expect(response.body).to.have.property('email', userA.email)
      })
    })

    it('should update user profile correctly', () => {
      const updatedProfile = {
        bio: 'Updated bio via API',
        website: 'https://example.com'
      }

      cy.request({
        method: 'PUT',
        url: '/api/profile',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: updatedProfile
      }).then((response) => {
        expect(response.status).to.equal(200)
        expect(response.body.bio).to.equal(updatedProfile.bio)
        expect(response.body.website).to.equal(updatedProfile.website)
      })
    })

    it('should handle profile picture upload correctly', () => {
      cy.fixture('test-profile-pic.jpg', 'base64').then((fileContent) => {
        cy.request({
          method: 'POST',
          url: '/api/profile/avatar',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: {
            file: fileContent,
            filename: 'test-profile-pic.jpg'
          }
        }).then((response) => {
          expect(response.status).to.equal(200)
          expect(response.body).to.have.property('avatar_url')
        })
      })
    })

    it('should get user followers/following correctly', () => {
      cy.request({
        method: 'GET',
        url: `/api/users/${userA.username}/followers`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.equal(200)
        expect(response.body).to.have.property('followers')
        expect(Array.isArray(response.body.followers)).to.be.true
      })

      cy.request({
        method: 'GET',
        url: `/api/users/${userA.username}/following`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.equal(200)
        expect(response.body).to.have.property('following')
        expect(Array.isArray(response.body.following)).to.be.true
      })
    })
  })

  describe('Posts API', () => {
    let authToken
    let postId

    beforeEach(() => {
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: userA.email,
          password: userA.password
        }
      }).then((response) => {
        authToken = response.body.token
      })
    })

    it('should create post correctly', () => {
      const postData = {
        caption: 'Test post via API',
        isPublic: true
      }

      cy.request({
        method: 'POST',
        url: '/api/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: postData
      }).then((response) => {
        expect(response.status).to.equal(201)
        expect(response.body).to.have.property('id')
        expect(response.body.caption).to.equal(postData.caption)
        expect(response.body.author.username).to.equal(userA.username)
        postId = response.body.id
      })
    })

    it('should get posts feed correctly', () => {
      cy.request({
        method: 'GET',
        url: '/api/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.equal(200)
        expect(Array.isArray(response.body.posts)).to.be.true
        expect(response.body).to.have.property('pagination')

        if (response.body.posts.length > 0) {
          const post = response.body.posts[0]
          expect(post).to.have.property('id')
          expect(post).to.have.property('caption')
          expect(post).to.have.property('author')
          expect(post.author).to.have.property('username')
        }
      })
    })

    it('should get single post correctly', () => {
      // First create a post
      cy.request({
        method: 'POST',
        url: '/api/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: { caption: 'Single post test' }
      }).then((createResponse) => {
        const postId = createResponse.body.id

        cy.request({
          method: 'GET',
          url: `/api/posts/${postId}`,
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }).then((response) => {
          expect(response.status).to.equal(200)
          expect(response.body.id).to.equal(postId)
          expect(response.body.caption).to.equal('Single post test')
        })
      })
    })

    it('should update post correctly', () => {
      cy.request({
        method: 'POST',
        url: '/api/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: { caption: 'Original caption' }
      }).then((createResponse) => {
        const postId = createResponse.body.id

        cy.request({
          method: 'PUT',
          url: `/api/posts/${postId}`,
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: { caption: 'Updated caption' }
        }).then((response) => {
          expect(response.status).to.equal(200)
          expect(response.body.caption).to.equal('Updated caption')
        })
      })
    })

    it('should delete post correctly', () => {
      cy.request({
        method: 'POST',
        url: '/api/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: { caption: 'Post to delete' }
      }).then((createResponse) => {
        const postId = createResponse.body.id

        cy.request({
          method: 'DELETE',
          url: `/api/posts/${postId}`,
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }).then((deleteResponse) => {
          expect(deleteResponse.status).to.equal(200)

          // Verify post is deleted
          cy.request({
            method: 'GET',
            url: `/api/posts/${postId}`,
            headers: {
              'Authorization': `Bearer ${authToken}`
            },
            failOnStatusCode: false
          }).then((getResponse) => {
            expect(getResponse.status).to.equal(404)
          })
        })
      })
    })

    it('should handle post likes correctly', () => {
      cy.request({
        method: 'POST',
        url: '/api/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: { caption: 'Post for liking' }
      }).then((createResponse) => {
        const postId = createResponse.body.id

        // Like the post
        cy.request({
          method: 'POST',
          url: `/api/posts/${postId}/like`,
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }).then((likeResponse) => {
          expect(likeResponse.status).to.equal(200)

          // Check like count
          cy.request({
            method: 'GET',
            url: `/api/posts/${postId}`,
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          }).then((getResponse) => {
            expect(getResponse.body.likesCount).to.equal(1)
            expect(getResponse.body.isLiked).to.be.true
          })

          // Unlike the post
          cy.request({
            method: 'DELETE',
            url: `/api/posts/${postId}/like`,
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          }).then((unlikeResponse) => {
            expect(unlikeResponse.status).to.equal(200)
          })
        })
      })
    })
  })

  describe('Comments API', () => {
    let authToken
    let postId
    let commentId

    beforeEach(() => {
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: userA.email,
          password: userA.password
        }
      }).then((response) => {
        authToken = response.body.token

        // Create a post for commenting
        cy.request({
          method: 'POST',
          url: '/api/posts',
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: { caption: 'Post for comments' }
        }).then((postResponse) => {
          postId = postResponse.body.id
        })
      })
    })

    it('should create comment correctly', () => {
      cy.request({
        method: 'POST',
        url: `/api/posts/${postId}/comments`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: { content: 'Test comment via API' }
      }).then((response) => {
        expect(response.status).to.equal(201)
        expect(response.body).to.have.property('id')
        expect(response.body.content).to.equal('Test comment via API')
        expect(response.body.author.username).to.equal(userA.username)
        commentId = response.body.id
      })
    })

    it('should get post comments correctly', () => {
      cy.request({
        method: 'GET',
        url: `/api/posts/${postId}/comments`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.equal(200)
        expect(Array.isArray(response.body.comments)).to.be.true

        if (response.body.comments.length > 0) {
          const comment = response.body.comments[0]
          expect(comment).to.have.property('id')
          expect(comment).to.have.property('content')
          expect(comment).to.have.property('author')
        }
      })
    })

    it('should update comment correctly', () => {
      // First create a comment to update
      cy.request({
        method: 'POST',
        url: `/api/posts/${postId}/comments`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: { content: 'Comment to update' }
      }).then((createResponse) => {
        const commentId = createResponse.body.id
        
        cy.request({
          method: 'PUT',
          url: `/api/posts/${postId}/comments/${commentId}`,
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: { content: 'Updated comment content' }
        }).then((response) => {
          expect(response.status).to.equal(200)
          expect(response.body.content).to.equal('Updated comment content')
        })
      })
    })

    it('should delete comment correctly', () => {
      // First create a comment to delete
      cy.request({
        method: 'POST',
        url: `/api/posts/${postId}/comments`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: { content: 'Comment to delete' }
      }).then((createResponse) => {
        const commentId = createResponse.body.id
        
        cy.request({
          method: 'DELETE',
          url: `/api/posts/${postId}/comments/${commentId}`,
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }).then((response) => {
          expect(response.status).to.equal(200)

          // Verify comment is deleted
          cy.request({
            method: 'GET',
            url: `/api/posts/${postId}/comments/${commentId}`,
            headers: {
              'Authorization': `Bearer ${authToken}`
            },
            failOnStatusCode: false
          }).then((getResponse) => {
            expect(getResponse.status).to.equal(404)
          })
        })
      })
    })
  })

  describe('Messages API', () => {
    let authTokenA
    let authTokenB
    let conversationId

    beforeEach(() => {
      // Login both users
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: userA.email,
          password: userA.password
        }
      }).then((response) => {
        authTokenA = response.body.token
      })

      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: userB.email,
          password: userB.password
        }
      }).then((response) => {
        authTokenB = response.body.token
      })
    })

    it('should create conversation correctly', () => {
      cy.request({
        method: 'POST',
        url: '/api/conversations',
        headers: {
          'Authorization': `Bearer ${authTokenA}`
        },
        body: {
          participants: [userB.username],
          type: 'direct'
        }
      }).then((response) => {
        expect(response.status).to.equal(201)
        expect(response.body).to.have.property('id')
        expect(response.body.participants).to.include(userA.username)
        expect(response.body.participants).to.include(userB.username)
        conversationId = response.body.id
      })
    })

    it('should send message correctly', () => {
      cy.request({
        method: 'POST',
        url: `/api/conversations/${conversationId}/messages`,
        headers: {
          'Authorization': `Bearer ${authTokenA}`
        },
        body: { content: 'Test message via API' }
      }).then((response) => {
        expect(response.status).to.equal(201)
        expect(response.body.content).to.equal('Test message via API')
        expect(response.body.sender.username).to.equal(userA.username)
      })
    })

    it('should get conversation messages correctly', () => {
      cy.request({
        method: 'GET',
        url: `/api/conversations/${conversationId}/messages`,
        headers: {
          'Authorization': `Bearer ${authTokenA}`
        }
      }).then((response) => {
        expect(response.status).to.equal(200)
        expect(Array.isArray(response.body.messages)).to.be.true

        if (response.body.messages.length > 0) {
          const message = response.body.messages[0]
          expect(message).to.have.property('id')
          expect(message).to.have.property('content')
          expect(message).to.have.property('sender')
        }
      })
    })

    it('should get user conversations correctly', () => {
      cy.request({
        method: 'GET',
        url: '/api/conversations',
        headers: {
          'Authorization': `Bearer ${authTokenA}`
        }
      }).then((response) => {
        expect(response.status).to.equal(200)
        expect(Array.isArray(response.body.conversations)).to.be.true

        if (response.body.conversations.length > 0) {
          const conversation = response.body.conversations[0]
          expect(conversation).to.have.property('id')
          expect(conversation).to.have.property('participants')
          expect(conversation).to.have.property('lastMessage')
        }
      })
    })
  })

  describe('Search API', () => {
    let authToken

    beforeEach(() => {
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: userA.email,
          password: userA.password
        }
      }).then((response) => {
        authToken = response.body.token
      })
    })

    it('should search users correctly', () => {
      cy.request({
        method: 'GET',
        url: '/api/search/users',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        qs: { q: userB.username }
      }).then((response) => {
        expect(response.status).to.equal(200)
        expect(Array.isArray(response.body.users)).to.be.true

        if (response.body.users.length > 0) {
          const user = response.body.users[0]
          expect(user).to.have.property('username')
          expect(user).to.have.property('id')
        }
      })
    })

    it('should search posts correctly', () => {
      cy.request({
        method: 'GET',
        url: '/api/search/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        qs: { q: 'test' }
      }).then((response) => {
        expect(response.status).to.equal(200)
        expect(Array.isArray(response.body.posts)).to.be.true

        if (response.body.posts.length > 0) {
          const post = response.body.posts[0]
          expect(post).to.have.property('id')
          expect(post).to.have.property('caption')
          expect(post).to.have.property('author')
        }
      })
    })

    it('should handle search pagination correctly', () => {
      cy.request({
        method: 'GET',
        url: '/api/search/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        qs: { q: 'test', limit: 10, offset: 0 }
      }).then((response) => {
        expect(response.status).to.equal(200)
        expect(response.body).to.have.property('pagination')
        expect(response.body.pagination).to.have.property('total')
        expect(response.body.pagination).to.have.property('limit', 10)
        expect(response.body.pagination).to.have.property('offset', 0)
      })
    })
  })

  describe('Notifications API', () => {
    let authToken

    beforeEach(() => {
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: userA.email,
          password: userA.password
        }
      }).then((response) => {
        authToken = response.body.token
      })
    })

    it('should get notifications correctly', () => {
      cy.request({
        method: 'GET',
        url: '/api/notifications',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.equal(200)
        expect(Array.isArray(response.body.notifications)).to.be.true

        if (response.body.notifications.length > 0) {
          const notification = response.body.notifications[0]
          expect(notification).to.have.property('id')
          expect(notification).to.have.property('type')
          expect(notification).to.have.property('message')
          expect(notification).to.have.property('read')
        }
      })
    })

    it('should mark notification as read correctly', () => {
      // First get notifications
      cy.request({
        method: 'GET',
        url: '/api/notifications',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((getResponse) => {
        if (getResponse.body.notifications.length > 0) {
          const notificationId = getResponse.body.notifications[0].id

          cy.request({
            method: 'PUT',
            url: `/api/notifications/${notificationId}/read`,
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          }).then((markResponse) => {
            expect(markResponse.status).to.equal(200)

            // Verify notification is marked as read
            cy.request({
              method: 'GET',
              url: `/api/notifications/${notificationId}`,
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            }).then((verifyResponse) => {
              expect(verifyResponse.body.read).to.be.true
            })
          })
        }
      })
    })

    it('should delete notification correctly', () => {
      cy.request({
        method: 'GET',
        url: '/api/notifications',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((getResponse) => {
        if (getResponse.body.notifications.length > 0) {
          const notificationId = getResponse.body.notifications[0].id

          cy.request({
            method: 'DELETE',
            url: `/api/notifications/${notificationId}`,
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          }).then((deleteResponse) => {
            expect(deleteResponse.status).to.equal(200)

            // Verify notification is deleted
            cy.request({
              method: 'GET',
              url: `/api/notifications/${notificationId}`,
              headers: {
                'Authorization': `Bearer ${authToken}`
              },
              failOnStatusCode: false
            }).then((verifyResponse) => {
              expect(verifyResponse.status).to.equal(404)
            })
          })
        }
      })
    })
  })

  describe('API Error Handling', () => {
    it('should handle 404 errors correctly', () => {
      cy.request({
        method: 'GET',
        url: '/api/posts/nonexistent-id',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.equal(404)
        expect(response.body).to.have.property('error', 'Not Found')
      })
    })

    it('should handle 401 unauthorized errors correctly', () => {
      cy.request({
        method: 'GET',
        url: '/api/profile',
        headers: {
          'Authorization': 'Bearer invalid-token'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.equal(401)
        expect(response.body).to.have.property('error', 'Unauthorized')
      })
    })

    it('should handle 403 forbidden errors correctly', () => {
      cy.request({
        method: 'GET',
        url: `/api/users/${userA.username}/private-data`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.equal(403)
        expect(response.body).to.have.property('error', 'Forbidden')
      })
    })

    it('should handle 400 bad request errors correctly', () => {
      cy.request({
        method: 'POST',
        url: '/api/test-400',
        body: { invalidField: 'test' },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.equal(400)
        expect(response.body).to.have.property('error', 'Bad Request')
        expect(response.body).to.have.property('validationErrors')
      })
    })

    it('should handle 500 internal server errors correctly', () => {
      // Trigger a server error (this would depend on your API implementation)
      cy.request({
        method: 'GET',
        url: '/api/trigger-error',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.equal(500)
        expect(response.body).to.have.property('error', 'Internal Server Error')
      })
    })
  })

  describe('API Rate Limiting', () => {
    it('should handle rate limiting correctly', () => {
      // Make multiple requests rapidly to trigger rate limiting
      const makeRequest = () => {
        return cy.request({
          method: 'GET',
          url: '/api/profile',
          failOnStatusCode: false
        })
      }

      // Make 6 requests sequentially to trigger rate limit (limit is 5)
      makeRequest().then(() => {
        return makeRequest()
      }).then(() => {
        return makeRequest()
      }).then(() => {
        return makeRequest()
      }).then(() => {
        return makeRequest()
      }).then(() => {
        return makeRequest()
      }).then((response) => {
        // The 6th request should be rate limited
        expect(response.status).to.equal(429)
        expect(response.body).to.have.property('error', 'Too Many Requests')
      })
    })
  })

  describe('API Pagination', () => {
    let authToken

    beforeEach(() => {
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: userA.email,
          password: userA.password
        }
      }).then((response) => {
        authToken = response.body.token
      })
    })

    it('should handle pagination correctly', () => {
      cy.request({
        method: 'GET',
        url: '/api/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        qs: { limit: 10, offset: 0 }
      }).then((response) => {
        expect(response.status).to.equal(200)
        expect(response.body).to.have.property('posts')
        expect(response.body).to.have.property('pagination')
        expect(response.body.pagination).to.have.property('total')
        expect(response.body.pagination).to.have.property('limit', 10)
        expect(response.body.pagination).to.have.property('offset', 0)
        expect(response.body.pagination).to.have.property('hasNext')
        expect(response.body.pagination).to.have.property('hasPrev')
      })
    })

    it('should navigate through pages correctly', () => {
      // Get first page
      cy.request({
        method: 'GET',
        url: '/api/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        qs: { limit: 5, offset: 0 }
      }).then((firstPage) => {
        if (firstPage.body.pagination.hasNext) {
          // Get second page
          cy.request({
            method: 'GET',
            url: '/api/posts',
            headers: {
              'Authorization': `Bearer ${authToken}`
            },
            qs: { limit: 5, offset: 5 }
          }).then((secondPage) => {
            expect(secondPage.status).to.equal(200)
            expect(secondPage.body.posts.length).to.be.at.most(5)

            // Posts should be different from first page
            const firstPageIds = firstPage.body.posts.map(p => p.id)
            const secondPageIds = secondPage.body.posts.map(p => p.id)
            const overlap = firstPageIds.filter(id => secondPageIds.includes(id))
            expect(overlap.length).to.equal(0)
          })
        }
      })
    })
  })

  describe('API Caching', () => {
    let authToken

    beforeEach(() => {
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: userA.email,
          password: userA.password
        }
      }).then((response) => {
        authToken = response.body.token
      })
    })

    it('should handle caching headers correctly', () => {
      cy.request({
        method: 'GET',
        url: '/api/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        // Check for appropriate cache headers
        expect(response.headers).to.have.property('cache-control')

        // Public endpoints might be cacheable
        if (response.headers['cache-control'].includes('max-age')) {
          expect(response.headers['cache-control']).to.match(/max-age=\d+/)
        }
      })
    })

    it('should handle conditional requests correctly', () => {
      // Get resource with ETag
      cy.request({
        method: 'GET',
        url: '/api/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        if (response.headers.etag) {
          const etag = response.headers.etag

          // Make conditional request
          cy.request({
            method: 'GET',
            url: '/api/posts',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'If-None-Match': etag
            },
            failOnStatusCode: false
          }).then((conditionalResponse) => {
            // Since we don't implement 304 responses, just check it works
            expect([200, 304]).to.include(conditionalResponse.status)
          })
        } else {
          // If no ETag, just verify the endpoint works
          expect(response.status).to.equal(200)
        }
      })
    })
  })
})