import { Link } from "react-router-dom";

const productImages = {
  "UltraTech Cement": "/images/ultratech-cement.jpg",
  "Chettinad Cement": "/images/chettinad.jpg",
  "Ramco Cement": "/images/ramco.jpg",
  "Aditya Steel": "/images/steel.jpg",
  "TMT Steel Bar 12mm": "/images/tmt-steel.jpg",
  "Floor Tiles": "/images/floor-tiles.jpg",
  "Interior Wall Paint": "/images/wall-paint.jpg",
  "Flush Door": "/images/flush-door.jpg",
  "Wall Putty": "/images/wall-putty.jpg",
  "Electrical Wire": "/images/electrical-wire.jpg",
  "PVC Pipe": "/images/pvc-pipe.jpg",
};

function ProductCard({ product }) {
  const imageUrl =
    product.image_url || productImages[product.name] || "";

  // Keep missing inventory data separate from genuine zero stock.
  const stockQuantity =
    product.stock_quantity == null
      ? null
      : Number(product.stock_quantity);

  const reorderLevel =
    product.reorder_level == null
      ? null
      : Number(product.reorder_level);

  let stockLabel = "Stock unavailable";
  let stockClass = "stock-unavailable";

  if (
    stockQuantity !== null &&
    Number.isFinite(stockQuantity) &&
    stockQuantity >= 0 &&
    reorderLevel !== null &&
    Number.isFinite(reorderLevel) &&
    reorderLevel >= 0
  ) {
    if (stockQuantity === 0) {
      stockLabel = "Out of Stock";
      stockClass = "out-of-stock";
    } else if (stockQuantity <= reorderLevel) {
      stockLabel = `Low Stock (${stockQuantity} left)`;
      stockClass = "low-stock";
    } else {
      stockLabel = `In Stock (${stockQuantity} available)`;
      stockClass = "in-stock";
    }
  }

  return (
    <div className="product-card">
      {/* Product Image */}
      <Link
        to={`/products/${product.id}`}
        className="product-card-image-link"
        aria-label={`View ${product.name}`}
      >
        <div className="product-image-container">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="product-image"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="product-image-placeholder">
              Image unavailable
            </div>
          )}
        </div>
      </Link>

      {/* Product Information */}
      <div className="product-card-content">
        <p className="product-brand">
          {product.brand || "Zam Zam Traders"}
        </p>

        <h3 className="product-card-title">
          {product.name}
        </h3>

        {/* Live Stock Availability */}
        <div
          className={`stock-badge ${stockClass}`}
          aria-live="polite"
        >
          {stockLabel}
        </div>

        {/* Product Price */}
        <div className="product-card-price">
          ₹{Number(product.price).toLocaleString("en-IN")}
          <span> / {product.unit}</span>
        </div>

        {/* View Product Button */}
        <Link
          to={`/products/${product.id}`}
          className="view-product-button"
        >
          View Product →
        </Link>
      </div>
    </div>
  );
}

export default ProductCard;