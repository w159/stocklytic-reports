
import React from 'react';
import { Card } from "@/components/ui/card";
import { StockOverview } from '@/lib/api/stockAPI';
import TradingViewWidget from './TradingViewWidget';

interface CompanyOverviewProps {
  data: StockOverview;
  symbol: string;
}

const CompanyOverview = ({ data, symbol }: CompanyOverviewProps) => {
  return (
    <div className="space-y-6">
      <div className="w-full bg-black rounded-lg overflow-hidden shadow-lg">
        <TradingViewWidget symbol={symbol} />
      </div>
      
      <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-100">
        <div 
          className="tradingview-widget-container"
          style={{ height: '400px' }}
        >
          <iframe
            src={`https://www.tradingview.com/symbols/${symbol}/`}
            style={{ width: '100%', height: '100%' }}
            frameBorder="0"
            allowTransparency={true}
          />
        </div>
      </Card>
    </div>
  );
};

export default CompanyOverview;
