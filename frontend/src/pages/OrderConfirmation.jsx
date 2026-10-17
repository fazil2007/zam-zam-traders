import { Link, useLocation } from "react-router-dom";

function OrderConfirmation() {
  const location = useLocation();

  const order = location.state;

  // Prevent displaying a fake confirmation
  if (!order || !order.orderId) {
    return (
      <main className="order-confirmation">
        <h1>No order details found</h1>
        <p>Please place an order before viewing this page.</p>

        <Link to="/products" className="continue-shopping-button">
          Browse Products
        </Link>
      </main>
    );
  }

  return (
    <main className="order-confirmation">
      <section className="confirmation-card">
        <div className="success-icon">✓</div>

        <h1>Order Placed Successfully!</h1>

        <p>
          Thank you, <strong>{order.customerName}</strong>!
        </p>

        <p>Your order has been saved successfully.</p>

        <div className="order-details">
          <h3>Order Details</h3>

          <p>
            <strong>Order ID:</strong> #{order.orderId}
          </p>

          <p>
            <strong>Total Amount:</strong>{" "}
            ₹{Number(order.totalAmount).toLocaleString("en-IN")}
          </p>

          <p>
            <strong>Status:</strong> Pending
          </p>
        </div>

        <p>
          Please contact Zam Zam Traders to confirm product availability
          and delivery arrangements.
        </p>

        <Link to="/products" className="continue-shopping-button">
          Continue Shopping
        </Link>
      </section>
    </main>
  );
}

export default OrderConfirmation;