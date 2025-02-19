
import React, { useState } from 'react';
import { Calendar, NewspaperIcon, TrendingUp, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { NewsItem } from '@/lib/api/stockAPI';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NewsAnalysisProps {
  symbol: string;
}

const TIME_FRAMES = {
  '1M': 1,
  '3M': 3,
  '6M': 6,
  '1Y': 12,
  'ALL': 0
} as const;

type TimeFrame = keyof typeof TIME_FRAMES;

const NewsAnalysis = ({ symbol }: NewsAnalysisProps) => {
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('6M');

  const { data: news, isLoading, error } = useQuery({
    queryKey: ['news', symbol],
    queryFn: async () => {
      // Placeholder for actual news data fetching
      return [] as NewsItem[];
    },
    enabled: !!symbol,
  });

  const formatDate = (dateString: string) => {
    // The API returns dates in format "YYYYMMDDTHHMM" or "YYYYMMDD"
    // First, standardize the format by adding time if it's not present
    let standardDate = dateString;
    if (dateString.length === 8) {
      standardDate = `${dateString}T0000`;
    }
    
    // Convert to YYYY-MM-DDTHH:MM format for Date constructor
    const year = standardDate.substring(0, 4);
    const month = standardDate.substring(4, 6);
    const day = standardDate.substring(6, 8);
    const hour = standardDate.substring(9, 11);
    const minute = standardDate.substring(11, 13);
    
    const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDateFromString = (dateString: string) => {
    const standardDate = dateString.length === 8 ? `${dateString}T0000` : dateString;
    const year = standardDate.substring(0, 4);
    const month = standardDate.substring(4, 6);
    const day = standardDate.substring(6, 8);
    const hour = standardDate.substring(9, 11);
    const minute = standardDate.substring(11, 13);
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-gray-900 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error instanceof Error ? error.message : 'Failed to load news'}
      </div>
    );
  }

  if (!news || news.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No news available for {symbol}
      </div>
    );
  }

  // Calculate cutoff date based on selected time frame
  const cutoffDate = new Date();
  if (TIME_FRAMES[selectedTimeFrame] > 0) {
    cutoffDate.setMonth(cutoffDate.getMonth() - TIME_FRAMES[selectedTimeFrame]);
  }

  // Filter and sort news articles
  const sortedNews = [...news]
    .filter(item => {
      if (selectedTimeFrame === 'ALL') return true;
      const articleDate = getDateFromString(item.time_published);
      return articleDate >= cutoffDate;
    })
    .sort((a, b) => {
      const dateA = getDateFromString(a.time_published);
      const dateB = getDateFromString(b.time_published);
      return dateB.getTime() - dateA.getTime();
    });

  if (sortedNews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No news available for {symbol} in the selected time period
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end space-x-2 mb-4">
        {Object.keys(TIME_FRAMES).map((timeFrame) => (
          <Button
            key={timeFrame}
            variant={selectedTimeFrame === timeFrame ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTimeFrame(timeFrame as TimeFrame)}
          >
            {timeFrame}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedNews.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <NewspaperIcon className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-600">{item.source}</span>
              </div>
              <span className="text-sm text-gray-500">
                {formatDate(item.time_published)}
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
            <p className="text-gray-600 text-sm mb-4">{item.summary}</p>
            {item.ticker_sentiment && item.ticker_sentiment.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {item.ticker_sentiment.map((sentiment, idx) => (
                  <Badge 
                    key={idx}
                    variant={Number(sentiment.ticker_sentiment_score) > 0 ? "default" : "destructive"}
                  >
                    {sentiment.ticker}: {Number(sentiment.ticker_sentiment_score).toFixed(2)}
                  </Badge>
                ))}
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm"
              className="w-full"
              onClick={() => window.open(item.url, '_blank')}
            >
              Read More <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsAnalysis;
