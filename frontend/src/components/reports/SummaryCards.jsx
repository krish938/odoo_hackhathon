import React from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import { TrendingUp, ShoppingCart, Users, Package } from 'lucide-react';

function MetricCard({ title, value, icon, color, trend, subtext }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg text-white ${color}`}>
          {icon}
        </div>
        {trend != null && (
          <div
            className={`flex items-center text-sm ${
              trend > 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-600">{title}</div>
        {subtext ? <div className="text-xs text-gray-500 mt-1">{subtext}</div> : null}
      </div>
    </div>
  );
}

const SummaryCards = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Revenue"
        value={formatCurrency(metrics.totalRevenue || 0)}
        icon={<Package className="h-6 w-6" />}
        color="bg-green-500"
        trend={metrics.revenueGrowth}
      />

      <MetricCard
        title="Total Orders"
        value={metrics.totalOrders || 0}
        icon={<ShoppingCart className="h-6 w-6" />}
        color="bg-blue-500"
        trend={metrics.ordersGrowth}
      />

      <MetricCard
        title="Active Sessions"
        value={metrics.activeSessions || 0}
        icon={<Users className="h-6 w-6" />}
        color="bg-purple-500"
      />

      <MetricCard
        title="Top Product"
        value={metrics.topProduct?.name || 'N/A'}
        subtext={metrics.topProduct?.sales ? `${metrics.topProduct.sales} sold` : ''}
        icon={<Package className="h-6 w-6" />}
        color="bg-orange-500"
      />
    </div>
  );
};

export default SummaryCards;
