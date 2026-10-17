require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("./db");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter admin username: ", (username) => {
  rl.question("Enter admin password: ", async (password) => {
    username = username.trim();

    if (!username || password.length < 12) {
      console.log(
        "Username is required and password must be at least 12 characters."
      );

      rl.close();
      db.end();
      return;
    }

    try {
      const passwordHash = await bcrypt.hash(password, 12);

      db.query(
        `INSERT INTO admins (username, password_hash)
         VALUES (?, ?)`,
        [username, passwordHash],
        (error) => {
          if (error) {
            if (error.code === "ER_DUP_ENTRY") {
              console.log("That username already exists.");
            } else {
              console.error("Unable to create admin:", error.message);
            }
          } else {
            console.log("Admin account created successfully!");
          }

          rl.close();
          db.end();
        }
      );
    } catch (error) {
      console.error("Password hashing failed:", error.message);
      rl.close();
      db.end();
    }
  });
});