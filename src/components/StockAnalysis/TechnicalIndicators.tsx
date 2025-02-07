
import React from 'react';
import { Card } from "@/components/ui/card";
import { TimeSeriesData } from '@/lib/api/stockAPI';

interface TechnicalIndicatorsProps {
  data: TimeSeriesData[];
}

const TechnicalIndicators = ({ data }: TechnicalIndicatorsProps) => {
  const closePrices = data.map(d => d.close);
  
  // Calculate RSI
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
  
  // Calculate Moving Averages
  const calculateMA = (prices: number[], period: number): number => {
    if (prices.length < period) return 0;
    return prices.slice(0, period).reduce((a, b) => a + b) / period;
  };

  const rsi = calculateRSI(closePrices);
  const ma20 = calculateMA(closePrices, 20);
  const ma50 = calculateMA(closePrices, 50);
  const ma200 = calculateMA(closePrices, 200);
  
  // Calculate MACD
  const calculateMACD = (prices: number[]): { macd: number; signal: number; histogram: number } => {
    const ema12 = calculateMA(prices, 12);
    const ema26 = calculateMA(prices, 26);
    const macd = ema12 - ema26;
    const signal = calculateMA([macd], 9);
    return {
      macd,
      signal,
      histogram: macd - signal
    };
  };

  const macdData = calculateMACD(closePrices);
  const currentPrice = closePrices[0];

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
          label="MACD" 
          value={macdData.macd.toFixed(2)} 
          interpretation={macdData.macd > macdData.signal ? 'Bullish' : 'Bearish'}
        />
        <InfoItem 
          label="20-Day MA" 
          value={`$${ma20.toFixed(2)}`}
          interpretation={currentPrice > ma20 ? 'Above MA' : 'Below MA'} 
        />
        <InfoItem 
          label="50-Day MA" 
          value={`$${ma50.toFixed(2)}`}
          interpretation={currentPrice > ma50 ? 'Above MA' : 'Below MA'}
        />
        <InfoItem 
          label="200-Day MA" 
          value={`$${ma200.toFixed(2)}`}
          interpretation={currentPrice > ma200 ? 'Above MA' : 'Below MA'}
        />
        <InfoItem 
          label="MACD Signal" 
          value={macdData.signal.toFixed(2)}
          interpretation={macdData.histogram > 0 ? 'Positive' : 'Negative'}
        />
        <InfoItem 
          label="MACD Histogram" 
          value={macdData.histogram.toFixed(2)}
          interpretation={macdData.histogram > 0 ? 'Bullish' : 'Bearish'}
        />
        <InfoItem 
          label="Trend" 
          value={currentPrice > ma200 ? 'Bullish' : 'Bearish'}
          interpretation={`${((currentPrice - ma200) / ma200 * 100).toFixed(2)}% from 200 MA`}
        />
      </div>
    </Card>
  );
};

const InfoItem = ({ label, value, interpretation }: { label: string; value: string | number; interpretation: string }) => (
  <div className="space-y-1">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-medium">{value}</p>
    <p className="text-sm text-gray-600">{interpretation}</p>
  </div>
);

export default TechnicalIndicators;
