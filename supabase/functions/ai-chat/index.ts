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

async function getRealTimeStockPrice(symbol: string) {
  try {
    const apiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    if (!apiKey) {
      console.error('Alpha Vantage API key not found in environment variables');
      return null;
    }
    
    const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`);
    const data = await response.json();
    
    console.log('Alpha Vantage API Response:', JSON.stringify(data, null, 2));
    
    if (data['Global Quote']) {
      return {
        price: data['Global Quote']['05. price'],
        change: data['Global Quote']['09. change'],
        changePercent: data['Global Quote']['10. change percent'],
        volume: data['Global Quote']['06. volume'],
        lastTradingDay: data['Global Quote']['07. latest trading day']
      };
    }
    
    if (data.Note) {
      console.error('Alpha Vantage API Note:', data.Note);
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching real-time stock price:', error);
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
    let stockPrice = null;
    
    if (symbolMatch) {
      const symbol = symbolMatch[0];
      console.log('Extracted symbol:', symbol);
      const cik = await getCompanyCIK(symbol);
      console.log('Found CIK:', cik);
      
      if (cik) {
        companyData = await getCompanyFilings(cik);
        companyFacts = await getCompanyFacts(cik);
        stockPrice = await getRealTimeStockPrice(symbol);
        
        // Log out the full data for debugging
        console.log('Filing data:', JSON.stringify(companyData, null, 2));
        console.log('Facts data:', JSON.stringify(companyFacts, null, 2));
        console.log('Stock price data:', JSON.stringify(stockPrice, null, 2));
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

    console.log('Sorted Revenue Data:', JSON.stringify(sortedRevenueData, null, 2));
    console.log('Sorted Net Income Data:', JSON.stringify(sortedNetIncomeData, null, 2));
    console.log('Sorted Operating Income Data:', JSON.stringify(sortedOperatingIncomeData, null, 2));

    // Create chat with context from SEC data
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: `You are a financial analysis AI assistant with access to real-time SEC EDGAR data and current market data. Here is the current data for the company:

          ${stockPrice ? `
          REAL-TIME MARKET DATA:
          Current Price: $${stockPrice.price}
          Change: ${stockPrice.change} (${stockPrice.changePercent})
          Volume: ${stockPrice.volume}
          Last Trading Day: ${stockPrice.lastTradingDay}
          ` : ''}

          ${companyData ? `
          COMPANY INFORMATION:
          Company Name: ${companyData.name}
          CIK: ${companyData.cik}
          
          FILING INFORMATION:
          ${recentFilings?.map((filing, index) => `
          Filing ${index + 1}:
          - Form Type: ${filing.form}
          - Filing Date: ${filing.filingDate}
          - Report Date: ${filing.reportDate}
          `).join('\n')}
          ` : ''}

          ${companyFacts ? `
          FINANCIAL METRICS (USD):
          
          Revenue Data:
          ${sortedRevenueData.slice(0, 4).map((data, index) => `
          Period ${index + 1}:
          - Amount: $${data.val.toLocaleString()}
          - Start Date: ${data.start}
          - End Date: ${data.end}
          - Filing Date: ${data.filed}
          `).join('\n')}
          
          Net Income Data:
          ${sortedNetIncomeData.slice(0, 4).map((data, index) => `
          Period ${index + 1}:
          - Amount: $${data.val.toLocaleString()}
          - Start Date: ${data.start}
          - End Date: ${data.end}
          - Filing Date: ${data.filed}
          `).join('\n')}
          
          Operating Income Data:
          ${sortedOperatingIncomeData.slice(0, 4).map((data, index) => `
          Period ${index + 1}:
          - Amount: $${data.val.toLocaleString()}
          - Start Date: ${data.start}
          - End Date: ${data.end}
          - Filing Date: ${data.filed}
          `).join('\n')}
          ` : ''}

          IMPORTANT INSTRUCTIONS:
          1. You have access to both real-time market data and historical SEC filings
          2. When asked about current stock price, use the real-time data shown above
          3. For historical analysis, use the SEC filing data with exact dates
          4. Be explicit about which data source and time period you are using
          5. If real-time data is not available, explain what historical data you do have`,
        },
        {
          role: "model",
          parts: "I understand that I have access to both real-time market data and historical SEC filings. I will use real-time data for current prices when available and reference specific periods from SEC filings for historical analysis. I will be clear about which data source I am using and what time periods are covered.",
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
