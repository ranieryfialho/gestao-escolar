import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const DoughnutChart = ({ chartData, chartOptions }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow h-full flex flex-col justify-center items-center">
      <Doughnut data={chartData} options={chartOptions} />
    </div>
  );
};

export default DoughnutChart;