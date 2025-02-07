
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
            <h1 className="text-4xl font-bold text-gray-900">Comprehensive Stock Analysis Dashboard</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Complete financial analysis and market data for informed investment decisions
            </p>
          </div>

          <SearchBar onSearch={handleSearch} />

          {symbol && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-gray-900 border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading comprehensive analysis...</p>
                </div>
              ) : (
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="price">Price Performance</TabsTrigger>
                    <TabsTrigger value="portfolio">Portfolio & Management</TabsTrigger>
                    <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
                    <TabsTrigger value="technical">Technical Analysis</TabsTrigger>
                    <TabsTrigger value="news">News & Reviews</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-6">
                    {overview && <CompanyOverview data={overview} />}
                  </TabsContent>

                  <TabsContent value="price" className="mt-6">
                    {chartData && (
                      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 p-6">
                        <h2 className="text-xl font-semibold mb-4">Price History</h2>
                        <StockChart data={chartData} />
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="portfolio" className="mt-6">
                    {overview && (
                      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 p-6">
                        <h2 className="text-xl font-semibold mb-4">Portfolio Analysis</h2>
                        {/* Add portfolio management content here */}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="metrics" className="mt-6">
                    {metrics && <KeyMetrics metrics={metrics} />}
                  </TabsContent>

                  <TabsContent value="technical" className="mt-6">
                    {timeSeriesData && <TechnicalIndicators data={timeSeriesData} />}
                  </TabsContent>

                  <TabsContent value="news" className="mt-6">
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 p-6">
                      <h2 className="text-xl font-semibold mb-4">News & Analysis</h2>
                      {/* Add news and reviews content here */}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
