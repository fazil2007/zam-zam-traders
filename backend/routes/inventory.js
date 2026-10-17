const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyAdmin = require("../middleware/authMiddleware");

// ==========================================
// GET: View inventory (Public)
// ==========================================
router.get("/", (req, res) => {
  const sql = `
    SELECT
      i.product_id,
      p.product_name,
      p.brand,
      c.category_name,
      p.unit,
      i.quantity,
      i.reorder_level,
      CASE
        WHEN i.quantity <= i.reorder_level THEN 'Low Stock'
        ELSE 'In Stock'
      END AS stock_status
    FROM inventory i
    JOIN products p ON i.product_id = p.product_id
    LEFT JOIN categories c ON p.category_id = c.category_id
    ORDER BY i.quantity ASC, p.product_name ASC
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error("Inventory fetch error:", error.message);

      return res.status(500).json({
        message: "Unable to fetch inventory.",
      });
    }

    res.json(results);
  });
});

// ==========================================
// PUT: Update stock (Admin Only)
// ==========================================
router.put("/:productId", verifyAdmin, (req, res) => {
  const productId = Number(req.params.productId);
  const { quantity, reorder_level } = req.body;

  // Validate product ID
  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return res.status(400).json({
      message: "Invalid product ID.",
    });
  }

  // Validate stock quantity and reorder level
  if (
    !Number.isSafeInteger(quantity) ||
    quantity < 0 ||
    !Number.isSafeInteger(reorder_level) ||
    reorder_level < 0
  ) {
    return res.status(400).json({
      message:
        "Quantity and reorder level must be non-negative whole numbers.",
    });
  }

  const sql = `
    UPDATE inventory
    SET quantity = ?, reorder_level = ?
    WHERE product_id = ?
  `;

  db.query(
    sql,
    [quantity, reorder_level, productId],
    (error, result) => {
      if (error) {
        console.error("Inventory update error:", error.message);

        return res.status(500).json({
          message: "Unable to update inventory.",
        });
      }

      // Check whether the inventory record exists
      if (result.affectedRows === 0) {
        return db.query(
          "SELECT product_id FROM inventory WHERE product_id = ?",
          [productId],
          (lookupError, rows) => {
            if (lookupError) {
              return res.status(500).json({
                message: "Unable to verify inventory record.",
              });
            }

            if (rows.length === 0) {
              return res.status(404).json({
                message: "Inventory record not found.",
              });
            }

            return res.json({
              message: "Inventory is already up to date.",
              product_id: productId,
            });
          }
        );
      }

      res.json({
        message: "Inventory updated successfully!",
        product_id: productId,
        quantity,
        reorder_level,
      });
    }
  );
});

module.exports = router;