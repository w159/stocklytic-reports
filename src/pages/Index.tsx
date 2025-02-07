
import React, { useState } from 'react';
import SearchBar from '@/components/StockAnalysis/SearchBar';
import StockChart from '@/components/StockAnalysis/StockChart';
import KeyMetrics from '@/components/StockAnalysis/KeyMetrics';
import { Card } from "@/components/ui/card";
import axios from 'axios';

const DUMMY_DATA = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  prices: [150, 155, 160, 145, 165, 170],
};

const DUMMY_METRICS = {
  marketCap: '$2.5T',
  pe: 28.5,
  eps: 6.15,
  dividend: 0.0065,
  volume: '62.5M',
};

const Index = () => {
  const [searchInitiated, setSearchInitiated] = useState(false);

  const handleSearch = async (symbol: string) => {
    setSearchInitiated(true);
    // TODO: Replace with actual API call
    console.log('Searching for:', symbol);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">Stock Analysis Dashboard</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Enter a stock symbol to view detailed financial analysis and real-time market data
            </p>
          </div>

          <SearchBar onSearch={handleSearch} />

          {searchInitiated && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <KeyMetrics metrics={DUMMY_METRICS} />
              
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-100">
                <h2 className="text-xl font-semibold mb-4">Price History</h2>
                <StockChart data={DUMMY_DATA} />
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
