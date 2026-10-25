
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function AdminInventory() {
  const navigate = useNavigate();

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Load inventory records
  async function loadInventory() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/inventory`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load inventory."
        );
      }

      if (!Array.isArray(data)) {
        throw new Error("Invalid inventory response.");
      }

      setInventory(data);
    } catch (err) {
      console.error("Inventory error:", err);

      setError(
        err.message || "Unable to connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInventory();
  }, []);

  // Determine the stock status
  function getStockStatus(item) {
    const quantity = Number(item.quantity);
    const reorderLevel = Number(item.reorder_level);

    if (
      item.quantity == null ||
      item.reorder_level == null ||
      !Number.isFinite(quantity) ||
      !Number.isFinite(reorderLevel) ||
      quantity < 0 ||
      reorderLevel < 0
    ) {
      return "unknown";
    }

    if (quantity === 0) {
      return "out";
    }

    if (quantity <= reorderLevel) {
      return "low";
    }

    return "good";
  }

  // Inventory summary counts
  const totalProducts = inventory.length;

  const outOfStockCount = inventory.filter(
    (item) => getStockStatus(item) === "out"
  ).length;

  const lowStockCount = inventory.filter(
    (item) => getStockStatus(item) === "low"
  ).length;

  const inStockCount = inventory.filter(
    (item) => getStockStatus(item) === "good"
  ).length;

  const unknownStockCount = inventory.filter(
    (item) => getStockStatus(item) === "unknown"
  ).length;

  // Start editing stock
  function startEditing(item) {
    setEditingItem({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: String(Math.floor(Number(item.quantity))),
      reorder_level: String(
        Math.floor(Number(item.reorder_level))
      ),
    });

    setError("");
    setSuccess("");
  }

  // Handle form changes
  function handleChange(event) {
    const { name, value } = event.target;

    setEditingItem((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // Save inventory with admin authentication
  async function saveInventory(event) {
    event.preventDefault();

    if (!editingItem) {
      return;
    }

    const quantity = Number(editingItem.quantity);
    const reorderLevel = Number(editingItem.reorder_level);

    if (
      editingItem.quantity.trim() === "" ||
      editingItem.reorder_level.trim() === "" ||
      !Number.isSafeInteger(quantity) ||
      quantity < 0 ||
      !Number.isSafeInteger(reorderLevel) ||
      reorderLevel < 0
    ) {
      setError(
        "Stock and reorder level must be non-negative whole numbers."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = sessionStorage.getItem("adminToken");

      if (!token) {
        navigate("/admin/login", { replace: true });
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/inventory/${editingItem.product_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            quantity,
            reorder_level: reorderLevel,
          }),
        }
      );

      const result = await response.json();

      // Handle expired authentication
      if (response.status === 401) {
        sessionStorage.removeItem("adminToken");
        sessionStorage.removeItem("adminUser");

        navigate("/admin/login", { replace: true });
        return;
      }

      if (response.status === 403) {
        throw new Error(
          result.message ||
            "You do not have permission to update inventory."
        );
      }

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to update stock."
        );
      }

      setEditingItem(null);

      setSuccess(
        `${result.message || "Inventory updated successfully."} (${editingItem.product_name})`
      );

      await loadInventory();
    } catch (err) {
      console.error("Stock update error:", err);

      setError(
        err.message || "Unable to update inventory."
      );
    } finally {
      setSaving(false);
    }
  }

  // Search and filter inventory
  const filteredInventory = inventory.filter((item) => {
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch =
      (item.product_name || "").toLowerCase().includes(search) ||
      (item.brand || "").toLowerCase().includes(search) ||
      (item.category_name || "").toLowerCase().includes(search);

    const status = getStockStatus(item);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "out" && status === "out") ||
      (statusFilter === "low" && status === "low") ||
      (statusFilter === "good" && status === "good") ||
      (statusFilter === "unknown" && status === "unknown");

    return matchesSearch && matchesStatus;
  });

  return (
    <main className="manage-products-page">
      {/* Page Header */}
      <div className="manage-products-header">
        <div>
          <h1>Inventory Management</h1>
          <p>
            Monitor stock levels and manage inventory for your shop.
          </p>
        </div>

        <div className="manage-products-actions">
          <Link to="/admin" className="manage-back-button">
            Dashboard
          </Link>

          <Link
            to="/admin/manage-products"
            className="manage-add-button"
          >
            Manage Products
          </Link>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="manage-products-error" role="alert">
          {error}
        </p>
      )}

      {/* Success Message */}
      {success && (
        <p className="admin-form-success" role="status">
          {success}
        </p>
      )}

      {/* Inventory Summary */}
      <section className="admin-stats">
        <div className="admin-stat-card">
          <h3>Total Products</h3>
          <p>{totalProducts}</p>
        </div>

        <div className="admin-stat-card">
          <h3>In Stock</h3>
          <p>{inStockCount}</p>
        </div>

        <div className="admin-stat-card">
          <h3>Low Stock</h3>
          <p>{lowStockCount}</p>
        </div>

        <div className="admin-stat-card">
          <h3>Out of Stock</h3>
          <p>{outOfStockCount}</p>
        </div>

        {unknownStockCount > 0 && (
          <div className="admin-stat-card">
            <h3>Stock Unavailable</h3>
            <p>{unknownStockCount}</p>
          </div>
        )}
      </section>

      {/* Stock Alerts */}
      {!loading && (
        <section className="manage-products-card">
          <h2>Inventory Alerts</h2>

          {outOfStockCount > 0 || lowStockCount > 0 ? (
            <div>
              {outOfStockCount > 0 && (
                <p className="inventory-alert-out">
                  🔴 {outOfStockCount} product(s) are out of stock.
                </p>
              )}

              {lowStockCount > 0 && (
                <p className="inventory-alert-low">
                  🟠 {lowStockCount} product(s) need restocking.
                </p>
              )}
            </div>
          ) : unknownStockCount > 0 ? (
            <p>
              Some inventory records need to be checked.
            </p>
          ) : (
            <p className="inventory-alert-good">
              ✅ All products are above their reorder levels.
            </p>
          )}
        </section>
      )}

      {/* Edit Stock Form */}
      {editingItem && (
        <section className="manage-products-card edit-product-card">
          <h2>
            Update Stock: {editingItem.product_name}
          </h2>

          <form
            onSubmit={saveInventory}
            className="admin-product-form"
          >
            <div className="admin-form-group">
              <label htmlFor="quantity">
                Current Stock Quantity
              </label>

              <input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                step="1"
                value={editingItem.quantity}
                onChange={handleChange}
                required
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="reorder_level">
                Reorder Level
              </label>

              <input
                id="reorder_level"
                name="reorder_level"
                type="number"
                min="0"
                step="1"
                value={editingItem.reorder_level}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="admin-submit-button"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Stock"}
            </button>

            <button
              type="button"
              className="manage-refresh-button"
              onClick={() => setEditingItem(null)}
              disabled={saving}
            >
              Cancel
            </button>
          </form>
        </section>
      )}

      {/* Inventory Table */}
      <section className="manage-products-card">
        <div className="manage-products-summary">
          <h2>Current Inventory</h2>

          <button
            type="button"
            className="manage-refresh-button"
            onClick={loadInventory}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Search and Status Filters */}
        <div className="inventory-filters">
          <input
            type="search"
            placeholder="Search products, brands, or categories..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label="Search inventory"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by stock status"
          >
            <option value="all">All Stock Statuses</option>
            <option value="good">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
            <option value="unknown">Stock Unavailable</option>
          </select>
        </div>

        {loading ? (
          <p>Loading inventory...</p>
        ) : filteredInventory.length === 0 ? (
          <p>No matching inventory records found.</p>
        ) : (
          <div className="manage-products-table-wrapper">
            <table className="manage-products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Stock</th>
                  <th>Reorder Level</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredInventory.map((item) => {
                  const status = getStockStatus(item);

                  const statusLabels = {
                    good: "In Stock",
                    low: "Low Stock",
                    out: "Out of Stock",
                    unknown: "Check Stock",
                  };

                  const statusClasses = {
                    good: "inventory-status-good",
                    low: "inventory-status-low",
                    out: "inventory-status-out",
                    unknown: "inventory-status-unknown",
                  };

                  return (
                    <tr key={item.product_id}>
                      <td className="manage-product-name">
                        {item.product_name}
                      </td>

                      <td>{item.brand || "—"}</td>
                      <td>{item.category_name || "—"}</td>
                      <td>{item.unit || "—"}</td>

                      <td>
                        {Number(item.quantity).toLocaleString("en-IN")}
                      </td>

                      <td>
                        {Number(item.reorder_level).toLocaleString("en-IN")}
                      </td>

                      <td>
                        <span className={statusClasses[status]}>
                          {statusLabels[status]}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="edit-product-button"
                          onClick={() => startEditing(item)}
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminInventory;

