
import React from 'react';
import { Calendar, NewspaperIcon, TrendingUp, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getNewsData, type NewsItem } from '@/lib/api/stockAPI';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NewsAnalysisProps {
  symbol: string;
}

const NewsAnalysis = ({ symbol }: NewsAnalysisProps) => {
  const { data: news, isLoading, error } = useQuery({
    queryKey: ['news', symbol],
    queryFn: () => getNewsData(symbol),
    enabled: !!symbol,
  });

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((item, index) => (
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
                {new Date(item.time_published).toLocaleDateString()}
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
            <p className="text-gray-600 text-sm mb-4">{item.summary}</p>
            {item.ticker_sentiment && (
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
