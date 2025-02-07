
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import SearchBar from '@/components/StockAnalysis/SearchBar';
import StockChart from '@/components/StockAnalysis/StockChart';
import KeyMetrics from '@/components/StockAnalysis/KeyMetrics';
import CompanyOverview from '@/components/StockAnalysis/CompanyOverview';
import TechnicalIndicators from '@/components/StockAnalysis/TechnicalIndicators';
import { getStockOverview, getTimeSeriesDaily } from '@/lib/api/stockAPI';
import { toast } from '@/components/ui/use-toast';

const Index = () => {
  const [symbol, setSymbol] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [isKeyValid, setIsKeyValid] = useState<boolean>(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('alphavantage_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      setIsKeyValid(true);
    }
  }, []);

  const handleApiKeySubmit = () => {
    if (apiKey.trim()) {
      localStorage.setItem('alphavantage_api_key', apiKey.trim());
      setIsKeyValid(true);
      toast({
        title: "Success",
        description: "API key has been saved",
      });
    }
  };

  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ['stockOverview', symbol],
    queryFn: () => getStockOverview(symbol),
    enabled: !!symbol && isKeyValid,
    retry: false,
    meta: {
      errorMessage: "Failed to fetch company overview. Please try again.",
    }
  });

  const { data: timeSeriesData, isLoading: timeSeriesLoading, error: timeSeriesError } = useQuery({
    queryKey: ['timeSeries', symbol],
    queryFn: () => getTimeSeriesDaily(symbol),
    enabled: !!symbol && isKeyValid,
    retry: false,
    meta: {
      errorMessage: "Failed to fetch price data. Please try again.",
    }
  });

  const handleSearch = async (newSymbol: string) => {
    if (!newSymbol.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid stock symbol",
        variant: "destructive"
      });
      return;
    }
    setSymbol(newSymbol.toUpperCase());
  };

  React.useEffect(() => {
    if (overviewError) {
      toast({
        title: "Error",
        description: overviewError instanceof Error ? overviewError.message : "Failed to fetch company overview",
        variant: "destructive"
      });
    }
    if (timeSeriesError) {
      toast({
        title: "Error",
        description: timeSeriesError instanceof Error ? timeSeriesError.message : "Failed to fetch price data",
        variant: "destructive"
      });
    }
  }, [overviewError, timeSeriesError]);

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

  if (!isKeyValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full space-y-4">
          <h2 className="text-2xl font-bold text-center">Alpha Vantage API Key Required</h2>
          <p className="text-gray-600 text-center">Please enter your Alpha Vantage API key to continue</p>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <Button 
              className="w-full"
              onClick={handleApiKeySubmit}
              disabled={!apiKey.trim()}
            >
              Save API Key
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
                        <p className="text-gray-600">Portfolio analysis features coming soon...</p>
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
                      <p className="text-gray-600">News and analysis features coming soon...</p>
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
