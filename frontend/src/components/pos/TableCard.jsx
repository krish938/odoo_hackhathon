import React from 'react';
import Badge from '../ui/Badge';
import { Users } from 'lucide-react';

const TableCard = ({ table, onClick, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'free':
        return 'bg-green-100 border-green-300 hover:bg-green-200';
      case 'occupied':
        return 'bg-orange-100 border-orange-300 hover:bg-orange-200';
      default:
        return 'bg-gray-100 border-gray-300 hover:bg-gray-200';
    }
  };

  return (
    <button
      onClick={() => onClick(table)}
      className={`relative p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${getStatusColor()}`}
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
      </div>
    </button>
  );
};

export default TableCard;
