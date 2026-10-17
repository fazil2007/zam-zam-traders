const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

// ========================================
// POST: Admin Login
// POST /api/auth/login
// ========================================
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Validate the input.
  if (
    typeof username !== "string" ||
    !username.trim() ||
    typeof password !== "string" ||
    !password
  ) {
    return res.status(400).json({
      message: "Please enter your username and password.",
    });
  }

  // Find the admin account.
  const sql = `
    SELECT admin_id, username, password_hash
    FROM admins
    WHERE username = ?
    LIMIT 1
  `;

  db.query(sql, [username.trim()], async (error, results) => {
    if (error) {
      console.error("Admin login database error:", error.message);

      return res.status(500).json({
        message: "Unable to process login.",
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        message: "Invalid username or password.",
      });
    }

    const admin = results[0];

    try {
      // Compare the submitted password with the stored bcrypt hash.
      const passwordMatches = await bcrypt.compare(
        password,
        admin.password_hash
      );

      if (!passwordMatches) {
        return res.status(401).json({
          message: "Invalid username or password.",
        });
      }

      if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is missing from the environment.");

        return res.status(500).json({
          message: "Authentication is not configured correctly.",
        });
      }

      // Generate an authentication token.
      const token = jwt.sign(
        {
          adminId: admin.admin_id,
          username: admin.username,
          role: "admin",
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "2h",
        }
      );

      return res.json({
        message: "Admin login successful!",
        token,
        admin: {
          id: admin.admin_id,
          username: admin.username,
        },
      });
    } catch (loginError) {
      console.error("Admin login error:", loginError.message);

      return res.status(500).json({
        message: "Unable to process login.",
      });
    }
  });
});

module.exports = router;