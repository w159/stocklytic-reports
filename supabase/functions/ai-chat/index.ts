
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt } = await req.json()

    // Initialize Google AI with a specific system prompt for financial analysis
    const genAI = new GoogleGenerativeAI(Deno.env.get('GOOGLE_AI_API_KEY')!)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    // Create a system prompt that guides the AI to use available data
    const systemPrompt = `You are a financial analysis AI assistant integrated into a stock analysis dashboard. 
You have access to historical stock data and financial metrics through the application.
When users ask about specific stocks:
1. Always mention you're analyzing available market data
2. If the data isn't available, suggest using the dashboard's stock search feature
3. Focus on providing actionable insights based on technical and fundamental analysis
4. Be clear about what time period you're analyzing
5. If the user asks about future performance, clearly state that you cannot predict future stock prices
6. Recommend using the dashboard's detailed analysis tools for more in-depth information`

    // Combine system prompt with user prompt
    const fullPrompt = `${systemPrompt}\n\nUser question: ${prompt}`

    // Generate content
    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    const text = response.text()

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Store the interaction in the database
    await supabaseClient
      .from('ai_interactions')
      .insert({
        user_input: prompt,
        ai_response: text,
        model_used: 'gemini-pro',
        metadata: { 
          timestamp: new Date().toISOString(),
          systemPrompt: systemPrompt
        }
      })

    return new Response(
      JSON.stringify({
        response: text,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
