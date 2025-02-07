
import axios from 'axios';

// Free tier API from Alpha Vantage
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
}

export interface TimeSeriesData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const getStockOverview = async (symbol: string): Promise<StockOverview> => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'OVERVIEW',
        symbol,
        apikey: API_KEY
      }
    });
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
        function: 'TIME_SERIES_DAILY',
        symbol,
        outputsize: 'compact',
        apikey: API_KEY
      }
    });

    const timeSeries = response.data['Time Series (Daily)'];
    return Object.entries(timeSeries).map(([date, data]: [string, any]) => ({
      date,
      open: parseFloat(data['1. open']),
      high: parseFloat(data['2. high']),
      low: parseFloat(data['3. low']),
      close: parseFloat(data['4. close']),
      volume: parseFloat(data['5. volume'])
    }));
  } catch (error) {
    console.error('Error fetching time series data:', error);
    throw error;
  }
};
