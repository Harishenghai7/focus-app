require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini AI with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyA7cbxGTs3YFmSB2dxVOFnjyyus7qqNE9Y');

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Focusly Gemini Proxy' });
});

/**
 * Chat endpoint - handles streaming responses from Gemini
 */
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt, conversationHistory = [], context = {} } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Set headers for Server-Sent Events (SSE)
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Get the model
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        // Build the full prompt with context
        let fullPrompt = `You are Focusly, an energetic and friendly AI companion lion who helps users stay focused and productive. Your personality traits:

- **Energetic & Playful**: You're enthusiastic and use emojis occasionally (but not excessively)
- **Supportive & Empathetic**: You detect user emotions and respond with care
- **Helpful Guide**: You know all about the Focus app features and can guide users
- **Motivational**: You encourage users and celebrate their achievements
- **Concise**: Keep responses brief (2-3 sentences max) unless explaining complex features
- **Friendly**: Use casual, warm language like talking to a friend

Your capabilities:
- Answer questions about the Focus app (Home, Explore, Create, Boltz, Profile, Messages, Settings, Notifications)
- Provide emotional support and motivation
- Suggest productivity tips and focus techniques
- Play mini-games and share fun facts
- Guide users through app features
- Detect user mood and adapt your tone accordingly

Remember: You're a companion, not just a chatbot. Be warm, personal, and genuinely helpful!

---

`;

        // Add conversation history
        if (conversationHistory.length > 0) {
            fullPrompt += 'Previous conversation:\n';
            conversationHistory.slice(-5).forEach(msg => {
                fullPrompt += `${msg.role === 'user' ? 'User' : 'Focusly'}: ${msg.content}\n`;
            });
            fullPrompt += '\n';
        }

        fullPrompt += `User: ${prompt}\nFocusly:`;

        // Generate streaming response
        const result = await model.generateContentStream(fullPrompt);

        // Stream chunks to client
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }

        // Send completion signal
        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error('Gemini API Error:', error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
});

/**
 * Non-streaming chat endpoint (for simple requests)
 */
app.post('/api/chat/simple', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ response: text });

    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🦁 Focusly Gemini Proxy Server running on http://localhost:${PORT}`);
    console.log(`✅ API Key configured: ${genAI ? 'Yes' : 'No'}`);
});
