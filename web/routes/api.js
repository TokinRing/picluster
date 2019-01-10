// Requiring our models and passport as we've configured it
const db = require("../models");
const passport = require("../config/passport");

module.exports = function(app) {
  // Using the passport.authenticate middleware with local strategy
  // If user has valid credentials, send to members page else sent an error
  app.post("/api/login", passport.authenticate("local"), function(req, res) {
    // Send user back to the members page since the redirect will happen there
    res.json("/members");
  });

  // Route for signing up a user. If user is created successfully, login the user, else send an error
  app.post("/api/signup", function(req, res) {
    console.log(req.body);
    db.User.create({
      email: req.body.email,
      password: req.body.password
    }).then(function() {
      res.redirect(307, "/api/login");
    }).catch(function(err) {
      console.log(err);
      res.json(err);
      // TODO: look into why this is here
      // res.status(422).json(err.errors[0].message);
    });
  });

  // Route for logging user out
  app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
  });

  // Route for getting user data used client side
  app.get("/api/user_data", function(req, res) {
    if (!req.user) {
      // The user is not logged in, send back an empty object
      res.json({});
    }
    else {
      // Send back the username and id
      res.json({
        username: req.user.username,
        id: req.user.id
      });
    }
  });
};
