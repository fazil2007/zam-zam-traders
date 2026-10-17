const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyAdmin = require("../middleware/authMiddleware");

// ==========================================
// GET: Fetch all products (Public)
// Includes stock quantity and reorder level
// ==========================================
router.get("/", (req, res) => {
  const sql = `
    SELECT
      p.product_id,
      p.product_name,
      p.description,
      p.brand,
      p.price,
      p.unit,
      p.image_url,
      p.is_available,
      c.category_name,
      i.quantity AS stock_quantity,
      i.reorder_level
    FROM products p
    LEFT JOIN categories c
      ON p.category_id = c.category_id
    LEFT JOIN inventory i
      ON p.product_id = i.product_id
    ORDER BY p.product_id DESC
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error("Error fetching products:", error.message);

      return res.status(500).json({
        message: "Failed to fetch products",
      });
    }

    res.json(results);
  });
});

// ==========================================
// POST: Add a new product (Admin Only)
// ==========================================
router.post("/", verifyAdmin, (req, res) => {
  const {
    product_name,
    description,
    brand,
    category_id,
    price,
    unit,
    image_url,
    quantity,
  } = req.body;

  // Validate required fields
  if (
    typeof product_name !== "string" ||
    !product_name.trim() ||
    !Number.isInteger(Number(category_id)) ||
    Number(category_id) <= 0 ||
    price === undefined ||
    price === null ||
    price === "" ||
    !Number.isFinite(Number(price)) ||
    Number(price) < 0 ||
    typeof unit !== "string" ||
    !unit.trim()
  ) {
    return res.status(400).json({
      message:
        "Please provide a valid product name, category, price, and unit.",
    });
  }

  // Validate stock quantity
  const stockQuantity = Number(quantity ?? 0);

  if (!Number.isSafeInteger(stockQuantity) || stockQuantity < 0) {
    return res.status(400).json({
      message: "Stock quantity must be a non-negative whole number.",
    });
  }

  // Validate image URL
  if (
    image_url !== undefined &&
    image_url !== null &&
    typeof image_url !== "string"
  ) {
    return res.status(400).json({
      message: "Image URL must be text.",
    });
  }

  const sql = `
    INSERT INTO products
      (
        product_name,
        description,
        brand,
        category_id,
        price,
        unit,
        image_url,
        is_available
      )
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `;

  const values = [
    product_name.trim(),
    typeof description === "string" ? description : "",
    typeof brand === "string" ? brand : "",
    Number(category_id),
    Number(price),
    unit.trim(),
    typeof image_url === "string" ? image_url : "",
  ];

  // Begin transaction
  db.beginTransaction((transactionError) => {
    if (transactionError) {
      console.error("Transaction error:", transactionError.message);

      return res.status(500).json({
        message: "Unable to add product.",
      });
    }

    // Insert product
    db.query(sql, values, (insertError, result) => {
      if (insertError) {
        return db.rollback(() => {
          console.error("Product insert error:", insertError.message);

          res.status(500).json({
            message: "Unable to add product.",
          });
        });
      }

      const productId = result.insertId;

      // Create inventory record
      const inventorySql = `
        INSERT INTO inventory
          (product_id, quantity, reorder_level)
        VALUES (?, ?, 10)
      `;

      db.query(
        inventorySql,
        [productId, stockQuantity],
        (inventoryError) => {
          if (inventoryError) {
            return db.rollback(() => {
              console.error(
                "Inventory insert error:",
                inventoryError.message
              );

              res.status(500).json({
                message: "Unable to create product inventory.",
              });
            });
          }

          // Commit transaction
          db.commit((commitError) => {
            if (commitError) {
              return db.rollback(() => {
                console.error("Commit error:", commitError.message);

                res.status(500).json({
                  message: "Unable to save product.",
                });
              });
            }

            res.status(201).json({
              message: "Product added successfully!",
              product_id: productId,
            });
          });
        }
      );
    });
  });
});

// ==========================================
// PUT: Edit an existing product (Admin Only)
// ==========================================
router.put("/:id", verifyAdmin, (req, res) => {
  const productId = Number(req.params.id);

  // Validate product ID
  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return res.status(400).json({
      message: "Invalid product ID.",
    });
  }

  const {
    product_name,
    description,
    brand,
    category_id,
    price,
    unit,
    image_url,
  } = req.body;

  // Validate product information
  if (
    typeof product_name !== "string" ||
    !product_name.trim() ||
    !Number.isSafeInteger(Number(category_id)) ||
    Number(category_id) <= 0 ||
    price === undefined ||
    price === null ||
    price === "" ||
    !Number.isFinite(Number(price)) ||
    Number(price) < 0 ||
    typeof unit !== "string" ||
    !unit.trim()
  ) {
    return res.status(400).json({
      message:
        "Please provide a valid product name, category, price, and unit.",
    });
  }

  // Validate optional text fields
  if (
    (description != null && typeof description !== "string") ||
    (brand != null && typeof brand !== "string") ||
    (image_url != null && typeof image_url !== "string")
  ) {
    return res.status(400).json({
      message: "Description, brand, and image URL must be text.",
    });
  }

  const sql = `
    UPDATE products
    SET
      product_name = ?,
      description = ?,
      brand = ?,
      category_id = ?,
      price = ?,
      unit = ?,
      image_url = ?
    WHERE product_id = ?
  `;

  const values = [
    product_name.trim(),
    description || "",
    brand || "",
    Number(category_id),
    Number(price),
    unit.trim(),
    image_url || "",
    productId,
  ];

  db.query(sql, values, (error, result) => {
    if (error) {
      console.error("Product update error:", error.message);

      return res.status(500).json({
        message: "Unable to update product.",
      });
    }

    // Check whether the product exists if no rows changed
    if (result.affectedRows === 0) {
      return db.query(
        "SELECT product_id FROM products WHERE product_id = ?",
        [productId],
        (lookupError, rows) => {
          if (lookupError) {
            return res.status(500).json({
              message: "Unable to verify product.",
            });
          }

          if (rows.length === 0) {
            return res.status(404).json({
              message: "Product not found.",
            });
          }

          return res.json({
            message: "Product details are already up to date.",
            product_id: productId,
          });
        }
      );
    }

    res.json({
      message: "Product updated successfully!",
      product_id: productId,
    });
  });
});

module.exports = router;