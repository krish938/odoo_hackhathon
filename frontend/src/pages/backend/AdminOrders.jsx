import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../utils/formatCurrency';
import { FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/orders');
      setOrders(response.data?.data ?? response.data ?? []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      CREATED: 'bg-gray-100 text-gray-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      PAID: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const openOrderDetail = async (order) => {
    try {
      const response = await api.get(`/api/orders/${order.id}`);
      const detailedOrder = response.data?.data ?? response.data;
      
      const paymentsResponse = await api.get(`/api/payments/${order.id}`);
      detailedOrder.payments = paymentsResponse.data?.data ?? paymentsResponse.data ?? [];
      
      setSelectedOrder(detailedOrder);
      setIsModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load order details');
    }
  };

  const columns = [
    { header: 'Order Ref', accessor: 'order_number', render: (val) => <span className="font-mono font-medium">{val}</span> },
    { header: 'Date', accessor: 'created_at', render: (val) => formatDate(val) },
    { header: 'Customer', accessor: 'customer_name', render: (val) => val || 'Walk-in' },
    { header: 'Total', accessor: 'total_amount', render: (val) => formatCurrency(val || 0) },
    {
      header: 'Status',
      accessor: 'status',
      render: (val) => (
        <Badge className={getStatusColor(val)}>
          {val.replace('_', ' ')}
        </Badge>
      )
    },
    {
      header: 'Details',
      accessor: 'id',
      render: (_, order) => (
        <button onClick={() => openOrderDetail(order)} className="text-primary hover:text-primary-dark">
          <FileText className="h-5 w-5" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Ref</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">Loading orders...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">No orders found.</td></tr>
            ) : (
              orders.map(order => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm"><span className="font-mono font-medium">{order.order_number}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(order.created_at)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customer_name || 'Walk-in'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(order.total_amount || 0)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => openOrderDetail(order)} className="text-primary hover:text-primary-dark">
                      <FileText className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedOrder ? `Order Detail: ${selectedOrder.order_number}` : 'Order Detail'}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium">{formatDate(selectedOrder.created_at)}</p>
              </div>
              <div>
                <p className="text-gray-500">Customer</p>
                <p className="font-medium">{selectedOrder.customer_name || 'Walk-in'}</p>
              </div>
              <div>
                <p className="text-gray-500">Terminal</p>
                <p className="font-medium">{selectedOrder.terminal_name}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {selectedOrder.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 border-b pb-2">Products</h3>
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr>
                    <th className="text-left font-medium text-gray-500">Item</th>
                    <th className="text-center font-medium text-gray-500">Qty</th>
                    <th className="text-right font-medium text-gray-500">Unit Price</th>
                    <th className="text-right font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedOrder.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2">
                        {item.product_name}
                        {item.options && item.options.length > 0 && (
                          <div className="text-xs text-gray-500">
                            {item.options.map(opt => `${opt.attribute_name}: ${opt.value}`).join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="py-2 text-right">{formatCurrency(item.unit_price * item.quantity)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan="3" className="py-3 text-right font-bold">Total Amount:</td>
                    <td className="py-3 text-right font-bold text-lg">{formatCurrency(selectedOrder.total_amount || 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {selectedOrder.payments && selectedOrder.payments.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 border-b pb-2">Payments Received</h3>
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead>
                    <tr>
                      <th className="text-left font-medium text-gray-500">Method</th>
                      <th className="text-left font-medium text-gray-500">Ref</th>
                      <th className="text-right font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedOrder.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2">{p.payment_method_name} ({p.payment_method_type})</td>
                        <td className="py-2">{p.transaction_ref || '-'}</td>
                        <td className="py-2 text-right text-green-600 font-medium">{formatCurrency(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminOrders;
