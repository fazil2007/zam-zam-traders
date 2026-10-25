const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,

  ssl: {
    ca: fs.readFileSync(
      path.join(__dirname, "certs", "ca.pem"),
      "utf8"
    ),
    rejectUnauthorized: true,
  },
});

connection.connect((error) => {
  if (error) {
    console.error("MySQL connection failed:", error.message);
    return;
  }

  console.log("Connected to Zam Zam Traders database!");
});

module.exports = connection;