import {
  createContext,
  useContext,
  useState,
} from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  // Add a product while checking available stock
  const addToCart = (product, quantity = 1) => {
    const validQuantity = Math.max(
      1,
      Math.floor(Number(quantity) || 1)
    );

    const stockQuantity =
      product.stock_quantity == null
        ? null
        : Number(product.stock_quantity);

    // Do not add products with unavailable or invalid stock data.
    if (
      stockQuantity === null ||
      !Number.isFinite(stockQuantity) ||
      stockQuantity < 0
    ) {
      return {
        success: false,
        message: "Stock availability could not be verified.",
      };
    }

    if (stockQuantity === 0) {
      return {
        success: false,
        message: "This product is out of stock.",
      };
    }

    const existingItem = cartItems.find(
      (item) => item.id === product.id
    );

    const currentQuantity = existingItem
      ? existingItem.quantity
      : 0;

    if (currentQuantity + validQuantity > stockQuantity) {
      return {
        success: false,
        message: `Only ${stockQuantity} units are available.`,
      };
    }

    setCartItems((currentItems) => {
      const currentItem = currentItems.find(
        (item) => item.id === product.id
      );

      if (currentItem) {
        return currentItems.map((item) =>
          item.id === product.id
            ? {
                ...item,
                ...product,
                quantity: item.quantity + validQuantity,
              }
            : item
        );
      }

      return [
        ...currentItems,
        {
          ...product,
          quantity: validQuantity,
        },
      ];
    });

    return {
      success: true,
      message: "Product added to cart successfully!",
    };
  };

  // Update quantity without exceeding available stock
  const updateQuantity = (productId, quantity) => {
    const validQuantity = Math.floor(Number(quantity));

    if (!Number.isSafeInteger(validQuantity) || validQuantity < 1) {
      return {
        success: false,
        message: "Quantity must be at least 1.",
      };
    }

    const existingItem = cartItems.find(
      (item) => item.id === productId
    );

    if (!existingItem) {
      return {
        success: false,
        message: "Product not found in cart.",
      };
    }

    const stockQuantity =
      existingItem.stock_quantity == null
        ? null
        : Number(existingItem.stock_quantity);

    if (
      stockQuantity === null ||
      !Number.isFinite(stockQuantity) ||
      stockQuantity < 0
    ) {
      return {
        success: false,
        message: "Stock availability could not be verified.",
      };
    }

    if (validQuantity > stockQuantity) {
      return {
        success: false,
        message: `Only ${stockQuantity} units are available.`,
      };
    }

    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.id === productId
          ? { ...item, quantity: validQuantity }
          : item
      )
    );

    return {
      success: true,
      message: "Cart quantity updated.",
    };
  };

  // Remove a product from the cart
  const removeFromCart = (productId) => {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.id !== productId)
    );
  };

  // Empty the cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Total number of items
  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // Total price of all items
  const cartTotal = cartItems.reduce(
    (total, item) =>
      total + Number(item.price) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}