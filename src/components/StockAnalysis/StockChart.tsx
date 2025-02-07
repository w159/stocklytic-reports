
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface StockChartProps {
  data: {
    labels: string[];
    prices: number[];
  };
}

const StockChart = ({ data }: StockChartProps) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Stock Price',
        data: data.prices,
        borderColor: 'rgb(75, 85, 99)',
        backgroundColor: 'rgba(75, 85, 99, 0.5)',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
  };

  return (
    <div className="w-full h-[400px] p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 shadow-sm">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default StockChart;
