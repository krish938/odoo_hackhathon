import React from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../ui/Button';
import { Plus, Minus, Trash2 } from 'lucide-react';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  return (
    <div className="flex items-center space-x-4 bg-gray-50 rounded-lg p-3">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">
          {item.product.name}
        </h4>
        {item.attributes && item.attributes.length > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            {item.attributes.map(attr => attr.value).join(', ')}
          </div>
        )}
        <p className="text-sm text-gray-600">
          {formatCurrency(item.unit_price)} × {item.quantity}
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onUpdateQuantity(item.quantity - 1)}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-8 text-center font-medium">
          {item.quantity}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onUpdateQuantity(item.quantity + 1)}
        >
          <Plus className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="text-right">
        <p className="font-medium text-gray-900">
          {formatCurrency(item.subtotal)}
        </p>
      </div>
    </div>
  );
};

export default CartItem;
