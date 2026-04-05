import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { ShoppingCart, Plus, Minus, Trash2, Search, Coffee, Check } from 'lucide-react';

const SelfOrder = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showAttributeModal, setShowAttributeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('No token provided. Please scan a valid QR code.');
      setLoading(false);
      return;
    }
    
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [menuRes, tableRes] = await Promise.all([
        api.get(`/api/self-order/menu?token=${token}`),
        api.get(`/api/self-order/table?token=${token}`)
      ]);
      
      setProducts(menuRes.data.products || []);
      setCategories(menuRes.data.categories || []);
      setTable(tableRes.data);
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes('expired')) {
        setError('This QR code has expired. Please ask staff for a new one.');
      } else if (err.response?.status === 400 && err.response?.data?.message?.includes('invalid')) {
        setError('This QR code is invalid. Please ask staff for assistance.');
      } else {
        setError('Unable to load menu. Please try again or ask staff for help.');
      }
      console.error('Self-order error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCategory || product.category_id === parseInt(selectedCategory);
    const matchesSearch = !searchTerm || product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product, quantity = 1, attributes = []) => {
    const existingItemIndex = cart.findIndex(
      item => 
        item.product_id === product.id &&
        JSON.stringify(item.attributes || []) === JSON.stringify(attributes)
    );

    if (existingItemIndex >= 0) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += quantity;
      setCart(updatedCart);
    } else {
      const newItem = {
        product_id: product.id,
        product,
        quantity,
        base_price: product.base_price,
        unit_price: product.base_price,
        attributes,
        subtotal: product.base_price * quantity,
      };
      
      // Add attribute prices to subtotal
      if (attributes.length > 0) {
        const attributeTotal = attributes.reduce((sum, attr) => sum + (attr.extra_price || 0), 0);
        newItem.subtotal += attributeTotal * quantity;
      }
      
      setCart([...cart, newItem]);
    }
  };

  const removeFromCart = (index) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
  };

  const updateQuantity = (index, quantity) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }

    const updatedCart = [...cart];
    updatedCart[index].quantity = quantity;
    updatedCart[index].subtotal = updatedCart[index].base_price * quantity;
    
    // Recalculate attribute prices
    if (updatedCart[index].attributes) {
      const attributeTotal = updatedCart[index].attributes.reduce(
        (sum, attr) => sum + (attr.extra_price || 0), 0
      );
      updatedCart[index].subtotal += attributeTotal * quantity;
    }
    
    setCart(updatedCart);
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const handleProductClick = (product) => {
    if (product.attributes && product.attributes.length > 0) {
      setSelectedProduct(product);
      setSelectedAttributes({});
      setShowAttributeModal(true);
    } else {
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
            extra_price: value.extra_price
          });
        }
      }
    });
    
    addToCart(selectedProduct, 1, attributes);
    setShowAttributeModal(false);
    setSelectedProduct(null);
    setSelectedAttributes({});
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    
    try {
      setPlacingOrder(true);
      
      const orderData = {
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          base_price: item.base_price,
          unit_price: item.unit_price,
          attributes: item.attributes || [],
        })),
      };
      
      const response = await api.post(`/api/self-order/orders?token=${token}`, orderData);
      setOrderData(response.data);
      setOrderPlaced(true);
      setCart([]);
    } catch (error) {
      console.error('Failed to place order:', error);
      setError('Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center p-4">
        <Spinner size="lg" text="Loading menu..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">QR Code Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-success flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="mx-auto h-24 w-24 bg-white/20 rounded-full flex items-center justify-center mb-6">
            <Check className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Order Placed Successfully!</h1>
          <p className="text-2xl mb-2">Your order number is</p>
          <p className="text-5xl font-bold mb-6">{orderData?.order_number}</p>
          <p className="text-lg opacity-90 mb-2">Table {table?.table_number}</p>
          <p className="text-lg mt-6 opacity-80">Your order will be prepared shortly</p>
          <div className="flex flex-col gap-3 mt-8">
            <button
              onClick={() => { setOrderPlaced(false); setOrderData(null); }}
              className="px-8 py-3 bg-white text-green-700 rounded-xl font-bold text-lg hover:bg-green-50 transition"
            >
              Place Another Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page-bg">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Coffee className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Odoo POS Cafe</h1>
                <p className="text-sm text-gray-600">Table {table?.table_number}</p>
              </div>
            </div>
            
            <Button
              onClick={() => setShowCart(!showCart)}
              className="relative"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Cart
              {getCartItemCount() > 0 && (
                <span className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                  {getCartItemCount()}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Menu */}
        <div className={`${showCart ? 'hidden md:block' : 'block'} flex-1 p-4`}>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Categories */}
          <div className="mb-6">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-lg whitespace-nowrap flex-shrink-0 ${
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
                  className={`px-4 py-2 rounded-lg whitespace-nowrap flex-shrink-0 ${
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
          
          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow text-left"
              >
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  <div className="text-3xl">🍽️</div>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">
                  {product.name}
                </h3>
                {product.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {product.description}
                  </p>
                )}
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(product.base_price)}
                </p>
                {product.send_to_kitchen && (
                  <Badge variant="info" className="mt-2 text-xs">
                    Kitchen Item
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className={`${showCart ? 'block' : 'hidden md:block'} w-full md:w-96 bg-white border-l border-gray-200`}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Cart</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCart(false)}
                className="md:hidden"
              >
                ×
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Your cart is empty</p>
                  <p className="text-sm mt-2">Add items from the menu</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {item.product.name}
                          </h4>
                          {item.attributes && item.attributes.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {item.attributes.map(attr => attr.value).join(', ')}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
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
                        </div>
                        
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {formatCurrency(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Cart Footer */}
            <div className="border-t border-gray-200 p-4">
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(getCartTotal())}</span>
                </div>
              </div>
              
              <Button
                onClick={placeOrder}
                disabled={cart.length === 0 || placingOrder}
                loading={placingOrder}
                className="w-full"
              >
                {placingOrder ? 'Placing Order...' : 'Place Order'}
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

export default SelfOrder;
