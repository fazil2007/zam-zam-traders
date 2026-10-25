import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import CategoryCard from "../components/CategoryCard";
import ProductCard from "../components/ProductCard";

import { getProducts } from "../services/productService";
import { getCategories } from "../services/categoryService";

function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [categoryError, setCategoryError] = useState("");
  const [productError, setProductError] = useState("");

  const shopMapLink =
    "https://maps.app.goo.gl/HqFMfbuJNuQAJffV8";

  // Fetch categories and products
  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await getCategories();

        if (!Array.isArray(data)) {
          throw new Error("Invalid categories response");
        }

        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategoryError("Unable to load categories.");
      } finally {
        setLoadingCategories(false);
      }
    }

    async function fetchProducts() {
      try {
        const data = await getProducts();

        if (!Array.isArray(data)) {
          throw new Error("Invalid products response");
        }

        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProductError("Unable to load featured products.");
      } finally {
        setLoadingProducts(false);
      }
    }

    fetchCategories();
    fetchProducts();
  }, []);

  const featuredProducts = products.slice(0, 4);

  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <h1>Welcome to Zam Zam Traders</h1>

        <p>
          Quality Building Materials at the Right Price
        </p>

        <Link to="/products" className="shop-button">
          Shop Now
        </Link>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <h2>Our Categories</h2>

        {loadingCategories ? (
          <p>Loading categories...</p>
        ) : categoryError ? (
          <p role="alert">{categoryError}</p>
        ) : categories.length === 0 ? (
          <p>No categories available yet.</p>
        ) : (
          <div className="category-container">
            {categories.map((category) => (
              <CategoryCard
                key={category.category_id}
                category={category}
              />
            ))}
          </div>
        )}
      </section>

      {/* Featured Products Section */}
      <section className="products-section">
        <h2>Featured Products</h2>

        {loadingProducts ? (
          <p>Loading products...</p>
        ) : productError ? (
          <p role="alert">{productError}</p>
        ) : featuredProducts.length === 0 ? (
          <p>No products available yet.</p>
        ) : (
          <div className="product-container">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.product_id}
                product={{
                  id: product.product_id,
                  name: product.product_name,
                  brand: product.brand,
                  price: Number(product.price),
                  unit: product.unit,
                  image_url: product.image_url,
                  stock_quantity:
                    product.stock_quantity == null
                      ? null
                      : Number(product.stock_quantity),
                  reorder_level:
                    product.reorder_level == null
                      ? null
                      : Number(product.reorder_level),
                }}
              />
            ))}
          </div>
        )}

        <Link
          to="/products"
          className="view-all-products"
        >
          View All Products
        </Link>
      </section>

      {/* Shop Location Section */}
      <section
        className="shop-location-section"
        style={{
          padding: "40px 20px",
          textAlign: "center",
          backgroundColor: "#f8fafc",
        }}
      >
        <h2>📍 Visit Zam Zam Traders</h2>

        <p>
          Quality building materials at the right price.
          Visit us in Thuvarankurichy, Trichy Service Road,
          Tamil Nadu.
        </p>

        {/* Google Maps */}
        <div
          style={{
            width: "100%",
            maxWidth: "900px",
            margin: "24px auto",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.12)",
          }}
        >
          <iframe
            title="Zam Zam Traders location map"
            src="https://maps.google.com/maps?q=Thuvarankurichy%2C%20Tamil%20Nadu&z=13&output=embed"
            width="100%"
            height="350"
            style={{
              border: 0,
              display: "block",
            }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* Get Directions Button */}
        <a
          href={shopMapLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            marginTop: "10px",
            padding: "13px 24px",
            backgroundColor: "#166534",
            color: "#ffffff",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: "bold",
          }}
        >
          🚗 Get Directions to Our Shop
        </a>
      </section>
    </main>
  );
}

export default Home;