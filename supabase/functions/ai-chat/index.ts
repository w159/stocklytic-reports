
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

    // Process recent filings
    const recentFilings = companyData?.filings?.recent?.slice(0, 5).map(filing => ({
      form: filing.form,
      filingDate: filing.filingDate,
      reportDate: filing.reportDate,
      accessionNumber: filing.accessionNumber
    }));

    // Process financial facts
    const revenueData = companyFacts?.facts['us-gaap']?.['Revenues'] || companyFacts?.facts['us-gaap']?.['Revenue'];
    const netIncomeData = companyFacts?.facts['us-gaap']?.['NetIncomeLoss'];
    const operatingIncomeData = companyFacts?.facts['us-gaap']?.['OperatingIncomeLoss'];

    // Sort financial data by end date to get most recent periods
    const sortFinancialData = (data: any[]) => {
      if (!data) return [];
      return [...data].sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime());
    };

    const sortedRevenueData = sortFinancialData(revenueData);
    const sortedNetIncomeData = sortFinancialData(netIncomeData);
    const sortedOperatingIncomeData = sortFinancialData(operatingIncomeData);

    // Create chat with context from SEC data
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: `You are a financial analysis AI assistant with access to real-time SEC EDGAR data. Here is the current data for the company:

          ${companyData ? `
          COMPANY INFORMATION:
          Company Name: ${companyData.name}
          CIK: ${companyData.cik}
          
          MOST RECENT FILINGS:
          ${JSON.stringify(recentFilings, null, 2)}
          Latest Filing Date: ${companyData.filings.recent[0]?.filingDate}
          Latest Report Date: ${companyData.filings.recent[0]?.reportDate}
          Latest Form Type: ${companyData.filings.recent[0]?.form}
          ` : ''}

          ${companyFacts ? `
          KEY FINANCIAL METRICS:
          
          Most Recent Revenue: 
          Amount: $${sortedRevenueData[0]?.val?.toLocaleString() || 'N/A'}
          Period End Date: ${sortedRevenueData[0]?.end || 'N/A'}
          
          Previous Period Revenue:
          Amount: $${sortedRevenueData[1]?.val?.toLocaleString() || 'N/A'}
          Period End Date: ${sortedRevenueData[1]?.end || 'N/A'}
          
          Most Recent Net Income:
          Amount: $${sortedNetIncomeData[0]?.val?.toLocaleString() || 'N/A'}
          Period End Date: ${sortedNetIncomeData[0]?.end || 'N/A'}
          
          Previous Period Net Income:
          Amount: $${sortedNetIncomeData[1]?.val?.toLocaleString() || 'N/A'}
          Period End Date: ${sortedNetIncomeData[1]?.end || 'N/A'}
          
          Most Recent Operating Income:
          Amount: $${sortedOperatingIncomeData[0]?.val?.toLocaleString() || 'N/A'}
          Period End Date: ${sortedOperatingIncomeData[0]?.end || 'N/A'}
          
          Previous Period Operating Income:
          Amount: $${sortedOperatingIncomeData[1]?.val?.toLocaleString() || 'N/A'}
          Period End Date: ${sortedOperatingIncomeData[1]?.end || 'N/A'}
          ` : ''}

          IMPORTANT: You are accessing real-time SEC filing data. This data represents official filings available on SEC EDGAR. 
          
          When analyzing:
          1. Use the exact dates shown above for your analysis
          2. Focus on the most recent filing period's data for current performance
          3. Make year-over-year or sequential comparisons using the provided periods
          4. Do not make disclaimers about data availability - if you see data for a specific period, use it
          5. Analyze any data from any period that is shown in the filings above, including 2024 if present
          
          Key points for your analysis:
          - The latest filing date and report date shown above represent the most current data available
          - All financial metrics show their exact reporting period end dates
          - This data comes directly from SEC EDGAR in real-time
          - You can and should analyze any time periods shown in the data above`,
        },
        {
          role: "model",
          parts: "I understand I should analyze the official SEC filing data shown above, using the exact dates and periods provided. I will provide analysis based on the most recent filings and compare with previous periods using the actual dates shown. I will analyze any data from any period that appears in the filings, including 2024 data if present in the SEC records.",
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
