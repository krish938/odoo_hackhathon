import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Spinner from '../../components/ui/Spinner';
import { Plus, Edit2, Trash2, CreditCard, Smartphone, DollarSign } from 'lucide-react';

const PaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [deletingMethod, setDeletingMethod] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'CASH',
    is_enabled: true,
    upi_id: '',
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/payment-methods');
      setPaymentMethods(response.data?.data ?? response.data ?? []);
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMethod) {
        await api.put(`/api/payment-methods/${editingMethod.id}`, formData);
      } else {
        await api.post('/api/payment-methods', formData);
      }

      setShowModal(false);
      resetForm();
      fetchPaymentMethods();
    } catch (error) {
      console.error('Failed to save payment method:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/payment-methods/${deletingMethod.id}`);
      setShowDeleteModal(false);
      setDeletingMethod(null);
      fetchPaymentMethods();
    } catch (error) {
      console.error('Failed to delete payment method:', error);
    }
  };

  const handleToggleStatus = async (method) => {
    try {
      await api.put(`/api/payment-methods/${method.id}`, {
        ...method,
        is_enabled: !method.is_enabled,
      });
      fetchPaymentMethods();
    } catch (error) {
      console.error('Failed to toggle payment method status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'CASH',
      is_enabled: true,
      upi_id: '',
    });
    setEditingMethod(null);
  };

  const openEditModal = (method) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      type: method.type,
      is_enabled: method.is_enabled,
      upi_id: method.upi_id || '',
    });
    setShowModal(true);
  };

  const openDeleteModal = (method) => {
    setDeletingMethod(method);
    setShowDeleteModal(true);
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
    return <Spinner size="lg" text="Loading payment methods..." />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Method
        </Button>
      </div>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paymentMethods.map((method) => (
          <div key={method.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg text-white ${getPaymentColor(method.type)}`}>
                {getPaymentIcon(method.type)}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditModal(method)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDeleteModal(method)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {method.name}
            </h3>

            <div className="space-y-2">
              <Badge variant={method.is_enabled ? 'success' : 'danger'}>
                {method.is_enabled ? 'Enabled' : 'Disabled'}
              </Badge>
              
              <Badge variant="info">
                {method.type}
              </Badge>
            </div>

            {method.type === 'UPI' && method.upi_id && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">UPI ID:</p>
                <p className="text-sm font-medium text-gray-900">
                  {method.upi_id}
                </p>
              </div>
            )}

            <div className="mt-4">
              <Button
                variant={method.is_enabled ? 'danger' : 'success'}
                size="sm"
                onClick={() => handleToggleStatus(method)}
                className="w-full"
              >
                {method.is_enabled ? 'Disable' : 'Enable'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {paymentMethods.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No payment methods found
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Payment Method Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Cash, Card, UPI"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="CASH">Cash</option>
              <option value="DIGITAL">Digital (Card/Bank)</option>
              <option value="UPI">UPI</option>
            </select>
          </div>

          {formData.type === 'UPI' && (
            <Input
              label="UPI ID"
              value={formData.upi_id}
              onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
              placeholder="e.g., 123@ybl.com"
            />
          )}

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_enabled}
              onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
              className="mr-2"
            />
            Enabled
          </label>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingMethod ? 'Update' : 'Create'} Payment Method
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Payment Method"
        message={`Are you sure you want to delete "${deletingMethod?.name}"? This action cannot be undone.`}
        variant="danger"
      />
    </div>
  );
};

export default PaymentMethods;
