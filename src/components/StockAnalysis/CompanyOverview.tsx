
import React from 'react';
import { Card } from "@/components/ui/card";
import { StockOverview } from '@/lib/api/stockAPI';

interface CompanyOverviewProps {
  data: StockOverview;
}

const CompanyOverview = ({ data }: CompanyOverviewProps) => {
  return (
    <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-100">
      <h2 className="text-2xl font-semibold mb-4">{data.Name} ({data.Symbol})</h2>
      <div className="space-y-4">
        <p className="text-gray-600">{data.Description}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <InfoItem label="Sector" value={data.Sector} />
          <InfoItem label="Industry" value={data.Industry} />
          <InfoItem label="52 Week High" value={data.WeekHigh52} />
          <InfoItem label="52 Week Low" value={data.WeekLow52} />
        </div>
      </div>
    </Card>
  );
};

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
);

export default CompanyOverview;
