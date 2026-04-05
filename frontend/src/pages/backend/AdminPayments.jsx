import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Badge from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/payments/all');
      setPayments(response.data?.data ?? response.data ?? []);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'Date', accessor: 'created_at', render: (val) => formatDate(val) },
    { header: 'Order Ref', accessor: 'order_number', render: (val) => <span className="font-mono font-medium">{val}</span> },
    { header: 'Customer', accessor: 'customer_name', render: (val) => val || 'Walk-in' },
    { 
      header: 'Method', 
      accessor: 'payment_method_name', 
      render: (val, payment) => (
        <span>{val} <span className="text-gray-500 text-xs">({payment.payment_method_type})</span></span>
      ) 
    },
    { header: 'Trans Ref', accessor: 'transaction_ref', render: (val) => val || '-' },
    { 
      header: 'Amount', 
      accessor: 'amount', 
      render: (val) => <span className="text-green-600 font-bold">{formatCurrency(val)}</span> 
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (val) => (
        <Badge variant={val === 'SUCCESS' ? 'success' : 'warning'}>
          {val}
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Payments Received</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Ref</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trans Ref</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">Loading payments...</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">No payments found.</td></tr>
            ) : (
              payments.map((payment, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(payment.created_at)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm"><span className="font-mono font-medium">{payment.order_number}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.customer_name || 'Walk-in'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.payment_method_name} <span className="text-xs">({payment.payment_method_type})</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.transaction_ref || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">{formatCurrency(payment.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Badge variant={payment.status === 'SUCCESS' ? 'success' : 'warning'}>{payment.status}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPayments;
