import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { formatCurrency, formatDate } from '../../utils/formatCurrency';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Calendar,
  Download,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Users,
} from 'lucide-react';

const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    from_date: '',
    to_date: '',
    session_id: '',
    user_id: '',
    product_id: '',
  });
  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchReports();
    fetchFilters();
  }, [filters]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const [summaryRes, ordersRes] = await Promise.all([
        api.get(`/api/reports/summary?${params}`),
        api.get(`/api/reports/orders?${params}`)
      ]);

      const summaryData = summaryRes.data?.data ?? summaryRes.data;
      const ordersData = ordersRes.data?.data ?? ordersRes.data;

      const formattedData = {
        summary: {
          totalOrders: summaryData.total_orders,
          totalRevenue: summaryData.total_revenue,
          averageOrderValue: summaryData.total_orders > 0 ? summaryData.total_revenue / summaryData.total_orders : 0,
          totalCustomers: ordersData.orders?.filter(o => o.customer_id).length || 0
        },
        orders: ordersData.orders || [],
        topProducts: summaryData.top_products?.map(p => ({
          name: p.name,
          quantity: p.qty_sold
        })) || [],
        paymentMethods: Object.entries(summaryData.revenue_by_method || {}).map(([name, amount]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          amount
        }))
      };

      setData(formattedData);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };


  const fetchFilters = async () => {

    try {
      const [sessionsRes, usersRes, productsRes] = await Promise.all([
        api.get('/api/sessions'),
        api.get('/api/users'),
        api.get('/api/products'),
      ]);
      setSessions(sessionsRes.data?.data?.sessions || sessionsRes.data?.data || sessionsRes.data?.sessions || sessionsRes.data || []);
      setUsers(usersRes.data?.data || usersRes.data || []);
      setProducts(productsRes.data?.data || productsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch filters:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      from_date: '',
      to_date: '',
      session_id: '',
      user_id: '',
      product_id: '',
    });
  };

  const exportData = async (format) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const ext = format === 'PDF' ? 'pdf' : 'xls';
      const endpoint = `/api/reports/export/${ext}?${params}`;
      const token = localStorage.getItem('pos_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3002'}${endpoint}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_report_${Date.now()}.${ext === 'xls' ? 'xlsx' : ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    }
  };

  if (loading) {
    return <Spinner size="lg" text="Loading reports..." />;
  }

  const summary = data?.summary || {};
  const orders = data?.orders || [];
  const topProducts = data?.topProducts || [];
  const paymentMethods = data?.paymentMethods || [];

  const COLORS = ['#2563EB', '#16A34A', '#D97706', '#DC2626', '#8B5CF6', '#EC4899'];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => exportData('PDF')}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => exportData('Excel')}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Input
            label="From Date"
            type="date"
            value={filters.from_date}
            onChange={(e) => handleFilterChange('from_date', e.target.value)}
          />
          <Input
            label="To Date"
            type="date"
            value={filters.to_date}
            onChange={(e) => handleFilterChange('to_date', e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session
            </label>
            <select
              value={filters.session_id}
              onChange={(e) => handleFilterChange('session_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Sessions</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.terminal?.name} - {formatDate(session.opened_at)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User
            </label>
            <select
              value={filters.user_id}
              onChange={(e) => handleFilterChange('user_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product
            </label>
            <select
              value={filters.product_id}
              onChange={(e) => handleFilterChange('product_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Products</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <SummaryCard
          title="Total Orders"
          value={summary.totalOrders || 0}
          icon={<ShoppingCart className="h-6 w-6" />}
          color="bg-blue-500"
        />
        <SummaryCard
          title="Total Revenue"
          value={formatCurrency(summary.totalRevenue || 0)}
          icon={<DollarSign className="h-6 w-6" />}
          color="bg-green-500"
        />
        <SummaryCard
          title="Average Order Value"
          value={formatCurrency(summary.averageOrderValue || 0)}
          icon={<TrendingUp className="h-6 w-6" />}
          color="bg-purple-500"
        />
        <SummaryCard
          title="Total Customers"
          value={summary.totalCustomers || 0}
          icon={<Users className="h-6 w-6" />}
          color="bg-orange-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Payment Methods Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue by Payment Method
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethods}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {paymentMethods.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top 10 Products
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value) => [value, 'Units Sold']} />
              <Bar dataKey="quantity" fill="#2563EB" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Orders ({orders.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Order Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Payment
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.slice(0, 20).map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {order.order_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {order.table?.table_number || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge>{order.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {order.payment_method?.name || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No orders found for the selected filters
          </div>
        )}
        
        {orders.length > 20 && (
          <div className="p-4 text-center text-sm text-gray-500">
            Showing first 20 orders. Use export for full data.
          </div>
        )}
      </div>
    </div>
  );
};

// Summary Card Component
const SummaryCard = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg text-white ${color} mr-4`}>
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-sm text-gray-600">{title}</div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
