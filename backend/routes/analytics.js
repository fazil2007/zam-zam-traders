const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyAdmin = require("../middleware/authMiddleware");

// GET: Sales dashboard summary
// GET /api/analytics/summary
router.get("/summary", verifyAdmin, (req, res) => {
  const sql = `
    SELECT
      COUNT(*) AS total_orders,
      COALESCE(SUM(total_amount), 0) AS total_order_value,

      COALESCE(SUM(
        CASE WHEN order_status = 'Pending'
        THEN 1 ELSE 0 END
      ), 0) AS pending_orders,

      COALESCE(SUM(
        CASE WHEN order_status = 'Confirmed'
        THEN 1 ELSE 0 END
      ), 0) AS confirmed_orders,

      COALESCE(SUM(
        CASE WHEN order_status = 'Delivered'
        THEN 1 ELSE 0 END
      ), 0) AS delivered_orders

    FROM orders
    WHERE order_status <> 'Cancelled'
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error("Analytics summary error:", error.message);

      return res.status(500).json({
        message: "Unable to load sales summary.",
      });
    }

    res.json(results[0]);
  });
});

// GET: Best-selling products
// GET /api/analytics/top-products
router.get("/top-products", verifyAdmin, (req, res) => {
  const sql = `
    SELECT
      p.product_id,
      p.product_name,
      p.brand,
      p.unit,
      SUM(oi.quantity) AS total_quantity_sold,
      SUM(oi.quantity * oi.price) AS total_sales
    FROM order_items oi
    JOIN products p ON oi.product_id = p.product_id
    JOIN orders o ON oi.order_id = o.order_id
    WHERE o.order_status <> 'Cancelled'
    GROUP BY
      p.product_id,
      p.product_name,
      p.brand,
      p.unit
    ORDER BY total_quantity_sold DESC, total_sales DESC
    LIMIT 10
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error("Top products error:", error.message);

      return res.status(500).json({
        message: "Unable to load best-selling products.",
      });
    }

    res.json(results);
  });
});

// GET: Daily sales for the last 7 days
// GET /api/analytics/daily-sales
router.get("/daily-sales", verifyAdmin, (req, res) => {
  const sql = `
    SELECT
      DATE(o.created_at) AS sales_date,
      COUNT(DISTINCT o.order_id) AS total_orders,
      COALESCE(SUM(oi.quantity * oi.price), 0) AS total_sales
    FROM orders o
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.order_status <> 'Cancelled'
      AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
    GROUP BY DATE(o.created_at)
    ORDER BY sales_date ASC
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error("Daily sales error:", error.message);

      return res.status(500).json({
        message: "Unable to load daily sales.",
      });
    }

    res.json(results);
  });
});

// GET: Low-stock products
// GET /api/analytics/low-stock
router.get("/low-stock", verifyAdmin, (req, res) => {
  const sql = `
    SELECT
      p.product_id,
      p.product_name,
      p.brand,
      p.unit,
      i.quantity,
      i.reorder_level
    FROM inventory i
    JOIN products p ON i.product_id = p.product_id
    WHERE i.quantity <= i.reorder_level
    ORDER BY i.quantity ASC
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error("Low stock analytics error:", error.message);

      return res.status(500).json({
        message: "Unable to load low-stock products.",
      });
    }

    res.json(results);
  });
});
// GET: Product count for admin dashboard
// GET /api/analytics/product-count
router.get("/product-count", verifyAdmin, (req, res) => {
  const sql = `
    SELECT COUNT(*) AS total_products
    FROM products
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error("Product count error:", error.message);

      return res.status(500).json({
        message: "Unable to load product count.",
      });
    }

    res.json(results[0]);
  });
});
module.exports = router;