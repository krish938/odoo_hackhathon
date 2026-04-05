import { useState, useEffect, useCallback } from 'react';
import { connectSocket, disconnectSocket } from '../utils/socket';
import api from '../api/axios';
import { QRCodeSVG } from 'qrcode.react';

const STATUS_CONFIG = {
  CREATED: { label: 'Order Received', color: '#3b82f6', icon: '📋', bg: 'rgba(59,130,246,0.1)' },
  IN_PROGRESS: { label: 'Being Prepared', color: '#f59e0b', icon: '👨‍🍳', bg: 'rgba(245,158,11,0.1)' },
  PREPARING: { label: 'Cooking Now', color: '#f97316', icon: '🔥', bg: 'rgba(249,115,22,0.1)' },
  COMPLETED: { label: 'Ready to Serve!', color: '#22c55e', icon: '✅', bg: 'rgba(34,197,94,0.1)' },
  PAID: { label: 'Payment Received', color: '#8b5cf6', icon: '💳', bg: 'rgba(139,92,246,0.1)' },
};

const THANK_YOU_TIMEOUT = 30000; // 30 seconds

export default function CustomerDisplay() {
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [connected, setConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchCurrentOrder = useCallback(async (orderId) => {
    try {
      const res = await api.get(`/api/orders/${orderId}`);
      const data = res.data?.data ?? res.data;
      if (data) {
        setOrder(data);
        setItems(data.items || []);
        setStatus(data.status);
      }
    } catch (err) {
      console.error('Failed to fetch order:', err);
    }
  }, []);

  useEffect(() => {
    const socket = connectSocket();

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_customer_display');
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('order_status_changed', (data) => {
      if (order && data.order_id === order.id) {
        setStatus(data.status);
        fetchCurrentOrder(data.order_id);
      }
    });

    socket.on('order_paid', (data) => {
      if (!order || data.order_id == order?.id) {
        setShowThankYou(true);
        setTimeout(() => {
          setShowThankYou(false);
          setOrder(null);
          setItems([]);
          setStatus(null);
        }, THANK_YOU_TIMEOUT);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('order_status_changed');
      socket.off('order_paid');
      disconnectSocket();
    };
  }, [order, fetchCurrentOrder]);

  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.unit_price || 0) * item.quantity, 0);
  const tax = items.reduce((sum, item) => {
    const price = parseFloat(item.unit_price || 0);
    const qty = item.quantity;
    const taxRate = parseFloat(item.tax || 0) / 100;
    return sum + price * qty * taxRate;
  }, 0);
  const statusConfig = status ? (STATUS_CONFIG[status] || STATUS_CONFIG['CREATED']) : null;

  if (showThankYou) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontFamily: "'Inter', sans-serif",
        animation: 'fadeIn 0.5s ease-in',
      }}>
        <div style={{ textAlign: 'center', animation: 'bounceIn 0.6s ease-out' }}>
          <div style={{ fontSize: 128, marginBottom: 24, animation: 'spin 2s linear' }}>🎉</div>
          <h1 style={{ fontSize: 56, fontWeight: 800, color: '#22c55e', marginBottom: 8 }}>Thank You!</h1>
          <p style={{ fontSize: 24, color: '#94a3b8', marginBottom: 32 }}>
            Payment received. Enjoy your meal!
          </p>
          <div style={{
            background: 'rgba(34,197,94,0.15)', border: '1px solid #22c55e',
            borderRadius: 16, padding: '16px 32px',
          }}>
            <p style={{ margin: 0, color: '#22c55e', fontWeight: 600 }}>
              💳 Payment Confirmed
            </p>
          </div>
        </div>
        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes bounceIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          @keyframes spin { from { transform: rotate(-10deg); } to { transform: rotate(10deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#fff',
      fontFamily: "'Inter', sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 32 }}>☕</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Odoo POS Cafe</h1>
            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>Customer Display</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {currentTime.toLocaleTimeString()}
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>
            {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long' })}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', padding: 0, gap: 0, overflow: 'hidden' }}>
        {/* LEFT: Order Items Panel (50%) */}
        <div style={{ flex: 1, padding: 32, overflowY: 'auto', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          {!order ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              height: '100%', textAlign: 'center', minHeight: 400,
            }}>
              <div style={{ fontSize: 96, marginBottom: 24, animation: 'float 3s ease-in-out infinite' }}>🛍️</div>
              <h2 style={{ fontSize: 28, fontWeight: 600, color: '#94a3b8', margin: 0 }}>
                Welcome!
              </h2>
              <p style={{ color: '#475569', marginTop: 8 }}>Your order details will appear here</p>
              {/* Connection indicator */}
              <div style={{
                marginTop: 32, display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 20,
                background: connected ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: connected ? '#22c55e' : '#ef4444',
                }} />
                <span style={{ fontSize: 13, color: connected ? '#22c55e' : '#ef4444' }}>
                  {connected ? 'Connected' : 'Connecting...'}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>
                  Order #{order.order_number}
                </h2>
                {order.table_number && (
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: 14 }}>
                    🪑 Table {order.table_number} {order.floor_name ? `· ${order.floor_name}` : ''}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {items.map((item, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 12, padding: '14px 20px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    border: '1px solid rgba(255,255,255,0.08)',
                    animation: 'slideIn 0.3s ease-out',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                      {item.options && item.options.length > 0 && (
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                          {item.options.map(o => `${o.attribute_name}: ${o.value}`).join(', ')}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>
                        ₹{(parseFloat(item.unit_price) * item.quantity).toFixed(2)}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        × {item.quantity} @ ₹{parseFloat(item.unit_price).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Status + QR Panel (50%) */}
        <div style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', justifyContent: 'center' }}>
          {order && statusConfig && (
            <div style={{
              background: statusConfig.bg,
              border: `2px solid ${statusConfig.color}`,
              borderRadius: 16, padding: 28, textAlign: 'center',
              animation: 'pulse 2s infinite',
              width: '100%', maxWidth: 380,
            }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>{statusConfig.icon}</div>
              <h2 style={{ margin: 0, fontSize: 24, color: statusConfig.color, fontWeight: 800 }}>
                {statusConfig.label}
              </h2>
            </div>
          )}

          {order && (
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 16, padding: 24,
              border: '1px solid rgba(255,255,255,0.1)',
              width: '100%', maxWidth: 380,
            }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Bill Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Tax</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  paddingTop: 10, marginTop: 4,
                  fontWeight: 800, fontSize: 22,
                }}>
                  <span>Total</span>
                  <span style={{ color: '#22c55e' }}>₹{(subtotal + tax).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Persistent QR Code for Self-Order */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 16, padding: 28,
            border: '1px solid rgba(255,255,255,0.1)',
            textAlign: 'center',
            width: '100%', maxWidth: 380,
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#94a3b8' }}>
              Scan to Order
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#475569' }}>
              Use your phone to browse the menu and place your order
            </p>
            <div style={{
              background: '#fff',
              borderRadius: 12,
              padding: 16,
              display: 'inline-block',
            }}>
              <QRCodeSVG
                value={`${window.location.origin}/self-order`}
                size={180}
                level="H"
              />
            </div>
            <p style={{ margin: '12px 0 0', fontSize: 11, color: '#475569' }}>
              {window.location.origin}/self-order
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.1); }
          50% { box-shadow: 0 0 0 8px rgba(255,255,255,0.0); }
        }
        @keyframes slideIn {
          from { transform: translateX(-10px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
