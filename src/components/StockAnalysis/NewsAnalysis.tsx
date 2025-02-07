
import React from 'react';
import { Calendar, NewspaperIcon, TrendingUp } from 'lucide-react';

interface NewsItem {
  title: string;
  date: string;
  source: string;
  type: 'news' | 'analysis' | 'market';
  summary: string;
}

const mockNews: NewsItem[] = [
  {
    title: "Quarterly Earnings Beat Expectations",
    date: new Date().toLocaleDateString(),
    source: "Financial Times",
    type: "news",
    summary: "Company reported strong quarterly results, exceeding analyst estimates across key metrics."
  },
  {
    title: "Market Analysis: Industry Trends",
    date: new Date().toLocaleDateString(),
    source: "Bloomberg",
    type: "analysis",
    summary: "In-depth analysis of current market conditions and their potential impact on company performance."
  },
  {
    title: "Market Position Strengthens",
    date: new Date().toLocaleDateString(),
    source: "Reuters",
    type: "market",
    summary: "Company shows improved market positioning against competitors in key segments."
  }
];

const NewsAnalysis = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockNews.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {item.type === 'news' && <NewspaperIcon className="h-5 w-5 text-blue-500" />}
                {item.type === 'analysis' && <TrendingUp className="h-5 w-5 text-green-500" />}
                {item.type === 'market' && <Calendar className="h-5 w-5 text-purple-500" />}
                <span className="text-sm font-medium text-gray-600">{item.source}</span>
              </div>
              <span className="text-sm text-gray-500">{item.date}</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
            <p className="text-gray-600 text-sm">{item.summary}</p>
          </div>
        ))}
      </div>
      
      <div className="text-center mt-8">
        <p className="text-sm text-gray-500">
          Note: This is a demo view. Integration with real-time news APIs coming soon.
        </p>
      </div>
    </div>
  );
};

export default NewsAnalysis;
