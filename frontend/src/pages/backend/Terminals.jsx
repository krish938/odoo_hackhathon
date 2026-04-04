import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Spinner from '../../components/ui/Spinner';
import { Plus, Edit2, Trash2, Monitor, Play, Clock, DollarSign, QrCode } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatCurrency';

const Terminals = () => {
  const navigate = useNavigate();
  const [terminals, setTerminals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedTerminalQR, setSelectedTerminalQR] = useState(null);
  const [editingTerminal, setEditingTerminal] = useState(null);
  const [deletingTerminal, setDeletingTerminal] = useState(null);
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    fetchTerminals();
  }, []);

  const fetchTerminals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/terminals');
      setTerminals(response.data?.data ?? response.data ?? []);
    } catch (error) {
      console.error('Failed to fetch terminals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTerminal) {
        await api.put(`/api/terminals/${editingTerminal.id}`, formData);
      } else {
        await api.post('/api/terminals', formData);
      }

      setShowModal(false);
      resetForm();
      fetchTerminals();
    } catch (error) {
      console.error('Failed to save terminal:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/terminals/${deletingTerminal.id}`);
      setShowDeleteModal(false);
      setDeletingTerminal(null);
      fetchTerminals();
    } catch (error) {
      console.error('Failed to delete terminal:', error);
    }
  };

  const handleOpenSession = (terminal) => {
    navigate('/pos/open-session', { state: { terminalId: terminal.id } });
  };

  const openQRModal = (terminal) => {
    setSelectedTerminalQR(terminal);
    setShowQRModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '' });
    setEditingTerminal(null);
  };

  const openEditModal = (terminal) => {
    setEditingTerminal(terminal);
    setFormData({ name: terminal.name });
    setShowModal(true);
  };

  const openDeleteModal = (terminal) => {
    setDeletingTerminal(terminal);
    setShowDeleteModal(true);
  };

  if (loading) {
    return <Spinner size="lg" text="Loading terminals..." />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">POS Terminals</h1>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Terminal
        </Button>
      </div>

      {/* Terminals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {terminals.map((terminal) => (
          <div key={terminal.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="p-3 bg-blue-500 rounded-lg text-white mr-3">
                  <Monitor className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {terminal.name}
                  </h3>
                  <p className="text-sm text-gray-500">Terminal #{terminal.id}</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditModal(terminal)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDeleteModal(terminal)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Terminal Status */}
            <div className="space-y-3 mb-4">
              {terminal.last_session && (
                <>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    Last session: {formatDate(terminal.last_session.opened_at)}
                  </div>
                  
                  {terminal.last_session.closed_at ? (
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Closing balance: {formatCurrency(terminal.last_session.closing_balance || 0)}
                    </div>
                  ) : (
                    <Badge variant="success">Session Active</Badge>
                  )}
                </>
              )}
              
              {!terminal.last_session && (
                <div className="text-sm text-gray-500">No sessions yet</div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                onClick={() => handleOpenSession(terminal)}
                className="w-full"
                disabled={terminal.last_session && !terminal.last_session.closed_at}
              >
                <Play className="h-4 w-4 mr-2" />
                {terminal.last_session && !terminal.last_session.closed_at
                  ? 'Session Active'
                  : 'Open Session'
                }
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => openQRModal(terminal)}
              >
                <QrCode className="h-4 w-4 mr-2" />
                Self-Order QR
              </Button>
            </div>
          </div>
        ))}
      </div>

      {terminals.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No terminals found
        </div>
      )}

      {/* Add/Edit Terminal Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTerminal ? 'Edit Terminal' : 'Add Terminal'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Terminal Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Main Counter, Bar Counter, Drive-thru"
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingTerminal ? 'Update' : 'Create'} Terminal
            </Button>
          </div>
        </form>
      </Modal>

      {/* QR Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="Self-Order Options"
      >
        <div className="text-center p-6">
          <div className="mb-4 text-sm text-gray-500">
            Customers can follow this link to place self-orders directly for this terminal.
          </div>
          <div className="bg-gray-100 p-4 rounded-lg break-all mb-4">
            {window.location.origin}/self-order?terminal_id={selectedTerminalQR?.id}
          </div>
          <div className="flex justify-center space-x-4">
            <Button onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/self-order?terminal_id=${selectedTerminalQR?.id}`);
              alert('Copied to clipboard!');
            }}>
              Copy Link
            </Button>
            <Button variant="outline" onClick={() => window.open(`/self-order?terminal_id=${selectedTerminalQR?.id}`, '_blank')}>
              Open in New Tab
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Terminal"
        message={`Are you sure you want to delete terminal "${deletingTerminal?.name}"? This action cannot be undone.`}
        variant="danger"
      />
    </div>
  );
};

export default Terminals;
