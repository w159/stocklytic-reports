
import axios from 'axios';

export interface StockOverview {
  Symbol: string;
  Name: string;
  Description: string;
  Sector: string;
  Industry: string;
  MarketCapitalization: string;
  PERatio: string;
  DividendYield: string;
  EPS: string;
  Beta: string;
  WeekHigh52: string;
  WeekLow52: string;
  PriceToSalesRatio: string;
  PriceToBookRatio: string;
  EVToEBITDA: string;
  ProfitMargin: string;
  OperatingMarginTTM: string;
  QuarterlyEarningsGrowthYOY: string;
  QuarterlyRevenueGrowthYOY: string;
  AnalystTargetPrice: string;
  TrailingPE: string;
  ForwardPE: string;
  SharesOutstanding: string;
  BookValue: string;
  ROE: string;
  RevenueTTM: string;
  GrossProfitTTM: string;
  DilutedEPSTTM: string;
  QuarterlyCashflow: string;
  SharesFloat: string;
  SharesShort: string;
  ShortRatio: string;
}

export interface TimeSeriesData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose?: number;
}

export interface NewsItem {
  title: string;
  url: string;
  time_published: string;
  authors: string[];
  summary: string;
  source: string;
  category_within_source: string;
  source_domain: string;
  sentiment_score?: number;
  ticker_sentiment?: {
    ticker: string;
    relevance_score: string;
    ticker_sentiment_score: string;
  }[];
}

const getApiKey = (): string => {
  const apiKey = localStorage.getItem('alphavantage_api_key');
  if (!apiKey) {
    throw new Error('API key not found');
  }
  return apiKey;
};

const processTimeSeriesResponse = async (data: any, symbol: string): Promise<TimeSeriesData[]> => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid API response format');
  }

  if (data?.Note?.includes('demo')) {
    throw new Error('Please use a valid Alpha Vantage API key');
  }

  if (data?.Note?.includes('API call frequency')) {
    throw new Error('API rate limit exceeded. Please try again later.');
  }

  if (data.Information) {
    throw new Error(data.Information);
  }

  if (data.Error) {
    throw new Error(`API Error: ${data.Error}`);
  }

  const timeSeries = data['Time Series (Daily)'];
  if (!timeSeries || Object.keys(timeSeries).length === 0) {
    throw new Error('No time series data available');
  }

  const processedData = Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
    date,
    open: Number(values['1. open']),
    high: Number(values['2. high']),
    low: Number(values['3. low']),
    close: Number(values['4. close']),
    volume: Number(values['5. volume']),
    adjClose: Number(values['4. close'])
  }));

  // Store in localStorage for caching
  localStorage.setItem(`stockPrices_${symbol}`, JSON.stringify(processedData));

  return processedData;
};

export const getStockOverview = async (symbol: string): Promise<StockOverview> => {
  if (!symbol) {
    throw new Error('Symbol is required');
  }

  try {
    const apiKey = getApiKey();
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'OVERVIEW',
        symbol,
        apikey: apiKey
      }
    });

    if (!response.data || Object.keys(response.data).length === 0) {
      throw new Error('No data returned from API');
    }

    if (response.data.Note) {
      if (response.data.Note.includes('demo')) {
        throw new Error('Please use a valid Alpha Vantage API key');
      }
      if (response.data.Note.includes('API call frequency')) {
        throw new Error('API rate limit exceeded. Please try again later.');
      }
    }

    if (!response.data.Symbol || !response.data.Name) {
      throw new Error('Invalid company overview data format');
    }

    // Store in localStorage for caching
    localStorage.setItem(`stockOverview_${symbol}`, JSON.stringify(response.data));

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Invalid API key');
      }
      if (error.response?.status === 429) {
        throw new Error('API rate limit exceeded');
      }
    }
    throw error;
  }
};

export const getTimeSeriesDaily = async (symbol: string): Promise<TimeSeriesData[]> => {
  if (!symbol) {
    throw new Error('Symbol is required');
  }

  try {
    const apiKey = getApiKey();
    console.log('Fetching time series data for symbol:', symbol);
    
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol,
        outputsize: 'compact',
        apikey: apiKey
      }
    });

    console.log('API Response:', JSON.stringify(response.data, null, 2));
    
    return processTimeSeriesResponse(response.data, symbol);
  } catch (error) {
    console.error('Error fetching time series data:', error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Invalid API key');
      }
      if (error.response?.status === 429) {
        throw new Error('API rate limit exceeded');
      }
    }
    throw error;
  }
};

export const getNewsData = async (symbol: string): Promise<NewsItem[]> => {
  if (!symbol) {
    throw new Error('Symbol is required');
  }

  try {
    const apiKey = getApiKey();
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'NEWS_SENTIMENT',
        tickers: symbol,
        apikey: apiKey,
        sort: 'RELEVANCE',
        limit: '9'
      }
    });

    if (response.data?.Note?.includes('demo')) {
      throw new Error('Please use a valid Alpha Vantage API key');
    }

    if (response.data?.Note?.includes('API call frequency')) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }

    if (!response.data.feed || !Array.isArray(response.data.feed)) {
      throw new Error('Invalid news data format');
    }

    const newsData = response.data.feed;

    // Store in localStorage for caching
    localStorage.setItem(`newsData_${symbol}`, JSON.stringify(newsData));

    return newsData;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Invalid API key');
      }
      if (error.response?.status === 429) {
        throw new Error('API rate limit exceeded');
      }
    }
    throw error;
  }
};
