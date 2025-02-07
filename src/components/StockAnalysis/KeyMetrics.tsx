
import { Card } from "@/components/ui/card";

interface KeyMetricsProps {
  metrics: {
    marketCap?: string;
    pe?: number;
    eps?: number;
    dividend?: number;
    volume?: string;
  };
}

const KeyMetrics = ({ metrics }: KeyMetricsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <MetricCard title="Market Cap" value={metrics.marketCap || 'N/A'} />
      <MetricCard title="P/E Ratio" value={metrics.pe?.toFixed(2) || 'N/A'} />
      <MetricCard title="EPS" value={metrics.eps?.toFixed(2) || 'N/A'} />
      <MetricCard title="Dividend Yield" value={metrics.dividend ? `${(metrics.dividend * 100).toFixed(2)}%` : 'N/A'} />
      <MetricCard title="Volume" value={metrics.volume || 'N/A'} />
    </div>
  );
};

const MetricCard = ({ title, value }: { title: string; value: string | number }) => (
  <Card className="p-4 bg-white/80 backdrop-blur-sm border-gray-100">
    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    <p className="text-lg font-semibold mt-1">{value}</p>
  </Card>
);

export default KeyMetrics;
