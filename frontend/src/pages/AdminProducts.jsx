import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCategories } from "../services/categoryService";

function AdminProducts() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    product_name: "",
    description: "",
    brand: "",
    category_id: "",
    price: "",
    unit: "Piece",
    image_url: "",
    quantity: "0",
  });

  const [loading, setLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error("Category loading error:", err);
        setError("Unable to load categories. Check the backend.");
      } finally {
        setCategoryLoading(false);
      }
    }

    fetchCategories();
  }, []);

  // Handle input changes
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // Add product
  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = sessionStorage.getItem("adminToken");

      if (!token) {
        navigate("/admin/login", { replace: true });
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/products",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            category_id: Number(formData.category_id),
            price: Number(formData.price),
            quantity: Number(formData.quantity),
          }),
        }
      );

      const result = await response.json();

      // Handle expired or invalid token
      if (response.status === 401) {
        sessionStorage.removeItem("adminToken");
        sessionStorage.removeItem("adminUser");

        navigate("/admin/login", { replace: true });
        return;
      }

      // Handle permission errors
      if (response.status === 403) {
        setError(
          result.message ||
            "You do not have permission to add products."
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to add product."
        );
      }

      setSuccess(
        `Product added successfully! Product ID: ${result.product_id}`
      );

      // Reset the form after successful creation
      setFormData({
        product_name: "",
        description: "",
        brand: "",
        category_id: "",
        price: "",
        unit: "Piece",
        image_url: "",
        quantity: "0",
      });
    } catch (err) {
      console.error("Add product error:", err);

      setError(
        err.message || "Unable to connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-product-page">
      <div className="admin-product-header">
        <div>
          <h1>Add New Product</h1>
          <p>
            Add products to your Zam Zam Traders catalogue.
          </p>
        </div>

        <Link to="/admin" className="admin-back-button">
          Back to Dashboard
        </Link>
      </div>

      <section className="admin-product-form-card">
        {categoryLoading ? (
          <p>Loading categories...</p>
        ) : categories.length === 0 ? (
          <p>
            No categories found. Please check your database.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="admin-product-form"
          >
            <div className="admin-form-group">
              <label htmlFor="product_name">
                Product Name *
              </label>

              <input
                id="product_name"
                name="product_name"
                type="text"
                value={formData.product_name}
                onChange={handleChange}
                placeholder="e.g. UltraTech Cement"
                maxLength={150}
                required
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="category_id">
                Category *
              </label>

              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
              >
                <option value="">Select a category</option>

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
              <label htmlFor="brand">Brand</label>

              <input
                id="brand"
                name="brand"
                type="text"
                value={formData.brand}
                onChange={handleChange}
                placeholder="e.g. UltraTech, Ramco, Tata"
                maxLength={100}
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="price">
                Selling Price (₹) *
              </label>

              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                placeholder="Enter selling price"
                required
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="unit">Unit *</label>

              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                required
              >
                <option value="Piece">Piece</option>
                <option value="Bag">Bag</option>
                <option value="Kg">Kg</option>
                <option value="Ton">Ton</option>
                <option value="Box">Box</option>
                <option value="Meter">Meter</option>
                <option value="Litre">Litre</option>
                <option value="Packet">Packet</option>
                <option value="Set">Set</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label htmlFor="quantity">
                Initial Stock Quantity
              </label>

              <input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                step="1"
                value={formData.quantity}
                onChange={handleChange}
                required
              />
            </div>

            <div className="admin-form-group full-width">
              <label htmlFor="description">
                Description
              </label>

              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter product details"
                rows={3}
              />
            </div>

            <div className="admin-form-group full-width">
              <label htmlFor="image_url">
                Product Image URL (Optional)
              </label>

              <input
                id="image_url"
                name="image_url"
                type="text"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="/images/ultratech-cement.jpg"
              />
            </div>

            {error && (
              <p className="admin-form-error" role="alert">
                {error}
              </p>
            )}

            {success && (
              <p className="admin-form-success" role="status">
                {success}
              </p>
            )}

            <button
              type="submit"
              className="admin-submit-button"
              disabled={loading || categoryLoading}
            >
              {loading ? "Adding Product..." : "Add Product"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default AdminProducts;