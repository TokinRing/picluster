/*jshint esversion:6*/
// Middleware for restrictng routes a user is not allowed to visit if not logged in
//
// Add the following to implement the is_authenticated middleware to requests
// ```const is_authenticated = require('../middleware/is_authenticated');```

module.exports = async (req, res, next) => {
  // If the user is logged in, continue with the request
  if (req.user) {
    return await next();
  }

  // If user is not logged in, redirect to the login page
  return await res.redirect("/login");
};
