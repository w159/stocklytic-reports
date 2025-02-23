
import React, { useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import TradingViewWidget from './TradingViewWidget';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CompanyOverviewProps {
  symbol: string;
}

const CompanyOverview = ({ symbol }: CompanyOverviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: "100%",
      height: "400px",
      isTransparent: false,
      colorTheme: "dark",
      symbol: `${symbol}`,
      locale: "en"
    });

    const widgetContainer = containerRef.current.querySelector('.tradingview-widget-container__widget');
    if (widgetContainer) {
      widgetContainer.appendChild(script);
    }

    return () => {
      if (widgetContainer) {
        const scriptElement = widgetContainer.querySelector('script');
        if (scriptElement) {
          scriptElement.remove();
        }
      }
    };
  }, [symbol]);

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Live market data is provided by TradingView. For the most comprehensive and up-to-date analysis, refer to financial websites like Yahoo Finance.
        </AlertDescription>
      </Alert>

      <Card className="p-6 bg-black border-gray-800">
        <div className="tradingview-widget-container" ref={containerRef}>
          <div className="tradingview-widget-container__widget"></div>
          <div className="tradingview-widget-copyright">
            <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
              <span className="text-blue-500">Track all markets on TradingView</span>
            </a>
          </div>
        </div>
      </Card>
      
      <div className="w-full bg-black rounded-lg overflow-hidden shadow-lg">
        <TradingViewWidget symbol={symbol} />
      </div>
    </div>
  );
};

export default CompanyOverview;
