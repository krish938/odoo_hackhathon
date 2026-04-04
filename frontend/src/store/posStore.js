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
          set({ cart: order.items });
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
          updatedCart[existingItemIndex].quantity += quantity;
          set({ cart: updatedCart });
        } else {
          // Add new item to cart
          const newItem = {
            product_id: product.id,
            product,
            quantity,
            base_price: product.base_price,
            unit_price: product.base_price,
            attributes,
            subtotal: product.base_price * quantity,
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
        updatedCart[index].quantity = quantity;
        updatedCart[index].subtotal = updatedCart[index].base_price * quantity;
        
        // Add attribute prices to subtotal
        if (updatedCart[index].attributes) {
          const attributeTotal = updatedCart[index].attributes.reduce(
            (sum, attr) => sum + (attr.extra_price || 0), 0
          );
          updatedCart[index].subtotal += attributeTotal * quantity;
        }
        
        set({ cart: updatedCart });
      },

      clearCart: () => {
        set({ cart: [] });
      },

      // Calculate cart totals
      getCartSubtotal: () => {
        const { cart } = get();
        return cart.reduce((sum, item) => sum + (item.subtotal || 0), 0);
      },

      getCartTax: () => {
        const { cart } = get();
        return cart.reduce((sum, item) => {
          const taxRate = (item.product?.tax || 0) / 100;
          return sum + (item.subtotal || 0) * taxRate;
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
