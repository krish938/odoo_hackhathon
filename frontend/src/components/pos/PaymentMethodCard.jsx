import React from 'react';
import Badge from '../ui/Badge';
import { CreditCard, Smartphone, DollarSign } from 'lucide-react';

const PaymentMethodCard = ({ method, selected, onClick }) => {
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

  return (
    <button
      onClick={() => onClick(method)}
      className={`p-4 rounded-lg border-2 transition-all ${
        selected?.id === method.id
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
  );
};

export default PaymentMethodCard;
