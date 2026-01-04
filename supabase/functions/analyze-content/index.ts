import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { text } = await req.json()

        if (!text || text.trim().length === 0) {
            return new Response(
                JSON.stringify({ flagged: false, categories: {} }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Call Hugging Face API from server-side (no CORS issues!)
        const HF_API_KEY = Deno.env.get('HUGGING_FACE_API_KEY') || ''

        const response = await fetch(
            'https://api-inference.huggingface.co/models/unitary/toxic-bert',
            {
                method: 'POST',
                headers: {
                    ...(HF_API_KEY && { 'Authorization': `Bearer ${HF_API_KEY}` }),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ inputs: text })
            }
        )

        if (!response.ok) {
            console.warn('HuggingFace API call failed, using fallback')
            return new Response(
                JSON.stringify(keywordBasedAnalysis(text)),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const data = await response.json()
        const results = Array.isArray(data) ? data[0] : data

        const categories: Record<string, boolean> = {}
        const category_scores: Record<string, number> = {}
        let flagged = false

        // Process toxic-bert results
        if (results && Array.isArray(results)) {
            results.forEach((item: any) => {
                const score = item.score || 0
                const label = item.label?.toLowerCase() || ''

                category_scores[label] = score

                // Flag if score > 0.7 (high confidence)
                if (score > 0.7) {
                    categories[label] = true
                    flagged = true
                }
            })
        }

        // Also check with keyword analysis
        const keywordResults = keywordBasedAnalysis(text)
        if (keywordResults.flagged) {
            flagged = true
            Object.keys(keywordResults.categories).forEach(cat => {
                categories[cat] = true
            })
        }

        return new Response(
            JSON.stringify({
                flagged,
                categories,
                category_scores,
                model: 'huggingface/toxic-bert',
                raw_response: results
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        console.error('Error:', error)

        // Return safe fallback analysis on error
        return new Response(
            JSON.stringify({
                flagged: false,
                categories: {},
                category_scores: {},
                fallback: true,
                error: 'Analysis failed, using safe defaults'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200 // Return 200 to not break the frontend
            }
        )
    }
})

// Fallback keyword-based analysis
function keywordBasedAnalysis(text: string) {
    const lowerText = text.toLowerCase()
    const categories: Record<string, boolean> = {}
    let flagged = false

    // Cyberbullying patterns
    const CYBERBULLYING_PATTERNS = [
        /\b(ugly|stupid|loser|worthless|kill yourself|kys|nobody likes you)\b/i,
        /\b(fat|disgusting|hideous|pathetic|waste of space)\b/i,
        /\b(die|hang yourself|jump off)\b/i
    ]

    // Mental health keywords
    const MENTAL_HEALTH_KEYWORDS = {
        self_harm: [
            'cut myself', 'cutting', 'self harm', 'hurt myself', 'self-harm',
            'want to die', 'kill myself', 'suicidal', 'suicide', 'end my life'
        ]
    }

    // Personal info patterns
    const PERSONAL_INFO_PATTERNS = {
        phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
        email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
        address: /\b\d+\s+[\w\s]+\s+(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane)\b/i
    }

    // Check cyberbullying
    for (const pattern of CYBERBULLYING_PATTERNS) {
        if (pattern.test(text)) {
            categories['harassment'] = true
            flagged = true
            break
        }
    }

    // Check mental health
    for (const keywords of Object.values(MENTAL_HEALTH_KEYWORDS)) {
        for (const keyword of keywords) {
            if (lowerText.includes(keyword)) {
                categories['self-harm'] = true
                flagged = true
                break
            }
        }
    }

    // Check personal info
    for (const pattern of Object.values(PERSONAL_INFO_PATTERNS)) {
        if (pattern.test(text)) {
            categories['personal_info'] = true
            flagged = true
            break
        }
    }

    return {
        flagged,
        categories,
        category_scores: {},
        fallback: true
    }
}
