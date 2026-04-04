import React from 'react';
import Badge from '../../components/ui/Badge';
import { formatCurrency, getRelativeTime } from '../../utils/formatCurrency';
import { Check, Clock, ChefHat } from 'lucide-react';

const KitchenTicketCard = ({ ticket, color, onTicketClick, onItemClick, disabled = false }) => {
  const getBorderColor = () => {
    switch (color) {
      case 'red':
        return 'border-red-500';
      case 'amber':
        return 'border-amber-500';
      case 'green':
        return 'border-green-500';
      default:
        return 'border-gray-500';
    }
  };

  const getHeaderColor = () => {
    switch (color) {
      case 'red':
        return 'bg-red-600';
      case 'amber':
        return 'bg-amber-600';
      case 'green':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div
      className={`bg-gray-800 border-2 ${getBorderColor()} rounded-lg overflow-hidden ${!disabled ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={() => !disabled && onTicketClick && onTicketClick()}
    >
      {/* Header */}
      <div className={`${getHeaderColor()} text-white p-3`}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg">#{ticket.order?.order_number}</h3>
            <p className="text-sm opacity-90">Table {ticket.order?.table?.table_number}</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-75">
              {getRelativeTime(ticket.created_at)}
            </p>
            {ticket.order?.total_amount && (
              <p className="text-sm font-semibold">
                {formatCurrency(ticket.order.total_amount)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="p-3 space-y-2">
        {ticket.items?.map((item) => (
          <div
            key={item.id}
            className={`flex items-center justify-between p-2 bg-gray-700 rounded ${!disabled ? 'cursor-pointer hover:bg-gray-600' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled && onItemClick) onItemClick(item.id);
            }}
          >
            <div className="flex-1">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={item.status === 'COMPLETED'}
                  onChange={() => {}}
                  className="mr-2"
                  disabled={disabled}
                />
                <div>
                  <p className={`font-medium ${item.status === 'COMPLETED' ? 'line-through text-gray-500' : ''}`}>
                    {item.quantity}x {item.product?.name}
                  </p>
                  {item.product?.attributes && item.product.attributes.length > 0 && (
                    <p className="text-xs text-gray-400">
                      {item.product.attributes.map(attr => attr.value).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <Badge variant={item.status === 'COMPLETED' ? 'success' : item.status === 'PREPARING' ? 'warning' : 'danger'}>
              {item.status}
            </Badge>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 px-3 py-2 text-xs text-gray-400">
        {disabled ? (
          <span className="text-green-400">✓ Completed</span>
        ) : (
          <span>Click to {color === 'red' ? 'start preparing' : 'mark complete'}</span>
        )}
      </div>
    </div>
  );
};

export default KitchenTicketCard;
