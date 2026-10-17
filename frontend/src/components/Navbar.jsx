import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

function Navbar() {
  const { cartCount } = useCart();

  return (
    <nav className="zz-navbar">
      <Link to="/" className="zz-navbar-brand">
        <img
          src="/images/zamzam-logo.png"
          alt="Zam Zam Traders Logo"
          className="zz-navbar-logo"
        />

        <span>Zam Zam Traders</span>
      </Link>

      <div className="zz-navbar-links">
        <Link to="/">Home</Link>

        <Link to="/products">Products</Link>

        <Link to="/cart">
          🛒 Cart ({cartCount})
        </Link>

        <Link to="/orders">My Orders</Link>

        <Link to="/admin/login">Login</Link>
      </div>
    </nav>
  );
}

export default Navbar;