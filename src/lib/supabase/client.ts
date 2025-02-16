
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a single supabase client instance
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables. Please ensure you have connected your project to Supabase.');
    // Provide dummy values to prevent the app from crashing during development
    const dummyUrl = 'https://your-project.supabase.co';
    const dummyKey = 'your-anon-key';
    return createClient(dummyUrl, dummyKey);
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createSupabaseClient();

// Type definitions for our database tables
export type StockPrice = {
  id: number;
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  created_at?: string;
};

export type FinancialMetric = {
  id: number;
  symbol: string;
  date: string;
  metric_type: string;
  value: number;
  created_at?: string;
};

export type NewsSentiment = {
  id: number;
  symbol: string;
  date: string;
  title: string;
  summary: string;
  sentiment_score: number;
  source: string;
  url: string;
  created_at?: string;
};

// Database interaction functions
export const saveStockPrices = async (prices: Omit<StockPrice, 'id' | 'created_at'>[]) => {
  const { data, error } = await supabase
    .from('stock_prices')
    .upsert(
      prices.map(price => ({
        symbol: price.symbol,
        date: price.date,
        open: price.open,
        high: price.high,
        low: price.low,
        close: price.close,
        volume: price.volume
      })),
      { onConflict: 'symbol,date' }
    );

  if (error) throw error;
  return data;
};

export const saveFinancialMetrics = async (metrics: Omit<FinancialMetric, 'id' | 'created_at'>[]) => {
  const { data, error } = await supabase
    .from('financial_metrics')
    .upsert(
      metrics.map(metric => ({
        symbol: metric.symbol,
        date: metric.date,
        metric_type: metric.metric_type,
        value: metric.value
      })),
      { onConflict: 'symbol,date,metric_type' }
    );

  if (error) throw error;
  return data;
};

export const saveNewsSentiments = async (news: Omit<NewsSentiment, 'id' | 'created_at'>[]) => {
  const { data, error } = await supabase
    .from('news_sentiments')
    .upsert(
      news.map(item => ({
        symbol: item.symbol,
        date: item.date,
        title: item.title,
        summary: item.summary,
        sentiment_score: item.sentiment_score,
        source: item.source,
        url: item.url
      })),
      { onConflict: 'symbol,date,url' }
    );

  if (error) throw error;
  return data;
};
