
export interface TickerSentiment {
  ticker: string;
  ticker_sentiment_score: string;
}

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
  SharesOutstanding: string;
  SharesFloat: string;
  QuarterlyRevenueGrowthYOY: string;
  QuarterlyEarningsGrowthYOY: string;
  ProfitMargin: string;
  PriceToSalesRatio: string;
  PriceToBookRatio: string;
  EVToEBITDA: string;
}

export interface TimeSeriesData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsItem {
  title: string;
  url: string;
  time_published: string;
  authors: string[];
  summary: string;
  source: string;
  ticker_sentiment?: TickerSentiment[]; // Make it optional since not all news items might have sentiment
}
