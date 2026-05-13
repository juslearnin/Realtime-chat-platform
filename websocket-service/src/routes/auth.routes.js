const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User =
  require("../model/user.model");

const logger =
  require("../utils/logger");

const authMiddleware = require("../middleware/auth.middleware"); // We will create this next

const router = express.Router();

// --- REGISTER ---
router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        await user.save();
        logger.info(`New user registered: ${email}`);

        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        logger.error(`Register error: ${err.message}`);
        res.status(500).json({ message: "Server error" });
    }
});

// --- LOGIN (New) ---
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find user
        console.log("Searching for email:", email); // Is this actually what you typed in Postman
        const user = await User.findOne({ email });
        console.log("User found in DB:", user); // If this is null, the user doesn't exist in your DB.
 
        const isMatch = await bcrypt.compare(password, user.password);

// ADD THESE LOGS TEMPORARILY
console.log("--- Password Verification ---");
console.log("Password from Request:", `"${password}"`); // Quotes help see hidden spaces
console.log("Hash from DB:", user.password);
console.log("Does it match?:", isMatch);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // 3. Generate JWT Token
        const token = jwt.sign(
            { userId: user._id, email: user.email, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        logger.info(`User logged in: ${email}`);

        res.status(200).json({
            message: "Login successful",
            token: token
        });
    } catch (err) {
        logger.error(`Login error: ${err.message}`);
        res.status(500).json({ message: "Server error" });
    }
});

// --- PROTECTED PROFILE ROUTE (New) ---
router.get("/profile", authMiddleware, async (req, res) => {
    // req.user is populated by the authMiddleware
    res.status(200).json({
        message: "Protected profile data accessed",
        user: req.user
    });
});

module.exports = router;
// REGISTER
router.post(
  "/register",
  async (req, res) => {

    try {

      const {
        username,
        email,
        password
      } = req.body;

      // Check existing user
      const existingUser =
        await User.findOne({
          email
        });

      if (existingUser) {

        return res.status(400)
          .json({
            message:
            "User already exists"
          });

      }

      // Hash password
      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      // Create user
      const user =
        new User({

          username,
          email,
          password:
            hashedPassword

        });

      await user.save();

      logger.info(
        `New user registered: ${email}`
      );

      res.status(201).json({
        message:
        "User registered successfully"
      });

    }
    catch (err) {

      logger.error(
        `Register error: ${err.message}`
      );

      res.status(500).json({
        message:
        "Server error"
      });

    }

});

module.exports = router;