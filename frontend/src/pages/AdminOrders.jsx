
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const API_URL = `${API_BASE_URL}/api/orders`;

const STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Delivered",
  "Cancelled",
];

function AdminOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Handle expired authentication
  function handleUnauthorized() {
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminUser");

    navigate("/admin/login", { replace: true });
  }

  // Load all orders
  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const token = sessionStorage.getItem("adminToken");

      if (!token) {
        handleUnauthorized();
        return;
      }

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.status === 403) {
        throw new Error(
          data.message || "Admin permission is required."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load orders."
        );
      }

      if (!Array.isArray(data)) {
        throw new Error("Invalid orders response from server.");
      }

      setOrders(data);
    } catch (err) {
      console.error("Load orders error:", err);

      setError(
        err.message || "Unable to connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  // Statistics
  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (order) => order.order_status === "Pending"
  ).length;

  const processingOrders = orders.filter(
    (order) =>
      order.order_status === "Confirmed" ||
      order.order_status === "Processing"
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.order_status === "Delivered"
  ).length;

  const cancelledOrders = orders.filter(
    (order) => order.order_status === "Cancelled"
  ).length;

  const totalOrderValue = orders.reduce((total, order) => {
    if (order.order_status === "Cancelled") {
      return total;
    }

    const amount = Number(order.total_amount);

    return total + (Number.isFinite(amount) ? amount : 0);
  }, 0);

  // Search and filter
  const filteredOrders = orders.filter((order) => {
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch =
      String(order.order_id).includes(search) ||
      String(order.customer_name || "")
        .toLowerCase()
        .includes(search) ||
      String(order.phone || "").includes(search);

    const matchesStatus =
      statusFilter === "All" ||
      order.order_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Update order status
  async function updateStatus(orderId, orderStatus) {
    const order = orders.find(
      (item) => Number(item.order_id) === Number(orderId)
    );

    if (!order || order.order_status === "Cancelled") {
      return;
    }

    if (
      orderStatus === "Cancelled" &&
      !window.confirm(
        `Cancel order #${orderId}? This action will restore its ordered quantities to inventory.`
      )
    ) {
      return;
    }

    const token = sessionStorage.getItem("adminToken");

    if (!token) {
      handleUnauthorized();
      return;
    }

    setUpdatingId(orderId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            order_status: orderStatus,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.status === 403) {
        throw new Error(
          data.message || "Admin permission is required."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update order."
        );
      }

      setSuccess(
        data.message ||
          `Order #${orderId} updated successfully.`
      );

      // Refresh orders and any currently open details
      await loadOrders();

      if (
        selectedOrder &&
        Number(selectedOrder.order_id) === Number(orderId)
      ) {
        await loadOrderDetails(orderId, false);
      }
    } catch (err) {
      console.error("Update order error:", err);

      setError(
        err.message || "Unable to update order status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  // Load one order and its products
  async function loadOrderDetails(orderId, showModal = true) {
    try {
      setDetailsLoading(true);
      setError("");

      const token = sessionStorage.getItem("adminToken");

      if (!token) {
        handleUnauthorized();
        return;
      }

      const response = await fetch(
        `${API_URL}/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.status === 403) {
        throw new Error(
          data.message || "Admin permission is required."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load order details."
        );
      }

      if (!Array.isArray(data.items)) {
        throw new Error(
          "Order details did not contain a valid products list."
        );
      }

      setSelectedOrder(data);
    } catch (err) {
      console.error("Order details error:", err);

      setError(
        err.message || "Unable to load order details."
      );

      if (showModal) {
        setSelectedOrder(null);
      }
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeDetails() {
    setSelectedOrder(null);
    setDetailsLoading(false);
  }

  // Format currency
  function formatCurrency(value) {
    const amount = Number(value);

    return `₹${(
      Number.isFinite(amount) ? amount : 0
    ).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  // Format date
  function formatDate(value) {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  // Print order receipt
  function printReceipt() {
    if (!selectedOrder) {
      return;
    }

    window.print();
  }

  return (
    <main className="manage-products-page admin-orders-page">
      {/* Page header */}
      <div className="manage-products-header no-print">
        <div>
          <h1>Manage Orders</h1>
          <p>
            Monitor customer orders, track payments outside this
            dashboard, and manage order status.
          </p>
        </div>

        <div className="manage-products-actions">
          <Link to="/admin" className="manage-back-button">
            Dashboard
          </Link>

          <Link
            to="/admin/inventory"
            className="manage-add-button"
          >
            Inventory
          </Link>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <p className="manage-products-error no-print" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="admin-form-success no-print" role="status">
          {success}
        </p>
      )}

      {/* Statistics */}
      <section className="admin-stats no-print">
        <div className="admin-stat-card">
          <h3>Total Orders</h3>
          <p>{totalOrders}</p>
        </div>

        <div className="admin-stat-card">
          <h3>Pending</h3>
          <p>{pendingOrders}</p>
        </div>

        <div className="admin-stat-card">
          <h3>Confirmed / Processing</h3>
          <p>{processingOrders}</p>
        </div>

        <div className="admin-stat-card">
          <h3>Delivered</h3>
          <p>{deliveredOrders}</p>
        </div>

        <div className="admin-stat-card">
          <h3>Cancelled</h3>
          <p>{cancelledOrders}</p>
        </div>

        <div className="admin-stat-card">
          <h3>Non-cancelled Order Value</h3>
          <p>{formatCurrency(totalOrderValue)}</p>
        </div>
      </section>

      {/* Orders table */}
      <section className="manage-products-card no-print">
        <div className="manage-products-summary">
          <h2>Customer Orders</h2>

          <button
            type="button"
            className="manage-refresh-button"
            onClick={loadOrders}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh Orders"}
          </button>
        </div>

        {/* Search and status filter */}
        <div className="admin-orders-filters">
          <input
            type="search"
            placeholder="Search order ID, customer, or phone..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label="Search orders"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter orders by status"
          >
            <option value="All">All Statuses</option>

            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p>Loading orders...</p>
        ) : filteredOrders.length === 0 ? (
          <p>
            {orders.length === 0
              ? "No customer orders found."
              : "No orders match your search or filter."}
          </p>
        ) : (
          <div className="manage-products-table-wrapper">
            <table className="manage-products-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Delivery Address</th>
                  <th>Total</th>
                  <th>Order Date</th>
                  <th>Status</th>
                  <th>Update Status</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.order_id}>
                    <td>#{order.order_id}</td>

                    <td className="manage-product-name">
                      {order.customer_name}
                    </td>

                    <td>{order.phone}</td>

                    <td className="admin-order-address">
                      {order.delivery_address}
                    </td>

                    <td>{formatCurrency(order.total_amount)}</td>

                    <td>{formatDate(order.created_at)}</td>

                    <td>
                      <span
                        className={`order-status status-${String(
                          order.order_status
                        ).toLowerCase()}`}
                      >
                        {order.order_status}
                      </span>
                    </td>

                    <td>
                      <select
                        aria-label={`Update status for order ${order.order_id}`}
                        value={order.order_status}
                        disabled={
                          updatingId === order.order_id ||
                          order.order_status === "Cancelled"
                        }
                        onChange={(event) =>
                          updateStatus(
                            order.order_id,
                            event.target.value
                          )
                        }
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      {updatingId === order.order_id && (
                        <small className="admin-order-updating">
                          Updating...
                        </small>
                      )}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="edit-product-button"
                        onClick={() =>
                          loadOrderDetails(order.order_id)
                        }
                        disabled={detailsLoading}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Order details and printable receipt */}
      {selectedOrder && (
        <section
          className="admin-order-details manage-products-card"
          aria-labelledby="order-details-heading"
        >
          <div className="admin-order-details-header no-print">
            <div>
              <h2 id="order-details-heading">
                Order #{selectedOrder.order_id}
              </h2>

              <p>Order details and printable receipt</p>
            </div>

            <div className="manage-products-actions">
              <button
                type="button"
                className="manage-add-button"
                onClick={printReceipt}
              >
                Print Receipt
              </button>

              <button
                type="button"
                className="manage-refresh-button"
                onClick={closeDetails}
              >
                Close
              </button>
            </div>
          </div>

          {detailsLoading ? (
            <p className="no-print">Loading order details...</p>
          ) : (
            <div className="admin-order-receipt">
              <header className="admin-receipt-header">
                <h2>ZAM ZAM TRADERS</h2>
                <p>Order Receipt</p>
                <p>Order #{selectedOrder.order_id}</p>
              </header>

              <div className="admin-receipt-customer">
                <div>
                  <strong>Customer</strong>
                  <p>{selectedOrder.customer_name}</p>
                </div>

                <div>
                  <strong>Phone</strong>
                  <p>{selectedOrder.phone}</p>
                </div>

                <div>
                  <strong>Order Date</strong>
                  <p>{formatDate(selectedOrder.created_at)}</p>
                </div>

                <div>
                  <strong>Order Status</strong>
                  <p>
                    <span
                      className={`order-status status-${String(
                        selectedOrder.order_status
                      ).toLowerCase()}`}
                    >
                      {selectedOrder.order_status}
                    </span>
                  </p>
                </div>

                <div className="admin-receipt-address">
                  <strong>Delivery Address</strong>
                  <p>{selectedOrder.delivery_address}</p>
                </div>
              </div>

              <h3>Products Ordered</h3>

              <div className="manage-products-table-wrapper">
                <table className="manage-products-table admin-receipt-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Brand</th>
                      <th>Quantity</th>
                      <th>Unit</th>
                      <th>Unit Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedOrder.items.map((item, index) => (
                      <tr
                        key={`${item.product_id}-${index}`}
                      >
                        <td>{item.product_name}</td>
                        <td>{item.brand || "—"}</td>
                        <td>{item.quantity}</td>
                        <td>{item.unit || "—"}</td>
                        <td>{formatCurrency(item.price)}</td>
                        <td>
                          {formatCurrency(
                            item.subtotal ??
                              Number(item.quantity) *
                                Number(item.price)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="admin-receipt-total">
                <span>Order Total</span>

                <strong>
                  {formatCurrency(selectedOrder.total_amount)}
                </strong>
              </div>

              <p className="admin-receipt-note">
                This is an order receipt, not a GST tax invoice.
              </p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default AdminOrders;

