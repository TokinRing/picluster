// Middleware for restrictng backend routes
const { verify_jwt } = require("../lib/libpicluster");

module.exports = async (req, res, next) => {
  // Store the value of x-access-token from request header
  const token = req.headers["x-access-token"];

  (token) ? verify_jwt(token).then((result) => {
    if (result) next();
  }) : res.json({ err: "Tokin Error." });
};
