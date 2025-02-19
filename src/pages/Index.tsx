
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import SearchBar from '@/components/StockAnalysis/SearchBar';
import CompanyOverview from '@/components/StockAnalysis/CompanyOverview';
import TechnicalIndicators from '@/components/StockAnalysis/TechnicalIndicators';
import NewsAnalysis from '@/components/StockAnalysis/NewsAnalysis';
import PortfolioManagement from '@/components/StockAnalysis/PortfolioManagement';
import AIChat from '@/components/StockAnalysis/AIChat';

const Index = () => {
  const [symbol, setSymbol] = React.useState<string>('');

  const handleSearch = async (newSymbol: string) => {
    if (!newSymbol.trim()) return;
    setSymbol(newSymbol.toUpperCase());
  };

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
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="portfolio">Portfolio & Management</TabsTrigger>
                  <TabsTrigger value="technical">Technical Analysis</TabsTrigger>
                  <TabsTrigger value="news">News & Reviews</TabsTrigger>
                  <TabsTrigger value="ai">AI Assistant</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                  <CompanyOverview symbol={symbol} />
                </TabsContent>

                <TabsContent value="portfolio" className="mt-6">
                  <PortfolioManagement data={{} as any} />
                </TabsContent>

                <TabsContent value="technical" className="mt-6">
                  <TechnicalIndicators data={[]} />
                </TabsContent>

                <TabsContent value="news" className="mt-6">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 p-6">
                    <h2 className="text-xl font-semibold mb-4">News & Analysis</h2>
                    {symbol && <NewsAnalysis symbol={symbol} />}
                  </div>
                </TabsContent>

                <TabsContent value="ai" className="mt-6">
                  <AIChat />
                </TabsContent>
              </Tabs>
            </div>
          )}
          {!symbol && (
            <div className="mt-8">
              <AIChat />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
