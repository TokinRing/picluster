// Middleware for restrictng routes a user is not allowed to visit if not logged in
module.exports = function(req, res, next) {
  // If the user is logged in, continue with the request
  if (req.user) {
    return next();
  }
  
  // If user is not logged in, redirect to the login page
  return res.redirect("/");
};
