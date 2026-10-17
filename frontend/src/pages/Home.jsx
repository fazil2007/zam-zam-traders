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

  // Fetch categories and products from the backend
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

  // Display the first four products as featured products
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
                  // Product information
                  id: product.product_id,
                  name: product.product_name,
                  brand: product.brand,
                  price: Number(product.price),
                  unit: product.unit,
                  image_url: product.image_url,

                  // Current inventory quantity
                  stock_quantity:
                    product.stock_quantity == null
                      ? null
                      : Number(product.stock_quantity),

                  // Product-specific reorder threshold
                  reorder_level:
                    product.reorder_level == null
                      ? null
                      : Number(product.reorder_level),
                }}
              />
            ))}
          </div>
        )}

        {/* View All Products */}
        <Link
          to="/products"
          className="view-all-products"
        >
          View All Products
        </Link>
      </section>
    </main>
  );
}

export default Home;