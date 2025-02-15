
import sql from 'mssql';

const config: sql.config = {
  server: 'azvm-sql01.database.windows.net',
  database: 'AZURE-SQLDB01',
  user: 'SA-GWH',
  password: process.env.SQL_PASSWORD || '',
  options: {
    encrypt: true,
    trustServerCertificate: false,
    connectionTimeout: 30000
  }
};

let pool: sql.ConnectionPool | null = null;

export const getPool = async (): Promise<sql.ConnectionPool> => {
  if (!pool) {
    pool = await new sql.ConnectionPool(config).connect();
  }
  return pool;
};

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
  const pool = await getPool();
  const transaction = pool.transaction();
  
  try {
    await transaction.begin();
    
    for (const price of prices) {
      await transaction.request()
        .input('symbol', sql.VarChar, price.symbol)
        .input('date', sql.Date, new Date(price.date))
        .input('open', sql.Decimal(10, 4), price.open)
        .input('high', sql.Decimal(10, 4), price.high)
        .input('low', sql.Decimal(10, 4), price.low)
        .input('close', sql.Decimal(10, 4), price.close)
        .input('volume', sql.BigInt, price.volume)
        .query(`
          MERGE INTO stock_prices AS target
          USING (VALUES (@symbol, @date, @open, @high, @low, @close, @volume)) 
            AS source (symbol, date, open, high, low, close, volume)
          ON target.symbol = source.symbol AND target.date = source.date
          WHEN MATCHED THEN
            UPDATE SET 
              open = source.open,
              high = source.high,
              low = source.low,
              close = source.close,
              volume = source.volume
          WHEN NOT MATCHED THEN
            INSERT (symbol, date, open, high, low, close, volume)
            VALUES (source.symbol, source.date, source.open, source.high, source.low, source.close, source.volume);
        `);
    }
    
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const saveFinancialMetrics = async (metrics: Omit<FinancialMetric, 'id' | 'created_at'>[]) => {
  const pool = await getPool();
  const transaction = pool.transaction();
  
  try {
    await transaction.begin();
    
    for (const metric of metrics) {
      await transaction.request()
        .input('symbol', sql.VarChar, metric.symbol)
        .input('date', sql.Date, new Date(metric.date))
        .input('metric_type', sql.VarChar, metric.metric_type)
        .input('value', sql.Decimal(18, 6), metric.value)
        .query(`
          MERGE INTO financial_metrics AS target
          USING (VALUES (@symbol, @date, @metric_type, @value)) 
            AS source (symbol, date, metric_type, value)
          ON target.symbol = source.symbol 
            AND target.date = source.date 
            AND target.metric_type = source.metric_type
          WHEN MATCHED THEN
            UPDATE SET value = source.value
          WHEN NOT MATCHED THEN
            INSERT (symbol, date, metric_type, value)
            VALUES (source.symbol, source.date, source.metric_type, source.value);
        `);
    }
    
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const saveNewsSentiments = async (news: Omit<NewsSentiment, 'id' | 'created_at'>[]) => {
  const pool = await getPool();
  const transaction = pool.transaction();
  
  try {
    await transaction.begin();
    
    for (const item of news) {
      await transaction.request()
        .input('symbol', sql.VarChar, item.symbol)
        .input('date', sql.DateTime, new Date(item.date))
        .input('title', sql.NVarChar(sql.MAX), item.title)
        .input('summary', sql.NVarChar(sql.MAX), item.summary)
        .input('sentiment_score', sql.Decimal(5, 4), item.sentiment_score)
        .input('source', sql.VarChar(255), item.source)
        .input('url', sql.VarChar(2083), item.url)
        .query(`
          MERGE INTO news_sentiments AS target
          USING (VALUES (@symbol, @date, @title, @summary, @sentiment_score, @source, @url)) 
            AS source (symbol, date, title, summary, sentiment_score, source, url)
          ON target.symbol = source.symbol 
            AND target.date = source.date 
            AND target.url = source.url
          WHEN MATCHED THEN
            UPDATE SET 
              title = source.title,
              summary = source.summary,
              sentiment_score = source.sentiment_score,
              source = source.source
          WHEN NOT MATCHED THEN
            INSERT (symbol, date, title, summary, sentiment_score, source, url)
            VALUES (source.symbol, source.date, source.title, source.summary, source.sentiment_score, source.source, source.url);
        `);
    }
    
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
