import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Spinner from '../../components/ui/Spinner';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

const Attributes = () => {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAttributeModal, setShowAttributeModal] = useState(false);
  const [showValueModal, setShowValueModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleteType, setDeleteType] = useState('');
  const [expandedAttributes, setExpandedAttributes] = useState(new Set());
  const [attributeForm, setAttributeForm] = useState({ name: '' });
  const [valueForm, setValueForm] = useState({ value: '', extra_price: '' });

  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/attributes');
      setAttributes(response.data?.data ?? response.data ?? []);
    } catch (error) {
      console.error('Failed to fetch attributes:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (attributeId) => {
    const newExpanded = new Set(expandedAttributes);
    if (newExpanded.has(attributeId)) {
      newExpanded.delete(attributeId);
    } else {
      newExpanded.add(attributeId);
    }
    setExpandedAttributes(newExpanded);
  };

  const handleAttributeSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAttribute) {
        await api.put(`/api/attributes/${editingAttribute.id}`, attributeForm);
      } else {
        await api.post('/api/attributes', attributeForm);
      }

      setShowAttributeModal(false);
      resetAttributeForm();
      fetchAttributes();
    } catch (error) {
      console.error('Failed to save attribute:', error);
    }
  };

  const handleValueSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        value: valueForm.value,
        extra_price: parseFloat(valueForm.extra_price) || 0,
      };

      await api.post(`/api/attributes/${selectedAttribute.id}/values`, data);
      setShowValueModal(false);
      resetValueForm();
      fetchAttributes();
    } catch (error) {
      console.error('Failed to add attribute value:', error);
    }
  };

  const handleDelete = async () => {
    try {
      if (deleteType === 'attribute') {
        await api.delete(`/api/attributes/${deletingItem.id}`);
      } else {
        await api.delete(`/api/attributes/${selectedAttribute.id}/values/${deletingItem.id}`);
      }

      setShowDeleteModal(false);
      setDeletingItem(null);
      setDeleteType('');
      fetchAttributes();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const resetAttributeForm = () => {
    setAttributeForm({ name: '' });
    setEditingAttribute(null);
  };

  const resetValueForm = () => {
    setValueForm({ value: '', extra_price: '' });
    setSelectedAttribute(null);
  };

  const openEditAttributeModal = (attribute) => {
    setEditingAttribute(attribute);
    setAttributeForm({ name: attribute.name });
    setShowAttributeModal(true);
  };

  const openValueModal = (attribute) => {
    setSelectedAttribute(attribute);
    setShowValueModal(true);
  };

  const openDeleteModal = (item, type, attribute = null) => {
    setDeletingItem(item);
    setDeleteType(type);
    if (attribute) setSelectedAttribute(attribute);
    setShowDeleteModal(true);
  };

  if (loading) {
    return <Spinner size="lg" text="Loading attributes..." />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Product Attributes</h1>
        <Button onClick={() => { resetAttributeForm(); setShowAttributeModal(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Attribute
        </Button>
      </div>

      {/* Attributes List */}
      <div className="space-y-4">
        {attributes.map((attribute) => (
          <div key={attribute.id} className="bg-white rounded-xl shadow-sm">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleExpanded(attribute.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {expandedAttributes.has(attribute.id) ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </button>
                  <h3 className="font-medium text-gray-900">{attribute.name}</h3>
                  <Badge variant="info">
                    {attribute.values?.length || 0} values
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openValueModal(attribute)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Value
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditAttributeModal(attribute)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDeleteModal(attribute, 'attribute')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Attribute Values */}
              {expandedAttributes.has(attribute.id) && attribute.values && (
                <div className="mt-4 ml-8 space-y-2">
                  {attribute.values.length > 0 ? (
                    attribute.values.map((value) => (
                      <div
                        key={value.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <span className="font-medium text-gray-900">
                            {value.value}
                          </span>
                          {value.extra_price > 0 && (
                            <span className="ml-2 text-sm text-gray-500">
                              (+₹{value.extra_price})
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteModal(value, 'value', attribute)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No values added yet
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {attributes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No attributes found
        </div>
      )}

      {/* Add/Edit Attribute Modal */}
      <Modal
        isOpen={showAttributeModal}
        onClose={() => setShowAttributeModal(false)}
        title={editingAttribute ? 'Edit Attribute' : 'Add Attribute'}
      >
        <form onSubmit={handleAttributeSubmit} className="space-y-4">
          <Input
            label="Attribute Name"
            value={attributeForm.name}
            onChange={(e) => setAttributeForm({ ...attributeForm, name: e.target.value })}
            required
            placeholder="e.g., Size, Add-ons"
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAttributeModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingAttribute ? 'Update' : 'Create'} Attribute
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Value Modal */}
      <Modal
        isOpen={showValueModal}
        onClose={() => setShowValueModal(false)}
        title={`Add Value to "${selectedAttribute?.name}"`}
      >
        <form onSubmit={handleValueSubmit} className="space-y-4">
          <Input
            label="Value"
            value={valueForm.value}
            onChange={(e) => setValueForm({ ...valueForm, value: e.target.value })}
            required
            placeholder="e.g., Small, Medium, Large"
          />

          <Input
            label="Extra Price"
            type="number"
            step="0.01"
            value={valueForm.extra_price}
            onChange={(e) => setValueForm({ ...valueForm, extra_price: e.target.value })}
            placeholder="0.00"
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowValueModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Add Value
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={`Delete ${deleteType === 'attribute' ? 'Attribute' : 'Value'}`}
        message={`Are you sure you want to delete "${deletingItem?.name || deletingItem?.value}"? This action cannot be undone.`}
        variant="danger"
      />
    </div>
  );
};

export default Attributes;
