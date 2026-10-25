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

const whatsappContacts = [
  { name: "WhatsApp 1", number: "919944263946" },
  { name: "WhatsApp 2", number: "919500487920" },
];

function Cart() {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartCount,
    cartTotal,
  } = useCart();

  // Send the complete cart to WhatsApp
  const handleWhatsAppEnquiry = (number) => {
    if (cartItems.length === 0) {
      return;
    }

    const productLines = cartItems.map((item, index) => {
      const price = Number(item.price);
      const subtotal = price * Number(item.quantity);

      return [
        `${index + 1}. ${item.name}`,
        `   Brand: ${item.brand || "Standard"}`,
        `   Quantity: ${item.quantity} ${item.unit || "unit(s)"}`,
        `   Price: ₹${price.toLocaleString("en-IN")} per ${item.unit || "unit"}`,
        `   Subtotal: ₹${subtotal.toLocaleString("en-IN")}`,
      ].join("\n");
    });

    const message = [
      "Hello Zam Zam Traders!",
      "",
      "I would like to request a quotation for these products:",
      "",
      ...productLines,
      "",
      `Number of items: ${cartCount}`,
      `Estimated cart total: ₹${Number(cartTotal).toLocaleString("en-IN")}`,
      "",
      "Please confirm the latest prices, stock availability, and delivery options.",
      "",
      "Thank you!",
    ].join("\n");

    const whatsappUrl =
      `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

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

                    <p>{item.brand || "Standard"}</p>

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
                      onClick={() => removeFromCart(item.id)}
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
                  {Number(cartTotal).toLocaleString("en-IN")}
                </h2>

                {/* WhatsApp Cart Enquiry */}
                <div
                  style={{
                    marginTop: "16px",
                    marginBottom: "16px",
                    padding: "16px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                  }}
                >
                  <h3>Request a WhatsApp Quotation</h3>

                  <p>
                    Send your complete cart to Zam Zam Traders
                    to confirm prices and availability.
                  </p>

                  {whatsappContacts.map((contact) => (
                    <button
                      key={contact.number}
                      type="button"
                      onClick={() =>
                        handleWhatsAppEnquiry(contact.number)
                      }
                      style={{
                        display: "block",
                        width: "100%",
                        marginBottom: "10px",
                        padding: "12px",
                        border: "none",
                        borderRadius: "8px",
                        backgroundColor: "#25D366",
                        color: "#ffffff",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      Send to {contact.name} (
                      +{contact.number.slice(0, 2)}{" "}
                      {contact.number.slice(2)}
                      )
                    </button>
                  ))}
                </div>

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