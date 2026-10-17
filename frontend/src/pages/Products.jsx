import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ProductCard from "../components/ProductCard";
import { getProducts } from "../services/productService";

function Products() {
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category");

  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("default");

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch products from MySQL
  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await getProducts();

        if (!Array.isArray(data)) {
          throw new Error("Invalid products response");
        }

        setProducts(data);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Unable to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // Filter products by category, search, and price
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory
      ? (product.category_name || "").toLowerCase() ===
        selectedCategory.toLowerCase()
      : true;

    const search = searchTerm.trim().toLowerCase();

    const matchesSearch =
      (product.product_name || "").toLowerCase().includes(search) ||
      (product.brand || "").toLowerCase().includes(search);

    const price = Number(product.price);

    const matchesMinPrice =
      minPrice === "" || price >= Number(minPrice);

    const matchesMaxPrice =
      maxPrice === "" || price <= Number(maxPrice);

    return (
      matchesCategory &&
      matchesSearch &&
      matchesMinPrice &&
      matchesMaxPrice
    );
  });

  // Sort products by price
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOrder === "low-to-high") {
      return Number(a.price) - Number(b.price);
    }

    if (sortOrder === "high-to-low") {
      return Number(b.price) - Number(a.price);
    }

    return 0;
  });

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setMinPrice("");
    setMaxPrice("");
    setSortOrder("default");
  };

  // Loading state
  if (loading) {
    return (
      <main>
        <section className="products-section">
          <h2>Loading products...</h2>
        </section>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main>
        <section className="products-section">
          <h2>{error}</h2>

          <button onClick={() => window.location.reload()}>
            Try Again
          </button>
        </section>
      </main>
    );
  }

  // Validate price range
  const invalidPriceRange =
    minPrice !== "" &&
    maxPrice !== "" &&
    Number(minPrice) > Number(maxPrice);

  return (
    <main>
      <section className="products-section">
        <h1>
          {selectedCategory
            ? `${selectedCategory} Products`
            : "Our Products"}
        </h1>

        {/* Search */}
        <div className="product-search">
          <input
            type="text"
            placeholder="Search by product name or brand..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          {searchTerm && (
            <button
              type="button"
              className="clear-search-button"
              onClick={() => setSearchTerm("")}
            >
              Clear
            </button>
          )}
        </div>

        {/* Price Range */}
        <div className="price-filter">
          <label htmlFor="minPrice">
            Minimum price (₹)
          </label>

          <input
            id="minPrice"
            type="number"
            min="0"
            placeholder="e.g. 100"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
          />

          <label htmlFor="maxPrice">
            Maximum price (₹)
          </label>

          <input
            id="maxPrice"
            type="number"
            min="0"
            placeholder="e.g. 1000"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
          />
        </div>

        {/* Sorting */}
        <div className="product-sort">
          <label htmlFor="sortOrder">
            Sort by price:
          </label>

          <select
            id="sortOrder"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          >
            <option value="default">Default</option>
            <option value="low-to-high">
              Price: Low to High
            </option>
            <option value="high-to-low">
              Price: High to Low
            </option>
          </select>

          <button
            type="button"
            className="reset-filters-button"
            onClick={clearFilters}
          >
            Reset Filters
          </button>
        </div>

        {/* Product Results */}
        {invalidPriceRange ? (
          <p className="filter-message">
            Minimum price cannot exceed maximum price.
          </p>
        ) : sortedProducts.length === 0 ? (
          <p className="filter-message">
            No matching products found.
          </p>
        ) : (
          <>
            <p className="product-result-count">
              {sortedProducts.length} product(s) found
            </p>

            <div className="product-container">
              {sortedProducts.map((product) => (
                <ProductCard
                  key={product.product_id}
                  product={{
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
          </>
        )}
      </section>
    </main>
  );
}

export default Products;