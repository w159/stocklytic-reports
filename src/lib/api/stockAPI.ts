import axios from 'axios';

const BASE_URL = 'https://www.alphavantage.co/query';

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

const getApiKey = (): string => {
  const apiKey = localStorage.getItem('alphavantage_api_key');
  if (!apiKey) {
    throw new Error('API key not found');
  }
  return apiKey;
};

const processTimeSeriesResponse = (data: any): TimeSeriesData[] => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid API response format');
  }

  if (data.Information && data.Information.includes('demo')) {
    throw new Error('Invalid API key. Please use a valid Alpha Vantage API key');
  }

  if (data.Error) {
    throw new Error(`API Error: ${data.Error}`);
  }

  if (!data['Time Series (Daily)']) {
    throw new Error('No time series data available');
  }

  const timeSeries = data['Time Series (Daily)'];
  return Object.entries(timeSeries).map(([date, values]: [string, any]) => {
    if (!values || typeof values !== 'object') {
      throw new Error(`Invalid data format for date ${date}`);
    }

    const open = Number(values['1. open']);
    const high = Number(values['2. high']);
    const low = Number(values['3. low']);
    const close = Number(values['4. close']);
    const volume = Number(values['5. volume']);
    const adjClose = Number(values['5. adjusted close'] || values['4. close']);

    if ([open, high, low, close, volume, adjClose].some(isNaN)) {
      throw new Error(`Invalid numeric data for date ${date}`);
    }

    return {
      date,
      open,
      high,
      low,
      close,
      volume,
      adjClose
    };
  });
};

export const getStockOverview = async (symbol: string): Promise<StockOverview> => {
  if (!symbol) {
    throw new Error('Symbol is required');
  }

  try {
    const apiKey = getApiKey();
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'OVERVIEW',
        symbol,
        apikey: apiKey
      }
    });

    if (!response.data || Object.keys(response.data).length === 0) {
      throw new Error('No data returned from API');
    }

    if (response.data.Note && response.data.Note.includes('API call frequency')) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }

    if (!response.data.Symbol || !response.data.Name) {
      throw new Error('Invalid company overview data format');
    }

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
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'TIME_SERIES_DAILY_ADJUSTED',
        symbol,
        outputsize: 'compact',
        apikey: apiKey
      }
    });

    if (response.data.Note && response.data.Note.includes('API call frequency')) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }

    return processTimeSeriesResponse(response.data);
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

export const calculateTechnicalIndicators = (data: TimeSeriesData[]) => {
  if (!data || data.length === 0) return null;

  const prices = data.map(d => d.close);
  const volumes = data.map(d => d.volume);

  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  const sma200 = calculateSMA(prices, 200);

  const rsi = calculateRSI(prices);

  const macd = calculateMACD(prices);

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

  const numericPrices = prices.map(price => typeof price === 'string' ? parseFloat(price) : price);

  for (let i = 1; i < numericPrices.length; i++) {
    const difference = numericPrices[i] - numericPrices[i - 1];
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

      const oldDiff = numericPrices[i - period + 1] - numericPrices[i - period];
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

  const numericData = data.map(value => typeof value === 'string' ? parseFloat(value) : value);

  let smaFirst = numericData.slice(0, period).reduce((a, b) => a + b, 0) / period;
  ema.push(smaFirst);

  for (let i = period; i < numericData.length; i++) {
    ema.push((numericData[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]);
  }

  return ema;
};
