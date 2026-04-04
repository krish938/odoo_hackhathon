import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import usePosStore from '../../store/posStore';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { ArrowLeft, Send, CreditCard, Plus, Minus, Trash2, Search } from 'lucide-react';

const OrderScreen = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { activeSession, cart, addToCart, removeFromCart, updateQuantity, getCartSubtotal, getCartTax, getGrandTotal, setOrder, discount, setDiscount, tip, setTip } = usePosStore();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [table, setTable] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingToKitchen, setSendingToKitchen] = useState(false);
  const [showAttributeModal, setShowAttributeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});

  useEffect(() => {
    if (!activeSession) {
      navigate('/pos/open-session');
      return;
    }
    fetchData();
  }, [tableId, activeSession]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes, tableRes] = await Promise.all([
        api.get('/api/products'),
        api.get('/api/categories'),
        api.get(`/api/tables/${tableId}`),
      ]);

      const productsList = productsRes.data?.data ?? productsRes.data ?? [];
      const categoriesList = categoriesRes.data?.data ?? categoriesRes.data ?? [];
      const tableData = tableRes.data?.data ?? tableRes.data;

      setProducts(Array.isArray(productsList) ? productsList.filter(p => p.is_active) : []);
      setCategories(Array.isArray(categoriesList) ? categoriesList : []);
      setTable(tableData);

      // Check for existing active order
      const ordersRes = await api.get(`/api/orders?table_id=${tableId}&session_id=${activeSession.id}&status=CREATED,IN_PROGRESS`);
      const existingOrders = ordersRes.data?.data ?? ordersRes.data ?? [];

      if (Array.isArray(existingOrders) && existingOrders.length > 0) {
        const order = existingOrders[0];
        setActiveOrder(order);
        setOrder(order);
      }
    } catch (error) {
      console.error('Failed to fetch order data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCategory || product.category_id === parseInt(selectedCategory);
    const matchesSearch = !searchTerm || product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleProductClick = async (product) => {
    try {
      // Fetch attributes from API to check if product has variants
      const res = await api.get(`/api/products/${product.id}/attributes`);
      const attributes = res.data?.data ?? res.data ?? [];

      if (Array.isArray(attributes) && attributes.length > 0 && attributes.some(a => a.values && a.values.length > 0)) {
        // Product has selectable attributes — show variant picker
        setSelectedProduct({ ...product, attributes });
        setSelectedAttributes({});
        setShowAttributeModal(true);
      } else {
        // No attributes — add directly
        addToCart(product);
      }
    } catch (err) {
      // Fall back to direct add if attributes fetch fails
      addToCart(product);
    }
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const attributes = [];
    Object.entries(selectedAttributes).forEach(([attrId, valueId]) => {
      const attr = selectedProduct.attributes.find(a => a.id === parseInt(attrId));
      if (attr) {
        const value = attr.values.find(v => v.id === parseInt(valueId));
        if (value) {
          attributes.push({
            attribute_id: parseInt(attrId),
            attribute_value_id: parseInt(valueId),
            value: value.value,
            extra_price: value.extra_price,
          });
        }
      }
    });

    addToCart(selectedProduct, 1, attributes);
    setShowAttributeModal(false);
    setSelectedProduct(null);
    setSelectedAttributes({});
  };

  const handleSendToKitchen = async () => {
    if (cart.length === 0) return;
    
    try {
      setSendingToKitchen(true);
      
      let order = activeOrder;
      
      // Create new order if none exists
      if (!order) {
        const orderData = {
          session_id: activeSession.id,
          table_id: parseInt(tableId),
          source: 'POS',
        };
        
        const orderRes = await api.post('/api/orders', orderData);
        order = orderRes.data;
        setActiveOrder(order);
        setOrder(order);
      }
      
      // Add items to order
      for (const item of cart) {
        await api.post(`/api/orders/${order.id}/items`, {
          product_id: item.product_id,
          quantity: item.quantity,
          base_price: item.base_price,
          unit_price: item.unit_price,
        });
        
        // Add attributes if any
        if (item.attributes && item.attributes.length > 0) {
          // This would need to be implemented in the backend
        }
      }
      
      // Send to kitchen
      await api.post(`/api/orders/${order.id}/send-to-kitchen`);
      
      // Clear cart and update order status
      setOrder({ ...order, status: 'IN_PROGRESS' });
      
      // Navigate to payment
      navigate(`/pos/payment/${order.id}`);
    } catch (error) {
      console.error('Failed to send to kitchen:', error);
    } finally {
      setSendingToKitchen(false);
    }
  };

  const handleCharge = () => {
    if (cart.length === 0) return;
    
    // If we have an order, navigate to payment
    if (activeOrder) {
      navigate(`/pos/payment/${activeOrder.id}`);
    } else {
      // Create order first, then navigate
      handleSendToKitchen();
    }
  };

  if (loading) {
    return <Spinner size="lg" text="Loading order screen..." />;
  }

  return (
    <div className="min-h-screen bg-page-bg">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/pos/floor')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {table?.table_number || 'Table'} - Order
              </h1>
              <p className="text-sm text-gray-600">
                {activeOrder?.order_number || 'New Order'}
              </p>
            </div>
          </div>
          
          {activeOrder && (
            <Badge variant={activeOrder.status === 'IN_PROGRESS' ? 'warning' : 'info'}>
              {activeOrder.status}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex h-screen">
        {/* Product Grid (60%) */}
        <div className="w-3/5 p-6 overflow-y-auto">
          {/* Search and Category Filter */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex space-x-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                  !selectedCategory
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id.toString())}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                    selectedCategory === category.id.toString()
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow text-left"
              >
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  <div className="text-2xl">🍽️</div>
                </div>
                <h3 className="font-medium text-gray-900 text-sm mb-1">
                  {product.name}
                </h3>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(product.base_price)}
                </p>
                {product.send_to_kitchen && (
                  <Badge variant="info" className="mt-2 text-xs">
                    Kitchen
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Cart (40%) */}
        <div className="w-2/5 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">🛒</div>
                <p>No items in cart</p>
                <p className="text-sm mt-2">Add items from the menu to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 bg-gray-50 rounded-lg p-3">
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
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(index)}
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
                ))}
              </div>
            )}
          </div>
          
          {/* Order Totals */}
          <div className="border-t border-gray-200 p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(getCartSubtotal())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>{formatCurrency(getCartTax())}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Input
                  label="Discount"
                  type="number"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="flex-1"
                  placeholder="0.00"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Input
                  label="Tip"
                  type="number"
                  step="0.01"
                  value={tip}
                  onChange={(e) => setTip(parseFloat(e.target.value) || 0)}
                  className="flex-1"
                  placeholder="0.00"
                />
              </div>
              
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(getGrandTotal())}</span>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleSendToKitchen}
                disabled={cart.length === 0 || sendingToKitchen}
                loading={sendingToKitchen}
                className="flex-1"
                variant="outline"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendingToKitchen ? 'Sending...' : 'Send to Kitchen'}
              </Button>
              
              <Button
                onClick={handleCharge}
                disabled={cart.length === 0}
                className="flex-1"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Charge
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Attribute Selection Modal */}
      <Modal
        isOpen={showAttributeModal}
        onClose={() => setShowAttributeModal(false)}
        title={`Customize ${selectedProduct?.name}`}
        size="lg"
      >
        {selectedProduct?.attributes?.map((attribute) => (
          <div key={attribute.id} className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">{attribute.name}</h3>
            <div className="space-y-2">
              {attribute.values.map((value) => (
                <label key={value.id} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name={`attribute-${attribute.id}`}
                    value={value.id}
                    checked={selectedAttributes[attribute.id] === value.id.toString()}
                    onChange={(e) => setSelectedAttributes({
                      ...selectedAttributes,
                      [attribute.id]: e.target.value
                    })}
                    className="text-primary"
                  />
                  <div className="flex-1">
                    <span className="font-medium">{value.value}</span>
                    {value.extra_price > 0 && (
                      <span className="text-sm text-gray-500 ml-2">
                        (+{formatCurrency(value.extra_price)})
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={() => setShowAttributeModal(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleAddToCart}>
            Add to Cart
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default OrderScreen;
