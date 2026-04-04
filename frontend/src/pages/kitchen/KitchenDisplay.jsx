import React from 'react';
import { usePolling } from '../../hooks/usePolling';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import KitchenTicketCard from '../../components/kitchen/KitchenTicketCard';
import { ChefHat, Clock, Check } from 'lucide-react';

const KitchenDisplay = () => {
  const { data: tickets, loading, error } = usePolling(
    () => api.get('/api/kitchen/tickets'),
    5000 // Poll every 5 seconds
  );

  const handleTicketStatusChange = async (ticketId, newStatus) => {
    try {
      await api.put(`/api/kitchen/tickets/${ticketId}/status`, { status: newStatus });
    } catch (error) {
      console.error('Failed to update ticket status:', error);
    }
  };

  const handleItemStatusChange = async (ticketId, itemId, newStatus) => {
    try {
      await api.put(`/api/kitchen/tickets/${ticketId}/items/${itemId}/status`, { status: newStatus });
    } catch (error) {
      console.error('Failed to update item status:', error);
    }
  };

  const groupTicketsByStatus = (tickets) => {
    if (!tickets) return { TO_COOK: [], PREPARING: [], COMPLETED: [] };
    
    return {
      TO_COOK: tickets.filter(t => t.status === 'TO_COOK'),
      PREPARING: tickets.filter(t => t.status === 'PREPARING'),
      COMPLETED: tickets.filter(t => t.status === 'COMPLETED'),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <Spinner size="lg" text="Loading kitchen display..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center text-white">
          <ChefHat className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">Kitchen Display Error</h2>
          <p className="text-gray-400">Unable to load kitchen tickets</p>
        </div>
      </div>
    );
  }

  const groupedTickets = groupTicketsByStatus(tickets);

  return (
    <div className="min-h-screen bg-dark-bg text-white p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <ChefHat className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Kitchen Display</h1>
        <p className="text-gray-400 text-sm">
          Auto-refreshes every 5 seconds • Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-h-screen overflow-hidden">
        {/* TO_COOK Column */}
        <div className="flex flex-col">
          <div className="bg-red-600 text-white p-3 rounded-t-lg font-semibold text-center">
            TO COOK ({groupedTickets.TO_COOK.length})
          </div>
          <div className="flex-1 overflow-y-auto bg-gray-900 rounded-b-lg p-2 space-y-2">
            {groupedTickets.TO_COOK.map((ticket) => (
              <KitchenTicketCard
                key={ticket.id}
                ticket={ticket}
                color="red"
                onTicketClick={() => handleTicketStatusChange(ticket.id, 'PREPARING')}
                onItemClick={(itemId) => handleItemStatusChange(ticket.id, itemId, 'PREPARING')}
              />
            ))}
            {groupedTickets.TO_COOK.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2" />
                <p>No tickets to cook</p>
              </div>
            )}
          </div>
        </div>

        {/* PREPARING Column */}
        <div className="flex flex-col">
          <div className="bg-amber-600 text-white p-3 rounded-t-lg font-semibold text-center">
            PREPARING ({groupedTickets.PREPARING.length})
          </div>
          <div className="flex-1 overflow-y-auto bg-gray-900 rounded-b-lg p-2 space-y-2">
            {groupedTickets.PREPARING.map((ticket) => (
              <KitchenTicketCard
                key={ticket.id}
                ticket={ticket}
                color="amber"
                onTicketClick={() => handleTicketStatusChange(ticket.id, 'COMPLETED')}
                onItemClick={(itemId) => handleItemStatusChange(ticket.id, itemId, 'COMPLETED')}
              />
            ))}
            {groupedTickets.PREPARING.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <ChefHat className="h-8 w-8 mx-auto mb-2" />
                <p>No items preparing</p>
              </div>
            )}
          </div>
        </div>

        {/* COMPLETED Column */}
        <div className="flex flex-col">
          <div className="bg-green-600 text-white p-3 rounded-t-lg font-semibold text-center">
            COMPLETED ({groupedTickets.COMPLETED.length})
          </div>
          <div className="flex-1 overflow-y-auto bg-gray-900 rounded-b-lg p-2 space-y-2">
            {groupedTickets.COMPLETED.map((ticket) => (
              <KitchenTicketCard
                key={ticket.id}
                ticket={ticket}
                color="green"
                onTicketClick={() => {}}
                onItemClick={() => {}}
                disabled={true}
              />
            ))}
            {groupedTickets.COMPLETED.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Check className="h-8 w-8 mx-auto mb-2" />
                <p>No completed items</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KitchenDisplay;
