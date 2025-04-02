const responseHandler = require("../utils/response");

// Test API for normal user access
const testUserAccess = (req, res) => {
  return responseHandler(res, 200, "User access verified.", req.user);
};

// Test API for admin access
const testAdminAccess = (req, res) => {
  return responseHandler(res, 200, "Admin access verified.", req.user);
};

// Test API for token validation
const testTokenValidation = (req, res) => {
  return responseHandler(res, 200, "Token is valid.", req.user);
};

module.exports = {
  testUserAccess,
  testAdminAccess,
  testTokenValidation,
};