import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

function AdminDashboard() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [productCount, setProductCount] = useState(null);
  const [lowStock, setLowStock] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Handle expired authentication
  const handleUnauthorized = useCallback(() => {
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminUser");

    navigate("/admin/login", { replace: true });
  }, [navigate]);

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    const token = sessionStorage.getItem("adminToken");

    if (!token) {
      handleUnauthorized();
      return;
    }

    try {
      setLoading(true);
      setError("");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Fetch all dashboard data together
      const [
        summaryResponse,
        stockResponse,
        productCountResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/analytics/summary`, { headers }),
        fetch(`${API_URL}/analytics/low-stock`, { headers }),
        fetch(`${API_URL}/analytics/product-count`, { headers }),
      ]);

      // Handle expired authentication
      if (
        summaryResponse.status === 401 ||
        stockResponse.status === 401 ||
        productCountResponse.status === 401
      ) {
        handleUnauthorized();
        return;
      }

      // Parse responses
      const summaryData = await summaryResponse.json();
      const stockData = await stockResponse.json();
      const productCountData =
        await productCountResponse.json();

      // Validate responses
      if (!summaryResponse.ok) {
        throw new Error(
          summaryData.message ||
            "Unable to load business summary."
        );
      }

      if (!stockResponse.ok) {
        throw new Error(
          stockData.message ||
            "Unable to load inventory alerts."
        );
      }

      if (!productCountResponse.ok) {
        throw new Error(
          productCountData.message ||
            "Unable to load product count."
        );
      }

      // Validate response formats
      if (
        !summaryData ||
        typeof summaryData !== "object" ||
        Array.isArray(summaryData)
      ) {
        throw new Error("Invalid business summary response.");
      }

      if (!Array.isArray(stockData)) {
        throw new Error("Invalid inventory alerts response.");
      }

      const count = Number(productCountData.total_products);

      if (!Number.isSafeInteger(count) || count < 0) {
        throw new Error("Invalid product count response.");
      }

      setSummary(summaryData);
      setProductCount(count);
      setLowStock(stockData);
    } catch (err) {
      console.error("Dashboard loading error:", err);

      setError(
        err.message ||
          "Unable to load dashboard data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Format currency
  function formatCurrency(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
      return "—";
    }

    return `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }

  // Format numbers
  function formatNumber(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "—";
    }

    return number.toLocaleString("en-IN");
  }

  // Values returned by backend/routes/analytics.js
  const totalProducts = productCount;

  const totalOrders =
    summary?.total_orders != null
      ? summary.total_orders
      : null;

  const totalSales =
    summary?.total_order_value != null
      ? summary.total_order_value
      : null;

  const pendingOrders =
    summary?.pending_orders != null
      ? summary.pending_orders
      : null;

  return (
    <main className="admin-dashboard">
      {/* Dashboard header */}
      <section className="admin-header">
        <div>
          <p className="admin-dashboard-eyebrow">
            BUSINESS MANAGEMENT
          </p>

          <h1>Zam Zam Traders</h1>

          <p className="admin-dashboard-subtitle">
            Your shop operations, inventory, and orders in one place.
          </p>
        </div>

        <Link
          to="/admin/analytics"
          className="admin-dashboard-cta"
        >
          View Analytics →
        </Link>
      </section>

      {/* Error message */}
      {error && (
        <div
          className="manage-products-error"
          role="alert"
        >
          <p>{error}</p>

          <button
            type="button"
            className="manage-refresh-button"
            onClick={loadDashboard}
            disabled={loading}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Business overview */}
      <section className="admin-dashboard-section">
        <div className="admin-dashboard-section-heading">
          <div>
            <h2>Business Overview</h2>
            <p>Your latest available business figures.</p>
          </div>

          <button
            type="button"
            className="manage-refresh-button"
            onClick={loadDashboard}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="admin-stats">
          {/* Total products */}
          <div className="admin-stat-card">
            <span className="admin-dashboard-stat-icon">
              📦
            </span>

            <h3>Total Products</h3>

            <p>
              {loading
                ? "..."
                : formatNumber(totalProducts)}
            </p>
          </div>

          {/* Total orders */}
          <div className="admin-stat-card">
            <span className="admin-dashboard-stat-icon">
              🛒
            </span>

            <h3>Total Orders</h3>

            <p>
              {loading
                ? "..."
                : formatNumber(totalOrders)}
            </p>

            <small>Non-cancelled orders</small>
          </div>

          {/* Total order value */}
          <div className="admin-stat-card">
            <span className="admin-dashboard-stat-icon">
              💰
            </span>

            <h3>Order Value</h3>

            <p>
              {loading
                ? "..."
                : formatCurrency(totalSales)}
            </p>

            <small>Non-cancelled orders</small>
          </div>

          {/* Pending orders */}
          <div className="admin-stat-card">
            <span className="admin-dashboard-stat-icon">
              ⏳
            </span>

            <h3>Pending Orders</h3>

            <p>
              {loading
                ? "..."
                : formatNumber(pendingOrders)}
            </p>

            <small>Awaiting further action</small>
          </div>
        </div>
      </section>

      {/* Inventory alerts */}
      <section className="admin-dashboard-section">
        <div className="admin-dashboard-section-heading">
          <div>
            <h2>Inventory Alerts</h2>

            <p>
              Products that may need restocking.
            </p>
          </div>

          <Link
            to="/admin/inventory"
            className="admin-dashboard-text-link"
          >
            Manage Inventory →
          </Link>
        </div>

        {loading ? (
          <div className="admin-dashboard-panel">
            Loading inventory alerts...
          </div>
        ) : lowStock.length === 0 ? (
          <div className="admin-dashboard-panel admin-dashboard-success">
            <span>✓</span>

            <div>
              <strong>
                No low-stock products reported
              </strong>

              <p>
                All reported products are above their reorder
                levels. Check inventory for current quantities.
              </p>
            </div>
          </div>
        ) : (
          <div className="admin-dashboard-panel">
            <div className="admin-dashboard-alert-heading">
              ⚠️ {lowStock.length} product(s) need attention
            </div>

            <div className="admin-dashboard-low-stock-list">
              {lowStock.slice(0, 5).map((item) => (
                <div
                  className="admin-dashboard-low-stock-item"
                  key={item.product_id}
                >
                  <div>
                    <strong>
                      {item.product_name}
                    </strong>

                    <p>
                      {item.brand || "Standard"}
                      {item.unit ? ` · ${item.unit}` : ""}
                    </p>
                  </div>

                  <span className="inventory-status-low">
                    Stock: {formatNumber(item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <Link
              to="/admin/inventory"
              className="admin-dashboard-text-link"
            >
              View all inventory →
            </Link>
          </div>
        )}
      </section>

      {/* Management links */}
      <section className="admin-actions">
        <h2>Shop Management</h2>

        <div className="admin-action-list">
          <Link
            to="/admin/products"
            className="admin-action-card"
          >
            <h3>📦 Manage Products</h3>

            <p>
              Add products, brands, sizes, and prices.
            </p>

            <span>Open section →</span>
          </Link>

          <Link
            to="/admin/manage-products"
            className="admin-action-card"
          >
            <h3>✏️ Edit Products</h3>

            <p>
              Update existing product details and prices.
            </p>

            <span>Open section →</span>
          </Link>

          <Link
            to="/admin/inventory"
            className="admin-action-card"
          >
            <h3>📊 Manage Inventory</h3>

            <p>
              Track stock quantities and reorder levels.
            </p>

            <span>Open section →</span>
          </Link>

          <Link
            to="/admin/orders"
            className="admin-action-card"
          >
            <h3>🛒 Manage Orders</h3>

            <p>
              View customer orders and update their status.
            </p>

            <span>Open section →</span>
          </Link>

          <Link
            to="/admin/analytics"
            className="admin-action-card"
          >
            <h3>📈 Sales Analytics</h3>

            <p>
              Explore sales charts, popular products,
              and low-stock items.
            </p>

            <span>Open section →</span>
          </Link>
        </div>
      </section>

      {/* Footer notice */}
      <section className="admin-notice">
        <h3>Welcome to your shop management system!</h3>

        <p>
          Manage your products, monitor stock, process customer
          orders, and understand your business performance from
          one dashboard.
        </p>
      </section>
    </main>
  );
}

export default AdminDashboard;