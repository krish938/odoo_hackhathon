import { useState } from 'react';

const STATUS_FLOW = {
  TO_COOK: { next: 'PREPARING', label: 'Start Cooking', color: '#ef4444', bg: '#1a0505' },
  PREPARING: { next: 'COMPLETED', label: 'Mark Complete', color: '#f59e0b', bg: '#1a1005' },
  COMPLETED: { next: null, label: 'Done', color: '#22c55e', bg: '#051a0a' },
};

const ITEM_STATUS_NEXT = {
  TO_COOK: 'PREPARING',
  PREPARING: 'COMPLETED',
  COMPLETED: null,
};

const ITEM_STATUS_COLORS = {
  TO_COOK: { text: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  PREPARING: { text: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  COMPLETED: { text: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
};

const KitchenTicketCard = ({ ticket, onUpdateStatus, onUpdateItemStatus }) => {
  const [updatingTicket, setUpdatingTicket] = useState(false);
  const [updatingItems, setUpdatingItems] = useState({});

  const status = ticket.status || 'TO_COOK';
  const statusCfg = STATUS_FLOW[status] || STATUS_FLOW.TO_COOK;

  const handleTicketStatus = async () => {
    if (!statusCfg.next || !onUpdateStatus) return;
    setUpdatingTicket(true);
    try {
      await onUpdateStatus(ticket.id, statusCfg.next);
    } finally {
      setUpdatingTicket(false);
    }
  };

  const handleItemStatus = async (itemId, currentStatus) => {
    const next = ITEM_STATUS_NEXT[currentStatus];
    if (!next || !onUpdateItemStatus) return;
    setUpdatingItems(prev => ({ ...prev, [itemId]: true }));
    try {
      await onUpdateItemStatus(ticket.id, itemId, next);
    } finally {
      setUpdatingItems(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const orderNumber = ticket.order_number || ticket.order?.order_number || `T-${ticket.id}`;
  const tableNumber = ticket.table_number || ticket.order?.table?.table_number || '?';
  const source = ticket.source || ticket.order?.source || 'POS';

  return (
    <div style={{
      background: '#1a1a1a',
      border: `2px solid ${statusCfg.color}`,
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: `0 4px 20px ${statusCfg.color}25`,
      transition: 'all 0.3s ease',
    }}>
      {/* Header */}
      <div style={{
        background: statusCfg.bg,
        borderBottom: `1px solid ${statusCfg.color}40`,
        padding: '14px 18px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>#{orderNumber}</span>
              {source === 'SELF' && (
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 10,
                  background: 'rgba(99,102,241,0.2)', color: '#818cf8',
                  fontWeight: 700, letterSpacing: '0.05em',
                }}>SELF-ORDER</span>
              )}
            </div>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>
              🪑 Table {tableNumber}
              {ticket.floor_name && <span style={{ color: '#64748b' }}> · {ticket.floor_name}</span>}
            </div>
          </div>
          <div style={{
            textAlign: 'right',
          }}>
            <div style={{
              display: 'inline-block',
              padding: '3px 10px',
              borderRadius: 12,
              background: `${statusCfg.color}25`,
              color: statusCfg.color,
              fontSize: 11, fontWeight: 700,
            }}>
              {status.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>

      {/* Items list */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(ticket.items || []).map((item) => {
          const itemStatus = item.status || 'TO_COOK';
          const itemColors = ITEM_STATUS_COLORS[itemStatus] || ITEM_STATUS_COLORS.TO_COOK;
          const canAdvance = ITEM_STATUS_NEXT[itemStatus] !== null;

          return (
            <div
              key={item.id}
              onClick={() => canAdvance && handleItemStatus(item.id, itemStatus)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px',
                borderRadius: 10,
                background: itemStatus === 'COMPLETED' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)',
                border: `1px solid ${itemColors.bg}`,
                cursor: canAdvance ? 'pointer' : 'default',
                transition: 'all 0.2s',
                opacity: itemStatus === 'COMPLETED' ? 0.6 : 1,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: 600, color: '#e2e8f0', fontSize: 14,
                  textDecoration: itemStatus === 'COMPLETED' ? 'line-through' : 'none',
                }}>
                  <span style={{
                    display: 'inline-block', minWidth: 28, fontWeight: 800,
                    color: statusCfg.color, marginRight: 4,
                  }}>×{item.quantity}</span>
                  {item.product_name || item.product?.name || '—'}
                </div>
                {/* Show attribute options */}
                {item.options && item.options.length > 0 && (
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    {item.options.map(o => `${o.attribute_name || ''}: ${o.value || ''}`).join(' · ')}
                  </div>
                )}
                {updatingItems[item.id] && (
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>updating...</div>
                )}
              </div>
              <div style={{
                padding: '3px 10px', borderRadius: 10,
                background: itemColors.bg, color: itemColors.text,
                fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
              }}>
                {itemStatus.replace('_', ' ')}
              </div>
            </div>
          );
        })}

        {(!ticket.items || ticket.items.length === 0) && (
          <div style={{ textAlign: 'center', padding: '16px', color: '#4b5563', fontSize: 13 }}>
            No items
          </div>
        )}
      </div>

      {/* Action button */}
      {statusCfg.next && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid #2a2a2a' }}>
          <button
            onClick={handleTicketStatus}
            disabled={updatingTicket}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 10,
              border: 'none',
              cursor: updatingTicket ? 'wait' : 'pointer',
              background: `linear-gradient(135deg, ${statusCfg.color}cc, ${statusCfg.color})`,
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              opacity: updatingTicket ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
          >
            {updatingTicket ? 'Updating...' : statusCfg.label}
          </button>
        </div>
      )}

      {status === 'COMPLETED' && (
        <div style={{
          padding: '10px 16px',
          background: 'rgba(34,197,94,0.08)',
          borderTop: '1px solid rgba(34,197,94,0.2)',
          textAlign: 'center',
          color: '#22c55e', fontSize: 13, fontWeight: 600,
        }}>
          ✅ Ready to serve
        </div>
      )}
    </div>
  );
};

export default KitchenTicketCard;
