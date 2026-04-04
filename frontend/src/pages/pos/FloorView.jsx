import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import usePosStore from '../../store/posStore';
import useAuthStore from '../../store/authStore';
import { formatCurrency, getRelativeTime } from '../../utils/formatCurrency';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { Coffee, Users, Settings, LogOut, RefreshCw } from 'lucide-react';

const FloorView = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activeSession, clearSession } = usePosStore();
  const [floors, setFloors] = useState([]);
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [closingSession, setClosingSession] = useState(false);

  useEffect(() => {
    if (!activeSession) {
      navigate('/pos/open-session');
      return;
    }
    fetchData();
  }, [activeSession]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [floorsRes, tablesRes, ordersRes] = await Promise.all([
        api.get('/api/floors'),
        api.get('/api/tables'),
        api.get(`/api/orders?session_id=${activeSession.id}`),
      ]);
      
      setFloors(floorsRes.data);
      setTables(tablesRes.data);
      setOrders(ordersRes.data);
      
      if (floorsRes.data.length > 0 && !selectedFloor) {
        setSelectedFloor(floorsRes.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch floor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTableStatus = (tableId) => {
    const tableOrders = orders.filter(order => 
      order.table_id === tableId && 
      ['CREATED', 'IN_PROGRESS'].includes(order.status)
    );
    
    if (tableOrders.length === 0) return 'free';
    return 'occupied';
  };

  const getTableOrders = (tableId) => {
    return orders.filter(order => 
      order.table_id === tableId && 
      ['CREATED', 'IN_PROGRESS'].includes(order.status)
    );
  };

  const handleTableClick = (table) => {
    navigate(`/pos/order/${table.id}`);
  };

  const handleCloseSession = async () => {
    if (!confirm('Are you sure you want to close this session?')) return;
    
    try {
      setClosingSession(true);
      
      // Check for unpaid orders
      const unpaidOrders = orders.filter(order => 
        order.status !== 'PAID'
      );
      
      if (unpaidOrders.length > 0) {
        if (!confirm(`${unpaidOrders.length} orders are still unpaid. Close session anyway?`)) {
          setClosingSession(false);
          return;
        }
      }
      
      await api.post(`/api/sessions/${activeSession.id}/close`);
      clearSession();
      navigate('/backend/dashboard');
    } catch (error) {
      console.error('Failed to close session:', error);
    } finally {
      setClosingSession(false);
    }
  };

  const getTableColor = (status) => {
    switch (status) {
      case 'free':
        return 'bg-green-100 border-green-300 hover:bg-green-200';
      case 'occupied':
        return 'bg-orange-100 border-orange-300 hover:bg-orange-200';
      default:
        return 'bg-gray-100 border-gray-300 hover:bg-gray-200';
    }
  };

  if (loading) {
    return <Spinner size="lg" text="Loading floor view..." />;
  }

  const filteredTables = selectedFloor 
    ? tables.filter(table => table.floor_id === selectedFloor.id && table.is_active)
    : [];

  return (
    <div className="min-h-screen bg-page-bg">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Coffee className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Odoo POS Cafe</h1>
              <p className="text-sm text-gray-600">
                {activeSession?.terminal?.name} • {user?.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              onClick={fetchData}
              className="text-gray-600"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            <div className="relative">
              <Button
                variant="ghost"
                className="text-gray-600"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="relative">
              <Button
                variant="ghost"
                onClick={handleCloseSession}
                loading={closingSession}
                className="text-gray-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Close Register
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Floor Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex space-x-8">
          {floors.map((floor) => (
            <button
              key={floor.id}
              onClick={() => setSelectedFloor(floor)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedFloor?.id === floor.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {floor.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tables Grid */}
      <div className="p-6">
        {selectedFloor ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredTables.map((table) => {
              const status = getTableStatus(table.id);
              const tableOrders = getTableOrders(table.id);
              const totalAmount = tableOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
              
              return (
                <button
                  key={table.id}
                  onClick={() => handleTableClick(table)}
                  className={`relative p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${getTableColor(status)}`}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 mb-1">
                      {table.table_number}
                    </div>
                    
                    <div className="flex items-center justify-center text-sm text-gray-600 mb-2">
                      <Users className="h-3 w-3 mr-1" />
                      {table.seats}
                    </div>
                    
                    <Badge 
                      variant={status === 'free' ? 'success' : 'warning'}
                      className="mb-2"
                    >
                      {status === 'free' ? 'Free' : 'Occupied'}
                    </Badge>
                    
                    {status === 'occupied' && (
                      <div className="text-xs text-gray-700">
                        {tableOrders.length} order{tableOrders.length > 1 ? 's' : ''}
                        {totalAmount > 0 && (
                          <div className="font-semibold">
                            {formatCurrency(totalAmount)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Select a floor to view tables
          </div>
        )}
      </div>

      {/* Session Info */}
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
        <h3 className="font-medium text-gray-900 mb-2">Session Info</h3>
        <div className="space-y-1 text-sm text-gray-600">
          <div>Terminal: {activeSession?.terminal?.name}</div>
          <div>Opened: {getRelativeTime(activeSession?.opened_at)}</div>
          <div>Opening Balance: {formatCurrency(activeSession?.opening_balance || 0)}</div>
          <div>Active Orders: {orders.filter(o => !['PAID', 'COMPLETED'].includes(o.status)).length}</div>
        </div>
      </div>
    </div>
  );
};

export default FloorView;
