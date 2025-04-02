const jwt = require("jsonwebtoken");
const errorHandler = require("../utils/error");

// Validate JWT Token
const validateToken = (req, res, next) => {
  try {
    const token = req.header("Authorization");

    if (!token) {
      return errorHandler(res, 401, "Access Denied. No token provided.");
    }

    // Verify token (remove 'Bearer ' prefix)
    const verified = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.user = verified; // Attach user data to request
    next();
  } catch (error) {
    return errorHandler(res, 401, "Invalid or expired token.");
  }
};

// Validate if the user is a normal user
const validateUser = (req, res, next) => {
  if (!req.user || req.user.role !== "user") {
    return errorHandler(res, 403, "Access Denied. User role required.");
  }
  next();
};

// Validate if the user is an admin
const validateAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return errorHandler(res, 403, "Access Denied. Admin role required.");
  }
  next();
};

module.exports = { validateToken, validateUser, validateAdmin };