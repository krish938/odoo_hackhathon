import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/formatCurrency';

const RevenueChart = ({ data }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Revenue (Last 7 Days)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip
            formatter={(value) => [formatCurrency(value), 'Revenue']}
          />
          <Bar dataKey="revenue" fill="#2563EB" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
