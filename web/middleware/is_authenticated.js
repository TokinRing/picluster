// Middleware for restrictng frontend routes
module.exports = async (req, res, next) => {
  // If request contains user object, continue with the request
  if (req.user) return await next();

  // If user is not logged in, redirect to the login page
  return await res.redirect("/user/login");
};
