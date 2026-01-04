import voiceSynthesis from './voiceSynthesis';

class GeminiAIService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    this.apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    this.conversationHistory = [];
    this.personality = {
      name: 'Focusly',
      role: 'AI Focus Assistant',
      traits: ['friendly', 'helpful', 'encouraging', 'playful', 'supportive'],
      greeting: "Hello! I'm Focusly, your AI focus buddy! What's on your mind? 🦊✨",
    };
  }

  async getResponse(userMessage, context = {}) {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    });

    // Determine emotion based on message
    const emotion = this.analyzeEmotion(userMessage);

    try {
      // Build conversation context for Gemini
      const conversationContext = this.conversationHistory
        .slice(-5) // Last 5 messages for context
        .map(msg => `${msg.role === 'user' ? 'User' : 'Focusly'}: ${msg.content}`)
        .join('\n');

      // System prompt for Focusly personality
      const systemPrompt = `You are Focusly, a friendly and helpful AI assistant for the Focus social media app.

Your personality:
- Friendly, warm, and encouraging
- Helpful and knowledgeable about the Focus app
- Playful but professional
- Supportive and motivating
- Use emojis occasionally (but not too many)

Your capabilities:
- Help users create posts, stories (Flash), and short videos (Boltz)
- Suggest captions and hashtags
- Help find friends and interesting content
- Manage account settings
- Answer questions about the app features
- Provide encouragement and motivation
- Edit photos and videos
- Schedule posts
- Analyze engagement

User context:
- Username: ${context.user?.username || 'Friend'}
- Current page: ${context.page || 'Focusly Chat'}
- Previous messages: ${conversationContext}

Response guidelines:
- Keep responses concise (2-3 sentences max)
- Be conversational and natural
- Use "I" and "you" (first and second person)
- Ask follow-up questions when helpful
- Suggest specific actions when relevant
- Be enthusiastic but not overwhelming

Current user message: ${userMessage}

Respond as Focusly:`;

      // Call Gemini API
      const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: systemPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 200,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Extract AI response
      const aiMessage = data.candidates[0]?.content?.parts[0]?.text || 
                       "I'm here to help! Can you tell me more about what you need?";

      // Add AI response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: aiMessage,
        timestamp: new Date()
      });

      return {
        text: aiMessage,
        emotion: emotion,
        shouldSpeak: true
      };

    } catch (error) {
      console.error('Gemini AI Error:', error);
      
      // Fallback responses based on message intent
      const fallbackResponse = this.getFallbackResponse(userMessage);
      
      return {
        text: fallbackResponse,
        emotion: 'neutral',
        shouldSpeak: true
      };
    }
  }

  getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Intent-based fallback responses
    if (lowerMessage.includes('create') || lowerMessage.includes('post')) {
      return "I'd love to help you create a post! Let me open the create page for you. 📸✨";
    }
    if (lowerMessage.includes('friend') || lowerMessage.includes('people')) {
      return "Looking for friends? Let me show you some interesting people to follow! 👥";
    }
    if (lowerMessage.includes('profile') || lowerMessage.includes('edit')) {
      return "Want to edit your profile? I can help you with that! Let's go to your profile settings. ✏️";
    }
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you')) {
      return "I can help you create posts, find friends, edit your profile, and so much more! What would you like to do? 🦊";
    }
    
    // Generic fallback
    const genericResponses = [
      "I'm here to help! Can you tell me more about what you need? 🦊",
      "Hmm, I'm having a small hiccup connecting right now, but I'm still here for you! Try again? 💜",
      "Let me think about that... Meanwhile, is there something else I can help with? 🤔",
      "I'm your Focus buddy! Tell me what's on your mind and I'll do my best to assist! ✨"
    ];
    
    return genericResponses[Math.floor(Math.random() * genericResponses.length)];
  }

  analyzeEmotion(message) {
    const lowerMessage = message.toLowerCase();
    
    // Emotion detection based on keywords
    if (lowerMessage.includes('help') || lowerMessage.includes('how') || lowerMessage.includes('?')) {
      return 'thinking';
    }
    if (lowerMessage.includes('thank') || lowerMessage.includes('great') || 
        lowerMessage.includes('awesome') || lowerMessage.includes('love')) {
      return 'happy';
    }
    if (lowerMessage.includes('sad') || lowerMessage.includes('problem') || 
        lowerMessage.includes('issue') || lowerMessage.includes('wrong')) {
      return 'concerned';
    }
    if (lowerMessage.includes('!') || lowerMessage.includes('wow') || 
        lowerMessage.includes('amazing') || lowerMessage.includes('yes')) {
      return 'excited';
    }
    
    return 'neutral';
  }

  async speakResponse(text, callbacks = {}) {
    try {
      await voiceSynthesis.speak(text, {
        rate: 1.1,
        pitch: 1.2,
        onStart: callbacks.onStart,
        onEnd: callbacks.onEnd,
        onAudioData: callbacks.onAudioData
      });
    } catch (error) {
      console.error('Speech synthesis error:', error);
    }
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  getHistory() {
    return this.conversationHistory;
  }
}

export default new GeminiAIService();
