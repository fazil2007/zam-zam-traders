
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProducts } from "../services/productService";
import { getCategories } from "../services/categoryService";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function ManageProducts() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load products and categories
  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const [productData, categoryData] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);

      setProducts(productData);
      setCategories(categoryData);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Unable to load products. Check your backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  // Start editing a product
  function startEditing(product) {
    const category = categories.find(
      (item) => item.category_name === product.category_name
    );

    setEditingProduct({
      product_id: product.product_id,
      product_name: product.product_name || "",
      description: product.description || "",
      brand: product.brand || "",
      category_id: category ? String(category.category_id) : "",
      price: String(product.price ?? ""),
      unit: product.unit || "Piece",
      image_url: product.image_url || "",
    });

    setError("");
    setSuccess("");
  }

  // Handle form changes
  function handleChange(event) {
    const { name, value } = event.target;

    setEditingProduct((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // Save product changes with authentication
  async function handleSave(event) {
    event.preventDefault();

    if (!editingProduct) return;

    const token = sessionStorage.getItem("adminToken");

    if (!token) {
      sessionStorage.removeItem("adminUser");
      navigate("/admin/login", { replace: true });
      return;
    }

    const price = Number(editingProduct.price);
    const categoryId = Number(editingProduct.category_id);

    if (
      !editingProduct.product_name.trim() ||
      !Number.isSafeInteger(categoryId) ||
      categoryId <= 0 ||
      !Number.isFinite(price) ||
      price < 0 ||
      !editingProduct.unit.trim()
    ) {
      setError(
        "Please enter a valid product name, category, price, and unit."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/products/${editingProduct.product_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            product_name: editingProduct.product_name.trim(),
            description: editingProduct.description,
            brand: editingProduct.brand,
            category_id: categoryId,
            price,
            unit: editingProduct.unit,
            image_url: editingProduct.image_url,
          }),
        }
      );

      const result = await response.json();

      // Handle an invalid or expired token
      if (response.status === 401) {
        sessionStorage.removeItem("adminToken");
        sessionStorage.removeItem("adminUser");

        navigate("/admin/login", { replace: true });
        return;
      }

      if (response.status === 403) {
        setError(
          result.message ||
            "You do not have permission to edit products."
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to update product."
        );
      }

      setSuccess(
        `${editingProduct.product_name} updated successfully!`
      );

      setEditingProduct(null);

      await loadProducts();
    } catch (err) {
      console.error("Update product error:", err);

      setError(
        err.message || "Unable to connect to the backend."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="manage-products-page">
      <div className="manage-products-header">
        <div>
          <h1>Manage Products</h1>
          <p>View and update your product catalogue.</p>
        </div>

        <div className="manage-products-actions">
          <Link
            to="/admin/products"
            className="manage-add-button"
          >
            + Add Product
          </Link>

          <Link to="/admin" className="manage-back-button">
            Dashboard
          </Link>
        </div>
      </div>

      {error && (
        <p className="manage-products-error" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="admin-form-success" role="status">
          {success}
        </p>
      )}

      {/* Edit product form */}
      {editingProduct && (
        <section className="manage-products-card edit-product-card">
          <h2>Edit Product #{editingProduct.product_id}</h2>

          <form onSubmit={handleSave} className="admin-product-form">
            <div className="admin-form-group">
              <label htmlFor="edit-product-name">
                Product Name *
              </label>

              <input
                id="edit-product-name"
                name="product_name"
                value={editingProduct.product_name}
                onChange={handleChange}
                maxLength={150}
                required
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="edit-category">Category *</label>

              <select
                id="edit-category"
                name="category_id"
                value={editingProduct.category_id}
                onChange={handleChange}
                required
              >
                <option value="">Select category</option>

                {categories.map((category) => (
                  <option
                    key={category.category_id}
                    value={category.category_id}
                  >
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-group">
              <label htmlFor="edit-brand">Brand</label>

              <input
                id="edit-brand"
                name="brand"
                value={editingProduct.brand}
                onChange={handleChange}
                maxLength={100}
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="edit-price">Price (₹) *</label>

              <input
                id="edit-price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={editingProduct.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="edit-unit">Unit *</label>

              <select
                id="edit-unit"
                name="unit"
                value={editingProduct.unit}
                onChange={handleChange}
                required
              >
                {[
                  "Piece",
                  "Bag",
                  "Kg",
                  "Ton",
                  "Box",
                  "Meter",
                  "90 Meter",
                  "Litre",
                  "20 Litre",
                  "20 Kg",
                  "Packet",
                  "Set",
                ].map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-group full-width">
              <label htmlFor="edit-description">
                Description
              </label>

              <textarea
                id="edit-description"
                name="description"
                value={editingProduct.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="admin-form-group full-width">
              <label htmlFor="edit-image-url">Image URL</label>

              <input
                id="edit-image-url"
                name="image_url"
                value={editingProduct.image_url}
                onChange={handleChange}
                placeholder="/images/ultratech-cement.jpg"
              />

              {editingProduct.image_url && (
                <img
                  src={editingProduct.image_url}
                  alt="Product preview"
                  style={{
                    width: "120px",
                    height: "100px",
                    objectFit: "contain",
                    marginTop: "10px",
                  }}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              )}
            </div>

            <button
              type="submit"
              className="admin-submit-button"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              className="manage-refresh-button"
              onClick={() => setEditingProduct(null)}
              disabled={saving}
            >
              Cancel
            </button>
          </form>
        </section>
      )}

      {/* Product catalogue */}
      <section className="manage-products-card">
        <div className="manage-products-summary">
          <h2>Product Catalogue</h2>
          <p>Total products: {products.length}</p>
        </div>

        {loading ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <p>No products found. Add your first product.</p>
        ) : (
          <div className="manage-products-table-wrapper">
            <table className="manage-products-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Unit</th>
                  <th>Stock</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.product_id}>
                    <td>{product.product_id}</td>

                    <td className="manage-product-name">
                      {product.product_name}
                    </td>

                    <td>{product.brand || "—"}</td>

                    <td>{product.category_name || "—"}</td>

                    <td>
                      ₹
                      {Number(product.price).toLocaleString("en-IN")}
                    </td>

                    <td>{product.unit}</td>

                    <td>{product.stock_quantity ?? 0}</td>

                    <td>
                      <button
                        type="button"
                        className="edit-product-button"
                        onClick={() => startEditing(product)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (
          <button
            type="button"
            className="manage-refresh-button"
            onClick={loadProducts}
          >
            Refresh Products
          </button>
        )}
      </section>
    </main>
  );
}

export default ManageProducts;

