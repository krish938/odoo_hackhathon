import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import usePosStore from '../../store/posStore';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import UPIQRModal from '../../components/pos/UPIQRModal';
import { ArrowLeft, CreditCard, Smartphone, DollarSign, Check } from 'lucide-react';

const PaymentScreen = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { activeSession, clearCart } = usePosStore();
  const [order, setOrder] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showUPIQR, setShowUPIQR] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!activeSession) {
      navigate('/pos/open-session');
      return;
    }
    fetchData();
  }, [orderId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderRes, paymentMethodsRes, paymentsRes] = await Promise.all([
        api.get(`/api/orders/${orderId}`),
        api.get('/api/payment-methods'),
        api.get(`/api/payments/${orderId}`),
      ]);
      
      setOrder(orderRes.data);
      setPaymentMethods(paymentMethodsRes.data.filter(pm => pm.is_enabled));
      setPayments(paymentsRes.data);
      
      // Set default payment amount to remaining balance
      const paidAmount = paymentsRes.data.reduce((sum, p) => sum + (p.amount || 0), 0);
      const remaining = (orderRes.data.total_amount || 0) - paidAmount;
      setPaymentAmount(remaining > 0 ? remaining.toString() : '');
    } catch (error) {
      console.error('Failed to fetch payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaidAmount = () => {
    return payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  };

  const getRemainingAmount = () => {
    const total = order?.total_amount || 0;
    const paid = getPaidAmount();
    return Math.max(0, total - paid);
  };

  const isFullyPaid = () => {
    return getRemainingAmount() <= 0;
  };

  const handlePayment = async () => {
    if (!selectedMethod || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      return;
    }

    try {
      setProcessingPayment(true);
      
      if (selectedMethod.type === 'UPI') {
        setShowUPIQR(true);
        return;
      }
      
      const paymentData = {
        order_id: parseInt(orderId),
        payment_method_id: selectedMethod.id,
        amount: parseFloat(paymentAmount),
      };
      
      await api.post('/api/payments', paymentData);
      
      // Refresh payments
      const paymentsRes = await api.get(`/api/payments/${orderId}`);
      setPayments(paymentsRes.data);
      
      // Update payment amount to remaining balance
      const remaining = getRemainingAmount();
      setPaymentAmount(remaining > 0 ? remaining.toString() : '');
      
      // Check if fully paid
      if (isFullyPaid()) {
        await handlePaymentComplete();
      }
    } catch (error) {
      console.error('Failed to process payment:', error);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleUPIPayment = async (confirmed) => {
    if (!confirmed) {
      setShowUPIQR(false);
      return;
    }
    
    try {
      setProcessingPayment(true);
      
      const paymentData = {
        order_id: parseInt(orderId),
        payment_method_id: selectedMethod.id,
        amount: parseFloat(paymentAmount),
        status: 'SUCCESS',
        transaction_ref: `UPI_${Date.now()}`,
      };
      
      await api.post('/api/payments', paymentData);
      
      // Refresh payments
      const paymentsRes = await api.get(`/api/payments/${orderId}`);
      setPayments(paymentsRes.data);
      
      setShowUPIQR(false);
      
      // Check if fully paid
      if (isFullyPaid()) {
        await handlePaymentComplete();
      } else {
        // Update payment amount to remaining balance
        const remaining = getRemainingAmount();
        setPaymentAmount(remaining > 0 ? remaining.toString() : '');
      }
    } catch (error) {
      console.error('Failed to process UPI payment:', error);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePaymentComplete = async () => {
    try {
      // Update order status to PAID
      await api.put(`/api/orders/${orderId}/status`, { status: 'PAID' });
      
      // Show success screen
      setShowSuccess(true);
      
      // Clear cart and redirect after 2 seconds
      setTimeout(() => {
        clearCart();
        setShowSuccess(false);
        navigate('/pos/floor');
      }, 2000);
    } catch (error) {
      console.error('Failed to complete payment:', error);
    }
  };

  const getPaymentIcon = (type) => {
    switch (type) {
      case 'CASH':
        return <DollarSign className="h-6 w-6" />;
      case 'DIGITAL':
        return <CreditCard className="h-6 w-6" />;
      case 'UPI':
        return <Smartphone className="h-6 w-6" />;
      default:
        return <CreditCard className="h-6 w-6" />;
    }
  };

  const getPaymentColor = (type) => {
    switch (type) {
      case 'CASH':
        return 'bg-green-500';
      case 'DIGITAL':
        return 'bg-blue-500';
      case 'UPI':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return <Spinner size="lg" text="Loading payment screen..." />;
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-success rounded-full flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">Redirecting to floor view...</p>
        </div>
      </div>
    );
  }

  const paidAmount = getPaidAmount();
  const remainingAmount = getRemainingAmount();
  const totalAmount = order?.total_amount || 0;

  return (
    <div className="min-h-screen bg-page-bg">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/pos/floor')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Payment</h1>
              <p className="text-sm text-gray-600">
                Order {order?.order_number} • Table {order?.table?.table_number}
              </p>
            </div>
          </div>
          
          <Badge variant="success">
            Total: {formatCurrency(totalAmount)}
          </Badge>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Order Summary (Left) */}
        <div className="w-3/5 p-6 bg-white border-r border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
          
          <div className="space-y-3 mb-6">
            {order?.items?.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {item.product?.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.quantity} × {formatCurrency(item.unit_price)}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatCurrency(item.quantity * item.unit_price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(totalAmount - (order?.discount || 0) - (order?.tip || 0))}</span>
            </div>
            {order?.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            {order?.tip > 0 && (
              <div className="flex justify-between">
                <span>Tip</span>
                <span>{formatCurrency(order.tip)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
          
          {/* Payment History */}
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-3">Payment History</h3>
            {payments.length > 0 ? (
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{payment.payment_method?.name}</span>
                      <Badge variant={payment.status === 'SUCCESS' ? 'success' : 'warning'} className="ml-2">
                        {payment.status}
                      </Badge>
                    </div>
                    <span className="font-medium">{formatCurrency(payment.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No payments received yet</p>
            )}
          </div>
        </div>

        {/* Payment Panel (Right) */}
        <div className="w-2/5 p-6 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Collect Payment</h2>
          
          {/* Amount Due */}
          <div className="bg-white rounded-lg p-6 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Amount Due</p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(remainingAmount)}
              </p>
              {paidAmount > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  {formatCurrency(paidAmount)} already paid
                </p>
              )}
            </div>
          </div>
          
          {/* Payment Methods */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Payment Method</h3>
            <div className="grid grid-cols-1 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedMethod?.id === method.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg text-white mr-3 ${getPaymentColor(method.type)}`}>
                      {getPaymentIcon(method.type)}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{method.name}</p>
                      <p className="text-sm text-gray-500">{method.type}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Amount Input */}
          <div className="mb-6">
            <Input
              label="Payment Amount"
              type="number"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0.00"
              disabled={!selectedMethod}
            />
            {parseFloat(paymentAmount || 0) > remainingAmount && (
              <p className="text-sm text-amber-600 mt-1">
                This is more than the due amount
              </p>
            )}
          </div>
          
          {/* Process Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={!selectedMethod || !paymentAmount || parseFloat(paymentAmount) <= 0 || processingPayment}
            loading={processingPayment}
            className="w-full"
          >
            {processingPayment ? 'Processing...' : 'Validate Payment'}
          </Button>
          
          {isFullyPaid() && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-center font-medium">
                ✓ Order fully paid
              </p>
            </div>
          )}
        </div>
      </div>

      {/* UPI QR Modal */}
      <UPIQRModal
        isOpen={showUPIQR}
        onClose={() => setShowUPIQR(false)}
        upiId={selectedMethod?.upi_id}
        amount={parseFloat(paymentAmount)}
        onConfirm={handleUPIPayment}
      />
    </div>
  );
};

export default PaymentScreen;
