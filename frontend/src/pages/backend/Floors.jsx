import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Spinner from '../../components/ui/Spinner';
import { Plus, Edit2, Trash2, Building, Users } from 'lucide-react';

const Floors = () => {
  const [floors, setFloors] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingFloor, setEditingFloor] = useState(null);
  const [editingTable, setEditingTable] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleteType, setDeleteType] = useState('');
  const [floorForm, setFloorForm] = useState({ name: '' });
  const [tableForm, setTableForm] = useState({
    table_number: '',
    seats: '',
    appointment_resource: '',
    is_active: true,
  });

  useEffect(() => {
    fetchFloors();
  }, []);

  useEffect(() => {
    if (selectedFloor) {
      fetchTables(selectedFloor.id);
    }
  }, [selectedFloor]);

  const fetchFloors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/floors');
      setFloors(response.data);
      if (response.data.length > 0 && !selectedFloor) {
        setSelectedFloor(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch floors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async (floorId) => {
    try {
      const response = await api.get(`/api/floors/${floorId}/tables`);
      setTables(response.data);
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    }
  };

  const handleFloorSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFloor) {
        await api.put(`/api/floors/${editingFloor.id}`, floorForm);
      } else {
        await api.post('/api/floors', floorForm);
      }

      setShowFloorModal(false);
      resetFloorForm();
      fetchFloors();
    } catch (error) {
      console.error('Failed to save floor:', error);
    }
  };

  const handleTableSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...tableForm,
        floor_id: selectedFloor.id,
        seats: parseInt(tableForm.seats),
      };

      if (editingTable) {
        await api.put(`/api/tables/${editingTable.id}`, data);
      } else {
        await api.post('/api/tables', data);
      }

      setShowTableModal(false);
      resetTableForm();
      fetchTables(selectedFloor.id);
    } catch (error) {
      console.error('Failed to save table:', error);
    }
  };

  const handleDelete = async () => {
    try {
      if (deleteType === 'floor') {
        await api.delete(`/api/floors/${deletingItem.id}`);
        fetchFloors();
      } else {
        await api.delete(`/api/tables/${deletingItem.id}`);
        fetchTables(selectedFloor.id);
      }

      setShowDeleteModal(false);
      setDeletingItem(null);
      setDeleteType('');
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const resetFloorForm = () => {
    setFloorForm({ name: '' });
    setEditingFloor(null);
  };

  const resetTableForm = () => {
    setTableForm({
      table_number: '',
      seats: '',
      appointment_resource: '',
      is_active: true,
    });
    setEditingTable(null);
  };

  const openEditFloorModal = (floor) => {
    setEditingFloor(floor);
    setFloorForm({ name: floor.name });
    setShowFloorModal(true);
  };

  const openEditTableModal = (table) => {
    setEditingTable(table);
    setTableForm({
      table_number: table.table_number,
      seats: table.seats,
      appointment_resource: table.appointment_resource || '',
      is_active: table.is_active !== false,
    });
    setShowTableModal(true);
  };

  const openDeleteModal = (item, type) => {
    setDeletingItem(item);
    setDeleteType(type);
    setShowDeleteModal(true);
  };

  if (loading) {
    return <Spinner size="lg" text="Loading floors and tables..." />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Floors & Tables</h1>
        <div className="flex space-x-3">
          <Button onClick={() => { resetTableForm(); setShowTableModal(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Table
          </Button>
          <Button onClick={() => { resetFloorForm(); setShowFloorModal(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Floor
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Floors List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Floors</h2>
            <div className="space-y-2">
              {floors.map((floor) => (
                <button
                  key={floor.id}
                  onClick={() => setSelectedFloor(floor)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedFloor?.id === floor.id
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2" />
                      <span className="font-medium">{floor.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditFloorModal(floor);
                      }}
                      className={selectedFloor?.id === floor.id ? 'text-white hover:bg-white/20' : ''}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </button>
              ))}
            </div>
            
            {floors.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No floors found
              </div>
            )}
          </div>
        </div>

        {/* Tables Grid */}
        <div className="lg:col-span-3">
          {selectedFloor ? (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">
                {selectedFloor.name} - Tables
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tables.map((table) => (
                  <div
                    key={table.id}
                    className={`border rounded-xl p-4 ${
                      table.is_active ? 'border-gray-200' : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {table.table_number}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Users className="h-4 w-4 mr-1" />
                          {table.seats} seats
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditTableModal(table)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteModal(table, 'table')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {table.appointment_resource && (
                      <div className="text-sm text-gray-600 mb-3">
                        Resource: {table.appointment_resource}
                      </div>
                    )}

                    <Badge variant={table.is_active ? 'success' : 'danger'}>
                      {table.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </div>

              {tables.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No tables found on this floor
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
              Select a floor to view tables
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Floor Modal */}
      <Modal
        isOpen={showFloorModal}
        onClose={() => setShowFloorModal(false)}
        title={editingFloor ? 'Edit Floor' : 'Add Floor'}
      >
        <form onSubmit={handleFloorSubmit} className="space-y-4">
          <Input
            label="Floor Name"
            value={floorForm.name}
            onChange={(e) => setFloorForm({ ...floorForm, name: e.target.value })}
            required
            placeholder="e.g., Ground Floor, First Floor"
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFloorModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingFloor ? 'Update' : 'Create'} Floor
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Table Modal */}
      <Modal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        title={editingTable ? 'Edit Table' : 'Add Table'}
      >
        <form onSubmit={handleTableSubmit} className="space-y-4">
          <Input
            label="Table Number"
            value={tableForm.table_number}
            onChange={(e) => setTableForm({ ...tableForm, table_number: e.target.value })}
            required
            placeholder="e.g., T1, T2, A1"
          />

          <Input
            label="Number of Seats"
            type="number"
            value={tableForm.seats}
            onChange={(e) => setTableForm({ ...tableForm, seats: e.target.value })}
            required
            min="1"
            max="20"
          />

          <Input
            label="Appointment Resource (Optional)"
            value={tableForm.appointment_resource}
            onChange={(e) => setTableForm({ ...tableForm, appointment_resource: e.target.value })}
            placeholder="e.g., Window, Corner, Patio"
          />

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={tableForm.is_active}
              onChange={(e) => setTableForm({ ...tableForm, is_active: e.target.checked })}
              className="mr-2"
            />
            Active
          </label>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTableModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingTable ? 'Update' : 'Create'} Table
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={`Delete ${deleteType === 'floor' ? 'Floor' : 'Table'}`}
        message={`Are you sure you want to delete "${deletingItem?.name || deletingItem?.table_number}"? This action cannot be undone.`}
        variant="danger"
      />
    </div>
  );
};

export default Floors;
