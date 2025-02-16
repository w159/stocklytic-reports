
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getCompanyCIK(symbol: string): Promise<string | null> {
  try {
    const response = await fetch('https://www.sec.gov/files/company_tickers.json');
    const data = await response.json();
    
    // Find the company by ticker symbol (case insensitive)
    const company = Object.values(data).find(
      (c: any) => c.ticker.toLowerCase() === symbol.toLowerCase()
    );
    
    if (company) {
      // Pad CIK with leading zeros to make it 10 digits
      return String(company.cik_str).padStart(10, '0');
    }
    return null;
  } catch (error) {
    console.error('Error fetching CIK:', error);
    return null;
  }
}

async function getCompanyFilings(cik: string) {
  try {
    const response = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, {
      headers: {
        'User-Agent': 'StockAnalysisApp stock-analysis@example.com'
      }
    });
    const data = await response.json();
    console.log('Filing data:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error fetching company filings:', error);
    return null;
  }
}

async function getCompanyFacts(cik: string) {
  try {
    const response = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, {
      headers: {
        'User-Agent': 'StockAnalysisApp stock-analysis@example.com'
      }
    });
    const data = await response.json();
    console.log('Facts data:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error fetching company facts:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt } = await req.json()

    // Extract stock symbol from prompt if it exists
    const symbolMatch = prompt.match(/[A-Z]{1,5}/);
    let companyData = null;
    let companyFacts = null;
    
    if (symbolMatch) {
      const symbol = symbolMatch[0];
      console.log('Extracted symbol:', symbol);
      const cik = await getCompanyCIK(symbol);
      console.log('Found CIK:', cik);
      
      if (cik) {
        companyData = await getCompanyFilings(cik);
        companyFacts = await getCompanyFacts(cik);
      }
    }

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

    // Create chat with context from SEC data
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: `You are a financial analysis AI assistant with access to SEC EDGAR data. 
          When analyzing companies, use the following data if available:
          ${companyData ? `
          Recent SEC Filings: ${JSON.stringify(companyData.filings.recent, null, 2)}
          Company Name: ${companyData.name}
          Filing Period: ${companyData.filings.recent[0]?.reportDate || 'N/A'}
          Form Type: ${companyData.filings.recent[0]?.form || 'N/A'}
          ` : ''}
          ${companyFacts ? `
          Key Financial Facts from SEC Filings:
          - Revenue: ${JSON.stringify(companyFacts.facts['us-gaap']?.['Revenues'] || companyFacts.facts['us-gaap']?.['Revenue'], null, 2)}
          - Net Income: ${JSON.stringify(companyFacts.facts['us-gaap']?.['NetIncomeLoss'], null, 2)}
          - Operating Income: ${JSON.stringify(companyFacts.facts['us-gaap']?.['OperatingIncomeLoss'], null, 2)}
          ` : ''}
          Please provide detailed analysis based on this official SEC data, focusing on the most recent reporting period and year-over-year comparisons when available. If asked about a specific year, compare it with previous years using the available data. You have access to real-time SEC filing data, so please use it to provide current information. Do not disclaim access to recent data if it's available in the filings.`,
        },
        {
          role: "model",
          parts: "I understand I'm a financial analysis AI assistant with access to SEC EDGAR data. I'll provide detailed analysis based on official filings and financial facts, focusing on accurate reporting periods and data sources. I'll make year-over-year comparisons when possible and clearly indicate which reporting periods I'm analyzing. I'll use the most recent SEC filing data available to provide current information.",
        },
      ],
      generationConfig: {
        temperature: 0.9,
        topP: 1,
        topK: 1,
        maxOutputTokens: 2048,
      },
    });

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
          settings: {
            temperature: 0.9,
            topP: 1,
            topK: 1,
            maxOutputTokens: 2048,
          },
          secData: companyData ? {
            cik: companyData.cik,
            name: companyData.name,
            filingCount: companyData.filings.recent.length
          } : null
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
