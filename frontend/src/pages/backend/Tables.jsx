import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  available: '#22c55e',
  occupied: '#f59e0b',
  reserved: '#3b82f6',
};

const STATUS_LABELS = {
  available: 'Available',
  occupied: 'Occupied',
  reserved: 'Reserved',
};

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ table_number: '', seats: 4, floor_id: '', status: 'available' });
  const [saving, setSaving] = useState(false);

  const fetchFloors = useCallback(async () => {
    try {
      const res = await api.get('/api/floors');
      const data = res.data?.data ?? res.data ?? [];
      setFloors(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load floors');
    }
  }, []);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const params = selectedFloor ? { floor_id: selectedFloor } : {};
      const res = await api.get('/api/tables', { params });
      const data = res.data?.data ?? res.data ?? [];
      setTables(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  }, [selectedFloor]);

  useEffect(() => {
    fetchFloors();
  }, [fetchFloors]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const openAddModal = () => {
    setEditingTable(null);
    setForm({ table_number: '', seats: 4, floor_id: selectedFloor || (floors[0]?.id || ''), status: 'available' });
    setShowModal(true);
  };

  const openEditModal = (table) => {
    setEditingTable(table);
    setForm({
      table_number: table.table_number,
      seats: table.seats || 4,
      floor_id: table.floor_id,
      status: table.status || 'available',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.table_number || !form.floor_id) {
      toast.error('Table number and floor are required');
      return;
    }
    setSaving(true);
    try {
      if (editingTable) {
        await api.put(`/api/tables/${editingTable.id}`, form);
        toast.success('Table updated');
      } else {
        await api.post('/api/tables', form);
        toast.success('Table created');
      }
      setShowModal(false);
      fetchTables();
    } catch (err) {
      // toast handled by axios interceptor
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (table) => {
    try {
      await api.put(`/api/tables/${table.id}`, { is_active: !table.is_active });
      toast.success(table.is_active ? 'Table deactivated' : 'Table reactivated');
      fetchTables();
    } catch (err) {}
  };

  const handleDelete = async (table) => {
    try {
      await api.delete(`/api/tables/${table.id}`);
      toast.success('Table deleted');
      setConfirmDelete(null);
      fetchTables();
    } catch (err) {}
  };

  const getFloorName = (floorId) => floors.find(f => f.id === floorId)?.name || '-';

  return (
    <div style={{ padding: '24px', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Tables</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
            {tables.length} tables {selectedFloor ? `in ${getFloorName(parseInt(selectedFloor))}` : 'across all floors'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {/* Floor filter */}
          <select
            value={selectedFloor}
            onChange={e => setSelectedFloor(e.target.value)}
            style={{
              padding: '8px 14px', borderRadius: 8, border: '1px solid #d1d5db',
              background: '#fff', fontSize: 14, cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="">All Floors</option>
            {floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <button
            onClick={openAddModal}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', border: 'none', borderRadius: 8,
              padding: '8px 18px', fontWeight: 600, cursor: 'pointer',
              fontSize: 14, display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            + Add Table
          </button>
        </div>
      </div>

      {/* Table list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{
            width: 40, height: 40,
            border: '4px solid #e5e7eb',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
        </div>
      ) : tables.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 80,
          background: '#f9fafb', borderRadius: 12,
          border: '2px dashed #e5e7eb',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🪑</div>
          <h3 style={{ color: '#6b7280', fontWeight: 500 }}>No tables found</h3>
          <p style={{ color: '#9ca3af', fontSize: 14 }}>
            {selectedFloor ? 'No tables on this floor' : 'Click "+ Add Table" to create your first table'}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                {['Table #', 'Floor', 'Seats', 'Status', 'Active', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '8px 16px', fontSize: 12, fontWeight: 600,
                    color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tables.map(table => (
                <tr key={table.id} style={{
                  background: '#fff',
                  opacity: table.is_active ? 1 : 0.5,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}>
                  <td style={{ padding: '14px 16px', borderRadius: '8px 0 0 8px', fontWeight: 700 }}>
                    #{table.table_number}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#374151' }}>
                    {table.floor_name || getFloorName(table.floor_id)}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#374151' }}>
                    {table.seats || 4} seats
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: `${STATUS_COLORS[table.status] || '#6b7280'}20`,
                      color: STATUS_COLORS[table.status] || '#6b7280',
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: STATUS_COLORS[table.status] || '#6b7280',
                      }} />
                      {STATUS_LABELS[table.status] || table.status || 'Unknown'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => handleToggleActive(table)}
                      style={{
                        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                        background: table.is_active ? '#22c55e' : '#d1d5db',
                        position: 'relative', transition: 'background 0.2s',
                      }}
                    >
                      <div style={{
                        position: 'absolute', top: 3,
                        left: table.is_active ? '52%' : '4%',
                        width: 18, height: 18, borderRadius: '50%', background: '#fff',
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }} />
                    </button>
                  </td>
                  <td style={{ padding: '14px 16px', borderRadius: '0 8px 8px 0' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => openEditModal(table)}
                        style={{
                          padding: '6px 14px', borderRadius: 6, border: '1px solid #e5e7eb',
                          background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                          color: '#374151', transition: 'all 0.2s',
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(table)}
                        style={{
                          padding: '6px 14px', borderRadius: 6, border: '1px solid #fee2e2',
                          background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                          color: '#ef4444', transition: 'all 0.2s',
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 32,
            width: '90%', maxWidth: 440,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 700 }}>
              {editingTable ? 'Edit Table' : 'Add New Table'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Table Number *
                </label>
                <input
                  type="number"
                  value={form.table_number}
                  onChange={e => setForm(p => ({ ...p, table_number: e.target.value }))}
                  placeholder="e.g. 1, 2, 101..."
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid #d1d5db', fontSize: 14, outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Floor *
                </label>
                <select
                  value={form.floor_id}
                  onChange={e => setForm(p => ({ ...p, floor_id: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid #d1d5db', fontSize: 14, outline: 'none',
                    background: '#fff',
                  }}
                >
                  <option value="">Select floor...</option>
                  {floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Seats
                </label>
                <input
                  type="number" min="1" max="20"
                  value={form.seats}
                  onChange={e => setForm(p => ({ ...p, seats: parseInt(e.target.value) || 4 }))}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid #d1d5db', fontSize: 14, outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid #d1d5db', fontSize: 14, outline: 'none',
                    background: '#fff',
                  }}
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #e5e7eb',
                  background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 2, padding: '10px', borderRadius: 8, border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14,
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Saving...' : (editingTable ? 'Save Changes' : 'Create Table')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1001,
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 32,
            width: '90%', maxWidth: 360,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h3 style={{ margin: '0 0 8px', fontWeight: 700 }}>Delete Table #{confirmDelete.table_number}?</h3>
            <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 24px' }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #e5e7eb',
                  background: '#fff', cursor: 'pointer', fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                  background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 600,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
