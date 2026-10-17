import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setCustomer((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (cartItems.length === 0) {
      setError("Your cart is empty. Please add products first.");
      return;
    }

    if (!customer.name.trim() ||
        !customer.phone.trim() ||
        !customer.address.trim()) {
      setError("Please fill in all customer details.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: customer.name.trim(),
          phone: customer.phone.trim(),
          delivery_address: customer.address.trim(),
          items: cartItems.map((item) => ({
            product_id: Number(item.id),
            quantity: Number(item.quantity),
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to place your order.");
      }

      clearCart();

      navigate("/order-confirmation", {
        state: {
          orderId: result.order_id,
          totalAmount: result.total_amount,
          customerName: customer.name.trim(),
        },
      });
    } catch (err) {
      console.error("Checkout error:", err);
      setError(
        err.message ||
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <main className="checkout-page">
        <h1>Your cart is empty</h1>
        <p>Please add products before checking out.</p>

        <Link to="/products" className="continue-shopping-button">
          Browse Products
        </Link>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <section className="checkout-container">
        <h1>Checkout</h1>
        <p>Enter your details to place your order.</p>

        <form onSubmit={handleSubmit} className="checkout-form">
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={customer.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            maxLength={100}
            required
          />

          <label htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={customer.phone}
            onChange={handleChange}
            placeholder="Enter your phone number"
            maxLength={15}
            required
          />

          <label htmlFor="address">Delivery Address</label>
          <textarea
            id="address"
            name="address"
            value={customer.address}
            onChange={handleChange}
            placeholder="Enter your full delivery address"
            rows={4}
            required
          />

          <div className="checkout-summary">
            <h3>Order Summary</h3>

            {cartItems.map((item) => (
              <div key={item.id} className="checkout-item">
                <span>
                  {item.name} × {item.quantity}
                </span>

                <span>
                  ₹
                  {(
                    Number(item.price) * item.quantity
                  ).toLocaleString("en-IN")}
                </span>
              </div>
            ))}

            <h2>
              Estimated Total: ₹
              {Number(cartTotal).toLocaleString("en-IN")}
            </h2>
          </div>

          {error && (
            <p className="checkout-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="place-order-button"
            disabled={loading}
          >
            {loading ? "Placing Order..." : "Place Order"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Checkout;