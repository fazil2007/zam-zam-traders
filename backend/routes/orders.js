const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyAdmin = require("../middleware/authMiddleware");

// ========================================
// GET: View all orders (Admin Only)
// GET /api/orders
// ========================================
router.get("/", verifyAdmin, (req, res) => {
  const sql = `
    SELECT
      order_id,
      customer_name,
      phone,
      delivery_address,
      total_amount,
      order_status,
      created_at
    FROM orders
    ORDER BY created_at DESC, order_id DESC
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error("Fetch orders error:", error.message);

      return res.status(500).json({
        message: "Unable to fetch orders.",
      });
    }

    res.json(results);
  });
});

// ========================================
// GET: View one order with its products
// Admin Only
// GET /api/orders/:id
// ========================================
router.get("/:id", verifyAdmin, (req, res) => {
  const orderId = Number(req.params.id);

  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    return res.status(400).json({
      message: "Invalid order ID.",
    });
  }

  const orderSql = `
    SELECT
      order_id,
      customer_name,
      phone,
      delivery_address,
      total_amount,
      order_status,
      created_at
    FROM orders
    WHERE order_id = ?
  `;

  db.query(orderSql, [orderId], (error, orders) => {
    if (error) {
      console.error("Fetch order error:", error.message);

      return res.status(500).json({
        message: "Unable to fetch order.",
      });
    }

    if (orders.length === 0) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    const itemsSql = `
      SELECT
        oi.product_id,
        p.product_name,
        p.brand,
        p.unit,
        oi.quantity,
        oi.price,
        (oi.quantity * oi.price) AS subtotal
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `;

    db.query(itemsSql, [orderId], (itemsError, items) => {
      if (itemsError) {
        console.error(
          "Fetch order items error:",
          itemsError.message
        );

        return res.status(500).json({
          message: "Unable to fetch order items.",
        });
      }

      res.json({
        ...orders[0],
        items,
      });
    });
  });
});

// ========================================
// PUT: Update order status (Admin Only)
// PUT /api/orders/:id/status
// Restore stock when cancelling an order.
// ========================================
router.put("/:id/status", verifyAdmin, (req, res) => {
  const orderId = Number(req.params.id);
  const { order_status } = req.body;

  const allowedStatuses = [
    "Pending",
    "Confirmed",
    "Processing",
    "Delivered",
    "Cancelled",
  ];

  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    return res.status(400).json({
      message: "Invalid order ID.",
    });
  }

  if (!allowedStatuses.includes(order_status)) {
    return res.status(400).json({
      message: "Please provide a valid order status.",
      allowed_statuses: allowedStatuses,
    });
  }

  db.beginTransaction((transactionError) => {
    if (transactionError) {
      console.error(
        "Transaction error:",
        transactionError.message
      );

      return res.status(500).json({
        message: "Unable to update order status.",
      });
    }

    const rollbackError = (
      statusCode,
      message,
      error = null
    ) => {
      if (error) {
        console.error(
          "Order status transaction error:",
          error.message
        );
      }

      db.rollback(() => {
        if (!res.headersSent) {
          res.status(statusCode).json({ message });
        }
      });
    };

    // Lock the order to prevent simultaneous cancellations.
    db.query(
      `SELECT order_id, order_status
       FROM orders
       WHERE order_id = ?
       FOR UPDATE`,
      [orderId],
      (orderError, orders) => {
        if (orderError) {
          return rollbackError(
            500,
            "Unable to retrieve order.",
            orderError
          );
        }

        if (orders.length === 0) {
          return rollbackError(404, "Order not found.");
        }

        const currentStatus = orders[0].order_status;

        // Avoid restoring stock twice.
        if (currentStatus === order_status) {
          return db.commit((commitError) => {
            if (commitError) {
              return rollbackError(
                500,
                "Unable to complete status update.",
                commitError
              );
            }

            res.json({
              message: "Order status is already up to date.",
              order_id: orderId,
              order_status,
            });
          });
        }

        // Cancelled orders cannot be reopened here.
        if (currentStatus === "Cancelled") {
          return rollbackError(
            400,
            "A cancelled order cannot be reopened. Create a new order instead."
          );
        }

        const updateStatus = (stockRestored = false) => {
          db.query(
            `UPDATE orders
             SET order_status = ?
             WHERE order_id = ?`,
            [order_status, orderId],
            (updateError) => {
              if (updateError) {
                return rollbackError(
                  500,
                  "Unable to update order status.",
                  updateError
                );
              }

              db.commit((commitError) => {
                if (commitError) {
                  return rollbackError(
                    500,
                    "Unable to complete status update.",
                    commitError
                  );
                }

                res.json({
                  message: stockRestored
                    ? "Order cancelled and stock restored successfully."
                    : "Order status updated successfully!",
                  order_id: orderId,
                  order_status,
                  stock_restored: stockRestored,
                });
              });
            }
          );
        };

        // Other status changes do not affect inventory.
        if (order_status !== "Cancelled") {
          return updateStatus(false);
        }

        // Find the products and quantities in this order.
        db.query(
          `SELECT product_id, quantity
           FROM order_items
           WHERE order_id = ?`,
          [orderId],
          (itemsError, items) => {
            if (itemsError) {
              return rollbackError(
                500,
                "Unable to retrieve ordered products.",
                itemsError
              );
            }

            if (items.length === 0) {
              return rollbackError(
                400,
                "This order has no items to restore."
              );
            }

            let index = 0;

            const restoreNextItem = () => {
              if (index >= items.length) {
                return updateStatus(true);
              }

              const item = items[index++];

              db.query(
                `UPDATE inventory
                 SET quantity = quantity + ?,
                     last_restocked = NOW()
                 WHERE product_id = ?`,
                [item.quantity, item.product_id],
                (restoreError, result) => {
                  if (restoreError) {
                    return rollbackError(
                      500,
                      "Unable to restore inventory.",
                      restoreError
                    );
                  }

                  if (result.affectedRows !== 1) {
                    return rollbackError(
                      500,
                      "An inventory record is missing. No changes were saved."
                    );
                  }

                  restoreNextItem();
                }
              );
            };

            restoreNextItem();
          }
        );
      }
    );
  });
});

// ========================================
// POST: Create an order and deduct stock
// Public customer checkout
// POST /api/orders
// ========================================
router.post("/", (req, res) => {
  const {
    customer_name,
    phone,
    delivery_address,
    items,
  } = req.body;

  // Validate customer details.
  if (
    typeof customer_name !== "string" ||
    !customer_name.trim() ||
    typeof phone !== "string" ||
    !phone.trim() ||
    typeof delivery_address !== "string" ||
    !delivery_address.trim()
  ) {
    return res.status(400).json({
      message: "Please provide all customer details.",
    });
  }

  // Validate cart items.
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "Your cart is empty.",
    });
  }

  // Combine repeated product IDs and validate quantities.
  const quantities = new Map();

  for (const item of items) {
    const productId = Number(item.product_id);
    const quantity = Number(item.quantity);

    if (
      !Number.isSafeInteger(productId) ||
      productId <= 0 ||
      !Number.isSafeInteger(quantity) ||
      quantity <= 0
    ) {
      return res.status(400).json({
        message: "Invalid product or quantity.",
      });
    }

    const combinedQuantity =
      (quantities.get(productId) || 0) + quantity;

    if (!Number.isSafeInteger(combinedQuantity)) {
      return res.status(400).json({
        message: "The requested quantity is too large.",
      });
    }

    quantities.set(productId, combinedQuantity);
  }

  const productIds = [...quantities.keys()];

  db.beginTransaction((transactionError) => {
    if (transactionError) {
      console.error(
        "Transaction failed:",
        transactionError.message
      );

      return res.status(500).json({
        message: "Unable to start the order process.",
      });
    }

    const rollbackError = (
      statusCode,
      message,
      error = null
    ) => {
      if (error) {
        console.error(
          "Order transaction error:",
          error.message
        );
      }

      db.rollback(() => {
        if (!res.headersSent) {
          res.status(statusCode).json({ message });
        }
      });
    };

    const placeholders = productIds.map(() => "?").join(", ");

    // Lock product and inventory rows during checkout.
    const stockSql = `
      SELECT
        p.product_id,
        p.product_name,
        p.price,
        i.quantity AS available_quantity
      FROM products p
      INNER JOIN inventory i ON i.product_id = p.product_id
      WHERE p.product_id IN (${placeholders})
        AND p.is_available = 1
      FOR UPDATE
    `;

    db.query(stockSql, productIds, (stockError, products) => {
      if (stockError) {
        return rollbackError(
          500,
          "Unable to check product availability.",
          stockError
        );
      }

      if (products.length !== productIds.length) {
        return rollbackError(
          400,
          "One or more products are unavailable or have no inventory record."
        );
      }

      const productMap = new Map(
        products.map((product) => [
          Number(product.product_id),
          product,
        ])
      );

      // Check all quantities before creating the order.
      for (const productId of productIds) {
        const product = productMap.get(productId);
        const requestedQuantity = quantities.get(productId);
        const availableQuantity = Number(
          product.available_quantity
        );

        if (availableQuantity < requestedQuantity) {
          return rollbackError(
            400,
            `Insufficient stock for ${product.product_name}. Available: ${availableQuantity}, requested: ${requestedQuantity}.`
          );
        }
      }

      const orderItems = productIds.map((productId) => {
        const product = productMap.get(productId);

        return {
          product_id: productId,
          quantity: quantities.get(productId),
          price: Number(product.price),
        };
      });

      const totalAmount = orderItems.reduce(
        (total, item) =>
          total + item.price * item.quantity,
        0
      );

      if (
        !Number.isFinite(totalAmount) ||
        totalAmount < 0
      ) {
        return rollbackError(
          400,
          "The order total is invalid."
        );
      }

      const orderSql = `
        INSERT INTO orders
          (customer_name, phone, delivery_address, total_amount)
        VALUES (?, ?, ?, ?)
      `;

      db.query(
        orderSql,
        [
          customer_name.trim(),
          phone.trim(),
          delivery_address.trim(),
          totalAmount,
        ],
        (orderError, orderResult) => {
          if (orderError) {
            return rollbackError(
              500,
              "Unable to save your order.",
              orderError
            );
          }

          const orderId = orderResult.insertId;

          const itemSql = `
            INSERT INTO order_items
              (order_id, product_id, quantity, price)
            VALUES ?
          `;

          const itemValues = orderItems.map((item) => [
            orderId,
            item.product_id,
            item.quantity,
            item.price,
          ]);

          db.query(itemSql, [itemValues], (itemError) => {
            if (itemError) {
              return rollbackError(
                500,
                "Unable to save order items.",
                itemError
              );
            }

            let index = 0;

            const commitOrder = () => {
              db.commit((commitError) => {
                if (commitError) {
                  return rollbackError(
                    500,
                    "Unable to complete your order.",
                    commitError
                  );
                }

                res.status(201).json({
                  message: "Order placed successfully!",
                  order_id: orderId,
                  total_amount: totalAmount,
                  order_status: "Pending",
                  message_stock:
                    "Inventory updated successfully.",
                });
              });
            };

            const deductNextProduct = () => {
              if (index >= orderItems.length) {
                return commitOrder();
              }

              const item = orderItems[index++];

              db.query(
                `UPDATE inventory
                 SET quantity = quantity - ?
                 WHERE product_id = ?
                   AND quantity >= ?`,
                [
                  item.quantity,
                  item.product_id,
                  item.quantity,
                ],
                (stockUpdateError, stockResult) => {
                  if (stockUpdateError) {
                    return rollbackError(
                      500,
                      "Unable to update inventory.",
                      stockUpdateError
                    );
                  }

                  if (stockResult.affectedRows !== 1) {
                    return rollbackError(
                      400,
                      "Stock changed during checkout. Please refresh your cart and try again."
                    );
                  }

                  deductNextProduct();
                }
              );
            };

            deductNextProduct();
          });
        }
      );
    });
  });
});
// ========================================
// POST: Track a customer order
// POST /api/orders/track
// Requires order ID and phone number
// ========================================
router.post("/track", (req, res) => {
  const { order_id, phone } = req.body;

  const orderId = Number(order_id);

  if (
    !Number.isSafeInteger(orderId) ||
    orderId <= 0 ||
    typeof phone !== "string" ||
    !phone.trim()
  ) {
    return res.status(400).json({
      message: "Please provide a valid order ID and phone number.",
    });
  }

  const orderSql = `
    SELECT
      order_id,
      customer_name,
      total_amount,
      order_status,
      created_at
    FROM orders
    WHERE order_id = ?
      AND phone = ?
  `;

  db.query(orderSql, [orderId, phone.trim()], (error, orders) => {
    if (error) {
      console.error("Customer order tracking error:", error.message);

      return res.status(500).json({
        message: "Unable to track your order right now.",
      });
    }

    if (orders.length === 0) {
      return res.status(404).json({
        message: "No order found with those details.",
      });
    }

    const order = orders[0];

    const itemsSql = `
      SELECT
        p.product_name,
        p.brand,
        p.unit,
        oi.quantity,
        oi.price,
        (oi.quantity * oi.price) AS subtotal
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `;

    db.query(itemsSql, [orderId], (itemsError, items) => {
      if (itemsError) {
        console.error("Order tracking items error:", itemsError.message);

        return res.status(500).json({
          message: "Unable to retrieve your order items.",
        });
      }

      return res.json({
        ...order,
        items,
      });
    });
  });
});
module.exports = router;