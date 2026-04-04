import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePolling } from '../hooks/usePolling';
import api from '../api/axios';
import { formatCurrency } from '../utils/formatCurrency';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { Coffee, Check, Clock } from 'lucide-react';

const CustomerDisplay = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id') || localStorage.getItem('pos_session')?.match(/"activeSession":{[^}]*"id":(\d+)/)?.[1];

  const { data: orders, loading, error } = usePolling(
    () => {
      if (!sessionId) return Promise.resolve({ data: [] });
      return api.get(`/api/orders?session_id=${sessionId}&status=IN_PROGRESS`);
    },
    3000 // Poll every 3 seconds
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <Spinner size="lg" text="Loading customer display..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="text-center">
          <Coffee className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Customer Display</h2>
          <p className="text-gray-600">Unable to load order information</p>
        </div>
      </div>
    );
  }

  const activeOrders = orders?.data || [];
  const hasPaidOrders = activeOrders.some(order => order.status === 'PAID');

  if (hasPaidOrders) {
    return (
      <div className="min-h-screen bg-success flex items-center justify-center">
        <div className="text-center text-white">
          <div className="mx-auto h-24 w-24 bg-white/20 rounded-full flex items-center justify-center mb-6">
            <Check className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Thank You!</h1>
          <p className="text-2xl mb-2">Payment Received</p>
          <p className="text-lg opacity-90">Your order has been completed successfully</p>
        </div>
      </div>
    );
  }

  if (activeOrders.length === 0) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="text-center">
          <Coffee className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Odoo POS Cafe</h2>
          <p className="text-gray-600">No active orders at the moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page-bg p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Coffee className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Odoo POS Cafe</h1>
          <p className="text-gray-600">Customer Display</p>
        </div>

        {/* Orders */}
        <div className="space-y-6">
          {activeOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Order Header */}
              <div className="bg-primary text-white p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">
                      Order {order.order_number}
                    </h2>
                    <p className="opacity-90">
                      Table {order.table?.table_number || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="warning" className="mb-2">
                      {order.status}
                    </Badge>
                    <p className="text-3xl font-bold">
                      {formatCurrency(order.total_amount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-4">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-xl">🍽️</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-lg">
                            {item.quantity}x {item.product?.name}
                          </p>
                          {item.product?.attributes && item.product.attributes.length > 0 && (
                            <p className="text-sm text-gray-500">
                              {item.product.attributes.map(attr => attr.value).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 text-lg">
                          {formatCurrency(item.quantity * item.unit_price)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(item.unit_price)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="space-y-2">
                    <div className="flex justify-between text-lg">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">
                        {formatCurrency(order.total_amount - (order.discount || 0) - (order.tip || 0))}
                      </span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-lg text-green-600">
                        <span>Discount</span>
                        <span>-{formatCurrency(order.discount)}</span>
                      </div>
                    )}
                    {order.tip > 0 && (
                      <div className="flex justify-between text-lg">
                        <span>Tip</span>
                        <span>{formatCurrency(order.tip)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-bold pt-2 border-t">
                      <span>Total</span>
                      <span>{formatCurrency(order.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Footer */}
              <div className="bg-gray-50 px-6 py-4">
                <div className="flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600 mr-2" />
                  <span className="text-amber-600 font-medium">
                    Order is being prepared...
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500">
          <p className="text-sm">Screen updates automatically every 3 seconds</p>
          <p className="text-xs mt-1">Last updated: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerDisplay;
