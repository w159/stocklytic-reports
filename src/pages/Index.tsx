
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import SearchBar from '@/components/StockAnalysis/SearchBar';
import StockChart from '@/components/StockAnalysis/StockChart';
import KeyMetrics from '@/components/StockAnalysis/KeyMetrics';
import CompanyOverview from '@/components/StockAnalysis/CompanyOverview';
import TechnicalIndicators from '@/components/StockAnalysis/TechnicalIndicators';
import { getStockOverview, getTimeSeriesDaily } from '@/lib/api/stockAPI';
import { toast } from '@/components/ui/use-toast';

const Index = () => {
  const [symbol, setSymbol] = useState<string>('');

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['stockOverview', symbol],
    queryFn: () => getStockOverview(symbol),
    enabled: !!symbol,
    retry: false,
    meta: {
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to fetch company overview. Please try again.",
          variant: "destructive"
        });
      }
    }
  });

  const { data: timeSeriesData, isLoading: timeSeriesLoading } = useQuery({
    queryKey: ['timeSeries', symbol],
    queryFn: () => getTimeSeriesDaily(symbol),
    enabled: !!symbol,
    retry: false,
    meta: {
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to fetch price data. Please try again.",
          variant: "destructive"
        });
      }
    }
  });

  const handleSearch = async (newSymbol: string) => {
    setSymbol(newSymbol.toUpperCase());
  };

  const isLoading = overviewLoading || timeSeriesLoading;
  const chartData = timeSeriesData ? {
    labels: timeSeriesData.map(d => d.date),
    prices: timeSeriesData.map(d => d.close),
  } : undefined;

  const metrics = overview ? {
    marketCap: overview.MarketCapitalization,
    pe: parseFloat(overview.PERatio),
    eps: parseFloat(overview.EPS),
    dividend: parseFloat(overview.DividendYield) / 100,
    beta: parseFloat(overview.Beta),
  } : undefined;

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

          {symbol && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-gray-900 border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading data...</p>
                </div>
              ) : (
                <>
                  {overview && <CompanyOverview data={overview} />}
                  {metrics && <KeyMetrics metrics={metrics} />}
                  {timeSeriesData && <TechnicalIndicators data={timeSeriesData} />}
                  {chartData && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 p-6">
                      <h2 className="text-xl font-semibold mb-4">Price History</h2>
                      <StockChart data={chartData} />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
