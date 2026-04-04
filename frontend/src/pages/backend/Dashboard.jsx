import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { formatCurrency, formatDate } from '../../utils/formatCurrency';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  Calendar,
} from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/reports/summary');
      setData(response.data?.data ?? response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const recentOrders = data?.recentOrders || [];
  const revenueData = data?.revenueChart || [];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your business overview.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue || 0)}
          icon={<DollarSign className="h-6 w-6" />}
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
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

        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Stats
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Order Value</span>
              <span className="font-semibold">
                {formatCurrency(metrics.averageOrderValue || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Today's Orders</span>
              <span className="font-semibold">{metrics.todayOrders || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Today's Revenue</span>
              <span className="font-semibold">
                {formatCurrency(metrics.todayRevenue || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Customers</span>
              <span className="font-semibold">{metrics.totalCustomers || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Orders
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.table?.table_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge>{order.status}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No recent orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, subtext, icon, color, trend }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg text-white ${color}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center text-sm ${
            trend > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className="h-4 w-4 mr-1" />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-600">{title}</div>
        {subtext && (
          <div className="text-xs text-gray-500 mt-1">{subtext}</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
