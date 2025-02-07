
import React from 'react';
import { Card } from '@/components/ui/card';
import type { StockOverview } from '@/lib/api/stockAPI';

interface PortfolioManagementProps {
  data: StockOverview;
}

const PortfolioManagement = ({ data }: PortfolioManagementProps) => {
  const formatMarketCap = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 'N/A';
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toFixed(2)}`;
  };

  const formatPercentage = (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) ? 'N/A' : `${num.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Market Position</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Market Cap</p>
              <p className="text-lg font-medium">{formatMarketCap(data.MarketCapitalization)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Shares Outstanding</p>
              <p className="text-lg font-medium">{formatMarketCap(data.SharesOutstanding)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Float Shares</p>
              <p className="text-lg font-medium">{formatMarketCap(data.SharesFloat)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Growth & Performance</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Quarterly Revenue Growth (YoY)</p>
              <p className="text-lg font-medium">{formatPercentage(data.QuarterlyRevenueGrowthYOY)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Quarterly Earnings Growth (YoY)</p>
              <p className="text-lg font-medium">{formatPercentage(data.QuarterlyEarningsGrowthYOY)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Profit Margin</p>
              <p className="text-lg font-medium">{formatPercentage(data.ProfitMargin)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Financial Ratios</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Price to Sales</p>
              <p className="text-lg font-medium">{data.PriceToSalesRatio}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Price to Book</p>
              <p className="text-lg font-medium">{data.PriceToBookRatio}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">EV/EBITDA</p>
              <p className="text-lg font-medium">{data.EVToEBITDA}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PortfolioManagement;
