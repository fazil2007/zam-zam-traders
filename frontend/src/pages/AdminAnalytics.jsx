import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function AdminAnalytics() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    const token = sessionStorage.getItem("adminToken");

    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    try {
      setLoading(true);
      setError("");

      const endpoints = [
        "summary",
        "top-products",
        "daily-sales",
        "low-stock",
      ];

      const responses = await Promise.all(
        endpoints.map((endpoint) =>
          fetch(`http://localhost:5000/api/analytics/${endpoint}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        )
      );

      // Check authentication before processing the results.
      if (responses.some((response) => response.status === 401)) {
        sessionStorage.removeItem("adminToken");
        sessionStorage.removeItem("adminUser");

        navigate("/admin/login", { replace: true });
        return;
      }

      const results = await Promise.all(
        responses.map(async (response) => {
          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data.message || "Unable to load analytics."
            );
          }

          return data;
        })
      );

      setSummary(results[0]);
      setTopProducts(results[1]);
      setDailySales(results[2]);
      setLowStock(results[3]);
    } catch (err) {
      console.error("Analytics loading error:", err);

      setError(
        err.message || "Unable to connect to the analytics API."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  const chartData = dailySales.map((item) => ({
    ...item,
    date: new Date(item.sales_date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      timeZone: "UTC",
    }),
    total_sales: Number(item.total_sales),
  }));

  return (
    <main className="analytics-page">
      <header className="analytics-header">
        <div>
          <h1>Sales Analytics</h1>
          <p>
            Understand your Zam Zam Traders business using real database
            information.
          </p>
        </div>

        <div className="analytics-header-actions">
          <button
            type="button"
            className="analytics-refresh-button"
            onClick={loadAnalytics}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh Data"}
          </button>

          <Link to="/admin" className="manage-back-button">
            Dashboard
          </Link>
        </div>
      </header>

      {error && (
        <div className="analytics-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={loadAnalytics}>
            Try Again
          </button>
        </div>
      )}

      {loading && !summary ? (
        <section className="analytics-panel">
          <p>Loading your business analytics...</p>
        </section>
      ) : summary ? (
        <>
          <section className="analytics-summary-grid">
            <article className="analytics-stat-card">
              <p>Total Order Value</p>
              <h2>{formatCurrency(summary.total_order_value)}</h2>
              <span>Non-cancelled orders</span>
            </article>

            <article className="analytics-stat-card">
              <p>Total Orders</p>
              <h2>{Number(summary.total_orders || 0)}</h2>
              <span>Recorded orders</span>
            </article>

            <article className="analytics-stat-card">
              <p>Pending Orders</p>
              <h2>{Number(summary.pending_orders || 0)}</h2>
              <span>Awaiting further action</span>
            </article>

            <article className="analytics-stat-card">
              <p>Delivered Orders</p>
              <h2>{Number(summary.delivered_orders || 0)}</h2>
              <span>Marked as delivered</span>
            </article>
          </section>

          <section className="analytics-panel">
            <div className="analytics-panel-heading">
              <h2>Daily Sales</h2>
              <p>Sales value for the last seven days</p>
            </div>

            {chartData.length === 0 ? (
              <p>No sales data is available for this period.</p>
            ) : (
              <div className="analytics-chart">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis
                      tickFormatter={(value) =>
                        `₹${Number(value).toLocaleString("en-IN")}`
                      }
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(value),
                        "Sales",
                      ]}
                    />
                    <Bar
                      dataKey="total_sales"
                      name="Sales"
                      fill="#0f766e"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="analytics-panel">
            <div className="analytics-panel-heading">
              <h2>Best-Selling Products</h2>
              <p>Ranked by quantity sold</p>
            </div>

            {topProducts.length === 0 ? (
              <p>No product sales are available yet.</p>
            ) : (
              <div className="manage-products-table-wrapper">
                <table className="manage-products-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Brand</th>
                      <th>Quantity Sold</th>
                      <th>Sales Value</th>
                    </tr>
                  </thead>

                  <tbody>
                    {topProducts.map((product) => (
                      <tr key={product.product_id}>
                        <td className="manage-product-name">
                          {product.product_name}
                        </td>
                        <td>{product.brand || "—"}</td>
                        <td>
                          {Number(product.total_quantity_sold || 0)}{" "}
                          {product.unit}
                        </td>
                        <td>{formatCurrency(product.total_sales)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="analytics-panel">
            <div className="analytics-panel-heading">
              <h2>Low-Stock Products</h2>
              <p>Products at or below their reorder level</p>
            </div>

            {lowStock.length === 0 ? (
              <p>No low-stock products found.</p>
            ) : (
              <div className="manage-products-table-wrapper">
                <table className="manage-products-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Brand</th>
                      <th>Current Stock</th>
                      <th>Reorder Level</th>
                    </tr>
                  </thead>

                  <tbody>
                    {lowStock.map((product) => (
                      <tr key={product.product_id}>
                        <td className="manage-product-name">
                          {product.product_name}
                        </td>
                        <td>{product.brand || "—"}</td>
                        <td>
                          {Number(product.quantity)} {product.unit}
                        </td>
                        <td>
                          {Number(product.reorder_level)} {product.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Link
              to="/admin/inventory"
              className="analytics-inventory-link"
            >
              Manage Inventory
            </Link>
          </section>
        </>
      ) : null}
    </main>
  );
}

export default AdminAnalytics;