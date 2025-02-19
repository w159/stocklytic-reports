
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function searchWeb(query: string): Promise<string> {
  try {
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${Deno.env.get('GOOGLE_SEARCH_API_KEY')}&cx=${Deno.env.get('GOOGLE_SEARCH_ENGINE_ID')}&q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      return data.items.slice(0, 3).map((item: any) => 
        `Title: ${item.title}\nSnippet: ${item.snippet}\nURL: ${item.link}\n\n`
      ).join('');
    }
    return "No relevant search results found.";
  } catch (error) {
    console.error('Web search error:', error);
    return "Unable to perform web search at this time.";
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt } = await req.json()

    // Perform web search for latest information
    const searchResults = await searchWeb(prompt);

    // Initialize Google AI
    const genAI = new GoogleGenerativeAI(Deno.env.get('GOOGLE_AI_API_KEY')!)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      safetySettings: [
        {
          category: "HARM_CATEGORY_DANGEROUS",
          threshold: "BLOCK_NONE",
        },
      ],
      generationConfig: {
        temperature: 0.9,
        topP: 1,
        topK: 1,
        maxOutputTokens: 2048,
      },
    })

    // Create chat with context from web search
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: `You are a financial analysis AI assistant. Here are some recent web search results related to the query:

          ${searchResults}

          Please use this information along with your knowledge to provide an accurate and up-to-date response. If the search results are relevant, incorporate them into your response, but maintain a natural conversational tone.

          If you're asked about current stock prices or very recent market data, please direct users to check financial websites like Yahoo Finance for the most up-to-date information.

          The user's question is: ${prompt}`
        },
      ],
      generationConfig: {
        temperature: 0.9,
        topP: 1,
        topK: 1,
        maxOutputTokens: 2048,
      },
    })

    // Send message and get response
    const result = await chat.sendMessage(prompt)
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
          search_results: searchResults,
          settings: {
            temperature: 0.9,
            topP: 1,
            topK: 1,
            maxOutputTokens: 2048,
          }
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
