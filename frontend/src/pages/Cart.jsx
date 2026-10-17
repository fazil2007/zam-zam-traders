import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const productImages = {
  "UltraTech Cement": "/images/cement.jpg",
  "TMT Steel Bar 12mm": "/images/steel.jpg",
  "Floor Tiles": "/images/tiles.png",
  "Interior Wall Paint": "/images/paint.jpg",
  "Flush Door": "/images/door.jpg",
  "Wall Putty": "/images/putty.jpg",
  "Electrical Wire": "/images/wire.jpg",
  "PVC Pipe": "/images/pipe.jpg",
};

function Cart() {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartCount,
    cartTotal,
  } = useCart();

  return (
    <main>
      <section className="cart-page">
        <h1>Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <h2>Your cart is empty 🛒</h2>

            <p>
              Browse our building materials and add products
              to your cart.
            </p>

            <Link
              to="/products"
              className="continue-shopping-button"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            <p className="cart-count">
              {cartCount} item(s) in your cart
            </p>

            <div className="cart-container">
              {cartItems.map((item) => (
                <div className="cart-item" key={item.id}>
                  {/* Product Image */}
                  <img
                    className="cart-product-image"
                    src={
                      productImages[item.name] ||
                      "/images/cement.jpg"
                    }
                    alt={item.name}
                  />

                  {/* Product Information */}
                  <div className="cart-product-info">
                    <h3>{item.name}</h3>

                    <p>{item.brand}</p>

                    <p>
                      ₹{Number(item.price).toLocaleString("en-IN")}
                      {" / "}
                      {item.unit}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="cart-quantity">
                    <label>Quantity</label>

                    <div className="quantity-controls">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity - 1
                          )
                        }
                        disabled={item.quantity <= 1}
                        aria-label={`Decrease ${item.name} quantity`}
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity + 1
                          )
                        }
                        aria-label={`Increase ${item.name} quantity`}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Subtotal and Remove */}
                  <div className="cart-item-total">
                    <h3>
                      ₹
                      {(
                        Number(item.price) * item.quantity
                      ).toLocaleString("en-IN")}
                    </h3>

                    <button
                      type="button"
                      className="remove-cart-button"
                      onClick={() => {
                        removeFromCart(item.id);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="cart-summary">
              <button
                type="button"
                className="clear-cart-button"
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to empty your cart?"
                    )
                  ) {
                    clearCart();
                  }
                }}
              >
                Clear Cart
              </button>

              <div className="cart-total-section">
                <h2>
                  Total: ₹
                  {cartTotal.toLocaleString("en-IN")}
                </h2>

                <Link
                  to="/products"
                  className="continue-shopping-button"
                >
                  Continue Shopping
                </Link>

                <Link
                  to="/checkout"
                  className="checkout-button"
                >
                  Proceed to Checkout
                </Link>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default Cart;