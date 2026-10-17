const express = require("express");
const router = express.Router();

const db = require("../db");

// Get all categories
router.get("/", (req, res) => {
  const sql = `
    SELECT category_id, category_name, description
    FROM categories
    ORDER BY category_id
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error("Error fetching categories:", error.message);

      return res.status(500).json({
        message: "Failed to fetch categories",
      });
    }

    res.json(results);
  });
});

module.exports = router;