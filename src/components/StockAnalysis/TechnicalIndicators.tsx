
import React from 'react';
import { Card } from "@/components/ui/card";
import { TimeSeriesData } from '@/lib/api/stockAPI';

interface TechnicalIndicatorsProps {
  data: TimeSeriesData[];
}

const TechnicalIndicators = ({ data }: TechnicalIndicatorsProps) => {
  // Calculate RSI, MACD, and other technical indicators
  const calculateRSI = (prices: number[], periods: number = 14): number => {
    if (prices.length < periods) return 0;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i < periods; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference >= 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }
    
    const avgGain = gains / periods;
    const avgLoss = losses / periods;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  const closePrices = data.map(d => d.close);
  const rsi = calculateRSI(closePrices);
  
  // Calculate 50-day moving average
  const ma50 = closePrices.length >= 50 
    ? closePrices.slice(0, 50).reduce((a, b) => a + b) / 50 
    : null;

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-100">
      <h2 className="text-xl font-semibold mb-4">Technical Indicators</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoItem 
          label="RSI (14)" 
          value={rsi.toFixed(2)} 
          interpretation={rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral'}
        />
        <InfoItem 
          label="50-Day MA" 
          value={ma50 ? `$${ma50.toFixed(2)}` : 'N/A'} 
          interpretation={ma50 && closePrices[0] > ma50 ? 'Above MA' : 'Below MA'}
        />
      </div>
    </Card>
  );
};

const InfoItem = ({ label, value, interpretation }: { label: string; value: string; interpretation: string }) => (
  <div className="space-y-1">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-medium">{value}</p>
    <p className="text-sm text-gray-600">{interpretation}</p>
  </div>
);

export default TechnicalIndicators;
