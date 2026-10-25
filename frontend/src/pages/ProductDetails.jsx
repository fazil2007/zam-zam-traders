import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { getProducts } from "../services/productService";

// Match product names to your actual image files
const productImages = {
"UltraTech Cement": "/images/ultratech-cement.jpg",
"Ramco Cement": "/images/ramco.jpg",
"Chettinad Cement": "/images/chettinad.jpg",
"TMT Steel Bar 12mm": "/images/tmt-steel.jpg",
"Aditya Steel": "/images/steel.jpg",
"Floor Tiles": "/images/floor-tiles.jpg",
"Interior Wall Paint": "/images/wall-paint.jpg",
"Flush Door": "/images/flush-door.jpg",
"Wall Putty": "/images/wall-putty.jpg",
"Electrical Wire": "/images/electrical-wire.jpg",
"PVC Pipe": "/images/pvc-pipe.jpg",
};

// WhatsApp contacts for Zam Zam Traders
const whatsappContacts = [
{ name: "WhatsApp 1", number: "919944263946" },
{ name: "WhatsApp 2", number: "919500487920" },
];

function ProductDetails() {
const { id } = useParams();
const { addToCart } = useCart();

const [product, setProduct] = useState(null);
const [quantity, setQuantity] = useState("1");
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [cartMessage, setCartMessage] = useState("");

// Fetch product and inventory information
useEffect(() => {
let cancelled = false;


async function fetchProduct() {
  try {
    setLoading(true);
    setError("");

    const products = await getProducts();

    const foundProduct = products.find(
      (item) => Number(item.product_id) === Number(id)
    );

    if (!foundProduct) {
      if (!cancelled) {
        setError("Product not found.");
      }
      return;
    }

    const image =
      foundProduct.image_url ||
      productImages[foundProduct.product_name] ||
      "";

    if (!cancelled) {
      setProduct({
        id: foundProduct.product_id,
        name: foundProduct.product_name,
        brand: foundProduct.brand,
        price: Number(foundProduct.price),
        unit: foundProduct.unit,
        description: foundProduct.description,
        category: foundProduct.category_name,
        image,

        stock_quantity:
          foundProduct.stock_quantity == null
            ? null
            : Number(foundProduct.stock_quantity),

        reorder_level:
          foundProduct.reorder_level == null
            ? null
            : Number(foundProduct.reorder_level),
      });
    }
  } catch (err) {
    console.error("Error fetching product:", err);

    if (!cancelled) {
      setError(
        "Unable to load product details. Please try again."
      );
    }
  } finally {
    if (!cancelled) {
      setLoading(false);
    }
  }
}

fetchProduct();

return () => {
  cancelled = true;
};


}, [id]);

// Check whether inventory data is valid
const stockAvailable =
product !== null &&
product.stock_quantity !== null &&
Number.isSafeInteger(product.stock_quantity) &&
product.stock_quantity >= 0;

const outOfStock =
stockAvailable && product.stock_quantity === 0;

// Handle quantity input
const handleQuantityChange = (event) => {
const value = event.target.value;


setCartMessage("");

if (value === "") {
  setQuantity("");
  return;
}

if (!/^\d+$/.test(value)) {
  return;
}

const parsedValue = Number(value);

if (!Number.isSafeInteger(parsedValue) || parsedValue < 1) {
  return;
}

if (
  stockAvailable &&
  parsedValue > product.stock_quantity
) {
  setQuantity(String(product.stock_quantity));

  setCartMessage(
    `Only ${product.stock_quantity} units are available.`
  );

  return;
}

setQuantity(value);


};

// Add product to cart with stock validation
const handleAddToCart = () => {
setCartMessage("");


if (!product) {
  return;
}

if (!stockAvailable) {
  setCartMessage(
    "Unable to verify stock availability. Please try again."
  );
  return;
}

if (outOfStock) {
  setCartMessage("This product is currently out of stock.");
  return;
}

const requestedQuantity = Number(quantity);

if (
  !Number.isSafeInteger(requestedQuantity) ||
  requestedQuantity < 1
) {
  setCartMessage("Please enter a valid quantity.");
  return;
}

if (requestedQuantity > product.stock_quantity) {
  setQuantity(String(product.stock_quantity));

  setCartMessage(
    `Only ${product.stock_quantity} units are available.`
  );

  return;
}

const result = addToCart(product, requestedQuantity);

if (result?.success) {
  setCartMessage(
    `${product.name} added to cart successfully!`
  );
} else {
  setCartMessage(
    result?.message ||
      "Unable to add this product to the cart."
  );
}


};

// Open WhatsApp with a product-specific enquiry
const handleWhatsAppEnquiry = (number) => {
if (!product) {
return;
}


const message = [
  "Hello Zam Zam Traders!",
  "",
  `I am interested in: ${product.name}`,
  `Brand: ${product.brand || "Standard"}`,
  `Category: ${product.category || "Building Materials"}`,
  `Quantity required: ${quantity || "Not specified"} ${product.unit || ""}`,
  `Listed price: ₹${product.price.toLocaleString("en-IN")} per ${product.unit || "unit"}`,
  "",
  "Please confirm the latest price and availability.",
].join("\n");

const whatsappUrl =
  `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

window.open(
  whatsappUrl,
  "_blank",
  "noopener,noreferrer"
);


};

// Loading state
if (loading) {
return ( <main> <section className="product-details"> <h2>Loading product details...</h2> </section> </main>
);
}

// Error state
if (error || !product) {
return ( <main> <section className="product-details"> <h2>{error || "Product not found."}</h2>


      <Link to="/products" className="view-product-button">
        Back to Products
      </Link>
    </section>
  </main>
);


}

// Determine availability label
let availabilityLabel = "Unable to verify stock";

if (stockAvailable) {
if (outOfStock) {
availabilityLabel = "Out of Stock";
} else if (
product.reorder_level !== null &&
Number.isFinite(product.reorder_level) &&
product.reorder_level >= 0 &&
product.stock_quantity <= product.reorder_level
) {
availabilityLabel =
`Low Stock (${product.stock_quantity} available)`;
} else {
availabilityLabel =
`In Stock (${product.stock_quantity} available)`;
}
}

const numericQuantity = Number(quantity);

const validQuantity =
Number.isSafeInteger(numericQuantity) &&
numericQuantity >= 1;

const totalPrice = validQuantity
? product.price * numericQuantity
: 0;

return ( <main> <section className="product-details">
{/* Product Image */} <div className="product-details-image">
{product.image ? (
<img
src={product.image}
alt={product.name}
onError={(event) => {
event.currentTarget.style.display = "none";
}}
/>
) : ( <p>Product image not available.</p>
)} </div>


    {/* Product Information */}
    <div className="product-details-info">
      <p className="product-category">
        {product.category}
      </p>

      <h1>{product.name}</h1>

      <p>
        <strong>Brand:</strong>{" "}
        {product.brand || "Standard"}
      </p>

      <h2>
        ₹{product.price.toLocaleString("en-IN")}
      </h2>

      <p>
        <strong>Unit:</strong> {product.unit}
      </p>

      {/* Stock Availability */}
      <p>
        <strong>Availability:</strong>{" "}
        {availabilityLabel}
      </p>

      <p className="product-description">
        {product.description ||
          "Quality building materials from Zam Zam Traders."}
      </p>

      {/* Quantity Selector */}
      <div className="quantity-selector">
        <label htmlFor="quantity">
          Quantity:
        </label>

        <input
          id="quantity"
          type="number"
          min="1"
          max={
            stockAvailable
              ? product.stock_quantity
              : undefined
          }
          step="1"
          value={quantity}
          onChange={handleQuantityChange}
          disabled={!stockAvailable || outOfStock}
        />
      </div>

      {/* Total Price */}
      <h3 className="product-total">
        Total: ₹{totalPrice.toLocaleString("en-IN")}
      </h3>

      {/* Add to Cart */}
      <button
        type="button"
        className="add-cart-button"
        onClick={handleAddToCart}
        disabled={
          !stockAvailable ||
          outOfStock ||
          !validQuantity ||
          numericQuantity > product.stock_quantity
        }
      >
        {outOfStock ? "Out of Stock" : "Add to Cart"}
      </button>

      {/* Product-specific WhatsApp Enquiry */}
      <div
        style={{
          marginTop: "16px",
          padding: "16px",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          Enquire on WhatsApp
        </h3>

        <p>
          Ask us about the latest price, bulk orders,
          and product availability.
        </p>

        {whatsappContacts.map((contact) => (
          <button
            key={contact.number}
            type="button"
            onClick={() =>
              handleWhatsAppEnquiry(contact.number)
            }
            style={{
              display: "block",
              width: "100%",
              marginBottom: "10px",
              padding: "12px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: "#25D366",
              color: "#ffffff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Chat with {contact.name} (
            +{contact.number.slice(0, 2)}{" "}
            {contact.number.slice(2)}
            )
          </button>
        ))}
      </div>

      {/* Feedback Message */}
      {cartMessage && (
        <p
          className="cart-feedback"
          role="status"
          aria-live="polite"
        >
          {cartMessage}
        </p>
      )}

      <br />

      <Link to="/products" className="back-to-products">
        ← Continue Shopping
      </Link>
    </div>
  </section>
</main>


);
}

export default ProductDetails;
