import { useState } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function MyOrders() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function trackOrder(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/orders/track`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order_id: orderId,
            phone: phone.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to find your order."
        );
      }

      setOrder(data);
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  const statusClass = (status) =>
    `order-tracking-status status-${String(status || "")
      .toLowerCase()
      .replace(/\s+/g, "-")}`;

  function renderOrderTimeline() {
    if (order.order_status === "Cancelled") {
      return (
        <div className="order-timeline-cancelled">
          <h3>Order Cancelled</h3>
          <p>
            This order has been cancelled. Please contact the
            shop if you need further assistance.
          </p>
        </div>
      );
    }

    const statuses = [
      { name: "Pending", description: "Order received" },
      { name: "Confirmed", description: "Order confirmed" },
      { name: "Processing", description: "Preparing your order" },
      { name: "Delivered", description: "Order delivered" },
    ];

    const currentIndex = statuses.findIndex(
      (status) => status.name === order.order_status
    );

    if (currentIndex === -1) {
      return (
        <section className="order-timeline">
          <h3>Order Progress</h3>
          <p>
            Current status: <strong>{order.order_status}</strong>
          </p>
        </section>
      );
    }

    return (
      <section className="order-timeline">
        <h3>Order Progress</h3>

        <div className="order-timeline-steps">
          {statuses.map((status, index) => {
            const completed = index <= currentIndex;
            const current = index === currentIndex;

            return (
              <div
                key={status.name}
                className={`order-timeline-step ${
                  completed ? "completed" : ""
                } ${current ? "current" : ""}`}
                aria-current={current ? "step" : undefined}
              >
                <div className="order-timeline-circle">
                  {index < currentIndex ? "✓" : index + 1}
                </div>

                <span className="order-timeline-label">
                  {status.name}
                </span>

                <small>{status.description}</small>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <main className="my-orders-page">
      <section className="order-tracking-card">
        <h1>Track Your Order</h1>

        <p>
          Enter your order ID and the phone number used during
          checkout to check your order status.
        </p>

        <form onSubmit={trackOrder} className="order-tracking-form">
          <div className="form-group">
            <label htmlFor="orderId">Order ID</label>

            <input
              id="orderId"
              type="number"
              min="1"
              step="1"
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              placeholder="Enter your order ID"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>

            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Enter your checkout phone number"
              maxLength={20}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Track Order"}
          </button>
        </form>

        {error && (
          <div className="order-tracking-error" role="alert">
            {error}
          </div>
        )}
      </section>

      {order && (
        <section className="order-tracking-results">
          <div className="order-tracking-heading">
            <div>
              <h2>Order #{order.order_id}</h2>
              <p>Customer: {order.customer_name}</p>
              <p>
                Placed on:{" "}
                {new Date(order.created_at).toLocaleString("en-IN")}
              </p>
            </div>

            <span className={statusClass(order.order_status)}>
              {order.order_status}
            </span>
          </div>

          {renderOrderTimeline()}

          <h3>Products Ordered</h3>

          {!Array.isArray(order.items) || order.items.length === 0 ? (
            <p>No products were found for this order.</p>
          ) : (
            <div className="order-tracking-table-wrapper">
              <table className="order-tracking-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Brand</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>

                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={`${item.product_name}-${index}`}>
                      <td>{item.product_name}</td>
                      <td>{item.brand || "—"}</td>
                      <td>
                        {Number(item.quantity)} {item.unit}
                      </td>
                      <td>{formatCurrency(item.price)}</td>
                      <td>
                        {formatCurrency(
                          item.subtotal ??
                            Number(item.quantity) * Number(item.price)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="order-tracking-total">
            <span>Total Order Amount</span>
            <strong>{formatCurrency(order.total_amount)}</strong>
          </div>

          <div className="order-receipt-actions">
            <button
              type="button"
              className="order-receipt-print-button"
              onClick={() => window.print()}
            >
              🖨️ Print Order Receipt
            </button>
          </div>
        </section>
      )}

      <div className="order-tracking-back">
        <Link to="/products">Continue Shopping</Link>
      </div>
    </main>
  );
}

export default MyOrders;

