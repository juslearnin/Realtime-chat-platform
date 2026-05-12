const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User =
  require("../model/user.model");

const logger =
  require("../utils/logger");

const router = express.Router();


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