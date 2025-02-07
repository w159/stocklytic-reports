
import axios from 'axios';

const BASE_URL = 'https://www.alphavantage.co/query';
const API_KEY = 'demo'; // Replace with actual API key

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

export interface FinancialMetrics {
  eps: number;
  revenue: number;
  profitMargin: number;
  operatingMargin: number;
  debtToEquity: number;
  currentRatio: number;
  quickRatio: number;
  returnOnEquity: number;
  returnOnAssets: number;
}

const processTimeSeriesResponse = (data: any): TimeSeriesData[] => {
  if (!data || !data['Time Series (Daily)']) {
    throw new Error('Invalid time series data structure');
  }

  const timeSeries = data['Time Series (Daily)'];
  return Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
    date,
    open: parseFloat(values['1. open']),
    high: parseFloat(values['2. high']),
    low: parseFloat(values['3. low']),
    close: parseFloat(values['4. close']),
    volume: parseFloat(values['5. volume']),
    adjClose: parseFloat(values['5. adjusted close'] || values['4. close'])
  }));
};

export const getStockOverview = async (symbol: string): Promise<StockOverview> => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'OVERVIEW',
        symbol,
        apikey: API_KEY
      }
    });

    if (!response.data || Object.keys(response.data).length === 0) {
      throw new Error('No data returned from API');
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching stock overview:', error);
    throw error;
  }
};

export const getTimeSeriesDaily = async (symbol: string): Promise<TimeSeriesData[]> => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'TIME_SERIES_DAILY_ADJUSTED',
        symbol,
        outputsize: 'compact',
        apikey: API_KEY
      }
    });

    if (!response.data || !response.data['Time Series (Daily)']) {
      throw new Error('Invalid time series data structure');
    }

    return processTimeSeriesResponse(response.data);
  } catch (error) {
    console.error('Error fetching time series data:', error);
    throw error;
  }
};

export const calculateTechnicalIndicators = (data: TimeSeriesData[]) => {
  if (!data || data.length === 0) return null;

  const prices = data.map(d => d.close);
  const volumes = data.map(d => d.volume);

  // Calculate Simple Moving Averages
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  const sma200 = calculateSMA(prices, 200);

  // Calculate RSI
  const rsi = calculateRSI(prices);

  // Calculate MACD
  const macd = calculateMACD(prices);

  // Calculate Volume Moving Average
  const volumeSMA = calculateSMA(volumes, 20);

  return {
    sma20: sma20[sma20.length - 1],
    sma50: sma50[sma50.length - 1],
    sma200: sma200[sma200.length - 1],
    rsi: rsi[rsi.length - 1],
    macd: macd.macdLine[macd.macdLine.length - 1],
    macdSignal: macd.signalLine[macd.signalLine.length - 1],
    volumeSMA: volumeSMA[volumeSMA.length - 1]
  };
};

// Technical Analysis Helper Functions
const calculateSMA = (data: number[], period: number): number[] => {
  const sma = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return sma;
};

const calculateRSI = (prices: number[], period: number = 14): number[] => {
  const rsi = [];
  let gains = 0;
  let losses = 0;

  for (let i = 1; i < prices.length; i++) {
    const difference = prices[i] - prices[i - 1];
    if (difference >= 0) {
      gains += difference;
    } else {
      losses -= difference;
    }

    if (i >= period) {
      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));

      const oldDiff = prices[i - period + 1] - prices[i - period];
      if (oldDiff >= 0) {
        gains -= oldDiff;
      } else {
        losses += oldDiff;
      }
    }
  }

  return rsi;
};

const calculateMACD = (prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) => {
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  const macdLine = fastEMA.map((fast, i) => fast - slowEMA[i]);
  const signalLine = calculateEMA(macdLine, signalPeriod);

  return {
    macdLine,
    signalLine,
    histogram: macdLine.map((macd, i) => macd - signalLine[i])
  };
};

const calculateEMA = (data: number[], period: number): number[] => {
  const ema = [];
  const multiplier = 2 / (period + 1);

  // Start with SMA
  let smaFirst = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  ema.push(smaFirst);

  // Calculate EMA
  for (let i = period; i < data.length; i++) {
    ema.push((data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]);
  }

  return ema;
};

