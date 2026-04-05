import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const usePosStore = create(
  persist(
    (set, get) => ({
      // State
      activeSession: null,
      activeTerminal: null,
      activeTable: null,
      activeOrder: null,
      cart: [],
      
      // Actions
      setSession: (session) => {
        set({
          activeSession: session,
          activeTerminal: session.terminal,
        });
      },

      setTable: (table) => {
        set({ activeTable: table });
      },

      setOrder: (order) => {
        set({ activeOrder: order });
        // Load order items into cart
        if (order && order.items) {
          const itemsWithTotals = order.items.map(item => {
            const basePrice = parseFloat(item.base_price) || 0;
            const unitPrice = parseFloat(item.unit_price) || basePrice;
            return {
              ...item,
              base_price: basePrice,
              unit_price: unitPrice,
              subtotal: unitPrice * item.quantity
            };
          });
          set({ cart: itemsWithTotals });
        }
      },

      clearSession: () => {
        set({
          activeSession: null,
          activeTerminal: null,
          activeTable: null,
          activeOrder: null,
          cart: [],
        });
      },

      // Cart operations
      addToCart: (product, quantity = 1, attributes = []) => {
        const { cart } = get();
        
        // Check if item already exists with same attributes
        const existingItemIndex = cart.findIndex(
          item => 
            item.product_id === product.id &&
            JSON.stringify(item.attributes || []) === JSON.stringify(attributes)
        );

        if (existingItemIndex >= 0) {
          // Update quantity of existing item
          const updatedCart = [...cart];
          const item = updatedCart[existingItemIndex];
          item.quantity += quantity;
          item.subtotal = item.unit_price * item.quantity;
          set({ cart: updatedCart });
        } else {
          // Add new item to cart
          const basePrice = parseFloat(product.base_price) || 0;
          let unitPrice = basePrice;
          
          if (attributes && attributes.length > 0) {
            const attrTotal = attributes.reduce((sum, attr) => sum + (parseFloat(attr.extra_price) || 0), 0);
            unitPrice += attrTotal;
          }

          const newItem = {
            product_id: product.id,
            product,
            quantity,
            base_price: basePrice,
            unit_price: unitPrice,
            attributes,
            subtotal: unitPrice * quantity,
          };
          set({ cart: [...cart, newItem] });
        }
      },

      removeFromCart: (index) => {
        const { cart } = get();
        const updatedCart = cart.filter((_, i) => i !== index);
        set({ cart: updatedCart });
      },

      updateQuantity: (index, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(index);
          return;
        }

        const { cart } = get();
        const updatedCart = [...cart];
        const item = updatedCart[index];
        item.quantity = quantity;
        
        const basePrice = parseFloat(item.base_price) || 0;
        let unitPrice = basePrice;
        
        // Add attribute prices to subtotal
        if (item.attributes) {
          const attributeTotal = item.attributes.reduce(
            (sum, attr) => sum + (parseFloat(attr.extra_price) || 0), 0
          );
          unitPrice += attributeTotal;
        }
        
        item.unit_price = unitPrice;
        item.subtotal = unitPrice * quantity;
        
        set({ cart: updatedCart });
      },

      clearCart: () => {
        set({ cart: [] });
      },

      // Calculate cart totals
      getCartSubtotal: () => {
        const { cart } = get();
        return cart.reduce((sum, item) => sum + (parseFloat(item.subtotal) || 0), 0);
      },

      getCartTax: () => {
        const { cart } = get();
        return cart.reduce((sum, item) => {
          const taxRate = (parseFloat(item.product?.tax) || 0) / 100;
          return sum + (parseFloat(item.subtotal) || 0) * taxRate;
        }, 0);
      },

      getCartTotal: () => {
        return get().getCartSubtotal() + get().getCartTax();
      },

      // Order calculations
      discount: 0,
      tip: 0,
      
      setDiscount: (amount) => {
        set({ discount: parseFloat(amount) || 0 });
      },

      setTip: (amount) => {
        set({ tip: parseFloat(amount) || 0 });
      },

      getGrandTotal: () => {
        const subtotal = get().getCartTotal();
        return subtotal - get().discount + get().tip;
      },

      // Get cart item count
      getCartItemCount: () => {
        const { cart } = get();
        return cart.reduce((count, item) => count + item.quantity, 0);
      },

      // Check if cart is empty
      isCartEmpty: () => {
        const { cart } = get();
        return cart.length === 0;
      },

      // Get order summary for API
      getOrderSummary: () => {
        const { cart, discount, tip } = get();
        
        const subtotal = get().getCartSubtotal();
        const tax = get().getCartTax();
        const totalAmount = subtotal + tax - discount + tip;

        return {
          items: cart.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            base_price: item.base_price,
            unit_price: item.unit_price,
            attributes: item.attributes || [],
          })),
          discount,
          tip,
          total_amount: totalAmount,
        };
      },
    }),
    {
      name: 'pos_session',
      partialize: (state) => ({
        activeSession: state.activeSession,
        activeTerminal: state.activeTerminal,
        activeTable: state.activeTable,
        activeOrder: state.activeOrder,
        cart: state.cart,
        discount: state.discount,
        tip: state.tip,
      }),
    }
  )
);

export default usePosStore;
