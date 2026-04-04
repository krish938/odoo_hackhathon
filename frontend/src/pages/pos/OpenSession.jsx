import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import usePosStore from '../../store/posStore';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { Monitor, Play, DollarSign, User } from 'lucide-react';

const OpenSession = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { setSession } = usePosStore();
  const [terminals, setTerminals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openingSession, setOpeningSession] = useState(false);
  const [formData, setFormData] = useState({
    terminal_id: location.state?.terminalId || '',
    opening_balance: '',
    responsible_label: user?.name || '',
  });

  useEffect(() => {
    fetchTerminals();
  }, []);

  const fetchTerminals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/terminals');
      setTerminals(response.data);
    } catch (error) {
      console.error('Failed to fetch terminals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setOpeningSession(true);
      
      const sessionData = {
        terminal_id: parseInt(formData.terminal_id),
        opening_balance: parseFloat(formData.opening_balance) || 0,
        responsible_label: formData.responsible_label,
      };

      const response = await api.post('/api/sessions/open', sessionData);
      const session = response.data;
      
      // Fetch complete session data with terminal info
      const fullSessionResponse = await api.get(`/api/sessions/${session.id}`);
      const fullSession = fullSessionResponse.data;
      
      setSession(fullSession);
      navigate('/pos/floor');
    } catch (error) {
      console.error('Failed to open session:', error);
    } finally {
      setOpeningSession(false);
    }
  };

  if (loading) {
    return <Spinner size="lg" text="Loading terminals..." />;
  }

  return (
    <div className="min-h-screen bg-page-bg flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary">
            <Monitor className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Open POS Session
          </h1>
          <p className="mt-2 text-gray-600">
            Start your shift by opening a new session
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Terminal Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Terminal
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                value={formData.terminal_id}
                onChange={(e) => setFormData({ ...formData, terminal_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Choose a terminal</option>
                {terminals.map((terminal) => (
                  <option key={terminal.id} value={terminal.id}>
                    {terminal.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Opening Balance */}
            <Input
              label="Opening Balance"
              type="number"
              step="0.01"
              value={formData.opening_balance}
              onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
              placeholder="0.00"
              helperText="Enter the cash amount in the drawer at start of shift"
            />

            {/* Responsible Person */}
            <Input
              label="Responsible Person"
              value={formData.responsible_label}
              onChange={(e) => setFormData({ ...formData, responsible_label: e.target.value })}
              placeholder="Your name"
              icon={<User className="h-4 w-4" />}
            />

            {/* Session Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Session Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Terminal:</span>
                  <span className="font-medium">
                    {terminals.find(t => t.id === parseInt(formData.terminal_id))?.name || 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Opening Balance:</span>
                  <span className="font-medium">
                    {formatCurrency(parseFloat(formData.opening_balance) || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Responsible:</span>
                  <span className="font-medium">{formData.responsible_label || 'Not specified'}</span>
                </div>
              </div>
            </div>

            {/* Active Sessions Warning */}
            {user?.role === 'admin' || user?.role === 'manager' ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-amber-800">
                      Make sure to count and verify the cash amount before starting the session.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              loading={openingSession}
              disabled={openingSession || !formData.terminal_id}
            >
              <Play className="h-4 w-4 mr-2" />
              {openingSession ? 'Opening Session...' : 'Open Session'}
            </Button>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Need help? Contact your manager for assistance.</p>
        </div>
      </div>
    </div>
  );
};

export default OpenSession;
