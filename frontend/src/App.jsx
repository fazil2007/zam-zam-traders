import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import WhatsAppButton from "./components/WhatsAppButton";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import MyOrders from "./pages/MyOrders";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import ManageProducts from "./pages/ManageProducts";
import AdminInventory from "./pages/AdminInventory";
import AdminOrders from "./pages/AdminOrders";
import AdminAnalytics from "./pages/AdminAnalytics";

import { CartProvider } from "./context/CartContext";

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Navbar />

        <Routes>
          {/* PUBLIC CUSTOMER PAGES */}

          <Route path="/" element={<Home />} />

          <Route path="/products" element={<Products />} />

          <Route
            path="/products/:id"
            element={<ProductDetails />}
          />

          <Route path="/cart" element={<Cart />} />

          <Route path="/checkout" element={<Checkout />} />

          <Route
            path="/order-confirmation"
            element={<OrderConfirmation />}
          />

          {/* CUSTOMER ORDER TRACKING */}

          <Route path="/orders" element={<MyOrders />} />

          {/* ADMIN LOGIN */}

          <Route
            path="/admin/login"
            element={<AdminLogin />}
          />

          {/* PROTECTED ADMIN PAGES */}

          <Route element={<AdminProtectedRoute />}>
            <Route
              path="/admin"
              element={<AdminDashboard />}
            />

            <Route
              path="/admin/products"
              element={<AdminProducts />}
            />

            <Route
              path="/admin/manage-products"
              element={<ManageProducts />}
            />

            <Route
              path="/admin/inventory"
              element={<AdminInventory />}
            />

            <Route
              path="/admin/orders"
              element={<AdminOrders />}
            />

            <Route
              path="/admin/analytics"
              element={<AdminAnalytics />}
            />
          </Route>
        </Routes>

        {/* Floating WhatsApp contact button */}
        <WhatsAppButton />
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;