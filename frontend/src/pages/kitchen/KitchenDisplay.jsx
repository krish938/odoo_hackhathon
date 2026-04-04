import { useState, useEffect, useRef, useCallback } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../../utils/socket';
import api from '../../api/axios';
import KitchenTicketCard from '../../components/kitchen/KitchenTicketCard';

const STATUS_FILTERS = [
  { value: '', label: 'All Active' },
  { value: 'TO_COOK', label: '🔴 To Cook' },
  { value: 'PREPARING', label: '🟡 Preparing' },
  { value: 'COMPLETED', label: '✅ Completed' },
];

export default function KitchenDisplay() {
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const audioRef = useRef(null);

  const fetchTickets = useCallback(async () => {
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await api.get('/api/kitchen/tickets', { params });
      const data = res.data?.data ?? res.data ?? [];
      // Filter out completed unless explicitly requested
      const filtered = statusFilter === ''
        ? data.filter(t => t.status !== 'COMPLETED')
        : data;
      setTickets(filtered);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch kitchen tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // Play notification sound
  const playNotification = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  useEffect(() => {
    // Initial load
    fetchTickets();

    // Setup Socket.IO
    const socket = connectSocket();

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_kitchen');
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('new_order', (data) => {
      // Add new ticket or re-fetch
      playNotification();
      fetchTickets();
      setLastUpdated(new Date());
    });

    socket.on('order_updated', () => {
      fetchTickets();
      setLastUpdated(new Date());
    });

    // Fallback polling every 30s (much less frequent, just as safety net)
    const interval = setInterval(() => {
      if (!socket.connected) {
        fetchTickets();
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('new_order');
      socket.off('order_updated');
      disconnectSocket();
    };
  }, [fetchTickets]);

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      await api.put(`/api/kitchen/tickets/${ticketId}/status`, { status: newStatus });
      fetchTickets();
    } catch (err) {
      console.error('Failed to update ticket status:', err);
    }
  };

  const updateItemStatus = async (ticketId, itemId, newStatus) => {
    try {
      await api.put(`/api/kitchen/tickets/${ticketId}/items/${itemId}/status`, { status: newStatus });
      fetchTickets();
    } catch (err) {
      console.error('Failed to update item status:', err);
    }
  };

  const getTicketAge = (createdAt) => {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    return minutes;
  };

  const getAgeColor = (minutes) => {
    if (minutes < 5) return '#22c55e';
    if (minutes < 10) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f0f',
      color: '#fff',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Hidden audio for notification sound */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2ozLS9fns/VsXZDNzpdn8zVuoFROThhmMzVvIhXPz5hl8zZv4xbhF9iosvXwY9gh2NkpsvaxZNiiWdnqsrbx5ZljmpqrcncyZlojm1urMneyZ5pkXBwrsfez6Fsl3N0scnf0KVwm3d2tMrg0qh0n3p5t8zh1Kp3pX18us3i1q16qYCAvtDj2LB+rYOCwdPk2rKCsYeGxNbl3LWGto2KyNno3riKu5GOy9vq4LqOv5WSztzt4r2SxZiX0t/u5cCWyZuc1eLv58OazqCg2OXx6saf0qOj3Ojy7Mmj16an4Ov07syo2qur5e717tCt3q+v6e/27tOy4bO07fL48Na45Li59PP59trAvb3y9vr73sXBwPj5/P3iyMXG/v/+5szKygAAAA==" type="audio/wav" />
      </audio>

      {/* Header */}
      <div style={{
        background: '#1a1a1a',
        borderBottom: '2px solid #ef4444',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 28 }}>🍳</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Kitchen Display</h1>
            <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
              {tickets.length} active {tickets.length === 1 ? 'ticket' : 'tickets'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Status Filter */}
          <div style={{ display: 'flex', gap: 8 }}>
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  background: statusFilter === f.value ? '#ef4444' : '#2a2a2a',
                  color: '#fff',
                  transition: 'all 0.2s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Connection status */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 12px',
            borderRadius: 20,
            background: connected ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${connected ? '#22c55e' : '#ef4444'}`,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: connected ? '#22c55e' : '#ef4444',
              animation: connected ? 'pulse 2s infinite' : 'none',
            }} />
            <span style={{ fontSize: 12, color: connected ? '#22c55e' : '#ef4444' }}>
              {connected ? 'Live' : 'Reconnecting...'}
            </span>
          </div>

          {lastUpdated && (
            <span style={{ fontSize: 11, color: '#6b7280' }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 24 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 48, height: 48, border: '4px solid #374151',
                borderTopColor: '#ef4444', borderRadius: '50%',
                animation: 'spin 1s linear infinite', margin: '0 auto 16px',
              }} />
              <p style={{ color: '#6b7280' }}>Loading kitchen tickets...</p>
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>🏖️</div>
            <h2 style={{ color: '#6b7280', fontWeight: 500 }}>No active tickets</h2>
            <p style={{ color: '#4b5563', fontSize: 14 }}>New orders will appear here automatically</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20,
          }}>
            {tickets.map(ticket => {
              const age = getTicketAge(ticket.created_at || ticket.order_created_at);
              return (
                <div key={ticket.id} style={{ position: 'relative' }}>
                  {/* Age indicator */}
                  <div style={{
                    position: 'absolute',
                    top: -6, right: -6,
                    background: getAgeColor(age),
                    color: '#fff',
                    borderRadius: 12,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    zIndex: 10,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  }}>
                    {age}m ago
                  </div>
                  <KitchenTicketCard
                    ticket={ticket}
                    onUpdateStatus={updateTicketStatus}
                    onUpdateItemStatus={updateItemStatus}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
